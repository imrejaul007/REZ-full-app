/**
 * Performance Optimization Utilities
 * Centralized caching, pagination, and query optimization helpers
 */

import Redis from 'ioredis';

// Redis client singleton
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });
  }
  return redisClient;
}

// Cache configuration
const DEFAULT_TTL = 300; // 5 minutes
const SHORT_TTL = 60; // 1 minute
const LONG_TTL = 3600; // 1 hour

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Get from cache with automatic JSON parsing
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const value = await redis.get(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set in cache with automatic JSON serialization
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache delete pattern error:', error);
  }
}

/**
 * Invalidate related cache entries
 */
export async function invalidateRelatedCache(prefix: string, identifiers: string[]): Promise<void> {
  try {
    const redis = getRedisClient();
    const pipeline = redis.pipeline();
    for (const id of identifiers) {
      pipeline.del(`${prefix}:${id}`);
    }
    await pipeline.exec();
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

// TTL constants for different cache types
export const CacheTTL = {
  SHORT: SHORT_TTL,
  DEFAULT: DEFAULT_TTL,
  LONG: LONG_TTL,
  USER_PROFILE: 300, // 5 min
  MERCHANT_INFO: 600, // 10 min
  LEAD_SCORE: 180, // 3 min
  ANALYTICS: 60, // 1 min
  CONVERSATION: 1800, // 30 min
} as const;

// Cache key builders
export const CacheKeys = {
  userProfile: (userId: string) => `profile:${userId}`,
  merchantProfile: (merchantId: string) => `merchant:${merchantId}`,
  leadScore: (userId: string) => `lead_score:${userId}`,
  conversation: (sessionId: string) => `conversation:${sessionId}`,
  analytics: (merchantId: string, type: string) => `analytics:${merchantId}:${type}`,
  searchResults: (query: string, filters: string) => `search:${Buffer.from(`${query}:${filters}`).toString('base64')}`,
} as const;

/**
 * Parse pagination params from query
 */
export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const { page = 1, limit = 20 } = params;
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Batch queries to avoid N+1
 */
export async function batchFind<T>(
  ids: string[],
  findFn: (ids: string[]) => Promise<T[]>,
  options: { batchSize?: number } = {}
): Promise<Map<string, T>> {
  const { batchSize = 100 } = options;
  const result = new Map<string, T>();

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const items = await findFn(batch);
    items.forEach((item: T) => {
      const itemWithId = item as Record<string, unknown>;
      if (itemWithId._id || itemWithId.userId || itemWithId.id) {
        result.set(
          String(itemWithId._id || itemWithId.userId || itemWithId.id),
          item
        );
      }
    });
  }

  return result;
}

/**
 * Memoize function results with TTL
 */
const memoizeCache = new Map<string, { value: unknown; expiresAt: number }>();

export function memoizeWithTTL<T>(
  fn: () => T,
  key: string,
  ttl: number = 1000
): T {
  const cached = memoizeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const result = fn();
  memoizeCache.set(key, { value: result, expiresAt: Date.now() + ttl });
  return result;
}

/**
 * Create projection object to limit returned fields
 */
export function createProjection<T extends Record<string, unknown>>(
  fields: (keyof T)[]
): Record<string, 1> {
  return fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {} as Record<string, 1>);
}

/**
 * Aggregation pipeline builder for common patterns
 */
export function buildAggregationPipeline(
  matchStage: Record<string, unknown>,
  sortStage: Record<string, 1 | -1>,
  page: number,
  limit: number
): Record<string, unknown>[] {
  return [
    { $match: matchStage },
    { $sort: sortStage },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];
}
