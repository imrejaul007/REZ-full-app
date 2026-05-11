"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFraudCheck = runFraudCheck;
exports.resolveFraudFlag = resolveFraudFlag;
exports.getFraudStats = getFraudStats;
const client_1 = require("@prisma/client");
const scoring_1 = require("./scoring");
const prisma = new client_1.PrismaClient();
async function runFraudCheck(input) {
    const context = await buildFraudContext(input);
    const checkInput = {
        serialId: input.serialId,
        userId: input.userId,
        deviceId: input.deviceId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        location: input.location,
        fingerprint: input.fingerprint,
        vpnDetected: await checkVPNProxy(input.ipAddress),
        proxyDetected: false,
        torDetected: false,
    };
    const result = (0, scoring_1.calculateFraudScore)(checkInput, context);
    let flagId;
    if (result.decision !== 'ALLOW') {
        const flag = await createFraudFlag({
            serialId: input.serialId,
            reason: mapRulesToReason(result.triggeredRules.map(r => r.ruleId)),
            severity: result.severity,
            details: result.details,
        });
        flagId = flag.id;
        if (result.decision === 'BLOCK') {
            await prisma.serial.update({
                where: { id: input.serialId },
                data: { status: 'FLAGGED' },
            });
        }
    }
    return {
        allowed: result.decision === 'ALLOW',
        score: result.score,
        decision: result.decision,
        severity: result.severity,
        triggeredRules: result.triggeredRules.map(r => r.ruleId),
        reasons: result.triggeredRules.map(r => r.ruleName),
        flagId,
    };
}
async function buildFraudContext(input) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentScansDevice = input.deviceId
        ? await prisma.scan.findMany({
            where: {
                deviceId: input.deviceId,
                createdAt: { gte: oneHourAgo },
            },
            select: {
                timestamp: true,
                serialId: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })
        : [];
    const recentScansSerial = await prisma.scan.findMany({
        where: {
            serialId: input.serialId,
            createdAt: { gte: thirtyDaysAgo },
        },
        select: {
            timestamp: true,
            userId: true,
            location: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });
    const knownDevicePatterns = input.userId
        ? await prisma.scan.findMany({
            where: {
                userId: input.userId,
                createdAt: { gte: twentyFourHoursAgo },
            },
            select: {
                fingerprint: true,
            },
            take: 20,
        })
        : [];
    return {
        recentScansDevice,
        recentScansSerial,
        knownDevicePatterns: knownDevicePatterns.map((s) => s.fingerprint || ''),
    };
}
async function checkVPNProxy(ipAddress) {
    if (!ipAddress)
        return false;
    const vpnRanges = [
        '45.33.32.0/24',
        '104.238.0.0/16',
    ];
    return false;
}
async function createFraudFlag(data) {
    const serial = await prisma.serial.findUnique({
        where: { id: data.serialId },
        include: { product: true },
    });
    if (!serial) {
        throw new Error('Serial not found');
    }
    return await prisma.fraudFlag.create({
        data: {
            serialId: data.serialId,
            brandId: serial.product.brandId,
            reason: data.reason,
            severity: data.severity,
            details: data.details,
        },
    });
}
function mapRulesToReason(ruleIds) {
    const reasonMap = {
        VELOCITY: 'VELOCITY_EXCEEDED',
        IMPOSSIBLE_TRAVEL: 'IMPOSSIBLE_TRAVEL',
        SERIAL_MULTI_USER: 'MULTI_USER_SERIAL',
        VPN_DETECTED: 'VPN_DETECTED',
        GPS_SPOOFING: 'GPS_SPOOFING',
        DEVICE_MISMATCH: 'DEVICE_FINGERPRINT_MISMATCH',
        IP_GEO_MISMATCH: 'GPS_SPOOFING',
    };
    return reasonMap[ruleIds[0]] || 'MANUAL_REVIEW';
}
async function resolveFraudFlag(flagId, resolution, resolvedBy, notes) {
    await prisma.fraudFlag.update({
        where: { id: flagId },
        data: {
            resolved: true,
            resolvedAt: new Date(),
            resolvedBy,
            resolution,
        },
    });
    if (resolution === 'CONFIRMED') {
        const flag = await prisma.fraudFlag.findUnique({ where: { id: flagId } });
        if (flag?.serialId) {
            await prisma.serial.update({
                where: { id: flag.serialId },
                data: { isGenuine: false, status: 'INVALID' },
            });
        }
    }
}
async function getFraudStats(brandId, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [totalFlags, bySeverity, byReason] = await Promise.all([
        prisma.fraudFlag.count({
            where: { brandId, createdAt: { gte: startDate } },
        }),
        prisma.fraudFlag.groupBy({
            by: ['severity'],
            where: { brandId, createdAt: { gte: startDate } },
            _count: true,
        }),
        prisma.fraudFlag.groupBy({
            by: ['reason'],
            where: { brandId, createdAt: { gte: startDate } },
            _count: true,
        }),
    ]);
    return {
        totalFlags,
        bySeverity: bySeverity.reduce((acc, curr) => {
            acc[curr.severity] = curr._count;
            return acc;
        }, {}),
        byReason: byReason.reduce((acc, curr) => {
            acc[curr.reason] = curr._count;
            return acc;
        }, {}),
    };
}
//# sourceMappingURL=engine.js.map