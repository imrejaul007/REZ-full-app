/**
 * Centralized Logging with Correlation ID Support
 *
 * OPS-003 FIX: Enables unified request tracing across service boundaries.
 *
 * Features:
 * - Correlation ID propagation (W3C traceparent compatible)
 * - Structured JSON logging
 * - Service context tagging
 * - Request/response timing
 */
export interface LogContext {
    correlationId?: string;
    traceId?: string;
    spanId?: string;
    serviceName?: string;
    serviceVersion?: string;
    environment?: string;
    [key: string]: unknown;
}
export interface LogEntry {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    correlationId?: string;
    traceId?: string;
    spanId?: string;
    service?: string;
    environment?: string;
    duration?: number;
    [key: string]: unknown;
}
/**
 * Generate a new correlation ID (compatible with W3C traceparent).
 * Format: 00-{traceId}-{spanId}-{flags}
 */
export declare function generateCorrelationId(): string;
/**
 * Parse a W3C traceparent header.
 */
export declare function parseTraceparent(header: string): {
    traceId: string;
    spanId: string;
    traceFlags: string;
} | null;
/**
 * Create a child span ID from a parent.
 */
export declare function createChildSpanId(parentSpanId: string): string;
export declare function setGlobalContext(serviceName: string, environment: string): void;
declare class Logger {
    private serviceName;
    private environment;
    private baseContext;
    constructor(serviceName?: string, environment?: string);
    private formatLog;
    private output;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
    fatal(message: string, context?: LogContext): void;
    logRequest(req: {
        method: string;
        path: string;
        ip?: string;
        headers?: Record<string, string>;
        correlationId?: string;
        traceId?: string;
        spanId?: string;
    }): void;
    logResponse(req: {
        method: string;
        path: string;
        correlationId?: string;
        traceId?: string;
        spanId?: string;
    }, res: {
        statusCode: number;
    }, durationMs: number): void;
    logServiceCall(options: {
        service: string;
        method: string;
        path: string;
        correlationId?: string;
        traceId?: string;
        spanId?: string;
        durationMs?: number;
        statusCode?: number;
        error?: Error;
    }): void;
}
export declare const logger: Logger;
/**
 * Create a service-specific logger instance.
 * Alias for backward compatibility.
 */
export declare function createServiceLogger(serviceName: string): Logger;
export interface RequestContext {
    correlationId: string;
    traceId: string;
    spanId: string;
    startTime: number;
}
/**
 * Create middleware to add correlation ID to requests.
 */
export declare function correlationIdMiddleware(req: {
    headers: Record<string, string | string[] | undefined>;
    id?: () => string;
    method?: string;
    path?: string;
}, res: {
    setHeader: (name: string, value: string) => void;
    getHeader: (name: string) => string | string[] | undefined;
    statusCode?: number;
    on: (event: string, callback: () => void) => void;
}, next: () => void): RequestContext;
/**
 * Get correlation ID from current request context.
 */
export declare function getCurrentContext(requestId?: string): RequestContext | undefined;
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
            traceId?: string;
            spanId?: string;
            requestId?: string;
        }
    }
}
export declare function expressCorrelationMiddleware(req: Express.Request, res: Express.Response, next: () => void): void;
export {};
