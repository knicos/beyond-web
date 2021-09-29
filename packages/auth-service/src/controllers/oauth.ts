/* eslint-disable class-methods-use-this */
import {
  BodyParams, HeaderParams, Get, Post, Inject, Res,
} from '@tsed/common';
import { Description, Header } from '@tsed/schema';
import {
  AccessToken, OAuthTokenRequest, OAuthTokenResponse,
} from '@ftl/types';
import { Controller, Public, UseToken } from '@ftl/common';
import GrantService from '../services/grant';
import TokenService from '../services/token';

const COOKIE_TTL = 7 * 24 * 60 * 60 * 1000;

@Controller('/oauth2')
export default class OAuth2 {
  @Inject()
  grantService: GrantService;

  @Inject()
  tokenService: TokenService;

  @Post('/token')
  @Public()
  @Header({
    'Content-Type': 'application/json;charset=UTF-8',
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
  })
  @Description('OAuth2 token request')
  // eslint-disable-next-line no-unused-vars
  async token(@Res() res, @BodyParams() request: OAuthTokenRequest, @HeaderParams('authorization') auth?: string): Promise<OAuthTokenResponse> {
    // RFC 6749 Section 2.3.1, use of Basic for client credentials
    /* const [authType, authToken] = extractToken(auth);
    if (authType === 'Basic') {
      const [client_id, client_secret] = extractBasicAuth(authToken);
      request.client_id = client_id;
      request.client_secret = client_secret;
    } */

    const response = await this.grantService.grant(request);
    res.cookie('ftl_session', response.access_token, { maxAge: COOKIE_TTL, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return response;
  }

  @Get('/validate')
  @Description('Exchange a token id for a full token object')
  validate(@UseToken() token: AccessToken): AccessToken {
    return token;
  }

  @Post('/logout')
  @Description('Invalidate the current access token')
  async logout(@UseToken() token: AccessToken) {
    await this.tokenService.remove(token.id);
  }
}
