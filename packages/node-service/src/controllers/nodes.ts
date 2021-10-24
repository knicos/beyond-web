/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Inject, Put, PathParams, QueryParams,
} from '@tsed/common';
import { Description, Groups } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import { NotFound } from '@tsed/exceptions';
import NodeService from '../services/node';
import Node from '../models/node';
import Pageable from '../models/pageable';
import NodeQuery from '../models/query';

@Controller('/nodes')
export default class Nodes {
  @Inject()
  nodeService: NodeService;

  @Get('/')
  @Description('Get all available users')
  async find(
    @QueryParams() page: Pageable,
    @QueryParams() query: NodeQuery,
    @UseToken() token: AccessToken,
  ): Promise<Node[]> {
    return this.nodeService.findInGroups(token.groups, query, page.offset, page.limit);
  }

  @Put('/:id')
  async update(@PathParams('id') id: string, @BodyParams() @Groups('update') node: Node, @UseToken() token: AccessToken): Promise<Node> {
    const result = await this.nodeService.update(id, node, token.groups);
    if (!result) {
      throw new NotFound('node_not_found');
    }
    return result;
  }

  @Get('/:id')
  async get(@PathParams('id') id: string, @UseToken() token: AccessToken): Promise<Node> {
    const result = await this.nodeService.getInGroups(id, token.groups);
    if (!result) {
      throw new NotFound('node_not_found');
    }
    return result;
  }
}
