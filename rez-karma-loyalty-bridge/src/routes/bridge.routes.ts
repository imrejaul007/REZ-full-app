/**
 * Bridge Routes
 */

import { Router, Request, Response } from 'express';
import { KarmaLoyaltyBridge } from '../services/KarmaLoyaltyBridge';

const router = Router();
const bridge = new KarmaLoyaltyBridge();

// Get stats
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const stats = await bridge.getStats(req.params.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get conversion history
router.get('/conversions/:userId', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await bridge.getHistory(req.params.userId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Manual conversion trigger
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const { userId, karmaAmount, source } = req.body;

    if (!userId || !karmaAmount) {
      return res.status(400).json({ error: 'userId and karmaAmount required' });
    }

    const result = await bridge.convertKarma(userId, karmaAmount, source || 'manual');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to convert' });
  }
});

// Level up handler (internal)
router.post('/level-up', async (req: Request, res: Response) => {
  try {
    const { userId, oldLevel, newLevel } = req.body;

    if (!userId || !oldLevel || !newLevel) {
      return res.status(400).json({ error: 'userId, oldLevel, newLevel required' });
    }

    const bonusPoints = await bridge.handleLevelUp(userId, oldLevel, newLevel);
    res.json({ success: true, data: { bonusPoints } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to handle level up' });
  }
});

// Badge earned handler (internal)
router.post('/badge-earned', async (req: Request, res: Response) => {
  try {
    const { userId, badgeId } = req.body;

    if (!userId || !badgeId) {
      return res.status(400).json({ error: 'userId and badgeId required' });
    }

    const points = await bridge.handleBadgeEarned(userId, badgeId);
    res.json({ success: true, data: { points } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to handle badge' });
  }
});

export { router as bridgeRoutes };
