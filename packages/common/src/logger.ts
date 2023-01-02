import { ResourceType } from '@ftl/api';
import { redisSendEvent, redisConsumerGroup } from './redis';
import ALS from './als';

export default class RedisLogger {
  private resourceType: ResourceType;

  constructor(resource: ResourceType) {
    this.resourceType = resource;
  }

  log(id: string, level: number, ...data: unknown[]) {
    const state = ALS.getStore();
    redisSendEvent({
      event: 'events:log',
      body: {
        id,
        message: JSON.stringify(data),
        level,
        resource: this.resourceType,
        operationId: state && state.get('operationId'),
        userId: state && state.get('userId'),
        clientId: state && state.get('clientId'),
        sessionId: state && state.get('sessionId'),
        groupName: redisConsumerGroup(),
      },
    });
  }

  debug(id: string, ...data: unknown[]) {
    this.log(id, 0, ...data);
  }

  info(id: string, ...data: unknown[]) {
    this.log(id, 1, ...data);
  }

  warn(id: string, ...data: unknown[]) {
    this.log(id, 2, ...data);
  }

  error(id: string, ...data: unknown[]) {
    this.log(id, 3, ...data);
  }
}
