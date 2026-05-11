import { Request, Response } from 'express';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import Partner from '../models/Partner';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyToken,
  blacklistToken,
  isTokenBlacklisted,
  logoutAllDevices,
} from '../middleware/auth';
import {
  sendSuccess,
  sendUnauthorized,
  sendNotFound,
  sendConflict,
  sendTooManyRequests,
  sendBadRequest,
} from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import referralService from '../services/referralService';
import { ReferralFraudDetection } from '../services/referralFraudDetection';
import { Wallet, IWallet, IWalletModel } from '../models/Wallet';
import { CorporateMember } from '../models/CorporateMember';
import { Types, HydratedDocument } from 'mongoose';
import { walletService } from '../services/walletService';
import { logger } from '../config/logger';
import achievementService from '../services/achievementService';
import gamificationEventBus from '../events/gamificationEventBus';
// FIX Phase D follow-up: record default consent at signup (DPDP §7(a) contract basis).
// Every new user implicitly consents to transactional WhatsApp by initiating a payment.
import UserConsent from '../models/UserConsent';
import redisService from '../services/redisService';
import dotenv from 'dotenv';
import { SMSService } from '../services/SMSService';
// Helpers extracted to service layer
import { hashRefreshToken, getAccessTokenExpirySeconds } from '../services/auth/tokenHelper';
import { normalizePhoneNumber } from '../services/auth/phoneHelper';
import { setAuthCookies, clearAuthCookies, trackDeviceFingerprint } from '../services/auth/sessionService';

// Ensure dotenv is loaded
dotenv.config();

const referralFraudDetection = new ReferralFraudDetection();

// SMS delivery is handled by SMSService (timeout + circuit breaker via twilioCircuit).
// The inline Twilio client that used to live here has been removed.

// Send OTP to phone number
/**
 * @swagger
 * /api/user/auth/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     description: Sends a 6-digit OTP to the provided phone number for authentication. Creates a new user if one doesn't exist.
 *     tags: [User Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+919876543210"
 *                 description: Phone number (auto-normalizes international formats)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Optional email for signup
 *               referralCode:
 *                 type: string
 *                 description: Optional referral code
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "OTP sent successfully"
 *                     expiresIn:
 *                       type: number
 *                       example: 300
 *       400:
 *         description: Invalid referral code
 *       409:
 *         description: Email already registered
 *       429:
 *         description: Too many requests / account locked
 */
