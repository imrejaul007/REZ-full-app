import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    name: { type: String },
    description: { type: String },
    price: { type: Number },
    billingCycle: { type: String },
    features: { type: [Schema.Types.Mixed] },
    isActive: { type: Boolean },
    maxMembers: { type: Number },
    trialDays: { type: Number },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1 });
export const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', s, 'subscriptions');
