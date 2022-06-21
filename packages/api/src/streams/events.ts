import { redisSendEvent } from '@ftl/common';
import { BaseEvent } from '../events';

export type StreamUpdateEventType = 'start' | 'stop' | 'update' | 'create' | 'delete';
export type StreamDataEventType = 'request' | 'auto' | 'thumbnail' | 'metadata';
export type StreamStatsEventType = 'ping' | 'channels';

export interface StreamUpdateEvent extends BaseEvent {
  id: string;
  framesetId: number;
  frameId: number;
  event: StreamUpdateEventType;
  name?: string;
  node?: string;
  params?: Record<string, unknown>;
  owner?: string;
  groups?: string[];
  device?: string;
}

export interface StreamDataEvent extends BaseEvent {
  id: string;
  event: StreamDataEventType;
  data: Record<number, unknown>;
  framesetId: number;
  frameId: number;
}

export interface StreamStatsEvent extends BaseEvent {
  id: string;
  event: StreamStatsEventType;
  latency?: number;
  timestamp?: number;
  channels: Record<number, boolean>;
}

export function sendStreamUpdateEvent(event: StreamUpdateEvent) {
  redisSendEvent('event:stream:update', event);
}

export function sendStreamDataEvent(event: StreamDataEvent) {
  redisSendEvent('event:stream:data', event);
}

export function sendStreamStatsEvent(event: StreamStatsEvent) {
  redisSendEvent('event:stream:stats', event);
}
