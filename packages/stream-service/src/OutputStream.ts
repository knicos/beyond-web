import {Peer} from "@ftl/protocol";
import {redisPublish, redisSubscribe} from "@ftl/common";
const msgpack = require('msgpack5')()
  , encode  = msgpack.encode
  , decode  = msgpack.decode;

export class OutputStream {
	uri: string;
	base_uri: string;
	peer: Peer;
	title = "";
	rxcount = 10;
	rxmax = 10;
	data = {};

	constructor(uri, peer) {
		this.peer = peer;
		this.uri = uri;
		let ix = uri.indexOf("?");
		this.base_uri = (ix >= 0) ? uri.substring(0, ix) : uri;

		// Add RPC handler to receive frames from the source
		peer.bind(this.base_uri, (latency, spacket, packet) => {
			// Extract useful data
			// this.parseFrame(spacket, packet);
			// Forward frames to redis
            console.log('REQUEST DATA', spacket);
			this.pushFrame(latency, spacket, packet);
		});

		redisSubscribe(`stream-in:${this.base_uri}`, message => {
			// Return data...
            console.log('SOURCE DATA', message);
            const args = decode(message);
            this.peer.send(this.base_uri, ...args);
		});
	
		console.log("Sending request");
		this.peer.send(this.base_uri, 0, [1,255,255,74,1],[7,0,1,255,0,new Uint8Array(0)]);
	}

	private parseFrame(spacket: unknown, packet: unknown) {
		if (spacket[3] >= 64 && packet[5].length > 0 && packet[0] == 103) {
			this.data[spacket[3]] = decode(packet[5]);
			console.log('Got data: ', spacket[3], this.data[spacket[3]]);
		}
	}

	private pushFrame(latency: number, spacket: unknown, packet: unknown) {
		redisPublish(`stream-out:${this.base_uri}`, encode([latency, spacket, packet]));
	}
}
