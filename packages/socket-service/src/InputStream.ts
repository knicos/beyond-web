import { DataPacket, Peer, StreamPacket } from '@beyond/protocol';
import {
  redisPublish, redisSendEvent, redisSubscribe, redisUnsubscribe,
} from '@ftl/common';
import { $log } from '@tsed/logger';
import { recordLatency } from './latencyManager';
import { StreamLogger } from './logger';

const { encode, decode } = require('msgpack5')();

export default class InputStream {
  uri: string;

  baseUri: string;

  peer: Peer;

  title = '';

  rxcount = 10;

  rxmax = 10;

  data = {};

  onMessage: (msg: Buffer) => void;

  lastTS = 0;

  enabledFrames = new Set<string>();

  seenFrames = new Set<string>();

  seenPacket = 0;

  starting = false;

  constructor(uri: string, peer: Peer) {
    this.peer = peer;
    this.uri = uri;
    const ix = uri.indexOf('?');
    this.baseUri = (ix >= 0) ? uri.substring(0, ix) : uri;

    // Add RPC handler to receive frames from the source
    peer.bind(this.baseUri, (latency: number, spacket: StreamPacket, packet: DataPacket) => {
      const code = recordLatency(latency);
      this.seenPacket = -1;
      this.parseFrame(spacket, packet);
      this.pushFrame(code, spacket, packet);
      // console.log('Got packet', spacket[0], spacket[1], spacket[2], spacket[3]);
    });

    this.onMessage = (message) => {
      const buf = (typeof message === 'string') ? new Uint8Array(JSON.parse(message).data) : message;
      const args = decode(buf);
      this.peer.send(this.baseUri, ...args);
    }
    redisSubscribe(`stream-out:${this.baseUri}`, this.onMessage);
  }

  startStream() {
    if (this.starting) return;
    this.starting = true;
    this.pstartStream();
  }

  private pstartStream() {
    if (this.seenPacket >= 0) {
      this.peer.send(this.baseUri, 0, [1, 255, 255, 74, 5], [7, 0, 10, 255, 0, new Uint8Array(0)]);
      StreamLogger.info(this.baseUri, 'Sent start request', this.peer.string_id, this.baseUri);
      if (this.seenPacket++ < 10) {
        setTimeout(() => {
          this.pstartStream();
        }, 500);
      }
    } else {
      StreamLogger.info(this.baseUri, 'Start request has worked');
      this.sendEvent('started');
    }
  }

  private parseFrame(spacket: StreamPacket, packet: DataPacket) {
    const [ts, fsId, fId, channel] = spacket;
    // if (ts < this.lastTS) {
    //   $log.warn('Out-of-order frames', ts, this.lastTS);
    // }
    this.lastTS = Math.max(this.lastTS, ts);

    const frameStr = `${fsId}-${fId}`;
    if (!this.seenFrames.has(frameStr)) {
      this.seenFrames.add(frameStr);
      redisSendEvent({
        event: 'events:stream',
        body: {
          operation: 'start',
          id: this.baseUri,
          node: this.peer.uri,
          framesetId: fsId,
          frameId: fId,
          owner: '',
          groups: [],
        },
      });
    }

    // MsgPack encoded data channel?
    if (channel >= 64 && packet[5].length > 0 && packet[0] === 103) {
      const decoded = decode(packet[5]);

      // TODO: Only send periodically, not for every data change

      // Thumbnail
      if (channel === 74) {
        redisSendEvent({
          event: 'events:stream:data',
          body: {
            id: this.baseUri,
            channel,
            value: decode(packet[5]).toString('base64'),
            framesetId: fsId,
            frameId: fId,
          },
        });
      } else {
        redisSendEvent({
          event: 'events:stream:data',
          body: {
            id: this.baseUri,
            channel,
            value: decode(packet[5]),
            framesetId: fsId,
            frameId: fId,
          },
        });
      }
      this.data[channel] = decoded;
    }
  }

  private pushFrame(latency: string, spacket: unknown, packet: unknown) {
    redisPublish(`stream-in:${this.baseUri}`, encode([latency, spacket, packet]));
  }

  sendEvent(name: string, ...args: any[]) {
    const spacket: StreamPacket = [this.lastTS, 255, 255, 69, 0];
    const packet: DataPacket = [0, 0, 0, 0, 0, encode([name, ...args])];
    redisPublish(`stream-in:${this.baseUri}`, encode([0, spacket, packet]));
  }

  destroy() {
    this.sendEvent('stopped');
    StreamLogger.info(this.baseUri, 'Stream stopped');
    redisUnsubscribe(`stream-out:${this.baseUri}`, this.onMessage);
  }
}
