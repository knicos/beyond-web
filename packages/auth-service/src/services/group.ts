import { Service, Inject } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import Group from '../models/group';

@Service()
export default class GroupService {
    @Inject(Group)
    private groups: MongooseModel<Group>;

    async $onInit() {
      const adminGroup = await this.groups.findOne({ name: 'FTL Root' });

      if (!adminGroup) {
        await this.groups.create({
          name: 'FTL Root',
          scopes: ['*.*'],
          children: [],
        });
      }
    }

    async getAllRecursive(ids: string[]): Promise<Group[]> {
      return this.groups.find({ _id: { $in: ids } }).populate('children');
    }
}
