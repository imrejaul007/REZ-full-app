import { logger } from '../config/logger';
// UserCashback Model
// Manages user cashback earnings and redemptions

import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import redisService from '../services/redisService';

export interface ICashbackMetadata {
  orderAmount: number;
  productCategories: string[];
  storeId?: Types.ObjectId;
  storeName?: string;
  campaignId?: Types.ObjectId;
  campaignName?: string;
  bonusMultiplier?: number; // e.g., 2x cashback
}

export interface IUserCashback extends Document {
  user: Types.ObjectId;
  order?: Types.ObjectId;
  amount: number;
  cashbackRate: number; // percentage
  // Fixed: Add store_visit to cashback source enum - Phase 1.1
  source: 'order' | 'referral' | 'promotion' | 'special_offer' | 'bonus' | 'signup' | 'mall_purchase' | 'store_visit';
  status: 'pending' | 'credited' | 'expired' | 'cancelled' | 'processing' | 'reversed';
  earnedDate: Date;
  creditedDate?: Date;
  creditableAt?: Date; // Timestamp after which cashback is eligible for auto-credit (24h/48h hold)
  expiryDate: Date;
  description: string;
  transaction?: Types.ObjectId; // Wallet transaction reference
  metadata: ICashbackMetadata;
  pendingDays: number; // Days before credit (usually 7-14 days)
  isRedeemed: boolean;
  redeemedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  /** Credit this cashback entry to the user's wallet. Throws if not in 'pending' status. */
  creditToWallet(): Promise<void>;
}

const CashbackMetadataSchema = new Schema<ICashbackMetadata>(
  {
    orderAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    productCategories: [
      {
        type: String,
      },
    ],
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
    },
    storeName: {
      type: String,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    campaignName: {
      type: String,
    },
    bonusMultiplier: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false },
);

