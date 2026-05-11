// @ts-nocheck
import express, { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  createCheckoutSession,
  verifyStripeSession,
  verifyStripePayment,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { validate, validateParams, Joi } from '../middleware/validation';
import { financialWriteRateLimit } from '../middleware/rateLimiter';
import { idempotencyMiddleware } from '../middleware/idempotency';
import redisService from '../services/redisService';
import { logger } from '../config/logger';

// BE-PAY-003: Amount precision validation — Razorpay requires integer paise values.
// Accepts integers (1000 = ₹10.00) or floats with exactly 2 decimal places (10.00).
// Rejects values like 10.5 (3 decimal places) or 10.999.
const createOrderSchema = Joi.object({
  orderId: Joi.string().required(),
  amount: Joi.number()
    .positive()
    .max(99999999)
    .required()
    .custom((value, helpers) => {
      // Reject non-integer floats (e.g. 10.5, 10.999)
      if (!Number.isInteger(value) && !/^\d+\.\d{1,2}$/.test(String(value))) {
        return helpers.error('any.invalid', {
          message: 'Amount must be an integer (paise) or have at most 2 decimal places',
        });
      }
      return value;
    }),
  currency: Joi.string().max(3).optional(),
  metadata: Joi.object().optional(),
});

const verifyPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

const createCheckoutSessionSchema = Joi.object({
  tier: Joi.string().optional(),
  billingCycle: Joi.string().optional(),
  amount: Joi.number().positive().optional(),
  currency: Joi.string().optional(),
});

const verifyStripeSessionSchema = Joi.object({
  sessionId: Joi.string().required(),
});

const verifyStripePaymentSchema = Joi.object({
  paymentIntentId: Joi.string().required(),
});

const orderIdParamSchema = Joi.object({
  orderId: Joi.string().required(),
});

const router = express.Router();

/**
 * Payment Routes
 * Base path: /api/payment
 */

// ==================== RAZORPAY ROUTES ====================

// BE-PAY-014: Per-user payment initiation rate limiting — prevents spamming payment initiation.
// Tracks requests per user over a 1-minute window using Redis.
const paymentInitiationRateLimit = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userId = (req as any).userId;
  if (!userId) return next();

  const key = `payment-initiate:${userId}`;
  try {
    const client = redisService.getClient();
    if (!client) return next(); // Skip if Redis unavailable

    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, 60);
    }

    const MAX_REQUESTS = 10; // 10 payment initiations per minute per user
    if (count > MAX_REQUESTS) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many payment initiation requests. Please wait before trying again.',
      });
    }
  } catch (err) {
    logger.warn('[PaymentRateLimit] Redis error, skipping rate limit check:', err);
  }
  next();
};

// Create Razorpay order for payment (requires authentication)
// Route aliases: /create-order (monolith path) and /initiate (payment service path)
// A field normalizer maps between the two schemas so both callers are served.
router.post(
  ['/create-order', '/initiate'],
  authenticate,
  paymentInitiationRateLimit,
  financialWriteRateLimit,
  idempotencyMiddleware({ failClosed: true }),
  // Normalize incoming /initiate payload (paymentMethod, purpose, orchestratorIdempotencyKey)
  // to the create-order schema (orderId, amount) before validation.
  // API-06: The only purpose value currently handled by createPaymentOrder is 'order'.
  // Values like 'subscription', 'refund', 'event_booking', 'financial_service' are NOT
  // processed by this handler — do not advertise them in client-facing schemas.
  (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    // /initiate sends { orderId, amount, paymentMethod, purpose, orchestratorIdempotencyKey }
    // /create-order sends { orderId, amount, currency, metadata }
    // Both have orderId and amount — no field mapping needed; simply forward.
    // If purpose is provided and is not 'order', reject early to avoid silent no-ops.
    if (req.body.purpose !== undefined && req.body.purpose !== 'order') {
      return _res.status(400).json({
        success: false,
        error: 'UNSUPPORTED_PURPOSE',
        message: `purpose '${req.body.purpose}' is not supported. Only 'order' is handled by this endpoint.`,
      });
    }
    return next();
  },
  validate(createOrderSchema),
  createPaymentOrder,
);

// Verify Razorpay payment signature (requires authentication)
// Route aliases: /verify (monolith path) and /capture (payment service path)
router.post(
  ['/verify', '/capture'],
  authenticate,
  financialWriteRateLimit,
  idempotencyMiddleware({ failClosed: true }),
  // Normalize /capture payload: { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature }
  // into the /verify schema: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
  (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const b = req.body;
    if (b.razorpayPaymentId && !b.razorpay_payment_id) {
      b.razorpay_payment_id = b.razorpayPaymentId;
    }
    if (b.razorpayOrderId && !b.razorpay_order_id) {
      b.razorpay_order_id = b.razorpayOrderId;
    }
    if (b.razorpaySignature && !b.razorpay_signature) {
      b.razorpay_signature = b.razorpaySignature;
    }
    // /capture sends paymentId (internal), /verify sends orderId — map if needed
    if (b.paymentId && !b.orderId) {
      b.orderId = b.paymentId;
    }
    return next();
  },
  validate(verifyPaymentSchema),
  verifyPayment,
);

// Razorpay webhook: mounted in server.ts with express.raw() BEFORE JSON parser

// ==================== STRIPE ROUTES ====================

// Create Stripe Checkout Session for subscription or one-time payment (requires authentication)
router.post(
  '/create-checkout-session',
  authenticate,
  financialWriteRateLimit,
  idempotencyMiddleware({ failClosed: true }),
  validate(createCheckoutSessionSchema),
  createCheckoutSession,
);

// Verify Stripe checkout session after payment (requires authentication)
router.post(
  '/verify-stripe-session',
  authenticate,
  financialWriteRateLimit,
  idempotencyMiddleware({ failClosed: true }),
  validate(verifyStripeSessionSchema),
  verifyStripeSession,
);

// Verify Stripe payment intent (requires authentication)
router.post(
  '/verify-stripe-payment',
  authenticate,
  financialWriteRateLimit,
  idempotencyMiddleware({ failClosed: true }),
  validate(verifyStripePaymentSchema),
  verifyStripePayment,
);

// Stripe webhook: mounted in server.ts with express.raw() BEFORE JSON parser

// ==================== COMMON ROUTES ====================

// Get payment status for an order (requires authentication)
router.get('/status/:orderId', authenticate, validateParams(orderIdParamSchema), getPaymentStatus);

export default router;
