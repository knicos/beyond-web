import { Service, Inject } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import { $log } from '@tsed/logger';
import {
  redisSetStreamCallback, redisPublish,
} from '@ftl/common';
import Snapshot from '../models/snapshot';
import Stream from '../models/streams';

const { encode } = require('msgpack5')();

function sendValue(
  id: string,
  framesetId: number,
  frameId: number,
  channel: number,
  value: unknown,
) {
  redisPublish(`stream-out:${id}`, encode([0, [1, framesetId, frameId, channel, 0], [103, 7, 1, 0, 0, encode(value)]]));
}

function sendSnapshot(id: string, framesetId: number, frameId: number, data: Map<string, string>) {
  // eslint-disable-next-line no-restricted-syntax
  for (const c of data.keys()) {
    sendValue(id, framesetId, frameId, parseInt(c, 10), JSON.parse(data.get(c)));
  }
}

@Service()
export default class ConfigService {
  @Inject(Snapshot)
  private snaps: MongooseModel<Snapshot>;

  @Inject(Stream)
  private streams: MongooseModel<Stream>;

  async $onInit() {
    // Subscribe to node streams.
    redisSetStreamCallback('command:config', async (key: string, data: any) => {
      $log.info('COMMAND', data);
      if (data.cmd === 'restore') {
        await this.sendMostRecent(
          data.id,
          parseInt(data.framesetId, 10),
          parseInt(data.frameId, 10),
        );
      }
    });
    redisSetStreamCallback('event:stream:update', async (key: string, data: any) => {
      console.log('CREATE STREAM?', data);
      if (data.event === 'update') {
        await this.streams.findOneAndUpdate({
          uri: data.id,
          framesetId: parseInt(data.framesetId, 10),
          frameId: parseInt(data.frameId, 10),
        }, {
          uri: data.id,
          framesetId: parseInt(data.framesetId, 10),
          frameId: parseInt(data.frameId, 10),
          owner: data.owner,
          groups: data.groups,
        }, { upsert: true });
      }
    });
    redisSetStreamCallback('event:stream:data', async (key: string, data: any) => {
      $log.info('SAVE', data.id);
      if (data.event === 'request') {
        const dataObject = JSON.parse(data.data);
        // eslint-disable-next-line no-restricted-syntax
        for (const k of Object.keys(dataObject)) {
          dataObject[k] = JSON.stringify(dataObject[k]);
        }

        const stream = await this.streams.findOne({
          uri: data.id,
          framesetId: data.framesetId,
          frameId: data.frameId,
        });

        if (!stream) {
          $log.error('Cannot save snapshot for unknown stream', data.id);
          return;
        }

        const newSnap = await this.snaps.create({
          data: new Map(Object.entries(dataObject)),
          timestamp: new Date(),
          groups: stream.groups,
          owner: stream.owner,
          tags: ['save'],
        });

        stream.snapshots.push(newSnap);
        await stream.save();
      }
    });
  }

  private async sendMostRecent(id: string, framesetId: number, frameId: number) {
    const snap = await this.snaps.findOne({
      streamId: id,
      framesetId,
      frameId,
    }, null, { sort: { timestamp: -1 } });

    if (snap) {
      sendSnapshot(id, framesetId, frameId, snap.data);
    }
  }
}
