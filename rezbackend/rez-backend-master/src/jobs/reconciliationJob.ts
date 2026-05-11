import * as cron from 'node-cron';
import { MallPurchase } from '../models/MallPurchase';
import { UserCashback } from '../models/UserCashback';
import { Wallet } from '../models/Wallet';
import { Order } from '../models/Order';
import { MerchantWallet } from '../models/MerchantWallet';
import { ServiceAppointment } from '../models/ServiceAppointment';
import ReconciliationIssue, { IReconciliationIssue } from '../models/ReconciliationIssue';
import redisService from '../services/redisService';
import { logger } from '../config/logger';
import { Types } from 'mongoose';
import { reconciliationService } from '../services/reconciliationService';

/**
 * Daily Reconciliation Job with Issue Tracking
 *
 * Runs at 3:00 AM (after credit and expire jobs) to detect discrepancies:
 * 1. MallPurchase credited amounts vs UserCashback credited amounts per user
 * 2. Wallet statistics.totalCashback vs sum of cashback CoinTransactions
 * 3. Completed orders without corresponding cashback credits
 * 4. Cancelled bookings with stale refunds (pending > 48h)
 *
 * Persists results to Redis for admin dashboard consumption and MongoDB for tracking.
 * Uses Redis distributed lock with owner token for multi-instance safety.
 */

const RECONCILIATION_SCHEDULE = '0 3 * * *'; // Daily at 3:00 AM
const LOCK_TTL = 7200; // 2 hours
const RESULT_TTL = 7 * 24 * 60 * 60; // Keep results for 7 days

let reconciliationJob: ReturnType<typeof cron.schedule> | null = null;

interface DiscrepancyRecord {
  userId: string;
  type:
    | 'purchase_vs_cashback'
    | 'wallet_vs_transactions'
    | 'order_vs_wallet_deduction'
    | 'order_vs_merchant_settlement'
    | 'missing_cashback'
    | 'stale_refund'
    | 'ghost_pending_order';
  expected: number;
  actual: number;
  difference: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  relatedEntityId?: string;
}

interface ReconciliationResult {
  discrepancies: DiscrepancyRecord[];
  issuesCreated: number;
  usersChecked: number;
  duration: number;
  timestamp: Date;
  summary: {
    totalDiscrepancies: number;
    criticalCount: number;
    highCount: number;
    totalDifferenceAmount: number;
  };
}

/**
 * Classify discrepancy severity based on the difference amount
 */
function classifySeverity(diff: number): 'low' | 'medium' | 'high' | 'critical' {
  if (diff > 10000) return 'critical'; // > ₹10,000
  if (diff > 1000) return 'high'; // > ₹1,000
  if (diff > 100) return 'medium'; // > ₹100
  return 'low'; // ₹1-100
}

/**
 * Create or update a reconciliation issue in the database
 */
async function persistIssue(record: DiscrepancyRecord, entityId?: string): Promise<void> {
  try {
    const issueType =
      record.type === 'purchase_vs_cashback'
        ? 'wallet_mismatch'
        : record.type === 'missing_cashback'
          ? 'missing_cashback'
          : record.type === 'stale_refund'
            ? 'stale_refund'
            : record.type === 'ghost_pending_order'
              ? 'ghost_pending_order'
              : 'wallet_mismatch';

    // FIX: DiscrepancyRecord.userId (not record.user) is the correct field name.
    // Accessing record.user returned undefined, causing Types.ObjectId(undefined) to
    // write null into every persisted issue's userId — making them unrepairable.
    const userIdStr = record.userId;

    // For system-level records (e.g. wallet_vs_transactions with userId='system')
    // we cannot cast to ObjectId; skip DB persistence and rely on Redis/log alerting.
    if (!userIdStr || userIdStr === 'system') {
      logger.warn('[RECONCILIATION] Skipping DB persist for system-level discrepancy', {
        type: record.type,
        diff: record.difference,
      });
      return;
    }

    const userObjectId = new Types.ObjectId(userIdStr);

    const existingIssue = await ReconciliationIssue.findOne({
      type: issueType,
      userId: userObjectId,
      status: 'open',
    });

    if (!existingIssue) {
      try {
        await ReconciliationIssue.create({
          type: issueType,
          userId: userObjectId,
          orderId: record.type === 'missing_cashback' ? entityId : undefined,
          detail: `${record.type}: Expected ₹${record.expected}, got ₹${record.actual} (diff: ₹${record.difference})`,
          status: 'open',
          detectedAt: new Date(),
        });
      } catch (createErr: any) {
        // E11000 = the dedup_open_issue_idx caught a concurrent duplicate write
        // from another reconciliation instance running in parallel.  This is
        // expected and not an error — the issue is already tracked.
        if (createErr?.code === 11000) {
          logger.debug('[RECONCILIATION] Duplicate open issue skipped (concurrent run)', {
            type: issueType,
            userId: userIdStr,
          });
          return;
        }
        throw createErr; // Re-throw unexpected errors to the outer catch
      }
    }
  } catch (err: any) {
    logger.warn('[RECONCILIATION] Failed to persist issue:', { error: err.message, record });
  }
}

