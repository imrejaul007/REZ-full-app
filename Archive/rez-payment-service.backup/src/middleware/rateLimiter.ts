import { createRateLimiter } from '@rez/shared';
import { redis } from '../config/redis';

/**
 * Creates a Redis-backed rate limiter.
 */
function createRedisRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  message?: string;
  keyGenerator?: (req: any) => string;
}) {
  return createRateLimiter(
    redis.call.bind(redis),
    {
      windowMs: options.windowMs,
      max: options.max,
      keyPrefix: options.keyPrefix,
      message: options.message || 'Too many requests, please try again later',
      keyGenerator: options.keyGenerator,
    }
  );
}

/**
 * General rate limiter — applies to all routes.
 * 300 requests per 15 minutes per IP.
 */
export const generalLimiter = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyPrefix: 'rl:payment:general',
  message: 'Too many requests, please try again later',
});

/**
 * Payment endpoint rate limiter — applies to initiate, capture, create-order.
 * 20 requests per minute per IP (or per authenticated userId).
 */
export const paymentLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  keyPrefix: 'rl:payment:api',
  message: 'Too many requests, please try again later',
  keyGenerator: (req) => {
    return req.userId || req.ip || 'unknown';
  },
});

/**
 * Sensitive operation rate limiter — applies to refund and deduct.
 * Stricter limit: 5 requests per minute per IP (or per authenticated userId).
 */
export const sensitiveLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyPrefix: 'rl:payment:sensitive',
  message: 'Rate limit exceeded for sensitive operation',
  keyGenerator: (req) => {
    return req.userId || req.ip || 'unknown';
  },
});
