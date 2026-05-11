"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PUT = PUT;
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const engine_1 = require("@/lib/fraud/engine");
const prisma = new client_1.PrismaClient();
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const resolved = searchParams.get('resolved') === 'true';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const flags = await prisma.fraudFlag.findMany({
            where: {
                ...(brandId && { brandId }),
                resolved,
            },
            include: {
                serial: {
                    include: { product: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });
        const total = await prisma.fraudFlag.count({
            where: {
                ...(brandId && { brandId }),
                resolved,
            },
        });
        return server_1.NextResponse.json({
            flags,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error('Get fraud flags error:', error);
        return server_1.NextResponse.json({ error: 'Failed to get fraud flags' }, { status: 500 });
    }
}
async function PUT(request) {
    try {
        const body = await request.json();
        const { flagId, resolution, resolvedBy, notes } = body;
        await (0, engine_1.resolveFraudFlag)(flagId, resolution, resolvedBy, notes);
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        console.error('Resolve fraud flag error:', error);
        return server_1.NextResponse.json({ error: 'Failed to resolve flag' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map