import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;

export async function connectRedis(): Promise<Redis> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  });

  redisClient.on('error', (error) => {
    logger.error('Redis error:', error);
  });

  redisClient.on('connect', () => {
    logger.debug('Redis connected');
  });

  await redisClient.connect();
  return redisClient;
}

export function getRedis(): Redis {
  if (!redisClient) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redisClient;
}

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedis();
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const redis = getRedis();
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    const redis = getRedis();
    await redis.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  generateKey(...parts: string[]): string {
    return parts.join(':');
  },
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  VERY_LONG: 86400,    // 24 hours
  REVIEW_RESULT: 1800, // 30 minutes
  USER_DATA: 600,      // 10 minutes
  REPO_LIST: 300,      // 5 minutes
  PR_DATA: 180,        // 3 minutes
};
