import {
  Property, Required, Groups, DateTime, CollectionOf, Default,
} from '@tsed/schema';

export default class Recording {
    @Required()
    @Groups('!creation', '!update')
    id: string;

    @Required()
    @CollectionOf(String)
    streams: string[];

    @Required()
    @CollectionOf(Number)
    channels: number[];

    @Required()
    @DateTime()
    @Default(new Date())
    startTime: Date;

    @Required()
    @Groups('!creation', '!update')
    owner: string;

    filename?: string;

    @Property()
    @Groups('!creation', '!update')
    size?: number;

    @Property()
    @Groups('!creation')
    status: 'recording' | 'paused' | 'stopped';

    @Property()
    @Groups('!creation', '!update')
    duration: number;
}
