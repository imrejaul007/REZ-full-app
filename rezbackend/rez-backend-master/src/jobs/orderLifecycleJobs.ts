/**
 * Order Lifecycle Background Jobs
 *
 * 1. Stuck Order Detection — every 10 minutes
 * 2. Payment Verification Recovery — every 15 minutes
 * 3. Return Window Logging — daily at midnight
 */

// DB-AUDIT-3 FIX: Import scheduleCronJob from cronJobs so all tasks are registered
// in the activeCronJobs registry and stopped cleanly on SIGTERM/SIGINT.
// Previously all 5 jobs here used raw cron.schedule() which bypassed the shutdown
// registry, keeping the process alive after graceful shutdown signals.
import { scheduleCronJob } from '../config/cronJobs';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import orderSocketService, { OrderSocketEvent } from '../services/orderSocketService';
import paymentService from '../services/PaymentService';
import { IRazorpayPaymentVerification } from '../types/payment';
import { runOrderAlertChecks } from '../utils/orderAlerts';
import redisService from '../services/redisService';
import { logger } from '../config/logger';
// HIGH 4 FIX: All order cancellations now go through the canonical cancelOrderCore
// function which guarantees: status change → stock restore → refund → cashback
// reversal → notification. Previously this job used a bare findByIdAndUpdate that
// skipped all of those post-cancel steps.
import { cancelOrderCore } from '../services/cancelOrderService';

// Note: raw 'cron' import removed — all scheduling now goes through scheduleCronJob()

/**
 * Stuck Order Detection
 *
 * - placed + unpaid online orders > 1 hour → auto-cancel, restore stock
 * - confirmed/preparing > 2 hours → admin alert
 * - dispatched > 3 hours → merchant + admin alert
 */
