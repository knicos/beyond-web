/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
import { Peer } from '@beyond/protocol';
import { AccessToken } from '@ftl/types';
import { $log } from '@tsed/logger';
import { redisSetStreamCallback, redisSendEvent } from '@ftl/common';
import { RecordingEventBody } from '@ftl/api';
import {
  removeStreams, getStreams, bindToStream, createStream,
} from './streams';

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
    for (const x in peerById.keys()) {
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
            bufferSize: stats.txRequested,
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

  p.on('connect', async (peer) => {
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
    $log.info('Peer name = ', peer.name);
    $log.info('Details: ', details);
    redisSendEvent({
      event: 'events:node',
      body: {
        operation: 'connect',
        id: obj.id,
        name: obj.title,
        kind: obj.kind,
        devices: obj.devices || [],
        ip: address,
        clientId: token.client?.id || '',
        userId: token.user?.id,
        ephemeral,
        groups: token.groups || [],
        serviceId: '', // TODO
      },
    });
  });

  p.on('disconnect', (peer) => {
    $log.info('DISCONNECT', peer.string_id);
    // Remove all peer details and streams....

    redisSendEvent({
      event: 'events:node',
      body: {
        operation: 'disconnect',
        id: peer.uri,
      },
    });

    removeStreams(peer);
    if (peerById.has(peer.string_id)) peerById.delete(peer.string_id);
    if (peerSerial.has(peer.uri)) peerSerial.delete(peer.uri);
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
    return bindToStream(p, uri);
  });

  /** @deprecated */
  p.bind('get_cfg', () => '{}')

  /** @deprecated */
  p.bind('update_cfg', () => '{}')

  // Register a new stream
  p.bind('add_stream', (uri: string) => {
    // TODO: Authorise this by checking group membership
    // It should also validate the URI.
    createStream(p, uri, 255, 255);
    $log.info('Add stream', uri);
  });

  // TODO: Authorise this by checking group membership
  /** Allow this node to receive specific stream data */
  // eslint-disable-next-line no-unused-vars
  p.bind('enable_stream', (uri: string, frameset: number, frame: number) => bindToStream(p, uri));

  // eslint-disable-next-line no-unused-vars
  p.bind('disable_stream', (uri: string, frameset: number, frame: number) => true);

  p.bind('create_stream', (uri: string, frameset: number, frame: number) => {
    // TODO: Authorise this by checking group membership
    // It should also validate the URI.
    $log.info('Create stream', uri);
    createStream(p, uri, frameset, frame);
  });

  p.bind('error', (message: string) => {
    redisSendEvent({
      event: 'events:node:log',
      body: {
        id: p.uri,
        level: 2,
        timestamp: Date.now(),
        message: `Connection error: ${message}`,
      },
    });
  });

  return p;
}

// eslint-disable-next-line no-unused-vars
function broadcastEvent(name: string, owner?: string, groups?: string[]) {
  peerData.forEach((peer) => {
    peer.send('event', name);
  });
}

redisSetStreamCallback('events:recording', (data: RecordingEventBody) => {
  switch (data.event) {
    case 'start': broadcastEvent('recording.start', data.owner); break;
    case 'complete': broadcastEvent('recording.complete', data.owner); break;
    case 'cancel': broadcastEvent('recording.cancel', data.owner); break;
    default:
  }
});
