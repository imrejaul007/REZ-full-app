import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { walletService, TopUpConfig } from '../wallet.service';
import { WalletStatus, TransactionType, TransactionStatus } from '../models';
import { logger } from '../config/logger';

const router = Router();

// Validation schemas
const createWalletSchema = Joi.object({
  merchantId: Joi.string().required(),
  currency: Joi.string().default('USD')
});

const topUpSchema = Joi.object({
  merchantId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  reference: Joi.string().optional(),
  description: Joi.string().optional()
});

const deductSchema = Joi.object({
  merchantId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  reference: Joi.string().optional(),
  description: Joi.string().optional()
});

const autoTopUpSchema = Joi.object({
  enabled: Joi.boolean().required(),
  threshold: Joi.number().positive().required(),
  amount: Joi.number().positive().required(),
  limit: Joi.number().positive().required()
});

const transactionQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().valid(...Object.values(TransactionType)).optional(),
  status: Joi.string().valid(...Object.values(TransactionStatus)).optional()
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
 * POST /api/wallets - Create a new wallet
 */
router.post('/', validate(createWalletSchema), async (req: Request, res: Response) => {
  try {
    const { merchantId, currency } = req.body;
    const wallet = await walletService.createWallet(merchantId, currency);
    res.status(201).json(wallet);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('already exists')) {
      return res.status(409).json({ error: message });
    }
    logger.error('Error creating wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/wallets/:merchantId - Get wallet balance
 */
router.get('/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const wallet = await walletService.getWallet(merchantId);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json(wallet);
  } catch (error) {
    logger.error('Error getting wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/wallets/topup - Top up wallet
 */
router.post('/topup', validate(topUpSchema), async (req: Request, res: Response) => {
  try {
    const { merchantId, amount, reference, description } = req.body;
    const result = await walletService.topUp(merchantId, amount, reference, description);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    logger.error('Error topping up wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/wallets/deduct - Deduct from wallet
 */
router.post('/deduct', validate(deductSchema), async (req: Request, res: Response) => {
  try {
    const { merchantId, amount, reference, description } = req.body;
    const result = await walletService.deduct(merchantId, amount, reference, description);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    logger.error('Error deducting from wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/wallets/:merchantId/auto-topup - Configure auto top-up
 */
router.post('/:merchantId/auto-topup', validate(autoTopUpSchema), async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const config: TopUpConfig = req.body;

    const wallet = await walletService.configureAutoTopUp(merchantId, config);

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json(wallet);
  } catch (error) {
    logger.error('Error configuring auto top-up:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/wallets/:merchantId/transactions - Get transaction history
 */
router.get('/:merchantId/transactions', validateQuery(transactionQuerySchema), async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { page, limit, type, status } = req.query as {
      page?: number;
      limit?: number;
      type?: TransactionType;
      status?: TransactionStatus;
    };

    const result = await walletService.getTransactions(merchantId, { page, limit, type, status });
    res.json(result);
  } catch (error) {
    logger.error('Error getting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/wallets/:merchantId/suspend - Suspend wallet
 */
router.post('/:merchantId/suspend', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { reason } = req.body;

    const success = await walletService.suspendWallet(merchantId, reason);

    if (!success) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error suspending wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/wallets/:merchantId/reactivate - Reactivate wallet
 */
router.post('/:merchantId/reactivate', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const success = await walletService.reactivateWallet(merchantId);

    if (!success) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error reactivating wallet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
