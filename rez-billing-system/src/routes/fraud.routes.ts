import { Router, Request, Response } from 'express';
import { fraudService } from '../services';
import { ApiResponse, FraudCheckResult } from '../models';

const router = Router();

// Helper to build API response
const apiResponse = <T>(success: boolean, data?: T, error?: ApiResponse['error']): ApiResponse<T> => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});

// POST /api/fraud/check - Perform fraud check on a transaction
router.post('/check', async (req: Request, res: Response) => {
  try {
    const {
      transactionId,
      walletId,
      userId,
      amount,
      currency,
      transactionType,
      metadata,
    } = req.body;

    if (!transactionId || !walletId || !userId || !amount || !currency || !transactionType) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_FIELDS',
        message: 'transactionId, walletId, userId, amount, currency, and transactionType are required',
      }));
    }

    const result = await fraudService.checkTransaction({
      transactionId,
      walletId,
      userId,
      amount,
      currency,
      transactionType,
      metadata,
    });

    const statusCode = result.isFraudulent ? 200 : 200; // Always 200, check isFraudulent flag
    res.status(statusCode).json(apiResponse(true, result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'FRAUD_CHECK_FAILED',
      message,
    }));
  }
});

// POST /api/fraud/batch-check - Batch fraud check multiple transactions
router.post('/batch-check', async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'INVALID_INPUT',
        message: 'transactions must be a non-empty array',
      }));
    }

    const results = await fraudService.batchCheck(transactions);

    // Convert Map to object for JSON serialization
    const resultsObj: Record<string, FraudCheckResult> = {};
    results.forEach((value, key) => {
      resultsObj[key] = value;
    });

    res.json(apiResponse(true, {
      results: resultsObj,
      totalChecked: results.size,
      flaggedCount: Array.from(results.values()).filter(r => r.isFraudulent).length,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'BATCH_CHECK_FAILED',
      message,
    }));
  }
});

// GET /api/fraud/result/:transactionId - Get fraud check result for a transaction
router.get('/result/:transactionId', async (req: Request, res: Response) => {
  try {
    const result = await fraudService.getFraudCheckResult(req.params.transactionId);

    if (!result) {
      return res.status(404).json(apiResponse(false, undefined, {
        code: 'FRAUD_CHECK_NOT_FOUND',
        message: `Fraud check not found for transaction: ${req.params.transactionId}`,
      }));
    }

    res.json(apiResponse(true, result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_RESULT_FAILED',
      message,
    }));
  }
});

// GET /api/fraud/statistics - Get fraud statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await fraudService.getFraudStatistics();
    res.json(apiResponse(true, stats));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_STATS_FAILED',
      message,
    }));
  }
});

// PUT /api/fraud/config/threshold - Update fraud threshold
router.put('/config/threshold', async (req: Request, res: Response) => {
  try {
    const { threshold } = req.body;

    if (threshold === undefined) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_THRESHOLD',
        message: 'threshold is required',
      }));
    }

    fraudService.updateThreshold(parseFloat(threshold));
    res.json(apiResponse(true, { message: 'Threshold updated successfully' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json(apiResponse(false, undefined, {
      code: 'UPDATE_THRESHOLD_FAILED',
      message,
    }));
  }
});

// PUT /api/fraud/config/max-transactions - Update max daily transactions
router.put('/config/max-transactions', async (req: Request, res: Response) => {
  try {
    const { maxTransactions } = req.body;

    if (maxTransactions === undefined) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_MAX_TRANSACTIONS',
        message: 'maxTransactions is required',
      }));
    }

    fraudService.updateMaxDailyTransactions(parseInt(maxTransactions, 10));
    res.json(apiResponse(true, { message: 'Max daily transactions updated successfully' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json(apiResponse(false, undefined, {
      code: 'UPDATE_MAX_TRANSACTIONS_FAILED',
      message,
    }));
  }
});

// DELETE /api/fraud/records - Clear fraud records (admin only)
router.delete('/records', async (req: Request, res: Response) => {
  try {
    await fraudService.clearRecords();
    res.json(apiResponse(true, { message: 'Fraud records cleared successfully' }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'CLEAR_RECORDS_FAILED',
      message,
    }));
  }
});

export default router;
