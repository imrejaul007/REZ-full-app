// @ts-nocheck
import { Router } from 'express';
import { handleRazorpayWebhook, handleStripeWebhook } from '../controllers/webhookController';
import express from 'express';
import { webhookRateLimit } from '../middleware/rateLimiter';
import { handleRendezWebhook } from '../controllers/rendezWebhookController';

const router = Router();

/**
 * Webhook Routes
 * Base path: /api/webhooks
 *
 * IMPORTANT: Webhook routes should NOT use authentication middleware
 * They are verified using signature verification instead
 */

/**
 * @route POST /api/webhooks/razorpay
 * @desc Handle Razorpay webhook events
 * @access Public (verified with signature)
 *
 * Events handled:
 * - payment.captured: Payment successfully captured
 * - payment.failed: Payment failed
 * - payment.authorized: Payment authorized (pending capture)
 * - order.paid: Order marked as paid
 * - refund.created: Refund initiated
 * - refund.processed: Refund completed
 * - refund.failed: Refund failed
 */
router.post(
  '/razorpay',
  // webhookRateLimit: 500 req/min, skipped for requests bearing a valid
  // Razorpay signature header. Unsigned or unknown-source requests are
  // counted against the IP-keyed bucket to absorb gateway bursts safely.
  webhookRateLimit,
  // WS-008 FIX: Capture raw bytes for HMAC verification before JSON parsing.
  // JSON.stringify(req.body) may not reproduce the exact bytes Razorpay signed.
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }),
  handleRazorpayWebhook,
);

/**
 * @route POST /api/webhooks/stripe
 * @desc Handle Stripe webhook events
 * @access Public (verified with signature)
 *
 * Events handled:
 * - payment_intent.succeeded: Payment completed successfully
 * - payment_intent.payment_failed: Payment failed
 * - payment_intent.created: Payment intent created
 * - payment_intent.canceled: Payment intent canceled
 * - charge.refunded: Charge refunded
 * - checkout.session.completed: Checkout session completed
 */
router.post(
  '/stripe',
  // webhookRateLimit: skipped when Stripe-Signature header is present.
  webhookRateLimit,
  express.raw({ type: 'application/json' }), // Stripe requires raw body for signature verification
  handleStripeWebhook,
);

/**
 * @route POST /api/webhooks/rendez
 * @desc Handle Rendez partner webhook events
 * @access Public (verified with HMAC using RENDEZ_WEBHOOK_SECRET)
 *
 * Events handled:
 * - booking.created: Rendez user booked a merchant venue — stamp analytics.source='rendez'
 * - booking.cancelled: Mark the corresponding REZ order as cancelled
 */
router.post(
  '/rendez',
  webhookRateLimit,
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }),
  handleRendezWebhook,
);

export default router;
