import { StreamEvents, NodeEvents } from './socket-service/events';
import { LogEvent } from './logging';

import {
  RecordingEvent,
} from './recorder-service';

export type Event =
  | StreamEvents
  | NodeEvents
  | RecordingEvent
  | LogEvent;
