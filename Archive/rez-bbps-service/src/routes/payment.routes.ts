/**
 * Payment Routes - Payment processing and status endpoints
 */

import { Router, Request, Response } from 'express';
import { bbpsService, RefundRequest } from '../services/bbps.service';
import { Payment, Transaction, Refund } from '../models/bill.model';
import { TransactionStatus } from '../models/bill.model';

const router = Router();

/**
 * Extract user from request (placeholder for auth middleware)
 */
const extractUser = (req: Request): string => {
  return (req.headers['x-user-id'] as string) || 'anonymous';
};

/**
 * Extract IP address
 */
const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * GET /api/bbps/payment/status/:transactionId
 * Get payment status for a transaction
 */
router.get(
  '/status/:transactionId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      const userId = extractUser(req);

      if (!transactionId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TRANSACTION_ID',
            message: 'Transaction ID is required'
          }
        });
        return;
      }

      const result = await bbpsService.getTransactionStatus({
        transactionId,
        userId
      });

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get payment status. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/payment/history
 * Get payment history with filters
 */
router.get(
  '/history',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = extractUser(req);
      const {
        category,
        operatorId,
        status,
        startDate,
        endDate,
        page,
        limit
      } = req.query;

      const result = await bbpsService.getTransactionHistory({
        userId,
        category: category as any,
        operatorId: operatorId as string,
        status: status as TransactionStatus,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get payment history. Please try again.'
        }
      });
    }
  }
);

/**
 * POST /api/bbps/payment/:transactionId/refund
 * Request a refund for a transaction
 */
router.post(
  '/:transactionId/refund',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;
      const userId = extractUser(req);

      if (!transactionId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TRANSACTION_ID',
            message: 'Transaction ID is required'
          }
        });
        return;
      }

      if (!reason || reason.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REASON',
            message: 'Refund reason is required'
          }
        });
        return;
      }

      const result = await bbpsService.requestRefund({
        transactionId,
        userId,
        reason: reason.trim(),
        initiatedBy: userId
      });

      if (!result.success) {
        const statusCode = result.error?.code === 'TRANSACTION_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Request refund error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to request refund. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/payment/refund/:refundId
 * Get refund status
 */
router.get(
  '/refund/:refundId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refundId } = req.params;
      const userId = extractUser(req);

      if (!refundId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFUND_ID',
            message: 'Refund ID is required'
          }
        });
        return;
      }

      const result = await bbpsService.getRefundStatus(refundId, userId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Get refund status error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get refund status. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/payment/:transactionId
 * Get transaction details
 */
router.get(
  '/:transactionId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      const userId = extractUser(req);

      if (!transactionId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TRANSACTION_ID',
            message: 'Transaction ID is required'
          }
        });
        return;
      }

      const transaction = await Transaction.findOne({ transactionId, userId });

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found'
          }
        });
        return;
      }

      // Get associated payment
      const payment = await Payment.findOne({ transactionId });

      // Get associated refund if exists
      const refund = await Refund.findOne({ transactionId, status: { $in: ['pending', 'processing', 'completed'] } });

      res.status(200).json({
        success: true,
        transaction: {
          transactionId: transaction.transactionId,
          bbpsTxnId: transaction.bbpsTxnId,
          operatorTxnId: transaction.operatorTxnId,
          operatorId: transaction.operatorId,
          category: transaction.category,
          type: transaction.type,
          amount: transaction.amount,
          convenienceFee: transaction.convenienceFee,
          totalAmount: transaction.totalAmount,
          currency: transaction.currency,
          status: transaction.status,
          paymentMethod: transaction.paymentMethod,
          customerFields: Object.fromEntries(transaction.customerFields),
          statusHistory: transaction.statusHistory,
          errorCode: transaction.errorCode,
          errorMessage: transaction.errorMessage,
          initiatedAt: transaction.initiatedAt,
          processedAt: transaction.processedAt,
          completedAt: transaction.completedAt,
          failedAt: transaction.failedAt,
          createdAt: transaction.createdAt
        },
        payment: payment ? {
          paymentId: payment.paymentId,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          gatewayTransactionId: payment.gatewayTransactionId,
          payerVpa: payment.payerVpa,
          payerAccount: payment.payerAccount,
          payerCardLast4: payment.payerCardLast4,
          refundedAt: payment.refundedAt,
          refundAmount: payment.refundAmount,
          createdAt: payment.createdAt
        } : null,
        refund: refund ? {
          refundId: refund.refundId,
          amount: refund.refundAmount,
          status: refund.status,
          reason: refund.reason,
          requestedAt: refund.requestedAt,
          completedAt: refund.completedAt
        } : null
      });
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get transaction details. Please try again.'
        }
      });
    }
  }
);

