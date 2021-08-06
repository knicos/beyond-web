import {Peer} from "@ftl/protocol";
import {InputStream} from "./InputStream";
import {OutputStream} from "./OutputStream";
import { redisAddItem, redisRemoveItem, redisTopItems } from "@ftl/common";

const peer_uris = new Map<string, string[]>();
const uri_to_peer = new Map<string, Peer>();
const input_streams = new Map<string, InputStream>();
const output_streams = new Map<string, OutputStream>();

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
	return redisTopItems('streams');
}

export async function getActiveStreams(): Promise<string[]> {
	return redisTopItems('activestreams');
}

export async function bindToStream(p: Peer, uri: string) {
	const parsedURI = removeQueryString(uri);
	const streams = await getActiveStreams();
	if (streams.some(p => p === parsedURI)) {
		console.log("Stream found: ", uri, parsedURI);

		if (!p.isBound(parsedURI)) {
			console.log("Adding local stream binding: ", parsedURI);
            output_streams.set(p.string_id, new OutputStream(parsedURI, p));
		}

		return [Peer.uuid];
	} else {
		console.log("Stream not found: ", uri)
		return null; // or []??
	}
}

export function checkStreams(peer: Peer) {
	if (!peer_uris.has(peer.string_id)) {
		peer_uris.set(peer.string_id, []);
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
	const puris = peer_uris.get(peer.string_id);
	if (puris) {
		for (let i=0; i<puris.length; i++) {
			console.log("Removing stream: ", puris[i]);
            redisRemoveItem('activestreams', puris[i]);
			uri_to_peer.delete(puris[i]);
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
	peer_uris.get(peer.string_id).push(parsedURI);
	uri_to_peer.set(parsedURI, peer);
	input_streams.set(parsedURI, new InputStream(uri, peer));
	//stream_list[uri] = true;
	redisAddItem('streams', parsedURI, Date.now());
    redisAddItem('activestreams', parsedURI, Date.now());

	//broadcastExcept(p, "add_stream", uri);
}
