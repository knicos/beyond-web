import { v4 as uuidv4 } from 'uuid';
import {
  redisAddItem,
  redisTopItems,
  redisSet,
  redisMGet,
  redisSubscribe,
  redisPublish,
  redisUnsubscribe,
  redisRemoveItem,
  redisGet,
  redisSetStreamCallback,
  redisSendEvent,
} from '@ftl/common';
import { start } from 'repl';
import { $log } from '@tsed/logger';
import { Exception } from '@tsed/exceptions';

import { Blob } from 'buffer';

import { decode, decodeArrayStream, Decoder, DecodeError } from '@msgpack/msgpack';
import { log, time } from 'console';

const { encode } = require('msgpack5')();

// encoded png: 1x1 magenta 0.5 opacity
const defaultPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==', 'base64')

// overlap with at least playback-service; all this protocol level stuff should be in
// its own module and available for each service

export default class PngStream {

  private baseUri : string = "ftl://ftlab.utu.fi/whiteboard/";

  private uri : string;

  private timeoutSeconds : number = 60*60; // 1 hour

  private lastFrameSentTs : number = 0;

  private maxFps : number  = 5;

  // activity timeout timer
  private timeoutId : number = null;

  private bActive : boolean = false;

  private frameNumber : number = 0;

  private lastFrame : Uint8Array = defaultPng

  private framesSent : number = 0;

  constructor(id : string) {
    this.uri = this.baseUri + id;
    this.lastFrameSentTs = Date.now();
  }

  private updateTimeout() : void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.bActive) {
      setTimeout(() => {
        this.timeoutId = null;
        this.sendEventStopStream();
      }, 1000.0*this.timeoutSeconds);
    }
  }

  private sendEventStartStream() : void {
    if (!this.bActive) {
      redisSendEvent({
        event: 'events:stream',
        body: {
          operation: 'start',
          id: this.uri,
          name: 'whiteboard', // add id here
          node: 'webservice',
          framesetId: 255,
          frameId: 255,
        },
      });

      redisSendEvent({
        event: 'events:stream',
        body: {
          operation: 'start',
          id: this.uri,
          name: 'whiteboard', // add id here
          node: 'webservice',
          framesetId: 0,
          frameId: 0,
        },
      });

      this.bActive = true;
      log("pngstream start event sent (stream): " + this.uri);
    }
  }

  private sendEventStopStream() : void {
    if (this.bActive) {
      redisSendEvent({
        event: 'events:stream',
        body: {
          operation: 'stop',
          id: this.uri,
          framesetId: 255,
          frameId: 255,
        },
      });
      this.bActive = false;
      log("pngstream stop event sent (stream): " + this.uri);
    }
  }

  public get() : Buffer {
    log(this.lastFrame)
    return Buffer.from(this.lastFrame);
  }

  private async sendEndOfFrame() : Promise<void> {
    const spkt = [
      this.frameNumber,     // timestamp (must be > 0)
      0,                    // stream id
      0,                    // frame number
      2048,                 // channel (2048: end of frame)
      2                     // flags (2: kFlagCompleted)
    ];

    const dpkt = [
      254,                  // codec (254: invalid)
      0,                    // reserved
      1,                    // frame count (for this packet)
      0,                    // bit rate (0: highest); not used
      2,                    // packet_count (for this frame, frame + eof)
      new Uint8Array([0])   // data
    ];


    await redisPublish(`stream-in:${this.uri}`, encode([0, spkt, dpkt]));

  }

  public async sendFrame(img : Uint8Array) : Promise<void> {
    if ((Date.now() - this.lastFrameSentTs) <= 1000.0/this.maxFps) {
      // send has to be scheduled in case no further update arrives on time
      // return;
    }

    this.frameNumber = Date.now();

    const spkt = [
      this.frameNumber,     // timestamp (must be > 0)
      0,                    // stream id
      0,                    // frame number
      0,                    // channel (0: kColour)
      0                     // flags
    ];

    const dpkt = [
      1,                  // codec (1: kPNG)
      0,                  // reserved
      1,                  // frame count (for this packet)
      0,                  // bit rate (0: highest); not used
      0,                  // flags
      img                 // data
    ];

    await redisPublish(`stream-in:${this.uri}`, encode([0, spkt, dpkt]));
    this.lastFrame = img;
    this.lastFrameSentTs = Date.now();
    this.framesSent++;

    await this.sendEndOfFrame();

    log("pngstream frame sent: " + this.frameNumber + " (" + this.uri + ")" + " " + "(" + this.framesSent + ")")
    this.updateTimeout();
  }

  onMessage: (msg : Buffer) => void;

  private timerId : NodeJS.Timer = null;

  public async start() : Promise<void> {
    this.frameNumber = Date.now();

    this.onMessage = (message) => {
      const buf = (typeof message === 'string') ? new Uint8Array(JSON.parse(message).data) : message;
      const dpkt = (decode(buf) as Array<any>)[2];
      //log("got request for frames: " + dpkt[2] + " (" + this.uri + ")");
      // TODO: Do not re-send if connected client re-requests the frame (only useful to
      //       re-send when more than one client connected). Interleaving can result in too
      //       many sent frames if more than one client is connected.
      //       Logic to prevent re-sends to same client has to be in websocket.
      if (this.lastFrame) {
        (async () => { await this.sendFrame(this.lastFrame) })();
      }
    }

    await redisSubscribe(`stream-out:${this.uri}`, this.onMessage);
    //this.startPeriodicTimer();

    this.sendEventStartStream();
    this.updateTimeout();
    log("pngstream opened: " + this.uri);
  }

  public async stop() : Promise<void> {
    this.sendEventStopStream();
    this.updateTimeout();
    await redisUnsubscribe(`stream-out:${this.baseUri}`, this.onMessage);
  }
}