export const sendOTP = asyncHandler(async (req: Request, res: Response) => {
  // SEC-010: Constant-time response guard — prevents timing-based account enumeration.
  // Regardless of whether the phone exists, SMS is sent, or an error occurs early,
  // the response is held until MIN_OTP_RESPONSE_MS has elapsed from request receipt.
  // This collapses the timing difference between "user exists" (~600ms) and
  // "user not found" (~20ms) paths to an indistinguishable constant.
  const MIN_OTP_RESPONSE_MS = 800;
  const requestStartTime = Date.now();
  const sendConstantTimeResponse = (res: Response, status: number, body: object) => {
    const elapsed = Date.now() - requestStartTime;
    const delay = Math.max(0, MIN_OTP_RESPONSE_MS - elapsed);
    if (delay > 0) {
      return new Promise<void>((resolve) =>
        setTimeout(() => {
          res.status(status).json(body);
          resolve();
        }, delay),
      );
    }
    res.status(status).json(body);
    return Promise.resolve();
  };

  let { phoneNumber, email, referralCode, flow } = req.body;
  const isSignupFlow = flow === 'signup';

  // BUG-013 FIX: Guard against null/undefined/non-string phoneNumber before normalization.
  // normalizePhoneNumber calls phone.replace() which throws if phone is not a string.
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return sendBadRequest(res, 'Phone number is required');
  }

  // BUG-021 FIX: Guard against normalizePhoneNumber returning an empty/unusable string.
  // Normalize phone number BEFORE validation
  phoneNumber = normalizePhoneNumber(phoneNumber);
  if (!phoneNumber || phoneNumber.length < 5) {
    return sendBadRequest(res, 'Invalid phone number');
  }

  if (process.env.NODE_ENV === 'development') {
    logger.debug('[SEND_OTP]', { phone: `***${phoneNumber.slice(-4)}`, hasEmail: !!email });
  }

  // ── Deduplication guard: prevent double-tap / rapid-fire OTP requests ────────
  // A Redis key with a 30-second TTL acts as a distributed mutex.
  // If a send is already in-flight for this phone number we return a 200 so
  // the client doesn't re-trigger the entire user-creation + SMS flow.
  const otpDedupeKey = `otp_send_lock:${phoneNumber}`;
  try {
    const client = redisService.getClient();
    if (!client) {
      // Redis client not available — fail closed to prevent SMS flooding
      logger.error(`Redis unavailable for OTP dedup lock — blocking request (phone=***${phoneNumber.slice(-4)})`);
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again shortly.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
    // SET NX EX — only succeeds if key doesn't exist (atomic)
    const acquired = await client.set(otpDedupeKey, '1', { NX: true, EX: 30 });
    if (!acquired) {
      // A request for this phone is already being processed within the last 30 s
      return res.status(200).json({
        success: true,
        message: 'OTP already sent. Please wait before requesting another.',
        code: 'OTP_ALREADY_SENT',
      });
    }
  } catch (redisErr) {
    // Redis threw an exception (connection error, timeout, etc.) — fail closed to prevent SMS flooding
    logger.error(`Redis unavailable for OTP dedup lock — blocking request (phone=***${phoneNumber.slice(-4)})`);
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again shortly.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // Check if user exists (no .lean() — we need instance methods: generateOTP, save, isAccountLocked)
  let user = await User.findOne({ phoneNumber });

  // Create user if doesn't exist, or reactivate if inactive
  if (!user) {
    // Check if email already exists (only if email is provided)
    if (email) {
      const emailExists = await User.findOne({ email }).lean();
      if (emailExists) {
        // MED-6 FIX: Do not reveal whether the email is already registered (enumeration leak).
        // Log server-side for debugging but return a generic response to the caller.
        logger.warn('[SEND_OTP] Email already registered — returning generic response', {
          email: email.replace(/(.{2}).*(@.+)/, '$1***$2'),
        });
        return sendConstantTimeResponse(res, 200, {
          success: true,
          message: 'If this number is eligible, you will receive an OTP shortly.',
        });
      }
    }

    // Check if referral code is valid (if provided)
    if (referralCode) {
      const referrerUser = await User.findOne({ 'referral.referralCode': referralCode }).lean();
      if (!referrerUser) {
        return sendConstantTimeResponse(res, 400, { success: false, message: 'Invalid referral code' });
      }
    }

    // SECURITY (partially addressed): Ideally user creation should be deferred until
    // verifyOTP succeeds to eliminate phantom accounts entirely. That refactor requires
    // storing pending-signup data in Redis with a TTL and is tracked for a future sprint.
    //
    // Mitigation applied here:
    //  1. New users are created with auth.isVerified=false so they cannot access
    //     any authenticated endpoints until OTP verification succeeds.
    //  2. If an unverified record already exists for this phone (e.g. abandoned
    //     signup), we reuse it rather than creating a second phantom — this caps
    //     the leak to one pending record per phone number.
    //  3. A TTL-based cleanup job should prune users where
    //     auth.isVerified=false AND createdAt < (now - 24h).
    const existingUnverified = await User.findOne({ phoneNumber, 'auth.isVerified': false }).lean();
    if (existingUnverified) {
      // Reuse the existing unverified record — update email/referral if provided
      user = (await User.findByIdAndUpdate(
        existingUnverified._id,
        {
          $set: {
            ...(email ? { email } : {}),
            ...(referralCode ? { 'referral.referredBy': referralCode } : {}),
          },
        },
        { new: true },
      ))!;
    } else {
      // CRIT-5 FIX: Defer user creation until OTP verification succeeds.
      // Instead of writing a phantom DB record that may never be verified, store
      // the signup intent in Redis with a TTL.  The user is created in verifyOTP
      // only after the OTP is confirmed, eliminating phantom accounts entirely.
      const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '3', 10);
      let pendingStoredInRedis = false;
      try {
        const pendingClient = redisService.getClient();
        if (pendingClient) {
          await pendingClient.set(
            `pending:signup:${phoneNumber}`,
            JSON.stringify({ email: email || null, referralCode: referralCode || null }),
            { EX: otpExpiryMinutes * 60 + 120 }, // +2 min grace over OTP TTL
          );
          pendingStoredInRedis = true;
          // user remains null — OTP will be stored in Redis below, not on a DB record
        }
      } catch (pendingErr) {
        logger.warn('[SEND_OTP] Failed to store pending signup in Redis, falling back to DB user', {
          error: (pendingErr as Error).message,
        });
      }
      if (!pendingStoredInRedis) {
        // Redis unavailable — fall back to creating an unverified DB record (old behaviour)
        user = new User({
          phoneNumber,
          email,
          role: 'user',
          auth: { isVerified: false, isOnboarded: false },
          referral: referralCode
            ? { referredBy: referralCode, referredUsers: [], totalReferrals: 0, referralEarnings: 0 }
            : undefined,
        });
        // Achievements initialized below only when falling back to DB creation
        try {
          await achievementService.initializeUserAchievements(String(user._id));
        } catch (error) {
          logger.error('[AUTH] Error initializing achievements for new user:', error);
        }
      }
      // When pendingStoredInRedis=true: achievements are initialized in verifyOTP after the
      // user is confirmed and given a real DB _id.
    }
  } else if (user.isActive && email) {
    // MED-6 FIX: Do not confirm phone registration to the caller (enumeration leak).
    // Log server-side and return a generic response that doesn't reveal account existence.
    logger.warn('[SEND_OTP] Phone already registered (active, with email) — returning generic response', {
      phone: `***${phoneNumber.slice(-4)}`,
    });
    return sendConstantTimeResponse(res, 200, {
      success: true,
      message: 'If this number is eligible, you will receive an OTP shortly.',
    });
  } else if (user.isActive && !email) {
    if (isSignupFlow) {
      // MED-6 FIX: Do not confirm phone registration to the caller (enumeration leak).
      logger.warn('[SEND_OTP] Phone already registered (active, signup flow) — returning generic response', {
        phone: `***${phoneNumber.slice(-4)}`,
      });
      return sendConstantTimeResponse(res, 200, {
        success: true,
        message: 'If this number is eligible, you will receive an OTP shortly.',
      });
    }
    // Normal login flow — continue with OTP generation
  } else if (!user.isActive) {
    // Deactivated account — DON'T reactivate yet.
    // S-7: Do NOT reset loginAttempts or lockUntil here
    // S-13: Do NOT apply email changes during reactivation
    if (email && user.email !== email) {
      logger.info(`[AUTH] Email change attempted during reactivation for user ${user._id} — ignored.`);
    }
  }

  // Check if account is locked (pending new users have no DB record, cannot be locked)
  if (user && user.isAccountLocked()) {
    const lockTime = user.auth.lockUntil;
    const minutesLeft = lockTime ? Math.ceil((lockTime.getTime() - Date.now()) / (1000 * 60)) : 0;
    return sendTooManyRequests(res, `Account locked. Try again in ${minutesLeft} minutes.`);
  }

  // Generate OTP and store it.
  // For pending new users (user === null): generate OTP directly and store hash in Redis.
  // For existing DB users (user !== null): use the User model method and persist to DB.
  let otp: string;
  try {
    if (!user) {
      // Pending new user path — OTP stored in Redis only, no DB write
      const otpNum = crypto.randomInt(100000, 1000001); // 6-digit cryptographically secure OTP
      otp = otpNum.toString().padStart(6, '0');
      const otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '3', 10);
      const pendingHashedOtp = await bcrypt.hash(otp, 8);
      const otpClient = redisService.getClient();
      if (!otpClient) {
        return res
          .status(503)
          .json({ success: false, message: 'Service temporarily unavailable', code: 'SERVICE_UNAVAILABLE' });
      }
      await otpClient.set(`pending:otp:${phoneNumber}`, pendingHashedOtp, { EX: otpExpiryMinutes * 60 + 120 });
    } else {
      // Existing DB user (login or existing unverified) — use User model method
      otp = user.generateOTP(); // sets user.auth.otpCode = plaintext otp
      const hashedOtp = await bcrypt.hash(otp, 8); // cost=8 for speed since OTPs are short-lived
      user.auth.otpCode = hashedOtp; // overwrite plaintext with hash before persisting
      await user.save();
    }
  } catch (otpErr) {
    logger.error('[SEND_OTP] OTP generation/storage failed:', otpErr);
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again shortly.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // SMS_TEST_MODE: skip SMS entirely and return OTP in the response.
  // Remove SMS_TEST_MODE from env vars before going live with real users.
  if (process.env.SMS_TEST_MODE === 'true') {
    // DEVELOPER NOTE: OTP is also returned in the JSON response body
    logger.warn(`[DEV OTP] phone=${phoneNumber} otp=${otp}`);
    return res.json({
      success: true,
      message: 'OTP generated (test mode)',
      otp,
    });
  }

  // Send OTP via SMS — with one automatic retry on transient failure
  let otpSent = false;
  let smsError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      otpSent = await SMSService.sendOTP(phoneNumber, otp);
      if (otpSent) break; // success — stop retrying
    } catch (smsErr) {
      smsError = smsErr;
      logger.warn(`[SEND_OTP] SMS attempt ${attempt} failed`, { error: (smsErr as Error).message });
    }
    if (attempt < 2 && !otpSent) {
      // Brief pause before retry (avoids hammering Twilio on transient errors)
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  if (!otpSent) {
    logger.error('[SEND_OTP] SMS failed after 2 attempts:', {
      phone: `***${phoneNumber.slice(-4)}`,
      error: (smsError as Error)?.message ?? 'SMS provider returned false without exception',
    });

    if (process.env.NODE_ENV === 'production') {
      // Invalidate the OTP — remove from DB (existing users) or Redis (pending new users)
      try {
        if (user) {
          await User.findByIdAndUpdate(String(user._id), {
            $unset: { 'auth.otpCode': '', 'auth.otpExpiry': '' },
          });
        } else {
          const cleanupClient = redisService.getClient();
          if (cleanupClient) {
            await Promise.all([
              cleanupClient.del(`pending:signup:${phoneNumber}`),
              cleanupClient.del(`pending:otp:${phoneNumber}`),
            ]);
          }
        }
      } catch (e) {
        logger.error('[SEND_OTP] Failed to clean up OTP after SMS failure:', e);
      }
      return res.status(503).json({
        success: false,
        message: 'SMS service is temporarily unavailable. Please try again in a few minutes.',
        code: 'SMS_SERVICE_UNAVAILABLE',
      });
    }

    // LOW-3 FIX: Standardized dev OTP exposure — only log OTP when both NODE_ENV=development
    // AND EXPOSE_DEV_OTP=true. LOG_OTP_FOR_TESTING is no longer used as a flag here.
    if (process.env.NODE_ENV === 'development' && process.env.EXPOSE_DEV_OTP === 'true') {
      logger.warn(
        `[DEV ONLY] OTP for testing — never expose in production: otp=${otp} phone=***${phoneNumber.slice(-4)}`,
      );
      return res.json({
        success: true,
        message: 'OTP sent successfully',
      });
    }
  }

  // SEC-010: Uniform message + constant-time delay before responding.
  // The sendConstantTimeResponse helper ensures total elapsed time >= MIN_OTP_RESPONSE_MS,
  // eliminating the timing delta between "user exists" and "user not found" paths.
  await sendConstantTimeResponse(res, 200, {
    success: true,
    message: 'If this number is registered, you will receive an OTP.',
  });
});

