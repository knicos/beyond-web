import { Peer } from '@ftl/protocol';
import { redisAddItem, redisRemoveItem, redisTopItems } from '@ftl/common';
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
      outputStreams.set(p.string_id, new OutputStream(parsedURI, p));
    }

    return [Peer.uuid];
  }

  console.log('Stream not found: ', uri)
  return null;
}

export function removeStreams(peer: Peer) {
  if (outputStreams.has(peer.string_id)) {
    const os = outputStreams.get(peer.string_id);
    os.destroy();
    outputStreams.delete(peer.string_id);
  }
  const puris = peerUris.get(peer.string_id);
  if (puris) {
    for (let i = 0; i < puris.length; i++) {
      console.log('Removing stream: ', puris[i]);
      redisRemoveItem('activestreams', puris[i]);

      sendStreamUpdateEvent({
        event: 'stop',
        id: puris[i],
      });

      uriToPeer.delete(puris[i]);
      if (inputStreams.has(puris[i])) {
        inputStreams.get(puris[i]).destroy();
        inputStreams.delete(puris[i]);
      }
    }
    peerUris.delete(peer.string_id);
  }
}

export function createStream(peer: Peer, uri: string) {
  const parsedURI = removeQueryString(uri)
  console.log('Adding stream: ', uri);
  peerUris.get(peer.string_id).push(parsedURI);
  uriToPeer.set(parsedURI, peer);
  inputStreams.set(parsedURI, new InputStream(uri, peer));
  redisAddItem('streams', uri, Date.now());
  redisAddItem('activestreams', parsedURI, Date.now());

  sendStreamUpdateEvent({
    event: 'start',
    id: parsedURI,
    name: parsedURI,
    node: peer.uri,
  });
}

export function checkStreams(peer: Peer) {
  if (!peerUris.has(peer.string_id)) {
    peerUris.set(peer.string_id, []);
  }

  if (!peer.master) {
    setTimeout(() => {
      peer.rpc('list_streams', (streams: string[]) => {
        for (let i = 0; i < streams.length; i++) {
          createStream(peer, streams[i]);
        }
      });
    }, 500); // Give a delay to allow startup
  }
}
