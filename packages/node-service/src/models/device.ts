import {
  Required,
} from '@tsed/schema';
import {
  Schema,
} from '@tsed/mongoose';

@Schema()
export default class Device {
  @Required()
  name: string;

  @Required()
  type: string;

  @Required()
  serial: number;
}
