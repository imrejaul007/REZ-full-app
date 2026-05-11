import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { refundService } from '../services/refundService';
import {
  CreateRefundRequest,
  RefundDecisionRequest,
  RefundFilters,
  RefundStatus,
  RefundReason
} from '../types/refund.types';
import { logger } from '../utils/logger';

/**
 * Refund Router
 * Express router for refund API endpoints
 */
const router = Router();

// Zod schema for refund creation with strict type validation
const createRefundSchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
  paymentId: z.string().min(1, 'paymentId is required'),
  customerId: z.string().min(1, 'customerId is required'),
  amount: z.number({
    required_error: 'amount is required',
    invalid_type_error: 'amount must be a number'
  }).positive('amount must be positive').max(1000000, 'amount cannot exceed 1000000'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP'], {
    errorMap: () => ({ message: 'currency must be INR, USD, EUR, or GBP' })
  }),
  reason: z.nativeEnum(RefundReason, {
    errorMap: () => ({ message: 'invalid refund reason' })
  }),
  description: z.string().max(1000).optional(),
  isPartial: z.boolean().optional().default(false),
  partialAmount: z.number().positive().max(1000000).optional()
});

/**
 * Zod-based request validation middleware
 */
const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      logger.warn('[Validation] Refund request validation failed', { errors });
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date()
      });
      return;
    }

    // Replace body with validated/transformed data
    req.body = result.data;
    next();
  };
};

/**
 * Async handler wrapper to catch errors
 */
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response): void => {
    fn(req, res).catch((error) => {
      logger.error('Unhandled route error', { error: error.message, path: req.path });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date()
      });
    });
  };
};

/**
 * POST /api/refunds
 * Create a new refund request
 */
router.post(
  '/',
  validateRequest(createRefundSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const createRequest: CreateRefundRequest = {
      orderId: req.body.orderId,
      paymentId: req.body.paymentId,
      customerId: req.body.customerId,
      amount: req.body.amount,
      currency: req.body.currency,
      reason: req.body.reason,
      description: req.body.description,
      isPartial: req.body.isPartial,
      partialAmount: req.body.partialAmount
    };

    const result = await refundService.createRefund(createRequest);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  })
);

/**
 * GET /api/refunds
 * Get all refunds with optional filters and pagination
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const filters: RefundFilters = {};

    if (req.query.status) {
      filters.status = req.query.status as RefundStatus;
    }
    if (req.query.customerId) {
      filters.customerId = req.query.customerId as string;
    }
    if (req.query.orderId) {
      filters.orderId = req.query.orderId as string;
    }
    if (req.query.reason) {
      filters.reason = req.query.reason as RefundReason;
    }
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    if (req.query.minAmount) {
      filters.minAmount = parseFloat(req.query.minAmount as string);
    }
    if (req.query.maxAmount) {
      filters.maxAmount = parseFloat(req.query.maxAmount as string);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await refundService.getAllRefunds(filters, page, limit);
    res.status(200).json(result);
  })
);

/**
 * GET /api/refunds/stats
 * Get refund statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await refundService.getStatistics();
    res.status(200).json(result);
  })
);

/**
 * GET /api/refunds/customer/:customerId
 * Get refunds by customer ID
 */
router.get(
  '/customer/:customerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const result = await refundService.getRefundsByCustomer(customerId);
    res.status(200).json(result);
  })
);

/**
 * GET /api/refunds/order/:orderId
 * Get refunds by order ID
 */
router.get(
  '/order/:orderId',
  asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const result = await refundService.getRefundsByOrder(orderId);
    res.status(200).json(result);
  })
);

/**
 * GET /api/refunds/status/:status
 * Get refunds by status
 */
router.get(
  '/status/:status',
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params;
    const statusEnum = status.toUpperCase() as RefundStatus;

    if (!Object.values(RefundStatus).includes(statusEnum)) {
      res.status(400).json({
        success: false,
        error: `Invalid status: ${status}. Valid values: ${Object.values(RefundStatus).join(', ')}`,
        timestamp: new Date()
      });
      return;
    }

    const result = await refundService.getRefundsByStatus(statusEnum);
    res.status(200).json(result);
  })
);

/**
 * GET /api/refunds/:id
 * Get a refund by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await refundService.getRefund(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  })
);

/**
 * POST /api/refunds/:id/decision
 * Approve or reject a refund
 */
router.post(
  '/:id/decision',
  validateRequest(['decision', 'reviewerId']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { decision, reviewerId, reviewerNotes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      res.status(400).json({
        success: false,
        error: 'Decision must be APPROVED or REJECTED',
        timestamp: new Date()
      });
      return;
    }

    const decisionRequest: RefundDecisionRequest = {
      refundId: id,
      decision,
      reviewerId,
      reviewerNotes
    };

    const result = await refundService.makeDecision(decisionRequest);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  })
);

/**
 * POST /api/refunds/:id/process
 * Process a refund (execute payment reversal)
 */
router.post(
  '/:id/process',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await refundService.processRefund(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  })
);

/**
 * POST /api/refunds/:id/cancel
 * Cancel a refund
 */
router.post(
  '/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await refundService.cancelRefund(id);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  })
);

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Refund service is healthy',
    timestamp: new Date()
  });
});

export default router;
