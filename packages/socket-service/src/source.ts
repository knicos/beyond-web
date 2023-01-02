/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
import { Peer } from '@beyond/protocol';
import { AccessToken } from '@ftl/types';
import {
  redisSetStreamCallback, redisSendEvent, redisSetGroup, ALS,
} from '@ftl/common';
import { RecordingEventBody } from '@ftl/api';
import { v4 as uuidv4 } from 'uuid';
import { $log } from '@tsed/logger';
import {
  removeStreams, getStreams, bindToStream, createStream,
} from './streams';
import { NodeLogger } from './logger';

redisSetGroup('socket-service');

const peerData = [];
const peerUris = {};
const peerById = new Map<string, Peer>();
const peerSerial = new Map<string, Peer>();

let timer: NodeJS.Timer = null;

export function clearTimer() {
  if (timer) timer.unref();
}

export function reset() {
  if (timer) {
    timer.unref();
  }
  timer = setInterval(async () => {
    for (const x of peerById.keys()) {
      const p = peerById.get(x);
      const start = (new Date()).getMilliseconds();
      p.rpc('__ping__').then(() => {
        const end = (new Date()).getMilliseconds();
        p.latency = (end - start) / 2;
        const stats = p.getStatistics();
        redisSendEvent({
          event: 'events:node:metric',
          body: {
            metric: 'summary',
            txTotal: stats.txTotal,
            rxTotal: stats.rxTotal,
            txRate: stats.txRate,
            rxRate: stats.rxRate,
            latency: p.latency,
            id: p.uri,
            bufferSize: stats.txRequested - stats.txBytes,
          },
        })
      });
    }
  }, 20000);
}

reset();

// eslint-disable-next-line import/prefer-default-export
export function createSource(ws, address: string, token: AccessToken, ephemeral: boolean) {
  const p = new Peer(ws, true);
  peerData.push(p);

  const sessionId = uuidv4();

  p.on('connect', async (peer) => {
    const state = new Map<string, string>();
    state.set('operationId', uuidv4());
    state.set('userId', token.user?.id);
    state.set('clientId', token.client?.id);
    state.set('sessionId', sessionId);
    ALS.run(state, async () => {
      $log.info('Node connected...', token, peer.string_id);
      peerUris[peer.string_id] = [];
      peerById.set(peer.string_id, peer);

      const details = await peer.rpc('node_details');

      const obj = JSON.parse(details[0]);
      peerSerial.set(obj.id, peer);

      peer.uri = obj.id;
      peer.name = obj.title;
      peer.clientId = token.client?.id;
      peer.master = (obj.kind === 'master');
      NodeLogger.info(peer.string_id, 'Peer name = ', peer.name);
      NodeLogger.info(peer.string_id, 'Details: ', details);
      redisSendEvent({
        event: 'events:node',
        body: {
          operation: 'connect',
          id: obj.id,
          name: obj.title,
          kind: obj.kind,
          devices: obj.devices || [],
          ip: address,
          clientId: token.client?.id,
          ephemeral,
          groups: token.groups || [],
          serviceId: '', // TODO
        },
      });
    });
  });

  p.on('disconnect', (peer) => {
    const state = new Map<string, string>();
    state.set('operationId', uuidv4());
    state.set('userId', token.user?.id);
    state.set('clientId', token.client?.id);
    state.set('sessionId', sessionId);
    ALS.run(state, async () => {
      NodeLogger.info(peer.string_id, 'Disconnect');
      // Remove all peer details and streams....

      redisSendEvent({
        event: 'events:node',
        body: {
          operation: 'disconnect',
          id: p.string_id,
        },
      });

      removeStreams(peer);
      if (peerById.has(peer.string_id)) peerById.delete(peer.string_id);
      if (peerSerial.has(peer.uri)) peerSerial.delete(peer.uri);
    });
  });

  p.bind('new_peer', () => {
    // checkStreams(p);
  });

  // Used to sync clocks
  p.bind('__ping__', () => Date.now());

  p.bind('node_details', () => [`{"title": "FTL Web-Service", "id": "${p.getUuid()}", "kind": "master"}`]);

  p.bind('list_streams', () => getStreams());

  /** @deprecated */
  p.bind('list_configurables', () => []);

  /** @deprecated */
  p.proxy('get_configurable', () => '{}');

  /* Unused by new protocol */
  p.bind('find_stream', (uri: string, proxy) => {
    if (!proxy) return null;
    return new Promise((resolve) => {
      const state = new Map<string, string>();
      state.set('operationId', uuidv4());
      state.set('userId', token.user?.id);
      state.set('clientId', token.client?.id);
      state.set('sessionId', sessionId);
      ALS.run(state, () => {
        NodeLogger.info(p.string_id, 'Find stream', uri);
        bindToStream(p, uri).then(resolve);
      });
    });
  });

  /** @deprecated */
  p.bind('get_cfg', () => '{}')

  /** @deprecated */
  p.bind('update_cfg', () => '{}')

  // Register a new stream
  p.bind('add_stream', (uri: string) => {
    const state = new Map<string, string>();
    state.set('operationId', uuidv4());
    state.set('userId', token.user?.id);
    state.set('clientId', token.client?.id);
    state.set('sessionId', sessionId);
    // TODO: Authorise this by checking group membership
    // It should also validate the URI.
    ALS.run(state, () => {
      NodeLogger.info(p.string_id, 'Add stream', uri);
      createStream(p, uri, 255, 255);
    });
  });

  // TODO: Authorise this by checking group membership
  /** Allow this node to receive specific stream data */
  p.bind('enable_stream', (uri: string, frameset: number, frame: number) => new Promise((resolve) => {
    const state = new Map<string, string>();
    state.set('operationId', uuidv4());
    state.set('userId', token.user?.id);
    state.set('clientId', token.client?.id);
    state.set('sessionId', sessionId);
    ALS.run(state, () => {
      NodeLogger.info(p.string_id, 'Enable stream', uri, frameset, frame);
      bindToStream(p, uri).then(resolve);
    });
  }));

  // eslint-disable-next-line no-unused-vars
  p.bind('disable_stream', (uri: string, frameset: number, frame: number) => true);

  p.bind('create_stream', (uri: string, frameset: number, frame: number) => {
    const state = new Map<string, string>();
    state.set('operationId', uuidv4());
    state.set('userId', token.user?.id);
    state.set('clientId', token.client?.id);
    state.set('sessionId', sessionId);
    // TODO: Authorise this by checking group membership
    // It should also validate the URI.
    ALS.run(state, () => {
      NodeLogger.info(p.string_id, 'Create stream', uri);
      createStream(p, uri, frameset, frame);
    });
  });

  p.bind('error', (message: string) => {
    NodeLogger.error(p.string_id, 'Node error', message);
  });

  return p;
}

// eslint-disable-next-line no-unused-vars
function broadcastEvent(name: string, owner?: string, groups?: string[]) {
  peerData.forEach((peer) => {
    peer.send('event', name);
  });
}

redisSetStreamCallback('events:recording', async (data: RecordingEventBody) => {
  switch (data.event) {
    case 'start': broadcastEvent('recording.start', data.owner); break;
    case 'complete': broadcastEvent('recording.complete', data.owner); break;
    case 'cancel': broadcastEvent('recording.cancel', data.owner); break;
    default:
  }
});
