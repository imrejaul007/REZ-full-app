import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { asyncHandler } from '../utils/asyncHandler';
import { Order } from '../models/Order';
import { WebhookLog } from '../models/WebhookLog';
import DealRedemption from '../models/DealRedemption';
import Campaign from '../models/Campaign';
import paymentService from '../services/PaymentService';
import stripeService from '../services/stripeService';
import { razorpayService } from '../services/razorpayService';
import { sendBadRequest, sendUnauthorized } from '../utils/response';
import Stripe from 'stripe';
import EventBooking from '../models/EventBooking';
import Event from '../models/Event';
import eventRewardService from '../services/eventRewardService';
import { refundService } from '../services/refundService';
import { walletService } from '../services/walletService';
import merchantWalletService from '../services/merchantWalletService';
import { paymentFailureCounter } from '../config/prometheus';
import paymentOrchestratorService from '../services/PaymentOrchestratorService';
import { assertPaymentTransition } from '../config/financialStateMachine';
import { publishPaymentEvent } from '../events/paymentQueue';
import { UserSubscription } from '../models/UserSubscription';
import { CoinTransaction } from '../models/CoinTransaction';

// ── Money Drift: 60s timer for payment-confirmed-but-no-wallet-credit ────────
// When a payment.captured webhook fires we record a timer. If the post-payment
// pipeline (which credits the wallet/coins) does NOT complete within 60s we emit
// a structured [DRIFT] log that alerting rules can fire on.
const _paymentCapturedTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
// Safety cap — under a severe replay storm, evict the oldest pending timer rather
// than letting the Map grow unboundedly. 1000 concurrent uncredited payments
// would already be a P0 incident warranting investigation.
const _DRIFT_TIMER_MAX = 1000;

function watchForWalletCreditDrift(orderId: string, paymentId: string, userId: string, amount: number): void {
  // If a timer already exists for this order, don't start a second one
  if (_paymentCapturedTimers.has(orderId)) return;
  // Under a replay storm, evict the oldest pending timer rather than growing unboundedly
  if (_paymentCapturedTimers.size >= _DRIFT_TIMER_MAX) {
    const oldestOrderId = _paymentCapturedTimers.keys().next().value;
    if (oldestOrderId) {
      clearTimeout(_paymentCapturedTimers.get(oldestOrderId)!);
      _paymentCapturedTimers.delete(oldestOrderId);
    }
  }
  const timer = setTimeout(() => {
    _paymentCapturedTimers.delete(orderId);
    logger.warn('[DRIFT] payment_confirmed_no_wallet_credit', {
      orderId,
      paymentId,
      userId,
      amount,
      driftWindowSeconds: 60,
    });
  }, 60_000);
  if (timer.unref) timer.unref();
  _paymentCapturedTimers.set(orderId, timer);
}

function clearWalletCreditDriftTimer(orderId: string): void {
  const timer = _paymentCapturedTimers.get(orderId);
  if (timer) {
    clearTimeout(timer);
    _paymentCapturedTimers.delete(orderId);
  }
}

/**
 * Enhanced Razorpay Webhook Handler
 * POST /api/webhooks/razorpay
 *
 * Handles all Razorpay webhook events with:
 * - Signature verification
 * - Idempotency handling
 * - Comprehensive logging
 * - Error handling and retries
 */
