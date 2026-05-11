import { Request, Response } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import paymentService from '../services/PaymentService';
import stripeService from '../services/stripeService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import {
  sendSuccess,
  sendBadRequest,
  sendNotFound,
  sendUnauthorized,
  sendError,
  sendInternalError,
} from '../utils/response';
import {
  ICreatePaymentOrderRequest,
  ICreatePaymentOrderResponse,
  IVerifyPaymentRequest,
  IVerifyPaymentResponse,
  IRazorpayWebhookEvent,
} from '../types/payment';
import {
  verifyPaymentDataCompleteness,
  logPaymentVerificationAttempt,
  sanitizePaymentData,
} from '../utils/razorpayUtils';
import { PaymentLogger } from '../services/logging/paymentLogger';
import { logger } from '../config/logger';
import { assertPaymentTransition } from '../config/financialStateMachine';

/**
 * Create Razorpay order for payment
 * POST /api/payment/create-order
 */
export const createPaymentOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  // NOTE: `amount` from the client body is intentionally ignored — the authoritative
  // amount is always read from the order in the database to prevent underpayment attacks.
  const { orderId, currency = 'INR' }: Omit<ICreatePaymentOrderRequest, 'amount'> & { amount?: number } = req.body;

  // Validate request
  if (!orderId) {
    return sendBadRequest(res, 'Order ID is required');
  }

  try {
    // Verify order belongs to user
    const order = await Order.findOne({ _id: orderId, user: userId }).lean();
    if (!order) {
      return sendNotFound(res, 'Order not found');
    }

    // Check if order is in correct status for payment
    if (order.status !== 'placed') {
      return sendBadRequest(res, 'Order cannot be paid at this stage');
    }

    // Check if payment is already completed
    if (order.payment.status === 'paid') {
      return sendBadRequest(res, 'Payment already completed for this order');
    }

    // SECURITY FIX: Use the order total from the DB as the authoritative amount —
    // never trust the client-supplied amount to prevent underpayment/overpayment attacks.
    const authorizedAmount = order.totals.total;

    logger.info('[PAYMENT CONTROLLER] Creating payment order:', {
      orderId,
      authorizedAmount,
      currency,
      userId,
    });

    // Create Razorpay order using the DB-sourced amount
    const razorpayOrder = await paymentService.createPaymentOrder(orderId, authorizedAmount, currency);

    // Prepare response
    const response: ICreatePaymentOrderResponse = {
      success: true,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: paymentService.getRazorpayKeyId(),
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: orderId,
      orderNumber: order.orderNumber,
      notes: razorpayOrder.notes,
    };

    logger.info('[PAYMENT CONTROLLER] Payment order created successfully');

    sendSuccess(res, response, 'Payment order created successfully', 201);
  } catch (error: any) {
    logger.error('[PAYMENT CONTROLLER] Error creating payment order:', error);
    throw new AppError(`Failed to create payment order: ${error.message}`, 500);
  }
});

/**
 * Verify Razorpay payment signature
 * POST /api/payment/verify
 */
