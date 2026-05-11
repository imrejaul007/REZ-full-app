// @ts-nocheck
import { Router, Request, Response, NextFunction } from 'express';
import { Store } from '../models/Store';
import { IUser } from '../models/User';
import Menu from '../models/Menu';
import { WebOrder, IWebOrder, IWebOrderItem } from '../models/WebOrder';
import { LoyaltyReward } from '../models/LoyaltyReward';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../config/logger';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import redisService from '../services/redisService';
import Razorpay from 'razorpay';
import axios from 'axios';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { verifyToken, authenticate, requireAdmin } from '../middleware/auth';
import { requireInternalToken } from '../middleware/internalAuth';
import whatsappOrderingService from '../services/whatsappOrderingService';
import { sendReorderWhatsApp } from '../services/whatsappReorderService';
import * as webOrderingController from '../controllers/webOrderingController';
import { TableReservation } from '../models/TableReservation';
import { StorePayment } from '../models/StorePayment';
import { BroadcastLog } from '../models/BroadcastLog';
import { WebPushSubscription } from '../models/WebPushSubscription';
import { sendWebPushToUser } from '../services/webPushService';
// B6: identity resolution + canonical emit (Sprint 0)
import { resolveCustomerIdentity } from '../events/resolveCustomerIdentity';
import { emitOrderPlaced } from '../events/emitOrderPlaced';
// coinsEarned: canonical — 1 coin per ₹1 spent (floor)
// Inlined to avoid runtime dependency on @rez/shared (publish was missing compiled JS)
function coinsEarned(orderTotal: number): number {
  return Math.floor(orderTotal * 1);
}

const router = Router();

// ─── TypeScript Interfaces ─────────────────────────────────────────────────────

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
  created_at?: number;
}

interface ErrorResponse {
  success: false;
  message: string;
  code: string;
}

// BACK-HIGH-02: Typed interfaces replacing `as any` casts throughout this file.
// These cover all lean query result types and request augmentation patterns.

/** JWT payload shape decoded from Bearer tokens */
interface IJWTPayload {
  userId?: string;
  role?: string;
  phoneNumber?: string;
  phone?: string;
  name?: string;
}

/** req.user augmentation added by authenticate() middleware */
interface IAuthUser {
  _id?: string;
  id?: string;
  userId?: string;
  role?: 'user' | 'admin' | 'merchant' | 'support' | 'operator' | 'super_admin' | 'consumer';
  phone?: string;
  name?: string;
}

/** Express Request augmented with auth user */
type AuthenticatedRequest = Request & {
  user?: IAuthUser;
  userId?: string;
};

/** Store document returned by Store.findOne(...).lean() */
interface IStoreDoc {
  [key: string]: any;
}

/** Menu document returned by Menu.findOne(...).lean() */
interface IMenuDoc {
  [key: string]: any;
  _id?: any;
  categories?: IMenuCategory[];
}

/** Menu category (nested within IMenuDoc) */
interface IMenuCategory {
  [key: string]: any;
  name?: any;
  items?: IMenuItemRaw[];
}

/** Menu item as stored in menu.categories[].items */
interface IMenuItemRaw {
  [key: string]: any;
  _id?: any;
  name?: string;
  price?: number;
  image?: string;
  category?: string;
  isAvailable?: boolean;
  is86d?: boolean;
}

/** WebOrder document returned by WebOrder.findOne(...).lean() */
interface IWebOrderLean {
  [key: string]: any;
  _id?: any;
  orderNumber?: string;
  storeId?: unknown;
  storeSlug?: string;
  storeName?: string;
  customerPhone?: string;
  customerName?: string;
  userId?: unknown;
  items?: IWebOrderItemLean[];
  total?: number;
  subtotal?: number;
  taxes?: number;
  totalWithTip?: number;
  status?: string;
  paymentStatus?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  billSplits?: IBillSplitLean[];
  disputedAt?: Date;
  disputeReason?: string;
  disputeDetails?: unknown;
  createdAt?: Date;
  tableNumber?: string;
  scheduledFor?: Date | null;
  donationAmount?: number;
  charityName?: string;
  save?: () => Promise<void>;
  parcelRequest?: unknown;
  parcelRequestId?: string;
}

/** IWebOrderItem as returned by .lean() — minimal shape needed by web ordering */
interface IWebOrderItemLean {
  menuItemId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  category?: string;
  image?: string;
  customisation?: string;
}

/** Bill split as returned by .lean() */
interface IBillSplitLean {
  [key: string]: any;
  name?: any;
  amount?: any;
  paid?: any;
  paidAt?: any;
}

/** User document returned by User.findOne(...).lean() */
interface IUserLean {
  [key: string]: any;
  _id?: any;
}

/** Raw Redis client (private field on RedisService class — accessed via cast) */
interface IRedisClientRaw {
  eval(script: string, keys: number, ...args: string[]): Promise<unknown>;
  ping(): Promise<unknown>;
  quit(): Promise<void>;
  scan(cursor: number, options?: { MATCH?: string; COUNT?: number }): Promise<{ cursor: number; keys?: string[] }>;
}

/** StorePayment lean doc — accessed via .lean() query result */
interface IStorePaymentLean {
  [key: string]: any;
  paymentId?: any;
  amount?: any;
  status?: any;
  customerName?: any;
  customerPhone?: any;
  completedAt?: any;
  cancelledAt?: any;
  createdAt?: any;
}

/** Wallet lean doc — accessed via .lean() query result */
interface IWalletLean {
  [key: string]: any;
  balance?: { available?: any };
}

/** Reservation lean doc — accessed via .lean() query result */
interface IReservationLean {
  [key: string]: any;
  partySize?: any;
  _id?: any;
  timeSlot?: any;
}

/** Global io object (Socket.IO attached to Node.js global) */
interface IGlobalIO {
  io?: {
    to(room: string): { emit(event: string, data: unknown): void };
  };
}

/** Redis service shape — accessed directly for Lua scripts and raw client ops */
interface IRedisServiceLike {
  client?: IRedisClientRaw;
  config?: { keyPrefix?: string };
  ping(): Promise<void>;
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
  del(key: string): Promise<void>;
}

interface SuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Web QR Ordering — No App Required (REZ's DotPe competitor)
 *
 * Flow: Customer scans QR → browser opens → menu → cart → OTP verify → Razorpay → order placed
 * Hosted at: menu.rez.money/<storeSlug>
 * API base: /api/web-ordering/
 */

// ─── Rate limiters ─────────────────────────────────────────────────────────────
const menuLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });
const otpLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });

// Stricter limiter for the public search endpoint — lower than menuLimiter (120) to
// prevent search-scraping abuse. Clients receive standard RateLimit-* headers.
const searchLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Analytics endpoint: authenticated merchant dashboard — moderate budget.
const analyticsLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Write operations from untrusted / unauthenticated clients (rating, dispute).
// Tighter than orderLimiter to throttle potential flooding of write endpoints.
const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── CSRF guard — require X-Requested-With on all mutation requests ────────────
// This prevents cross-site form submissions and simple CSRF attacks.
// GET/HEAD/OPTIONS are safe methods and are exempt.
// Bearer token requests are also exempt: Authorization headers cannot be forged
// by cross-site requests (only cookies are susceptible to CSRF), so native
// mobile clients (REZ Now) that send `Authorization: Bearer <jwt>` do not need
// the X-Requested-With header.
router.use((req: Request, res: Response, next) => {
  const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
  if (!SAFE_METHODS.includes(req.method)) {
    const hasBearerToken =
      typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ');
    if (!hasBearerToken && req.headers['x-requested-with'] !== 'XMLHttpRequest') {
      res
        .status(403)
        .json({ success: false, message: 'Forbidden: missing X-Requested-With header', code: 'CSRF_MISSING_HEADER' });
      return;
    }
  }
  next();
});

// ─── In-memory fallback stores (used when Redis is unavailable) ────────────────
// These work fine for single-instance deployments (Render hobby/starter tier)
// NOTE: OTP values stored here are bcrypt hashes, never plaintext.
const memOTP = new Map<string, { otp: string; exp: number }>();
const memSession = new Map<string, { phone: string; exp: number }>();

// ─── Helpers ───────────────────────────────────────────────────────────────────

type DayHours = { open: string; close: string; closed: boolean };
type OperatingHoursMap = Record<string, DayHours | undefined>;

/**
 * Determine whether a store is open right now and produce a human-readable
 * label describing the next status change.
 *
 * Examples:
 *   open:true,  nextChangeLabel: "Closes at 10 PM"
 *   open:false, nextChangeLabel: "Opens Monday at 9 AM"
 */
function isStoreOpen(operatingHours: OperatingHoursMap | undefined | null): {
  open: boolean;
  nextChangeLabel: string;
} {
  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  function fmt12(hhmm: string): string {
    const [hStr, mStr] = hhmm.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return m === 0 ? `${h} ${suffix}` : `${h}:${mStr} ${suffix}`;
  }

  if (!operatingHours || Object.keys(operatingHours).length === 0) {
    return { open: true, nextChangeLabel: '' };
  }

  const now = new Date();
  const todayIdx = now.getDay(); // 0=Sun
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
  const todayKey = DAY_NAMES[todayIdx];
  const todayHours = operatingHours[todayKey];

  if (todayHours && !todayHours.closed) {
    if (currentTime >= todayHours.open && currentTime <= todayHours.close) {
      return { open: true, nextChangeLabel: `Closes at ${fmt12(todayHours.close)}` };
    }
    // Before opening today
    if (currentTime < todayHours.open) {
      return { open: false, nextChangeLabel: `Opens today at ${fmt12(todayHours.open)}` };
    }
  }

  // Find next opening day
  for (let offset = 1; offset <= 7; offset++) {
    const nextIdx = (todayIdx + offset) % 7;
    const nextKey = DAY_NAMES[nextIdx];
    const nextHours = operatingHours[nextKey];
    if (nextHours && !nextHours.closed) {
      const label =
        offset === 1
          ? `Opens tomorrow at ${fmt12(nextHours.open)}`
          : `Opens ${DAY_LABELS[nextIdx]} at ${fmt12(nextHours.open)}`;
      return { open: false, nextChangeLabel: label };
    }
  }

  return { open: false, nextChangeLabel: 'Currently closed' };
}

function generateOrderNumber(storeSlug: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = crypto.randomUUID().replace('-', '').substring(0, 4).toUpperCase();
  return `WEB-${storeSlug.toUpperCase().slice(0, 4)}-${ts}-${rnd}`;
}

function generateOTP(): string {
  return String(crypto.randomInt(100000, 1000000));
}

async function storeOTP(phone: string, otp: string): Promise<void> {
  const key = `web_otp:${phone}`;
  // Hash OTP before storage (cost=8: fast enough for short-lived tokens, still bcrypt-safe)
  const hashedOtp = await bcrypt.hash(otp, 8);
  const saved = await redisService.set(key, hashedOtp, 300); // 5 min TTL
  if (!saved) {
    // Redis unavailable — fall back to in-memory with TTL (hash stored, never plaintext)
    memOTP.set(phone, { otp: hashedOtp, exp: Date.now() + 300_000 });
  }
}

async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  const key = `web_otp:${phone}`;

  // Fetch stored hash, then delete atomically via Lua to prevent replay attacks.
  // bcrypt.compare is used against the stored hash — OTP is never compared in plaintext.
  const luaScript = `
    local stored = redis.call('GET', KEYS[1])
    if stored ~= false then
      redis.call('DEL', KEYS[1])
      return stored
    else
      return false
    end
  `;

  try {
    const redisClient = (redisService as unknown as { client?: IRedisClientRaw }).client;
    const storedHash: string | null | false = redisClient
      ? ((await redisClient.eval(luaScript, 1, key)) as string | null | false)
      : null;
    if (storedHash) {
      // storedHash is a bcrypt hash; compare against plaintext otp
      return await bcrypt.compare(otp, storedHash as string);
    }
    if (storedHash === null || storedHash === false) {
      // Redis unavailable or key missing — fall through to in-memory
      throw new Error('Redis eval returned null/false');
    }
    return false;
  } catch (err) {
    logger.error('[WEB OTP] Lua verify failed, falling back to GET+DEL:', err);
    const storedHash = await redisService.get<string>(key);
    if (storedHash !== null) {
      await redisService.del(key);
      return await bcrypt.compare(otp, storedHash);
    }
    // In-memory fallback
    const entry = memOTP.get(phone);
    if (!entry || Date.now() > entry.exp) {
      memOTP.delete(phone);
      return false;
    }
    const match = await bcrypt.compare(otp, entry.otp);
    memOTP.delete(phone); // always consume on lookup to prevent replay
    return match;
  }
}

async function storeWebSession(sessionId: string, phone: string): Promise<void> {
  const key = `web_session:${sessionId}`;
  const saved = await redisService.set(key, phone, 3600); // 1 hour TTL
  if (!saved) {
    memSession.set(sessionId, { phone, exp: Date.now() + 3_600_000 });
  }
}

async function getWebSession(sessionId: string): Promise<string | null> {
  const key = `web_session:${sessionId}`;
  const stored = await redisService.get<string>(key);
  if (stored !== null) return stored;
  // In-memory fallback
  const entry = memSession.get(sessionId);
  if (!entry || Date.now() > entry.exp) {
    memSession.delete(sessionId);
    return null;
  }
  return entry.phone;
}

function sendErrorResponse(res: Response, statusCode: number, message: string, code: string): Response {
  return res.status(statusCode).json({ success: false, message, code } as ErrorResponse);
}

/**
 * Resolve the customer's phone number from either:
 *  1. A web-ordering session token (legacy Redis-based — `x-session-token` header or body field)
 *  2. A JWT Bearer token (new consumer-app auth — `Authorization: Bearer <token>` header)
 *
 * Returns the phone number string on success, or null if neither token is valid / present.
 */
async function resolveCustomerPhone(req: Request, sessionTokenFromBody?: string): Promise<string | null> {
  // ── 1. Try JWT Bearer token first ─────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwtToken = authHeader.slice(7);
    try {
      const payload = verifyToken(jwtToken);
      if (payload?.userId) {
        // Try JWT payload phone first (fastest path — no DB call)
        const jwtPhone = (payload as IJWTPayload).phoneNumber || (payload as IJWTPayload).phone;
        if (jwtPhone) return jwtPhone;

        // Fall back to DB lookup for the user's stored phone
        const User = require('../models/User').default || require('../models/User').User;
        const user = await User.findById(payload.userId).select('phoneNumber').lean();
        if (user && (user as IUserLean).phoneNumber) {
          return (user as IUserLean).phoneNumber as string;
        }
      }
    } catch (err) {
      // JWT invalid or expired — fall through to session token check
      logger.debug('[WEB ORDERING] JWT verification failed, trying session token', {
        error: (err as Error).message,
      });
    }
  }

  // ── 2. Fall back to legacy web-ordering session token ─────────────────────
  const sessionToken =
    sessionTokenFromBody || (req.headers['x-session-token'] as string) || (req.query.sessionToken as string);

  if (!sessionToken) return null;
  return getWebSession(sessionToken);
}

/**
 * B6 Sprint-1 audit helper — sibling of `resolveCustomerPhone` that ALSO
 * surfaces the caller's `userId` when the JWT path carries one, for use by
 * endpoints migrating to the canonical `userId` lookup pattern.
 *
 * Resolution order (matches resolveCustomerPhone):
 *   1. Authorization: Bearer <jwt>  → `{ userId: payload.userId, phone }`.
 *      Common path for the consumer app post-login.
 *   2. Legacy web-ordering session token (x-session-token header / body /
 *      query) → `{ userId: null, phone }`. Session flow has no user row
 *      today — phone-only filter applies.
 *
 * Zero extra DB hit on the JWT hot path: if the JWT payload already carries
 * phoneNumber/phone, no User lookup happens. Only falls through to
 * `User.findById(payload.userId)` when the JWT is missing the phone claim,
 * mirroring the existing resolveCustomerPhone fallback.
 *
 * Never throws — returns null when neither token path resolves a phone.
 */
interface RequestCustomer {
  /** Canonical User._id — populated on JWT-authed requests (consumer app).
   *  Null for legacy session-token requests that pre-date the User row. */
  userId: string | null;
  /** Canonical phone — always present when this function returns non-null. */
  phone: string;
}

async function resolveCustomerIdentityFromRequest(
  req: Request,
  sessionTokenFromBody?: string,
): Promise<RequestCustomer | null> {
  // ── 1. JWT Bearer path ────────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwtToken = authHeader.slice(7);
    try {
      const payload = verifyToken(jwtToken);
      if (payload?.userId) {
        const userId = String(payload.userId);
        const jwtPhone = (payload as IJWTPayload).phoneNumber || (payload as IJWTPayload).phone;
        if (jwtPhone) return { userId, phone: jwtPhone };

        // JWT-without-phone-claim fallback. Mirrors resolveCustomerPhone.
        const User = require('../models/User').default || require('../models/User').User;
        const user = await User.findById(payload.userId).select('phoneNumber').lean();
        if (user && (user as IUserLean).phoneNumber) {
          return { userId, phone: (user as IUserLean).phoneNumber as string };
        }
      }
    } catch (err) {
      logger.debug('[WEB ORDERING] JWT verification failed, trying session token', {
        error: (err as Error).message,
      });
    }
  }

  // ── 2. Legacy session token path (no userId) ──────────────────────────────
  const sessionToken =
    sessionTokenFromBody || (req.headers['x-session-token'] as string) || (req.query.sessionToken as string);
  if (!sessionToken) return null;
  const phone = await getWebSession(sessionToken);
  if (!phone) return null;
  return { userId: null, phone };
}

/**
 * Build a Mongoose filter fragment that matches an order owned by the caller,
 * whether that ownership was recorded by userId (post-B6 wire-up) or only by
 * customerPhone (pre-B6 legacy rows).
 *
 * Safe to spread into any `WebOrder.find` / `findOne` / `findOneAndUpdate` /
 * `countDocuments` filter. Does NOT consider storeSlug or other scoping —
 * callers should compose those alongside.
 *
 * Result shape:
 *   userId present  →  { $or: [ { userId }, { customerPhone: phone } ] }
 *   userId absent   →  { customerPhone: phone }
 *
 * NOTE: when composing with an existing top-level `$or`, wrap both in `$and`
 * so both constraints must match. A single top-level `$or` from this helper
 * is fine — Mongo treats additional fields as conjunctive with it.
 */
function ownerFilter(customer: RequestCustomer): Record<string, unknown> {
  if (customer.userId) {
    return { $or: [{ userId: customer.userId }, { customerPhone: customer.phone }] };
  }
  return { customerPhone: customer.phone };
}

// ─── Admin: GET /api/web-ordering/admin/orders ────────────────────────────────
// List all web orders across all stores. Admin-only. No Redis cache (fresh data).
// Query params:
//   limit      (default 50, max 100)
//   page       (default 1)
//   status     (optional, comma-separated: pending_payment,paid,confirmed,…)
//   from       (optional, ISO date string — inclusive lower bound on createdAt)
//   to         (optional, ISO date string — inclusive upper bound on createdAt)
//   storeSlug  (optional, filter to a single store)
router.get('/admin/orders', authenticate, requireAdmin, asyncHandler(webOrderingController.getAdminOrders));

// ─── Admin: GET /api/web-ordering/admin/orders/:orderNumber ───────────────────
// Return the full order document for admin detail view.
router.get(
  '/admin/orders/:orderNumber',
  authenticate,
  requireAdmin,
  asyncHandler(webOrderingController.getAdminOrderDetail),
);

// ─── GET /api/web-ordering/check-slug/:slug ───────────────────────────────────
// Public, no-auth. Returns { available: boolean }.
// Validates slug format (3-30 chars, /^[a-z0-9-]+$/) before hitting the DB.
const slugCheckLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get(
  '/check-slug/:slug',
  slugCheckLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (!slug || slug.length < 3 || slug.length > 30 || !/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        message: 'Slug must be 3-30 characters and contain only lowercase letters, numbers, or hyphens.',
        code: 'INVALID_SLUG_FORMAT',
      });
    }

    const existing = await Store.findOne({ slug }).select('_id').lean();
    return res.json({ success: true, data: { available: !existing } });
  }),
);

