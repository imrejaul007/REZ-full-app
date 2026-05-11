// @ts-nocheck
import { Router } from 'express';
import { requireInternalToken } from '../middleware/internalAuth';
import {
  sendOTP,
  verifyOTP,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  completeOnboarding,
  changePassword,
  deleteAccount,
  exportUserData,
  getUserStatistics,
  uploadAvatar,
  requestEmailChange,
  confirmEmailChange,
} from '../controllers/authController';

import { authenticate, generateToken, generateRefreshToken } from '../middleware/auth';
import { getAccessTokenExpirySeconds } from '../services/auth/tokenHelper';
import { validate } from '../middleware/validation';
import { authSchemas } from '../middleware/validation';
import { uploadProfileImage } from '../middleware/upload';
import {
  authLimiter,
  otpLimiter,
  otpPerIpLimiter,
  securityLimiter,
  verifyOtpLimiter,
  createRateLimiter,
} from '../middleware/rateLimiter';
import { ipKeyGenerator } from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/User';

// Phone-based PIN rate limiter: max 5 attempts per hour per phone number
const pinLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req: any) => 'pin:' + (req.body.phoneNumber || ipKeyGenerator(req.ip ?? '')),
  message: 'Too many PIN attempts. Please try again in an hour.',
});

const router = Router();

// Public routes
// otpPerIpLimiter runs first (coarse IP-level guard: 20/hr per IP) to catch SMS pumping
// across many phone numbers, then otpLimiter enforces per-phone+device limits.
router.post('/send-otp', otpPerIpLimiter, otpLimiter, validate(authSchemas.sendOTP), sendOTP);

router.post('/verify-otp', verifyOtpLimiter, validate(authSchemas.verifyOTP), verifyOTP);

router.post('/refresh-token', authLimiter, validate(authSchemas.refreshToken), refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);

router.get('/me', authenticate, getCurrentUser);

router.patch('/profile', authenticate, validate(authSchemas.updateProfile), updateProfile);

// SECURITY: securityLimiter caps password-change attempts at 3 per hour per user/IP.
// Without this a compromised session token allows unlimited credential-stuffing attempts.
router.put('/change-password', authenticate, securityLimiter, changePassword);

router.post('/complete-onboarding', authenticate, validate(authSchemas.updateProfile), completeOnboarding);

router.delete('/account', authenticate, securityLimiter, deleteAccount);

router.get('/me/data-export', authenticate, securityLimiter, exportUserData);

router.get('/statistics', authenticate, getUserStatistics);

router.post('/upload-avatar', authenticate, uploadProfileImage.single('avatar'), uploadAvatar);

// MED-3 FIX: Two-step email change with OTP verification
// Step 1: request OTP sent to verified phone
router.post('/request-email-change', authenticate, securityLimiter, requestEmailChange);
// Step 2: confirm with OTP and apply the new email
router.post('/confirm-email-change', authenticate, securityLimiter, confirmEmailChange);

// ---------------------------------------------------------------------------
// PIN authentication helpers
// ---------------------------------------------------------------------------
const normalizePinPhone = (phone: string): string => {
  let normalized = phone.replace(/[\s\-()]/g, '');
  if (normalized.startsWith('+')) return normalized;
  if (normalized.startsWith('91') && normalized.length >= 12) return `+${normalized}`;
  if (normalized.startsWith('971') && normalized.length >= 12) return `+${normalized}`;
  return `+91${normalized}`;
};

// SET PIN (after OTP login, requires auth)
router.post(
  '/set-pin',
  authenticate,
  asyncHandler(async (req, res) => {
    const { pin } = req.body;
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be 4–6 digits' });
    }

    const COMMON_PINS = [
      '0000',
      '1111',
      '2222',
      '3333',
      '4444',
      '5555',
      '6666',
      '7777',
      '8888',
      '9999',
      '1234',
      '4321',
      '1212',
      '0101',
      '1010',
    ];
    if (COMMON_PINS.includes(pin)) {
      return res
        .status(400)
        .json({ success: false, message: 'PIN is too common. Please choose a less predictable PIN.' });
    }

    const bcrypt = require('bcryptjs');
    const pinHash = await bcrypt.hash(pin, 10);

    await User.findByIdAndUpdate((req as any).userId, {
      $set: {
        'auth.pinHash': pinHash,
        'auth.pinSetAt': new Date(),
        'auth.pinAttempts': 0,
        'auth.pinLockedUntil': null,
      },
    });

    return res.json({ success: true, message: 'PIN set successfully' });
  }),
);

