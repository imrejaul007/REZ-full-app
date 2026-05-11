"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const serviceName = process.env.SERVICE_NAME || 'microservice';
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), process.env.NODE_ENV === 'production'
        ? winston_1.default.format.json()
        : winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())),
    defaultMeta: { service: serviceName },
    transports: [new winston_1.default.transports.Console()],
});
// Safely merge meta — when meta is a string, spreading it produces { '0':'r', '1':'e', ... }
// (JS string spread by character index). Wrap strings in { error: meta } instead.
function safeMeta(name, meta) {
    if (meta === undefined || meta === null)
        return { component: name };
    if (typeof meta === 'string')
        return { component: name, error: meta };
    if (typeof meta !== 'object')
        return { component: name, error: String(meta) };
    return { component: name, ...meta };
}
const createServiceLogger = (name) => ({
    info: (message, meta) => exports.logger.info(message, safeMeta(name, meta)),
    warn: (message, meta) => exports.logger.warn(message, safeMeta(name, meta)),
    error: (message, meta) => exports.logger.error(message, safeMeta(name, meta)),
    debug: (message, meta) => exports.logger.debug(message, safeMeta(name, meta)),
});
exports.createServiceLogger = createServiceLogger;
//# sourceMappingURL=logger.js.map