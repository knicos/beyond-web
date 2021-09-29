import { TokenType } from './token';

export type OAuthGrantType = 'password' | 'authorization_code' | 'client_credentials' | 'refresh_token';

// RFC 6749 Section 4
export interface OAuthTokenRequest {
  grant_type: OAuthGrantType;
  client_id?: string;
  client_secret?: string;
}

export type OAuthChallengeMethod = 'plain' | 'S256' | 'none';

export interface OAuthAuthRequest {
  response_type: 'code' | 'token';
  client_id: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  // RFC 7636 Section 4.3
  code_challenge?: string;
  code_challenge_method?: OAuthChallengeMethod;
  error_code?: string;
}

// RFC 6749 Section 4.3.2
export interface OAuthPasswordGrant extends OAuthTokenRequest {
  username: string;
  password: string;
  scope?: string;
}

// RFC 6749 Section 4.1.3
export interface OAuthAuthCodeGrant extends OAuthTokenRequest {
  code: string;
  redirect_uri: string;
  // RFC 7636 Section 4.5
  code_verifier?: string;
}

// RFC 6749 Section 4.4.2
export interface OAuthClientCredGrant extends OAuthTokenRequest {
  scope?: string;
  tenant?: string; // Non-standard
}

// RFC 6749 Section 6.
export interface OAuthRefreshGrant extends OAuthTokenRequest {
  refresh_token: string;
  scope?: string;
  tenant?: string; // Non-standard
}

// RFC 6749 Section 4.3.3 and 5.1
export interface OAuthTokenResponse {
  token_type: TokenType;
  expires_in?: number;
  access_token: string;
  refresh_token?: string;
  password_expire?: string;
  scope?: string;
}
