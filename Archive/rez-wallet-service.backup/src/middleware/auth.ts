// Shared middleware aliases added — requireUser/requireMerchant/requireAdmin now available.
// Full re-export shim blocked by tsconfig rootDir. Use these aliases in new routes.

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from '../config/redis';
import { logger } from '../config/logger';
import { errorResponse, errors } from '../utils/response';

interface REZJwtPayload extends JwtPayload {
  userId?: string;
  merchantId?: string;
  role?: string;
  phone?: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      merchantId?: string;
      userPhone?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return errorResponse(res, errors.authTokenMissing());
  }

  const token = header.slice(7);

  let decoded: REZJwtPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ['HS256'] }) as REZJwtPayload;
  } catch {
    return errorResponse(res, errors.authTokenInvalid());
  }

  // Reject merchant/admin tokens from user wallet endpoints
  if (decoded.role && !['user', 'consumer'].includes(decoded.role)) {
    return errorResponse(res, errors.forbidden('User token required for wallet operations', { code: 'WRONG_TOKEN_TYPE' }));
  }

  req.userId = decoded.userId;
  req.userRole = decoded.role;
  req.merchantId = decoded.merchantId;
  req.userPhone = decoded.phone;

  // Check Redis token blacklist — fail closed in production
  try {
    const blacklisted = await redis.exists('blacklist:token:' + token);
    if (blacklisted) {
      return errorResponse(res, errors.authTokenInvalid({ message: 'Token revoked' }));
    }
    const allLogoutTs = await redis.get('allLogout:' + decoded.userId);
    if (allLogoutTs) {
      const logoutSec = Math.floor(Number(allLogoutTs) / 1000);
      if (decoded.iat && decoded.iat < logoutSec) {
        return errorResponse(res, errors.authTokenInvalid({ message: 'Token revoked' }));
      }
    }
  } catch (redisErr) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[AUTH] Redis unavailable — failing open (dev only)');
    } else {
      return errorResponse(res, errors.authServiceUnavailable());
    }
  }

  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  // Initialize defaults — downstream code may check req.userRole even when no token is provided.
  req.userId = undefined;
  req.userRole = undefined;
  req.merchantId = undefined;

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { next(); return; }

  const token = header.slice(7);
  const secrets = [
    process.env.JWT_SECRET,
    process.env.JWT_MERCHANT_SECRET,
  ].filter(Boolean) as string[];

  for (const secret of secrets) {
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.merchantId = decoded.merchantId;
      break;
    } catch {
      continue;
    }
  }
  next();
}

// Admin-facing auth — accepts admin, super_admin, and operator tokens.
// Uses JWT_SECRET, JWT_MERCHANT_SECRET, and JWT_ADMIN_SECRET to verify,
// since admin tokens may be signed with any of these secrets.
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return errorResponse(res, errors.authTokenMissing());
  }

  const token = header.slice(7);
  const secrets = [
    process.env.JWT_SECRET,
    process.env.JWT_ADMIN_SECRET,
    process.env.JWT_MERCHANT_SECRET,
  ].filter(Boolean) as string[];

  let decoded: REZJwtPayload | null = null;
  for (const secret of secrets) {
    try {
      decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as REZJwtPayload;
      break;
    } catch {
      continue;
    }
  }

  if (!decoded) {
    return errorResponse(res, errors.authTokenInvalid());
  }

  const allowedRoles = ['admin', 'super_admin', 'operator'];
  if (!decoded.role || !allowedRoles.includes(decoded.role)) {
    return errorResponse(res, errors.authInsufficientPermissions({
      message: 'Admin role required for this operation',
      code: 'WRONG_TOKEN_TYPE',
    }));
  }

  req.userId = decoded.userId;
  req.userRole = decoded.role;
  req.merchantId = decoded.merchantId;

  // Check Redis token blacklist
  try {
    const blacklisted = await redis.exists('blacklist:token:' + token);
    if (blacklisted) {
      return errorResponse(res, errors.authTokenInvalid({ message: 'Token revoked' }));
    }
  } catch (redisErr) {
    if (process.env.NODE_ENV === 'production') {
      return errorResponse(res, errors.authServiceUnavailable());
    }
  }

  next();
}

// Aliases for shared middleware compatibility
export const requireUser = requireAuth;
export const optionalUser = optionalAuth;

// Merchant-facing auth — verifies JWT_MERCHANT_SECRET, rejects user tokens
export async function requireMerchantAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return errorResponse(res, errors.authTokenMissing());
  }

  const token = header.slice(7);

  let decoded: REZJwtPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_MERCHANT_SECRET!, { algorithms: ['HS256'] }) as REZJwtPayload;
  } catch {
    return errorResponse(res, errors.authTokenInvalid({ message: 'Invalid or expired merchant token' }));
  }

  if (decoded.role && !['merchant', 'owner', 'admin', 'manager', 'staff', 'cashier'].includes(decoded.role)) {
    return errorResponse(res, errors.authInsufficientPermissions({
      message: 'Merchant token required',
      code: 'WRONG_TOKEN_TYPE',
    }));
  }

  req.merchantId = decoded.merchantId || decoded.userId;
  req.userRole = decoded.role;

  try {
    const blacklisted = await redis.exists('blacklist:token:' + token);
    if (blacklisted) {
      return errorResponse(res, errors.authTokenInvalid({ message: 'Token revoked' }));
    }
  } catch (redisErr) {
    if (process.env.NODE_ENV === 'production') {
      return errorResponse(res, errors.authServiceUnavailable());
    }
  }

  next();
}

export const requireMerchant = requireMerchantAuth;
