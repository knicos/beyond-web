import {
  Required,
} from '@tsed/schema';
import {
  Schema,
} from '@tsed/mongoose';

@Schema()
export default class Stream {
  @Required()
  name: string;

  @Required()
  uri: string;

  @Required()
  framesetId: number;

  @Required()
  frameId: number;

  active?: boolean;
}
