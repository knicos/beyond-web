/* eslint-disable no-prototype-builtins */
/* eslint-disable no-param-reassign */
import { Peer } from '@beyond/protocol';
import { AccessToken } from '@ftl/types';
import { redisSetStreamCallback } from '@ftl/common';
import { sendNodeUpdateEvent, sendNodeStatsEvent, RecordingEvent } from '@ftl/api';
import {
  removeStreams, getStreams, bindToStream, createStream,
} from './streams';

const peerData = [];
const peerUris = {};
const peerById = {};
const peerSerial = new Map<string, Peer>();

setInterval(async () => {
  for (const x in peerById) {
    const p = peerById[x];
    const start = (new Date()).getMilliseconds();
    p.rpc('__ping__').then((ts: number) => {
      const end = (new Date()).getMilliseconds();
      p.latency = (end - start) / 2;
      const [ms, rx, tx] = p.getStatistics();
      sendNodeStatsEvent({
        event: 'ping',
        id: p.uri,
        latency: p.latency,
        timestamp: ts,
        clientId: p.clientId,
        rxRate: Math.floor(rx / (ms / 1000)),
        txRate: Math.floor(tx / (ms / 1000)),
      });
    });
  }
}, 20000);

// eslint-disable-next-line import/prefer-default-export
export function createSource(ws, address: string, token: AccessToken, ephemeral: boolean) {
  const p = new Peer(ws, true);
  peerData.push(p);

  p.on('connect', async (peer) => {
    console.log('Node connected...', token, peer.string_id);
    peerUris[peer.string_id] = [];
    peerById[peer.string_id] = peer;

    const details = await peer.rpc('node_details');

    const obj = JSON.parse(details[0]);
    peerSerial.set(obj.id, peer);

    peer.uri = obj.id;
    peer.name = obj.title;
    peer.clientId = token.client?.id;
    peer.master = (obj.kind === 'master');
    console.log('Peer name = ', peer.name);
    console.log('Details: ', details);
    sendNodeUpdateEvent({
      event: 'connect',
      id: obj.id,
      name: obj.title,
      kind: obj.kind,
      devices: obj.devices,
      ip: address,
      clientId: token.client?.id,
      userId: token.user?.id,
      ephemeral: ephemeral ? 'yes' : undefined,
      groups: token.groups || [],
    });
  });

  p.on('disconnect', (peer) => {
    console.log('DISCONNECT', peer.string_id);
    // Remove all peer details and streams....

    sendNodeUpdateEvent({
      event: 'disconnect',
      id: peer.uri,
    });

    if (peer.status !== 2) return;

    removeStreams(peer);
    if (peerById.hasOwnProperty(peer.string_id)) delete peerById[peer.string_id];
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
    createStream(p, uri, frameset, frame);
  });

  p.bind('error', (message: string) => {
    sendNodeUpdateEvent({
      event: 'error',
      id: p.uri,
      message,
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

redisSetStreamCallback('event:recording', (key: string, data: RecordingEvent) => {
  switch (data.event) {
    case 'start': broadcastEvent('recording.start', data.owner); break;
    case 'complete': broadcastEvent('recording.complete', data.owner); break;
    case 'cancel': broadcastEvent('recording.cancel', data.owner); break;
    default:
  }
});
