/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Inject, Post, PathParams, Put,
} from '@tsed/common';
import { Description, Groups } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import RecorderService from '../services/recorder';
import Recording from '../models/recording';

@Controller('/recorder')
export default class RecorderController {
  @Inject()
  recorderService: RecorderService;

  @Get('/')
  @Description('Get all active recordings for user')
  async find(
    @UseToken() token: AccessToken,
  ): Promise<Recording[]> {
    return this.recorderService.find(token.user?.id);
  }

  @Post('/')
  async create(@BodyParams() @Groups('creation') request: Recording, @UseToken() token: AccessToken): Promise<Recording> {
    return this.recorderService.create(request, token.user?.id);
  }

  @Get('/:id')
  async get(@PathParams('id') id: string, @UseToken() token: AccessToken): Promise<Recording> {
    return this.recorderService.get(id, token.user?.id);
  }

  @Put('/:id')
  async update(@PathParams('id') id: string, @BodyParams() @Groups('update') request: Recording, @UseToken() token: AccessToken): Promise<Recording> {
    return this.recorderService.update(id, token.user?.id, request);
  }
}
