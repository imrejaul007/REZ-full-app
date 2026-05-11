/**
 * Health Check Middleware
 *
 * OPS-003 FIX: Standardized health check endpoints across all services.
 *
 * Provides health status endpoints for monitoring and orchestration.
 * Usage: app.use(healthCheckRouter);
 *
 * Endpoints:
 *   GET /health         — Basic health (always 200 if process is running)
 *   GET /health/ready  — Readiness probe (checks dependencies)
 *   GET /health/live   — Liveness probe (Kubernetes)
 *   GET /health/startup — Startup probe (Kubernetes)
 */
import { Router } from 'express';
import type Redis from 'ioredis';
import mongoose from 'mongoose';
export interface HealthCheckDependencies {
    redis?: Redis;
    mongoose?: typeof mongoose;
    serviceName?: string;
}
export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    service?: string;
    checks: {
        database?: {
            status: 'up' | 'down';
            latency?: number;
        };
        redis?: {
            status: 'up' | 'down';
            latency?: number;
        };
        memory?: {
            used: number;
            heapUsed: number;
            heapTotal: number;
        };
    };
    errors?: string[];
}
/**
 * Create health check router
 */
export declare function createHealthCheckRouter(deps: HealthCheckDependencies): Router;
/**
 * Middleware to attach health check functions to app
 */
export declare function attachHealthChecks(app: any, deps: HealthCheckDependencies): void;
