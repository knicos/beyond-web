import { redisSendEvent } from '@ftl/common';
import { BaseEvent } from '../events';

export type RecordingEventType = 'start' | 'cancel' | 'complete';

export interface RecordingEvent extends BaseEvent {
  id: string;
  event: RecordingEventType;
  size: number;
  duration: number;
  date: Date;
  filename: string;
  owner: string;
}

export function sendRecordingEvent(event: RecordingEvent) {
  redisSendEvent('event:recording', event);
}