// ─── GET /api/web-ordering/search ─────────────────────────────────────────────
// Public store search: ?q=<query>&limit=<n>
router.get(
  '/search',
  searchLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const q = (req.query.q as string | undefined)?.trim() ?? '';
    const limitRaw = parseInt((req.query.limit as string) || '8', 10);
    const limit = Math.min(isNaN(limitRaw) ? 8 : Math.max(1, limitRaw), 20);

    if (q.length < 2) {
      return sendErrorResponse(res, 400, 'Query must be at least 2 characters', 'QUERY_TOO_SHORT');
    }

    // Sanitize: strip regex special chars to prevent ReDoS
    const sanitized = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cacheKey = `search:${sanitized.toLowerCase()}`;

    const cached = await redisService.get<any[]>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    const regex = new RegExp(sanitized, 'i');

    const stores = await Store.find({
      isActive: true,
      $or: [{ name: { $regex: regex } }, { slug: sanitized.toLowerCase() }],
    })
      .select('slug name category logo description')
      .populate<{ category: { name: string } }>('category', 'name')
      .limit(limit)
      .lean();

    const data = (stores as (IStoreDoc & { category?: { name?: string } })[]).map((s) => ({
      slug: s.slug,
      name: s.name,
      category: (s.category as { name?: string })?.name ?? null,
      logo: s.logo ?? null,
      description: s.description ?? null,
    }));

    await redisService.set(cacheKey, data, 30);

    return res.json({ success: true, data });
  }),
);

// ─── GET /api/web-ordering/stores/featured ────────────────────────────────────
// Returns up to 8 active stores sorted by most recent orders (homepage use).
router.get(
  '/stores/featured',
  menuLimiter,
  asyncHandler(async (_req: Request, res: Response) => {
    const cacheKey = 'featured-stores';

    const cached = await redisService.get<any[]>(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // Aggregate: join with web_orders, count recent orders, sort descending
    const featured = await Store.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'weborders',
          let: { storeId: '$_id' },
          pipeline: [{ $match: { $expr: { $eq: ['$storeId', '$$storeId'] } } }, { $count: 'total' }],
          as: 'orderStats',
        },
      },
      {
        $addFields: {
          orderCount: { $ifNull: [{ $arrayElemAt: ['$orderStats.total', 0] }, 0] },
        },
      },
      { $sort: { orderCount: -1, createdAt: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      {
        $project: {
          slug: 1,
          name: 1,
          logo: 1,
          description: 1,
          category: { $ifNull: [{ $arrayElemAt: ['$categoryDoc.name', 0] }, null] },
        },
      },
    ]);

    const data = featured.map((s: any) => ({
      slug: s.slug,
      name: s.name,
      category: s.category ?? null,
      logo: s.logo ?? null,
      description: s.description ?? null,
    }));

    await redisService.set(cacheKey, data, 60);

    return res.json({ success: true, data });
  }),
);

// ─── GET /api/web-ordering/store/:storeSlug ────────────────────────────────────
router.get(
  '/store/:storeSlug',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;
    const { table } = req.query;

    // Cache check (5 min TTL)
    const cacheKey = `web_menu:${storeSlug}`;
    const cachedData = await redisService.get<any>(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    // Fetch store first, then menu by storeId (Menu has no slug field)
    const store = await Store.findOne({ slug: storeSlug, isActive: true })
      .select(
        'name slug logo banner location contact operationalInfo operatingHours paymentSettings rewardRules isProgramMerchant estimatedPrepMinutes bookingConfig storeQR gstSettings gstPercent googlePlaceId promotions hasMenu storeType isActive deliveryEnabled deliveryRadiusKm deliveryFee storeLatitude storeLongitude reservationsEnabled maxTableCapacity',
      )
      .lean();

    if (!store) {
      return sendErrorResponse(res, 404, 'Store not found or inactive', 'STORE_NOT_FOUND');
    }

    const menu = await Menu.findOne({ storeId: (store as IStoreDoc)._id, isActive: true }).lean();

    const tableInfo = table ? { tableNumber: table, hasTable: true } : { hasTable: false };

    const storeDoc = store as IStoreDoc;
    const menuDoc = menu as IMenuDoc;

    const paymentMethods = {
      upi: storeDoc.paymentSettings?.acceptUPI !== false,
      card: storeDoc.paymentSettings?.acceptCards !== false,
      wallet: false,
    };

    const responseData = {
      store: {
        id: storeDoc._id,
        name: storeDoc.name,
        slug: storeDoc.slug,
        logo: storeDoc.logo || null,
        banner: storeDoc.banner?.[0] || null,
        address: storeDoc.location?.address || '',
        phone: storeDoc.contact?.phone || '',
        operatingHours: (() => {
          // Prefer the top-level operatingHours override; fall back to operationalInfo.hours.
          // Normalise each day entry to always include the `closed` boolean.
          const raw: Record<string, any> =
            storeDoc.operatingHours && Object.keys(storeDoc.operatingHours).length > 0
              ? storeDoc.operatingHours
              : storeDoc.operationalInfo?.hours || {};
          const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
          const defaultHours = { open: '09:00', close: '22:00', closed: false };
          const result: Record<string, { open: string; close: string; closed: boolean }> = {};
          for (const day of DAYS) {
            const d = raw[day];
            result[day] = d
              ? { open: d.open ?? '09:00', close: d.close ?? '22:00', closed: d.closed === true }
              : { ...defaultHours };
          }
          return result;
        })(),
        gstEnabled: true,
        gstPercent: storeDoc.gstSettings?.gstPercent ?? storeDoc.gstPercent ?? 5,
        googlePlaceId: storeDoc.googlePlaceId || null,
        isProgramMerchant: storeDoc.isProgramMerchant === true,
        estimatedPrepMinutes: storeDoc.estimatedPrepMinutes ?? 0,
        hasMenu: storeDoc.hasMenu === true,
        storeType: storeDoc.storeType || 'retail',
        ...(() => {
          try {
            const raw: Record<string, any> =
              storeDoc.operatingHours && Object.keys(storeDoc.operatingHours).length > 0
                ? storeDoc.operatingHours
                : storeDoc.operationalInfo?.hours || {};
            const normalised: Record<string, { open: string; close: string; closed: boolean }> = {};
            for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
              const d = raw[day];
              normalised[day] = d
                ? { open: d.open ?? '09:00', close: d.close ?? '22:00', closed: d.closed === true }
                : { open: '09:00', close: '22:00', closed: false };
            }
            const result = isStoreOpen(normalised);
            return { isOpen: result.open, nextChangeLabel: result.nextChangeLabel };
          } catch (_e) {
            return { isOpen: storeDoc.isActive !== false, nextChangeLabel: '' };
          }
        })(),
        rewardRules: {
          baseCashbackPercent: storeDoc.rewardRules?.baseCashbackPercent ?? 0,
          coinsEnabled: (storeDoc.rewardRules?.baseCashbackPercent ?? 0) > 0,
        },
        deliveryEnabled: storeDoc.deliveryEnabled === true,
        deliveryRadiusKm: storeDoc.deliveryRadiusKm ?? 5,
        deliveryFee: storeDoc.deliveryFee ?? 0,
        reservationsEnabled: storeDoc.reservationsEnabled === true,
        maxTableCapacity: storeDoc.maxTableCapacity ?? 50,
      },
      promotions: storeDoc.promotions?.length
        ? storeDoc.promotions.map((p: any, idx: number) => ({
            id: p._id?.toString() ?? `promo-${idx}`,
            title: p.title,
            subtitle: p.subtitle || '',
            image: p.image || null,
            backgroundColor: p.backgroundColor || '#1e3a5f',
            actionText: p.actionText || '',
            actionUrl: p.actionUrl || '',
          }))
        : [],
      menu: menu
        ? {
            categories:
              menuDoc.categories?.map((cat: any) => ({
                id: cat._id,
                name: cat.name,
                description: cat.description || '',
                items:
                  cat.items
                    ?.filter((i: any) => i.isAvailable !== false)
                    .map((item: any) => ({
                      id: item._id,
                      name: item.name,
                      description: item.description || '',
                      price: item.price,
                      originalPrice: item.originalPrice || null,
                      image: item.image || null,
                      category: cat.name,
                      isVeg: item.dietaryInfo?.isVegetarian || false,
                      isVegan: item.dietaryInfo?.isVegan || false,
                      spicyLevel: item.spicyLevel || 0,
                      preparationTime: item.preparationTime || '15 mins',
                      tags: item.tags || [],
                      is86d: item.is86d || false,
                      cashbackPercentage: item.cashbackPercentage ?? undefined,
                      // Variants (e.g. Half/Full, Small/Medium/Large) — pick one
                      variants: item.variants?.length
                        ? item.variants.map((v: any) => ({
                            name: v.name,
                            price: v.price,
                            isDefault: v.isDefault ?? false,
                          }))
                        : undefined,
                      // Modifiers / add-ons (e.g. Extra Cheese +₹30) — pick multiple
                      modifiers: item.modifiers?.length
                        ? item.modifiers.map((m: any) => ({
                            name: m.name,
                            price: m.price,
                            ...(m.isVeg !== undefined ? { isVeg: m.isVeg } : {}),
                            ...(m.max !== undefined ? { max: m.max } : {}),
                          }))
                        : undefined,
                      // Nutritional info — read from product model if populated
                      nutrition:
                        item.nutrition?.calories != null ||
                        item.nutrition?.protein != null ||
                        item.nutrition?.carbs != null ||
                        item.nutrition?.fat != null
                          ? {
                              ...(item.nutrition.calories != null ? { calories: item.nutrition.calories } : {}),
                              ...(item.nutrition.protein != null ? { protein: item.nutrition.protein } : {}),
                              ...(item.nutrition.carbs != null ? { carbs: item.nutrition.carbs } : {}),
                              ...(item.nutrition.fat != null ? { fat: item.nutrition.fat } : {}),
                            }
                          : undefined,
                    })) || [],
              })) || [],
          }
        : null,
      tableInfo,
      paymentMethods,
    };

    // Cache for 5 minutes
    await redisService.set(cacheKey, responseData, 300);

    res.set('Cache-Control', 'public, max-age=300, must-revalidate');
    return res.json({ success: true, data: responseData } as SuccessResponse<any>);
  }),
);

// Backwards-compatible alias for already-deployed QR codes
router.get(
  '/menu/:storeSlug',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    return res.redirect(307, `/api/web-ordering/store/${req.params.storeSlug}`);
  }),
);

// ─── POST /api/web-ordering/store/:storeSlug/check-delivery ──────────────────
// Public endpoint — no auth required.
// Body: { latitude: number; longitude: number }
// Returns: { deliverable: boolean; fee: number; distanceKm: number; message?: string }
router.post(
  '/store/:storeSlug/check-delivery',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;
    const { latitude, longitude } = req.body as { latitude?: unknown; longitude?: unknown };

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return sendErrorResponse(res, 400, 'latitude and longitude must be numbers', 'INVALID_COORDS');
    }

    const store = await Store.findOne({ slug: storeSlug, isActive: true })
      .select('deliveryEnabled deliveryRadiusKm deliveryFee storeLatitude storeLongitude')
      .lean();

    if (!store) {
      return sendErrorResponse(res, 404, 'Store not found or inactive', 'STORE_NOT_FOUND');
    }

    const storeDoc = store as any;

    if (!storeDoc.deliveryEnabled) {
      return res.json({
        success: true,
        data: {
          deliverable: false,
          fee: 0,
          distanceKm: 0,
          message: 'This store does not offer delivery',
        },
      });
    }

    if (typeof storeDoc.storeLatitude !== 'number' || typeof storeDoc.storeLongitude !== 'number') {
      return res.json({
        success: true,
        data: {
          deliverable: false,
          fee: 0,
          distanceKm: 0,
          message: 'Delivery location not configured for this store',
        },
      });
    }

    // Haversine distance calculation
    const R = 6371; // Earth radius in km
    const dLat = ((latitude - storeDoc.storeLatitude) * Math.PI) / 180;
    const dLon = ((longitude - storeDoc.storeLongitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((storeDoc.storeLatitude * Math.PI) / 180) *
        Math.cos((latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const radiusKm: number = typeof storeDoc.deliveryRadiusKm === 'number' ? storeDoc.deliveryRadiusKm : 5;
    const fee: number = typeof storeDoc.deliveryFee === 'number' ? storeDoc.deliveryFee : 0;

    if (distanceKm > radiusKm) {
      return res.json({
        success: true,
        data: {
          deliverable: false,
          fee: 0,
          distanceKm: Math.round(distanceKm * 100) / 100,
          message: 'Outside delivery zone',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        deliverable: true,
        fee,
        distanceKm: Math.round(distanceKm * 100) / 100,
      },
    });
  }),
);

// ─── POST /api/web-ordering/otp/send ──────────────────────────────────────────
router.post(
  '/otp/send',
  otpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || phone.length > 20) {
      return sendErrorResponse(res, 400, 'Valid phone number required', 'INVALID_PHONE');
    }
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      return sendErrorResponse(res, 400, 'Valid 10-digit Indian phone number required', 'INVALID_PHONE_FORMAT');
    }

    const normalised = phone.replace(/\s/g, '');
    const otp = generateOTP();
    await storeOTP(normalised, otp);

    logger.info(`[WEB OTP] OTP dispatched to ${normalised.slice(0, 2)}****${normalised.slice(-2)}`);

    return res.json({ success: true, message: 'OTP sent successfully' });
  }),
);

// ─── POST /api/web-ordering/otp/verify ────────────────────────────────────────
router.post(
  '/otp/verify',
  otpLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return sendErrorResponse(res, 400, 'phone and otp are required', 'MISSING_FIELDS');
    }
    if (typeof phone !== 'string' || phone.length > 20) {
      return sendErrorResponse(res, 400, 'Valid phone number required', 'INVALID_PHONE');
    }
    const normalised = phone.replace(/\s/g, '');
    if (!/^[6-9]\d{9}$/.test(normalised)) {
      return sendErrorResponse(res, 400, 'Valid 10-digit Indian phone number required', 'INVALID_PHONE_FORMAT');
    }
    if (typeof otp !== 'string' && typeof otp !== 'number') {
      return sendErrorResponse(res, 400, 'Valid OTP required', 'INVALID_OTP_FORMAT');
    }
    const valid = await verifyOTP(normalised, String(otp));

    if (!valid) {
      return sendErrorResponse(res, 401, 'Invalid or expired OTP', 'INVALID_OTP');
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    await storeWebSession(sessionId, normalised);

    return res.json({ success: true, sessionToken: sessionId });
  }),
);

