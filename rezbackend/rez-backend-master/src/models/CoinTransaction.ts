import mongoose, { Schema, Document, Model } from 'mongoose';
import * as crypto from 'crypto';
import redisService from '../services/redisService';
import { logger } from '../config/logger';
import { CoinType, COIN_TYPE_VALUES } from '../constants/coinTypes';

export type MainCategorySlug =
  | 'food-dining'
  | 'beauty-wellness'
  | 'grocery-essentials'
  | 'fitness-sports'
  | 'healthcare'
  | 'fashion'
  | 'education-learning'
  | 'home-services'
  | 'travel-experiences'
  | 'entertainment'
  | 'financial-lifestyle'
  | 'electronics';

export interface ICoinTransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: 'earned' | 'spent' | 'expired' | 'refunded' | 'bonus' | 'branded_award';
  amount: number;
  balance: number; // Balance after transaction (legacy snapshot — kept for backward compat)
  coinType: CoinType;
  balanceBefore: number;
  balanceAfter: number;
  source:
    | 'spin_wheel'
    | 'scratch_card'
    | 'quiz_game'
    | 'challenge'
    | 'achievement'
    | 'referral'
    | 'order'
    | 'review'
    | 'bill_upload'
    | 'daily_login'
    | 'admin'
    | 'purchase'
    | 'redemption'
    | 'expiry'
    | 'survey'
    | 'memory_match'
    | 'coin_hunt'
    | 'guess_price'
    | 'purchase_reward'
    | 'social_share_reward'
    | 'merchant_award'
    | 'cashback'
    | 'creator_pick_reward'
    | 'poll_vote'
    | 'photo_upload'
    | 'offer_comment'
    | 'event_rating'
    | 'ugc_reel'
    | 'social_impact_reward'
    | 'program_task_reward'
    | 'program_multiplier_bonus'
    | 'event_booking'
    | 'event_checkin'
    | 'event_participation'
    | 'event_sharing'
    | 'event_entry'
    | 'event_review'
    | 'bonus_campaign'
    | 'tournament_prize'
    | 'tournament_entry'
    | 'tournament_refund'
    | 'challenge_reward'
    | 'learning_reward'
    | 'leaderboard_prize'
    | 'smart_spend_reward'
    | 'prive_invite_reward'
    | 'recharge'
    | 'transfer'
    | 'withdrawal';
  description: string;
  category?: MainCategorySlug | null; // MainCategory this transaction belongs to
  metadata?: {
    gameId?: mongoose.Types.ObjectId;
    achievementId?: mongoose.Types.ObjectId;
    challengeId?: mongoose.Types.ObjectId;
    orderId?: mongoose.Types.ObjectId;
    referralId?: mongoose.Types.ObjectId;
    productId?: mongoose.Types.ObjectId;
    voucherId?: mongoose.Types.ObjectId;
    [key: string]: any;
  };
  idempotencyKey?: string;
  expiresAt?: Date;
  sixHourWarningSent?: boolean;
  twentyFourHourWarningSent?: boolean;
  coinStatus?: 'locked' | 'active' | 'consumed' | 'reversed';
  settlementDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for static methods
export interface ICoinTransactionModel extends Model<ICoinTransaction> {
  getUserBalance(userId: string, category?: MainCategorySlug | null): Promise<number>;
  getUserCategoryBalance(userId: string, category: MainCategorySlug): Promise<number>;
  createTransaction(
    userId: string,
    type: string,
    amount: number,
    source: string,
    description: string,
    metadata?: any,
    category?: MainCategorySlug | null,
    session?: any,
  ): Promise<ICoinTransaction>;
  expireOldCoins(userId: string, daysToExpire?: number): Promise<number>;
}

const CoinTransactionSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['earned', 'spent', 'expired', 'refunded', 'bonus', 'branded_award'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    // Unified coin type — sourced from src/constants/coinTypes.ts.
    // Previously only 'rez' | 'cashback' | 'referral'; expanded to match Wallet
    // model. Existing documents with the old values remain valid — backward-safe.
    coinType: {
      type: String,
      enum: COIN_TYPE_VALUES,
      default: 'rez',
    },
    balanceBefore: {
      type: Number,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      // Populated by pre-save hook when not explicitly set (backward compat)
    },
    // --- End bifurcation fix ---
    source: {
      type: String,
      enum: [
        'spin_wheel',
        'scratch_card',
        'quiz_game',
        'challenge',
        'achievement',
        'referral',
        'order',
        'review',
        'bill_upload',
        'daily_login',
        'admin',
        'purchase',
        'redemption',
        'expiry',
        'survey',
        'memory_match',
        'coin_hunt',
        'guess_price',
        'purchase_reward', // 5% auto coin after purchase
        'social_share_reward', // 5% coin on social sharing
        'merchant_award', // merchant gives coins to customer
        'cashback', // cashback from orders or affiliate purchases
        'creator_pick_reward', // merchant rewards creator for pick approval
        'poll_vote', // voting in polls
        'photo_upload', // uploading store/product photos
        'offer_comment', // commenting on offers
        'event_rating', // rating events after attendance
        'ugc_reel', // creating UGC reel content
        'social_impact_reward', // earned from social impact event participation
        'program_task_reward', // coins from special program task completion
        'program_multiplier_bonus', // bonus coins from program multiplier
        'event_booking', // coins earned on successful event booking
        'event_checkin', // coins earned for verified event check-in
        'event_participation', // coins earned for completing event activities
        'event_sharing', // coins earned for sharing an event
        'event_entry', // coins earned on event entry/registration
        'event_review', // coins earned for reviewing an event (distinct from rating)
        'bonus_campaign', // coins from bonus zone campaign rewards
        'tournament_prize', // coins awarded as tournament prize winnings
        'tournament_entry', // coins spent on tournament entry fee
        'tournament_refund', // coins refunded from tournament entry fee
        'challenge_reward', // coins from completing challenges
        'learning_reward', // coins from completing learning content
        'leaderboard_prize', // coins awarded as leaderboard prize at cycle end
        'smart_spend_reward', // enhanced coin reward from Smart Spend purchases
        'prive_invite_reward', // coins earned from Privé invite system (inviter & invitee)
        'recharge', // wallet recharge via payment gateway
        'transfer', // P2P coin transfer between users
        'withdrawal', // wallet withdrawal to bank/UPI/PayPal
      ],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    category: {
      type: String,
      enum: [
        'food-dining',
        'beauty-wellness',
        'grocery-essentials',
        'fitness-sports',
        'healthcare',
        'fashion',
        'education-learning',
        'home-services',
        'travel-experiences',
        'entertainment',
        'financial-lifestyle',
        'electronics',
        null,
      ],
      default: null,
      index: true,
    },
    expiresAt: Date,
    sixHourWarningSent: {
      type: Boolean,
      default: false,
    },
    twentyFourHourWarningSent: {
      type: Boolean,
      default: false,
    },
    coinStatus: {
      type: String,
      enum: ['locked', 'active', 'consumed', 'reversed'],
      default: 'active',
    },
    settlementDate: {
      type: Date,
      default: null,
    },
    // Top-level idempotencyKey for cross-service compatibility.
    // rezbackend also stores this inside metadata.idempotencyKey for legacy
    // consumers; rez-wallet-service expects it as a top-level field.
    // Both locations are populated by createTransaction() so either query pattern works.
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying - SCALEPILOT OPTIMIZED
CoinTransactionSchema.index({ user: 1, createdAt: -1 });
CoinTransactionSchema.index({ user: 1, type: 1, createdAt: -1 });
CoinTransactionSchema.index({ user: 1, source: 1, createdAt: -1 });
CoinTransactionSchema.index({ user: 1, category: 1, createdAt: -1 });

// FIX: Missing indexes for common queries
CoinTransactionSchema.index({ user: 1, coinType: 1, createdAt: -1 }); // for coin type analytics
CoinTransactionSchema.index({ createdAt: -1, type: 1 }); // for global transaction timeline
CoinTransactionSchema.index({ source: 1, createdAt: -1 }); // for source-based analytics
CoinTransactionSchema.index({ 'metadata.orderId': 1 }); // for order lookup (sparse)

// TTL Index: Auto-delete expired coins (prevents DB bloat)
CoinTransactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// Index for the unlock cron job: efficiently finds locked coins past their settlement date
CoinTransactionSchema.index({ coinStatus: 1, settlementDate: 1 });

// Composite indexes for analytics and reporting
// REMOVED: storeId is not a top-level field — lives at metadata.storeId
// Use the index on metadata.storeId defined below instead
// CoinTransactionSchema.index({ storeId: 1, createdAt: -1 }); // For store-level analytics
// KAVITA: Index for aggregation pipeline metadata.storeId queries in earnAnalytics (prevents collection scan)
CoinTransactionSchema.index(
  { 'metadata.storeId': 1, type: 1, createdAt: -1 },
  {
    sparse: true,
    partialFilterExpression: { 'metadata.storeId': { $exists: true } },
  },
);

// Partner earnings aggregation index: enables fast per-user partner earnings breakdown
CoinTransactionSchema.index(
  { user: 1, 'metadata.partnerEarning': 1, 'metadata.partnerEarningType': 1, createdAt: -1 },
  {
    partialFilterExpression: { 'metadata.partnerEarning': true },
    name: 'partner_earnings_idx',
  },
);

// Idempotency index: prevents duplicate achievement rewards for the same user+achievement
CoinTransactionSchema.index(
  { user: 1, source: 1, 'metadata.achievementId': 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      source: 'achievement',
      'metadata.achievementId': { $exists: true, $ne: null },
    },
    name: 'achievement_idempotency_idx',
  },
);

// General idempotency index: prevents duplicate rewards using idempotencyKey
CoinTransactionSchema.index(
  { user: 1, 'metadata.idempotencyKey': 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      'metadata.idempotencyKey': { $exists: true, $ne: null },
    },
    name: 'general_idempotency_idx',
  },
);

