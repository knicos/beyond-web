/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Inject, Put, PathParams, QueryParams,
} from '@tsed/common';
import { Description } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import { NotFound } from '@tsed/exceptions';
import ConfigService from '../services/config';
import Node from '../models/snapshot';
import Pageable from '../models/pageable';

@Controller('/configuration')
export default class StreamConfiguration {
  @Inject()
  configService: ConfigService;

  @Get('/')
  @Description('Get all available configurations')
  async find(@QueryParams() page: Pageable, @UseToken() token: AccessToken): Promise<Node[]> {
    return [];
  }

  @Put('/:id')
  async update(@PathParams('id') id: string, @BodyParams() node: Node, @UseToken() token: AccessToken): Promise<Node> {
    const result = null;
    if (!result) {
      throw new NotFound('node_not_found');
    }
    return result;
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
