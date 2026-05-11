/**
 * Benchmarks HTTP Router
 *
 * GET /benchmarks/:merchantId
 *   Headers: X-Internal-Token (required)
 *   Returns: BenchmarkMetrics | { insufficient_data: true }
 *
 * GET /benchmarks/peer-group?city=bangalore&cuisine=indian
 *   Headers: X-Internal-Token (required)
 *   Returns: PeerGroupStats
 */

import { Router, Request, Response } from 'express';
import { computeBenchmarks, getPeerGroupStats } from '../engines/BenchmarkEngine';
import { logger } from '../config/logger';

export function createBenchmarksRouter(): Router {
  const router = Router();

  // GET /benchmarks/peer-group — must be registered before /:merchantId to avoid routing conflict
  router.get('/peer-group', async (req: Request, res: Response): Promise<void> => {
    const city = (req.query.city as string | undefined)?.trim().toLowerCase();
    const cuisine = (req.query.cuisine as string | undefined)?.trim().toLowerCase();

    if (!city || !cuisine) {
      res.status(400).json({
        success: false,
        error: 'Query params "city" and "cuisine" are required',
      });
      return;
    }

    // Basic sanitisation — only allow alphanumeric, hyphens, spaces
    const safe = /^[a-z0-9 \-]+$/;
    if (!safe.test(city) || !safe.test(cuisine)) {
      res.status(400).json({ success: false, error: 'Invalid city or cuisine value' });
      return;
    }

    try {
      const stats = await getPeerGroupStats(city, cuisine);
      res.json({ success: true, data: stats });
    } catch (err: any) {
      logger.error('[benchmarks] peer-group error', { city, cuisine, error: err.message });
      res.status(500).json({ success: false, error: 'Failed to compute peer group stats' });
    }
  });

  // GET /benchmarks/:merchantId
  router.get('/:merchantId', async (req: Request, res: Response): Promise<void> => {
    const { merchantId } = req.params;

    if (!merchantId || typeof merchantId !== 'string' || merchantId.length < 3) {
      res.status(400).json({ success: false, error: 'Valid merchantId is required' });
      return;
    }

    try {
      const metrics = await computeBenchmarks(merchantId);

      if (metrics === null) {
        res.json({
          success: true,
          data: null,
          insufficient_data: true,
          message: 'Not enough peer data for your city/cuisine combination — minimum 10 restaurants required',
        });
        return;
      }

      res.json({ success: true, data: metrics });
    } catch (err: any) {
      logger.error('[benchmarks] computeBenchmarks error', { merchantId, error: err.message });
      res.status(500).json({ success: false, error: 'Failed to compute benchmarks' });
    }
  });

  return router;
}
