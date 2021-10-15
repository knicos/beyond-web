import { redisSendEvent } from '@ftl/common';
import { BaseEvent } from '../events';

export type NodeUpdateEventType = 'connect' | 'disconnect' | 'update' | 'error';
export type NodeStatsEventType = 'ping';

export interface NodeUpdateEvent extends BaseEvent {
  id: string;
  event: NodeUpdateEventType;
  name?: string,
  kind?: 'master' | 'slave',
  ip?: string,
  clientId?: string,
  userId?: string,
  ephemeral?: string,
  groups?: string[],
  message?: string;
}

export interface NodeStatsEvent extends BaseEvent {
  id: string;
  event: NodeStatsEventType;
  latency?: number;
  timestamp?: number;
  clientId?: string;
  rxRate?: number;
  txRate?: number;
}

export function sendNodeUpdateEvent(event: NodeUpdateEvent) {
  redisSendEvent('event:node:update', event);
}

export function sendNodeStatsEvent(event: NodeStatsEvent) {
  redisSendEvent('event:node:stats', event);
}
