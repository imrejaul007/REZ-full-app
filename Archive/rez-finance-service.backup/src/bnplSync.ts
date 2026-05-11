/**
 * BNPL Synchronization Service
 * Reconciles BNPLTransaction (wallet) and FinanceTransaction (finance)
 *
 * Ensures data consistency between the wallet BNPL system and the finance ledger
 * by finding discrepancies and creating missing finance records.
 */

import mongoose from 'mongoose';
import cron from 'node-cron';
import { FinanceTransaction } from './models/FinanceTransaction';
import { logger } from './config/logger';

// BNPLTransaction interface for cross-service reconciliation
// This service runs in finance-service but reconciles wallet-service data

interface IBNPLTransaction extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  phone: string;
  amount: number;
  merchantId: string;
  merchantName?: string;
  vertical?: string;
  creditUsed?: number;
  interestAmount?: number;
  totalDue?: number;
  dueDate: Date;
  repaidDate?: Date;
  status: 'ACTIVE' | 'REPAID' | 'DEFAULTED' | 'CANCELLED';
  daysOverdue?: number;
  penaltyApplied?: number;
  orderId?: string;
  paymentMethod?: string;
  partnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// BNPLTransaction model - uses the same connection as finance-service
// Collection name matches wallet-service: 'bnpltransactions'
const BNPLTransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  phone: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  merchantId: { type: String, required: true, index: true },
  merchantName: String,
  vertical: String,
  creditUsed: { type: Number, default: 0 },
  interestAmount: { type: Number, default: 0 },
  totalDue: { type: Number, default: 0 },
  dueDate: { type: Date, required: true, index: true },
  repaidDate: Date,
  status: {
    type: String,
    enum: ['ACTIVE', 'REPAID', 'DEFAULTED', 'CANCELLED'],
    default: 'ACTIVE',
    index: true,
  },
  daysOverdue: { type: Number, default: 0 },
  penaltyApplied: { type: Number, default: 0 },
  orderId: String,
  paymentMethod: { type: String, default: 'bnpl' },
  partnerId: String,
}, { timestamps: true, collection: 'bnpltransactions' });

BNPLTransactionSchema.index({ userId: 1, status: 1 });
BNPLTransactionSchema.index({ dueDate: 1, status: 1 });

// Use the same MongoDB connection - BNPLTransaction collection must exist
// This can be a separate model if BNPL lives in wallet DB, or shared collection
const BNPLTransaction = mongoose.models.BNPLTransaction ||
  mongoose.model<IBNPLTransaction>('BNPLTransaction', BNPLTransactionSchema);

// Reconciliation result types
export interface ReconciliationResult {
  status: 'ok' | 'reconciled' | 'discrepancy' | 'error';
  message?: string;
  bnplId?: string;
  financeId?: string;
  bnplAmount?: number;
  financeAmount?: number;
  bnplStatus?: string;
  financeStatus?: string;
}

export interface ReconciliationReport {
  total: number;
  ok: number;
  reconciled: number;
  discrepancies: number;
  errors: number;
  details: ReconciliationResult[];
}

