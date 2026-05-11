import { Router, Request, Response } from 'express';
import { walletService } from '../services';
import { Currency, TransactionType, TransactionStatus, ApiResponse, Wallet, Transaction } from '../models';

const router = Router();

// Helper to build API response
const apiResponse = <T>(success: boolean, data?: T, error?: ApiResponse['error']): ApiResponse<T> => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});

// POST /api/wallets - Create a new wallet
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, currency = 'USD', initialBalance = '0' } = req.body;

    if (!userId) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_USER_ID',
        message: 'userId is required',
      }));
    }

    const wallet = await walletService.createWallet(
      userId,
      currency as Currency,
      initialBalance
    );

    res.status(201).json(apiResponse(true, wallet));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'WALLET_CREATION_FAILED',
      message,
    }));
  }
});

// GET /api/wallets/:id - Get wallet by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const wallet = await walletService.getWallet(req.params.id);

    if (!wallet) {
      return res.status(404).json(apiResponse(false, undefined, {
        code: 'WALLET_NOT_FOUND',
        message: `Wallet not found: ${req.params.id}`,
      }));
    }

    res.json(apiResponse(true, wallet));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_WALLET_FAILED',
      message,
    }));
  }
});

// GET /api/wallets/user/:userId - Get wallet by user ID
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const wallet = await walletService.getWalletByUserId(req.params.userId);

    if (!wallet) {
      return res.status(404).json(apiResponse(false, undefined, {
        code: 'WALLET_NOT_FOUND',
        message: `Wallet not found for user: ${req.params.userId}`,
      }));
    }

    res.json(apiResponse(true, wallet));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_WALLET_FAILED',
      message,
    }));
  }
});

// GET /api/wallets/:id/balance - Get wallet balance
router.get('/:id/balance', async (req: Request, res: Response) => {
  try {
    const balance = await walletService.getBalance(req.params.id);

    if (!balance) {
      return res.status(404).json(apiResponse(false, undefined, {
        code: 'WALLET_NOT_FOUND',
        message: `Wallet not found: ${req.params.id}`,
      }));
    }

    res.json(apiResponse(true, balance));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_BALANCE_FAILED',
      message,
    }));
  }
});

// POST /api/wallets/:id/credit - Credit funds to wallet
router.post('/:id/credit', async (req: Request, res: Response) => {
  try {
    const { amount, reference, description, metadata } = req.body;

    if (!amount || !reference) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_FIELDS',
        message: 'amount and reference are required',
      }));
    }

    const transaction = await walletService.credit(
      req.params.id,
      amount,
      reference,
      description,
      metadata
    );

    res.json(apiResponse(true, transaction));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'CREDIT_FAILED',
      message,
    }));
  }
});

// POST /api/wallets/:id/debit - Debit funds from wallet
router.post('/:id/debit', async (req: Request, res: Response) => {
  try {
    const { amount, reference, description, metadata } = req.body;

    if (!amount || !reference) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_FIELDS',
        message: 'amount and reference are required',
      }));
    }

    const transaction = await walletService.debit(
      req.params.id,
      amount,
      reference,
      description,
      metadata
    );

    res.json(apiResponse(true, transaction));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : message.includes('Insufficient') ? 400 : 500;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'DEBIT_FAILED',
      message,
    }));
  }
});

// POST /api/wallets/:id/transfer - Transfer funds between wallets
router.post('/:id/transfer', async (req: Request, res: Response) => {
  try {
    const { toWalletId, amount, reference, description } = req.body;

    if (!toWalletId || !amount || !reference) {
      return res.status(400).json(apiResponse(false, undefined, {
        code: 'MISSING_FIELDS',
        message: 'toWalletId, amount, and reference are required',
      }));
    }

    const result = await walletService.transfer(
      req.params.id,
      toWalletId,
      amount,
      reference,
      description
    );

    res.json(apiResponse(true, result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'TRANSFER_FAILED',
      message,
    }));
  }
});

// GET /api/wallets/:id/transactions - Get transaction history
router.get('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const { limit = '50', offset = '0', type, status } = req.query;

    const transactions = await walletService.getTransactions(req.params.id, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      type: type as TransactionType,
      status: status as TransactionStatus,
    });

    res.json(apiResponse(true, transactions));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json(apiResponse(false, undefined, {
      code: 'GET_TRANSACTIONS_FAILED',
      message,
    }));
  }
});

// POST /api/wallets/:id/reverse/:transactionId - Reverse a transaction
router.post('/:id/reverse/:transactionId', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const transaction = await walletService.reverseTransaction(
      req.params.transactionId,
      reason || 'No reason provided'
    );

    res.json(apiResponse(true, transaction));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'REVERSE_FAILED',
      message,
    }));
  }
});

// POST /api/wallets/:id/freeze - Freeze a wallet
router.post('/:id/freeze', async (req: Request, res: Response) => {
  try {
    const wallet = await walletService.freezeWallet(req.params.id);
    res.json(apiResponse(true, wallet));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 500;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'FREEZE_FAILED',
      message,
    }));
  }
});

// POST /api/wallets/:id/unfreeze - Unfreeze a wallet
router.post('/:id/unfreeze', async (req: Request, res: Response) => {
  try {
    const wallet = await walletService.unfreezeWallet(req.params.id);
    res.json(apiResponse(true, wallet));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 500;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'UNFREEZE_FAILED',
      message,
    }));
  }
});

// POST /api/wallets/:id/close - Close a wallet
router.post('/:id/close', async (req: Request, res: Response) => {
  try {
    const wallet = await walletService.closeWallet(req.params.id);
    res.json(apiResponse(true, wallet));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = message.includes('not found') ? 404 : 400;
    res.status(statusCode).json(apiResponse(false, undefined, {
      code: 'CLOSE_FAILED',
      message,
    }));
  }
});

export default router;
