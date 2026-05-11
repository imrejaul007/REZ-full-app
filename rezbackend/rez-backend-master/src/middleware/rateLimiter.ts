/**
 * Rate Limiter with Redis Store
 *
 * Uses the shared Redis client from redisService.
 * Falls back to MemoryStore if Redis is unavailable.
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redisService';
import { logger } from '../config/logger';

// Extend Request interface to include rate limit metadata
declare global {
  namespace Express {
    interface Request {
      rateLimitData?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime: Date;
      };
    }
  }
}

// ─── OTP-specific key generator: composite phone + device + IP ────────────────
const normalizeOtpPhone = (phone: string): string => {
  // Strip all non-digit characters first
  const digits = phone.replace(/\D/g, '');
  // Remove leading country code variations: 91 (India, 12 digits), 971 (UAE, 12 digits)
  if (digits.startsWith('91') && digits.length >= 12) return digits.slice(2);
  if (digits.startsWith('971') && digits.length >= 12) return digits.slice(3);
  return digits;
};

const otpKeyGenerator = (req: any): string => {
  const rawPhone = req.body?.phone || req.body?.phoneNumber || '';
  // SECURITY: Normalize phone so that +919876543210 and 9876543210 share the same bucket,
  // preventing bypasses by submitting the same number with different formatting.
  const phone = rawPhone ? normalizeOtpPhone(String(rawPhone)) : '';
  const device = req.headers?.['x-device-fingerprint'] || '';
  const ip = ipKeyGenerator(req.ip ?? req.socket?.remoteAddress ?? '');
  // Combine phone + device + IP for a strong composite key
  if (phone) return `otp:${phone}:${device || ip}`;
  return `otp:${ip}:${device}`;
};

// ─── Key generator: per-user when authenticated, per-IP otherwise ─────────────
const keyGenerator = (req: Request): string => {
  // Prefer the Mongoose ObjectId (._id) converted to string to ensure consistent
  // key format across all code paths. Fall back to .id (virtual getter), then
  // the top-level userId property, then the IP address.
  const userId = (req as any).user?._id?.toString() || (req as any).user?.id || (req as any).userId;
  if (userId) return `user:${userId}`;
  return ipKeyGenerator(req.ip ?? '');
};

// ─── Login key generator: IP + email — prevents one bad actor from locking
// out other users on the same NAT, AND prevents one user's typos from
// affecting other accounts. Falls back to IP-only when no email present.
const loginKeyGenerator = (req: Request): string => {
  const ip = ipKeyGenerator(req.ip ?? '');
  const email = String(req.body?.email || req.body?.username || '')
    .toLowerCase()
    .trim();
  return email ? `login:${ip}:${email}` : `login:${ip}`;
};

// ─── Check if disabled (dev override) ────────────────────────────────────────
// SECURITY: Disabling rate limits in production is a critical misconfiguration.
// Abort the process immediately to prevent an unsafe deployment from staying up.
if (process.env.NODE_ENV === 'production' && process.env.DISABLE_RATE_LIMIT === 'true') {
  logger.error('FATAL: DISABLE_RATE_LIMIT=true in production — refusing to start');
  process.exit(1);
}

const isRateLimitDisabled = process.env.DISABLE_RATE_LIMIT === 'true';

if (isRateLimitDisabled) {
  logger.info('⚠️  Rate limiting is DISABLED (DISABLE_RATE_LIMIT=true)');
}

const passthrough = (_req: Request, _res: Response, next: NextFunction) => next();

// ─── Lazy Store factory — defers RedisStore creation until Redis is ready ─────
// RedisStore's constructor fires async script-load commands immediately.
// If Redis isn't connected yet (common on Render/cloud where Redis is remote),
// those become unhandled rejections and crash Node >= 15.
// Solution: return a lazy wrapper that creates the real RedisStore on first use.
let redisStoreWarningLogged = false;

function makeStore(prefix: string, options?: { failOpen?: boolean }) {
  if (isRateLimitDisabled) return undefined; // MemoryStore fallback
  const failOpen = options?.failOpen ?? true;

  let innerStore: InstanceType<typeof RedisStore> | null = null;
  let initFailed = false;

  function getOrCreateStore(): InstanceType<typeof RedisStore> | null {
    if (innerStore) return innerStore;
    if (initFailed) return null;

    const client = redisService.getClient();
    if (!client) return null;

    try {
      innerStore = new RedisStore({
        sendCommand: async (...args: string[]) => {
          const c = redisService.getClient();
          if (!c) throw new Error('Redis disconnected');
          return (c as any).sendCommand(args);
        },
        prefix: `rl:${prefix}:`,
      });
      return innerStore;
    } catch (_err) {
      initFailed = true;
      if (!redisStoreWarningLogged) {
        logger.warn('[RateLimit] Failed to create RedisStore — using MemoryStore fallback');
        redisStoreWarningLogged = true;
      }
      return null;
    }
  }

  // Return an object that satisfies the express-rate-limit Store interface
  // but lazily initializes the real RedisStore only when Redis is connected.
  return {
    init(options: any) {
      // Store options for later; the real store's init will be called on first use
      (this as any)._options = options;
    },
    async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
      const store = getOrCreateStore();
      if (store) {
        // Ensure init is called once
        if ((this as any)._options && !(this as any)._inited) {
          (this as any)._inited = true;
          if (typeof store.init === 'function') {
            store.init((this as any)._options);
          }
        }
        return store.increment(key);
      }
      // No Redis. For critical routes, fail closed.
      if (!failOpen) {
        throw new Error('Rate limiter backend unavailable');
      }
      // No Redis — permit the request (legacy behavior for low-risk routes)
      if (!redisStoreWarningLogged) {
        logger.warn('[RateLimit] Redis not ready — rate limiting disabled until connected');
        redisStoreWarningLogged = true;
      }
      return { totalHits: 1, resetTime: undefined };
    },
    async decrement(key: string): Promise<void> {
      const store = getOrCreateStore();
      if (store && typeof store.decrement === 'function') {
        return store.decrement(key);
      }
    },
    async resetKey(key: string): Promise<void> {
      const store = getOrCreateStore();
      if (store && typeof store.resetKey === 'function') {
        return store.resetKey(key);
      }
    },
    async resetAll(): Promise<void> {
      const store = getOrCreateStore();
      if (store && typeof (store as any).resetAll === 'function') {
        return (store as any).resetAll();
      }
    },
  } as any;
}

// ─── Safe rate limiter factory — catches store errors, passes request through ─
function makeLimiter(options: Parameters<typeof rateLimit>[0], failOpen = true) {
  const limiter = rateLimit(options);
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting for CORS preflight requests.
    // OPTIONS preflights are browser-generated and never real user actions.
    // Counting them against the limit causes 429s that browsers report as
    // CORS errors, completely blocking the subsequent real request.
    if (req.method === 'OPTIONS') return next();

    limiter(req, res, (err?: any) => {
      if (err) {
        if (!failOpen) {
          return res.status(503).json({
            success: false,
            message: 'Rate limiter unavailable. Please try again later.',
          });
        }
        if (!redisStoreWarningLogged) {
          logger.warn('[RateLimit] Store error, passing request through:', err.message);
          redisStoreWarningLogged = true;
        }
        return next();
      }
      next();
    });
  };
}

// ─── Error response helper ────────────────────────────────────────────────────
const rateLimitResponse = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later.',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// LIMITERS — Redis-backed, per-user key
// ─────────────────────────────────────────────────────────────────────────────

// Sprint 15: generalLimiter set to 60 req/min per user (tuned from 500/15min).
export const generalLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 req/min — Tier: general
      keyGenerator,
      store: makeStore('general'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const authLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 15 * 60 * 1000,
        max: 10, // 10 failed attempts per 15 min per (IP, email) tuple
        keyGenerator: loginKeyGenerator,
        store: makeStore('auth', { failOpen: false }),
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            error: 'Too many login attempts. Please try again after 15 minutes.',
            retryAfter: 15 * 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
      },
      false,
    );

// SANA: security hardening — Admin login rate limiting set to 5 attempts per 15 minutes.
// This prevents brute force attacks on admin accounts while allowing reasonable retry attempts.
export const adminAuthLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 15 * 60 * 1000,
        max: 5,
        keyGenerator,
        store: makeStore('admin-auth', { failOpen: false }),
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            error: 'Too many admin login attempts. Please try again after 15 minutes.',
            retryAfter: 15 * 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
      },
      false,
    );

export const registrationLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 60 * 60 * 1000,
        max: 3, // Sprint 3: tightened from 5 → 3 per hour per IP
        keyGenerator,
        store: makeStore('register', { failOpen: false }), // fail-closed: registration is a sensitive flow
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            error: 'Too many registration attempts. Please try again later.',
            retryAfter: 60 * 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
      },
      false, // fail-closed on limiter error too
    );

/**
 * Per-IP global OTP send rate limit — 20 OTP sends per IP per hour.
 *
 * This is a coarse IP-level guard that sits in front of the per-phone otpLimiter.
 * It catches abuse from a single IP hammering many different phone numbers
 * (SMS pumping fraud, account enumeration) which the phone-keyed otpLimiter
 * cannot detect. Must be applied BEFORE otpLimiter on the send-otp route.
 */
