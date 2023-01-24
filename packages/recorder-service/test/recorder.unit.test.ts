import { PlatformTest } from '@tsed/common';
import { redisAddItem, redisSendEvent } from '@ftl/common';
import Recording from '../src/models/recording';
import RecorderService, { stopRecordingInterval} from '../src/services/recorder';

jest.mock('@ftl/common', () => ({
  redisSubscribe: jest.fn(),
  RedisLogger: jest.fn().mockImplementation(() => ({
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  })),
  redisSetGroup: jest.fn(),
  redisConsumerId: jest.fn(),
  redisConsumerGroup: jest.fn(),
  redisSet: jest.fn(),
  redisAddItem: jest.fn(),
  redisSendEvent: jest.fn(),
  redisPublish: jest.fn(),
}));

describe('RecorderService', () => {
  beforeEach(PlatformTest.create);
  afterEach(PlatformTest.reset);

  afterAll(async () => {
    await stopRecordingInterval();
  });

  describe('create recording', () => {
    it('should start a valid recording', async () => {
      const service = PlatformTest.get<RecorderService>(RecorderService);

      const recording = new Recording();
      recording.channels = [0,1];
      recording.streams = ['ftl://ftlab.utu.fi/test/1'];
      const result = await service.create(recording, 'testuserid');

      expect(result).toBeTruthy();
      expect(result?.owner).toBe('testuserid');
      expect(redisSendEvent).toHaveBeenCalledWith({ event: 'events:recording', body: expect.objectContaining({
        event: 'start',
      })});
      expect(redisAddItem).toHaveBeenCalledWith('recordings:list:testuserid', result?.id, expect.any(Number));
    });
  });
});
