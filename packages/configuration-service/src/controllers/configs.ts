/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Inject, Post, PathParams, QueryParams,
} from '@tsed/common';
import { Description, Groups } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import { NotFound } from '@tsed/exceptions';
import ConfigService from '../services/config';
import Pageable from '../models/pageable';
import ConfigQuery from '../models/query';
import Snapshot from '../models/snapshot';

@Controller('/configuration')
export default class StreamConfiguration {
  @Inject()
  configService: ConfigService;

  @Get('/')
  @Description('Get all available configurations')
  async find(
    @QueryParams() page: Pageable,
    @QueryParams() query: ConfigQuery,
    @UseToken() token: AccessToken,
  ): Promise<Snapshot[]> {
    return this.configService.findInGroups(token.user?.id, token.groups, query, page);
  }

  @Post('/')
  async create(@BodyParams() @Groups('creation') snap: Snapshot, @UseToken() token: AccessToken): Promise<Snapshot> {
    return this.configService.create(snap, token.user?.id, token.groups);
  }

  @Get('/:id')
  async get(@PathParams('id') id: string, @UseToken() token: AccessToken): Promise<Node> {
    const result = null;
    if (!result) {
      throw new NotFound('node_not_found');
    }
    return result;
  }
}
