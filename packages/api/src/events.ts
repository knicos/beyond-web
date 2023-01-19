import { StreamEvents, NodeEvents } from './socket-service/events';
import { LogEvent } from './logging';
import { ServiceMetricEvent } from './service';
import { RecordingEvent } from './recorder-service';
import { PlaybackEvent } from './playback-service';

export type Event =
  | StreamEvents
  | NodeEvents
  | RecordingEvent
  | LogEvent
  | ServiceMetricEvent
  | PlaybackEvent;
