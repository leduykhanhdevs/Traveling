import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logUnknownError } from '../utils/logger.js';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

let hasConnected = false;
let redisFailed = false;

// Simple in-memory fallback cache
const memoryCache = new Map<string, { value: string; expiry: number }>();

const ensureConnected = async (): Promise<void> => {
  if (redisFailed) {
    return;
  }
  if (hasConnected || redis.status === 'ready') {
    return;
  }

  try {
    await redis.connect();
    hasConnected = true;
  } catch (error) {
    redisFailed = true;
    logUnknownError('Redis connection failed, falling back to in-memory cache', error);
  }
};

export const getCacheJson = async <T>(key: string): Promise<T | null> => {
  try {
    await ensureConnected();
    if (redisFailed) {
      const entry = memoryCache.get(key);
      if (!entry) {
        return null;
      }
      if (Date.now() > entry.expiry) {
        memoryCache.delete(key);
        return null;
      }
      return JSON.parse(entry.value) as T;
    }

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
    if (redisFailed) {
      memoryCache.set(key, {
        value: JSON.stringify(value),
        expiry: Date.now() + ttlSeconds * 1000,
      });
      return;
    }
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    logUnknownError('Redis write failed', error, { key });
  }
};

export const closeRedis = async (): Promise<void> => {
  try {
    if (!redisFailed) {
      await redis.quit();
    }
  } catch (error) {
    logUnknownError('Redis close failed', error);
  }
};
