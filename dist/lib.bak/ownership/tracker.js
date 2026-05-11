"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordOwnership = recordOwnership;
exports.transferOwnership = transferOwnership;
exports.getUserOwnerships = getUserOwnerships;
exports.getOwnershipHistory = getOwnershipHistory;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function recordOwnership(input) {
    const { serialId, userId, warrantyMonths = 12 } = input;
    const existing = await prisma.ownership.findUnique({
        where: { serialId },
    });
    if (existing) {
        return existing;
    }
    const now = new Date();
    const warrantyEnd = new Date(now);
    warrantyEnd.setMonth(warrantyEnd.getMonth() + warrantyMonths);
    const ownership = await prisma.ownership.create({
        data: {
            serialId,
            userId,
            scannedAt: now,
            purchaseProof: true,
            warrantyStart: now,
            warrantyEnd,
        },
    });
    return ownership;
}
async function transferOwnership(serialId, fromUserId, toUserId) {
    try {
        const ownership = await prisma.ownership.findUnique({
            where: { serialId },
        });
        if (!ownership) {
            return { success: false, error: 'Product not owned' };
        }
        if (ownership.userId !== fromUserId) {
            return { success: false, error: 'Not the current owner' };
        }
        await prisma.ownership.update({
            where: { serialId },
            data: {
                userId: toUserId,
                transferredAt: new Date(),
                previousOwnerId: fromUserId,
            },
        });
        return { success: true };
    }
    catch (error) {
        console.error('Transfer ownership error:', error);
        return { success: false, error: 'Transfer failed' };
    }
}
async function getUserOwnerships(userId, options = {}) {
    const now = new Date();
    const ownerships = await prisma.ownership.findMany({
        where: {
            userId,
            ...(options.active && {
                warrantyEnd: { gte: now },
            }),
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
        orderBy: { scannedAt: 'desc' },
        take: options.limit || 20,
    });
    return ownerships.map((o) => ({
        ...o,
        isExpired: o.warrantyEnd ? o.warrantyEnd < now : false,
        daysUntilExpiry: o.warrantyEnd
            ? Math.ceil((o.warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null,
    }));
}
async function getOwnershipHistory(serialId) {
    const current = await prisma.ownership.findUnique({
        where: { serialId },
        include: {
            serial: {
                include: {
                    product: { include: { brand: true } },
                },
            },
        },
    });
    return {
        current,
        history: current ? [current] : [],
    };
}
//# sourceMappingURL=tracker.js.map