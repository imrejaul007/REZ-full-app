"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCampaign = createCampaign;
exports.activateCampaign = activateCampaign;
exports.pauseCampaign = pauseCampaign;
exports.checkEligibility = checkEligibility;
exports.getBestCampaign = getBestCampaign;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createCampaign(input) {
    return await prisma.campaign.create({
        data: {
            brandId: input.brandId,
            productId: input.productId,
            name: input.name,
            description: input.description,
            type: input.type,
            rewardAmount: input.rewardAmount,
            cap: input.cap,
            startDate: input.startDate,
            endDate: input.endDate,
            targeting: input.targeting,
            status: 'DRAFT',
        },
    });
}
async function activateCampaign(campaignId) {
    return await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'ACTIVE' },
    });
}
async function pauseCampaign(campaignId) {
    return await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'PAUSED' },
    });
}
async function checkEligibility(campaignId, userId, location) {
    const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
    });
    if (!campaign) {
        return { eligible: false, reason: 'Campaign not found' };
    }
    if (campaign.status !== 'ACTIVE') {
        return { eligible: false, reason: 'Campaign is not active' };
    }
    const now = new Date();
    if (campaign.startDate > now) {
        return { eligible: false, reason: 'Campaign has not started' };
    }
    if (campaign.endDate && campaign.endDate < now) {
        return { eligible: false, reason: 'Campaign has ended' };
    }
    if (campaign.cap && campaign.usedCount >= campaign.cap) {
        return { eligible: false, reason: 'Campaign budget exhausted' };
    }
    const targeting = campaign.targeting;
    if (targeting?.locations?.length) {
        const userCity = location?.city?.toLowerCase();
        const cityMatch = targeting.locations.some(loc => loc.toLowerCase() === userCity);
        if (!cityMatch) {
            return { eligible: false, reason: 'Not available in your location' };
        }
    }
    if (campaign.type === 'FIRST_N') {
        const existingClaim = await prisma.reward.findFirst({
            where: {
                campaignId,
                userId,
            },
        });
        if (existingClaim) {
            return { eligible: false, reason: 'Already claimed this campaign' };
        }
    }
    let boostMultiplier = 1.0;
    if (campaign.type === 'TIME_BOOST') {
        const currentHour = now.getHours();
        boostMultiplier = 2.0;
    }
    return { eligible: true, boostMultiplier };
}
async function getBestCampaign(brandId, productId, location) {
    const campaigns = await prisma.campaign.findMany({
        where: {
            brandId,
            status: 'ACTIVE',
            productId: productId || undefined,
            startDate: { lte: new Date() },
            OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
            ],
        },
        orderBy: { rewardAmount: 'desc' },
    });
    for (const campaign of campaigns) {
        const eligibility = await checkEligibility(campaign.id, '', location);
        if (eligibility.eligible) {
            return campaign;
        }
    }
    return null;
}
//# sourceMappingURL=manager.js.map