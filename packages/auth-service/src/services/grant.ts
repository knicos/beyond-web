/* eslint-disable camelcase */
import { OAuthTokenResponse, OAuthTokenRequest, OAuthPasswordGrant } from '@ftl/types';
import { Service, Inject } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import Client from '../models/client';
import User from '../models/user';
import UserService from './user';
import TokenService from './token';
import OAuthException from '../components/oauthexception';

const TOKEN_TTL = 2 * 60 * 60;

@Service()
export default class GrantService {
    @Inject()
    private userService: UserService;

    @Inject(Client)
    private clients: MongooseModel<Client>;

    @Inject()
    private tokenService: TokenService;

    async $onInit() {
      const client = await this.clients.findOne({ name: 'WebApp' });

      if (!client) {
        // eslint-disable-next-line new-cap
        const newClient = new this.clients({
          name: 'WebApp',
          grantTypes: ['password'],
          secret: 'none',
        });
        await newClient.save();
      }
    }

    async findClients(): Promise<Client[]> {
      return (await this.clients.find({})).map((client) => client.toClass());
    }

    async createClient(client: Client): Promise<Client> {
      return (await this.clients.create(client))?.toClass();
    }

    async updateClient(id: string, client: Partial<Client>): Promise<Client> {
      return (await this.clients.findByIdAndUpdate(id, client))?.toClass();
    }

    async getClient(id: string): Promise<Client> {
      return (await this.clients.findById(id))?.toClass();
    }

    async grant(request: OAuthTokenRequest): Promise<OAuthTokenResponse> {
      // Validate the client first
      const { client_id, client_secret } = request;

      if (!client_id || !client_secret) {
        throw new OAuthException('invalid_request');
      }

      let client: Client = null;
      try {
        client = (await this.clients.findById(client_id))?.toClass();
      } catch (err) {
        // Ignore
      }

      if (!client) {
        throw new OAuthException('invalid_client', 'Client not found');
      }

      if (client.secret && !client_secret) {
        throw new OAuthException('invalid_client', 'Missing client secret');
      }

      if (client_secret && client.secret !== client_secret) {
        throw new OAuthException('invalid_client', 'Bad client secret');
      }

      /* if (request.grant_type === 'client_credentials' && !client_secret) {
          throw new OAuthException('invalid_client', 'Required secret missing');
      } */

      if (!client.grantTypes.includes(request.grant_type)) {
        throw new OAuthException('unauthorized_client');
      }

      switch (request.grant_type) {
        // RFC 6749 Section 4.3
        case 'password':
          return this.passwordGrant(client, request as OAuthPasswordGrant);
        case 'client_credentials':
          return this.clientGrant(client);
        default:
          throw new OAuthException('unsupported_grant_type');
      }
    }

    private async passwordGrant(
      client: Client, request: OAuthPasswordGrant,
    ): Promise<OAuthTokenResponse> {
      const user = await this.userService.getWithCredentials(request.username, request.password);

      if (!user) {
        throw new OAuthException('invalid_grant', 'bad_credentials');
      }

      return this.createToken(client, user);
    }

    private async clientGrant(
      client: Client,
    ): Promise<OAuthTokenResponse> {
      return this.createToken(client, null);
    }

    private async createToken(client: Client, user: User): Promise<OAuthTokenResponse> {
      const token = await this.tokenService.create(client, user, TOKEN_TTL);

      return {
        token_type: 'Bearer',
        expires_in: TOKEN_TTL,
        access_token: token.id,
        // refresh_token?: string;
        // scope?: string;
      }
    }
}
