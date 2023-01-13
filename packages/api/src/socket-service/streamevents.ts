import { BaseEventBody, BaseEvent } from '../baseevents';

export type StreamEventTypes =
  | 'events:stream'
  | 'events:stream:channels'
  | 'events:stream:data'
  | 'events:stream:metrics'
  | 'events:stream:client';

export type StreamOperation = 'start' | 'stop';
export type StreamMetricType = 'source' | 'client';
export type StreamClientOperation = 'connect' | 'disconnect';

export interface StreamEventBody extends BaseEventBody {
  framesetId: number;
  frameId: number;
}

export interface StreamEvent extends BaseEvent {
  event: StreamEventTypes;
  body: StreamEventBody;
}

export interface StreamOperationEventBody extends StreamEventBody {
  operation: StreamOperation;
}

export interface StreamOperationStartEventBody extends StreamOperationEventBody {
  operation: 'start';
  node?: string;
  owner: string;
  groups: string[];
  params?: Record<string, string>;
}

export interface StreamOperationStopEventBody extends StreamOperationEventBody {
  operation: 'stop';
}

export interface StreamOperationEvent extends StreamEvent {
  event: 'events:stream';
  body: StreamOperationStartEventBody | StreamOperationStopEventBody;
}

export interface StreamDataEventBody extends StreamEventBody {
  channel: number;
  value: unknown;
}

export interface StreamDataEvent extends StreamEvent {
  event: 'events:stream:data';
  body: StreamDataEventBody;
}

export interface StreamChannelsEventBody extends StreamEventBody {
  channels: number[];
}

export interface StreamChannelsEvent extends StreamEvent {
  event: 'events:stream:channels';
  body: StreamChannelsEventBody;
}

export interface StreamClientEventBody extends StreamEventBody {
  nodeId: string;
  operation: StreamClientOperation;
}

export interface StreamClientEvent extends StreamEvent {
  event: 'events:stream:client';
  body: StreamClientEventBody;
}

export interface StreamMetricsEventBody extends StreamEventBody {
  metric: StreamMetricType;
}

export interface StreamSummaryMetricBody extends StreamMetricsEventBody {
  metric: 'source';
  txTotal: number;
  rxTotal: number;
  txRate: number;
  rxRate: number;
  colourBitrate: number;
}

export interface StreamMetricEvent extends StreamEvent {
  event: 'events:stream:metrics';
  body: StreamMetricsEventBody;
}

export type StreamEvents =
  | StreamEvent
  | StreamChannelsEvent
  | StreamDataEvent
  | StreamClientEvent
  | StreamMetricEvent;
