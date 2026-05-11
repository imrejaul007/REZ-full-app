"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWarrantyStatus = getWarrantyStatus;
exports.claimWarranty = claimWarranty;
exports.getExpiringWarranties = getExpiringWarranties;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getWarrantyStatus(serialId) {
    const ownership = await prisma.ownership.findUnique({
        where: { serialId },
    });
    if (!ownership || !ownership.warrantyEnd) {
        return null;
    }
    const now = new Date();
    const daysRemaining = Math.ceil((ownership.warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const claimDeadline = new Date(ownership.warrantyEnd);
    claimDeadline.setDate(claimDeadline.getDate() + 30);
    return {
        isValid: ownership.warrantyEnd > now,
        daysRemaining: Math.max(0, daysRemaining),
        expiresAt: ownership.warrantyEnd,
        isClaimable: ownership.warrantyEnd > now && !ownership.warrantyClaimed,
        claimDeadline,
    };
}
async function claimWarranty(serialId, userId, claimData) {
    try {
        const ownership = await prisma.ownership.findUnique({
            where: { serialId },
        });
        if (!ownership) {
            return { success: false, error: 'Ownership not found' };
        }
        if (ownership.userId !== userId) {
            return { success: false, error: 'Not the owner' };
        }
        if (ownership.warrantyClaimed) {
            return { success: false, error: 'Warranty already claimed' };
        }
        const status = await getWarrantyStatus(serialId);
        if (!status?.isValid) {
            return { success: false, error: 'Warranty expired' };
        }
        await prisma.ownership.update({
            where: { serialId },
            data: { warrantyClaimed: true },
        });
        return {
            success: true,
            claimId: `WC-${Date.now()}`,
        };
    }
    catch (error) {
        console.error('Warranty claim error:', error);
        return { success: false, error: 'Failed to claim warranty' };
    }
}
async function getExpiringWarranties(userId, daysThreshold = 30) {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
    const ownerships = await prisma.ownership.findMany({
        where: {
            userId,
            warrantyEnd: {
                gte: now,
                lte: thresholdDate,
            },
            warrantyClaimed: false,
        },
        include: {
            serial: {
                include: {
                    product: {
                        include: { brand: true },
                    },
                },
            },
        },
        orderBy: { warrantyEnd: 'asc' },
    });
    return ownerships.map(o => ({
        ...o,
        daysRemaining: Math.ceil((o.warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));
}
//# sourceMappingURL=warranty.js.map