"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const issuer_1 = require("@/lib/rewards/issuer");
async function POST(request, { params }) {
    try {
        const body = await request.json();
        const { userId } = body;
        if (!userId) {
            return server_1.NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        const result = await (0, issuer_1.claimReward)(params.rewardId, userId);
        if (!result.success) {
            return server_1.NextResponse.json({ error: result.error }, { status: 400 });
        }
        return server_1.NextResponse.json({
            success: true,
            message: 'Reward claimed successfully',
            transactionId: result.transactionId,
        });
    }
    catch (error) {
        console.error('Claim reward error:', error);
        return server_1.NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
    }
}
//# sourceMappingURL=route.js.map