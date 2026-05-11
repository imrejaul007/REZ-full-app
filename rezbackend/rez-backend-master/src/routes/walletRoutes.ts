// @ts-nocheck
import express from 'express';
import mongoose from 'mongoose';
import {
  getWalletBalance,
  getTransactions,
  getTransactionById,
  getTransactionCounts,
  topupWallet,
  withdrawFunds,
  processPayment,
  getTransactionSummary,
  updateWalletSettings,
  getCategoriesBreakdown,
  initiatePayment,
  confirmPayment,
  checkPaymentStatus,
  getPaymentMethods,
  creditLoyaltyPoints,
  devTopup,
  syncWalletBalance,
  refundPayment,
  getExpiringCoins,
  previewRechargeCashback,
  getScheduledDrops,
  getCoinRules,
  getRedemptionSuggestions,
  grantWelcomeCoins,
  handlePaymentWebhook,
  getRezCashIdentity,
} from '../controllers/walletController';
import { redeemCoins } from '../controllers/walletRedeemController';
import { authenticate, requireSeniorAdmin } from '../middleware/auth';
import { requireInternalToken } from '../middleware/internalAuth';
import { walletService } from '../services/walletService';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../config/logger';
import { createRateLimiter } from '../middleware/rateLimiter';
import { walletPayLimiter, walletTopupLimiter } from '../middleware/financialRateLimiter';
import { requireReAuth } from '../middleware/reAuth';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { requireWalletFeature, WALLET_FEATURES } from '../services/walletFeatureService';
import { validate, validateQuery, Joi } from '../middleware/validation';
// Week-3 cutover: shadow-validate hot wallet endpoints against canonical
// `@rez/shared` schemas. Default mode is 'off' (env-gated); see
// MIGRATION.md §5. We use bodyShapers to synthesize the canonical request
// shape from our wire shape (which has user-from-auth and other context).
import { validateWithSharedTypes } from '../middleware/sharedTypesValidator';
import { WalletDebitSchema, WalletCreditSchema } from '../@rez/shared-types';

const router = express.Router();

// ── Body shapers for wallet endpoints ────────────────────────────────────────
//
// Our wire bodies don't match the canonical WalletDebit/Credit shape because:
//   - `user` comes from req.user (auth), not the body
//   - `idempotencyKey` may be the X-Idempotency-Key header rather than a body field
//   - `source` is endpoint-specific (always 'order' for /payment, 'admin' for credits)
//   - `coinType` defaults to 'rez' for loyalty credits
//
// These shapers run in shadow mode only — they do NOT mutate the request that
// flows to the controller. Their sole purpose is to synthesize a canonical
// body for the safeParse so we can detect drift between the joi contract and
// the canonical contract without rejecting good traffic.

function shapeWalletPayment(req: express.Request): unknown {
  const u = (req as any).user;
  const userId = u?.id ?? u?._id?.toString();
  const idemKey =
    req.body?.idempotencyKey ??
    (req.headers['idempotency-key'] as string | undefined) ??
    (req.headers['x-idempotency-key'] as string | undefined);
  if (!userId || !idemKey) return undefined; // can't form a canonical shape — skip
  return {
    user: userId,
    amount: req.body?.amount,
    source: 'order',
    sourceId: req.body?.orderId,
    description: req.body?.description ?? `Wallet payment for order ${req.body?.orderId ?? ''}`.trim(),
    merchantId: req.body?.storeId,
    idempotencyKey: idemKey,
  };
}

function shapeWalletLoyaltyCredit(req: express.Request): unknown {
  const u = (req as any).user;
  const userId = u?.id ?? u?._id?.toString();
  const idemKey =
    req.body?.idempotencyKey ??
    (req.headers['idempotency-key'] as string | undefined) ??
    (req.headers['x-idempotency-key'] as string | undefined);
  if (!userId || !idemKey) return undefined;
  return {
    user: userId,
    coinType: 'rez',
    amount: req.body?.amount,
    source: req.body?.source ?? 'admin',
    description: `Loyalty points credit (${req.body?.source ?? 'admin'})`,
    idempotencyKey: idemKey,
  };
}

