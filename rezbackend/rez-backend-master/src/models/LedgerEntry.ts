import mongoose, { Schema, Document, Types } from 'mongoose';

export type LedgerAccountType = 'user_wallet' | 'platform_fees' | 'platform_float' | 'merchant_wallet' | 'expired_pool';
export type LedgerDirection = 'debit' | 'credit';
export type LedgerOperationType =
  | 'transfer'
  | 'gift'
  | 'topup'
  | 'withdrawal'
  | 'payment'
  | 'refund'
  | 'cashback'
  | 'loyalty_credit'
  | 'admin_adjustment'
  | 'expiry'
  | 'gift_card_purchase'
  | 'scratch_card_prize'
  | 'correction'
  | 'order_payment'
  | 'order_coin_deduction'
  | 'merchant_payout'
  | 'order_refund'
  | 'subscription_payment'
  | 'subscription_refund'
  | 'game_prize'
  | 'achievement_reward'
  | 'referral_bonus'
  | 'bonus_campaign'
  | 'daily_login'
  | 'review_reward'
  | 'tournament_prize'
  | 'learning_reward'
  | 'lock_fee'
  | 'lock_fee_refund'
  | 'social_impact'
  | 'creator_reward'
  | 'coin_expiry'
  | 'store_payment_reward'
  | 'travel_cashback'
  | 'mall_affiliate'
  | 'voucher_cashback'
  | 'offer_cashback'
  | 'cashback_reversal'
  | 'gift_refund'
  | 'merchant_liability_issuance'
  | 'merchant_liability_settlement'
  | 'purchase'
  | 'purchase_cashback';
// F-H1 FIX: 'nuqta' added for backward compat — legacy pre-rebrand coin type present in existing DB documents
export type LedgerCoinType = 'rez' | 'promo' | 'prive' | 'branded' | 'cashback' | 'referral' | 'nuqta';

export interface ILedgerEntry extends Document {
  pairId: string;
  accountType: LedgerAccountType;
  accountId: Types.ObjectId;
  direction: LedgerDirection;
  amount: number;
  coinType: LedgerCoinType;
  runningBalance?: number; // Intentionally not stored on insert — computed on read via getAccountBalance()
  operationType: LedgerOperationType;
  referenceId: string;
  referenceModel: string;
  reversalReferenceId?: string; // pairId of the original ledger entry being reversed
  metadata: {
    requestId?: string;
    idempotencyKey?: string;
    adminUserId?: string;
    description?: string;
  };
  yearMonth: string; // e.g. "2026-03" — partition-like bucketing for efficient range queries
  createdAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
  {
    pairId: { type: String, required: true, index: true },
    accountType: {
      type: String,
      required: true,
      enum: ['user_wallet', 'platform_fees', 'platform_float', 'merchant_wallet', 'expired_pool'],
    },
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    direction: { type: String, required: true, enum: ['debit', 'credit'] },
    amount: { type: Number, required: true, min: 0 },
    coinType: {
      type: String,
      required: true,
      // F-H1 FIX: 'nuqta' added — legacy pre-rebrand coin type must be accepted to prevent ValidationError on legacy docs
      enum: ['rez', 'promo', 'prive', 'branded', 'cashback', 'referral', 'nuqta'],
      default: 'rez',
    },
    // runningBalance is intentionally NOT stored on insert — it is racy under concurrency.
    // Two concurrent inserts can both read the same aggregate and both write a stale snapshot.
    // The value is always derivable via getAccountBalance() (credits − debits aggregate).
    runningBalance: { type: Number, required: false },
    operationType: {
      type: String,
      required: true,
      enum: [
        'transfer',
        'gift',
        'topup',
        'withdrawal',
        'payment',
        'refund',
        'cashback',
        'loyalty_credit',
        'admin_adjustment',
        'expiry',
        'gift_card_purchase',
        'scratch_card_prize',
        'correction',
        'order_payment',
        'order_coin_deduction',
        'merchant_payout',
        'order_refund',
        'subscription_payment',
        'subscription_refund',
        'game_prize',
        'achievement_reward',
        'referral_bonus',
        'bonus_campaign',
        'daily_login',
        'review_reward',
        'tournament_prize',
        'learning_reward',
        'lock_fee',
        'lock_fee_refund',
        'social_impact',
        'creator_reward',
        'coin_expiry',
        'store_payment_reward',
        'travel_cashback',
        'mall_affiliate',
        'voucher_cashback',
        'offer_cashback',
        'cashback_reversal',
        'gift_refund',
        'merchant_liability_issuance',
        'merchant_liability_settlement',
        'purchase',
        'purchase_cashback',
      ],
    },
    referenceId: { type: String, required: true },
    referenceModel: { type: String, required: true },
    reversalReferenceId: { type: String, default: null },
    metadata: {
      requestId: String,
      idempotencyKey: String,
      adminUserId: String,
      description: String,
    },
    yearMonth: { type: String, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable — no updates
  },
);

// Pre-save: auto-compute yearMonth from createdAt
LedgerEntrySchema.pre('save', function (next) {
  if (this.isNew && !this.yearMonth) {
    const d = this.createdAt || new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    this.yearMonth = `${y}-${m}`;
  }
  next();
});

// Indexes for reconciliation and querying
LedgerEntrySchema.index({ accountId: 1, createdAt: -1 });
LedgerEntrySchema.index({ accountType: 1, operationType: 1 });
LedgerEntrySchema.index({ accountId: 1, coinType: 1, createdAt: -1 });
LedgerEntrySchema.index({ pairId: 1, direction: 1 }, { unique: true }); // Each pair has exactly 1 debit + 1 credit
LedgerEntrySchema.index({ reversalReferenceId: 1 }, { sparse: true }); // Reversal chain lookups
LedgerEntrySchema.index({ yearMonth: 1, accountType: 1 }); // Month-based partition queries
// PHASE-4 IDEMPOTENCY: Unique constraint prevents duplicate ledger entries for the same event.
// direction is included because each event produces exactly one debit AND one credit leg
// (both share the same referenceId/referenceModel/operationType).  Without direction the
// index would reject the second (valid) leg of every double-entry pair.
// NOTE: If the old non-unique { referenceId: 1, referenceModel: 1 } index exists in MongoDB,
//       drop it first: db.ledgerentries.dropIndex("referenceId_1_referenceModel_1")
LedgerEntrySchema.index(
  { referenceId: 1, referenceModel: 1, operationType: 1, direction: 1 },
  { unique: true, name: 'ledger_idempotency_idx' },
);

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
