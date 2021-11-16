/* eslint-disable new-cap */
/* eslint-disable no-restricted-syntax */
import { Service, Inject } from '@tsed/common';
import { MongooseDocument, MongooseModel } from '@tsed/mongoose';
import { IUser } from '@ftl/types';
import {
  redisSetStreamCallback,
  redisGet,
  redisSet,
  redisHSet,
  redisHGetM,
} from '@ftl/common';
import { sendStreamUpdateEvent } from '@ftl/api';
import Stream from '../models/stream';

const HOUR = 60 * 60;

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
            deviceId: f.deviceId,
          });
        }
      }
    }
  }

  return frames;
}

interface IDevice {
  type: string;
  id: string;
  name: string;
}

function hasDevice(devices: IDevice[], device?: string) {
  if (!device || device === '') {
    return true;
  }
  return devices.some((d) => d.id === device);
}

@Service()
export default class StreamService {
    @Inject(Stream)
    private streams: MongooseModel<Stream>;

    private async updateStats(id: string, fsid: number, fid: number, data) {
      await redisHSet(`stream-stats:${id}:${fsid}:${fid}`, {
        active: data.active ? 'yes' : 'no',
      }, HOUR * 24);
    }

    private async getStats(id: string, fsid: number, fid: number) {
      const result = await redisHGetM(`stream-stats:${id}:${fsid}:${fid}`, ['active']);
      return result;
    }

    async $onInit() {
      redisSetStreamCallback('event:stream:data', async (key: string, data: any) => {
        if (data.event === 'thumbnail') {
          const stream = await this.streams.findOne({ uri: data.id });
          if (stream) {
            await redisSet(`stream:thumbnail:${stream.id}:${data.framesetId}:${data.frameId}`, data.data);
          }
        }
      });
      // Subscribe to node streams.
      redisSetStreamCallback('event:node:update', async (key: string, data: any) => {
        // Find a stream and perhaps start it.
        console.log('NODE UPDATE', data);
        if (data.event === 'connect' || data.event === 'disconnect') {
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
          console.log('CHANGE STREAM', selectedFrames);
          const devices = data.devices ? JSON.parse(data.devices) : [];

          for (const sf of selectedFrames) {
            if (data.event === 'connect' && sf.autoStart && hasDevice(devices, sf.deviceId)) {
              this.updateStats(sf.uri, sf.framesetId, sf.frameId, {
                active: true,
              });
              sendStreamUpdateEvent({
                event: 'start',
                id: sf.uri,
                name: sf.name,
                node: data.id,
                framesetId: sf.framesetId,
                frameId: sf.frameId,
              });
            } else if (data.event === 'disconnect') {
              this.updateStats(sf.uri, sf.framesetId, sf.frameId, {
                active: false,
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

      const statsPromise = [];
      for (const s of streams) {
        for (const fs of s.framesets) {
          for (const f of fs.frames) {
            statsPromise.push(this.getStats(s.uri, fs.framesetId, f.frameId));
          }
        }
      }

      const stats = await Promise.all(statsPromise);

      let i = 0;
      for (const s of streams) {
        for (const fs of s.framesets) {
          for (const f of fs.frames) {
            f.active = stats[i].active === 'yes';
            i += 1;
          }
        }
      }

      return streams;
    }

    async getInGroups(id: string, groups: string[]) {
      return (
        await this.streams.findOne({ _id: id, groups: { $in: groups } })
      )?.toClass();
    }

    async deleteInGroups(id: string, groups: string[]) {
      return (
        await this.streams.deleteOne({ _id: id, groups: { $in: groups } })
      ).deletedCount;
    }

    async getThumbnail(id: string, frameset: number, frame: number, groups: string[]) {
      const stream = await this.streams.findOne({ _id: id, groups: { $in: groups } });
      if (stream) {
        const thumb = await redisGet<string>(`stream:thumbnail:${id}:${frameset}:${frame}`);
        return thumb ? Buffer.from(thumb, 'base64') : null;
      }

      return null;
    }

    async update(id: string, stream: Partial<Stream>, groups: string[]) {
      await this.streams.findOneAndUpdate({ _id: id, groups: { $in: groups } }, stream);
      return this.getInGroups(id, groups);
    }
}
