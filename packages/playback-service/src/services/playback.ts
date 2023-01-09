import { Service, Inject } from '@tsed/common';
import { MongooseModel, ObjectID } from '@tsed/mongoose';
import { $log, Logger } from '@tsed/logger';
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
} from '@ftl/common';
import { RecordingEvent, RecordingEventBody } from '@ftl/api';
import { redisSendEvent } from '@ftl/common';
import fs from 'fs/promises';
import { BadRequest, NotFound } from '@tsed/exceptions';
import Recording from '../models/playback';
import { map } from '@tsed/schema';

const { encode, decode } = require('msgpack5')();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const GIGABYTE = 1024 * 1024 * 1024;
const BASEPATH = '/data/ftl';

/*
  interface ActiveRecording {
    id: string;
    owner: string;
    streams: string[];
    streamCallbacks: Function[];
    channels: Set<number>;
    fd: fs.FileHandle;
    size: number;
    timestamp: number;
    queue: Map<number, Uint8Array[]>;
}
*/

@Service()
export default class PlaybackService {
  @Inject(Recording)
  private recordings: MongooseModel<Recording>;

  async $onInit() {
    // handle events from recording service
    redisSetStreamCallback('events:recording',
      async (data: RecordingEventBody) => {
        if (data.event === 'complete') {
          const retval = await this.recordings.create({
            filename: data.filename,
            created: data.date,
            size: data.size,
            duration: data.duration,
          });
          $log.info(retval);
        }
      });
  }

  async listRecordings(): Promise<Recording[]> {
    const files = await this.recordings.find({});
    files.map((x) => ({ _id: x['_id'], filename: x['filename'] }));
    return files
  }
}
