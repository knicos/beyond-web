import redis from 'redis';
import { v4 as uuidv4 } from 'uuid';

let redisClient: redis.RedisClient;
let redisSub: redis.RedisClient;
let redisBlockClient: redis.RedisClient;

const handlers = new Map<string, Function[]>();

const DAY = 1 * 24 * 60 * 60 * 1000;

function initRedis(): void {
  if (!redisClient) {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'redis',
    });
    redisSub = redisClient.duplicate({ return_buffers: true });
    // redisPub = redisClient.duplicate();
    redisBlockClient = redisClient.duplicate();

    redisSub.on('message', (channel: Buffer, message: Buffer) => {
      const strchan = channel.toString('utf8');

      if (handlers.has(strchan)) {
        const hs = handlers.get(strchan);
        for (const h of hs) {
          h(message);
        }
      }
    });
  }
}

export function redisPublish(channel: string, data: unknown): Promise<boolean> {
  initRedis();
  // Publish to redis
  return new Promise((resolve) => {
    redisClient.publish(channel, data as string, (err) => {
      resolve(!err);
    })
  });
}

export function redisSubscribe(channel: string, cb: Function): Promise<boolean> {
  initRedis();

  const hasChannel = handlers.has(channel);
  // Subscribe to redis
  if (hasChannel) {
    handlers.get(channel).push(cb);
  } else {
    handlers.set(channel, [cb]);
  }
  return new Promise((resolve) => {
    if (!hasChannel) {
      redisSub.subscribe(channel, (err) => {
        if (err) {
          console.error('Subscribe error', err);
        }
        resolve(!err);
      });
    }
    return true;
  });
}

export function redisUnsubscribe(channel: string, cb: Function) {
  if (!handlers.has(channel)) {
    return;
  }

  const hs = handlers.get(channel);
  const filtered = hs.filter((f) => f !== cb);

  if (filtered.length === 0) {
    handlers.delete(channel);
  } else {
    handlers.set(channel, filtered);
  }

  if (filtered.length === 0) {
    redisSub.unsubscribe(channel, (err) => {
      if (err) {
        console.error('Subscribe error', err);
      } else {
        console.log('Remove redis subscription', channel);
      }
    });
  }
}

export function redisSet<T>(key: string, item: T, time?: number): Promise<boolean> {
  initRedis();
  if (time) {
    return new Promise((resolve) => {
      redisClient.multi().set(key, JSON.stringify(item)).expire(key, time).exec((err) => {
        resolve(!err);
      });
    });
  }

  return new Promise((resolve) => {
    redisClient.set(key, JSON.stringify(item), (err) => {
      resolve(!err);
    });
  });
}

export function redisGet<T>(key: string): Promise<T> {
  initRedis();
  return new Promise((resolve) => {
    redisClient.get(key, (err, reply) => {
      if (err) {
        resolve(null);
      } else {
        resolve(JSON.parse(reply))
      }
    });
  });
}

export function redisDelete(key: string): Promise<boolean> {
  initRedis();
  return new Promise((resolve) => {
    redisClient.del(key, (err) => {
      resolve(!err);
    });
  });
}

export function redisAddItem(key: string, item: string, time: number): Promise<boolean> {
  initRedis();
  return new Promise((resolve) => {
    redisClient.zadd(key, time, item, (err) => {
      resolve(!err);
    });
  });
}

export function redisRemoveItem(key: string, item: string): Promise<boolean> {
  initRedis();
  return new Promise((resolve) => {
    redisClient.zrem(key, item, (err) => {
      resolve(!err);
    });
  });
}

export function redisTopItems(key: string): Promise<string[]> {
  initRedis();
  return new Promise((resolve) => {
    redisClient.zrangebyscore(key, Date.now() - 1 * DAY, Date.now(), (err, reply) => {
      resolve(err ? [] : reply);
    });
  });
}

// eslint-disable-next-line no-unused-vars
type ReplyCallback = (data: unknown) => void;

const replyMap = new Map<string, ReplyCallback>();

export function redisReply(cb: ReplyCallback): string {
  const id = uuidv4();
  replyMap.set(id, cb);
  return id;
}

const originKey = `reply:${uuidv4()}`;

redisSubscribe(originKey, (data) => {
  const res = JSON.parse(data);
  if (res?.request && replyMap.has(res.request)) {
    replyMap.get(res.request)(res.data);
    replyMap.delete(res.request);
  }
});

export function redisSendCommand(service: string, request: string, cmd: string, data: unknown) {
  initRedis();
  const key = `command:${service}`;
  redisClient.rpush(key, JSON.stringify({
    cmd, data, request, origin: originKey,
  }), (err) => {
    if (err) {
      console.error('Redis command send error', err);
    }
  });
}

// eslint-disable-next-line no-unused-vars
type CommandCallback = (cmd: string, data: unknown) => unknown;

export function redisListen(service: string, cb: CommandCallback) {
  initRedis();
  const key = `command:${service}`;
  redisBlockClient.blpop(key, 0, async (err, rep) => {
    if (err) {
      console.error('Command error', err);
    } else {
      const data = JSON.parse(rep[1]);
      const result = await cb(data.cmd, data.data);
      if (data.request && data.origin) {
        redisPublish(data.origin, JSON.stringify({ data: result, request: data.request }));
      }
    }
    redisListen(service, cb);
  });
}