// ─── POST /api/web-ordering/razorpay/create-order ─────────────────────────────
router.post(
  '/razorpay/create-order',
  orderLimiter,
  idempotencyMiddleware(),
  asyncHandler(async (req: Request, res: Response) => {
    // ISSUE-44 FIX: `couponCode` accepted; `couponDiscount` from the client is NEVER
    // trusted. The discount is recalculated server-side against the live coupon record.
    const {
      storeSlug,
      items,
      customerName,
      tableNumber,
      orderType,
      deliveryAddress,
      specialInstructions,
      sessionToken,
      couponCode,
      scheduledFor,
    } = req.body as {
      storeSlug?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items?: any[];
      customerName?: string;
      tableNumber?: string;
      orderType?: 'dine_in' | 'takeaway' | 'delivery';
      deliveryAddress?: { line1?: string; city?: string; pincode?: string; latitude?: number; longitude?: number };
      specialInstructions?: string;
      sessionToken?: string;
      couponCode?: string;
      scheduledFor?: string;
    };

    // Resolve customer phone from JWT Bearer header (new) or legacy session token (old)
    const customerPhone = await resolveCustomerPhone(req, sessionToken);
    if (!customerPhone) {
      return sendErrorResponse(
        res,
        401,
        'Phone verification required — please log in again',
        'PHONE_VERIFICATION_REQUIRED',
      );
    }

    if (!storeSlug || !items?.length) {
      return sendErrorResponse(res, 400, 'storeSlug and items are required', 'MISSING_FIELDS');
    }

    const store = await Store.findOne({ slug: storeSlug, isActive: true })
      .select(
        // B6: merchantId added so canonical order.placed emit can populate
        // the mandatory `merchantId` field without a second round-trip.
        '_id name merchantId gstSettings gstPercent deliveryEnabled deliveryRadiusKm deliveryFee storeLatitude storeLongitude',
      )
      .lean();
    if (!store) {
      return sendErrorResponse(res, 404, 'Store not found or inactive', 'STORE_NOT_FOUND');
    }

    const menu = await Menu.findOne({ storeId: (store as IStoreDoc)._id, isActive: true }).lean();
    const menuItemMap = new Map<string, any>();
    if (menu) {
      for (const cat of (menu as IMenuDoc).categories || []) {
        for (const item of cat.items || []) {
          menuItemMap.set(item._id.toString(), { ...item, categoryName: cat.name });
        }
      }
    }

    const validatedItems: IWebOrderItem[] = [];
    let subtotal = 0;
    for (const cartItem of items) {
      if (!cartItem || typeof cartItem !== 'object') {
        return sendErrorResponse(res, 400, 'Invalid item format', 'INVALID_ITEM_FORMAT');
      }
      if (typeof cartItem.id !== 'string' || !cartItem.id) {
        return sendErrorResponse(res, 400, 'Item ID is required', 'MISSING_ITEM_ID');
      }
      if (typeof cartItem.quantity !== 'number' || cartItem.quantity < 1 || cartItem.quantity > 50) {
        return sendErrorResponse(res, 400, 'Invalid item quantity (1-50)', 'INVALID_QUANTITY');
      }

      const menuItem = menuItemMap.get(cartItem.id);
      if (!menuItem) return sendErrorResponse(res, 400, 'Item not found in menu', 'ITEM_NOT_FOUND');
      if (menuItem.is86d || menuItem.isAvailable === false) {
        return sendErrorResponse(res, 400, 'Item is currently unavailable', 'ITEM_UNAVAILABLE');
      }

      const qty = Math.max(1, Math.min(50, parseInt(String(cartItem.quantity), 10) || 1));
      subtotal += menuItem.price * qty;
      validatedItems.push({
        menuItemId: menuItem._id.toString(),
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
        category: menuItem.categoryName,
        image: menuItem.image || '',
        customisation: typeof cartItem.customisation === 'string' ? cartItem.customisation.slice(0, 200) : '',
      });
    }

    const storeDoc = store as any;
    const gstPercent = storeDoc.gstSettings?.gstPercent ?? storeDoc.gstPercent ?? 5;
    const taxes = Math.round(subtotal * gstPercent) / 100;

    // ISSUE-44 FIX: Server-side coupon recalculation.
    // Never trust a couponDiscount value sent by the client — always derive it
    // from the live coupon record stored in the database.
    let serverCouponDiscount = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode && typeof couponCode === 'string') {
      try {
        const { Coupon } = require('../models/Coupon');
        // Atomically validate AND increment usedCount in one operation to prevent
        // race conditions where concurrent requests could both pass the usage-limit
        // check and over-issue the coupon. The $expr guard enforces totalUsage > 0
        // (i.e. a limit is set) before comparing; coupons with totalUsage === 0 are
        // treated as unlimited and are found by a separate findOne below.
        // NOTE: If the order subsequently fails (e.g. Razorpay error), the increment
        // is NOT automatically rolled back. A background reconciliation job or manual
        // adjustment is needed for those edge cases — rollback logic is out of scope here.
        const now = new Date();
        let couponDoc = await Coupon.findOneAndUpdate(
          {
            couponCode: couponCode.toUpperCase(),
            status: 'active',
            validFrom: { $lte: now },
            validTo: { $gte: now },
            $and: [
              { $or: [{ 'applicableTo.stores': { $size: 0 } }, { 'applicableTo.stores': storeDoc._id }] },
              // Only apply the usage-cap guard when a limit is actually set
              {
                $or: [
                  { 'usageLimit.totalUsage': { $lte: 0 } },
                  { $expr: { $lt: ['$usageLimit.usedCount', '$usageLimit.totalUsage'] } },
                ],
              },
            ],
          },
          { $inc: { 'usageLimit.usedCount': 1 } },
          { new: true },
        );

        if (couponDoc) {
          // Check min order requirement
          if (!couponDoc.minOrderValue || subtotal >= couponDoc.minOrderValue) {
            if (couponDoc.discountType === 'PERCENTAGE') {
              serverCouponDiscount = Math.round(subtotal * (couponDoc.discountValue / 100));
              if (couponDoc.maxDiscountCap && couponDoc.maxDiscountCap > 0) {
                serverCouponDiscount = Math.min(serverCouponDiscount, couponDoc.maxDiscountCap);
              }
            } else {
              serverCouponDiscount = Math.min(couponDoc.discountValue, subtotal);
            }
            appliedCouponCode = couponDoc.couponCode;
          } else {
            // Min order not met — undo the increment we just applied
            await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { 'usageLimit.usedCount': -1 } });
          }
        }
      } catch (couponErr) {
        logger.error('[WEB ORDER] Coupon validation error (non-blocking):', couponErr);
        // Non-fatal: proceed without discount if coupon lookup fails
        serverCouponDiscount = 0;
      }
    }

    // Delivery validation and fee
    let serverDeliveryFee = 0;
    let resolvedDeliveryAddress: {
      line1: string;
      city: string;
      pincode: string;
      latitude?: number;
      longitude?: number;
    } | null = null;
    if (orderType === 'delivery') {
      if (
        !deliveryAddress ||
        typeof deliveryAddress.line1 !== 'string' ||
        !deliveryAddress.line1.trim() ||
        typeof deliveryAddress.city !== 'string' ||
        !deliveryAddress.city.trim() ||
        typeof deliveryAddress.pincode !== 'string' ||
        !/^\d{6}$/.test(deliveryAddress.pincode.trim())
      ) {
        return sendErrorResponse(
          res,
          400,
          'Delivery requires a valid address with line1, city, and 6-digit pincode',
          'INVALID_DELIVERY_ADDRESS',
        );
      }
      resolvedDeliveryAddress = {
        line1: deliveryAddress.line1.trim().slice(0, 200),
        city: deliveryAddress.city.trim().slice(0, 100),
        pincode: deliveryAddress.pincode.trim(),
        latitude: typeof deliveryAddress.latitude === 'number' ? deliveryAddress.latitude : undefined,
        longitude: typeof deliveryAddress.longitude === 'number' ? deliveryAddress.longitude : undefined,
      };
      serverDeliveryFee = typeof storeDoc.deliveryFee === 'number' ? storeDoc.deliveryFee : 0;
    }

    const total = Math.max(0, Math.round((subtotal + taxes + serverDeliveryFee - serverCouponDiscount) * 100) / 100);
    const totalPaise = Math.round(total * 100);
    const orderNumber = generateOrderNumber(storeSlug);

    // Mock mode: skip Razorpay when no real credentials are configured.
    // SECURITY: In production, mock payment is NEVER allowed — it auto-confirms
    // orders without collecting payment, effectively giving away goods for free.
    const isMockPayment =
      process.env.NODE_ENV !== 'production' &&
      (!process.env.RAZORPAY_KEY_ID ||
        !process.env.RAZORPAY_KEY_SECRET ||
        process.env.RAZORPAY_KEY_SECRET === 'dummy_secret_for_dev' ||
        process.env.RAZORPAY_MOCK_MODE === 'true');

    // In production, if Razorpay is not configured, reject the order rather than auto-confirm.
    if (process.env.NODE_ENV === 'production' && (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)) {
      logger.error('[WEB ORDER] Razorpay credentials missing in production — cannot process payment');
      return sendErrorResponse(
        res,
        503,
        'Payment service is not configured. Please contact support.',
        'PAYMENT_NOT_CONFIGURED',
      );
    }

    let razorpayOrder: RazorpayOrder | null = null;
    if (!isMockPayment) {
      try {
        const rz = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        razorpayOrder = (await rz.orders.create({
          amount: totalPaise,
          currency: 'INR',
          receipt: orderNumber,
          notes: { storeSlug, customerPhone, orderNumber, channel: 'web_qr' },
        })) as RazorpayOrder;
      } catch (rzErr) {
        logger.error(
          '[WEB ORDER] Razorpay order creation failed:',
          rzErr instanceof Error ? rzErr.message : String(rzErr),
        );
        return sendErrorResponse(res, 502, 'Payment gateway error, please try again', 'RAZORPAY_ERROR');
      }

      if (!razorpayOrder) {
        return sendErrorResponse(res, 502, 'Payment gateway returned empty order', 'RAZORPAY_EMPTY_RESPONSE');
      }
    }

    // B6 (Sprint 0): Always resolve customer identity via the shared helper.
    // Pre-patch this was `User.findOne({ phoneNumber: customerPhone })` which
    // returned null for unknown phones — every web order from a first-time
    // customer was anonymous. The shared helper now upserts, guaranteeing
    // every web order links to a User row.
    const identity = await resolveCustomerIdentity({
      customerPhone,
      customerName: typeof customerName === 'string' ? customerName : undefined,
      source: 'web',
    });
    const linkedUserId = identity.customerId; // string | null

    // Parse and validate scheduledFor if provided
    let scheduledForDate: Date | null = null;
    if (scheduledFor && typeof scheduledFor === 'string') {
      const parsed = new Date(scheduledFor);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > Date.now()) {
        scheduledForDate = parsed;
      }
    }

    const webOrder = await WebOrder.create({
      orderNumber,
      storeId: storeDoc._id,
      storeSlug,
      storeName: storeDoc.name,
      customerPhone,
      customerName: customerName || '',
      tableNumber: orderType === 'dine_in' ? tableNumber || '' : '',
      orderType: orderType || 'takeaway',
      ...(resolvedDeliveryAddress ? { deliveryAddress: resolvedDeliveryAddress } : {}),
      deliveryFee: serverDeliveryFee,
      items: validatedItems,
      subtotal,
      taxes,
      // ISSUE-44 FIX: Store the server-computed coupon discount, not a client value
      ...(appliedCouponCode ? { couponCode: appliedCouponCode, couponDiscount: serverCouponDiscount } : {}),
      total,
      // Mock mode: mark as confirmed immediately since no payment gateway is involved
      status: isMockPayment ? 'confirmed' : 'pending_payment',
      paymentStatus: isMockPayment ? 'paid' : 'pending',
      razorpayOrderId: razorpayOrder?.id || null,
      specialInstructions: specialInstructions || '',
      scheduledFor: scheduledForDate,
      channel: 'web_qr',
      userId: linkedUserId ? new mongoose.Types.ObjectId(linkedUserId) : null,
    });

    // B6 (Sprint 0): Canonical order.placed emit — never-throws (helper guards
    // BullMQ/Redis failures + walk-in fan-out internally). Emits even when the
    // order is still `pending_payment`; downstream subscribers can filter on
    // paymentStatus if they only care about settled orders (payment.settled
    // canonical emit comes in Sprint 2+).
    emitOrderPlaced({
      merchantId: String(storeDoc.merchantId ?? ''),
      storeId: String(storeDoc._id),
      customerId: linkedUserId,
      orderId: String(webOrder._id),
      orderNumber: webOrder.orderNumber,
      amount: total,
      source: 'web',
      items: validatedItems.map((i) => ({
        productId: String(i.menuItemId ?? ''),
        qty: Number(i.quantity ?? 1),
        price: Number(i.price ?? 0),
      })),
    });

    return res.json({
      success: true,
      data: {
        orderNumber,
        orderId: String(webOrder._id),
        subtotal,
        taxes,
        deliveryFee: serverDeliveryFee,
        couponDiscount: serverCouponDiscount,
        couponCode: appliedCouponCode,
        total,
        razorpay: razorpayOrder
          ? {
              orderId: razorpayOrder.id,
              amount: razorpayOrder.amount,
              currency: razorpayOrder.currency,
              keyId: process.env.RAZORPAY_KEY_ID,
            }
          : null,
      },
    });
  }),
);

// ─── POST /api/web-ordering/payment/verify ────────────────────────────────────
// BUG-NEW-013: added orderLimiter to prevent replay/brute-force on this endpoint
// BUG-NEW-014: idempotency guard added at the top of the handler body
router.post(
  '/payment/verify',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, sessionToken } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return sendErrorResponse(res, 400, 'Invalid order ID format', 'INVALID_ORDER_ID');
    }

    const order = await WebOrder.findById(orderId);
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    // HIGH-3 + B6 Sprint-1 audit: Verify the caller owns this order.
    //
    // Ownership is granted when EITHER
    //   (a) the JWT carries a userId matching `order.userId` (post-B6), OR
    //   (b) the resolved phone matches `order.customerPhone` (pre-B6 fallback).
    //
    // This kills the phone-format sensitivity of the old equality check —
    // e.g. JWT phoneNumber "+919876543210" against order.customerPhone
    // "9876543210" used to fail; now the userId path short-circuits it.
    const customer = await resolveCustomerIdentityFromRequest(req, sessionToken);
    if (!customer) {
      return sendErrorResponse(
        res,
        401,
        'Phone verification required — please log in again',
        'PHONE_VERIFICATION_REQUIRED',
      );
    }
    const ownerById = !!customer.userId && !!order.userId && order.userId.toString() === customer.userId;
    const ownerByPhone = customer.phone === order.customerPhone;
    if (!ownerById && !ownerByPhone) {
      return sendErrorResponse(
        res,
        403,
        'Forbidden: this order does not belong to your account',
        'ORDER_OWNERSHIP_MISMATCH',
      );
    }

    // BUG-NEW-014: Idempotency guard — if this order was already paid, return success
    // immediately without re-running signature verification or re-saving, preventing
    // duplicate payment processing on retry/network-glitch scenarios.
    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Already verified' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return sendErrorResponse(
        res,
        503,
        'Payment verification unavailable: gateway not configured',
        'GATEWAY_NOT_CONFIGURED',
      );
    }
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');

    try {
      const expectedBuf = Buffer.from(expected, 'hex');
      const receivedBuf = Buffer.from(razorpay_signature, 'hex');
      const isValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);
      if (!isValid) {
        order.paymentStatus = 'failed';
        order.status = 'cancelled';
        await order.save();
        return sendErrorResponse(res, 400, 'Payment verification failed', 'PAYMENT_VERIFICATION_FAILED');
      }
    } catch {
      order.paymentStatus = 'failed';
      order.status = 'cancelled';
      await order.save();
      return sendErrorResponse(res, 400, 'Payment verification failed', 'SIGNATURE_MISMATCH');
    }

    // CRIT-2: Atomic update — only flips to 'paid' if the order is still unpaid,
    // eliminating the race condition between the earlier read and this write.
    // A concurrent request that already committed the payment will cause `updated`
    // to be null (the $ne filter won't match), and we return idempotent success.
    const updated = await WebOrder.findOneAndUpdate(
      { _id: orderId, paymentStatus: { $ne: 'paid' } },
      { $set: { paymentStatus: 'paid', status: 'confirmed', razorpayPaymentId: razorpay_payment_id } },
      { new: true },
    );

    if (!updated) {
      // Already paid by a concurrent request — idempotent success
      return res.json({ success: true, message: 'Payment already verified' });
    }

    // Canonical `payment.settled` emit — never-throws, fire-and-forget.
    // Lets downstream subscribers (wallet balance invalidation, cashback
    // reconciliation, WhatsApp receipts) react uniformly regardless of
    // whether this was a web-order, POS, or aggregator payment.
    try {
      const { emitPaymentSettled } = await import('../events/emitPaymentSettled');
      const emitStoreForMerchant = await Store.findById(updated.storeId).select('merchantId').lean();
      const merchantIdForEmit = (emitStoreForMerchant as IStoreDoc)?.merchantId;
      if (merchantIdForEmit) {
        emitPaymentSettled({
          merchantId: String(merchantIdForEmit),
          customerId: updated.userId ? String(updated.userId) : null,
          paymentId: razorpay_payment_id,
          orderId: String(updated._id),
          amount: Number(updated.total ?? 0),
          gateway: 'razorpay',
        });
      }
    } catch (err) {
      logger.warn('[WEB ORDER] emitPaymentSettled failed (non-fatal)', {
        orderId: String(updated._id),
        error: err instanceof Error ? err.message : String(err),
      });
    }

    setImmediate(async () => {
      try {
        const io = req.app.get('io');
        if (io) {
          const emitStore = await Store.findById(updated.storeId).select('merchantId').lean();
          const merchantRoomId = (emitStore as IStoreDoc)?.merchantId;
          if (merchantRoomId) {
            io.to(`merchant-${merchantRoomId}`).emit('web-order:new', {
              orderId: updated._id,
              orderNumber: updated.orderNumber,
              items: updated.items,
              total: updated.total,
              tableNumber: updated.tableNumber,
              customerPhone: updated.customerPhone,
              customerName: updated.customerName,
              channel: 'web_qr',
            });
          }
        }
      } catch (socketErr) {
        logger.warn(
          '[WEB ORDER] Socket emit failed:',
          socketErr instanceof Error ? socketErr.message : String(socketErr),
        );
      }
    });

    logger.info(`[WEB ORDER] ✅ Order confirmed: ${updated.orderNumber} ₹${updated.total}`);

    // Fire-and-forget WhatsApp reorder message (never blocks the response)
    sendReorderWhatsApp({
      phone: updated.customerPhone,
      customerName: updated.customerName || '',
      storeName: updated.storeName || '',
      orderTotal: `₹${updated.total}`,
      storeSlug: (updated as IWebOrder).storeSlug || '',
      orderNumber: updated.orderNumber,
    }).catch(() => {});

    return res.json({
      success: true,
      data: {
        orderNumber: updated.orderNumber,
        status: updated.status,
        total: updated.total,
        items: updated.items,
        tableNumber: updated.tableNumber,
      },
    });
  }),
);

// ─── Receipt token verification helper ────────────────────────────────────────
// Token = first 16 hex chars of HMAC-SHA256(secret, orderNumber).
// Same algorithm used by POST /receipt/send when generating receipt URLs.
function computeReceiptToken(orderNumber: string): string {
  const secret = process.env.RECEIPT_TOKEN_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RECEIPT_TOKEN_SECRET environment variable is required');
  }
  return crypto.createHmac('sha256', secret).update(orderNumber).digest('hex').slice(0, 16);
}

// ─── GET /api/web-ordering/order/:orderNumber ─────────────────────────────────
router.get(
  '/order/:orderNumber',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { t: receiptToken } = req.query as { t?: string };

    if (!/^WEB-[A-Z0-9]{4,}-[A-Z0-9]+-[A-Z0-9]+$/i.test(orderNumber)) {
      return sendErrorResponse(res, 400, 'Invalid order number format', 'INVALID_ORDER_NUMBER');
    }

    // Verify receipt token when provided. Absent token is allowed (status polling
    // from the checkout flow). A present but incorrect token is always rejected —
    // this closes the enumeration vector on receipt URLs.
    if (receiptToken) {
      const expected = computeReceiptToken(orderNumber);
      const expectedBuf = Buffer.from(expected, 'hex');
      // Truncate or reject tokens that aren't exactly 16 hex chars (8 bytes)
      const tokenSlice = receiptToken.slice(0, 16).padEnd(16, '0');
      const providedBuf = Buffer.from(tokenSlice, 'hex');
      const valid = providedBuf.length === expectedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf);
      if (!valid) {
        return sendErrorResponse(res, 403, 'Invalid receipt token', 'INVALID_RECEIPT_TOKEN');
      }
    }

    const order = await WebOrder.findOne({ orderNumber }).lean();
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    const orderDoc = order as unknown as IWebOrderLean;

    // Fetch googlePlaceId from the store (best-effort — null if store not found)
    let googlePlaceId: string | null = null;
    try {
      const storeForOrder = await Store.findOne({ slug: orderDoc.storeSlug }).select('googlePlaceId').lean();
      googlePlaceId = (storeForOrder as IStoreDoc)?.googlePlaceId ?? null;
    } catch {
      // Non-critical — order still returned without it
    }

    return res.json({
      success: true,
      data: {
        orderNumber: orderDoc.orderNumber,
        status: orderDoc.status,
        paymentStatus: orderDoc.paymentStatus,
        items: orderDoc.items,
        subtotal: orderDoc.subtotal,
        taxes: orderDoc.taxes,
        total: orderDoc.total,
        tableNumber: orderDoc.tableNumber,
        storeName: orderDoc.storeName,
        createdAt: orderDoc.createdAt,
        scheduledFor: orderDoc.scheduledFor ? orderDoc.scheduledFor.toISOString() : null,
        googlePlaceId,
      },
    });
  }),
);

// ─── POST /api/web-ordering/cart/validate ─────────────────────────────────────
// Validate cart items against current stock/availability
router.post(
  '/cart/validate',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug, items } = req.body;
    if (!storeSlug || !items?.length) {
      return res.status(400).json({ success: false, message: 'storeSlug and items required' });
    }

    const store = await Store.findOne({ slug: storeSlug, isActive: true }).select('_id').lean();
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const menu = await Menu.findOne({ storeId: (store as IStoreDoc)._id, isActive: true }).lean();
    if (!menu) return res.status(404).json({ success: false, message: 'Menu not found' });

    const issues: Array<{ itemId: string; itemName: string; issue: string }> = [];
    const allMenuItems = (menu as IMenuDoc).categories?.flatMap((cat: IMenuCategory) => cat.items || []) || [];

    for (const cartItem of items) {
      const menuItem = allMenuItems.find((mi: any) => mi._id?.toString() === cartItem.id || mi.id === cartItem.id);
      if (!menuItem) {
        issues.push({ itemId: cartItem.id, itemName: cartItem.name || 'Unknown', issue: 'Item no longer available' });
      } else if (menuItem.is86d) {
        issues.push({ itemId: cartItem.id, itemName: String(menuItem.name ?? 'Unknown'), issue: 'Currently sold out' });
      } else if (menuItem.isAvailable === false) {
        issues.push({
          itemId: cartItem.id,
          itemName: String(menuItem.name ?? 'Unknown'),
          issue: 'Currently unavailable',
        });
      } else if (menuItem.price !== cartItem.price) {
        issues.push({
          itemId: cartItem.id,
          itemName: String(menuItem.name ?? 'Unknown'),
          issue: `Price changed to ₹${menuItem.price}`,
        });
      }
    }

    return res.json({
      success: true,
      valid: issues.length === 0,
      issues,
    });
  }),
);

// ─── POST /api/web-ordering/bill/request ──────────────────────────────────────
router.post('/bill/request', writeLimiter, async (req, res) => {
  try {
    const { storeSlug, tableNumber, sessionToken } = req.body;

    if (!storeSlug || !tableNumber) {
      return res.status(400).json({ success: false, message: 'storeSlug and tableNumber are required' });
    }

    const StoreModel = require('../models/Store').default || require('../models/Store');
    const store = await StoreModel.findOne({ slug: storeSlug, isActive: true }).select('_id name merchantId').lean();
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Find the active table session
    const TableSession = require('../models/TableSession').default || require('../models/TableSession').TableSession;
    const session = await TableSession.findOne({
      storeId: store._id,
      tableNumber: Number(tableNumber),
      status: 'open',
    }).lean();

    if (!session) {
      return res.status(404).json({ success: false, message: 'No active session for this table' });
    }

    // Validate sessionToken if both caller and session have one
    if (sessionToken && session.sessionToken && session.sessionToken !== sessionToken) {
      return res.status(403).json({ success: false, message: 'Invalid session token' });
    }

    // Mark session as billed
    await TableSession.findByIdAndUpdate(session._id, {
      status: 'billed',
      billedAt: new Date(),
    });

    // Emit socket event to merchant for bill request
    const io = req.app.get('io');
    if (io) {
      const merchantRoomId = (store as IStoreDoc).merchantId;
      if (merchantRoomId) {
        io.to(`merchant-${merchantRoomId}`).emit('bill:requested', {
          tableNumber,
          sessionId: session._id,
          items: session.items,
          totalAmount: session.totalAmount,
          requestedAt: new Date(),
        });
      }
    }

    res.json({
      success: true,
      message: 'Bill requested successfully',
      data: { sessionId: session._id, totalAmount: session.totalAmount },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to request bill' });
  }
});

// ─── GET /api/web-ordering/orders/history ─────────────────────────────────────
router.get(
  '/orders/history',
  asyncHandler(async (req: Request, res: Response) => {
    // B6 Sprint-1 audit: prefer userId (post-B6) with phone fallback (pre-B6).
    // Consumer app with JWT → sees orders linked to their User._id AND their
    // phone (covers the edge case of orders placed while phone was different).
    // Legacy session-token flow → unchanged phone-only behaviour.
    const customer = await resolveCustomerIdentityFromRequest(req);
    if (!customer) return res.status(401).json({ success: false, message: 'Session required' });
    const filter = ownerFilter(customer);

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const skip = (page - 1) * limit;

    const [rawOrders, total] = await Promise.all([
      WebOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('orderNumber storeSlug storeName storeId items total status paymentStatus createdAt scheduledFor')
        .lean(),
      WebOrder.countDocuments(filter),
    ]);

    // Gather unique storeIds to fetch logos in one query
    const storeIds = [...new Set(rawOrders.map((o: any) => String(o.storeId)).filter(Boolean))];
    const storeLogoMap: Record<string, string | null> = {};
    if (storeIds.length > 0) {
      const stores = await Store.find({ _id: { $in: storeIds } })
        .select('_id logo')
        .lean();
      stores.forEach((s: any) => {
        storeLogoMap[String(s._id)] = s.logo || null;
      });
    }

    const orders = rawOrders.map((o: any) => ({
      orderNumber: o.orderNumber,
      storeSlug: o.storeSlug,
      storeName: o.storeName,
      storeLogo: storeLogoMap[String(o.storeId)] ?? null,
      items: (o.items || []).map((i: any) => ({
        // NW-CRIT-009 FIX: include menuItemId and price so the frontend can
        // pre-populate the reorder cart without stale menu lookups or price:0 items.
        menuItemId: i.menuItemId ?? i.itemId ?? null,
        name: i.name,
        quantity: i.quantity,
        price: typeof i.price === 'number' ? i.price : (i.unitPrice ?? 0),
      })),
      total: o.total,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      scheduledFor: o.scheduledFor ?? null,
    }));

    return res.json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, hasNext: skip + orders.length < total },
      },
    });
  }),
);

