import { logger } from '../config/logger';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendError, sendBadRequest } from '../utils/response';
import { razorpayService } from '../services/razorpayService';
import { Order } from '../models/Order';
import { assertPaymentTransition } from '../config/financialStateMachine';
import { publishPaymentEvent } from '../events/paymentQueue';
import pushNotificationService from '../services/pushNotificationService';
import { dispatchPaymentCompleted } from '../services/rendezWebhookDispatch';

/**
 * @desc Create a Razorpay order for payment
 * @route POST /api/razorpay/create-order
 * @access Private
 */
export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { orderId, notes } = req.body;

  // SECURITY: Never trust the client-supplied amount — always derive it from the
  // authoritative DB order document.  A missing or tampered amount in the request
  // body previously allowed a 1-paise payment for any order.
  let amount: number;

  if (!orderId) {
    return sendBadRequest(res, 'orderId is required');
  }

  try {
    const order = await Order.findOne({ _id: orderId, user: userId }).lean();
    if (!order) {
      return sendError(res, 'Order not found or does not belong to this user', 404);
    }

    // Use the authoritative final amount from the order document
    const orderAmount =
      (order as any).totals?.finalAmount ?? (order as any).totals?.total ?? (order as any).totalAmount;
    if (!orderAmount || orderAmount <= 0) {
      return sendBadRequest(res, 'Order has an invalid amount');
    }
    amount = orderAmount;
  } catch (lookupErr: any) {
    logger.error('❌ [RAZORPAY CONTROLLER] Order lookup error:', lookupErr);
    return sendError(res, 'Failed to retrieve order details', 500);
  }

  try {
    // Generate receipt
    const receipt = `order_${orderId}`;

    // Create Razorpay order using the server-side amount only
    const razorpayOrder = await razorpayService.createOrder(amount, receipt, {
      userId,
      orderId,
      ...notes,
    });

    logger.info('✅ [RAZORPAY CONTROLLER] Order created successfully:', razorpayOrder.id);

    // Return order details to frontend
    sendSuccess(
      res,
      {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        notes: razorpayOrder.notes,
      },
      'Razorpay order created successfully',
    );
  } catch (error: any) {
    logger.error('❌ [RAZORPAY CONTROLLER] Order creation error:', error);
    sendError(res, 'Internal server error', 500);
  }
});

/**
 * @desc Verify Razorpay payment and create order
 * @route POST /api/razorpay/verify-payment
 * @access Private
 */
