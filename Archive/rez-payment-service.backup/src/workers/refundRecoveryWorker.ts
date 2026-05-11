/**
 * Refund Recovery Worker — Auto-retry mechanism for stuck refunds.
 *
 * PROBLEM: When refunds are initiated, they can get stuck in 'refund_initiated' or
 * 'refund_processing' status due to network issues, Razorpay timeouts, or service restarts.
 * These refunds are never automatically retried, causing customer dissatisfaction.
 *
 * SOLUTION: This worker periodically scans for stuck refunds and either:
 *   1. Syncs status with Razorpay if the refund was already processed
 *   2. Retries the refund if Razorpay shows no progress
 *   3. Marks as failed after 3 consecutive retry failures
 *
 * SCAN LOGIC:
 *   Find payments where:
 *     status = 'refund_initiated' or 'refund_processing'
 *     updatedAt < now - 30 minutes
 *
 *   For each stuck refund:
 *     1. Query Razorpay for current refund status
 *     2. If Razorpay shows refund_complete → sync to 'refunded'
 *     3. If Razorpay shows refund_failed → sync to 'refund_failed'
 *     4. If Razorpay shows no refund → retry initiateRefund()
 *     5. After 3 failed retries → mark as 'refund_failed'
 *
 * SCHEDULE: Runs every 15 minutes via setInterval.
 * CONCURRENCY: Processes one batch of 50 at a time with Redis locking.
 */

import { Payment, IPayment, PaymentStatus } from '../models/Payment';
import { initiateRefund, getPaymentDetails } from '../services/razorpayService';
import { createServiceLogger } from '../config/logger';
import { redis } from '../config/redis';

const logger = createServiceLogger('refund-recovery');

// ─── Config ────────────────────────────────────────────────────────────────────

const STUCK_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const BATCH_SIZE = 50;
const MAX_RETRY_ATTEMPTS = 3;
const SCAN_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const LOCK_TTL_SECONDS = 120;

let _intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Redis-based distributed lock to prevent concurrent worker runs.
 */
async function withRedisLock<T>(lockKey: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const lockValue = `${process.pid}-${Date.now()}`;

  const acquired = await redis.set(lockKey, lockValue, 'EX', ttlSeconds, 'NX');
  if (!acquired) {
    throw new Error(`Could not acquire lock: ${lockKey}`);
  }

  try {
    return await fn();
  } finally {
    // Only release if we still hold the lock (compare-and-delete)
    const currentValue = await redis.get(lockKey);
    if (currentValue === lockValue) {
      await redis.del(lockKey);
    }
  }
}

// ─── Core scan ────────────────────────────────────────────────────────────────

/**
 * Scan for and recover stuck refunds.
 * Called every SCAN_INTERVAL_MS with distributed locking.
 */
export async function processStuckRefunds(): Promise<void> {
  try {
    await withRedisLock('refund-recovery-worker', LOCK_TTL_SECONDS, async () => {
      const stuckDate = new Date(Date.now() - STUCK_THRESHOLD_MS);

      // Find stuck refunds using the { status, updatedAt } compound index
      const stuckRefunds = await Payment.find({
        status: { $in: [PaymentStatus.REFUND_INITIATED, PaymentStatus.REFUND_PROCESSING] },
        updatedAt: { $lt: stuckDate },
      })
        .limit(BATCH_SIZE)
        .lean<IPayment[]>();

      logger.info('[RefundRecovery] Found stuck refunds to process', { count: stuckRefunds.length });

      for (const payment of stuckRefunds) {
        await processStuckRefund(payment);
      }
    });
  } catch (err: any) {
    if (err.message?.includes('Could not acquire lock')) {
      logger.debug('[RefundRecovery] Another instance is running — skipping this cycle');
      return;
    }
    logger.error('[RefundRecovery] Scan cycle failed', { error: err?.message });
  }
}

/**
 * Process a single stuck refund payment.
 */
