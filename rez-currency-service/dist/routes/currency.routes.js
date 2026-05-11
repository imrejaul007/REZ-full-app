"use strict";
/**
 * Currency Routes
 * REST API endpoints for currency operations
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Currency_1 = require("../models/Currency");
const exchangeService_1 = require("../services/exchangeService");
const conversionService_1 = require("../services/conversionService");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
/**
 * Success response wrapper
 */
function successResponse(data, meta) {
    return {
        success: true,
        data,
        ...(meta && { meta })
    };
}
/**
 * Error handler wrapper
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * GET /api/currencies
 * List all supported currencies
 */
router.get('/currencies', asyncHandler(async (req, res) => {
    const currencies = (0, Currency_1.getSupportedCurrencies)();
    res.json(successResponse({
        currencies,
        count: currencies.length
    }));
}));
/**
 * GET /api/currencies/:code
 * Get details for a specific currency
 */
router.get('/currencies/:code', asyncHandler(async (req, res) => {
    const { code } = req.params;
    const upperCode = code.toUpperCase();
    if (!(0, Currency_1.isValidCurrency)(upperCode)) {
        const errorResponse = {
            success: false,
            error: {
                code: 'INVALID_CURRENCY',
                message: `Currency '${code}' is not supported. Supported currencies: ${Object.values(Currency_1.CurrencyCode).join(', ')}`
            }
        };
        return res.status(400).json(errorResponse);
    }
    const { CURRENCY_REGISTRY } = await Promise.resolve().then(() => __importStar(require('../models/Currency')));
    const metadata = CURRENCY_REGISTRY[upperCode];
    res.json(successResponse({
        code: metadata.code,
        name: metadata.name,
        symbol: metadata.symbol,
        decimalPlaces: metadata.decimalPlaces,
        locale: metadata.locale
    }));
}));
/**
 * GET /api/rates
 * Get all exchange rates
 */
router.get('/rates', asyncHandler(async (req, res) => {
    const baseCurrency = req.query.base?.toUpperCase() || 'USD';
    if (!(0, Currency_1.isValidCurrency)(baseCurrency)) {
        const errorResponse = {
            success: false,
            error: {
                code: 'INVALID_CURRENCY',
                message: `Base currency '${baseCurrency}' is not supported`
            }
        };
        return res.status(400).json(errorResponse);
    }
    const rates = await exchangeService_1.exchangeRateService.getAllRates(baseCurrency);
    const cacheStatus = exchangeService_1.exchangeRateService.getCacheStatus();
    res.json(successResponse({
        base: baseCurrency,
        rates: rates.map(rate => ({
            currency: rate.to,
            rate: rate.rate,
            timestamp: rate.timestamp.toISOString()
        }))
    }, {
        cacheStatus: {
            cached: cacheStatus.cached,
            lastUpdated: cacheStatus.lastUpdated?.toISOString() || null,
            source: cacheStatus.source
        }
    }));
}));
/**
 * GET /api/rates/:from/:to
 * Get exchange rate between two currencies
 */
router.get('/rates/:from/:to', asyncHandler(async (req, res) => {
    const { from, to } = req.params;
    const upperFrom = from.toUpperCase();
    const upperTo = to.toUpperCase();
    if (!(0, Currency_1.isValidCurrency)(upperFrom)) {
        const errorResponse = {
            success: false,
            error: {
                code: 'INVALID_CURRENCY',
                message: `Source currency '${from}' is not supported`
            }
        };
        return res.status(400).json(errorResponse);
    }
    if (!(0, Currency_1.isValidCurrency)(upperTo)) {
        const errorResponse = {
            success: false,
            error: {
                code: 'INVALID_CURRENCY',
                message: `Target currency '${to}' is not supported`
            }
        };
        return res.status(400).json(errorResponse);
    }
    const rate = await exchangeService_1.exchangeRateService.getRate(upperFrom, upperTo);
    res.json(successResponse({
        from: rate.from,
        to: rate.to,
        rate: rate.rate,
        inverseRate: 1 / rate.rate,
        timestamp: rate.timestamp.toISOString()
    }));
}));
/**
 * POST /api/convert
 * Convert an amount from one currency to another
 */