// Purchase reward idempotency: prevents duplicate purchase rewards per user+orderId
CoinTransactionSchema.index(
  { user: 1, source: 1, 'metadata.orderId': 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      source: { $in: ['purchase_reward', 'smart_spend_reward'] },
      'metadata.orderId': { $exists: true, $ne: null },
    },
    name: 'purchase_reward_idempotency_idx',
  },
);

// Privé invite reward idempotency: prevents duplicate invite rewards per user+code+role
CoinTransactionSchema.index(
  { user: 1, source: 1, 'metadata.priveInviteCodeId': 1, 'metadata.priveInviteRole': 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      source: 'prive_invite_reward',
      'metadata.priveInviteCodeId': { $exists: true, $ne: null },
    },
    name: 'prive_invite_reward_idempotency_idx',
  },
);

// Pre-save hook: ensure balanceAfter is always populated for backward compat.
// When existing writers set `balance` but not `balanceAfter`, mirror the value so
// rez-wallet-service queries against balanceAfter are never empty.
CoinTransactionSchema.pre('save', function (next) {
  if (this.balanceAfter === undefined || this.balanceAfter === null) {
    (this as any).balanceAfter = (this as any).balance;
  }
  next();
});

// Virtual for display amount (positive/negative)
CoinTransactionSchema.virtual('displayAmount').get(function (this: ICoinTransaction) {
  if (this.type === 'spent' || this.type === 'expired') {
    return -this.amount;
  }
  return this.amount;
});

// Static method to get user's coin balance (optionally filtered by category)
// ISSUE-66 FIX: Read from Wallet.balance.available instead of the CoinTransaction snapshot
// to prevent race conditions where concurrent transactions produce stale snapshot reads.
CoinTransactionSchema.statics.getUserBalance = async function (userId: string, category?: string | null) {
  const wallet = await mongoose.model('Wallet').findOne({ user: userId }).select('balance.available').lean();
  return (wallet as any)?.balance?.available || 0;
};

