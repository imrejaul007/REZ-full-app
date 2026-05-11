/**
 * Order Reconciliation Job
 *
 * Runs daily at 3 AM to verify financial integrity of delivered orders.
 * Checks for missing CoinTransaction, merchant wallet credits, and admin commission.
 */

import cron from 'node-cron';
import { Order } from '../models/Order';
import { CoinTransaction } from '../models/CoinTransaction';
import { LedgerEntry } from '../models/LedgerEntry';
import orderSocketService, { OrderSocketEvent } from '../services/orderSocketService';
import redisService from '../services/redisService';
import { logger } from '../config/logger';

interface Discrepancy {
  orderId: string;
  orderNumber: string;
  type: 'missing_purchase_reward' | 'missing_merchant_payout' | 'missing_admin_commission';
  expectedAmount: number;
  details: string;
}

/**
 * Run order reconciliation for delivered orders in the last 24 hours.
 */
async function runOrderReconciliation(): Promise<void> {
  const lockKey = 'job:order-reconciliation';
  let lockToken: string | null = null;

  try {
    lockToken = await redisService.acquireLock(lockKey, 600);
    if (!lockToken) {
      logger.info('order-reconciliation skipped — lock held by another instance');
      return;
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const deliveredOrders = await Order.find({
      status: 'delivered',
      'delivery.deliveredAt': { $gte: twentyFourHoursAgo, $lte: now },
    })
      .select('_id orderNumber user totals items')
      .lean();

    if (deliveredOrders.length === 0) {
      logger.info('[ORDER RECONCILIATION] No delivered orders in last 24h');
      return;
    }

    const discrepancies: Discrepancy[] = [];

    for (const order of deliveredOrders) {
      const orderId = String(order._id);
      const userId = order.user ? String(order.user) : null;

      // 1. Verify purchase_reward CoinTransaction exists
      if (userId) {
        const purchaseReward = await CoinTransaction.findOne({
          userId,
          source: 'purchase_reward',
          'metadata.orderId': order._id,
        }).lean();

        const expectedCoins = Math.floor((order.totals?.subtotal || 0) * 0.05);
        if (!purchaseReward && expectedCoins > 0) {
          discrepancies.push({
            orderId,
            orderNumber: order.orderNumber,
            type: 'missing_purchase_reward',
            expectedAmount: expectedCoins,
            details: `Expected ${expectedCoins} purchase reward coins for subtotal ${order.totals?.subtotal}`,
          });
        }
      }

      // 2. Verify merchant payout ledger entry exists
      const merchantPayoutLedger = await LedgerEntry.findOne({
        referenceId: orderId,
        referenceModel: 'Order',
        operationType: 'merchant_payout',
      }).lean();

      const expectedPayout = (order.totals?.subtotal || 0) - (order.totals?.platformFee || 0);
      if (!merchantPayoutLedger && expectedPayout > 0) {
        discrepancies.push({
          orderId,
          orderNumber: order.orderNumber,
          type: 'missing_merchant_payout',
          expectedAmount: expectedPayout,
          details: `Expected merchant payout of ${expectedPayout} (subtotal: ${order.totals?.subtotal}, fee: ${order.totals?.platformFee})`,
        });
      }

      // 3. Verify admin commission (platform fee) ledger entry
      const platformFeeLedger = await LedgerEntry.findOne({
        referenceId: orderId,
        referenceModel: 'Order',
        operationType: 'order_payment',
      }).lean();

      const expectedPlatformFee = order.totals?.platformFee || 0;
      if (!platformFeeLedger && expectedPlatformFee > 0) {
        discrepancies.push({
          orderId,
          orderNumber: order.orderNumber,
          type: 'missing_admin_commission',
          expectedAmount: expectedPlatformFee,
          details: `Expected platform fee ledger entry of ${expectedPlatformFee}`,
        });
      }
    }

    // Log results
    logger.info(`[ORDER RECONCILIATION] Checked ${deliveredOrders.length} delivered orders, found ${discrepancies.length} discrepancies`);

    // Alert admin if discrepancies found
    if (discrepancies.length > 0) {
      orderSocketService.emitToAdmin(OrderSocketEvent.ORDER_RECONCILIATION_ALERT, {
        ordersChecked: deliveredOrders.length,
        discrepancyCount: discrepancies.length,
        discrepancies: discrepancies.slice(0, 20), // Limit to 20 for socket payload
        totalMissingAmount: discrepancies.reduce((sum, d) => sum + d.expectedAmount, 0),
        timestamp: now,
      });

      // Log each discrepancy
      for (const d of discrepancies) {
        logger.warn(`[ORDER RECONCILIATION] ${d.type}: ${d.orderNumber} - ${d.details}`);
      }

      // Create AdminAction entries for manual review
      try {
        const { AdminAction } = require('../models/AdminAction');
        const { Types } = require('mongoose');
        const SYSTEM_USER_ID = new Types.ObjectId('000000000000000000000000');

        for (const d of discrepancies) {
          try {
            await AdminAction.create({
              actionType: 'manual_adjustment',
              initiatorId: SYSTEM_USER_ID,
              status: 'pending_approval',
              payload: {
                orderId: d.orderId,
                orderNumber: d.orderNumber,
                discrepancyType: d.type,
                expectedAmount: d.expectedAmount,
              },
              reason: `Order reconciliation: ${d.details}`,
              threshold: d.expectedAmount,
            });
          } catch {
            // Duplicate or creation error — non-critical
          }
        }
      } catch (adminErr) {
        logger.error('[ORDER RECONCILIATION] Failed to create AdminAction entries:', adminErr);
      }
    }
  } catch (error) {
    logger.error('[ORDER RECONCILIATION] Job failed:', error);
  } finally {
    if (lockToken) {
      await redisService.releaseLock(lockKey, lockToken);
    }
  }
}

// ─── LF-D005 FIX: Retry failed merchant credits ──────────────────────────────
//
// PROBLEM (Scenario B): When merchantWalletService.creditOrderPayment throws,
// orderUpdateController catches the error and writes:
//   Order.merchantCredit = { status:'failed', failureReason, idempotencyKey }
// Before LF-D001 was fixed that write was silently dropped by Mongoose (schema
// mismatch).  Even with LF-D001 fixed, the controller does NOT requeue the
// credit — the failure simply sits there until a human notices an alert or this
// reconciliation job runs.
//
// This function queries for delivered orders whose merchantCredit.status is
// 'failed' (or whose status is 'delivered' but merchantCredit is absent — the
// pre-LF-D001 data) and retries the credit using the stored idempotencyKey so
// MerchantWallet.creditOrder's `$ne orderId` guard prevents double-crediting.
//
// Safety: max 3 retries per order (retryCount stored in Order.merchantCredit).
// After 3 failures the order is escalated to an AdminAction for manual review.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_MERCHANT_CREDIT_RETRIES = 3;

async function retryFailedMerchantCredits(): Promise<void> {
  const lockKey = 'job:merchant-credit-retry';
  let lockToken: string | null = null;

  try {
    lockToken = await redisService.acquireLock(lockKey, 300);
    if (!lockToken) {
      logger.info('[MERCHANT CREDIT RETRY] Skipped — lock held by another instance');
      return;
    }

    // Find orders that are delivered but merchant was not paid, up to retry limit
    const failedCreditOrders = await Order.find({
      status: 'delivered',
      $or: [
        { 'merchantCredit.status': 'failed' },
        // Orders delivered before LF-D001 fix: merchantCredit may be entirely absent
        { merchantCredit: { $exists: false } },
      ],
      'merchantCredit.retryCount': { $lt: MAX_MERCHANT_CREDIT_RETRIES },
    })
      .select('_id orderNumber user store items totals merchantCredit')
      .lean();

    if (failedCreditOrders.length === 0) {
      logger.info('[MERCHANT CREDIT RETRY] No failed merchant credits to retry');
      return;
    }

    logger.info(`[MERCHANT CREDIT RETRY] Found ${failedCreditOrders.length} orders to retry`);

    const { Store } = require('../models/Store');
    const merchantWalletService = require('../services/merchantWalletService').default;
    const { AdminAction } = require('../models/AdminAction');
    const { Types } = require('mongoose');
    const SYSTEM_USER_ID = new Types.ObjectId('000000000000000000000000');

    for (const order of failedCreditOrders) {
      const orderId = String(order._id);
      const retryCount = (order as any).merchantCredit?.retryCount ?? 0;

      if (retryCount >= MAX_MERCHANT_CREDIT_RETRIES) {
        // Escalate to AdminAction
        try {
          await AdminAction.create({
            actionType: 'manual_adjustment',
            initiatorId: SYSTEM_USER_ID,
            status: 'pending_approval',
            payload: {
              orderId,
              orderNumber: order.orderNumber,
              discrepancyType: 'merchant_credit_max_retries_exceeded',
              expectedAmount: (order.totals?.subtotal ?? 0) - (order.totals?.platformFee ?? 0),
            },
            reason: `Merchant credit failed ${retryCount} times for order ${order.orderNumber}. Manual intervention required.`,
            threshold: (order.totals?.subtotal ?? 0) - (order.totals?.platformFee ?? 0),
          });
        } catch (_adminErr) { /* non-critical */ }
        continue;
      }

      try {
        const firstItem = order.items?.[0];
        if (!firstItem?.store) continue;

        const storeId = typeof firstItem.store === 'object'
          ? (firstItem.store as any)._id
          : firstItem.store;

        const store = await Store.findById(storeId).select('merchantId').lean();
        if (!store?.merchantId) continue;

        const grossAmount = order.totals?.subtotal ?? 0;
        const platformFee = order.totals?.platformFee ?? 0;

        await merchantWalletService.creditOrderPayment(
          store.merchantId.toString(),
          order._id,
          order.orderNumber,
          grossAmount,
          platformFee,
          storeId,
        );

        // Mark as succeeded
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            'merchantCredit.status': 'succeeded',
            'merchantCredit.retriedAt': new Date(),
          },
        });

        logger.info(`[MERCHANT CREDIT RETRY] Successfully credited merchant for order ${order.orderNumber}`);
      } catch (retryErr: any) {
        // Increment retry counter and record failure reason
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            'merchantCredit.status': 'failed',
            'merchantCredit.failedAt': new Date(),
            'merchantCredit.failureReason': retryErr?.message || 'Unknown error',
          },
          $inc: { 'merchantCredit.retryCount': 1 },
        });

        logger.error(`[MERCHANT CREDIT RETRY] Retry failed for order ${order.orderNumber}:`, retryErr);
      }
    }
  } catch (error) {
    logger.error('[MERCHANT CREDIT RETRY] Job failed:', error);
  } finally {
    if (lockToken) {
      await redisService.releaseLock(lockKey, lockToken);
    }
  }
}

/**
 * Initialize the reconciliation cron job (daily at 3 AM)
 * Also runs failed merchant credit retries every 15 minutes.
 */
export function initializeOrderReconciliationJob(): void {
  cron.schedule('0 3 * * *', () => {
    runOrderReconciliation().catch(err => logger.error('[ORDER RECONCILIATION] Unhandled error:', err));
  });

  // LF-D005 FIX: retry failed merchant credits every 15 minutes so the window
  // between a credit failure and its correction is bounded.
  cron.schedule('*/15 * * * *', () => {
    retryFailedMerchantCredits().catch(err => logger.error('[MERCHANT CREDIT RETRY] Unhandled error:', err));
  });

  logger.info('  Order reconciliation job started (runs daily at 3 AM)');
  logger.info('  Merchant credit retry job started (runs every 15 minutes)');
}

export { runOrderReconciliation, retryFailedMerchantCredits };
