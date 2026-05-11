import mongoose, { Document, Types } from 'mongoose';
export type LedgerAccountType = 'user_wallet' | 'platform_fees' | 'platform_float' | 'merchant_wallet' | 'expired_pool';
export type LedgerDirection = 'debit' | 'credit';
export type LedgerOperationType = 'transfer' | 'gift' | 'topup' | 'withdrawal' | 'payment' | 'refund' | 'cashback' | 'loyalty_credit' | 'admin_adjustment' | 'expiry' | 'gift_card_purchase' | 'scratch_card_prize' | 'correction' | 'order_payment' | 'order_coin_deduction' | 'merchant_payout' | 'order_refund' | 'subscription_payment' | 'subscription_refund' | 'game_prize' | 'achievement_reward' | 'referral_bonus' | 'bonus_campaign' | 'daily_login' | 'review_reward' | 'tournament_prize' | 'learning_reward' | 'lock_fee' | 'lock_fee_refund' | 'social_impact' | 'creator_reward' | 'coin_expiry' | 'store_payment_reward' | 'travel_cashback' | 'mall_affiliate' | 'voucher_cashback' | 'offer_cashback' | 'cashback_reversal' | 'gift_refund' | 'merchant_liability_issuance' | 'merchant_liability_settlement' | 'purchase' | 'purchase_cashback';
export type LedgerCoinType = 'rez' | 'promo' | 'branded' | 'prive' | 'cashback' | 'referral';
export interface ILedgerEntry extends Document {
    pairId: string;
    accountType: LedgerAccountType;
    accountId: Types.ObjectId;
    direction: LedgerDirection;
    amount: number;
    coinType: LedgerCoinType;
    runningBalance?: number;
    operationType: LedgerOperationType;
    referenceId: string;
    referenceModel: string;
    reversalReferenceId?: string;
    metadata: {
        requestId?: string;
        idempotencyKey?: string;
        adminUserId?: string;
        description?: string;
    };
    yearMonth: string;
    createdAt: Date;
}
export declare const LedgerEntry: mongoose.Model<ILedgerEntry, {}, {}, {}, mongoose.Document<unknown, {}, ILedgerEntry, {}, {}> & ILedgerEntry & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=LedgerEntry.d.ts.map