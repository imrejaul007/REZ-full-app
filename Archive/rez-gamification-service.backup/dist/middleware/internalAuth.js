"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireInternalToken = requireInternalToken;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../config/logger");
// HIGH-09 FIX: Load HMAC key from environment at module load time with validation
let HMAC_KEY = process.env.INTERNAL_HMAC_KEY || process.env.INTERNAL_SERVICE_TOKEN || '';
let _ipAllowlistCache = null;
function getIpAllowlist() {
    if (_ipAllowlistCache !== null)
        return _ipAllowlistCache;
    const raw = process.env.ALLOWED_INTERNAL_IPS;
    _ipAllowlistCache = raw
        ? raw.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    return _ipAllowlistCache;
}
function ipInRange(ip, cidr) {
    if (!cidr.includes('/'))
        return ip === cidr;
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);
    const ipNum = ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
    const rangeNum = range.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
    return (ipNum & mask) === (rangeNum & mask);
}
function isPrivateIp(ip) {
    const normalized = ip.replace(/^::ffff:/, '');
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(normalized))
        return true;
    if (normalized === '::1' || normalized === 'fe80:' || normalized.startsWith('fc') || normalized.startsWith('fd'))
        return true;
    return false;
}
function getCallerIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
        for (let i = parts.length - 1; i >= 0; i--) {
            const candidate = parts[i].replace(/^::ffff:/, '');
            if (!isPrivateIp(candidate))
                return candidate;
        }
        if (parts.length > 0)
            return parts[parts.length - 1].replace(/^::ffff:/, '');
    }
    return req.ip || req.socket?.remoteAddress || null;
}
function checkIpAllowlist(req) {
    const allowlist = getIpAllowlist();
    if (allowlist.length === 0)
        return true;
    const callerIp = getCallerIp(req);
    if (!callerIp)
        return false;
    const normalizedIp = callerIp.replace(/^::ffff:/, '');
    return allowlist.some((cidr) => ipInRange(normalizedIp, cidr));
}
// Log warning if no HMAC key is configured (but don't throw — let service start)
// This allows graceful degradation vs fatal crash on misconfigured deployment.
if (!HMAC_KEY) {
    if (process.env.NODE_ENV === 'production') {
        logger_1.logger.error('[FATAL] internalAuth: INTERNAL_HMAC_KEY or INTERNAL_SERVICE_TOKEN must be set in production');
    }
    else {
        logger_1.logger.warn('[INTERNAL_AUTH] WARNING: No HMAC key configured — internal routes are unprotected in production!');
    }
}
function resolveScopedTokens() {
    try {
        const raw = process.env.INTERNAL_SERVICE_TOKENS_JSON;
        const parsed = raw ? JSON.parse(raw) : {};
        return Object.keys(parsed).length > 0 ? parsed : null;
    }
    catch {
        return null;
    }
}
// BAK-CROSS-012 FIX: Reject any request with a blank token rather than
// falling through to HMAC comparison with an empty string. Previously,
// if no valid token was configured, a blank token would pass the
// timing-safe HMAC comparison (empty buffer vs empty buffer = equal).
function isBlankToken(token) {
    return !token || token.trim().length === 0;
}
function requireInternalToken(req, res, next) {
    // IP allowlist — defense-in-depth, best enforced at network layer (K8s NetworkPolicy).
    if (!checkIpAllowlist(req)) {
        res.status(403).json({ success: false, error: 'Caller IP not in allowlist' });
        return;
    }
    // In production, block if no HMAC key is configured.
    if (!HMAC_KEY && process.env.NODE_ENV === 'production') {
        res.status(503).json({ success: false, error: 'Internal auth not configured' });
        return;
    }
    const token = req.headers['x-internal-token'];
    const callerService = req.headers['x-internal-service'];
    const scopedTokens = resolveScopedTokens();
    const legacyToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (!scopedTokens && !legacyToken) {
        res.status(503).json({ success: false, error: 'Internal auth not configured — set INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN' });
        return;
    }
    // BAK-CROSS-012 FIX: Reject blank tokens immediately. Previously, if
    // INTERNAL_SERVICE_TOKEN was empty or unset, a blank token would compare
    // equal to an empty expected value (empty HMAC digest = empty HMAC digest),
    // allowing unauthenticated access.
    if (isBlankToken(token)) {
        res.status(401).json({ success: false, error: 'Invalid internal token' });
        return;
    }
    let expected;
    if (scopedTokens && callerService) {
        expected = scopedTokens[callerService];
    }
    else if (legacyToken) {
        expected = legacyToken;
    }
    // Hash both sides with HMAC before comparing — eliminates length oracle.
    // Even if token/expected differ in length, the digests are always 32 bytes,
    // so timingSafeEqual never throws and the comparison is constant-time.
    // HIGH-09 FIX: Use environment-backed HMAC key instead of hardcoded string
    const tokenHash = crypto_1.default.createHmac('sha256', HMAC_KEY).update(token || '').digest();
    const expectedHash = crypto_1.default.createHmac('sha256', HMAC_KEY).update(expected || '').digest();
    const isValid = !!expected &&
        crypto_1.default.timingSafeEqual(tokenHash, expectedHash);
    if (!isValid) {
        res.status(401).json({ success: false, error: 'Invalid internal token' });
        return;
    }
    next();
}
//# sourceMappingURL=internalAuth.js.map