// ── Webhook route — MUST be registered BEFORE router.use(authenticate) and BEFORE ──
// ── the global JSON body-parser so that raw bytes are available for HMAC verification ──
// ISSUE-03/ISSUE-20 FIX: Mount /webhook/:gateway with express.json({ verify }) so the
// raw request body is preserved on req.rawBody. The paymentGatewayService.verifyRazorpayWebhook
// now uses that raw string for HMAC instead of JSON.stringify(parsedObject).
router.post(
  '/webhook/:gateway',
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
  handlePaymentWebhook,
);

// Rate limiters for sensitive wallet operations
const walletWriteLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many wallet operations. Please try again later.',
});
const walletWithdrawLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: 'Daily withdrawal limit reached.',
});
const walletRefundLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: 'Too many refund requests.',
});
const walletPaymentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many payment requests. Please try again later.',
});
const walletCreditLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many credit requests.',
});
const walletSyncLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 1,
  message: 'Balance sync is limited to once per hour.',
});
const walletReadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many wallet read requests. Please try again later.',
});
const walletRedeemLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Max 3 coin redemptions per hour.',
});

// All wallet routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/wallet/balance
 * @desc    Get user wallet balance and status
 * @access  Private
 * BED-014: added authenticate middleware
 */
router.get('/balance', authenticate, walletReadLimiter, getWalletBalance);

/**
 * @route   POST /api/wallet/credit-loyalty-points
 * @desc    Credit loyalty points to wallet as spendable coins
 * @body    { amount, source }
 * @access  Admin only (senior admin+)
 */
router.post(
  '/credit-loyalty-points',
  walletCreditLimiter,
  idempotencyMiddleware(),
  requireSeniorAdmin,
  validate(
    Joi.object({
      amount: Joi.number().positive().max(100000).required(),
      source: Joi.string().max(100),
      idempotencyKey: Joi.string(),
    }),
  ),
  // Week-3 shadow validation against canonical WalletCreditSchema.
  validateWithSharedTypes(WalletCreditSchema, 'POST /api/wallet/credit-loyalty-points', {
    bodyShaper: shapeWalletLoyaltyCredit,
  }),
  creditLoyaltyPoints,
);

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get user transaction history with filters
 * @query   page, limit, type, category, status, startDate, endDate, minAmount, maxAmount
 * @access  Private
 */
router.get(
  '/transactions',
  walletReadLimiter,
  validateQuery(
    Joi.object({
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(100),
      type: Joi.string(),
      category: Joi.string(),
      status: Joi.string(),
      startDate: Joi.date(),
      endDate: Joi.date(),
      minAmount: Joi.number().min(0),
      maxAmount: Joi.number().min(0),
    }),
  ),
  getTransactions,
);

/**
 * @route   GET /api/wallet/transaction/:id
 * @desc    Get single transaction details
 * @access  Private
 * @security IDOR guard: Controller verifies transaction belongs to authenticated user
 */
router.get('/transaction/:id', walletReadLimiter, getTransactionById);

/**
 * @route   GET /api/wallet/summary
 * @desc    Get transaction summary/statistics
 * @query   period (day, week, month, year)
 * @access  Private
 */
router.get('/summary', walletReadLimiter, getTransactionSummary);

/**
 * @route   GET /api/wallet/transaction-counts
 * @desc    Get transaction counts grouped by category (lightweight)
 * @access  Private
 */
router.get('/transaction-counts', walletReadLimiter, getTransactionCounts);

/**
 * @route   GET /api/wallet/categories
 * @desc    Get spending breakdown by categories
 * @access  Private
 */
router.get('/categories', walletReadLimiter, getCategoriesBreakdown);

/**
 * @route   POST /api/wallet/topup
 * @desc    Add funds to wallet (admin only — users must use initiate-payment → confirm-payment)
 * @body    { amount, paymentMethod, paymentId }
 * @access  Admin only (senior admin+)
 */
router.post(
  '/topup',
  walletTopupLimiter,
  idempotencyMiddleware({ failClosed: true, requireKey: true }),
  requireSeniorAdmin,
  validate(
    Joi.object({
      amount: Joi.number().positive().max(1000000).required(),
      paymentMethod: Joi.string(),
      paymentId: Joi.string(),
    }),
  ),
  topupWallet,
);

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Withdraw funds from wallet
 * @body    { amount, method, accountDetails }
 * @access  Private
 */