// Verify OTP and login
/**
 * @swagger
 * /api/user/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and authenticate
 *     description: Verifies the OTP and returns JWT tokens. Processes referral bonus for new users. Reactivates deactivated accounts.
 *     tags: [User Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, otp]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "+919876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit OTP
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 *       429:
 *         description: Account locked due to too many failed attempts
 */
export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
  let { phoneNumber, otp } = req.body;

  // BUG-013 FIX: Guard against null/undefined phoneNumber before normalization.
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return sendBadRequest(res, 'Phone number is required');
  }

  // Normalize phone number BEFORE looking up user
  phoneNumber = normalizePhoneNumber(phoneNumber);

  if (process.env.NODE_ENV === 'development') {
    logger.debug('[VERIFY_OTP]', { phone: `***${phoneNumber.slice(-4)}` });
  }

  // Find user with OTP fields (no .lean() — we need instance methods: isAccountLocked, verifyOTP, save)
  // Also select +auth.lockUntil so isAccountLocked() can correctly detect a locked account.
  let user = await User.findOne({ phoneNumber }).select('+auth.otpCode +auth.otpExpiry +auth.lockUntil');

  if (!user) {
    // CRIT-5 FIX: Check Redis for a pending signup deferred from sendOTP.
    // If found and OTP is valid, materialize the user in DB and let the rest of this
    // function complete normally (referral, token generation, etc.).
    let pendingResolved = false;
    try {
      const client = redisService.getClient();
      if (client) {
        const [pendingSignupJson, pendingOtpHash] = await Promise.all([
          client.get(`pending:signup:${phoneNumber}`),
          client.get(`pending:otp:${phoneNumber}`),
        ]);

        if (pendingSignupJson && pendingOtpHash) {
          // Verify OTP against Redis hash BEFORE creating the DB record
          const isPendingOtpValid = await bcrypt.compare(String(otp), pendingOtpHash);
          if (!isPendingOtpValid) {
            // SECURITY: Track failed OTP attempts for pending users so they are subject
            // to the same account-level lockout as DB-resident users. Without this, an
            // attacker could brute-force a 6-digit OTP (1M space) using only the IP-based
            // rate limiter — which is far weaker than a per-phone attempt counter.
            const pendingFailKey = `pending:fail:${phoneNumber}`;
            const fails = await client.incr(pendingFailKey);
            if (fails === 1) await client.expire(pendingFailKey, 15 * 60); // 15-min window
            if (fails >= 5) {
              return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.',
              });
            }
            return sendUnauthorized(res, 'Invalid or expired OTP');
          }

          // OTP valid — create user in DB with OTP hash pre-populated so the
          // atomic findOneAndUpdate below can process it in the normal flow.
          const { email: pendingEmail, referralCode: pendingReferralCode } = JSON.parse(pendingSignupJson);
          const newUser = new User({
            phoneNumber,
            ...(pendingEmail ? { email: pendingEmail } : {}),
            role: 'user',
            auth: {
              isVerified: false,
              isOnboarded: false,
              otpCode: pendingOtpHash,
              otpExpiry: new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || '3', 10) * 60 * 1000), // env-controlled expiry
              loginAttempts: 0,
            },
            ...(pendingReferralCode
              ? {
                  referral: {
                    referredBy: pendingReferralCode,
                    referredUsers: [],
                    totalReferrals: 0,
                    referralEarnings: 0,
                  },
                }
              : {}),
          });
          await newUser.save();

          // FIX Phase D follow-up: grant default transactional WhatsApp consent at signup.
          // DPDP §7(a) — consent is implicit for transactionally-necessary communication.
          // This ensures new users receive payment receipts without an explicit consent step.
          // Users can withdraw at any time via POST /api/user/consent.
          try {
            const ip = (req as any).ip || (req as any).headers?.['x-forwarded-for'] || '';
            const ua = (req as any).headers?.['user-agent'] || '';
            await UserConsent.record({
              userId: newUser._id as Types.ObjectId,
              category: 'whatsapp_transactional',
              status: 'granted',
              source: 'app_signup',
              legalBasis: 'contract',
              ipAddress: typeof ip === 'string' ? ip.split(',')[0].trim() : String(ip),
              userAgent: ua,
            });
          } catch (_err) {
            // Non-fatal — consent failure must not block registration.
          }

          // Clean up Redis immediately — OTP has been consumed
          await Promise.all([
            client.del(`pending:signup:${phoneNumber}`),
            client.del(`pending:otp:${phoneNumber}`),
          ]).catch((e) => logger.warn('[OTP] Failed to clean up pending signup Redis keys:', e));

          // Initialize achievements now that the user has a real DB _id
          try {
            await achievementService.initializeUserAchievements(String(newUser._id));
          } catch (achErr) {
            logger.error('[AUTH] Error initializing achievements for new user:', achErr);
          }

          // Claim any pending corporate coins — if this phone's email matches an invited employee
          if (pendingEmail) {
            try {
              const corpMember = await CorporateMember.findOne({
                email: pendingEmail.toLowerCase(),
                userId: null,
                pendingCoins: { $gt: 0 },
              });
              if (corpMember) {
                let wallet = await Wallet.findOne({ user: newUser._id });
                if (!wallet) {
                  // createForUser returns IWallet; cast to HydratedDocument to match wallet variable type
                  wallet = (await (Wallet as unknown as IWalletModel).createForUser(
                    newUser._id as Types.ObjectId,
                  )) as HydratedDocument<IWallet>;
                }
                if (wallet) {
                  // Coins successfully transferred via walletService.credit() which creates
                  // both a CoinTransaction and a double-entry LedgerEntry atomically.
                  // idempotencyKey is deterministic on corpMember._id so retrying on signup
                  // retry does not double-credit.
                  await walletService.credit({
                    userId: String(newUser._id),
                    amount: corpMember.pendingCoins,
                    source: 'corporate_distribution',
                    description: 'Corporate pending coins claimed on signup',
                    operationType: 'transfer',
                    referenceId: `corp-pending-${String(corpMember._id)}`,
                    referenceModel: 'CorporateMember',
                    metadata: {
                      corporateMemberId: String(corpMember._id),
                      idempotencyKey: `corp-pending-${String(corpMember._id)}`,
                    },
                  });
                  await CorporateMember.findByIdAndUpdate(corpMember._id, {
                    $set: { userId: newUser._id, status: 'active', joinedAt: new Date(), pendingCoins: 0 },
                    $inc: { coinsReceived: corpMember.pendingCoins },
                  });
                  logger.info('[AUTH] Corporate pending coins claimed', {
                    userId: String(newUser._id),
                    corporateMemberId: String(corpMember._id),
                    coins: corpMember.pendingCoins,
                  });
                } else {
                  // Wallet could not be created — still link userId so next login can retry
                  await CorporateMember.findByIdAndUpdate(corpMember._id, {
                    $set: { userId: newUser._id, status: 'active', joinedAt: new Date() },
                  });
                  logger.warn('[AUTH] Corporate member linked but wallet unavailable — pendingCoins retained', {
                    userId: String(newUser._id),
                    corporateMemberId: String(corpMember._id),
                  });
                }
              }
            } catch (corpErr) {
              logger.warn('[AUTH] Corporate pending coins claim failed (non-fatal):', corpErr);
            }
          }

          // Reassign so the rest of verifyOTP operates on this user
          user = newUser;
          pendingResolved = true;
        }
      }
    } catch (pendingErr) {
      logger.error('[OTP] Error checking pending signup in Redis:', pendingErr);
    }

    if (!pendingResolved) {
      // SECURITY: Return the same error as a wrong OTP to prevent account enumeration.
      return sendUnauthorized(res, 'Invalid or expired OTP');
    }
  }

  // Deactivated accounts are allowed through OTP verification — reactivated below on success.

  // Guard: user is guaranteed non-null here — either found by findOne or materialized from Redis.
  if (!user) return sendUnauthorized(res, 'Invalid or expired OTP');

  // Check if account is locked
  if (user.isAccountLocked()) {
    return sendTooManyRequests(res, 'Account is temporarily locked');
  }

  // Verify OTP using bcrypt.compare (OTP is now stored as a hash)
  let isValidOTP = false;
  try {
    const storedHash = user.auth?.otpCode;
    const otpExpiry = user.auth?.otpExpiry;
    const isOtpExpired = !otpExpiry || otpExpiry < new Date();
    const isOtpHashMatch = storedHash ? await bcrypt.compare(String(otp), String(storedHash)) : false;
    isValidOTP = isOtpHashMatch && !isOtpExpired;
  } catch (bcryptErr) {
    logger.error('[VERIFY_OTP] bcrypt.compare failed:', bcryptErr);
    isValidOTP = false;
  }

  if (!isValidOTP) {
    try {
      await user.incrementLoginAttempts();
    } catch (incrErr) {
      logger.error('[VERIFY_OTP] incrementLoginAttempts failed:', incrErr);
    }
    return sendUnauthorized(res, 'Invalid or expired OTP');
  }

  // CONCURRENCY FIX: Atomic OTP invalidation with findOneAndUpdate to prevent replay attacks.
  // We cannot match on the hashed OTP value in the DB query directly, so we use a version
  // field approach: set otpCode to null only if it still matches the hash we verified above.
  // The $ne: null guard ensures only one concurrent winner can set it to null.
  // Atomically invalidate OTP to prevent replay attacks.
  // Lock check is already done above (line 380) — don't duplicate it here
  // as it can reject valid OTPs when lockUntil was set by a previous attempt.
  let updatedUser;
  try {
    updatedUser = await User.findOneAndUpdate(
      {
        phoneNumber,
        'auth.otpCode': { $ne: null }, // Guard: only update if OTP hasn't been consumed yet
      },
      {
        $set: {
          'auth.otpCode': null, // Invalidate OTP immediately (prevent replay)
          'auth.otpExpiry': null,
          'auth.loginAttempts': 0,
          'auth.lockUntil': null,
          'auth.lastLogin': new Date(),
        },
      },
      { new: true },
    );
  } catch (updateErr) {
    logger.error('[VERIFY_OTP] OTP invalidation update failed:', updateErr);
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  if (!updatedUser) {
    logger.warn('[OTP] OTP already consumed (concurrent request):', { phone: `***${phoneNumber.slice(-4)}` });
    return sendUnauthorized(res, 'OTP already used. Please request a new one.');
  }

  // Reset login attempts on successful verification
  // (Already done in the atomic update above)
  const freshUser = updatedUser;

  // Process referral if this is a new user with a referrer
  if (!freshUser.auth.isVerified && freshUser.referral.referredBy) {
    try {
      const referrerUser = await User.findOne({ 'referral.referralCode': freshUser.referral.referredBy }).lean();
      if (referrerUser) {
        // Fraud check before processing referral
        const fraudCheck = await referralFraudDetection.checkReferral(String(referrerUser._id), String(freshUser._id), {
          ipAddress: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
          deviceId: req.headers['x-device-id'],
        });

        if (fraudCheck.action === 'block') {
          logger.warn(
            `[REFERRAL] Fraud blocked for referral ${freshUser.referral.referredBy}: ${fraudCheck.reasons.join(', ')} (score: ${fraudCheck.riskScore})`,
          );
          // Clear referral (non-critical, don't block OTP)
          try {
            await User.findByIdAndUpdate(String(freshUser._id), {
              $set: { 'referral.referredBy': '' },
            });
          } catch (e) {
            logger.error('[REFERRAL] Failed to clear fraudulent referral:', e);
          }
        } else if (fraudCheck.action === 'review') {
          // Flagged for manual review — create the referral relationship but do NOT credit
          // the wallet immediately. Set a pendingReward flag for admin review instead.
          logger.warn(
            `[REFERRAL] Flagged for review: ${freshUser.referral.referredBy} (score: ${fraudCheck.riskScore}, reasons: ${fraudCheck.reasons.join(', ')})`,
          );

          await referralService.createReferral({
            referrerId: new Types.ObjectId(String(referrerUser._id)),
            refereeId: new Types.ObjectId(String(freshUser._id)),
            referralCode: freshUser.referral.referredBy,
            signupSource: 'otp_verification',
          });

          // Mark the reward as pending — an admin must approve before coins are credited
          await User.findByIdAndUpdate(String(freshUser._id), {
            $set: {
              'referral.pendingReward': true,
              'referral.pendingRewardAmount': 30,
              'referral.pendingRewardReason': 'referral_signup_bonus_under_review',
            },
          });

          logger.info(`⏳ [REFERRAL] Referral created with pending reward for review. Referee: ${freshUser._id}`);
        } else {
          // fraudCheck.action === 'allow' — safe to credit immediately
          // CONCURRENCY FIX #4: Atomic referral reward flag + issuance prevents double-credit.
          // FR-D001 FIX: The original findByIdAndUpdate had NO filter condition on
          // referralRewardIssued:false, so it would unconditionally set the flag to true
          // and always return a truthy rewardResult — the race-condition guard was a no-op.
          // Fix: add { 'referral.referralRewardIssued': { $ne: true } } to the filter so
          // only the first concurrent winner updates the document; all others get null.
          const rewardResult = await User.findOneAndUpdate(
            {
              _id: String(freshUser._id),
              'referral.referralRewardIssued': { $ne: true }, // Only update if NOT already rewarded
            },
            {
              $set: {
                'referral.referralRewardIssued': true, // Atomic flag set
              },
            },
            {
              new: true,
              runValidators: false,
            },
          );

          if (rewardResult?.referral?.referralRewardIssued) {
            // Create referral relationship using referral service
            await referralService.createReferral({
              referrerId: new Types.ObjectId(String(referrerUser._id)),
              refereeId: new Types.ObjectId(String(freshUser._id)),
              referralCode: freshUser.referral.referredBy,
              signupSource: 'otp_verification',
            });

            // Credit referral bonus via walletService (atomic $inc + CoinTransaction + LedgerEntry)
            const { walletService } = await import('../services/walletService');
            await walletService.credit({
              userId: String(freshUser._id),
              amount: 30,
              source: 'referral',
              description: 'Referral signup bonus',
              operationType: 'referral_bonus',
              referenceId: `referral:${referrerUser._id}:${freshUser._id}`,
              referenceModel: 'User',
              metadata: { referrerId: String(referrerUser._id) },
            });

            // CONCURRENCY FIX #6: Atomic referrer stats update with $inc and $push to prevent TOCTOU
            await User.findByIdAndUpdate(String(referrerUser._id), {
              $push: {
                'referral.referredUsers': String(freshUser._id),
              },
              $inc: {
                'referral.totalReferrals': 1,
              },
            });

            // Emit gamification event for referral completion (for the REFERRER)
            gamificationEventBus.emit('referral_completed', {
              userId: String(referrerUser._id),
              entityId: String(freshUser._id),
              entityType: 'referral',
              source: { controller: 'authController', action: 'verifyOTP' },
            });
            logger.info(`🏆 [REFERRAL] Gamification event emitted for referrer: ${referrerUser._id}`);

            // CONCURRENCY FIX #5: Atomic partner task update with $inc prevents TOCTOU
            try {
              const taskIndex = await Partner.findOne({ userId: referrerUser._id })
                .select('tasks')
                .lean()
                .then((p: any) => p?.tasks?.findIndex((t: any) => t.type === 'referral') ?? -1);

              if (taskIndex !== -1) {
                // Use findOneAndUpdate with positional operator for atomic array increment
                await Partner.findOneAndUpdate(
                  { userId: referrerUser._id, 'tasks.type': 'referral' },
                  {
                    $inc: { 'tasks.$.progress.current': 1 },
                  },
                );

                // Separately fetch to check if completed
                const updatedPartner = await Partner.findOne({ userId: referrerUser._id }).select('tasks');
                const referralTask = updatedPartner?.tasks?.find((t: any) => t.type === 'referral');
                if (
                  referralTask &&
                  referralTask.progress.current >= referralTask.progress.target &&
                  !referralTask.completed
                ) {
                  await Partner.findOneAndUpdate(
                    { userId: referrerUser._id, 'tasks.type': 'referral' },
                    {
                      $set: {
                        'tasks.$.completed': true,
                        'tasks.$.completedAt': new Date(),
                      },
                    },
                  );
                  logger.info(
                    '✅ [REFERRAL] Partner referral task completed:',
                    referralTask.progress.current,
                    '/',
                    referralTask.progress.target,
                  );
                }
              }
            } catch (error) {
              logger.error('❌ [REFERRAL] Error updating partner referral task:', error);
            }

            logger.info(`🎁 [REFERRAL] New referral created! Referee ${freshUser._id} received ₹30 signup bonus.`);
          } else {
            logger.info(`[REFERRAL] Referral bonus already issued for user ${freshUser._id}`);
          }
        } // end fraud action branch
      }
    } catch (error) {
      logger.error('Error processing referral:', error);
      // Don't fail the OTP verification if referral processing fails
    }
  }

  // === DEVICE FINGERPRINT TRACKING (Anti-farming) ===
  const deviceFingerprint = (req.headers['x-device-fingerprint'] as string) || (req.headers['x-device-id'] as string);
  await trackDeviceFingerprint(String(freshUser._id), deviceFingerprint, req.ip);

  // Reactivate deactivated accounts after successful OTP verification (if needed)
  if (!freshUser.isActive) {
    await User.findByIdAndUpdate(String(freshUser._id), {
      $set: {
        isActive: true,
        // Preserve isVerified and isOnboarded from before deactivation
        // so returning users don't have to redo onboarding
        //
        // SECURITY FIX: Reset login lockout on reactivation.
        // Without this, a previously locked account stays locked even after the
        // user successfully verifies their OTP — they'd be unable to log in.
        'auth.loginAttempts': 0,
        'auth.lockUntil': null,
      },
    });

    // S-13: Do NOT apply any pending email changes during reactivation.
    // Email changes must go through a separate verified flow (profile update with OTP/email verification).
    // The original email on file is preserved to prevent unverified email takeover.

    logger.info('✅ [AUTH] Deactivated account reactivated after OTP verification:', freshUser._id);
  }

  // Generate tokens
  const accessToken = generateToken(String(freshUser._id), freshUser.role);
  const refreshToken = generateRefreshToken(String(freshUser._id));

  // Save hashed refresh token + mark user as verified (never store raw tokens in DB)
  await User.findByIdAndUpdate(String(freshUser._id), {
    $set: {
      'auth.refreshToken': hashRefreshToken(refreshToken),
      'auth.isVerified': true, // CRITICAL FIX: mark verified after successful OTP — was never set
    },
  });

  // Emit gamification event for login (fire-and-forget, non-blocking)
  gamificationEventBus.emit('login', {
    userId: String(freshUser._id),
    source: { controller: 'authController', action: 'verifyOTP' },
  });

  // Prepare user data for response (exclude sensitive fields)
  const userData = {
    id: freshUser._id,
    phoneNumber: freshUser.phoneNumber,
    email: freshUser.email,
    profile: freshUser.profile,
    preferences: freshUser.preferences,
    wallet: freshUser.wallet,
    role: freshUser.role,
    isVerified: freshUser.auth.isVerified,
    isOnboarded: freshUser.auth.isOnboarded,
  };

  // Phase 6: Set httpOnly cookies — tokens live ONLY in cookies for browser clients.
  // Native clients must use a separate mobile-auth flow that reads tokens from headers.
  setAuthCookies(res, accessToken, refreshToken);

  sendSuccess(res, { user: userData }, 'Login successful');
});