// Static method to get user's category-specific coin balance
CoinTransactionSchema.statics.getUserCategoryBalance = async function (userId: string, category: string) {
  // Sum all earned/bonus/refunded minus spent/expired for this category
  const result = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), category } },
    {
      $group: {
        _id: null,
        earned: {
          $sum: {
            $cond: [{ $in: ['$type', ['earned', 'refunded', 'bonus']] }, '$amount', 0],
          },
        },
        spent: {
          $sum: {
            $cond: [{ $in: ['$type', ['spent', 'expired']] }, '$amount', 0],
          },
        },
      },
    },
  ]);

  if (!result.length) return 0;
  return Math.max(0, result[0].earned - result[0].spent);
};

// Static method to create transaction and update balance
// Uses Redis distributed lock to prevent race conditions on balance read-then-write
CoinTransactionSchema.statics.createTransaction = async function (
  userId: string,
  type: string,
  amount: number,
  source: string,
  description: string,
  metadata?: any,
  category?: string | null,
  session?: any,
) {
  // AHMED FIX: Reject zero-amount transactions — they cause reconciliation headaches
  if (amount <= 0) {
    throw new Error(`Zero-amount transaction rejected: source=${source}, userId=${userId}. Amount must be positive.`);
  }

  const lockKey = `coin-tx:${userId}`;
  let lockToken: string | null = null;

  // Require explicit idempotencyKey for high-value sources to ensure true deduplication on retries
  const HIGH_VALUE_SOURCES = [
    'spin_wheel',
    'scratch_card',
    'quiz_game',
    'memory_match',
    'achievement',
    'admin',
    'bonus_campaign',
  ];
  if (!metadata?.idempotencyKey) {
    if (HIGH_VALUE_SOURCES.includes(source)) {
      throw new Error(
        `idempotencyKey is required for source: ${source}. Generate a deterministic key from the event context.`,
      );
    }
    // For low-risk auto-tracked sources, generate a deterministic key so retries
    // produce the same key and are deduplicated by the unique index.
    // BUG 3 FIX: For topup/recharge transactions, include paymentId in the seed when available.
    // Without paymentId, two separate topup payments from the same user with the same source
    // would collide on the same key (e.g. two ₹100 Stripe topups → same seed → second is rejected).
    const referenceId = metadata?.referenceId || metadata?.orderId || metadata?.transactionId || '';
    const deterministicSeed = metadata?.paymentId
      ? `${source}:${userId}:${metadata.paymentId}`
      : `${source}:${userId}:${referenceId}`;
    metadata = {
      ...metadata,
      idempotencyKey: crypto.createHash('sha256').update(deterministicSeed).digest('hex'),
    };
  }

  try {
    // Skip Redis lock when inside a MongoDB transaction (session provides atomicity)
    if (!session) {
      // Acquire per-user lock (5s TTL) to prevent concurrent balance modifications
      lockToken = await redisService.acquireLock(lockKey, 5);
      if (!lockToken) {
        // Retry once after a short delay
        await new Promise((resolve) => setTimeout(resolve, 200));
        lockToken = await redisService.acquireLock(lockKey, 5);
        if (!lockToken) {
          throw new Error('Transaction temporarily unavailable. Please try again.');
        }
      }
    }

    // Get current balance (global, not category-specific for the balance field)
    const currentBalance = await (this as ICoinTransactionModel).getUserBalance(userId);

    // Calculate new balance
    let newBalance = currentBalance;
    if (type === 'earned' || type === 'refunded' || type === 'bonus' || type === 'branded_award') {
      newBalance += amount;
    } else if (type === 'spent' || type === 'expired') {
      if (currentBalance < amount) {
        throw new Error('Insufficient coin balance');
      }
      newBalance -= amount;
    }

    // Create transaction — use array form with options when session is provided
    // Extract expiresAt from metadata if provided (set by coinService for promo/branded coins)
    const expiresAt = metadata?.expiresAt;
    if (metadata && expiresAt) {
      delete metadata.expiresAt; // Don't store duplicate in metadata
    }

    const txData: any = {
      user: userId,
      type,
      amount,
      balance: newBalance,
      source,
      description,
      metadata,
      category: category || null,
      // Mirror idempotencyKey at top level so rez-wallet-service queries work
      // without touching the metadata object (both locations stay in sync).
      idempotencyKey: metadata?.idempotencyKey,
    };
    if (expiresAt) {
      txData.expiresAt = expiresAt;
    }
    const transaction = session ? (await this.create([txData], { session }))[0] : await this.create(txData);

    // Invalidate consolidated earnings cache for this user
    try {
      await redisService.delPattern(`earnings:consolidated:${userId}:*`);
    } catch (_e) {
      // Cache invalidation is best-effort; don't fail the transaction
    }

    // Invalidate spending insights cache so dashboard reflects the new transaction
    // within 1 request instead of waiting up to 1 hour for TTL expiry.
    redisService.del(`insights:${userId}`).catch(() => {});
    redisService.del(`insights:peer:${userId}`).catch(() => {});
    redisService.delPattern(`insights:monthly:${userId}:*`).catch(() => {});

    return transaction;
  } finally {
    // Always release lock (only if we acquired one)
    if (lockToken) {
      try {
        await redisService.releaseLock(lockKey, lockToken);
      } catch (_e) {
        // Lock will auto-expire after TTL
      }
    }
  }
};

