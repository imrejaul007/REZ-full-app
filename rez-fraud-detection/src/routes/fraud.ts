import express, { Request, Response, Router } from 'express';
import {
  FraudDetectionModel,
  FraudPrediction,
  Order,
  FraudDetectionConfig,
  FraudStats,
} from '../models/fraudModel';

const router: Router = express.Router();

// In-memory model instance (in production, use DI or singleton)
const fraudModel = new FraudDetectionModel();

/**
 * POST /api/fraud/analyze
 * Analyze a single order for fraud
 */
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const order: Order = req.body;

    // Validate required fields
    if (!order.id || !order.userId || typeof order.amount !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: id, userId, amount',
      });
      return;
    }

    const prediction = fraudModel.calculateRiskScore(order);

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/fraud/analyze-batch
 * Analyze multiple orders for fraud
 */
router.post('/analyze-batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const orders: Order[] = req.body.orders;

    if (!Array.isArray(orders)) {
      res.status(400).json({
        success: false,
        error: 'Request body must contain an "orders" array',
      });
      return;
    }

    if (orders.length > 100) {
      res.status(400).json({
        success: false,
        error: 'Maximum batch size is 100 orders',
      });
      return;
    }

    const predictions = fraudModel.calculateRiskScoreBatch(orders);

    res.json({
      success: true,
      data: predictions,
      summary: {
        total: predictions.length,
        blocked: predictions.filter(p => p.recommendation === 'block').length,
        review: predictions.filter(p => p.recommendation === 'review').length,
        allowed: predictions.filter(p => p.recommendation === 'allow').length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * GET /api/fraud/stats
 * Get fraud detection statistics
 */
router.get('/stats', (_req: Request, res: Response): void => {
  const stats = fraudModel.getStats();

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * GET /api/fraud/config
 * Get current fraud detection configuration
 */
router.get('/config', (_req: Request, res: Response): void => {
  const config = fraudModel.getConfig();

  res.json({
    success: true,
    data: config,
  });
});

/**
 * PUT /api/fraud/config
 * Update fraud detection configuration
 */
router.put('/config', (req: Request, res: Response): void => {
  try {
    const configUpdate: Partial<FraudDetectionConfig> = req.body;

    // Validate config values
    if (configUpdate.blockThreshold !== undefined) {
      if (configUpdate.blockThreshold < 0 || configUpdate.blockThreshold > 100) {
        res.status(400).json({
          success: false,
          error: 'blockThreshold must be between 0 and 100',
        });
        return;
      }
    }

    if (configUpdate.reviewThreshold !== undefined) {
      if (configUpdate.reviewThreshold < 0 || configUpdate.reviewThreshold > 100) {
        res.status(400).json({
          success: false,
          error: 'reviewThreshold must be between 0 and 100',
        });
        return;
      }
    }

    fraudModel.updateConfig(configUpdate);

    res.json({
      success: true,
      data: fraudModel.getConfig(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/fraud/reset-stats
 * Reset fraud detection statistics
 */
router.post('/reset-stats', (_req: Request, res: Response): void => {
  fraudModel.resetStats();

  res.json({
    success: true,
    message: 'Statistics reset successfully',
  });
});

/**
 * DELETE /api/fraud/history
 * Clear historical data
 */
router.delete('/history', (_req: Request, res: Response): void => {
  fraudModel.clearHistory();

  res.json({
    success: true,
    message: 'Historical data cleared successfully',
  });
});

/**
 * GET /api/fraud/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
