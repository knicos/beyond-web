import { Service, Inject } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import {
  redisSetStreamCallback, redisHSet, redisAddItem, redisHGetM,
} from '@ftl/common';
import Node from '../models/node';

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
    }

    private async connectNode(data: any) {
      const groups = data.groups ? JSON.parse(data.groups) : [];
      const ephemeral = !!data.ephemeral || groups.length === 0 || !!data.userId;
      if (ephemeral) {
        await redisAddItem('node-service:connections', data.id, Date.now());
        return;
      }

      await this.nodes.findOneAndUpdate({
        serial: data.id,
        clientId: data.clientId,
      }, {
        serial: data.id,
        clientId: data.clientId,
        name: data.name,
        groups,
        streams: [],
        lastUpdate: new Date(),
        userId: data.userId,
      }, { upsert: true });
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

    async findInGroups(groups: string[], offset: number, limit: number) {
      const nodes = (
        await this.nodes.find({ groups: { $in: groups } }).sort('-lastUpdate').skip(offset).limit(limit)
      ).map((node) => node.toClass());

      const statsPromise = nodes.map((node) => this.getStats(node.serial));
      const stats = await Promise.all(statsPromise);

      return nodes.map((node, ix) => ({ ...node, ...stats[ix] }));
    }

    async getInGroups(id: string, groups: string[]) {
      return (
        await this.nodes.findOne({ _id: id, groups: { $in: groups } })
      )?.toClass();
    }

    async update(id: string, node: Partial<Node>, groups: string[]) {
      await this.nodes.findOneAndUpdate({ _id: id, groups: { $in: groups } }, node);
      return this.getInGroups(id, groups);
    }
}
