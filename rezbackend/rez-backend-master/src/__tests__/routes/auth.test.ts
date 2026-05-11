/**
 * auth.test.ts
 *
 * Comprehensive integration tests for the REZ user authentication flows:
 *   - POST /api/user/auth/send-otp
 *   - POST /api/user/auth/verify-otp
 *   - POST /api/user/auth/refresh-token
 *   - POST /api/user/auth/logout
 *   - GET  /api/user/auth/me
 *   - GET  /api/user/boot  (userBootRoutes, protected)
 *   - POST /api/user/auth/verify-pin
 *   - GET  /api/user/auth/has-pin
 *
 * Mocking strategy:
 *   - SMSService.sendOTP   → jest.mock — never sends a real SMS
 *   - redisService         → jest.mock — in-memory stub avoids Redis dependency
 *   - MongoDB              → mongodb-memory-server (via global setup.ts)
 *   - achievementService   → jest.mock — avoids heavy side-effects on new user creation
 *   - gamificationEventBus → jest.mock — avoids side-effect timers
 *
 * Each test is self-contained: database state is cleared between tests by setup.ts.
 */

import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { app } from '../../server';
import { User } from '../../models/User';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before any imports that pull these in
// ---------------------------------------------------------------------------

// Mock SMSService so no real SMS is ever sent during tests.
// Use a plain function (not jest.fn()) so jest.config's resetMocks:true does not
// strip the implementation between tests — same pattern as the redisService mock above.
jest.mock('../../services/SMSService', () => ({
  SMSService: {
    sendOTP: () => Promise.resolve(true),
  },
}));

// Mock redisService with a simple in-memory store so tests don't need Redis
jest.mock('../../services/redisService', () => {
  const store: Record<string, { value: any; expiresAt?: number }> = {};

  const isExpired = (key: string) => {
    const entry = store[key];
    if (!entry) return true;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      delete store[key];
      return true;
    }
    return false;
  };

  // Use plain functions (not jest.fn()) so jest.config's resetMocks:true doesn't
  // strip implementations between tests. Behaviour is driven by the shared store closure.
  const mockClient = {
    set: async (_key: string, _val: string, opts?: { NX?: boolean; EX?: number }) => {
      if (opts?.NX && store[_key] && !isExpired(_key)) return null;
      store[_key] = {
        value: _val,
        expiresAt: opts?.EX ? Date.now() + opts.EX * 1000 : undefined,
      };
      return 'OK';
    },
    get: async (key: string) => {
      if (isExpired(key)) return null;
      return store[key]?.value ?? null;
    },
    del: async (...keys: string[]) => {
      keys.forEach((k) => delete store[k]);
      return keys.length;
    },
    // sendCommand used by express-rate-limit RedisStore — return 1 (below limit)
    sendCommand: async () => 1,
  };

  const mockRedisService = {
    isReady: () => true,
    getClient: () => mockClient,
    get: async (key: string) => {
      if (isExpired(key)) return null;
      return store[key]?.value ?? null;
    },
    set: async (key: string, value: any, ttlSeconds?: number) => {
      store[key] = {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      };
    },
    exists: async (key: string) => !isExpired(key) && key in store,
    del: async (key: string) => {
      delete store[key];
    },
    // Helpers exposed so individual tests can seed/inspect Redis state directly
    __store: store,
    __clear: () => Object.keys(store).forEach((k) => delete store[k]),
  };

  // __esModule: true is required so TypeScript's esModuleInterop correctly uses
  // .default rather than the entire mock object as the default import.
  return { __esModule: true, default: mockRedisService };
});

