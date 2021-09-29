import express from "express";
import expressWs from "express-ws";
import cookieParser from 'cookie-parser';
const app = expressWs(express()).app;
import {createSource} from "./source";
import {redisGet, redisSendCommand, redisReply } from '@ftl/common';
import {$log} from '@tsed/logger';

app.use(cookieParser());

function extractBearer(token: string): string{
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
  } else {
    return [null, null];
  }
}

async function authorizeWebsocket(req: express.Request): Promise<boolean> {
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
      return false;
    }
  } else {
    const tokenId = req.cookies?.ftl_session || req.query?.access_token || extractBearer(req.headers.authorization);
    if (typeof tokenId !== 'string' || !(await redisGet(`token:${tokenId}`))) {
      $log.warn('Bad websocket connection');
      return false;
    }
  }
  return true;
}

app.ws('/v1/stream', async (ws, req) => {
  if (!(await authorizeWebsocket(req))) {
    $log.warn('Closing socket');
    ws.close(1008);
    return;
  }
	createSource(ws);
});

export default app;
