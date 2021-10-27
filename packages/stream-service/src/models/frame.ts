import {
  Property, Required, Default, Minimum, Maximum, Groups,
} from '@tsed/schema';
import {
  Schema, Indexed,
} from '@tsed/mongoose';

@Schema()
export default class Frame {
    @Required()
    @Default(0)
    @Minimum(0)
    @Maximum(254)
    frameId: number;

    @Property()
    title?: string;

    @Property()
    @Indexed()
    deviceId?: string;

    @Property()
    nodeId?: string;

    @Property()
    @Default(true)
    autoStart: boolean;

    @Property()
    @Groups('query')
    active?: boolean;

    @Property()
    @Groups('query')
    channels?: number[];

    @Property()
    @Groups('query')
    capabilities?: string[];
}