// ─── POST /api/web-ordering/order/:orderNumber/rate ───────────────────────────
router.post(
  '/order/:orderNumber/rate',
  writeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionToken, rating, comment } = req.body;
    const { orderNumber } = req.params;

    if (!rating) return res.status(400).json({ success: false, message: 'Missing fields' });

    // B6 Sprint-1 audit: ownership via userId (post-B6) OR phone (legacy).
    const customer = await resolveCustomerIdentityFromRequest(req, sessionToken);
    if (!customer) return res.status(401).json({ success: false, message: 'Session required' });

    const order = await WebOrder.findOneAndUpdate(
      { orderNumber, ...ownerFilter(customer), rating: { $exists: false } },
      {
        $set: {
          rating: {
            score: Math.min(5, Math.max(1, rating)),
            comment: comment?.slice(0, 500) || '',
            ratedAt: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!order) return res.json({ success: false, message: 'Order not found or already rated' });
    return res.json({ success: true, message: 'Thank you for your feedback!' });
  }),
);

// ─── POST /api/web-ordering/order/:orderNumber/cancel ─────────────────────────
router.post(
  '/order/:orderNumber/cancel',
  writeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionToken, reason } = req.body;
    const { orderNumber } = req.params;

    // B6 Sprint-1 audit: ownership via userId (post-B6) OR phone (legacy).
    const customer = await resolveCustomerIdentityFromRequest(req, sessionToken);
    if (!customer) return res.status(401).json({ success: false, message: 'Session required' });

    const cancelableStatuses = ['pending_payment', 'confirmed'];

    const order = await WebOrder.findOneAndUpdate(
      { orderNumber, ...ownerFilter(customer), status: { $in: cancelableStatuses } },
      { $set: { status: 'cancelled', cancelReason: reason || 'Customer request', cancelledAt: new Date() } },
      { new: true },
    );

    if (!order) return res.json({ success: false, message: 'Order cannot be cancelled (already being prepared)' });

    // Notify merchant via socket
    const io = req.app.get('io');
    if (io) {
      const cancelStore = await Store.findById(order.storeId).select('merchantId').lean();
      const merchantRoomId = (cancelStore as IStoreDoc)?.merchantId;
      if (merchantRoomId) {
        io.to(`merchant-${merchantRoomId}`).emit('web-order:cancelled', { orderNumber, reason });
      }
    }

    return res.json({ success: true, message: 'Order cancelled successfully' });
  }),
);

// ─── PATCH /api/web-ordering/store/:storeSlug/menu/item/:itemId/availability ───
// Merchant toggles an item as available or unavailable (e.g. sold out mid-service).
// Requires merchant JWT. Invalidates the menu Redis cache and emits a socket event
// so every open customer browser updates without a refresh.
router.patch(
  '/store/:storeSlug/menu/item/:itemId/availability',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug, itemId } = req.params;
    const { available } = req.body as { available?: unknown };

    if (typeof available !== 'boolean') {
      return sendErrorResponse(res, 400, '`available` must be a boolean', 'INVALID_BODY');
    }

    // Resolve store
    const store = await Store.findOne({ slug: storeSlug, isActive: true }).select('_id merchantId').lean();
    if (!store) {
      return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');
    }

    // Find menu and locate the item across all categories
    const menu = await Menu.findOne({ storeId: (store as IStoreDoc)._id, isActive: true });
    if (!menu) {
      return sendErrorResponse(res, 404, 'Menu not found', 'MENU_NOT_FOUND');
    }

    let found = false;
    for (const category of menu.categories) {
      const item = category.items.find((i: { _id?: { toString(): string } }) => i._id?.toString() === itemId);
      if (item) {
        (item as { isAvailable?: boolean }).isAvailable = available;
        found = true;
        break;
      }
    }

    if (!found) {
      return sendErrorResponse(res, 404, 'Menu item not found', 'ITEM_NOT_FOUND');
    }

    await menu.save();

    // Invalidate the menu cache so the next GET fetches fresh data
    const cacheKey = `web_menu:${storeSlug}`;
    await redisService.del(cacheKey);

    // Emit real-time availability update to all customers viewing this store's menu.
    // Customers join the room `store-<storeId>` on the socket connection.
    const io = req.app.get('io');
    if (io) {
      const storeId = (store as IStoreDoc)._id?.toString();
      io.to(`store-${storeId}`).emit('menu:item-availability', { itemId, available });
    }

    return res.json({ success: true, itemId, available });
  }),
);

// ─── POST /api/web-ordering/coins/credit ──────────────────────────────────────
// Credit REZ Coins for web QR orders
router.post(
  '/coins/credit',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionToken, orderNumber } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ success: false, message: 'orderNumber required' });
    }

    // CANONICAL CASHBACK GATE — when the canonical subscriber owns cashback
    // (CANONICAL_CASHBACK_MODE=primary), this legacy credit path short-
    // circuits. Returns success with coinsEarned:0 + a body flag so the
    // frontend can distinguish 'no credit happened on this endpoint' from
    // 'this order had no eligible credit'. The actual credit is handled
    // asynchronously by the cashback subscriber reacting to the
    // canonical.order.placed event.
    if (process.env.CANONICAL_CASHBACK_MODE === 'primary') {
      logger.debug('[WEB ORDER] legacy coin-credit short-circuited (canonical=primary)', {
        orderNumber,
      });
      return res.json({
        success: true,
        coinsEarned: 0,
        credited: 'canonical',
        message: 'Cashback handled via canonical event bus',
      });
    }

    // B6 Sprint-1 audit: resolve identity (userId when JWT, phone otherwise).
    const customer = await resolveCustomerIdentityFromRequest(req, sessionToken);
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Session required' });
    }

    // Ownership via userId (post-B6) OR customerPhone (legacy).
    const order = await WebOrder.findOne({ orderNumber, ...ownerFilter(customer) });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, message: 'Order not paid yet' });
    }
    if (order.coinsCredited) {
      return res.json({ success: true, coinsEarned: 0, message: 'Already credited' });
    }

    // Resolve target user for wallet credit. 3-tier, mirrors the B7
    // creditCustomerCoinsForBill migration (commit 72e60b34):
    //   1. order.userId (post-B6 wire-up persists it at create time)
    //   2. customer.userId (JWT path already knows it)
    //   3. resolveCustomerIdentity fallback (upserts from phone for
    //      unmigrated pre-B6 orders — forward-heals order.userId).
    let userIdForCredit: string | null = null;
    if (order.userId) {
      userIdForCredit = order.userId.toString();
    } else if (customer.userId) {
      userIdForCredit = customer.userId;
    } else {
      const identity = await resolveCustomerIdentity({
        customerPhone: customer.phone,
        source: 'web',
      });
      if (identity.customerId) {
        userIdForCredit = identity.customerId;
        // Forward-heal the order document so subsequent operations land
        // in Tier 1. Best-effort — failure is non-fatal and the credit
        // still proceeds below.
        try {
          order.userId = new mongoose.Types.ObjectId(identity.customerId);
        } catch {
          /* ObjectId cast fail — carry on with string userIdForCredit. */
        }
      }
    }
    if (!userIdForCredit) {
      return res.json({ success: true, coinsEarned: 0, message: 'No app account found' });
    }

    // Credit coins — use canonical coinsEarned() from @rez/shared
    // CRITICAL-010 FIX: Replaced hardcoded Math.floor(order.total * 1) with coinsEarned(order.total)
    const coinsToEarn = coinsEarned(order.total);
    try {
      const walletService = require('../services/walletService').default || require('../services/walletService');
      await walletService.credit({
        userId: userIdForCredit,
        amount: coinsToEarn,
        source: 'web_qr_order',
        description: `REZ Coins for web order ${orderNumber}`,
        operationType: 'store_payment_reward',
        referenceId: String(order._id),
        referenceModel: 'WebOrder',
        metadata: { idempotencyKey: `web_coin_credit:${orderNumber}` },
      });
    } catch (err: any) {
      // If idempotency catches it, coins were already credited
      if (err.message?.includes('idempotency') || err.code === 11000) {
        order.coinsCredited = true;
        await order.save();
        return res.json({ success: true, coinsEarned: 0, message: 'Already credited' });
      }
      throw err;
    }

    order.coinsCredited = true;
    await order.save();

    return res.json({ success: true, coinsEarned: coinsToEarn });
  }),
);

// ─── POST /api/web-ordering/coupon/validate ───────────────────────────────────
// Validate and apply coupon for web ordering
router.post(
  '/coupon/validate',
  writeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionToken, couponCode, storeSlug, subtotal } = req.body;
    if (!couponCode || !storeSlug) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const phone = await resolveCustomerPhone(req, sessionToken);
    if (!phone) return res.status(401).json({ success: false, message: 'Session required' });

    const { Coupon } = require('../models/Coupon');

    const store = await Store.findOne({ slug: storeSlug, isActive: true }).select('_id').lean();
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });

    const coupon = await Coupon.findOne({
      couponCode: couponCode.toUpperCase(),
      status: 'active',
      validFrom: { $lte: new Date() },
      validTo: { $gte: new Date() },
      $or: [{ 'applicableTo.stores': { $size: 0 } }, { 'applicableTo.stores': (store as IStoreDoc)._id }],
    }).lean();

    if (!coupon) {
      return res.json({ success: false, message: 'Invalid or expired coupon code' });
    }

    // Check min order amount
    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return res.json({ success: false, message: `Minimum order ₹${coupon.minOrderValue} required` });
    }

    // Check usage limit (0 means unlimited)
    if (coupon.usageLimit?.totalUsage > 0 && (coupon.usageLimit?.usedCount || 0) >= coupon.usageLimit.totalUsage) {
      return res.json({ success: false, message: 'Coupon usage limit reached' });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.round(subtotal * (coupon.discountValue / 100));
      if (coupon.maxDiscountCap && coupon.maxDiscountCap > 0) {
        discount = Math.min(discount, coupon.maxDiscountCap);
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    return res.json({
      success: true,
      data: {
        code: coupon.couponCode,
        discount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description || `Save ₹${discount}`,
      },
    });
  }),
);

// ─── GROUP ORDERING ────────────────────────────────────────────────────────────
//
// Flow: Creator scans QR → creates group → shares 4-digit PIN → others join →
//       each member adds items → creator finalizes → single checkout.
//
// All group state is stored in Redis with a 2-hour TTL.
// Key schema: group_order:<groupId>  →  JSON-serialized GroupSession

interface GroupOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customisation?: string;
}

interface GroupMember {
  name: string;
  joinedAt: string;
  items: GroupOrderItem[];
}

interface GroupSession {
  groupId: string;
  pin: string; // bcrypt hash of 4-digit PIN
  storeSlug: string;
  tableNumber?: string;
  creatorName: string;
  creatorPhone?: string;
  members: GroupMember[];
  status: 'open' | 'finalized';
  createdAt: string;
}

const GROUP_TTL = 7200; // 2 hours in seconds
const groupLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

function generateGroupId(): string {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

function generateGroupPin(): string {
  return String(crypto.randomInt(1000, 10000)); // 4-digit PIN
}

async function getGroupSession(groupId: string): Promise<GroupSession | null> {
  const key = `group_order:${groupId}`;
  return redisService.get<GroupSession>(key);
}

async function saveGroupSession(session: GroupSession): Promise<void> {
  const key = `group_order:${session.groupId}`;
  await redisService.set(key, session, GROUP_TTL);
}

// ─── POST /api/web-ordering/group/create ──────────────────────────────────────
router.post(
  '/group/create',
  groupLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug, tableNumber, creatorName, creatorPhone } = req.body;

    if (!storeSlug || typeof storeSlug !== 'string') {
      return sendErrorResponse(res, 400, 'storeSlug is required', 'MISSING_STORE_SLUG');
    }
    if (!creatorName || typeof creatorName !== 'string' || creatorName.trim().length === 0) {
      return sendErrorResponse(res, 400, 'creatorName is required', 'MISSING_CREATOR_NAME');
    }

    const store = await Store.findOne({ slug: storeSlug, isActive: true }).select('slug').lean();
    if (!store) {
      return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');
    }

    const groupId = generateGroupId();
    const pin = generateGroupPin();
    const hashedPin = await bcrypt.hash(pin, 8);

    const session: GroupSession = {
      groupId,
      pin: hashedPin,
      storeSlug,
      tableNumber: tableNumber || undefined,
      creatorName: creatorName.trim(),
      creatorPhone: creatorPhone || undefined,
      members: [
        {
          name: creatorName.trim(),
          joinedAt: new Date().toISOString(),
          items: [],
        },
      ],
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    await saveGroupSession(session);

    const baseUrl = process.env.WEB_MENU_URL || 'https://menu.rez.money';
    const shareLink = `${baseUrl}/${storeSlug}?group=${groupId}&pin=${pin}${tableNumber ? `&table=${tableNumber}` : ''}`;

    logger.info(`[GROUP ORDER] Created group ${groupId} for store ${storeSlug}`);

    return res.json({
      success: true,
      data: {
        groupId,
        pin,
        shareLink,
        tableNumber: tableNumber || null,
        storeSlug,
        creatorName: creatorName.trim(),
      },
    });
  }),
);

// ─── POST /api/web-ordering/group/join ────────────────────────────────────────
router.post(
  '/group/join',
  groupLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { groupId, pin, memberName } = req.body;

    if (!groupId || !pin || !memberName) {
      return sendErrorResponse(res, 400, 'groupId, pin, and memberName are required', 'MISSING_FIELDS');
    }

    const session = await getGroupSession(groupId);
    if (!session) {
      return sendErrorResponse(res, 404, 'Group order not found or expired', 'GROUP_NOT_FOUND');
    }
    if (session.status === 'finalized') {
      return sendErrorResponse(res, 400, 'This group order has already been finalized', 'GROUP_FINALIZED');
    }

    const pinValid = await bcrypt.compare(pin.toString(), session.pin);
    if (!pinValid) {
      return sendErrorResponse(res, 401, 'Invalid PIN', 'INVALID_PIN');
    }

    const trimmedName = memberName.trim();
    const alreadyMember = session.members.some((m) => m.name.toLowerCase() === trimmedName.toLowerCase());
    if (!alreadyMember) {
      session.members.push({ name: trimmedName, joinedAt: new Date().toISOString(), items: [] });
      await saveGroupSession(session);
    }

    logger.info(`[GROUP ORDER] ${trimmedName} joined group ${groupId}`);

    return res.json({
      success: true,
      data: {
        groupId: session.groupId,
        storeSlug: session.storeSlug,
        tableNumber: session.tableNumber || null,
        members: session.members.map((m) => ({ name: m.name, joinedAt: m.joinedAt, itemCount: m.items.length })),
        status: session.status,
      },
    });
  }),
);

// ─── GET /api/web-ordering/group/:groupId ─────────────────────────────────────
router.get(
  '/group/:groupId',
  asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;

    const session = await getGroupSession(groupId);
    if (!session) {
      return sendErrorResponse(res, 404, 'Group order not found or expired', 'GROUP_NOT_FOUND');
    }

    return res.json({
      success: true,
      data: {
        groupId: session.groupId,
        storeSlug: session.storeSlug,
        tableNumber: session.tableNumber || null,
        creatorName: session.creatorName,
        members: session.members.map((m) => ({
          name: m.name,
          joinedAt: m.joinedAt,
          itemCount: m.items.length,
          items: m.items,
        })),
        status: session.status,
        createdAt: session.createdAt,
      },
    });
  }),
);

// ─── POST /api/web-ordering/group/:groupId/add-items ──────────────────────────
router.post(
  '/group/:groupId/add-items',
  groupLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { memberName, items } = req.body;

    if (!memberName || !Array.isArray(items)) {
      return sendErrorResponse(res, 400, 'memberName and items[] are required', 'MISSING_FIELDS');
    }

    const session = await getGroupSession(groupId);
    if (!session) {
      return sendErrorResponse(res, 404, 'Group order not found or expired', 'GROUP_NOT_FOUND');
    }
    if (session.status === 'finalized') {
      return sendErrorResponse(res, 400, 'Cannot add items — group order is finalized', 'GROUP_FINALIZED');
    }

    const trimmedName = memberName.trim();
    const memberIndex = session.members.findIndex((m) => m.name.toLowerCase() === trimmedName.toLowerCase());
    if (memberIndex === -1) {
      return sendErrorResponse(res, 403, 'Member not found in this group — join first', 'MEMBER_NOT_IN_GROUP');
    }

    // SECURITY: look up canonical menu prices — never trust client-supplied prices.
    // A member could lower their own item price, misleading other group members about
    // what they owe. Overwrite with DB values so the group cart is always accurate.
    const store = await Store.findOne({ slug: session.storeSlug, isActive: true }).select('_id').lean();
    const menuItemMap = new Map<string, any>();
    if (store) {
      const menu = await Menu.findOne({ storeId: (store as IStoreDoc)._id, isActive: true }).lean();
      if (menu) {
        for (const cat of (menu as IMenuDoc).categories || []) {
          for (const item of cat.items || []) {
            menuItemMap.set(item._id.toString(), item);
          }
        }
      }
    }

    const validatedItems: GroupOrderItem[] = items
      .filter((it: any) => it.id && it.name && typeof it.quantity === 'number')
      .map((it: any) => {
        const menuItem = menuItemMap.get(String(it.id));
        return {
          id: String(it.id),
          name: menuItem ? menuItem.name : String(it.name),
          price: menuItem ? Number(menuItem.price) : Number(it.price), // canonical price takes priority
          quantity: Number(it.quantity),
          customisation: it.customisation ? String(it.customisation) : undefined,
        };
      });

    session.members[memberIndex].items = validatedItems;
    await saveGroupSession(session);

    logger.info(`[GROUP ORDER] ${trimmedName} updated items in group ${groupId}: ${validatedItems.length} items`);

    return res.json({
      success: true,
      data: {
        memberName: trimmedName,
        itemCount: validatedItems.length,
        items: validatedItems,
      },
    });
  }),
);