// Static method to expire old coins (FIFO) — category-aware
CoinTransactionSchema.statics.expireOldCoins = async function (userId: string, daysToExpire: number = 365) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - daysToExpire);

  // PERF FIX: Use .lean() so we only load plain objects — we don't need full Mongoose documents here.
  // The old code called .find() (full docs) then looped with await transaction.save() + await createTransaction()
  // inside the loop, causing O(n) sequential DB round-trips.  We now batch the stamp update with bulkWrite
  // and collect all the data we need before any writes.
  const expiredTransactions = await this.find({
    user: userId,
    type: 'earned',
    createdAt: { $lt: expiryDate },
    expiresAt: null,
  }).lean();

  if (expiredTransactions.length === 0) return 0;

  let totalExpired = 0;
  const categoryExpired: Record<string, number> = {};
  const now = new Date();

  // Accumulate totals BEFORE any writes
  for (const transaction of expiredTransactions) {
    totalExpired += transaction.amount;
    if (transaction.category) {
      categoryExpired[transaction.category] = (categoryExpired[transaction.category] || 0) + transaction.amount;
    }
  }

  // Batch-stamp expiresAt in a single bulkWrite (1 round-trip instead of N)
  await this.bulkWrite(
    expiredTransactions.map((t: any) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { $set: { expiresAt: now } },
      },
    })),
  );

  // Create all expiry transactions — each createTransaction acquires a Redis lock per call,
  // so we still call them sequentially to honour the per-user lock semantics, but we no longer
  // mix a .save() round-trip inside the same loop iteration.
  for (const transaction of expiredTransactions) {
    await (this as ICoinTransactionModel).createTransaction(
      userId,
      'expired',
      transaction.amount,
      'expiry',
      `Coins expired from ${transaction.source}`,
      { originalTransactionId: transaction._id },
      transaction.category || null,
    );
  }

  // Update Wallet category balances for expired category coins
  if (Object.keys(categoryExpired).length > 0) {
    try {
      const Wallet = mongoose.model('Wallet');
      const wallet = await Wallet.findOne({ user: userId });
      if (wallet) {
        for (const [cat, amount] of Object.entries(categoryExpired)) {
          try {
            await (wallet as any).deductCategoryCoins(cat, amount);
          } catch {
            // Category balance might already be 0
          }
        }
        // No .save() needed — deductCategoryCoins is now atomic
      }
    } catch (err) {
      logger.error('[CoinTransaction] Failed to update wallet category balances on expiry:', err);
    }
  }

  return totalExpired;
};

export const CoinTransaction = mongoose.model<ICoinTransaction, ICoinTransactionModel>(
  'CoinTransaction',
  CoinTransactionSchema,
);
