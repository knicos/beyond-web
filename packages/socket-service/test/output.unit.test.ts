import { Peer } from '@beyond/protocol';
import { redisPublish, redisSubscribe } from '@ftl/common';
import OutputStream from '../src/OutputStream';

const { encode, decode } = require('msgpack5')();

const mockRedisState = {
  subscriptions: new Map<string, Function>(),
};

jest.mock('@ftl/common', () => ({
  redisPublish: (uri: string, data: Buffer) => {
    const cb = mockRedisState.subscriptions.get(uri);
    if (cb !== undefined) cb(data);
  },
  redisSubscribe: (uri: string, cb: Function) => {
    mockRedisState.subscriptions.set(uri, cb);
  },
  redisSendEvent: jest.fn(),
  RedisLogger: jest.fn().mockImplementation(() => ({
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  })),
  redisSetGroup: jest.fn(),
  redisConsumerId: jest.fn(),
  redisConsumerGroup: jest.fn(),
  ALS: {
    run: (a, b) => b(),
    getStore: () => new Map<string, string>(),
  },
}));
jest.mock('@beyond/protocol');

describe('Output Stream unit test', () => {
  it('binds and subscribes correctly', async () => {
    const p = new Peer();
    const os = new OutputStream('ftl://test', p);
    expect(os).toBeTruthy();
    expect(p.bind).toHaveBeenCalledWith('ftl://test', expect.any(Function));
  });

  it('sends a message from redis', async () => {
    const p = new Peer();
    const os = new OutputStream('ftl://test', p);
    expect(os).toBeTruthy();

    const msg = encode([0, [0, 0, 0, 0, 0], [0, 0, 0, 0, []]]);
    await redisPublish('stream-in:ftl://test', msg);
    expect(p.send).toHaveBeenCalledWith('ftl://test', 0, [0, 0, 0, 0, 0], [0, 0, 0, 0, []]);
  });

  it('sends a message to redis', async () => {
    const p = new Peer();

    p.bind = (x, y) => {
      if (!p.bindings) p.bindings = {};
      p.bindings[x] = y;
    }

    const os = new OutputStream('ftl://test', p);
    expect(os).toBeTruthy();

    const promise = new Promise<string>((resolve) => {
      redisSubscribe('stream-out:ftl://test', (data: string) => {
        resolve(data);
      });
    });

    p.bindings['ftl://test'](0, [0, 0, 0, 0, 0], [0, 0, 0, 0, []]);

    const result = await promise;
    const dresult = decode(result);
    expect(dresult).toEqual([0, [0, 0, 0, 0, 0], [0, 0, 0, 0, []]]);
  });
});
