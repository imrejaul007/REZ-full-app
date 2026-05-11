"use strict";
/**
 * REZ Loyalty Security Package
 *
 * Comprehensive security utilities for the REZ Loyalty System.
 *
 * @example
 * ```typescript
 * import {
 *   RATE_LIMITS,
 *   validateOrThrow,
 *   authMiddleware,
 *   logCoinTransaction,
 *   securityHeadersMiddleware,
 *   getCORSConfig,
 *   AUTH,
 * } from '@rez-loyalty/security';
 * ```
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeForLogging = exports.isInRange = exports.getNextTierThreshold = exports.getTierFromPoints = exports.ENV = exports.LOYALTY = exports.AUDIT = exports.HEADERS = exports.CORS = exports.COOKIE = exports.VALIDATION = exports.CRYPTO = exports.RATE_LIMITS = exports.API = exports.AUTH = void 0;
// Re-export all modules
__exportStar(require("./rateLimits"), exports);
__exportStar(require("./inputValidation"), exports);
__exportStar(require("./authMiddleware"), exports);
__exportStar(require("./auditLogger"), exports);
__exportStar(require("./corsConfig"), exports);
__exportStar(require("./helmet"), exports);
// Re-export constants with explicit names to avoid RATE_LIMITS conflict
var constants_1 = require("./constants");
Object.defineProperty(exports, "AUTH", { enumerable: true, get: function () { return constants_1.AUTH; } });
Object.defineProperty(exports, "API", { enumerable: true, get: function () { return constants_1.API; } });
Object.defineProperty(exports, "RATE_LIMITS", { enumerable: true, get: function () { return constants_1.RATE_LIMITS; } });
Object.defineProperty(exports, "CRYPTO", { enumerable: true, get: function () { return constants_1.CRYPTO; } });
Object.defineProperty(exports, "VALIDATION", { enumerable: true, get: function () { return constants_1.VALIDATION; } });
Object.defineProperty(exports, "COOKIE", { enumerable: true, get: function () { return constants_1.COOKIE; } });
Object.defineProperty(exports, "CORS", { enumerable: true, get: function () { return constants_1.CORS; } });
Object.defineProperty(exports, "HEADERS", { enumerable: true, get: function () { return constants_1.HEADERS; } });
Object.defineProperty(exports, "AUDIT", { enumerable: true, get: function () { return constants_1.AUDIT; } });
Object.defineProperty(exports, "LOYALTY", { enumerable: true, get: function () { return constants_1.LOYALTY; } });
Object.defineProperty(exports, "ENV", { enumerable: true, get: function () { return constants_1.ENV; } });
Object.defineProperty(exports, "getTierFromPoints", { enumerable: true, get: function () { return constants_1.getTierFromPoints; } });
Object.defineProperty(exports, "getNextTierThreshold", { enumerable: true, get: function () { return constants_1.getNextTierThreshold; } });
Object.defineProperty(exports, "isInRange", { enumerable: true, get: function () { return constants_1.isInRange; } });
Object.defineProperty(exports, "sanitizeForLogging", { enumerable: true, get: function () { return constants_1.sanitizeForLogging; } });
//# sourceMappingURL=index.js.map