/**
 * PERFORMANCE OPTIMIZED REDIS CACHING LAYER
 * - Connection pooling and retry logic
 * - Automatic JSON serialization/deserialization
 * - Cache invalidation patterns
 * - TTL management for different data types
 */

import { createClient, RedisClientType } from 'redis';

// Redis client singleton
let redisClient: RedisClientType | null = null;
let isConnecting = false;
let connectionPromise: Promise<RedisClientType> | null = null;

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,          // 1 minute - frequently changing data
  DEFAULT: 300,       // 5 minutes - standard cache
  LONG: 600,          // 10 minutes - relatively static data
  USER_PROFILE: 300,  // 5 minutes - user profile
  MERCHANT_INFO: 600, // 10 minutes - merchant info
  CONVERSATION: 1800, // 30 minutes - conversation history
  ANALYTICS: 60,      // 1 minute - dashboard analytics
  INTENT: 300,        // 5 minutes - intent classifications
} as const;

// Cache key prefixes
export const CacheKeys = {
  userProfile: (userId: string) => `support:user:${userId}`,
  merchantProfile: (merchantId: string) => `support:merchant:${merchantId}`,
  conversation: (sessionId: string) => `support:conversation:${sessionId}`,
  analytics: (type: string) => `support:analytics:${type}`,
  intent: (messageHash: string) => `support:intent:${messageHash}`,
  ticket: (ticketId: string) => `support:ticket:${ticketId}`,
  search: (query: string) => `support:search:${Buffer.from(query).toString('base64').slice(0, 32)}`,
} as const;

/**
 * Get or create Redis client with lazy initialization
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;

  connectionPromise = (async () => {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://localhost:6379';

    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis max retries exceeded');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on('error', (err) => {
      console.error('[Redis] Client error:', err.message);
    });

    client.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    await client.connect();
    console.log('[Redis] Connected successfully');
    return client;
  })();

  const client = await connectionPromise;
  redisClient = client;
  isConnecting = false;
  return client;
}

/**
 * Get cached value with automatic JSON parsing
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const value = await client.get(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    console.error(`[Cache] Get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached value with automatic JSON serialization
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = CacheTTL.DEFAULT
): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error(`[Cache] Set error for key ${key}:`, error);
  }
}

/**
 * Set multiple cached values in a pipeline
 */
export async function cacheSetMany<T extends Record<string, unknown>>(
  entries: Array<{ key: string; value: T[keyof T]; ttl?: number }>
): Promise<void> {
  try {
    const client = await getRedisClient();
    const pipeline = client.multi();

    for (const entry of entries) {
      const ttl = entry.ttl ?? CacheTTL.DEFAULT;
      pipeline.setEx(entry.key, ttl, JSON.stringify(entry.value));
    }

    await pipeline.exec();
  } catch (error) {
    console.error('[Cache] SetMany error:', error);
  }
}

/**
 * Delete a cached value
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error(`[Cache] Delete error for key ${key}:`, error);
  }
}

/**
 * Delete multiple cached values by pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`[Cache] Deleted ${keys.length} keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`[Cache] DeletePattern error for pattern ${pattern}:`, error);
  }
}

/**
 * Get or set cached value (cache-aside pattern)
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CacheTTL.DEFAULT
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const fresh = await fetchFn();

  // Cache the result
  await cacheSet(key, fresh, ttl);

  return fresh;
}

/**
 * Invalidate related cache entries
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    cacheDelete(CacheKeys.userProfile(userId)),
    cacheDeletePattern(`support:conversation:*${userId}*`),
  ]);
}

/**
 * Invalidate merchant cache
 */
export async function invalidateMerchantCache(merchantId: string): Promise<void> {
  await Promise.all([
    cacheDelete(CacheKeys.merchantProfile(merchantId)),
    cacheDeletePattern(`support:conversation:*${merchantId}*`),
  ]);
}

/**
 * Invalidate all analytics cache
 */
export async function invalidateAnalyticsCache(): Promise<void> {
  await cacheDeletePattern('support:analytics:*');
}

/**
 * Batch get cached values
 */
export async function cacheGetMany<T>(
  keys: string[]
): Promise<Map<string, T | null>> {
  const result = new Map<string, T | null>();

  try {
    const client = await getRedisClient();
    const values = await client.mGet(keys);

    keys.forEach((key, index) => {
      const value = values[index];
      result.set(key, value ? JSON.parse(value) as T : null);
    });
  } catch (error) {
    console.error('[Cache] GetMany error:', error);
    keys.forEach((key) => result.set(key, null));
  }

  return result;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Connection closed');
  }
}

// Export cache utilities
export default {
  getRedisClient,
  cacheGet,
  cacheSet,
  cacheSetMany,
  cacheDelete,
  cacheDeletePattern,
  cacheGetOrSet,
  cacheGetMany,
  invalidateUserCache,
  invalidateMerchantCache,
  invalidateAnalyticsCache,
  isRedisAvailable,
  closeRedisConnection,
  CacheTTL,
  CacheKeys,
};
