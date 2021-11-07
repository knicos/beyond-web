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
	private video: HTMLVideoElement;
	private remux: FTLRemux;
	private paused: boolean;
	private active: boolean;
	private sourceBuffer: SourceBuffer;
	private queue: any[];
	private mime: string | null;
	private mediaSource: MediaSource;
	private has_audio: boolean;
	private first_ts: number;

	constructor(video: HTMLVideoElement) {
		this.video = video;
		this.remux = new FTLRemux();

		this.paused = false;
		this.active = false;

    this.remux.on('reset', () => {
        console.log('Remux reset');
        this.emit('reset');
    });

    // When the remuxer is done, append to MSE SourceBuffer
		this.remux.on('data', (data) => {
      if (!this.sourceBuffer) {
          return;
      }
			if (this.sourceBuffer.updating) {
				this.queue.push(data);
			} else {
				try {
          // Queue has something, send this first
          if (this.queue.length > 0) {
            this.queue.push(data);
            const d = this.queue[0];
            this.queue.shift();
            this.sourceBuffer.appendBuffer(d);
          // Otherwise, send this data immediately.
          } else {
					  this.sourceBuffer.appendBuffer(data);
          }
				} catch (e) {
					console.error("Failed to append buffer");
				}
			}
		});

		this.video.addEventListener('pause', (e) => {
			console.log("pause");
			this.active = false;
		});

    this.video.addEventListener('waiting', (e) => {
			//console.warn("Video waiting", e);
		});

    this.video.addEventListener('stalled', (e) => {
			console.warn("Video stalled");
		});

    this.video.addEventListener('suspend', (e) => {
			console.warn("Video suspended");
		});

    this.video.addEventListener('playing', (e) => {
			//console.info("Video playing", e);
		});

    this.video.addEventListener('abort', (e) => {
			console.warn("Video abort");
		});

    this.video.addEventListener('seeked', (e) => {
			console.warn("Video seeked");
		});

    this.video.addEventListener('ended', (e) => {
			console.warn("Video ended");
		});

    this.video.addEventListener('durationchange', (e) => {
			console.warn("Video duration changed", e);
		});

    this.video.addEventListener('error', (e) => {
			console.error("Video Error", e);
		});

		this.video.addEventListener('play', (e) => {
			console.log("Play");
			this.active = true;
			this.remux.reset();
		});

		this.createMediaSource();
	}

  private createSourceBuffer() {
    console.log(this.mediaSource.readyState);
    this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mime);
    this.sourceBuffer.mode = 'sequence';
    this.active = true;

    this.sourceBuffer.addEventListener('error', (e) => {
      console.error("SourceBuffer: ", e);
      this.active = false;
    });

    this.sourceBuffer.addEventListener('abort', (e) => {
      console.error("SourceBuffer Abort: ", e);
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
  }

  private createMediaSource() {
    this.mediaSource = new MediaSource();
    this.sourceBuffer = null;
    this.mime = null;

    this.mediaSource.addEventListener('sourceclose', () => {
      console.warn('Source closed');
    });

    this.mediaSource.addEventListener('sourceended', () => {
      console.warn('Source ended');
    });

    this.mediaSource.addEventListener('sourceopen', (e) => {
      console.log("Source Open", e, this.mime);
      URL.revokeObjectURL(this.video.src);
      this.createSourceBuffer();
    });

    this.queue = [];
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

  reset() {
    this.remux.reset();
  }

  hardReset() {

  }

  isActive() {
    return this.active;
  }
}

ee(FTLMSE.prototype);

