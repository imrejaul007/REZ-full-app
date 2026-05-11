/**
 * CorpPerks Authentication & Authorization Middleware
 *
 * Provides JWT-based authentication and role-based access control for CorpPerks.
 * Supports corporate admin, HR, finance, manager, and employee roles.
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      corpRole?: string;
      companyId?: string;
    }
  }
}

interface CorpJwtPayload extends JwtPayload {
  userId: string;
  role: string;
  corpRole?: string;
  companyId?: string;
}

// CorpPerks roles - must match corpPerksRoutes.ts definitions
export const CORP_ROLES = {
  CORP_ADMIN: 'corp_admin',
  CORP_HR: 'corp_hr',
  CORP_FINANCE: 'corp_finance',
  CORP_MANAGER: 'corp_manager',
  CORP_EMPLOYEE: 'corp_employee',
} as const;

export type CorpRole = typeof CORP_ROLES[keyof typeof CORP_ROLES];

// Admin corp roles that can perform administrative actions
const ADMIN_CORP_ROLES = [
  CORP_ROLES.CORP_ADMIN,
  CORP_ROLES.CORP_HR,
  CORP_ROLES.CORP_FINANCE,
];

/**
 * Get JWT secret from environment
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.CORP_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET or CORP_JWT_SECRET environment variable is required');
  }
  return secret;
}

/**
 * Validate and decode JWT token
 */
function validateToken(token: string): CorpJwtPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as CorpJwtPayload;
  } catch (err) {
    logger.warn('[CorpAuth] JWT verification failed', { error: (err as Error).message });
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Basic authentication - validates JWT and extracts user info
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const decoded = validateToken(token);
  if (!decoded || !decoded.userId) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  req.userId = decoded.userId;
  req.userRole = decoded.role;
  req.corpRole = decoded.corpRole;
  req.companyId = decoded.companyId;

  next();
}

/**
 * Require CorpPerks admin authentication (corp_admin, corp_hr, corp_finance)
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, () => {
    if (!req.companyId) {
      res.status(401).json({ success: false, message: 'Company ID required' });
      return;
    }

    if (!req.corpRole || !ADMIN_CORP_ROLES.includes(req.corpRole as typeof ADMIN_CORP_ROLES[number])) {
      logger.warn('[CorpAuth] Non-admin user attempted admin action', {
        userId: req.userId,
        corpRole: req.corpRole,
        companyId: req.companyId,
      });
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  });
}

/**
 * Require specific CorpPerks role(s)
 */
export function requireCorpRole(...allowedRoles: CorpRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await requireAuth(req, res, () => {
      if (!req.companyId) {
        res.status(401).json({ success: false, message: 'Company ID required' });
        return;
      }

      if (!req.corpRole || !allowedRoles.includes(req.corpRole as CorpRole)) {
        logger.warn('[CorpAuth] Role mismatch', {
          userId: req.userId,
          corpRole: req.corpRole,
          required: allowedRoles,
        });
        res.status(403).json({ success: false, message: 'Insufficient permissions' });
        return;
      }

      next();
    });
  };
}

/**
 * Internal service-to-service authentication
 * Validates internal API token for backend service calls
 */
export async function requireInternalToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    res.status(401).json({ success: false, message: 'Internal token required' });
    return;
  }

  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;
  if (!expectedToken) {
    logger.error('[CorpAuth] INTERNAL_SERVICE_TOKEN not configured');
    res.status(500).json({ success: false, message: 'Server configuration error' });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  const provided = Buffer.from(internalToken);
  const expected = Buffer.from(expectedToken);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    logger.warn('[CorpAuth] Invalid internal token attempted');
    res.status(401).json({ success: false, message: 'Invalid internal token' });
    return;
  }

  next();
}

/**
 * Verify company ownership - ensures resources belong to the user's company
 * Use this after requireAuth/requireAdminAuth
 */
export function requireCompanyOwnership(getCompanyId: (req: Request) => string | null) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.companyId) {
      res.status(401).json({ success: false, message: 'Company ID required' });
      return;
    }

    const resourceCompanyId = getCompanyId(req);
    if (!resourceCompanyId) {
      res.status(400).json({ success: false, message: 'Resource company ID not found' });
      return;
    }

    if (resourceCompanyId !== req.companyId) {
      logger.warn('[CorpAuth] Company ownership violation', {
        userId: req.userId,
        userCompany: req.companyId,
        resourceCompany: resourceCompanyId,
      });
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    next();
  };
}

/**
 * Check if user has required corp role (helper for inline checks)
 */
export function hasCorpRole(userRole: string | undefined, requiredRoles: CorpRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole as CorpRole);
}

/**
 * Generate CorpPerks JWT token (for testing/admin purposes)
 */
export function generateCorpToken(
  userId: string,
  role: string,
  corpRole: CorpRole,
  companyId: string,
  expiresIn: string = '7d'
): string {
  const payload = {
    userId,
    role,
    corpRole,
    companyId,
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}
