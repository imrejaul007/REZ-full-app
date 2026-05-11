"use strict";
/**
 * CORS Configuration for REZ Loyalty System
 *
 * Configures Cross-Origin Resource Sharing with appropriate security settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCORSConfig = getCORSConfig;
exports.createCORSOptions = createCORSOptions;
exports.validateWebSocketOrigin = validateWebSocketOrigin;
exports.getAllowedOrigin = getAllowedOrigin;
exports.getProductionCORSConfig = getProductionCORSConfig;
exports.getDevelopmentCORSConfig = getDevelopmentCORSConfig;
exports.getEnvironmentCORSConfig = getEnvironmentCORSConfig;
// Default allowed origins (should be configured via environment)
const DEFAULT_ORIGINS = [
    'https://rez-app.com',
    'https://admin.rez-app.com',
    'https://merchant.rez-app.com',
];
// Allowed HTTP methods
const ALLOWED_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD',
];
// Allowed headers
const ALLOWED_HEADERS = [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-Correlation-ID',
    'X-API-Key',
    'X-Service-Token',
    'Accept',
    'Accept-Language',
    'Cache-Control',
];
// Headers exposed to clients
const EXPOSED_HEADERS = [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
    'X-Correlation-ID',
    'Retry-After',
];
/**
 * Parse allowed origins from environment
 */
function parseAllowedOrigins() {
    const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
    if (envOrigins) {
        return envOrigins.split(',').map((o) => o.trim());
    }
    return DEFAULT_ORIGINS;
}
/**
 * Get CORS configuration
 */
function getCORSConfig() {
    return {
        allowedOrigins: parseAllowedOrigins(),
        allowedMethods: [...ALLOWED_METHODS],
        allowedHeaders: [...ALLOWED_HEADERS],
        exposedHeaders: [...EXPOSED_HEADERS],
        credentials: true,
        maxAge: 86400, // 24 hours
        preflightContinue: false,
    };
}
/**
 * Create CORS middleware options
 */
function createCORSOptions() {
    const config = getCORSConfig();
    return {
        origin: (origin, callback) => {
            // Allow requests with no origin (curl, Postman, server-to-server)
            if (!origin) {
                return callback(null, true);
            }
            // Check if origin is in allowed list
            if (config.allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            // In development, allow all origins
            if (process.env.NODE_ENV === 'development') {
                return callback(null, true);
            }
            // Block other origins
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        },
        methods: config.allowedMethods,
        allowedHeaders: config.allowedHeaders,
        exposedHeaders: config.exposedHeaders,
        credentials: config.credentials,
        maxAge: config.maxAge,
        preflightContinue: config.preflightContinue,
    };
}
/**
 * Validate origin for WebSocket connections
 */
function validateWebSocketOrigin(origin) {
    if (!origin)
        return true; // Allow no origin (server-to-server)
    const config = getCORSConfig();
    // Allow if in allowed list
    if (config.allowedOrigins.includes(origin)) {
        return true;
    }
    // In development, allow all
    if (process.env.NODE_ENV === 'development') {
        return true;
    }
    return false;
}
/**
 * Get allowed origin for response header
 */
function getAllowedOrigin(requestOrigin) {
    const config = getCORSConfig();
    if (!requestOrigin) {
        return config.allowedOrigins[0] || '';
    }
    if (config.allowedOrigins.includes(requestOrigin)) {
        return requestOrigin;
    }
    if (process.env.NODE_ENV === 'development') {
        return requestOrigin;
    }
    return '';
}
/**
 * Production CORS configuration (stricter)
 */
function getProductionCORSConfig() {
    return {
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
        credentials: true,
        maxAge: 86400,
        preflightContinue: false,
    };
}
/**
 * Development CORS configuration (permissive)
 */
function getDevelopmentCORSConfig() {
    return {
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: ['*'],
        exposedHeaders: ['*'],
        credentials: false,
        maxAge: 3600,
        preflightContinue: true,
    };
}
/**
 * Get environment-specific CORS config
 */
function getEnvironmentCORSConfig() {
    switch (process.env.NODE_ENV) {
        case 'production':
            return getProductionCORSConfig();
        case 'development':
        case 'test':
            return getDevelopmentCORSConfig();
        default:
            return getCORSConfig();
    }
}
//# sourceMappingURL=corsConfig.js.map