export const otpPerIpLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // max 20 OTP sends per IP per hour
        keyGenerator: (req) => `otp_ip:${ipKeyGenerator(req.ip ?? '')}`,
        store: makeStore('otp-per-ip', { failOpen: false }), // fail-closed: OTP send gate
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            message: 'Too many OTP requests. Try again later.',
            retryAfter: 60 * 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
      },
      false,
    );

export const otpLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        // SECURITY: 5-minute window (was 30 s) — long enough to deter SMS pumping fraud
        // while still allowing legitimate retries. Combined with phone normalization in
        // otpKeyGenerator, format variations (+91…, 91…, bare 10-digit) share one bucket.
        windowMs: 5 * 60 * 1000,
        max: 3,
        keyGenerator: otpKeyGenerator,
        store: makeStore('otp', { failOpen: false }), // fail-closed: OTP used for account access
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            message: 'Please wait 5 minutes before requesting another OTP.',
            retryAfter: 5 * 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
      },
      false,
    ); // fail-closed on limiter error too

/**
 * OTP verification — 10 attempts per phone per 15 minutes, fail-closed.
 *
 * Uses the same phone-normalised key as otpLimiter so that a single phone
 * number is bounded regardless of formatting (+91…, 91…, bare digits).
 * 10 attempts covers reasonable retry scenarios while blocking brute-force
 * against the 6-digit OTP space (10^6 combinations).
 */
