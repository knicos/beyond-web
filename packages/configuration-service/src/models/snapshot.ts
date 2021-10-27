import {
  Property, Required, Groups, DateTime, CollectionOf, Default,
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

    @Required()
    @Indexed()
    streamId: string;

    @Required()
    framesetId: number;

    @Required()
    frameId: number;

    // @Required()
    @DateTime()
    @Default(new Date())
    timestamp: Date;

    @CollectionOf(String)
    @Required()
    data: Map<string, string>;

    @CollectionOf(String)
    @Required()
    @Default([])
    tags: string[];

    @Property()
    @Groups('!creation', '!update')
    owner?: string;

    @CollectionOf(String)
    @Required()
    @Default([])
    @Groups('!creation', '!update')
    groups: string[];
}
