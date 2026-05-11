"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const validator_1 = require("@/lib/serial/validator");
const engine_1 = require("@/lib/fraud/engine");
const eligibility_1 = require("@/lib/campaigns/eligibility");
const calculator_1 = require("@/lib/rewards/calculator");
const issuer_1 = require("@/lib/rewards/issuer");
const prisma = new client_1.PrismaClient();
async function POST(request) {
    try {
        const body = await request.json();
        const { serial, signature, userId, deviceId, location, userAgent, fingerprint } = body;
        if (!serial) {
            return server_1.NextResponse.json({ error: 'Serial number is required' }, { status: 400 });
        }
        const serialRecord = await prisma.serial.findUnique({
            where: { serialNumber: serial.toUpperCase() },
            include: {
                product: {
                    include: { brand: true },
                },
            },
        });
        if (!serialRecord) {
            return server_1.NextResponse.json({
                status: 'FAKE',
                message: 'Product not found in our system',
                product: null,
                reward: null,
            });
        }
        const brand = serialRecord.product.brand;
        const isValidSignature = (0, validator_1.validateSerial)(serial, signature, brand.secretKey);
        if (!isValidSignature) {
            return server_1.NextResponse.json({
                status: 'FAKE',
                message: 'Invalid QR code - possible counterfeit product',
                product: {
                    name: serialRecord.product.name,
                    brand: brand.name,
                },
                reward: null,
            });
        }
        if (serialRecord.status === 'FLAGGED') {
            return server_1.NextResponse.json({
                status: 'FLAGGED',
                message: 'This product is under review',
                product: {
                    name: serialRecord.product.name,
                    brand: brand.name,
                },
                reward: null,
            });
        }
        if (serialRecord.status === 'EXPIRED') {
            return server_1.NextResponse.json({
                status: 'EXPIRED',
                message: 'This product has expired',
                product: {
                    name: serialRecord.product.name,
                    brand: brand.name,
                },
                reward: null,
            });
        }
        const fraudResult = await (0, engine_1.runFraudCheck)({
            serialId: serialRecord.id,
            serialNumber: serial,
            userId,
            deviceId,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent,
            location,
            fingerprint,
        });
        if (!fraudResult.allowed) {
            return server_1.NextResponse.json({
                status: 'SUSPICIOUS',
                message: 'Unusual activity detected. Our team is reviewing.',
                product: {
                    name: serialRecord.product.name,
                    brand: brand.name,
                },
                fraud: {
                    score: fraudResult.score,
                    reasons: fraudResult.reasons,
                },
                reward: null,
            });
        }
        if (userId) {
            const existingScan = await prisma.scan.findFirst({
                where: {
                    serialId: serialRecord.id,
                    userId,
                    isRewarded: true,
                },
            });
            if (existingScan) {
                await prisma.serial.update({
                    where: { id: serialRecord.id },
                    data: {
                        scanCount: { increment: 1 },
                        lastScannedAt: new Date(),
                    },
                });
                return server_1.NextResponse.json({
                    status: 'ALREADY_SCANNED',
                    message: 'You already scanned this product',
                    firstScan: false,
                    product: {
                        name: serialRecord.product.name,
                        brand: brand.name,
                    },
                    reward: null,
                });
            }
        }
        const scan = await prisma.scan.create({
            data: {
                serialId: serialRecord.id,
                userId,
                deviceId,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent,
                location: location,
                fingerprint: fingerprint,
                fraudScore: fraudResult.score,
                fraudDecision: fraudResult.decision,
                fraudReasons: fraudResult.reasons,
            },
        });
        await prisma.serial.update({
            where: { id: serialRecord.id },
            data: {
                status: serialRecord.scanCount === 0 ? 'SCANNED_FIRST' : 'MULTI_SCAN',
                scanCount: { increment: 1 },
                lastScannedAt: new Date(),
                firstScanAt: serialRecord.scanCount === 0 ? new Date() : undefined,
                firstUserId: serialRecord.scanCount === 0 ? userId : undefined,
            },
        });
        const eligibility = await (0, eligibility_1.checkRewardEligibility)({
            userId: userId || '',
            brandId: brand.id,
            productId: serialRecord.productId,
            serialId: serialRecord.id,
            location,
        });
        let reward = null;
        if (eligibility.eligible && userId) {
            const rewardCalc = await (0, calculator_1.calculateReward)(brand.id, userId, 'starter', 'bronze', eligibility.campaignId);
            const issued = await (0, issuer_1.issueReward)({
                serialId: serialRecord.id,
                brandId: brand.id,
                userId,
                campaignId: eligibility.campaignId,
                amount: rewardCalc.finalAmount,
                coinType: rewardCalc.coinType,
            });
            if (issued.success && issued.reward) {
                reward = {
                    id: issued.reward.id,
                    amount: rewardCalc.finalAmount,
                    type: rewardCalc.coinType,
                    brandCoinName: brand.name + ' Coins',
                    expiresAt: issued.reward.expiresAt,
                };
            }
        }
        return server_1.NextResponse.json({
            status: 'VERIFIED',
            firstScan: serialRecord.scanCount === 0,
            product: {
                name: serialRecord.product.name,
                brand: brand.name,
                image: serialRecord.product.image,
            },
            reward,
            scanId: scan.id,
        });
    }
    catch (error) {
        console.error('Verify error:', error);
        return server_1.NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map