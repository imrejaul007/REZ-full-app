// @ts-nocheck
import { Router } from 'express';
import express from 'express';
import { authenticate, requireSeniorAdmin } from '../middleware/auth';
import { validateWebhookPayload, logWebhookDetails, rateLimitWebhooks } from '../middleware/webhookValidation';
import { bbpsPayLimiter } from '../middleware/financialRateLimiter';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayConfig,
  createRazorpayRefund,
} from '../controllers/razorpayController';
// BL-C2 FIX: Import the canonical Razorpay webhook handler from webhookController.
// The canonical endpoint is POST /api/webhooks/razorpay (webhookRoutes.ts).
// This alias at /api/razorpay/webhook delegates to the same handler so that any
// existing Razorpay dashboard URL registrations on this path continue to work.
// Register only ONE URL in the Razorpay dashboard — prefer /api/webhooks/razorpay.
import { handleRazorpayWebhook as canonicalRazorpayWebhookHandler } from '../controllers/webhookController';

const router = Router();

/**
 * @route GET /api/razorpay/config
 * @desc Get Razorpay configuration for frontend
 * @access Public — returns only publishable key, not sensitive
 */
router.get('/config', getRazorpayConfig);

/**
 * @route POST /api/razorpay/create-order
 * @desc Create a Razorpay order
 * @access Private
 */
router.post('/create-order', authenticate, bbpsPayLimiter, createRazorpayOrder);

/**
 * @route POST /api/razorpay/verify-payment
 * @desc Verify Razorpay payment signature and complete order
 * @access Private
 */
router.post('/verify-payment', authenticate, bbpsPayLimiter, verifyRazorpayPayment);

/**
 * @route POST /api/razorpay/webhook
 * @desc Deprecated alias — delegates to the canonical Razorpay webhook handler.
 * @access Public (verified with signature)
 *
 * BL-C2 FIX: This endpoint previously had its own webhook handler in
 * razorpayController that handled fewer events and lacked idempotency guards,
 * drift monitoring, and FSM validation present in the canonical handler.
 *
 * The canonical Razorpay webhook endpoint is:
 *   POST /api/webhooks/razorpay  (webhookRoutes.ts → webhookController.handleRazorpayWebhook)
 *
 * IMPORTANT: Register only ONE URL in the Razorpay dashboard. The preferred URL
 * is /api/webhooks/razorpay. This alias exists only for backward compatibility.
 *
 * WS-008: Raw body is captured via the verify callback so HMAC verification uses
 * the exact bytes Razorpay signed rather than a re-serialised JSON.stringify.
 */
router.post(
  '/webhook',
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }),
  logWebhookDetails,
  validateWebhookPayload,
  rateLimitWebhooks,
  canonicalRazorpayWebhookHandler,
);

/**
 * @route POST /api/razorpay/refund
 * @desc Create a refund
 * @access Private
 */
router.post('/refund', authenticate, requireSeniorAdmin, bbpsPayLimiter, createRazorpayRefund);

export default router;
