import { Service, Inject } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import { $log } from '@tsed/logger';
import {
  redisSetStreamCallback, redisPublish,
} from '@ftl/common';
import Snapshot from '../models/snapshot';

const { encode } = require('msgpack5')();

function sendValue(id: string, channel: number, value: unknown) {
  redisPublish(`stream-out:${id}`, encode([0, [1, 0, 0, channel, 0], [103, 7, 1, 0, 0, encode(value)]]));
}

function sendSnapshot(id: string, data: Map<string, string>) {
  // eslint-disable-next-line no-restricted-syntax
  for (const c of data.keys()) {
    sendValue(id, parseInt(c, 10), JSON.parse(data.get(c)));
  }
}

@Service()
export default class ConfigService {
  @Inject(Snapshot)
  private snaps: MongooseModel<Snapshot>;

  async $onInit() {
    // Subscribe to node streams.
    redisSetStreamCallback('command:config', async (key: string, data: any) => {
      $log.info('COMMAND', data);
      if (data.cmd === 'restore') {
        await this.sendMostRecent(data.id, data.framesetId, data.frameId);
      }
    });
    redisSetStreamCallback('event:stream:data', async (key: string, data: any) => {
      $log.info('SAVE', data.id);
      const dataObject = JSON.parse(data.data);
      // eslint-disable-next-line no-restricted-syntax
      for (const k of Object.keys(dataObject)) {
        dataObject[k] = JSON.stringify(dataObject[k]);
      }

      await this.snaps.create({
        streamId: data.id,
        framesetId: data.framesetId,
        frameId: data.frameId,
        data: new Map(Object.entries(dataObject)),
        timestamp: new Date(),
      });
    });
  }

  private async sendMostRecent(id: string, framesetId: number, frameId: number) {
    const snap = await this.snaps.findOne({
      streamId: id,
      framesetId,
      frameId,
    }, null, { sort: { timestamp: -1 } });

    if (snap) {
      sendSnapshot(id, snap.data);
    }
  }
}
