import ee, {Emitter} from 'event-emitter';
import {Peer} from '@ftl/protocol';

interface IStreamPacket {
	0: number,
	1: number,
	2: number,
	3: number,
};

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

	constructor(peer: Peer, uri: string) {
        this.peer = peer;
        this.uri = uri;

        this.peer.bind(uri, (latency, streampckg, pckg) => {
            if (this.paused || !this.active) {
                return;
            }

            this.emit('raw', streampckg, pckg);

            // console.log('PACKET', streampckg);

            if (this.startTimestamp === 0) {
                this.startTimestamp = streampckg[0];
            }

            if (streampckg[0] !== this.lastTimestamp) {
                this.emit('frameEnd', this.lastTimestamp);
                this.lastTimestamp = streampckg[0];
                this.emit('frameStart', this.lastTimestamp);
            }

            if (streampckg[3] >= 32) {
                this.emit('packet', streampckg, pckg);
            } else {
                const id = "id-"+streampckg[1]+"-"+streampckg[2]+"-"+streampckg[3];
    
                if (this.enabledChannels.has(id)) {
                    const state = this.enabledChannels.get(id);
                    state.rxcount++;
                    if (state.rxcount >= 25) {
                        state.rxcount = 0;
                        this.peer.send(this.uri, 0, [1,0,255,0,5],[255,7,35,0,0,Buffer.alloc(0)]);
                    }

                    this.emit('packet', streampckg, pckg);
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
                console.log('RES', res);
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

