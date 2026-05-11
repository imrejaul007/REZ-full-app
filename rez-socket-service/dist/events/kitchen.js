"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupKitchenEvents = setupKitchenEvents;
function setupKitchenEvents(io) {
    const kitchen = io.of('/kitchen');
    kitchen.on('connection', (socket) => {
        socket.on('join-store', (storeId) => {
            socket.join(`store:${storeId}`);
            console.log(`Kitchen joined store: ${storeId}`);
        });
        socket.on('order:created', (order) => {
            kitchen.to(`store:${order.storeId}`).emit('order:new', order);
        });
        socket.on('order:status', (data) => {
            kitchen.to(`store:${data.storeId}`).emit('order:updated', data);
        });
        socket.on('item:status', (data) => {
            kitchen.to(`store:${data.storeId}`).emit('item:updated', data);
        });
    });
}
