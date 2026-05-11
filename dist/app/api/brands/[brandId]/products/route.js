"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const generator_1 = require("@/lib/serial/generator");
const prisma = new client_1.PrismaClient();
async function GET(request, { params }) {
    try {
        const products = await prisma.product.findMany({
            where: { brandId: params.brandId },
            orderBy: { createdAt: 'desc' },
        });
        return server_1.NextResponse.json({ products });
    }
    catch (error) {
        console.error('Get products error:', error);
        return server_1.NextResponse.json({ error: 'Failed to get products' }, { status: 500 });
    }
}
async function POST(request, { params }) {
    try {
        const body = await request.json();
        const { name, description, category, image, totalSerials } = body;
        const product = await prisma.product.create({
            data: {
                brandId: params.brandId,
                name,
                description,
                category,
                image,
                totalSerials: totalSerials || 0,
            },
        });
        let serials = [];
        if (totalSerials && totalSerials > 0) {
            const brand = await prisma.brand.findUnique({
                where: { id: params.brandId },
            });
            if (brand) {
                const productCode = product.id.substring(0, 4).toUpperCase();
                const batch = (0, generator_1.generateSerialBatch)(brand.slug.substring(0, 4).toUpperCase(), productCode, totalSerials, brand.secretKey);
                await prisma.serial.createMany({
                    data: batch.map(s => ({
                        productId: product.id,
                        serialNumber: s.serial,
                        signature: s.signature,
                        batchId: s.batchId,
                    })),
                });
                await prisma.product.update({
                    where: { id: product.id },
                    data: { totalSerials },
                });
                serials = batch;
            }
        }
        return server_1.NextResponse.json({
            product,
            serialsGenerated: serials.length,
            serials: serials.slice(0, 10),
        }, { status: 201 });
    }
    catch (error) {
        console.error('Create product error:', error);
        return server_1.NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map