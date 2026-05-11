// @ts-nocheck
/**
 * Admin Authentication Routes
 * Handles email/password login for admin users
 *
 * SANA: Security Hardening
 * - Admin login requests are rate-limited to 5 attempts per 15 minutes (brute force protection)
 * - JWT tokens are generated with separate JWT_ADMIN_SECRET (prevents privilege escalation)
 * - Tokens are transmitted only in Authorization headers (never in URLs or query parameters)
 * - All tokens are validated against role claims (user token cannot claim admin role)
 * - TOTP 2FA is supported for additional account protection
 * - Refresh token rotation is enforced (old tokens are invalidated)
 * - Device logout invalidates all tokens for a user across all sessions
 * - Refresh tokens are hashed before storage (prevents token database leaks)
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { User } from '../../models/User';
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authenticate,
  logoutAllDevices,
  blacklistToken,
  isTokenBlacklisted,
} from '../../middleware/auth';
import jwt from 'jsonwebtoken';
import { adminAuthLimiter } from '../../middleware/rateLimiter';
import { generateTotpSecret, enableTotp, disableTotp, verifyTotp } from '../../services/adminTotpService';
import { logger } from '../../config/logger';
import { asyncHandler } from '../../utils/asyncHandler';

const router = Router();

const totpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many TOTP attempts, please try again later' },
});

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many token refresh attempts, please try again later' },
});

// SANA: Hash refresh token for secure storage — never store raw tokens in DB
const hashRefreshToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

// Role hierarchy for permissions
const ROLE_HIERARCHY: Record<string, number> = {
  support: 60,
  operator: 70,
  admin: 80,
  super_admin: 100,
};

function buildAdminAuthUser(user: any) {
  return {
    _id: user._id,
    email: user.email,
    name: user.fullName || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Admin',
    role: user.role,
    level: ROLE_HIERARCHY[user.role] || ROLE_HIERARCHY['admin'],
    permissions: user.role === 'super_admin' ? ['*'] : [],
    lastLogin: user.auth.lastLogin,
    createdAt: user.createdAt,
  };
}

function verifyAdminTotpSetupToken(token: string): { userId: string; role: string } {
  if (!process.env.JWT_ADMIN_SECRET) {
    throw new Error('JWT_ADMIN_SECRET is required for admin TOTP setup');
  }

  const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET, {
    algorithms: ['HS256'],
    issuer: 'rez-admin-auth',
    audience: 'rez-admin-totp-setup',
  }) as { userId?: string; role?: string; purpose?: string };

  if (decoded.purpose !== 'admin_totp_setup' || !decoded.userId || !decoded.role) {
    throw new Error('Invalid admin TOTP setup token');
  }

  return { userId: decoded.userId, role: decoded.role };
}

async function resolveTotpSetupUser(req: Request): Promise<any> {
  const adminRoles = ['admin', 'support', 'operator', 'super_admin'];
  const setupToken =
    req.body?.setupToken ||
    (req.headers.authorization?.startsWith('Setup ') ? req.headers.authorization.slice('Setup '.length) : undefined);

  if (req.user && adminRoles.includes(req.user.role)) {
    return req.user;
  }

  if (!setupToken || typeof setupToken !== 'string') {
    throw new Error('Admin authentication or setup token required');
  }

  const { userId, role } = verifyAdminTotpSetupToken(setupToken);
  if (!adminRoles.includes(role)) {
    throw new Error('Admin access required');
  }

  const user = await User.findById(userId);
  if (!user || !adminRoles.includes(user.role) || !user.isActive) {
    throw new Error('Admin account not available for TOTP setup');
  }

  return user;
}

/**
 * POST /api/auth/login
 * Admin login with email and password
 */
