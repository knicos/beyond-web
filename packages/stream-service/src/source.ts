import {Peer} from "@ftl/protocol";
import {checkStreams, removeStreams, getStreams, bindToStream, createStream} from './streams';

const peer_data = [];
const peer_uris = {};
const peer_by_id = {};

export function createSource(ws) {
	const p = new Peer(ws);
	peer_data.push(p);

	p.on("connect", (peer) => {
		console.log("Node connected...");
		peer_uris[peer.string_id] = [];
		peer_by_id[peer.string_id] = peer;

		peer.rpc("node_details", (details) => {
			let obj = JSON.parse(details[0]);

			peer.uri = obj.id;
			peer.name = obj.title;
			peer.master = (obj.kind == "master");
			console.log("Peer name = ", peer.name);
			console.log("Details: ", details);
			checkStreams(peer);
		});
	});

	p.on("disconnect", (peer) => {
		console.log("DISCONNECT", peer.name);
		// Remove all peer details and streams....

		if (peer.status != 2) return;

		removeStreams(peer);
		if (peer_by_id.hasOwnProperty(peer.string_id)) delete peer_by_id[peer.string_id];

		// Clear configurables
		/*for (let c in cfg_to_peer) {
			if (cfg_to_peer[c] === p) delete cfg_to_peer[c];
		}*/

		// FIXME: Clear peer_data
	});

	p.bind("new_peer", (id) => {
		checkStreams(p);
	});

	// Used to sync clocks
	p.bind("__ping__", () => {
		return Date.now();
	});

	p.bind("node_details", () => {
		return [`{"title": "FTL Web-Service", "id": "${p.getUuid()}", "kind": "master"}`];
	});

	p.bind("list_streams", () => {
		return getStreams();
	});

	p.bind("list_configurables", () => {
		let result = [];
		/*for (let c in cfg_to_peer) {
			if (cfg_to_peer[c] !== p) result.push(c);
		}*/
		//console.log("List Configs: ", result);
		return result;
	});

	p.proxy("get_configurable", (cb, uri) => {
		//if (cfg_to_peer.hasOwnProperty(uri)) {
		//	let peer = cfg_to_peer[uri];
		//	peer.rpc("get_configurable", cb, uri);
		//} else {
			console.log("Failed to get configurable ", uri);
			return "{}";
		//}
	});

	p.bind("find_stream", (uri, proxy) => {
		if (!proxy) return null;
		return bindToStream(p, uri);
	});

	// Requests camera calibration information
	/*p.proxy("source_details", (cb, uri, chan) => {
		const parsedURI = stringSplitter(uri);
		if(uri_to_peer[parsedURI]){
			let peer = uri_to_peer[parsedURI].peer
			if (peer) {
				peer.rpc("source_details", cb, uri, chan);
			}
		}else{
			console.log("Failed to get source details for URI", uri);
			return "{}"
		}
	});*/

	// Get the current position of a camera
	/*p.proxy("get_pose", (cb, uri) => {
		//console.log("SET POSE");
		const parsedURI = stringSplitter(uri);
		if(uri_to_peer[parsedURI]){
			let peer = uri_to_peer[parsedURI].peer
			if (peer) {
				peer.rpc("get_pose", cb, uri);
			}
		}else{
			console.log("Failed to get pose for URI", uri);
			return "{}"
		}
	});*/

	// Change the position of a camera
	/*p.bind("set_pose", (uri, vec) => {
		const parsedURI = stringSplitter(uri);
		if(uri_to_peer[parsedURI]){
			let peer = uri_to_peer[parsedURI].peer
			if (peer) {
				uri_data[parsedURI].pose = vec;
				peer.send("set_pose", uri, vec);
			}
		}else{
			console.log("Couldn't set pose for URI", uri)
			return "{}";
		}
	});*/

	// Request from frames from a source
	/*p.bind("get_stream", (uri, N, rate, dest) => {
		console.log(uri)
		const parsedURI = stringSplitter(uri);
		if(uri_data[uri]){
			let peer = uri_data[uri].peer
			console.log(peer)
			if (peer) {
				console.log("THIS GETS LOGGED")
				uri_data[uri].addClient(p, N, rate, dest);
				console.log("SO DOES THIS")
			//peer.send("get_stream", uri, N, rate, [Peer.uuid], dest);
			}
		}else{
			console.log("Couldn't get stream for ", uri)
			return "{}";
		}
	});*/

	/**
	 * Get JSON values for stream configuration
	 */ 
	p.bind("get_cfg", (cb, uri) => {
		/*const parsedURI = stringSplitter(uri);
		if(uri_to_peer[parsedURI]){
			let peer = uri_to_peer[parsedURI].peer
			if(peer){
				peer.rpc("get_cfg", cb, uri)
			}	
		}else{*/
			console.log("Config not found", uri)
			return "{}";
		//}
	})

	/**
	 * Update certain URIs values
	 */
	 p.bind("update_cfg", (uri, json) => {
		/*let peer = locateConfigPeer(uri);

		if (peer) {
			peer.send("update_cfg", uri, json)
		}else{*/
			console.log("Failed to update the configuration uri", uri)
			return "{}";
		//}
	 })

	// Register a new stream
	p.bind("add_stream", (uri) => {
		createStream(p, uri);
	});

	return p;
}
