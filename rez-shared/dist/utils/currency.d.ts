/**
 * Format a number as Indian currency string.
 * e.g. 12500 → "₹12,500"
 */
export declare function formatCurrency(amount: number): string;
/**
 * Format with suffix for large numbers.
 * e.g. 12500 → "₹12.5K", 1200000 → "₹12L"
 */
export declare function formatShortCurrency(amount: number): string;
declare const __brand: unique symbol;
/** Branded type for amounts stored in paise (1 rupee = 100 paise). */
export type PaiseAmount = number & {
    readonly [__brand]: typeof __brand;
};
/** Convert rupees to paise. Always rounds to nearest integer. */
export declare const toPaise: (rupees: number) => PaiseAmount;
/** Convert paise to rupees. Returns float (e.g. 2500 paise → 25.00 rupees). */
export declare const toRupees: (paise: PaiseAmount) => number;
/**
 * Display a PaiseAmount as a formatted rupee string.
 * @example formatPaise(2500) → "₹25.00"
 */
export declare const formatPaise: (paise: PaiseAmount) => string;
export {};
