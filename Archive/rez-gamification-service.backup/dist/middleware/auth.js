"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: 'Missing token' });
        return;
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ success: false, error: 'Auth not configured' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(header.slice(7), secret, { algorithms: ['HS256'] });
        req.userId = decoded.userId;
        next();
    }
    catch {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
}
function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            const secret = process.env.JWT_SECRET;
            if (secret) {
                const decoded = jsonwebtoken_1.default.verify(header.slice(7), secret, { algorithms: ['HS256'] });
                req.userId = decoded.userId;
            }
        }
        catch {
            // Ignore — anonymous access allowed
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map