export const verifyRazorpayPayment = asyncHandler(async (req: Request, res: Response) => {
  const _userId = req.userId!;
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    orderData: _orderData, // Cart items, delivery address, etc.
  } = req.body;

  // Validate input
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return sendBadRequest(res, 'Payment verification data is required');
  }

  try {
    // Step 1: Verify signature
    const isValid = razorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      logger.error('❌ [RAZORPAY CONTROLLER] Payment signature verification failed');
      return sendError(res, 'Payment verification failed. Please contact support.', 400);
    }

    logger.info('✅ [RAZORPAY CONTROLLER] Payment signature verified');

    // Step 2: Fetch payment details from Razorpay
    const paymentDetails = await razorpayService.fetchPaymentDetails(razorpayPaymentId);

    if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
      logger.error('❌ [RAZORPAY CONTROLLER] Payment not successful:', paymentDetails.status);
      return sendError(res, `Payment failed with status: ${paymentDetails.status}`, 400);
    }

    const amountInRupees = Number(paymentDetails.amount) / 100;

    logger.info('✅ [RAZORPAY CONTROLLER] Payment successful:', {
      paymentId: razorpayPaymentId,
      method: paymentDetails.method,
      amount: `₹${amountInRupees}`,
    });

    // BUG-05: Mark the REZ order as paid after successful payment verification.
    // The receipt stored at Razorpay order creation is `order_<rezOrderId>`.
    // paymentDetails.order_id is the Razorpay order ID we already have.
    // Fetch the Razorpay order to get the receipt, then parse the REZ order ID.
    let rezOrderId: string | null = null;
    try {
      const razorpayOrder = await razorpayService.fetchOrder(razorpayOrderId);
      const receipt: string = (razorpayOrder as any).receipt || '';
      if (receipt.startsWith('order_')) {
        rezOrderId = receipt.slice('order_'.length);
      }
    } catch (fetchErr) {
      logger.warn('[RAZORPAY CONTROLLER] Could not fetch Razorpay order to extract receipt:', fetchErr);
    }

    if (rezOrderId) {
      try {
        await Order.findOneAndUpdate(
          { _id: rezOrderId, user: _userId },
          {
            $set: {
              'payment.status': 'paid',
              'payment.razorpayPaymentId': razorpayPaymentId,
              'payment.razorpayOrderId': razorpayOrderId,
              'payment.paidAt': new Date(),
              'payment.method': paymentDetails.method,
            },
          },
        );
        logger.info('[RAZORPAY CONTROLLER] Order marked as paid', { rezOrderId, razorpayPaymentId });

        // Notify Rendez of the completed payment (fire-and-forget)
        dispatchPaymentCompleted({
          orderId: rezOrderId,
          rezUserId: _userId,
          amountPaise: Number(paymentDetails.amount),
          paymentId: razorpayPaymentId,
          paidAt: new Date(),
        });
      } catch (updateErr) {
        // Non-fatal — payment is captured; ops can reconcile via webhook
        logger.error('[RAZORPAY CONTROLLER] Failed to update order payment status:', updateErr);
      }
    } else {
      logger.warn(
        '[RAZORPAY CONTROLLER] Could not determine REZ order ID from Razorpay receipt — order payment status NOT updated',
        { razorpayOrderId },
      );
    }

    sendSuccess(
      res,
      {
        verified: true,
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        rezOrderId,
        paymentMethod: paymentDetails.method,
        amount: amountInRupees,
        status: paymentDetails.status,
        transactionId: razorpayPaymentId,
      },
      'Payment verified successfully',
    );
  } catch (error: any) {
    logger.error('❌ [RAZORPAY CONTROLLER] Payment verification error:', error);
    sendError(res, 'Internal server error', 500);
  }
});

/**
 * @desc Get Razorpay configuration for frontend
 * @route GET /api/razorpay/config
 * @access Private
 */
export const getRazorpayConfig = asyncHandler(async (req: Request, res: Response) => {
  try {
    const config = razorpayService.getConfigForFrontend();

    sendSuccess(res, config, 'Razorpay configuration retrieved successfully');
  } catch (error: any) {
    logger.error('❌ [RAZORPAY CONTROLLER] Config retrieval error:', error);
    sendError(res, 'Internal server error', 500);
  }
});

/**
 * @desc Handle Razorpay webhook events
 * @route POST /api/razorpay/webhook
 * @access Public (but verified with signature)
 */
