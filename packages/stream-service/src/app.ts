import express from "express";
import expressWs from "express-ws";
const app = expressWs(express()).app;
import {createSource} from "./source";
const msgpack = require('msgpack5')()
  , encode  = msgpack.encode
  , decode  = msgpack.decode;

app.ws('/v1/stream', (ws, req) => {
	console.log("New web socket request");
	//console.log('WEBSOCKET', ws)
	
	createSource(ws);
});

export default app;
