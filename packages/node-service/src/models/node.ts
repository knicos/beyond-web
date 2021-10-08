import {
  Property, Required, CollectionOf, Groups, Default, DateTime,
} from '@tsed/schema';
import {
  Model, ObjectID, Indexed, Unique,
} from '@tsed/mongoose';

@Model()
export default class Node {
    id?: string;

    @ObjectID('id')
    @Groups('!creation')
    _id?: string;

    @Required()
    @Indexed()
    @Default('unknown')
    applicationType: string;

    @Required()
    @Indexed()
    @Unique()
    serial: string;

    @Required()
    clientId: string;

    @Property()
    userId?: string;

    @Required()
    @Indexed()
    name: string;

    @Property()
    @Indexed()
    location?: string;

    // Comes from Redis
    latency?: number;

    // Comes from Redis
    txRate?: number;

    // Comes from Redis
    rxRate?: number;

    // Comes from Redis
    active: boolean;

    @Required()
    @CollectionOf(String)
    groups: string[];

    @Property()
    @CollectionOf(String)
    streams?: string[];

    @Property()
    @DateTime()
    lastUpdate?: Date;
}
