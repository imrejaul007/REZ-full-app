// @ts-nocheck
import { Router } from 'express';
import express from 'express';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth';
import { rechargeLimiter } from '../middleware/financialRateLimiter';
import { validateQuery, validateParams, validateBody } from '../middleware/validation';
import { idempotencyMiddleware } from '../middleware/idempotency';
import { logWebhookDetails, validateWebhookPayload, rateLimitWebhooks } from '../middleware/webhookValidation';
import {
  getOperators,
  getPlans,
  initiateRecharge,
  handleRazorpayWebhook,
  getRechargeHistory,
  getRechargeDetails,
} from '../controllers/rechargeController';

const router = Router();

// GET /operators?type=mobile&page=1&limit=10
router.get(
  '/operators',
  validateQuery(
    Joi.object({
      type: Joi.string().valid('mobile', 'dth', 'broadband').default('mobile'),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(10),
    }),
  ),
  getOperators,
);

// GET /operators/:code/plans?sort=amount&page=1&limit=10
router.get(
  '/operators/:code/plans',
  validateParams(
    Joi.object({
      code: Joi.string().alphanum().min(1).max(30).required(),
    }),
  ),
  validateQuery(
    Joi.object({
      sort: Joi.string().valid('amount', '-amount', 'popularity', '-popularity').default('amount'),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(50).default(10),
    }),
  ),
  getPlans,
);

// POST / — Initiate recharge (requires auth)
router.post(
  '/',
  requireAuth,
  rechargeLimiter,
  idempotencyMiddleware(),
  validateBody(
    Joi.object({
      operatorCode: Joi.string().alphanum().min(1).max(30).required(),
      amount: Joi.number().positive().min(1).max(10000).required(),
      phoneNumber: Joi.string()
        .pattern(/^\+[1-9]\d{9,14}$/)
        .required()
        .messages({
          'string.pattern.base': 'Phone number must be in E.164 format (e.g., +919876543210)',
        }),
      planId: Joi.string().hex().length(24).optional(),
    }),
  ),
  initiateRecharge,
);

// POST /webhook/razorpay — Razorpay webhook callback
// SECURITY FIX: Added raw body capture, webhook validation, and rate limiting to match
// the canonical razorpayRoutes.ts webhook handler. Without these, the handler cannot
// verify Razorpay signatures and is vulnerable to forged payment events.
router.post(
  '/webhook/razorpay',
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }),
  rateLimitWebhooks,
  logWebhookDetails,
  validateWebhookPayload,
  handleRazorpayWebhook,
);

// GET /history — Get recharge history (requires auth)
router.get(
  '/history',
  requireAuth,
  validateQuery(
    Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  ),
  getRechargeHistory,
);

// GET /:transactionId — Get specific recharge details (requires auth)
router.get(
  '/:transactionId',
  requireAuth,
  validateParams(
    Joi.object({
      transactionId: Joi.string().hex().length(24).required(),
    }),
  ),
  getRechargeDetails,
);

export default router;
