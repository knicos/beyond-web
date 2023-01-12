/* eslint-disable new-cap */
/* eslint-disable no-restricted-syntax */
import { Service } from '@tsed/common';
import { IUser } from '@ftl/types';
import { v4 as uuidv4 } from 'uuid';
import {
  redisSetStreamCallback,
  redisGet,
  redisSet,
  redisHSet,
  redisHGetM,
} from '@ftl/common';
import { StreamDataEventBody, StreamOperationEventBody } from '@ftl/api';
import { StreamLogger } from '../logger';

const HOUR = 60 * 60;

export interface Frame {
  frameId: number;
  title: string;
  active?: boolean;
  group: string;
}

export interface Frameset {
  framesetId: number;
  frames: Frame[];
}

export interface Stream {
  id: string;
  uri: string;
  framesets: Frameset[];
}

@Service()
export default class StreamService {
    private streams = new Map<string, Stream>();
    private streamsById = new Map<string, Stream>();

    private getFrame(uri: string, fsid: number, fid: number) {
      if (!this.streams.has(uri)) return null;
      const s = this.streams.get(uri);
      const fs = s.framesets.find((a) => a.framesetId === fsid);
      if (!fs) return null;
      const f = fs.frames.find((a) => a.frameId === fid);
      if (!f) return null;
      return f;
    }

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
      redisSetStreamCallback('events:stream:data', async (data: StreamDataEventBody) => {
        if (data.channel === 74) {
          const stream = this.streams.get(data.id);
          if (stream) {
            await redisSet(`stream:thumbnail:${stream.id}:${data.framesetId}:${data.frameId}`, data.value);
          }
        } else if (data.channel === 71) {
          const f = this.getFrame(
            data.id,
            data.framesetId,
            data.frameId,
          );
          if (f) {
            f.title = JSON.parse(data.value as string).name;
          }
        }
      });
      redisSetStreamCallback('events:stream', async (data: StreamOperationEventBody) => {
        StreamLogger.info(data.id, 'Stream update:', data.operation, data.id, data.framesetId, data.frameId);
        if (data.operation === 'start') {
          if (data.framesetId === 255) {
            const sdata = {
              id: uuidv4(),
              uri: data.id,
              framesets: [],
            };
            this.streams.set(data.id, sdata);
            this.streamsById.set(sdata.id, sdata);
          } else {
            const s = this.streams.get(data.id);
            const fsid = data.framesetId;
            const fid = data.frameId;
            while (s.framesets.length <= fsid) {
              s.framesets.push({
                framesetId: fsid,
                frames: [],
              });
            }
            const fs = s.framesets[fsid];
            if (fs.frames.length <= fid) {
              fs.frames.push({
                frameId: fid,
                title: 'Unknown name',
                active: true,
                group: '',
              });
            } else {
              fs.frames[fid].active = true;
            }

            this.updateStats(s.id, fsid, fid, { active: true });
          }
        } else if (data.operation === 'stop') {
          if (this.streams.has(data.id)) {
            const s = this.streams.get(data.id);
            for (const fs of s.framesets) {
              for (const f of fs.frames) {
                f.active = false;
              }
            }
          }
        }
      });
      // Subscribe to node streams.
      // redisSetStreamCallback('event:node:update', async (key: string, data: any) => {
      //  console.log('NODE UPDATE', data);
      // });
    }

    async findInGroups(user: IUser, groups: string[], offset: number, limit: number) {
      const streams = Array.from(this.streams).map((a) => a[1]);
      return streams;
    }

    async getInGroups(id: string, groups: string[]) {
      return this.streamsById.get(id);
    }

    async getThumbnail(id: string, frameset: number, frame: number, groups: string[]) {
      // const stream = await this.streams.findOne({ _id: id, groups: { $in: groups } });
      // if (stream) {
      const thumb = await redisGet<string>(`stream:thumbnail:${id}:${frameset}:${frame}`);
      return thumb ? Buffer.from(thumb, 'base64') : null;
      //}

      // return null;
    }
}
