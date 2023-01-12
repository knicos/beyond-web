import {
  Configuration, Inject, PlatformApplication,
} from '@tsed/common';
import { $log } from '@tsed/logger';
import express from 'express';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import { redisStreamListen, redisSetGroup, installMonitor } from '@ftl/common';
import Http from 'http';
import './logger';
import Recordings from './controllers/recordings';

$log.appenders.set('redis', {
  type: 'redis',
  level: ['warn', 'info', 'error', 'fatal'],
});

const rootDir = __dirname;

@Configuration({
  rootDir,
  acceptMimes: ['application/json'],
  port: 8080,
  debug: false,
  logger: {
    disableRoutesSummary: true,
    disableBootstrapLog: true,
    logRequest: false,
  },
  mount: {
    '/v1': [Recordings],
  },
})
export default class Server {
  @Inject()
  app: PlatformApplication;

  @Inject(Http.Server)
  httpServer: Http.Server;

  @Configuration()
  settings: Configuration;

  public $beforeInit() {
    redisSetGroup('recorder-service');
  }

  public $afterInit() {
    redisStreamListen();
  }

  /**
   * This method let you configure the express middleware required by your application to works.
   * @returns {Server}
   */
  public $beforeRoutesInit(): void | Promise<any> {
    this.app
      .use(compress({}))
      .use(cookieParser())
      .use(express.urlencoded())
      .use(express.json());

    installMonitor(this.httpServer);
  }
}
