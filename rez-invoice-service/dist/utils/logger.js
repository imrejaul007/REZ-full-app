"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Logger {
    logDir;
    errorLogPath;
    accessLogPath;
    combinedLogPath;
    constructor(logDir) {
        this.logDir = logDir || path.join(process.cwd(), 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().split('T')[0];
        this.errorLogPath = path.join(this.logDir, `error-${timestamp}.log`);
        this.accessLogPath = path.join(this.logDir, `access-${timestamp}.log`);
        this.combinedLogPath = path.join(this.logDir, `combined-${timestamp}.log`);
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
    }
    writeToFile(filePath, message) {
        try {
            fs.appendFileSync(filePath, message);
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    info(message, meta) {
        const formatted = this.formatMessage('INFO', message, meta);
        console.log(formatted.trim());
        this.writeToFile(this.combinedLogPath, formatted);
    }
    warn(message, meta) {
        const formatted = this.formatMessage('WARN', message, meta);
        console.warn(formatted.trim());
        this.writeToFile(this.combinedLogPath, formatted);
        this.writeToFile(this.errorLogPath, formatted);
    }
    error(message, meta) {
        const formatted = this.formatMessage('ERROR', message, meta);
        console.error(formatted.trim());
        this.writeToFile(this.errorLogPath, formatted);
        this.writeToFile(this.combinedLogPath, formatted);
    }
    debug(message, meta) {
        if (process.env.NODE_ENV !== 'production') {
            const formatted = this.formatMessage('DEBUG', message, meta);
            console.log(formatted.trim());
        }
    }
    logRequest(req, res, duration) {
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
        const meta = {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            status: res.statusCode
        };
        const formatted = this.formatMessage('ACCESS', message, meta);
        this.writeToFile(this.accessLogPath, formatted);
    }
}
exports.Logger = Logger;
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map