/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Inject, Put, PathParams, QueryParams, Post, Delete,
} from '@tsed/common';
import { Description, Groups, Header } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import { NotFound } from '@tsed/exceptions';
import fs from 'fs';
import StreamService from '../services/stream';
import Stream from '../models/stream';
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

  @Post('/')
  async create(@BodyParams() @Groups('creation') stream: Stream, @UseToken() token: AccessToken): Promise<Stream> {
    return this.streamService.create(stream, token.user, token.groups);
  }

  @Put('/:id')
  async update(@PathParams('id') id: string, @BodyParams() @Groups('update') stream: Stream, @UseToken() token: AccessToken): Promise<Stream> {
    const result = await this.streamService.update(id, stream, token.groups);
    if (!result) {
      throw new NotFound('stream_not_found');
    }
    return result;
  }

  @Get('/:id/thumbnail')
  @Header({
    'Content-Type': 'image/jpeg',
  })
  async getThumbnail(@PathParams('id') id: string, @UseToken() token: AccessToken): Promise<Buffer> {
    const result = await this.streamService.getThumbnail(id, token.groups);
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

  @Delete('/:id')
  async delete(@PathParams('id') id: string, @UseToken() token: AccessToken): Promise<{count: number}> {
    const result = await this.streamService.deleteInGroups(id, token.groups);
    if (result === 0) {
      throw new NotFound('stream_not_found');
    }
    return { count: result };
  }
}
