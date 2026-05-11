"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.createAppError = createAppError;
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'An unexpected error occurred';
    logger_1.logger.error(`Error: ${message}`, {
        statusCode,
        code,
        path: req.path,
        method: req.method,
        stack: err.stack,
        details: err.details
    });
    res.status(statusCode).json({
        success: false,
        error: {
            code,
            message,
            details: err.details
        },
        timestamp: new Date().toISOString()
    });
}
function notFoundHandler(req, res) {
    logger_1.logger.warn(`Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`
        },
        timestamp: new Date().toISOString()
    });
}
function createAppError(message, statusCode, code, details) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.details = details;
    return error;
}
//# sourceMappingURL=errorHandler.js.map