export const handleRazorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const webhookSignature = req.headers['x-razorpay-signature'] as string;
  // WS-008 FIX (primary handler): Use raw bytes captured by route middleware for
  // HMAC verification.  JSON.stringify(req.body) cannot reproduce the original bytes
  // Razorpay signed (key ordering, whitespace), leading to false signature failures.
  const webhookBody: string = (req as any).rawBody ?? JSON.stringify(req.body);
  const event = req.body;

  logger.info('🔔 [RAZORPAY WEBHOOK] Event received:', {
    eventType: event.event,
    eventId: event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || 'unknown',
    timestamp: new Date().toISOString(),
  });

  // Hard guard: reject immediately if the webhook secret is not configured.
  // Without a secret we cannot verify the request origin — returning 500 tells
  // Razorpay's retry engine that this is a server misconfiguration, not a bad
  // request, so it will retry once the deployment is fixed.
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET.trim() === '') {
    logger.error('❌ [RAZORPAY WEBHOOK] RAZORPAY_WEBHOOK_SECRET is not configured — rejecting webhook');
    return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
  }

  // Validate webhook signature
  if (!webhookSignature) {
    logger.error('❌ [RAZORPAY WEBHOOK] Missing signature');
    return sendBadRequest(res, 'Missing webhook signature');
  }

  try {
    // Step 1: Verify webhook signature
    const isValidSignature = razorpayService.validateWebhookSignature(webhookBody, webhookSignature);

    if (!isValidSignature) {
      logger.error('❌ [RAZORPAY WEBHOOK] Invalid signature');

      // Log failed verification attempt
      await WebhookLog.create({
        provider: 'razorpay',
        eventId: `failed_${Date.now()}`,
        eventType: event.event || 'unknown',
        payload: event,
        signature: webhookSignature,
        signatureValid: false,
        processed: false,
        status: 'failed',
        errorMessage: 'Invalid webhook signature',
      });

      return sendUnauthorized(res, 'Invalid webhook signature');
    }

    logger.info('✅ [RAZORPAY WEBHOOK] Signature verified');

    // Step 2: Extract event details
    const eventType = event.event;
    const eventId =
      event.payload?.payment?.entity?.id ||
      event.payload?.order?.entity?.id ||
      event.payload?.refund?.entity?.id ||
      `${event.account_id}:${event.event}:${event.created_at}`;

    // Step 3+4: Atomic idempotency — try to insert log entry; if eventId exists, it's a duplicate
    let webhookLog;
    try {
      webhookLog = await WebhookLog.create({
        provider: 'razorpay',
        eventId,
        eventType,
        payload: event,
        signature: webhookSignature,
        signatureValid: true,
        processed: false,
        status: 'processing',
        metadata: {
          paymentId: event.payload?.payment?.entity?.id,
          orderId: event.payload?.payment?.entity?.notes?.orderId || event.payload?.order?.entity?.notes?.orderId,
          amount: event.payload?.payment?.entity?.amount,
          currency: event.payload?.payment?.entity?.currency,
        },
      });
    } catch (err: any) {
      // Unique index violation = duplicate event
      if (err.code === 11000) {
        logger.info('⚠️ [RAZORPAY WEBHOOK] Duplicate event detected:', eventId);
        return res.status(200).json({
          received: true,
          status: 'duplicate',
          message: 'Event already processed',
        });
      }
      throw err;
    }

    logger.info('📝 [RAZORPAY WEBHOOK] Log created:', webhookLog._id);

    // Step 5: Process the webhook event
    try {
      await processRazorpayEvent(event, webhookLog);

      // Mark as successfully processed.
      // DP-D005 FIX: Use atomic findOneAndUpdate with explicit w:'majority' instead of
      // mutable-doc .save().  Under primary stepdown a .save() that returns without
      // error but was only acknowledged by a secondary could be lost after failover,
      // leaving the webhookLog in 'processing' state — causing the retry-cron to
      // re-process the event and double-apply wallet credits / order state changes.
      await WebhookLog.findOneAndUpdate(
        { _id: webhookLog._id },
        { $set: { processed: true, processedAt: new Date(), status: 'success' } },
        { writeConcern: { w: 'majority', j: true } },
      );
      webhookLog.processed = true;
      webhookLog.status = 'success';

      logger.info('✅ [RAZORPAY WEBHOOK] Event processed successfully');

      return res.status(200).json({
        received: true,
        status: 'success',
        eventId: webhookLog.eventId,
      });
    } catch (processingError: any) {
      logger.error('❌ [RAZORPAY WEBHOOK] Processing error:', processingError);

      // Update log with error — use pending_retry if under max retries.
      // Same DP-D005 pattern: atomic + w:majority to prevent lost status update.
      const newRetryCount = webhookLog.retryCount + 1;
      const newStatus = newRetryCount >= 3 ? 'failed' : 'pending_retry';
      await WebhookLog.findOneAndUpdate(
        { _id: webhookLog._id },
        { $set: { status: newStatus, errorMessage: processingError.message }, $inc: { retryCount: 1 } },
        { writeConcern: { w: 'majority', j: true } },
      );
      webhookLog.retryCount = newRetryCount;
      webhookLog.status = newStatus;
      webhookLog.errorMessage = processingError.message;

      logger.info(
        `[RAZORPAY WEBHOOK] Event ${webhookLog.eventId} marked as ${webhookLog.status} (retryCount: ${webhookLog.retryCount})`,
      );

      // Return 500 for pending_retry so Razorpay retries the event; 200 for permanent failures
      return res.status(newStatus === 'pending_retry' ? 500 : 200).json({
        received: true,
        status: 'error',
        message: processingError.message,
      });
    }
  } catch (error: any) {
    logger.error('❌ [RAZORPAY WEBHOOK] Unexpected error:', error);

    // FL-02 FIX: Return 500 for unexpected errors so Razorpay retries.
    // Returning 200 suppressed retries during server-side failures, causing
    // data inconsistency (payment confirmed, but wallet never credited).
    return res.status(500).json({
      received: true,
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * Process Razorpay webhook events
 */
async function processRazorpayEvent(event: any, webhookLog: any): Promise<void> {
  const eventType = event.event;

  logger.info(`🔄 [RAZORPAY WEBHOOK] Processing event type: ${eventType}`);

  switch (eventType) {
    case 'payment.captured':
      await handleRazorpayPaymentCaptured(event, webhookLog);
      break;

    case 'payment.failed':
      await handleRazorpayPaymentFailed(event);
      break;

    case 'payment.authorized':
      await handleRazorpayPaymentAuthorized(event);
      break;

    case 'order.paid':
      await handleRazorpayOrderPaid(event);
      break;

    case 'refund.created':
      await handleRazorpayRefundCreated(event);
      break;

    case 'refund.processed':
      await handleRazorpayRefundProcessed(event);
      break;

    case 'refund.failed':
      await handleRazorpayRefundFailed(event);
      break;

    case 'subscription.charged':
      await handleRazorpaySubscriptionCharged(event);
      break;

    case 'subscription.cancelled':
      await handleRazorpaySubscriptionCancelled(event);
      break;

    default:
      logger.info(`ℹ️ [RAZORPAY WEBHOOK] Unhandled event type: ${eventType}`);
    // Don't throw error for unhandled events
  }
}

/**
 * Handle payment.captured event
 */
async function handleRazorpayPaymentCaptured(event: any, webhookLog: any): Promise<void> {
  const payment = event.payload.payment.entity;
  const orderId = payment.notes?.orderId;

  if (!orderId) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order ID not found in payment notes');
    return;
  }

  logger.info('✅ [RAZORPAY WEBHOOK] Payment captured for order:', orderId);

  // CONCURRENCY FIX: Replace findById → check → save with a single atomic
  // findOneAndUpdate that uses a status guard ({ 'payment.status': { $ne: 'paid' } }).
  // Under concurrent Razorpay retries, only one update wins; the loser gets null
  // and returns early, preventing duplicate downstream processing.

  // First validate the amount before doing any write. We need the order data
  // to compare totals, so fetch it read-only first.
  const orderForValidation = await Order.findById(orderId).lean();
  if (!orderForValidation) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order not found:', orderId);
    return;
  }

  const capturedAmount = payment.amount / 100;
  const orderTotal = orderForValidation.totals?.total ?? 0;

  // CRITICAL FIX: Compare amounts in paise (Razorpay's native unit) to avoid floating-point rounding errors.
  // payment.amount is already in paise; convert orderTotal to paise for exact comparison.
  const orderTotalPaise = Math.round(orderTotal * 100);
  if (payment.amount !== orderTotalPaise) {
    logger.error('🚨 [RAZORPAY WEBHOOK] Amount mismatch!', {
      capturedPaise: payment.amount,
      orderTotalPaise,
      capturedRupees: capturedAmount,
      orderTotalRupees: orderTotal,
      orderId,
      paymentId: payment.id,
      difference: payment.amount - orderTotalPaise,
    });
    // Flag for manual review without touching payment status.
    // Also set postPaymentProcessed: true so the pipeline is NOT triggered
    // after a human resolves the mismatch — they must use the admin panel to
    // manually trigger post-payment steps once they've verified the discrepancy.
    await Order.findByIdAndUpdate(orderId, {
      $set: { postPaymentProcessed: true },
      $push: {
        flags: 'amount_mismatch',
        timeline: {
          status: orderForValidation.status,
          message: `Payment amount mismatch: captured ${payment.amount}p but order total is ${orderTotalPaise}p. Flagged for manual review.`,
          timestamp: new Date(),
          metadata: {
            capturedPaise: payment.amount,
            orderTotalPaise,
            paymentId: payment.id,
            differencePaise: payment.amount - orderTotalPaise,
          },
        },
      },
    });

    try {
      const orderSocketService = require('../services/orderSocketService').default;
      orderSocketService.emitToAdmin('PAYMENT_AMOUNT_MISMATCH', {
        orderId: String(orderForValidation._id),
        orderNumber: orderForValidation.orderNumber,
        capturedPaise: payment.amount,
        orderTotalPaise,
        capturedRupees: capturedAmount,
        orderTotalRupees: orderTotal,
        paymentId: payment.id,
        differencePaise: payment.amount - orderTotalPaise,
        timestamp: new Date(),
      });
    } catch (alertErr) {
      logger.error('[RAZORPAY WEBHOOK] Failed to emit admin alert:', alertErr);
    }

    logger.warn(`🚨 [RAZORPAY WEBHOOK] Order ${orderForValidation.orderNumber} flagged for amount mismatch review`);
    return;
  }

  // F001-C9 FIX: hard throw on invalid Order.payment.status transitions
  const currentPaymentStatus = (orderForValidation as any).payment?.status ?? 'pending';
  assertPaymentTransition(currentPaymentStatus, 'paid');

  // Atomic test-and-set: only one concurrent delivery of this webhook wins.
  // Any concurrent duplicate gets null back and returns early.
  const order = await Order.findOneAndUpdate(
    { _id: orderId, 'payment.status': { $ne: 'paid' } },
    {
      $set: {
        'payment.status': 'paid',
        'payment.transactionId': payment.id,
        'payment.paidAt': new Date(payment.created_at * 1000),
        'totals.paidAmount': capturedAmount,
        paymentGateway: {
          gatewayPaymentId: payment.id,
          gateway: 'razorpay',
          currency: payment.currency,
          amountPaid: capturedAmount,
          paidAt: new Date(payment.created_at * 1000),
        },
      },
      $push: {
        timeline: {
          status: 'payment_captured',
          message: 'Payment captured successfully via webhook',
          timestamp: new Date(),
        },
      },
    },
    { new: true },
  );

  if (!order) {
    logger.info('⚠️ [RAZORPAY WEBHOOK] Payment already marked as paid — duplicate webhook ignored');
    return;
  }

  // Notify the merchant's dashboard of confirmed payment in real-time
  try {
    const orderSocketService = require('../services/orderSocketService').default;
    const Store = require('../models/Store').Store || require('../models/Store').default;
    const store = await Store.findById(order.store).select('merchant').lean();
    const merchantId = store?.merchant?.toString();
    if (merchantId) {
      orderSocketService.emitToMerchant(merchantId, 'payment-confirmed', {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        amount: capturedAmount,
        paymentId: payment.id,
        gateway: 'razorpay',
      });
    }
  } catch (socketErr) {
    logger.warn('[RAZORPAY WEBHOOK] Merchant socket notification failed (non-blocking):', socketErr);
  }

  // Run the full post-payment pipeline (stock deduction, cashback, wallet credits,
  // notifications) if it has not already run for this order.
  // ATOMICITY FIX: Use findOneAndUpdate with { postPaymentProcessed: { $ne: true } } as
  // the condition and set postPaymentProcessed: true in the same operation. This closes
  // the TOCTOU window that existed when reading the flag and writing it in two steps —
  // if two concurrent webhook deliveries both reach this point, only ONE wins the update
  // and proceeds; the other gets null and is silently skipped.
  const pipelineToken = await Order.findOneAndUpdate(
    { _id: (order as any)._id, postPaymentProcessed: { $ne: true } },
    { $set: { postPaymentProcessed: true } },
    { new: false }, // return the OLD doc so we can confirm we were the winner
  );

  if (pipelineToken) {
    // Start drift timer — if wallet credit doesn't complete within 60s we surface a [DRIFT] log
    const driftUserId = String((orderForValidation as any).user || '');
    watchForWalletCreditDrift(orderId, payment.id, driftUserId, capturedAmount);

    try {
      await paymentService.handlePaymentSuccess(
        String((order as any)._id),
        {
          razorpay_order_id: payment.order_id,
          razorpay_payment_id: payment.id,
          razorpay_signature: '',
        },
        { webhookLogId: webhookLog?._id?.toString() },
      );
      // Pipeline succeeded — cancel drift alert
      clearWalletCreditDriftTimer(orderId);

      // ── ORCHESTRATOR SHADOW RUN ─────────────────────────────────────────────
      // Legacy pipeline ran successfully above. Run the orchestrator in shadow
      // mode so logs can be compared. MUST NOT affect control flow on any error.
      const _orchShadow = paymentOrchestratorService
        .processTopUp({
          userId: driftUserId,
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount, // already in paise from Razorpay
          currency: payment.currency || 'INR',
          source: 'razorpay',
          idempotencyKey: `webhook:captured:${payment.id}`,
          legacyOutcome: 'wallet_credited_via_legacy_pipeline',
        })
        .then((shadowResult) => {
          logger.info('[ORCHESTRATOR:SHADOW] razorpay_webhook_shadow_result', {
            paymentId: payment.id,
            orderId,
            userId: driftUserId,
            shadowResult,
          });
        })
        .catch((shadowErr: any) => {
          logger.error('[ORCHESTRATOR:SHADOW] razorpay_webhook_shadow_error', {
            paymentId: payment.id,
            orderId,
            error: shadowErr?.message,
          });
        });
      void _orchShadow;

      // Strangler Fig: publish payment event for async side-effect processing
      publishPaymentEvent({
        eventId: `payment-captured:${payment.id}`,
        eventType: 'payment.captured',
        userId: driftUserId,
        orderId,
        payload: {
          paymentId: payment.id,
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          amount: capturedAmount,
          currency: payment.currency || 'INR',
          method: payment.method,
          status: 'captured',
          cashbackAmount: order?.totals?.cashback || 0,
        },
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      // Pipeline failed after we already claimed the token — reset so a future retry can re-run.
      // Keep the drift timer running: the wallet credit never happened.
      logger.error('[WEBHOOK] Post-payment pipeline failed — resetting postPaymentProcessed for retry:', err);
      await Order.findByIdAndUpdate((order as any)._id, { $set: { postPaymentProcessed: false } }).catch(
        (resetErr: any) => logger.error('[WEBHOOK] Failed to reset postPaymentProcessed:', resetErr),
      );
    }
  }

  logger.info('✅ [RAZORPAY WEBHOOK] Order updated with payment details');
}

/**
 * Handle payment.failed event
 */
async function handleRazorpayPaymentFailed(event: any): Promise<void> {
  const payment = event.payload.payment.entity;
  const orderId = payment.notes?.orderId;

  if (!orderId) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order ID not found in payment notes');
    return;
  }

  logger.info('❌ [RAZORPAY WEBHOOK] Payment failed for order:', orderId);

  const order = await Order.findById(orderId).lean();
  if (!order) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order not found:', orderId);
    return;
  }

  const failureReason = payment.error_description || payment.error_code || 'Payment failed';
  // Normalise the code for use as a Prometheus label (max 64 chars, no spaces)
  const reasonCode = (payment.error_code || 'UNKNOWN').toString().replace(/\s+/g, '_').slice(0, 64);
  const userId = order.user?.toString() || 'unknown';
  const amount = (payment.amount ?? 0) / 100; // paise → rupees

  // --- GAP FIX #2: structured failure log with all searchable fields ---
  logger.warn('payment_failed', {
    event: 'payment.failed',
    gateway: 'razorpay',
    orderId,
    userId,
    amount,
    currency: payment.currency || 'INR',
    reasonCode,
    errorDescription: payment.error_description || null,
    errorSource: payment.error_source || null,
    errorStep: payment.error_step || null,
    paymentId: payment.id || null,
    method: payment.method || null,
    timestamp: new Date().toISOString(),
  });

  // --- GAP FIX #3: Prometheus payment-failure counter with reason_code label ---
  paymentFailureCounter.inc({ gateway: 'razorpay', reason_code: reasonCode });

  // Handle payment failure
  await paymentService.handlePaymentFailure(orderId, failureReason);

  // Strangler Fig: publish payment failure event
  publishPaymentEvent({
    eventId: `payment-failed:${payment.id}`,
    eventType: 'payment.failed',
    userId,
    orderId,
    payload: {
      paymentId: payment.id,
      amount,
      currency: payment.currency || 'INR',
      method: payment.method,
      status: 'failed',
      failureReason,
    },
    createdAt: new Date().toISOString(),
  });

  logger.info('✅ [RAZORPAY WEBHOOK] Payment failure processed');
}

/**
 * Handle payment.authorized event
 */
async function handleRazorpayPaymentAuthorized(event: any): Promise<void> {
  const payment = event.payload.payment.entity;
  const orderId = payment.notes?.orderId;

  if (!orderId) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order ID not found in payment notes');
    return;
  }

  logger.info('🔐 [RAZORPAY WEBHOOK] Payment authorized for order:', orderId);

  // BL-H2 FIX: Validate authorized amount matches order total before recording authorization.
  // Prevents partial captures (where authorized < order total) from silently progressing.
  const orderForValidation = await Order.findById(orderId).lean();
  if (!orderForValidation) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order not found:', orderId);
    return;
  }

  // Compare in paise to avoid floating-point rounding errors.
  const orderTotalPaise = Math.round((orderForValidation.totals?.total ?? 0) * 100);
  if (payment.amount !== orderTotalPaise) {
    logger.error('🚨 [RAZORPAY WEBHOOK] Authorized amount mismatch!', {
      authorizedPaise: payment.amount,
      orderTotalPaise,
      authorizedRupees: payment.amount / 100,
      orderTotalRupees: orderForValidation.totals?.total ?? 0,
      orderId,
      paymentId: payment.id,
      difference: payment.amount - orderTotalPaise,
    });
    await Order.findByIdAndUpdate(orderId, {
      $set: { postPaymentProcessed: true },
      $push: {
        flags: 'authorized_amount_mismatch',
        timeline: {
          status: orderForValidation.status,
          message: `Authorized amount mismatch: authorized ${payment.amount}p but order total is ${orderTotalPaise}p. Flagged for manual review.`,
          timestamp: new Date(),
          metadata: {
            authorizedPaise: payment.amount,
            orderTotalPaise,
            paymentId: payment.id,
            differencePaise: payment.amount - orderTotalPaise,
          },
        },
      },
    });

    try {
      const orderSocketService = require('../services/orderSocketService').default;
      orderSocketService.emitToAdmin('AUTHORIZED_AMOUNT_MISMATCH', {
        orderId: String(orderForValidation._id),
        orderNumber: orderForValidation.orderNumber,
        authorizedPaise: payment.amount,
        orderTotalPaise,
        authorizedRupees: payment.amount / 100,
        orderTotalRupees: orderForValidation.totals?.total ?? 0,
        paymentId: payment.id,
        differencePaise: payment.amount - orderTotalPaise,
        timestamp: new Date(),
      });
    } catch (alertErr) {
      logger.error('[RAZORPAY WEBHOOK] Failed to emit admin alert:', alertErr);
    }

    logger.warn(
      `🚨 [RAZORPAY WEBHOOK] Order ${orderForValidation.orderNumber} flagged for authorized amount mismatch — authorization blocked`,
    );
    return;
  }

  // LF-005 FIX: Replace findById → mutate → save with an atomic findOneAndUpdate.
  // The old pattern reads, then writes in two separate round-trips; under concurrent
  // webhook retries both calls can read the same document and both push a duplicate
  // 'payment_authorized' timeline entry (harmless here) but the race also means
  // payment.status could be overwritten from 'paid' back to 'processing' if a
  // payment.captured webhook fires before this one finishes. Guard with $nin to
  // avoid regressing from 'paid' to 'processing'.
  // FSM-CAS: $nin: ['paid', 'refunded'] is the atomic FSM guard — prevents regressing
  // from terminal states. Pre-fetch + validatePaymentTransition() omitted to avoid
  // a TOCTOU race on concurrent webhook retries; the filter IS the guard.
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, 'payment.status': { $nin: ['paid', 'refunded'] } },
    {
      $set: { 'payment.status': 'processing' },
      $push: {
        timeline: {
          status: 'payment_authorized',
          message: 'Payment authorized, pending capture',
          timestamp: new Date(),
        },
      },
    },
    { new: true },
  );

  if (!updated) {
    logger.info(
      '⚠️ [RAZORPAY WEBHOOK] Order not found or already in terminal payment state — authorized event skipped',
      { orderId },
    );
  }
}