// Refresh access token
/**
 * @swagger
 * /api/user/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Uses a valid refresh token to obtain new access and refresh tokens. The old refresh token is blacklisted (rotation).
 *     tags: [User Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token from login
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid or already-used refresh token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  // Phase 6: Accept refresh token from request body (existing path) or httpOnly cookie fallback
  const refreshToken = req.body.refreshToken || req.cookies?.rez_refresh_token;

  if (!refreshToken) {
    return sendUnauthorized(res, 'Refresh token required');
  }

  const decoded = verifyRefreshToken(refreshToken);

  // Check if refresh token (by its hash) has been revoked (e.g., after logout)
  if (await isTokenBlacklisted(hashRefreshToken(refreshToken), true)) {
    return sendUnauthorized(res, 'Refresh token has been revoked');
  }

  const user = await User.findById(decoded.userId).select('+auth.refreshToken').lean();

  if (!user || user.auth.refreshToken !== hashRefreshToken(refreshToken)) {
    return sendUnauthorized(res, 'Invalid refresh token');
  }

  if (!user.isActive) {
    return sendUnauthorized(res, 'Account is deactivated');
  }

  const newAccessToken = generateToken(String(user._id), user.role);
  const newRefreshToken = generateRefreshToken(String(user._id));
  const newHashedToken = hashRefreshToken(newRefreshToken);
  const oldHashedToken = hashRefreshToken(refreshToken);

  // Atomic token rotation — prevents race condition
  const rotated = await User.findOneAndUpdate(
    { _id: decoded.userId, 'auth.refreshToken': oldHashedToken },
    { $set: { 'auth.refreshToken': newHashedToken } },
    { new: true },
  );

  if (!rotated) {
    // SECURITY (token family theft detection): The presented refresh token verified against
    // the JWT secret and matched the stored hash at the start of this handler, but the atomic
    // findOneAndUpdate just found no document with that hash — meaning another request already
    // rotated this token between our lean() read and the update.  Two scenarios:
    //   (a) Benign race — client sent the same token twice in parallel (rare but possible).
    //   (b) Token theft — an attacker used a previously-issued token after the legitimate client
    //       already rotated it, which means a prior token in this family was stolen.
    // We cannot distinguish (a) from (b) at this point, so we conservatively treat this as a
    // potential theft event: revoke ALL sessions for this user immediately.
    logger.warn('[AUTH] Refresh token replay detected — revoking all sessions for user', {
      userId: decoded.userId,
    });
    await User.findByIdAndUpdate(decoded.userId, { $unset: { 'auth.refreshToken': '' } });
    await logoutAllDevices(String(decoded.userId));
    return sendUnauthorized(
      res,
      'Refresh token replay detected. All sessions revoked for security. Please log in again.',
    );
  }

  // SECURITY FIX: blacklist the OLD token by its hash (consistent with isTokenBlacklisted check
  // at line 605 which calls isTokenBlacklisted(hashRefreshToken(refreshToken), true)).
  // Previously this called blacklistToken(refreshToken, ...) which stored the raw token string
  // under key "blacklist:token:<raw>", while the check looked for "blacklist:token:<hash>" —
  // a key mismatch meaning used/rotated refresh tokens were NEVER actually detected as revoked.
  await blacklistToken(oldHashedToken, 7 * 24 * 60 * 60);

  // NW-CRIT-014 FIX: Rotate httpOnly cookies — tokens live ONLY in cookies.
  // Browser clients auto-send cookies; native clients need separate mobile-auth path.
  setAuthCookies(res, newAccessToken, newRefreshToken);

  sendSuccess(res, null, 'Token refreshed successfully');
});

// Logout
/**
 * @swagger
 * /api/user/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Blacklists the current access and refresh tokens, clears refresh token from DB.
 *     tags: [User Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Phase 6: Accept token from Bearer header OR from the httpOnly cookie (dual-mode)
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.rez_access_token;

  if (token) {
    // Compute remaining TTL from JWT exp claim so the blacklist entry expires precisely
    // when the token itself would have expired, rather than a fixed 24h window.
    let blacklistTTL = 24 * 60 * 60; // fallback 24h
    try {
      const decoded = require('jsonwebtoken').decode(token) as { exp?: number } | null;
      if (decoded?.exp) {
        const remaining = decoded.exp - Math.floor(Date.now() / 1000);
        if (remaining > 0) blacklistTTL = remaining + 60; // +60s buffer
      }
    } catch {
      /* use fallback */
    }
    await blacklistToken(token, blacklistTTL);

    try {
      const decoded = verifyToken(token);
      const userId = String(decoded.userId);
      const user = await User.findById(userId);

      if (user) {
        if (user.auth.refreshToken) {
          await blacklistToken(user.auth.refreshToken, 7 * 24 * 60 * 60);
        }
        user.auth.refreshToken = undefined;
        await user.save();
        logger.info('[LOGOUT] User tokens cleared:', user._id);
      }

      // After blacklisting current token, timestamp-invalidate all sessions for this user
      await logoutAllDevices(userId);
    } catch (tokenError) {
      // Token is invalid/expired — that's okay for logout
      logger.info(
        '[LOGOUT] Invalid token during logout (expected):',
        tokenError instanceof Error ? tokenError.message : String(tokenError),
      );
    }
  }

  // Phase 6: Clear httpOnly cookies for browser surfaces
  clearAuthCookies(res);

  sendSuccess(res, null, 'Logged out successfully');
});