export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }: IVerifyPaymentRequest = req.body;

  // Sanitize payment data for logging
  const sanitizedData = sanitizePaymentData({
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  logger.info('[PAYMENT CONTROLLER] Verifying payment:', {
    ...sanitizedData,
    userId,
    timestamp: new Date().toISOString(),
  });

  // Log payment initiation for audit
  PaymentLogger.logPaymentInitiation(userId, 0, 'razorpay', razorpay_order_id);

  // Validate request completeness using utility
  const dataValidation = verifyPaymentDataCompleteness({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });

  if (!dataValidation.isValid) {
    logger.error('[PAYMENT CONTROLLER] Invalid payment data:', dataValidation.error);
    PaymentLogger.logPaymentFailure(
      razorpay_payment_id || 'unknown',
      userId,
      0,
      new Error(dataValidation.error),
      'Invalid payment data',
    );
    return sendBadRequest(res, dataValidation.error || 'Invalid payment verification data');
  }

  // Validate MongoDB order ID
  if (!orderId) {
    return sendBadRequest(res, 'Order ID is required');
  }

  try {
    // Verify order belongs to user
    const order = await Order.findOne({ _id: orderId, user: userId }).lean();
    if (!order) {
      return sendNotFound(res, 'Order not found');
    }

    // Log verification attempt for audit trail
    logPaymentVerificationAttempt(
      orderId,
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      false, // Will be updated below
    );

    // Verify signature
    const isValidSignature = paymentService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!isValidSignature) {
      logger.error('[PAYMENT CONTROLLER] Invalid payment signature');

      // Log failed verification attempt
      logPaymentVerificationAttempt(orderId, userId, razorpay_order_id, razorpay_payment_id, false);

      // Log payment failure
      PaymentLogger.logPaymentFailure(
        razorpay_payment_id,
        userId,
        order.totals.total,
        new Error('Invalid payment signature'),
        'Signature verification failed',
      );

      // Handle payment failure
      await paymentService.handlePaymentFailure(orderId, 'Invalid payment signature');

      return sendBadRequest(res, 'Payment verification failed - Invalid signature');
    }

    // Log successful verification
    logPaymentVerificationAttempt(orderId, userId, razorpay_order_id, razorpay_payment_id, true);

    // Atomic guard: prevent duplicate post-payment pipeline execution from concurrent
    // /verify and webhook paths. Mirror exactly the CAS used in webhookController.ts so
    // only one path wins and the other is silently skipped.
    const guard = await Order.findOneAndUpdate(
      { _id: orderId, postPaymentProcessed: { $ne: true } },
      { $set: { postPaymentProcessed: true } },
      { new: false }, // return pre-update doc — non-null means we won the claim
    );

    if (!guard) {
      // Another path (webhook) already ran or is running the pipeline — do not double-credit.
      logger.info('[verifyPayment] Pipeline already processed by webhook path — skipping', {
        orderId,
        userId,
        razorpay_payment_id,
      });
      res.json({ success: true, message: 'Payment already processed' });
      return;
    }

    // We own the pipeline token — run it. On failure, reset the flag so the webhook
    // path can retry, then re-throw so the outer catch handles error response.
    let updatedOrder: Awaited<ReturnType<typeof paymentService.handlePaymentSuccess>>;
    try {
      updatedOrder = await paymentService.handlePaymentSuccess(orderId, {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
    } catch (pipelineErr: any) {
      logger.error(
        '[verifyPayment] Post-payment pipeline failed — resetting postPaymentProcessed for retry:',
        pipelineErr,
      );
      await Order.findByIdAndUpdate(orderId, { $set: { postPaymentProcessed: false } }).catch((resetErr: any) =>
        logger.error('[verifyPayment] Failed to reset postPaymentProcessed:', resetErr),
      );
      throw pipelineErr;
    }

    logger.info('[PAYMENT CONTROLLER] Payment verified and processed successfully');

    // Auto-trigger bank_offer bonus campaign on successful payment
    try {
      const bonusCampaignService = require('../services/bonusCampaignService');
      logger.info('[PAYMENT] Triggering bank_offer for order:', orderId);
      await bonusCampaignService.autoClaimForTransaction('bank_offer', userId, {
        transactionRef: { type: 'payment' as const, refId: razorpay_payment_id },
        transactionAmount: order.totals.total,
        paymentMethod: order.payment?.method,
      });
    } catch (bonusErr) {
      logger.error('[PAYMENT] bank_offer auto-claim failed (non-blocking):', bonusErr);
    }

    // Populate order for response
    const populatedOrder = await Order.findById(updatedOrder._id)
      .populate('items.product', 'name image images')
      .populate('items.store', 'name logo')
      .populate('user', 'profile.firstName profile.lastName profile.phoneNumber')
      .lean();

    if (!populatedOrder) {
      throw new AppError(
        'Order not found after payment processing — payment was successful, contact support if needed',
        500,
      );
    }

    const response: IVerifyPaymentResponse = {
      success: true,
      message: 'Payment verified and order confirmed successfully',
      verified: true,
      order: populatedOrder,
    };

    sendSuccess(res, response, 'Payment verified successfully');
  } catch (error: any) {
    logger.error('[PAYMENT CONTROLLER] Error verifying payment:', error);

    // Handle payment failure
    try {
      await paymentService.handlePaymentFailure(orderId, error.message);
    } catch (failureError) {
      logger.error('[PAYMENT CONTROLLER] Error handling payment failure:', failureError);
    }

    throw new AppError(`Payment verification failed: ${error.message}`, 500);
  }
});

/**
 * Handle Razorpay webhook events
 * POST /api/payment/webhook
 */
export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const webhookSignature = req.headers['x-razorpay-signature'] as string;

  // Use the raw Buffer from express.raw() (mounted before JSON parser in server.ts)
  // Convert to string for HMAC verification — preserves original byte order
  const rawBody: string = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);

  logger.info('[PAYMENT CONTROLLER] Received webhook event');

  try {
    // Verify webhook signature using the original raw body
    const isValidSignature = paymentService.verifyWebhookSignature(rawBody, webhookSignature);

    if (!isValidSignature) {
      logger.error('[PAYMENT CONTROLLER] Invalid webhook signature');
      return sendUnauthorized(res, 'Invalid webhook signature');
    }

    // Parse the verified raw body into a typed event object
    let event: IRazorpayWebhookEvent;
    try {
      event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) : req.body;
    } catch (parseError) {
      logger.error('[PAYMENT CONTROLLER] Failed to parse webhook body:', parseError);
      return res.status(400).json({ status: 'error', message: 'Invalid webhook payload' });
    }

    logger.info('[PAYMENT CONTROLLER] Webhook event type:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event);
        break;

      case 'payment.authorized':
        await handlePaymentAuthorized(event);
        break;

      case 'refund.processed':
        await handleRefundProcessed(event);
        break;

      case 'order.paid':
        await handleOrderPaid(event);
        break;

      default:
        logger.info('[PAYMENT CONTROLLER] Unhandled webhook event:', event.event);
    }

    // Return 200 to acknowledge receipt after successful processing
    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    logger.error('[PAYMENT CONTROLLER] Error handling webhook:', error);
    // Return 500 so Razorpay retries the webhook — returning 200 on error
    // causes Razorpay to consider the event acknowledged and never retry it,
    // silently losing payment events (wallet credits, stock deductions, etc.).
    res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
  }
});

