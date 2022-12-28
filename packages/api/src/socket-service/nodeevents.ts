import { BaseEventBody, BaseEvent } from '../baseevents';

export type NodeOperation = 'connect' | 'disconnect' | 'update';
export type NodeMetric = 'summary';

interface NodeDevice {
  id: string;
  name: string;
  type: string;
}

export interface NodeEventBody extends BaseEventBody {
  operation: NodeOperation;
}

export interface NodeConnectEventBody extends NodeEventBody {
  operation: 'connect';
  serviceId: string;
  name: string,
  kind: 'master' | 'slave',
  ip: string,
  clientId: string,
  userId?: string,
  ephemeral: boolean,
  groups: string[],
  message?: string;
  devices: NodeDevice[];
}

export interface NodeDisconnectEventBody extends NodeEventBody {
  operation: 'disconnect';
}

export interface NodeEvent extends BaseEvent {
  event: 'events:node';
  body: NodeConnectEventBody | NodeDisconnectEventBody;
}

export interface NodeMetricEventBody extends BaseEventBody {
  metric: NodeMetric;
}

export interface NodeSummaryMetricBody extends NodeMetricEventBody {
  metric: 'summary';
  txTotal: number;
  rxTotal: number;
  txRate: number;
  rxRate: number;
  latency: number;
  bufferSize: number;
}

export interface NodeSummaryMetric extends BaseEvent {
  event: 'events:node:metric';
  body: NodeSummaryMetricBody;
}

export interface NodeLogEventBody extends BaseEventBody {
  level: number;
  timestamp: number;
  message: string;
}

export interface NodeLogEvent extends BaseEvent {
  event: 'events:node:log';
  body: NodeLogEventBody;
}

export type NodeEvents = NodeEvent | NodeSummaryMetric | NodeLogEvent;