// ─── POST /api/web-ordering/group/:groupId/finalize ───────────────────────────
// Only the creator can finalize. Returns the merged items list ready for checkout.
router.post(
  '/group/:groupId/finalize',
  groupLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { creatorName } = req.body;

    if (!creatorName) {
      return sendErrorResponse(res, 400, 'creatorName is required', 'MISSING_FIELDS');
    }

    const session = await getGroupSession(groupId);
    if (!session) {
      return sendErrorResponse(res, 404, 'Group order not found or expired', 'GROUP_NOT_FOUND');
    }
    if (session.status === 'finalized') {
      return sendErrorResponse(res, 400, 'Group order is already finalized', 'GROUP_FINALIZED');
    }
    if (session.creatorName.toLowerCase() !== creatorName.trim().toLowerCase()) {
      return sendErrorResponse(res, 403, 'Only the creator can finalize the group order', 'NOT_CREATOR');
    }

    // Merge all members' items, combining duplicates by id+customisation
    const mergedMap = new Map<string, GroupOrderItem>();
    for (const member of session.members) {
      for (const item of member.items) {
        const mapKey = `${item.id}::${item.customisation || ''}`;
        if (mergedMap.has(mapKey)) {
          mergedMap.get(mapKey)!.quantity += item.quantity;
        } else {
          mergedMap.set(mapKey, { ...item });
        }
      }
    }
    const mergedItems = Array.from(mergedMap.values());

    session.status = 'finalized';
    await saveGroupSession(session);

    logger.info(`[GROUP ORDER] Group ${groupId} finalized by ${creatorName} — ${mergedItems.length} distinct items`);

    return res.json({
      success: true,
      data: {
        groupId: session.groupId,
        storeSlug: session.storeSlug,
        tableNumber: session.tableNumber || null,
        items: mergedItems,
        memberCount: session.members.length,
        status: 'finalized',
      },
    });
  }),
);

// ─── GET /api/web-ordering/coins/balance ──────────────────────────────────────
// Get REZ Coin balance for the current web session user.
//
// B6 Sprint-1 audit: when the caller has a JWT userId we use it directly
// (zero User lookup). Otherwise fall back to phone→User lookup. Unknown
// users return balance:0 — same as pre-patch behaviour.
router.get(
  '/coins/balance',
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await resolveCustomerIdentityFromRequest(req);
    if (!customer) return res.json({ success: true, balance: 0 });

    const { Wallet } = require('../models/Wallet');

    let userId = customer.userId;
    if (!userId) {
      // Legacy session-token flow — do the phone→User lookup just as before.
      const User = require('../models/User').default || require('../models/User').User;
      const user = await User.findOne({ phoneNumber: customer.phone }).select('_id').lean();
      if (!user) return res.json({ success: true, balance: 0 });
      userId = String((user as IUserLean)._id);
    }

    const wallet = await Wallet.findOne({ user: userId }).select('balance.available').lean();
    return res.json({ success: true, balance: (wallet as IWalletLean)?.balance?.available || 0 });
  }),
);

// ─── POST /api/web-ordering/bill/split ────────────────────────────────────────
// Split a bill equally, by item, or by custom amounts
router.post(
  '/bill/split',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber, splitType, splits, sessionToken } = req.body;

    if (!orderNumber || !splitType) {
      return sendErrorResponse(res, 400, 'orderNumber and splitType are required', 'MISSING_FIELDS');
    }
    if (!['equal', 'by-item', 'custom'].includes(splitType)) {
      return sendErrorResponse(res, 400, 'splitType must be equal, by-item, or custom', 'INVALID_SPLIT_TYPE');
    }

    // SECURITY: enforce ownership — anonymous callers must not read or write other orders' splits.
    // B6 Sprint-1 audit: prefer userId (post-B6) with phone fallback (pre-B6).
    const customer = await resolveCustomerIdentityFromRequest(req, sessionToken);
    if (!customer) return sendErrorResponse(res, 401, 'Session required', 'SESSION_REQUIRED');

    const order = await WebOrder.findOne({ orderNumber, ...ownerFilter(customer) }).lean();
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    const orderDoc = order as unknown as IWebOrderLean;
    const total = orderDoc.totalWithTip ?? orderDoc.total ?? 0;
    const baseUrl = process.env.WEB_MENU_URL || 'https://menu.rez.money';

    let splitResult: Array<{ name: string; amount: number; paymentLink: string }> = [];

    if (splitType === 'equal') {
      const { numberOfPeople } = splits || {};
      if (!numberOfPeople || numberOfPeople < 2 || numberOfPeople > 20) {
        return sendErrorResponse(res, 400, 'numberOfPeople must be between 2 and 20', 'INVALID_PEOPLE_COUNT');
      }
      const perPerson = Math.round((total / numberOfPeople) * 100) / 100;
      splitResult = Array.from({ length: numberOfPeople }, (_, i) => ({
        name: `Person ${i + 1}`,
        amount: perPerson,
        paymentLink: `${baseUrl}/pay/${orderNumber}?split=${i + 1}&amount=${perPerson}`,
      }));
    } else if (splitType === 'by-item') {
      const { items: itemAssignments } = splits || {};
      if (!Array.isArray(itemAssignments) || itemAssignments.length === 0) {
        return sendErrorResponse(res, 400, 'items array is required for by-item split', 'MISSING_ITEMS');
      }
      // Group items by assignedTo
      const personMap = new Map<string, number>();
      const gstPercent = (orderDoc.taxes ?? 0) > 0 ? (orderDoc.taxes ?? 0) / (orderDoc.subtotal ?? 0) : 0;

      for (const assignment of itemAssignments) {
        const { itemId, assignedTo, quantity = 1 } = assignment;
        const orderItem = (orderDoc.items ?? []).find(
          (i: any) => i.menuItemId?.toString() === itemId || i._id?.toString() === itemId,
        );
        if (orderItem) {
          const itemTotal = (orderItem.price ?? 0) * quantity;
          const itemWithTax = Math.round(itemTotal * (1 + gstPercent) * 100) / 100;
          personMap.set(assignedTo, (personMap.get(assignedTo) || 0) + itemWithTax);
        }
      }

      splitResult = Array.from(personMap.entries()).map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
        paymentLink: `${baseUrl}/pay/${orderNumber}?person=${encodeURIComponent(name)}&amount=${Math.round(amount * 100) / 100}`,
      }));
    } else if (splitType === 'custom') {
      const { amounts } = splits || {};
      if (!Array.isArray(amounts) || amounts.length === 0) {
        return sendErrorResponse(res, 400, 'amounts array is required for custom split', 'MISSING_AMOUNTS');
      }
      const sum = amounts.reduce((acc: number, a: any) => acc + (a.amount || 0), 0);
      const roundedSum = Math.round(sum * 100) / 100;
      const roundedTotal = Math.round(total * 100) / 100;
      if (Math.abs(roundedSum - roundedTotal) > 1) {
        return sendErrorResponse(
          res,
          400,
          `Split amounts (₹${roundedSum}) do not match order total (₹${roundedTotal})`,
          'AMOUNT_MISMATCH',
        );
      }
      splitResult = amounts.map((a: any) => ({
        name: a.name || 'Guest',
        amount: a.amount,
        paymentLink: `${baseUrl}/pay/${orderNumber}?person=${encodeURIComponent(a.name || 'Guest')}&amount=${a.amount}`,
      }));
    }

    // Persist splits on the order document — re-apply ownership filter to prevent TOCTOU.
    await WebOrder.findOneAndUpdate(
      { orderNumber, ...ownerFilter(customer) },
      {
        $set: {
          billSplits: splitResult.map((s) => ({ name: s.name, amount: s.amount, paid: false })),
        },
      },
    );

    return res.json({ success: true, data: { splits: splitResult } });
  }),
);

// ─── GET /api/web-ordering/bill/:orderNumber/split-status ─────────────────────
router.get(
  '/bill/:orderNumber/split-status',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;

    const order = await WebOrder.findOne({ orderNumber }).select('billSplits').lean();
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    const splits = ((order as unknown as IWebOrderLean).billSplits || []).map((s: IBillSplitLean) => ({
      name: s.name,
      amount: s.amount,
      paid: s.paid,
      paidAt: s.paidAt || null,
    }));

    return res.json({ success: true, data: { splits } });
  }),
);

// ─── POST /api/web-ordering/tip ───────────────────────────────────────────────
// Add a digital tip to an existing paid order
router.post(
  '/tip',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber, tipAmount, tipPercentage, sessionToken } = req.body;

    if (!orderNumber) {
      return sendErrorResponse(res, 400, 'orderNumber is required', 'MISSING_FIELDS');
    }
    if (typeof tipAmount !== 'number' || tipAmount < 0) {
      return sendErrorResponse(res, 400, 'tipAmount must be a non-negative number', 'INVALID_TIP_AMOUNT');
    }

    // SECURITY: enforce ownership — prevent anonymous callers from tipping on others' orders.
    // B6 Sprint-1 audit: userId-preferring lookup.
    const customer = await resolveCustomerIdentityFromRequest(req, sessionToken);
    if (!customer) return sendErrorResponse(res, 401, 'Session required', 'SESSION_REQUIRED');

    const order = await WebOrder.findOne({ orderNumber, ...ownerFilter(customer) });
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    if (!['paid', 'confirmed', 'preparing', 'ready', 'completed'].includes(order.status)) {
      return sendErrorResponse(res, 400, 'Tip can only be added to paid orders', 'ORDER_NOT_PAID');
    }

    const computedTip = tipAmount;
    const totalWithTip = Math.round((order.total + computedTip) * 100) / 100;

    order.tipAmount = computedTip;
    order.totalWithTip = totalWithTip;
    if (tipPercentage !== undefined) order.tipPercentage = tipPercentage;
    await order.save();

    logger.info(`[TIP] ₹${computedTip} tip added to order ${orderNumber}`);

    return res.json({ success: true, data: { success: true, totalWithTip } });
  }),
);

// ─── POST /api/web-ordering/receipt/send ──────────────────────────────────────
// Generate a digital receipt URL and optionally send it via SMS/email
router.post(
  '/receipt/send',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber, phone, email } = req.body;

    if (!orderNumber) {
      return sendErrorResponse(res, 400, 'orderNumber is required', 'MISSING_FIELDS');
    }
    // Validate phone format before passing to WhatsApp service
    if (phone !== undefined && (typeof phone !== 'string' || !/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, '')))) {
      return sendErrorResponse(res, 400, 'Invalid phone number format', 'INVALID_PHONE');
    }
    // Validate email length cap
    if (email !== undefined && (typeof email !== 'string' || email.length > 254)) {
      return sendErrorResponse(res, 400, 'Invalid email address', 'INVALID_EMAIL');
    }

    const order = await WebOrder.findOne({ orderNumber }).lean();
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    const orderDoc = order as unknown as IWebOrderLean;
    const baseUrl = process.env.WEB_MENU_URL || 'https://menu.rez.money';
    // Use the same secret resolution as computeReceiptToken() so generated URLs
    // are always verifiable by the GET /order/:orderNumber route.
    const receiptSecret = process.env.RECEIPT_TOKEN_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!receiptSecret) {
      logger.error('[RECEIPT] Neither RECEIPT_TOKEN_SECRET nor RAZORPAY_KEY_SECRET is configured');
      return sendErrorResponse(res, 500, 'Receipt service not configured', 'CONFIG_ERROR');
    }
    const receiptToken = crypto.createHmac('sha256', receiptSecret).update(orderNumber).digest('hex').slice(0, 16);
    const receiptUrl = `${baseUrl}/receipt/${orderNumber}?t=${receiptToken}`;

    // Send WhatsApp receipt and/or email (best-effort, non-blocking)
    setImmediate(async () => {
      if (phone) {
        try {
          const msg =
            `🧾 *Your REZ Receipt*\n\n` +
            `Store: ${orderDoc.storeName}\n` +
            `Order: #${orderNumber}\n` +
            `Total: ₹${orderDoc.totalWithTip ?? orderDoc.total}\n\n` +
            `View receipt: ${receiptUrl}`;
          await whatsappOrderingService.sendMessage(phone, msg);
          // PII: log only the last 4 digits of the customer phone, never the
          // full number — log aggregators retain this indefinitely.
          const masked = phone.length >= 4 ? `***${phone.slice(-4)}` : '***';
          logger.info(`[RECEIPT] WhatsApp receipt sent for order ${orderNumber} to ${masked}`);
        } catch (err) {
          logger.warn(`[RECEIPT] WhatsApp send failed for order ${orderNumber}:`, err);
        }
      }
      if (email) {
        logger.info(`[RECEIPT] Email receipt queued for order ${orderNumber} to ${email}`);
        // TODO: plug in email provider (e.g. SendGrid / Nodemailer) here
      }
    });

    logger.info(`[RECEIPT] Generated receipt URL for order ${orderNumber}`);

    return res.json({
      success: true,
      data: {
        success: true,
        receiptUrl,
        orderNumber,
        storeName: orderDoc.storeName,
        total: orderDoc.totalWithTip ?? orderDoc.total,
      },
    });
  }),
);

// ─── Donation ─────────────────────────────────────────────────────────────────
// POST /api/web-ordering/order/:orderNumber/donate
// Records a donation amount on an existing order.
router.post(
  '/order/:orderNumber/donate',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { donationAmount, charityName, sessionToken } = req.body;

    if (!orderNumber) return sendErrorResponse(res, 400, 'orderNumber is required', 'MISSING_FIELDS');
    if (typeof donationAmount !== 'number' || donationAmount <= 0) {
      return sendErrorResponse(res, 400, 'donationAmount must be a positive number', 'INVALID_DONATION');
    }

    // B6 Sprint-1 audit: userId-preferring lookup.
    const customer = await resolveCustomerIdentityFromRequest(req, sessionToken);
    if (!customer) return sendErrorResponse(res, 401, 'Session required', 'SESSION_REQUIRED');

    const order = await WebOrder.findOne({ orderNumber, ...ownerFilter(customer) });
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    // Store donation metadata on the order (extend model fields via any cast)
    const orderDoc = order as unknown as IWebOrderLean;
    orderDoc.donationAmount = donationAmount;
    orderDoc.charityName = charityName || 'Feed the Hungry';
    await orderDoc.save!();

    logger.info(`[DONATION] ₹${donationAmount} donation recorded for order ${orderNumber} → ${charityName}`);

    return res.json({
      success: true,
      message: `Donation of ₹${donationAmount} recorded. Thank you!`,
      data: { donationAmount, charityName: orderDoc.charityName },
    });
  }),
);

// ─── Parcel / Pack Leftovers ──────────────────────────────────────────────────
// POST /api/web-ordering/order/:orderNumber/parcel
// Records a parcel (leftover packing) request for a dine-in order.
router.post(
  '/order/:orderNumber/parcel',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { itemIds, notes, sessionToken } = req.body; // itemIds: string[], notes: string

    if (!orderNumber) return sendErrorResponse(res, 400, 'orderNumber is required', 'MISSING_FIELDS');

    // B6 Sprint-1 audit: userId-preferring lookup.
    const customer = await resolveCustomerIdentityFromRequest(req, sessionToken);
    if (!customer) return sendErrorResponse(res, 401, 'Session required', 'SESSION_REQUIRED');

    const order = await WebOrder.findOne({ orderNumber, ...ownerFilter(customer) });
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    const orderDoc = order as unknown as IWebOrderLean;
    orderDoc.parcelRequest = {
      requestedAt: new Date(),
      itemIds: itemIds || [],
      notes: notes || '',
      status: 'pending',
    };
    await orderDoc.save!();

    logger.info(`[PARCEL] Pack request for order ${orderNumber}, items: ${(itemIds || []).join(', ')}`);

    // Emit socket event to merchant
    setImmediate(async () => {
      try {
        const io = req.app.get('io');
        if (io) {
          const parcelStore = await Store.findById(order.storeId).select('merchantId').lean();
          const merchantRoomId = (parcelStore as IStoreDoc)?.merchantId;
          if (merchantRoomId) {
            io.to(`merchant-${merchantRoomId}`).emit('parcel-request', {
              orderNumber,
              tableNumber: order.tableNumber,
              customerName: order.customerName,
              itemIds: itemIds || [],
              notes: notes || '',
              requestedAt: new Date().toISOString(),
            });
          }
        }
      } catch (socketErr) {
        logger.warn('[PARCEL] Socket emit failed:', socketErr instanceof Error ? socketErr.message : String(socketErr));
      }
    });

    return res.json({
      success: true,
      message: 'Parcel request sent to the kitchen!',
      data: { orderNumber, status: 'pending' },
    });
  }),
);

// ─── Live Order Status Update ─────────────────────────────────────────────────
// POST /api/web-ordering/order/:orderNumber/update-status
// Extracted to webOrderingController.updateOrderStatus

router.post(
  '/order/:orderNumber/update-status',
  orderLimiter,
  requireInternalToken,
  asyncHandler(webOrderingController.updateOrderStatus),
);

// ─── AI Menu Recommendations ──────────────────────────────────────────────────
// GET /api/web-ordering/recommendations?storeSlug=X&phone=Y
// Returns up to 5 recommended items:
//   - If phone provided + past orders exist: items the customer ordered before
//     (prioritised by frequency) + popular items to fill remaining slots.
//   - Otherwise: most popular items (by order frequency across all WebOrders).

router.get(
  '/recommendations',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug, phone } = req.query as { storeSlug?: string; phone?: string };

    if (!storeSlug) return sendErrorResponse(res, 400, 'storeSlug is required', 'MISSING_FIELDS');

    const store = await Store.findOne({ slug: storeSlug, isActive: true }).select('_id name').lean();
    if (!store) return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');

    const storeId = (store as IStoreDoc)._id;

    // ── Build a frequency map of item names → order count ─────────────────
    // Limit the DB scan to the last 500 orders for this store to stay fast.
    const recentOrders = await WebOrder.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(500)
      .select('items customerPhone')
      .lean();

    // Popularity map: itemName → count across all orders
    const popularityMap = new Map<
      string,
      { count: number; image: string | null; price: number; isVeg: boolean; menuItemId: string }
    >();
    for (const ord of recentOrders) {
      for (const item of (ord as unknown as IWebOrderLean).items as IWebOrderItem[]) {
        const existing = popularityMap.get(item.name);
        if (existing) {
          existing.count += item.quantity;
        } else {
          popularityMap.set(item.name, {
            count: item.quantity,
            image: (item as IWebOrderItemLean).image || null,
            price: item.price,
            isVeg: false,
            menuItemId: item.menuItemId || '',
          });
        }
      }
    }

    // ── If phone provided, pull customer's own order history ──────────────
    const normalisePhone = (p: string) => p.replace(/\D/g, '').slice(-10);
    let personalItems: Array<{ name: string; count: number; image: string | null; price: number; menuItemId: string }> =
      [];

    if (phone) {
      const normPhone = normalisePhone(phone as string);
      const customerOrders = recentOrders.filter(
        (o) => normalisePhone((o as unknown as IWebOrderLean).customerPhone || '') === normPhone,
      );

      const personalMap = new Map<string, { count: number; image: string | null; price: number; menuItemId: string }>();
      for (const ord of customerOrders) {
        for (const item of (ord as unknown as IWebOrderLean).items as IWebOrderItem[]) {
          const ex = personalMap.get(item.name);
          if (ex) {
            ex.count += item.quantity;
          } else {
            personalMap.set(item.name, {
              count: item.quantity,
              image: (item as IWebOrderItemLean).image || null,
              price: item.price,
              menuItemId: item.menuItemId || '',
            });
          }
        }
      }
      personalItems = Array.from(personalMap.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.count - a.count);
    }

    // ── Fetch full menu to enrich with live data (availability, image, veg) ─
    const menu = await Menu.findOne({ storeId, isActive: true }).lean();
    const menuItemLookup = new Map<string, any>();
    if (menu) {
      for (const cat of (menu as IMenuDoc).categories ?? []) {
        for (const item of cat.items ?? []) {
          if (item.isAvailable !== false && !item.is86d) {
            menuItemLookup.set(item.name ?? '', item);
            if (item._id) menuItemLookup.set(String(item._id), item);
          }
        }
      }
    }

    const TOP_N = 5;
    const results: Array<{
      id: string;
      name: string;
      price: number;
      image: string | null;
      isVeg: boolean;
      description: string;
      orderCount: number;
      source: 'personal' | 'popular';
    }> = [];

    const added = new Set<string>();

    const buildResult = (
      name: string,
      count: number,
      fallbackImage: string | null,
      fallbackPrice: number,
      fallbackMenuItemId: string,
      source: 'personal' | 'popular',
    ) => {
      if (added.has(name)) return;
      const liveItem = menuItemLookup.get(name) || (fallbackMenuItemId ? menuItemLookup.get(fallbackMenuItemId) : null);
      if (!liveItem) return; // item no longer on menu or unavailable — skip

      added.add(name);
      results.push({
        id: String(liveItem._id),
        name: liveItem.name,
        price: liveItem.price ?? fallbackPrice,
        image: liveItem.image || fallbackImage,
        isVeg: liveItem.dietaryInfo?.isVegetarian ?? false,
        description: liveItem.description || '',
        orderCount: count,
        source,
      });
    };

    // Personal first
    for (const item of personalItems) {
      if (results.length >= TOP_N) break;
      buildResult(item.name, item.count, item.image, item.price, item.menuItemId, 'personal');
    }

    // Pad with popular items if needed
    if (results.length < TOP_N) {
      const popular = Array.from(popularityMap.entries())
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.count - a.count);

      for (const item of popular) {
        if (results.length >= TOP_N) break;
        buildResult(item.name, item.count, item.image, item.price, item.menuItemId, 'popular');
      }
    }

    const isPersonalised = personalItems.length > 0;

    return res.json({
      success: true,
      data: {
        items: results,
        isPersonalised,
        label: isPersonalised ? 'Recommended for You' : 'Popular Items',
      },
    });
  }),
);