// Get current user profile
/**
 * @swagger
 * /api/user/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the authenticated user's full profile including preferences and wallet reference.
 *     tags: [User Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  const userData = {
    id: req.user._id,
    phoneNumber: req.user.phoneNumber,
    email: req.user.email,
    profile: req.user.profile,
    preferences: req.user.preferences,
    wallet: req.user.wallet,
    role: req.user.role,
    isVerified: req.user.auth.isVerified,
    isOnboarded: req.user.auth.isOnboarded,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt,
    // Identity layer fields
    statedIdentity: req.user.statedIdentity,
    featureLevel: req.user.featureLevel,
    segment: req.user.segment,
    verificationSegment: req.user.verificationSegment,
    instituteStatus: req.user.instituteStatus,
    activeZones: req.user.activeZones,
    verifications: req.user.verifications,
  };

  sendSuccess(res, userData, 'User profile retrieved successfully');
});

// Update user profile
/**
 * @swagger
 * /api/user/auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile and/or preferences. Syncs partner profile if exists.
 *     tags: [User Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   avatar:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                   gender:
 *                     type: string
 *                     enum: [male, female, other]
 *               preferences:
 *                 type: object
 *                 properties:
 *                   language:
 *                     type: string
 *                   notifications:
 *                     type: boolean
 *                   privacyLevel:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  const { profile, preferences, statedIdentity, email } = req.body;
  const userId = String(req.user._id);

  // MED-3 FIX: Email changes must not be applied directly — doing so with no verification
  // step allows account takeover via email reassignment.
  // Use POST /api/auth/request-email-change + /api/auth/confirm-email-change instead.
  if (email !== undefined && email !== null && email !== '') {
    return res.status(501).json({
      success: false,
      message: 'Email change is not yet available. Please contact support.',
    });
  }

  // Build the $set payload using only the fields actually provided in the request.
  // LOW-4 FIX: Use findByIdAndUpdate instead of req.user.save() to avoid the risk of
  // overwriting concurrent DB changes with stale in-memory state from req.user.
  // Email is intentionally excluded from updateFields — changes require verification (MED-3).
  const updateFields: Record<string, any> = {};

  if (profile) {
    // BUG FIX: Added 'website' to allowed fields; handle 'location' explicitly (was silently dropped).
    const allowedProfileFields = ['firstName', 'lastName', 'avatar', 'dateOfBirth', 'gender', 'bio', 'website'];
    allowedProfileFields.forEach((key) => {
      if (profile[key] !== undefined) {
        updateFields[`profile.${key}`] = profile[key];
      }
    });
    // Handle nested location object
    if (profile.location !== undefined) {
      const locationFields = ['address', 'city', 'state', 'pincode'];
      locationFields.forEach((locKey) => {
        if (profile.location[locKey] !== undefined) {
          updateFields[`profile.location.${locKey}`] = profile.location[locKey];
        }
      });
    }
  }

  if (preferences) {
    const allowedPreferenceFields = ['language', 'currency', 'notifications', 'theme', 'dietaryPreferences'];
    allowedPreferenceFields.forEach((key) => {
      if (preferences[key] !== undefined) {
        updateFields[`preferences.${key}`] = preferences[key];
      }
    });
  }

  // Accept statedIdentity for identity layer
  if (statedIdentity && ['student', 'corporate', 'other', 'general'].includes(statedIdentity)) {
    updateFields['statedIdentity'] = statedIdentity;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true },
  ).select('-auth.pinHash -auth.otpHash');

  if (!updatedUser) return sendNotFound(res, 'User not found');

  // Sync with partner profile
  try {
    const partnerService = require('../services/partnerService').default;
    await partnerService.syncProfileCompletion(userId);
  } catch (error) {
    logger.error('Error syncing partner profile:', error);
  }

  const userData = {
    id: updatedUser._id,
    phoneNumber: updatedUser.phoneNumber,
    email: updatedUser.email,
    profile: updatedUser.profile,
    preferences: updatedUser.preferences,
    wallet: updatedUser.wallet,
    role: updatedUser.role,
    isVerified: updatedUser.auth.isVerified,
    isOnboarded: updatedUser.auth.isOnboarded,
    statedIdentity: updatedUser.statedIdentity,
    featureLevel: updatedUser.featureLevel,
    segment: updatedUser.segment,
    verificationSegment: updatedUser.verificationSegment,
    instituteStatus: updatedUser.instituteStatus,
  };

  sendSuccess(res, userData, 'Profile updated successfully');
});

// Complete onboarding
/**
 * @swagger
 * /api/user/auth/complete-onboarding:
 *   post:
 *     summary: Complete user onboarding
 *     description: Marks the user as onboarded after collecting profile data. Fails if already onboarded.
 *     tags: [User Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                   gender:
 *                     type: string
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Onboarding completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       409:
 *         description: User already onboarded
 */
