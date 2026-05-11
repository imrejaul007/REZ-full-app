import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { settlementService, SettlementInput } from '../settlement.service';
import { logger } from '../config/logger';

const router = Router();

// Validation schemas
const createSettlementSchema = Joi.object({
  merchantId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  bankAccount: Joi.object({
    bankName: Joi.string().required(),
    accountNumber: Joi.string().required(),
    routingNumber: Joi.string().required(),
    accountHolderName: Joi.string().required(),
    accountType: Joi.string().valid('checking', 'savings').required()
  }).required()
});

const settlementQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'processing', 'completed', 'failed').optional()
});

// Validation middleware
const validate = (schema: Joi.Schema) => (req: Request, res: Response, next: NextFunction) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateQuery = (schema: Joi.Schema) => (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.query = value;
  next();
};

// Routes

/**
 * POST /api/settlements - Create a new settlement
 */
router.post('/', validate(createSettlementSchema), async (req: Request, res: Response) => {
  try {
    const input: SettlementInput = req.body;
    const result = await settlementService.createSettlement(input);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creating settlement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/settlements/:settlementId - Get settlement by ID
 */
router.get('/:settlementId', async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const settlement = await settlementService.getSettlement(settlementId);

    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' });
    }

    res.json(settlement);
  } catch (error) {
    logger.error('Error getting settlement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/settlements/merchants/:merchantId - Get settlements for a merchant
 */
router.get('/merchants/:merchantId', validateQuery(settlementQuerySchema), async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { page, limit, status } = req.query as {
      page?: number;
      limit?: number;
      status?: string;
    };

    const result = await settlementService.getMerchantSettlements(merchantId, {
      page,
      limit,
      status
    });

    res.json(result);
  } catch (error) {
    logger.error('Error getting merchant settlements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/settlements/:settlementId/process - Process a pending settlement
 */
router.post('/:settlementId/process', async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const result = await settlementService.processSettlement(settlementId);

    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 400;
      return res.status(status).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error processing settlement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/settlements/:settlementId/cancel - Cancel a pending settlement
 */
router.post('/:settlementId/cancel', async (req: Request, res: Response) => {
  try {
    const { settlementId } = req.params;
    const result = await settlementService.cancelSettlement(settlementId);

    if (!result.success) {
      const status = result.error?.includes('not found') ? 404 : 400;
      return res.status(status).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error cancelling settlement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/settlements/merchants/:merchantId/stats - Get settlement statistics
 */
router.get('/merchants/:merchantId/stats', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const stats = await settlementService.getSettlementStats(merchantId, start, end);

    res.json(stats);
  } catch (error) {
    logger.error('Error getting settlement stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/settlements/merchants/:merchantId/total - Get total settled amount (lifetime)
 */
router.get('/merchants/:merchantId/total', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const total = await settlementService.getTotalSettledAmount(merchantId);

    res.json({ merchantId, totalSettled: total });
  } catch (error) {
    logger.error('Error getting total settled amount:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/settlements/calculate - Calculate settlement with fees
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const result = settlementService.calculateSettlementWithFees(amount);

    res.json(result);
  } catch (error) {
    logger.error('Error calculating settlement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
