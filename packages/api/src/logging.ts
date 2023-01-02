import { BaseEvent, BaseEventBody } from './baseevents';

export type ResourceType = 'node' | 'stream' | 'service' | 'user' | 'other';

export interface LogBody extends BaseEventBody {
  resource: ResourceType;
  groupName?: string;
  level: number;
  message: string;
}

export interface LogEvent extends BaseEvent {
  event: 'events:log';
  body: LogBody;
}
