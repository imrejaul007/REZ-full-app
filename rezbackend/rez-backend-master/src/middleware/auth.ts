import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import redisService from '../services/redisService';
import { logger } from '../config/logger';
import * as deviceFingerprintService from '../services/deviceFingerprintService';

// Extend Express Request type with custom properties
// NOTE: req.user is typed as IUser in src/types/express-augment.d.ts — do not re-declare as `any` here.
declare global {
  namespace Express {
    interface Request {
      deviceRisk?: string;
      deviceHash?: string;
    }
  }
}

/** BED-007: Typed shape of the JWT cache value stored in Redis by the authenticate middleware */
interface CachedJwtUser {
  _id: string;
  phone: string;
  role: string;
  isActive?: boolean;
  isAccountLocked?: boolean;
}

// Token blacklist helpers (Redis-backed)
// Standardized key format: blacklist:{sha256(token)}
// No role prefix, always hashed — matches merchantauth.ts and all downstream services
// (wallet-service, payment-service) so a logout from any surface invalidates the token everywhere.
const TOKEN_BLACKLIST_PREFIX = 'blacklist:';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function blacklistToken(token: string, ttlSeconds: number): Promise<void> {
  try {
    await redisService.set(`${TOKEN_BLACKLIST_PREFIX}${hashToken(token)}`, '1', ttlSeconds);
  } catch {
    logger.error('[AUTH] Failed to blacklist token (Redis unavailable)');
  }
}

export async function isTokenBlacklisted(token: string, failClosed = true): Promise<boolean> {
  try {
    if (!redisService.isReady()) {
      logger.warn(`[AUTH] Redis unavailable for blacklist check — failing ${failClosed ? 'closed' : 'open'}`);
      return failClosed;
    }
    return await redisService.exists(`${TOKEN_BLACKLIST_PREFIX}${hashToken(token)}`);
  } catch {
    logger.warn(`[AUTH] Redis error during blacklist check — failing ${failClosed ? 'closed' : 'open'}`);
    return failClosed;
  }
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

// AS2-L3 FIX: Refresh tokens only embed { userId } — they do NOT carry a role claim.
// Using a separate interface prevents callers from reading decoded.role (which would be
// undefined) after calling verifyRefreshToken(), eliminating a silent runtime footgun.
// Any code that needs the role after refresh must re-fetch it from the DB or re-read
// it from a fresh access token.
interface RefreshTokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

// Admin roles that use the separate admin JWT secret
const ADMIN_ROLES = ['admin', 'super_admin', 'operator', 'support'];

// Get the appropriate JWT secret based on role
const getJwtSecret = (role: string): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security');
  }

  if (ADMIN_ROLES.includes(role) && process.env.JWT_ADMIN_SECRET) {
    if (process.env.JWT_ADMIN_SECRET.length < 32) {
      throw new Error('JWT_ADMIN_SECRET must be at least 32 characters long for security');
    }
    return process.env.JWT_ADMIN_SECRET;
  }

  return process.env.JWT_SECRET;
};

/** Validate that a JWT expiresIn value is a format accepted by jsonwebtoken.
 *  Accepted forms: digits (plain seconds) or digits + unit (s/m/h/d/w/y).
 *  Returns the validated value or the fallback if invalid. */
function parseJwtExpiry(raw: string | undefined, fallback: StringValue): StringValue {
  if (!raw) return fallback;
  if (/^\d+[smhdwy]?$/.test(raw)) return raw as StringValue;
  // Invalid format — log at startup so ops can fix the env var
  logger.error(`[Auth] Invalid JWT expiry "${raw}" — using fallback "${fallback}". Use format like "15m", "1h", "7d".`);
  return fallback;
}

// Generate JWT token
export const generateToken = (userId: string, role: string = 'user'): string => {
  const payload = { userId, role };
  const secret = getJwtSecret(role);
  const expiresIn: StringValue = parseJwtExpiry(process.env.JWT_EXPIRES_IN, '60m');

  return jwt.sign(payload, secret, { expiresIn });
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  const payload = { userId };

  // Validate refresh secret exists and is strong
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }
  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long for security');
  }

  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn: StringValue = parseJwtExpiry(process.env.JWT_REFRESH_EXPIRES_IN, '7d');

  return jwt.sign(payload, secret, { expiresIn });
};