/**
 * Handle order.paid event
 */
async function handleRazorpayOrderPaid(event: any): Promise<void> {
  const razorpayOrder = event.payload.order.entity;
  const orderId = razorpayOrder.notes?.orderId;

  if (!orderId) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order ID not found in order notes');
    return;
  }

  logger.info('✅ [RAZORPAY WEBHOOK] Order paid:', orderId);

  // LF-005 FIX (companion): atomic $push — no read-then-write round trip.
  const updated = await Order.findOneAndUpdate(
    { _id: orderId },
    {
      $push: {
        timeline: {
          status: 'order_paid_webhook',
          message: 'Order payment confirmed via webhook',
          timestamp: new Date(),
        },
      },
    },
    { new: true },
  );

  if (!updated) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order not found for order.paid event:', orderId);
  }
}

/**
 * Handle refund.created event
 *
 * CRITICAL: This event means the payment gateway has initiated a refund.
 * We must mirror it internally: credit coins back to the user's wallet
 * and reverse the merchant's wallet credit (if the order was delivered).
 * Failing to do so leaves the user without coins while they've been
 * refunded money, and the merchant holding funds they shouldn't have.
 */
async function handleRazorpayRefundCreated(event: any): Promise<void> {
  const refund = event.payload.refund.entity;
  const paymentId = refund.payment_id;
  const refundAmountRupees = refund.amount / 100;

  logger.info('💰 [RAZORPAY WEBHOOK] Refund created:', refund.id);

  // Find order by payment ID
  const order = await Order.findOne({ 'payment.transactionId': paymentId });
  if (!order) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order not found for payment:', paymentId);
    return;
  }

  // LF-007 FIX: Capture the PRE-SAVE status before mutating the document.
  // The old code set order.status = 'refunded' and then immediately checked
  //   if (order.status === 'delivered')  // ← always false after mutation!
  // so the merchant wallet was NEVER reversed for delivered orders. Save the
  // original status now so the reversal guard further down reads the truth.
  const statusBeforeRefund = order.status as string;

  // Update refund details on the order document.
  // Validate the transition is legal before writing it.
  const { isValidTransition } = await import('../config/orderStateMachine');
  const canTransitionToRefunded = isValidTransition(statusBeforeRefund, 'refunded');

  order.payment.refundId = refund.id;
  // F001-C09 FIX: hard throw on invalid Order.payment.status transitions
  assertPaymentTransition(order.payment.status as string, 'refunded'); // 'paid' and 'partially_refunded' are valid sources
  order.payment.status = 'refunded';
  order.totals.refundAmount = (order.totals.refundAmount || 0) + refundAmountRupees;

  if (canTransitionToRefunded) {
    (order as any).status = 'refunded';
  } else {
    logger.warn('[RAZORPAY WEBHOOK] Cannot transition order.status to refunded from current state', {
      orderId: String(order._id),
      currentStatus: statusBeforeRefund,
    });
  }

  order.timeline.push({
    status: 'refund_created',
    message: `Refund of ₹${refundAmountRupees} initiated`,
    timestamp: new Date(),
  });

  // DP-D004 FIX: Replace mutable-document .save() with a fully atomic
  // findOneAndUpdate so that:
  //   (a) A concurrent refund webhook for the same payment cannot race and
  //       double-apply the refund (guard: payment.status $ne 'refunded').
  //   (b) The write is acknowledged at w:'majority' explicitly, not just
  //       relying on the connection-level default which could be overridden.
  //   (c) The in-memory mutations applied above (order.payment.refundId etc.)
  //       are expressed as $set fields, making the operation idempotent.
  const refundUpdateResult = await Order.findOneAndUpdate(
    {
      _id: order._id,
      'payment.status': { $ne: 'refunded' }, // idempotency guard
    },
    {
      $set: {
        'payment.refundId': refund.id,
        'payment.status': 'refunded',
        'totals.refundAmount': (order.totals.refundAmount || 0) + refundAmountRupees,
        ...(canTransitionToRefunded ? { status: 'refunded' } : {}),
      },
      $push: {
        timeline: {
          status: 'refund_created',
          message: `Refund of ₹${refundAmountRupees} initiated`,
          timestamp: new Date(),
        },
      },
    },
    { new: true, writeConcern: { w: 'majority', j: true } },
  );

  if (!refundUpdateResult) {
    logger.info('[RAZORPAY WEBHOOK] Refund already recorded — duplicate refund.created webhook ignored', {
      orderId: String(order._id),
      refundId: refund.id,
    });
    return;
  }

  logger.info('✅ [RAZORPAY WEBHOOK] Refund order document updated (order.status → refunded).');

  // ── Internal wallet + ledger reversal ────────────────────────────────────
  // Derive the coins to refund. If the order used coins for payment, return
  // those coins. Otherwise treat the rupee refund amount as coin-equivalent (1:1).
  const userId = order.user?.toString();
  if (!userId) {
    logger.error('[RAZORPAY WEBHOOK] Cannot process internal refund — no userId on order', {
      orderId: String(order._id),
    });
    return;
  }

  const coinsUsed = (order.payment as any)?.coinsUsed?.rezCoins || (order.payment as any)?.coinsUsed?.wasilCoins || 0;
  const refundCoins = coinsUsed > 0 ? coinsUsed : Math.floor(refundAmountRupees);

  if (refundCoins > 0) {
    try {
      await refundService.processRefund({
        userId,
        amount: refundCoins,
        reason: `Gateway refund ${refund.id} for order ${order.orderNumber}`,
        refundType: 'order_cancel',
        referenceId: String(order._id),
        referenceModel: 'Order',
      });
      logger.info('[RAZORPAY WEBHOOK] Internal coin refund processed', {
        userId,
        refundCoins,
        orderId: String(order._id),
        gatewayRefundId: refund.id,
      });
    } catch (refundErr) {
      // Log but do not throw — the gateway refund is already in flight;
      // the reconciliation job will surface this as a stale_refund issue.
      logger.error('[RAZORPAY WEBHOOK] Internal coin refund FAILED — will surface in reconciliation', {
        userId,
        refundCoins,
        orderId: String(order._id),
        gatewayRefundId: refund.id,
        error: (refundErr as any)?.message,
      });
      // [DRIFT] refund_issued_no_ledger_entry — gateway has issued refund but our ledger is missing
      logger.warn('[DRIFT] refund_issued_no_ledger_entry', {
        orderId: String(order._id),
        gatewayRefundId: refund.id,
        userId,
        amount: refundCoins,
        gateway: 'razorpay',
      });
    }
  }

  // ── Reverse merchant wallet credit if order was delivered ─────────────────
  // If the order reached 'delivered' status the merchant was already credited.
  // A gateway refund means the customer is getting their money back, so the
  // merchant credit must be reversed to keep platform funds balanced.
  // LF-007 FIX: Use statusBeforeRefund (captured before mutation), not order.status
  // which is now 'refunded' and would make this check always false.
  if (statusBeforeRefund === 'delivered') {
    try {
      const Store = (await import('../models/Store')).Store;
      const store = await Store.findById((order as any).store || (order.items?.[0] as any)?.store).lean();
      if (store && (store as any).merchantId) {
        const grossAmount = order.totals?.subtotal || refundAmountRupees;
        const platformFee = order.totals?.platformFee || 0;
        await merchantWalletService.handleRefund(
          (store as any).merchantId.toString(),
          String(order._id),
          order.orderNumber,
          grossAmount,
          platformFee,
        );
        logger.info('[RAZORPAY WEBHOOK] Merchant wallet credit reversed for refund', {
          merchantId: (store as any).merchantId.toString(),
          orderId: String(order._id),
          grossAmount,
        });
      }
    } catch (merchantErr) {
      logger.error('[RAZORPAY WEBHOOK] Merchant wallet reversal FAILED — manual reconciliation required', {
        orderId: String(order._id),
        error: (merchantErr as any)?.message,
      });
    }
  }

  // ── Cashback clawback ─────────────────────────────────────────────────────
  // Cancel any cashback earned on this order. Pending cashbacks are cancelled
  // outright; already-credited cashbacks are debited from the wallet
  // proportionally to the refund amount (full debit on full refund).
  try {
    const { UserCashback } = await import('../models/UserCashback');

    // Determine the clawback ratio: 1 for full refunds, < 1 for partial refunds.
    const orderTotal = order.totals?.total || 0;
    const isPartialRefund = orderTotal > 0 && refundAmountRupees < orderTotal;
    const refundRatio = isPartialRefund ? refundAmountRupees / orderTotal : 1;

    // 1. Cancel pending cashbacks — not yet in the wallet, so no debit needed.
    const pendingCancelResult = await UserCashback.updateMany(
      { user: order.user, order: order._id, status: 'pending' },
      { $set: { status: 'cancelled' } },
    );
    if (pendingCancelResult.modifiedCount > 0) {
      logger.info('[REFUND] Cancelled pending cashbacks', {
        orderId: String(order._id),
        userId,
        count: pendingCancelResult.modifiedCount,
      });
    }

    // 2. Claw back already-credited cashbacks from the wallet.
    const creditedCashbacks = await UserCashback.find({
      user: order.user,
      order: order._id,
      status: 'credited',
    }).lean();

    for (const cb of creditedCashbacks) {
      const clawbackAmount = isPartialRefund ? Math.floor(cb.amount * refundRatio) : cb.amount;
      if (clawbackAmount <= 0) {
        // Mark cancelled even if clawback rounds to zero — prevents re-processing.
        await UserCashback.findByIdAndUpdate(cb._id, { $set: { status: 'cancelled' } }).catch(() => {});
        continue;
      }
      try {
        await walletService.debit({
          userId: userId.toString(),
          amount: clawbackAmount,
          coinType: (cb as any).coinType || 'rez',
          source: 'cashback_clawback',
          description: `Cashback clawed back due to order refund`,
          operationType: 'cashback_reversal',
          referenceId: cb._id.toString(),
          referenceModel: 'UserCashback',
          metadata: { idempotencyKey: `clawback-${cb._id.toString()}` },
        });
        await UserCashback.findByIdAndUpdate(cb._id, { $set: { status: 'cancelled' } });
        logger.info('[REFUND] Cashback clawback successful', {
          cashbackId: cb._id,
          userId,
          clawbackAmount,
          orderId: String(order._id),
        });
      } catch (err: any) {
        // Insufficient balance is expected when the user has already spent the
        // coins — log and continue so the rest of the cashbacks are still processed.
        logger.warn('[REFUND] Cashback clawback failed (possibly insufficient balance)', {
          cashbackId: cb._id,
          userId,
          clawbackAmount,
          error: err.message,
        });
        // Still mark cancelled so this record is not double-processed on retries.
        await UserCashback.findByIdAndUpdate(cb._id, { $set: { status: 'cancelled' } }).catch(() => {});
      }
    }
  } catch (clawbackErr: any) {
    logger.error('[REFUND] Cashback clawback block FAILED — manual reconciliation required', {
      orderId: String(order._id),
      userId,
      error: clawbackErr.message,
    });
  }
}

