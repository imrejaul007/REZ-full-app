// @ts-nocheck
/**
 * Redis Configuration
 *
 * Configuration settings for Redis connection and caching.
 *
 * Connection modes (set via environment variables):
 *   Single node: REDIS_URL=redis://host:6379
 *   Sentinel:    REDIS_SENTINEL_HOSTS=s1:26379,s2:26379,s3:26379
 *                REDIS_SENTINEL_NAME=mymaster  (optional, default: mymaster)
 *                REDIS_PASSWORD=...            (optional)
 *
 * When REDIS_SENTINEL_HOSTS is set, Sentinel mode is used and REDIS_URL is
 * ignored. When it is not set, REDIS_URL is used (single-node fallback).
 */

export interface RedisSentinelHost {
  host: string;
  port: number;
}

export interface RedisConfig {
  url: string;
  password?: string;
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  connectTimeout: number;
  keyPrefix: string;
  /** Populated when REDIS_SENTINEL_HOSTS env var is set. */
  sentinels?: RedisSentinelHost[];
  /** Redis Sentinel master name. Defaults to "mymaster". */
  sentinelName?: string;
}

/**
 * Parse a comma-separated "host:port" sentinel list from an env var string.
 * Example input: "sentinel1:26379,sentinel2:26379,sentinel3:26379"
 */
function parseSentinelHosts(raw: string): RedisSentinelHost[] {
  return raw.split(',').map((entry) => {
    const [host, portStr] = entry.trim().split(':');
    return { host: host || 'localhost', port: parseInt(portStr || '26379', 10) };
  });
}

/**
 * Get Redis configuration from environment variables
 */
export const getRedisConfig = (): RedisConfig => {
  const sentinelRaw = process.env.REDIS_SENTINEL_HOSTS;
  const sentinels = sentinelRaw ? parseSentinelHosts(sentinelRaw) : undefined;

  return {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    enabled: process.env.CACHE_ENABLED !== 'false', // Default to true
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'rez:',
    sentinels,
    sentinelName: process.env.REDIS_SENTINEL_NAME || 'mymaster',
  };
};

/**
 * Cache key version prefix (P-14: bump this when cache schema changes
 * to prevent serving stale / incompatible cached data).
 * All cache keys will be prefixed: "v{CACHE_VERSION}:{original_key}"
 */
export const CACHE_VERSION = 1;

/**
 * Cache TTL (Time To Live) constants in seconds
 */
export const CacheTTL = {
  // Product caching
  PRODUCT_DETAIL: 60 * 60, // 1 hour
  PRODUCT_LIST: 30 * 60, // 30 minutes
  PRODUCT_SEARCH: 15 * 60, // 15 minutes
  PRODUCT_FEATURED: 60 * 60, // 1 hour
  PRODUCT_NEW_ARRIVALS: 30 * 60, // 30 minutes
  PRODUCT_RECOMMENDATIONS: 30 * 60, // 30 minutes

  // Category caching
  CATEGORY_LIST: 60 * 60, // 1 hour
  CATEGORY_DETAIL: 60 * 60, // 1 hour

  // Store caching
  STORE_LIST: 30 * 60, // 30 minutes
  STORE_DETAIL: 60 * 60, // 1 hour
  STORE_PRODUCTS: 30 * 60, // 30 minutes

  // Cart caching — short TTL to avoid stale pricing / stock issues
  CART_DATA: 60, // 60 seconds (P-11: reduced from 5 min to prevent stale pricing)
  CART_SUMMARY: 30, // 30 seconds (P-11: reduced from 3 min to prevent stale pricing)

  // User caching — contains PII (P-15: shorter TTL for sensitive data)
  USER_PROFILE: 30, // 30 seconds (P-15: contains PII — name, email, phone)
  USER_ORDERS: 10 * 60, // 10 minutes

  // Offers and vouchers
  OFFER_LIST: 30 * 60, // 30 minutes
  VOUCHER_LIST: 30 * 60, // 30 minutes

  // Static data
  STATIC_DATA: 60 * 60 * 24, // 24 hours

  // Sensitive / PII data — keep very short to limit exposure window (P-15)
  WALLET_DATA: 300, // 5 minutes (invalidated on mutation via walletCacheService)
  SENSITIVE_DATA: 30, // 30 seconds (P-15: generic sensitive-data TTL)

  // Very short-lived cache
  SHORT_CACHE: 60, // 1 minute

  // Gamification caching
  LEADERBOARD: 5 * 60, // 5 minutes
  GAME_CONFIG: 10 * 60, // 10 minutes
  FEATURE_FLAGS: 5 * 60, // 5 minutes
  AVAILABLE_GAMES: 10 * 60, // 10 minutes
  CHALLENGES_ACTIVE: 5 * 60, // 5 minutes

  // Offers page aggregated data
  OFFERS_PAGE_DATA: 5 * 60, // 5 minutes

  // Home snapshot (first render aggregation)
  HOME_SNAPSHOT: 30, // 30 seconds (P-11: aggregates wallet, offers, stores, missions)
} as const;

export default {
  getRedisConfig,
  CacheTTL,
};
