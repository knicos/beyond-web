import {
  Property, Required, Default, Minimum, Maximum, CollectionOf,
} from '@tsed/schema';
import {
  Schema,
} from '@tsed/mongoose';
import Frame from './frame';

@Schema()
export default class Frameset {
    @CollectionOf(Frame)
    frames: Frame[];

    @Required()
    @Default(0)
    @Minimum(0)
    @Maximum(254)
    framesetId: number;

    @Property()
    title?: string;
}
