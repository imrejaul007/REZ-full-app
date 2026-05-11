import mongoose, { Schema } from 'mongoose';

// Canonical source: @rez/shared-types/enums/coinType - keep in sync
// coinType enum values must match CoinType from shared-types.
//
// Shared collection: cointransactions is also written by rez-backend.
// merchant service reads/writes via coins.ts. Merchant ref is stored at
// metadata.storeId (not top-level merchantId) for rez-backend compatibility.
//
// C1-FIX: Added coinType, source (required by backend schema). Retained coins
// as alias alongside amount; pre-save hook keeps them in sync so existing
// merchant code that writes `coins` still produces a valid backend document.
const s = new Schema(
  {
    user: { type: Schema.Types.Mixed },
    merchantId: { type: Schema.Types.Mixed },
    storeId: { type: Schema.Types.Mixed },
    // Required by backend shared schema
    coinType: {
      type: String,
      enum: ['rez', 'prive', 'branded', 'promo', 'cashback', 'referral'],
      default: 'rez',
    },
    source: {
      type: String,
      default: 'merchant_award',
    },
    type: { type: String },
    amount: { type: Number },
    // Legacy alias — pre-save hook syncs amount ← coins when coins is set
    coins: { type: Number },
    description: { type: String, default: 'Merchant coin award' },
    orderId: { type: Schema.Types.Mixed },
    status: { type: String },
    expiresAt: { type: Date },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);

// Sync legacy `coins` field → `amount` so backend validators always see `amount`.
s.pre('save', function (next) {
  if (this.isModified('coins') && this.coins != null && this.amount == null) {
    this.amount = this.coins;
  }
  next();
});
s.index({ 'metadata.storeId': 1, createdAt: -1 }, { sparse: true });
s.index({ user: 1, createdAt: -1 });
s.index({ merchantId: 1, createdAt: -1 });
s.index({ merchantId: 1, status: 1 });
s.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const CoinTransaction = mongoose.models.CoinTransaction || mongoose.model('CoinTransaction', s, 'cointransactions');
