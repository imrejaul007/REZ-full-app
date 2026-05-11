import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import { Settlement, ISettlement, Transaction, Invoice, Wallet } from './models';
import { walletService } from './wallet.service';
import { logger } from './config/logger';
import { notificationService } from './notification.service';

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  accountType: 'checking' | 'savings';
}

export interface SettlementInput {
  merchantId: string;
  amount: number;
  bankAccount: BankAccount;
}

export interface SettlementResult {
  success: boolean;
  settlement?: ISettlement;
  settlementId?: string;
  error?: string;
}

class SettlementService {
  private readonly MIN_SETTLEMENT_AMOUNT = 100; // $100 minimum
  private readonly PROCESSING_FEE_PERCENT = 0.5; // 0.5% fee
  private readonly SETTLEMENT_BATCH_SIZE = 50;

  /**
   * Create a new settlement
   */
  async createSettlement(input: SettlementInput): Promise<SettlementResult> {
    try {
      // Validate amount
      if (input.amount < this.MIN_SETTLEMENT_AMOUNT) {
        return {
          success: false,
          error: `Minimum settlement amount is $${this.MIN_SETTLEMENT_AMOUNT}`
        };
      }

      // Check merchant wallet balance
      const wallet = await walletService.getWallet(input.merchantId);
      if (!wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      const availableBalance = wallet.balance - wallet.pendingBalance;
      if (availableBalance < input.amount) {
        return {
          success: false,
          error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}`
        };
      }

      // Check for existing pending settlements
      const existingSettlement = await Settlement.findOne({
        merchantId: input.merchantId,
        status: { $in: ['pending', 'processing'] }
      });

      if (existingSettlement) {
        return {
          success: false,
          error: 'A settlement is already pending for this merchant'
        };
      }

      const settlementId = uuidv4();

      // Get eligible transactions for settlement
      const transactions = await Transaction.find({
        merchantId: input.merchantId,
        status: 'completed',
        type: 'credit' // Only credit transactions (refunds)
      })
        .sort({ createdAt: 1 })
        .limit(this.SETTLEMENT_BATCH_SIZE);

      // Calculate processing fee
      const processingFee = new Decimal(input.amount)
        .times(this.PROCESSING_FEE_PERCENT / 100)
        .toNumber();
      const netAmount = new Decimal(input.amount).minus(processingFee).toNumber();

      const settlement = new Settlement({
        settlementId,
        merchantId: input.merchantId,
        amount: input.amount,
        currency: 'USD',
        status: 'pending',
        bankAccount: {
          bankName: input.bankAccount.bankName,
          accountNumber: input.bankAccount.accountNumber.slice(-4).padStart(4, '*'),
          routingNumber: input.bankAccount.routingNumber
        },
        transactions: transactions.map(t => t.transactionId)
      });

      await settlement.save();

      logger.info(`Created settlement ${settlementId} for merchant ${input.merchantId}: $${input.amount}`);

      return {
        success: true,
        settlement,
        settlementId
      };
    } catch (error) {
      logger.error('Error creating settlement:', error);
      return { success: false, error: 'Internal error creating settlement' };
    }
  }

  /**
   * Process a settlement (move from pending to completed)
   */
  async processSettlement(settlementId: string): Promise<SettlementResult> {
    try {
      const settlement = await Settlement.findOne({ settlementId });
      if (!settlement) {
        return { success: false, error: 'Settlement not found' };
      }

      if (settlement.status !== 'pending') {
        return {
          success: false,
          error: `Cannot process settlement with status: ${settlement.status}`
        };
      }

      // Update status to processing
      settlement.status = 'processing';
      await settlement.save();

      // Simulate bank transfer (in production, integrate with payment processor)
      const transferSuccess = await this.initiateBankTransfer(settlement);

      if (transferSuccess) {
        settlement.status = 'completed';
        settlement.processedAt = new Date();
        await settlement.save();

        logger.info(`Settlement ${settlementId} completed`);

        // Send notification
        await notificationService.sendSettlementCompleted(settlement);

        return {
          success: true,
          settlement,
          settlementId
        };
      } else {
        settlement.status = 'failed';
        await settlement.save();

        logger.error(`Settlement ${settlementId} failed`);

        return {
          success: false,
          error: 'Bank transfer failed'
        };
      }
    } catch (error) {
      logger.error('Error processing settlement:', error);
      return { success: false, error: 'Internal error processing settlement' };
    }
  }

  /**
   * Simulate bank transfer (replace with actual payment processor integration)
   */
  private async initiateBankTransfer(settlement: ISettlement): Promise<boolean> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, this would integrate with:
    // - Stripe ACH
    // - PayPal
    // - Wise
    // - Direct bank API

    // For demo, always succeed
    return true;
  }

  /**
   * Get settlement by ID
   */
  async getSettlement(settlementId: string): Promise<ISettlement | null> {
    return Settlement.findOne({ settlementId });
  }

  /**
   * Get settlements for a merchant
   */
  async getMerchantSettlements(
    merchantId: string,
    options: { page?: number; limit?: number; status?: string }
  ): Promise<{ settlements: ISettlement[]; total: number; page: number; pages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { merchantId };
    if (options.status) query.status = options.status;

    const [settlements, total] = await Promise.all([
      Settlement.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Settlement.countDocuments(query)
    ]);

    return {
      settlements,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Cancel a pending settlement
   */
  async cancelSettlement(settlementId: string): Promise<SettlementResult> {
    try {
      const settlement = await Settlement.findOne({ settlementId });
      if (!settlement) {
        return { success: false, error: 'Settlement not found' };
      }

      if (settlement.status !== 'pending') {
        return {
          success: false,
          error: `Cannot cancel settlement with status: ${settlement.status}`
        };
      }

      settlement.status = 'failed';
      await settlement.save();

      logger.info(`Settlement ${settlementId} cancelled`);

      return {
        success: true,
        settlement,
        settlementId
      };
    } catch (error) {
      logger.error('Error cancelling settlement:', error);
      return { success: false, error: 'Internal error cancelling settlement' };
    }
  }

  /**
   * Get settlement statistics
   */
  async getSettlementStats(merchantId: string, startDate: Date, endDate: Date): Promise<{
    totalSettlements: number;
    totalAmount: number;
    totalFees: number;
    byStatus: Record<string, number>;
    avgSettlementAmount: number;
  }> {
    const settlements = await Settlement.find({
      merchantId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    let totalAmount = new Decimal(0);
    let totalFees = new Decimal(0);
    const byStatus: Record<string, number> = {};

    for (const settlement of settlements) {
      totalAmount = totalAmount.plus(settlement.amount);
      totalFees = totalFees.plus(
        new Decimal(settlement.amount).times(this.PROCESSING_FEE_PERCENT / 100)
      );
      byStatus[settlement.status] = (byStatus[settlement.status] || 0) + 1;
    }

    return {
      totalSettlements: settlements.length,
      totalAmount: totalAmount.toNumber(),
      totalFees: totalFees.toNumber(),
      byStatus,
      avgSettlementAmount: settlements.length > 0
        ? totalAmount.dividedBy(settlements.length).toNumber()
        : 0
    };
  }

  /**
   * Auto-settle eligible merchants (scheduled job)
   */
  async autoSettleEligibleMerchants(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    const result = { processed: 0, successful: 0, failed: 0 };

    // Get all active wallets
    const wallets = await Wallet.find({ status: 'active' });

    for (const wallet of wallets) {
      try {
        const availableBalance = wallet.balance - wallet.pendingBalance;

        // Auto-settle if balance > $1000
        if (availableBalance >= 1000) {
          const settlement = await this.createSettlement({
            merchantId: wallet.merchantId,
            amount: availableBalance,
            bankAccount: {
              bankName: 'Default Bank',
              accountNumber: '****1234',
              routingNumber: '****5678',
              accountHolderName: 'Merchant',
              accountType: 'checking'
            }
          });

          if (settlement.success) {
            result.processed++;
            const processed = await this.processSettlement(settlement.settlementId!);
            if (processed.success) {
              result.successful++;
            } else {
              result.failed++;
            }
          }
        }
      } catch (error) {
        logger.error(`Error auto-settling merchant ${wallet.merchantId}:`, error);
        result.failed++;
      }
    }

    logger.info(`Auto-settlement complete: ${result.successful}/${result.processed} successful`);

    return result;
  }

  /**
   * Retry failed settlements
   */
  async retryFailedSettlements(): Promise<number> {
    const failedSettlements = await Settlement.find({
      status: 'failed',
      updatedAt: { $gte: new Date(Date.now() - 86400000) } // Within last 24 hours
    });

    let retried = 0;

    for (const settlement of failedSettlements) {
      try {
        settlement.status = 'pending';
        await settlement.save();

        const result = await this.processSettlement(settlement.settlementId);
        if (result.success) {
          retried++;
        }
      } catch (error) {
        logger.error(`Error retrying settlement ${settlement.settlementId}:`, error);
      }
    }

    return retried;
  }

  /**
   * Get merchant's total settled amount (lifetime)
   */
  async getTotalSettledAmount(merchantId: string): Promise<number> {
    const result = await Settlement.aggregate([
      {
        $match: {
          merchantId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    return result.length > 0 ? result[0].totalAmount : 0;
  }

  /**
   * Calculate estimated settlement with fees
   */
  calculateSettlementWithFees(grossAmount: number): {
    grossAmount: number;
    processingFee: number;
    netAmount: number;
  } {
    const processingFee = new Decimal(grossAmount)
      .times(this.PROCESSING_FEE_PERCENT / 100)
      .toNumber();
    const netAmount = new Decimal(grossAmount).minus(processingFee).toNumber();

    return {
      grossAmount,
      processingFee,
      netAmount
    };
  }
}

export const settlementService = new SettlementService();