async function runStuckOrderDetection(): Promise<void> {
  const lockKey = 'job:order-lifecycle';
  const lockToken = await redisService.acquireLock(lockKey, 300);
  if (!lockToken) {
    logger.info('order-lifecycle skipped — lock held by another instance');
    return;
  }

  const now = new Date();

  try {
    // 1. Auto-cancel unpaid online orders stuck in 'placed' for > 1 hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    // LF-001 FIX (companion): query includes 'processing' so orders created after
    // the payment-status enum fix are also caught for auto-cancellation.
    const unpaidOrders = await Order.find({
      status: 'placed',
      'payment.status': { $in: ['pending', 'processing'] },
      'payment.method': { $ne: 'cod' },
      createdAt: { $lt: oneHourAgo },
    })
      .select('_id orderNumber items user')
      .lean();

    for (const order of unpaidOrders) {
      try {
        // NOTE: Do NOT restore stock for unpaid online orders.
        // Stock is only deducted AFTER payment confirmation (in paymentService.handlePaymentSuccess).
        // Since these orders were never paid, stock was never deducted. Restoring would inflate inventory.

        // Cancel the order
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            status: 'cancelled',
            cancelReason: 'Auto-cancelled: payment not received within 1 hour',
            cancelledAt: now,
            'delivery.status': 'failed',
          },
          $push: {
            timeline: {
              status: 'cancelled',
              message: 'Order auto-cancelled due to unpaid payment after 1 hour',
              timestamp: now,
              updatedBy: 'system',
            },
          },
        });

        logger.info(`[ORDER LIFECYCLE] Auto-cancelled unpaid order: ${order.orderNumber}`);
      } catch (err) {
        logger.error(`[ORDER LIFECYCLE] Failed to auto-cancel order ${order.orderNumber}:`, err);
      }
    }

    if (unpaidOrders.length > 0) {
      logger.info(`[ORDER LIFECYCLE] Auto-cancelled ${unpaidOrders.length} unpaid orders`);
    }

    // 2. Alert for orders stuck in confirmed/preparing for > 2 hours
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const stuckPrepOrders = await Order.find({
      status: { $in: ['confirmed', 'preparing'] },
      updatedAt: { $lt: twoHoursAgo },
    })
      .select('_id orderNumber status store items.store')
      .populate('store', 'merchantId')
      .lean();

    if (stuckPrepOrders.length > 0) {
      orderSocketService.emitToAdmin(OrderSocketEvent.ORDER_STUCK_ALERT, {
        type: 'preparation_stuck',
        count: stuckPrepOrders.length,
        orders: stuckPrepOrders.map((o) => ({
          orderId: String(o._id),
          orderNumber: o.orderNumber,
          status: o.status,
        })),
        threshold: '2 hours',
        timestamp: now,
      });

      // Notify each affected merchant so they can proactively resolve stuck orders
      for (const order of stuckPrepOrders) {
        const merchantId = (order.store as any)?.merchantId;
        if (merchantId) {
          orderSocketService.emitToMerchant(String(merchantId), OrderSocketEvent.ORDER_STUCK_ALERT, {
            type: 'preparation_stuck',
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            status: order.status,
            message: 'Order has been in preparation for over 2 hours',
            timestamp: now,
          });
        }
      }

      logger.info(`[ORDER LIFECYCLE] Alert: ${stuckPrepOrders.length} orders stuck in preparation`);
    }

    // 3. Alert for orders stuck in dispatched for > 3 hours
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const stuckDispatchOrders = await Order.find({
      status: { $in: ['dispatched', 'out_for_delivery'] },
      updatedAt: { $lt: threeHoursAgo },
    })
      .select('_id orderNumber status store items.store')
      .populate('store', 'merchantId')
      .lean();

    if (stuckDispatchOrders.length > 0) {
      // Notify admin
      orderSocketService.emitToAdmin(OrderSocketEvent.ORDER_STUCK_ALERT, {
        type: 'delivery_stuck',
        count: stuckDispatchOrders.length,
        orders: stuckDispatchOrders.map((o) => ({
          orderId: String(o._id),
          orderNumber: o.orderNumber,
          status: o.status,
        })),
        threshold: '3 hours',
        timestamp: now,
      });

      // Notify each merchant (use merchantId from populated store, not raw storeId)
      for (const order of stuckDispatchOrders) {
        const merchantId = (order.store as any)?.merchantId;
        if (merchantId) {
          orderSocketService.emitToMerchant(String(merchantId), OrderSocketEvent.ORDER_STUCK_ALERT, {
            type: 'delivery_stuck',
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            status: order.status,
            message: 'Order has been in transit for over 3 hours',
            timestamp: now,
          });
        }
      }

      logger.info(`[ORDER LIFECYCLE] Alert: ${stuckDispatchOrders.length} orders stuck in delivery`);
    }
  } catch (error) {
    logger.error('[ORDER LIFECYCLE] Stuck order detection failed:', error);
  } finally {
    await redisService.releaseLock(lockKey, lockToken);
  }
}

/**
 * Payment Verification Recovery
 *
 * Finds orders with pending payment + gateway order ID but >30 min old,
 * checks with Razorpay for actual payment status, and recovers if paid.
 */
