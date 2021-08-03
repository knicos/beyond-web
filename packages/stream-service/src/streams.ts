import {Peer} from "@ftl/protocol";
import {InputStream} from "./InputStream";
import { redisAddItem, redisRemoveItem, redisTopItems } from "@ftl/common";

const peer_uris = new Map<string, string[]>();
const uri_to_peer = new Map<string, Peer>();
const input_streams = new Map<string, InputStream>();

/**
 * Returns the first part of the URI
 * e.g. ftl://utu.fi or ftl://something.fi
 * @param {uri} uri 
 */
 function removeQueryString(uri: string): string {
	let ix = uri.indexOf("?");
	let base_uri = (ix >= 0) ? uri.substring(0, ix) : uri;
	return base_uri;
}

export async function getStreams(): Promise<string[]> {
	const streams = await redisTopItems('streams');
	console.log('STREAMS', streams);
	return streams;
}

export async function bindToStream(p: Peer, uri: string) {
	const parsedURI = removeQueryString(uri);
	const streams = await getStreams();
	if (streams.some(p => p === parsedURI)) {
		console.log("Stream found: ", uri, parsedURI);

		if (!p.isBound(parsedURI)) {
			console.log("Adding local stream binding: ", parsedURI);
			p.bind(parsedURI, (ttimeoff, spkt, pkt) => {
				//console.log("STREAM: ", ttimeoff, spkt, pkt);
				let speer = uri_to_peer[parsedURI];
				if (speer) {
					try {
					//uri_data[parsedURI].addClient(p);
					speer.send(parsedURI, ttimeoff, spkt, pkt);
					} catch(e) {
						console.error("EXCEPTION", e);
					}
				} else if (speer) console.log("Stream response");
				else console.error("No stream peer");
			});
		}

		return [Peer.uuid];
	} else {
		console.log("Stream not found: ", uri)
		return null; // or []??
	}
}

export function checkStreams(peer: Peer) {
	if (!peer_uris.has(peer.string_id)) {
		peer_uris[peer.string_id] = [];
	}

	if (!peer.master) {
		setTimeout(() => {
			peer.rpc("list_streams", (streams: string[]) => {
				for (let i=0; i<streams.length; i++) {
					createStream(peer, streams[i]);
				}
			});

			/*peer.rpc("list_configurables", (cfgs) => {
				//console.log("CONFIGS", cfgs);
				for (let i=0; i<cfgs.length; i++) {
					if (!cfg_to_peer.hasOwnProperty(cfgs[i])) cfg_to_peer[cfgs[i]] = peer;
				}
			});*/
		}, 500);  // Give a delay to allow startup
	}
}

export function removeStreams(peer: Peer) {
	const puris = peer_uris[peer.string_id];
	if (puris) {
		for (let i=0; i<puris.length; i++) {
			console.log("Removing stream: ", puris[i]);
			uri_to_peer.delete(puris[i]);
			redisRemoveItem('streams', puris[i]);
			if (input_streams.has(puris[i])) {
				input_streams.delete(puris[i]);
			}
			//p.unbind(pu)
		}
		peer_uris.delete(peer.string_id);
	}
}

export function createStream(peer: Peer, uri: string) {
	const parsedURI = removeQueryString(uri)
	console.log("Adding stream: ", uri);
	peer_uris[peer.string_id].push(parsedURI);
	uri_to_peer[parsedURI] = peer;
	input_streams[parsedURI] = new InputStream(uri, peer);
	//stream_list[uri] = true;
	redisAddItem('streams', parsedURI, Date.now());

	//broadcastExcept(p, "add_stream", uri);
}
