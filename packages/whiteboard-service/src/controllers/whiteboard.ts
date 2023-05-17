/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Inject, Post, PathParams, MultipartFile,
  RawBodyParams, Put, Context, PlatformMulterFile
} from '@tsed/common';
import { Description, Groups, Returns } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import WhiteboardService from '../services/whiteboards'
import { log } from 'console';
import { ok } from 'assert';

@Controller('/whiteboard')
export default class WhiteboardController {
  @Inject() // add service and add actual db implementation there
  whiteboardService: WhiteboardService;

  @Get('/')
  async listActiveWhiteboards(
    @UseToken() token: AccessToken,
  ): Promise<any> {

    return "OK"
  }

  @Post('/')
  async createNewWhiteboard(
    @UseToken() token: AccessToken,
  ): Promise<any> {
    // redirect
    return "OK"
  }

  @Get('/:id')
  async getWhiteboard(
    @Context() ctx  : Context,
    @UseToken() token: AccessToken,
    @PathParams('id') id : string
  ): Promise<Buffer> {
    const whiteboard = this.whiteboardService.getOrCreate(id);

    ctx.response.contentType('image/png');

    return whiteboard.get();
  }

  @Post('/:id')
  async updateWhiteboard(
    @UseToken() token: AccessToken,
    @PathParams('id') id : string,
    @MultipartFile("image") image : PlatformMulterFile,
  ): Promise<any> {
    this.whiteboardService.update(id, new Uint8Array(image.buffer));
    return "OK"
  }

}