/**
 * Get payment status for an order
 * GET /api/payment/status/:orderId
 */
export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { orderId } = req.params;

  logger.info('[PAYMENT CONTROLLER] Getting payment status for order:', orderId);

  try {
    // Verify order belongs to user
    const order = await Order.findOne({ _id: orderId, user: userId }).lean();
    if (!order) {
      return sendNotFound(res, 'Order not found');
    }

    const paymentGateway = (order as any).paymentGateway;

    const response = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus: order.payment.status,
      gatewayOrderId: paymentGateway?.gatewayOrderId,
      gatewayPaymentId: paymentGateway?.gatewayPaymentId,
      amount: order.totals.total,
      currency: 'INR',
      paidAt: order.payment.paidAt,
      failureReason: order.payment.failureReason,
    };

    sendSuccess(res, response, 'Payment status retrieved successfully');
  } catch (error: any) {
    logger.error('[PAYMENT CONTROLLER] Error getting payment status:', error);
    throw new AppError(`Failed to get payment status: ${error.message}`, 500);
  }
});

// Helper functions for webhook event handling

async function handlePaymentCaptured(event: IRazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes?.orderId;
    const paymentId = payment.id;

    if (!orderId) {
      logger.error('[WEBHOOK] Order ID not found in payment notes');
      return;
    }

    logger.info('[WEBHOOK] Payment captured for order:', { orderId, paymentId });

    // Idempotency guard: skip if order is already paid or processing
    const existingOrder = await Order.findById(orderId).lean();
    if (!existingOrder) {
      logger.error('[WEBHOOK] payment.captured — order not found:', orderId);
      return;
    }

    if (existingOrder.payment?.status === 'paid' || existingOrder.payment?.status === 'processing') {
      logger.info('[WEBHOOK] payment.captured — already processed, skipping:', {
        orderId,
        status: existingOrder.payment.status,
      });
      return;
    }

    // Validate that the captured payment amount matches the order total (in paise)
    // Razorpay amounts are in paise (smallest currency unit); order totals are in rupees
    const capturedAmountInRupees = payment.amount / 100;
    const orderTotal = existingOrder.totals?.total ?? 0;
    if (orderTotal > 0 && Math.abs(capturedAmountInRupees - orderTotal) > 1) {
      logger.error('[WEBHOOK] payment.captured — amount mismatch, not processing:', {
        orderId,
        capturedAmount: capturedAmountInRupees,
        orderTotal,
      });
      return;
    }

    // Delegate to the payment service which handles stock deduction, status updates,
    // and its own idempotency guard atomically.
    await paymentService.handlePaymentSuccess(orderId, {
      razorpay_order_id: payment.order_id || '',
      razorpay_payment_id: paymentId,
      razorpay_signature: '', // Signature already verified via webhook HMAC above
    });

    logger.info('[WEBHOOK] payment.captured — order processed successfully:', orderId);
  } catch (error) {
    logger.error('[WEBHOOK] Error handling payment.captured:', error);
  }
}

async function handlePaymentFailed(event: IRazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes?.orderId;

    if (!orderId) {
      logger.error('[WEBHOOK] Order ID not found in payment notes');
      return;
    }

    logger.info('[WEBHOOK] Payment failed for order:', orderId);

    const failureReason = payment.error_description || 'Payment failed';

    // Handle payment failure
    await paymentService.handlePaymentFailure(orderId, failureReason);
  } catch (error) {
    logger.error('[WEBHOOK] Error handling payment.failed:', error);
  }
}

