"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrandCoinConfig = getBrandCoinConfig;
exports.updateBrandCoinConfig = updateBrandCoinConfig;
exports.convertToReZCoins = convertToReZCoins;
exports.redeemAtBrand = redeemAtBrand;
exports.getUserBrandedBalance = getUserBrandedBalance;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getBrandCoinConfig(brandId) {
    const settings = await prisma.brandCoinSettings.findUnique({
        where: { brandId },
    });
    if (!settings) {
        return {
            coinName: 'Brand Coins',
            coinSymbol: 'BC',
            valuePerCoin: 1.0,
            minRedeem: 100,
            expiryDays: 90,
            allowRedemption: true,
            allowConversion: true,
        };
    }
    return {
        coinName: settings.coinName,
        coinSymbol: settings.coinSymbol,
        valuePerCoin: settings.valuePerCoin,
        minRedeem: settings.minRedeem,
        expiryDays: settings.expiryDays,
        allowRedemption: settings.allowRedemption,
        allowConversion: settings.allowConversion,
    };
}
async function updateBrandCoinConfig(brandId, config) {
    await prisma.brandCoinSettings.upsert({
        where: { brandId },
        create: {
            brandId,
            coinName: config.coinName || 'Brand Coins',
            coinSymbol: config.coinSymbol || 'BC',
            valuePerCoin: config.valuePerCoin || 1.0,
            minRedeem: config.minRedeem || 100,
            expiryDays: config.expiryDays || 90,
            allowRedemption: config.allowRedemption ?? true,
            allowConversion: config.allowConversion ?? true,
        },
        update: config,
    });
}
async function convertToReZCoins(userId, brandId, amount) {
    const config = await getBrandCoinConfig(brandId);
    if (!config?.allowConversion) {
        return { success: false, error: 'Conversion not allowed by brand' };
    }
    if (amount < config.minRedeem) {
        return { success: false, error: `Minimum ${config.minRedeem} coins to convert` };
    }
    return { success: true };
}
async function redeemAtBrand(userId, brandId, amount, orderId) {
    const config = await getBrandCoinConfig(brandId);
    if (!config?.allowRedemption) {
        return { success: false, error: 'Redemption not allowed by brand' };
    }
    if (amount < config.minRedeem) {
        return { success: false, error: `Minimum ${config.minRedeem} coins to redeem` };
    }
    return { success: true };
}
async function getUserBrandedBalance(userId, brandId) {
    const rewards = await prisma.reward.aggregate({
        where: {
            userId,
            brandId,
            status: 'PENDING',
        },
        _sum: {
            amount: true,
        },
    });
    return rewards._sum.amount || 0;
}
//# sourceMappingURL=brandCoins.js.map