import mongoose from 'mongoose';
import { logger } from '../config/logger';

/**
 * DP-D001 FIX — Transaction retry for TransientTransactionError / UnknownTransactionCommitResult.
 *
 * PROBLEM (before this fix):
 *   session.withTransaction() used Mongoose's built-in retry loop, but our wrapper
 *   only caught replica-set-unavailable errors. It did NOT handle the two retryable
 *   error labels MongoDB surfaces during a primary stepdown:
 *     - TransientTransactionError  (code 112 / 91 / 10107 / 13435 / 251)
 *       → the entire transaction body must be retried from scratch.
 *     - UnknownTransactionCommitResult (code 50)
 *       → only the commitTransaction call must be retried; the business logic
 *          has already been applied and must NOT run again.
 *
 *   Without explicit handling, a wallet debit or order creation that hits a
 *   primary stepdown mid-transaction silently threw MongoServerError to the
 *   caller, which returned a 500 to the client. The operation was NOT retried,
 *   leaving the system in an inconsistent state (e.g., wallet debited but no
 *   CoinTransaction record, or order document not written).
 *
 * FIX:
 *   Implement the exact retry algorithm recommended in the MongoDB docs:
 *     https://www.mongodb.com/docs/manual/core/transactions-in-applications/
 *   - TransientTransactionError → abort + retry the entire transaction body
 *     (up to MAX_TRANSIENT_RETRIES times with exponential back-off).
 *   - UnknownTransactionCommitResult → retry commitTransaction only
 *     (up to MAX_COMMIT_RETRIES times).
 *   - All other errors are re-thrown immediately.
 *
 * WRITE CONCERN NOTE:
 *   The global database config already sets `w: 'majority'`, `journal: true`.
 *   Transactions inherit the session's write concern; we explicitly set
 *   `{ w: 'majority', j: true }` on startTransaction() to be defence-in-depth
 *   against any future connection-string change.
 */

const MAX_TRANSIENT_RETRIES = 3;
const MAX_COMMIT_RETRIES = 5;

function isTransientTransactionError(err: any): boolean {
  // MongoDB sets the 'TransientTransactionError' error label on errors that
  // indicate the entire transaction body should be retried.
  if (Array.isArray(err.errorLabels) && err.errorLabels.includes('TransientTransactionError')) {
    return true;
  }
  // Also catch well-known codes that signal primary stepdown / not-primary errors
  // before the driver has labelled them (older driver versions).
  const TRANSIENT_CODES = new Set([112, 91, 10107, 13435, 251, 189]);
  if (TRANSIENT_CODES.has(err.code)) return true;
  return false;
}

function isUnknownTransactionCommitResult(err: any): boolean {
  if (Array.isArray(err.errorLabels) && err.errorLabels.includes('UnknownTransactionCommitResult')) {
    return true;
  }
  // MaxTimeMSExpired is also retryable on commit
  if (err.code === 50) return true;
  return false;
}

