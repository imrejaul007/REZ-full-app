import mongoose, { Schema } from 'mongoose';

// Shared collection: wallettransactions is also written by rez-wallet-service.
// Fields here reflect what rez-merchant-service reads/writes via walletMerchant.ts.
const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true, index: true },
    type: { type: String },
    amount: {
      type: Number,
      validate: {
        validator: (v: number) => Number.isFinite(v) && Math.round(v * 100) / 100 === v,
        message: 'Amount must have at most 2 decimal places',
      },
    },
    status: { type: String },
    description: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, createdAt: -1 });
// DM-M5 fix: walletMerchant.ts queries { merchantId, type } — compound index prevents full scan
s.index({ merchantId: 1, type: 1 });
export const WalletTransaction = mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', s, 'wallettransactions');
