import {
  CollectionOf, Required, MinLength, MaxLength,
} from '@tsed/schema';
import {
  Model, ObjectID, Ref,
} from '@tsed/mongoose';

@Model()
export default class Group {
    id?: string;

    @ObjectID('id')
    _id?: string;

    @Required()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @CollectionOf(String)
    scopes: string[];

    @Ref(() => Group)
    @CollectionOf(() => Group)
    children?: Ref<Group>[];
}
