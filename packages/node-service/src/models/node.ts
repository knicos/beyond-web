import {
  Property, Required, CollectionOf, Groups, Default, DateTime, RequiredGroups,
} from '@tsed/schema';
import {
  Model, ObjectID, Indexed, Unique,
} from '@tsed/mongoose';
import Stream from './stream';
import Device from './device';

@Model()
export default class Node {
    id?: string;

    @ObjectID('id')
    @Groups('!creation')
    _id?: string;

    @Required()
    @RequiredGroups('!update')
    @Indexed()
    @Default('unknown')
    @Groups('!update')
    applicationType: string;

    @Required()
    @RequiredGroups('!update')
    @Indexed()
    @Unique()
    @Groups('!update')
    serial: string;

    @Required()
    @RequiredGroups('!update')
    @Groups('!update')
    clientId: string;

    @Property()
    @Groups('!update')
    userId?: string;

    @Required()
    @RequiredGroups('!update')
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
    @RequiredGroups('!update')
    @CollectionOf(String)
    groups: string[];

    @CollectionOf(Stream)
    @Groups('!update')
    streams?: Stream[];

    @CollectionOf(Device)
    @RequiredGroups('!update')
    @Required()
    @Default([])
    devices: Device[];

    @Property()
    @DateTime()
    @Groups('!update')
    lastUpdate?: Date;

    @Required()
    @RequiredGroups('!update')
    @CollectionOf(String)
    @Default([])
    tags: string[];
}
