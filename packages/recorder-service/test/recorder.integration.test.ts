import {PlatformTest} from "@tsed/common";
import {PlatformExpress} from "@tsed/platform-express";
import SuperTest from "supertest";
import {TestMongooseContext} from "@tsed/testing-mongoose";
import Server from "../src/server";
import { redisSet, redisClose } from "@ftl/common";
import { AccessToken } from "@ftl/types";
import Recording from "../src/models/recording";
import { stopRecordingInterval } from "../src/services/recorder";

describe("User REST API", () => {
  // bootstrap your Server to load all endpoints before run your test
  let request: SuperTest.SuperTest<SuperTest.Test>;

  beforeAll(async () => {
    await TestMongooseContext.bootstrap(Server, {
      platform: PlatformExpress,
      mongod: {
        replicaSet: true
      }
    })();
    // await PlatformTest.bootstrap(Server)();
    request = SuperTest(PlatformTest.callback());
  });
  afterAll(async () => {
    await stopRecordingInterval();
    await PlatformTest.reset();
    await redisClose();
    (await global.__MONGOD__) && (await global.__MONGOD__.stop());
  });

  afterEach(async () => {
    await TestMongooseContext.clearDatabase();
  })

  describe("POST /v1/recorder", () => {
    it("start a recording", async () => {
      redisSet<AccessToken>('token:xyz', {
        id: 'xyz',
        scopes: ['*.*'],
        groups: [],
        scope: '*.*',
      });

      const recording = new Recording();
      recording.channels = [0, 1];
      recording.streams = ["ftl://test.com"];
      recording.startTime = new Date();

      const response = await request
        .post("/v1/recorder")
        .set('Authorization', 'Bearer xyz')
        .send(recording)
        .expect(200);

      expect(response.body.status).toBe('recording');
      expect(response.body.streams).toContain('ftl://test.com');
    });
  });
});