export class BNPLSync {
  /**
   * Reconcile a single BNPL transaction with its finance record
   */
  async reconcile(bnplId: string): Promise<ReconciliationResult> {
    try {
      const bnpl = await BNPLTransaction.findById(bnplId);

      if (!bnpl) {
        return { status: 'error', message: 'BNPL not found', bnplId };
      }

      // Find matching finance transaction by BNPL ID
      // Finance record references wallet BNPL via metadata.referenceId or parentId
      const finance = await FinanceTransaction.findOne({
        $or: [
          { 'metadata.referenceId': bnplId },
          { 'metadata.bnplId': bnplId },
          { parentId: bnplId, parentType: 'BNPLTransaction' },
        ],
      });

      if (!finance) {
        // Create missing finance record
        const partnerId = bnpl.partnerId || 'system-bnpl-reconciliation';

        const newFinance = await FinanceTransaction.create({
          type: 'bnpl_payment',
          referenceId: bnpl._id,
          userId: bnpl.userId,
          amount: bnpl.amount,
          currency: 'INR',
          status: this.mapBNPLStatus(bnpl.status),
          partnerId,
          parentId: bnpl._id,
          parentType: 'BNPLTransaction',
          metadata: {
            bnplId: bnpl._id,
            merchantId: bnpl.merchantId,
            merchantName: bnpl.merchantName,
            vertical: bnpl.vertical,
            dueDate: bnpl.dueDate,
            totalDue: bnpl.totalDue,
            interestAmount: bnpl.interestAmount,
          },
        });

        logger.info('[BNPLSync] Created missing finance record', {
          bnplId,
          financeId: newFinance._id,
        });

        return {
          status: 'reconciled',
          bnplId,
          financeId: newFinance._id.toString(),
        };
      }

      // Check for amount discrepancy
      if (bnpl.amount !== finance.amount) {
        return {
          status: 'discrepancy',
          bnplId,
          financeId: finance._id.toString(),
          bnplAmount: bnpl.amount,
          financeAmount: finance.amount,
        };
      }

      // Check for status discrepancy
      const bnplStatus = this.mapBNPLStatus(bnpl.status);
      if (bnplStatus !== finance.status) {
        // Update finance status to match BNPL
        finance.status = bnplStatus;
        await finance.save();

        logger.info('[BNPLSync] Corrected status discrepancy', {
          bnplId,
          financeId: finance._id,
          oldStatus: finance.status,
          newStatus: bnplStatus,
        });
      }

      return { status: 'ok', bnplId, financeId: finance._id.toString() };
    } catch (err) {
      logger.error('[BNPLSync] Reconciliation error', {
        bnplId,
        error: (err as Error).message,
      });
      return {
        status: 'error',
        bnplId,
        message: (err as Error).message,
      };
    }
  }

  /**
   * Reconcile all active BNPL transactions
   */
  async reconcileAll(): Promise<ReconciliationReport> {
    // Get all active and recently active BNPL transactions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const bnplTransactions = await BNPLTransaction.find({
      status: { $in: ['ACTIVE', 'REPAID', 'DEFAULTED'] },
      createdAt: { $gte: thirtyDaysAgo },
    });

    logger.info('[BNPLSync] Starting reconciliation', {
      count: bnplTransactions.length,
    });

    const results = await Promise.all(
      bnplTransactions.map((t) => this.reconcile(t._id.toString()))
    );

    const report: ReconciliationReport = {
      total: results.length,
      ok: results.filter((r) => r.status === 'ok').length,
      reconciled: results.filter((r) => r.status === 'reconciled').length,
      discrepancies: results.filter((r) => r.status === 'discrepancy').length,
      errors: results.filter((r) => r.status === 'error').length,
      details: results,
    };

    logger.info('[BNPLSync] Reconciliation complete', {
      total: report.total,
      ok: report.ok,
      reconciled: report.reconciled,
      discrepancies: report.discrepancies,
      errors: report.errors,
    });

    return report;
  }

  /**
   * Map BNPL status to Finance status
   */
  private mapBNPLStatus(bnplStatus: string): 'pending' | 'completed' | 'failed' | 'refunded' {
    switch (bnplStatus) {
      case 'ACTIVE':
        return 'pending';
      case 'REPAID':
        return 'completed';
      case 'DEFAULTED':
        return 'failed';
      case 'CANCELLED':
        return 'refunded';
      default:
        return 'pending';
    }
  }
}

// Singleton instance
export const bnplSync = new BNPLSync();

// Cron job for nightly reconciliation
async function runNightlyBNPLReconciliation(): Promise<void> {
  logger.info('[BNPLSync] Starting nightly reconciliation');
  const startTime = Date.now();

  try {
    const report = await bnplSync.reconcileAll();
    const duration = Date.now() - startTime;

    logger.info('[BNPLSync] Nightly reconciliation complete', {
      durationMs: duration,
      ...report,
    });

    // Alert on critical issues
    if (report.discrepancies > 0) {
      logger.warn('[BNPLSync] Discrepancies detected', {
        count: report.discrepancies,
      });
    }

    if (report.errors > 0) {
      logger.error('[BNPLSync] Errors during reconciliation', {
        count: report.errors,
      });
    }
  } catch (err) {
    logger.error('[BNPLSync] Nightly reconciliation failed', {
      error: (err as Error).message,
    });
  }
}

/**
 * Start the BNPL sync cron job
 * Runs every night at 2:00 AM
 */
export function startBNPLSyncJob(): void {
  // Every night at 2:00 AM
  cron.schedule('0 2 * * *', runNightlyBNPLReconciliation);
  logger.info('[BNPLSync] Scheduled nightly reconciliation at 2:00 AM');
}
