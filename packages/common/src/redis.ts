import * as redis from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { $log } from '@tsed/logger';
import { BaseEventBody, Event } from '@ftl/api';
import * as fs from 'fs';
import ALS from './als';

let redisClient: redis.RedisClientType;
let redisSub: redis.RedisClientType;
let redisBlockClient: redis.RedisClientType;

let redisPromise: Promise<void>;

// const handlers = new Map<string, Function[]>();
const subscriptions = new Set<string>();

const DAY = 1 * 24 * 60 * 60 * 1000;

async function initRedis() {
  if (!redisClient) {
    if (redisPromise) return redisPromise;

    redisPromise = new Promise(async (resolve) => {
      const tmpClient: redis.RedisClientType = redis.createClient({
        url: `redis://${process.env.REDIS_HOST || 'redis'}`,
        socket: {
          host: process.env.REDIS_HOST || 'redis',
        },
      });
      tmpClient.on('error', (err) => {
        console.log('Redis ERROR', err);
      });
      redisSub = tmpClient.duplicate();
      redisSub.on('error', (err) => {
        console.log('Redis Sub ERROR', err);
      });
      // redisPub = redisClient.duplicate();
      redisBlockClient = tmpClient.duplicate();
      redisBlockClient.on('error', (err) => {
        console.log('Redis Block ERROR', err);
      });
  
      /*redisSub.on('message', (channel: Buffer, message: Buffer) => {
        $log.info('On message', channel);
        const strchan = channel.toString('utf8');
  
        if (handlers.has(strchan)) {
          const hs = handlers.get(strchan);
          for (const h of hs) {
            h(message);
          }
        }
      });*/
  
      await tmpClient.connect();
      await redisSub.connect();
      await redisBlockClient.connect();
      redisClient = tmpClient;
      resolve();
    });

    return redisPromise;
  }
}

export async function redisPublish(channel: string, data: unknown): Promise<number> {
  await initRedis();
  // Publish to redis
  return redisClient.publish(channel, data as string);
}

export async function redisSubscribe(channel: string, cb: (msg: Buffer) => void): Promise<void> {
  await initRedis();

  const hasChannel = subscriptions.has(channel);

  if (!hasChannel) {
    subscriptions.add(channel);
    return redisSub.subscribe(channel, cb, true);
  }
}

export async function redisUnsubscribe(channel: string, cb: (msg: Buffer) => void) {
  if (!subscriptions.has(channel)) {
    return;
  }

  subscriptions.delete(channel);
  return redisSub.unsubscribe(channel, cb, true);
}

export async function redisSet<T>(key: string, item: T, time?: number): Promise<string> {
  await initRedis();
  if (time) {
    await redisClient.multi().set(key, JSON.stringify(item)).expire(key, time).exec();
    return '';
  }

  return redisClient.set(key, JSON.stringify(item));
}

export async function redisGet<T>(key: string): Promise<T> {
  await initRedis();
  const result = await redisClient.get(key);
  return JSON.parse(result)
}

export async function redisMGet<T>(keys: string[]): Promise<T[]> {
  await initRedis();
  const result = await redisClient.mGet(keys)
  return result.map((v) => JSON.parse(v));
}

export async function redisDelete(key: string): Promise<number> {
  await initRedis();
  return redisClient.del(key);
}

export async function redisAddItem(key: string, item: string, time: number): Promise<number> {
  await initRedis();
  return redisClient.zAdd(key, { score: time, value: item });
}

export async function redisRemoveItem(key: string, item: string): Promise<number> {
  await initRedis();
  return redisClient.zRem(key, item);
}

export async function redisTopItems(key: string): Promise<string[]> {
  await initRedis();
  return redisClient.zRangeByScore(key, Date.now() - 1 * DAY, Date.now());
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
  const res = JSON.parse(data.toString('utf8'));
  if (res?.request && replyMap.has(res.request)) {
    replyMap.get(res.request)(res.data);
    replyMap.delete(res.request);
  }
});

export async function redisSendCommand(service: string, request: string, cmd: string, data: unknown) {
  await initRedis();
  const key = `command:${service}`;
  return redisClient.rPush(key, JSON.stringify({
    cmd, data, request, origin: originKey,
  }));
}

// eslint-disable-next-line no-unused-vars
type CommandCallback = (cmd: string, data: unknown) => unknown;

