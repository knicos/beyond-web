import { Service, Inject } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import {
  redisSetStreamCallback, redisHSet, redisAddItem, redisHGetM,
} from '@ftl/common';
import Node from '../models/node';
import NodeQuery from '../models/query';

const MINUIT = 60;

@Service()
export default class NodeService {
    @Inject(Node)
    private nodes: MongooseModel<Node>;

    async $onInit() {
      // Subscribe to node streams.
      redisSetStreamCallback('event:node:update', async (key: string, data: any) => {
        if (data.event === 'connect') {
          this.connectNode(data);
        }
      });
      redisSetStreamCallback('event:node:stats', async (key: string, data: any) => {
        this.updateStats(data);
      });
      redisSetStreamCallback('event:stream:update', async (key: string, data: any) => {
        if (data.node && data.name) {
          const result = await this.nodes.findOneAndUpdate({
            serial: data.node,
            'streams.uri': data.id,
          }, {
            $set: {
              'streams.$': {
                uri: data.id,
                name: data.name,
                framesetId: data.framesetId,
                frameId: data.frameId,
              },
            },
          });

          if (!result) {
            await this.nodes.findOneAndUpdate({
              serial: data.node,
            }, {
              $push: {
                streams: {
                  uri: data.id,
                  name: data.name,
                  framesetId: data.framesetId,
                  frameId: data.frameId,
                },
              },
            });
          }
        }
      });
    }

    private async connectNode(data: any) {
      const groups = data.groups ? JSON.parse(data.groups) : [];
      const ephemeral = !!data.ephemeral || groups.length === 0 || !!data.userId;
      if (ephemeral) {
        await redisAddItem('node-service:connections', data.id, Date.now());
        return;
      }

      const devs = data.devices ? JSON.parse(data.devices) : [];

      const up = await this.nodes.findOneAndUpdate({
        serial: data.id,
        clientId: data.clientId,
      }, {
        devices: devs.map((d) => ({ serial: d.id, type: d.type, name: d.name })),
        lastUpdate: new Date(),
        userId: data.userId,
      });

      if (!up) {
        await this.nodes.create({
          serial: data.id,
          clientId: data.clientId,
          name: data.name,
          groups,
          streams: [],
          devices: devs.map((d) => ({ serial: d.id, type: d.type, name: d.name })),
          lastUpdate: new Date(),
          userId: data.userId,
        });
      }

      this.updateStats(data);
    }

    private async updateStats(data) {
      await redisHSet(`node-stats:${data.id}`, {
        latency: data.latency,
        active: 'yes',
      }, MINUIT);
    }

    private async getStats(serial: string) {
      const result = await redisHGetM(`node-stats:${serial}`, ['latency', 'active']);
      return result;
    }

    async findInGroups(groups: string[], query: NodeQuery, offset: number, limit: number) {
      const q = {
        groups: { $in: groups },
        ...(query.serial && { serial: query.serial }),
        ...(query.name && { name: query.name }),
      };

      const nodes = (
        await this.nodes.find(q).sort('-lastUpdate').skip(offset).limit(limit)
      ).map((node) => node.toClass());

      const statsPromise = nodes.map((node) => this.getStats(node.serial));
      const stats = await Promise.all(statsPromise);

      return nodes.map((node, ix) => ({ ...node, ...stats[ix] }));
    }

    async getInGroups(id: string, groups: string[]) {
      const node = await this.nodes.findOne({ _id: id, groups: { $in: groups } });

      if (node) {
        const stats = await this.getStats(node.serial);
        return { ...node.toClass(), ...stats };
      }

      return null;
    }

    async update(id: string, node: Partial<Node>, groups: string[]) {
      await this.nodes.findOneAndUpdate({ _id: id, groups: { $in: groups } }, node);
      return this.getInGroups(id, groups);
    }
}
