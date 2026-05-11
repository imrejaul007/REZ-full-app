import { Router, Request, Response } from 'express';
import { settlementService } from '../services';
import { ApiResponse, Settlement } from '../models';

const router = Router();

// Helper to build API response
const apiResponse = <T>(success: boolean, data?: T, error?: ApiResponse['error']): ApiResponse<T> => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});

// POST /api/settlements - Create a new settlement
router.post('/', async (req: Request, res: Response) => {
  try {
    const { merchantId, transactionIds } = req.body;

    if (!merchantId || !transactionIds || !Array.isArray(transactionIds)) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_FIELDS',
        message: 'merchantId and transactionIds array are required',
      }));
    }

    const settlement = await settlementService.createSettlement({
      merchantId,
      transactionIds,
    });

    res.status(201).json(apiResponse(true, settlement));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'SETTLEMENT_CREATION_FAILED',
      message,
    }));
  }
});

// GET /api/settlements/:id - Get settlement by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const settlement = await settlementService.getSettlement(req.params.id);

    if (!settlement) {
      return res.status(404).json(apiResponse(false, undefined, {
        code: 'SETTLEMENT_NOT_FOUND',
        message: `Settlement not found: ${req.params.id}`,
      }));
    }

    res.json(apiResponse(true, settlement));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_SETTLEMENT_FAILED',
      message,
    }));
  }
});

// GET /api/settlements/merchant/:merchantId - Get settlements by merchant
router.get('/merchant/:merchantId', async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', status } = req.query;

    const settlements = await settlementService.getSettlementsByMerchant(
      req.params.merchantId,
      {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        status: status as Settlement['status'],
      }
    );

    res.json(apiResponse(true, settlements));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_SETTLEMENTS_FAILED',
      message,
    }));
  }
});

// GET /api/settlements/pending - Get pending settlements
router.get('/status/pending', async (req: Request, res: Response) => {
  try {
    const settlements = await settlementService.getPendingSettlements();
    res.json(apiResponse(true, settlements));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_PENDING_FAILED',
      message,
    }));
  }
});

// POST /api/settlements/:id/start - Start processing a settlement
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const settlement = await settlementService.startProcessing(req.params.id);
    res.json(apiResponse(true, settlement));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'START_PROCESSING_FAILED',
      message,
    }));
  }
});

// POST /api/settlements/:id/complete - Complete a settlement
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const settlement = await settlementService.completeSettlement(req.params.id);
    res.json(apiResponse(true, settlement));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'COMPLETE_SETTLEMENT_FAILED',
      message,
    }));
  }
});

// POST /api/settlements/:id/fail - Fail a settlement
router.post('/:id/fail', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_REASON',
        message: 'reason is required when failing a settlement',
      }));
    }

    const settlement = await settlementService.failSettlement(req.params.id, reason);
    res.json(apiResponse(true, settlement));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'FAIL_SETTLEMENT_FAILED',
      message,
    }));
  }
});

// POST /api/settlements/:id/retry - Retry a failed settlement
router.post('/:id/retry', async (req: Request, res: Response) => {
  try {
    const settlement = await settlementService.retrySettlement(req.params.id);
    res.json(apiResponse(true, settlement));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'RETRY_SETTLEMENT_FAILED',
      message,
    }));
  }
});

// POST /api/settlements/batch/add - Add transaction to pending batch
router.post('/batch/add', async (req: Request, res: Response) => {
  try {
    const { merchantId, transactionId } = req.body;

    if (!merchantId || !transactionId) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_FIELDS',
        message: 'merchantId and transactionId are required',
      }));
    }

    const batch = await settlementService.addToBatch(merchantId, transactionId);
    res.json(apiResponse(true, batch));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'ADD_TO_BATCH_FAILED',
      message,
    }));
  }
});

// POST /api/settlements/batch/:merchantId/process - Process pending batch
router.post('/batch/:merchantId/process', async (req: Request, res: Response) => {
  try {
    const settlement = await settlementService.processBatch(req.params.merchantId);
    res.status(201).json(apiResponse(true, settlement));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'PROCESS_BATCH_FAILED',
      message,
    }));
  }
});

// GET /api/settlements/fee/calculate - Calculate fee for an amount
router.get('/fee/calculate', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'USD' } = req.query;

    if (!amount) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_AMOUNT',
        message: 'amount is required',
      }));
    }

    const fee = settlementService.calculateFee(amount as string, currency as 'USD' | 'EUR' | 'GBP' | 'INR');
    res.json(apiResponse(true, fee));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'CALCULATE_FEE_FAILED',
      message,
    }));
  }
});

// GET /api/settlements/fee/breakdown - Get fee breakdown
router.get('/fee/breakdown', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'USD' } = req.query;

    if (!amount) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_AMOUNT',
        message: 'amount is required',
      }));
    }

    const breakdown = settlementService.getFeeBreakdown(amount as string, currency as 'USD' | 'EUR' | 'GBP' | 'INR');
    res.json(apiResponse(true, breakdown));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_FEE_BREAKDOWN_FAILED',
      message,
    }));
  }
});

// GET /api/settlements/stats - Get settlement statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.query;
    const stats = await settlementService.getStatistics(merchantId as string | undefined);
    res.json(apiResponse(true, stats));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_STATS_FAILED',
      message,
    }));
  }
});

// PUT /api/settlements/config/fees - Update fee configuration
router.put('/config/fees', async (req: Request, res: Response) => {
  try {
    const { feeRate, fixedFee } = req.body;

    settlementService.updateFeeConfig(feeRate, fixedFee);
    res.json(apiResponse(true, { message: 'Fee configuration updated successfully' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json(apiResponse(false, undefined, {
      code: 'UPDATE_FEE_CONFIG_FAILED',
      message,
    }));
  }
});

export default router;
