import { BaseEventBody, BaseEvent } from '../baseevents';

export type PlaybackEventType = 'start' | 'stop';

export interface PlaybackEventBody extends BaseEventBody {
  id: string;
  event: PlaybackEventType;
  fileId: string;
  filename: string;
  started: Date;
  owner: string;
}

export interface PlaybackEvent extends BaseEvent {
  event: 'events:playback';
  body: PlaybackEventBody;
}
