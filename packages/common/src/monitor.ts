import { monitorEventLoopDelay, performance } from 'perf_hooks';
import { ServiceMetricEvent } from '@ftl/api';
import { Server } from 'http';
import {
  redisConsumerGroup, redisConsumerId, redisHSet, redisSendEvent,
} from './redis';

/**
 * Monitors server metrics and sends to Redis.
 * @param server Express HTTP Server
 */
export default function installMonitor(server: Server) {
  const h = monitorEventLoopDelay({ resolution: 20 });

  let idleTime = 0;
  let lastTS = Date.now();

  async function perfcheck() {
    const connections = await new Promise<number>((resolve) => {
      server.getConnections((err, count) => {
        resolve(count);
      });
    });

    const newTS = Date.now();
    const newIdleTime = performance.nodeTiming.idleTime;
    const idlePC = (newIdleTime - idleTime) / (newTS - lastTS);

    const event: ServiceMetricEvent = {
      event: 'events:service:metric',
      body: {
        id: redisConsumerId(),
        serviceName: redisConsumerGroup(),
        idlePercent: idlePC,
        memoryUsage: process.memoryUsage().heapUsed,
        startTime: lastTS,
        endTime: newTS,
        eventDelay: h.mean / 1000000.0 - 20.0,
        connections,
      },
    };

    redisSendEvent(event);

    redisHSet(`service:${event.body.id}`, event.body, 60);

    h.reset();
    idleTime = newIdleTime;
    lastTS = newTS;
  }

  h.enable();
  setInterval(perfcheck, 10000);
}
