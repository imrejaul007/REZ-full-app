import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'free' | 'premium_monthly';
  status: 'active' | 'cancelled' | 'expired';
  startedAt: Date;
  renewsAt: Date;
  coinMultiplier: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'premium_monthly'],
      default: 'free',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    renewsAt: {
      type: Date,
      required: true,
    },
    coinMultiplier: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
    // TODO: strict: false — audit needed. See recovery plan DB-06.
    // Fields used by subscriptionController.ts that are NOT yet declared in this schema:
    //   - tier (string): subscription tier, e.g. 'prive', 'premium'
    //   - paymentMethod (string): e.g. 'razorpay', 'wallet'
    //   - razorpaySubscriptionId (string): Razorpay subscription reference
    // These must be added to the schema above before enabling strict: true.
    // Do NOT enable strict: true without a full audit of all reads/writes.
    strict: false,
  },
);

UserSubscriptionSchema.index({ userId: 1, status: 1 });

export const UserSubscription = mongoose.model<IUserSubscription>('UserSubscription', UserSubscriptionSchema);