/**
 * Handle refund.processed event
 */
async function handleRazorpayRefundProcessed(event: any): Promise<void> {
  const refund = event.payload.refund.entity;
  const paymentId = refund.payment_id;

  logger.info('✅ [RAZORPAY WEBHOOK] Refund processed:', refund.id);

  // LF-005 FIX (companion): atomic update — no findById → save race.
  const updated = await Order.findOneAndUpdate(
    { 'payment.transactionId': paymentId },
    {
      $set: { 'payment.refundedAt': new Date() },
      $push: {
        timeline: {
          status: 'refund_processed',
          message: `Refund of ₹${refund.amount / 100} processed successfully`,
          timestamp: new Date(),
        },
      },
    },
  );

  if (!updated) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order not found for payment:', paymentId);
  }
}

/**
 * Handle refund.failed event
 */
async function handleRazorpayRefundFailed(event: any): Promise<void> {
  const refund = event.payload.refund.entity;
  const paymentId = refund.payment_id;

  logger.info('❌ [RAZORPAY WEBHOOK] Refund failed:', refund.id);

  // LF-005 FIX (companion): atomic update — no findById → save race.
  // Also flag the order so the reconciliation job and admin dashboard can surface
  // failed refunds that require manual intervention.
  const updated = await Order.findOneAndUpdate(
    { 'payment.transactionId': paymentId },
    {
      $push: {
        timeline: {
          status: 'refund_failed',
          message: `Refund of ₹${refund.amount / 100} failed — manual intervention may be required`,
          timestamp: new Date(),
        },
      },
    },
  );

  if (!updated) {
    logger.error('❌ [RAZORPAY WEBHOOK] Order not found for payment:', paymentId);
  }
}

