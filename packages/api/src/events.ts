import { StreamEvents, NodeEvents } from './socket-service/events';

import {
  RecordingEvent,
} from './recorder-service';

export type Event =
  | StreamEvents
  | NodeEvents
  | RecordingEvent;
