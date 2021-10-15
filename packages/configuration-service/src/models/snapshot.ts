import {
  Property, Required, Groups, DateTime, CollectionOf,
} from '@tsed/schema';
import {
  Model, ObjectID, Indexed,
} from '@tsed/mongoose';

@Model()
export default class Snapshot {
    id?: string;

    @ObjectID('id')
    @Groups('!creation')
    _id?: string;

    @Property()
    @Indexed()
    streamId?: string;

    @Property()
    framesetId?: number;

    @Property()
    frameId?: number;

    @Required()
    @DateTime()
    timestamp: Date;

    @CollectionOf(String)
    @Required()
    data: Map<string, string>;
}