/**
 * Enhanced Stripe Webhook Handler
 * POST /api/webhooks/stripe
 *
 * Handles all Stripe webhook events with:
 * - Signature verification
 * - Idempotency handling
 * - Comprehensive logging
 * - Error handling and retries
 *
 * DISABLED: Stripe is not an active payment gateway. The handler body is
 * preserved for re-enablement. Remove the early-return block below when
 * Stripe integration is officially launched.
 */
export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  // STRIPE DISABLED — remove this block to re-enable when Stripe is live
  logger.warn('[STRIPE WEBHOOK] Received webhook but Stripe is disabled — returning 404');
  return res.status(404).json({ success: false, message: 'Stripe payments are not enabled on this platform.' });
  // END STRIPE DISABLED

  const signature = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('❌ [STRIPE WEBHOOK] Webhook secret not configured');
    return sendBadRequest(res, 'Stripe webhook secret not configured');
  }

  if (!signature) {
    logger.error('❌ [STRIPE WEBHOOK] Missing signature');
    return sendBadRequest(res, 'Missing webhook signature');
  }

  logger.info('🔔 [STRIPE WEBHOOK] Event received at:', new Date().toISOString());

  try {
    // Step 1: Verify webhook signature using Stripe's constructEvent
    const event: Stripe.Event = stripeService.verifyWebhookSignature(req.body, signature, webhookSecret);

    logger.info('✅ [STRIPE WEBHOOK] Signature verified:', {
      eventType: event.type,
      eventId: event.id,
    });

    // Step 2: Extract metadata
    const metadata = extractStripeMetadata(event);

    // Step 3+4: Atomic idempotency — try to insert log; unique index catches duplicates
    let webhookLog;
    try {
      webhookLog = await WebhookLog.create({
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
        payload: event,
        signature: signature,
        signatureValid: true,
        processed: false,
        status: 'processing',
        metadata,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        logger.info('⚠️ [STRIPE WEBHOOK] Duplicate event detected:', event.id);
        return res.status(200).json({
          received: true,
          status: 'duplicate',
          message: 'Event already processed',
        });
      }
      throw err;
    }

    logger.info('📝 [STRIPE WEBHOOK] Log created:', webhookLog._id);

    // Step 5: Process the webhook event
    try {
      await processStripeEvent(event, webhookLog);

      // WS-D001 FIX: Use atomic findOneAndUpdate with w:'majority' instead of
      // mutable-doc .save().  Under primary stepdown a .save() that returns without
      // error but was only acknowledged by a secondary could be lost after failover,
      // leaving the webhookLog in 'processing' state — causing the retry-cron to
      // re-process the event and double-apply wallet credits / order state changes.
      await WebhookLog.findOneAndUpdate(
        { _id: webhookLog._id },
        { $set: { processed: true, processedAt: new Date(), status: 'success' } },
        { writeConcern: { w: 'majority', j: true } },
      );
      webhookLog.processed = true;
      webhookLog.status = 'success';

      logger.info('✅ [STRIPE WEBHOOK] Event processed successfully');

      return res.status(200).json({
        received: true,
        status: 'success',
        eventId: webhookLog.eventId,
      });
    } catch (processingError: any) {
      logger.error('❌ [STRIPE WEBHOOK] Processing error:', processingError);

      // WS-D001 FIX (cont.): same atomic + w:majority pattern to prevent lost status update.
      const newRetryCount = webhookLog.retryCount + 1;
      const newStripeStatus = newRetryCount >= 3 ? 'failed' : 'pending_retry';
      await WebhookLog.findOneAndUpdate(
        { _id: webhookLog._id },
        { $set: { status: newStripeStatus, errorMessage: processingError.message }, $inc: { retryCount: 1 } },
        { writeConcern: { w: 'majority', j: true } },
      );
      webhookLog.retryCount = newRetryCount;
      webhookLog.status = newStripeStatus;
      webhookLog.errorMessage = processingError.message;

      logger.info(
        `[STRIPE WEBHOOK] Event ${webhookLog.eventId} marked as ${webhookLog.status} (retryCount: ${webhookLog.retryCount})`,
      );

      // Return 200 to prevent unnecessary retries
      return res.status(200).json({
        received: true,
        status: 'error',
        message: processingError.message,
      });
    }
  } catch (error: any) {
    logger.error('❌ [STRIPE WEBHOOK] Signature verification failed:', error);

    // Log failed verification attempt
    await WebhookLog.create({
      provider: 'stripe',
      eventId: `failed_${Date.now()}`,
      eventType: 'unknown',
      payload: req.body,
      signature: signature,
      signatureValid: false,
      processed: false,
      status: 'failed',
      errorMessage: error.message,
    });

    return sendUnauthorized(res, 'Invalid webhook signature');
  }
});

/**
 * Extract metadata from Stripe event
 */
function extractStripeMetadata(event: Stripe.Event): any {
  const metadata: any = {};

  switch (event.type) {
    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      metadata.paymentId = paymentIntent.id;
      metadata.amount = paymentIntent.amount;
      metadata.currency = paymentIntent.currency;
      metadata.orderId = paymentIntent.metadata?.orderId || paymentIntent.metadata?.subscriptionId;
      break;

    case 'charge.refunded':
      const charge = event.data.object as Stripe.Charge;
      metadata.paymentId = charge.id;
      metadata.amount = charge.amount_refunded;
      metadata.currency = charge.currency;
      break;

    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      metadata.orderId = session.metadata?.subscriptionId || session.metadata?.orderId;
      metadata.amount = session.amount_total;
      metadata.currency = session.currency;
      // Deal purchase metadata
      if (session.metadata?.type === 'deal_purchase') {
        metadata.type = 'deal_purchase';
        metadata.campaignId = session.metadata?.campaignId;
        metadata.campaignSlug = session.metadata?.campaignSlug;
        metadata.dealIndex = session.metadata?.dealIndex;
        metadata.userId = session.metadata?.userId;
        metadata.redemptionId = session.metadata?.redemptionId;
      }
      break;
  }

  return metadata;
}

/**
 * Process Stripe webhook events
 */
async function processStripeEvent(event: Stripe.Event, webhookLog: any): Promise<void> {
  const eventType = event.type;

  logger.info(`🔄 [STRIPE WEBHOOK] Processing event type: ${eventType}`);

  switch (eventType) {
    case 'payment_intent.succeeded':
      await handleStripePaymentIntentSucceeded(event, webhookLog);
      break;

    case 'payment_intent.payment_failed':
      await handleStripePaymentIntentFailed(event);
      break;

    case 'charge.refunded':
      await handleStripeChargeRefunded(event);
      break;

    case 'checkout.session.completed':
      await handleStripeCheckoutSessionCompleted(event);
      break;

    case 'payment_intent.created':
      await handleStripePaymentIntentCreated(event);
      break;

    case 'payment_intent.canceled':
      await handleStripePaymentIntentCanceled(event);
      break;

    case 'checkout.session.expired':
      await handleStripeCheckoutSessionExpired(event);
      break;

    case 'checkout.session.async_payment_failed':
      await handleStripeCheckoutSessionAsyncPaymentFailed(event);
      break;

    default:
      logger.info(`ℹ️ [STRIPE WEBHOOK] Unhandled event type: ${eventType}`);
    // Don't throw error for unhandled events
  }
}

/**
 * Handle checkout.session.expired event
 * Cleans up pending redemptions when checkout session expires
 */
async function handleStripeCheckoutSessionExpired(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};

  logger.info('⏰ [STRIPE WEBHOOK] Checkout session expired:', session.id);

  // Handle deal purchase expiry
  if (metadata.type === 'deal_purchase') {
    // WS-009 FIX: Use atomic findOneAndUpdate to avoid TOCTOU race between concurrent
    // webhook deliveries.  Two concurrent session.expired events could both find
    // status='pending' before either write completes, attempting double-cancel.
    const redemption = await DealRedemption.findOneAndUpdate(
      { stripeSessionId: session.id, status: 'pending' },
      { $set: { status: 'cancelled' } },
      { new: true },
    );

    if (redemption) {
      logger.info(`✅ [STRIPE WEBHOOK] Pending redemption cancelled due to session expiry: ${redemption._id}`);
    }
  }
}

/**
 * Handle checkout.session.async_payment_failed event
 * Handles async payment failures (bank transfers, etc.)
 */
async function handleStripeCheckoutSessionAsyncPaymentFailed(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};

  logger.info('❌ [STRIPE WEBHOOK] Async payment failed:', session.id);

  // Handle deal purchase async payment failure
  if (metadata.type === 'deal_purchase') {
    // WS-009 FIX (cont.): Same atomic pattern for async_payment_failed.
    const redemption = await DealRedemption.findOneAndUpdate(
      { stripeSessionId: session.id, status: 'pending' },
      { $set: { status: 'cancelled' } },
      { new: true },
    );

    if (redemption) {
      logger.info(`✅ [STRIPE WEBHOOK] Pending redemption cancelled due to payment failure: ${redemption._id}`);
    }
  }
}