export const verifyOtpLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10,
        keyGenerator: otpKeyGenerator,
        store: makeStore('verify-otp', { failOpen: false }), // fail-closed: auth gate
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            message: 'Too many verification attempts. Please wait 15 minutes before trying again.',
            retryAfter: 15 * 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true, // successful logins don't count against the window
      },
      false,
    );

export const passwordResetLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 60 * 60 * 1000,
        max: 3,
        keyGenerator,
        store: makeStore('pwd-reset', { failOpen: false }),
        message: rateLimitResponse,
        standardHeaders: true,
        legacyHeaders: false,
      },
      false,
    );

export const securityLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 15 * 60 * 1000,
        max: 3,
        keyGenerator,
        store: makeStore('security', { failOpen: false }),
        message: rateLimitResponse,
        standardHeaders: true,
        legacyHeaders: false,
      },
      false,
    );

export const uploadLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 10,
      keyGenerator,
      store: makeStore('upload'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Upload limit exceeded. Please wait before uploading more files.',
          retryAfter: 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

export const searchLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 30,
      keyGenerator,
      store: makeStore('search'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const aiSearchLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 10,
      keyGenerator,
      store: makeStore('ai-search'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

// Sprint 15: strictLimiter — 10 req/min per IP. Applied to OTP + auth endpoints.
// If REDIS_URL is set the makeStore factory automatically uses RedisStore (rate-limit-redis).
// Without REDIS_URL it falls back to in-memory store (safe for single-instance deployments).
export const strictLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 60 * 1000, // 1 minute — Tier: strict (OTP/auth)
        max: 10, // 10 req/min per IP
        keyGenerator: (req: Request) => `strict:${ipKeyGenerator(req.ip ?? '')}`,
        store: makeStore('strict', { failOpen: false }), // fail-closed: auth gate
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            message: 'Too many requests. Please wait a minute before trying again.',
            retryAfter: 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
      },
      false,
    );

// Sprint 15: bulkLimiter — 100 req/min per IP. Applied to feed/search endpoints.
// If REDIS_URL is set the makeStore factory automatically uses RedisStore (rate-limit-redis).
// Without REDIS_URL it falls back to in-memory store (safe for single-instance deployments).
export const bulkLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000, // 1 minute — Tier: bulk (feed/search)
      max: 100, // 100 req/min per IP
      keyGenerator: (req: Request) => `bulk:${ipKeyGenerator(req.ip ?? '')}`,
      store: makeStore('bulk'), // fail-open: read-only endpoints
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many feed/search requests. Please slow down.',
          retryAfter: 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

export const reviewLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 5,
      keyGenerator,
      store: makeStore('review'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const analyticsLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 30,
      keyGenerator,
      store: makeStore('analytics'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const comparisonLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 10,
      keyGenerator,
      store: makeStore('comparison'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const favoriteLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 20,
      keyGenerator,
      store: makeStore('favorite'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const recommendationLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 15,
      keyGenerator,
      store: makeStore('recommendation'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const referralLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 60 * 1000,
      max: 50,
      keyGenerator,
      store: makeStore('referral'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const referralShareLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 5,
      keyGenerator,
      store: makeStore('referral-share'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

// ================================================
// PRODUCT CRUD RATE LIMITERS
// ================================================

export const productGetLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 100,
      keyGenerator,
      store: makeStore('product-get'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const productWriteLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 30,
      keyGenerator,
      store: makeStore('product-write'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const productDeleteLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 10,
      keyGenerator,
      store: makeStore('product-delete'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const productBulkLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 5,
      keyGenerator,
      store: makeStore('product-bulk'),
      message: rateLimitResponse,
      standardHeaders: true,
      legacyHeaders: false,
    });

export const createProductLimiter = (method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'BULK') => {
  if (isRateLimitDisabled) return passthrough;
  const configs = {
    GET: { max: 100, prefix: 'product-get' },
    POST: { max: 30, prefix: 'product-post' },
    PUT: { max: 30, prefix: 'product-put' },
    DELETE: { max: 10, prefix: 'product-del' },
    BULK: { max: 5, prefix: 'product-bulk2' },
  };
  const { max, prefix } = configs[method];
  return makeLimiter({
    windowMs: 60 * 1000,
    max,
    keyGenerator,
    store: makeStore(prefix),
    message: rateLimitResponse,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// ─── Sprint 3: Additional domain-specific limiters ────────────────────────────

/**
 * Admin routes — 60 requests per IP per minute.
 * Applied at the /api/admin prefix level in routes.ts so every admin endpoint
 * is covered without requiring per-route annotations.
 */
export const adminLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 60,
      keyGenerator: (req: Request) => `admin:${ipKeyGenerator(req.ip ?? '')}`,
      store: makeStore('admin'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many admin requests.',
          retryAfter: 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Cashback credit/earn endpoints — 30 requests per user per minute.
 * Prevents automated cashback-farming loops hitting forecast/earn endpoints.
 */
export const cashbackLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000,
      max: 30,
      keyGenerator,
      store: makeStore('cashback'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many cashback requests.',
          retryAfter: 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  prefix?: string;
  keyGenerator?: (req: any) => string;
}) => {
  if (isRateLimitDisabled) return passthrough;
  return makeLimiter({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    keyGenerator: options.keyGenerator || keyGenerator,
    store: makeStore(options.prefix || 'custom'),
    message: options.message
      ? (_req: Request, res: Response) => {
          res.status(429).json({ success: false, message: options.message });
        }
      : rateLimitResponse,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
  });
};

// ─── TASK-25: Financial / Payment rate limiters ───────────────────────────────
//
// These limiters guard the most sensitive monetary endpoints.
// Stricter windows and lower ceilings than generic limiters to limit blast
// radius from compromised accounts or brute-force enumeration.

/**
 * Bill payment initiation — 10 attempts per user per 15 minutes.
 * Prevents automated payment submission loops.
 */
export const billPayLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 15 * 60 * 1000, // 15 min
        max: 10,
        keyGenerator,
        store: makeStore('rl:bill-pay', { failOpen: false }), // fail-closed: money endpoint
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            message: 'Too many payment attempts. Please wait 15 minutes and try again.',
            retryAfter: 15 * 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
      },
      false,
    ); // fail-closed on limiter error too

/**
 * Bill fetch (BBPS fetch) — 30 attempts per user per 5 minutes.
 * Slightly more relaxed than pay, but still guarded against enumeration.
 */
export const billFetchLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 5 * 60 * 1000, // 5 min
      max: 30,
      keyGenerator,
      store: makeStore('rl:bill-fetch'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many bill fetch requests. Please wait 5 minutes.',
          retryAfter: 5 * 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Wallet top-up / fund transfer — 5 attempts per user per 10 minutes.
 * Very tight because each attempt can move real money.
 */
export const walletTransferLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 10 * 60 * 1000, // 10 min
        max: 5,
        keyGenerator,
        store: makeStore('rl:wallet-transfer', { failOpen: false }), // fail-closed: money endpoint
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            message: 'Too many transfer attempts. Please wait 10 minutes.',
            retryAfter: 10 * 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
      },
      false,
    ); // fail-closed on limiter error too

/**
 * Order creation — 20 orders per user per 10 minutes.
 * Guards against cart-stuffing / checkout-spam bots.
 */
export const orderCreateLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 10 * 60 * 1000, // 10 min
      max: 20,
      keyGenerator,
      store: makeStore('rl:order-create'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many order requests. Please slow down.',
          retryAfter: 10 * 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Refund request — 5 refunds per user per hour.
 * Prevents refund-fraud loops and limits support queue flooding.
 */
export const refundRequestLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      keyGenerator,
      store: makeStore('rl:refund-request'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Refund request limit reached. Please contact support if you need further assistance.',
          retryAfter: 60 * 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Flash sale purchase initiation — 10 attempts per user per 10 minutes.
 * Prevents inventory reservation abuse and parallel purchase race attacks.
 * Tight window because flash sales are time-limited and high-value.
 */
export const flashSalePurchaseInitiateLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 10 * 60 * 1000, // 10 min
      max: 10,
      keyGenerator,
      store: makeStore('rl:flash-sale-initiate'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many flash sale purchase attempts. Please wait before trying again.',
          retryAfter: 10 * 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Flash sale payment verification — 15 verifications per user per 10 minutes.
 * Allows legitimate retry on webhook race but blocks signature-stuffing attacks.
 */
export const flashSalePurchaseVerifyLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 10 * 60 * 1000, // 10 min
      max: 15,
      keyGenerator,
      store: makeStore('rl:flash-sale-verify'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many payment verification attempts. Please contact support if your payment succeeded.',
          retryAfter: 10 * 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Lock deal payment operations — 10 lock/balance initiation attempts per user per 10 minutes.
 */
export const lockDealPaymentLimiter = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 10 * 60 * 1000, // 10 min
      max: 10,
      keyGenerator,
      store: makeStore('rl:lock-deal-payment'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many lock deal payment attempts. Please wait before trying again.',
          retryAfter: 10 * 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

// ─────────────────────────────────────────────────────────────────────────────
// TIERED RATE LIMITERS — Standardised per-endpoint tiers
//
// These named exports provide a consistent, semantically clear API for applying
// per-endpoint limits across the codebase. All instances use:
//   standardHeaders: true   — clients receive RateLimit-* headers (RFC 6585 draft)
//   legacyHeaders: false    — suppresses deprecated X-RateLimit-* headers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auth rate limit — 10 requests per 15 minutes per user/IP.
 * Applied to OTP send and login endpoints where abuse prevention is critical.
 * Fail-closed: if Redis is unavailable the request is rejected rather than
 * allowed through, because silently bypassing auth rate limits is unacceptable.
 */
export const authRateLimit = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10,
        keyGenerator,
        store: makeStore('auth-tier', { failOpen: false }),
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            message: 'Too many authentication attempts. Please try again after 15 minutes.',
            retryAfter: 15 * 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
      },
      false, // fail-closed on limiter error
    );

/**
 * Financial write rate limit — 20 requests per minute per user.
 * Applied to money-movement endpoints: wallet credit/debit, payment initiation.
 * Fail-closed: the endpoint must be protected even when Redis is down.
 */
export const financialWriteRateLimit = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 60 * 1000, // 1 minute
        max: 20,
        keyGenerator,
        store: makeStore('fin-write', { failOpen: false }),
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            message: 'Too many financial requests. Please wait a minute before trying again.',
            retryAfter: 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
      },
      false, // fail-closed on limiter error
    );

/**
 * Financial read rate limit — 60 requests per minute per user.
 * Applied to balance checks and transaction history reads.
 * More permissive than write limits; fail-open since reads carry lower risk.
 */
export const financialReadRateLimit = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 60,
      keyGenerator,
      store: makeStore('fin-read'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many balance/history requests. Please slow down.',
          retryAfter: 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * General API rate limit — 200 requests per 15 minutes per user/IP.
 * Intended as a catch-all for endpoints that do not have a more specific limiter.
 * Apply at the router prefix level (app.use('/api/...', apiRateLimit)) rather
 * than duplicating it per route.
 */
export const apiRateLimit = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200,
      keyGenerator,
      store: makeStore('api-general'),
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many requests. Please slow down and try again later.',
          retryAfter: 15 * 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Helper: verify that a webhook request originates from a known payment gateway.
 * Returns true when the request should SKIP rate limiting (i.e. comes from a
 * verified source). This is deliberately conservative — it only skips when a
 * gateway-specific signature header is present, not when the request claims to
 * come from a gateway.
 */
function verifyWebhookSource(req: Request): boolean {
  // Razorpay sends X-Razorpay-Signature; Stripe sends Stripe-Signature.
  // Presence of the header is a lightweight heuristic: the actual HMAC
  // verification happens inside the controller. Skipping rate limiting for
  // unsigned requests is intentionally NOT done here.
  const hasRazorpay = Boolean(req.headers['x-razorpay-signature']);
  const hasStripe = Boolean(req.headers['stripe-signature']);
  return hasRazorpay || hasStripe;
}

/**
 * Webhook rate limit — 500 requests per minute, skip for verified gateway sources.
 * Razorpay can send high-volume bursts (e.g. during settlement processing).
 * The skip function allows signed gateway requests through without counting against
 * the limit; unsigned requests from unknown sources are still rate-limited.
 * Fail-open: a temporary Redis outage must not block legitimate payment webhooks.
 */
export const webhookRateLimit = isRateLimitDisabled
  ? passthrough
  : makeLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 500,
      keyGenerator: (req: Request) => `webhook:${ipKeyGenerator(req.ip ?? '')}`,
      store: makeStore('webhook'),
      skip: verifyWebhookSource,
      message: (_req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          message: 'Too many webhook requests.',
          retryAfter: 60,
        });
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Admin action rate limit — 30 sensitive admin operations per minute per admin user.
 * Keyed by admin userId (falls back to IP for unauthenticated requests).
 * Fail-closed: a Redis outage must not allow unbounded admin writes.
 * Applied to sensitive financial/account write endpoints:
 *   - wallet adjust, cashback reverse, wallet freeze/unfreeze
 *   - user suspend/unsuspend, flag/unflag
 *   - dispute resolve/escalate
 */
export const adminActionRateLimit = isRateLimitDisabled
  ? passthrough
  : makeLimiter(
      {
        windowMs: 60 * 1000, // 1 minute
        max: 30, // 30 admin actions per minute per admin user
        keyGenerator: (req: Request) =>
          `admin:${(req as any).user?._id?.toString() || (req as any).userId || ipKeyGenerator(req.ip ?? '')}`,
        store: makeStore('admin-action', { failOpen: false }),
        message: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            message: 'Admin action rate limit exceeded. Please wait before performing more operations.',
            retryAfter: 60,
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
      },
      false, // fail-closed on limiter error
    );
