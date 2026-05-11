"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pos_routes_1 = __importDefault(require("./routes/pos.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = require("./utils/logger");
// Initialize Express application
const app = (0, express_1.default)();
// Define port
const PORT = process.env.PORT || 4013;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.info(`${req.method} ${req.path}`, {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        });
    });
    next();
});
// API Routes
app.use('/api/pos', pos_routes_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'ReZ POS Service',
        version: '1.0.0',
        description: 'Restaurant Point of Sale Service',
        endpoints: {
            health: '/api/pos/health',
            orders: '/api/pos/orders',
            menu: '/api/pos/menu',
            stats: '/api/pos/stats',
            revenue: '/api/pos/revenue'
        }
    });
});
// Error handling
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Start server
app.listen(PORT, () => {
    logger_1.logger.info(`POS Service started successfully`);
    logger_1.logger.info(`Server running on port ${PORT}`);
    logger_1.logger.info(`Health check: http://localhost:${PORT}/api/pos/health`);
    logger_1.logger.info(`API base URL: http://localhost:${PORT}/api/pos`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});
exports.default = app;
//# sourceMappingURL=index.js.map