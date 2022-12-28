import redis from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { $log } from '@tsed/logger';
import { BaseEventBody, Event } from '@ftl/api';
import * as fs from 'fs';

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
          $log.error('Subscribe error', err);
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
        $log.error('Subscribe error', err);
      } else {
        $log.info('Remove redis subscription', channel);
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

export function redisMGet<T>(keys: string[]): Promise<T[]> {
  initRedis();
  return new Promise((resolve) => {
    redisClient.mget(...keys, (err, reply) => {
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
      $log.error('Redis command send error', err);
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
      $log.error('Command error', err);
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

function keysFromObject(obj: any): string[] {
  const result: string[] = [];
  // eslint-disable-next-line guard-for-in
  for (const key in obj) {
    const value = obj[key];

    const type = typeof value;
    let valueStr: string;
    switch (type) {
      case 'string':
        valueStr = value;
        break;
      case 'number':
        valueStr = `${value}`;
        break;
      case 'object':
        valueStr = JSON.stringify(value);
        break;
      default:
        break;
    }

    if (valueStr) {
      result.push(key);
      result.push(valueStr);
    }
  }
  return result;
}

function objectFromKeys(keys: string[]): any {
  const obj = {};
  for (let i = 0; i < keys.length; i += 2) {
    const k = keys[i + 1];
    // eslint-disable-next-line no-restricted-globals
    obj[keys[i]] = (isNaN(k as any)) ? k : parseFloat(k);
  }
  return obj;
}

function objectFromValues(keys: string[], values: any[]): any {
  const obj = {};
  for (let i = 0; i < keys.length; i += 1) {
    const v = values[i];
    if (v !== null) {
      obj[keys[i]] = values[i];
    }
  }
  return obj;
}

export function redisHSet(key: string, data: any, ttl: number): Promise<boolean> {
  initRedis();
  const items = keysFromObject(data);
  return new Promise((resolve) => {
    redisClient.multi().hset(
      key, ...items,
    ).expire(key, ttl).exec((err) => resolve(!err))
  });
}

export function redisHGetM(key: string, items: string[]): Promise<any> {
  initRedis();
  return new Promise((resolve) => {
    redisClient.hmget(
      key, ...items,
      (err, rep) => {
        if (err) {
          $log.error('Redis hmget error', err);
          resolve(null);
        } else {
          resolve(objectFromValues(items, rep));
        }
      },
    )
  });
}

export function redisSendEvent<T extends Event>(event: T) {
  initRedis();
  const items = keysFromObject(event.body);
  if (!redisClient.xadd) return;
  redisClient.xadd.apply(
    redisClient,
    [
      event.event, 'MAXLEN', '~', '1000', '*',
      ...items, (err) => {
        if (err) {
          $log.error('Redis event error', err);
        }
      },
    ],
  );
}

const streamKeys = new Set<string>();
let streamListen = false;
// eslint-disable-next-line no-unused-vars
type StreamCallback<T extends BaseEventBody> = (data: T, id: string) => void;
const streamCallbacks = new Map<string, StreamCallback<BaseEventBody>>();
let streamID = '0';
let consumerGroup = null;

export function redisSetGroup(group: string) {
  consumerGroup = group;
}

export async function redisCreateGroup(stream: string): Promise<number> {
  return new Promise((resolve) => {
    redisClient.xgroup('CREATE', stream, consumerGroup, '$', 'MKSTREAM', (err, rep) => {
      if (err) {
        $log.error('Redis group error', err);
        resolve(-1);
      } else {
        resolve(rep);
      }
    });
  });
}

export function redisSetStreamCallback<T extends Event>(key: T['event'], cb: StreamCallback<T['body']>): Promise<number> {
  streamCallbacks.set(key, cb);
  streamKeys.add(key);
  return redisCreateGroup(key);
}

export function redisStreamListen(optName?: string, newKeys?: string[]) {
  let name = optName;

  if (!name) {
    if (fs.existsSync('/tmp/serviceid')) {
      name = fs.readFileSync('/tmp/serviceid', 'utf8');
    } else {
      name = uuidv4();
      fs.writeFileSync('/tmp/serviceid', name);
    }
  }
  initRedis();

  if (Array.isArray(newKeys)) {
    newKeys.forEach((k) => streamKeys.add(k));
  }

  if (streamListen) {
    return;
  }
  streamListen = true;

  if ((!consumerGroup || !name) && streamID === '0') {
    streamID = '$';
  }

  const keys = Array.from(streamKeys);
  const ids = keys.map(() => streamID);

  if (keys.length === 0) {
    return;
  }

  if (!consumerGroup || !name) {
    redisBlockClient.xread.apply(
      redisBlockClient,
      ['BLOCK', '60000', 'STREAMS', ...keys, ...ids, async (err, rep) => {
        if (err) {
          $log.error('Command error', err);
        } else if (Array.isArray(rep)) {
          for (const stream of rep) {
            const [key, dataSet] = stream;
            for (const data of dataSet) {
              const [id, columns] = data;
              streamID = id;
              const obj = objectFromKeys(columns);
              if (streamCallbacks.has(key)) {
                try {
                  streamCallbacks.get(key)(obj, id);
                } catch (e) {
                  $log.error('Stream callback error', e);
                }
              }
            }
          }
        }
        streamListen = false;
        redisStreamListen(name);
      }],
    );
  } else {
    redisBlockClient.xreadgroup.apply(
      redisBlockClient,
      ['GROUP', consumerGroup, name, 'BLOCK', '60000', 'STREAMS', ...keys, ...ids, async (err, rep) => {
        if (err) {
          $log.error('Command error', err);
        } else if (Array.isArray(rep)) {
          for (const stream of rep) {
            const [key, dataSet] = stream;
            for (const data of dataSet) {
              const [id, columns] = data;
              streamID = id;
              const obj = objectFromKeys(columns);
              if (streamCallbacks.has(key)) {
                try {
                  streamCallbacks.get(key)(obj, id);
                } catch (e) {
                  $log.error('Stream callback error', e);
                }
              }
              redisClient.xack(key, consumerGroup, id, (ackerr) => {
                if (err) {
                  $log.error('ACK Error', ackerr);
                }
              });
            }
          }
        }
        streamListen = false;
        streamID = '>';
        redisStreamListen(name);
      }],
    );
  }
}
