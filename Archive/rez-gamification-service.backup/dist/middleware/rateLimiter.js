"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboardLimiter = exports.achievementClaimLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
exports.createUserRateLimiter = createUserRateLimiter;
const redis_1 = require("../config/redis");
/**
 * Generic rate limiter using Redis with IP + path key
 * Falls back to in-memory tracking if Redis is unavailable
 *
 * Usage: app.use(createRateLimiter('achievement-claims', 10, 60));
 */
function createRateLimiter(prefix, maxRequests, windowSec) {
    const inMemoryFallback = new Map();
    return async (req, res, next) => {
        const key = `rl:${prefix}:${req.ip}`;
        try {
            // Try Redis first
            const count = await redis_1.bullmqRedis.incr(key);
            if (count === 1) {
                await redis_1.bullmqRedis.expire(key, windowSec);
            }
            if (count > maxRequests) {
                res.status(429).json({
                    success: false,
                    error: 'Too many requests',
                });
                return;
            }
            next();
        }
        catch (redisErr) {
            // GAM-MED-02 FIX: Fail closed — do not fall back to in-memory tracking.
            // In-memory maps are per-instance; in multi-instance deployments this
            // would let attackers bypass rate limits by distributing requests across instances.
            res.status(503).json({
                success: false,
                error: 'Rate limiting unavailable',
            });
        }
    };
}
/**
 * User-based rate limiter for authenticated endpoints
 * Uses user ID instead of IP for more accurate rate limiting
 *
 * Usage: app.get('/achievements/claim', userRateLimiter('claim', 10, 60), handler);
 */
function createUserRateLimiter(prefix, maxRequests, windowSec) {
    const inMemoryFallback = new Map();
    return async (req, res, next) => {
        // Extract user ID from request (set by auth middleware)
        // GAM-MED-01 FIX: Use Record<string, unknown> instead of `as any` to access
        // userId injected by auth middleware. This preserves type safety while allowing
        // access to the extended Request object.
        const userId = req.userId;
        if (!userId) {
            // If no user ID, use IP as fallback
            return createRateLimiter(prefix, maxRequests, windowSec)(req, res, next);
        }
        const key = `rl:${prefix}:user:${userId}`;
        try {
            const count = await redis_1.bullmqRedis.incr(key);
            if (count === 1) {
                await redis_1.bullmqRedis.expire(key, windowSec);
            }
            if (count > maxRequests) {
                res.status(429).json({
                    success: false,
                    error: 'Too many requests',
                });
                return;
            }
            next();
        }
        catch (redisErr) {
            // GAM-MED-02 FIX: Fail closed — do not fall back to in-memory tracking.
            // In-memory maps are per-instance; in multi-instance deployments this
            // would let attackers bypass rate limits by distributing requests across instances.
            res.status(503).json({
                success: false,
                error: 'Rate limiting unavailable',
            });
        }
    };
}
// Pre-built limiters for gamification endpoints
// Achievement claims: 10 requests per minute per user
exports.achievementClaimLimiter = createUserRateLimiter('achievement:claim', 10, 60);
// Leaderboard endpoints: 30 requests per minute per IP
exports.leaderboardLimiter = createRateLimiter('leaderboard', 30, 60);
//# sourceMappingURL=rateLimiter.js.map