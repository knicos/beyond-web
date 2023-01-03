import { BaseEvent, BaseEventBody } from './baseevents';

export interface ServiceMetricBody extends BaseEventBody {
  serviceName: string;
  idlePercent: number;
  memoryUsage: number;
  eventDelay: number;
  connections: number;
  startTime: number;
  endTime: number;
}

export interface ServiceMetricEvent extends BaseEvent {
  event: 'events:service:metric';
  body: ServiceMetricBody;
}
