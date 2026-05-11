import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true, index: true },
    storeId: { type: Schema.Types.Mixed },
    code: { type: String },
    initialBalance: { type: Number },
    balance: { type: Number },
    status: { type: String, default: 'active' },
    expiresAt: { type: Date },
    recipientEmail: { type: String },
    recipientName: { type: String },
    message: { type: String },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1 });
s.index({ code: 1 }, { unique: true, sparse: true });
s.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const GiftCard = mongoose.models.GiftCard || mongoose.model('GiftCard', s, 'giftcards');
