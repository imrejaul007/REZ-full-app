/**
 * Coin Redemption Service Unit Tests
 *
 * Tests for:
 * - Successful coin redemption
 * - Insufficient balance handling
 * - Race condition prevention
 */

import mongoose from 'mongoose';

// Mock dependencies
const mockWalletCollection = {
  findOne: jest.fn(),
  updateOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

const mockLedgerCollection = {
  insertMany: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setnx: jest.fn(),
  del: jest.fn(),
  eval: jest.fn(),
};

const mockSession = {
  withTransaction: jest.fn(),
  startSession: jest.fn(),
  endSession: jest.fn(),
};

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connection: {
      collection: jest.fn().mockImplementation((name: string) => {
        if (name === 'wallets') return mockWalletCollection;
        if (name === 'ledgerentries') return mockLedgerCollection;
        return {};
      }),
    },
    ClientSession: jest.fn().mockImplementation(() => ({
      withTransaction: mockSession.withTransaction,
      startSession: mockSession.startSession,
      endSession: mockSession.endSession,
    })),
  };
});

jest.mock('../../rez-wallet-service/src/config/redis', () => ({
  redis: mockRedis,
  pub: { publish: jest.fn() },
}));

jest.mock('../../rez-wallet-service/src/config/logger', () => ({
  createServiceLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Import service after mocking
import {
  redeemCoins,
  getWalletBalance,
  creditCoins,
  validateRedemptionAmount,
} from '../../rez-wallet-service/src/services/walletService';

describe('Coin Redemption Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.startSession.mockResolvedValue({});
    mockSession.withTransaction.mockImplementation(async (fn: Function) => {
      return fn();
    });
  });

  describe('Successful Redemption', () => {
    it('1. should redeem coins successfully when balance is sufficient', async () => {
      const userId = 'user_123';
      const walletId = new mongoose.Types.ObjectId();
      const redemptionAmount = 100;

      // Setup mock wallet with sufficient balance
      mockWalletCollection.findOne.mockResolvedValue({
        _id: walletId,
        userId,
        balance: 500,
        coinType: 'rez',
        status: 'active',
      });

      mockWalletCollection.findOneAndUpdate.mockResolvedValue({
        _id: walletId,
        userId,
        balance: 400, // Balance after redemption
        coinType: 'rez',
      });

      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockLedgerCollection.insertMany.mockResolvedValue({ insertedCount: 2 });

      const result = await redeemCoins({
        userId,
        amount: redemptionAmount,
        purpose: 'order_payment',
        referenceId: 'order_123',
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('newBalance', 400);
      expect(mockLedgerCollection.insertMany).toHaveBeenCalled();
    });

    it('2. should record double-entry ledger entries on redemption', async () => {
      const userId = 'user_456';
      const walletId = new mongoose.Types.ObjectId();
      const redemptionAmount = 50;

      mockWalletCollection.findOne.mockResolvedValue({
        _id: walletId,
        userId,
        balance: 200,
        coinType: 'rez',
      });

      mockWalletCollection.findOneAndUpdate.mockResolvedValue({
        _id: walletId,
        userId,
        balance: 150,
      });

      mockLedgerCollection.insertMany.mockResolvedValue({ insertedCount: 2 });

      await redeemCoins({
        userId,
        amount: redemptionAmount,
        purpose: 'order_payment',
        referenceId: 'order_789',
      });

      // Verify double-entry: debit and credit entries
      expect(mockLedgerCollection.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            direction: 'debit',
            amount: redemptionAmount,
          }),
          expect.objectContaining({
            direction: 'credit',
            amount: redemptionAmount,
          }),
        ]),
        expect.any(Object)
      );
    });

    it('3. should return transaction ID on successful redemption', async () => {
      const userId = 'user_789';
      const walletId = new mongoose.Types.ObjectId();

      mockWalletCollection.findOne.mockResolvedValue({
        _id: walletId,
        userId,
        balance: 1000,
      });

      mockWalletCollection.findOneAndUpdate.mockResolvedValue({
        _id: walletId,
        userId,
        balance: 900,
      });

      const result = await redeemCoins({
        userId,
        amount: 100,
        purpose: 'order_payment',
        referenceId: 'order_101',
      });

      expect(result).toHaveProperty('transactionId');
      expect(typeof result.transactionId).toBe('string');
    });
  });

  describe('Insufficient Balance', () => {
    it('4. should reject redemption when balance is insufficient', async () => {
      const userId = 'user_poor';

      mockWalletCollection.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId,
        balance: 50,
        coinType: 'rez',
      });

      await expect(
        redeemCoins({
          userId,
          amount: 100,
          purpose: 'order_payment',
          referenceId: 'order_100',
        })
      ).rejects.toThrow(/insufficient balance/i);
    });

    it('5. should reject redemption when wallet does not exist', async () => {
      const userId = 'user_nonexistent';

      mockWalletCollection.findOne.mockResolvedValue(null);

      await expect(
        redeemCoins({
          userId,
          amount: 100,
          purpose: 'order_payment',
          referenceId: 'order_102',
        })
      ).rejects.toThrow(/wallet not found/i);
    });

    it('6. should reject redemption when wallet is inactive', async () => {
      const userId = 'user_inactive';

      mockWalletCollection.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId,
        balance: 500,
        status: 'suspended',
      });

      await expect(
        redeemCoins({
          userId,
          amount: 100,
          purpose: 'order_payment',
          referenceId: 'order_103',
        })
      ).rejects.toThrow(/wallet.*suspended/i);
    });

    it('7. should reject redemption with zero or negative amount', async () => {
      const userId = 'user_any';

      await expect(
        validateRedemptionAmount(0)
      ).rejects.toThrow(/amount must be positive/i);

      await expect(
        validateRedemptionAmount(-100)
      ).rejects.toThrow(/amount must be positive/i);
    });

    it('8. should handle partial redemption when only some coins available', async () => {
      const userId = 'user_partial';

      mockWalletCollection.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId,
        balance: 30,
      });

      // Requesting more than available
      await expect(
        redeemCoins({
          userId,
          amount: 100,
          purpose: 'order_payment',
          referenceId: 'order_104',
        })
      ).rejects.toThrow(/insufficient balance/i);
    });
  });

  describe('Race Condition Prevention', () => {
    it('9. should prevent double redemption with Redis lock', async () => {
      const userId = 'user_double';
      const walletId = new mongoose.Types.ObjectId();
      const lockKey = `redemption:lock:${userId}`;

      // First call: lock acquired
      mockRedis.set.mockResolvedValueOnce('OK');

      // Second call: lock already exists (simulating race)
      mockRedis.set.mockResolvedValueOnce(null);

      mockWalletCollection.findOne.mockResolvedValue({
        _id: walletId,
        userId,
        balance: 500,
        coinType: 'rez',
      });

      // First redemption should succeed
      const result1 = await redeemCoins({
        userId,
        amount: 100,
        purpose: 'order_payment',
        referenceId: 'order_105',
      });
      expect(result1).toHaveProperty('success', true);

      // Second redemption should be blocked by lock
      await expect(
        redeemCoins({
          userId,
          amount: 100,
          purpose: 'order_payment',
          referenceId: 'order_106',
        })
      ).rejects.toThrow(/redemption in progress/i);
    });

    it('10. should release lock after successful redemption', async () => {
      const userId = 'user_release';

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);

      mockWalletCollection.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId,
        balance: 500,
        coinType: 'rez',
      });

      mockWalletCollection.findOneAndUpdate.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId,
        balance: 400,
      });

      await redeemCoins({
        userId,
        amount: 100,
        purpose: 'order_payment',
        referenceId: 'order_107',
      });

      expect(mockRedis.del).toHaveBeenCalledWith(expect.stringContaining(userId));
    });

    it('11. should release lock after failed redemption', async () => {
      const userId = 'user_failed';

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);

      mockWalletCollection.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        redeemCoins({
          userId,
          amount: 100,
          purpose: 'order_payment',
          referenceId: 'order_108',
        })
      ).rejects.toThrow('Database error');

      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('12. should handle concurrent redemptions with atomic balance check', async () => {
      const userId = 'user_concurrent';
      const walletId = new mongoose.Types.ObjectId();

      let currentBalance = 100;

      // Simulate concurrent reads showing same balance
      mockWalletCollection.findOne.mockImplementation(() =>
        Promise.resolve({
          _id: walletId,
          userId,
          balance: currentBalance,
          coinType: 'rez',
        })
      );

      // First update succeeds
      mockWalletCollection.findOneAndUpdate.mockResolvedValueOnce({
        _id: walletId,
        userId,
        balance: 0, // After first redemption
      });

      // Second update fails (balance already changed)
      mockWalletCollection.findOneAndUpdate.mockResolvedValueOnce(null);

      // First redemption
      const result1 = await redeemCoins({
        userId,
        amount: 100,
        purpose: 'order_payment',
        referenceId: 'order_109',
      });
      expect(result1).toHaveProperty('success', true);

      // Second redemption should fail
      await expect(
        redeemCoins({
          userId,
          amount: 100,
          purpose: 'order_payment',
          referenceId: 'order_110',
        })
      ).rejects.toThrow(/insufficient balance|concurrent modification/i);
    });

    it('13. should use idempotency key to prevent duplicate redemptions', async () => {
      const userId = 'user_idempotent';
      const idempotencyKey = 'idem_order_111';

      // Check for existing transaction with same idempotency key
      mockRedis.get.mockResolvedValueOnce(JSON.stringify({
        transactionId: 'txn_existing',
        amount: 100,
        status: 'completed',
      }));

      const result = await redeemCoins({
        userId,
        amount: 100,
        purpose: 'order_payment',
        referenceId: 'order_111',
        idempotencyKey,
      });

      // Should return existing transaction instead of creating new
      expect(result).toHaveProperty('transactionId', 'txn_existing');
      expect(mockWalletCollection.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getWalletBalance', () => {
    it('14. should return current wallet balance', async () => {
      const userId = 'user_balance';

      mockWalletCollection.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId,
        balance: 750,
        coinType: 'rez',
      });

      const balance = await getWalletBalance(userId);

      expect(balance).toBe(750);
    });

    it('15. should return 0 for non-existent wallet', async () => {
      mockWalletCollection.findOne.mockResolvedValue(null);

      const balance = await getWalletBalance('user_nonexistent');

      expect(balance).toBe(0);
    });
  });

  describe('Credit Coins', () => {
    it('16. should credit coins successfully', async () => {
      const userId = 'user_credit';
      const walletId = new mongoose.Types.ObjectId();

      mockWalletCollection.findOne.mockResolvedValue({
        _id: walletId,
        userId,
        balance: 100,
        coinType: 'rez',
      });

      mockWalletCollection.findOneAndUpdate.mockResolvedValue({
        _id: walletId,
        userId,
        balance: 200,
      });

      const result = await creditCoins({
        userId,
        amount: 100,
        source: 'cashback',
        description: 'Order completion reward',
        referenceId: 'order_112',
      });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('newBalance', 200);
    });

    it('17. should reject credit with negative amount', async () => {
      await expect(
        creditCoins({
          userId: 'user_any',
          amount: -100,
          source: 'cashback',
          description: 'Invalid',
          referenceId: 'order_113',
        })
      ).rejects.toThrow(/amount must be positive/i);
    });
  });
});