async function processStuckRefund(payment: IPayment): Promise<void> {
  const paymentId = payment.paymentId as string;

  try {
    // Step 1: Check if Razorpay already processed the refund
    const razorpayPayment = await getPaymentDetails(paymentId);

    if (razorpayPayment?.refund_status) {
      // Sync with Razorpay state
      await syncRefundStatus(payment, razorpayPayment);
      return;
    }

    // Step 2: Retry the refund
    const retryKey = `refund:retry:${paymentId}`;
    const attempts = await redis.incr(retryKey);
    await redis.expire(retryKey, 7 * 24 * 60 * 60); // 7 days TTL

    if (attempts > MAX_RETRY_ATTEMPTS) {
      logger.warn('[RefundRecovery] Max retries exceeded — marking as failed', { paymentId, attempts });
      await Payment.updateOne(
        { paymentId },
        { $set: { status: PaymentStatus.REFUND_FAILED } }
      );
      await redis.del(retryKey);
      return;
    }

    const refund = await initiateRefund(
      paymentId,
      payment.refundedAmount || payment.amount,
      { reason: `Auto-retry: stuck refund (attempt ${attempts})` }
    ) as { id?: string } | undefined;

    // Update status to processing
    await Payment.updateOne(
      { paymentId },
      { $set: { status: PaymentStatus.REFUND_PROCESSING } }
    );

    logger.info('[RefundRecovery] Retried stuck refund', {
      paymentId,
      refundId: refund?.id,
      attempt: attempts,
    });
  } catch (err: any) {
    logger.error('[RefundRecovery] Failed to retry refund', {
      paymentId,
      error: err?.message,
    });

    // Increment retry counter even on error
    const retryKey = `refund:retry:${paymentId}`;
    const attempts = await redis.incr(retryKey);
    await redis.expire(retryKey, 7 * 24 * 60 * 60);

    if (attempts > MAX_RETRY_ATTEMPTS) {
      logger.warn('[RefundRecovery] Max retries exceeded — marking as failed', { paymentId, attempts });
      await Payment.updateOne(
        { paymentId },
        { $set: { status: PaymentStatus.REFUND_FAILED } }
      );
      await redis.del(retryKey);
    }
  }
}

/**
 * Sync payment status with Razorpay refund state.
 */
async function syncRefundStatus(payment: IPayment, razorpayPayment: any): Promise<void> {
  const paymentId = payment.paymentId as string;
  const refundStatus = razorpayPayment.refund_status;

  let newStatus: PaymentStatus | null = null;

  switch (refundStatus) {
    case 'full':
    case 'partial':
    case 'complete':
    case 'processed':
      newStatus = PaymentStatus.REFUNDED;
      break;
    case 'failed':
    case 'reversed':
      newStatus = PaymentStatus.REFUND_FAILED;
      break;
    case 'pending':
    case 'in_progress':
      newStatus = PaymentStatus.REFUND_PROCESSING;
      break;
    default:
      logger.warn('[RefundRecovery] Unknown Razorpay refund status', {
        paymentId,
        refundStatus,
      });
      return;
  }

  if (newStatus && newStatus !== payment.status) {
    await Payment.updateOne(
      { paymentId },
      { $set: { status: newStatus } }
    );
    logger.info('[RefundRecovery] Synced refund status from Razorpay', {
      paymentId,
      oldStatus: payment.status,
      newStatus,
      razorpayRefundStatus: refundStatus,
    });
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

/** Start the refund recovery worker. Idempotent — safe to call multiple times. */
export function startRefundRecoveryWorker(): void {
  if (_intervalHandle !== null) {
    logger.info('[RefundRecovery] Worker already running');
    return;
  }

  logger.info('[RefundRecovery] Starting refund recovery worker', {
    stuckThresholdMs: STUCK_THRESHOLD_MS,
    scanIntervalMs: SCAN_INTERVAL_MS,
    batchSize: BATCH_SIZE,
    maxRetryAttempts: MAX_RETRY_ATTEMPTS,
  });

  // Run immediately on startup
  processStuckRefunds().catch((err: any) =>
    logger.error('[RefundRecovery] Initial recovery scan failed', { error: err?.message })
  );

  _intervalHandle = setInterval(() => {
    processStuckRefunds().catch((err: any) =>
      logger.error('[RefundRecovery] Scheduled recovery scan failed', { error: err?.message })
    );
  }, SCAN_INTERVAL_MS);
}

/** Stop the refund recovery worker. */
export function stopRefundRecoveryWorker(): void {
  if (_intervalHandle !== null) {
    clearInterval(_intervalHandle);
    _intervalHandle = null;
    logger.info('[RefundRecovery] Worker stopped');
  }
}