router.post(
  '/login',
  adminAuthLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user by email with password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user has an admin-level role
    const adminRoles = ['admin', 'support', 'operator', 'super_admin'];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Verify password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password not set.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token with actual role (critical for RBAC + socket.io auth)
    const token = generateToken((user._id as string).toString(), user.role);
    const refreshToken = generateRefreshToken((user._id as string).toString());

    // SENS-01 FIX: Enforce TOTP at runtime when REQUIRE_ADMIN_TOTP is not explicitly 'false'.
    // If the user has TOTP enabled and the flag requires it, issue a temp challenge token
    // instead of the real token. The frontend must then call POST /login/verify-totp
    // with the challenge token + TOTP code to receive the actual admin token.
    const requireTotp = process.env.REQUIRE_ADMIN_TOTP !== 'false';
    const userTotpEnabled = user.auth?.totpEnabled === true;

    if (requireTotp && userTotpEnabled) {
      // Issue a short-lived temp token that can only be exchanged for the real token via TOTP
      const userId = (user._id as string | { toString(): string }).toString();
      const challengeToken = jwt.sign(
        { userId, role: user.role, purpose: 'admin_totp_challenge' },
        process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET!,
        { expiresIn: '5m', audience: 'rez-admin' },
      );
      return res.json({
        success: true,
        requiresTotp: true,
        tempToken: challengeToken,
        message: 'TOTP verification required',
      });
    }

    // SANA: Store hashed refresh token (never raw) — prevents token database leaks from compromising auth
    user.auth.refreshToken = hashRefreshToken(refreshToken);

    // Update last login
    user.auth.lastLogin = new Date();
    await user.save();

    // Return user data (map to admin format expected by frontend)
    res.json({
      success: true,
      data: {
        user: buildAdminAuthUser(user),
        token,
        refreshToken,
      },
    });
  }),
);

/**
 * POST /api/admin/auth/login/verify-totp
 * Complete admin login after TOTP verification.
 * SENS-01: Runtime enforcement of REQUIRE_ADMIN_TOTP flag.
 */
router.post(
  '/login/verify-totp',
  adminAuthLimiter,
  totpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { tempToken, totpCode } = req.body;

    if (!tempToken || !totpCode) {
      return res.status(400).json({ success: false, message: 'tempToken and totpCode are required' });
    }

    // Verify the challenge token
    let decoded: { userId?: string; role?: string; purpose?: string };
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET!, {
        audience: 'rez-admin',
      }) as typeof decoded;
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired challenge token' });
    }

    if (decoded.purpose !== 'admin_totp_challenge' || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid challenge token purpose' });
    }

    // Verify TOTP code
    const isTotpValid = await verifyTotp(decoded.userId, totpCode);
    if (!isTotpValid) {
      logger.warn(`[ADMIN AUTH] Invalid TOTP code for user ${decoded.userId}`);
      return res.status(401).json({ success: false, message: 'Invalid TOTP code' });
    }

    // Issue the real admin token
    const token = generateToken(decoded.userId, decoded.role || 'admin');
    const refreshToken = generateRefreshToken(decoded.userId);

    // Update last login
    await User.findByIdAndUpdate(decoded.userId, { $set: { 'auth.lastLogin': new Date() } });

    logger.info(`[ADMIN AUTH] TOTP login successful for user ${decoded.userId}`);

    res.json({
      success: true,
      data: { token, refreshToken },
    });
  }),
);

/**
 * POST /api/admin/auth/refresh-token
 * Refresh an expired admin access token using a valid refresh token
 */
router.post(
  '/refresh-token',
  refreshTokenLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken || req.cookies?.rez_admin_refresh;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    // AS2-C2: Check Redis blacklist before JWT verification — a revoked refresh token
    // (e.g. after logout or logout-all-devices) must be rejected even if the JWT is
    // still cryptographically valid. isTokenBlacklisted hashes the token internally.
    if (await isTokenBlacklisted(refreshToken, process.env.NODE_ENV === 'production')) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked' });
    }

    // Verify the refresh token
    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as {
        userId: string;
      };
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Find user and validate
    const user = await User.findById(decoded.userId).select('+auth.refreshToken');
    const adminRoles = ['admin', 'support', 'operator', 'super_admin'];

    if (!user || !adminRoles.includes(user.role)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token or not an admin',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // SANA: Compare against hashed refresh token (prevents token database leaks)
    if (user.auth.refreshToken !== hashRefreshToken(refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked',
      });
    }

    // Generate new tokens
    const newToken = generateToken((user._id as string).toString(), user.role);
    const newRefreshToken = generateRefreshToken((user._id as string).toString());

    // SANA: Store hashed refresh token (rotate with hash)
    user.auth.refreshToken = hashRefreshToken(newRefreshToken);
    await user.save();

    logger.info('[Admin Auth] Token refreshed for admin', { userId: String(user._id) });

    res.json({
      success: true,
      data: {
        user: buildAdminAuthUser(user),
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  }),
);

/**
 * POST /api/auth/logout
 * Admin logout — blacklists the current access token and clears the refresh token hash.
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    // Blacklist the current access token for its remaining TTL.
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.decode(token) as any;
        const remainingTtl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 24 * 3600;
        if (remainingTtl > 0) await blacklistToken(token, remainingTtl);
      } catch {
        /* ignore */
      }
    }

    // Revoke the stored refresh token so it cannot be used post-logout.
    if (userId) {
      await User.findByIdAndUpdate(userId, { $unset: { 'auth.refreshToken': 1 } }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }),
);