// Verify JWT token — strict two-path verification to prevent role spoofing
// SECURITY: A user token (signed with JWT_SECRET) claiming an admin role must be REJECTED.
//           Admin roles are ONLY valid when signed with JWT_ADMIN_SECRET.
export const verifyToken = (token: string): JWTPayload => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  // SECURITY: In production, JWT_ADMIN_SECRET MUST be set. Without it, admin tokens
  // fall back to the user secret, destroying the separation of privilege between
  // user and admin authentication surfaces.
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_ADMIN_SECRET) {
    throw new Error('JWT_ADMIN_SECRET is required in production');
  }

  if (process.env.JWT_ADMIN_SECRET) {
    // Try admin secret first
    try {
      const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET, { algorithms: ['HS256'] }) as JWTPayload;
      if (ADMIN_ROLES.includes(decoded.role)) {
        return decoded; // Valid admin token — signed with admin secret AND has admin role
      }
      // Token was signed with admin secret but has no admin role — reject it entirely.
      // This prevents a confused deputy attack where a service token uses the admin secret.
      throw new Error('Token signed with admin secret but lacks an admin role');
    } catch (err: any) {
      // Only fall through to user-secret path if this is a genuine signature error
      if (!err.message?.startsWith('Token signed with admin secret')) {
        // Not signed with admin secret — fall through to user secret below
      } else {
        throw err; // Re-throw our own validation error
      }
    }
  }

  // Try merchant token — accepts tokens from rez-merchant-service (e.g. merchant dashboard).
  // Cross-service endpoints like /api/web-ordering/analytics need this to authenticate
  // merchant dashboard tokens alongside user tokens.
  if (process.env.JWT_MERCHANT_SECRET) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_MERCHANT_SECRET, { algorithms: ['HS256'] }) as JWTPayload;
      // Merchant tokens have merchantId instead of userId — pass through with the same payload
      return decoded;
    } catch {
      // Not a merchant token — fall through to user secret verification below
    }
  }

  // Verify with user secret
  const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }) as JWTPayload;

  // SECURITY: User tokens signed with JWT_SECRET MUST NOT claim admin roles.
  // Admin tokens require JWT_ADMIN_SECRET signature. This closes the privilege escalation
  // vector where an attacker constructs a user token with role:'admin'.
  if (process.env.JWT_ADMIN_SECRET && ADMIN_ROLES.includes(decoded.role)) {
    throw new Error('Admin role claim requires JWT_ADMIN_SECRET signature');
  }

  return decoded;
};

// verifyMerchantToken — accepts tokens signed by the merchant service (rez-merchant-service).
// Used by cross-service endpoints (e.g. /api/web-ordering/analytics) that need to
// authenticate both user tokens AND merchant dashboard tokens.
export const verifyMerchantToken = (token: string): JWTPayload => {
  const secret = process.env.JWT_MERCHANT_SECRET;
  if (!secret) {
    throw new Error('JWT_MERCHANT_SECRET is not configured');
  }
  return jwt.verify(token, secret, { algorithms: ['HS256'] }) as JWTPayload;
};

// Verify refresh token
// AS2-L3 FIX: Returns RefreshTokenPayload (no role field) to match what generateRefreshToken
// actually embeds. Callers that need the user's role must query the DB or use the access token.
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required');
  }
  const secret = process.env.JWT_REFRESH_SECRET;
  return jwt.verify(token, secret, { algorithms: ['HS256'] }) as RefreshTokenPayload;
};

// Logout all devices for a user — invalidates all existing tokens
const ALL_LOGOUT_PREFIX = 'allLogout:';

export async function logoutAllDevices(userId: string): Promise<void> {
  try {
    // Store the timestamp — any token issued before this time is invalid
    await redisService.set(`${ALL_LOGOUT_PREFIX}${userId}`, Date.now(), 30 * 24 * 60 * 60); // 30d TTL
    logger.info(`[AUTH] Logout-all-devices triggered for user ${userId}`);
  } catch {
    logger.error(`[AUTH] Failed to set logout-all-devices for user ${userId}`);
  }
}

