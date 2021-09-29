import {
  Property, Required, CollectionOf, Groups, RequiredGroups,
} from '@tsed/schema';
import {
  Model, ObjectID, Unique, Indexed, Ref,
} from '@tsed/mongoose';
import Group from './group';

@Model()
export default class User {
    id?: string;

    @ObjectID('id')
    @Groups('!creation')
    _id?: string;

    @RequiredGroups('creation')
    @Required()
    @Unique()
    @Indexed()
    username: string;

    @RequiredGroups('creation')
    @Required()
    firstName: string;

    @RequiredGroups('creation')
    @Required()
    lastName: string;

    @Property()
    password?: string;

    @Ref(Group)
    @CollectionOf(Group)
    groups?: Ref<Group>[];

    @Property()
    @CollectionOf(String)
    scopes?: string[];
}
