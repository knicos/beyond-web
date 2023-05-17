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
  redisSetStreamCallback,
  redisSendEvent,
} from '@ftl/common';
import { promises as fs } from 'fs';
import { DataPacket, StreamPacket, Packet } from '../models/protocol'

import Recording from '../models/playback'

import { start } from 'repl';
import { $log } from '@tsed/logger';
import { Exception } from '@tsed/exceptions';

import { decode, decodeArrayStream, Decoder, DecodeError } from '@msgpack/msgpack';
import { time } from 'console';
// FIXME: encode return type does not match between msgpack5 and @msgpack/msgpack
//        so encode method is used from msgpack5
const { encode } = require('msgpack5')();

async function readHeader(fd : fs.FileHandle) : Promise<number> {
  const headerSize = 68;
  const header = await fd.read({ position: 0, length: headerSize });
  // check actual values and throw error if not an ftl file
  if (header.bytesRead !== headerSize) {
    throw new Error('No valid FTL header')
  }
  return header.bytesRead;
}

export default class Player {
  private playerId : string;

  private baseUri: string;

  private fileId : string;

  private filename : string;

  private stopped : boolean = false;

  private fileHandle? : fs.FileHandle;

  private decoderStream? : AsyncGenerator<unknown, void, unknown>;

  // internal buffer size for reader
  private chunkSize : number = 1024 * 1024 * 4;

  private timestampEnd : number = 0;

  private timestampStart : number = Number.MAX_SAFE_INTEGER;

  private timestampNow : number = 0;

  private loopCount : number = 0;

  private requested : number = 0;

  private requestedMax : number = 60;

  public getFileId() : string { return this.fileId; }

  public getFilename() : string { return this.filename; }

  public getPlayerId() : string { return this.playerId; }

  private sendEventStartStream() : void {
    redisSendEvent({
      event: 'events:stream',
      body: {
        operation: 'start',
        id: this.baseUri,
        name: 'virtual-player-test',
        node: 'virtual-player-test',
        framesetId: 255,
        frameId: 255,
      },
    });

    redisSendEvent({
      event: 'events:stream',
      body: {
        operation: 'start',
        id: this.baseUri,
        name: 'virtual-player-test',
        node: 'virtual-player-test',
        framesetId: 0,
        frameId: 0,
      },
    });
  }

  private sendEventStopStream() : void {
    redisSendEvent({
      event: 'events:stream',
      body: {
        operation: 'stop',
        id: this.baseUri,
        framesetId: 255,
        frameId: 255,
      },
    });
  }

  private async initDecoder() {
    const skip = await readHeader(this.fileHandle);
    // ideally ReadStream would be reset to start (after header), but it
    // doesn't appear to be supported by nodejs
    const readStream = this.fileHandle.createReadStream(
      { start: skip, highWaterMark: this.chunkSize, autoClose: false },
    );
    // readStream always creates one; however removing it here causes
    // await fileHandle.close() to deadlock later
    // this.fileHandle.off('close', this.fileHandle.rawListeners('close').at(-1));

    this.decoderStream = decodeArrayStream(readStream);
  }

  /** Read number of packets (generator) */
  private async* readPackets(nPacketsMax : number = Number.MAX_SAFE_INTEGER) {
    let nRead = 0;

    while (nRead++ < nPacketsMax) {
      const { done, value } = await this.decoderStream.next();
      yield new Packet(value);
      if (this.stopped) { break; }
    }
  }

  private tSent : number = 0;

  private tSendMax : number = 5000; // maximum amount (ms) to output between calls

  /** Read packets for number of frames  */
  private async sendFrames(nFrames : number = 1) {
    let nFramesSent = -1;
    let timestamp = -1;
    let nPacketsSent = 0;
    let done : boolean = false;

    try {
      for await (const pkt of this.readPackets()) {
        // TODO: need to check for end of frame packet, if missing generate one
        if (timestamp !== pkt.spkt.getTimestamp()) {
          const timestampOld = timestamp;
          timestamp = pkt.spkt.getTimestamp();
          if (timestampOld > 0) {
            this.timestampNow = timestamp
            const duration = timestamp - timestampOld;
            this.tSent += duration;
          }

          nFramesSent += 1;
          // the packet is already decoded and must not be discarded (break check after publish)

          // record first and last frame for timestamp updates later
          this.timestampStart = Math.min(this.timestampStart, timestamp);
          this.timestampEnd = Math.max(this.timestampEnd, timestamp);

          if (nFramesSent === nFrames) {
            done = true;
          }

          if (this.tSent >= this.tSendMax) {
            nFramesSent = nFrames; // do not re-init; create descriptive variable
            done = true;
          }
        }

        // Rewrite timestamp (timestamp must always increase), no pause
        const newTimestamp = timestamp + (this.timestampEnd - this.timestampStart) * this.loopCount;
        pkt.spkt.setTimestamp(newTimestamp);
        redisPublish(`stream-in:${this.baseUri}`, encode([0, pkt.spkt.data, pkt.dpkt.data]));
        nPacketsSent += 1;

        if (done) {
          break;
        }
      }
    } catch (error) {
      // RangeError: end of file, DecoderError: incomplete data etc
    } finally {
      // Re-initialize (out of data/decode error)
      if ((nFramesSent < nFrames) && !this.stopped) {
        try { await this.initDecoder(); } catch (error) { $log.error('bug?: ', error) }
        this.loopCount += 1;
        this.timestampNow = 0;
        $log.warn('loop count', this.loopCount);
      }
    }
    $log.info("packets sent: ", nPacketsSent, "output buffer: ", this.tSent);
    return nFramesSent;
  }

  onMessage: (msg: Buffer) => void;

  constructor(record : Recording) {
    this.playerId = uuidv4();
    this.fileId = record._id.toString();
    this.filename = record.filename;
  }

  private timer : NodeJS.Timer;

  public async startStream() {
    this.fileHandle = await fs.open(this.filename); // should throw
    await this.initDecoder();

    // TODO: persistent user-unique URIs
    this.baseUri = 'ftl://webservice-virtual-node/' + this.fileId;

    // Need to record what channels are requested and only send those.
    this.onMessage = (message) => {
      const buf = (typeof message === 'string') ? new Uint8Array(JSON.parse(message).data) : message;
      const pkt = new Packet((decode(buf) as Array<any>).slice(1));
      const nFrames = pkt.dpkt.getFrameCount();
      this.requested += nFrames; // track requests per source
      // $log.info('requested: ', nFrames, 'total requested', this.requested);
      // sendFrames() can not be called here as async calls could interleave
    }

    redisSubscribe(`stream-out:${this.baseUri}`, this.onMessage);
    this.sendEventStartStream();

    // TODO: parse start of file, record available channels and cache them, then seek to
    //       beginning and send channel info and wait for requests

    // NOTE: sendFrames may send less than requested. This likely also sends too fast.
    //       timer can't be  too short, otherwise loop counter gets spammed
    const tInterval = 250;
    this.timer = setInterval(async () => {
      try {
        const requested = this.requested;
        this.requested = 0;
        if (requested > 0) {
          this.tSent = Math.max(0, this.tSent - tInterval)
          this.sendFrames(requested);
        }
      } catch (error) {
        $log.error('bug? sendFrames() failed', error);
        clearInterval(this.timer);
      }
    }, tInterval);
  }

  public async stopStream() {
    this.stopped = true;
    try {
      await this.fileHandle.close();
      clearInterval(this.timer);
    } catch (error) { $log.error('bug? file already closed', error); }

    await redisUnsubscribe(`stream-out:${this.baseUri}`, this.onMessage);
    await this.sendEventStopStream();
  }
}