/**
 * GET /api/auth/me
 * Get current admin user
 */
router.get(
  '/me',
  adminAuthLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // SECURITY: Check blacklist BEFORE verifying claims. A logged-out admin token
    // that has not yet expired must not be accepted by /me — it is used by the
    // admin app to validate the session on startup, so a revoked token would
    // keep a terminated/logged-out admin session alive until JWT expiry.
    // Fail closed in production (Redis unavailable → reject); fail open in dev.
    const failClosed = process.env.NODE_ENV === 'production';
    if (await isTokenBlacklisted(token, failClosed)) {
      return res.status(401).json({ success: false, message: 'Token has been revoked' });
    }

    // Verify token using shared auth utility (pinned HS256, no fallback secret)
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId);

    const adminRoles = ['admin', 'support', 'operator', 'super_admin'];
    if (!user || !adminRoles.includes(user.role)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or not an admin',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    if (user.auth?.lockUntil && user.auth.lockUntil > new Date()) {
      return res.status(401).json({ success: false, message: 'Account locked' });
    }

    res.json({
      success: true,
      data: {
        user: buildAdminAuthUser(user),
      },
    });
  }),
);

/**
 * POST /api/admin/auth/totp/setup
 * Generate TOTP secret and QR code URI for admin 2FA setup
 */
router.post(
  '/totp/setup',
  totpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await resolveTotpSetupUser(req);
    const userId = String(user._id);

    const result = await generateTotpSecret(userId);

    res.json({
      success: true,
      data: {
        secret: result.secret,
        uri: result.uri,
        message: 'Scan the QR code with your authenticator app, then verify with /totp/verify',
      },
    });
  }),
);

/**
 * POST /api/admin/auth/totp/verify
 * Verify TOTP code and enable 2FA
 */
router.post(
  '/totp/verify',
  totpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await resolveTotpSetupUser(req);
    const userId = String(user._id);
    const { code } = req.body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return res.status(400).json({ success: false, message: 'Valid 6-digit TOTP code required' });
    }

    const enabled = await enableTotp(userId, code);
    if (!enabled) {
      return res.status(401).json({ success: false, message: 'Invalid TOTP code' });
    }

    user.auth.lastLogin = new Date();
    const token = generateToken(userId, user.role);
    const refreshToken = generateRefreshToken(userId);
    user.auth.refreshToken = hashRefreshToken(refreshToken);
    await user.save();

    res.json({
      success: true,
      message: 'TOTP 2FA enabled successfully',
      data: {
        user: buildAdminAuthUser(user),
        token,
        refreshToken,
      },
    });
  }),
);

/**
 * DELETE /api/admin/auth/totp
 * Disable TOTP 2FA (requires valid code)
 */
router.delete(
  '/totp',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { code } = req.body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return res.status(400).json({ success: false, message: 'Valid 6-digit TOTP code required to disable 2FA' });
    }

    const disabled = await disableTotp(userId, code);
    if (!disabled) {
      return res.status(401).json({ success: false, message: 'Invalid TOTP code' });
    }

    res.json({ success: true, message: 'TOTP 2FA disabled successfully' });
  }),
);

/**
 * POST /api/admin/auth/logout-all-devices
 * Invalidate all tokens for the current admin user
 */
router.post(
  '/logout-all-devices',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const adminRoles = ['admin', 'support', 'operator', 'super_admin'];
    if (!req.user || !adminRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    await logoutAllDevices(userId);

    // Clear stored refresh token
    await User.findByIdAndUpdate(userId, { $unset: { 'auth.refreshToken': 1 } });

    res.json({ success: true, message: 'All sessions invalidated. All devices must re-login.' });
  }),
);

/**
 * POST /api/admin/auth/change-password
 * Self-service password change for the currently authenticated admin
 *
 * SECURITY: adminAuthLimiter enforces 5 attempts per 15 minutes (fail-closed).
 * Without this, a stolen admin session token allows unlimited password-change attempts,
 * enabling an attacker to permanently lock the real admin out of their account.
 */
router.post(
  '/change-password',
  authenticate,
  adminAuthLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password' });
    }

    const userId = (req as any).userId || (req as any).user?._id;
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const adminRoles = ['admin', 'support', 'operator', 'super_admin'];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, message: 'No password set for this account' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    logger.info('[Admin Auth] Password changed for admin', { userId });

    res.json({ success: true, message: 'Password changed successfully' });
  }),
);

export default router;