/**
 * Run the reconciliation check
 */
async function runReconciliation(): Promise<ReconciliationResult> {
  const startTime = Date.now();
  const discrepancies: DiscrepancyRecord[] = [];
  let issuesCreated = 0;

  logger.info('🔍 [RECONCILIATION] Starting daily reconciliation...');

  // AHMED: ledger integrity — cross-validation: sum of all wallet balances == sum of CoinTransaction credits - debits
  try {
    const walletSumResult = await Wallet.aggregate([
      { $group: { _id: null, totalBalance: { $sum: '$balance.total' } } },
    ]);
    const walletTotal = walletSumResult[0]?.totalBalance || 0;

    const { CoinTransaction } = await import('../models/CoinTransaction');
    // BUG-44 FIX: Include all credit transaction types (earned, refund, bonus, topup)
    // and all debit transaction types (spent, reversal) in the net balance calculation.
    // Previously only 'earned - spent' was used, causing the ledger cross-check to
    // produce false-positive drift alerts whenever refunds, bonuses, reversals, or
    // top-ups existed in the transaction history.
    const creditSum = await CoinTransaction.aggregate([
      { $match: { type: { $in: ['earned', 'refund', 'bonus', 'topup'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const debitSum = await CoinTransaction.aggregate([
      { $match: { type: { $in: ['spent', 'reversal'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const earned = creditSum[0]?.total || 0;
    const spent = debitSum[0]?.total || 0;
    const txNetBalance = earned - spent;

    const walletLedgerDiff = Math.abs(walletTotal - txNetBalance);
    if (walletLedgerDiff > 1) {
      // Allow 1 coin tolerance for rounding
      const severity = walletLedgerDiff > 10000 ? 'critical' : walletLedgerDiff > 1000 ? 'high' : 'medium';
      const record: DiscrepancyRecord = {
        userId: 'system',
        type: 'wallet_vs_transactions',
        expected: txNetBalance,
        actual: walletTotal,
        difference: walletLedgerDiff,
        severity: severity as any,
      };
      discrepancies.push(record);
      logger.error(
        `🚨 [RECONCILIATION] Wallet sum ₹${walletTotal} != Transaction net ₹${txNetBalance} (diff: ₹${walletLedgerDiff})`,
      );
    } else {
      logger.info(
        `✅ [RECONCILIATION] Wallet sum (₹${walletTotal}) matches transaction net balance (₹${txNetBalance})`,
      );
    }
  } catch (err) {
    logger.error('❌ [RECONCILIATION] Cross-validation failed (non-blocking)', err);
  }

  try {
    // Step 1: Compare MallPurchase credited amounts vs UserCashback amounts per user
    const purchaseSums = await MallPurchase.aggregate([
      { $match: { status: 'credited' } },
      {
        $group: {
          _id: '$user',
          totalPurchaseCashback: { $sum: '$actualCashback' },
          purchaseCount: { $sum: 1 },
        },
      },
    ]);

    for (const ps of purchaseSums) {
      const cashbackSum = await UserCashback.aggregate([
        {
          $match: {
            user: ps._id,
            source: 'special_offer',
            status: { $in: ['credited', 'redeemed'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const cashbackTotal = cashbackSum[0]?.total || 0;
      const diff = Math.abs(ps.totalPurchaseCashback - cashbackTotal);

      if (diff > 1) {
        // Allow ₹1 rounding tolerance
        const record: DiscrepancyRecord = {
          userId: ps._id.toString(),
          type: 'purchase_vs_cashback',
          expected: ps.totalPurchaseCashback,
          actual: cashbackTotal,
          difference: diff,
          severity: classifySeverity(diff),
        };
        discrepancies.push(record);
        await persistIssue(record);
        issuesCreated++;
      }
    }

    // Step 2: Compare wallet totalCashback vs CoinTransaction cashback totals
    const { CoinTransaction } = await import('../models/CoinTransaction');

    const walletCashbackSums = await Wallet.aggregate([
      { $match: { 'statistics.totalCashback': { $gt: 0 } } },
      {
        $project: {
          user: 1,
          walletCashback: '$statistics.totalCashback',
        },
      },
    ]);

    for (const ws of walletCashbackSums) {
      const txSum = await CoinTransaction.aggregate([
        {
          $match: {
            user: ws.user,
            source: 'cashback',
            type: 'earned',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const txTotal = txSum[0]?.total || 0;
      const diff = Math.abs(ws.walletCashback - txTotal);

      if (diff > 1) {
        const record: DiscrepancyRecord = {
          userId: ws.user.toString(),
          type: 'wallet_vs_transactions',
          expected: ws.walletCashback,
          actual: txTotal,
          difference: diff,
          severity: classifySeverity(diff),
        };
        discrepancies.push(record);
        await persistIssue(record);
        issuesCreated++;
      }
    }

    // Step 3: Compare completed order totals vs wallet deductions per user
    const orderSums = await Order.aggregate([
      // Order.status is a flat string field — NOT a nested object.
      // Using 'status.current' previously caused this stage to always return 0 records,
      // making Step 3 of reconciliation a no-op.
      // BUG 23 FIX: 'completed' is not a valid Order status — only 'delivered' is used
      // for finished orders. Including 'completed' caused no records to match, making
      // this reconciliation step silently a no-op.
      { $match: { status: { $in: ['delivered'] }, 'payment.method': 'wallet' } },
      {
        $group: {
          _id: '$user',
          totalOrderAmount: { $sum: '$totals.total' },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    for (const os of orderSums) {
      const walletDebits = await CoinTransaction.aggregate([
        {
          $match: {
            user: os._id,
            type: 'spent',
            source: { $in: ['order', 'payment'] },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const debitTotal = walletDebits[0]?.total || 0;
      const diff = Math.abs(os.totalOrderAmount - debitTotal);

      if (diff > 5) {
        // Allow ₹5 tolerance for rounding/fees
        const record: DiscrepancyRecord = {
          userId: os._id.toString(),
          type: 'order_vs_wallet_deduction',
          expected: os.totalOrderAmount,
          actual: debitTotal,
          difference: diff,
          severity: classifySeverity(diff),
        };
        discrepancies.push(record);
        await persistIssue(record);
        issuesCreated++;
      }
    }

    // Step 4: Check for completed orders without corresponding cashback credits (last 48h)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const uncreditedOrders = await Order.find({
      // status is a flat string field on Order — { current: 'delivered' } was
      // always an object literal that matched nothing.
      status: 'delivered',
      cashbackStatus: { $ne: 'credited' },
      createdAt: { $gte: fortyEightHoursAgo },
    })
      .lean()
      // BUG-036 FIX: Increased from 100 to 500 wallets per run to catch more discrepancies.
      .limit(500);

    for (const order of uncreditedOrders) {
      const record: DiscrepancyRecord = {
        userId: (order.user as any).toString(),
        type: 'missing_cashback',
        expected: (order as any).totals?.cashback || 0,
        actual: 0,
        difference: (order as any).totals?.cashback || 0,
        severity: 'high',
        relatedEntityId: order._id.toString(),
      };
      discrepancies.push(record);
      await persistIssue(record, order._id.toString());
      issuesCreated++;
    }

    // LF-006 FIX: Step 4b — Ghost pending transactions.
    // Orders stuck in status='placed' + payment.status='processing' beyond 2 hours
    // indicate a webhook never arrived (network drop, provider outage, delayed callback).
    // The orderLifecycleJobs recovery job handles recent ones (30min–2h window), but
    // the reconciliation job must catch stragglers older than 2 hours that somehow
    // escaped auto-cancellation (e.g., process restart while recovery job was mid-run).
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const ghostOrders = await Order.find({
      status: 'placed',
      'payment.status': { $in: ['pending', 'processing'] },
      'payment.method': { $ne: 'cod' },
      createdAt: { $lt: twoHoursAgo },
    })
      .select('_id user orderNumber totals')
      .lean()
      // BUG-036 FIX: Increased from 100 to 500 to catch more ghost orders per run.
      .limit(500);

    for (const ghostOrder of ghostOrders) {
      const record: DiscrepancyRecord = {
        userId: (ghostOrder.user as any).toString(),
        // BUG-43 FIX: Use the dedicated 'ghost_pending_order' type so these issues
        // are correctly classified in admin tooling instead of being misreported
        // as missing cashback (which has different remediation steps).
        type: 'ghost_pending_order',
        expected: (ghostOrder as any).totals?.total || 0,
        actual: 0,
        difference: (ghostOrder as any).totals?.total || 0,
        severity: 'high',
        relatedEntityId: ghostOrder._id.toString(),
      };
      discrepancies.push(record);
      await persistIssue(record, ghostOrder._id.toString());
      issuesCreated++;
      logger.warn(`[RECONCILIATION] Ghost pending order detected: ${ghostOrder.orderNumber}`, {
        orderId: ghostOrder._id.toString(),
        userId: (ghostOrder.user as any).toString(),
        amount: (ghostOrder as any).totals?.total,
      });
    }

    // Step 5: Check for cancelled bookings with stale refunds (>48h pending)
    const fortyEightHoursAgoDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const staleRefunds = await ServiceAppointment.find({
      status: 'cancelled',
      refundStatus: 'pending',
      updatedAt: { $lt: fortyEightHoursAgoDate },
    })
      .lean()
      .limit(50);

    for (const apt of staleRefunds) {
      const record: DiscrepancyRecord = {
        userId: (apt.user as any).toString(),
        type: 'stale_refund',
        expected: (apt as any).bookingAmount || 0,
        actual: 0,
        difference: (apt as any).bookingAmount || 0,
        severity: 'medium',
        relatedEntityId: apt._id.toString(),
      };
      discrepancies.push(record);
      await persistIssue(record, apt._id.toString());
      issuesCreated++;
    }

    // AHMED: ledger integrity — transaction state machine integrity check
    // Verify no invalid state transitions (e.g., FAILED→REVERSED should not happen)
    try {
      const { TransactionLedger } = await import('../services/TransactionLedgerService');
      const invalidStates = await TransactionLedger.find({
        status: 'REVERSED',
        // If there's a logic error, we might find a REVERSED tx without a SUCCESS original
        // This shouldn't happen in normal operation
      })
        .lean()
        .limit(100);

      for (const invalidTx of invalidStates) {
        if ((invalidTx as any).originalTransactionId) {
          const original = await TransactionLedger.findOne({ txId: (invalidTx as any).originalTransactionId }).lean();
          if (original && original.status !== 'SUCCESS') {
            logger.error(
              `🚨 [RECONCILIATION] Invalid state: REVERSED tx ${(invalidTx as any).txId} points to non-SUCCESS original ${original.status}`,
              {
                originalStatus: original.status,
                originalTxId: (invalidTx as any).originalTransactionId,
              },
            );
          }
        }
      }
    } catch (err) {
      logger.error('[RECONCILIATION] State machine integrity check failed (non-blocking)', err);
    }

    // FIX 3: Recover payments stuck in `processing` — the monolith previously had no
    // mechanism to resolve these; they would remain orphaned indefinitely.
    // Runs inside the same reconciliation window so a single Redis lock covers it.
    try {
      const stuckResult = await reconciliationService.runStuckPaymentRecovery();
      logger.info('[RECONCILIATION] Stuck payment recovery result', stuckResult);
    } catch (stuckErr) {
      logger.error('[RECONCILIATION] Stuck payment recovery failed (non-blocking)', stuckErr);
    }

    const duration = Date.now() - startTime;

    // Build summary
    const criticalCount = discrepancies.filter((d) => d.severity === 'critical').length;
    const highCount = discrepancies.filter((d) => d.severity === 'high').length;
    const totalDifferenceAmount = discrepancies.reduce((sum, d) => sum + d.difference, 0);

    const result: ReconciliationResult = {
      discrepancies,
      issuesCreated,
      usersChecked: purchaseSums.length + walletCashbackSums.length + orderSums.length,
      duration,
      timestamp: new Date(),
      summary: {
        totalDiscrepancies: discrepancies.length,
        criticalCount,
        highCount,
        totalDifferenceAmount,
      },
    };

    // Persist results to Redis for admin dashboard
    const resultKey = `reconciliation:latest`;
    const historyKey = `reconciliation:history:${new Date().toISOString().split('T')[0]}`;
    await redisService.set(resultKey, result, RESULT_TTL);
    await redisService.set(historyKey, result, RESULT_TTL);

    // Structured alerting based on severity
    if (criticalCount > 0) {
      logger.error(
        `🚨 [RECONCILIATION] CRITICAL: ${criticalCount} critical discrepancies found (total ₹${totalDifferenceAmount.toFixed(2)}). Immediate investigation required.`,
        {
          event: 'reconciliation_critical',
          criticalCount,
          highCount,
          totalDifferenceAmount,
          issuesCreated,
          discrepancies: discrepancies.filter((d) => d.severity === 'critical'),
        },
      );
    } else if (highCount > 0) {
      logger.warn(
        `⚠️ [RECONCILIATION] HIGH: ${highCount} high-severity discrepancies found (total ₹${totalDifferenceAmount.toFixed(2)}).`,
        {
          event: 'reconciliation_high',
          highCount,
          totalDifferenceAmount,
          issuesCreated,
          discrepancies: discrepancies.filter((d) => d.severity === 'high'),
        },
      );
    } else if (discrepancies.length > 0) {
      logger.warn(
        `⚠️ [RECONCILIATION] Found ${discrepancies.length} minor discrepancies (total ₹${totalDifferenceAmount.toFixed(2)}).`,
      );
    } else {
      logger.info(
        `✅ [RECONCILIATION] No discrepancies found. Checked ${result.usersChecked} user records in ${duration}ms`,
      );
    }

    return result;
  } catch (error) {
    logger.error('❌ [RECONCILIATION] Job failed:', error);
    throw error;
  }
}

/**
 * Start the reconciliation job
 */
export function startReconciliationJob(): void {
  if (reconciliationJob) {
    logger.info('⚠️ [RECONCILIATION] Job already scheduled');
    return;
  }

  logger.info('🔍 [RECONCILIATION] Starting daily reconciliation job (runs at 3:00 AM)');

  reconciliationJob = cron.schedule(RECONCILIATION_SCHEDULE, async () => {
    const lockToken = await redisService.acquireLock('reconciliation_job', LOCK_TTL);
    if (!lockToken) {
      logger.info('⏭️ [RECONCILIATION] Another instance is running, skipping');
      return;
    }

    try {
      await runReconciliation();
    } catch (err) {
      logger.error('[RECONCILIATION] Unhandled error in runReconciliation', {
        error: err instanceof Error ? err.message : err,
      });
    } finally {
      await redisService.releaseLock('reconciliation_job', lockToken);
    }
  });

  logger.info('✅ [RECONCILIATION] Job started');
}

/**
 * Stop the reconciliation job
 */
export function stopReconciliationJob(): void {
  if (reconciliationJob) {
    reconciliationJob.stop();
    reconciliationJob = null;
    logger.info('🛑 [RECONCILIATION] Job stopped');
  }
}

/**
 * Manually trigger reconciliation (for admin/testing)
 */
export async function triggerManualReconciliation(): Promise<ReconciliationResult> {
  const lockToken = await redisService.acquireLock('reconciliation_job', LOCK_TTL);
  if (!lockToken) {
    throw new Error('Reconciliation job already in progress');
  }

  try {
    return await runReconciliation();
  } finally {
    await redisService.releaseLock('reconciliation_job', lockToken);
  }
}

/**
 * Get the latest reconciliation results (from Redis)
 */
export async function getLatestReconciliationResult(): Promise<ReconciliationResult | null> {
  return redisService.get<ReconciliationResult>('reconciliation:latest');
}

export default {
  start: startReconciliationJob,
  stop: stopReconciliationJob,
  triggerManual: triggerManualReconciliation,
  getLatest: getLatestReconciliationResult,
};
