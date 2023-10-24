/* eslint-disable class-methods-use-this */
import {
  Get, Post, Inject, PathParams, QueryParams, BodyParams, Controller,
} from '@tsed/common';

import StreamService from '../services/stream';

// NOTE: this is a public API, no auth required unlike the normal API

@Controller('/public')
export default class StreamsPublic {
  @Inject()
    streamService: StreamService;

  @Get('/')
  async index() : Promise<string> {
    return "OK";
  }

  @Post('/reaction/:id')
  async reaction(@PathParams('id') id: string, @BodyParams() payload: any): Promise<void> {
    await this.streamService.postToStream(id, 2055, payload.reaction);
  }
}
