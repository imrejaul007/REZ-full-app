import { logger } from '../config/logger';
import mongoose, { Schema, Document, Types, Model, ClientSession } from 'mongoose';
import { logTransaction } from './TransactionAuditLog';
import { CoinType, COIN_TYPE_VALUES } from '../constants/coinTypes';

// Re-export so callers that previously imported CoinType from here continue to work.
export type { CoinType };

// Wallet Model interface with static methods
export interface IWalletModel extends Model<IWallet> {
  createForUser(userId: Types.ObjectId, session?: ClientSession): Promise<IWallet>;
  getWithSummary(userId: Types.ObjectId, period?: 'day' | 'week' | 'month' | 'year'): Promise<any>;
}

// Branded Coin Details (merchant-specific coins)
export interface IBrandedCoinDetails {
  merchantId: Types.ObjectId;
  merchantName: string;
  merchantLogo?: string;
  merchantColor?: string;
}

// Promo Coin Details (limited-time coins)
export interface IPromoCoinDetails {
  campaignId?: string;
  campaignName?: string;
  maxRedemptionPercentage: number; // Default 20% per bill
  expiryDate: Date;
}

// Coin Balance interface - Updated for new wallet design
export interface ICoinBalance {
  type: CoinType;
  amount: number;
  isActive: boolean;
  earnedDate?: Date;
  lastUsed?: Date;
  lastEarned?: Date; // Last time coins were earned
  expiryDate?: Date; // 30 days for ReZ Coins, campaign-based for Promo
  color: string; // #00C06A for ReZ, merchant color for Branded, #FFC857 for Promo
  // For Branded Coins
  brandedDetails?: IBrandedCoinDetails;
  // For Promo Coins
  promoDetails?: IPromoCoinDetails;
}

// Branded Coin in separate array for merchant-specific coins
export interface IBrandedCoin {
  merchantId: Types.ObjectId;
  merchantName: string;
  merchantLogo?: string;
  merchantColor?: string;
  amount: number;
  earnedDate: Date;
  lastUsed?: Date;
  expiresAt?: Date; // 6-month expiry per spec; set at earn time
  isActive: boolean; // false once expiresAt has passed
}

// Savings Insights
export interface ISavingsInsights {
  totalSaved: number;
  thisMonth: number;
  avgPerVisit: number;
  lastCalculated: Date;
  // Extended intelligence fields (Phase 2)
  topCategory: string;
  topMerchant: { id: string; name: string };
  monthlyTrend: number[]; // 12 months of savings amounts
  weeklySpend: number;
  savedVsAvgUser: number; // percentile 0-100
  potentialMissedSavings: number;
  favoriteStores: Array<{ id: string; name: string; visits: number }>;
}

// Wallet interface - complements User.wallet with additional details
// Category-specific coin balance
export interface ICategoryBalance {
  available: number;
  earned: number;
  spent: number;
}

