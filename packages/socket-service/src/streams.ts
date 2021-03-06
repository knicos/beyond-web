import { Peer } from '@beyond/protocol';
import {
  redisAddItem, redisRemoveItem, redisTopItems,
} from '@ftl/common';
import { sendStreamUpdateEvent } from '@ftl/api';
import InputStream from './InputStream';
import OutputStream from './OutputStream';

const peerUris = new Map<string, string[]>();
const uriToPeer = new Map<string, Peer>();
const inputStreams = new Map<string, InputStream>();
const outputStreams = new Map<string, OutputStream>();

/**
 * Returns the first part of the URI
 * e.g. ftl://utu.fi or ftl://something.fi
 * @param {uri} uri
 */
function removeQueryString(uri: string): string {
  const ix = uri.indexOf('?');
  const baseUri = (ix >= 0) ? uri.substring(0, ix) : uri;
  return baseUri;
}

export async function getStreams(): Promise<string[]> {
  const streams = await redisTopItems('streams');
  const set = new Set<string>();
  const result = [];
  for (const s of streams.reverse()) {
    const uri = s.split('?')[0];
    if (!set.has(uri)) {
      result.push(s);
    }
    set.add(uri);
  }
  return result;
}

export async function getActiveStreams(): Promise<string[]> {
  return redisTopItems('activestreams');
}

export async function bindToStream(p: Peer, uri: string) {
  const parsedURI = removeQueryString(uri);
  const streams = await getActiveStreams();
  if (streams.some((s) => s === parsedURI)) {
    console.log('Stream found: ', uri, parsedURI);

    if (!p.isBound(parsedURI)) {
      console.log('Adding local stream binding: ', parsedURI);
      outputStreams.set(p.uri, new OutputStream(parsedURI, p));
    }

    return [Peer.uuid];
  }

  console.log('Stream not found: ', uri)
  return null;
}

export function removeStreams(peer: Peer) {
  if (outputStreams.has(peer.uri)) {
    const os = outputStreams.get(peer.uri);
    os.destroy();
    outputStreams.delete(peer.uri);
  }
  const puris = peerUris.get(peer.uri);
  if (puris) {
    for (let i = 0; i < puris.length; i++) {
      console.log('Removing stream: ', puris[i]);
      redisRemoveItem('activestreams', puris[i]);

      sendStreamUpdateEvent({
        event: 'stop',
        id: puris[i],
        framesetId: 255,
        frameId: 255,
      });

      uriToPeer.delete(puris[i]);
      if (inputStreams.has(puris[i])) {
        inputStreams.get(puris[i]).destroy();
        inputStreams.delete(puris[i]);
      }
    }
    peerUris.delete(peer.uri);
  }
}

export function initStream(peer: Peer, uri: string, framesetId: number, frameId: number): boolean {
  const parsedURI = removeQueryString(uri)

  if (inputStreams.has(uri)) {
    const is = inputStreams.get(uri);
    if (is.enabledFrames.has(`${framesetId}:${frameId}`)) {
      console.warn('Stream already exists', uri);
      return true;
    }
    is.enabledFrames.add(`${framesetId}:${frameId}`);
    return false;
  }

  console.log('Initiate stream: ', uri);
  const nodeCreated = uriToPeer.has(parsedURI);
  if (!peerUris.has(peer.uri)) {
    peerUris.set(peer.uri, []);
  }
  peerUris.get(peer.uri).push(parsedURI);
  uriToPeer.set(parsedURI, peer);
  const is = new InputStream(uri, peer);
  inputStreams.set(parsedURI, is);
  if (framesetId !== 255) {
    is.enabledFrames.add(`${framesetId}:${frameId}`);
  }
  redisAddItem('streams', uri, Date.now());
  redisAddItem('activestreams', parsedURI, Date.now());
  if (nodeCreated) {
    setTimeout(() => {
      is.startStream();
    }, 500);
  }
  return nodeCreated;
}

export function startStream(uri: string) {
  const parsedURI = removeQueryString(uri)

  if (!inputStreams.has(parsedURI)) {
    console.warn('Stream does not exist', uri);
    return;
  }

  inputStreams.get(parsedURI).startStream();
}

export function createStream(peer: Peer, uri: string, framesetId: number, frameId: number) {
  const parsedURI = removeQueryString(uri);
  uriToPeer.set(parsedURI, peer);
  initStream(peer, uri, framesetId, frameId);
  sendStreamUpdateEvent({
    event: 'start',
    id: parsedURI,
    name: parsedURI,
    node: peer.uri,
    framesetId,
    frameId,
  });
}

export function checkStreams(peer: Peer) {
  if (!peerUris.has(peer.uri)) {
    peerUris.set(peer.uri, []);
  }

  if (!peer.master) {
    setTimeout(async () => {
      const streams = await peer.rpc('list_streams') as string[];
      for (let i = 0; i < streams.length; i++) {
        createStream(peer, streams[i], 255, 255);
      }
    }, 500); // Give a delay to allow startup
  }
}
