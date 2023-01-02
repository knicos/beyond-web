import { Server } from 'http';
import WebSocket from 'ws';
import { Peer } from '@beyond/protocol';
import { AsyncLocalStorage } from 'async_hooks';
import { redisAddItem, redisPublish, redisSendEvent } from '@ftl/common';
import app from '../src/app';
import { clearTimer } from '../src/source';

const { encode } = require('msgpack5')();

const mockRedisState = {
  subscriptions: new Map<string, Function>(),
  items: new Map<string, Set<string>>(),
};

type IPacketPair = [Array<number>, Array<number>];

jest.mock('@ftl/common', () => ({
  redisPublish: (uri: string, data: Buffer) => {
    const cb = mockRedisState.subscriptions.get(uri);
    if (cb !== undefined) cb(data);
  },
  redisSubscribe: (uri: string, cb: Function) => {
    mockRedisState.subscriptions.set(uri, cb);
  },
  redisSetGroup: jest.fn(),
  redisConsumerId: jest.fn(),
  redisConsumerGroup: jest.fn(),
  redisSendEvent: jest.fn(),
  redisSetStreamCallback: jest.fn(),
  redisStreamListen: jest.fn(),
  redisAddItem: jest.fn((key: string, value: string) => {
    if (mockRedisState.items.has(key) === false) {
      mockRedisState.items.set(key, new Set<string>());
    }
    const set = mockRedisState.items.get(key);
    if (set) set.add(value);
  }),
  redisTopItems: jest.fn((key: string) => {
    const set = mockRedisState.items.get(key);
    return (set) ? Array.from(set) : [];
  }),
  redisRemoveItem: jest.fn(),
  redisUnsubscribe: jest.fn(),
  RedisLogger: jest.fn().mockImplementation(() => ({
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  })),
  ALS: new AsyncLocalStorage<Map<string, string>>(),
}));

describe('Socket-service integration test', () => {
  beforeAll(() => {
    process.env.FTL_SOCKET_NOAUTH = 'true';
  });

  afterAll(() => {
    clearTimer();
  });

  let server: Server;
  beforeEach(async () => {
    server = app.listen(8081);
    mockRedisState.subscriptions.clear();
    mockRedisState.items.clear();
  });

  afterEach(async () => new Promise((resolve) => server.close(resolve)));

  describe('connection handshake', () => {
    it('provides node details', async () => {
      const ws = new WebSocket('ws://localhost:8081/v1/socket');
      const peer = new Peer(ws, false);
      peer.bind('node_details', () => [`{"title": "Test", "id": "${peer.getUuid()}", "kind": "master"}`]);
      await new Promise((resolve) => peer.on('connect', resolve));

      const details = (await peer.rpc('node_details')) as string[];
      expect(details).toHaveLength(1);

      const detailsP = JSON.parse(details[0]);
      expect(detailsP.title).toBe('FTL Web-Service');

      ws.close();

      await new Promise((resolve) => peer.on('disconnect', resolve));
    });
  });

  describe('Input Stream', () => {
    it('can create a new input stream', async () => {
      const ws = new WebSocket('ws://localhost:8081/v1/socket');
      const peer = new Peer(ws, false);
      peer.bind('node_details', () => [`{"title": "Test", "id": "${peer.getUuid()}", "kind": "master"}`]);
      await new Promise((resolve) => peer.on('connect', resolve));

      const receivedData: IPacketPair[] = [];

      peer.bind('ftl://test', (latency, spacket, dpacket) => {
        receivedData.push([spacket as number[], dpacket as number[]]);
        peer.send('ftl://test', 0, [0, 0, 0, 0, 0], [0, 0, 0, 0, new Uint8Array(0)]);
      });

      await peer.rpc('create_stream', 'ftl://test', 0, 0);

      expect(receivedData.length).toBeGreaterThan(0);
      expect(receivedData[0][0][4]).toBe(5);

      expect(redisAddItem).toHaveBeenCalledWith('streams', 'ftl://test', expect.any(Number));
      expect(redisAddItem).toHaveBeenCalledWith('activestreams', 'ftl://test', expect.any(Number));
      expect(redisSendEvent).toHaveBeenCalledWith({ event: 'events:stream', body: expect.any(Object) });

      ws.close();

      await new Promise((resolve) => peer.on('disconnect', resolve));
    });
  });

  describe('Output Stream', () => {
    it('can enable an output stream', async () => {
      const ws = new WebSocket('ws://localhost:8081/v1/socket');
      const peer = new Peer(ws, false);
      peer.bind('node_details', () => [`{"title": "Test", "id": "${peer.getUuid()}", "kind": "master"}`]);
      await new Promise((resolve) => peer.on('connect', resolve));

      const receivedData: IPacketPair[] = [];

      const dataPromise = new Promise((resolve) => {
        peer.bind('ftl://test', (latency, spacket, dpacket) => {
          receivedData.push([spacket as number[], dpacket as number[]]);
          resolve(true);
        });
      });

      mockRedisState.items.set('activestreams', new Set<string>(['ftl://test']));

      await peer.rpc('enable_stream', 'ftl://test', 0, 0);

      expect(mockRedisState.subscriptions.has('ftl://test'));

      await redisPublish('stream-in:ftl://test', encode(['latency:0', [102, 0, 0, 0, 0], [0, 0, 0, 0, new Uint8Array(0)]]));

      expect(await dataPromise).toBe(true);

      expect(receivedData.length).toBeGreaterThan(0);
      expect(receivedData[0][0][0]).toBe(102);

      ws.close();

      await new Promise((resolve) => peer.on('disconnect', resolve));
    });
  });
});