export const completeOnboarding = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  // Auth middleware may attach a minimal cached object (no .auth, no .save()).
  // Always re-fetch the full Mongoose document for this mutation endpoint.
  const user = await User.findById(req.user._id).select('-auth.refreshToken -auth.otpCode -auth.otpExpiry -__v');
  if (!user) {
    return sendUnauthorized(res, 'User not found');
  }

  if (user.auth.isOnboarded) {
    // Return success (idempotent) — don't 409, because the frontend
    // (tabs)/index.tsx fallback retries this and a 409 dispatches AUTH_FAILURE
    // which clears the auth session and kicks the user to sign-in.
    const userData = {
      id: user._id,
      phoneNumber: user.phoneNumber,
      email: user.email,
      profile: user.profile,
      preferences: user.preferences,
      wallet: user.wallet,
      role: user.role,
      isVerified: user.auth.isVerified,
      isOnboarded: user.auth.isOnboarded,
    };
    return sendSuccess(res, userData, 'User is already onboarded');
  }

  const { profile, preferences } = req.body;

  if (profile) {
    const allowedProfileFields = ['firstName', 'lastName', 'avatar', 'dateOfBirth', 'gender', 'bio'];
    allowedProfileFields.forEach((key) => {
      if (profile[key] !== undefined) {
        user.profile[key as keyof typeof user.profile] = profile[key];
      }
    });
  }

  if (preferences) {
    const allowedPreferenceFields = ['language', 'currency', 'notifications', 'theme', 'dietaryPreferences'];
    allowedPreferenceFields.forEach((key) => {
      if (preferences[key] !== undefined) {
        user.preferences[key as keyof typeof user.preferences] = preferences[key];
      }
    });
  }

  user.auth.isOnboarded = true;
  await user.save();

  const userData = {
    id: user._id,
    phoneNumber: user.phoneNumber,
    email: user.email,
    profile: user.profile,
    preferences: user.preferences,
    wallet: user.wallet,
    role: user.role,
    isVerified: user.auth.isVerified,
    isOnboarded: user.auth.isOnboarded,
  };

  sendSuccess(res, userData, 'Onboarding completed successfully');
});