const UserCashbackSchema = new Schema<IUserCashback>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    cashbackRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100, // percentage
    },
    source: {
      type: String,
      // Fixed: Add store_visit to cashback source enum - Phase 1.1
      enum: ['order', 'referral', 'promotion', 'special_offer', 'bonus', 'signup', 'mall_purchase', 'store_visit'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'credited', 'expired', 'cancelled', 'processing', 'reversed'],
      default: 'pending',
      index: true,
    },
    earnedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    creditedDate: {
      type: Date,
    },
    creditableAt: {
      type: Date,
      index: true, // indexed for efficient cron query: status='pending' AND creditableAt <= now
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    metadata: {
      type: CashbackMetadataSchema,
      required: true,
    },
    pendingDays: {
      type: Number,
      default: 3,
      min: 0,
    },
    isRedeemed: {
      type: Boolean,
      default: false,
    },
    redeemedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes
UserCashbackSchema.index({ user: 1, status: 1 });
UserCashbackSchema.index({ user: 1, expiryDate: 1 });
UserCashbackSchema.index({ status: 1, expiryDate: 1 });
UserCashbackSchema.index({ earnedDate: -1 });
UserCashbackSchema.index({ order: 1, user: 1 }, { unique: true, sparse: true });

// LS-D005 FIX: Missing compound index for getPendingReadyForCredit() hot path.
//
// QUERY PATTERN (Scenario A — 2000 concurrent reward issuances):
//   UserCashback.find({ user, status: 'pending', expiryDate: { $gt: now } })
//
// Without this index MongoDB performs a collection scan filtered by the
// { user: 1, status: 1 } index — which returns ALL statuses for the user and
// then filters in memory for status='pending' AND expiryDate > now.
// Under 2000-user burst this scan runs 2000 times in parallel; each touches
// potentially thousands of documents, spiking CPU and IOPS.
//
// The partial filter expression restricts the index to pending+non-expired docs
// only, keeping the index small and the scan fast.
UserCashbackSchema.index(
  { user: 1, expiryDate: 1 },
  {
    partialFilterExpression: { status: 'pending' },
    name: 'pending_by_user_expiry_idx',
  },
);

// LS-D006 FIX: Missing index for markExpiredCashback() bulk update.
// Query: { status: { $in: ['pending'] }, expiryDate: { $lt: now } }
// Without an index this is a full collection scan every time the scheduled job runs.
UserCashbackSchema.index(
  { expiryDate: 1 },
  {
    partialFilterExpression: { status: 'pending' },
    name: 'pending_expiry_sweep_idx',
  },
);

UserCashbackSchema.index({ status: 1, creditableAt: 1 }); // cashback cron job query
UserCashbackSchema.index({ user: 1, status: 1, creditableAt: 1 }); // per-user pending cashback

// Virtual for days until expiry
UserCashbackSchema.virtual('daysUntilExpiry').get(function (this: IUserCashback) {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for days until credit
UserCashbackSchema.virtual('daysUntilCredit').get(function (this: IUserCashback) {
  if (this.status !== 'pending') return 0;

  const now = new Date();
  const creditDate = new Date(this.earnedDate);
  creditDate.setDate(creditDate.getDate() + this.pendingDays);
  const diff = creditDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual for is expiring soon (within 7 days)
UserCashbackSchema.virtual('isExpiringSoon').get(function (this: IUserCashback) {
  const daysLeft = (this as any).daysUntilExpiry;
  return daysLeft > 0 && daysLeft <= 7;
});

// Virtual for is expired
UserCashbackSchema.virtual('isExpired').get(function (this: IUserCashback) {
  return new Date() > new Date(this.expiryDate);
});

// Instance method to update cashback document fields after wallet credit.
//
// CB-FIX-001: This method ONLY updates the document's status fields.
// The ACTUAL wallet credit (rewardEngine.issue) is performed by the SERVICE layer
// (cashbackService.creditCashbackToWallet) which atomically claims the record
// first (pending → processing) before calling this.  Never call this method
// directly for a full credit — always go through the service.
//
// Status guard accepts 'pending' OR 'processing' because the service atomically
// moves to 'processing' before calling here.
UserCashbackSchema.methods.creditToWallet = async function () {
  if (this.status !== 'pending' && this.status !== 'processing') {
    throw new Error(`Cashback cannot be credited from status '${this.status}'`);
  }

  // Check if expired (only relevant on direct pending calls)
  if (this.isExpired) {
    this.status = 'expired';
    await this.save();
    throw new Error('Cashback has expired');
  }

  // Update document fields — the wallet credit itself is handled by the caller
  this.status = 'credited';
  this.creditedDate = new Date();
  this.isRedeemed = true;
  this.redeemedAt = new Date();
  await this.save();

  // Invalidate earnings cache (pending→credited)
  try {
    await redisService.delPattern(`earnings:consolidated:${this.user.toString()}:*`);
  } catch (_e) {
    logger.warn('[CASHBACK] Failed to invalidate earnings cache after credit', { userId: this.user?.toString() });
  }

  logger.info(`[CASHBACK] Document status set to credited for ₹${this.amount}, user ${this.user}`);
};

// Instance method to mark as expired
UserCashbackSchema.methods.markAsExpired = async function () {
  this.status = 'expired';
  await this.save();

  // Invalidate earnings cache (pending amount changed)
  try {
    await redisService.delPattern(`earnings:consolidated:${this.user.toString()}:*`);
  } catch (_e) {
    logger.warn('[CASHBACK] Failed to invalidate earnings cache on expiry', { userId: this.user?.toString() });
  }

  logger.info(`⏰ [CASHBACK] Cashback ₹${this.amount} marked as expired`);
};

// Instance method to cancel cashback
UserCashbackSchema.methods.cancelCashback = async function (reason?: string) {
  if (this.status === 'credited') {
    throw new Error('Cannot cancel credited cashback');
  }

  this.status = 'cancelled';
  await this.save();

  // Invalidate earnings cache (pending amount changed)
  try {
    await redisService.delPattern(`earnings:consolidated:${this.user.toString()}:*`);
  } catch (_e) {
    logger.warn('[CASHBACK] Failed to invalidate earnings cache on cancellation', { userId: this.user?.toString() });
  }

  logger.info(`❌ [CASHBACK] Cashback ₹${this.amount} cancelled: ${reason || 'No reason provided'}`);
};

// Static method to get user's cashback summary
UserCashbackSchema.statics.getUserSummary = async function (userId: Types.ObjectId) {
  const summary = await this.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    totalEarned: 0,
    pending: 0,
    credited: 0,
    expired: 0,
    cancelled: 0,
    reversed: 0,
    pendingCount: 0,
    creditedCount: 0,
    expiredCount: 0,
    cancelledCount: 0,
    reversedCount: 0,
  };

  summary.forEach((item: any) => {
    if (item._id === 'pending') {
      result.pending = item.totalAmount;
      result.pendingCount = item.count;
    } else if (item._id === 'credited') {
      result.credited = item.totalAmount;
      result.creditedCount = item.count;
    } else if (item._id === 'expired') {
      result.expired = item.totalAmount;
      result.expiredCount = item.count;
    } else if (item._id === 'cancelled') {
      result.cancelled = item.totalAmount;
      result.cancelledCount = item.count;
    } else if (item._id === 'reversed') {
      result.reversed = item.totalAmount;
      result.reversedCount = item.count;
    }
  });

  result.totalEarned = result.pending + result.credited + result.expired + result.cancelled + result.reversed;

  return result;
};

// Static method to get pending cashback ready for credit
UserCashbackSchema.statics.getPendingReadyForCredit = async function (userId: Types.ObjectId) {
  const now = new Date();

  return this.find({
    user: userId,
    status: 'pending',
    expiryDate: { $gt: now },
  }).then((cashbacks: IUserCashback[]) => {
    return cashbacks.filter((cb) => {
      const earnedDate = new Date(cb.earnedDate);
      const daysSinceEarned = Math.floor((now.getTime() - earnedDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceEarned >= cb.pendingDays;
    });
  });
};

// Static method to get expiring soon cashback
UserCashbackSchema.statics.getExpiringSoon = async function (userId: Types.ObjectId, days: number = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    user: userId,
    status: { $in: ['pending', 'credited'] },
    expiryDate: { $gt: now, $lte: futureDate },
  })
    .sort({ expiryDate: 1 })
    .lean();
};

// Static method to mark expired cashback
UserCashbackSchema.statics.markExpiredCashback = async function () {
  const now = new Date();

  const result = await this.updateMany(
    {
      status: { $in: ['pending'] },
      expiryDate: { $lt: now },
    },
    {
      $set: { status: 'expired' },
    },
  );

  logger.info(`⏰ [CASHBACK] Marked ${result.modifiedCount} cashback entries as expired`);
  return result.modifiedCount;
};

// Static method to get cashback by source
UserCashbackSchema.statics.getCashbackBySource = async function (userId: Types.ObjectId, source: string) {
  return this.find({
    user: userId,
    source,
  })
    .sort({ earnedDate: -1 })
    .lean();
};

// Static method to calculate total cashback for period
UserCashbackSchema.statics.getTotalForPeriod = async function (userId: Types.ObjectId, startDate: Date, endDate: Date) {
  const result = await this.aggregate([
    {
      $match: {
        user: userId,
        earnedDate: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0
    ? { totalAmount: result[0].totalAmount, count: result[0].count }
    : { totalAmount: 0, count: 0 };
};

// Pre-save hook to set expiry date if not provided
UserCashbackSchema.pre('save', function (next) {
  if (!this.expiryDate && this.isNew) {
    // Default: 90 days from earned date
    const expiry = new Date(this.earnedDate);
    expiry.setDate(expiry.getDate() + 90);
    this.expiryDate = expiry;
  }
  next();
});

/** Static methods available on the UserCashback model */
export interface IUserCashbackModel extends Model<IUserCashback> {
  getUserSummary(userId: Types.ObjectId): Promise<{
    totalEarned: number;
    pending: number;
    credited: number;
    expired: number;
    cancelled: number;
    reversed: number;
    pendingCount: number;
    creditedCount: number;
    expiredCount: number;
    cancelledCount: number;
    reversedCount: number;
  }>;
  getPendingReadyForCredit(userId: Types.ObjectId): Promise<IUserCashback[]>;
  getExpiringSoon(userId: Types.ObjectId, days?: number): Promise<IUserCashback[]>;
  markExpiredCashback(): Promise<number>;
  getTotalForPeriod(
    userId: Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<{ totalAmount: number; count: number }>;
  getCashbackBySource(userId: Types.ObjectId, source: string): Promise<IUserCashback[]>;
}

export const UserCashback = mongoose.model<IUserCashback, IUserCashbackModel>('UserCashback', UserCashbackSchema);
