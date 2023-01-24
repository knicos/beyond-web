import {PlatformTest} from "@tsed/common";
import {PlatformExpress} from "@tsed/platform-express";
import SuperTest from "supertest";
import {TestMongooseContext} from "@tsed/testing-mongoose";
import Server from "../src/server";
import { redisSet, redisClose } from "@ftl/common";
import { AccessToken } from "@ftl/types";
import { MongooseModel } from "@tsed/mongoose";
import UserService from "../src/services/user";
import User from "../src/models/user";
import Group from "../src/models/group";

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
    await PlatformTest.reset();
    await redisClose();
    (await global.__MONGOD__) && (await global.__MONGOD__.stop());
  });

  afterEach(async () => {
    await TestMongooseContext.clearDatabase();
  })

  describe("GET /v1/users", () => {
    it("can list users in same group", async () => {
      const userService = PlatformTest.get<UserService>(UserService);
      const groupRepo = PlatformTest.get<MongooseModel<Group>>(Group);
      const group = await (new groupRepo({
        name: 'ABC',
        scopes: [],
      })).save();

      redisSet<AccessToken>('token:xyz', {
        id: 'xyz',
        scopes: ['*.*'],
        groups: [group._id],
        scope: '*.*',
      });

      const testUser1 = new User();
      testUser1.firstName = 'Test';
      testUser1.lastName = 'User';
      testUser1.username = 'testuser@example.com';
      testUser1.groups = [group];
      await userService.create(testUser1);

      const response = await request
        .get("/v1/users")
        .set('Authorization', 'Bearer xyz')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].username).toBe('testuser@example.com');
    });

    it("does not list users in another group", async () => {
      const userService = PlatformTest.get<UserService>(UserService);
      const groupRepo = PlatformTest.get<MongooseModel<Group>>(Group);
      const group = await (new groupRepo({
        name: 'ABC',
        scopes: [],
      })).save();

      redisSet<AccessToken>('token:xyz', {
        id: 'xyz',
        scopes: ['*.*'],
        groups: [],
        scope: '*.*',
      });

      const testUser1 = new User();
      testUser1.firstName = 'Test';
      testUser1.lastName = 'User';
      testUser1.username = 'testuser@example.com';
      testUser1.groups = [group];
      await userService.create(testUser1);

      const response = await request
        .get("/v1/users")
        .set('Authorization', 'Bearer xyz')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });
});
