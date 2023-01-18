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
  
      await tmpClient.connect();
      await redisSub.connect();
      await redisBlockClient.connect();
      redisClient = tmpClient;
      resolve();
    });

    return redisPromise;
  }
}

/**
 * Publish data to Redis. This is for a stream of unimportant data.
 * @param channel Redis key
 * @param data Some JSON object to send
 * @returns Status code
 */
export async function redisPublish(channel: string, data: unknown): Promise<number> {
  await initRedis();
  // Publish to redis
  return redisClient.publish(channel, data as string);
}

/**
 * Listen for published data at a particular key.
 * @param channel Redis key
 * @param cb Callback function for received data
 * @returns Promise
 */
export async function redisSubscribe(channel: string, cb: (msg: Buffer) => void) {
  await initRedis();

  const hasChannel = subscriptions.has(channel);

  if (!hasChannel) {
    subscriptions.add(channel);
    return redisSub.subscribe(channel, cb, true);
  }
}

/**
 * Remove a previous subscription.
 * @param channel Redis key
 * @param cb The original callback function
 * @returns Promise
 */
export async function redisUnsubscribe(channel: string, cb: (msg: Buffer) => void) {
  if (!subscriptions.has(channel)) {
    return;
  }

  subscriptions.delete(channel);
  await redisSub.unsubscribe(channel, cb, true);
}

/**
 * Set a value in the Redis key value database.
 * @param key Redis key
 * @param item Object to store at the key
 * @param time Time-To-Live in seconds
 * @returns Status
 */
export async function redisSet<T>(key: string, item: T, time?: number): Promise<string> {
  await initRedis();
  if (time) {
    await redisClient.multi().set(key, JSON.stringify(item)).expire(key, time).exec();
    return '';
  }

  return redisClient.set(key, JSON.stringify(item));
}

/**
 * Get a Redis value from the key value store.
 * @param key Redis key
 * @returns Object stored at that key.
 */
export async function redisGet<T>(key: string): Promise<T> {
  await initRedis();
  const result = await redisClient.get(key);
  return JSON.parse(result)
}

/**
 * Get multiple keys in one call.
 * @param keys Array of all keys
 * @returns Array of corresponding values
 */
export async function redisMGet<T>(keys: string[]): Promise<T[]> {
  await initRedis();
  const result = await redisClient.mGet(keys)
  return result.map((v) => JSON.parse(v));
}

/**
 * Remove a key/value entry from Redis
 * @param key Redis key
 * @returns Status
 */
export async function redisDelete(key: string): Promise<number> {
  await initRedis();
  return redisClient.del(key);
}

/**
 * Add an item to a sorted set in Redis
 * @param key Redis key
 * @param item Value to be added (uniquely)
 * @param time Timestamp or score to sort by
 * @returns Status
 */
export async function redisAddItem(key: string, item: string, time: number): Promise<number> {
  await initRedis();
  return redisClient.zAdd(key, { score: time, value: item });
}

/**
 * Remove an item from a Redis sorted set
 * @param key Redis key
 * @param item value of set item
 * @returns Status
 */
export async function redisRemoveItem(key: string, item: string): Promise<number> {
  await initRedis();
  return redisClient.zRem(key, item);
}

/**
 * Gets all items in the set that are less than 1 day old.
 * This should be modified to allow for custom time periods.
 * @param key Redis key for a set
 * @returns Array of selected items
 */
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

/**
 * Set multiple keys and values in a Redis hash structure
 * @param key Redis key for hash structure
 * @param data Object containing key/values
 * @param ttl TTL in seconds
 * @returns status
 */
export async function redisHSet(key: string, data: any, ttl: number) {
  await initRedis();
  const items = keysFromObject(data);
  return redisClient.multi().hSet(
    key, items,
  ).expire(key, ttl).exec();
}

/**
 * Get selected hash keys into an object.
 * @param key Redis key for hash structure
 * @param items Array of hash keys to get
 * @returns Value object
 */
export async function redisHGetM(key: string, items: string[]): Promise<any> {
  await initRedis();
  const result = await redisClient.hmGet(key, items);
  return objectFromValues(items, result);
}

/**
 * Send an event structure to the specified Redis stream. It will insert any missing ID information.
 * @param event Event name
 * @returns Promise
 */
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
  await redisClient.xAdd(event.event, '*', items, {
    TRIM: {
      strategy: 'MAXLEN',
      strategyModifier: '~',
      threshold: 1000,
      limit: 1000,
    },
  });
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

/**
 * Called once to set the name of the service
 * @param group Name of service
 */
export function redisSetGroup(group: string) {
  consumerGroup = group;
}

/**
 * Not to be used directly.
 * @param stream Stream key
 */
export async function redisCreateGroup(stream: string) {
  await initRedis();
  try {
    await redisClient.xGroupCreate(stream, consumerGroup, '$', { MKSTREAM: true });
  } catch (e) {}
}

/**
 * Add a callback for particular events
 * @param key Stream key
 * @param cb Callback function for events
 * @returns Promise
 */
export function redisSetStreamCallback<T extends Event>(key: T['event'], cb: StreamCallback<T['body']>) {
  streamCallbacks.set(key, cb);
  streamKeys.add(key);
  return redisCreateGroup(key);
}

/**
 * Get the previously set service name
 * @returns Service name
 */
export function redisConsumerGroup() {
  return consumerGroup || '';
}

/**
 * Get the service ID number
 * @returns UUID string
 */
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

/**
 * Start listening for all Redis streams for which we have set a callback.
 * This is the function which will actually call the correct callbacks when
 * an event occurs. It is a semi-blocking function in that it blocks until
 * an event occurs but then calls itself asynchronously to obtain the next
 * event.
 * @param optName Not needed
 * @param newKeys Not needed
 * @returns Promise
 */
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