/**
 * Handle payment_intent.succeeded event
 */
async function handleStripePaymentIntentSucceeded(event: Stripe.Event, webhookLog: any): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata?.orderId || paymentIntent.metadata?.subscriptionId;
  const bookingId = paymentIntent.metadata?.bookingId;

  logger.info('✅ [STRIPE WEBHOOK] Payment intent succeeded:', paymentIntent.id);

  // Handle event booking payment
  if (bookingId) {
    await handleEventBookingPaymentSuccess(bookingId, paymentIntent);
    return;
  }

  if (!orderId) {
    logger.error('❌ [STRIPE WEBHOOK] Order ID not found in metadata');
    return;
  }

  // CONCURRENCY FIX: Atomic test-and-set — only one concurrent delivery wins.
  // Replace findById → check → save with a single findOneAndUpdate with status guard.
  const order = await Order.findOneAndUpdate(
    { _id: orderId, 'payment.status': { $ne: 'paid' } },
    {
      $set: {
        'payment.status': 'paid',
        'payment.transactionId': paymentIntent.id,
        'payment.paidAt': new Date(paymentIntent.created * 1000),
        'totals.paidAmount': paymentIntent.amount / 100,
        paymentGateway: {
          gatewayPaymentId: paymentIntent.id,
          gateway: 'stripe',
          currency: paymentIntent.currency,
          amountPaid: paymentIntent.amount / 100,
          paidAt: new Date(paymentIntent.created * 1000),
        },
      },
      $push: {
        timeline: {
          status: 'payment_success',
          message: 'Payment completed successfully via Stripe webhook',
          timestamp: new Date(),
        },
      },
    },
    { new: true },
  );

  if (!order) {
    logger.info('⚠️ [STRIPE WEBHOOK] Payment already marked as paid — duplicate webhook ignored');
    return;
  }

  // Notify the merchant's dashboard of confirmed payment in real-time
  try {
    const orderSocketService = require('../services/orderSocketService').default;
    const Store = require('../models/Store').Store || require('../models/Store').default;
    const store = await Store.findById(order.store).select('merchant').lean();
    const merchantId = store?.merchant?.toString();
    if (merchantId) {
      orderSocketService.emitToMerchant(merchantId, 'payment-confirmed', {
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        amount: paymentIntent.amount / 100,
        paymentId: paymentIntent.id,
        gateway: 'stripe',
      });
    }
  } catch (socketErr) {
    logger.warn('[STRIPE WEBHOOK] Merchant socket notification failed (non-blocking):', socketErr);
  }

  // Run the full post-payment pipeline (stock deduction, cashback, wallet credits,
  // notifications) if it has not already run for this order.
  // Mirror the same postPaymentProcessed atomic-claim pattern used by the Razorpay handler.
  const pipelineToken = await Order.findOneAndUpdate(
    { _id: (order as any)._id, postPaymentProcessed: { $ne: true } },
    { $set: { postPaymentProcessed: true } },
    { new: false }, // return OLD doc — non-null means we won the claim
  );

  if (pipelineToken) {
    try {
      await paymentService.handlePaymentSuccess(
        String((order as any)._id),
        {
          razorpay_order_id: '',
          razorpay_payment_id: paymentIntent.id,
          razorpay_signature: '',
        },
        { webhookLogId: webhookLog?._id?.toString() },
      );
    } catch (err) {
      // Pipeline failed after we already claimed the token — reset so a future retry can re-run.
      logger.error('[STRIPE WEBHOOK] Post-payment pipeline failed — resetting postPaymentProcessed for retry:', err);
      await Order.findByIdAndUpdate((order as any)._id, { $set: { postPaymentProcessed: false } }).catch(
        (resetErr: any) => logger.error('[STRIPE WEBHOOK] Failed to reset postPaymentProcessed:', resetErr),
      );
    }
  }

  logger.info('✅ [STRIPE WEBHOOK] Order updated with payment details');
}

/**
 * Handle event booking payment success (called from payment_intent.succeeded and checkout.session.completed)
 */
async function handleEventBookingPaymentSuccess(
  bookingId: string,
  _paymentIntent: { id: string; amount: number; created: number },
): Promise<void> {
  try {
    // WS-007 FIX: Replace findById → check → save (TOCTOU race) with a single atomic
    // findOneAndUpdate using a status guard.  Two concurrent Stripe webhook deliveries
    // of the same payment_intent.succeeded event could both pass the status check before
    // either write completes, confirm the booking twice, and grant duplicate rewards.
    // The $in guard ensures exactly one update wins; the loser gets null and returns early.
    const booking = await EventBooking.findOneAndUpdate(
      {
        _id: bookingId,
        status: { $in: ['pending', 'payment_pending'] },
      },
      {
        $set: {
          status: 'confirmed',
          paymentStatus: 'completed',
          lockedUntil: null,
        },
      },
      { new: true },
    );

    if (!booking) {
      // Either already confirmed (idempotent) or not found
      const existing = await EventBooking.findById(bookingId).lean();
      if (!existing) {
        logger.error('❌ [STRIPE WEBHOOK] Event booking not found:', bookingId);
      } else {
        logger.info('⚠️ [STRIPE WEBHOOK] Event booking already confirmed (idempotent):', bookingId);
      }
      return;
    }

    logger.info('✅ [STRIPE WEBHOOK] Event booking confirmed:', bookingId);

    // Grant purchase reward for paid events
    try {
      const event = await Event.findById(booking.eventId).lean();
      await eventRewardService.grantEventReward(
        booking.userId.toString(),
        booking.eventId.toString(),
        booking._id.toString(),
        'purchase_reward',
        { eventName: event?.title || 'Event' },
      );
      logger.info('✅ [STRIPE WEBHOOK] Purchase reward granted for booking:', bookingId);
    } catch (rewardErr) {
      logger.error('[STRIPE WEBHOOK] Reward grant failed (non-blocking):', rewardErr);
    }
  } catch (error) {
    logger.error('❌ [STRIPE WEBHOOK] Error handling event booking payment:', error);
  }
}

/**
 * Handle payment_intent.payment_failed event
 */
async function handleStripePaymentIntentFailed(event: Stripe.Event): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata?.orderId || paymentIntent.metadata?.subscriptionId;

  logger.info('❌ [STRIPE WEBHOOK] Payment intent failed:', paymentIntent.id);

  if (!orderId) {
    logger.error('❌ [STRIPE WEBHOOK] Order ID not found in metadata');
    return;
  }

  const order = await Order.findById(orderId).lean();
  if (!order) {
    logger.error('❌ [STRIPE WEBHOOK] Order not found:', orderId);
    return;
  }

  const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
  const stripeReasonCode = (paymentIntent.last_payment_error?.code || 'UNKNOWN').replace(/\s+/g, '_').slice(0, 64);
  const stripeUserId = order.user?.toString() || 'unknown';
  const stripeAmount = (paymentIntent.amount ?? 0) / 100;

  // --- GAP FIX #2 (Stripe): structured failure log ---
  logger.warn('payment_failed', {
    event: 'payment_intent.payment_failed',
    gateway: 'stripe',
    orderId,
    userId: stripeUserId,
    amount: stripeAmount,
    currency: paymentIntent.currency || 'usd',
    reasonCode: stripeReasonCode,
    errorMessage: paymentIntent.last_payment_error?.message || null,
    errorType: paymentIntent.last_payment_error?.type || null,
    paymentIntentId: paymentIntent.id,
    timestamp: new Date().toISOString(),
  });

  // --- GAP FIX #3 (Stripe): Prometheus payment-failure counter ---
  paymentFailureCounter.inc({ gateway: 'stripe', reason_code: stripeReasonCode });

  // Handle payment failure
  await paymentService.handlePaymentFailure(orderId, failureReason);

  logger.info('✅ [STRIPE WEBHOOK] Payment failure processed');
}

/**
 * Handle charge.refunded event
 */