router.post('/convert', asyncHandler(async (req, res) => {
    const { amount, from, to } = req.body;
    // Validate required fields
    if (amount === undefined || amount === null) {
        const errorResponse = {
            success: false,
            error: {
                code: 'MISSING_AMOUNT',
                message: 'Field "amount" is required'
            }
        };
        return res.status(400).json(errorResponse);
    }
    if (!from) {
        const errorResponse = {
            success: false,
            error: {
                code: 'MISSING_SOURCE',
                message: 'Field "from" (source currency) is required'
            }
        };
        return res.status(400).json(errorResponse);
    }
    if (!to) {
        const errorResponse = {
            success: false,
            error: {
                code: 'MISSING_TARGET',
                message: 'Field "to" (target currency) is required'
            }
        };
        return res.status(400).json(errorResponse);
    }
    const upperFrom = from.toUpperCase();
    const upperTo = to.toUpperCase();
    if (!(0, Currency_1.isValidCurrency)(upperFrom)) {
        const errorResponse = {
            success: false,
            error: {
                code: 'INVALID_SOURCE',
                message: `Source currency '${from}' is not supported`
            }
        };
        return res.status(400).json(errorResponse);
    }
    if (!(0, Currency_1.isValidCurrency)(upperTo)) {
        const errorResponse = {
            success: false,
            error: {
                code: 'INVALID_TARGET',
                message: `Target currency '${to}' is not supported`
            }
        };
        return res.status(400).json(errorResponse);
    }
    const conversionRequest = {
        amount: Number(amount),
        from: upperFrom,
        to: upperTo
    };
    const result = await conversionService_1.conversionService.convert(conversionRequest);
    res.json(successResponse({
        originalAmount: result.originalAmount,
        convertedAmount: result.convertedAmount,
        from: result.from,
        to: result.to,
        rate: result.rate,
        formattedOriginal: result.formattedOriginal,
        formattedConverted: result.formattedConverted,
        timestamp: result.timestamp.toISOString()
    }));
}));
/**
 * POST /api/convert/batch
 * Convert multiple amounts in a single request
 */
router.post('/convert/batch', asyncHandler(async (req, res) => {
    const { conversions } = req.body;
    if (!Array.isArray(conversions) || conversions.length === 0) {
        const errorResponse = {
            success: false,
            error: {
                code: 'INVALID_CONVERSIONS',
                message: 'Field "conversions" must be a non-empty array'
            }
        };
        return res.status(400).json(errorResponse);
    }
    const result = await conversionService_1.conversionService.convertBatch(conversions);
    res.json(successResponse({
        results: result.results.map(r => ({
            originalAmount: r.originalAmount,
            convertedAmount: r.convertedAmount,
            from: r.from,
            to: r.to,
            rate: r.rate,
            formattedOriginal: r.formattedOriginal,
            formattedConverted: r.formattedConverted,
            timestamp: r.timestamp.toISOString()
        })),
        errors: result.errors.map(e => ({
            code: e.code,
            message: e.message
        })),
        summary: {
            total: conversions.length,
            successful: result.results.length,
            failed: result.errors.length
        }
    }));
}));
/**
 * GET /api/format
 * Format an amount according to currency locale
 */
router.get('/format', asyncHandler(async (req, res) => {
    const { amount, currency, locale } = req.query;
    if (!amount || isNaN(Number(amount))) {
        const errorResponse = {
            success: false,
            error: {
                code: 'INVALID_AMOUNT',
                message: 'Query parameter "amount" must be a valid number'
            }
        };
        return res.status(400).json(errorResponse);
    }
    if (!currency) {
        const errorResponse = {
            success: false,
            error: {
                code: 'MISSING_CURRENCY',
                message: 'Query parameter "currency" is required'
            }
        };
        return res.status(400).json(errorResponse);
    }
    const upperCurrency = currency.toUpperCase();
    if (!(0, Currency_1.isValidCurrency)(upperCurrency)) {
        const errorResponse = {
            success: false,
            error: {
                code: 'INVALID_CURRENCY',
                message: `Currency '${currency}' is not supported`
            }
        };
        return res.status(400).json(errorResponse);
    }
    const formatted = (0, Currency_1.formatCurrency)(Number(amount), upperCurrency, locale);
    res.json(successResponse({
        amount: Number(amount),
        currency: upperCurrency,
        formatted,
        locale: locale || 'default'
    }));
}));
/**
 * POST /api/rates/refresh
 * Force refresh exchange rates from API
 */
router.post('/rates/refresh', asyncHandler(async (req, res) => {
    logger_1.default.info('Forcing exchange rate refresh');
    const rates = await exchangeService_1.exchangeRateService.refreshRates();
    res.json(successResponse({
        message: 'Exchange rates refreshed successfully',
        rates: rates.map(rate => ({
            currency: rate.to,
            rate: rate.rate,
            timestamp: rate.timestamp.toISOString()
        }))
    }));
}));
/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', asyncHandler(async (req, res) => {
    const cacheStatus = exchangeService_1.exchangeRateService.getCacheStatus();
    res.json(successResponse({
        status: 'healthy',
        service: 'rez-currency-service',
        timestamp: new Date().toISOString(),
        exchangeRateStatus: {
            cached: cacheStatus.cached,
            lastUpdated: cacheStatus.lastUpdated?.toISOString() || null,
            source: cacheStatus.source
        }
    }));
}));
exports.default = router;
//# sourceMappingURL=currency.routes.js.map