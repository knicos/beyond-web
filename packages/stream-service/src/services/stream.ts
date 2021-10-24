/* eslint-disable new-cap */
/* eslint-disable no-restricted-syntax */
import { Service, Inject } from '@tsed/common';
import { MongooseDocument, MongooseModel } from '@tsed/mongoose';
import { IUser } from '@ftl/types';
import {
  redisSetStreamCallback,
  redisGet,
  redisSet,
} from '@ftl/common';
import { sendStreamUpdateEvent } from '@ftl/api';
import Stream from '../models/stream';

function framesByNodeId(streams: MongooseDocument<Stream>[], nodeId: string) {
  const frames = [];

  for (const s of streams) {
    for (const fs of s.framesets) {
      for (const f of fs.frames) {
        if (f.nodeId === nodeId) {
          frames.push({
            uri: s.uri,
            framesetId: fs.framesetId,
            frameId: f.frameId,
            autoStart: f.autoStart,
            name: f.title || fs.title || s.title,
          });
        }
      }
    }
  }

  return frames;
}

@Service()
export default class StreamService {
    @Inject(Stream)
    private streams: MongooseModel<Stream>;

    async $onInit() {
      redisSetStreamCallback('event:stream:data', async (key: string, data: any) => {
        if (data.event === 'thumbnail') {
          const stream = await this.streams.findOne({ uri: data.id });
          if (stream) {
            await redisSet(`stream:thumbnail:${stream.id}`, data.data);
          }
        }
      });
      // Subscribe to node streams.
      redisSetStreamCallback('event:node:update', async (key: string, data: any) => {
        // Find a stream and perhaps start it.
        console.log('NODE UPDATE', data);
        if (data.event === 'connect') {
          const streams = await this.streams.find({
            framesets: {
              $elemMatch: {
                frames: {
                  $elemMatch: { nodeId: data.id },
                },
              },
            },
          });

          const selectedFrames = framesByNodeId(streams, data.id);
          console.log('START STREAM', selectedFrames);

          for (const sf of selectedFrames) {
            if (sf.autoStart) {
              sendStreamUpdateEvent({
                event: 'start',
                id: sf.uri,
                name: sf.name,
                node: data.id,
                framesetId: sf.framesetId,
                frameId: sf.frameId,
              });
            }
          }
        }
      });
    }

    async create(stream: Stream, user: IUser, groups: string[]) {
      const newStream = new this.streams({
        ...stream,
        owner: user?.id,
        groups: groups || [],
      });
      newStream.uri = `ftl://ftlab.utu.fi/streams/${newStream.id}`;

      // For every frame and frameset generate an update event.
      if (newStream.framesets) {
        for (const fs of newStream.framesets) {
          if (fs.frames) {
            for (const f of fs.frames) {
              sendStreamUpdateEvent({
                event: 'update',
                id: newStream.uri,
                framesetId: fs.framesetId,
                frameId: f.frameId,
                owner: newStream.owner,
                groups: newStream.groups,
                name: f.title || fs.title || newStream.title || 'No Name',
              });
            }
          }
        }
      }

      return (await newStream.save()).toClass();
    }

    async findInGroups(user: IUser, groups: string[], offset: number, limit: number) {
      const streams = (
        await this.streams.find({ groups: { $in: groups } }).skip(offset).limit(limit)
      ).map((stream) => stream.toClass());

      return streams;
    }

    async getInGroups(id: string, groups: string[]) {
      return (
        await this.streams.findOne({ _id: id, groups: { $in: groups } })
      )?.toClass();
    }

    async getThumbnail(id: string, groups: string[]) {
      const stream = await this.streams.findOne({ _id: id, groups: { $in: groups } });
      if (stream) {
        const thumb = await redisGet<string>(`stream:thumbnail:${id}`);
        return thumb ? Buffer.from(thumb, 'base64') : null;
      }

      return null;
    }

    async update(id: string, stream: Partial<Stream>, groups: string[]) {
      await this.streams.findOneAndUpdate({ _id: id, groups: { $in: groups } }, stream);
      return this.getInGroups(id, groups);
    }
}