/**
 * payment.authorized — Razorpay has authorized (reserved) the payment but not yet captured it.
 * This happens when auto-capture is disabled on the Razorpay dashboard.
 * We log it and update the order status to 'authorized' so it can be captured manually
 * or via a scheduled job.
 */
async function handlePaymentAuthorized(event: IRazorpayWebhookEvent) {
  try {
    const payment = event.payload.payment?.entity;
    const orderId = payment?.notes?.orderId;
    const paymentId = payment?.id;

    if (!orderId) {
      logger.warn('[WEBHOOK] payment.authorized — orderId missing from notes, skipping');
      return;
    }

    logger.info('[WEBHOOK] payment.authorized received', { orderId, paymentId });

    const order = await Order.findById(orderId);
    if (!order) {
      logger.error('[WEBHOOK] payment.authorized — order not found:', orderId);
      return;
    }

    // Skip if already fully paid (auto-capture may have fired first)
    if (order.payment?.status === 'paid') {
      logger.info('[WEBHOOK] payment.authorized — already paid, skipping');
      return;
    }

    // F001-C9 FIX: hard throw on invalid Order.payment.status transitions
    assertPaymentTransition(order.payment?.status ?? 'pending', 'authorized');

    // Mark as authorized so the admin dashboard / fulfilment pipeline can act on it
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        'payment.status': 'authorized',
        'payment.authorizedAt': new Date(),
        'paymentGateway.gatewayPaymentId': paymentId,
      },
    });

    logger.info('[WEBHOOK] payment.authorized — order marked as authorized:', orderId);
  } catch (error) {
    logger.error('[WEBHOOK] Error handling payment.authorized:', error);
  }
}

/**
 * refund.processed — Razorpay has successfully processed a refund.
 * Update the order payment status to 'refunded' so order history is accurate.
 */
async function handleRefundProcessed(event: IRazorpayWebhookEvent) {
  try {
    // Razorpay sends the payment entity inside the payload for refund events
    const payment = event.payload.payment?.entity;
    const orderId = payment?.notes?.orderId;
    const refundAmount = payment?.amount_refunded ? payment.amount_refunded / 100 : undefined;

    if (!orderId) {
      logger.warn('[WEBHOOK] refund.processed — orderId missing from payment notes, skipping');
      return;
    }

    logger.info('[WEBHOOK] refund.processed received', { orderId, refundAmount });

    const order = await Order.findById(orderId);
    if (!order) {
      logger.error('[WEBHOOK] refund.processed — order not found:', orderId);
      return;
    }

    // Update to refunded — set refund details for audit trail
    await Order.findByIdAndUpdate(orderId, {
      $set: {
        'payment.status': 'refunded',
        'payment.refundedAt': new Date(),
        'payment.refundAmount': refundAmount,
        status: 'refunded',
      },
    });

    logger.info('[WEBHOOK] refund.processed — order updated to refunded:', orderId);
  } catch (error) {
    logger.error('[WEBHOOK] Error handling refund.processed:', error);
  }
}

async function handleOrderPaid(event: IRazorpayWebhookEvent) {
  try {
    const orderEntity = event.payload.order?.entity;
    const paymentEntity = event.payload.payment?.entity;
    const orderId = orderEntity?.notes?.orderId || paymentEntity?.notes?.orderId;

    if (!orderId) {
      logger.error('[WEBHOOK] Order ID not found in order.paid notes');
      return;
    }

    logger.info('[WEBHOOK] order.paid received for orderId:', orderId);

    // Idempotency guard: skip if already paid or processing
    const existingOrder = await Order.findById(orderId).lean();
    if (!existingOrder) {
      logger.error('[WEBHOOK] order.paid — order not found:', orderId);
      return;
    }

    if (existingOrder.payment?.status === 'paid' || existingOrder.payment?.status === 'processing') {
      logger.info('[WEBHOOK] order.paid — already processed, skipping:', {
        orderId,
        status: existingOrder.payment.status,
      });
      return;
    }

    // Use payment entity details if available; fall back to order entity
    const paymentId = paymentEntity?.id || '';
    const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id || '';

    await paymentService.handlePaymentSuccess(orderId, {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: '', // Webhook HMAC already verified above
    });

    logger.info('[WEBHOOK] order.paid — order processed successfully:', orderId);
  } catch (error) {
    logger.error('[WEBHOOK] Error handling order.paid:', error);
  }
}

/**
 * Create Stripe Checkout Session for subscription payment
 * POST /api/payment/create-checkout-session
 */