// ─── Call Waiter ──────────────────────────────────────────────────────────────
// POST /api/web-ordering/waiter/call
// Sends a waiter notification for a given store + table.
router.post(
  '/waiter/call',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug, tableNumber, reason: rawWaiterReason, orderNumber } = req.body;

    // Trim and cap reason at 200 chars to prevent oversized Redis writes
    const reason = typeof rawWaiterReason === 'string' ? rawWaiterReason.trim().slice(0, 200) : undefined;

    if (!storeSlug) return sendErrorResponse(res, 400, 'storeSlug is required', 'MISSING_FIELDS');

    const store = await Store.findOne({ slug: storeSlug }).lean();
    if (!store) return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');

    const requestId = `WAITER-${Date.now().toString(36).toUpperCase()}`;

    // Persist to Redis if available (staff dashboard can poll this)
    try {
      await redisService.set(
        `waiter:${storeSlug}:${tableNumber || 'unknown'}:${requestId}`,
        JSON.stringify({
          storeSlug,
          tableNumber,
          reason: reason || 'Need assistance',
          orderNumber,
          requestedAt: new Date(),
        }),
        300, // expire in 5 minutes
      );
    } catch {
      // Non-critical — Redis may be unavailable in dev
    }

    logger.info(`[WAITER] Call request: store=${storeSlug} table=${tableNumber} reason="${reason}" reqId=${requestId}`);

    // Emit socket event to merchant
    setImmediate(() => {
      try {
        const io = req.app.get('io');
        if (io) {
          const merchantRoomId = (store as IStoreDoc).merchantId;
          if (merchantRoomId) {
            io.to(`merchant-${merchantRoomId}`).emit('waiter-call', {
              storeSlug,
              tableNumber: tableNumber || null,
              reason: reason || 'Need assistance',
              orderNumber: orderNumber || null,
              requestId,
              requestedAt: new Date().toISOString(),
            });
          }
        }
      } catch (socketErr) {
        logger.warn('[WAITER] Socket emit failed:', socketErr instanceof Error ? socketErr.message : String(socketErr));
      }
    });

    return res.json({
      success: true,
      message: 'Staff has been notified!',
      data: { requestId, reason: reason || 'Need assistance' },
    });
  }),
);

// ─── GET /api/web-ordering/waiter/call/:requestId/status ─────────────────────
// Polls the current status of a waiter call from Redis.
router.get(
  '/waiter/call/:requestId/status',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { storeSlug, tableNumber } = req.query as { storeSlug?: string; tableNumber?: string };

    if (!requestId) return sendErrorResponse(res, 400, 'requestId is required', 'MISSING_FIELDS');

    // Validate requestId format to prevent Redis key injection
    if (!/^WAITER-[A-Z0-9]+$/.test(requestId)) {
      return sendErrorResponse(res, 400, 'Invalid requestId format', 'INVALID_REQUEST_ID');
    }

    // Try to find the Redis key — we need storeSlug+tableNumber from client as hints
    let status: 'pending' | 'acknowledged' | 'resolved' = 'pending';

    try {
      // Look up by requestId suffix across likely key patterns
      const key =
        storeSlug && tableNumber ? `waiter:${storeSlug}:${tableNumber}:${requestId}` : `waiter:*:*:${requestId}`;

      const raw = await redisService.get(key.includes('*') ? `waiter:${requestId}` : key);
      if (raw) {
        const parsed = JSON.parse(raw as string);
        status = parsed.status ?? 'pending';
      }
    } catch {
      // Redis unavailable — return pending
    }

    return res.json({ success: true, data: { requestId, status } });
  }),
);

// ─── GET /api/web-ordering/store/:storeSlug/coupons ──────────────────────────
// Returns active public coupons for a store (no auth required).
router.get(
  '/store/:storeSlug/coupons',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;
    if (!storeSlug) return sendErrorResponse(res, 400, 'storeSlug is required', 'MISSING_FIELDS');

    // Validate slug format to prevent DB query injection via crafted slugs
    if (!/^[a-z0-9-]{2,60}$/.test(storeSlug)) {
      return sendErrorResponse(res, 400, 'Invalid store slug format', 'INVALID_STORE_SLUG');
    }

    // Serve from Redis cache (60 s TTL) to avoid hammering the DB on busy stores
    const couponCacheKey = `coupons:${storeSlug}`;
    const cachedCoupons = await redisService.get<any>(couponCacheKey);
    if (cachedCoupons) {
      return res.json({ success: true, data: cachedCoupons });
    }

    const store = await Store.findOne({ slug: storeSlug, isActive: true }).select('_id').lean();
    if (!store) return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');

    const { Coupon } = require('../models/Coupon');
    const now = new Date();
    const coupons = await Coupon.find({
      storeId: (store as IStoreDoc)._id,
      isActive: true,
      $or: [{ expiryDate: { $gt: now } }, { expiryDate: null }],
    })
      .select('couponCode discountType discountValue minOrderValue maxDiscountCap description expiryDate')
      .lean();

    // Cache for 60 seconds — best-effort, ignore Redis errors
    await redisService.set(couponCacheKey, coupons, 60).catch(() => {});

    return res.json({ success: true, data: coupons });
  }),
);

// ─── POST /api/web-ordering/orders/:orderNumber/cancel ────────────────────────
// Customer-initiated cancellation. Auth required (order owner only).
// Only allowed when status is pending_payment or confirmed (FSM guard).
router.post(
  '/orders/:orderNumber/cancel',
  writeLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token is required' });
    }
    const token = authHeader.slice(7);
    try {
      const decoded = verifyToken(token);
      (req as unknown as AuthenticatedRequest).user = {
        _id: decoded.userId,
        role: decoded.role as 'user' | 'admin' | 'merchant' | 'support' | 'operator' | 'super_admin' | 'consumer',
      } as unknown as IUser & IAuthUser;
      (req as unknown as AuthenticatedRequest).userId = decoded.userId;
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
  },
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { reason: rawReason } = req.body as { reason: unknown };
    const userId = (req as unknown as AuthenticatedRequest).user?.id as string | undefined;

    // Validate reason
    if (!rawReason || typeof rawReason !== 'string' || rawReason.trim().length === 0) {
      return sendErrorResponse(res, 400, 'reason is required', 'MISSING_FIELDS');
    }
    const reason = rawReason.trim().slice(0, 200);

    const order = await WebOrder.findOne({ orderNumber });
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    // Ownership check: must match userId OR customerPhone on the JWT
    const userPhone = (req as unknown as AuthenticatedRequest).user?.phone as string | undefined;
    const ownerById = userId && order.userId && order.userId.toString() === userId;
    const ownerByPhone = userPhone && order.customerPhone === userPhone;
    if (!ownerById && !ownerByPhone) {
      return sendErrorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    // FSM guard: can only cancel before merchant starts preparing
    const cancellableStatuses: Array<IWebOrder['status']> = ['pending_payment', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      return sendErrorResponse(res, 409, 'Cannot cancel — order is already being prepared', 'CANCEL_TOO_LATE');
    }

    // Apply cancellation
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    const refundInitiated = order.paymentStatus === 'paid';
    if (refundInitiated) {
      order.refundStatus = 'pending';
    }

    await order.save();

    logger.info(`[CANCEL] Order ${orderNumber} cancelled by customer. Reason: ${reason}`);

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.emit('web-order:status-update', { orderNumber, status: 'cancelled' });
      if (refundInitiated) {
        io.emit('order:refund-pending', { orderNumber, customerPhone: order.customerPhone });
      }
    }

    // Fire-and-forget WhatsApp notification to customer
    const cancelMsg = refundInitiated
      ? `Your order #${orderNumber} at ${order.storeName} has been cancelled. A refund will be processed in 3-5 business days.`
      : `Your order #${orderNumber} at ${order.storeName} has been cancelled.`;
    whatsappOrderingService.sendMessage(order.customerPhone, cancelMsg).catch(() => {});

    return res.json({ success: true, refundInitiated });
  }),
);

// ─── POST /api/web-ordering/orders/:orderNumber/dispute ───────────────────────
// Submits a dispute for a web order. Auth required (order owner only).
router.post(
  '/orders/:orderNumber/dispute',
  writeLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token is required' });
    }
    const token = authHeader.slice(7);
    try {
      const decoded = verifyToken(token);
      (req as unknown as AuthenticatedRequest).user = {
        _id: decoded.userId,
        role: decoded.role as 'user' | 'admin' | 'merchant' | 'support' | 'operator' | 'super_admin' | 'consumer',
      } as unknown as IUser & IAuthUser;
      (req as unknown as AuthenticatedRequest).userId = decoded.userId;
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
  },
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { reason: rawReason, details: rawDetails } = req.body as { reason: string; details?: string };
    const userId = (req as unknown as AuthenticatedRequest).user?.id;

    // Validate and sanitize reason
    if (!rawReason || typeof rawReason !== 'string' || rawReason.trim().length === 0) {
      return sendErrorResponse(res, 400, 'reason is required', 'MISSING_FIELDS');
    }
    const reason = rawReason.trim().slice(0, 500);

    // Validate and sanitize optional details
    if (rawDetails !== undefined && typeof rawDetails !== 'string') {
      return sendErrorResponse(res, 400, 'details must be a string', 'INVALID_DETAILS');
    }
    const details = (rawDetails ?? '').trim().slice(0, 2000);

    const order = await WebOrder.findOne({ orderNumber });
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    // Only the order owner may dispute
    if (
      userId &&
      (order as unknown as IWebOrderLean).userId &&
      String((order as unknown as IWebOrderLean).userId) !== userId
    ) {
      return sendErrorResponse(res, 403, 'Forbidden', 'FORBIDDEN');
    }

    // Reject if a dispute has already been filed for this order
    if ((order as unknown as IWebOrderLean).disputedAt) {
      return sendErrorResponse(res, 409, 'Dispute already filed for this order', 'DISPUTE_ALREADY_EXISTS');
    }

    // Mark dispute on order
    (order as unknown as IWebOrderLean).disputeReason = reason;
    (order as unknown as IWebOrderLean).disputeDetails = details;
    (order as unknown as IWebOrderLean).disputedAt = new Date();
    await order.save();

    logger.info(`[DISPUTE] Order ${orderNumber} disputed: ${reason}`);

    return res.json({
      success: true,
      message: 'Dispute submitted. Our team will review within 24 hours.',
      data: { orderNumber, reason },
    });
  }),
);

// ─── POST /api/web-ordering/orders/:orderNumber/rating ────────────────────────
// Submit a 1-5 star rating (+ optional comment) for a completed order.
// No auth required — guest orders can rate too.
router.post(
  '/orders/:orderNumber/rating',
  writeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { rating, comment } = req.body as { rating: unknown; comment?: unknown };

    // Validate rating: must be an integer between 1 and 5
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res
        .status(400)
        .json({ success: false, message: 'rating must be an integer between 1 and 5', code: 'INVALID_RATING' });
    }

    // Validate optional comment
    if (comment !== undefined && typeof comment !== 'string') {
      return res.status(400).json({ success: false, message: 'comment must be a string', code: 'INVALID_COMMENT' });
    }
    const sanitizedComment = typeof comment === 'string' ? comment.trim().slice(0, 300) : undefined;

    const order = await WebOrder.findOne({ orderNumber });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found', code: 'ORDER_NOT_FOUND' });
    }

    // 409 if already rated
    if (order.rating != null) {
      return res.status(409).json({ success: false, message: 'Order already rated', code: 'ALREADY_RATED' });
    }

    order.rating = ratingNum;
    if (sanitizedComment) order.ratingComment = sanitizedComment;
    order.ratedAt = new Date();
    await order.save();

    logger.info(`[RATING] Order ${orderNumber} rated ${ratingNum}/5`);

    return res.json({ success: true, message: 'Thanks for your feedback!' });
  }),
);

// ─── GET /api/web-ordering/loyalty/stamps ──────────────────────────────────────
// Returns the loyalty stamp count for a customer at a specific store.
// Counts paid WebOrders from this customer at this store (1 stamp per order).
router.get(
  '/loyalty/stamps',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { phone, storeSlug } = req.query as { phone?: string; storeSlug?: string };

    if (!phone || !storeSlug) {
      return sendErrorResponse(res, 400, 'phone and storeSlug are required', 'MISSING_PARAMS');
    }

    const TARGET = 10;
    const REWARD = 'Free Dessert';

    const store = await Store.findOne({ slug: storeSlug, isActive: true }).select('_id').lean();
    if (!store) {
      return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');
    }

    // Count paid orders from this phone number at this store
    const count = await WebOrder.countDocuments({
      customerPhone: phone,
      storeSlug,
      paymentStatus: 'paid',
    });

    // Stamps cycle: once they hit the target, they start again
    const stamps = count % TARGET;

    return res.json({
      success: true,
      data: {
        stamps,
        target: TARGET,
        reward: REWARD,
        totalOrders: count,
      },
    });
  }),
);

// ─── POST /api/web-ordering/order/:orderNumber/feedback ────────────────────────
// Stores the post-order feedback survey responses.
router.post(
  '/order/:orderNumber/feedback',
  asyncHandler(async (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { sessionToken, foodQuality, serviceSpeed, recommend, textFeedback } = req.body;

    if (!foodQuality || !serviceSpeed || recommend === undefined) {
      return sendErrorResponse(res, 400, 'foodQuality, serviceSpeed, and recommend are required', 'MISSING_FIELDS');
    }

    // B6 Sprint-1 audit: userId-preferring lookup.
    const customer = await resolveCustomerIdentityFromRequest(req, sessionToken);
    if (!customer) return sendErrorResponse(res, 401, 'Session required', 'SESSION_REQUIRED');

    const order = await WebOrder.findOne({ orderNumber, ...ownerFilter(customer) });
    if (!order) return sendErrorResponse(res, 404, 'Order not found', 'ORDER_NOT_FOUND');

    // Store feedback on the order document (surveyFeedback field)
    order.surveyFeedback = {
      foodQuality,
      serviceSpeed,
      recommend: Boolean(recommend),
      textFeedback: textFeedback?.slice(0, 500) || '',
      submittedAt: new Date(),
    };
    await order.save();

    logger.info(`[FEEDBACK] Survey submitted for order ${orderNumber}`);

    return res.json({
      success: true,
      message: 'Thank you for your feedback!',
    });
  }),
);

// ─── REZ Now Analytics ───────────────────────────────────────────────────────

/**
 * GET /api/web-ordering/store/:storeSlug/analytics
 * Merchant-authenticated summary of REZ Now order performance.
 * Query params:
 *   period=1d|7d|30d|90d  (default 30d) — used when from/to are absent
 *   from=YYYY-MM-DD       — start of custom date range (inclusive)
 *   to=YYYY-MM-DD         — end of custom date range (inclusive, defaults to today)
 * When `from` is provided, it takes priority over `period`.
 */
router.get(
  '/store/:storeSlug/analytics',
  analyticsLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;
    const rawFrom = req.query.from as string | undefined;
    const rawTo = req.query.to as string | undefined;
    const rawPeriod = (req.query.period as string) || '30d';

    // Resolve date window — explicit from/to takes priority over period shorthand
    let since: Date;
    let until: Date;
    let periodLabel: string;

    if (rawFrom) {
      const parsedFrom = new Date(rawFrom);
      if (isNaN(parsedFrom.getTime())) {
        res.status(400).json({
          success: false,
          message: '`from` must be a valid ISO date string (YYYY-MM-DD)',
          code: 'VALIDATION_ERROR',
        });
        return;
      }
      since = new Date(parsedFrom);
      since.setHours(0, 0, 0, 0);

      if (rawTo) {
        const parsedTo = new Date(rawTo);
        if (isNaN(parsedTo.getTime())) {
          res.status(400).json({
            success: false,
            message: '`to` must be a valid ISO date string (YYYY-MM-DD)',
            code: 'VALIDATION_ERROR',
          });
          return;
        }
        until = new Date(parsedTo);
        until.setHours(23, 59, 59, 999);
      } else {
        // Default `to` to end of today when omitted
        until = new Date();
        until.setHours(23, 59, 59, 999);
      }

      if (since > until) {
        res.status(400).json({
          success: false,
          message: '`from` must not be after `to`',
          code: 'VALIDATION_ERROR',
        });
        return;
      }
      periodLabel = `custom:${rawFrom}→${rawTo ?? 'today'}`;
    } else {
      // Fallback: period shorthand — also accepts 1d now for today-only summaries
      const ALLOWED_PERIODS = ['1d', '7d', '30d', '90d'] as const;
      type AllowedPeriod = (typeof ALLOWED_PERIODS)[number];
      const period: AllowedPeriod = (ALLOWED_PERIODS as readonly string[]).includes(rawPeriod)
        ? (rawPeriod as AllowedPeriod)
        : '30d';
      const dayMap: Record<AllowedPeriod, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 };
      const days = dayMap[period];
      since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      until = new Date();
      until.setHours(23, 59, 59, 999);
      periodLabel = period;
    }

    // Only paid, non-cancelled orders for this store within the period
    const matchStage = {
      storeSlug,
      paymentStatus: 'paid' as const,
      status: { $ne: 'cancelled' },
      createdAt: { $gte: since, $lte: until },
    };

    // Single aggregation with $facet avoids multiple round-trips
    const [summary] = await WebOrder.aggregate([
      { $match: matchStage },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$total' },
                completedOrders: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
              },
            },
          ],
          daily: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                revenue: { $sum: '$total' },
                orders: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          items: [
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.name',
                count: { $sum: '$items.quantity' },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]);

    const totals = summary?.totals?.[0] ?? {
      totalOrders: 0,
      totalRevenue: 0,
      completedOrders: 0,
    };

    const totalOrders: number = totals.totalOrders ?? 0;
    const totalRevenue: number = Math.round(totals.totalRevenue ?? 0);
    const avgOrderValue: number = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const completionRate: number = totalOrders > 0 ? Math.round((totals.completedOrders / totalOrders) * 100) / 100 : 0;

    const topItems: { name: string; count: number }[] = (summary?.items ?? []).map(
      (i: { _id: string; count: number }) => ({ name: i._id, count: i.count }),
    );

    const dailyRevenue: { date: string; revenue: number; orders: number }[] = (summary?.daily ?? []).map(
      (d: { _id: string; revenue: number; orders: number }) => ({
        date: d._id,
        revenue: Math.round(d.revenue),
        orders: d.orders,
      }),
    );

    logger.info(`[ANALYTICS] store=${storeSlug} period=${periodLabel} orders=${totalOrders} revenue=${totalRevenue}`);

    return res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        completionRate,
        topItems,
        dailyRevenue,
      },
    });
  }),
);

