"use strict";
/**
 * Authentication Middleware for REZ Loyalty System
 *
 * Handles JWT validation, internal service tokens, and API key authentication.
 * Supports both user-facing and service-to-service authentication.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeServiceTokens = initializeServiceTokens;
exports.validateJWT = validateJWT;
exports.generateJWT = generateJWT;
exports.validateServiceToken = validateServiceToken;
exports.generateServiceToken = generateServiceToken;
exports.validateApiKey = validateApiKey;
exports.authMiddleware = authMiddleware;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.optionalAuth = optionalAuth;
exports.getUserId = getUserId;
exports.isInternalRequest = isInternalRequest;
exports.createAuthHeader = createAuthHeader;
exports.createServiceAuthHeader = createServiceAuthHeader;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
// Configuration (should come from environment in production)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';
const API_KEY_HEADER = 'x-api-key';
// Service tokens registry (in production, store in secure vault)
const SERVICE_TOKENS = new Map();
/**
 * Initialize service tokens from environment
 */
function initializeServiceTokens(tokens) {
    for (const [serviceId, secret] of Object.entries(tokens)) {
        SERVICE_TOKENS.set(serviceId, {
            serviceId,
            secret,
            permissions: getServicePermissions(serviceId),
        });
    }
}
/**
 * Get default permissions for a service
 */
function getServicePermissions(serviceId) {
    const permissionMap = {
        'rez-api-gateway': ['read', 'write', 'admin'],
        'rez-profile-service': ['read', 'write'],
        'rez-score-service': ['read', 'write'],
        'rez-decision-service': ['read', 'write', 'decide'],
        'rez-wallet-service': ['read', 'write', 'transaction'],
        'rez-admin-service': ['read', 'write', 'admin', 'delete'],
        'rez-notifications-hub': ['read', 'write'],
        'rez-audit-logging': ['read', 'write', 'audit'],
    };
    return permissionMap[serviceId] || ['read'];
}
// ============================================================================
// JWT Authentication
// ============================================================================
/**
 * Validate JWT token and extract payload
 */
function validateJWT(token) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (!payload.sub || !payload.role) {
            return { valid: false, error: 'Invalid token structure' };
        }
        if (payload.type !== 'access') {
            return { valid: false, error: 'Token must be an access token' };
        }
        return { valid: true, payload };
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return { valid: false, error: 'Token has expired' };
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return { valid: false, error: 'Invalid token signature' };
        }
        return { valid: false, error: 'Token validation failed' };
    }
}
/**
 * Generate a new JWT token
 */
function generateJWT(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: payload.type === 'refresh' ? '7d' : '1h',
    });
}
// ============================================================================
// Service Token Authentication
// ============================================================================
/**
 * Validate internal service token using HMAC
 */
function validateServiceToken(serviceId, timestamp, signature) {
    const serviceConfig = SERVICE_TOKENS.get(serviceId);
    if (!serviceConfig) {
        return { valid: false, error: 'Unknown service' };
    }
    // Check timestamp is within 5 minutes
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    if (Math.abs(now - tokenTime) > 5 * 60 * 1000) {
        return { valid: false, error: 'Token timestamp expired' };
    }
    // Verify HMAC signature
    const expectedSignature = crypto_1.default
        .createHmac('sha256', serviceConfig.secret)
        .update(`${serviceId}:${timestamp}`)
        .digest('hex');
    if (!crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return { valid: false, error: 'Invalid signature' };
    }
    return {
        valid: true,
        payload: {
            sub: serviceId,
            role: 'service',
            type: 'access',
            iat: Math.floor(now / 1000),
            exp: Math.floor((now + 5 * 60 * 1000) / 1000),
            iss: 'rez-internal',
        },
    };
}
/**
 * Generate a service token for outbound requests
 */
function generateServiceToken(serviceId) {
    const serviceConfig = SERVICE_TOKENS.get(serviceId);
    if (!serviceConfig) {
        throw new Error(`Service ${serviceId} not registered`);
    }
    const timestamp = Date.now().toString();
    const signature = crypto_1.default
        .createHmac('sha256', serviceConfig.secret)
        .update(`${serviceId}:${timestamp}`)
        .digest('hex');
    return {
        token: `${serviceId}:${timestamp}:${signature}`,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
}
// ============================================================================
// API Key Authentication
// ============================================================================
/**
 * Validate API key
 */
function validateApiKey(apiKey) {
    // In production, validate against database or vault
    if (!apiKey || apiKey.length < 32) {
        return { valid: false, error: 'Invalid API key format' };
    }
    // Example: Check against environment-configured keys
    const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');
    if (!validApiKeys.includes(apiKey)) {
        return { valid: false, error: 'Invalid API key' };
    }
    return {
        valid: true,
        payload: {
            sub: 'api-client',
            role: 'service',
            type: 'access',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000),
        },
    };
}
// ============================================================================
// Express Middleware
// ============================================================================
/**
 * Main authentication middleware
 * Supports JWT, service tokens, and API keys
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers[API_KEY_HEADER];
    // Try API key first
    if (apiKey) {
        const result = validateApiKey(apiKey);
        if (result.valid) {
            req.user = result.payload;
            req.isInternal = true;
            return next();
        }
    }
    // Try JWT
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const result = validateJWT(token);
        if (result.valid) {
            req.user = result.payload;
            req.isInternal = false;
            return next();
        }
    }
    // Try service token
    const serviceToken = req.headers['x-service-token'];
    if (serviceToken) {
        const [serviceId, timestamp, signature] = serviceToken.split(':');
        if (serviceId && timestamp && signature) {
            const result = validateServiceToken(serviceId, timestamp, signature);
            if (result.valid) {
                req.user = result.payload;
                req.serviceId = serviceId;
                req.isInternal = true;
                return next();
            }
        }
    }
    res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
    });
}
/**
 * Require specific roles
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of: ${allowedRoles.join(', ')}`,
            });
            return;
        }
        next();
    };
}
/**
 * Require specific service permissions
 */
function requirePermission(...permissions) {
    return (req, res, next) => {
        if (!req.serviceId) {
            res.status(403).json({ error: 'Service authentication required' });
            return;
        }
        const serviceConfig = SERVICE_TOKENS.get(req.serviceId);
        if (!serviceConfig) {
            res.status(403).json({ error: 'Unknown service' });
            return;
        }
        const hasAllPermissions = permissions.every((p) => serviceConfig.permissions.includes(p));
        if (!hasAllPermissions) {
            res.status(403).json({
                error: 'Forbidden',
                message: `Service requires permissions: ${permissions.join(', ')}`,
            });
            return;
        }
        next();
    };
}
/**
 * Optional authentication - doesn't fail if no token present
 */
function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const result = validateJWT(token);
        if (result.valid) {
            req.user = result.payload;
        }
    }
    req.isInternal = false;
    next();
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Extract user ID from request
 */
function getUserId(req) {
    return req.user?.sub ?? null;
}
/**
 * Check if request is from internal service
 */
function isInternalRequest(req) {
    return req.isInternal || req.user?.role === 'service' || req.user?.role === 'system';
}
/**
 * Create auth header for outbound requests
 */
function createAuthHeader(token) {
    return { Authorization: `Bearer ${token}` };
}
/**
 * Create service token header for outbound requests
 */
function createServiceAuthHeader(serviceId) {
    const { token } = generateServiceToken(serviceId);
    return { 'x-service-token': token };
}
//# sourceMappingURL=authMiddleware.js.map