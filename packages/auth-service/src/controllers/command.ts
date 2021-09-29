/* eslint-disable class-methods-use-this */
import {
  Inject, Controller,
} from '@tsed/common';
import { redisListen } from '@ftl/common';
import { OAuthTokenRequest } from '@ftl/types';
import GrantService from '../services/grant';

@Controller({})
export default class Commands {
  @Inject()
  grantService: GrantService;

  $onInit() {
    redisListen('authservice', async (cmd: string, data: unknown) => {
      console.log('GOT COMMAND', cmd, data);

      try {
        switch (cmd) {
          case 'token':
            return await this.createToken(data as OAuthTokenRequest);
          default:
            return { error: 'unknown_command' };
        }
      } catch (err) {
        console.error(err);
        return {
          error: err.description || err.toString(),
        }
      }
    });
  }

  async createToken(request: OAuthTokenRequest) {
    return this.grantService.grant(request);
  }
}
