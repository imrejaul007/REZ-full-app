import { Request, Response, NextFunction } from 'express';
/**
 * Generic rate limiter using Redis with IP + path key
 * Falls back to in-memory tracking if Redis is unavailable
 *
 * Usage: app.use(createRateLimiter('achievement-claims', 10, 60));
 */
declare function createRateLimiter(prefix: string, maxRequests: number, windowSec: number): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * User-based rate limiter for authenticated endpoints
 * Uses user ID instead of IP for more accurate rate limiting
 *
 * Usage: app.get('/achievements/claim', userRateLimiter('claim', 10, 60), handler);
 */
declare function createUserRateLimiter(prefix: string, maxRequests: number, windowSec: number): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const achievementClaimLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const leaderboardLimiter: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export { createRateLimiter, createUserRateLimiter };
//# sourceMappingURL=rateLimiter.d.ts.map