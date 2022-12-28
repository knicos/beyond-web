import { Peer } from '@beyond/protocol';
import { redisPublish, redisSendEvent, redisSubscribe } from '@ftl/common';
import InputStream from '../src/InputStream';

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
}));
jest.mock('@beyond/protocol');

describe('Input Stream unit test', () => {
  it('binds and subscribes correctly', async () => {
    const p = new Peer();
    const is = new InputStream('ftl://test', p);
    expect(is).toBeTruthy();
    expect(p.bind).toHaveBeenCalledWith('ftl://test', expect.any(Function));
  });

  it('sends a message from redis', async () => {
    const p = new Peer();
    const is = new InputStream('ftl://test', p);
    expect(is).toBeTruthy();

    const msg = encode([0, [0, 0, 0, 0, 0], [0, 0, 0, 0, []]]);
    await redisPublish('stream-out:ftl://test', msg);
    expect(p.send).toHaveBeenCalledWith('ftl://test', 0, [0, 0, 0, 0, 0], [0, 0, 0, 0, []]);
  });

  it('sends a message to redis', async () => {
    const p = new Peer();

    p.bind = (x, y) => {
      if (!p.bindings) p.bindings = {};
      p.bindings[x] = y;
    }

    const is = new InputStream('ftl://test', p);
    expect(is).toBeTruthy();

    const promise = new Promise<string>((resolve) => {
      redisSubscribe('stream-in:ftl://test', (data: string) => {
        resolve(data);
      });
    });

    p.bindings['ftl://test'](0, [0, 0, 0, 0, 0], [0, 0, 0, 0, []]);

    const result = await promise;
    const dresult = decode(result);
    expect(dresult).toEqual(['latency:0', [0, 0, 0, 0, 0], [0, 0, 0, 0, []]]);
    expect(redisSendEvent).toHaveBeenCalledWith({ event: 'events:stream', body: expect.any(Object) });
  });

  it('extracts data channels', async () => {
    const p = new Peer();

    p.bind = (x, y) => {
      if (!p.bindings) p.bindings = {};
      p.bindings[x] = y;
    }

    const is = new InputStream('ftl://test', p);
    expect(is).toBeTruthy();

    p.bindings['ftl://test'](0, [0, 0, 0, 74, 0], [103, 0, 0, 0, 0, encode('hello')]);

    expect(is.data[74]).toBe('hello');
    expect(redisSendEvent).toHaveBeenCalledWith({ event: 'events:stream', body: expect.any(Object) });
  });
});
