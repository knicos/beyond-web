/* eslint-disable class-methods-use-this */
import {
  Get, Inject, PathParams, QueryParams,
} from '@tsed/common';
import { Description, Groups, Header } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import { NotFound } from '@tsed/exceptions';
import fs from 'fs';
import StreamService, { Stream } from '../services/stream';
import Pageable from '../models/pageable';

const defaultThumb = fs.readFileSync('./resources/thumb.jpg');

@Controller('/streams')
export default class Streams {
  @Inject()
  streamService: StreamService;

  @Get('/')
  @Description('Get all available streams')
  @Groups('query')
  async find(@QueryParams() page: Pageable, @UseToken() token: AccessToken): Promise<Stream[]> {
    return this.streamService.findInGroups(token.user, token.groups, page.offset, page.limit);
  }

  @Get('/:id/thumbnail/:fs/:f')
  @Header({
    'Content-Type': 'image/jpeg',
    'Cache-Control': 'max-age=30',
  })
  async getThumbnail(@PathParams('id') id: string, @PathParams('fs') frameset: number, @PathParams('f') frame: number, @UseToken() token: AccessToken): Promise<Buffer> {
    const result = await this.streamService.getThumbnail(id, frameset, frame, token.groups);
    if (!result) {
      return defaultThumb;
    }
    return result;
  }

  @Get('/:id')
  async get(@PathParams('id') id: string, @UseToken() token: AccessToken): Promise<Stream> {
    const result = await this.streamService.getInGroups(id, token.groups);
    if (!result) {
      throw new NotFound('stream_not_found');
    }
    return result;
  }
}
