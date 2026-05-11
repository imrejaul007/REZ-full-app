/**
 * Standardized Error Handler
 *
 * Provides consistent error response format across all services.
 * Usage: app.use(globalErrorHandler);
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Standard error codes used across the platform
 */
export declare enum ErrorCode {
    INVALID_REQUEST = "INVALID_REQUEST",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    INVALID_INPUT = "INVALID_INPUT",
    UNAUTHORIZED = "UNAUTHORIZED",
    INVALID_TOKEN = "INVALID_TOKEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    FORBIDDEN = "FORBIDDEN",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    NOT_FOUND = "NOT_FOUND",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND",
    MERCHANT_NOT_FOUND = "MERCHANT_NOT_FOUND",
    STORE_NOT_FOUND = "STORE_NOT_FOUND",
    CONFLICT = "CONFLICT",
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
    INVALID_TRANSITION = "INVALID_TRANSITION",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR"
}
/**
 * Structured error response
 */
export interface ErrorResponse {
    success: false;
    error: {
        code: ErrorCode | string;
        message: string;
        statusCode: number;
        details?: Record<string, any>;
        requestId?: string;
    };
}
/**
 * Custom application error
 */
export declare class AppError extends Error {
    message: string;
    statusCode: number;
    code: ErrorCode | string;
    details?: Record<string, any>;
    constructor(message: string, statusCode: number, code: ErrorCode | string, details?: Record<string, any>);
}
/**
 * Validation error (extends AppError)
 */
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, any>);
}
/**
 * Not found error
 */
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
/**
 * Unauthorized error
 */
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
/**
 * Rate limit error
 */
export declare class RateLimitError extends AppError {
    constructor(retryAfter?: number);
}
/**
 * Global error handler middleware
 *
 * Usage:
 * ```typescript
 * app.use(globalErrorHandler);
 * ```
 */
export declare function globalErrorHandler(error: any, req: Request, res: Response, next: NextFunction): void;
/**
 * Async route wrapper to catch errors
 *
 * Usage:
 * ```typescript
 * router.get('/', asyncHandler(async (req, res) => {
 *   const data = await getData();
 *   res.json(data);
 * }));
 * ```
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