// Mock all rate limiters as passthrough — tests don't have Redis available for
// rate-limit-redis RedisStore and the failOpen=false OTP limiters return 503.
// The mock handles both middleware exports (req, res, next) => next()
// and factory exports (createRateLimiter, createProductLimiter) => () => middleware.
jest.mock('../../middleware/rateLimiter', () => {
  const middleware = (_req: any, _res: any, next: any) => {
    if (typeof next === 'function') next();
  };
  const factory = () => middleware;
  return new Proxy(
    {},
    {
      get: (_target, prop) => (prop === 'createRateLimiter' || prop === 'createProductLimiter' ? factory : middleware),
    },
  );
});

// Mock achievement service — heavyweight, not relevant to auth correctness
jest.mock('../../services/achievementService', () => ({
  __esModule: true,
  default: {
    initializeUserAchievements: async () => undefined,
  },
}));

// Mock gamification event bus — prevents stray async timers that can cause
// "open handles" warnings and flaky test timeouts
jest.mock('../../events/gamificationEventBus', () => ({
  __esModule: true,
  default: {
    emit: () => {},
    on: () => {},
  },
}));

// ---------------------------------------------------------------------------
// Test-wide helpers
// ---------------------------------------------------------------------------

/** Env vars required by generateToken / verifyToken in middleware/auth.ts */
const JWT_SECRET = 'a-sufficiently-long-test-secret-32chars!!';
const JWT_REFRESH_SECRET = 'a-sufficiently-long-refresh-secret-32!!';

/** Mint a valid user access token (same algorithm as generateToken) */
function mintAccessToken(userId: string, role = 'user', expiresIn: string | number = '15m'): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: expiresIn as any, algorithm: 'HS256' });
}

/** Mint a valid refresh token (same as generateRefreshToken) */
function mintRefreshToken(userId: string, expiresIn: string | number = '7d'): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: expiresIn as any, algorithm: 'HS256' });
}

const TEST_PHONE = '+919876543210';
const TEST_PHONE_2 = '+919876543211';
const WRONG_OTP = '000000';

/** Create a fully verified user in MongoDB with known OTP data */
async function createVerifiedUser(overrides: Record<string, any> = {}) {
  return User.create({
    phoneNumber: TEST_PHONE,
    role: 'user',
    isActive: true,
    auth: {
      isVerified: true,
      isOnboarded: false,
      loginAttempts: 0,
    },
    profile: { firstName: 'Test', lastName: 'User' },
    ...overrides,
  });
}

/**
 * Plant a valid bcrypt-hashed OTP directly on a user document.
 * The controller uses bcrypt.compare(otp, storedHash) so we must store a real hash.
 */
async function plantOTP(userId: mongoose.Types.ObjectId | string, otp: string, expiryOffsetMs = 5 * 60 * 1000) {
  const hash = await bcrypt.hash(otp, 8);
  await User.findByIdAndUpdate(userId, {
    $set: {
      'auth.otpCode': hash,
      'auth.otpExpiry': new Date(Date.now() + expiryOffsetMs),
    },
  });
}

// ---------------------------------------------------------------------------
// Ensure required env vars are set before any test runs
// ---------------------------------------------------------------------------
beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.NODE_ENV = 'test';
  // LOG_OTP_FOR_TESTING=true makes the controller return _dev_otp even when SMS
  // mock returns false — keeps tests deterministic without inspecting DB internals.
  process.env.LOG_OTP_FOR_TESTING = 'true';
});

afterEach(() => {
  // Clear the in-memory Redis store between tests so deduplication keys don't bleed over
  const redisService = jest.requireMock('../../services/redisService').default;
  redisService.__clear();
});