export async function redisListen(service: string, cb: CommandCallback) {
  await initRedis();
  const key = `command:${service}`;
  const rep = await redisBlockClient.blPop(key, 0);
  const data = JSON.parse(rep.element);
  const result = await cb(data.cmd, data.data);
  if (data.request && data.origin) {
    redisPublish(data.origin, JSON.stringify({ data: result, request: data.request }));
  }
  redisListen(service, cb);
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

function itemsFromObject(obj: any): Record<string, string> {
  const result = {};
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
      result[key] = valueStr;
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

function objectTypeCorrection(obj: any): any {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    // eslint-disable-next-line no-restricted-globals
    obj[k] = (isNaN(v as any)) ? v : parseFloat(v);
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

export async function redisHSet(key: string, data: any, ttl: number) {
  await initRedis();
  const items = keysFromObject(data);
  return redisClient.multi().hSet(
      key, items,
    ).expire(key, ttl).exec();
}

export async function redisHGetM(key: string, items: string[]): Promise<any> {
  await initRedis();
  const result = await redisClient.hmGet(key, items);
  return objectFromValues(items, result);
}

export async function redisSendEvent<T extends Event>(event: T) {
  await initRedis();
  if (!event.body.operationId) {
    const opId = ALS.getStore() || new Map<string, string>();
    if (!opId.has('operationId')) {
      opId.set('operationId', uuidv4());
    }
    // eslint-disable-next-line no-param-reassign
    event.body.operationId = opId.get('operationId');
    // eslint-disable-next-line no-param-reassign
    event.body.userId = opId.get('userId');
    // eslint-disable-next-line no-param-reassign
    event.body.sessionId = opId.get('sessionId');
    // eslint-disable-next-line no-param-reassign
    event.body.clientId = opId.get('clientId');
  }
  const items = itemsFromObject(event.body);
  if (!redisClient.xAdd) return;
  return redisClient.xAdd(event.event, '*', items, {
    TRIM: {
      strategy: 'MAXLEN',
      strategyModifier: '~',
      threshold: 1000,
      limit: 1000,
  }});
}

const streamKeys = new Set<string>();
let streamListen = false;
// eslint-disable-next-line no-unused-vars
type StreamCallback<T extends BaseEventBody> = (data: T, id: string) => Promise<void>;
const streamCallbacks = new Map<string, StreamCallback<BaseEventBody>>();
let consumerGroup = null;
let consumerId = null;
const readyStreams = new Set<string>();
const streamIds = new Map<string, string>();

export function redisSetGroup(group: string) {
  consumerGroup = group;
}

export async function redisCreateGroup(stream: string) {
  await initRedis();
  try {
    await redisClient.xGroupCreate(stream, consumerGroup, '$', { MKSTREAM: true });
  } catch(e) {}
}

export function redisSetStreamCallback<T extends Event>(key: T['event'], cb: StreamCallback<T['body']>) {
  streamCallbacks.set(key, cb);
  streamKeys.add(key);
  return redisCreateGroup(key);
}

export function redisConsumerGroup() {
  return consumerGroup || '';
}

export function redisConsumerId() {
  let name: string;
  if (consumerId) {
    name = consumerId;
  } else {
    if (fs.existsSync('/tmp/serviceid')) {
      name = fs.readFileSync('/tmp/serviceid', 'utf8');
    } else {
      name = uuidv4();
      fs.writeFileSync('/tmp/serviceid', name);
    }
    consumerId = name;
  }

  return name;
}

export async function redisStreamListen(optName?: string, newKeys?: string[]) {
  let name = optName;

  if (!name) {
    name = redisConsumerId();
  }
  await initRedis();

  if (Array.isArray(newKeys)) {
    newKeys.forEach((k) => streamKeys.add(k));
  }

  if (streamListen) {
    return;
  }
  streamListen = true;

  const keys = Array.from(streamKeys);

  if (keys.length === 0) {
    return;
  }

  if (!consumerGroup || !name) {
    const pairs = keys.map((v) => ({ key: v, id: (streamIds.has(v)) ? streamIds.get(v) : '$'}));
    const rep = await redisBlockClient.xRead(pairs, { BLOCK: 60000 });

    if (Array.isArray(rep)) {
      for (const stream of rep) {
        const streamName = stream.name;

        for (const msg of stream.messages) {
          streamIds.set(streamName, msg.id);
          if (streamCallbacks.has(streamName)) {
            const obj = objectTypeCorrection(msg.message) as unknown as BaseEventBody;

            if (obj.operationId) {
              const state = new Map<string, string>();
              state.set('operationId', obj.operationId);
              if (obj.userId) state.set('userId', obj.userId);
              if (obj.sessionId) state.set('sessionId', obj.sessionId);
              if (obj.clientId) state.set('clientId', obj.clientId);
              // eslint-disable-next-line no-loop-func
              ALS.run(state, () => {
                // eslint-disable-next-line no-loop-func
                streamCallbacks.get(streamName)(obj, msg.id).catch((e) => {
                  $log.error('Stream callback error', e);
                });
              });
            } else {
              // eslint-disable-next-line no-loop-func
              streamCallbacks.get(streamName)(obj, msg.id).catch((e) => {
                $log.error('Stream callback error', e);
              });
            }
          }
        }
      }
    }
    streamListen = false;
    redisStreamListen(name);
  } else {
    const pairs = keys.map((v) => ({ key: v, id: (readyStreams.has(v)) ? '>' : '0'}));
    const rep = await redisBlockClient.xReadGroup(consumerGroup, name, pairs, {
      BLOCK: 20000,
    });

    if (Array.isArray(rep)) {
      for (const stream of rep) {
        const streamName = (typeof stream.name === 'string') ? stream.name : stream.name.toString('utf8');

        if (stream.messages.length === 0) {
          readyStreams.add(streamName);
        }

        for (const msg of stream.messages) {
          if (streamCallbacks.has(streamName)) {
            const msgId = (typeof msg.id === 'string') ? msg.id : msg.id.toString('utf8');
            const obj = objectTypeCorrection(msg.message) as unknown as BaseEventBody;

            if (obj.operationId) {
              const state = new Map<string, string>();
              state.set('operationId', obj.operationId);
              if (obj.userId) state.set('userId', obj.userId);
              if (obj.sessionId) state.set('sessionId', obj.sessionId);
              if (obj.clientId) state.set('clientId', obj.clientId);
              // eslint-disable-next-line no-loop-func
              ALS.run(state, () => {
                // eslint-disable-next-line no-loop-func
                streamCallbacks.get(streamName)(obj, msgId).then(() => {
                  return redisClient.xAck(streamName, consumerGroup, msg.id);
                }).catch((e) => {
                  $log.error('Stream callback error', e);
                });
              });
            } else {
              // eslint-disable-next-line no-loop-func
              streamCallbacks.get(streamName)(obj, msgId).then(() => {
                return redisClient.xAck(streamName, consumerGroup, msg.id);
              }).catch((e) => {
                $log.error('Stream callback error', e);
              });
            }
          }
        }
      }
    }
    streamListen = false;
    redisStreamListen(name);
  }
}
