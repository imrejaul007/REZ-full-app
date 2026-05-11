export declare const LOYALTY_TIERS: readonly ["bronze", "silver", "gold", "platinum", "diamond"];
export type LoyaltyTier = typeof LOYALTY_TIERS[number];
export declare function normalizeLoyaltyTier(tier: string): LoyaltyTier;
export declare const TRANSACTION_TYPES: {
    readonly EARNED: "earned";
    readonly SPENT: "spent";
    readonly EXPIRED: "expired";
    readonly REFUNDED: "refunded";
    readonly BONUS: "bonus";
    readonly BRANDED_AWARD: "branded_award";
};
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];
export interface LoyaltyTierPerks {
    tier: LoyaltyTier;
    /** Cashback rate as a decimal (e.g., 0.01 = 1%) */
    cashbackRate: number;
    /** Free delivery on orders above this amount (INR). 0 = free delivery on all orders. null = no free delivery. */
    freeDeliveryMinOrder: number | null;
    /** Whether the user gets priority customer support */
    prioritySupport: boolean;
    /** Whether the user gets exclusive offers/deals */
    exclusiveOffers: boolean;
    /** Whether the user gets early access to new features/products */
    earlyAccess: boolean;
}
export declare const LOYALTY_TIER_PERKS: Record<LoyaltyTier, LoyaltyTierPerks>;
/**
 * Get the perks for a given loyalty tier.
 * Falls back to bronze perks if the tier is unknown.
 */
export declare function getLoyaltyTierPerks(tier: string): LoyaltyTierPerks;
export declare const USER_ROLES: {
    readonly USER: "user";
    readonly CONSUMER: "consumer";
    readonly MERCHANT: "merchant";
    readonly ADMIN: "admin";
    readonly SUPPORT: "support";
    readonly OPERATOR: "operator";
    readonly SUPER_ADMIN: "super_admin";
};
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
