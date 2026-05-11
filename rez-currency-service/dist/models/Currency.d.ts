/**
 * Currency Model
 * Defines supported currencies, their metadata, and formatting options
 */
export declare enum CurrencyCode {
    INR = "INR",
    USD = "USD",
    EUR = "EUR",
    GBP = "GBP"
}
export interface CurrencyMetadata {
    code: CurrencyCode;
    name: string;
    symbol: string;
    decimalPlaces: number;
    locale: string;
}
export interface ExchangeRate {
    from: CurrencyCode;
    to: CurrencyCode;
    rate: number;
    timestamp: Date;
}
export interface ConversionRequest {
    amount: number;
    from: CurrencyCode;
    to: CurrencyCode;
}
export interface ConversionResult {
    originalAmount: number;
    convertedAmount: number;
    from: CurrencyCode;
    to: CurrencyCode;
    rate: number;
    formattedOriginal: string;
    formattedConverted: string;
    timestamp: Date;
}
export interface CurrencyInfo {
    code: CurrencyCode;
    name: string;
    symbol: string;
}
/**
 * Currency metadata registry
 */
export declare const CURRENCY_REGISTRY: Record<CurrencyCode, CurrencyMetadata>;
/**
 * Get all supported currencies
 */
export declare function getSupportedCurrencies(): CurrencyInfo[];
/**
 * Validate if a currency code is supported
 */
export declare function isValidCurrency(code: string): code is CurrencyCode;
/**
 * Get currency metadata
 */
export declare function getCurrencyMetadata(code: CurrencyCode): CurrencyMetadata | undefined;
/**
 * Format amount according to currency locale
 */
export declare function formatCurrency(amount: number, currency: CurrencyCode, customLocale?: string): string;
//# sourceMappingURL=Currency.d.ts.map