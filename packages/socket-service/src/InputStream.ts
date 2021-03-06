import { DataPacket, Peer, StreamPacket } from '@beyond/protocol';
import { redisPublish, redisSubscribe, redisUnsubscribe } from '@ftl/common';
import { sendConfigCommand, sendStreamDataEvent, sendStreamUpdateEvent } from '@ftl/api';
import { recordLatency } from './latencyManager';

const { encode, decode } = require('msgpack5')();

export default class InputStream {
  uri: string;

  baseUri: string;

  peer: Peer;

  title = '';

  rxcount = 10;

  rxmax = 10;

  data = {};

  onMessage: Function;

  lastTS = 0;

  enabledFrames = new Set<string>();

  seenFrames = new Set<string>();

  constructor(uri: string, peer: Peer) {
    this.peer = peer;
    this.uri = uri;
    const ix = uri.indexOf('?');
    this.baseUri = (ix >= 0) ? uri.substring(0, ix) : uri;

    // Add RPC handler to receive frames from the source
    peer.bind(this.baseUri, (latency: number, spacket: StreamPacket, packet: DataPacket) => {
      const code = recordLatency(latency);
      this.parseFrame(spacket, packet);
      this.pushFrame(code, spacket, packet);
      // console.log('Got packet', spacket[0], spacket[1], spacket[2], spacket[3]);
    });

    this.onMessage = (message) => {
      const args = decode(message);
      this.peer.send(this.baseUri, ...args);
    }
    redisSubscribe(`stream-out:${this.baseUri}`, this.onMessage);
  }

  startStream() {
    this.peer.send(this.baseUri, 0, [1, 255, 255, 74, 5], [7, 0, 10, 255, 0, new Uint8Array(0)]);
    console.log('Sent start request', this.peer.string_id);
    this.sendEvent('started');
  }

  private parseFrame(spacket: StreamPacket, packet: DataPacket) {
    const [ts, fsId, fId, channel] = spacket;
    this.lastTS = Math.max(this.lastTS, ts);

    const frameStr = `${fsId}-${fId}`;
    if (!this.seenFrames.has(frameStr)) {
      this.seenFrames.add(frameStr);
      sendStreamUpdateEvent({
        event: 'start',
        id: this.baseUri,
        name: this.baseUri,
        node: this.peer.uri,
        framesetId: fsId,
        frameId: fId,
      });
    }

    // MsgPack encoded data channel?
    if (channel >= 64 && packet[5].length > 0 && packet[0] === 103) {
      const decoded = decode(packet[5]);

      if (channel === 69) {
        if (decoded[0] === 'save_data') {
          sendStreamDataEvent({
            id: this.baseUri,
            event: 'request',
            data: this.data,
            framesetId: fsId,
            frameId: fId,
          });
        } else if (decoded[0] === 'restore_data') {
          sendConfigCommand({
            id: this.baseUri,
            cmd: 'restore',
            framesetId: fsId,
            frameId: fId,
          });
        }
      } else {
        // Thumbnail
        if (channel === 74) {
          sendStreamDataEvent({
            id: this.baseUri,
            event: 'thumbnail',
            data: decode(packet[5]).toString('base64'),
            framesetId: fsId,
            frameId: fId,
          });
        } else if (channel === 71) {
          sendStreamDataEvent({
            id: this.baseUri,
            event: 'metadata',
            data: decode(packet[5]),
            framesetId: fsId,
            frameId: fId,
          });
        }
        this.data[channel] = decoded;
      }
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
    redisUnsubscribe(`stream-out:${this.baseUri}`, this.onMessage);
  }
}
