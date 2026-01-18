import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from './logger.js';

let redisClient: Redis | null = null;
let redisEnabled = false;

// In-memory cache fallback when Redis is not available
const memoryCache = new Map<string, { value: string; expiry: number | null }>();

export async function connectRedis(): Promise<void> {
  // Check if Redis URL is configured
  if (!config.redisUrl || config.redisUrl === 'redis://localhost:6379' || config.redisUrl === '') {
    logger.warn('⚠️ Redis URL not configured - using in-memory cache (not recommended for production)');
    redisEnabled = false;
    return;
  }

  try {
    redisClient = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 5000,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis error:', error);
      redisEnabled = false;
    });

    redisClient.on('connect', () => {
      logger.debug('Redis connected');
      redisEnabled = true;
    });

    await redisClient.connect();
    redisEnabled = true;
    logger.info('✅ Redis connected successfully');
  } catch (error) {
    logger.warn('⚠️ Redis connection failed - using in-memory cache:', error);
    redisEnabled = false;
    redisClient = null;
  }
}

export function getRedis(): Redis | null {
  return redisClient;
}

export function isRedisEnabled(): boolean {
  return redisEnabled;
}

// Clean up expired memory cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiry && entry.expiry < now) {
      memoryCache.delete(key);
    }
  }
}, 60000); // Clean every minute

// Cache helper functions - works with Redis or falls back to memory
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      if (redisEnabled && redisClient) {
        const data = await redisClient.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
      } else {
        // Memory cache fallback
        const entry = memoryCache.get(key);
        if (!entry) return null;
        if (entry.expiry && entry.expiry < Date.now()) {
          memoryCache.delete(key);
          return null;
        }
        return JSON.parse(entry.value) as T;
      }
    } catch (error) {
      logger.debug('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (redisEnabled && redisClient) {
        if (ttlSeconds) {
          await redisClient.setex(key, ttlSeconds, serialized);
        } else {
          await redisClient.set(key, serialized);
        }
      } else {
        // Memory cache fallback
        memoryCache.set(key, {
          value: serialized,
          expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        });
      }
    } catch (error) {
      logger.debug('Cache set error:', error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (redisEnabled && redisClient) {
        await redisClient.del(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      logger.debug('Cache del error:', error);
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      if (redisEnabled && redisClient) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        // Memory cache pattern delete
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of memoryCache.keys()) {
          if (regex.test(key)) {
            memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      logger.debug('Cache delPattern error:', error);
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
