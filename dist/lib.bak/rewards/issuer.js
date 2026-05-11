"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueReward = issueReward;
exports.claimReward = claimReward;
exports.getUserRewards = getUserRewards;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function issueReward(input) {
    try {
        if (input.campaignId) {
            const campaign = await prisma.campaign.findUnique({
                where: { id: input.campaignId },
            });
            if (!campaign) {
                return { success: false, error: 'Campaign not found' };
            }
            if (campaign.status !== 'ACTIVE') {
                return { success: false, error: 'Campaign is not active' };
            }
            if (campaign.cap && campaign.usedCount >= campaign.cap) {
                return { success: false, error: 'Campaign budget exhausted' };
            }
            await prisma.campaign.update({
                where: { id: input.campaignId },
                data: { usedCount: { increment: 1 } },
            });
        }
        const brandSettings = await prisma.brandCoinSettings.findUnique({
            where: { brandId: input.brandId },
        });
        const expiryDays = input.expiresInDays || brandSettings?.expiryDays || 90;
        const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
        const reward = await prisma.reward.create({
            data: {
                serialId: input.serialId,
                brandId: input.brandId,
                userId: input.userId,
                campaignId: input.campaignId,
                type: input.coinType === 'BRANDED' ? 'COINS' : 'COINS',
                coinType: input.coinType,
                amount: input.amount,
                status: 'PENDING',
                expiresAt,
            },
        });
        await prisma.scan.updateMany({
            where: {
                serialId: input.serialId,
                userId: input.userId,
                isRewarded: false,
            },
            data: {
                isRewarded: true,
                rewardId: reward.id,
            },
        });
        return { success: true, reward };
    }
    catch (error) {
        console.error('Failed to issue reward:', error);
        return { success: false, error: 'Failed to issue reward' };
    }
}
async function claimReward(rewardId, userId) {
    try {
        const reward = await prisma.reward.findUnique({
            where: { id: rewardId },
        });
        if (!reward) {
            return { success: false, error: 'Reward not found' };
        }
        if (reward.userId !== userId) {
            return { success: false, error: 'Not your reward' };
        }
        if (reward.status === 'CLAIMED') {
            return { success: false, error: 'Already claimed' };
        }
        if (reward.status === 'EXPIRED') {
            return { success: false, error: 'Reward expired' };
        }
        if (reward.expiresAt && reward.expiresAt < new Date()) {
            await prisma.reward.update({
                where: { id: rewardId },
                data: { status: 'EXPIRED' },
            });
            return { success: false, error: 'Reward expired' };
        }
        await prisma.reward.update({
            where: { id: rewardId },
            data: {
                status: 'CLAIMED',
                claimedAt: new Date(),
            },
        });
        return { success: true, transactionId: reward.id };
    }
    catch (error) {
        console.error('Failed to claim reward:', error);
        return { success: false, error: 'Failed to claim reward' };
    }
}
async function getUserRewards(userId, options = {}) {
    const rewards = await prisma.reward.findMany({
        where: {
            userId,
            ...(options.status && { status: options.status }),
        },
        include: {
            serial: {
                include: {
                    product: {
                        include: {
                            brand: true,
                        },
                    },
                },
            },
            campaign: true,
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 20,
    });
    return rewards;
}
//# sourceMappingURL=issuer.js.map