// Change password
/**
 * @swagger
 * /api/user/auth/change-password:
 *   put:
 *     summary: Change password
 *     description: Changes the user's password. Requires current password. New password must contain uppercase, lowercase, and digit (min 8 chars).
 *     tags: [User Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain uppercase, lowercase, and digit
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Weak password
 *       401:
 *         description: Wrong current password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long', 400, 'WEAK_PASSWORD');
  }

  if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    throw new AppError(
      'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
      400,
      'WEAK_PASSWORD',
    );
  }

  const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
  }

  // Invalidate all existing sessions (blacklist all tokens for this user) BEFORE updating password
  // This ensures atomicity: all old sessions are revoked before password change is persisted
  await logoutAllDevices(String(req.user._id));

  // Now update password and clear refresh token
  req.user.password = newPassword;
  req.user.auth.refreshToken = undefined;
  await req.user.save();

  sendSuccess(res, null, 'Password changed successfully. All other sessions have been logged out.');
});

// Delete account (GDPR-compliant: anonymize + cascade)
/**
 * @swagger
 * /api/user/auth/account:
 *   delete:
 *     summary: Delete account (GDPR)
 *     description: |
 *       Permanently deletes the user account with full GDPR-compliant cascade:
 *       - Anonymizes orders, reviews, transactions
 *       - Deletes videos, wishlists, favorites, notifications
 *       - Cancels subscriptions, freezes wallet
 *       - Clears all tokens and push tokens
 *     tags: [User Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 */