/**
 * POST /api/bbps/payment/:transactionId/retry
 * Retry a failed transaction
 */
router.post(
  '/:transactionId/retry',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId } = req.params;
      const userId = extractUser(req);

      if (!transactionId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TRANSACTION_ID',
            message: 'Transaction ID is required'
          }
        });
        return;
      }

      const transaction = await Transaction.findOne({ transactionId, userId });

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TRANSACTION_NOT_FOUND',
            message: 'Transaction not found'
          }
        });
        return;
      }

      // Only allow retry for failed transactions
      if (transaction.status !== 'failed') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Only failed transactions can be retried'
          }
        });
        return;
      }

      // Check retry count
      if (transaction.retryCount >= transaction.maxRetries) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MAX_RETRIES_EXCEEDED',
            message: `Maximum retry attempts (${transaction.maxRetries}) exceeded`
          }
        });
        return;
      }

      // Create a new transaction for the retry
      const result = await bbpsService.payBill({
        operatorId: transaction.operatorId,
        fields: Object.fromEntries(transaction.customerFields),
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        userId,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
        metadata: {
          originalTransactionId: transactionId,
          retryCount: transaction.retryCount + 1
        }
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(200).json({
        success: true,
        originalTransactionId: transactionId,
        newTransactionId: result.transactionId,
        status: result.status,
        message: 'Transaction retry initiated successfully'
      });
    } catch (error) {
      console.error('Retry transaction error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retry transaction. Please try again.'
        }
      });
    }
  }
);

/**
 * POST /api/bbps/payment/webhook
 * Webhook endpoint for payment gateway callbacks
 */
router.post(
  '/webhook',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactionId, status, gatewayTxnId, gatewayResponse } = req.body;

      if (!transactionId || !status) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_WEBHOOK',
            message: 'Transaction ID and status are required'
          }
        });
        return;
      }

      // Verify webhook signature (in production)
      const webhookSignature = req.headers['x-webhook-signature'] as string;
      if (!webhookSignature) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Webhook signature is required'
          }
        });
        return;
      }

      // Update payment status based on webhook
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        const statusUpdate: Record<string, unknown> = {
          gatewayTransactionId: gatewayTxnId || payment.gatewayTransactionId,
          gatewayResponse: gatewayResponse || {}
        };

        if (status === 'captured') {
          statusUpdate.status = 'captured';
        } else if (status === 'failed') {
          statusUpdate.status = 'failed';
        }

        await Payment.updateOne(
          { transactionId },
          {
            $set: statusUpdate,
            $push: {
              statusHistory: {
                status,
                timestamp: new Date(),
                message: 'Webhook update',
                gatewayResponse
              }
            }
          }
        );
      }

      // Update transaction status
      const transactionStatusMap: Record<string, TransactionStatus> = {
        captured: 'success',
        failed: 'failed',
        pending: 'pending',
        processing: 'processing'
      };

      const mappedStatus = transactionStatusMap[status];
      if (mappedStatus) {
        await Transaction.updateOne(
          { transactionId },
          {
            $set: {
              status: mappedStatus,
              ...(mappedStatus === 'success' ? { completedAt: new Date() } : {}),
              ...(mappedStatus === 'failed' ? { failedAt: new Date() } : {})
            },
            $push: {
              statusHistory: {
                status: mappedStatus,
                timestamp: new Date(),
                message: 'Webhook update'
              }
            }
          }
        );
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process webhook'
        }
      });
    }
  }
);

export { router as paymentRoutes };
export default router;
