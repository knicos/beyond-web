import redis from "redis";

let redisClient: redis.RedisClient;
let redisSub: redis.RedisClient;
let redisPub: redis.RedisClient;

const handlers = new Map<string, Function>();

const DAY = 1 * 24 * 60 * 60 * 1000;

function initRedis(): void {
	if (!redisClient) {
		redisClient = redis.createClient({
			host: process.env.REDIS_HOST || 'redis',
		});
		redisSub = redisClient.duplicate({return_buffers: true})
		redisPub = redisClient.duplicate();

		redisSub.on("message", (channel: Buffer, message: Buffer) => {
            const strchan = channel.toString('utf8');
            console.log('redismsg', strchan);
			if (handlers.has(strchan)) {
				handlers.get(strchan)(message);
			} else {
                console.error('No handler');
            }
		});
	}
}

export function redisPublish(channel: string, data: unknown): Promise<boolean> {
	initRedis();
	// Publish to redis
	return new Promise(resolve => {
		redisPub.publish(channel, data as string, (err, reply) => {
			resolve(!err);
		})
	});
}

export function redisSubscribe(channel: string, cb: Function): Promise<boolean> {
	initRedis();
    console.log('Subscribe to', channel);
	// Subscribe to redis
	handlers.set(channel, cb);
	return new Promise(resolve => {
		redisSub.subscribe(channel, (err, reply) => {
            if (err) {
                console.error('Subscribe error', err);
            }
			resolve(!err);
		});
	});
}

export function redisAddItem(key: string, item: string, time: number): Promise<boolean> {
	initRedis();
	return new Promise(resolve => {
		redisClient.zadd(key, time, item, (err, reply) => {
			resolve(!err);
		});
	});
}

export function redisRemoveItem(key: string, item: string): Promise<boolean> {
	initRedis();
	return new Promise(resolve => {
		redisClient.zrem(key, item, (err, reply) => {
			resolve(!err);
		});
	});
}

export function redisTopItems(key: string): Promise<string[]> {
	initRedis();
	return new Promise(resolve => {
		redisClient.zrangebyscore(key, Date.now() - 1 * DAY, Date.now(), (err, reply) => {
			resolve(err ? [] : reply);
		});
	});
}