router.post(
  '/withdraw',
  walletWithdrawLimiter,
  idempotencyMiddleware({ failClosed: true, requireKey: true }),
  requireReAuth(),
  requireWalletFeature(WALLET_FEATURES.WITHDRAWALS),
  validate(
    Joi.object({
      amount: Joi.number().positive().required(),
      method: Joi.string().required(),
      accountDetails: Joi.alternatives().try(Joi.object(), Joi.string()).required(),
    }),
  ),
  withdrawFunds,
);

/**
 * @route   POST /api/wallet/payment
 * @desc    Process payment (deduct from wallet)
 * @body    { amount, orderId, storeId, storeName, description, items }
 * @access  Private
 */
router.post(
  '/payment',
  walletPayLimiter,
  idempotencyMiddleware({ failClosed: true, requireKey: true }),
  validate(
    Joi.object({
      amount: Joi.number().positive().required(),
      orderId: Joi.string(),
      storeId: Joi.string(),
      storeName: Joi.string(),
      description: Joi.string(),
      items: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().max(200),
            quantity: Joi.number().integer().positive(),
            price: Joi.number().positive(),
          }).unknown(false),
        )
        .max(50)
        .optional(),
    }),
  ),
  // Week-3 shadow validation against canonical WalletDebitSchema.
  validateWithSharedTypes(WalletDebitSchema, 'POST /api/wallet/payment', {
    bodyShaper: shapeWalletPayment,
  }),
  processPayment,
);

/**
 * @route   PUT /api/wallet/settings
 * @desc    Update wallet settings
 * @body    { autoTopup, autoTopupThreshold, autoTopupAmount, lowBalanceAlert, lowBalanceThreshold }
 * @access  Private
 */
router.put(
  '/settings',
  validate(
    Joi.object({
      autoTopup: Joi.boolean(),
      autoTopupThreshold: Joi.number().min(0),
      autoTopupAmount: Joi.number().positive(),
      lowBalanceAlert: Joi.boolean(),
      lowBalanceThreshold: Joi.number().min(0),
    }),
  ),
  updateWalletSettings,
);

/**
 * @route   POST /api/wallet/initiate-payment
 * @desc    Initiate payment gateway transaction
 * @body    { amount, currency, paymentMethod, paymentMethodId, userDetails, metadata }
 * @access  Private
 */
router.post(
  '/initiate-payment',
  walletPaymentLimiter,
  walletPayLimiter,
  idempotencyMiddleware({ failClosed: true, requireKey: true }),
  validate(
    Joi.object({
      amount: Joi.number().positive().required(),
      currency: Joi.string().max(3),
      // Normalize field name — accept both for backwards compatibility
      // paymentMethod is the canonical name used by rez-payment-service;
      // paymentMethodType is the legacy name. Both are accepted here so the
      // monolith and payment-service can interoperate during migration.
      paymentMethod: Joi.string().valid('cod', 'wallet', 'razorpay', 'upi', 'card', 'netbanking').optional(),
      // ISSUE-02 FIX: paymentMethodType was missing from this schema.
      // The validation middleware uses stripUnknown:true, so any field absent
      // from the schema is silently removed before the controller reads it.
      // The controller at walletPaymentController.ts requires paymentMethodType
      // and returns 400 if it is missing — meaning this field was always stripped
      // before the controller could read it, causing every request to fail.
      paymentMethodType: Joi.string().valid('card', 'upi', 'wallet', 'netbanking').optional(),
      purpose: Joi.string().valid('wallet_topup', 'order_payment', 'event_booking', 'financial_service', 'other'),
      userDetails: Joi.object({
        name: Joi.string().max(200),
        email: Joi.string().email(),
        phone: Joi.string().max(20),
      }),
      metadata: Joi.object().unknown(true),
      returnUrl: Joi.string().uri(),
      cancelUrl: Joi.string().uri(),
    }),
  ),
  // Normalize field names — accept both paymentMethodType and paymentMethod
  // for backwards compatibility with clients sending either field name.
  // paymentMethod is the canonical name used by rez-payment-service.
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.body.paymentMethodType && !req.body.paymentMethod) {
      req.body.paymentMethod = req.body.paymentMethodType;
    }
    if (!req.body.paymentMethod && !req.body.paymentMethodType) {
      return res.status(400).json({
        success: false,
        error: 'paymentMethod or paymentMethodType is required',
      });
    }
    return next();
  },
  initiatePayment,
);