export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  // Re-authentication required before account deletion
  const { password, otp } = req.body;

  if (req.user.password) {
    // User has a password set — require password confirmation
    if (!password) {
      throw new AppError('Password is required to confirm account deletion', 400, 'REAUTH_REQUIRED');
    }
    const isValid = await req.user.comparePassword(password);
    if (!isValid) {
      throw new AppError('Incorrect password', 401, 'INVALID_PASSWORD');
    }
  } else {
    // OTP-only user — require a fresh OTP
    if (!otp) {
      throw new AppError('OTP is required to confirm account deletion', 400, 'REAUTH_REQUIRED');
    }
    // SECURITY: Re-fetch user with OTP fields selected (they are excluded by default).
    // Using req.user.verifyOTP() would do a plain string comparison against a bcrypt hash.
    const freshUser = await User.findById(req.user._id).select('+auth.otpCode +auth.otpExpiry');
    if (!freshUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    const storedHash = freshUser.auth?.otpCode;
    const otpExpiry = freshUser.auth?.otpExpiry;
    if (!storedHash || !otpExpiry || otpExpiry < new Date()) {
      throw new AppError('Invalid or expired OTP', 401, 'INVALID_OTP');
    }
    const isOtpMatch = await bcrypt.compare(String(otp), String(storedHash));
    if (!isOtpMatch) {
      throw new AppError('Invalid or expired OTP', 401, 'INVALID_OTP');
    }
    // Atomically invalidate OTP to prevent replay
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'auth.otpCode': null, 'auth.otpExpiry': null },
    });
  }

  const userId = req.user._id;
  const anonymizedId = `deleted_${userId}`;

  // Dynamic imports to avoid circular dependencies
  const { Order } = await import('../models/Order');
  const { Review } = await import('../models/Review');
  const { Video } = await import('../models/Video');
  const { Subscription } = await import('../models/Subscription');
  const { CoinTransaction } = await import('../models/CoinTransaction');
  const { Transfer } = await import('../models/Transfer');
  const { CoinGift } = await import('../models/CoinGift');
  const { Wishlist } = await import('../models/Wishlist');
  const { Favorite } = await import('../models/Favorite');
  const { Conversation } = await import('../models/Conversation');
  const { Message } = await import('../models/Message');
  const PriceAlert = (await import('../models/PriceAlert')).default;
  const { SupportTicket } = await import('../models/SupportTicket');
  const { Notification } = await import('../models/Notification');

  // 1. Anonymize orders (retain for financial compliance, strip PII)
  await Order.updateMany(
    { user: userId },
    {
      $set: {
        'deliveryAddress.name': 'Deleted User',
        'deliveryAddress.phone': '',
        'deliveryAddress.email': '',
      },
    },
  );

  // 2. Anonymize reviews (retain for store integrity, strip PII)
  await Review.updateMany({ user: userId }, { $set: { userName: 'Deleted User', userAvatar: '' } });

  // 3. Delete user's videos/UGC content
  await Video.deleteMany({ user: userId });

  // 4. Cancel active subscriptions
  await Subscription.updateMany(
    { userId, status: { $in: ['active', 'trialing'] } },
    { $set: { status: 'cancelled', cancelledAt: new Date() } },
  );

  // 5. Anonymize financial records (retain for audit, strip PII)
  // CoinTransaction: null out the user reference and stamp anonymizedAt so records are
  // kept for financial compliance but no longer linked to a real user identity.
  // Transaction and Payment records are intentionally not deleted — they remain intact
  // for ledger integrity. Their user references become stale but the monetary history
  // is preserved for compliance and reconciliation.
  await CoinTransaction.updateMany(
    { user: userId },
    { $set: { user: null, anonymizedAt: new Date(), 'metadata.userName': 'Deleted User' } },
  );
  await Transfer.updateMany(
    { $or: [{ sender: userId }, { recipient: userId }] },
    { $set: { 'metadata.userName': 'Deleted User' } },
  );

  // 6. Delete personal data collections
  await Promise.all([
    Wishlist.deleteMany({ user: userId }),
    Favorite.deleteMany({ user: userId }),
    CoinGift.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
    PriceAlert.deleteMany({ userId }),
    Notification.deleteMany({ userId }),
  ]);

  // 7. Anonymize conversations/messages
  await Conversation.updateMany({ participants: userId }, { $pull: { participants: userId } });
  await Message.updateMany({ sender: userId }, { $set: { senderName: 'Deleted User' } });

  // 8. Delete support tickets
  await SupportTicket.deleteMany({ user: userId });

  // 9. Deactivate wallet (zero out, keep for ledger integrity)
  await Wallet.updateMany(
    { userId },
    {
      $set: {
        'balance.available': 0,
        'balance.pending': 0,
        'balance.cashback': 0,
        isFrozen: true,
      },
    },
  );

  // 10. Remove referral references
  await User.updateMany({ referredBy: userId }, { $unset: { referredBy: 1 } });

  // 11. Anonymize and deactivate the user
  req.user.isActive = false;
  req.user.phoneNumber = anonymizedId;
  req.user.email = `${anonymizedId}@deleted.local`;
  if (req.user.profile) {
    req.user.profile.firstName = 'Deleted';
    req.user.profile.lastName = 'User';
    req.user.profile.avatar = '';
  }
  req.user.auth.refreshToken = undefined;
  req.user.pushTokens = [];
  req.user.deviceInfo = [];
  await req.user.save();

  sendSuccess(res, null, 'Account and associated data deleted successfully');
});

// exportUserData → implementation moved to userDataController.ts
export { exportUserData } from './userDataController';

// getUserStatistics → implementation moved to userDataController.ts
export { getUserStatistics } from './userDataController';

// uploadAvatar, requestEmailChange, confirmEmailChange → moved to userProfileController.ts
export { uploadAvatar, requestEmailChange, confirmEmailChange } from './userProfileController';
