/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Post, Inject, Put, PathParams,
} from '@tsed/common';
import { Description, Groups } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import { NotFound } from '@tsed/exceptions';
import UserService from '../services/user';
import User from '../models/user';

@Controller('/users')
export default class Users {
  @Inject()
  userService: UserService;

  @Get('/')
  @Description('Get all available users')
  async find(@UseToken() token: AccessToken): Promise<User[]> {
    return this.userService.findInGroups(token.groups);
  }

  @Post('/')
  async create(@BodyParams() @Groups('creation') user: User): Promise<User> {
    return this.userService.create(user);
  }

  @Put('/:id')
  async update(@PathParams('id') id: string, @BodyParams() user: User, @UseToken() token: AccessToken): Promise<User> {
    const result = await this.userService.update(id, user, token.groups);
    if (!result) {
      throw new NotFound('user_not_found');
    }
    return result;
  }

  @Get('/:id')
  async get(@PathParams('id') id: string, @UseToken() token: AccessToken): Promise<User> {
    const result = await this.userService.getInGroups(id, token.groups);
    if (!result) {
      throw new NotFound('user_not_found');
    }
    return result;
  }
}
