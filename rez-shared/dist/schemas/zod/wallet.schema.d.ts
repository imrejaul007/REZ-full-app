/**
 * Wallet API validation schemas
 * WARNING: This file has been synchronized with packages/shared-types
 * All changes must be made to packages/shared-types as the canonical source
 *
 * Validates WalletDebit, WalletCredit, and CoinTransactionResponse requests/responses
 * Canonical coin priority: promo > branded > prive > cashback > referral > rez
 */
import { z } from 'zod';
export declare const COIN_TYPE: z.ZodEnum<["promo", "branded", "prive", "cashback", "referral", "rez"]>;
export declare const COIN_TRANSACTION_TYPE: z.ZodEnum<["earned", "spent", "expired", "refunded", "bonus", "branded_award"]>;
export declare const TRANSACTION_STATUS: z.ZodEnum<["pending", "completed", "failed"]>;
export declare const WalletBalanceSchema: z.ZodObject<{
    total: z.ZodNumber;
    available: z.ZodNumber;
    pending: z.ZodNumber;
    cashback: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    pending?: number;
    cashback?: number;
    total?: number;
    available?: number;
}, {
    pending?: number;
    cashback?: number;
    total?: number;
    available?: number;
}>;
export declare const CoinSchema: z.ZodObject<{
    type: z.ZodEnum<["promo", "branded", "prive", "cashback", "referral", "rez"]>;
    amount: z.ZodNumber;
    isActive: z.ZodBoolean;
    earnedDate: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    lastUsed: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    lastEarned: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    expiryDate: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    color: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    type?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
    isActive?: boolean;
    amount?: number;
    earnedDate?: string | Date;
    lastUsed?: string | Date;
    lastEarned?: string | Date;
    expiryDate?: string | Date;
    color?: string;
}, {
    type?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
    isActive?: boolean;
    amount?: number;
    earnedDate?: string | Date;
    lastUsed?: string | Date;
    lastEarned?: string | Date;
    expiryDate?: string | Date;
    color?: string;
}>;
export declare const WalletDebitSchema: z.ZodObject<{
    user: z.ZodString;
    amount: z.ZodNumber;
    source: z.ZodString;
    sourceId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    merchantId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>>;
    /** REQUIRED - must be unique per logical debit to prevent double-spend */
    idempotencyKey: z.ZodString;
}, "strict", z.ZodTypeAny, {
    user?: string;
    description?: string;
    amount?: number;
    metadata?: Record<string, string | number | boolean>;
    source?: string;
    sourceId?: string;
    merchantId?: string;
    idempotencyKey?: string;
}, {
    user?: string;
    description?: string;
    amount?: number;
    metadata?: Record<string, string | number | boolean>;
    source?: string;
    sourceId?: string;
    merchantId?: string;
    idempotencyKey?: string;
}>;
export declare const WalletCreditSchema: z.ZodObject<{
    user: z.ZodString;
    coinType: z.ZodEnum<["promo", "branded", "prive", "cashback", "referral", "rez"]>;
    amount: z.ZodNumber;
    source: z.ZodString;
    sourceId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    merchantId: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>>;
    /** REQUIRED - must be unique per logical credit to prevent double-credit */
    idempotencyKey: z.ZodString;
}, "strict", z.ZodTypeAny, {
    user?: string;
    description?: string;
    amount?: number;
    metadata?: Record<string, string | number | boolean>;
    expiryDate?: string | Date;
    source?: string;
    sourceId?: string;
    merchantId?: string;
    idempotencyKey?: string;
    coinType?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
}, {
    user?: string;
    description?: string;
    amount?: number;
    metadata?: Record<string, string | number | boolean>;
    expiryDate?: string | Date;
    source?: string;
    sourceId?: string;
    merchantId?: string;
    idempotencyKey?: string;
    coinType?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
}>;
export declare const CoinTransactionResponseSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    user: z.ZodString;
    type: z.ZodEnum<["earned", "spent", "expired", "refunded", "bonus", "branded_award"]>;
    coinType: z.ZodEnum<["promo", "branded", "prive", "cashback", "referral", "rez"]>;
    amount: z.ZodNumber;
    balanceBefore: z.ZodNumber;
    balanceAfter: z.ZodNumber;
    source: z.ZodString;
    sourceId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    merchantId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["pending", "completed", "failed"]>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    user?: string;
    type?: "refunded" | "expired" | "earned" | "spent" | "bonus" | "branded_award";
    status?: "pending" | "completed" | "failed";
    description?: string;
    _id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    amount?: number;
    metadata?: Record<string, string | number | boolean>;
    source?: string;
    sourceId?: string;
    merchantId?: string;
    idempotencyKey?: string;
    coinType?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
    balanceBefore?: number;
    balanceAfter?: number;
}, {
    user?: string;
    type?: "refunded" | "expired" | "earned" | "spent" | "bonus" | "branded_award";
    status?: "pending" | "completed" | "failed";
    description?: string;
    _id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    amount?: number;
    metadata?: Record<string, string | number | boolean>;
    source?: string;
    sourceId?: string;
    merchantId?: string;
    idempotencyKey?: string;
    coinType?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
    balanceBefore?: number;
    balanceAfter?: number;
}>;
export declare const CoinTransactionListResponseSchema: z.ZodArray<z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    user: z.ZodString;
    type: z.ZodEnum<["earned", "spent", "expired", "refunded", "bonus", "branded_award"]>;
    coinType: z.ZodEnum<["promo", "branded", "prive", "cashback", "referral", "rez"]>;
    amount: z.ZodNumber;
    balanceBefore: z.ZodNumber;
    balanceAfter: z.ZodNumber;
    source: z.ZodString;
    sourceId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    merchantId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>>;
    idempotencyKey: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["pending", "completed", "failed"]>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    user?: string;
    type?: "refunded" | "expired" | "earned" | "spent" | "bonus" | "branded_award";
    status?: "pending" | "completed" | "failed";
    description?: string;
    _id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    amount?: number;
    metadata?: Record<string, string | number | boolean>;
    source?: string;
    sourceId?: string;
    merchantId?: string;
    idempotencyKey?: string;
    coinType?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
    balanceBefore?: number;
    balanceAfter?: number;
}, {
    user?: string;
    type?: "refunded" | "expired" | "earned" | "spent" | "bonus" | "branded_award";
    status?: "pending" | "completed" | "failed";
    description?: string;
    _id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    amount?: number;
    metadata?: Record<string, string | number | boolean>;
    source?: string;
    sourceId?: string;
    merchantId?: string;
    idempotencyKey?: string;
    coinType?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
    balanceBefore?: number;
    balanceAfter?: number;
}>, "many">;
export declare const WalletBalanceResponseSchema: z.ZodObject<{
    user: z.ZodString;
    balance: z.ZodObject<{
        total: z.ZodNumber;
        available: z.ZodNumber;
        pending: z.ZodNumber;
        cashback: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        pending?: number;
        cashback?: number;
        total?: number;
        available?: number;
    }, {
        pending?: number;
        cashback?: number;
        total?: number;
        available?: number;
    }>;
    coins: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["promo", "branded", "prive", "cashback", "referral", "rez"]>;
        amount: z.ZodNumber;
        isActive: z.ZodBoolean;
        earnedDate: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        lastUsed: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        lastEarned: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        expiryDate: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        color: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        type?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
        isActive?: boolean;
        amount?: number;
        earnedDate?: string | Date;
        lastUsed?: string | Date;
        lastEarned?: string | Date;
        expiryDate?: string | Date;
        color?: string;
    }, {
        type?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
        isActive?: boolean;
        amount?: number;
        earnedDate?: string | Date;
        lastUsed?: string | Date;
        lastEarned?: string | Date;
        expiryDate?: string | Date;
        color?: string;
    }>, "many">;
    currency: z.ZodString;
    isFrozen: z.ZodBoolean;
    isActive: z.ZodBoolean;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    user?: string;
    currency?: string;
    isActive?: boolean;
    updatedAt?: string | Date;
    balance?: {
        pending?: number;
        cashback?: number;
        total?: number;
        available?: number;
    };
    coins?: {
        type?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
        isActive?: boolean;
        amount?: number;
        earnedDate?: string | Date;
        lastUsed?: string | Date;
        lastEarned?: string | Date;
        expiryDate?: string | Date;
        color?: string;
    }[];
    isFrozen?: boolean;
}, {
    user?: string;
    currency?: string;
    isActive?: boolean;
    updatedAt?: string | Date;
    balance?: {
        pending?: number;
        cashback?: number;
        total?: number;
        available?: number;
    };
    coins?: {
        type?: "promo" | "branded" | "prive" | "cashback" | "referral" | "rez";
        isActive?: boolean;
        amount?: number;
        earnedDate?: string | Date;
        lastUsed?: string | Date;
        lastEarned?: string | Date;
        expiryDate?: string | Date;
        color?: string;
    }[];
    isFrozen?: boolean;
}>;
export type WalletDebitRequest = z.infer<typeof WalletDebitSchema>;
export type WalletCreditRequest = z.infer<typeof WalletCreditSchema>;
export type CoinTransactionResponse = z.infer<typeof CoinTransactionResponseSchema>;
export type CoinTransactionListResponse = z.infer<typeof CoinTransactionListResponseSchema>;
export type WalletBalanceResponse = z.infer<typeof WalletBalanceResponseSchema>;
export type CoinType = z.infer<typeof COIN_TYPE>;
export type CoinTransactionType = z.infer<typeof COIN_TRANSACTION_TYPE>;
export type TransactionStatus = z.infer<typeof TRANSACTION_STATUS>;
export declare const COIN_PRIORITY_ORDER: Array<z.infer<typeof COIN_TYPE>>;
