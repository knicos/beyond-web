import { Peer } from '@ftl/protocol';
import { redisPublish, redisSubscribe, redisUnsubscribe } from '@ftl/common';
import { getLatency } from './latencyManager';

const { encode, decode } = require('msgpack5')();

/**
 * Allow connected nodes to receive stream data from other streams.
 */
export default class OutputStream {
  readonly uri: string;

  private baseUri: string;

  private peer: Peer;

  private onMessage: Function;

  constructor(uri, peer) {
    this.peer = peer;
    this.uri = uri;
    const ix = uri.indexOf('?');
    this.baseUri = (ix >= 0) ? uri.substring(0, ix) : uri;

    // Add RPC handler to receive frames from the source
    peer.bind(this.baseUri, (latency, spacket, packet) => {
      // Forward frames to redis
      this.pushFrame(latency, spacket, packet);
    });

    const onMessage = (message) => {
      const args = decode(message);
      this.peer.send(this.baseUri, getLatency(args[0]), args[1], args[2]);
    };
    this.onMessage = onMessage;

    redisSubscribe(`stream-in:${this.baseUri}`, onMessage);
  }

  private pushFrame(latency: number, spacket: unknown, packet: unknown) {
    redisPublish(`stream-out:${this.baseUri}`, encode([latency, spacket, packet]));
  }

  destroy() {
    redisUnsubscribe(`stream-in:${this.baseUri}`, this.onMessage);
  }
}
