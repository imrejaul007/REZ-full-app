/**
 * Gamification Service HTTP Server
 *
 * Provides REST endpoints for querying achievement and streak data.
 * Runs alongside the BullMQ workers on PORT (default 3004).
 *
 * Routes:
 *   GET /health                 — liveness probe
 *   GET /achievements/:userId   — earned + locked achievements for a user
 *   GET /streak/:userId         — current streak info for a user
 */
import express from 'express';
export declare function validateWalletServiceUrl(): void;
export declare function creditCoinsViaWalletService(userId: string, amount: number, idempotencyKey: string, description: string, coinType?: string, source?: string): Promise<boolean>;
export declare const jobMetrics: {
    processed: Map<string, number>;
    failed: Map<string, number>;
    durationSumSeconds: Map<string, number>;
    durationCount: Map<string, number>;
    activeWorkers: number;
};
export declare function recordJobProcessed(jobName: string, durationMs: number): void;
export declare function recordJobFailed(jobName: string): void;
export declare function createHttpApp(): express.Application;
export declare function startHttpServer(port: number): ReturnType<express.Application['listen']>;
//# sourceMappingURL=httpServer.d.ts.map