export const handleRazorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const webhookSignature = req.headers['x-razorpay-signature'] as string;
  // WS-008 FIX: Use the raw request body bytes (captured by the route middleware via
  // express.json verify callback) for HMAC verification.  JSON.stringify(req.body)
  // does not reproduce the exact bytes Razorpay signed — key ordering and whitespace
  // may differ — causing legitimate webhooks to fail signature check.
  const webhookBody: string = (req as any).rawBody ?? JSON.stringify(req.body);

  if (!webhookSignature) {
    return sendBadRequest(res, 'Webhook signature missing');
  }

  try {
    // Verify webhook signature
    const isValid = razorpayService.validateWebhookSignature(webhookBody, webhookSignature);

    if (!isValid) {
      logger.error('❌ [RAZORPAY WEBHOOK] Signature verification failed');
      return sendError(res, 'Invalid webhook signature', 401);
    }

    const event = req.body;
    logger.info('📥 [RAZORPAY WEBHOOK] Event received:', {
      event: event.event,
      paymentId: event.payload?.payment?.entity?.id,
    });

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured': {
        // Payment successful
        const paymentEntity = event.payload.payment.entity;
        const paymentId = paymentEntity.id;
        logger.info('✅ [RAZORPAY WEBHOOK] Payment captured:', paymentId);

        // WS-003 FIX: Replace two-step read-then-write (TOCTOU race) with a single
        // atomic findOneAndUpdate using a status guard.  Under concurrent Razorpay
        // retries, the old code could read 'placed' twice and both updates would go
        // through, potentially triggering duplicate downstream processing.
        // The $ne guard ensures only one update wins; the other gets null back.
        const razorpayOrderId = paymentEntity.order_id;
        const order = await Order.findOneAndUpdate(
          {
            $or: [{ 'paymentGateway.gatewayOrderId': razorpayOrderId }, { 'payment.transactionId': razorpayOrderId }],
            'payment.status': { $ne: 'paid' },
          },
          {
            $set: {
              'payment.status': 'paid',
              'payment.transactionId': paymentEntity.id,
              'payment.paidAt': new Date(),
              'totals.paidAmount': paymentEntity.amount / 100,
              'paymentGateway.gatewayPaymentId': paymentEntity.id,
              'paymentGateway.amountPaid': paymentEntity.amount / 100,
              'paymentGateway.paidAt': new Date(),
              'paymentGateway.gateway': 'razorpay',
            },
            $push: {
              timeline: {
                status: 'confirmed',
                message: 'Payment received and order confirmed',
                timestamp: new Date(),
              },
            },
          },
          { new: true },
        );

        if (order) {
          logger.info('✅ [RAZORPAY WEBHOOK] Order updated:', order.orderNumber);

          // Credit coins and notify merchant — wrapped in try/catch so failures
          // do NOT break the webhook 200 response or prevent Razorpay from acknowledging.
          try {
            const userId = String((order as any).user || '');
            const amountPaid = paymentEntity.amount / 100;

            // Publish payment.captured event to the durable payment queue so
            // post-payment workers (coin credit, cashback, reconciliation) run async.
            publishPaymentEvent({
              eventId: `razorpay-controller:captured:${paymentId}`,
              eventType: 'payment.captured',
              userId,
              orderId: String((order as any)._id),
              payload: {
                paymentId,
                razorpayOrderId,
                razorpayPaymentId: paymentId,
                amount: amountPaid,
                currency: paymentEntity.currency || 'INR',
                method: paymentEntity.method,
                status: 'captured',
                cashbackAmount: (order as any).totals?.cashback || 0,
              },
              createdAt: new Date().toISOString(),
            }).catch((qErr: any) => {
              logger.warn('[RAZORPAY WEBHOOK] Payment queue publish failed (non-fatal):', qErr?.message);
            });

            // Notify merchant via push (fire-and-forget)
            if (userId) {
              pushNotificationService
                .sendPushToUser(userId, {
                  title: 'Payment Confirmed',
                  body: `Your payment of ₹${amountPaid} was received. Order #${order.orderNumber} is confirmed.`,
                  data: { screen: 'orders', orderId: String((order as any)._id) },
                })
                .catch(() => {});
            }
          } catch (sideEffectErr: any) {
            logger.error('[RAZORPAY WEBHOOK] Post-payment side effects failed (non-fatal):', sideEffectErr?.message);
          }
        } else {
          // Either the order was already paid (idempotent) or not found
          const existing = await Order.findOne({
            $or: [{ 'paymentGateway.gatewayOrderId': razorpayOrderId }, { 'payment.transactionId': razorpayOrderId }],
          });
          if (existing?.payment?.status === 'paid') {
            logger.info('✅ [RAZORPAY WEBHOOK] Payment already processed (idempotent):', paymentId);
          } else {
            logger.warn('⚠️ [RAZORPAY WEBHOOK] Order not found for Razorpay order:', razorpayOrderId);
          }
        }

        // R1-FIX: Also handle Scan & Pay (StorePayment) payments.
        // Look up by razorpayOrderId so the Payment Kiosk gets real-time events.
        try {
          const { StorePayment } = await import('../models/StorePayment');
          const { Store } = await import('../models/Store');
          const storePayment = await StorePayment.findOne({ razorpayOrderId }).lean();
          if (storePayment) {
            await StorePayment.updateOne(
              { _id: storePayment._id },
              { $set: { status: 'completed', completedAt: new Date(), transactionId: paymentId } },
            );
            const store = await Store.findById(storePayment.storeId).select('slug merchant').lean();
            const storeSlug = (store as any)?.slug || String(storePayment.storeId);
            const io = (global as any).io;
            if (io) {
              io.to(`store-${storeSlug}`).emit('payment:received', {
                id: paymentId,
                amount: paymentEntity.amount / 100,
                customerName: (paymentEntity.notes as any)?.customerName || null,
                customerPhone: null,
                razorpayPaymentId: paymentId,
                storeSlug,
                createdAt: new Date().toISOString(),
              });
              logger.info('[PAYMENT KIOSK] payment:received emitted for StorePayment', { storeSlug, paymentId });
            }
          }
        } catch (storePaymentErr: any) {
          logger.error('[RAZORPAY WEBHOOK] StorePayment emit failed (non-fatal):', storePaymentErr?.message);
        }

        break;
      }

      case 'payment.failed': {
        // Payment failed
        const failedPayment = event.payload.payment.entity;
        logger.info('❌ [RAZORPAY WEBHOOK] Payment failed:', failedPayment.id);

        const razorpayOrderId = failedPayment.order_id;
        // CAS guard: only fetch/update if order is not already 'paid'.
        // Without this, a late payment.failed webhook can overwrite a successful
        // payment.captured that arrived first, permanently losing the order.
        const order = await Order.findOne({
          $or: [{ 'paymentGateway.gatewayOrderId': razorpayOrderId }, { 'payment.transactionId': razorpayOrderId }],
          'payment.status': { $nin: ['paid'] },
        });

        if (order) {
          assertPaymentTransition(order.payment.status, 'failed'); // F001-C9 FIX: hard throw on invalid transition

          // Atomic CAS update — only applies if status has not been set to 'paid'
          // between the findOne above and now (prevents TOCTOU on concurrent webhooks).
          const updated = await Order.findOneAndUpdate(
            { _id: order._id, 'payment.status': { $nin: ['paid'] } },
            {
              $set: {
                'payment.status': 'failed',
                'payment.failureReason': failedPayment.error_description || 'Payment failed',
              },
              $push: {
                timeline: {
                  status: 'payment_failed',
                  message: `Payment failed: ${failedPayment.error_description || 'Unknown error'}`,
                  timestamp: new Date(),
                },
              },
            },
            { new: true },
          );

          if (updated) {
            logger.info('✅ [RAZORPAY WEBHOOK] Order marked as payment failed:', updated.orderNumber);
          } else {
            logger.info(
              '✅ [RAZORPAY WEBHOOK] payment.failed skipped — order already paid (idempotent):',
              razorpayOrderId,
            );
          }
        }
        break;
      }

      case 'refund.created': {
        // Refund created
        const refundEntity = event.payload.refund.entity;
        logger.info('💰 [RAZORPAY WEBHOOK] Refund created:', refundEntity.id);

        const paymentId = refundEntity.payment_id;
        // WS-002 FIX: .lean() returns a plain JS object — calling .save() on it throws
        // "order.save is not a function" silently swallowed by the outer catch, so the
        // refund is never persisted to the database.  Remove .lean() so Mongoose tracks
        // the document and .save() works correctly.
        const order = await Order.findOne({
          $or: [{ 'paymentGateway.gatewayPaymentId': paymentId }, { 'payment.transactionId': paymentId }],
        });

        if (order) {
          const refundAmount = refundEntity.amount / 100;
          assertPaymentTransition(order.payment.status, 'refunded'); // F001-C9 FIX: hard throw on invalid transition
          order.payment.status = 'refunded';
          order.payment.refundId = refundEntity.id;
          order.payment.refundedAt = new Date();
          order.totals.refundAmount = (order.totals.refundAmount || 0) + refundAmount;

          if (order.paymentGateway) {
            order.paymentGateway.refundId = refundEntity.id;
            order.paymentGateway.refundedAt = new Date();
            order.paymentGateway.refundAmount = refundAmount;
          }

          order.timeline.push({
            status: 'refunded',
            message: `Refund of ₹${refundAmount} processed`,
            timestamp: new Date(),
          });

          await order.save();
          logger.info('✅ [RAZORPAY WEBHOOK] Order refund recorded:', order.orderNumber);
        }
        break;
      }

      default:
        logger.info('ℹ️ [RAZORPAY WEBHOOK] Unhandled event:', event.event);
    }

    // Always return 200 to acknowledge webhook receipt
    res.status(200).json({ received: true });
  } catch (error: any) {
    logger.error('❌ [RAZORPAY WEBHOOK] Processing error:', error);
    // Return 5xx so Razorpay will retry the webhook
    return res.status(500).json({ received: false });
  }
});