// ─── POST /api/web-ordering/referral ──────────────────────────────────────────
// Records a referral event when a new user signs up via a referral link.
// Actual coin credit is handled by the wallet service listening to this log;
// this endpoint is intentionally thin and only persists the intent.
router.post(
  '/referral',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { referralCode, newUserId } = req.body as { referralCode?: string; newUserId?: string };

    if (typeof referralCode !== 'string' || referralCode.trim().length === 0) {
      res.status(400).json({ success: false, message: 'referralCode is required', code: 'VALIDATION_ERROR' });
      return;
    }

    if (typeof newUserId !== 'string' || newUserId.trim().length === 0) {
      res.status(400).json({ success: false, message: 'newUserId is required', code: 'VALIDATION_ERROR' });
      return;
    }

    // Prevent self-referral
    if (referralCode.trim() === newUserId.trim()) {
      res.status(400).json({ success: false, message: 'Self-referral is not allowed', code: 'SELF_REFERRAL' });
      return;
    }

    logger.info('[REFERRAL] recorded', {
      referralCode: referralCode.trim(),
      newUserId: newUserId.trim(),
    });

    res.json({ success: true, message: 'Referral recorded' });
  }),
);

// ─── GET /api/web-ordering/store/:storeSlug/waiter-calls ─────────────────────
// Returns all active (pending + acknowledged) waiter calls for a store.
// Scans Redis keys matching waiter:{storeSlug}:*:WAITER-* and returns them
// sorted newest-first. No auth required — accessed only from LAN staff tablets.
router.get(
  '/store/:storeSlug/waiter-calls',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params as { storeSlug: string };

    if (!storeSlug) return sendErrorResponse(res, 400, 'storeSlug is required', 'MISSING_FIELDS');

    // Basic slug validation
    if (!/^[a-z0-9-]{2,60}$/.test(storeSlug)) {
      return sendErrorResponse(res, 400, 'Invalid store slug format', 'INVALID_STORE_SLUG');
    }

    interface WaiterCallRecord {
      requestId: string;
      tableNumber: string;
      status: 'pending' | 'acknowledged' | 'resolved';
      createdAt: string;
      reason?: string;
      orderNumber?: string;
    }

    const calls: WaiterCallRecord[] = [];

    try {
      const pattern = `waiter:${storeSlug}:*`;
      // Use the underlying Redis client via delPattern-style scan
      const redisClient = (redisService as unknown as IRedisServiceLike).client;
      if (redisClient) {
        const config = (redisService as unknown as IRedisServiceLike).config;
        const cacheVersion = (await import('../config/redis')).CACHE_VERSION;
        const keyPrefix = config?.keyPrefix ?? '';
        const prefixedPattern = `${keyPrefix}v${cacheVersion}:${pattern}`;

        let cursor = 0;
        const keys: string[] = [];
        do {
          const result = await redisClient.scan(cursor, { MATCH: prefixedPattern, COUNT: 100 });
          cursor = result.cursor;
          keys.push(...(result.keys ?? []));
        } while (cursor !== 0);

        for (const fullKey of keys) {
          // Extract requestId from key: prefix:vN:waiter:{storeSlug}:{table}:{requestId}
          const segments = fullKey.split(':');
          const requestId = segments[segments.length - 1];

          const raw = await redisService.get<string>(
            `waiter:${storeSlug}:${segments[segments.length - 2]}:${requestId}`,
          );
          if (!raw) continue;

          let parsed: Record<string, unknown>;
          try {
            parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
          } catch {
            continue;
          }

          const status = (parsed.status as string) ?? 'pending';
          if (status === 'resolved') continue; // exclude resolved

          calls.push({
            requestId,
            tableNumber: (parsed.tableNumber as string) ?? 'unknown',
            status: status as 'pending' | 'acknowledged',
            createdAt: (parsed.requestedAt as string) ?? new Date().toISOString(),
            reason: parsed.reason as string | undefined,
            orderNumber: parsed.orderNumber as string | undefined,
          });
        }
      }
    } catch (err) {
      logger.warn('[WAITER] Failed to scan Redis for waiter calls', err instanceof Error ? err.message : String(err));
    }

    // Sort newest first
    calls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ success: true, data: calls });
  }),
);

// ─── PATCH /api/web-ordering/waiter/call/:requestId ──────────────────────────
// Updates the status of a waiter call (acknowledged | resolved).
// Staff dashboard calls this when tapping Acknowledge or Mark Resolved.
router.patch(
  '/waiter/call/:requestId',
  writeLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params as { requestId: string };
    const { status, storeSlug, tableNumber } = req.body as {
      status?: string;
      storeSlug?: string;
      tableNumber?: string;
    };

    if (!requestId) return sendErrorResponse(res, 400, 'requestId is required', 'MISSING_FIELDS');

    if (!/^WAITER-[A-Z0-9]+$/.test(requestId)) {
      return sendErrorResponse(res, 400, 'Invalid requestId format', 'INVALID_REQUEST_ID');
    }

    if (!status || !['acknowledged', 'resolved'].includes(status)) {
      return sendErrorResponse(res, 400, 'status must be acknowledged or resolved', 'INVALID_STATUS');
    }

    // Resolve Redis key — prefer hints from body, fall back to scan
    let updatedKey: string | null = null;

    try {
      if (storeSlug && tableNumber) {
        const key = `waiter:${storeSlug}:${tableNumber}:${requestId}`;
        const existing = await redisService.get<string>(key);
        if (existing) updatedKey = key;
      }

      if (!updatedKey) {
        // Scan for the key by requestId suffix
        const redisClient = (redisService as unknown as IRedisServiceLike).client;
        if (redisClient) {
          const config = (redisService as unknown as IRedisServiceLike).config;
          const cacheVersion = (await import('../config/redis')).CACHE_VERSION;
          const keyPrefix = config?.keyPrefix ?? '';
          const prefixedPattern = `${keyPrefix}v${cacheVersion}:waiter:*:*:${requestId}`;

          let cursor = 0;
          outer: do {
            const result = await redisClient.scan(cursor, { MATCH: prefixedPattern, COUNT: 100 });
            cursor = result.cursor;
            for (const fullKey of result.keys ?? []) {
              const segments = fullKey.split(':');
              // key format after prefix: waiter:{slug}:{table}:{requestId}
              const slug = segments[segments.length - 3];
              const table = segments[segments.length - 2];
              updatedKey = `waiter:${slug}:${table}:${requestId}`;
              break outer;
            }
          } while (cursor !== 0);
        }
      }

      if (!updatedKey) {
        return sendErrorResponse(res, 404, 'Waiter call not found', 'NOT_FOUND');
      }

      const raw = await redisService.get<string>(updatedKey);
      if (!raw) return sendErrorResponse(res, 404, 'Waiter call not found', 'NOT_FOUND');

      let parsed: Record<string, unknown>;
      try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
      } catch {
        return sendErrorResponse(res, 500, 'Corrupted waiter call record', 'PARSE_ERROR');
      }

      parsed.status = status;
      parsed.updatedAt = new Date().toISOString();

      // Preserve remaining TTL — keep resolved entries alive 60 s for UI fade-out
      const remainingTtl = status === 'resolved' ? 60 : 300;
      await redisService.set(updatedKey, JSON.stringify(parsed), remainingTtl);

      logger.info(`[WAITER] Status updated: ${requestId} → ${status}`);
    } catch (err) {
      logger.error('[WAITER] PATCH failed', err instanceof Error ? err.message : String(err));
      return sendErrorResponse(res, 500, 'Failed to update waiter call', 'INTERNAL_ERROR');
    }

    return res.json({ success: true, data: { requestId, status } });
  }),
);

// ─── GET /api/web-ordering/store/:storeSlug/reviews ──────────────────────────
// Returns Google Places reviews for a store. Cached in Redis for 24 h.
// Falls back to { rating: null, totalRatings: 0, reviews: [] } when:
//   - the store has no googlePlaceId
//   - GOOGLE_PLACES_API_KEY env var is missing
//   - the Places API call fails
router.get(
  '/store/:storeSlug/reviews',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params as { storeSlug: string };

    const cacheKey = `reviews:${storeSlug}`;
    const TTL_SECONDS = 86_400; // 24 hours

    // ── 1. Redis cache hit ───────────────────────────────────────────────────
    const cached = await redisService.get<object>(cacheKey);
    if (cached !== null) {
      return res.json({ success: true, data: cached });
    }

    // ── 2. Fetch store to get googlePlaceId ──────────────────────────────────
    const store = await Store.findOne({ slug: storeSlug }).select('googlePlaceId').lean();

    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const placeId: string | undefined = (store as IStoreDoc)?.googlePlaceId;

    const empty = { rating: null, totalRatings: 0, reviews: [] };

    if (!placeId || !GOOGLE_API_KEY) {
      return res.json({ success: true, data: empty });
    }

    // ── 3. Call Google Places Details API ───────────────────────────────────
    try {
      const url = 'https://maps.googleapis.com/maps/api/place/details/json';
      const { data: placesData } = await axios.get(url, {
        params: {
          place_id: placeId,
          fields: 'rating,user_ratings_total,reviews',
          reviews_sort: 'newest',
          key: GOOGLE_API_KEY,
        },
        timeout: 8_000,
      });

      if (placesData.status !== 'OK') {
        logger.warn(`[REVIEWS] Places API status=${placesData.status} for store=${storeSlug}`);
        return res.json({ success: true, data: empty });
      }

      const result = placesData.result ?? {};

      interface PlacesReview {
        author_name: string;
        rating: number;
        text: string;
        time: number;
        profile_photo_url?: string;
      }

      const rawReviews: PlacesReview[] = Array.isArray(result.reviews) ? result.reviews : [];

      const reviews = rawReviews.slice(0, 5).map((r: PlacesReview) => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.time,
        profilePhoto: r.profile_photo_url,
      }));

      const payload = {
        rating: typeof result.rating === 'number' ? result.rating : null,
        totalRatings: typeof result.user_ratings_total === 'number' ? result.user_ratings_total : 0,
        reviews,
      };

      // ── 4. Store in Redis ─────────────────────────────────────────────────
      await redisService.set(cacheKey, payload, TTL_SECONDS);

      return res.json({ success: true, data: payload });
    } catch (err) {
      logger.error('[REVIEWS] Google Places API call failed', { storeSlug, err });
      return res.json({ success: true, data: empty });
    }
  }),
);

// ─── POST /api/web-ordering/push/subscribe ────────────────────────────────────
// Saves a Web Push API subscription for the authenticated user so they receive
// real-time order status notifications in the browser.
router.post(
  '/push/subscribe',
  orderLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token is required' });
    }
    const token = authHeader.slice(7);
    try {
      const decoded = verifyToken(token);
      (req as unknown as AuthenticatedRequest).user = {
        _id: decoded.userId,
        role: decoded.role as 'user' | 'admin' | 'merchant' | 'support' | 'operator' | 'super_admin' | 'consumer',
      } as unknown as IUser & IAuthUser;
      (req as unknown as AuthenticatedRequest).userId = decoded.userId;
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
  },
  asyncHandler(async (req: Request, res: Response) => {
    const { subscription } = req.body as {
      subscription?: {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
    };

    if (
      !subscription ||
      typeof subscription.endpoint !== 'string' ||
      !subscription.endpoint ||
      typeof subscription.keys?.p256dh !== 'string' ||
      typeof subscription.keys?.auth !== 'string'
    ) {
      return sendErrorResponse(res, 400, 'Valid PushSubscription object required', 'INVALID_SUBSCRIPTION');
    }

    const userId: string =
      (req as unknown as AuthenticatedRequest).user?.id ||
      (req as unknown as AuthenticatedRequest).user?.userId ||
      ((req as unknown as AuthenticatedRequest).user?._id as string);
    if (!userId) {
      return sendErrorResponse(res, 401, 'Authenticated user required', 'UNAUTHENTICATED');
    }

    // After the guard above, these are validated strings
    const endpoint = subscription.endpoint as string;
    const p256dh = subscription.keys!.p256dh as string;
    const auth = subscription.keys!.auth as string;

    const { saveWebPushSubscription } = await import('../services/webPushService');
    await saveWebPushSubscription(userId, {
      endpoint,
      keys: { p256dh, auth },
    });

    return res.json({ success: true });
  }),
);

// ─── GET /api/web-ordering/store/:storeSlug/loyalty/status ───────────────────
// Returns the customer's current stamp count and any active reward.
// Requires a valid JWT Bearer token (customer must be logged in).
router.get(
  '/store/:storeSlug/loyalty/status',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;

    // B6 Sprint-1 audit: prefer userId with phone fallback for the order
    // count. LoyaltyReward queries still key on phone because that model
    // was never backfilled with userId (Sprint-1+ migration).
    const customer = await resolveCustomerIdentityFromRequest(req);
    if (!customer) return sendErrorResponse(res, 401, 'Authentication required', 'AUTH_REQUIRED');

    const STAMPS_REQUIRED = 10;
    const REWARD_DESCRIPTION = 'Free Dessert';

    const store = await Store.findOne({ slug: storeSlug, isActive: true }).select('_id').lean();
    if (!store) return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');

    // Count total paid orders; stamps cycle per STAMPS_REQUIRED. Scope the
    // owner-filter to this store + paid status.
    const totalOrders = await WebOrder.countDocuments({
      ...ownerFilter(customer),
      storeSlug,
      paymentStatus: 'paid',
    });

    const stamps = totalOrders % STAMPS_REQUIRED;
    const canRedeem = stamps === 0 && totalOrders > 0;

    // Check for an active (non-expired, non-redeemed) reward issued today.
    // Keyed on phone for now — LoyaltyReward rows don't yet have userId.
    const now = new Date();
    const activeReward = await LoyaltyReward.findOne({
      customerPhone: customer.phone,
      storeSlug,
      isRedeemed: false,
      expiresAt: { $gt: now },
    })
      .select('rewardCode description expiresAt')
      .lean();

    return res.json({
      success: true,
      data: {
        stamps,
        stampsRequired: STAMPS_REQUIRED,
        canRedeem,
        ...(activeReward
          ? {
              activeReward: {
                code: activeReward.rewardCode,
                description: activeReward.description,
                expiresAt: activeReward.expiresAt.toISOString(),
              },
            }
          : {}),
      },
    });
  }),
);

// ─── POST /api/web-ordering/store/:storeSlug/loyalty/redeem ──────────────────
// Redeems the customer's accumulated stamps for a reward code.
// Idempotent: if a valid reward was already issued today, returns it.
// Requires a valid JWT Bearer token (customer must be logged in).
router.post(
  '/store/:storeSlug/loyalty/redeem',
  orderLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;

    // B6 Sprint-1 audit: prefer userId with phone fallback for the order
    // count; LoyaltyReward writes still key on phone (Sprint-1+ migration).
    const customer = await resolveCustomerIdentityFromRequest(req);
    if (!customer) return sendErrorResponse(res, 401, 'Authentication required', 'AUTH_REQUIRED');

    const STAMPS_REQUIRED = 10;
    const REWARD_DESCRIPTION = 'Free Dessert';
    const REWARD_VALIDITY_HOURS = 24;

    const store = await Store.findOne({ slug: storeSlug, isActive: true }).select('_id').lean();
    if (!store) return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');

    // Idempotency: return an existing active reward if one was already issued
    const now = new Date();
    const existing = await LoyaltyReward.findOne({
      customerPhone: customer.phone,
      storeSlug,
      isRedeemed: false,
      expiresAt: { $gt: now },
    })
      .select('rewardCode description expiresAt')
      .lean();

    if (existing) {
      return res.json({
        success: true,
        alreadyActive: true,
        rewardCode: existing.rewardCode,
        description: existing.description,
        expiresAt: existing.expiresAt.toISOString(),
      });
    }

    // Count paid orders to determine stamp position — userId-preferring.
    const totalOrders = await WebOrder.countDocuments({
      ...ownerFilter(customer),
      storeSlug,
      paymentStatus: 'paid',
    });

    const stamps = totalOrders % STAMPS_REQUIRED;

    // Must have completed a full cycle (stamps === 0 and at least one order exists)
    if (stamps !== 0 || totalOrders === 0) {
      const remaining = stamps === 0 ? STAMPS_REQUIRED : STAMPS_REQUIRED - stamps;
      return sendErrorResponse(
        res,
        400,
        `Need ${remaining} more stamp${remaining !== 1 ? 's' : ''} to redeem`,
        'INSUFFICIENT_STAMPS',
      );
    }

    // Generate a unique reward code: REZ-LOYAL-XXXXXXXX
    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const rewardCode = `REZ-LOYAL-${suffix}`;

    const expiresAt = new Date(now.getTime() + REWARD_VALIDITY_HOURS * 60 * 60 * 1000);

    await LoyaltyReward.create({
      customerPhone: customer.phone,
      storeSlug,
      rewardCode,
      description: REWARD_DESCRIPTION,
      issuedAt: now,
      expiresAt,
    });

    logger.info(`[LOYALTY] Reward issued: phone=${customer.phone} store=${storeSlug} code=${rewardCode}`);

    return res.status(201).json({
      success: true,
      rewardCode,
      description: REWARD_DESCRIPTION,
      expiresAt: expiresAt.toISOString(),
    });
  }),
);

// ─── Customer Profile ─────────────────────────────────────────────────────────
// GET /api/web-ordering/profile — returns the authenticated customer's profile
// including aggregated order stats pulled from WebOrder.
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId =
      (req as unknown as AuthenticatedRequest).user?.userId || (req as unknown as AuthenticatedRequest).user?.id;
    if (!userId) {
      return sendErrorResponse(res, 401, 'Authentication required', 'AUTH_REQUIRED');
    }

    const User = require('../models/User').default || require('../models/User').User;
    const user = await User.findById(userId).select('phoneNumber email profile createdAt').lean();

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    const [totalOrdersResult, spentResult] = await Promise.all([
      WebOrder.countDocuments({ userId, paymentStatus: 'paid' }),
      WebOrder.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const displayName = (user as IUserLean).profile?.firstName
      ? [(user as IUserLean).profile?.firstName, (user as IUserLean).profile?.lastName].filter(Boolean).join(' ')
      : (req as unknown as AuthenticatedRequest).user?.name || '';

    return res.json({
      success: true,
      data: {
        name: displayName,
        phone: (user as IUserLean).phoneNumber,
        email: (user as IUserLean).email ?? undefined,
        avatarUrl: (user as IUserLean).profile?.avatar ?? undefined,
        totalOrders: totalOrdersResult,
        totalSpent: spentResult[0]?.total ?? 0,
        joinedAt: (user as IUserLean).createdAt?.toISOString() ?? new Date().toISOString(),
      },
    });
  }),
);

