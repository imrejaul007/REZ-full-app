import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { timingSafeEqual, createHash } from 'crypto';
import { logger } from '../config/logger';
import { redis } from '../config/redis';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userPhone?: string;
  userRole?: string;
}

export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ success: false, error: 'Missing authorization token' });
    return;
  }
  try {
    // P0-SEC-2 FIX: Add Redis blacklist check + role extraction to finance auth
    const tokenBlacklistKey = `blacklist:token:${token}`;
    try {
      const isBlacklisted = await redis.exists(tokenBlacklistKey);
      if (isBlacklisted) {
        res.status(401).json({ success: false, error: 'Token has been revoked' });
        return;
      }
    } catch (redisErr) {
      // Redis unavailable — fail open for development, fail closed for production
      logger.warn('[Auth] Redis unavailable for blacklist check', { error: (redisErr as Error).message });
      if (process.env.NODE_ENV === 'production') {
        res.status(503).json({ success: false, error: 'Authentication service temporarily unavailable' });
        return;
      }
    }

    // Try multiple JWT secrets: user, merchant, admin
    const secrets: Array<{ secret: string | undefined; label: string }> = [
      { secret: process.env.JWT_SECRET, label: 'user' },
      { secret: process.env.JWT_MERCHANT_SECRET, label: 'merchant' },
      { secret: process.env.JWT_ADMIN_SECRET, label: 'admin' },
    ];

    let payload: Record<string, string> | null = null;
    for (const { secret, label } of secrets) {
      if (!secret) continue;
      try {
        payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as Record<string, string>;
        break;
      } catch {
        continue;
      }
    }

    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    // Reject tokens with no role field — ambiguous identity
    if (!payload.role) {
      res.status(401).json({ success: false, error: 'Token missing required role claim' });
      return;
    }
    req.userId = payload.userId || payload.id;
    req.userPhone = payload.phone;
    req.userRole = payload.role;
    next();
  } catch (err) {
    logger.warn('[Auth] Invalid token', { error: (err as Error).message });
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Aliases for backward compatibility
export const requireAuth = authenticateUser;

export const requireAdminAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  await authenticateUser(req, res, async () => {
    if (req.userRole !== 'admin') {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }
    next();
  });
};

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  const callerService = req.headers['x-internal-service'] as string | undefined;
  const scopedTokens = resolveScopedTokens();
  const legacyToken = process.env.INTERNAL_SERVICE_TOKEN;

  // Fail closed — if neither scoped tokens nor legacy token is configured, reject
  if (!scopedTokens && !legacyToken) {
    logger.error('[InternalAuth] Neither INTERNAL_SERVICE_TOKENS_JSON nor INTERNAL_SERVICE_TOKEN configured', {
      path: req.path,
      ip: req.ip,
    });
    res.status(503).json({ success: false, error: 'Internal auth not configured — set INTERNAL_SERVICE_TOKENS_JSON' });
    return;
  }

  // Resolve expected token — prefer scoped map, fall back to legacy single token
  let expected: string | undefined;
  if (scopedTokens && callerService) {
    expected = scopedTokens[callerService];
  } else if (legacyToken) {
    expected = legacyToken;
  }

  // Reject immediately if caller is not in the token map — don't fall through to
  // hash comparison with an empty string (sha256('') === sha256('') would pass).
  if (!expected) {
    logger.warn('[InternalAuth] Unknown caller service or token not configured', { callerService, path: req.path, ip: req.ip });
    res.status(401).json({ success: false, error: 'Invalid internal token' });
    return;
  }

  const provided = req.headers['x-internal-token'];
  if (typeof provided !== 'string' || !provided) {
    logger.warn('[InternalAuth] Missing x-internal-token', { path: req.path, ip: req.ip });
    res.status(401).json({ success: false, error: 'Invalid internal token' });
    return;
  }

  // Use timing-safe comparison to prevent timing attacks
  // Hash both sides to ensure equal-length buffers (required by timingSafeEqual)
  const expectedBuf = createHash('sha256').update(expected).digest();
  const providedBuf = createHash('sha256').update(provided).digest();

  if (!timingSafeEqual(expectedBuf, providedBuf)) {
    logger.warn('[InternalAuth] Invalid x-internal-token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      correlationId: req.headers['x-correlation-id'],
    });
    res.status(401).json({ success: false, error: 'Invalid internal token' });
    return;
  }

  next();
}

function resolveExpectedInternalToken(callerService?: string): string | undefined {
  const scopedTokens = resolveScopedTokens();
  return callerService && scopedTokens ? scopedTokens[callerService] : undefined;
}

function resolveScopedTokens(): Record<string, string> | null {
  const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    // R2-M11: Crash-safe — return null so the service can still start with legacy token.
    logger.warn('[InternalAuth] WARNING: INTERNAL_SERVICE_TOKENS_JSON is not valid JSON — scoped auth disabled');
    return null;
  }
}
