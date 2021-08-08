import ee, {Emitter} from 'event-emitter';
import {Peer} from '@ftl/protocol';
import msgpack from 'msgpack5';
const {encode, decode} = msgpack();

interface IVideoState {
    rxcount: number;
}

export interface FTLStream extends Emitter {};

export class FTLStream {
	peer: Peer;
    uri: string;
    paused = false;
    active = true;
    enabledChannels = new Map<string, IVideoState>();
    found = false;
    lastTimestamp = 0;
    startTimestamp = 0;
    data = new Map<number, any>();

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
                    } catch(err) {
                        console.error('Decode error', err, pckg[5]);
                    }
                }
                this.emit('packet', streampckg, pckg);
            } else {
                const id = `id-${fs}-${frame}-${channel}`;
    
                if (this.enabledChannels.has(id)) {
                    const state = this.enabledChannels.get(id);
                    state.rxcount++;
                    if (state.rxcount >= 25) {
                        state.rxcount = 0;
                        this.peer.send(this.uri, 0, [1,fs,255,channel,1],[255,7,35,0,0,Buffer.alloc(0)]);
                    }

                    this.emit('packet', streampckg, pckg);
                } else {
                    console.log('Channel disabled', id);
                }
            }
        });

        if (this.peer.status == 2) {
            this.start(0,0,0);
        } else {
            this.peer.on("connect", () => {
                this.start(0,0,0);
            });
        }
	}

    private start(fs: number, frame: number, channel: number) {
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
                this.peer.send(this.uri, 0, [1,fs,255,channel, 5],[255,7,35,0,0,Buffer.alloc(0)]);
            }, this.uri, true);
        }
    }

    enableVideo(stream: number, frame: number, channel: number) {
        const id = `id-${stream}-${frame}-${channel}`;
        this.enabledChannels.set(id, { rxcount: 0 });
    }

    disableVideo(stream: number, frame: number, channel: number) {
        const id = `id-${stream}-${frame}-${channel}`;
        this.enabledChannels.delete(id);
    }
}

ee(FTLStream.prototype);

