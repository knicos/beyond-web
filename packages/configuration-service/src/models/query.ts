import {
  Property, CollectionOf,
} from '@tsed/schema';

export default class ConfigQuery {
  @Property()
  uri?: string;

  @Property()
  framesetId?: number;

  @Property()
  frameId?: number;

  @Property()
  current?: boolean;

  @CollectionOf(String)
  select?: string[];
}