async function handleStripeChargeRefunded(event: Stripe.Event): Promise<void> {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId = charge.payment_intent as string;

  logger.info('💰 [STRIPE WEBHOOK] Charge refunded:', charge.id);

  // WS-D003 FIX: Replace findOne → mutate → save with a read-only fetch for
  // pre-mutation state capture, then a single atomic findOneAndUpdate with
  // an idempotency guard ({ 'payment.status': { $ne: 'refunded' } }).
  // Two concurrent charge.refunded deliveries both call findOne before either
  // write completes, both increment totals.refundAmount independently, and both
  // call .save() — resulting in double coin credits and double merchant wallet debits.
  // The atomic findOneAndUpdate ensures exactly one write wins; the loser gets null.
  const orderForRead = await Order.findOne({ 'payment.transactionId': paymentIntentId }).lean();
  if (!orderForRead) {
    logger.error('❌ [STRIPE WEBHOOK] Order not found for payment:', paymentIntentId);
    return;
  }

  const refundAmountRupees = charge.amount_refunded / 100;
  const statusBeforeRefund = orderForRead.status as string;

  const { isValidTransition } = await import('../config/orderStateMachine');
  const canTransitionToRefunded = isValidTransition(statusBeforeRefund, 'refunded');
  if (!canTransitionToRefunded) {
    logger.warn('[STRIPE WEBHOOK] Cannot transition order.status to refunded from current state', {
      orderId: String(orderForRead._id),
      currentStatus: statusBeforeRefund,
    });
  }

  const stripeRefundUpdateResult = await Order.findOneAndUpdate(
    {
      'payment.transactionId': paymentIntentId,
      'payment.status': { $ne: 'refunded' }, // idempotency guard — only one concurrent winner
    },
    {
      $set: {
        'payment.status': 'refunded',
        'payment.refundedAt': new Date(),
        'totals.refundAmount': (orderForRead.totals.refundAmount || 0) + refundAmountRupees,
        ...(canTransitionToRefunded ? { status: 'refunded' } : {}),
      },
      $push: {
        timeline: {
          status: 'refund_processed',
          message: `Refund of ${refundAmountRupees.toFixed(2)} ${charge.currency.toUpperCase()} processed via Stripe`,
          timestamp: new Date(),
        },
      },
    },
    { new: true, writeConcern: { w: 'majority', j: true } },
  );

  if (!stripeRefundUpdateResult) {
    logger.info('[STRIPE WEBHOOK] Refund already recorded — duplicate charge.refunded webhook ignored', {
      orderId: String(orderForRead._id),
      chargeId: charge.id,
    });
    return;
  }

  // Re-use the pre-read document for downstream logic (coins used, merchant wallet)
  const order = orderForRead;

  logger.info('✅ [STRIPE WEBHOOK] Refund details updated (order.status → refunded)');

  // ── Internal coin refund ──────────────────────────────────────────────────
  const userId = order.user?.toString();
  if (userId) {
    const coinsUsed = (order.payment as any)?.coinsUsed?.rezCoins || (order.payment as any)?.coinsUsed?.wasilCoins || 0;
    const refundCoins = coinsUsed > 0 ? coinsUsed : Math.floor(refundAmountRupees);

    if (refundCoins > 0) {
      try {
        await refundService.processRefund({
          userId,
          amount: refundCoins,
          reason: `Stripe refund ${charge.id} for order ${order.orderNumber}`,
          refundType: 'order_cancel',
          referenceId: String(order._id),
          referenceModel: 'Order',
        });
        logger.info('[STRIPE WEBHOOK] Internal coin refund processed', {
          userId,
          refundCoins,
          orderId: String(order._id),
          chargeId: charge.id,
        });
      } catch (refundErr) {
        logger.error('[STRIPE WEBHOOK] Internal coin refund FAILED — will surface in reconciliation', {
          userId,
          refundCoins,
          orderId: String(order._id),
          chargeId: charge.id,
          error: (refundErr as any)?.message,
        });
      }
    }
  }

  // ── Reverse merchant wallet credit if order was delivered ─────────────────
  // WS-006 FIX cont.: use statusBeforeRefund (captured before mutation) here.
  if (statusBeforeRefund === 'delivered') {
    try {
      const Store = (await import('../models/Store')).Store;
      const store = await Store.findById((order as any).store || (order.items?.[0] as any)?.store).lean();
      if (store && (store as any).merchantId) {
        const grossAmount = order.totals?.subtotal || refundAmountRupees;
        const platformFee = order.totals?.platformFee || 0;
        await merchantWalletService.handleRefund(
          (store as any).merchantId.toString(),
          String(order._id),
          order.orderNumber,
          grossAmount,
          platformFee,
        );
        logger.info('[STRIPE WEBHOOK] Merchant wallet credit reversed for Stripe refund', {
          merchantId: (store as any).merchantId.toString(),
          orderId: String(order._id),
          grossAmount,
        });
      }
    } catch (merchantErr) {
      logger.error('[STRIPE WEBHOOK] Merchant wallet reversal FAILED — manual reconciliation required', {
        orderId: String(order._id),
        error: (merchantErr as any)?.message,
      });
    }
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleStripeCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata || {};

  logger.info('✅ [STRIPE WEBHOOK] Checkout session completed:', session.id);

  // Check if this is a deal purchase
  if (metadata.type === 'deal_purchase') {
    await handleDealPurchaseCompleted(session);
    return;
  }

  // Handle subscription payment completion
  const subscriptionId = metadata.subscriptionId;
  if (subscriptionId) {
    logger.info('✅ [STRIPE WEBHOOK] Subscription payment completed:', subscriptionId);
    return;
  }

  // Handle event booking payment completion
  const bookingId = metadata.bookingId;
  if (bookingId) {
    logger.info('✅ [STRIPE WEBHOOK] Event booking checkout completed:', bookingId);
    await handleEventBookingPaymentSuccess(bookingId, {
      id: session.payment_intent as string,
      amount: session.amount_total || 0,
      created: Math.floor(Date.now() / 1000),
    } as any);
    return;
  }

  // Handle order payment completion
  const orderId = metadata.orderId;
  if (orderId) {
    logger.info('✅ [STRIPE WEBHOOK] Order payment completed:', orderId);
    // LF-004 FIX: original code used findById → check → save, creating a TOCTOU
    // race window where two concurrent checkout.session.completed deliveries (Stripe
    // retries on a slow response) could both pass the status check and both update
    // payment.status to 'paid'. The duplicate credit risk is low here (status update
    // only), but downstream coin rewards are triggered on status change, so a double
    // call can cause duplicate coin awards. Use the same atomic findOneAndUpdate
    // test-and-set pattern as handleStripePaymentIntentSucceeded.
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, 'payment.status': { $ne: 'paid' } },
      {
        $set: {
          'payment.status': 'paid',
          'payment.transactionId': session.payment_intent as string,
          'payment.paidAt': new Date(),
          'totals.paidAmount': (session.amount_total || 0) / 100,
        },
        $push: {
          timeline: {
            status: 'payment_success',
            message: 'Payment completed via Stripe checkout',
            timestamp: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!updatedOrder) {
      logger.info('⚠️ [STRIPE WEBHOOK] Order already paid — duplicate checkout.session.completed ignored', { orderId });
    }
    return;
  }

  logger.info('ℹ️ [STRIPE WEBHOOK] No recognized metadata in checkout session');
}

/**
 * Handle deal purchase checkout session completion
 * Uses MongoDB transaction for atomic updates
 */
async function handleDealPurchaseCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = session.metadata || {};
  const { campaignId, campaignSlug, dealIndex, userId, redemptionId } = metadata;

  logger.info('💳 [STRIPE WEBHOOK] Processing deal purchase:', {
    sessionId: session.id,
    campaignSlug,
    dealIndex,
    userId,
    redemptionId,
  });

  // Validate required metadata
  if (!campaignId || !userId || dealIndex === undefined) {
    logger.error('❌ [STRIPE WEBHOOK] Missing required metadata:', { campaignId, userId, dealIndex });
    return;
  }

  // Verify payment was successful
  if (session.payment_status !== 'paid') {
    logger.error('❌ [STRIPE WEBHOOK] Deal purchase not paid:', session.payment_status);
    return;
  }

  const dealIdx = parseInt(dealIndex || '0', 10);

  // Validate deal index bounds
  if (isNaN(dealIdx) || dealIdx < 0) {
    logger.error('❌ [STRIPE WEBHOOK] Invalid deal index:', dealIndex);
    return;
  }

  // Start a MongoDB session for transaction
  const mongoSession = await mongoose.startSession();

  try {
    await mongoSession.withTransaction(async () => {
      // Find the redemption within transaction
      const redemption = await DealRedemption.findOne({
        stripeSessionId: session.id,
        user: new mongoose.Types.ObjectId(userId),
      }).session(mongoSession);

      if (!redemption) {
        throw new Error(`Redemption not found for session: ${session.id}`);
      }

      // Check if already processed (idempotency)
      if (redemption.status === 'active' || redemption.status === 'used') {
        logger.info('⚠️ [STRIPE WEBHOOK] Redemption already processed:', redemption._id);
        return; // Not an error, just already done
      }

      // Verify campaign and deal exist
      const campaign = await Campaign.findById(campaignId).session(mongoSession).lean();
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      if (dealIdx >= campaign.deals.length) {
        throw new Error(`Deal index ${dealIdx} out of bounds for campaign ${campaignId}`);
      }

      // Update redemption status atomically
      redemption.status = 'active';
      redemption.purchasedAt = new Date();
      redemption.stripePaymentIntentId = session.payment_intent as string;
      redemption.purchasePaymentMethod = 'stripe';
      await redemption.save({ session: mongoSession });

      // Update deal purchase count atomically
      await Campaign.updateOne(
        { _id: new mongoose.Types.ObjectId(campaignId) },
        { $inc: { [`deals.${dealIdx}.purchaseCount`]: 1 } },
        { session: mongoSession },
      );

      logger.info('✅ [STRIPE WEBHOOK] Deal purchase completed:', {
        redemptionId: redemption._id,
        redemptionCode: redemption.redemptionCode,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency,
      });
    });
  } catch (error: any) {
    logger.error('❌ [STRIPE WEBHOOK] Transaction failed for deal purchase: ' + error.message);
    throw error; // Re-throw to mark webhook as failed for retry
  } finally {
    await mongoSession.endSession();
  }
}

/**
 * Handle payment_intent.created event
 */
async function handleStripePaymentIntentCreated(event: Stripe.Event): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  logger.info('📝 [STRIPE WEBHOOK] Payment intent created:', paymentIntent.id);
  // Log for audit purposes
}

