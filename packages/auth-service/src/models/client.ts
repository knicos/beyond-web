import {
  Property, Required, CollectionOf, MinLength, MaxLength, Minimum, Default,
} from '@tsed/schema';
import { Model, ObjectID, Ref } from '@tsed/mongoose';
import { OAuthGrantType } from '@ftl/types';
import Group from './group';

@Model()
export default class Client {
    id?: string;

    @ObjectID('id')
    _id?: string;

    @Required()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @Property()
    @MinLength(10)
    @MaxLength(100)
    secret?: string;

    @Required()
    @CollectionOf(String)
    grantTypes: OAuthGrantType[];

    @Property()
    @CollectionOf(String)
    redirects: string[];

    @Property()
    @CollectionOf(String)
    scopes?: string[];

    @Ref(Group)
    @CollectionOf(Group)
    groups?: Ref<Group>[];

    @Required()
    @Minimum(0)
    @Default(2 * 60 * 60)
    expiryTTL: number;
}