// VERIFY PIN (no auth required — this IS the auth)
router.post(
  '/verify-pin',
  authLimiter,
  pinLimiter,
  asyncHandler(async (req, res) => {
    const { phoneNumber, pin } = req.body;
    if (!phoneNumber || !pin) {
      return res.status(400).json({ success: false, message: 'Phone number and PIN required' });
    }
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'PIN must be 4–6 digits' });
    }

    const normalizedPhone = normalizePinPhone(phoneNumber);
    const user = await User.findOne({ phoneNumber: normalizedPhone }).select(
      '+auth.pinHash +auth.pinAttempts +auth.pinLockedUntil',
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or PIN' });
    }

    if (!user.auth?.pinHash) {
      return res.status(400).json({
        success: false,
        message: 'PIN not set. Please login with OTP first.',
        code: 'PIN_NOT_SET',
      });
    }

    // Check lock
    if (user.auth.pinLockedUntil && user.auth.pinLockedUntil > new Date()) {
      const mins = Math.ceil((user.auth.pinLockedUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Too many attempts. Try again in ${mins} minutes.`,
      });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(pin, user.auth.pinHash);

    if (!isMatch) {
      const updated = await User.findByIdAndUpdate(user._id, { $inc: { 'auth.pinAttempts': 1 } }, { new: true });
      const attempts = updated?.auth?.pinAttempts ?? 1;
      if (attempts >= 5) {
        await User.findByIdAndUpdate(user._id, {
          $set: { 'auth.pinLockedUntil': new Date(Date.now() + 15 * 60 * 1000) },
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Incorrect PIN',
        attemptsLeft: Math.max(0, 5 - attempts),
      });
    }

    // PIN correct — reset attempts, generate tokens
    await User.findByIdAndUpdate(user._id, {
      $set: {
        'auth.pinAttempts': 0,
        'auth.pinLockedUntil': null,
        'auth.lastLogin': new Date(),
      },
    });

    // SECURITY: Use centralized token helpers to ensure consistent algorithm, secret
    // selection (including JWT_ADMIN_SECRET for admin roles), and expiry enforcement.
    const accessToken = generateToken(String(user._id), user.role || 'user');
    const refreshToken = generateRefreshToken(String(user._id));
    const crypto = require('crypto');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await User.findByIdAndUpdate(user._id, { $set: { 'auth.refreshToken': refreshTokenHash } });

    // Phase 6: Set httpOnly cookies for browser surfaces alongside JSON response
    // Access token cookie TTL must match the JWT expiry (JWT_EXPIRES_IN, default 15m).
    // JWT_EXPIRES_IN_SECONDS is the 7-day extended TTL used only for refresh tokens —
    // using it here would keep a logged-out access token alive in the cookie for 7 days.
    const pinAccessExpiry = process.env.JWT_EXPIRES_IN || '15m';
    const pinAccessTokenMaxAge = (() => {
      const match = pinAccessExpiry.match(/^(\d+)([smhd]?)$/);
      if (!match) return 15 * 60 * 1000; // fallback: 15 minutes
      const value = parseInt(match[1], 10);
      const unit = match[2] || 's';
      const multipliers: Record<string, number> = { s: 1000, m: 60 * 1000, h: 3600 * 1000, d: 86400 * 1000 };
      return value * (multipliers[unit] ?? 1000);
    })();
    res.cookie('rez_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: pinAccessTokenMaxAge,
      path: '/',
    });
    res.cookie('rez_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/user/auth/refresh-token',
    });

    return res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          phoneNumber: user.phoneNumber,
          profile: user.profile,
          role: user.role,
          isOnboarded: user.auth?.isOnboarded || false,
          wallet: user.wallet,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: getAccessTokenExpirySeconds(),
        },
      },
    });
  }),
);

// CHECK if PIN is set — rate-limited; returns a uniform response for unknown numbers
// to prevent using this endpoint as a phone-number enumeration oracle.
router.get(
  '/has-pin',
  authLimiter,
  asyncHandler(async (req, res) => {
    const MIN_RESPONSE_MS = 200;
    const start = Date.now();

    const { phoneNumber } = req.query;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    const normalizedPhone = normalizePinPhone(phoneNumber as string);
    const user = await User.findOne({ phoneNumber: normalizedPhone }).select('+auth.pinHash').lean();

    // SECURITY: If the user doesn't exist, return hasPin: false rather than 404.
    // Returning 404 for unknown numbers would let an attacker enumerate registered
    // phone numbers by calling this endpoint with arbitrary numbers.

    // SECURITY: Enforce a minimum response time so "user found" and "user not found"
    // paths take the same wall-clock time, preventing timing-based phone enumeration.
    const elapsed = Date.now() - start;
    if (elapsed < MIN_RESPONSE_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_MS - elapsed));
    }

    return res.json({
      success: true,
      hasPin: !!(user && (user.auth as any)?.pinHash),
    });
  }),
);

// ---------------------------------------------------------------------------
// Internal service-to-service route — Hotel OTA SSO token verification
// ---------------------------------------------------------------------------
// GET /api/user/auth/internal/auth/user/:id
// Used by Hotel OTA's rezIntegrationService to look up a REZ user by ID after
// decoding a REZ access token. Protected by X-Internal-Token header.
router.get(
  '/internal/auth/user/:id',
  requireInternalToken,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('phoneNumber profile.name role auth.isOnboarded').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Normalise phone → 10-digit Indian number (strip country code prefix)
    const rawPhone = (user as any).phoneNumber || '';
    const digits = rawPhone.replace(/\D/g, '');
    const phone =
      digits.length === 12 && digits.startsWith('91')
        ? digits.slice(2)
        : digits.length === 13 && digits.startsWith('091')
          ? digits.slice(3)
          : digits.slice(-10);

    return res.json({
      success: true,
      data: {
        userId: String((user as any)._id),
        phone,
        name: (user as any).profile?.name || '',
        role: (user as any).role || 'user',
        isOnboarded: (user as any).auth?.isOnboarded || false,
      },
    });
  }),
);

export default router;
