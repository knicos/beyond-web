/* eslint-disable class-methods-use-this */
import {
  BodyParams, Get, Inject, Post, PathParams, Put,
} from '@tsed/common';
import { Description, Groups } from '@tsed/schema';
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
}
