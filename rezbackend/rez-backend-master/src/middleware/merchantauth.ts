import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Merchant, IMerchant } from '../models/Merchant';
import { MerchantUser, IMerchantUser } from '../models/MerchantUser';
import { logger } from '../config/logger';
import redisService from '../services/redisService';

// Extend Request interface to include merchantId and merchantUser
declare global {
  namespace Express {
    interface Request {
      merchant?: IMerchant;
      merchantUser?: IMerchantUser;
    }
  }
}

// ─── Token Blacklist ──────────────────────────────────────────────────────────

// Standardized key format: blacklist:{sha256(token)}
// No role prefix, always hashed — matches auth.ts and all downstream services
// (wallet-service, payment-service) so a logout from any surface invalidates the token everywhere.
const MERCHANT_TOKEN_BLACKLIST_PREFIX = 'blacklist:';

function hashMerchantToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function blacklistMerchantToken(token: string, ttlSeconds: number): Promise<void> {
  try {
    await redisService.set(`${MERCHANT_TOKEN_BLACKLIST_PREFIX}${hashMerchantToken(token)}`, '1', ttlSeconds);
  } catch (err) {
    logger.error('Failed to blacklist merchant token:', err);
  }
}

export async function isMerchantTokenBlacklisted(token: string, req?: Request): Promise<boolean> {
  const failClosed = process.env.NODE_ENV === 'production';
  try {
    if (!redisService.isReady()) {
      logger.warn(`[MERCHANT AUTH] Redis unavailable for blacklist check — failing ${failClosed ? 'closed' : 'open'}`);
      return failClosed;
    }
    return await redisService.exists(`${MERCHANT_TOKEN_BLACKLIST_PREFIX}${hashMerchantToken(token)}`);
  } catch (err) {
    logger.warn(`[MERCHANT AUTH] Redis error during blacklist check — failing ${failClosed ? 'closed' : 'open'}`);
    return failClosed;
  }
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header, with cookie fallback for browser surfaces (M10).
    // cookie-parser must be mounted in the app for req.cookies to be populated.
    const authHeader = req.header('Authorization');
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null) || req.cookies?.rez_merchant_token || null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    // Verify token using merchant-specific secret
    const merchantSecret = process.env.JWT_MERCHANT_SECRET;
    if (!merchantSecret) {
      logger.error('[MERCHANT AUTH] CRITICAL: JWT_MERCHANT_SECRET is not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT secret not configured',
      });
    }

    // Fix 3: Check blacklist BEFORE verifying token (pass req for sensitive-path fail-closed logic)
    const isBlacklisted = await isMerchantTokenBlacklisted(token, req);
    if (isBlacklisted) {
      return res.status(401).json({ success: false, message: 'Token has been revoked' });
    }

    // Fix 5: Pin algorithm to HS256
    const decoded = jwt.verify(token, merchantSecret, { algorithms: ['HS256'] }) as any;

    // SPEEDCORE: Check Redis cache first for merchant + user (60s TTL) — avoid DB lookups
    // Skip cache entirely for financial paths to prevent stale data on sensitive operations
    const FINANCIAL_PATH_PATTERNS = ['/wallet', '/settlement', '/payout', '/transfer'];
    const isFinancialPath = req.path && FINANCIAL_PATH_PATTERNS.some((p) => req.path.includes(p));
    const cacheKey = `merchant:auth:${decoded.merchantId}:${decoded.merchantUserId || 'owner'}`;
    const cached = isFinancialPath ? null : await redisService.get<any>(cacheKey).catch(() => null);

    // Fix 4: Add status checks to cached path
    if (cached) {
      if (!cached.merchant?.isActive) {
        return res.status(401).json({ success: false, message: 'Merchant account is deactivated' });
      }
      if (cached.merchantUser && cached.merchantUser.status !== 'active') {
        return res.status(403).json({ success: false, message: `Account is ${cached.merchantUser.status}` });
      }
      if (cached.merchantUser?.accountLockedUntil && new Date(cached.merchantUser.accountLockedUntil) > new Date()) {
        return res.status(423).json({ success: false, message: 'Account is temporarily locked' });
      }

      req.merchantId = decoded.merchantId;
      req.merchant = cached.merchant;
      if (cached.merchantUser) {
        req.merchantUser = cached.merchantUser;
      }
      return next();
    }

    // Cache miss — load from DB
    // Find merchant
    const merchant = await Merchant.findById(decoded.merchantId);

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid - merchant not found',
      });
    }

    // Check if merchant is active
    if (!merchant.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Merchant account is deactivated',
      });
    }

    // CS-H6 FIX: Block suspended merchants from retaining API access.
    // Check isSuspended flag and status field in addition to isActive.
    if ((merchant as any).isSuspended === true || (merchant as any).status === 'suspended') {
      logger.warn('[MERCHANT AUTH] Merchant account suspended:', decoded.merchantId);
      return res.status(403).json({ error: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
    }

    // Add merchant to request
    req.merchantId = decoded.merchantId;
    req.merchant = merchant;

    let merchantUser = null;

    // If this is a team member (has merchantUserId), load their data
    if (decoded.merchantUserId) {
      merchantUser = await MerchantUser.findById(decoded.merchantUserId);

      if (!merchantUser) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid - user not found',
        });
      }

      // Fix 5: Cross-validate merchantUserId against decoded.merchantId
      if (merchantUser.merchantId?.toString() !== decoded.merchantId) {
        return res.status(401).json({ success: false, message: 'Token merchant mismatch' });
      }

      // Check if user is active
      if (merchantUser.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: `Account is ${merchantUser.status}. Please contact your administrator.`,
        });
      }

      // Check if account is locked
      if (merchantUser.accountLockedUntil && merchantUser.accountLockedUntil > new Date()) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked. Please try again later.',
        });
      }

      req.merchantUser = merchantUser;
    }

    // SPEEDCORE: Cache decoded auth info for 60s to reduce DB load on subsequent requests
    // Skip cache write for financial paths — always re-fetch fresh data for those
    if (!isFinancialPath) {
      try {
        await redisService.set(
          cacheKey,
          {
            merchant: { _id: merchant._id, isActive: merchant.isActive },
            merchantUser: merchantUser
              ? {
                  _id: merchantUser._id,
                  status: merchantUser.status,
                  accountLockedUntil: merchantUser.accountLockedUntil,
                }
              : null,
          },
          60,
        );
      } catch (cacheErr) {
        logger.warn('[MERCHANT AUTH] Failed to cache auth info:', (cacheErr as Error).message);
      }
    }

    return next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    logger.error('[MERCHANT AUTH] Authentication error: ' + error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // M10: Cookie fallback for browser surfaces (cookie-parser must be mounted).
    const authHeader = req.header('Authorization');
    const token =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null) || req.cookies?.rez_merchant_token || null;

    if (token) {
      const merchantSecret = process.env.JWT_MERCHANT_SECRET;
      if (!merchantSecret) {
        // For optional auth, we just skip authentication if secret is not configured
        logger.warn('[MERCHANT AUTH] JWT_MERCHANT_SECRET not configured, skipping optional authentication');
        return next();
      }

      // Check blacklist for optional auth too (optional routes are never sensitive, so fail-open is acceptable)
      const isBlacklisted = await isMerchantTokenBlacklisted(token, req);
      if (isBlacklisted) {
        return next(); // Treat as unauthenticated for optional routes
      }

      // Fix 5: Pin algorithm to HS256
      const decoded = jwt.verify(token, merchantSecret, { algorithms: ['HS256'] }) as any;

      // SPEEDCORE: Check Redis cache first for optional auth (60s TTL)
      const cacheKey = `merchant:auth:${decoded.merchantId}:${decoded.merchantUserId || 'owner'}`;
      const cached = await redisService.get<any>(cacheKey).catch(() => null);

      if (cached) {
        if (cached.merchant?.isActive) {
          req.merchantId = decoded.merchantId;
          req.merchant = cached.merchant;
          if (cached.merchantUser && cached.merchantUser.status === 'active') {
            req.merchantUser = cached.merchantUser;
          }
        }
        return next();
      }

      // Cache miss — load from DB
      const merchant = await Merchant.findById(decoded.merchantId);

      if (merchant && merchant.isActive) {
        req.merchantId = decoded.merchantId;
        req.merchant = merchant;

        let merchantUser = null;

        // Load MerchantUser if present
        if (decoded.merchantUserId) {
          merchantUser = await MerchantUser.findById(decoded.merchantUserId);
          if (
            merchantUser &&
            merchantUser.status === 'active' &&
            merchantUser.merchantId?.toString() === decoded.merchantId
          ) {
            req.merchantUser = merchantUser;
          }
        }

        // SPEEDCORE: Cache for optional auth too
        try {
          await redisService.set(
            cacheKey,
            {
              merchant: { _id: merchant._id, isActive: merchant.isActive },
              merchantUser: merchantUser
                ? {
                    _id: merchantUser._id,
                    status: merchantUser.status,
                    accountLockedUntil: merchantUser.accountLockedUntil,
                  }
                : null,
            },
            60,
          );
        } catch (cacheErr) {
          logger.warn('[MERCHANT AUTH] Failed to cache optional auth info:', (cacheErr as Error).message);
        }
      }
    }

    next();
  } catch (_error) {
    // Continue without authentication if token is invalid
    next();
  }
};
