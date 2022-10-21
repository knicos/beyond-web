import { Peer, getStreamFlags, getChannel } from '@beyond/protocol';
import { redisPublish, redisSubscribe, redisUnsubscribe } from '@ftl/common';
import { $log } from '@tsed/logger';
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

  private bitrateScale = 1.0;

  private lastBufferSize = 0;

  private bitrateCheck = 2000;

  constructor(uri, peer) {
    this.peer = peer;
    this.uri = uri;
    const ix = uri.indexOf('?');
    this.baseUri = (ix >= 0) ? uri.substring(0, ix) : uri;

    // Add RPC handler to receive frames from the source
    peer.bind(this.baseUri, (latency, spacket, packet) => {
      // eslint-disable-next-line no-bitwise
      if (getStreamFlags(spacket) & 0x01) {
        const c = getChannel(spacket);
        if (c === 0 || c === 1) {
          // eslint-disable-next-line no-param-reassign
          packet[3] = Math.floor(packet[3] * this.bitrateScale);
        }
      }
      // Forward frames to redis
      this.pushFrame(latency, spacket, packet);
    });

    const onMessage = (message) => {
      const args = decode(message);
      if (this.bitrateCheck <= 0 && this.peer.sendCount > this.lastBufferSize + 100) {
        this.lastBufferSize = this.peer.sendCount;
        $log.info('Peer is buffering: ', this.peer.sendCount);
        this.bitrateCheck = 500;
        this.bitrateScale *= 0.9;
      }
      --this.bitrateCheck;
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
