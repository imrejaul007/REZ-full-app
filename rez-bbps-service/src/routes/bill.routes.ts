/**
 * Bill Routes - Bill fetch and payment endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { bbpsService, BillFetchRequest, BillPaymentRequest } from '../services/bbps.service';
import { PaymentMethod, TransactionStatus } from '../models/bill.model';
import { getOperatorById } from '../config/operators';

const router = Router();

/**
 * Validation middleware factory
 */
const validateRequest = (schema: {
  body?: Record<string, { required?: boolean; type?: string; pattern?: RegExp; min?: number; max?: number }>;
  params?: string[];
  query?: string[];
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      for (const [field, rules] of Object.entries(schema.body)) {
        const value = req.body[field];

        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }

        if (value !== undefined && value !== null && value !== '') {
          if (rules.type === 'number' && isNaN(Number(value))) {
            errors.push(`${field} must be a number`);
          }

          if (rules.pattern && !rules.pattern.test(String(value))) {
            errors.push(`${field} format is invalid`);
          }

          if (rules.min !== undefined && Number(value) < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }

          if (rules.max !== undefined && Number(value) > rules.max) {
            errors.push(`${field} must be at most ${rules.max}`);
          }
        }
      }
    }

    // Validate params
    if (schema.params) {
      for (const param of schema.params) {
        if (!req.params[param]) {
          errors.push(`Parameter ${param} is required`);
        }
      }
    }

    // Validate query
    if (schema.query) {
      for (const param of schema.query) {
        if (req.query[param] === undefined) {
          errors.push(`Query parameter ${param} is required`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errors.join(', ')
        }
      });
      return;
    }

    next();
  };
};

/**
 * Extract user from request (placeholder for auth middleware)
 */
const extractUser = (req: Request): string => {
  // In production, this would extract user ID from JWT or session
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
 * POST /api/bbps/bill/fetch
 * Fetch bill from operator
 */
router.post(
  '/fetch',
  validateRequest({
    body: {
      operatorId: { required: true, type: 'string' },
      fields: { required: true, type: 'string' }
    }
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { operatorId, fields } = req.body;

      if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FIELDS',
            message: 'At least one field is required for bill fetch'
          }
        });
        return;
      }

      const request: BillFetchRequest = {
        operatorId,
        fields,
        userId: extractUser(req),
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent']
      };

      const result = await bbpsService.fetchBill(request);

      if (!result.success) {
        const statusCode = result.error?.code === 'OPERATOR_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Bill fetch error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch bill. Please try again.'
        }
      });
    }
  }
);

/**
 * POST /api/bbps/bill/pay
 * Pay a bill
 */
router.post(
  '/pay',
  validateRequest({
    body: {
      operatorId: { required: true, type: 'string' },
      amount: { required: true, type: 'number', min: 1 },
      paymentMethod: { required: true, type: 'string' },
      fields: { required: true, type: 'string' }
    }
  }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        billId,
        operatorId,
        fields,
        amount,
        paymentMethod,
        customerName,
        customerEmail,
        customerPhone,
        metadata
      } = req.body;

      // Validate payment method
      const validPaymentMethods: PaymentMethod[] = ['upi', 'netbanking', 'card', 'wallet'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PAYMENT_METHOD',
            message: `Payment method must be one of: ${validPaymentMethods.join(', ')}`
          }
        });
        return;
      }

      // Validate fields
      if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FIELDS',
            message: 'At least one field is required for bill payment'
          }
        });
        return;
      }

      // Validate operator amount limits
      const operator = getOperatorById(operatorId);
      if (operator) {
        if (operator.minAmount && amount < operator.minAmount) {
          res.status(400).json({
            success: false,
            error: {
              code: 'AMOUNT_TOO_LOW',
              message: `Minimum payment amount is Rs. ${operator.minAmount}`
            }
          });
          return;
        }

        if (operator.maxAmount && amount > operator.maxAmount) {
          res.status(400).json({
            success: false,
            error: {
              code: 'AMOUNT_TOO_HIGH',
              message: `Maximum payment amount is Rs. ${operator.maxAmount}`
            }
          });
          return;
        }
      }

      const request: BillPaymentRequest = {
        billId,
        operatorId,
        fields,
        amount,
        paymentMethod,
        userId: extractUser(req),
        customerName,
        customerEmail,
        customerPhone,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
        metadata
      };

      const result = await bbpsService.payBill(request);

      if (!result.success) {
        const statusCode = result.error?.code === 'OPERATOR_NOT_FOUND' ? 404 : 400;
        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Bill payment error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to process payment. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/bill/:billId
 * Get bill details
 */
router.get(
  '/:billId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { billId } = req.params;
      const userId = extractUser(req);

      const result = await bbpsService.getBillDetails(billId, userId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Get bill error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get bill details. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/bill/history
 * Get bill payment history
 */
router.get(
  '/',
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
      console.error('Get history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get transaction history. Please try again.'
        }
      });
    }
  }
);

/**
 * POST /api/bbps/bill/validate
 * Validate bill fields for an operator
 */
router.post(
  '/validate',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { operatorId, fields } = req.body;

      const operator = getOperatorById(operatorId);
      if (!operator) {
        res.status(404).json({
          success: false,
          error: {
            code: 'OPERATOR_NOT_FOUND',
            message: `Operator ${operatorId} not found`
          }
        });
        return;
      }

      if (!fields || typeof fields !== 'object') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FIELDS',
            message: 'Fields object is required'
          }
        });
        return;
      }

      const validation = operator.fields.reduce(
        (acc, field) => {
          const value = fields[field.name];

          if (field.required && !value) {
            acc.missing.push(field.label);
          }

          if (value) {
            if (field.minLength && value.length < field.minLength) {
              acc.invalid.push(`${field.label} must be at least ${field.minLength} characters`);
            }
            if (field.maxLength && value.length > field.maxLength) {
              acc.invalid.push(`${field.label} must be at most ${field.maxLength} characters`);
            }
            if (field.pattern && !new RegExp(field.pattern).test(value)) {
              acc.invalid.push(`${field.label} format is invalid`);
            }
          }

          return acc;
        },
        { valid: true, missing: [] as string[], invalid: [] as string[] }
      );

      validation.valid = validation.missing.length === 0 && validation.invalid.length === 0;

      res.status(200).json({
        success: true,
        valid: validation.valid,
        missing: validation.missing,
        invalid: validation.invalid,
        operator: {
          id: operator.id,
          name: operator.name,
          category: operator.category,
          shortCode: operator.shortCode
        }
      });
    } catch (error) {
      console.error('Validate bill error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate fields. Please try again.'
        }
      });
    }
  }
);

export { router as billRoutes };
export default router;
