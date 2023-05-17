import { Service } from '@tsed/common';
import { $log } from '@tsed/logger';
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
} from '@ftl/common';
import { BadRequest, NotFound } from '@tsed/exceptions';
import { number } from '@tsed/schema';

import PngStream from './pngstream';
import { log } from 'console';

const streams = new Map<string, PngStream>;
let streamCounter = 0;

@Service()
export default class WhiteboardService {

  public getOrCreate(id : string = "unknown") : PngStream {
    if (streams.has(id)) {
      return streams.get(id);
    } else {
      if (id === null) {
        do { id = "whiteboard-" + streamCounter++; } while (streams.has(id));
      }
      const stream = new PngStream(id);
      streams.set(id, stream);
      log("Whiteboard created: " + id);
      stream.start();
      return stream;
    }
  }

  public update(id : string, image : Uint8Array) {
    const whiteboard = this.getOrCreate(id);
    whiteboard.sendFrame(image);
  }
}