// PATCH /api/web-ordering/profile — update the authenticated customer's display name
router.patch(
  '/profile',
  writeLimiter,
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId =
      (req as unknown as AuthenticatedRequest).user?.userId || (req as unknown as AuthenticatedRequest).user?.id;
    if (!userId) {
      return sendErrorResponse(res, 401, 'Authentication required', 'AUTH_REQUIRED');
    }

    const { name } = req.body as { name?: unknown };
    if (typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 80) {
      return sendErrorResponse(res, 400, 'Invalid name', 'VALIDATION_ERROR');
    }

    const trimmedName = name.trim();
    const parts = trimmedName.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '';

    const User = require('../models/User').default || require('../models/User').User;
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { 'profile.firstName': firstName, 'profile.lastName': lastName } },
      { new: true, select: 'phoneNumber email profile createdAt' },
    ).lean();

    if (!user) {
      return sendErrorResponse(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    const [totalOrdersResult, spentResult] = await Promise.all([
      WebOrder.countDocuments({ userId, paymentStatus: 'paid' }),
      WebOrder.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    return res.json({
      success: true,
      data: {
        name: trimmedName,
        phone: (user as IUserLean).phoneNumber,
        email: (user as IUserLean).email ?? undefined,
        avatarUrl: (user as IUserLean).profile?.avatar ?? undefined,
        totalOrders: totalOrdersResult,
        totalSpent: spentResult[0]?.total ?? 0,
        joinedAt: (user as IUserLean).createdAt?.toISOString() ?? new Date().toISOString(),
      },
    });
  }),
);

// ─── Web Push Broadcast ───────────────────────────────────────────────────────

const BROADCAST_DAILY_LIMIT = 3;
const BROADCAST_BATCH_SIZE = 10;

// Stricter per-endpoint rate limit for broadcast sends
const broadcastSendLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/web-ordering/store/:storeSlug/broadcast
 * Sends a web push notification to all customers subscribed from this store.
 * Requires merchant auth. Rate-limited to 3 broadcasts per store per 24h via Redis.
 */
router.post(
  '/store/:storeSlug/broadcast',
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token is required' });
    }
    const token = authHeader.slice(7);
    try {
      const decoded = verifyToken(token);
      (req as unknown as AuthenticatedRequest).user = {
        _id: decoded.userId,
        role: decoded.role as 'user' | 'admin' | 'merchant' | 'support' | 'operator' | 'super_admin' | 'consumer',
      } as unknown as IUser & IAuthUser;
      (req as unknown as AuthenticatedRequest).userId = decoded.userId;
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
  },
  broadcastSendLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;
    const { title, body, url } = req.body as { title?: string; body?: string; url?: string };

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return sendErrorResponse(res, 400, 'title is required', 'VALIDATION_ERROR');
    }
    if (title.length > 60) {
      return sendErrorResponse(res, 400, 'title must be 60 characters or fewer', 'VALIDATION_ERROR');
    }
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return sendErrorResponse(res, 400, 'body is required', 'VALIDATION_ERROR');
    }
    if (body.length > 160) {
      return sendErrorResponse(res, 400, 'body must be 160 characters or fewer', 'VALIDATION_ERROR');
    }
    if (url !== undefined && typeof url !== 'string') {
      return sendErrorResponse(res, 400, 'url must be a string', 'VALIDATION_ERROR');
    }

    const store = await Store.findOne({ slug: storeSlug, isActive: true }).lean();
    if (!store) {
      return sendErrorResponse(res, 404, 'Store not found or inactive', 'STORE_NOT_FOUND');
    }

    // Enforce 3 broadcasts per store per 24h via Redis
    const redisCountKey = `broadcast:${storeSlug}:count`;
    const currentCountRaw = await redisService.get<string>(redisCountKey);
    const currentCount = currentCountRaw !== null ? parseInt(currentCountRaw, 10) : 0;

    if (currentCount >= BROADCAST_DAILY_LIMIT) {
      return sendErrorResponse(
        res,
        429,
        `Broadcast limit reached. Maximum ${BROADCAST_DAILY_LIMIT} broadcasts per store per 24 hours.`,
        'BROADCAST_LIMIT_REACHED',
      );
    }

    // Find userIds who ordered from this store, then filter to subscribed ones
    const orderedUserIds: mongoose.Types.ObjectId[] = await WebOrder.distinct('userId', { storeSlug });

    if (orderedUserIds.length === 0) {
      return res.json({ success: true, recipientCount: 0 });
    }

    const subscribedUserIds: string[] = (
      await WebPushSubscription.find({ userId: { $in: orderedUserIds } }).distinct('userId')
    ).map((id) => String(id));

    const recipientCount = subscribedUserIds.length;

    // Increment counter before sending so a crash doesn't allow unlimited retries
    await redisService.set(redisCountKey, String(currentCount + 1), 24 * 60 * 60);

    // Fire-and-forget batched sends — do not await
    const payload = {
      title: title.trim(),
      body: body.trim(),
      data: url ? { url: url.trim() } : {},
    };
    (async () => {
      for (let i = 0; i < subscribedUserIds.length; i += BROADCAST_BATCH_SIZE) {
        const batch = subscribedUserIds.slice(i, i + BROADCAST_BATCH_SIZE);
        await Promise.allSettled(batch.map((uid) => sendWebPushToUser(uid, payload)));
      }
    })().catch((err) => logger.warn(`[BROADCAST] Batch error for storeSlug=${storeSlug}:`, err));

    await BroadcastLog.create({
      storeSlug,
      title: title.trim(),
      body: body.trim(),
      url: url?.trim() || undefined,
      sentAt: new Date(),
      recipientCount,
    });

    logger.info(
      `[BROADCAST] sent storeSlug=${storeSlug} recipients=${recipientCount} dailyCount=${currentCount + 1}/${BROADCAST_DAILY_LIMIT}`,
    );

    return res.json({ success: true, recipientCount });
  }),
);

/**
 * GET /api/web-ordering/store/:storeSlug/broadcasts
 * Returns last 10 BroadcastLog entries and current daily usage. Requires merchant auth.
 */
router.get(
  '/store/:storeSlug/broadcasts',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;

    const logs = await BroadcastLog.find({ storeSlug }).sort({ sentAt: -1 }).limit(10).lean();

    const redisCountKey = `broadcast:${storeSlug}:count`;
    const currentCountRaw = await redisService.get<string>(redisCountKey);
    const dailyUsed = currentCountRaw !== null ? parseInt(currentCountRaw, 10) : 0;

    return res.json({
      success: true,
      data: { logs, dailyUsed, dailyLimit: BROADCAST_DAILY_LIMIT },
    });
  }),
);

// ─── POST /api/web-ordering/store/:storeSlug/reserve ─────────────────────────
// Guest reservation — no auth required.
// Body: { customerName, customerPhone, partySize, date, timeSlot, notes? }
const reservationLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/store/:storeSlug/reserve',
  reservationLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;
    const { customerName, customerPhone, partySize, date, timeSlot, notes } = req.body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
      return sendErrorResponse(res, 400, 'customerName is required', 'VALIDATION_ERROR');
    }
    if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.trim().length === 0) {
      return sendErrorResponse(res, 400, 'customerPhone is required', 'VALIDATION_ERROR');
    }
    const partySizeNum = Number(partySize);
    if (!Number.isInteger(partySizeNum) || partySizeNum < 1 || partySizeNum > 20) {
      return sendErrorResponse(res, 400, 'partySize must be between 1 and 20', 'VALIDATION_ERROR');
    }
    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return sendErrorResponse(res, 400, 'date must be YYYY-MM-DD', 'VALIDATION_ERROR');
    }
    if (!timeSlot || typeof timeSlot !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeSlot)) {
      return sendErrorResponse(res, 400, 'timeSlot must be HH:MM', 'VALIDATION_ERROR');
    }

    // ── Validate date range (today..+30 days) ─────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    const requestedDate = new Date(date + 'T00:00:00');
    if (requestedDate < today) {
      return sendErrorResponse(res, 400, 'date must be today or in the future', 'VALIDATION_ERROR');
    }
    if (requestedDate > maxDate) {
      return sendErrorResponse(res, 400, 'date must be within 30 days', 'VALIDATION_ERROR');
    }

    // ── Fetch store ───────────────────────────────────────────────────────────
    const reserveStore = await Store.findOne({ slug: storeSlug, isActive: true })
      .select('_id name reservationsEnabled maxTableCapacity')
      .lean();
    if (!reserveStore) {
      return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');
    }
    const reserveDoc = reserveStore as IStoreDoc;
    if (!reserveDoc.reservationsEnabled) {
      return sendErrorResponse(res, 403, 'This store does not accept reservations', 'RESERVATIONS_DISABLED');
    }

    const maxCapacity: number = reserveDoc.maxTableCapacity ?? 50;

    // ── Capacity check ────────────────────────────────────────────────────────
    const existingReservations = await TableReservation.find({
      storeSlug,
      date,
      timeSlot,
      status: { $ne: 'cancelled' },
    })
      .select('partySize')
      .lean();

    const occupiedSeats = (existingReservations as IReservationLean[]).reduce(
      (sum: number, r) => sum + (r.partySize || 0),
      0,
    );

    if (occupiedSeats + partySizeNum > maxCapacity) {
      return res.status(409).json({
        success: false,
        message: 'Not enough capacity for this time slot',
        code: 'CAPACITY_EXCEEDED',
        data: { availableSeats: Math.max(0, maxCapacity - occupiedSeats) },
      });
    }

    // ── Generate reservation code ─────────────────────────────────────────────
    const RESV_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const resvSuffix = Array.from(
      { length: 3 },
      () => RESV_ALPHABET[crypto.randomInt(0, RESV_ALPHABET.length - 1)],
    ).join('');
    const reservationCode = `RES-${resvSuffix}`;

    // ── Persist ───────────────────────────────────────────────────────────────
    const reservation = await TableReservation.create({
      storeSlug,
      storeId: reserveDoc._id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      partySize: partySizeNum,
      date,
      timeSlot,
      notes: notes != null ? String(notes).trim() || undefined : undefined,
      status: 'pending',
      reservationCode,
    });

    // ── WhatsApp confirmation (fire-and-forget) ───────────────────────────────
    const confirmationMessage =
      `Your table at ${reserveDoc.name} is reserved!\n` +
      `Code: ${reservationCode}\n` +
      `Date: ${date} at ${timeSlot}\n` +
      `Party of ${partySizeNum}\n` +
      `Show this code at the restaurant.`;

    whatsappOrderingService.sendMessage(customerPhone.trim(), confirmationMessage).catch((err: Error) => {
      logger.warn('[RESERVATION] WhatsApp notification failed', {
        reservationCode,
        error: err.message,
      });
    });

    logger.info(`[RESERVATION] Created ${reservationCode} for ${storeSlug} on ${date} at ${timeSlot}`);

    return res.status(201).json({
      success: true,
      data: {
        reservationCode: reservation.reservationCode,
        date: reservation.date,
        timeSlot: reservation.timeSlot,
        confirmationMessage,
      },
    });
  }),
);

// ─── GET /api/web-ordering/store/:storeSlug/availability ─────────────────────
// Public. ?date=YYYY-MM-DD
// Returns time slots every 30 min from store open to close-1h, with availability.
router.get(
  '/store/:storeSlug/availability',
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;
    const dateParam = req.query.date as string | undefined;

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return sendErrorResponse(res, 400, 'date query param must be YYYY-MM-DD', 'VALIDATION_ERROR');
    }

    const availStore = await Store.findOne({ slug: storeSlug, isActive: true })
      .select('reservationsEnabled maxTableCapacity operatingHours operationalInfo')
      .lean();
    if (!availStore) {
      return sendErrorResponse(res, 404, 'Store not found', 'STORE_NOT_FOUND');
    }
    const availDoc = availStore as IStoreDoc;
    if (!availDoc.reservationsEnabled) {
      return sendErrorResponse(res, 403, 'Reservations not enabled for this store', 'RESERVATIONS_DISABLED');
    }

    const maxCapacity: number = availDoc.maxTableCapacity ?? 50;

    // ── Derive open/close for the given day ───────────────────────────────────
    const requestedDateAvail = new Date(dateParam + 'T00:00:00');
    const AVAIL_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
    const dayKey = AVAIL_DAY_NAMES[requestedDateAvail.getDay()];

    const rawHours: Record<string, any> =
      availDoc.operatingHours && Object.keys(availDoc.operatingHours).length > 0
        ? availDoc.operatingHours
        : availDoc.operationalInfo?.hours || {};

    const dayHours = rawHours[dayKey];
    if (!dayHours || dayHours.closed) {
      return res.json({ success: true, data: { slots: [], closed: true } });
    }

    const openStr: string = dayHours.open ?? '09:00';
    const closeStr: string = dayHours.close ?? '22:00';

    function toMinutes(t: string): number {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    }
    function toTimeStr(minutes: number): string {
      const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0');
      const m = (minutes % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    }

    const openMin = toMinutes(openStr);
    const lastSlotMin = toMinutes(closeStr) - 60; // last slot 1h before close

    if (lastSlotMin < openMin) {
      return res.json({ success: true, data: { slots: [], closed: false } });
    }

    // ── Count booked seats per slot ───────────────────────────────────────────
    const reservationsForDate = await TableReservation.find({
      storeSlug,
      date: dateParam,
      status: { $ne: 'cancelled' },
    })
      .select('timeSlot partySize')
      .lean();

    const slotOccupancy: Record<string, number> = {};
    for (const r of reservationsForDate as IReservationLean[]) {
      slotOccupancy[r.timeSlot] = (slotOccupancy[r.timeSlot] ?? 0) + (r.partySize || 0);
    }

    // ── Generate slots every 30 min ───────────────────────────────────────────
    const slots: Array<{ time: string; available: boolean; spotsLeft: number }> = [];
    for (let min = openMin; min <= lastSlotMin; min += 30) {
      const time = toTimeStr(min);
      const occupied = slotOccupancy[time] ?? 0;
      const spotsLeft = maxCapacity - occupied;
      slots.push({ time, available: spotsLeft > 0, spotsLeft: Math.max(0, spotsLeft) });
    }

    return res.json({ success: true, data: { slots, closed: false } });
  }),
);

// ─── GET /api/web-ordering/store/:storeSlug/today-payments ────────────────────
// Internal only (requires internal token). Returns all paid WebOrders for this store today.
// Used by: PayDisplayClient.tsx (merchant payment kiosk)
router.get(
  '/store/:storeSlug/today-payments',
  requireInternalToken,
  menuLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;

    if (!storeSlug || typeof storeSlug !== 'string' || storeSlug.length > 100) {
      return sendErrorResponse(res, 400, 'Invalid store slug', 'VALIDATION_ERROR');
    }

    // Start of today (00:00 IST)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const [payments, countResult] = await Promise.all([
      WebOrder.find({
        storeSlug,
        paymentStatus: 'paid',
        createdAt: { $gte: startOfDay },
      })
        .sort({ createdAt: -1 })
        .limit(200)
        .select('_id amount customerName customerPhone razorpayPaymentId createdAt')
        .lean(),
      WebOrder.countDocuments({
        storeSlug,
        paymentStatus: 'paid',
        createdAt: { $gte: startOfDay },
      }),
    ]);

    const totalAmount = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const data = {
      payments: payments.map((p: any) => ({
        id: String(p._id),
        amount: p.amount || 0,
        customerName: p.customerName || null,
        customerPhone: p.customerPhone || null,
        razorpayPaymentId: p.razorpayPaymentId || null,
        createdAt: p.createdAt.toISOString(),
      })),
      totalAmount,
      count: countResult,
    };

    return res.json({ success: true, data });
  }),
);

// ─── POST /api/web-ordering/store/:storeSlug/emit-payment ─────────────────────
// Internal only (requires internal token). Emits payment:received Socket event.
// Used by: payment service webhook handler after verifying payment.
router.post(
  '/store/:storeSlug/emit-payment',
  requireInternalToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;
    const { paymentId, amount } = req.body;
    let { customerName, customerPhone, razorpayPaymentId } = req.body;

    if (!paymentId || !amount) {
      return sendErrorResponse(res, 400, 'paymentId and amount are required', 'VALIDATION_ERROR');
    }

    if (typeof customerName === 'string') customerName = customerName.trim().slice(0, 100);
    else customerName = null;
    if (typeof customerPhone === 'string') customerPhone = customerPhone.trim().slice(0, 20);
    else customerPhone = null;
    if (typeof razorpayPaymentId === 'string') razorpayPaymentId = razorpayPaymentId.trim().slice(0, 100);
    else razorpayPaymentId = null;

    const payment = {
      id: paymentId,
      amount,
      customerName,
      customerPhone,
      razorpayPaymentId,
      storeSlug,
      createdAt: new Date().toISOString(),
    };

    // Emit to the store room on the main namespace
    const io = (global as IGlobalIO).io;
    if (io) {
      io.to(`store-${storeSlug}`).emit('payment:received', payment);
      logger.info('[PayDisplay] payment:received emitted', { storeSlug, paymentId, amount });
    }

    return res.json({ success: true });
  }),
);

// ─── POST /api/web-ordering/store/:storeSlug/payments/:paymentId/confirm ─────────
// Merchant confirms a pending Scan & Pay payment.
// Marks StorePayment completed, credits REZ coins, emits socket events.
router.post(
  '/store/:storeSlug/payments/:paymentId/confirm',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug, paymentId } = req.params;
    const { reason } = req.body as { reason?: string };

    const storePayment = await StorePayment.findOne({ paymentId }).lean();
    if (!storePayment) {
      return sendErrorResponse(res, 404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    const store = await Store.findOne({
      slug: storeSlug,
      merchant: (req.user as unknown as AuthenticatedRequest).user?._id,
    }).lean();
    if (!store) {
      return sendErrorResponse(res, 403, 'Not authorized for this store', 'FORBIDDEN');
    }

    if (storePayment.status === 'completed') {
      return sendErrorResponse(res, 400, 'Payment already confirmed', 'ALREADY_CONFIRMED');
    }
    if (storePayment.status === 'cancelled' || storePayment.status === 'failed') {
      return sendErrorResponse(res, 400, `Cannot confirm a ${storePayment.status} payment`, 'INVALID_STATE');
    }

    // Credit coins only if Program Merchant
    let coinsEarned = 0;
    if (store.isProgramMerchant) {
      try {
        const walletService = (await import('../services/walletService')).walletService;
        const result = await walletService.credit({
          userId: storePayment.userId.toString(),
          amount: 0,
          source: 'cashback',
          description: `Scan & Pay cashback at ${store.name}`,
          operationType: 'cashback',
          referenceId: storePayment._id.toString(),
          referenceModel: 'StorePayment',
          metadata: { storeSlug, storeName: store.name, orderId: paymentId },
        });
        coinsEarned = (result as { coins?: number })?.coins || 0;
      } catch (coinErr: any) {
        logger.warn('[PayDisplay] Coin credit failed (non-fatal)', { paymentId, err: coinErr?.message });
      }
    }

    await StorePayment.updateOne(
      { _id: storePayment._id },
      { $set: { status: 'completed', completedAt: new Date(), transactionId: paymentId } },
    );

    const io = (global as IGlobalIO).io;
    if (io) {
      io.to(`store-${storeSlug}`).emit('payment:confirmed', { paymentId, coinsEarned });
    }

    logger.info('[PayDisplay] Payment confirmed', { storeSlug, paymentId, coinsEarned });
    return res.json({ success: true, data: { paymentId, status: 'completed', coinsEarned } });
  }),
);

// ─── POST /api/web-ordering/store/:storeSlug/payments/:paymentId/reject ─────────
// Merchant rejects a pending Scan & Pay payment.
router.post(
  '/store/:storeSlug/payments/:paymentId/reject',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug, paymentId } = req.params;
    const { reason } = req.body as { reason?: string };

    const storePayment = await StorePayment.findOne({ paymentId }).lean();
    if (!storePayment) {
      return sendErrorResponse(res, 404, 'Payment not found', 'PAYMENT_NOT_FOUND');
    }

    const store = await Store.findOne({
      slug: storeSlug,
      merchant: (req.user as unknown as AuthenticatedRequest).user?._id,
    }).lean();
    if (!store) {
      return sendErrorResponse(res, 403, 'Not authorized for this store', 'FORBIDDEN');
    }

    if (storePayment.status === 'completed') {
      return sendErrorResponse(res, 400, 'Cannot reject an already confirmed payment', 'INVALID_STATE');
    }

    await StorePayment.updateOne(
      { _id: storePayment._id },
      { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: reason || 'Rejected by merchant' } },
    );

    const io = (global as IGlobalIO).io;
    if (io) {
      io.to(`store-${storeSlug}`).emit('payment:rejected', { paymentId });
    }

    logger.info('[PayDisplay] Payment rejected', { storeSlug, paymentId, reason });
    return res.json({ success: true, data: { paymentId, status: 'cancelled' } });
  }),
);

// ─── GET /api/web-ordering/store/:storeSlug/payments ───────────────────────────
// Merchant lists recent Scan & Pay payments for their store.
router.get(
  '/store/:storeSlug/payments',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { storeSlug } = req.params;
    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 50);

    const store = await Store.findOne({
      slug: storeSlug,
      merchant: (req.user as unknown as AuthenticatedRequest).user?._id,
    }).lean();
    if (!store) {
      return sendErrorResponse(res, 403, 'Not authorized for this store', 'FORBIDDEN');
    }

    const payments = await StorePayment.find({ storeId: store._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('paymentId amount status customerName customerPhone completedAt cancelledAt createdAt')
      .lean();

    return res.json({
      success: true,
      data: {
        payments: payments.map((p: IStorePaymentLean) => ({
          id: p.paymentId,
          amount: p.amount,
          status: p.status,
          customerName: p.customerName || null,
          customerPhone: p.customerPhone || null,
          completedAt: p.completedAt?.toISOString() || null,
          cancelledAt: p.cancelledAt?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
        })),
        count: payments.length,
      },
    });
  }),
);

export default router;
