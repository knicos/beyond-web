import { PlatformTest } from '@tsed/common';
import { OAuthTokenRequest } from '@ftl/types';
import GrantService from '../src/services/grant';
import Client from '../src/models/client';
import TokenService from '../src/services/token';
import UserService from '../src/services/user';

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
}));

describe('GrantService', () => {
  beforeEach(PlatformTest.create);
  afterEach(PlatformTest.reset);

  describe('grant client_credentials', () => {
    it('should issue a token for valid credentials', async () => {
      const locals = [
        {
          token: Client,
          use: {
            findOne: jest.fn(() => ({})),
            findById: jest.fn((id: string) => {
              const client = new Client();
              client.id = id;
              client.secret = 'secret';
              client.grantTypes = ['client_credentials'];
              return { toClass: () => client };
            }),
          },
        },
        {
          token: TokenService,
          use: {
            create: jest.fn(() => ({
              id: 'token_id',
            })),
          },
        },
        {
          token: UserService,
          use: {
          },
        },
      ]
      const service = await PlatformTest.invoke<GrantService>(GrantService, locals);

      const request: OAuthTokenRequest = {
        grant_type: 'client_credentials',
        client_id: 'xxx',
        client_secret: 'secret',
      };
      const result = await service.grant(request);

      expect(result).toBeTruthy();
      expect(result.access_token).toBe('token_id');
    });

    it('should issue fail on bad secret', async () => {
      const locals = [
        {
          token: Client,
          use: {
            findOne: jest.fn(() => ({})),
            findById: jest.fn((id: string) => {
              const client = new Client();
              client.id = id;
              client.secret = 'secret';
              client.grantTypes = ['client_credentials'];
              return { toClass: () => client };
            }),
          },
        },
        {
          token: TokenService,
          use: {
            create: jest.fn(() => ({
              id: 'token_id',
            })),
          },
        },
        {
          token: UserService,
          use: {
          },
        },
      ]
      const service = await PlatformTest.invoke<GrantService>(GrantService, locals);

      const request: OAuthTokenRequest = {
        grant_type: 'client_credentials',
        client_id: 'xxx',
        client_secret: 'badsecret',
      };
      const result = service.grant(request);
      await expect(result).rejects.toThrow('Bad client secret');
    });

    it('should fail on a bad id', async () => {
      const locals = [
        {
          token: Client,
          use: {
            findOne: jest.fn(() => ({})),
            findById: jest.fn(() => null),
          },
        },
        {
          token: TokenService,
          use: {
            create: jest.fn(() => ({
              id: 'token_id',
            })),
          },
        },
        {
          token: UserService,
          use: {
          },
        },
      ]
      const service = await PlatformTest.invoke<GrantService>(GrantService, locals);

      const request: OAuthTokenRequest = {
        grant_type: 'client_credentials',
        client_id: 'xxx',
        client_secret: 'secret',
      };
      const result = service.grant(request);
      await expect(result).rejects.toThrow('Client not found');
    });

    it('should fail on bad grant type', async () => {
      const locals = [
        {
          token: Client,
          use: {
            findOne: jest.fn(() => ({})),
            findById: jest.fn((id: string) => {
              const client = new Client();
              client.id = id;
              client.secret = 'secret';
              client.grantTypes = ['password'];
              return { toClass: () => client };
            }),
          },
        },
        {
          token: TokenService,
          use: {
            create: jest.fn(() => ({
              id: 'token_id',
            })),
          },
        },
        {
          token: UserService,
          use: {
          },
        },
      ]
      const service = await PlatformTest.invoke<GrantService>(GrantService, locals);

      const request: OAuthTokenRequest = {
        grant_type: 'client_credentials',
        client_id: 'xxx',
        client_secret: 'secret',
      };
      const result = service.grant(request);
      await expect(result).rejects.toThrow('Grant type not allowed');
    });
  });
});
