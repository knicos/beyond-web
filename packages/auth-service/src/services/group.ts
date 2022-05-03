import { Service, Inject } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import Group from '../models/group';

@Service()
export default class GroupService {
    @Inject(Group)
    private groups: MongooseModel<Group>;

    async getAllRecursive(ids: string[]): Promise<Group[]> {
      return this.groups.find({ _id: { $in: ids } }).populate('children');
    }
}