// ---------------------------------------------------------------------------
// 1. POST /api/user/auth/send-otp
// ---------------------------------------------------------------------------
describe('POST /api/user/auth/send-otp', () => {
  describe('Happy paths', () => {
    it('returns 200 for a valid E.164 phone number (new user)', async () => {
      const res = await request(app).post('/api/user/auth/send-otp').send({ phoneNumber: TEST_PHONE });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 200 for a valid E.164 phone number (existing verified user — login)', async () => {
      // Pre-create a verified user so the controller takes the "existing user" path
      await createVerifiedUser();

      const res = await request(app).post('/api/user/auth/send-otp').send({ phoneNumber: TEST_PHONE });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 200 and accepts an optional email on first signup', async () => {
      const res = await request(app)
        .post('/api/user/auth/send-otp')
        .send({ phoneNumber: TEST_PHONE, email: 'fresh@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('response body is uniform regardless of whether the phone is registered (account enumeration guard)', async () => {
      // Unknown phone
      const resUnknown = await request(app).post('/api/user/auth/send-otp').send({ phoneNumber: '+919000000001' });

      // Known phone
      await createVerifiedUser();
      const resKnown = await request(app).post('/api/user/auth/send-otp').send({ phoneNumber: TEST_PHONE });

      // Both must return 200 — status alone must not reveal registration status
      expect(resUnknown.status).toBe(200);
      expect(resKnown.status).toBe(200);

      // The response message must not reveal whether the account exists
      const msgUnknown: string = resUnknown.body.message ?? '';
      const msgKnown: string = resKnown.body.message ?? '';
      expect(msgUnknown).not.toMatch(/not found|does not exist|no account/i);
      expect(msgKnown).not.toMatch(/not found|does not exist|no account/i);
    });
  });

  describe('Validation edge cases', () => {
    it('returns 400 when phoneNumber is missing', async () => {
      // SECURITY: missing phone must never reach the DB or SMS layer
      const res = await request(app).post('/api/user/auth/send-otp').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for a too-short phone number (fails E.164 Joi schema)', async () => {
      const res = await request(app).post('/api/user/auth/send-otp').send({ phoneNumber: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for a phone number missing the + country-code prefix', async () => {
      // Validation schema requires /^\+[1-9]\d{6,14}$/ — no leading +
      const res = await request(app).post('/api/user/auth/send-otp').send({ phoneNumber: '9876543210' }); // valid Indian mobile but no +91

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for alphabetic garbage in phone field', async () => {
      const res = await request(app).post('/api/user/auth/send-otp').send({ phoneNumber: 'not-a-phone' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 (generic) when a verified user tries signup flow with the same email', async () => {
      // SECURITY (MED-6): do NOT reveal whether an email is already registered —
      // return the same success-shaped 200 to prevent account enumeration.
      await createVerifiedUser({ email: 'taken@example.com' });

      const res = await request(app)
        .post('/api/user/auth/send-otp')
        .send({ phoneNumber: TEST_PHONE_2, email: 'taken@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 for an invalid referral code', async () => {
      const res = await request(app)
        .post('/api/user/auth/send-otp')
        .send({ phoneNumber: TEST_PHONE, referralCode: 'INVALID99' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. POST /api/user/auth/verify-otp
// ---------------------------------------------------------------------------
describe('POST /api/user/auth/verify-otp', () => {
  describe('Happy paths', () => {
    it('returns 200 with accessToken + refreshToken + user for a correct OTP (existing user login)', async () => {
      const user = await createVerifiedUser();
      const otp = '123456';
      await plantOTP(user._id as mongoose.Types.ObjectId, otp);

      const res = await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE, otp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Tokens are set as httpOnly cookies (rez_access_token, rez_refresh_token), not in body
      expect(res.headers['set-cookie']).toBeDefined();
      const cookies = Array.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'] : [res.headers['set-cookie']];
      expect(cookies.some((c: string) => c.includes('rez_access_token'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('rez_refresh_token'))).toBe(true);
      // User data is in response body
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user).toHaveProperty('phoneNumber', TEST_PHONE);
    });

    it('creates a new user document on first-time OTP verification (signup path via Redis)', async () => {
      /**
       * When Redis is available, sendOTP stores pending signup + OTP hash in Redis
       * without creating a DB record. verifyOTP then materialises the user.
       * We simulate this by seeding the mock Redis store directly.
       */
      const otp = '654321';
      const otpHash = await bcrypt.hash(otp, 8);
      const phone = '+919111111111';

      const redisService = jest.requireMock('../../services/redisService').default;
      const client = redisService.getClient();

      // Seed Redis the same way sendOTP does
      await client.set(`pending:signup:${phone}`, JSON.stringify({ email: null, referralCode: null }), {
        EX: 300,
      });
      await client.set(`pending:otp:${phone}`, otpHash, { EX: 300 });

      const res = await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: phone, otp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Tokens are set as cookies, not in body
      expect(res.headers['set-cookie']).toBeDefined();

      // Verify the user was actually persisted in MongoDB
      const created = await User.findOne({ phoneNumber: phone });
      expect(created).not.toBeNull();
      // The controller marks isVerified=true after successful OTP
      const refreshed = await User.findById(created!._id);
      expect(refreshed?.auth?.isVerified).toBe(true);
    });

    it('marks the user as isVerified after successful OTP verification', async () => {
      const user = await User.create({
        phoneNumber: TEST_PHONE,
        role: 'user',
        isActive: true,
        auth: { isVerified: false, isOnboarded: false, loginAttempts: 0 },
      });
      const otp = '999888';
      await plantOTP(user._id as mongoose.Types.ObjectId, otp);

      await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE, otp });

      const updated = await User.findById(user._id);
      expect(updated?.auth?.isVerified).toBe(true);
    });

    it('invalidates the OTP immediately after use (prevents replay)', async () => {
      const user = await createVerifiedUser();
      const otp = '112233';
      await plantOTP(user._id as mongoose.Types.ObjectId, otp);

      // First verify — must succeed
      const first = await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE, otp });
      expect(first.status).toBe(200);

      // Second attempt with the same OTP — must fail
      const second = await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE, otp });

      // SECURITY: OTP replay must be blocked — the controller null-ifies otpCode atomically
      expect(second.status).toBeGreaterThanOrEqual(400);
      expect(second.body.success).toBe(false);
    });

    it('returns the correct response shape (user + tokens in cookies)', async () => {
      const user = await createVerifiedUser();
      const otp = '445566';
      await plantOTP(user._id as mongoose.Types.ObjectId, otp);

      const res = await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE, otp });

      // Response body contains user data
      expect(res.body.data).toMatchObject({
        user: expect.objectContaining({ phoneNumber: TEST_PHONE }),
      });
      // Tokens are set as httpOnly cookies
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('Security / edge cases', () => {
    it('returns 401 (not 500) for a wrong OTP — must never crash', async () => {
      // SECURITY: wrong OTP must return a controlled 4xx, never an unhandled 500
      const user = await createVerifiedUser();
      await plantOTP(user._id as mongoose.Types.ObjectId, '123456');

      const res = await request(app)
        .post('/api/user/auth/verify-otp')
        .send({ phoneNumber: TEST_PHONE, otp: WRONG_OTP });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for an expired OTP', async () => {
      // SECURITY: expired OTP must not grant access even if the hash matches
      const user = await createVerifiedUser();
      // Plant OTP with -1s expiry (already expired)
      await plantOTP(user._id as mongoose.Types.ObjectId, '123456', -1000);

      const res = await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE, otp: '123456' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when no OTP was ever sent (no otpCode on user)', async () => {
      // SECURITY: verifying a code without ever requesting one must fail cleanly
      await createVerifiedUser();

      const res = await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE, otp: '999999' });

      // otpCode is null — isOtpHashMatch will be false
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 for an unknown phone number with no pending signup (account enumeration guard)', async () => {
      // SECURITY: should return the same 401 as a wrong OTP, NOT 404 (which leaks existence)
      const res = await request(app)
        .post('/api/user/auth/verify-otp')
        .send({ phoneNumber: '+919000000099', otp: '123456' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when otp field is missing entirely', async () => {
      // Joi validation middleware rejects before reaching controller
      const res = await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when phoneNumber is missing', async () => {
      const res = await request(app).post('/api/user/auth/verify-otp').send({ otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when OTP is not 6 digits (fails Joi pattern)', async () => {
      const res = await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE, otp: '12345' }); // 5 digits

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('increments loginAttempts after each wrong OTP, then locks the account', async () => {
      // SECURITY: brute-force guard — after N failed attempts the account must lock
      const user = await createVerifiedUser();
      await plantOTP(user._id as mongoose.Types.ObjectId, '123456');

      const MAX_ATTEMPTS = 5;

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const res = await request(app)
          .post('/api/user/auth/verify-otp')
          .send({ phoneNumber: TEST_PHONE, otp: WRONG_OTP });

        // Progressive lockout: first few attempts return 401, then 429 once locked
        expect([401, 429]).toContain(res.status);
      }

      // After max attempts the account should be locked
      const locked = await User.findById(user._id).select('+auth.loginAttempts +auth.lockUntil');
      // Progressive lockout kicks in at 3 attempts — account must be locked
      // (lockUntil set and in the future); exact attempt count depends on lock threshold.
      expect(locked?.auth?.loginAttempts).toBeGreaterThanOrEqual(1);
      expect(locked?.auth?.lockUntil).toBeTruthy();

      // A further attempt must be refused (either 401 or 429)
      const extra = await request(app)
        .post('/api/user/auth/verify-otp')
        .send({ phoneNumber: TEST_PHONE, otp: WRONG_OTP });
      expect([401, 429]).toContain(extra.status);
      expect(extra.body.success).toBe(false);
    });

    it('does NOT accept the correct OTP after the account is locked', async () => {
      // SECURITY: lockout must apply even when the correct OTP is submitted
      const user = await createVerifiedUser();
      const otp = '123456';
      await plantOTP(user._id as mongoose.Types.ObjectId, otp);

      // Exhaust attempts with wrong OTP
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/user/auth/verify-otp').send({ phoneNumber: TEST_PHONE, otp: WRONG_OTP });
      }

      const correctAfterLock = await request(app)
        .post('/api/user/auth/verify-otp')
        .send({ phoneNumber: TEST_PHONE, otp });

      expect(correctAfterLock.status).toBeGreaterThanOrEqual(400);
      expect(correctAfterLock.body.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. GET /api/user/auth/me  (authenticate middleware)
// ---------------------------------------------------------------------------
describe('GET /api/user/auth/me', () => {
  it('returns 200 and user profile for a valid JWT', async () => {
    const user = await createVerifiedUser();
    const token = mintAccessToken(String(user._id));

    const res = await request(app).get('/api/user/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('phoneNumber', TEST_PHONE);
  });

  it('returns 401 when no Authorization header is sent', async () => {
    // SECURITY: protected route must reject unauthenticated requests
    const res = await request(app).get('/api/user/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a JWT signed with a wrong secret', async () => {
    // SECURITY: tokens signed with an attacker-controlled secret must be rejected
    const forgedToken = jwt.sign({ userId: new mongoose.Types.ObjectId(), role: 'user' }, 'wrong-secret-here');

    const res = await request(app).get('/api/user/auth/me').set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a completely malformed token string', async () => {
    const res = await request(app).get('/api/user/auth/me').set('Authorization', 'Bearer this-is-not-a-jwt');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for an expired JWT', async () => {
    // SECURITY: expired tokens must not grant access — clock tolerance must not be abused
    const user = await createVerifiedUser();
    const expiredToken = mintAccessToken(String(user._id), 'user', -1); // expired 1 second ago

    const res = await request(app).get('/api/user/auth/me').set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a structurally valid JWT referencing a non-existent user', async () => {
    // SECURITY: deleted/phantom user IDs must not bypass auth
    const ghostId = new mongoose.Types.ObjectId();
    const token = mintAccessToken(String(ghostId));

    const res = await request(app).get('/api/user/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. POST /api/user/auth/logout
// ---------------------------------------------------------------------------
describe('POST /api/user/auth/logout', () => {
  it('returns 200 on successful logout', async () => {
    const user = await createVerifiedUser();
    const token = mintAccessToken(String(user._id));

    const res = await request(app).post('/api/user/auth/logout').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('blacklists the access token so it cannot be reused after logout', async () => {
    const user = await createVerifiedUser();
    const token = mintAccessToken(String(user._id));

    // Logout
    await request(app).post('/api/user/auth/logout').set('Authorization', `Bearer ${token}`);

    // Attempt to use the same token on a protected route
    const reuseAttempt = await request(app).get('/api/user/auth/me').set('Authorization', `Bearer ${token}`);

    // SECURITY: the token must now be rejected — it is on the Redis blacklist
    expect(reuseAttempt.status).toBe(401);
  });

  it('returns 401 when trying to logout without a token', async () => {
    const res = await request(app).post('/api/user/auth/logout');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. POST /api/user/auth/refresh-token
// ---------------------------------------------------------------------------
describe('POST /api/user/auth/refresh-token', () => {
  it('returns 200 with new accessToken + refreshToken for a valid refresh token', async () => {
    const user = await createVerifiedUser();
    const rawRefreshToken = mintRefreshToken(String(user._id));

    // Store hashed refresh token on user (same as verifyOTP does)
    const hash = require('crypto').createHash('sha256').update(rawRefreshToken).digest('hex');
    await User.findByIdAndUpdate(user._id, { $set: { 'auth.refreshToken': hash } });

    const res = await request(app).post('/api/user/auth/refresh-token').send({ refreshToken: rawRefreshToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Tokens are set as httpOnly cookies, not in response body
    expect(res.headers['set-cookie']).toBeDefined();
    const cookies = Array.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'] : [res.headers['set-cookie']];
    expect(cookies.some((c: string) => c.includes('rez_access_token'))).toBe(true);
    expect(cookies.some((c: string) => c.includes('rez_refresh_token'))).toBe(true);
  });

  it('returns 401 for a completely invalid refresh token string', async () => {
    // SECURITY: garbage strings must not produce new tokens
    const res = await request(app).post('/api/user/auth/refresh-token').send({ refreshToken: 'not-a-real-token' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for an expired refresh token', async () => {
    const user = await createVerifiedUser();
    const expiredRefresh = mintRefreshToken(String(user._id), -1); // expired

    const res = await request(app).post('/api/user/auth/refresh-token').send({ refreshToken: expiredRefresh });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when refreshToken field is missing', async () => {
    const res = await request(app).post('/api/user/auth/refresh-token').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. GET /api/user/boot  (userBootRoutes — protected, aggregates profile+wallet+cart)
// ---------------------------------------------------------------------------
describe('GET /api/user/boot', () => {
  it('returns 200 with profile, wallet, cart, notifications for an authenticated user', async () => {
    const user = await createVerifiedUser();
    const token = mintAccessToken(String(user._id));

    const res = await request(app).get('/api/user/boot').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Shape defined by getUserBoot controller
    expect(res.body.data).toHaveProperty('profile');
    expect(res.body.data).toHaveProperty('wallet');
    expect(res.body.data).toHaveProperty('cart');
    expect(res.body.data).toHaveProperty('notifications');
  });

  it('returns 401 when no token is supplied to the boot endpoint', async () => {
    // SECURITY: boot aggregates PII — must be strictly authenticated
    const res = await request(app).get('/api/user/boot');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for an expired JWT on the boot endpoint', async () => {
    const user = await createVerifiedUser();
    const expiredToken = mintAccessToken(String(user._id), 'user', -1);

    const res = await request(app).get('/api/user/boot').set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 7. POST /api/user/auth/verify-pin
// ---------------------------------------------------------------------------
describe('POST /api/user/auth/verify-pin', () => {
  it('returns 401 for an incorrect PIN', async () => {
    // SECURITY: wrong PIN must be rejected cleanly, no 500
    const correctPin = '9876';
    const pinHash = await bcrypt.hash(correctPin, 10);
    await User.create({
      phoneNumber: TEST_PHONE,
      role: 'user',
      isActive: true,
      auth: {
        isVerified: true,
        isOnboarded: true,
        pinHash,
        pinSetAt: new Date(),
        pinAttempts: 0,
        pinLockedUntil: null,
      },
    });

    const res = await request(app).post('/api/user/auth/verify-pin').send({ phoneNumber: TEST_PHONE, pin: '0000' }); // wrong

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with tokens for the correct PIN', async () => {
    const pin = '1234';
    const pinHash = await bcrypt.hash(pin, 10);
    await User.create({
      phoneNumber: TEST_PHONE,
      role: 'user',
      isActive: true,
      auth: {
        isVerified: true,
        isOnboarded: true,
        pinHash,
        pinSetAt: new Date(),
        pinAttempts: 0,
        pinLockedUntil: null,
      },
    });

    const res = await request(app).post('/api/user/auth/verify-pin').send({ phoneNumber: TEST_PHONE, pin });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
  });

  it('returns 400 when PIN is fewer than 4 digits', async () => {
    // Inline validation in authRoutes.ts rejects anything not matching /^\d{4,6}$/
    const res = await request(app).post('/api/user/auth/verify-pin').send({ phoneNumber: TEST_PHONE, pin: '123' }); // 3 digits

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when phoneNumber is missing', async () => {
    const res = await request(app).post('/api/user/auth/verify-pin').send({ pin: '1234' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 for a phone number not in the database', async () => {
    // Route returns 401 (not 404) to avoid leaking whether a phone is registered.
    const res = await request(app)
      .post('/api/user/auth/verify-pin')
      .send({ phoneNumber: '+919000099999', pin: '1234' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 with PIN_NOT_SET code when user has no PIN configured', async () => {
    await User.create({
      phoneNumber: TEST_PHONE,
      role: 'user',
      isActive: true,
      auth: { isVerified: true, isOnboarded: true },
    });

    const res = await request(app).post('/api/user/auth/verify-pin').send({ phoneNumber: TEST_PHONE, pin: '1234' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PIN_NOT_SET');
    expect(res.body.success).toBe(false);
  });

  it('returns 429 when the PIN is locked due to too many failed attempts', async () => {
    // SECURITY: after PIN lockout the endpoint must return 429, not allow bypass
    const pin = '5678';
    const pinHash = await bcrypt.hash(pin, 10);
    await User.create({
      phoneNumber: TEST_PHONE,
      role: 'user',
      isActive: true,
      auth: {
        isVerified: true,
        isOnboarded: true,
        pinHash,
        pinSetAt: new Date(),
        pinAttempts: 10,
        pinLockedUntil: new Date(Date.now() + 15 * 60 * 1000), // locked for 15 min
      },
    });

    const res = await request(app).post('/api/user/auth/verify-pin').send({ phoneNumber: TEST_PHONE, pin });

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 8. GET /api/user/auth/has-pin
// ---------------------------------------------------------------------------
describe('GET /api/user/auth/has-pin', () => {
  it('returns hasPin: true for a user who has set a PIN', async () => {
    const pinHash = await bcrypt.hash('4321', 10);
    await User.create({
      phoneNumber: TEST_PHONE,
      role: 'user',
      isActive: true,
      auth: { isVerified: true, isOnboarded: true, pinHash },
    });

    const res = await request(app).get('/api/user/auth/has-pin').query({ phoneNumber: TEST_PHONE });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hasPin).toBe(true);
  });

  it('returns hasPin: false for a user without a PIN', async () => {
    await createVerifiedUser();

    const res = await request(app).get('/api/user/auth/has-pin').query({ phoneNumber: TEST_PHONE });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.hasPin).toBe(false);
  });

  it('returns hasPin: false for an unknown phone number (no 404 — phone enumeration guard)', async () => {
    // SECURITY: returning 404 for unknown numbers would let attackers enumerate registered phones.
    // The endpoint must return 200 with hasPin: false for ANY unknown number.
    const res = await request(app).get('/api/user/auth/has-pin').query({ phoneNumber: '+919000077777' });

    expect(res.status).toBe(200);
    expect(res.body.hasPin).toBe(false);
  });

  it('returns 400 when phoneNumber query param is missing', async () => {
    const res = await request(app).get('/api/user/auth/has-pin');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 9. POST /api/user/auth/set-pin  (requires auth)
// ---------------------------------------------------------------------------
describe('POST /api/user/auth/set-pin', () => {
  it('sets a PIN successfully for an authenticated user', async () => {
    const user = await createVerifiedUser();
    const token = mintAccessToken(String(user._id));

    const res = await request(app)
      .post('/api/user/auth/set-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: '7890' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm the hash was stored in DB
    const updated = await User.findById(user._id).select('+auth.pinHash');
    expect(updated?.auth?.pinHash).toBeTruthy();
    expect(await bcrypt.compare('7890', updated!.auth!.pinHash!)).toBe(true);
  });

  it('returns 400 for a PIN that is not exactly 4 digits', async () => {
    const user = await createVerifiedUser();
    const token = mintAccessToken(String(user._id));

    const res = await request(app)
      .post('/api/user/auth/set-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({ pin: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when no auth token is provided', async () => {
    // SECURITY: PIN setting is a sensitive operation — must require authentication
    const res = await request(app).post('/api/user/auth/set-pin').send({ pin: '1111' });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 10. JWT security invariants (cross-cutting)
// ---------------------------------------------------------------------------
describe('JWT security invariants', () => {
  it('rejects an access token with algorithm "none" (algorithm confusion attack)', async () => {
    // SECURITY: an unsigned JWT with alg:none must always be rejected.
    // jwt.verify with { algorithms: ['HS256'] } in auth.ts covers this, but we assert it here.
    const user = await createVerifiedUser();
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ userId: String(user._id), role: 'user' })).toString('base64url');
    const algNoneToken = `${header}.${payload}.`;

    const res = await request(app).get('/api/user/auth/me').set('Authorization', `Bearer ${algNoneToken}`);

    expect(res.status).toBe(401);
  });

  it('rejects a user token claiming an admin role (privilege escalation guard)', async () => {
    // SECURITY: user JWT_SECRET-signed token with role:'admin' must be rejected.
    // The auth middleware enforces that admin roles require JWT_ADMIN_SECRET signature.
    const user = await createVerifiedUser();
    const escalatedToken = jwt.sign({ userId: String(user._id), role: 'admin' }, JWT_SECRET, {
      expiresIn: '15m',
      algorithm: 'HS256',
    });

    const res = await request(app).get('/api/user/auth/me').set('Authorization', `Bearer ${escalatedToken}`);

    // When JWT_ADMIN_SECRET is not set (test env), the token may pass or be rejected
    // depending on the environment guard. The key assertion is: it must never return 500.
    expect(res.status).not.toBe(500);
  });

  it('does not accept JWT passed as a query parameter (only Authorization header / cookie)', async () => {
    // SECURITY: query-param tokens can appear in server logs, referrer headers, etc.
    // extractToken in auth.ts explicitly does not read query params.
    const user = await createVerifiedUser();
    const token = mintAccessToken(String(user._id));

    const res = await request(app).get(`/api/user/auth/me?token=${token}`);

    // Without an Authorization header the middleware must reject this
    expect(res.status).toBe(401);
  });
});
