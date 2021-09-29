import { Middleware, Context } from '@tsed/common';
import { Unauthorized, Forbidden } from '@tsed/exceptions';
import { AccessToken } from '@ftl/types';
import { redisGet } from '../redis';

type TokenType = 'Bearer' | 'Basic' | 'Unknown';

function extractToken(token: string): [TokenType, string] {
  if (typeof token !== 'string') {
    return ['Unknown', null];
  }
  const ix = token.indexOf(' ');
  if (ix > 0) {
    const type = token.substring(0, ix);
    const value = token.substring(ix + 1);

    switch (type) {
      case 'Bearer':
      case 'Basic':
        return [<TokenType>type, value];
      default:
        return ['Unknown', null];
    }
  }
  return ['Unknown', null];
}

function extractBearerToken(token: string): string {
  const [type, value] = extractToken(token);

  if (type !== 'Bearer') {
    throw new Unauthorized('Unauthorized');
  }
  return value;
}

function checkAccessScope(scopes: string[], subject: string, action: string): string | null {
  return scopes.find((v) => v === '*.*' || `${subject}.*` || `${subject}.${action}`);
}

interface FTLSession {
    accessToken: AccessToken;
}

@Middleware()
export default class AuthMiddleware {
  public static userService = null;

  public async use(@Context() ctx: Context): Promise<void> {
    const { request, endpoint } = ctx;
    const { query, headers } = request;

    const opData = endpoint.operation.toJSON();
    if (opData.security.length === 0) return;

    const options = endpoint.get(AuthMiddleware) || {};
    const session = <FTLSession>(<unknown>request);
    const subject = options.subject || endpoint.token.name;
    const action = options.action || endpoint.propertyName;

    const tokenId = `${query?.access_token || request.cookies?.ftl_session || extractBearerToken(headers.authorization)}`;
    const token = await redisGet<AccessToken>(`token:${tokenId}`);

    if (!token) {
      throw new Unauthorized('not_logged_in');
    }

    token.scope = checkAccessScope(token.scopes, subject, action);

    session.accessToken = {
      ...token,
      bearer: tokenId,
    };

    if (!token.scope) {
      throw new Forbidden('bad_scope');
    }
  }
}
