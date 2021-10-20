import { Configuration, Inject, PlatformApplication } from '@tsed/common';
import express from 'express';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import { redisStreamListen, redisSetGroup } from '@ftl/common';

const rootDir = __dirname;

@Configuration({
  rootDir,
  acceptMimes: ['application/json'],
  port: 8080,
  debug: false,
  mount: {
    '/v1': `${rootDir}/controllers/**/*.ts`,
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

  @Configuration()
  settings: Configuration;

  public $beforeInit() {
    redisSetGroup('stream-service');
  }

  public $afterInit() {
    redisStreamListen('consumer1');
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
  }
}