async function runPaymentVerificationRecovery(): Promise<void> {
  // LF-002 FIX: runPaymentVerificationRecovery, runStuckOrderDetection, and
  // runReturnWindowCheck all used the SAME Redis lock key ('job:order-lifecycle').
  // When the stuck-order job runs and holds the lock for its 5-minute TTL, the
  // payment-recovery job is silently skipped — leaving paid orders stuck in
  // 'payment.status: processing' with no recovery for up to 5 minutes. Worse,
  // if the three jobs overlap in a cron window all three contend on the same key.
  // Each job gets its own unique lock key so they run independently.
  const lockKey = 'job:payment-verification-recovery';
  const lockToken = await redisService.acquireLock(lockKey, 300);
  if (!lockToken) {
    logger.info('order-lifecycle skipped — lock held by another instance');
    return;
  }

  const now = new Date();

  try {
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // LF-001 FIX (companion): after the orderCreateController fix, online orders
    // are created with payment.status='processing' instead of 'awaiting_payment'.
    // Query must match 'processing' so recovery can find them.
    const pendingPaymentOrders = await Order.find({
      status: 'placed',
      'payment.status': { $in: ['pending', 'processing'] },
      'payment.method': { $ne: 'cod' },
      createdAt: { $lt: thirtyMinAgo, $gt: twoHoursAgo },
    })
      .select('_id orderNumber paymentGateway totals user')
      .lean();

    let recovered = 0;
    let autoCancelled = 0;

    for (const order of pendingPaymentOrders) {
      try {
        const gatewayOrderId = order.paymentGateway?.gatewayOrderId;
        if (!gatewayOrderId) continue;

        // WS-D005 FIX: The old code called razorpay.orders.fetch(gatewayOrderId) and
        // checked rzpOrder.status === 'paid'.  This is wrong for two reasons:
        //
        //   1. In MANUAL CAPTURE flows the Razorpay *order* status stays 'created'
        //      even after payment.authorized fires, so the job silently skips recovery.
        //
        //   2. The Razorpay order object does not tell us WHICH payment was captured,
        //      what amount was captured, or the payment ID needed to call
        //      handlePaymentSuccess (which deducts stock, awards coins, credits the
        //      merchant wallet). The old code only set payment.status='paid' without
        //      completing the full post-payment flow, leaving a half-recovered order.
        //
        // FIX: Use razorpay.orders.fetchPayments(gatewayOrderId) to get the list of
        // actual payment objects against this order.  Find the one with status='captured'.
        // Then call paymentService.handlePaymentSuccess with the captured payment details
        // so the FULL post-payment pipeline runs (stock deduction, coin award, merchant
        // wallet credit, socket notification) — identical to what a live webhook would do.
        try {
          if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            logger.warn('[ORDER LIFECYCLE] Razorpay keys not configured — skipping payment recovery for order', {
              orderId: String(order._id),
            });
            continue;
          }
          const Razorpay = require('razorpay');
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });

          // Fetch all payments against the Razorpay order
          const paymentsResponse = await razorpay.orders.fetchPayments(gatewayOrderId);
          const payments: any[] = paymentsResponse?.items ?? [];

          // Find the captured payment (there should be at most one)
          const capturedPayment = payments.find((p: any) => p.status === 'captured');

          if (capturedPayment) {
            logger.info(
              `[ORDER LIFECYCLE] Found captured payment ${capturedPayment.id} for order ${order.orderNumber} — running full recovery`,
            );

            // Validate amount before recovery: captured amount (paise) vs order total
            const capturedPaise = capturedPayment.amount;
            const orderTotalPaise = Math.round((order.totals?.total ?? 0) * 100);

            if (capturedPaise !== orderTotalPaise) {
              logger.error(
                `[ORDER LIFECYCLE] Amount mismatch during recovery — captured ${capturedPaise}p, order total ${orderTotalPaise}p — flagging for manual review`,
                {
                  orderId: String(order._id),
                  orderNumber: order.orderNumber,
                  capturedPaise,
                  orderTotalPaise,
                },
              );
              // Flag but do not recover — amount mismatch requires human review
              await Order.findByIdAndUpdate(order._id, {
                $push: {
                  flags: 'recovery_amount_mismatch',
                  timeline: {
                    status: order.status,
                    message: `Recovery skipped: captured ${capturedPaise}p but order total is ${orderTotalPaise}p`,
                    timestamp: now,
                    updatedBy: 'system',
                  },
                },
              });
              continue;
            }

            // Run the FULL post-payment pipeline via paymentService.handlePaymentSuccess.
            // This deducts stock, awards coins, credits the merchant wallet, and sends
            // socket notifications — identical to what handleRazorpayPaymentCaptured does
            // when a live webhook arrives. Without this the order is only half-recovered.
            try {
              await paymentService.handlePaymentSuccess(String(order._id), {
                razorpay_payment_id: capturedPayment.id,
                razorpay_order_id: gatewayOrderId,
                razorpay_signature: capturedPayment.id, // not needed post-capture; use payment ID as placeholder
              } satisfies IRazorpayPaymentVerification);
              recovered++;
              logger.info(
                `[ORDER LIFECYCLE] Full payment recovery completed for order: ${order.orderNumber} (payment: ${capturedPayment.id})`,
              );
            } catch (recoveryErr: any) {
              // handlePaymentSuccess returns early (idempotent) if already paid — log others
              if (
                recoveryErr?.message?.includes('already processed') ||
                recoveryErr?.message?.includes('already paid')
              ) {
                logger.info(`[ORDER LIFECYCLE] Order ${order.orderNumber} already paid — recovery idempotent`);
              } else {
                logger.error(`[ORDER LIFECYCLE] Full recovery failed for ${order.orderNumber}:`, recoveryErr);
              }
            }
          } else {
            // No captured payment found — check if there is an authorized payment
            // (manual capture pending). Log for observability but take no action.
            const authorizedPayment = payments.find((p: any) => p.status === 'authorized');
            if (authorizedPayment) {
              logger.info(
                `[ORDER LIFECYCLE] Order ${order.orderNumber} has authorized-but-not-captured payment ${authorizedPayment.id} — awaiting capture`,
              );
            } else {
              logger.info(
                `[ORDER LIFECYCLE] No captured or authorized payment found for order ${order.orderNumber} — gateway order ${gatewayOrderId}`,
              );
            }
          }
        } catch (gatewayErr: any) {
          // Gateway API call failed — log and continue; will retry next cycle
          logger.error(
            `[ORDER LIFECYCLE] Razorpay API call failed for order ${order.orderNumber}:`,
            gatewayErr?.message,
          );
        }
      } catch (err) {
        logger.error(`[ORDER LIFECYCLE] Payment recovery failed for ${order.orderNumber}:`, err);
      }
    }

    // Auto-cancel orders pending payment for > 2 hours.
    // WS-D006 FIX: Before cancelling, do a final Razorpay payment check.
    // Without this check, an order whose payment was captured but whose webhook
    // was lost AND whose recovery-loop Razorpay API call failed (gateway timeout)
    // could age past 2 hours and get incorrectly cancelled — even though the customer
    // was charged. The safe approach is: try the API one more time; only if the API
    // confirms no captured payment (or the API is unreachable) do we cancel.
    // LF-001 FIX (companion): include 'processing' for orders created after the enum fix.
    const expiredPaymentOrders = await Order.find({
      status: 'placed',
      'payment.status': { $in: ['pending', 'processing'] },
      'payment.method': { $ne: 'cod' },
      createdAt: { $lt: twoHoursAgo },
    })
      .select('_id orderNumber items paymentGateway totals')
      .lean();

    // Separate orders into those we can verify with Razorpay vs those we cannot
    const confirmedUnpaidOrders: typeof expiredPaymentOrders = [];
    const skippedDueToApiError: string[] = [];

    for (const order of expiredPaymentOrders) {
      const gatewayOrderId = order.paymentGateway?.gatewayOrderId;
      if (!gatewayOrderId) {
        // No gateway order ID stored — this order was never submitted to Razorpay; safe to cancel
        confirmedUnpaidOrders.push(order);
        continue;
      }

      try {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
          logger.warn(
            '[ORDER LIFECYCLE] Razorpay keys not configured — cannot verify payment status, skipping auto-cancel for order',
            { orderId: String(order._id) },
          );
          skippedDueToApiError.push(String(order._id));
          continue;
        }
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const paymentsResponse = await razorpay.orders.fetchPayments(gatewayOrderId);
        const payments: any[] = paymentsResponse?.items ?? [];
        const capturedPayment = payments.find((p: any) => p.status === 'captured');

        if (capturedPayment) {
          // Payment was captured — recover instead of cancel
          logger.warn(
            `[ORDER LIFECYCLE] Auto-cancel BLOCKED for order ${order.orderNumber}: Razorpay shows captured payment ${capturedPayment.id} — recovering instead`,
          );
          try {
            await paymentService.handlePaymentSuccess(String(order._id), {
              razorpay_payment_id: capturedPayment.id,
              razorpay_order_id: gatewayOrderId,
              razorpay_signature: capturedPayment.id,
            } satisfies IRazorpayPaymentVerification);
            recovered++;
            logger.info(`[ORDER LIFECYCLE] Late recovery completed for order: ${order.orderNumber}`);
          } catch (lateRecoveryErr: any) {
            if (
              lateRecoveryErr?.message?.includes('already processed') ||
              lateRecoveryErr?.message?.includes('already paid')
            ) {
              logger.info(`[ORDER LIFECYCLE] Order ${order.orderNumber} already paid — late recovery idempotent`);
            } else {
              logger.error(`[ORDER LIFECYCLE] Late recovery failed for ${order.orderNumber}:`, lateRecoveryErr);
            }
          }
        } else {
          // No captured payment — safe to auto-cancel
          confirmedUnpaidOrders.push(order);
        }
      } catch (gatewayCheckErr: any) {
        // Razorpay API unreachable — do NOT cancel; defer to next job run
        logger.error(
          `[ORDER LIFECYCLE] Auto-cancel deferred for ${order.orderNumber}: Razorpay API error — will retry next cycle`,
          gatewayCheckErr?.message,
        );
        skippedDueToApiError.push(order.orderNumber);
      }
    }

    if (skippedDueToApiError.length > 0) {
      logger.warn(
        `[ORDER LIFECYCLE] ${skippedDueToApiError.length} orders deferred from auto-cancel due to Razorpay API errors: ${skippedDueToApiError.join(', ')}`,
      );
    }

    // Batch restore stock: collect all product increments across confirmed-unpaid orders only
    const stockIncrements = new Map<string, number>();
    for (const order of confirmedUnpaidOrders) {
      for (const item of order.items || []) {
        const pid = item.product.toString();
        stockIncrements.set(pid, (stockIncrements.get(pid) || 0) + item.quantity);
      }
    }

    // BUG-48 FIX: For unpaid/expired orders we must release the reservedStock that was
    // held at order placement, NOT increment the available stock field.  Incrementing
    // 'inventory.stock' double-counts those units because they were never physically
    // removed from stock — they were only reserved.  Using a negative $inc on
    // 'inventory.reservedStock' correctly unwinds the reservation.
    if (stockIncrements.size > 0) {
      const bulkOps = Array.from(stockIncrements.entries()).map(([productId, qty]) => ({
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { 'inventory.reservedStock': -qty } },
        },
      }));
      try {
        await Product.bulkWrite(bulkOps, { ordered: false });
      } catch (err) {
        logger.error('[ORDER LIFECYCLE] Bulk reserved-stock release failed:', err);
      }
    }

    // HIGH 4 FIX: Use canonical cancelOrderCore so that stock restore, refunds, and
    // cashback reversal happen consistently — previously this was a bare findByIdAndUpdate
    // that only updated the status field and skipped all post-cancel side-effects.
    // skipRefund=true because these orders never had a successful payment captured;
    // there is no money to return to the user's wallet.
    for (const order of confirmedUnpaidOrders) {
      try {
        await cancelOrderCore({
          orderId: order._id.toString(),
          reason: 'Auto-cancelled: payment not received within 2 hours',
          cancelledBy: 'system',
          skipRefund: true, // Payment was never captured — no wallet refund needed
        });
        autoCancelled++;
      } catch (err) {
        logger.error(`[ORDER LIFECYCLE] Auto-cancel failed for ${order.orderNumber}:`, err);
      }
    }

    if (recovered > 0 || autoCancelled > 0) {
      logger.info(`[ORDER LIFECYCLE] Payment recovery: ${recovered} recovered, ${autoCancelled} auto-cancelled`);
    }
  } catch (error) {
    logger.error('[ORDER LIFECYCLE] Payment verification recovery failed:', error);
  } finally {
    await redisService.releaseLock(lockKey, lockToken);
  }
}

