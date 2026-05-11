"use strict";
/**
 * Security Headers Configuration for REZ Loyalty System
 *
 * Configures Helmet.js and additional security headers to protect
 * against common web vulnerabilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityHeadersConfig = getSecurityHeadersConfig;
exports.securityHeadersMiddleware = securityHeadersMiddleware;
exports.getHelmetConfig = getHelmetConfig;
exports.getDefaultSecurityHeaders = getDefaultSecurityHeaders;
exports.applySecurityHeaders = applySecurityHeaders;
exports.getDevelopmentSecurityHeaders = getDevelopmentSecurityHeaders;
exports.getEnvironmentSecurityHeaders = getEnvironmentSecurityHeaders;
// Default Content Security Policy
const DEFAULT_CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https: blob:",
    "connect-src 'self' https://api.rez-app.com wss://ws.rez-app.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
].join('; ');
/**
 * Get security headers configuration
 */
function getSecurityHeadersConfig() {
    return {
        contentSecurityPolicy: process.env.CSP_HEADER || DEFAULT_CSP,
        crossOriginEmbedderPolicy: 'require-corp',
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginResourcePolicy: 'same-origin',
        dnsPrefetchControl: { allow: false },
        frameguard: { action: 'deny' },
        hidePoweredBy: true,
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        },
        ieNoOpen: true,
        noSniff: true,
        originAgentCluster: true,
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true,
    };
}
/**
 * Express middleware to set security headers
 */
function securityHeadersMiddleware(req, res, next) {
    const config = getSecurityHeadersConfig();
    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');
    // X-XSS-Protection (legacy but still useful)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Strict-Transport-Security
    res.setHeader('Strict-Transport-Security', `max-age=${config.hsts.maxAge}${config.hsts.includeSubDomains ? '; includeSubDomains' : ''}${config.hsts.preload ? '; preload' : ''}`);
    // Content-Security-Policy
    res.setHeader('Content-Security-Policy', config.contentSecurityPolicy);
    // X-Content-Security-Policy (legacy Firefox)
    res.setHeader('X-Content-Security-Policy', config.contentSecurityPolicy);
    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    // Referrer-Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions-Policy
    res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
    // Cross-Origin policies
    res.setHeader('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy);
    res.setHeader('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy);
    res.setHeader('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy);
    // Cache-Control for sensitive pages
    if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    next();
}
/**
 * Helmet configuration for TypeScript
 */
function getHelmetConfig() {
    const config = getSecurityHeadersConfig();
    return {
        contentSecurityPolicy: {
            directives: parseCSP(config.contentSecurityPolicy),
        },
        crossOriginEmbedderPolicy: config.crossOriginEmbedderPolicy === 'require-corp',
        crossOriginOpenerPolicy: config.crossOriginOpenerPolicy,
        crossOriginResourcePolicy: config.crossOriginResourcePolicy,
        dnsPrefetchControl: config.dnsPrefetchControl,
        frameguard: config.frameguard,
        hidePoweredOn: config.hidePoweredBy,
        hsts: config.hsts,
        ieNoOpen: config.ieNoOpen,
        noSniff: config.noSniff,
        originAgentCluster: config.originAgentCluster,
        permittedCrossDomainPolicies: config.permittedCrossDomainPolicies,
        referrerPolicy: config.referrerPolicy,
    };
}
/**
 * Parse CSP string into Helmet directives format
 */
function parseCSP(csp) {
    const directives = {};
    const rules = csp.split(';').map((r) => r.trim());
    for (const rule of rules) {
        const [directive, ...values] = rule.split(/\s+/);
        if (directive && values.length > 0) {
            directives[directive] = values;
        }
    }
    return directives;
}
/**
 * Get default security headers object (for use without middleware)
 */
function getDefaultSecurityHeaders() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': getSecurityHeadersConfig().contentSecurityPolicy,
        'X-Permitted-Cross-Domain-Policies': 'none',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin',
    };
}
/**
 * Apply security headers to a response
 */
function applySecurityHeaders(res) {
    const headers = getDefaultSecurityHeaders();
    for (const [key, value] of Object.entries(headers)) {
        res.setHeader(key, value);
    }
    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
}
/**
 * Development security headers (less strict)
 */
function getDevelopmentSecurityHeaders() {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=0',
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; connect-src 'self' http://localhost:* https://*",
        'Referrer-Policy': 'no-referrer-when-downgrade',
    };
}
/**
 * Get environment-appropriate security headers
 */
function getEnvironmentSecurityHeaders() {
    if (process.env.NODE_ENV === 'development') {
        return getDevelopmentSecurityHeaders();
    }
    return getDefaultSecurityHeaders();
}
//# sourceMappingURL=helmet.js.map