/**
 * @desc Create a refund for a Razorpay payment
 * @route POST /api/razorpay/refund
 * @access Private (Admin only ideally)
 */
export const createRazorpayRefund = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { paymentId, amount, notes } = req.body;

  if (!paymentId) {
    return sendBadRequest(res, 'Payment ID is required');
  }

  // MED-4: Validate amount is a positive finite number
  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return sendBadRequest(res, 'Refund amount must be a positive number');
    }
  }

  // MED-4: Verify the payment belongs to an order owned by the requesting user
  // (or this endpoint must only be accessible to admins — callers must enforce that)
  try {
    const orderForPayment = await Order.findOne({
      $or: [{ 'paymentGateway.gatewayPaymentId': paymentId }, { 'payment.transactionId': paymentId }],
    }).lean();

    if (orderForPayment) {
      // If we found the order, ensure it belongs to the user (or caller is an admin)
      const isOwner = String((orderForPayment as any).user) === String(userId);
      const isAdmin = ['admin', 'super_admin', 'operator'].includes((req as any).user?.role || '');
      if (!isOwner && !isAdmin) {
        return sendError(res, 'You do not have permission to refund this payment', 403);
      }

      // Guard: refund amount must not exceed the original payment amount
      if (amount !== undefined) {
        const originalAmount =
          (orderForPayment as any).totals?.finalAmount ?? (orderForPayment as any).totalAmount ?? 0;
        const alreadyRefunded = (orderForPayment as any).totals?.refundAmount ?? 0;
        const refundable = originalAmount - alreadyRefunded;
        if (Number(amount) > refundable + 0.01) {
          return sendBadRequest(
            res,
            `Refund amount ₹${amount} exceeds the refundable balance ₹${refundable.toFixed(2)}`,
          );
        }
      }
    }
  } catch (lookupErr) {
    logger.warn('⚠️ [RAZORPAY CONTROLLER] Payment ownership lookup failed (proceeding):', lookupErr);
  }

  try {
    const refund = await razorpayService.createRefund(paymentId, amount, notes);

    logger.info('✅ [RAZORPAY CONTROLLER] Refund created:', refund.id);

    const refundAmountInRupees = refund.amount ? Number(refund.amount) / 100 : 0;

    sendSuccess(
      res,
      {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refundAmountInRupees,
        status: refund.status,
      },
      'Refund created successfully',
    );
  } catch (error: any) {
    logger.error('❌ [RAZORPAY CONTROLLER] Refund creation error:', error);
    sendError(res, 'Internal server error', 500);
  }
});