/**
 * Return Window Expiry Logging
 *
 * Logs metrics for delivered orders past the return window.
 * No action needed since the model method already checks timestamp.
 */
async function runReturnWindowCheck(): Promise<void> {
  // LF-002 FIX (companion): unique lock key so this job doesn't collide with
  // runStuckOrderDetection or runPaymentVerificationRecovery.
  const lockKey = 'job:return-window-check';
  const lockToken = await redisService.acquireLock(lockKey, 300);
  if (!lockToken) {
    logger.info('order-lifecycle skipped — lock held by another instance');
    return;
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const expiredReturnOrders = await Order.countDocuments({
      status: 'delivered',
      'delivery.deliveredAt': {
        $gte: fortyEightHoursAgo,
        $lt: twentyFourHoursAgo,
      },
    });

    if (expiredReturnOrders > 0) {
      logger.info(`[ORDER LIFECYCLE] ${expiredReturnOrders} orders passed the 24h return window`);
    }
  } catch (error) {
    logger.error('[ORDER LIFECYCLE] Return window check failed:', error);
  } finally {
    await redisService.releaseLock(lockKey, lockToken);
  }
}

/**
 * Stale Processing Order Sweeper
 *
 * Finds orders stuck in status='placed' with payment.status='processing' for
 * more than 30 minutes (i.e. the payment gateway never confirmed or denied them)
 * and releases their reservedStock, then marks them cancelled/expired.
 *
 * This prevents reserved stock from leaking when a gateway session dies mid-flight
 * without triggering a webhook or client-side callback.
 */
