/**
 * Health Check Endpoints for Rez Travel Service
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

// Basic health check
router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: process.env.SERVICE_NAME || 'rez-travel-service',
    timestamp: new Date().toISOString(),
  });
});

// Liveness probe
router.get('/live', (_req: Request, res: Response) => {
  res.json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Check MongoDB
  try {
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    checks.mongodb = { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    checks.mongodb = { status: 'error', error: (error as Error).message };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export default router;
