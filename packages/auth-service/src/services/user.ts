import { Service, Inject } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import Group from '../models/group';

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

@Service()
export default class UserService {
    @Inject(User)
    private users: MongooseModel<User>;

    @Inject(Group)
    private groups: MongooseModel<Group>;

    async $onInit() {
      if (process.env.NODE_ENV !== 'test') {
        const admin = await this.getByUsername('admin');
        let adminGroup = await this.groups.findOne({ name: 'FTL Root' });

        if (!adminGroup) {
          adminGroup = await this.groups.create({
            name: 'FTL Root',
            scopes: ['*.*'],
            children: [],
          });
        }

        if (!admin) {
          await this.create({
            username: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            password: 'admin',
            groups: [adminGroup],
          });
        }
      }
    }

    async findInGroups(groups: string[]) {
      return (
        await this.users.find({ groups: { $in: groups } })
          .select(['_id', 'username', 'groups', 'scopes', 'firstName', 'lastName'])
      ).map((user) => user.toClass());
    }

    async getInGroups(id: string, groups: string[]) {
      return (
        await this.users.findOne({ _id: id, groups: { $in: groups } })
          .select(['_id', 'username', 'groups', 'scopes', 'firstName', 'lastName'])
      )?.toClass();
    }

    async create(user: User) {
      // eslint-disable-next-line new-cap
      const entity = new this.users({
        ...user,
        ...(user.password && { password: bcrypt.hashSync(user.password, 8) }),
      });

      return entity.save();
    }

    async update(id: string, user: Partial<User>, groups: string[]) {
      await this.users.findOneAndUpdate({ _id: id, groups: { $in: groups } }, {
        ...user,
        ...(user.password && { password: bcrypt.hashSync(user.password, 8) }),
      });
      return this.getInGroups(id, groups);
    }

    async getByUsername(username: string): Promise<User | null> {
      return (await this.users.findOne({ username }))?.toClass();
    }

    async getWithCredentials(username: string, password: string) : Promise<User | null> {
      const entity = (await this.users.findOne({ username })).toClass();

      if (!entity) {
        await wait(20);
        return null;
      }

      if (!(await bcrypt.compare(password, entity.password))) {
        return null;
      }

      return entity;
    }
}