export const createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { subscriptionId, tier, amount, billingCycle, successUrl, cancelUrl, customerEmail } = req.body;

  logger.info('[PAYMENT CONTROLLER] Creating Stripe checkout session:', {
    subscriptionId,
    tier,
    amount,
    billingCycle,
    userId,
  });

  // Validate request
  if (!subscriptionId || !tier || !amount || !billingCycle || !successUrl || !cancelUrl) {
    return sendBadRequest(
      res,
      'Missing required parameters: subscriptionId, tier, amount, billingCycle, successUrl, cancelUrl',
    );
  }

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    return sendBadRequest(res, 'Invalid amount');
  }

  // Validate tier
  if (!['premium', 'vip'].includes(tier.toLowerCase())) {
    return sendBadRequest(res, 'Invalid tier. Must be premium or vip');
  }

  // Validate billing cycle
  if (!['monthly', 'yearly'].includes(billingCycle.toLowerCase())) {
    return sendBadRequest(res, 'Invalid billing cycle. Must be monthly or yearly');
  }

  try {
    // Check if Stripe is configured
    if (!stripeService.isStripeConfigured()) {
      return sendBadRequest(res, 'Stripe is not configured on the server');
    }

    // Create Stripe checkout session
    const session = await stripeService.createCheckoutSession({
      subscriptionId,
      tier,
      amount,
      billingCycle,
      successUrl,
      cancelUrl,
      customerEmail,
      metadata: {
        userId: userId.toString(),
      },
    });

    logger.info('[PAYMENT CONTROLLER] Stripe checkout session created successfully');

    const response = {
      success: true,
      sessionId: session.id,
      url: session.url,
    };

    sendSuccess(res, response, 'Stripe checkout session created successfully', 201);
  } catch (error: any) {
    logger.error('[PAYMENT CONTROLLER] Error creating Stripe checkout session:', error);

    // Handle Stripe-specific errors
    const stripeError = stripeService.handleStripeError(error);
    throw new AppError(stripeError.message, stripeError.statusCode);
  }
});

/**
 * Verify Stripe checkout session after payment
 * POST /api/payment/verify-stripe-session
 */
export const verifyStripeSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { sessionId, orderId } = req.body;

  logger.info('[PAYMENT CONTROLLER] Verifying Stripe session:', {
    sessionId,
    orderId,
    userId,
  });

  // Validate request
  if (!sessionId) {
    return sendBadRequest(res, 'Session ID is required');
  }

  try {
    // Check if Stripe is configured
    if (!stripeService.isStripeConfigured()) {
      return sendBadRequest(res, 'Stripe is not configured on the server');
    }

    // Verify checkout session
    const verification = await stripeService.verifyCheckoutSession(sessionId);

    if (!verification.verified) {
      logger.error('[PAYMENT CONTROLLER] Stripe payment not completed:', verification.paymentStatus);

      return sendBadRequest(res, `Payment not completed. Status: ${verification.paymentStatus}`);
    }

    // If orderId is provided, update the order atomically
    // Phase 3: CAS filter { $ne: 'paid' } is the FSM guard — only writes if not already paid.
    // Explicit validatePaymentTransition() omitted here (no prior fetch); the CAS filter is the enforcement.
    if (orderId) {
      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          user: userId,
          'payment.status': { $ne: 'paid' }, // FSM guard: only advance if not already terminal
        },
        {
          $set: {
            'payment.status': 'paid',
            'payment.transactionId': verification.paymentIntentId || sessionId,
            'payment.paidAt': new Date(),
            'payment.paymentGateway': 'stripe',
            'totals.paidAmount': verification.amount,
            status: 'confirmed',
          },
          $push: {
            timeline: {
              $each: [
                { status: 'payment_success', message: 'Stripe payment completed successfully', timestamp: new Date() },
                { status: 'confirmed', message: 'Order confirmed after Stripe payment', timestamp: new Date() },
              ],
            },
          },
        },
        { new: true },
      );

      if (!order) {
        // Either order not found or already paid — check which
        const existing = await Order.findOne({ _id: orderId, user: userId }).lean();
        if (!existing) {
          return sendNotFound(res, 'Order not found');
        }
        // Already paid — still return success (idempotent)
      }
    }

    const response = {
      success: true,
      verified: true,
      message: 'Stripe payment verified successfully',
      paymentDetails: {
        amount: verification.amount,
        currency: verification.currency,
        paymentStatus: verification.paymentStatus,
        paymentIntentId: verification.paymentIntentId,
      },
    };

    sendSuccess(res, response, 'Stripe payment verified successfully');
  } catch (error: any) {
    logger.error('[PAYMENT CONTROLLER] Error verifying Stripe session:', error);

    // Handle Stripe-specific errors
    const stripeError = stripeService.handleStripeError(error);
    throw new AppError(stripeError.message, stripeError.statusCode);
  }
});

