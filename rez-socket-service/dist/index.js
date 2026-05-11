"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http_1 = require("http");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// SECURITY FIX: Validate CORS origin - never allow wildcard in production
function getAllowedOrigins() {
    const origins = process.env.CORS_ORIGIN;
    if (!origins) {
        throw new Error('CORS_ORIGIN environment variable is required');
    }
    const originList = origins.split(',').map(o => o.trim());
    // Block wildcard in production
    if (originList.includes('*') && process.env.NODE_ENV === 'production') {
        throw new Error('Wildcard CORS origin is not allowed in production');
    }
    return originList;
}
const httpServer = (0, http_1.createServer)();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: getAllowedOrigins(),
        credentials: true,
    },
});
// SECURITY FIX: JWT Authentication middleware for WebSocket connections
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET_VALUE = JWT_SECRET;
function authenticateSocket(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET_VALUE);
        return {
            userId: decoded.userId || decoded.sub || '',
            role: decoded.role || 'user',
        };
    }
    catch {
        return null;
    }
}
const kitchen_1 = require("./events/kitchen");
const staff_1 = require("./events/staff");
const group_ordering_1 = require("./events/group-ordering");
const loyalty_1 = require("./events/loyalty");
// Initialize all event handlers
(0, kitchen_1.setupKitchenEvents)(io);
(0, staff_1.setupStaffEvents)(io);
(0, group_ordering_1.setupGroupEvents)(io);
(0, loyalty_1.setupLoyaltyEvents)(io);
io.use((socket, next) => {
    // SECURITY FIX: Require authentication on all connections
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return next(new Error('Authentication required'));
    }
    const auth = authenticateSocket(token);
    if (!auth) {
        return next(new Error('Invalid or expired token'));
    }
    // Attach user info to socket for use in event handlers
    socket.userId = auth.userId;
    socket.role = auth.role;
    socket.data = {
        user: { id: auth.userId, role: auth.role },
    };
    next();
});
io.on('connection', (socket) => {
    const authSocket = socket;
    console.log(`Client connected: ${socket.id}, User: ${authSocket.userId}`);
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}, User: ${authSocket.userId}`);
    });
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});
