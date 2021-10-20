import {
  Property, Required, Groups, DateTime, CollectionOf, Default,
} from '@tsed/schema';
import {
  Model, ObjectID,
} from '@tsed/mongoose';

@Model()
export default class Snapshot {
    id?: string;

    @ObjectID('id')
    @Groups('!creation')
    _id?: string;

    @Required()
    @DateTime()
    timestamp: Date;

    @CollectionOf(String)
    @Required()
    data: Map<string, string>;

    @CollectionOf(String)
    @Required()
    @Default([])
    tags: string[];

    @Property()
    owner?: string;

    @CollectionOf(String)
    @Required()
    @Default([])
    groups: string[];
}
