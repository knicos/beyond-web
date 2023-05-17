import { Appender, BaseAppender, LogEvent } from '@tsed/logger';
import {
  redisSendEvent, redisConsumerId, redisConsumerGroup,
} from '@ftl/common';

@Appender({ name: 'redis' })
export default class RedisAppender extends BaseAppender {
  write(loggingEvent: LogEvent) {
    let level = 0;
    switch (loggingEvent.level.level) {
      case 10000: level = 0; break;
      case 20000: level = 1; break;
      case 30000: level = 2; break;
      case 40000: level = 3; break;
      default: level = loggingEvent.level.level;
    }
    redisSendEvent({
      event: 'events:log',
      body: {
        id: redisConsumerId(),
        groupName: redisConsumerGroup(),
        message: JSON.stringify(loggingEvent.data),
        level,
        resource: 'service',
        timestamp: loggingEvent.startTime.getDate(),
      },
    });
  }
}

// export const NodeLogger = new RedisLogger('node');
