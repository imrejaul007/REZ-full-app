// @ts-nocheck
import { Router } from 'express';
import express from 'express';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery, Joi } from '../middleware/validation';
import { billPayLimiter, billFetchLimiter, refundRequestLimiter } from '../middleware/rateLimiter';
import { idempotencyMiddleware } from '../middleware/idempotency';
import {
  getBillTypes,
  getProviders,
  fetchBill,
  payBill,
  getHistory,
  getPlans,
  requestRefund,
  handleBBPSWebhook,
} from '../controllers/billPaymentController';

const router = Router();

const ALL_BILL_TYPES = [
  'electricity',
  'water',
  'gas',
  'internet',
  'mobile_postpaid',
  'mobile_prepaid',
  'broadband',
  'dth',
  'landline',
  'insurance',
  'fastag',
  'education_fee',
];

// ─── Validation Schemas ────────────────────────────────────────────────────

const providerQuerySchema = Joi.object({
  type: Joi.string()
    .valid(...ALL_BILL_TYPES)
    .required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

const fetchBillSchema = Joi.object({
  providerId: Joi.string().required().messages({ 'any.required': 'Provider ID is required' }),
  customerNumber: Joi.string().trim().min(1).max(50).required().messages({
    'any.required': 'Customer number is required',
    'string.max': 'Customer number must be 50 characters or less',
  }),
});

const payBillSchema = Joi.object({
  providerId: Joi.string().required().messages({ 'any.required': 'Provider ID is required' }),
  customerNumber: Joi.string().trim().min(1).max(50).required(),
  amount: Joi.number().positive().required().messages({
    'any.required': 'Amount is required',
    'number.positive': 'Amount must be greater than 0',
  }),
  razorpayPaymentId: Joi.string().required().messages({ 'any.required': 'razorpayPaymentId is required' }),
  planId: Joi.string().optional(),
});

const historyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  billType: Joi.string()
    .valid(...ALL_BILL_TYPES)
    .optional(),
});

const plansQuerySchema = Joi.object({
  providerId: Joi.string().required(),
  circle: Joi.string().default('KA'),
});

const refundSchema = Joi.object({
  paymentId: Joi.string().required(),
  reason: Joi.string().max(200).optional(),
});

// ─── Public routes ─────────────────────────────────────────────────────────

router.get('/types', getBillTypes);

// Webhook — no auth, called by Razorpay
// WS-008: Capture raw bytes for HMAC verification (same pattern as razorpayRoutes.ts).
// JSON.stringify(req.body) may reorder keys / alter whitespace vs. the original signed bytes.
router.post(
  '/webhook/bbps',
  express.json({
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf.toString('utf8');
    },
  }),
  handleBBPSWebhook,
);

// ─── Authenticated routes ──────────────────────────────────────────────────

router.use(authenticate);

router.get('/providers', validateQuery(providerQuerySchema), getProviders);
// TASK-25: billFetchLimiter — 30 fetches / 5 min per user
router.post('/fetch-bill', billFetchLimiter, validate(fetchBillSchema), fetchBill);
router.get('/plans', validateQuery(plansQuerySchema), getPlans);
// TASK-25: billPayLimiter — 10 attempts / 15 min per user
// TASK-26: idempotencyMiddleware — deduplicate double-taps with Idempotency-Key header
router.post(
  '/pay',
  billPayLimiter,
  idempotencyMiddleware({ ttlSeconds: 24 * 60 * 60 }),
  validate(payBillSchema),
  payBill,
);
router.get('/history', validateQuery(historyQuerySchema), getHistory);
// TASK-25: refundRequestLimiter — 5 refunds / hour per user
// BED-013: added authenticate middleware
router.post('/refund', authenticate, refundRequestLimiter, validate(refundSchema), requestRefund);

export default router;
