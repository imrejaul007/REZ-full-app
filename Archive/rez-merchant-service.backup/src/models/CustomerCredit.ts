import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    customerPhone: { type: String, required: true },
    customerName: { type: String },
    balance: { type: Number, default: 0, min: 0 },
    transactions: { type: [Schema.Types.Mixed], default: [] },
    lastActivityAt: { type: Date },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1, customerPhone: 1 });
s.index({ merchantId: 1, storeId: 1 });
export const CustomerCredit = mongoose.models.CustomerCredit || mongoose.model('CustomerCredit', s, 'customercredits');