export interface IWallet extends Document {
  user: Types.ObjectId;
  balance: {
    total: number; // Total wallet balance (sum of all)
    available: number; // Available for spending (ReZ Coins)
    pending: number; // Pending/locked amount
    cashback: number; // Cashback balance
  };
  coins: ICoinBalance[]; // ReZ Coins and Promo Coins
  brandedCoins: IBrandedCoin[]; // Merchant-specific coins (separate array)
  categoryBalances: Map<string, ICategoryBalance>; // Per-MainCategory coin balances
  currency: string; // 'REZ_COIN' or 'RC'
  statistics: {
    totalEarned: number; // Lifetime earnings
    totalSpent: number; // Lifetime spending
    totalCashback: number; // Total cashback received
    totalRefunds: number; // Total refunds received
    totalTopups: number; // Total topup amount
    totalWithdrawals: number; // Total withdrawn
  };
  savingsInsights: ISavingsInsights; // Savings tracking for emotional hook
  limits: {
    maxBalance: number; // Maximum wallet balance allowed
    minWithdrawal: number; // Minimum withdrawal amount
    dailySpendLimit: number; // Daily spending limit
    dailySpent: number; // Amount spent today
    lastResetDate: Date; // Last daily limit reset
  };
  settings: {
    autoTopup: boolean; // Auto-topup when balance is low
    autoTopupThreshold: number;
    autoTopupAmount: number;
    lowBalanceAlert: boolean;
    lowBalanceThreshold: number;
    // Smart Alerts settings
    smartAlertsEnabled: boolean;
    expiringCoinsAlertDays: number; // Days before expiry to alert (default 7)
  };
  isActive: boolean;
  isFrozen: boolean; // Wallet temporarily frozen
  frozenReason?: string;
  frozenAt?: Date;
  lastTransactionAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  canSpend(amount: number): boolean;
  addFunds(amount: number, type: string): Promise<void>;
  deductFunds(amount: number, options?: { trackWithdrawal?: boolean }): Promise<void>;
  addBrandedCoins(
    merchantId: Types.ObjectId,
    merchantName: string,
    amount: number,
    merchantLogo?: string,
    merchantColor?: string,
    session?: ClientSession,
  ): Promise<void>;
  useBrandedCoins(merchantId: Types.ObjectId, amount: number, session?: ClientSession): Promise<void>;
  freeze(reason: string): Promise<void>;
  unfreeze(): Promise<void>;
  resetDailyLimit(): Promise<void>;
  getFormattedBalance(): string;
  getCoinUsageOrder(): { type: string; amount: number }[]; // Promo > Branded > ReZ
  /** @deprecated No-op since DM-L4. Use Wallet collection API directly. */
  syncWithUser(): Promise<void>;
  getCategoryBalance(category: string): number;
  addCategoryCoins(category: string, amount: number, session?: any): Promise<void>;
  deductCategoryCoins(category: string, amount: number, session?: any): Promise<void>;
}

const WalletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      total: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      available: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      pending: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      cashback: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },
    // ReZ Coins (universal), Privé Coins (premium), and Promo Coins (limited-time)
    coins: [
      {
        type: {
          type: String,
          // Unified enum — sourced from src/constants/coinTypes.ts.
          // 'rez' is the canonical universal coin type.
          // 'cashback' and 'referral' align with CoinTransaction.coinType.
          enum: COIN_TYPE_VALUES,
          required: true,
        },
        amount: {
          type: Number,
          default: 0,
          min: 0,
        },
        label: String,
        isActive: {
          type: Boolean,
          default: true,
        },
        color: {
          type: String,
          default: '#00C06A', // Green for ReZ, Dark Gold #B8860B for Privé, Gold #FFC857 for Promo
        },
        earnedDate: Date,
        lastUsed: Date,
        lastEarned: Date, // Last time coins were earned
        expiryDate: Date, // 30 days for ReZ, campaign-based for Promo
        expiresAt: Date, // Alias for expiryDate
        // For Promo Coins
        promoDetails: {
          campaignId: String,
          campaignName: String,
          maxRedemptionPercentage: {
            type: Number,
            default: 20, // Max 20% per bill
          },
          expiryDate: Date,
        },
      },
    ],
    // Branded Coins - Merchant-specific coins (separate array)
    brandedCoins: [
      {
        merchantId: {
          type: Schema.Types.ObjectId,
          ref: 'Store',
          required: true,
        },
        merchantName: {
          type: String,
          required: true,
        },
        merchantLogo: String,
        merchantColor: {
          type: String,
          default: '#6366F1',
        },
        amount: {
          type: Number,
          default: 0,
          min: 0,
        },
        earnedDate: {
          type: Date,
          default: Date.now,
        },
        lastUsed: Date,
        expiresAt: { type: Date }, // 6-month expiry per spec; set at earn time
        isActive: { type: Boolean, default: true },
      },
    ],
    // Per-MainCategory coin balances (food-dining, beauty-wellness, grocery-essentials)
    categoryBalances: {
      type: Map,
      of: new Schema(
        {
          available: { type: Number, default: 0, min: 0 },
          earned: { type: Number, default: 0, min: 0 },
          spent: { type: Number, default: 0, min: 0 },
        },
        { _id: false },
      ),
      default: () => new Map(),
    },
    currency: {
      type: String,
      required: true,
      default: 'REZ_COIN',
      enum: ['REZ_COIN', 'NC', 'INR', 'RC'], // RC kept for backwards compat
    },
    statistics: {
      totalEarned: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalCashback: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalRefunds: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalTopups: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalWithdrawals: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    // Savings Insights - Emotional hook for user retention (extended for Phase 2 intelligence)
    savingsInsights: {
      totalSaved: {
        type: Number,
        default: 0,
        min: 0,
      },
      thisMonth: {
        type: Number,
        default: 0,
        min: 0,
      },
      avgPerVisit: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastCalculated: {
        type: Date,
        default: Date.now,
      },
      // Phase 2: Intelligence Layer fields
      topCategory: {
        type: String,
        default: '',
      },
      topMerchant: {
        id: { type: String, default: '' },
        name: { type: String, default: '' },
      },
      monthlyTrend: {
        type: [Number],
        default: () => new Array(12).fill(0),
      },
      weeklySpend: {
        type: Number,
        default: 0,
        min: 0,
      },
      savedVsAvgUser: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      potentialMissedSavings: {
        type: Number,
        default: 0,
        min: 0,
      },
      favoriteStores: {
        type: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            visits: { type: Number, default: 0, min: 0 },
          },
        ],
        default: () => [],
      },
    },
    limits: {
      maxBalance: {
        type: Number,
        default: 100000,
        min: 0,
      },
      minWithdrawal: {
        type: Number,
        default: 100,
        min: 0,
      },
      dailySpendLimit: {
        type: Number,
        default: 10000,
        min: 0,
      },
      dailySpent: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },
    settings: {
      autoTopup: {
        type: Boolean,
        default: false,
      },
      autoTopupThreshold: {
        type: Number,
        default: 100,
        min: 0,
      },
      autoTopupAmount: {
        type: Number,
        default: 500,
        min: 0,
      },
      lowBalanceAlert: {
        type: Boolean,
        default: true,
      },
      lowBalanceThreshold: {
        type: Number,
        default: 50,
        min: 0,
      },
      // Smart Alerts settings
      smartAlertsEnabled: {
        type: Boolean,
        default: true,
      },
      expiringCoinsAlertDays: {
        type: Number,
        default: 7, // Alert 7 days before expiry
        min: 1,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFrozen: {
      type: Boolean,
      default: false,
      index: true,
    },
    frozenReason: {
      type: String,
      trim: true,
    },
    frozenAt: {
      type: Date,
    },
    lastTransactionAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // SECURITY: Strip raw balance figures from any JSON serialization path (e.g. accidental
      // res.json(wallet) or logger.info('wallet:', wallet)).  This does NOT replace proper
      // database-level encryption (see note below) but prevents balance leakage via logs,
      // error responses, or debug endpoints that inadvertently serialize full Mongoose documents.
      transform: function (_doc: any, ret: any) {
        // balance, statistics, and savingsInsights are intentionally left unredacted here.
        // The balance endpoint (walletBalanceController) bypasses redaction by:
        //   1. Using explicit .select() projections for the wallet document, then
        //   2. Overriding with freshly computed values in the response object.
        // Redacting these fields at the model level caused consumer app crashes when
        // code path that bypass the controller (e.g. res.json(wallet)) tried to do
        // arithmetic on balance values that were strings instead of numbers.
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// SECURITY NOTE — Wallet balance field encryption:
// The balance fields (balance.available, balance.total, etc.) are stored as plain Number types
// in MongoDB.  True field-level encryption (e.g. MongoDB CSFLE / Queryable Encryption) is the
// recommended solution but requires the MongoDB 6+ Enterprise driver and cannot be retrofitted
// transparently because all balance mutations use atomic $inc operations which bypass Mongoose
// save hooks — any Mongoose-level encrypt/decrypt transformer would silently leave $inc results
// unencrypted.
//
// Production hardening checklist:
//   1. Enable MongoDB Queryable Encryption on the `balance` sub-document.
//   2. Restrict the MongoDB Atlas/cluster network to VPC-only access (no public internet).
//   3. Use a dedicated read replica for analytics to reduce exposure of the primary wallet store.
//   4. Ensure WALLET_BALANCE_ENCRYPTION_KEY is set in production env to validate intent.
if (process.env.NODE_ENV === 'production' && !process.env.WALLET_BALANCE_ENCRYPTION_KEY) {
  logger.warn(
    '[WALLET] SECURITY WARNING: WALLET_BALANCE_ENCRYPTION_KEY is not set. ' +
      'Wallet balances are stored as plaintext. Enable MongoDB Queryable Encryption ' +
      'or set this variable to suppress this warning (it indicates the encryption layer is active).',
  );
}

// Indexes
WalletSchema.index({ isActive: 1, isFrozen: 1 });
WalletSchema.index({ 'balance.available': 1 });
WalletSchema.index({ lastTransactionAt: -1 });

// Compound index for looking up active wallet by user
WalletSchema.index({ user: 1, isActive: 1 });
WalletSchema.index({ user: 1, 'balance.available': 1 }); // wallet balance reads

// KAVITA: compound index for frozen wallet status checks — prevents collection scan on wallet state queries
WalletSchema.index({ isFrozen: 1, isActive: 1, lastTransactionAt: -1 });

// KAVITA: Index for pagination by isActive and updatedAt (prevents full scan in list operations)
WalletSchema.index({ isActive: 1, updatedAt: -1 });

// Admin and analytics queries ordered by wallet creation time
WalletSchema.index({ user: 1, createdAt: -1 });

// Coin expiry index — supports expiry countdowns and background cleanup jobs
WalletSchema.index({ 'coins.expiryDate': 1 }, { sparse: true });

// D9: Compound multikey index for the daily "about-to-expire" notification cron.
// Before: ScheduledJobService did Wallet.find({ coins: { $elemMatch: { type, isActive, expiryDate } } })
// with only { 'coins.expiryDate': 1 } as an index — still a multikey scan on 500k+ wallets.
// After: this index lets Mongo use a bounded IXSCAN across all three filters.
WalletSchema.index(
  { 'coins.type': 1, 'coins.isActive': 1, 'coins.expiryDate': 1 },
  { sparse: true, name: 'coins_type_active_expiry' },
);

// Virtual for formatted balance
WalletSchema.virtual('formattedBalance').get(function () {
  return this.getFormattedBalance();
});

// Pre-save hook to validate balances
WalletSchema.pre('save', function (next) {
  // AHMED: ledger integrity — negative balance guard: reject saves with negative balance
  // This prevents silent corruption of wallet state. Negative balance = critical bug.
  if (this.balance.available < 0) {
    const err = new Error(
      `Insufficient balance: Cannot deduct from available balance (${this.balance.available}). This indicates a concurrent deduction race condition or bug in balance logic.`,
    );
    return next(err);
  }
  if (this.balance.pending < 0) {
    const err = new Error(
      `Pending balance cannot be negative (${this.balance.pending}). This indicates incorrect balance transition logic.`,
    );
    return next(err);
  }
  if (this.balance.cashback < 0) {
    const err = new Error(
      `Cashback balance cannot be negative (${this.balance.cashback}). This indicates incorrect cashback credit/debit logic.`,
    );
    return next(err);
  }
  if (this.balance.total < 0) {
    const err = new Error(
      `Total balance cannot be negative (${this.balance.total}). This indicates critical balance calculation error.`,
    );
    return next(err);
  }

  // balance.total = available (ReZ) + pending + cashback + sum of all category balances
  // Branded coins are tracked separately in brandedCoins[] and NOT included here.
  // The frontend adds brandedCoinsTotal on top for the "Total Wallet Balance" display.
  let categoryTotal = 0;
  if (this.categoryBalances) {
    this.categoryBalances.forEach((catBal: any) => {
      categoryTotal += Math.max(0, catBal?.available || 0);
    });
  }
  const calculatedTotal = this.balance.available + this.balance.pending + this.balance.cashback + categoryTotal;

  // Allow small rounding differences
  if (Math.abs(this.balance.total - calculatedTotal) > 0.01) {
    this.balance.total = Math.max(0, calculatedTotal);
  }

  // Reset daily limit if needed
  const now = new Date();
  const lastReset = new Date(this.limits.lastResetDate);

  if (
    now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  ) {
    this.limits.dailySpent = 0;
    this.limits.lastResetDate = now;
  }

  next();
});

// Method to check if user can spend amount
WalletSchema.methods.canSpend = function (amount: number): boolean {
  if (!this.isActive) return false;
  if (this.isFrozen) return false;
  if (this.balance.available < amount) return false;

  // Check daily limit
  if (this.limits.dailySpent + amount > this.limits.dailySpendLimit) {
    return false;
  }

  return true;
};

// Method to add funds (atomic $inc to prevent race conditions)
WalletSchema.methods.addFunds = async function (amount: number, type: string): Promise<void> {
  if (!this.isActive) {
    throw new Error('Wallet is not active');
  }

  if (this.isFrozen) {
    throw new Error('Wallet is frozen');
  }

  // Check max balance limit
  if (this.balance.total + amount > this.limits.maxBalance) {
    throw new Error(`Maximum wallet balance (${this.limits.maxBalance}) would be exceeded`);
  }

  // Build atomic $inc update based on fund type
  const incUpdate: Record<string, number> = {
    'balance.available': amount,
    'balance.total': amount,
  };

  switch (type) {
    case 'cashback':
      incUpdate['statistics.totalCashback'] = amount;
      incUpdate['statistics.totalEarned'] = amount;
      break;
    case 'refund':
      incUpdate['statistics.totalRefunds'] = amount;
      break;
    case 'topup':
      incUpdate['statistics.totalTopups'] = amount;
      break;
    default:
      incUpdate['statistics.totalEarned'] = amount;
  }

  // Snapshot balance before mutation
  const balanceBefore = {
    total: this.balance.total,
    available: this.balance.available,
    pending: this.balance.pending,
    cashback: this.balance.cashback,
  };

  // Atomic update — safe under concurrent requests
  const updated = await (this.constructor as any).findByIdAndUpdate(
    this._id,
    {
      $inc: incUpdate,
      $set: { lastTransactionAt: new Date() },
    },
    { new: true },
  );

  if (!updated) {
    throw new Error('Wallet not found during addFunds');
  }

  // Refresh local document fields from DB result
  this.balance = updated.balance;
  this.statistics = updated.statistics;
  this.lastTransactionAt = updated.lastTransactionAt;

  // Audit log (fire-and-forget)
  logTransaction({
    userId: this.user,
    walletId: this._id,
    walletType: 'user',
    operation: type === 'cashback' ? 'cashback' : type === 'refund' ? 'refund' : type === 'topup' ? 'topup' : 'credit',
    amount,
    balanceBefore,
    balanceAfter: {
      total: updated.balance.total,
      available: updated.balance.available,
      pending: updated.balance.pending,
      cashback: updated.balance.cashback,
    },
    reference: {
      type: type === 'cashback' ? 'cashback' : type === 'refund' ? 'refund' : type === 'topup' ? 'topup' : 'other',
    },
  });

};

// Method to deduct funds (atomic $inc to prevent race conditions)
WalletSchema.methods.deductFunds = async function (
  amount: number,
  options?: { trackWithdrawal?: boolean },
): Promise<void> {
  if (!this.isActive) {
    throw new Error('Wallet is not active');
  }

  if (this.isFrozen) {
    throw new Error('Wallet is frozen');
  }

  if (!this.canSpend(amount)) {
    throw new Error('Insufficient balance or daily limit exceeded');
  }

  // AHMED: ledger integrity — validate deduction will not go negative
  if (this.balance.available - amount < 0) {
    throw new Error(`Insufficient balance: have ${this.balance.available}, attempting to deduct ${amount}`);
  }

  // Snapshot balance before mutation
  const balanceBefore = {
    total: this.balance.total,
    available: this.balance.available,
    pending: this.balance.pending,
    cashback: this.balance.cashback,
  };

  // Atomic deduction with balance guard — prevents going negative
  const incFields: Record<string, number> = {
    'balance.available': -amount,
    'balance.total': -amount,
    'statistics.totalSpent': amount,
    'limits.dailySpent': amount,
  };
  if (options?.trackWithdrawal) {
    incFields['statistics.totalWithdrawals'] = amount;
  }

  const updated = await (this.constructor as any).findOneAndUpdate(
    {
      _id: this._id,
      'balance.available': { $gte: amount }, // AHMED: ledger integrity — atomic guard: only deduct if sufficient
    },
    {
      $inc: incFields,
      $set: { lastTransactionAt: new Date() },
    },
    { new: true },
  );

  if (!updated) {
    throw new Error('Insufficient balance (concurrent deduction detected)');
  }

  // Refresh local document fields from DB result
  this.balance = updated.balance;
  this.statistics = updated.statistics;
  this.limits = updated.limits;
  this.lastTransactionAt = updated.lastTransactionAt;

  // Audit log (fire-and-forget)
  logTransaction({
    userId: this.user,
    walletId: this._id,
    walletType: 'user',
    operation: 'debit',
    amount,
    balanceBefore,
    balanceAfter: {
      total: updated.balance.total,
      available: updated.balance.available,
      pending: updated.balance.pending,
      cashback: updated.balance.cashback,
    },
    reference: { type: 'other' },
  });

  // Check low balance alert
  if (this.settings.lowBalanceAlert && this.balance.available <= this.settings.lowBalanceThreshold) {
    logger.info(`Low balance alert for user ${this.user}: ${this.balance.available} RC`);
  }

  // Auto-topup if enabled
  if (this.settings.autoTopup && this.balance.available <= this.settings.autoTopupThreshold) {
    logger.info(`Auto-topup triggered for user ${this.user}`);
  }
};

// Method to add Branded Coins (merchant-specific) — atomic $inc or $push
WalletSchema.methods.addBrandedCoins = async function (
  merchantId: Types.ObjectId,
  merchantName: string,
  amount: number,
  merchantLogo?: string,
  merchantColor?: string,
  session?: ClientSession,
): Promise<void> {
  if (!this.isActive) {
    throw new Error('Wallet is not active');
  }

  if (this.isFrozen) {
    throw new Error('Wallet is frozen');
  }

  // Branded coins are tracked separately - do NOT add to balance.total or statistics.totalEarned
  // balance.total only tracks ReZ coins, cashback, and promo coins

  // Try atomic $inc on existing branded coin entry
  const opts: any = { new: true };
  if (session) opts.session = session;

  const updated = await (this.constructor as any).findOneAndUpdate(
    {
      _id: this._id,
      'brandedCoins.merchantId': merchantId,
    },
    {
      $inc: { 'brandedCoins.$.amount': amount },
      $set: {
        'brandedCoins.$.lastUsed': new Date(),
        lastTransactionAt: new Date(),
      },
    },
    opts,
  );

  if (!updated) {
    // No existing entry for this merchant — atomic $push a new one
    const pushed = await (this.constructor as any).findOneAndUpdate(
      { _id: this._id },
      {
        $push: {
          brandedCoins: {
            merchantId,
            merchantName,
            merchantLogo,
            merchantColor: merchantColor || '#6366F1',
            amount,
            earnedDate: new Date(),
          },
        },
        $set: { lastTransactionAt: new Date() },
      },
      opts,
    );

    if (!pushed) {
      throw new Error('Failed to add branded coins — wallet not found');
    }

    // Refresh local document
    this.brandedCoins = pushed.brandedCoins;
    this.lastTransactionAt = pushed.lastTransactionAt;
  } else {
    // Refresh local document from atomic update result
    this.brandedCoins = updated.brandedCoins;
    this.lastTransactionAt = updated.lastTransactionAt;
  }

};

// Method to use Branded Coins (at specific merchant)
WalletSchema.methods.useBrandedCoins = async function (
  merchantId: Types.ObjectId,
  amount: number,
  session?: ClientSession,
): Promise<void> {
  if (!this.isActive) {
    throw new Error('Wallet is not active');
  }

  if (this.isFrozen) {
    throw new Error('Wallet is frozen');
  }

  // Atomic update: decrement branded coin with balance guard
  const opts: any = { new: true };
  if (session) opts.session = session;

  const updated = await (this.constructor as any).findOneAndUpdate(
    {
      _id: this._id,
      brandedCoins: {
        $elemMatch: {
          merchantId: merchantId,
          amount: { $gte: amount },
        },
      },
    },
    {
      $inc: { 'brandedCoins.$.amount': -amount },
      $set: {
        'brandedCoins.$.lastUsed': new Date(),
        lastTransactionAt: new Date(),
      },
    },
    opts,
  );

  if (!updated) {
    throw new Error('Insufficient Branded Coins for this merchant');
  }

  // Clean up zero-balance branded coins
  const zeroCoin = updated.brandedCoins.find(
    (coin: any) => coin.merchantId.toString() === merchantId.toString() && coin.amount <= 0,
  );
  if (zeroCoin) {
    const cleanupOpts: any = {};
    if (session) cleanupOpts.session = session;
    await (this.constructor as any).findByIdAndUpdate(
      this._id,
      {
        $pull: { brandedCoins: { merchantId: merchantId, amount: { $lte: 0 } } },
      },
      cleanupOpts,
    );
  }

  // Refresh local document
  const refreshed = await (this.constructor as any).findById(this._id).session(session || null);
  this.brandedCoins = refreshed.brandedCoins;
  this.lastTransactionAt = refreshed.lastTransactionAt;

};

// Method to get coin usage order (Promo > Branded > Privé > ReZ)
// Priority: Use expiring/limited coins first, then premium, then universal
WalletSchema.methods.getCoinUsageOrder = function (): { type: string; amount: number; merchantId?: string }[] {
  const order: { type: string; amount: number; merchantId?: string }[] = [];

  // 1. Promo Coins first (limited-time, highest priority - campaign-based expiry)
  const promoCoin = this.coins.find((c: any) => c.type === 'promo' && c.isActive && c.amount > 0);
  if (promoCoin) {
    order.push({ type: 'promo', amount: promoCoin.amount });
  }

  // 2. Branded Coins second (merchant-specific, 6-month expiry)
  for (const brandedCoin of this.brandedCoins || []) {
    if (brandedCoin.amount > 0) {
      order.push({
        type: 'branded',
        amount: brandedCoin.amount,
        merchantId: brandedCoin.merchantId.toString(),
      });
    }
  }

  // 3. Privé Coins third (premium coins, 12-month expiry)
  const priveCoin = this.coins.find((c: any) => c.type === 'prive' && c.isActive && c.amount > 0);
  if (priveCoin) {
    order.push({ type: 'prive', amount: priveCoin.amount });
  }

  // 4. ReZ Coins last (universal, never expire)
  const rezCoin = this.coins.find((c: any) => c.type === 'rez' && c.isActive && c.amount > 0);
  if (rezCoin) {
    order.push({ type: 'rez', amount: rezCoin.amount });
  }

  return order;
};

// Method to get category-specific coin balance
WalletSchema.methods.getCategoryBalance = function (category: string): number {
  const catBalance = this.categoryBalances?.get(category);
  return catBalance?.available || 0;
};

// Method to add coins to a specific category balance — atomic $inc
WalletSchema.methods.addCategoryCoins = async function (
  category: string,
  amount: number,
  session?: any,
): Promise<void> {
  const updated = await (this.constructor as any).findOneAndUpdate(
    { _id: this._id },
    {
      $inc: {
        [`categoryBalances.${category}.available`]: amount,
        [`categoryBalances.${category}.earned`]: amount,
      },
    },
    { new: true, ...(session ? { session } : {}) },
  );

  if (!updated) {
    throw new Error('Failed to add category coins — wallet not found');
  }

  // Refresh local document
  this.categoryBalances = updated.categoryBalances;
};

// Method to deduct coins from a specific category balance — atomic $inc with $gte guard
WalletSchema.methods.deductCategoryCoins = async function (
  category: string,
  amount: number,
  session?: any,
): Promise<void> {
  const updated = await (this.constructor as any).findOneAndUpdate(
    {
      _id: this._id,
      [`categoryBalances.${category}.available`]: { $gte: amount },
    },
    {
      $inc: {
        [`categoryBalances.${category}.available`]: -amount,
        [`categoryBalances.${category}.spent`]: amount,
      },
    },
    { new: true, ...(session ? { session } : {}) },
  );

  if (!updated) {
    throw new Error(`Insufficient ${category} category coin balance`);
  }

  // Refresh local document
  this.categoryBalances = updated.categoryBalances;
};

// Method to freeze wallet
WalletSchema.methods.freeze = async function (reason: string): Promise<void> {
  this.isFrozen = true;
  this.frozenReason = reason;
  this.frozenAt = new Date();
  await this.save();
};

// Method to unfreeze wallet
WalletSchema.methods.unfreeze = async function (): Promise<void> {
  this.isFrozen = false;
  this.frozenReason = undefined;
  this.frozenAt = undefined;
  await this.save();
};

// Method to reset daily limit
WalletSchema.methods.resetDailyLimit = async function (): Promise<void> {
  this.limits.dailySpent = 0;
  this.limits.lastResetDate = new Date();
  await this.save();
};

// Method to get formatted balance
WalletSchema.methods.getFormattedBalance = function (): string {
  return `${this.balance.available} ${this.currency}`;
};

// Method to sync with User model
// DM-L4 FIX: User.wallet sub-doc was removed. The Wallet collection is now the authoritative
// source for wallet data. Calls to this method are no-ops — all syncWithUser() call sites
// have been removed. This stub exists only to avoid breaking any remaining runtime references.
WalletSchema.methods.syncWithUser = async function (): Promise<void> {
  // No-op: User.wallet subdocument removed (DM-L4). Wallet data lives in the Wallet collection.
};

// Static method to create wallet for new user
WalletSchema.statics.createForUser = async function (userId: Types.ObjectId) {
  // BUG FIX: Use atomic findOneAndUpdate with upsert to prevent TOCTOU race.
  // Old code: findOne check, then save if missing allows concurrent requests to both pass the check
  // and both attempt to save, causing duplicate key error on the unique index.
  // The upsert ensures only one wallet is created, and we always return the stored document.
  const wallet = await this.findOneAndUpdate(
    { user: userId },
    {
      $setOnInsert: {
        user: userId,
        balance: {
          total: 0,
          available: 0,
          pending: 0,
          cashback: 0,
        },
        // ReZ Coins (universal), Privé Coins (premium), and Promo Coins (limited-time)
        coins: [
          {
            type: 'rez',
            amount: 0,
            isActive: true,
            color: '#C9A962', // ReZ Gold (matches documentation)
            earnedDate: new Date(),
            // ReZ coins never expire per documentation
          },
          {
            type: 'prive',
            amount: 0,
            isActive: true,
            color: '#B8860B', // Privé Dark Gold
            earnedDate: new Date(),
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 12 months per documentation
          },
          {
            type: 'promo',
            amount: 0,
            isActive: true,
            color: '#FFC857', // Promo Gold
            earnedDate: new Date(),
            promoDetails: {
              maxRedemptionPercentage: 20,
            },
          },
        ],
        // Branded coins start empty
        brandedCoins: [],
        currency: 'RC',
        savingsInsights: {
          totalSaved: 0,
          thisMonth: 0,
          avgPerVisit: 0,
          lastCalculated: new Date(),
        },
      },
    },
    { upsert: true, new: true },
  );

  return wallet;
};

// Static method to get wallet with transaction summary
WalletSchema.statics.getWithSummary = async function (
  userId: Types.ObjectId,
  period: 'day' | 'week' | 'month' = 'month',
) {
  const wallet = await this.findOne({ user: userId });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const Transaction = mongoose.model('Transaction') as any;
  const summary = await Transaction.getUserTransactionSummary(userId.toString(), period);

  return {
    wallet,
    summary: summary[0] || { summary: [], totalTransactions: 0 },
  };
};

// H8: Post-save hook — keep UserLoyalty.coins.available in sync with wallet balance.
// Non-blocking: failures are logged but never surface to the caller.
WalletSchema.post('save', async function (doc) {
  try {
    const UserLoyalty = mongoose.model('UserLoyalty');
    await UserLoyalty.findOneAndUpdate(
      { userId: doc.user },
      { $set: { 'coins.available': doc.balance?.available ?? 0 } },
      { upsert: false },
    );
  } catch (err) {
    // Non-blocking — log but don't fail the wallet save
    logger.error('[Wallet] post-save UserLoyalty sync failed:', err);
  }
});

export const Wallet = mongoose.model<IWallet, IWalletModel>('Wallet', WalletSchema);
