"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerEntry = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LedgerEntrySchema = new mongoose_1.Schema({
    pairId: { type: String, required: true, index: true },
    accountType: {
        type: String,
        required: true,
        enum: ['user_wallet', 'platform_fees', 'platform_float', 'merchant_wallet', 'expired_pool'],
    },
    accountId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
    direction: { type: String, required: true, enum: ['debit', 'credit'] },
    amount: { type: Number, required: true, min: 0 },
    // ENUM-01 FIX: schema enum now matches LedgerCoinType (includes cashback + referral)
    coinType: { type: String, required: true, enum: ['rez', 'promo', 'branded', 'prive', 'cashback', 'referral'], default: 'rez' },
    runningBalance: { type: Number, required: false },
    operationType: {
        type: String,
        required: true,
        enum: [
            'transfer', 'gift', 'topup', 'withdrawal', 'payment', 'refund',
            'cashback', 'loyalty_credit', 'admin_adjustment', 'expiry',
            'gift_card_purchase', 'scratch_card_prize', 'correction',
            'order_payment', 'order_coin_deduction', 'merchant_payout',
            'order_refund', 'subscription_payment', 'subscription_refund',
            'game_prize', 'achievement_reward', 'referral_bonus', 'bonus_campaign',
            'daily_login', 'review_reward', 'tournament_prize', 'learning_reward',
            'lock_fee', 'lock_fee_refund', 'social_impact', 'creator_reward',
            'coin_expiry', 'store_payment_reward', 'travel_cashback',
            'mall_affiliate', 'voucher_cashback', 'offer_cashback',
            'cashback_reversal', 'gift_refund',
            'merchant_liability_issuance', 'merchant_liability_settlement',
            'purchase', 'purchase_cashback',
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
}, {
    timestamps: { createdAt: true, updatedAt: false },
});
LedgerEntrySchema.pre('save', function (next) {
    if (this.isNew && !this.yearMonth) {
        const d = this.createdAt || new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        this.yearMonth = `${y}-${m}`;
    }
    next();
});
LedgerEntrySchema.index({ accountId: 1, createdAt: -1 });
LedgerEntrySchema.index({ accountType: 1, operationType: 1 });
LedgerEntrySchema.index({ accountId: 1, coinType: 1, createdAt: -1 });
LedgerEntrySchema.index({ pairId: 1, direction: 1 }, { unique: true });
LedgerEntrySchema.index({ reversalReferenceId: 1 }, { sparse: true });
LedgerEntrySchema.index({ yearMonth: 1, accountType: 1 });
LedgerEntrySchema.index({ referenceId: 1, referenceModel: 1, operationType: 1, direction: 1 }, { unique: true, name: 'ledger_idempotency_idx' });
LedgerEntrySchema.index({ operationType: 1 });
LedgerEntrySchema.index({ accountType: 1, accountId: 1, createdAt: -1 });
exports.LedgerEntry = mongoose_1.default.model('LedgerEntry', LedgerEntrySchema);
//# sourceMappingURL=LedgerEntry.js.map