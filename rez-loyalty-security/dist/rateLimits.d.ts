/**
 * Rate Limiting Configurations for REZ Loyalty System
 *
 * Defines rate limits for different service operations to prevent abuse
 * and ensure fair usage across the loyalty platform.
 */
export interface RateLimitConfig {
    windowMs: number;
    max: number;
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
export declare const RATE_LIMITS: RateLimits;
/**
 * Global rate limits applied to all endpoints
 */
export declare const GLOBAL_RATE_LIMITS: RateLimitConfig;
/**
 * Stricter rate limits for sensitive operations
 */
export declare const SENSITIVE_RATE_LIMITS: RateLimitConfig;
/**
 * Burst rate limits for handling traffic spikes
 */
export declare const BURST_RATE_LIMITS: RateLimitConfig;
/**
 * Get rate limit config for a specific service and operation
 */
export declare function getRateLimitConfig(service: keyof RateLimits, operation: keyof RateLimitTier): RateLimitConfig | null;
/**
 * Create a rate limit key for Redis/in-memory store
 */
export declare function createRateLimitKey(identifier: string, service: keyof RateLimits, operation: keyof RateLimitTier): string;
/**
 * Headers to include in rate limit responses
 */
export declare const RATE_LIMIT_HEADERS: {
    readonly RATE_LIMIT_LIMIT: "X-RateLimit-Limit";
    readonly RATE_LIMIT_REMAINING: "X-RateLimit-Remaining";
    readonly RATE_LIMIT_RESET: "X-RateLimit-Reset";
    readonly RETRY_AFTER: "Retry-After";
};
export type RateLimitHeader = typeof RATE_LIMIT_HEADERS[keyof typeof RATE_LIMIT_HEADERS];
//# sourceMappingURL=rateLimits.d.ts.map