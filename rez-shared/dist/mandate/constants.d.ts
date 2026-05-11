/**
 * Constants for NPCI/NACH/UPI AutoPay mandate system
 */
export declare const MANDATE_CONSTANTS: {
    /** Maximum mandate amount per frequency cycle (in paise) */
    readonly MAX_AMOUNTS: {
        readonly NACH: 10000000;
        readonly UPI_AUTOPAY: 1500000;
        readonly EMANDATE: 10000000;
    };
    /** Supported frequencies */
    readonly FREQUENCIES: readonly ["daily", "weekly", "monthly", "quarterly", "yearly", "as_presented"];
    /** Mandate expiry (default 10 years for NACH) */
    readonly DEFAULT_MANDATE_DURATION_YEARS: 10;
    /** Minimum days before first debit */
    readonly MIN_DAYS_BEFORE_FIRST_DEBIT: {
        readonly NACH: 5;
        readonly UPI_AUTOPAY: 1;
        readonly EMANDATE: 3;
    };
    /** Webhook event types */
    readonly WEBHOOK_EVENTS: {
        readonly TOKEN_CONFIRMED: "token.confirmed";
        readonly TOKEN_REJECTED: "token.rejected";
        readonly TOKEN_CANCELLED: "token.cancelled";
        readonly PAYMENT_AUTHORIZED: "payment.authorized";
        readonly PAYMENT_CAPTURED: "payment.captured";
        readonly PAYMENT_FAILED: "payment.failed";
        readonly SUBSCRIPTION_ACTIVATED: "subscription.activated";
        readonly SUBSCRIPTION_CHARGED: "subscription.charged";
        readonly SUBSCRIPTION_HALTED: "subscription.halted";
        readonly SUBSCRIPTION_CANCELLED: "subscription.cancelled";
    };
    /** Banks supporting NACH eMandate (top banks) */
    readonly NACH_SUPPORTED_BANKS: readonly ["HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "YES", "PNB", "BOB", "CANARA", "UNION", "IDBI", "BOI", "IOB", "FEDERAL", "SOUTH_INDIAN"];
    /** Retry config for failed charges */
    readonly CHARGE_RETRY: {
        readonly MAX_ATTEMPTS: 3;
        readonly RETRY_DELAY_HOURS: readonly [24, 48, 72];
    };
};
