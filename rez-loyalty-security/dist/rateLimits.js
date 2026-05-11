"use strict";
/**
 * Rate Limiting Configurations for REZ Loyalty System
 *
 * Defines rate limits for different service operations to prevent abuse
 * and ensure fair usage across the loyalty platform.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_HEADERS = exports.BURST_RATE_LIMITS = exports.SENSITIVE_RATE_LIMITS = exports.GLOBAL_RATE_LIMITS = exports.RATE_LIMITS = void 0;
exports.getRateLimitConfig = getRateLimitConfig;
exports.createRateLimitKey = createRateLimitKey;
/**
 * Rate limit configurations for REZ Loyalty System services
 * All limits are per minute (windowMs: 900000 = 15 minutes)
 */
exports.RATE_LIMITS = {
    profile: {
        queries: { windowMs: 900000, max: 100 }, // 100 queries per 15 min
        updates: { windowMs: 900000, max: 30 }, // 30 updates per 15 min
    },
    score: {
        queries: { windowMs: 900000, max: 200 }, // 200 queries per 15 min
    },
    decisions: {
        all: { windowMs: 900000, max: 500 }, // 500 decisions per 15 min
    },
    streak: {
        updates: { windowMs: 900000, max: 10 }, // 10 streak updates per 15 min
    },
    wallet: {
        queries: { windowMs: 900000, max: 150 }, // 150 wallet queries per 15 min
        updates: { windowMs: 900000, max: 50 }, // 50 wallet updates per 15 min
    },
    rewards: {
        queries: { windowMs: 900000, max: 100 }, // 100 reward queries per 15 min
        updates: { windowMs: 900000, max: 30 }, // 30 reward updates per 15 min
    },
    admin: {
        queries: { windowMs: 900000, max: 500 }, // 500 admin queries per 15 min
        updates: { windowMs: 900000, max: 100 }, // 100 admin updates per 15 min
        creates: { windowMs: 900000, max: 50 }, // 50 creates per 15 min
        deletes: { windowMs: 900000, max: 20 }, // 20 deletes per 15 min
    },
};
/**
 * Global rate limits applied to all endpoints
 */
exports.GLOBAL_RATE_LIMITS = {
    windowMs: 900000, // 15 minutes
    max: 1000, // 1000 requests per window
};
/**
 * Stricter rate limits for sensitive operations
 */
exports.SENSITIVE_RATE_LIMITS = {
    windowMs: 600000, // 10 minutes
    max: 10, // Only 10 requests per window
};
/**
 * Burst rate limits for handling traffic spikes
 */
exports.BURST_RATE_LIMITS = {
    windowMs: 60000, // 1 minute
    max: 50, // 50 requests per minute
};
/**
 * Get rate limit config for a specific service and operation
 */
function getRateLimitConfig(service, operation) {
    const serviceLimits = exports.RATE_LIMITS[service];
    if (!serviceLimits)
        return null;
    // For 'all' tier operations, fall back to the specific operation
    const opConfig = serviceLimits[operation] ?? serviceLimits.all;
    return opConfig ?? null;
}
/**
 * Create a rate limit key for Redis/in-memory store
 */
function createRateLimitKey(identifier, service, operation) {
    return `ratelimit:${service}:${operation}:${identifier}`;
}
/**
 * Headers to include in rate limit responses
 */
exports.RATE_LIMIT_HEADERS = {
    RATE_LIMIT_LIMIT: 'X-RateLimit-Limit',
    RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
    RATE_LIMIT_RESET: 'X-RateLimit-Reset',
    RETRY_AFTER: 'Retry-After',
};
//# sourceMappingURL=rateLimits.js.map