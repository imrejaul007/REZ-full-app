/**
 * migrateAdminWalletLedger.ts
 *
 * One-time migration: moves legacy embedded AdminWallet.transactions entries
 * into the new AdminWalletLedger collection.
 *
 * Safe to run multiple times — duplicate orderId entries are skipped via the
 * E11000 unique-index guard on AdminWalletLedger.orderId.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrateAdminWalletLedger.ts
 *
 * Dry-run (no writes):
 *   DRY_RUN=true npx ts-node -r tsconfig-paths/register src/scripts/migrateAdminWalletLedger.ts
 */

import mongoose, { Schema, Types } from 'mongoose';
import { connectScriptDb, disconnectDb } from './connectDb';
import { AdminWalletLedger } from '../models/AdminWalletLedger';
import AdminWallet from '../models/AdminWallet';
import { logger } from '../config/logger';

// ─── Legacy schema (read-only; only used to pull the old embedded array) ────

interface ILegacyTransaction {
  _id: Types.ObjectId;
  type: 'commission' | 'adjustment';
  amount: number;
  orderId?: Types.ObjectId;
  orderNumber?: string;
  description: string;
  createdAt: Date;
}

interface ILegacyAdminWallet {
  _id: Types.ObjectId;
  singleton: boolean;
  balance: { total: number; available: number };
  statistics: { totalCommissions: number; totalOrders: number; averageCommission: number };
  transactions?: ILegacyTransaction[];
}

// Raw model — bypasses the current AdminWallet model so we can still read the
// (now-removed) `transactions` array from existing documents in the database.
const LegacyAdminWalletModel = mongoose.model<ILegacyAdminWallet>(
  'AdminWallet',
  new Schema(
    {
      singleton: Boolean,
      balance: Schema.Types.Mixed,
      statistics: Schema.Types.Mixed,
      transactions: [Schema.Types.Mixed],
    },
    { strict: false, collection: 'adminwallets' },
  ),
);

// ─── Main ────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  const isDryRun = process.env.DRY_RUN === 'true';

  if (isDryRun) {
    logger.info('🔍  DRY RUN — no documents will be written.\n');
  }

  await connectScriptDb();

  // Read the singleton wallet with its legacy embedded array.
  const wallet = await LegacyAdminWalletModel.findOne({ singleton: true }).lean();

  if (!wallet) {
    logger.info('⚠️  No AdminWallet document found. Nothing to migrate.');
    await disconnectDb();
    return;
  }

  const transactions: ILegacyTransaction[] = (wallet.transactions as ILegacyTransaction[]) ?? [];

  if (transactions.length === 0) {
    logger.info('✅  No legacy transactions found in AdminWallet. Migration not needed.');
    await disconnectDb();
    return;
  }

  logger.info(`📦  Found ${transactions.length} embedded transaction(s) to migrate.\n`);

  let inserted = 0;
  let skipped = 0;
  let errored = 0;

  for (const tx of transactions) {
    const ledgerDoc = {
      type: tx.type ?? 'commission',
      amount: tx.amount,
      orderId: tx.orderId,
      orderNumber: tx.orderNumber,
      description: tx.description ?? `Migrated from embedded wallet (type: ${tx.type})`,
      createdAt: tx.createdAt ?? new Date(),
    };

    if (isDryRun) {
      logger.info(`  [DRY RUN] Would insert:`, JSON.stringify(ledgerDoc, null, 2));
      inserted++;
      continue;
    }

    try {
      // Use insertOne via the model so Mongoose applies schema validation.
      // We pass `timestamps: false` via a workaround — the schema uses
      // `{ timestamps: { createdAt: true, updatedAt: false } }` but we want
      // to preserve the original `createdAt` from the embedded document.
      // We do this by writing to the raw collection directly so the original
      // timestamp is preserved faithfully.
      await AdminWalletLedger.collection.insertOne({
        ...ledgerDoc,
        _id: tx._id ?? new mongoose.Types.ObjectId(),
      });
      inserted++;
      process.stdout.write(`  ✅  Inserted tx ${String(tx._id)} (order: ${tx.orderNumber ?? 'N/A'})\n`);
    } catch (err: unknown) {
      const code = (err as any)?.code;
      if (code === 11000) {
        // Duplicate orderId — already exists in the ledger (idempotent run).
        skipped++;
        process.stdout.write(`  ⏭️   Skipped tx ${String(tx._id)} — orderId already in ledger (E11000)\n`);
      } else {
        errored++;
        logger.error(`  ❌  Failed to insert tx ${String(tx._id)}:`, err instanceof Error ? err.message : String(err));
      }
    }
  }

  logger.info('\n──────────────────────────────────');
  logger.info(`Migration complete${isDryRun ? ' (DRY RUN)' : ''}:`);
  logger.info(`  Inserted : ${inserted}`);
  logger.info(`  Skipped  : ${skipped}  (already in ledger)`);
  logger.info(`  Errors   : ${errored}`);
  logger.info('──────────────────────────────────\n');

  if (!isDryRun && errored === 0) {
    // Optionally unset the legacy transactions array from the wallet document
    // so the old data doesn't linger and cause confusion.
    await LegacyAdminWalletModel.updateOne({ singleton: true }, { $unset: { transactions: '' } });
    logger.info('🗑️   Legacy `transactions` array removed from AdminWallet document.\n');
  }

  if (errored > 0) {
    logger.warn(
      `⚠️  ${errored} transaction(s) failed to migrate. Re-run the script after investigating the errors above.`,
    );
    process.exit(1);
  }

  await disconnectDb();
  logger.info('Done. ✔');
}

run().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
