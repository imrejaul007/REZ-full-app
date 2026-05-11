"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRewardEligibility = checkRewardEligibility;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkRewardEligibility(check) {
    const { userId, brandId, productId, location } = check;
    if (check.serialId) {
        const existingScan = await prisma.scan.findFirst({
            where: {
                serialId: check.serialId,
                userId,
                isRewarded: true,
            },
        });
        if (existingScan) {
            return {
                eligible: false,
                reason: 'Already scanned and rewarded',
            };
        }
    }
    const campaign = await prisma.campaign.findFirst({
        where: {
            brandId,
            status: 'ACTIVE',
            productId: productId || null,
            startDate: { lte: new Date() },
            OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
            ],
        },
        orderBy: { rewardAmount: 'desc' },
    });
    if (!campaign) {
        return {
            eligible: false,
            reason: 'No active campaign',
            coinType: 'REZ',
        };
    }
    if (campaign.cap && campaign.usedCount >= campaign.cap) {
        return {
            eligible: false,
            reason: 'Campaign budget exhausted',
        };
    }
    if (campaign.type === 'FIRST_N') {
        const claims = await prisma.reward.count({
            where: { campaignId: campaign.id },
        });
        if (claims >= (campaign.cap || 0)) {
            return {
                eligible: false,
                reason: 'First N limit reached',
            };
        }
    }
    const targeting = campaign.targeting;
    if (targeting?.locations?.length && location?.city) {
        const cityMatch = targeting.locations.some(loc => loc.toLowerCase() === location.city.toLowerCase());
        if (!cityMatch) {
            return {
                eligible: false,
                reason: 'Not available in your location',
            };
        }
    }
    return {
        eligible: true,
        campaignId: campaign.id,
        rewardAmount: campaign.rewardAmount,
        coinType: 'BRANDED',
    };
}
//# sourceMappingURL=eligibility.js.map