/**
 * Handle payment_intent.canceled event
 */
async function handleStripePaymentIntentCanceled(event: Stripe.Event): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata?.orderId;

  logger.info('❌ [STRIPE WEBHOOK] Payment intent canceled:', paymentIntent.id);

  if (!orderId) {
    return;
  }

  // WS-D004 FIX: Replace findById → push → save with atomic findOneAndUpdate.
  // Concurrent Stripe retries of this event would push duplicate 'payment_canceled'
  // timeline entries with the old pattern.  The $ne guard ensures the timeline entry
  // is only added once; subsequent deliveries are silently ignored.
  // FSM-CAS: $ne: 'failed' is the atomic FSM guard — idempotent on duplicate Stripe
  // deliveries and prevents re-entering 'failed' from 'failed'. No pre-fetch needed.
  const cancelledOrder = await Order.findOneAndUpdate(
    { _id: orderId, 'payment.status': { $ne: 'failed' } },
    {
      $set: { 'payment.status': 'failed', 'payment.failureReason': 'Payment intent canceled by Stripe' },
      $push: {
        timeline: {
          status: 'payment_canceled',
          message: 'Payment was canceled',
          timestamp: new Date(),
        },
      },
    },
    { new: true, writeConcern: { w: 'majority', j: true } },
  );

  if (!cancelledOrder) {
    logger.info('[STRIPE WEBHOOK] payment_intent.canceled — order already in terminal state, skipping', { orderId });
  }
}

/**
 * Retry failed webhook events
 * Finds WebhookLog entries with status 'pending_retry' and retryCount < 3,
 * then reprocesses them. Designed to be called by a cron job.
 */
export async function retryFailedWebhooks(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const MAX_RETRIES = 3;
  const BATCH_SIZE = 10;

  const pendingLogs = await WebhookLog.find({
    status: 'pending_retry',
    retryCount: { $lt: MAX_RETRIES },
    signatureValid: true,
  })
    .sort({ createdAt: 1 })
    .limit(BATCH_SIZE);

  if (pendingLogs.length === 0) {
    logger.info('[WEBHOOK RETRY] No pending retry events found');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  logger.info(`[WEBHOOK RETRY] Found ${pendingLogs.length} events to retry`);

  let succeeded = 0;
  let failed = 0;

  for (const webhookLog of pendingLogs) {
    // WS-D002 FIX: Claim the log atomically before processing.
    // Two concurrent retry-cron instances that both fetch the same pending_retry log
    // will race here; only the one whose findOneAndUpdate matches the 'pending_retry'
    // state wins.  The loser gets null and skips, preventing double-processing.
    // All writes use w:'majority' + j:true for durability across primary failover.
    const claimed = await WebhookLog.findOneAndUpdate(
      { _id: webhookLog._id, status: 'pending_retry' },
      { $set: { status: 'processing' } },
      { new: true, writeConcern: { w: 'majority', j: true } },
    );
    if (!claimed) {
      logger.info(`[WEBHOOK RETRY] Event ${webhookLog.eventId} already claimed by another instance — skipping`);
      continue;
    }

    try {
      if (webhookLog.provider === 'razorpay') {
        await processRazorpayEvent(webhookLog.payload, webhookLog);
      } else if (webhookLog.provider === 'stripe') {
        await processStripeEvent(webhookLog.payload as Stripe.Event, webhookLog);
      }

      // Mark as successfully processed — atomic + w:majority for durability
      await WebhookLog.findOneAndUpdate(
        { _id: webhookLog._id },
        { $set: { processed: true, processedAt: new Date(), status: 'success' } },
        { writeConcern: { w: 'majority', j: true } },
      );
      webhookLog.processed = true;
      webhookLog.status = 'success';

      succeeded++;
      logger.info(`[WEBHOOK RETRY] Successfully reprocessed event ${webhookLog.eventId}`);
    } catch (retryError: any) {
      const newCount = webhookLog.retryCount + 1;
      const nextStatus = newCount >= MAX_RETRIES ? 'failed' : 'pending_retry';
      await WebhookLog.findOneAndUpdate(
        { _id: webhookLog._id },
        { $set: { status: nextStatus, errorMessage: retryError.message }, $inc: { retryCount: 1 } },
        { writeConcern: { w: 'majority', j: true } },
      );
      webhookLog.retryCount = newCount;
      webhookLog.status = nextStatus;

      failed++;
      logger.error(
        `[WEBHOOK RETRY] Failed to reprocess event ${webhookLog.eventId} (retryCount: ${newCount}):`,
        retryError.message,
      );
    }
  }

  logger.info(`[WEBHOOK RETRY] Completed: ${succeeded} succeeded, ${failed} failed out of ${pendingLogs.length}`);
  return { processed: pendingLogs.length, succeeded, failed };
}

/**
 * Handle subscription.charged event
 *
 * Razorpay fires this when a subscription renewal payment is captured.
 * We extend renewsAt by 30 days and ensure the subscription is active.
 * Additionally, if any CoinTransaction exists with metadata.razorpayPaymentId
 * matching the payment and has a pending cashback, we credit the coins.
 */
async function handleRazorpaySubscriptionCharged(event: any): Promise<void> {
  const subscription = event.payload?.subscription?.entity;
  const payment = event.payload?.payment?.entity;

  if (!subscription?.id) {
    logger.error('[RAZORPAY WEBHOOK] subscription.charged: missing subscription entity');
    return;
  }

  logger.info('[RAZORPAY WEBHOOK] subscription.charged received', {
    razorpaySubscriptionId: subscription.id,
    paymentId: payment?.id,
  });

  // Extend renewsAt by 30 days and ensure status is active
  const sub = await UserSubscription.findOneAndUpdate(
    { 'metadata.razorpaySubscriptionId': subscription.id },
    {},
    { new: false },
  );

  if (!sub) {
    logger.warn('[RAZORPAY WEBHOOK] subscription.charged: no UserSubscription found for', subscription.id);
    return;
  }

  const newRenewsAt = new Date((sub.renewsAt || new Date()).getTime() + 30 * 24 * 60 * 60 * 1000);
  await UserSubscription.findByIdAndUpdate(sub._id, {
    $set: { status: 'active', renewsAt: newRenewsAt },
  });

  logger.info('[RAZORPAY WEBHOOK] subscription.charged: renewed', {
    subscriptionId: sub._id,
    newRenewsAt,
  });

  // If a CoinTransaction tracks this payment and has a pending cashback flag, credit it
  if (payment?.id) {
    const coinTx = await CoinTransaction.findOne({
      'metadata.razorpayPaymentId': payment.id,
      'metadata.cashbackPending': true,
    });

    if (coinTx) {
      const cashbackAmount: number = coinTx.metadata?.cashbackAmount || 0;
      if (cashbackAmount > 0) {
        try {
          await CoinTransaction.createTransaction(
            (coinTx.user as mongoose.Types.ObjectId).toString(),
            'earned',
            cashbackAmount,
            'cashback',
            'Subscription cashback credited',
            {
              idempotencyKey: `sub_cashback:${payment.id}`,
              razorpayPaymentId: payment.id,
            },
            null,
          );
          await CoinTransaction.findByIdAndUpdate(coinTx._id, {
            $set: { coinStatus: 'active', 'metadata.cashbackPending': false },
          });
          logger.info('[RAZORPAY WEBHOOK] subscription.charged: cashback credited', {
            userId: (coinTx.user as mongoose.Types.ObjectId).toString(),
            cashbackAmount,
          });
        } catch (coinErr: any) {
          logger.warn('[RAZORPAY WEBHOOK] subscription.charged: cashback credit failed (best-effort)', {
            error: coinErr.message,
          });
        }
      }
    }
  }
}

/**
 * Handle subscription.cancelled event
 *
 * Razorpay fires this when a subscription is cancelled (by user or admin).
 * We mark the UserSubscription as cancelled, reset coinMultiplier to 1,
 * and update the User's subscription field.
 */
async function handleRazorpaySubscriptionCancelled(event: any): Promise<void> {
  const subscription = event.payload?.subscription?.entity;

  if (!subscription?.id) {
    logger.error('[RAZORPAY WEBHOOK] subscription.cancelled: missing subscription entity');
    return;
  }

  logger.info('[RAZORPAY WEBHOOK] subscription.cancelled received', {
    razorpaySubscriptionId: subscription.id,
  });

  const sub = await UserSubscription.findOneAndUpdate(
    { 'metadata.razorpaySubscriptionId': subscription.id },
    { $set: { status: 'cancelled', coinMultiplier: 1 } },
    { new: true },
  );

  if (!sub) {
    logger.warn('[RAZORPAY WEBHOOK] subscription.cancelled: no UserSubscription found for', subscription.id);
    return;
  }

  // Best-effort: update User model subscription field
  try {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(sub.userId, {
      $set: {
        'subscription.plan': 'free',
        'subscription.coinMultiplier': 1,
      },
    });
  } catch (err: any) {
    logger.warn('[RAZORPAY WEBHOOK] subscription.cancelled: could not update User.subscription field', {
      userId: sub.userId?.toString(),
      error: err.message,
    });
  }

  logger.info('[RAZORPAY WEBHOOK] subscription.cancelled: processed', {
    subscriptionId: sub._id,
    userId: sub.userId?.toString(),
  });
}
