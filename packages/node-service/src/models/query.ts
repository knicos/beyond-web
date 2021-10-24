import {
  Property, CollectionOf,
} from '@tsed/schema';

export default class NodeQuery {
  @Property()
  name?: string;

  @Property()
  group?: string;

  @CollectionOf(String)
  groups?: string[];

  @Property()
  serial?: string;

  @Property()
  active?: boolean;

  @Property()
  stream?: string;

  @CollectionOf(String)
  select?: string[];
}
