import ee, {Emitter} from 'event-emitter';
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
    enabledChannels = new Map<string, IVideoState>();
    found = false;
    lastTimestamp = 0;
    startTimestamp = 0;
    data = new Map<number, any>();
    interval: NodeJS.Timer;

	constructor(peer: Peer, uri: string) {
        this.peer = peer;
        this.uri = uri;

        this.peer.bind(uri, (latency: number, streampckg: number[], pckg: any[]) => {
            if (this.paused || !this.active) {
                return;
            }

            this.emit('raw', streampckg, pckg);

            // console.log('PACKET', streampckg);

            const [timestamp, fs, frame, channel] = streampckg;

            if (this.startTimestamp === 0) {
                this.startTimestamp = timestamp;
            }

            if (streampckg[0] !== this.lastTimestamp) {
                this.emit('frameEnd', this.lastTimestamp);
                this.lastTimestamp = timestamp;
                this.emit('frameStart', this.lastTimestamp);
            }

            if (channel >= 32) {
                if (channel > 64 && pckg[5].length > 0) {
                    try {
                        const data = decode(pckg[5]);
                        this.data.set(channel, data);
                        if (channel === 69) {
                            console.log('EVENT', data);
                            this.emit(data[0]);
                        }
                    } catch(err) {
                        console.error('Decode error', err, pckg[5]);
                    }
                }
                this.emit('packet', streampckg, pckg);
            } else {
                this.availableChannels.add(channel);
                const id = `id-${fs}-${frame}-${channel}`;
    
                if (this.enabledChannels.has(id)) {
                    /*const state = this.enabledChannels.get(id);
                    state.rxcount++;
                    if (state.rxcount >= 25) {
                        state.rxcount = 0;
                        this.peer.send(this.uri, 0, [1,fs,255,channel,1],[255,7,35,0,0,Buffer.alloc(0)]);
                    }*/

                    this.emit('packet', streampckg, pckg);
                }
            }
        });

        /*if (this.peer.status == 2) {
            this.start(0,0,0);
        } else {
            this.peer.on("connect", () => {
                this.start(0,0,0);
            });
        }*/

        this.on('started', () => {
            if (this.active) {
                this.start(0, 0, 0);
            }
        });

        this.interval = setInterval(() => {
            if (this.active) {
                this.enabledChannels.forEach((value, key) => {
                    this.peer.send(this.uri, 0, [1,value.stream,255,value.channel,1],[255,7,35,0,0,Buffer.alloc(0)]);
                });
            }
        }, 500);

        this.peer.on('disconnect', () => {
            this.stop();
        });
	}

    stop() {
        this.active = false;
        clearInterval(this.interval);
    }

    start(fs: number, frame: number, channel: number) {
        this.active = true;
        if (this.found) {
            this.peer.send(this.uri, 0, [1,fs,255,channel, 5],[255,7,35,0,0,Buffer.alloc(0)]);
        } else {
            this.peer.rpc("find_stream", res => {
                if (!res) {
                    console.error('Stream not found');
                    if (this.active) {
                        setTimeout(() => this.start(fs, frame, channel), 500);
                    }
                    return;
                }
                console.log('Stream connected');
                this.found = true;
                this.emit('started');
                this.peer.send(this.uri, 0, [1,fs,255,channel, 5],[255,7,35,0,0,Buffer.alloc(0)]);
            }, this.uri, true);
        }
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
        this.peer.send(this.uri, 0, [1, 0 , 0, channel, 0],[103,7,1,0,0, encode(value)]);
    }

    getWidth(): number {
         return this.data.has(65) ? this.data.get(65)[0][4] : 0;
    }

    getHeight(): number {
        return this.data.has(65) ? this.data.get(65)[0][5] : 0;
   }
}

ee(FTLStream.prototype);

