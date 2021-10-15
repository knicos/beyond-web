import {
  Default, Description, Integer, Min,
} from '@tsed/schema';

export default class Pageable {
  @Integer()
  @Min(0)
  @Default(0)
  @Description('Page number.')
  page: number = 0;

  @Integer()
  @Min(1)
  @Default(20)
  @Description('Number of objects per page.')
  size: number = 20;

  get offset() {
    return this.page ? this.page * this.limit : 0;
  }

  get limit() {
    return this.size;
  }
}
