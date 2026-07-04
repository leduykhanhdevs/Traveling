import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logUnknownError } from '../utils/logger.js';

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

let hasConnected = false;

const ensureConnected = async (): Promise<void> => {
  if (hasConnected || redis.status === 'ready') {
    return;
  }

  await redis.connect();
  hasConnected = true;
};

export const getCacheJson = async <T>(key: string): Promise<T | null> => {
  try {
    await ensureConnected();
    const cached = await redis.get(key);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    logUnknownError('Redis read failed', error, { key });
    return null;
  }
};

export const setCacheJson = async (
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> => {
  try {
    await ensureConnected();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    logUnknownError('Redis write failed', error, { key });
  }
};

export const closeRedis = async (): Promise<void> => {
  try {
    await redis.quit();
  } catch (error) {
    logUnknownError('Redis close failed', error);
  }
};