/**
 * @route   POST /api/wallet/confirm-payment
 * @desc    Confirm payment after frontend Stripe confirmCardPayment succeeds
 * @body    { paymentIntentId }
 * @access  Private
 *
 * DISABLED: Stripe is not an active payment gateway. Re-enable when Stripe
 * integration is officially launched by replacing the 501 handler below with
 * idempotencyMiddleware + validate + confirmPayment.
 */
router.post('/confirm-payment', (_req: any, res: any) =>
  res.status(503).json({
    success: false,
    message: 'Stripe payments are temporarily disabled. Use Razorpay or wallet payment.',
    code: 'STRIPE_DISABLED',
  }),
);

/**
 * @route   GET /api/wallet/payment-status/:paymentId
 * @desc    Check payment status
 * @access  Private
 * @security IDOR guard: Controller verifies payment belongs to authenticated user
 * BED-014: added authenticate middleware
 */
router.get('/payment-status/:paymentId', authenticate, checkPaymentStatus);

/**
 * @route   GET /api/wallet/payment-methods
 * @desc    Get available payment methods
 * @access  Private
 * BED-014: added authenticate middleware
 */
router.get('/payment-methods', authenticate, getPaymentMethods);

/**
 * @route   POST /api/wallet/dev-topup
 * @desc    Add test funds to wallet (DEVELOPMENT ONLY)
 * @body    { amount, type: 'rez' | 'promo' | 'cashback' }
 * @access  Private (dev only)
 *
 * BUG-042 FIX: Hard 404 guard — this route must NEVER be reachable outside
 * of a development environment regardless of how the router is mounted.
 * The outer `if` prevents the route from being registered at all in non-dev
 * environments; the inline middleware provides a second, fail-safe layer so
 * that even if the route somehow gets registered (e.g. a misconfigured env
 * variable), it returns 404 rather than executing the controller.
 */
if (process.env.NODE_ENV === 'development') {
  router.post(
    '/dev-topup',
    authenticate,
    walletWriteLimiter,
    (req, res, next) => {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(404).json({ success: false, message: 'Not found' });
      }
      return next();
    },
    devTopup,
  );
}

/**
 * @route   POST /api/wallet/sync-balance
 * @desc    Sync wallet balance from CoinTransaction (fixes discrepancies)
 * @access  Private
 */
router.post('/sync-balance', walletSyncLimiter, requireReAuth(), idempotencyMiddleware(), syncWalletBalance);

/**
 * @route   POST /api/wallet/refund
 * @desc    Refund a wallet payment (admin only — automatic refunds happen in order cancellation flow)
 * @body    { transactionId, amount, reason }
 * @access  Admin only (senior admin+)
 */
router.post(
  '/refund',
  walletRefundLimiter,
  idempotencyMiddleware(),
  requireSeniorAdmin,
  validate(
    Joi.object({
      transactionId: Joi.string().required(),
      amount: Joi.number().positive(),
      reason: Joi.string().max(500).required(),
    }),
  ),
  refundPayment,
);

/**
 * @route   GET /api/wallet/expiring-coins
 * @desc    Get coins grouped by expiry period (this_week, this_month, next_month)
 * @access  Private
 */
router.get('/expiring-coins', getExpiringCoins);

/**
 * @route   GET /api/wallet/recharge/preview
 * @desc    Preview recharge cashback calculation before purchase
 * @query   amount
 * @access  Private
 */
router.get('/recharge/preview', previewRechargeCashback);

/**
 * @route   GET /api/wallet/scheduled-drops
 * @desc    Get upcoming coin drops and claimable rewards
 * @access  Private
 */
router.get('/scheduled-drops', getScheduledDrops);

/**
 * @route   GET /api/wallet/coin-rules
 * @desc    Get dynamic coin usage/earning rules
 * @access  Private
 */
router.get('/coin-rules', getCoinRules);
router.get('/redemption-suggestions', getRedemptionSuggestions);

/**
 * @route   POST /api/wallet/welcome-coins
 * @desc    Grant 50 welcome coins to a new user (idempotent — safe to call multiple times)
 * @access  Private (authenticated users only)
 */
// BUG-06: Add strict rate limiting — 3 attempts per hour per user to prevent abuse
const welcomeCoinsLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many welcome-coin requests. Please try again later.',
  prefix: 'welcome-coins',
});
router.post('/welcome-coins', welcomeCoinsLimiter, grantWelcomeCoins);

