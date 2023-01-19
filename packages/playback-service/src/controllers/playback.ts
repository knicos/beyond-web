/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Inject, Post, PathParams, Put,
} from '@tsed/common';
import { Description, Groups, parameters } from '@tsed/schema';
import { AccessToken } from '@ftl/types';
import { Controller, UseToken } from '@ftl/common';
import PlaybackService from '../services/playback';
import Recording from '../models/playback';

@Controller('/playback')
export default class RecorderController {
  @Inject()
  srvc: PlaybackService;

  @Get('/')
  @Description('Get all recordings for user')
  async listRecordings(
    @UseToken() token: AccessToken,
  ): Promise<Recording[]> {
    return this.srvc.listRecordings();
  }

  @Post('/startPlay/:id')
  @Description('Begin a recording playback')
  async startPlay(
    @PathParams('id') id: string,
    @UseToken() token: AccessToken,
  ): Promise<Object> {
    await this.srvc.startPlayback(id);
    return { msg: 'start ok', fileId: id };
  }

  @Post('/stopPlay/:id')
  @Description('Stop a recording playback')
  async stopPlay(
    @PathParams('id') id: string,
    @UseToken() token: AccessToken,
  ): Promise<Object> {
    await this.srvc.stopPlayback(id);
    return { msg: 'stop ok', fileId: id };
  }
}
