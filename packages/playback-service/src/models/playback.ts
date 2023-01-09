import {
  Property, Required, Groups, DateTime, CollectionOf, Default,
} from '@tsed/schema';
import {
  Model, ObjectID, Indexed, Unique,
} from '@tsed/mongoose';

@Model()
export default class Recording {
    @ObjectID('id')
    @Groups('!creation')
    _id?: string;

    @Required()
    @DateTime()
    @Default(new Date())
    created: Date;
    
    @Required()
    filename: string;

    @Property()
    size: number;

    @Property()
    duration: number;
}
