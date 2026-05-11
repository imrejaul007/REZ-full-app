// Cannot auto-wire as a re-export shim: rez-merchant-service tsconfig sets rootDir=./src,
// which prevents importing from ../../../rez-api-gateway/src/shared/authMiddleware.
// To complete the wire-up, add a path alias in tsconfig.json pointing to the shared file,
// or publish it as a local package. Implementation below is kept in sync with the shared
// middleware (rez-api-gateway/src/shared/authMiddleware.ts — requireMerchant).

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redis } from '../config/redis';
import { Merchant } from '../models/Merchant';
import { errorResponse, errors } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      merchantId?: string;
      merchantUserId?: string;
      merchantRole?: string;
      merchantPermissions?: string[];
    }
  }
}

/**
 * Verifies a merchant JWT signed with JWT_MERCHANT_SECRET.
 * Sets req.merchantId, req.merchantUserId, req.merchantRole, and req.merchantPermissions on success.
 * Token may be supplied as a Bearer token in Authorization header or in the
 * merchant_access_token cookie (matching rez-api-gateway/src/shared/authMiddleware requireMerchant).
 * Tokens invalidated via logout are rejected via a Redis blacklist check.
 */
export async function merchantAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const cookieToken = (req as any).cookies?.merchant_access_token;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : cookieToken;

  if (!token) {
    return errorResponse(res, errors.authTokenMissing({ message: 'No token provided' }));
  }

  const secret = process.env.JWT_MERCHANT_SECRET;
  if (!secret) {
    return errorResponse(res, errors.serviceUnavailable('Authentication'));
  }

  try {
    // Check token blacklist before verifying signature (fast path for logged-out tokens)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
      const isBlacklisted = await redis.get(`blacklist:merchant:${tokenHash}`);
      if (isBlacklisted) {
        return errorResponse(res, errors.authTokenInvalid({ message: 'Token has been invalidated' }));
      }
    } catch {
      // Redis unavailable — fail closed in production, open in development
      if (process.env.NODE_ENV === 'production') {
        return errorResponse(res, errors.authServiceUnavailable());
      }
    }

    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as {
      merchantId: string;
      merchantUserId: string;
      role: string;
      permissions?: string[];
    };

    // Verify merchant account is still active (Redis-cached, TTL 5 min)
    // Prevents deactivated/suspended merchants from operating until JWT expiry (up to 1h)
    const statusCacheKey = `merchant:status:${decoded.merchantId}`;
    let merchantStatus: { isActive: boolean; accountLockedUntil?: number } | null = null;
    try {
      const cached = await redis.get(statusCacheKey);
      if (cached) {
        merchantStatus = JSON.parse(cached);
      } else {
        const merchant = await Merchant.findById(decoded.merchantId)
          .select('isActive accountLockedUntil')
          .lean();
        if (!merchant) {
          return errorResponse(res, errors.authTokenInvalid({ message: 'Merchant account not found' }));
        }
        merchantStatus = {
          isActive: merchant.isActive,
          accountLockedUntil: merchant.accountLockedUntil
            ? (merchant.accountLockedUntil as Date).getTime()
            : undefined,
        };
        await redis.set(statusCacheKey, JSON.stringify(merchantStatus), 'EX', 300);
      }
    } catch {
      // Redis or DB unavailable — fail closed in production, open in development
      if (process.env.NODE_ENV === 'production') {
        return errorResponse(res, errors.authServiceUnavailable());
      }
    }

    // CS-C2: Check immediate suspension marker set by admin invalidate-session endpoint.
    // This provides instant blocking even within the 5-min status cache window.
    try {
      const suspensionKey = `merchant:suspended:${decoded.merchantId}`;
      const isSuspended = await redis.get(suspensionKey);
      if (isSuspended) {
        return errorResponse(res, errors.authAccountSuspended({ message: 'Your merchant account has been suspended.' }));
      }
    } catch {
      // Redis unavailable — fall through; status cache check below still applies
      if (process.env.NODE_ENV === 'production') {
        return errorResponse(res, errors.authServiceUnavailable());
      }
    }

    if (merchantStatus) {
      if (!merchantStatus.isActive) {
        return errorResponse(res, errors.authTokenInvalid({ message: 'Merchant account is not active' }));
      }
      if (merchantStatus.accountLockedUntil && merchantStatus.accountLockedUntil > Date.now()) {
        return errorResponse(res, errors.authAccountLocked({ message: 'Merchant account is temporarily locked' }));
      }
    }

    req.merchantId = decoded.merchantId;
    req.merchantUserId = decoded.merchantUserId;
    req.merchantRole = decoded.role;
    req.merchantPermissions = decoded.permissions;
    next();
  } catch {
    return errorResponse(res, errors.authTokenInvalid());
  }
}

/**
 * HIGH FIX: Gate routes that should only be accessible to verified merchants.
 * Checks merchant.verificationStatus === 'approved'.
 * Should be applied after merchantAuth middleware.
 * Prevents unverified merchants (verificationStatus='pending') from listing products,
 * requesting payouts, or performing other restricted operations.
 * MEDIUM FIX: Cache verification status in Redis with 60-second TTL to reduce DB load.
 */
export async function requireVerifiedMerchant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.merchantId) {
      return errorResponse(res, errors.authTokenMissing({ message: 'Not authenticated' }));
    }

    // MEDIUM FIX: Cache verification status in Redis to reduce DB queries
    const cacheKey = `merchant:verified:${req.merchantId}`;
    let verificationStatus: string | null = null;

    try {
      verificationStatus = await redis.get(cacheKey);
    } catch {
      // Redis unavailable — fall through to DB query
    }

    if (!verificationStatus) {
      const merchant = await Merchant.findById(req.merchantId)
        .select('verificationStatus')
        .lean();

      if (!merchant) {
        return errorResponse(res, errors.notFound('Merchant'));
      }

      verificationStatus = merchant.verificationStatus || 'pending';

      // Cache for 60 seconds
      try {
        await redis.set(cacheKey, verificationStatus, 'EX', 60);
      } catch {
        // Redis unavailable — continue without caching
      }
    }

    if (verificationStatus !== 'verified') {
      return errorResponse(res, errors.authInsufficientPermissions({
        message: `Your merchant account must be verified to perform this action. Current status: ${verificationStatus}`,
      }));
    }

    next();
  } catch (err: any) {
    return errorResponse(res, errors.internalError({ requestId: (req as any).res?.locals?.requestId }));
  }
}