/**
 * Verify Stripe payment intent
 * POST /api/payment/verify-stripe-payment
 */
export const verifyStripePayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { paymentIntentId, orderId } = req.body;

  logger.info('[PAYMENT CONTROLLER] Verifying Stripe payment intent:', {
    paymentIntentId,
    orderId,
    userId,
  });

  // Validate request
  if (!paymentIntentId) {
    return sendBadRequest(res, 'Payment Intent ID is required');
  }

  try {
    // Check if Stripe is configured
    if (!stripeService.isStripeConfigured()) {
      return sendBadRequest(res, 'Stripe is not configured on the server');
    }

    // Verify payment intent
    const verification = await stripeService.verifyPaymentIntent(paymentIntentId);

    if (!verification.verified) {
      logger.error('[PAYMENT CONTROLLER] Stripe payment not successful:', verification.status);

      return sendBadRequest(res, `Payment not successful. Status: ${verification.status}`);
    }

    // If orderId is provided, update the order atomically
    if (orderId) {
      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          user: userId,
          'payment.status': { $ne: 'paid' },
        },
        {
          $set: {
            'payment.status': 'paid',
            'payment.transactionId': paymentIntentId,
            'payment.paidAt': new Date(),
            'payment.paymentGateway': 'stripe',
            'totals.paidAmount': verification.amount,
            status: 'confirmed',
          },
          $push: {
            timeline: {
              $each: [
                { status: 'payment_success', message: 'Stripe payment completed successfully', timestamp: new Date() },
                { status: 'confirmed', message: 'Order confirmed after Stripe payment', timestamp: new Date() },
              ],
            },
          },
        },
        { new: true },
      );

      if (!order) {
        const existing = await Order.findOne({ _id: orderId, user: userId }).lean();
        if (!existing) {
          return sendNotFound(res, 'Order not found');
        }
        // Already paid — idempotent success
      }
    }

    const response = {
      success: true,
      verified: true,
      message: 'Stripe payment verified successfully',
      paymentDetails: {
        amount: verification.amount,
        currency: verification.currency,
        status: verification.status,
      },
    };

    sendSuccess(res, response, 'Stripe payment verified successfully');
  } catch (error: any) {
    logger.error('[PAYMENT CONTROLLER] Error verifying Stripe payment:', error);

    // Handle Stripe-specific errors
    const stripeError = stripeService.handleStripeError(error);
    throw new AppError(stripeError.message, stripeError.statusCode);
  }
});

/**
 * Handle Stripe webhook events
 * POST /api/payment/stripe-webhook
 */
export const handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  logger.info('[PAYMENT CONTROLLER] Received Stripe webhook event');

  if (!signature) {
    logger.error('[PAYMENT CONTROLLER] Missing Stripe signature header');
    return sendUnauthorized(res, 'Missing Stripe signature');
  }

  try {
    // Check if Stripe is configured
    if (!stripeService.isStripeConfigured()) {
      logger.error('[PAYMENT CONTROLLER] Stripe is not configured');
      // Fixed: Use response helper instead of raw res.json() - Phase 0
      return sendInternalError(res, 'Stripe not configured');
    }

    // Verify webhook signature using the raw Buffer from express.raw()
    // req.body MUST be a Buffer (express.raw() is mounted before JSON parser in server.ts)
    if (!Buffer.isBuffer(req.body)) {
      logger.error(
        '[PAYMENT CONTROLLER] Stripe webhook req.body is not a Buffer — express.raw() middleware may not be configured correctly',
      );
      // Fixed: Use response helper instead of raw res.json() - Phase 0
      return sendBadRequest(res, 'Invalid request body format for webhook verification');
    }
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    logger.info('[PAYMENT CONTROLLER] Stripe webhook event type:', event.type);
    logger.info('[PAYMENT CONTROLLER] Event ID:', event.id);

    // Handle different webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSucceeded(event);
        break;

      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event);
        break;

      case 'checkout.session.completed':
        await handleStripeCheckoutCompleted(event);
        break;

      case 'checkout.session.expired':
        await handleStripeCheckoutExpired(event);
        break;

      case 'charge.refunded':
        await handleStripeRefund(event);
        break;

      default:
        logger.info('[PAYMENT CONTROLLER] Unhandled Stripe webhook event:', event.type);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true, eventId: event.id });
  } catch (error: any) {
    logger.error('[PAYMENT CONTROLLER] Error handling Stripe webhook:', error);

    // Return 400 for signature verification failures
    // Fixed: Use response helper instead of raw res.json() - Phase 0
    if (error.message.includes('signature')) {
      return sendBadRequest(res, 'Invalid signature');
    }

    // Return 500 so Stripe retries the webhook — 200 here would silence the event permanently.
    res.status(500).json({ received: false, error: 'Webhook processing failed' });
  }
});

