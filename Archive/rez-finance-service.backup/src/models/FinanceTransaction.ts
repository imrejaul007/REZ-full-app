/**
 * Finance Transaction Model
 * FinanceTransactionType and FinanceTransactionStatus are inlined here
 * because @rez/shared-types is not published to npm.
 *
 * Canonical FinanceTransactionType enum (5 values):
 * - bnpl_payment: Buy Now Pay Later payment
 * - bill_payment: Bill payment
 * - recharge: Mobile recharge or similar
 * - emi_payment: EMI payment
 * - credit_card_payment: Credit card payment
 *
 * Canonical FinanceTransactionStatus enum (4 values):
 * - pending: transaction pending
 * - completed: transaction completed successfully
 * - failed: transaction failed
 * - refunded: transaction refunded
 */
import mongoose, { Document, Schema } from 'mongoose';

// Canonical FinanceTransactionType enum — exactly 5 values from @rez/shared-types
const FINANCE_TX_TYPES = ['bnpl_payment', 'bill_payment', 'recharge', 'emi_payment', 'credit_card_payment'] as const;
type FinanceTransactionType = typeof FINANCE_TX_TYPES[number];

// Canonical FinanceTransactionStatus enum — exactly 4 values from @rez/shared-types
const FINANCE_TX_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;
type FinanceTransactionStatus = typeof FINANCE_TX_STATUSES[number];

// Re-export as type aliases for backward compatibility
export type { FinanceTransactionType, FinanceTransactionStatus };

export type FinanceTxType = FinanceTransactionType;
export type FinanceTxStatus = FinanceTransactionStatus;

export interface IFinanceTransaction extends Document {
  userId: string;
  type: FinanceTxType;
  status: FinanceTxStatus;

  amount: number;
  currency: string;

  // Operator / biller details (for bill pay / recharge)
  operator?: string;
  billerId?: string;
  accountNumber?: string;        // mobile / CA number / FASTag

  // Linked entities
  loanApplicationId?: string;
  orderId?: string;

  // Partner / gateway
  partnerId: string;
  partnerTxId?: string;

  // Failure
  failureReason?: string;

  // Coins
  coinsAwarded: number;

  // BE-FIN-026: Explicit parent reference for linking to Payment/LoanApplication
  parentId?: string;
  parentType?: string;    // 'Payment' | 'LoanApplication' | 'Order'

  // BE-FIN-010: Typed metadata field with validation
  metadata?: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const FinanceTransactionSchema = new Schema<IFinanceTransaction>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      // 2026-04-16: Using canonical FinanceTransactionType enum values from shared-types
      enum: FINANCE_TX_TYPES,
      required: true,
    },
    status: {
      type: String,
      // 2026-04-16: Using canonical FinanceTransactionStatus enum values from shared-types
      enum: FINANCE_TX_STATUSES,
      default: 'pending',
      index: true,
    },
    // BE-FIN-013: Validate amount with paise precision (2 decimals)
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: (v: number) => v === Math.round(v * 100) / 100,
        message: 'Amount must have at most 2 decimal places (paise precision)',
      },
    },
    currency: { type: String, default: 'INR' },
    operator: { type: String },
    billerId: { type: String },
    accountNumber: { type: String },
    loanApplicationId: { type: String },
    orderId: { type: String },
    partnerId: { type: String, required: true },
    partnerTxId: { type: String },
    failureReason: { type: String },
    coinsAwarded: { type: Number, default: 0, min: 0 },
    // BE-FIN-026: Explicit parent reference
    parentId: { type: String },
    parentType: {
      type: String,
      enum: ['Payment', 'LoanApplication', 'Order', undefined],
    },
    // BE-FIN-010: Typed metadata field with validation
    metadata: {
      type: Schema.Types.Mixed,
      validate: {
        validator: function(v: any) {
          // Reject non-object metadata (primitives are not allowed)
          if (v !== undefined && v !== null && typeof v !== 'object') {
            return false;
          }
          // If object, ensure no undefined values
          if (v && typeof v === 'object') {
            for (const key in v) {
              if (v[key] === undefined) {
                return false;
              }
            }
          }
          return true;
        },
        message: 'Metadata must be an object with no undefined values',
      },
    },
    // BE-FIN-020: Validate timestamps
    createdAt: {
      type: Date,
      default: () => new Date(),
      validate: {
        validator: (v: Date) => v <= new Date(),
        message: 'createdAt cannot be in the future',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: any) {
        // Safety net: normalize legacy 'success' status to canonical 'completed'
        // for any pre-F-C6 documents still in the database.
        if (ret.status === 'success') {
          ret.status = 'completed';
        }
        return ret;
      },
    },
  },
);

// Legacy normalization: Any 'success' writes are normalized to 'completed' (canonical
// FinanceTransactionStatus value) before saving. This handles pre-F-C6 documents.
FinanceTransactionSchema.pre('save', function (next) {
  if ((this as any).status === 'success') {
    (this as any).status = 'completed';
  }
  next();
});

FinanceTransactionSchema.index({ userId: 1, createdAt: -1 });
FinanceTransactionSchema.index({ type: 1 });
FinanceTransactionSchema.index({ status: 1 });
FinanceTransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
FinanceTransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const FinanceTransaction = mongoose.model<IFinanceTransaction>('FinanceTransaction', FinanceTransactionSchema);
