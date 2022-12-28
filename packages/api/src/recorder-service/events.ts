import { BaseEventBody, BaseEvent } from '../baseevents';

export type RecordingEventType = 'start' | 'cancel' | 'complete';

export interface RecordingEventBody extends BaseEventBody {
  id: string;
  event: RecordingEventType;
  size: number;
  duration: number;
  date: Date;
  filename: string;
  owner: string;
}

export interface RecordingEvent extends BaseEvent {
  event: 'events:recording';
  body: RecordingEventBody;
}
