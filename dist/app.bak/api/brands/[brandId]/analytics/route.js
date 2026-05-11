"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function GET(request, { params }) {
    try {
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const [products, totalSerials, scans, uniqueUsers, fraudFlags, rewards,] = await Promise.all([
            prisma.product.count({ where: { brandId: params.brandId } }),
            prisma.serial.count({
                where: { product: { brandId: params.brandId } },
            }),
            prisma.scan.count({
                where: {
                    serial: { product: { brandId: params.brandId } },
                    createdAt: { gte: startDate },
                },
            }),
            prisma.scan.groupBy({
                by: ['userId'],
                where: {
                    serial: { product: { brandId: params.brandId } },
                    createdAt: { gte: startDate },
                    userId: { not: null },
                },
            }),
            prisma.fraudFlag.count({
                where: {
                    brandId: params.brandId,
                    createdAt: { gte: startDate },
                },
            }),
            prisma.reward.aggregate({
                where: {
                    brandId: params.brandId,
                    createdAt: { gte: startDate },
                },
                _sum: { amount: true },
                _count: true,
            }),
        ]);
        const scansByDay = await prisma.$queryRaw `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM scans
      WHERE created_at >= ${startDate}
      AND serial_id IN (
        SELECT id FROM serials
        WHERE product_id IN (
          SELECT id FROM products WHERE brand_id = ${params.brandId}
        )
      )
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
        const topCities = await prisma.$queryRaw `
      SELECT location->>'city' as city, COUNT(*) as count
      FROM scans
      WHERE created_at >= ${startDate}
      AND location IS NOT NULL
      AND serial_id IN (
        SELECT id FROM serials
        WHERE product_id IN (
          SELECT id FROM products WHERE brand_id = ${params.brandId}
        )
      )
      GROUP BY location->>'city'
      ORDER BY count DESC
      LIMIT 10
    `;
        return server_1.NextResponse.json({
            summary: {
                totalProducts: products,
                totalSerials,
                scansInPeriod: scans,
                uniqueUsers: uniqueUsers.length,
                fraudFlags,
                totalRewardsIssued: rewards._sum.amount || 0,
                rewardClaims: rewards._count,
                fraudRate: scans > 0 ? (fraudFlags / scans * 100).toFixed(2) + '%' : '0%',
            },
            scansByDay,
            topCities,
        });
    }
    catch (error) {
        console.error('Analytics error:', error);
        return server_1.NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map