async function isTokenIssuedBeforeLogoutAll(userId: string, iat: number): Promise<boolean> {
  try {
    const logoutTimestamp = await redisService.get<number>(`${ALL_LOGOUT_PREFIX}${userId}`);
    if (logoutTimestamp && iat < Math.floor(logoutTimestamp / 1000)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Extract token from request
// SANA: security hardening — Only accept tokens from Authorization header (Bearer scheme)
//       or httpOnly cookie named 'rez_access_token'. Query parameters are never accepted.
//       Tokens MUST be in Authorization headers or httpOnly cookies only.
const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// Phase 6: Dual-mode token extraction — Bearer header first (existing behaviour, unchanged),
// then httpOnly cookie fallback for browser surfaces (rez-web-menu, rezadmin, rezapp web, rezmerchant web).
// Native clients continue to send Bearer headers; no behaviour change for them.
function extractToken(req: Request): string | null {
  // Priority 1: Bearer token header (existing behaviour — untouched)
  const fromHeader = extractTokenFromHeader(req.headers.authorization);
  if (fromHeader) return fromHeader;

  // Priority 2: httpOnly cookie fallback for browser surfaces
  // Cookie is set by the backend on login (see authController verifyOTP / verify-pin)
  // M10: Also accept rez_merchant_token for merchant browser surfaces (cookie-parser must be mounted).
  const token = req.cookies?.rez_access_token || req.cookies?.rez_merchant_token;
  if (token) {
    return token as string;
  }

  return null;
}

// SANA: security hardening — Reject any attempt to pass tokens via query parameters.
//       This prevents token exposure in browser history, server logs, and proxy logs.
const validateNoTokenInQueryString = (req: Request): void => {
  if (req.query && typeof req.query === 'object') {
    const suspiciousKeys = Object.keys(req.query).filter(
      (k) => k.toLowerCase() === 'token' || k.toLowerCase() === 'access_token' || k.toLowerCase() === 'jwt',
    );

    if (suspiciousKeys.length > 0) {
      logger.warn('🚨 [AUTH] SECURITY: Attempted token injection via query parameter detected', {
        path: req.path,
        suspiciousKeys,
        ip: req.ip,
      });
      throw new Error('Tokens cannot be passed as query parameters. Use Authorization header instead.');
    }
  }
};

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // SANA: security hardening — Validate that no sensitive tokens are in query parameters
    validateNoTokenInQueryString(req);

    // Phase 6: Use dual-mode extraction — Bearer header takes priority, cookie is fallback
    const token = extractToken(req);

    logger.debug('🔐 [AUTH] Authenticating request:', {
      path: req.path,
      method: req.method,
      hasToken: !!token,
      tokenSource: req.headers.authorization ? 'bearer' : req.cookies?.rez_access_token ? 'cookie' : 'none',
    });

    if (!token) {
      logger.warn('⚠️ [AUTH] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    try {
      // Check if token is blacklisted (e.g. after logout or refresh)
      // BUG-027 FIX: Fail closed (reject) when Redis is unavailable for any
      // sensitive path.  Added /orders to the sensitive list — a revoked token
      // must not be able to create or view orders even if Redis is temporarily down.
      const SENSITIVE_PATH_PATTERNS = [
        /\/admin/,
        /\/wallet/,
        /\/transfer/,
        /\/prive/,
        /\/payment/,
        /\/withdraw/,
        /\/orders/,
      ];
      // CRIT-2 FIX: Fail closed for ALL authenticated paths in production — a Redis
      // outage must never re-enable a revoked (logged-out) token.
      // In development, fail open so that a Redis connection issue doesn't block
      // every authenticated request during local testing.
      const failClosed = process.env.NODE_ENV === 'production';
      if (await isTokenBlacklisted(token, failClosed)) {
        return res.status(401).json({ success: false, message: 'Token has been revoked' });
      }

      const decoded = verifyToken(token);

      // Check if user triggered logout-all-devices after this token was issued
      if (await isTokenIssuedBeforeLogoutAll(decoded.userId, decoded.iat)) {
        return res.status(401).json({ success: false, message: 'Session invalidated. Please login again.' });
      }

      // SPEEDCORE: Check JWT cache first (60s TTL) to reduce User DB lookups on busy endpoints
      const jwtCacheKey = `auth:user:${decoded.userId}`;
      const cachedUser = await redisService.get<CachedJwtUser>(jwtCacheKey).catch(() => null);

      let user;
      if (cachedUser) {
        // Reconstruct minimal user object from cache
        user = cachedUser;
      } else {
        // Cache miss — load from DB
        user = await User.findById(decoded.userId).select('-auth.refreshToken -auth.otpCode -auth.otpExpiry -__v');

        if (user) {
          // Cache user metadata for 5s (reduced from 15s to minimise stale locked-account
          // window; tradeoff: ~3x more DB reads on busy endpoints, but account locks and
          // deactivations propagate within 5 seconds instead of up to 15 seconds).
          try {
            await redisService.set(
              jwtCacheKey,
              {
                _id: user._id,
                phone: user.phoneNumber,
                role: user.role,
                isActive: user.isActive,
                isAccountLocked: user.isAccountLocked(),
              },
              5,
            );
          } catch (cacheErr) {
            logger.warn('[AUTH] Failed to cache user:', (cacheErr as Error).message);
          }
        }
      }

      if (!user) {
        logger.warn('⚠️ [AUTH] User not found:', decoded.userId);
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // MED-4 / MED-5 FIX: For sensitive paths, always re-fetch fresh account status from
      // MongoDB rather than trusting the 5-second Redis cache.  The cached `isAccountLocked`
      // boolean is computed at write-time and will be stale for up to 5 seconds after an
      // admin locks an account.  Bypassing the cache here closes that window for any path
      // that involves money, admin actions, or order mutations.
      const isSensitivePath = SENSITIVE_PATH_PATTERNS.some((p) => p.test(req.path));
      if (isSensitivePath && cachedUser) {
        const freshStatus = await User.findById(decoded.userId)
          .select('isActive auth.lockUntil auth.loginAttempts')
          .lean();
        if (!freshStatus || !freshStatus.isActive) {
          logger.warn('⚠️ [AUTH] Account inactive (fresh DB check):', decoded.userId);
          return res.status(401).json({
            success: false,
            message: 'Account is deactivated',
          });
        }
        if (freshStatus.auth?.lockUntil && freshStatus.auth.lockUntil > new Date()) {
          logger.warn('⚠️ [AUTH] Account locked (fresh DB check):', decoded.userId);
          return res.status(403).json({
            success: false,
            code: 'ACCOUNT_LOCKED',
            message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
          });
        }
      }

      if (!user.isActive) {
        logger.warn('⚠️ [AUTH] Account deactivated:', user._id);
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      // CS-C2 / CS-H6 FIX: Block suspended users from accessing any authenticated endpoint.
      // Check isSuspended flag and status field in addition to isActive.
      // Fresh DB fetch is used here because cached user object may lack isSuspended/status.
      const suspensionCheck = await User.findById(decoded.userId).select('isSuspended status').lean();
      if (
        suspensionCheck &&
        ((suspensionCheck as any).isSuspended === true || (suspensionCheck as any).status === 'suspended')
      ) {
        logger.warn('⚠️ [AUTH] Account suspended:', decoded.userId);
        return res.status(403).json({ error: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
      }

      // Check account locked status
      if (
        user.isAccountLocked &&
        (typeof user.isAccountLocked === 'function' ? user.isAccountLocked() : user.isAccountLocked)
      ) {
        logger.warn('⚠️ [AUTH] Account locked:', user._id);
        return res.status(403).json({
          success: false,
          code: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
        });
      }

      // Attach user to request — cached user is a subset of IUser fields needed downstream
      req.user = user as IUser;
      req.userId = String(user._id);

      // Device fingerprint check (non-blocking for old app versions without header)
      const deviceHash = req.headers['x-device-fingerprint'] as string | undefined;
      if (deviceHash) {
        try {
          const deviceStatus = await deviceFingerprintService.checkDeviceStatus(deviceHash);
          if (deviceStatus.isBlocked) {
            return res.status(403).json({
              success: false,
              code: 'DEVICE_BLOCKED',
              blocked: true,
              message:
                'This device has been blocked due to suspicious activity. Please use a different device or contact support.',
            });
          }
          // Attach risk level for downstream handlers
          req.deviceRisk = deviceStatus.riskLevel;
          req.deviceHash = deviceHash;

          // Fire-and-forget: register device usage with timeout
          const osHeader = (req.headers['x-device-os'] as string) || '';
          const parts = osHeader.split(' ');
          const platform = parts[0] || 'web';
          const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
          Promise.race([
            deviceFingerprintService.registerDevice(
              deviceHash,
              parts.slice(1).join(' ') || '',
              '',
              platform,
              String(user._id),
              ip,
            ),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
          ]).catch((err) => logger.warn('Device registration failed:', err.message));
        } catch (deviceErr) {
          // Graceful degradation — don't block auth on device service failure
          logger.warn('[AUTH] Device fingerprint check failed, allowing request', {
            error: (deviceErr as Error).message,
          });
        }
      }

      next();
    } catch (tokenError: any) {
      logger.error('❌ [AUTH] Token verification failed:', {
        error: tokenError.message,
        name: tokenError.name,
        expiredAt: tokenError.expiredAt,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        error: process.env.NODE_ENV === 'development' ? tokenError.message : undefined,
      });
    }
  } catch (error: any) {
    // SECURITY: query-param token rejection throws — map it to 401 not 500.
    if (error?.message?.includes('query parameters')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    logger.error('❌ [AUTH] Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Phase 6: Use dual-mode extraction — Bearer header takes priority, cookie is fallback
    const token = extractToken(req);

    if (token) {
      try {
        // Check if token is blacklisted before verifying
        if (await isTokenBlacklisted(token, true)) {
          // AS2-L2 FIX: Log blacklisted token usage for security event observability.
          // Hash the token before logging so the raw JWT is never stored in logs.
          const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
          logger.warn(
            `[AUTH] Blacklisted token presented on optionalAuth route ${req.method} ${req.path} — tokenHash: ${tokenHash.slice(0, 16)}...`,
          );
          // Token is blacklisted, treat as anonymous and continue
          return next();
        }

        const decoded = verifyToken(token);

        // AS2-H1: Apply the same logout-all-devices check that `authenticate` performs.
        // Without this, a user who called logout-all-devices could still be partially
        // identified (req.user set) on optional-auth endpoints until the JWT expires.
        if (await isTokenIssuedBeforeLogoutAll(decoded.userId, decoded.iat)) {
          // Treat as anonymous — do not attach user to request
          return next();
        }

        // BUG-034: Apply the same 5s Redis cache used in `authenticate` so that
        // high-volume optional-auth endpoints (coupon listing, menu pages, etc.)
        // don't hit MongoDB on every request.
        const jwtCacheKey = `auth:user:${decoded.userId}`;
        let user: IUser | CachedJwtUser | null = await redisService.get<CachedJwtUser>(jwtCacheKey).catch(() => null);
        if (!user) {
          user = await User.findById(decoded.userId).select('-auth.refreshToken -auth.otpCode -auth.otpExpiry -__v');
          if (user) {
            try {
              await redisService.set(
                jwtCacheKey,
                {
                  _id: user._id,
                  phone: (user as IUser).phoneNumber,
                  role: user.role,
                  isActive: (user as IUser).isActive,
                  isAccountLocked: (user as IUser).isAccountLocked(),
                },
                5,
              );
            } catch {
              // Non-critical — continue without caching
            }
          }
        }

        const isLocked =
          typeof (user as IUser).isAccountLocked === 'function'
            ? (user as IUser).isAccountLocked()
            : !!(user as CachedJwtUser).isAccountLocked;
        if (user && user.isActive && !isLocked) {
          // CachedJwtUser is a subset of IUser — cast through unknown to satisfy type checker.
          req.user = user as unknown as IUser;
          req.userId = String(user._id);
        }
      } catch (tokenError) {
        // Log invalid tokens for monitoring (don't fail the request)
        logger.warn(`[AUTH] optionalAuth invalid token on ${req.method} ${req.path}:`, (tokenError as Error).message);
      }
    }

    next();
  } catch (_error) {
    // Don't fail on optional auth errors
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

// Admin role hierarchy: support(60) < operator(70) < admin(80) < super_admin(100)
const ADMIN_ROLE_LEVELS: Record<string, number> = {
  support: 60,
  operator: 70,
  admin: 80,
  super_admin: 100,
};

// Check if user has at least the given admin role level
export const requireAdminRole = (minRole: string) => {
  const minLevel = ADMIN_ROLE_LEVELS[minRole] || 0;
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userLevel = ADMIN_ROLE_LEVELS[req.user.role] || 0;
    if (userLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Requires ${minRole} role or higher.`,
      });
    }

    next();
  };
};

// Check if user is any admin portal role (support or higher)
export const requireAdmin = requireAdminRole('support');

// Check if user is operator or higher (blocks support from write operations)
export const requireOperator = requireAdminRole('operator');

// Check if user is admin or super_admin (for sensitive ops like refunds, user bans, merchant approval)
export const requireSeniorAdmin = requireAdminRole('admin');

// Check if user is super_admin (for destructive ops like deletions, system config)
export const requireSuperAdmin = requireAdminRole('super_admin');

// Check if user is store owner or admin
export const requireStoreOwnerOrAdmin = authorize('store_owner', 'admin', 'super_admin');

// Alias for authenticate (commonly used name)
export const requireAuth = authenticate;

// Alias for authenticate (commonly used in routes)
export const protect = authenticate;