// Helper functions for Stripe webhook event handling

async function handleStripePaymentSucceeded(event: any) {
  try {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    logger.info('[STRIPE WEBHOOK] Payment succeeded:', paymentIntent.id);

    if (!orderId) {
      logger.warn('[STRIPE WEBHOOK] No orderId in payment intent metadata');
      return;
    }

    const now = new Date();
    // Atomic update: only apply if payment is NOT already 'paid' — prevents double-processing
    // on concurrent webhook delivery (e.g. Stripe retries on network timeout)
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, 'payment.status': { $ne: 'paid' } },
      {
        $set: {
          'payment.status': 'paid',
          'payment.transactionId': paymentIntent.id,
          'payment.paidAt': now,
          'payment.paymentGateway': 'stripe',
          'totals.paidAmount': paymentIntent.amount / 100,
          status: 'confirmed',
        },
        $push: {
          timeline: {
            $each: [
              { status: 'payment_success', message: 'Stripe payment completed via webhook', timestamp: now },
              { status: 'confirmed', message: 'Order confirmed after Stripe payment', timestamp: now },
            ],
          },
        },
      },
      { new: true },
    );

    if (!updated) {
      logger.info('[STRIPE WEBHOOK] Payment already processed or order not found for orderId:', orderId);
      return;
    }

    logger.info('[STRIPE WEBHOOK] Order updated successfully');
  } catch (error) {
    logger.error('[STRIPE WEBHOOK] Error handling payment_intent.succeeded:', error);
  }
}

async function handleStripePaymentFailed(event: any) {
  try {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata?.orderId;

    logger.info('[STRIPE WEBHOOK] Payment failed:', paymentIntent.id);

    if (!orderId) {
      logger.warn('[STRIPE WEBHOOK] No orderId in payment intent metadata');
      return;
    }

    const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';
    const now = new Date();
    // Atomic update: only apply if not already in a terminal state (cancelled/paid/refunded)
    // Phase 3: CAS filter $nin is the FSM guard here — explicit validatePaymentTransition() omitted (no prior fetch).
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, 'payment.status': { $nin: ['paid', 'refunded', 'partially_refunded'] } },
      {
        $set: {
          'payment.status': 'failed',
          'payment.failureReason': failureReason,
          status: 'cancelled',
          cancelReason: `Payment failed: ${failureReason}`,
          cancelledAt: now,
        },
        $push: {
          timeline: {
            status: 'payment_failed',
            message: `Stripe payment failed: ${failureReason}`,
            timestamp: now,
          },
        },
      },
      { new: true },
    );

    if (!updated) {
      logger.info('[STRIPE WEBHOOK] Order already in terminal state or not found for orderId:', orderId);
      return;
    }

    // Release reservedStock for each item so the stock is available to future orders.
    // Run best-effort (non-blocking) — a failed stock release is recoverable via
    // reconciliation, whereas blocking the webhook response risks Stripe retries.
    try {
      for (const item of updated.items) {
        const productId = (item as any).product;
        const quantity = (item as any).quantity;
        if (!productId || !quantity) continue;

        const variant = (item as any).variant;
        if (variant?.type && variant?.value) {
          // Variant: release reservedStock without touching variant.stock (not yet deducted)
          await Product.findByIdAndUpdate(productId, {
            $inc: { 'inventory.reservedStock': -quantity },
          });
        } else {
          await Product.findByIdAndUpdate(productId, {
            $inc: { 'inventory.reservedStock': -quantity },
          });
        }
      }
      logger.info('[STRIPE WEBHOOK] Reserved stock released for cancelled order:', orderId);
    } catch (stockErr) {
      logger.error('[STRIPE WEBHOOK] Failed to release reserved stock for order:', orderId, stockErr);
    }

    logger.info('[STRIPE WEBHOOK] Order updated with payment failure');
  } catch (error) {
    logger.error('[STRIPE WEBHOOK] Error handling payment_intent.payment_failed:', error);
  }
}

