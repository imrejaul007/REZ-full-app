/**
 * Rate Limiting Configuration
 *
 * Provides pre-configured rate limiters for common scenarios.
 * Requires Redis to be available.
 */
import type Redis from 'ioredis';
/**
 * Create a rate limiter with Redis store
 */
export declare function createRateLimiter(redis: Redis, options: {
    windowMs?: number;
    max?: number;
    keyPrefix?: string;
    keyGenerator?: (req: any) => string;
    message?: string;
    skipSuccessfulRequests?: boolean;
}): import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter for order creation
 * Limit: 5 orders per minute per user
 */
export declare function createOrderRateLimiter(redis: Redis): import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter for status updates (merchant)
 * Limit: 60 updates per minute per merchant
 */
export declare function createStatusUpdateRateLimiter(redis: Redis): import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter for KDS updates
 * Limit: 1000 updates per minute per store (high for real-time)
 * Requires authentication - falls back to IP if storeId not available
 */
export declare function createKdsRateLimiter(redis: Redis): import("express-rate-limit").RateLimitRequestHandler;
/**
 * Rate limiter for offer creation (merchant)
 * Limit: 10 offers per hour per merchant
 */
export declare function createOfferRateLimiter(redis: Redis): import("express-rate-limit").RateLimitRequestHandler;
/**
 * Global API rate limiter
 * Limit: 1000 requests per minute per IP
 */
export declare function createGlobalRateLimiter(redis: Redis): import("express-rate-limit").RateLimitRequestHandler;
/**
 * Auth attempt rate limiter
 * Limit: 5 failed attempts per 15 minutes per IP/email
 * Uses the shared createRateLimiter helper with custom prefix for auth
 */
export declare function createAuthRateLimiter(redis: Redis): import("express-rate-limit").RateLimitRequestHandler;
