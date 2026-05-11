/**
 * Rate Limiting Configurations for REZ Loyalty System
 *
 * Defines rate limits for different service operations to prevent abuse
 * and ensure fair usage across the loyalty platform.
 */

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  max: number;       // Maximum requests per window
}

export interface RateLimitTier {
  queries?: RateLimitConfig;
  updates?: RateLimitConfig;
  all?: RateLimitConfig;
  creates?: RateLimitConfig;
  deletes?: RateLimitConfig;
}

export interface RateLimits {
  profile: RateLimitTier;
  score: RateLimitTier;
  decisions: RateLimitTier;
  streak: RateLimitTier;
  wallet?: RateLimitTier;
  rewards?: RateLimitTier;
  admin?: RateLimitTier;
}

/**
 * Rate limit configurations for REZ Loyalty System services
 * All limits are per minute (windowMs: 900000 = 15 minutes)
 */
export const RATE_LIMITS: RateLimits = {
  profile: {
    queries: { windowMs: 900000, max: 100 },   // 100 queries per 15 min
    updates: { windowMs: 900000, max: 30 },     // 30 updates per 15 min
  },
  score: {
    queries: { windowMs: 900000, max: 200 },   // 200 queries per 15 min
  },
  decisions: {
    all: { windowMs: 900000, max: 500 },       // 500 decisions per 15 min
  },
  streak: {
    updates: { windowMs: 900000, max: 10 },    // 10 streak updates per 15 min
  },
  wallet: {
    queries: { windowMs: 900000, max: 150 },  // 150 wallet queries per 15 min
    updates: { windowMs: 900000, max: 50 },    // 50 wallet updates per 15 min
  },
  rewards: {
    queries: { windowMs: 900000, max: 100 },  // 100 reward queries per 15 min
    updates: { windowMs: 900000, max: 30 },    // 30 reward updates per 15 min
  },
  admin: {
    queries: { windowMs: 900000, max: 500 },  // 500 admin queries per 15 min
    updates: { windowMs: 900000, max: 100 },   // 100 admin updates per 15 min
    creates: { windowMs: 900000, max: 50 },    // 50 creates per 15 min
    deletes: { windowMs: 900000, max: 20 },    // 20 deletes per 15 min
  },
};

/**
 * Global rate limits applied to all endpoints
 */
export const GLOBAL_RATE_LIMITS: RateLimitConfig = {
  windowMs: 900000,  // 15 minutes
  max: 1000,         // 1000 requests per window
};

/**
 * Stricter rate limits for sensitive operations
 */
export const SENSITIVE_RATE_LIMITS: RateLimitConfig = {
  windowMs: 600000,  // 10 minutes
  max: 10,           // Only 10 requests per window
};

/**
 * Burst rate limits for handling traffic spikes
 */
export const BURST_RATE_LIMITS: RateLimitConfig = {
  windowMs: 60000,   // 1 minute
  max: 50,           // 50 requests per minute
};

/**
 * Get rate limit config for a specific service and operation
 */
export function getRateLimitConfig(
  service: keyof RateLimits,
  operation: keyof RateLimitTier
): RateLimitConfig | null {
  const serviceLimits = RATE_LIMITS[service];
  if (!serviceLimits) return null;

  // For 'all' tier operations, fall back to the specific operation
  const opConfig = serviceLimits[operation] ?? serviceLimits.all;
  return opConfig ?? null;
}

/**
 * Create a rate limit key for Redis/in-memory store
 */
export function createRateLimitKey(
  identifier: string,
  service: keyof RateLimits,
  operation: keyof RateLimitTier
): string {
  return `ratelimit:${service}:${operation}:${identifier}`;
}

/**
 * Headers to include in rate limit responses
 */
export const RATE_LIMIT_HEADERS = {
  RATE_LIMIT_LIMIT: 'X-RateLimit-Limit',
  RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  RATE_LIMIT_RESET: 'X-RateLimit-Reset',
  RETRY_AFTER: 'Retry-After',
} as const;

export type RateLimitHeader = typeof RATE_LIMIT_HEADERS[keyof typeof RATE_LIMIT_HEADERS];
