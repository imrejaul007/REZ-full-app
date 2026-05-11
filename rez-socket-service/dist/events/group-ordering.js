"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGroupEvents = setupGroupEvents;
function setupGroupEvents(io) {
    const groups = io.of('/groups');
    groups.on('connection', (socket) => {
        socket.on('join', (sessionCode) => {
            socket.join(`group:${sessionCode}`);
            socket.data.sessionCode = sessionCode;
        });
        socket.on('leave', (sessionCode) => {
            socket.leave(`group:${sessionCode}`);
        });
        socket.on('member:join', (data) => {
            groups.to(`group:${data.sessionCode}`).emit('member:joined', data);
        });
        socket.on('item:add', (data) => {
            groups.to(`group:${data.sessionCode}`).emit('item:added', data);
        });
        socket.on('item:remove', (data) => {
            groups.to(`group:${data.sessionCode}`).emit('item:removed', data);
        });
        socket.on('order:placed', (data) => {
            groups.to(`group:${data.sessionCode}`).emit('order:ready', data);
        });
        socket.on('session:end', (sessionCode) => {
            groups.to(`group:${sessionCode}`).emit('session:ended', { sessionCode });
        });
    });
}
