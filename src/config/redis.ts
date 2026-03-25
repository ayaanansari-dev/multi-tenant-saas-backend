// src/config/redis.ts
import Redis from 'ioredis';
import { env } from './env';
import { Logger } from './logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT),
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false, // Recommended for BullMQ
      lazyConnect: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        Logger.warn(`Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      Logger.info('Redis connected');
    });

    redisClient.on('error', (error) => {
      Logger.error('Redis error:', error);
    });
  }
  
  return redisClient;
};

export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    Logger.info('Redis disconnected');
  }
};