/**
 * Finance DLQ Admin — BAK-CROSS-005 fix
 *
 * Provides visibility and manual retry capability for the coin-reward queue's DLQ.
 * Jobs land here only after all BullMQ retries are exhausted.
 * Wallet service's idempotency key guarantees safe retries.
 *
 * This addresses the silent-drop risk: when both the direct wallet call AND the
 * BullMQ queue enqueue fail, the caller does NOT update coinsAwarded in the DB,
 * and the user silently loses coins. This endpoint gives ops a way to detect and
 * recover those stuck jobs.
 */

import { Router, Request, Response } from 'express';
import { rewardsHookService } from '../services/rewardsHookService';
import { logger } from '../config/logger';
import { requireInternalToken } from '../middleware/auth';

const router = Router();

/**
 * GET /finance/admin/dlq/coin-reward
 *
 * Returns count of failed coin-reward jobs. Ops can poll this endpoint and
 * alert when count > 0.
 *
 * Requires internal service token auth.
 */
router.get('/coin-reward/count', requireInternalToken, async (_req: Request, res: Response) => {
  try {
    const counts = await rewardsHookService.getQueueCounts();
    return res.json({
      success: true,
      queue: 'coin-reward',
      counts,
    });
  } catch (err) {
    const msg = (err as Error).message;
    logger.error('[DLQ Admin] Failed to get coin-reward counts', { error: msg });
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /finance/admin/dlq/coin-reward/jobs
 *
 * Returns failed coin-reward jobs (up to limit, default 50).
 * Use this to audit which rewards failed and why.
 *
 * Requires internal service token auth.
 */
router.get('/coin-reward/jobs', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const jobs = await rewardsHookService.getFailedJobs(limit);
    return res.json({
      success: true,
      queue: 'coin-reward',
      count: jobs.length,
      jobs,
    });
  } catch (err) {
    const msg = (err as Error).message;
    logger.error('[DLQ Admin] Failed to get failed jobs', { error: msg });
    return res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /finance/admin/dlq/coin-reward/retry/:jobId
 *
 * Retries a specific failed coin-reward job by ID.
 * The wallet's idempotency key prevents double-credit.
 *
 * Requires internal service token auth.
 */
router.post('/coin-reward/retry/:jobId', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    await rewardsHookService.retryFailedJob(jobId);
    logger.info('[DLQ Admin] Retrying failed coin-reward job', { jobId });
    return res.json({ success: true, jobId, action: 'retry_enqueued' });
  } catch (err) {
    const msg = (err as Error).message;
    logger.error('[DLQ Admin] Failed to retry job', { jobId: req.params.jobId, error: msg });
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
