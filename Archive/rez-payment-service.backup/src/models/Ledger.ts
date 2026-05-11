/**
 * Ledger model for financial reconciliation.
 * Records all credit/debit transactions for settlement reconciliation.
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ILedger extends Document {
  merchantId?: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  date: Date;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerSchema = new Schema<ILedger>(
  {
    merchantId: { type: String, index: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    date: { type: Date, required: true, index: true },
    reference: { type: String },
    description: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Compound index for efficient date-range queries
LedgerSchema.index({ date: 1, type: 1 });
LedgerSchema.index({ merchantId: 1, date: 1 });

export const Ledger = mongoose.model<ILedger>('Ledger', LedgerSchema);
