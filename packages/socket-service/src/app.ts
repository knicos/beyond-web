import express from 'express';
import expressWs from 'express-ws';
import cookieParser from 'cookie-parser';
import {
  redisGet, redisSendCommand, redisReply, redisStreamListen,
} from '@ftl/common';
import { $log } from '@tsed/logger';
import { AccessToken } from '@ftl/types';
import { createSource } from './source';

const { app } = expressWs(express());

app.use(cookieParser());

function extractBearer(token: string): string {
  if (typeof token !== 'string') {
    return null;
  }
  const ix = token.indexOf(' ');
  if (ix > 0) {
    const type = token.substring(0, ix);
    const value = token.substring(ix + 1);

    if (type === 'Bearer') {
      return value;
    }
  }
  return null;
}

function extractBasic(token: string): [string, string] {
  const split1 = token.split(' ');
  const decode = Buffer.from(split1[1], 'base64').toString('utf-8');
  const split2 = decode.split(':');
  if (split2.length === 2) {
    return [split2[0], split2[1]];
  }
  return [null, null];
}

async function authorizeWebsocket(req: express.Request): Promise<AccessToken> {
  let tokenId: string = null;

  if (req.headers.authorization?.startsWith('Basic ')) {
    const [username, password] = extractBasic(req.headers.authorization);
    const result: any = await new Promise((resolve) => {
      const rid = redisReply(resolve);
      redisSendCommand('authservice', rid, 'token', {
        client_id: username,
        client_secret: password,
        grant_type: 'client_credentials',
      });
    });

    if (result.error || !result.access_token) {
      $log.warn('Bad websocket connection', result.error);
      return null;
    }

    tokenId = result.access_token;
  } else {
    tokenId = req.cookies?.ftl_session
      || req.query?.access_token
      || extractBearer(req.headers.authorization);
    if (typeof tokenId !== 'string') {
      $log.warn('Bad websocket connection');
      return null;
    }
  }

  if (!tokenId) {
    $log.warn('Bad websocket connection');
    return null;
  }

  return redisGet(`token:${tokenId}`)
}

app.ws('/v1/socket', async (ws, req) => {
  let token: AccessToken = await authorizeWebsocket(req);
  // Allow authorization to be disabled
  if (process.env.FTL_SOCKET_NOAUTH !== 'true' && !token) {
    $log.warn(`Unauthorized socket: ${req.ip}`);
    ws.close(1008);
    return;
  }
  if (!token) {
    token = {
      id: 'no-id',
      groups: [],
      scopes: [],
      scope: '',
    }
  }
  createSource(ws, req.headers['x-forwarded-for'] as string, token, !!req.headers['user-agent']);
});

redisStreamListen();

export default app;
