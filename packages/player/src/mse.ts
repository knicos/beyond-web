import ee, {Emitter} from 'event-emitter';
import {FTLRemux} from './remux';

interface IStreamPacket {
	0: number,
	1: number,
	2: number,
	3: number,
};

export interface FTLMSE extends Emitter {};

export class FTLMSE {
	video: HTMLVideoElement;
	remux: FTLRemux;
	paused: boolean;
	active: boolean;
	sourceBuffer: any;
	queue: any[];
	mime: string | null;
	mediaSource: MediaSource;
	has_audio: boolean;
	first_ts: number;
    frameset = 0;
    frameNumber = 0;
    channel = 0;

	constructor(video: HTMLVideoElement) {
		this.video = video;
		this.remux = new FTLRemux();

		this.paused = false;
		this.active = false;

        this.remux.on('reset', () => {
            this.emit('reset');
        });

		this.remux.on('data', (data) => {
            if (!this.sourceBuffer) {
                return;
            }
			if (this.sourceBuffer.updating) {
				this.queue.push(data);
			} else {
				//console.log("Direct append: ", data);

				try {
					this.sourceBuffer.appendBuffer(data);
				} catch (e) {
					console.error("Failed to append buffer");
				}
			}
		});

		// TODO: Generate
		//this.mime = 'video/mp4; codecs="avc1.640028, opus"';

		this.video.addEventListener('pause', (e) => {
			console.log("pause");
			this.active = false;
		});

		this.video.addEventListener('play', (e) => {
			console.log("Play");
			this.active = true;
			this.remux.select(this.frameset, this.frameNumber, this.channel);
		});

		this.createMediaSource();
	}

    createMediaSource() {
        this.mediaSource = new MediaSource();
		this.sourceBuffer = null;
        this.mime = null;

        this.mediaSource.addEventListener('sourceopen', (e) => {
			console.log("Source Open", e, this.mime);
			URL.revokeObjectURL(this.video.src);
			console.log(this.mediaSource.readyState);
			this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime);
			//this.sourceBuffer.mode = 'sequence';
			this.active = true;

			this.sourceBuffer.addEventListener('error', (e) => {
				console.error("SourceBuffer: ", e);
				this.active = false;
			});

			this.sourceBuffer.addEventListener('updateend', () => {
				if (this.queue.length > 0 && !this.sourceBuffer.updating) {
					let s = this.queue[0];
					this.queue.shift();

					try {
						this.sourceBuffer.appendBuffer(s);
					} catch(e) {
						console.error("Failed to append buffer");
					}
				}
			});
		});

        this.queue = [];
		//this.video.src = URL.createObjectURL(this.mediaSource);
		this.has_audio = false;
		this.first_ts = 0;
    }

	push(spkt: number[], pkt: number[]) {
        const [timestamp, fs, frame, channel] = spkt;
		if (this.first_ts == 0) this.first_ts = timestamp;
	
		// Skip first 200ms, use to analyse the stream contents
		if (timestamp < this.first_ts + 200) {
			if (channel == 32 || channel == 33) this.has_audio = true;
		} else {
			if (!this.mime) {
				if (this.has_audio) {
					console.log("Create video with audio");
					this.mime = 'video/mp4; codecs="avc1.640028, opus"';
					this.remux.has_audio = true;
				} else {
					console.log("Create video without audio");
					this.mime = 'video/mp4; codecs="avc1.640028"';
					this.remux.has_audio = false;
				}
				this.video.src = URL.createObjectURL(this.mediaSource);
                console.log('Opened video source', this.mime);
                this.emit('reset');	
			}
            if (this.sourceBuffer) {
                this.remux.push(spkt,pkt);
            }
		}
	}
	
	select(frameset: number, source: number, channel: number) {
        this.frameset = frameset;
        this.frameNumber = source;
        this.channel = channel;
		this.remux.select(frameset, source, channel);
        // this.createMediaSource();
	}
}

ee(FTLMSE.prototype);

