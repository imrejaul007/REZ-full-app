/**
 * Idempotency Middleware
 *
 * Ensures that requests with the same idempotency key return the same response.
 * Prevents duplicate operations from network retries.
 *
 * Usage:
 * ```typescript
 * app.use(idempotencyMiddleware(redis));
 * router.patch('/orders/:id/status', idempotencyMiddleware(redis), updateStatus);
 * ```
 */
import { Request, Response, NextFunction } from 'express';
import type Redis from 'ioredis';
/**
 * Idempotency middleware
 *
 * Checks if a request with the same idempotency key has been processed.
 * If yes, returns cached response. If no, caches the response for future requests.
 */
export declare function idempotencyMiddleware(redis: Redis): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Clear idempotency cache (for testing or manual cleanup)
 */
export declare function clearIdempotencyKey(redis: Redis, idempotencyKey: string): Promise<void>;
/**
 * Helper to add idempotency key to outgoing requests
 */
export declare function generateIdempotencyKey(): string;
