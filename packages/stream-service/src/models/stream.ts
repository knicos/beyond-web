import {
  Property, Required, RequiredGroups, CollectionOf, Groups, Default,
} from '@tsed/schema';
import {
  Model, ObjectID, Indexed, Unique,
} from '@tsed/mongoose';
import Frameset from './frameset';

@Model()
export default class Stream {
    id?: string;

    @ObjectID('id')
    @Groups('!creation')
    _id?: string;

    @Required()
    @Groups('!creation', '!update')
    @Indexed()
    @Unique()
    uri: string;

    @Required()
    @Groups('!creation', '!update')
    owner: string;

    @CollectionOf(String)
    @Required()
    @RequiredGroups('!update')
    @Default([])
    @Groups('!creation')
    groups: string[];

    @Property()
    title?: string;

    @CollectionOf(Frameset)
    framesets: Frameset[];
}
