/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Inject, Put, PathParams, QueryParams, Post,
} from '@tsed/common';
import { Description, Groups } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import { NotFound } from '@tsed/exceptions';
import StreamService from '../services/stream';
import Stream from '../models/stream';
import Pageable from '../models/pageable';

@Controller('/streams')
export default class Streams {
  @Inject()
  streamService: StreamService;

  @Get('/')
  @Description('Get all available streams')
  async find(@QueryParams() page: Pageable, @UseToken() token: AccessToken): Promise<Stream[]> {
    return this.streamService.findInGroups(token.user, token.groups, page.offset, page.limit);
  }

  @Post('/')
  async create(@BodyParams() @Groups('creation') stream: Stream, @UseToken() token: AccessToken): Promise<Stream> {
    return this.streamService.create(stream, token.user, token.groups);
  }

  @Put('/:id')
  async update(@PathParams('id') id: string, @BodyParams() stream: Stream, @UseToken() token: AccessToken): Promise<Stream> {
    const result = await this.streamService.update(id, stream, token.groups);
    if (!result) {
      throw new NotFound('stream_not_found');
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
