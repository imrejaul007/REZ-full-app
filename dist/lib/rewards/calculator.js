"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateReward = calculateReward;
exports.calculateRewardSimple = calculateRewardSimple;
exports.getUserMultipliers = getUserMultipliers;
const client_1 = require("@prisma/client");
const loyalty_client_1 = require("@rez/loyalty-client");
const prisma = new client_1.PrismaClient();
async function calculateReward(brandId, userId, karmaLevel, loyaltyTier, campaignId) {
    const brandSettings = await prisma.brandCoinSettings.findUnique({
        where: { brandId },
    });
    let baseAmount = brandSettings?.valuePerCoin || 50;
    if (campaignId) {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
        });
        if (campaign && campaign.status === 'ACTIVE') {
            baseAmount = campaign.rewardAmount;
        }
    }
    const karmaMultiplier = (0, loyalty_client_1.getKarmaMultiplier)(karmaLevel);
    const loyaltyMultiplier = (0, loyalty_client_1.getLoyaltyMultiplier)(loyaltyTier);
    const karmaBonus = Math.floor(baseAmount * (karmaMultiplier - 1));
    const loyaltyBonus = Math.floor((baseAmount + karmaBonus) * (loyaltyMultiplier - 1));
    const totalBonus = karmaBonus + loyaltyBonus;
    const finalAmount = baseAmount + totalBonus;
    return {
        baseAmount,
        karmaMultiplier,
        loyaltyMultiplier,
        finalAmount,
        coinType: 'BRANDED',
        breakdown: {
            brandReward: baseAmount,
            karmaBonus,
            loyaltyBonus,
            total: finalAmount,
        },
    };
}
function calculateRewardSimple(baseAmount, karmaMultiplier = 1.0, loyaltyMultiplier = 1.0) {
    const karmaBonus = Math.floor(baseAmount * (karmaMultiplier - 1));
    const loyaltyBonus = Math.floor((baseAmount + karmaBonus) * (loyaltyMultiplier - 1));
    const finalAmount = baseAmount + karmaBonus + loyaltyBonus;
    return {
        baseAmount,
        karmaMultiplier,
        loyaltyMultiplier,
        finalAmount,
        coinType: 'BRANDED',
        breakdown: {
            brandReward: baseAmount,
            karmaBonus,
            loyaltyBonus,
            total: finalAmount,
        },
    };
}
async function getUserMultipliers(userId) {
    return {
        karmaMultiplier: 1.0,
        loyaltyMultiplier: 1.0,
        karmaLevel: 'starter',
        loyaltyTier: 'bronze',
    };
}
//# sourceMappingURL=calculator.js.map