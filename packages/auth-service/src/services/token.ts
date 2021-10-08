import { Service, Inject } from '@tsed/common';
import { AccessToken } from '@ftl/types';
import { v4 as uuidv4 } from 'uuid';
import { redisSet, redisDelete } from '@ftl/common';
import User from '../models/user';
import Client from '../models/client';
import GroupService from './group';

@Service()
export default class TokenService {
    @Inject()
    groupService: GroupService;

    async remove(id: string): Promise<void> {
      await redisDelete(id);
    }

    async create(client: Client, user: User, ttl: number): Promise<AccessToken> {
      const groupIds = [
        ...user?.groups?.filter((g) => g).map((g) => g.toString()) || [],
        ...client?.groups?.filter((g) => g).map((g) => g.toString()) || [],
      ]
      const groups = await this.groupService.getAllRecursive(groupIds);

      const scopes = new Set<string>();
      groups?.forEach((group) => {
        group.scopes?.forEach((scope) => scopes.add(scope));
      });

      // Add any client scopes
      client.scopes?.forEach((scope) => scopes.add(scope));

      // Add any user specific scopes
      user?.scopes?.forEach((scope) => scopes.add(scope));

      const token = {
        id: uuidv4(),
        ...(user && {
          user: {
            // eslint-disable-next-line no-underscore-dangle
            id: user.id || user._id,
            name: `${user.firstName} ${user.lastName}`,
            username: user.username,
          },
        }),
        ...(client && {
          client: {
            // eslint-disable-next-line no-underscore-dangle
            id: client.id || client._id,
            name: client.name,
          },
        }),
        groups: groupIds,
        scopes: Array.from(scopes),
        scope: 'none',
      };

      redisSet(`token:${token.id}`, token, ttl);

      return token;
    }
}
