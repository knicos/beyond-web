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
  redisConsumerGroup,
} from '@ftl/common';
import { RecordingEvent, RecordingEventBody, PlaybackEvent, PlaybackEventBody } from '@ftl/api';
import { redisSendEvent } from '@ftl/common';
import fs from 'fs/promises';
import { BadRequest, NotFound } from '@tsed/exceptions';
import Recording from '../models/playback';
import Player from './player'
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

  private activePlayers : Map<String, Player>;

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
        }
      });

    this.activePlayers = new Map<String, Player>();
  }

  async listRecordings(): Promise<any> {
    const files = await this.recordings.find({});

    // select what playback controls are available (for playbackState)
    // this set could be filtered by user id etc. actual data should probably be stored in database
    //

    const activePlayback : Map<String, Player> =
      Array.from(this.activePlayers.entries()).reduce(
        (acc, [_, player]) => { acc.set(player.getFileId(), player); return acc; },
        new Map<String, Player>(),
      );

    const result = files.map((x) => {
      const fileId = x._id.toString();
      const isPlaying = activePlayback.has(fileId);

      return {
        id: fileId,
        filename: x.filename,
        created: x.created,
        playbackState: (isPlaying ? 'playing' : 'not_playing'),
        playbackId: (isPlaying ? activePlayback.get(fileId).getPlayerId() : null)
      }
    });

    return result;
  }

  async startPlayback(fileId: string): Promise<any> {
    try {
      const record : Recording = await this.recordings.findById(fileId).exec();
      if (record === null) {
        return {}; // error message
      }

      const player = new Player(record);
      await player.startStream();
      this.activePlayers.set(player.getPlayerId(), player);

      await redisSendEvent<PlaybackEvent>({
        event: 'events:playback',
        body: {
          id: '',
          fileId,
          filename: '',
          owner: '',
          event: 'start',
          started: new Date(),
        },
      });
    } catch (error) {
      $log.error(error) // TODO: report error to client
    }

    return {};
  }

  async stopPlayback(playbackId: string): Promise<any> {
    if (!this.activePlayers.has(playbackId)) {
      return {}; // TODO: report error to client
    }
    try {
      await this.activePlayers.get(playbackId).stopStream();
      this.activePlayers.delete(playbackId);
    } catch (error) {
      $log.error(error) // TODO: report error to client
    }
    await redisSendEvent<PlaybackEvent>({
      event: 'events:playback',
      body: {
        id: playbackId,
        fileId: '',
        filename: '',
        owner: '',
        event: 'stop',
        started: new Date(),
      },
    });

    return {};
  }
}
