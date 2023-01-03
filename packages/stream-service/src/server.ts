import {
  Configuration, Inject, PlatformApplication, HttpServer,
} from '@tsed/common';
import { $log } from '@tsed/logger';
import express from 'express';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import { redisStreamListen, redisSetGroup, installMonitor } from '@ftl/common';
import './logger';

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
  mount: {
    '/v1': `${rootDir}/controllers/**/*.ts`,
  },
  logger: {
    logRequest: false,
  },
  mongoose: [
    {
      id: 'default',
      url: `mongodb://${process.env.MONGO_HOST}:27017/streams`,
      connectionOptions: {},
    },
  ],
})
export default class Server {
  @Inject()
  app: PlatformApplication;

  @Inject(HttpServer)
  httpServer: HttpServer;

  @Configuration()
  settings: Configuration;

  public $beforeInit() {
    redisSetGroup('stream-service');
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
