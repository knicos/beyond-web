import ee, {Emitter} from 'event-emitter';
import allOff from 'event-emitter/all-off';
import {Peer} from '@ftl/protocol';
import msgpack from 'msgpack5';
const {encode, decode} = msgpack();

interface IVideoState {
    rxcount: number;
    stream: number;
    frame: number;
    channel: number;
}

export interface FTLStream extends Emitter {};

export class FTLStream {
	peer: Peer;
  uri: string;
  paused = false;
  active = true;
  availableChannels = new Set<number>();
  availableSets = new Set<number>();
  availableSources = new Set<number>();
  enabledChannels = new Map<string, IVideoState>();
  found = false;
  lastTimestamp = 0;
  startTimestamp = 0;
  data = new Map<number, any>();
  interval: NodeJS.Timer;
  frame = 0;

  private statsCount = 0;
  private latencySum = 0;
  private latency = 0;
  private fps = 0;
  private statsTime = Date.now();

	constructor(peer: Peer, uri: string) {
    this.peer = peer;
    this.uri = uri;

    this.peer.bind(uri, (latency: number, streampckg: number[], pckg: any[]) => {
        if (this.paused || !this.active) {
            return;
        }

        const [timestamp, fs, frame, channel] = streampckg;

        let rts: number;
        if (channel === 0) {
          rts = Date.now();
        }

        this.emit('raw', streampckg, pckg);

        if (this.startTimestamp === 0) {
            this.startTimestamp = timestamp;
        }

        if (timestamp !== this.lastTimestamp) {
            this.emit('frameEnd', this.lastTimestamp);
            this.lastTimestamp = timestamp;
            this.emit('frameStart', this.lastTimestamp);
        }

        if (frame !== this.frame) return;

        if (channel >= 32) {
            if (channel > 64 && pckg[5].length > 0) {
                this._decodeData(channel, pckg[5]);
            }
            this.emit('packet', streampckg, pckg);
        } else {
            this.availableChannels.add(channel);
            this.availableSets.add(fs);
            this.availableSources.add(frame);
            const id = `id-${fs}-${frame}-${channel}`;

            if (this.enabledChannels.has(id)) {
                this.emit('packet', streampckg, pckg);
            }
        }

        if (channel === 0) {
          const procLatency = Date.now() - rts;
          this.latencySum += latency + this.peer.latency + procLatency;
          ++this.statsCount;
        }
    });

    this.on('started', () => {
      if (this.found) {
        this.emit('ready');
      }
    });

    const disconCB = () => {
      this.found = false;
      this.stop();
    };
    this.peer.on('disconnect', disconCB);

    this.on('stop', () => {
      this.peer.off('disconnect', disconCB);
    })
	}

  getStatistics() {
    if (this.statsCount >= 20) {
      this.latency = this.latencySum / this.statsCount;
      const now = Date.now();
      const seconds = (now - this.statsTime) / 1000;
      this.fps = this.statsCount / seconds;
      this.statsTime = now;
      this.latencySum = 0;
      this.statsCount = 0;
    };
    return {
      latency: this.latency,
      fps: this.fps,
    };
  }

    private _decodeData(channel: number, rawData: Buffer) {
      try {
        const data = decode(rawData);
        this.data.set(channel, data);
        if (channel === 69) {
            console.log('EVENT', data);
            this.emit(data[0]);
        }
      } catch(err) {
          console.error('Decode error', err, rawData);
      }
    }

    stop() {
      this.active = false;
      if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
      }
      if (this.found) {
        this.peer.rpc("disable_stream", () => {});
        this.peer.unbind(this.uri);
        this.found = false;
      }
      this.emit('stop');
    }

    destroy() {
      this.stop();
      allOff(this);
      this.peer = null;
    }

    start(fs: number, frame: number, channel: number) {
      if (!this.peer) {
        return;
      }
      this.active = true;
      this.frame = frame;

      this.interval = setInterval(() => {
        if (this.active && this.found) {
            this.enabledChannels.forEach((value, key) => {
                this.peer.send(this.uri, 0, [1,value.stream,255,value.channel,1],[255,7,35,255,0,Buffer.alloc(0)]);
            });
        }
      }, 500);

      if (!this.found) {
        this.peer.rpc("enable_stream", res => {
            if (!res) {
                console.error('Stream not found', this.uri);
                if (this.active) {
                    setTimeout(() => this.start(fs, frame, channel), 500);
                }
                return;
            }
            console.log('Stream connected');
            this.found = true;
            this.emit('ready');
        }, this.uri, true);
      } else {
        this.emit('ready');
      }
    }

    keyframe() {
      this.enabledChannels.forEach((value, key) => {
        this.peer.send(this.uri, 0, [1,value.stream,255,value.channel,5],[255,7,35,255,0,Buffer.alloc(0)]);
      });
    }

    enableVideo(stream: number, frame: number, channel: number) {
        const id = `id-${stream}-${frame}-${channel}`;
        this.enabledChannels.set(id, { rxcount: 0, stream, frame, channel });
    }

    disableVideo(stream: number, frame: number, channel: number) {
        const id = `id-${stream}-${frame}-${channel}`;
        this.enabledChannels.delete(id);
    }

    set(channel: number, value: unknown) {
        this.peer.send(this.uri, 0, [1, 0 , this.frame, channel, 0],[103,7,1,0,0, encode(value)]);
    }

    getWidth(): number {
         return this.data.has(65) ? this.data.get(65)[0][4] : 0;
    }

    getHeight(): number {
        return this.data.has(65) ? this.data.get(65)[0][5] : 0;
   }
}

ee(FTLStream.prototype);

