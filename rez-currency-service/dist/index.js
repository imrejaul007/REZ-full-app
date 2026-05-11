"use strict";
/**
 * ReZ Currency Service
 * Multi-currency service with real-time exchange rates and conversion
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const currency_routes_1 = __importDefault(require("./routes/currency.routes"));
const logger_1 = __importDefault(require("./utils/logger"));
const PORT = process.env.PORT || 4026;
const HOST = process.env.HOST || '0.0.0.0';
/**
 * Create and configure Express application
 */
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    // CORS configuration
    app.use((0, cors_1.default)({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));
    // Body parsing
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Request logging
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger_1.default.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        });
        next();
    });
    // API routes
    app.use('/api', currency_routes_1.default);
    // Root endpoint
    app.get('/', (req, res) => {
        res.json({
            service: 'ReZ Currency Service',
            version: '1.0.0',
            description: 'Multi-currency service with real-time exchange rates and conversion',
            endpoints: {
                health: 'GET /api/health',
                currencies: 'GET /api/currencies',
                currencyDetails: 'GET /api/currencies/:code',
                rates: 'GET /api/rates',
                rate: 'GET /api/rates/:from/:to',
                convert: 'POST /api/convert',
                convertBatch: 'POST /api/convert/batch',
                format: 'GET /api/format',
                refreshRates: 'POST /api/rates/refresh'
            }
        });
    });
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `Route ${req.method} ${req.path} not found`
            }
        });
    });
    // Global error handler
    app.use((err, req, res, next) => {
        logger_1.default.error('Unhandled error', {
            error: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method
        });
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: process.env.NODE_ENV === 'production'
                    ? 'An internal error occurred'
                    : err.message
            }
        });
    });
    return app;
}
/**
 * Start the server
 */
async function startServer() {
    try {
        const app = createApp();
        app.listen(Number(PORT), HOST, () => {
            logger_1.default.info(`
╔═══════════════════════════════════════════════════════════╗
║           ReZ Currency Service Started                    ║
╠═══════════════════════════════════════════════════════════╣
║  Server:  http://${HOST}:${PORT}                            ║
║  Health:  http://${HOST}:${PORT}/api/health                ║
║  API:     http://${HOST}:${PORT}/api                        ║
╚═══════════════════════════════════════════════════════════╝
      `);
        });
        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger_1.default.info('SIGTERM received, shutting down gracefully');
            process.exit(0);
        });
        process.on('SIGINT', () => {
            logger_1.default.info('SIGINT received, shutting down gracefully');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server', error);
        process.exit(1);
    }
}
// Start the server
startServer();
//# sourceMappingURL=index.js.map