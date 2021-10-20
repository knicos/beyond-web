import {
  Required, Groups, CollectionOf, Default, Property,
} from '@tsed/schema';
import {
  Model, ObjectID, Indexed, Ref,
} from '@tsed/mongoose';
import Snapshot from './snapshot';

@Model()
export default class Stream {
    id?: string;

    @ObjectID('id')
    @Groups('!creation')
    _id?: string;

    @Required()
    @Indexed()
    uri: string;

    @Required()
    framesetId: number;

    @Required()
    frameId: number;

    @Required()
    owner: string;

    @CollectionOf(String)
    @Required()
    @Default([])
    groups: string[];

    @Ref(Snapshot)
    @Property()
    current?: Ref<Snapshot>;

    @Ref(Snapshot)
    @CollectionOf(Snapshot)
    @Required()
    @Default([])
    snapshots: Ref<Snapshot>[];
}