async function commitWithRetry(session: mongoose.ClientSession): Promise<void> {
  let attempt = 0;
  while (true) {
    try {
      await session.commitTransaction();
      return;
    } catch (err: any) {
      attempt++;
      if (isUnknownTransactionCommitResult(err) && attempt < MAX_COMMIT_RETRIES) {
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 2000);
        logger.warn('[withTransaction] UnknownTransactionCommitResult — retrying commit', {
          attempt,
          delayMs: delay,
          code: err.code,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Execute a callback within a MongoDB transaction — STRICT mode.
 * NEVER falls back to no-transaction mode. Use this for financial operations
 * (wallet credits/debits, payments, settlements) where partial writes
 * would cause data corruption or money loss.
 *
 * Throws immediately if a session cannot be started or transactions are unavailable.
 */
export async function withRequiredTransaction<T>(
  callback: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  let session: mongoose.ClientSession;
  try {
    session = await mongoose.startSession();
  } catch (startErr: any) {
    logger.error('[withRequiredTransaction] Could not start session — aborting financial operation', {
      error: startErr.message,
    });
    throw Object.assign(new Error('Database transaction unavailable — cannot proceed with financial operation.'), {
      code: 'TRANSACTION_UNAVAILABLE',
      statusCode: 503,
      retryable: true,
    });
  }

  let transientAttempt = 0;
  while (true) {
    session.startTransaction({
      writeConcern: { w: 'majority', j: true },
      readConcern: { level: 'snapshot' },
    });

    try {
      const result = await callback(session);
      await commitWithRetry(session);
      session.endSession();
      return result;
    } catch (err: any) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        logger.warn('[withRequiredTransaction] abortTransaction error (ignored)', { error: (abortErr as any).message });
      }

      transientAttempt++;
      if (isTransientTransactionError(err) && transientAttempt < MAX_TRANSIENT_RETRIES) {
        const delay = Math.min(100 * Math.pow(2, transientAttempt - 1), 2000);
        logger.warn('[withRequiredTransaction] TransientTransactionError — retrying', {
          attempt: transientAttempt,
          delayMs: delay,
          code: err.code,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      session.endSession();

      // Unlike withTransaction, we do NOT fall back to no-transaction mode.
      // If transactions are not available, the operation must fail.
      if (
        err.message?.includes('Transaction') ||
        err.message?.includes('replica set') ||
        err.codeName === 'IllegalOperation' ||
        err.code === 263 ||
        err.code === 20
      ) {
        logger.error('[withRequiredTransaction] MongoDB transactions not available — financial operation ABORTED');
        throw Object.assign(new Error('Database transactions required but not available. Financial operation aborted.'), {
          code: 'TRANSACTION_UNAVAILABLE',
          statusCode: 503,
          retryable: true,
        });
      }

      throw err;
    }
  }
}

/**
 * Execute a callback within a MongoDB transaction with full stepdown-safe retry logic.
 *
 * Falls back to running without a transaction if replica set is not available
 * (preserves existing behaviour for local development / single-node deployments).
 *
 * WARNING: Do NOT use this for financial operations (wallet, payment, settlement).
 * Use withRequiredTransaction instead.
 */
export async function withTransaction<T>(
  callback: (session: mongoose.ClientSession | null) => Promise<T>,
): Promise<T> {
  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
  } catch (startErr: any) {
    logger.warn('[withTransaction] Could not start session — falling back to no-transaction mode', {
      error: startErr.message,
    });
    return callback(null);
  }

  let transientAttempt = 0;
  while (true) {
    // DP-D001: Explicitly set w:majority + journal on every transaction so the
    // write concern is not affected by connection-string changes.
    session.startTransaction({
      writeConcern: { w: 'majority', j: true },
      readConcern: { level: 'snapshot' },
    });

    try {
      const result = await callback(session);
      await commitWithRetry(session);
      session.endSession();
      return result;
    } catch (err: any) {
      // Always abort before deciding to retry or rethrow
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Abort errors are not actionable — log and continue
        logger.warn('[withTransaction] abortTransaction error (ignored)', { error: (abortErr as any).message });
      }

      transientAttempt++;
      if (isTransientTransactionError(err) && transientAttempt < MAX_TRANSIENT_RETRIES) {
        const delay = Math.min(100 * Math.pow(2, transientAttempt - 1), 2000);
        logger.warn('[withTransaction] TransientTransactionError — retrying entire transaction body', {
          attempt: transientAttempt,
          delayMs: delay,
          code: err.code,
          codeName: err.codeName,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue; // retry the whole transaction body
      }

      session.endSession();

      // Replica-set-unavailable fallback (preserves existing behaviour for dev)
      if (
        err.message?.includes('Transaction') ||
        err.message?.includes('replica set') ||
        err.codeName === 'IllegalOperation' ||
        err.code === 263 ||
        err.code === 20
      ) {
        logger.warn('[withTransaction] MongoDB transactions not available (no replica set?). Running without transaction.');
        return callback(null);
      }

      throw err;
    }
  }
}