async function runStaleProcessingOrderSweeper(): Promise<void> {
  const lockKey = 'job:stale-processing-sweeper';
  const lockToken = await redisService.acquireLock(lockKey, 300);
  if (!lockToken) {
    logger.info('[SWEEPER] stale-processing-sweeper skipped — lock held by another instance');
    return;
  }

  try {
    const staleOrders = await Order.find({
      status: 'placed',
      'payment.status': 'processing',
      createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) },
    }).lean();

    if (staleOrders.length === 0) return;

    logger.info(`[SWEEPER] Found ${staleOrders.length} stale processing orders to sweep`);

    for (const order of staleOrders) {
      try {
        // ISSUE-37 FIX: Before cancelling, check with Razorpay whether a payment was
        // actually captured. A gateway session can die mid-flight after the customer
        // pays but before the webhook arrives; cancelling here would lose the payment.
        // If Razorpay confirms a captured payment, trigger fulfillment instead.
        // If the Razorpay API is unreachable, skip this order and retry next cycle.
        // IOrder.payment has transactionId; gateway order ID is in paymentGateway.gatewayOrderId
        const razorpayOrderId = order.paymentGateway?.gatewayOrderId;
        if (razorpayOrderId) {
          try {
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
              logger.warn(
                '[SWEEPER] Razorpay keys not configured — cannot verify order status, skipping cancel for order',
                { orderId: String(order._id) },
              );
              continue;
            }
            const Razorpay = require('razorpay');
            const rz = new Razorpay({
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
            });
            const rzpOrder = await rz.orders.fetch(razorpayOrderId);
            if (rzpOrder?.status === 'paid') {
              // Don't cancel — payment was captured. Trigger full fulfillment pipeline.
              logger.warn(
                `[SWEEPER] Found paid but stuck order ${order.orderNumber} — triggering fulfillment instead of cancelling`,
                { orderId: String(order._id), razorpayOrderId },
              );
              // Fetch payments to find the captured one, then run handlePaymentSuccess
              try {
                const paymentsResponse = await rz.orders.fetchPayments(razorpayOrderId);
                const capturedPayment = (paymentsResponse?.items ?? []).find((p: any) => p.status === 'captured');
                if (capturedPayment) {
                  await paymentService.handlePaymentSuccess(String(order._id), {
                    razorpay_payment_id: capturedPayment.id,
                    razorpay_order_id: razorpayOrderId,
                    razorpay_signature: capturedPayment.id,
                  } satisfies IRazorpayPaymentVerification);
                  logger.info(`[SWEEPER] Fulfillment triggered for paid stuck order: ${order.orderNumber}`);
                }
              } catch (fulfillErr) {
                logger.error(`[SWEEPER] Fulfillment trigger failed for ${order.orderNumber}:`, fulfillErr);
              }
              continue; // Skip cancellation for this order
            }
          } catch (rzErr: any) {
            // Razorpay API unreachable — do NOT cancel; defer to next cycle
            logger.error(
              `[SWEEPER] Razorpay check failed for order ${order.orderNumber} — deferring cancellation`,
              rzErr?.message,
            );
            continue; // Skip this order and retry next cycle
          }
        }

        // Release any reserved stock held against this order
        for (const item of order.items) {
          if (!item.product) continue;
          await Product.findByIdAndUpdate(item.product, {
            $inc: { 'inventory.reservedStock': -(item.quantity || 1) },
          });
        }

        await Order.findByIdAndUpdate(order._id, {
          $set: {
            status: 'cancelled',
            'payment.status': 'expired',
            cancelReason: 'Payment timeout - auto-cancelled',
            cancelledAt: new Date(),
          },
          $push: {
            timeline: {
              status: 'cancelled',
              message: 'Order auto-cancelled: payment timed out after 30 minutes in processing state',
              timestamp: new Date(),
              updatedBy: 'system',
            },
          },
        });

        logger.info(`[SWEEPER] Released stock and cancelled stale order: ${order.orderNumber}`);
      } catch (err) {
        logger.error(`[SWEEPER] Failed to sweep stale order ${order._id}:`, err);
      }
    }
  } catch (error) {
    logger.error('[SWEEPER] Stale processing order sweeper failed:', error);
  } finally {
    await redisService.releaseLock(lockKey, lockToken);
  }
}

