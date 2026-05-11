/**
 * Structured Request Logger Middleware
 *
 * Adds correlation IDs, logs all requests with structured format.
 * Loki-compatible JSON output for log aggregation.
 * Prometheus metrics for request monitoring.
 *
 * Usage: app.use(requestLogger);
 * Usage: app.use(requestLogger({ prometheus: true }));
 */
import { Request, Response, NextFunction } from 'express';
export interface LogContext {
    correlationId: string;
    requestId: string;
    timestamp: string;
    path: string;
    method: string;
    userId?: string;
    merchantId?: string;
    statusCode?: number;
    duration?: number;
    error?: string;
    service?: string;
    job?: string;
}
export interface RequestLoggerOptions {
    service?: string;
    prometheus?: boolean;
    logToStdout?: boolean;
}
/**
 * Get Prometheus-compatible metrics
 */
export declare function getPrometheusMetrics(): {
    http_requests_total: {
        [key: string]: number;
    };
    http_request_duration_seconds: {
        [key: string]: number;
    };
    http_requests_in_flight: number;
};
/**
 * Reset metrics (for testing)
 */
export declare function resetMetrics(): void;
/**
 * Structured logger with Loki-compatible JSON format
 */
export declare function structuredLog(context: Partial<LogContext>, message: string, data?: any): void;
/**
 * Structured logger for errors (Loki-compatible)
 */
export declare function logError(context: Partial<LogContext>, error: Error, data?: any): void;
/**
 * Request logging middleware
 *
 * Adds:
 * - Correlation ID (x-correlation-id header)
 * - Request ID
 * - User ID / Merchant ID extraction
 * - Request/response logging
 * - Loki-compatible JSON output
 * - Prometheus metrics collection
 */
export declare function requestLogger(options?: RequestLoggerOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Express middleware to attach logger to request
 */
export declare function attachLogger(req: Request, res: Response, next: NextFunction): void;