/**
 * @route   GET /api/wallet/conversion-rate
 * @desc    Get the current coin-to-rupee conversion rate
 * @access  Private
 */
router.get(
  '/conversion-rate',
  walletReadLimiter,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    // Primary source: WalletConfig singleton (admin-configurable at runtime)
    // Fallback: env var REZ_COIN_TO_RUPEE_RATE, then hardcoded default of 1
    let coinToRupeeRate: number;
    try {
      const { WalletConfig } = require('../models/WalletConfig');
      const config = await WalletConfig.findOne({ singleton: true }).select('coinConversion').lean();
      coinToRupeeRate = config?.coinConversion?.rezToInr ?? parseFloat(process.env.REZ_COIN_TO_RUPEE_RATE || '1');
    } catch {
      coinToRupeeRate = parseFloat(process.env.REZ_COIN_TO_RUPEE_RATE || '1');
    }
    return res.json({ success: true, data: { coinToRupeeRate } });
  }),
);

/**
 * @route   GET /api/wallet/rez-cash
 * @desc    REZ Cash savings identity — lifetime savings, trend, milestones, real-world equivalents
 * @access  Private
 */
router.get('/rez-cash', walletReadLimiter, getRezCashIdentity);

/**
 * @route   POST /api/wallet/redeem-coins
 * @desc    Redeem REZ coins for a rupee discount (1 coin = ₹0.10, min 50 coins)
 * @body    { amount: number, merchantId?: string, orderId?: string }
 * @access  Private (consumer JWT)
 */
router.post(
  '/redeem-coins',
  walletRedeemLimiter,
  idempotencyMiddleware({ failClosed: true, requireKey: true }),
  validate(
    Joi.object({
      amount: Joi.number().integer().min(50).required(),
      merchantId: Joi.string().optional(),
      orderId: Joi.string().optional(),
    }),
  ),
  redeemCoins,
);

// ---------------------------------------------------------------------------
// Internal service-to-service route — Hotel OTA REZ coin burn
// ---------------------------------------------------------------------------
// POST /api/wallet/internal/debit
// Called by Hotel OTA when a user burns REZ coins during checkout, so the
// actual REZ wallet balance is decremented (not just the OTA-cached snapshot).
// Protected by X-Internal-Token header; no user JWT required.
router.post(
  '/internal/debit',
  requireInternalToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { userId, amountPaise, referenceId, description } = req.body;

    // ROUTE-SEC-016 FIX: Validate userId as proper ObjectId format using isValid guard.
    if (!userId || typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'userId is required and must be a valid ObjectId' });
    }
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ success: false, message: 'amountPaise must be a positive integer' });
    }
    if (!referenceId || typeof referenceId !== 'string') {
      return res.status(400).json({ success: false, message: 'referenceId is required for idempotency' });
    }

    // Convert paise → coin units (1 REZ coin = ₹1 by default)
    const rezCoinToRupeeRate = parseFloat(process.env.REZ_COIN_TO_RUPEE_RATE || '1');
    const coinAmount = Math.round(amountPaise / (rezCoinToRupeeRate * 100));

    if (coinAmount <= 0) {
      return res.status(400).json({ success: false, message: 'amountPaise too small to debit any coins' });
    }

    try {
      const result = await walletService.debit({
        userId,
        amount: coinAmount,
        source: 'hotel_booking_burn',
        description: description || `REZ coins burned on hotel booking`,
        operationType: 'payment',
        referenceId,
        referenceModel: 'OtaBooking',
        coinType: 'rez',
      });

      logger.info('[INTERNAL DEBIT] REZ coins debited for hotel booking burn', {
        userId,
        coinAmount,
        referenceId,
        newBalance: result.newBalance,
      });

      return res.json({ success: true, data: { coinAmount, newBalance: result.newBalance } });
    } catch (err: any) {
      // Duplicate referenceId — already debited, treat as success
      if (err?.code === 11000 || err?.message?.includes('duplicate')) {
        return res.json({ success: true, data: { coinAmount, duplicate: true } });
      }
      if (err?.message?.includes('Insufficient')) {
        return res.status(422).json({ success: false, message: 'Insufficient REZ coin balance' });
      }
      logger.error('[INTERNAL DEBIT] Failed to debit REZ coins', { userId, referenceId, error: err?.message });
      return res.status(500).json({ success: false, message: 'Failed to debit wallet' });
    }
  }),
);

export default router;
