/**
 * Canonical types: @rez/shared-types/entities/wallet
 * MIGRATED: Using enums from @rez/shared-types (aligned, Feb 2026)
 *
 * Canonical CoinTransactionType enum (6 values):
 * - earned: coins earned from transactions
 * - spent: coins spent in transactions
 * - expired: coins expired
 * - refunded: coins refunded
 * - bonus: bonus coins awarded
 * - branded_award: branded coin award
 *
 * Canonical CoinType enum (6 values):
 * - rez, prive, branded, promo, cashback, referral
 *
 * Canonical TransactionStatus enum (3 values):
 * - completed: transaction completed successfully
 * - pending: transaction pending
 * - failed: transaction failed
 */
import mongoose, { Schema, Document, Types } from 'mongoose';
import { CoinType, CoinTransactionType, TransactionStatus } from '@rez/shared-types';

// Get all enum values as string arrays
const COIN_TRANSACTION_TYPE_VALUES: string[] = Object.values(CoinTransactionType);
const COIN_TYPE_VALUES: string[] = Object.values(CoinType);
const TRANSACTION_STATUS_VALUES: string[] = Object.values(TransactionStatus);
// MIGRATED: Using CoinType, CoinTransactionType, TransactionStatus from @rez/shared-types

export interface ICoinTransaction extends Document {
  user: Types.ObjectId;
  // Canonical CoinTransactionType from @rez/shared-types
  type: CoinTransactionType;
  // Canonical CoinType from @rez/shared-types
  coinType: CoinType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  source: string;
  sourceId?: string;
  description: string;
  merchantId?: Types.ObjectId;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
  // Canonical TransactionStatus from @rez/shared-types
  status: TransactionStatus;
  // DB-HEALTH-010: Soft delete field
  deletedAt?: Date;
  createdAt: Date;
}

const CoinTransactionSchema = new Schema<ICoinTransaction>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: COIN_TRANSACTION_TYPE_VALUES, required: true },
    coinType: { type: String, enum: COIN_TYPE_VALUES, required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    source: { type: String, required: true },
    sourceId: String,
    description: { type: String, required: true },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant' },
    metadata: Schema.Types.Mixed,
    idempotencyKey: { type: String },
    // DB-HEALTH-010: Soft delete field
    deletedAt: Date,
    status: { type: String, enum: TRANSACTION_STATUS_VALUES, default: TransactionStatus.COMPLETED },
  },
  { timestamps: true },
);

CoinTransactionSchema.index({ user: 1, createdAt: -1 });
CoinTransactionSchema.index({ user: 1, coinType: 1, createdAt: -1 });
CoinTransactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
CoinTransactionSchema.index({ sourceId: 1 });
CoinTransactionSchema.index({ type: 1 });
CoinTransactionSchema.index({ status: 1 });
CoinTransactionSchema.index({ user: 1, type: 1, createdAt: -1 });

// DB-HEALTH-009: Index for merchant transaction history queries
CoinTransactionSchema.index({ merchantId: 1, createdAt: -1 });
CoinTransactionSchema.index({ merchantId: 1, status: 1, createdAt: -1 });

// DB-HEALTH-010: Soft delete index
CoinTransactionSchema.index({ deletedAt: 1 });

export const CoinTransaction = mongoose.model<ICoinTransaction>('CoinTransaction', CoinTransactionSchema);