async function handleStripeCheckoutCompleted(event: any) {
  try {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    logger.info('[STRIPE WEBHOOK] Checkout session completed:', session.id);

    if (!orderId) {
      logger.info('[STRIPE WEBHOOK] No orderId in checkout session metadata (might be subscription)');
      return;
    }

    const now = new Date();
    // Atomic update: only apply if payment is NOT already 'paid'
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, 'payment.status': { $ne: 'paid' } },
      {
        $set: {
          'payment.status': 'paid',
          'payment.transactionId': session.payment_intent as string,
          'payment.paidAt': now,
          'payment.paymentGateway': 'stripe',
          'totals.paidAmount': (session.amount_total || 0) / 100,
          status: 'confirmed',
        },
        $push: {
          timeline: {
            $each: [
              { status: 'payment_success', message: 'Stripe checkout completed via webhook', timestamp: now },
              { status: 'confirmed', message: 'Order confirmed after Stripe checkout', timestamp: now },
            ],
          },
        },
      },
      { new: true },
    );

    if (!updated) {
      logger.info('[STRIPE WEBHOOK] Payment already processed or order not found for orderId:', orderId);
      return;
    }

    logger.info('[STRIPE WEBHOOK] Order updated successfully');
  } catch (error) {
    logger.error('[STRIPE WEBHOOK] Error handling checkout.session.completed:', error);
  }
}

async function handleStripeCheckoutExpired(event: any) {
  try {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;

    logger.info('[STRIPE WEBHOOK] Checkout session expired:', session.id);

    if (!orderId) {
      return;
    }

    const now = new Date();
    // Atomic update: only mark expired if payment is still 'pending' — never overwrite paid/refunded
    const updated = await Order.findOneAndUpdate(
      { _id: orderId, 'payment.status': 'pending' },
      {
        $set: {
          'payment.status': 'failed',
          'payment.failureReason': 'Checkout session expired',
        },
        $push: {
          timeline: {
            status: 'payment_expired',
            message: 'Stripe checkout session expired',
            timestamp: now,
          },
        },
      },
      { new: true },
    );

    if (!updated) {
      logger.info('[STRIPE WEBHOOK] Order not pending or not found for orderId:', orderId);
      return;
    }

    logger.info('[STRIPE WEBHOOK] Order updated with expired status');
  } catch (error) {
    logger.error('[STRIPE WEBHOOK] Error handling checkout.session.expired:', error);
  }
}

async function handleStripeRefund(event: any) {
  try {
    const charge = event.data.object;
    const paymentIntentId = charge.payment_intent;

    logger.info('[STRIPE WEBHOOK] Refund processed for charge:', charge.id);

    // Extract the individual Stripe refund ID from the most recent refund on the charge.
    // charge.refunds.data[0] is the refund that triggered this event.
    // We use this as the per-refund idempotency key so partial refunds are not blocked.
    const refundId: string = charge.refunds?.data?.[0]?.id ?? charge.id;
    const refundAmountForThisEvent = (charge.refunds?.data?.[0]?.amount ?? charge.amount_refunded) / 100;
    const refundAmount = charge.amount_refunded / 100; // total refunded so far (cumulative)
    const now = new Date();

    // Determine refund status based on amounts — we need paidAmount to decide.
    // Fetch the order first (read-only) to compare amounts, then do atomic update.
    const existingOrder = await Order.findOne(
      { 'payment.transactionId': paymentIntentId },
      { 'totals.paidAmount': 1, 'payment.processedRefundIds': 1 },
    ).lean();

    if (!existingOrder) {
      logger.error('[STRIPE WEBHOOK] Order not found for payment intent:', paymentIntentId);
      return;
    }

    const paidAmount = (existingOrder as any).totals?.paidAmount ?? 0;
    const refundStatus = refundAmount >= paidAmount ? 'refunded' : 'partially_refunded';

    // Atomic update: idempotency guard uses processedRefundIds array so each individual
    // refund event is tracked independently — this allows multiple partial refunds to succeed.
    const updated = await Order.findOneAndUpdate(
      {
        'payment.transactionId': paymentIntentId,
        'payment.processedRefundIds': { $ne: refundId }, // prevent re-processing same refund event
      },
      {
        $set: {
          'payment.status': refundStatus,
          'payment.refundId': charge.id,
          'payment.refundedAt': now,
          'totals.refundAmount': refundAmount,
        },
        $addToSet: {
          'payment.processedRefundIds': refundId,
        },
        $push: {
          timeline: {
            status: 'refund_processed',
            message: `Stripe refund of ₹${refundAmountForThisEvent} processed (refundId: ${refundId})`,
            timestamp: now,
          },
        },
      },
      { new: true },
    );

    if (!updated) {
      logger.info('[STRIPE WEBHOOK] Refund already applied or order not found for refundId:', refundId);
      return;
    }

    logger.info('[STRIPE WEBHOOK] Order updated with refund details');
  } catch (error) {
    logger.error('[STRIPE WEBHOOK] Error handling charge.refunded:', error);
  }
}
