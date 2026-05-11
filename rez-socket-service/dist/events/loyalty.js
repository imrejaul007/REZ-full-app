"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLoyaltyEvents = setupLoyaltyEvents;
function setupLoyaltyEvents(io) {
    const loyalty = io.of('/loyalty');
    loyalty.on('connection', (socket) => {
        socket.on('join-user', (userId) => {
            socket.join(`user:${userId}`);
            console.log(`Loyalty user joined: ${userId}`);
        });
        socket.on('points:earned', (data) => {
            loyalty.to(`user:${data.userId}`).emit('points:update', {
                points: data.points,
                source: data.source,
                timestamp: new Date(),
            });
        });
        socket.on('tier:upgrade', (data) => {
            loyalty.to(`user:${data.userId}`).emit('tier:updated', {
                newTier: data.newTier,
                previousTier: data.previousTier,
                timestamp: new Date(),
            });
        });
        socket.on('reward:unlocked', (data) => {
            loyalty.to(`user:${data.userId}`).emit('reward:new', {
                reward: data.reward,
                expiresAt: data.expiresAt,
                timestamp: new Date(),
            });
        });
        socket.on('points:redeemed', (data) => {
            loyalty.to(`user:${data.userId}`).emit('redeemption:confirmed', {
                points: data.points,
                reward: data.reward,
                timestamp: new Date(),
            });
        });
    });
}
