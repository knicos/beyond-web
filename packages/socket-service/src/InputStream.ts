import {Peer} from "@ftl/protocol";
import {redisPublish, redisSubscribe, redisUnsubscribe} from "@ftl/common";
const msgpack = require('msgpack5')()
  , encode  = msgpack.encode
  , decode  = msgpack.decode;

export class InputStream {
	uri: string;
	base_uri: string;
	peer: Peer;
	title = "";
	rxcount = 10;
	rxmax = 10;
	data = {};
    onMessage: Function;
    lastTS = 0;

	constructor(uri, peer) {
		this.peer = peer;
		this.uri = uri;
		let ix = uri.indexOf("?");
		this.base_uri = (ix >= 0) ? uri.substring(0, ix) : uri;

		// Add RPC handler to receive frames from the source
		peer.bind(this.base_uri, (latency, spacket, packet) => {
            // console.log('INPUT DATA', spacket);
			// Extract useful data
			this.parseFrame(spacket, packet);
			// Forward frames to redis
			this.pushFrame(latency, spacket, packet);
		});

        this.onMessage = message => {
			// Return data...
            const args = decode(message);
            console.log('RETURN DATA', ...args);
            this.peer.send(this.base_uri, ...args);
            //this.peer.send(this.base_uri, 0, [1,255,255,74,1],[7,0,30,255,0,new Uint8Array(0)]);
		}
		redisSubscribe(`stream-out:${this.base_uri}`, this.onMessage);
	
		//console.log("Sending request");
		this.peer.send(this.base_uri, 0, [1,255,255,74,1],[7,0,1,255,0,new Uint8Array(0)]);
        this.sendEvent('started');
	}

	private parseFrame(spacket: unknown, packet: unknown) {
        this.lastTS = Math.max(this.lastTS, spacket[0]);
		if (spacket[3] >= 64 && packet[5].length > 0 && packet[0] == 103) {
			this.data[spacket[3]] = decode(packet[5]);
			//console.log('Got data: ', spacket[3], this.data[spacket[3]]);
		}
	}

	private pushFrame(latency: number, spacket: unknown, packet: unknown) {
		redisPublish(`stream-in:${this.base_uri}`, encode([latency, spacket, packet]));
	}

    sendEvent(name: string, ...args: any[]) {
        const spacket = [this.lastTS, 255, 255, 69, 0];
        const packet = [0, 0, 0, 0, 0, encode([name, ...args])];
        redisPublish(`stream-in:${this.base_uri}`, encode([0, spacket, packet]));
    }

    destroy() {
        this.sendEvent('stopped');
        redisUnsubscribe(`stream-out:${this.base_uri}`, this.onMessage);
    }
}
