import express, { Request, Response, Router } from 'express';
import {
  PriceOptimizationModel,
  PriceOptimization,
  OptimizationConfig,
  OptimizationResult,
} from '../models/priceOptimization';

const router: Router = express.Router();

// In-memory model instance (in production, use DI or singleton)
const priceModel = new PriceOptimizationModel();

/**
 * POST /api/pricing/optimize
 * Get optimized price for an item
 */
router.post('/optimize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemId, date } = req.body;

    if (!itemId) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: itemId',
      });
      return;
    }

    const optimizeDate = date ? new Date(date) : new Date();
    const result = priceModel.optimize(itemId, optimizeDate);

    if (result.success && result.optimization) {
      res.json({
        success: true,
        data: result.optimization,
        warnings: result.warnings,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error || 'Optimization failed',
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * POST /api/pricing/optimize-batch
 * Get optimized prices for multiple items
 */
router.post('/optimize-batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemIds, date } = req.body;

    if (!Array.isArray(itemIds)) {
      res.status(400).json({
        success: false,
        error: 'Request body must contain an "itemIds" array',
      });
      return;
    }

    if (itemIds.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Maximum batch size is 50 items',
      });
      return;
    }

    const optimizeDate = date ? new Date(date) : new Date();
    const results = priceModel.optimizeBatch(itemIds, optimizeDate);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      data: {
        optimizations: successful.map(r => r.optimization).filter(Boolean),
        errors: failed.map(r => ({
          itemId: r.error,
          error: r.error,
        })),
      },
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
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
 * GET /api/pricing/history/:itemId
 * Get price history for an item
 */
router.get('/history/:itemId', (req: Request, res: Response): void => {
  try {
    const { itemId } = req.params;
    const history = priceModel.getPriceHistory(itemId);

    res.json({
      success: true,
      data: history,
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
 * POST /api/pricing/history
 * Add price history entry
 */
router.post('/history', (req: Request, res: Response): void => {
  try {
    const { itemId, date, price, demand, conversionRate } = req.body;

    if (!itemId || !date || typeof price !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: itemId, date, price',
      });
      return;
    }

    priceModel.addPriceHistory({
      itemId,
      date: new Date(date),
      price,
      demand: demand || 0,
      conversionRate: conversionRate || 0,
    });

    res.json({
      success: true,
      message: 'Price history entry added',
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
 * PUT /api/pricing/base-price
 * Set base price for an item
 */
router.put('/base-price', (req: Request, res: Response): void => {
  try {
    const { itemId, price } = req.body;

    if (!itemId || typeof price !== 'number' || price <= 0) {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid fields: itemId (string), price (positive number)',
      });
      return;
    }

    priceModel.setBasePrice(itemId, price);

    res.json({
      success: true,
      message: `Base price set for item ${itemId}`,
      data: { itemId, basePrice: price },
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
 * GET /api/pricing/config
 * Get current pricing configuration
 */
router.get('/config', (_req: Request, res: Response): void => {
  const config = priceModel.getConfig();

  res.json({
    success: true,
    data: config,
  });
});

/**
 * PUT /api/pricing/config
 * Update pricing configuration
 */
router.put('/config', (req: Request, res: Response): void => {
  try {
    const configUpdate: Partial<OptimizationConfig> = req.body;

    // Validate config values
    if (configUpdate.maxPriceMultiplier !== undefined) {
      if (configUpdate.maxPriceMultiplier < 1) {
        res.status(400).json({
          success: false,
          error: 'maxPriceMultiplier must be at least 1',
        });
        return;
      }
    }

    if (configUpdate.minPriceMultiplier !== undefined) {
      if (configUpdate.minPriceMultiplier < 0 || configUpdate.minPriceMultiplier > 1) {
        res.status(400).json({
          success: false,
          error: 'minPriceMultiplier must be between 0 and 1',
        });
        return;
      }
    }

    priceModel.updateConfig(configUpdate);

    res.json({
      success: true,
      data: priceModel.getConfig(),
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
 * GET /api/pricing/health
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
