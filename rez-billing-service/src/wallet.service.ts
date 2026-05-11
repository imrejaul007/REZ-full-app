import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { Wallet, Transaction, IWallet, ITransaction, TransactionType, TransactionStatus, WalletStatus } from './models';
import { redis } from './config/redis';
import { logger } from './config/logger';

export interface TopUpConfig {
  enabled: boolean;
  threshold: number;
  amount: number;
  limit: number;
}

export interface WalletBalance {
  merchantId: string;
  balance: number;
  pendingBalance: number;
  availableBalance: number;
  currency: string;
  status: WalletStatus;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  error?: string;
}

class WalletService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly LOCK_TTL = 10000; // 10 seconds

  /**
   * Create a new wallet for a merchant
   */
  async createWallet(merchantId: string, currency: string = 'USD'): Promise<IWallet> {
    const existingWallet = await Wallet.findOne({ merchantId });
    if (existingWallet) {
      throw new Error(`Wallet already exists for merchant ${merchantId}`);
    }

    const wallet = new Wallet({
      merchantId,
      balance: 0,
      pendingBalance: 0,
      currency,
      status: WalletStatus.ACTIVE
    });

    await wallet.save();
    logger.info(`Created wallet for merchant ${merchantId}`);

    return wallet;
  }

  /**
   * Get wallet by merchant ID
   */
  async getWallet(merchantId: string): Promise<WalletBalance | null> {
    // Try cache first
    const cacheKey = `wallet:${merchantId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const wallet = await Wallet.findOne({ merchantId });
    if (!wallet) {
      return null;
    }

    const balance: WalletBalance = {
      merchantId: wallet.merchantId,
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      availableBalance: new Decimal(wallet.balance).minus(wallet.pendingBalance).toNumber(),
      currency: wallet.currency,
      status: wallet.status
    };

    // Cache the result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(balance));

    return balance;
  }

  /**
   * Acquire a distributed lock for wallet operations
   */
  private async acquireLock(merchantId: string): Promise<boolean> {
    const lockKey = `lock:wallet:${merchantId}`;
    const result = await redis.set(lockKey, '1', 'PX', this.LOCK_TTL, 'NX');
    return result === 'OK';
  }

  /**
   * Release the distributed lock
   */
  private async releaseLock(merchantId: string): Promise<void> {
    const lockKey = `lock:wallet:${merchantId}`;
    await redis.del(lockKey);
  }

  /**
   * Add funds to wallet (top-up)
   */
  async topUp(merchantId: string, amount: number, reference?: string, description?: string): Promise<TransactionResult> {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Acquire lock for atomic operation
    const lockAcquired = await this.acquireLock(merchantId);
    if (!lockAcquired) {
      return { success: false, error: 'Could not acquire lock, please retry' };
    }

    try {
      const wallet = await Wallet.findOne({ merchantId });
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      if (wallet.status !== WalletStatus.ACTIVE) {
        return { success: false, error: 'Wallet is not active' };
      }

      const balanceBefore = wallet.balance;
      const newBalance = new Decimal(wallet.balance).plus(amount).toNumber();

      // Create transaction record
      const transactionId = uuidv4();
      const transaction = new Transaction({
        transactionId,
        walletId: wallet._id.toString(),
        merchantId,
        type: TransactionType.CREDIT,
        amount,
        balanceBefore,
        balanceAfter: newBalance,
        currency: wallet.currency,
        status: TransactionStatus.COMPLETED,
        reference,
        description: description || 'Wallet top-up',
        completedAt: new Date()
      });

      // Update wallet balance
      wallet.balance = newBalance;
      wallet.lastTopUpDate = new Date();
      await wallet.save();
      await transaction.save();

      // Invalidate cache
      await redis.del(`wallet:${merchantId}`);

      logger.info(`Topped up wallet for merchant ${merchantId}: ${amount} ${wallet.currency}`);

      return {
        success: true,
        transactionId,
        balanceBefore,
        balanceAfter: newBalance
      };
    } catch (error) {
      logger.error(`Error topping up wallet for merchant ${merchantId}:`, error);
      return { success: false, error: 'Internal error during top-up' };
    } finally {
      await this.releaseLock(merchantId);
    }
  }

  /**
   * Deduct funds from wallet
   */
  async deduct(merchantId: string, amount: number, reference?: string, description?: string, metadata?: Record<string, unknown>): Promise<TransactionResult> {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Acquire lock for atomic operation
    const lockAcquired = await this.acquireLock(merchantId);
    if (!lockAcquired) {
      return { success: false, error: 'Could not acquire lock, please retry' };
    }

    try {
      const wallet = await Wallet.findOne({ merchantId });
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      if (wallet.status !== WalletStatus.ACTIVE) {
        return { success: false, error: 'Wallet is not active' };
      }

      const availableBalance = new Decimal(wallet.balance).minus(wallet.pendingBalance).toNumber();
      if (availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      const balanceBefore = wallet.balance;
      const newBalance = new Decimal(wallet.balance).minus(amount).toNumber();

      // Create transaction record
      const transactionId = uuidv4();
      const transaction = new Transaction({
        transactionId,
        walletId: wallet._id.toString(),
        merchantId,
        type: TransactionType.DEBIT,
        amount,
        balanceBefore,
        balanceAfter: newBalance,
        currency: wallet.currency,
        status: TransactionStatus.COMPLETED,
        reference,
        description: description || 'Deduction',
        metadata,
        completedAt: new Date()
      });

      // Update wallet balance
      wallet.balance = newBalance;
      await wallet.save();
      await transaction.save();

      // Invalidate cache
      await redis.del(`wallet:${merchantId}`);

      logger.info(`Deducted from wallet for merchant ${merchantId}: ${amount} ${wallet.currency}`);

      // Check for auto top-up
      await this.checkAutoTopUp(merchantId);

      return {
        success: true,
        transactionId,
        balanceBefore,
        balanceAfter: newBalance
      };
    } catch (error) {
      logger.error(`Error deducting from wallet for merchant ${merchantId}:`, error);
      return { success: false, error: 'Internal error during deduction' };
    } finally {
      await this.releaseLock(merchantId);
    }
  }

  /**
   * Reserve funds (add to pending)
   */
  async reserve(merchantId: string, amount: number, reference?: string, description?: string): Promise<TransactionResult> {
    if (amount <= 0) {
      return { success: false, error: 'Amount must be positive' };
    }

    // Acquire lock for atomic operation
    const lockAcquired = await this.acquireLock(merchantId);
    if (!lockAcquired) {
      return { success: false, error: 'Could not acquire lock, please retry' };
    }

    try {
      const wallet = await Wallet.findOne({ merchantId });
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      if (wallet.status !== WalletStatus.ACTIVE) {
        return { success: false, error: 'Wallet is not active' };
      }

      const availableBalance = new Decimal(wallet.balance).minus(wallet.pendingBalance).toNumber();
      if (availableBalance < amount) {
        return { success: false, error: 'Insufficient balance for reservation' };
      }

      const transactionId = uuidv4();
      const transaction = new Transaction({
        transactionId,
        walletId: wallet._id.toString(),
        merchantId,
        type: TransactionType.DEBIT,
        amount,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        currency: wallet.currency,
        status: TransactionStatus.PENDING,
        reference,
        description: description || 'Funds reserved'
      });

      wallet.pendingBalance = new Decimal(wallet.pendingBalance).plus(amount).toNumber();
      await wallet.save();
      await transaction.save();

      // Invalidate cache
      await redis.del(`wallet:${merchantId}`);

      logger.info(`Reserved funds for merchant ${merchantId}: ${amount}`);

      return {
        success: true,
        transactionId,
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance
      };
    } catch (error) {
      logger.error(`Error reserving funds for merchant ${merchantId}:`, error);
      return { success: false, error: 'Internal error during reservation' };
    } finally {
      await this.releaseLock(merchantId);
    }
  }

  /**
   * Capture reserved funds
   */
  async capture(merchantId: string, transactionId: string, actualAmount?: number): Promise<TransactionResult> {
    // Acquire lock for atomic operation
    const lockAcquired = await this.acquireLock(merchantId);
    if (!lockAcquired) {
      return { success: false, error: 'Could not acquire lock, please retry' };
    }

    try {
      const wallet = await Wallet.findOne({ merchantId });
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      const transaction = await Transaction.findOne({ transactionId, merchantId });
      if (!transaction) {
        return { success: false, error: 'Transaction not found' };
      }

      const amountToCapture = actualAmount ?? transaction.amount;

      // Deduct from pending balance
      wallet.pendingBalance = new Decimal(wallet.pendingBalance).minus(transaction.amount).toNumber();

      // If actual amount differs, adjust the balance
      if (actualAmount !== undefined && actualAmount !== transaction.amount) {
        const diff = new Decimal(transaction.amount).minus(actualAmount).toNumber();
        wallet.balance = new Decimal(wallet.balance).plus(diff).toNumber();
        wallet.pendingBalance = new Decimal(wallet.pendingBalance).plus(diff).toNumber();
      }

      // Update transaction
      transaction.status = TransactionStatus.COMPLETED;
      transaction.balanceAfter = wallet.balance;
      transaction.amount = amountToCapture;
      transaction.completedAt = new Date();

      await wallet.save();
      await transaction.save();

      // Invalidate cache
      await redis.del(`wallet:${merchantId}`);

      logger.info(`Captured funds for merchant ${merchantId}: ${amountToCapture}`);

      return {
        success: true,
        transactionId,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: wallet.balance
      };
    } catch (error) {
      logger.error(`Error capturing funds for merchant ${merchantId}:`, error);
      return { success: false, error: 'Internal error during capture' };
    } finally {
      await this.releaseLock(merchantId);
    }
  }

  /**
   * Release reserved funds
   */
  async release(merchantId: string, transactionId: string): Promise<TransactionResult> {
    // Acquire lock for atomic operation
    const lockAcquired = await this.acquireLock(merchantId);
    if (!lockAcquired) {
      return { success: false, error: 'Could not acquire lock, please retry' };
    }

    try {
      const wallet = await Wallet.findOne({ merchantId });
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      const transaction = await Transaction.findOne({ transactionId, merchantId });
      if (!transaction) {
        return { success: false, error: 'Transaction not found' };
      }

      // Release from pending balance
      wallet.pendingBalance = new Decimal(wallet.pendingBalance).minus(transaction.amount).toNumber();

      // Update transaction
      transaction.status = TransactionStatus.REVERSED;
      transaction.completedAt = new Date();

      await wallet.save();
      await transaction.save();

      // Invalidate cache
      await redis.del(`wallet:${merchantId}`);

      logger.info(`Released funds for merchant ${merchantId}: ${transaction.amount}`);

      return {
        success: true,
        transactionId,
        balanceBefore: transaction.balanceBefore,
        balanceAfter: wallet.balance
      };
    } catch (error) {
      logger.error(`Error releasing funds for merchant ${merchantId}:`, error);
      return { success: false, error: 'Internal error during release' };
    } finally {
      await this.releaseLock(merchantId);
    }
  }

  /**
   * Configure auto top-up settings
   */
  async configureAutoTopUp(merchantId: string, config: TopUpConfig): Promise<IWallet | null> {
    const wallet = await Wallet.findOne({ merchantId });
    if (!wallet) {
      return null;
    }

    wallet.autoTopUpEnabled = config.enabled;
    wallet.autoTopUpThreshold = config.threshold;
    wallet.autoTopUpAmount = config.amount;
    wallet.autoTopUpLimit = config.limit;

    await wallet.save();

    // Invalidate cache
    await redis.del(`wallet:${merchantId}`);

    logger.info(`Configured auto top-up for merchant ${merchantId}:`, config);

    return wallet;
  }

  /**
   * Check and trigger auto top-up if needed
   */
  private async checkAutoTopUp(merchantId: string): Promise<void> {
    const wallet = await Wallet.findOne({ merchantId });
    if (!wallet || !wallet.autoTopUpEnabled) {
      return;
    }

    const availableBalance = new Decimal(wallet.balance).minus(wallet.pendingBalance).toNumber();

    if (availableBalance <= wallet.autoTopUpThreshold) {
      // Check if we haven't exceeded the limit
      const now = new Date();
      const lastTopUp = wallet.lastTopUpDate ? new Date(wallet.lastTopUpDate) : null;
      const daysSinceLastTopUp = lastTopUp
        ? (now.getTime() - lastTopUp.getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSinceLastTopUp >= 1) {
        const topUpAmount = Math.min(wallet.autoTopUpAmount, wallet.autoTopUpLimit);
        logger.info(`Triggering auto top-up for merchant ${merchantId}: ${topUpAmount}`);

        // In production, this would integrate with payment processor
        // For now, we'll just log it
        await this.topUp(merchantId, topUpAmount, 'AUTO_TOP_UP', 'Automatic top-up triggered');
      }
    }
  }

  /**
   * Get transaction history for a merchant
   */
  async getTransactions(
    merchantId: string,
    options: { page?: number; limit?: number; type?: TransactionType; status?: TransactionStatus }
  ): Promise<{ transactions: ITransaction[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { merchantId };
    if (options.type) query.type = options.type;
    if (options.status) query.status = options.status;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query)
    ]);

    return {
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Suspend a wallet
   */
  async suspendWallet(merchantId: string, reason?: string): Promise<boolean> {
    const wallet = await Wallet.findOne({ merchantId });
    if (!wallet) {
      return false;
    }

    wallet.status = WalletStatus.SUSPENDED;
    await wallet.save();

    // Invalidate cache
    await redis.del(`wallet:${merchantId}`);

    logger.warn(`Suspended wallet for merchant ${merchantId}: ${reason || 'No reason provided'}`);

    return true;
  }

  /**
   * Reactivate a suspended wallet
   */
  async reactivateWallet(merchantId: string): Promise<boolean> {
    const wallet = await Wallet.findOne({ merchantId });
    if (!wallet) {
      return false;
    }

    wallet.status = WalletStatus.ACTIVE;
    await wallet.save();

    // Invalidate cache
    await redis.del(`wallet:${merchantId}`);

    logger.info(`Reactivated wallet for merchant ${merchantId}`);

    return true;
  }

  /**
   * Close a wallet permanently
   */
  async closeWallet(merchantId: string): Promise<boolean> {
    const wallet = await Wallet.findOne({ merchantId });
    if (!wallet) {
      return false;
    }

    if (wallet.balance > 0) {
      throw new Error('Cannot close wallet with remaining balance');
    }

    wallet.status = WalletStatus.CLOSED;
    await wallet.save();

    // Invalidate cache
    await redis.del(`wallet:${merchantId}`);

    logger.info(`Closed wallet for merchant ${merchantId}`);

    return true;
  }
}

export const walletService = new WalletService();