/**
 * Initialize all order lifecycle cron jobs
 * DB-AUDIT-3 FIX: All jobs now use scheduleCronJob() so they are registered in
 * activeCronJobs and properly stopped during graceful shutdown.
 */
export function initializeOrderLifecycleJobs(): void {
  // Stuck order detection — every 10 minutes
  scheduleCronJob(
    '*/10 * * * *',
    async () => {
      await runStuckOrderDetection().catch((err) =>
        logger.error('[ORDER LIFECYCLE] Stuck order detection unhandled error:', err),
      );
    },
    'Order stuck detection (every 10 min)',
  );
  logger.info('  Order stuck detection job started (runs every 10 min)');

  // Payment verification recovery — every 15 minutes
  scheduleCronJob(
    '*/15 * * * *',
    async () => {
      await runPaymentVerificationRecovery().catch((err) =>
        logger.error('[ORDER LIFECYCLE] Payment verification recovery unhandled error:', err),
      );
    },
    'Payment verification recovery (every 15 min)',
  );
  logger.info('  Payment verification recovery job started (runs every 15 min)');

  // Return window logging — daily at midnight
  scheduleCronJob(
    '0 0 * * *',
    async () => {
      await runReturnWindowCheck().catch((err) =>
        logger.error('[ORDER LIFECYCLE] Return window check unhandled error:', err),
      );
    },
    'Return window check (daily midnight)',
  );
  logger.info('  Return window check job started (runs daily at midnight)');

  // Order alert checks — every 30 minutes
  scheduleCronJob(
    '*/30 * * * *',
    async () => {
      await runOrderAlertChecks().catch((err) =>
        logger.error('[ORDER LIFECYCLE] Order alert checks unhandled error:', err),
      );
    },
    'Order alert checks (every 30 min)',
  );
  logger.info('  Order alert checks started (runs every 30 min)');

  // Stale processing order sweeper — every 15 minutes
  // Releases reservedStock and cancels orders stuck in payment.status='processing' >30 min
  scheduleCronJob(
    '*/15 * * * *',
    async () => {
      await runStaleProcessingOrderSweeper().catch((err) =>
        logger.error('[ORDER LIFECYCLE] Stale processing sweeper unhandled error:', err),
      );
    },
    'Stale processing order sweeper (every 15 min)',
  );
  logger.info('  Stale processing order sweeper started (runs every 15 min)');
}

// Export individual functions for testing
export { runStuckOrderDetection, runPaymentVerificationRecovery, runReturnWindowCheck };
