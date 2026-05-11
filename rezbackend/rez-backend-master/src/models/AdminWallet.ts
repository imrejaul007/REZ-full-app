import mongoose, { Schema, Document, Types } from 'mongoose';
import { logger } from '../config/logger';
import { AdminWalletLedger } from './AdminWalletLedger';

// Admin Wallet Model
// Singleton wallet for platform commission tracking (5% of order subtotals).
//
// CHANGE LOG
// ----------
// • `transactions` embedded array REMOVED.  All transaction history is now
//   stored in the separate `AdminWalletLedger` collection (see AdminWalletLedger.ts).
//   This prevents the 16 MB document-size limit being hit at high order volumes
//   and makes sorting/filtering/pagination DB-level rather than in Node memory.
//
// • `creditCommission` now uses a MongoDB session transaction so that the ledger
//   insert and the balance $inc are always consistent; if either step fails the
//   whole operation rolls back.
//
// • `getOrCreate` now uses findOneAndUpdate + upsert so concurrent cold starts
//   cannot both create a wallet simultaneously (race → duplicate-key error).
//
// • Commission calculation uses integer-safe rounding to avoid JS float drift
//   (e.g. 999 * 0.05 = 49.95000000000001 ≠ 49 under plain Math.floor).

export interface IAdminWallet extends Document {
  singleton: boolean;
  balance: {
    total: number;
    available: number;
  };
  statistics: {
    totalCommissions: number;
    totalOrders: number;
    averageCommission: number;
  };

  // Instance methods
  creditCommission(orderId: Types.ObjectId, orderNumber: string, amount: number): Promise<IAdminWallet>;
}

export interface IAdminWalletModel extends mongoose.Model<IAdminWallet> {
  getOrCreate(): Promise<IAdminWallet>;
}

const AdminWalletSchema = new Schema<IAdminWallet>(
  {
    singleton: {
      type: Boolean,
      default: true,
      unique: true,
    },
    balance: {
      total: { type: Number, default: 0, min: 0 },
      available: { type: Number, default: 0, min: 0 },
    },
    statistics: {
      totalCommissions: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      averageCommission: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ─── creditCommission ────────────────────────────────────────────────────────
//
// Atomic, idempotent commission credit.
//
// Idempotency mechanism:
//   AdminWalletLedger has a sparse unique index on `orderId`.  Attempting to
//   insert the same orderId twice throws a Mongo E11000 duplicate-key error,
//   which we catch and treat as "already processed" — identical to the previous
//   $ne guard, but enforced at the DB level rather than in application code.
//
// Atomicity:
//   A MongoDB session transaction wraps both the ledger insert and the wallet
//   $inc.  If either step throws, the transaction rolls back automatically.
//
AdminWalletSchema.methods.creditCommission = async function (
  orderId: Types.ObjectId,
  orderNumber: string,
  amount: number,
): Promise<IAdminWallet> {
  const AdminWalletModel = mongoose.model<IAdminWallet, IAdminWalletModel>('AdminWallet');

  const session = await mongoose.startSession();
  try {
    let result: IAdminWallet | null = null;

    await session.withTransaction(async () => {
      // Step 1: Insert ledger entry.  The sparse unique index on orderId
      // causes this to throw E11000 for a duplicate — we catch that below.
      await AdminWalletLedger.create(
        [
          {
            type: 'commission',
            amount,
            orderId,
            orderNumber,
            description: `5% commission from order ${orderNumber}`,
          },
        ],
        { session },
      );

      // Step 2: Atomically update balance and statistics.
      const updated = await AdminWalletModel.findOneAndUpdate(
        { singleton: true },
        {
          $inc: {
            'balance.total': amount,
            'balance.available': amount,
            'statistics.totalCommissions': amount,
            'statistics.totalOrders': 1,
          },
        },
        { new: true, session },
      );

      if (!updated) {
        throw new Error('[AdminWallet] Singleton wallet not found during creditCommission');
      }

      // Recompute average (integer division — no float risk)
      const avgCommission =
        updated.statistics.totalOrders > 0
          ? Math.round(updated.statistics.totalCommissions / updated.statistics.totalOrders)
          : 0;

      result = await AdminWalletModel.findOneAndUpdate(
        { singleton: true },
        { $set: { 'statistics.averageCommission': avgCommission } },
        { new: true, session },
      );
    });

    return result!;
  } catch (err: unknown) {
    // E11000 = duplicate key — this orderId has already been credited.  Treat
    // as a no-op and return the current wallet state.
    const code = (err as any)?.code ?? (err as any)?.cause?.code;
    if (code === 11000) {
      logger.warn('[ADMIN WALLET] creditCommission: duplicate orderId, skipping', {
        orderId: orderId.toString(),
        orderNumber,
      });
      const current = await AdminWalletModel.findOne({ singleton: true });
      if (!current) throw new Error('[AdminWallet] Singleton wallet not found after duplicate-key skip');
      return current;
    }
    logger.error('[ADMIN WALLET] creditCommission failed', {
      message: err instanceof Error ? err.message : String(err),
      orderId: orderId.toString(),
      orderNumber,
    });
    throw err;
  } finally {
    await session.endSession();
  }
};

// ─── getOrCreate ─────────────────────────────────────────────────────────────
//
// FIX: Was read-then-create, which had a race condition — two concurrent cold
// starts could both find no wallet and both call create(), the second throwing
// a duplicate-key error that wasn't handled.
//
// Now uses findOneAndUpdate + upsert: true which is a single atomic operation.
// The first caller creates the document; subsequent callers simply fetch it.
//
AdminWalletSchema.statics.getOrCreate = async function (): Promise<IAdminWallet> {
  const wallet = await this.findOneAndUpdate(
    { singleton: true },
    {
      $setOnInsert: {
        singleton: true,
        balance: { total: 0, available: 0 },
        statistics: { totalCommissions: 0, totalOrders: 0, averageCommission: 0 },
      },
    },
    { upsert: true, new: true },
  );
  return wallet!;
};

const AdminWallet = mongoose.model<IAdminWallet, IAdminWalletModel>('AdminWallet', AdminWalletSchema);

export default AdminWallet;
