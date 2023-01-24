import { PlatformTest } from '@tsed/common';
import TokenService from '../src/services/token';
import GroupService from '../src/services/group';
import Client from '../src/models/client';
import { redisSet } from '@ftl/common';
import User from '../src/models/user';

jest.mock('@ftl/common', () => ({
  redisSubscribe: jest.fn(),
  RedisLogger: jest.fn().mockImplementation(() => ({
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  })),
  redisSetGroup: jest.fn(),
  redisConsumerId: jest.fn(),
  redisConsumerGroup: jest.fn(),
  redisSet: jest.fn(),
}));

describe('TokenService', () => {
  beforeEach(PlatformTest.create);
  afterEach(PlatformTest.reset);

  describe('create()', () => {
    it('creates a client only token', async () => {
      const locals = [
        {
          token: GroupService,
          use: {
            getAllRecursive: jest.fn(() => [
              {
                scopes: ['abc'],
              },
            ]),
          },
        },
      ]
      const service = await PlatformTest.invoke<TokenService>(TokenService, locals);

      const client = new Client();
      client.groups = ['xyz'];
      client.name = 'testClient';
      client.id = 'xxx';

      const token = await service.create(client, null, 1000);

      expect(token).toBeTruthy();
      expect(token.client?.id).toBe(client.id);
      expect(token.user).toBeFalsy();
      expect(token.groups).toHaveLength(1);
      expect(token.groups[0]).toBe('xyz');
      expect(token.scopes).toHaveLength(1);
      expect(token.scopes[0]).toBe('abc');
      expect(redisSet).toHaveBeenCalledWith(`token:${token.id}`, expect.any(Object), 1000);
    });

    it('creates a user token', async () => {
      const locals = [
        {
          token: GroupService,
          use: {
            getAllRecursive: jest.fn(() => [
              {
                scopes: ['abc'],
              },
            ]),
          },
        },
      ]
      const service = await PlatformTest.invoke<TokenService>(TokenService, locals);

      const client = new Client();
      client.groups = ['xyz'];
      client.name = 'testClient';
      client.id = 'xxx';

      const user = new User();
      user.id = 'yyy';
      user.groups = ['zyx'];
      user.scopes = ['def'];
      user.firstName = 'Test';
      user.lastName = 'User';
      user.username = 'testuser';

      const token = await service.create(client, user, 1000);

      expect(token).toBeTruthy();
      expect(token.client?.id).toBe(client.id);
      expect(token.user?.id).toBe(user.id);
      expect(token.groups).toHaveLength(2);
      expect(token.scopes).toHaveLength(2);
      expect(token.scopes).toContain('abc');
      expect(token.scopes).toContain('def');
      expect(redisSet).toHaveBeenCalledWith(`token:${token.id}`, expect.any(Object), 1000);
    });
  });
});
