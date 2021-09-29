import { Catch, PlatformContext, ExceptionFilterMethods } from '@tsed/common';
import { Exception } from '@tsed/exceptions';

export type OAuthErrorCode =
  | 'invalid_request'
  | 'invalid_client'
  | 'invalid_grant'
  | 'unauthorized_client'
  | 'unsupported_grant_type'
  | 'unsupported_response_type'
  | 'invalid_scope';

// RFC 6749 Section 5.2
interface OAuthError {
  error: OAuthErrorCode;
  error_description?: string;
  error_uri?: string;
}

export default class OAuthException extends Exception {
  constructor(code: OAuthErrorCode, message?: string) {
    const body: OAuthError = {
      error: code,
    };
    if (message) body.error_description = message;

    super(400, message, body);
  }
}

@Catch(OAuthException)
export class OAuthExceptionFilter implements ExceptionFilterMethods {
  catch(exception: OAuthException, ctx: PlatformContext): void {
    const { response, logger } = ctx;

    logger.error({
      error: exception.body,
    });

    response.setHeaders(exception.headers).status(exception.status).body(exception.body);
  }
}