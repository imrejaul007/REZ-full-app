"use strict";
/**
 * Currency Model
 * Defines supported currencies, their metadata, and formatting options
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCY_REGISTRY = exports.CurrencyCode = void 0;
exports.getSupportedCurrencies = getSupportedCurrencies;
exports.isValidCurrency = isValidCurrency;
exports.getCurrencyMetadata = getCurrencyMetadata;
exports.formatCurrency = formatCurrency;
var CurrencyCode;
(function (CurrencyCode) {
    CurrencyCode["INR"] = "INR";
    CurrencyCode["USD"] = "USD";
    CurrencyCode["EUR"] = "EUR";
    CurrencyCode["GBP"] = "GBP";
})(CurrencyCode || (exports.CurrencyCode = CurrencyCode = {}));
/**
 * Currency metadata registry
 */
exports.CURRENCY_REGISTRY = {
    [CurrencyCode.INR]: {
        code: CurrencyCode.INR,
        name: 'Indian Rupee',
        symbol: '₹',
        decimalPlaces: 2,
        locale: 'en-IN'
    },
    [CurrencyCode.USD]: {
        code: CurrencyCode.USD,
        name: 'US Dollar',
        symbol: '$',
        decimalPlaces: 2,
        locale: 'en-US'
    },
    [CurrencyCode.EUR]: {
        code: CurrencyCode.EUR,
        name: 'Euro',
        symbol: '€',
        decimalPlaces: 2,
        locale: 'de-DE'
    },
    [CurrencyCode.GBP]: {
        code: CurrencyCode.GBP,
        name: 'British Pound',
        symbol: '£',
        decimalPlaces: 2,
        locale: 'en-GB'
    }
};
/**
 * Get all supported currencies
 */
function getSupportedCurrencies() {
    return Object.values(exports.CURRENCY_REGISTRY).map(({ code, name, symbol }) => ({
        code,
        name,
        symbol
    }));
}
/**
 * Validate if a currency code is supported
 */
function isValidCurrency(code) {
    return Object.values(CurrencyCode).includes(code);
}
/**
 * Get currency metadata
 */
function getCurrencyMetadata(code) {
    return exports.CURRENCY_REGISTRY[code];
}
/**
 * Format amount according to currency locale
 */
function formatCurrency(amount, currency, customLocale) {
    const metadata = exports.CURRENCY_REGISTRY[currency];
    if (!metadata) {
        throw new Error(`Unsupported currency: ${currency}`);
    }
    const locale = customLocale || metadata.locale;
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: metadata.decimalPlaces,
            maximumFractionDigits: metadata.decimalPlaces
        }).format(amount);
    }
    catch {
        // Fallback formatting
        return `${metadata.symbol}${amount.toFixed(metadata.decimalPlaces)}`;
    }
}
//# sourceMappingURL=Currency.js.map