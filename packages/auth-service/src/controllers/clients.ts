import {
  BodyParams, Get, Post, Inject, Put, PathParams,
} from '@tsed/common';
import { Description, Groups } from '@tsed/schema';
import { Controller } from '@ftl/common';
import { NotFound } from '@tsed/exceptions';
import GrantService from '../services/grant';
import Client from '../models/client';

@Controller('/clients')
export default class Clients {
  @Inject()
  grantService: GrantService;

  @Get('/')
  @Description('Get all available clients')
  async find(): Promise<Client[]> {
    return this.grantService.findClients();
  }

  @Post('/')
  async create(@BodyParams() @Groups('creation') client: Client): Promise<Client> {
    return this.grantService.createClient(client);
  }

  @Put('/:id')
  async update(@PathParams('id') id: string, @BodyParams() client: Client): Promise<Client> {
    const result = await this.grantService.updateClient(id, client);
    if (!result) {
      throw new NotFound('client_not_found');
    }
    return result;
  }

  @Get('/:id')
  async get(@PathParams('id') id: string): Promise<Client> {
    const result = await this.grantService.getClient(id);
    if (!result) {
      throw new NotFound('client_not_found');
    }
    return result;
  }
}
