"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupStaffEvents = setupStaffEvents;
function setupStaffEvents(io) {
    const staff = io.of('/staff');
    staff.on('connection', (socket) => {
        socket.on('join-hotel', (hotelId) => {
            socket.join(`hotel:${hotelId}`);
        });
        socket.on('request:created', (request) => {
            staff.to(`hotel:${request.hotelId}`).emit('request:new', request);
        });
        socket.on('request:assigned', (data) => {
            staff.to(`hotel:${data.hotelId}`).emit('request:assigned', data);
        });
        socket.on('request:updated', (data) => {
            staff.to(`hotel:${data.hotelId}`).emit('request:status', data);
        });
        socket.on('sla:warning', (data) => {
            staff.to(`hotel:${data.hotelId}`).emit('sla:warning', data);
        });
        socket.on('sla:breach', (data) => {
            staff.to(`hotel:${data.hotelId}`).emit('sla:breach', data);
        });
    });
}
