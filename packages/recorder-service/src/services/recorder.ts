import { Service } from '@tsed/common';
import { $log } from '@tsed/logger';
import { v4 as uuidv4 } from 'uuid';
import {
  redisAddItem,
  redisTopItems,
  redisSet,
  redisMGet,
  redisSubscribe,
  redisPublish,
  redisUnsubscribe,
  redisRemoveItem,
  redisGet,
} from '@ftl/common';
import { sendRecordingEvent } from '@ftl/api';
import fs from 'fs/promises';
import { BadRequest, NotFound } from '@tsed/exceptions';
import Recording from '../models/recording';

const { encode, decode } = require('msgpack5')();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const GIGABYTE = 1024 * 1024 * 1024;
const BASEPATH = '/data/ftl';

interface ActiveRecording {
  id: string;
  owner: string;
  streams: string[];
  streamCallbacks: Function[];
  channels: Set<Number>;
  fd: fs.FileHandle;
  size: number;
  timestamp: number;
  queue: Map<number, Uint8Array[]>;
}

const activeRecordings = new Map<string, ActiveRecording>();

function createHeader(version: number) {
  const header = Buffer.alloc(69);
  header.writeUInt8(70, 0);
  header.writeUInt8(84, 1);
  header.writeUInt8(76, 2);
  header.writeUInt8(70, 3);
  header.writeUInt8(version, 4);
  header.writeBigUInt64BE(BigInt(0), 5 + 0 * 8);
  header.writeBigUInt64BE(BigInt(0), 5 + 1 * 8);
  header.writeBigUInt64BE(BigInt(0), 5 + 2 * 8);
  header.writeBigUInt64BE(BigInt(0), 5 + 3 * 8);
  header.writeBigUInt64BE(BigInt(0), 5 + 4 * 8);
  header.writeBigUInt64BE(BigInt(0), 5 + 5 * 8);
  header.writeBigUInt64BE(BigInt(0), 5 + 6 * 8);
  header.writeBigUInt64BE(BigInt(0), 5 + 7 * 8);
  return header;
}

async function createFTLFile(filename: string) {
  const header = createHeader(5);
  const fd = await fs.open(filename, 'w');
  await fs.appendFile(fd, header);
  return fd;
}

function sendReset(uri: string, fsid: number, channel: number) {
  const latency = 0;
  const spkt = [1, fsid, 255, channel, 5];
  const pkt = [255, 7, 35, 255, 0, Buffer.alloc(0)];
  redisPublish(`stream-out:${uri}`, encode([latency, spkt, pkt]));
}

async function processPackets(rec: ActiveRecording, entry: Recording) {
  // Write data in correct timestamp order
  const timestamps = Array.from(rec.queue.keys()).sort();
  // Most recent timestamp may be incomplete so skip that one.
  if (timestamps.length > 1) {
    const q = rec.queue.get(timestamps[0]);
    rec.queue.delete(timestamps[0]);
    const proms = q.map((buf) => rec.fd.appendFile(buf));
    Promise.all(proms).then(() => processPackets(rec, entry));
  } else if (entry.status === 'stopped') {
    // Remove the recording.
    $log.info('Remove recording entry...', rec);
    rec.streamCallbacks.forEach((cb, ix) => redisUnsubscribe(`stream-in:${rec.streams[ix]}`, cb));
    activeRecordings.delete(rec.id);
    await redisRemoveItem(`recordings:list:${rec.owner}`, rec.id);
    await rec.fd.close();
    sendRecordingEvent({
      id: rec.id,
      owner: rec.owner,
      filename: entry.filename,
      event: 'complete',
      size: rec.size,
      duration: entry.duration,
      date: entry.startTime,
    });
  }
}

async function processRecording(rec: ActiveRecording) {
  const key = `recording:${rec.owner}:${rec.id}`;
  const entry = await redisGet<Recording>(key);

  entry.size = rec.size;
  entry.duration = Date.now() - new Date(entry.startTime).getTime();

  if (entry.size > 3 * GIGABYTE || entry.duration > 2 * HOUR) {
    entry.status = 'stopped';
  }

  processPackets(rec, entry);
  await redisSet<Recording>(key, entry);
}

setInterval(() => {
  // Write stuff to files
  activeRecordings.forEach(processRecording);
}, 1000);

@Service()
export default class RecorderService {
  async find(owner: string): Promise<Recording[]> {
    if (!owner) {
      throw new BadRequest('bad_owner');
    }
    const ids = await redisTopItems(`recordings:list:${owner}`);
    const keys = ids.map((id) => `recording:${owner}:${id}`);
    const results = await redisMGet<Recording>(keys);
    return results;
  }

  async update(id: string, owner: string, recording: Recording): Promise<Recording> {
    const key = `recording:${owner}:${id}`;
    const rec = await redisGet<Recording>(key);
    if (!rec) {
      throw new NotFound('recording_not_found');
    }
    if (recording.status) rec.status = recording.status;
    await redisSet<Recording>(key, rec);
    return rec;
  }

  async get(id: string, owner: string): Promise<Recording> {
    const key = `recording:${owner}:${id}`;
    const rec = redisGet<Recording>(key);
    if (!rec) {
      throw new NotFound('recording_not_found');
    }
    return rec;
  }

  async create(recording: Recording, owner: string): Promise<Recording | null> {
    const filename = `${BASEPATH}/record-${owner}-${new Date().toISOString()}.ftl`;
    const newEntry: Recording = {
      ...recording,
      id: uuidv4(),
      owner,
      status: 'recording',
      filename,
      startTime: new Date(),
    }
    redisSet<Recording>(`recording:${owner}:${newEntry.id}`, newEntry, 1 * DAY);
    redisAddItem(`recordings:list:${owner}`, newEntry.id, Date.now());

    const fd = await createFTLFile(filename);

    const r: ActiveRecording = {
      id: newEntry.id,
      owner,
      streamCallbacks: [],
      channels: new Set<number>(recording.channels),
      fd,
      size: 0,
      timestamp: 0,
      queue: new Map<number, Uint8Array[]>(),
      streams: recording.streams,
    };

    $log.info('Starting recording: ', filename);

    // eslint-disable-next-line no-restricted-syntax
    for (const uri of recording.streams) {
      const f = async (data: Buffer) => {
        const [, spkt, pkt] = decode(data);
        const [timestamp,,, channel] = spkt;
        // TODO: Filter by FS
        // Skip unwanted channels and empty data.
        if ((!r.channels.has(channel) && channel < 64) || pkt[5].byteLength === 0) {
          return;
        }

        const reencoded = encode([spkt, pkt]);
        r.timestamp = timestamp;
        r.size += reencoded.byteLength;

        if (!r.queue.has(timestamp)) {
          r.queue.set(timestamp, []);
        }
        const q = r.queue.get(timestamp);
        q.push(reencoded);
      };
      r.streamCallbacks.push(f);
      redisSubscribe(`stream-in:${uri}`, f);
      // TODO: Set a recording data channel
      sendReset(uri, 255, 0);
      $log.info(` -- ${uri}`);
    }
    activeRecordings.set(newEntry.id, r);

    sendRecordingEvent({
      id: r.id,
      owner: r.owner,
      filename,
      event: 'start',
      size: 0,
      duration: 0,
      date: newEntry.startTime,
    });

    return { ...newEntry, filename: undefined };
  }
}
