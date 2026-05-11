/**
 * Operator Routes - All operators endpoints
 * Electricity, Gas, Water, Mobile, Insurance, Loan, DTH, Broadband, Landline, Cable
 */

import { Router, Request, Response } from 'express';
import {
  OPERATORS,
  getOperatorsByCategory,
  getOperatorById,
  getAllOperators,
  getCategoriesWithCounts,
  getCategoryDisplayName,
  CATEGORIES,
  OperatorConfig,
  BillCategory
} from '../config/operators';

const router = Router();

/**
 * GET /api/bbps/operators
 * Get all operators with optional filtering
 */
router.get(
  '/',
  (req: Request, res: Response): void => {
    try {
      const { category, active, search } = req.query;

      let operators = getAllOperators();

      // Filter by category
      if (category && typeof category === 'string') {
        const validCategories = CATEGORIES as unknown as string[];
        if (validCategories.includes(category)) {
          operators = operators.filter((op) => op.category === category);
        }
      }

      // Filter by active status
      if (active !== undefined) {
        const isActive = active === 'true';
        operators = operators.filter((op) => op.isActive === isActive);
      }

      // Search by name or short code
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        operators = operators.filter(
          (op) =>
            op.name.toLowerCase().includes(searchLower) ||
            op.shortCode.toLowerCase().includes(searchLower) ||
            op.category.toLowerCase().includes(searchLower)
        );
      }

      res.status(200).json({
        success: true,
        count: operators.length,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/categories
 * Get all categories with operator counts
 */
router.get(
  '/categories',
  (req: Request, res: Response): void => {
    try {
      const counts = getCategoriesWithCounts();

      const categories = CATEGORIES.map((category) => ({
        id: category,
        name: getCategoryDisplayName(category),
        count: counts[category],
        icon: getCategoryIcon(category)
      }));

      res.status(200).json({
        success: true,
        categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get categories. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/electricity
 * Get all electricity operators
 */
router.get(
  '/electricity',
  (req: Request, res: Response): void => {
    try {
      const operators = getOperatorsByCategory('electricity');

      res.status(200).json({
        success: true,
        category: 'electricity',
        displayName: 'Electricity',
        count: operators.length,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get electricity operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get electricity operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/gas
 * Get all gas operators
 */
router.get(
  '/gas',
  (req: Request, res: Response): void => {
    try {
      const operators = getOperatorsByCategory('gas');

      res.status(200).json({
        success: true,
        category: 'gas',
        displayName: 'Gas',
        count: operators.length,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get gas operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get gas operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/water
 * Get all water/municipal operators
 */
router.get(
  '/water',
  (req: Request, res: Response): void => {
    try {
      const operators = getOperatorsByCategory('water');

      res.status(200).json({
        success: true,
        category: 'water',
        displayName: 'Water',
        count: operators.length,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get water operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get water operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/mobile
 * Get all mobile operators (prepaid and postpaid)
 */
router.get(
  '/mobile',
  (req: Request, res: Response): void => {
    try {
      const { type } = req.query;
      let operators = getOperatorsByCategory('mobile');

      // Filter by type (prepaid/postpaid)
      if (type && typeof type === 'string') {
        operators = operators.filter((op) => op.subcategory === type);
      }

      // Group by subcategory
      const grouped = operators.reduce(
        (acc, op) => {
          const subcat = op.subcategory || 'general';
          if (!acc[subcat]) {
            acc[subcat] = [];
          }
          acc[subcat].push(formatOperator(op));
          return acc;
        },
        {} as Record<string, ReturnType<typeof formatOperator>[]>
      );

      res.status(200).json({
        success: true,
        category: 'mobile',
        displayName: 'Mobile',
        count: operators.length,
        grouped,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get mobile operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get mobile operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/insurance
 * Get all insurance operators (life, health, car)
 */
router.get(
  '/insurance',
  (req: Request, res: Response): void => {
    try {
      const { type } = req.query;
      let operators = getOperatorsByCategory('insurance');

      // Filter by subcategory
      if (type && typeof type === 'string') {
        operators = operators.filter((op) => op.subcategory === type);
      }

      // Group by subcategory
      const grouped = operators.reduce(
        (acc, op) => {
          const subcat = op.subcategory || 'general';
          if (!acc[subcat]) {
            acc[subcat] = [];
          }
          acc[subcat].push(formatOperator(op));
          return acc;
        },
        {} as Record<string, ReturnType<typeof formatOperator>[]>
      );

      res.status(200).json({
        success: true,
        category: 'insurance',
        displayName: 'Insurance',
        count: operators.length,
        grouped,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get insurance operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get insurance operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/loan
 * Get all loan operators (home, personal, education)
 */
router.get(
  '/loan',
  (req: Request, res: Response): void => {
    try {
      const { type } = req.query;
      let operators = getOperatorsByCategory('loan');

      // Filter by subcategory
      if (type && typeof type === 'string') {
        operators = operators.filter((op) => op.subcategory === type);
      }

      // Group by subcategory
      const grouped = operators.reduce(
        (acc, op) => {
          const subcat = op.subcategory || 'general';
          if (!acc[subcat]) {
            acc[subcat] = [];
          }
          acc[subcat].push(formatOperator(op));
          return acc;
        },
        {} as Record<string, ReturnType<typeof formatOperator>[]>
      );

      res.status(200).json({
        success: true,
        category: 'loan',
        displayName: 'Loan',
        count: operators.length,
        grouped,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get loan operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get loan operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/dth
 * Get all DTH operators
 */
router.get(
  '/dth',
  (req: Request, res: Response): void => {
    try {
      const operators = getOperatorsByCategory('dth');

      res.status(200).json({
        success: true,
        category: 'dth',
        displayName: 'DTH',
        count: operators.length,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get DTH operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get DTH operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/broadband
 * Get all broadband operators
 */
router.get(
  '/broadband',
  (req: Request, res: Response): void => {
    try {
      const operators = getOperatorsByCategory('broadband');

      res.status(200).json({
        success: true,
        category: 'broadband',
        displayName: 'Broadband',
        count: operators.length,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get broadband operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get broadband operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/landline
 * Get all landline operators
 */
router.get(
  '/landline',
  (req: Request, res: Response): void => {
    try {
      const operators = getOperatorsByCategory('landline');

      res.status(200).json({
        success: true,
        category: 'landline',
        displayName: 'Landline',
        count: operators.length,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get landline operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get landline operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/cable
 * Get all cable TV operators
 */
router.get(
  '/cable',
  (req: Request, res: Response): void => {
    try {
      const operators = getOperatorsByCategory('cable');

      res.status(200).json({
        success: true,
        category: 'cable',
        displayName: 'Cable TV',
        count: operators.length,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Get cable operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get cable operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/search
 * Search operators by name
 */
router.get(
  '/search',
  (req: Request, res: Response): void => {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'Search query must be at least 2 characters'
          }
        });
        return;
      }

      const searchLower = q.trim().toLowerCase();
      const operators = getAllOperators().filter(
        (op) =>
          op.name.toLowerCase().includes(searchLower) ||
          op.shortCode.toLowerCase().includes(searchLower)
      );

      res.status(200).json({
        success: true,
        query: q,
        count: operators.length,
        operators: operators.map(formatOperator)
      });
    } catch (error) {
      console.error('Search operators error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search operators. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/:operatorId
 * Get operator details by ID
 */
router.get(
  '/:operatorId',
  (req: Request, res: Response): void => {
    try {
      const { operatorId } = req.params;

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

      res.status(200).json({
        success: true,
        operator: formatOperatorDetail(operator)
      });
    } catch (error) {
      console.error('Get operator error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get operator. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/:operatorId/fields
 * Get required fields for an operator
 */
router.get(
  '/:operatorId/fields',
  (req: Request, res: Response): void => {
    try {
      const { operatorId } = req.params;

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

      res.status(200).json({
        success: true,
        operatorId: operator.id,
        operatorName: operator.name,
        category: operator.category,
        paymentFields: operator.fields,
        fetchBillFields: operator.fetchBillFields,
        amountLimits: {
          min: operator.minAmount,
          max: operator.maxAmount
        },
        billValidation: operator.billValidation
      });
    } catch (error) {
      console.error('Get operator fields error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get operator fields. Please try again.'
        }
      });
    }
  }
);

/**
 * GET /api/bbps/operators/:operatorId/validate
 * Validate customer fields for an operator
 */
router.post(
  '/:operatorId/validate',
  (req: Request, res: Response): void => {
    try {
      const { operatorId } = req.params;
      const { fields } = req.body;

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

      const errors: string[] = [];

      for (const field of operator.fields) {
        const value = fields[field.name];

        if (field.required && !value) {
          errors.push(`${field.label} is required`);
          continue;
        }

        if (value) {
          if (field.minLength && value.length < field.minLength) {
            errors.push(`${field.label} must be at least ${field.minLength} characters`);
          }
          if (field.maxLength && value.length > field.maxLength) {
            errors.push(`${field.label} must be at most ${field.maxLength} characters`);
          }
          if (field.pattern && !new RegExp(field.pattern).test(value)) {
            errors.push(`${field.label} format is invalid`);
          }
        }
      }

      res.status(200).json({
        success: errors.length === 0,
        valid: errors.length === 0,
        errors,
        operator: {
          id: operator.id,
          name: operator.name,
          category: operator.category,
          shortCode: operator.shortCode
        }
      });
    } catch (error) {
      console.error('Validate operator fields error:', error);
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

// ============ HELPER FUNCTIONS ============

/**
 * Format operator for list response
 */
function formatOperator(operator: OperatorConfig): {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  shortCode: string;
  minAmount?: number;
  maxAmount?: number;
} {
  return {
    id: operator.id,
    name: operator.name,
    category: operator.category,
    subcategory: operator.subcategory,
    shortCode: operator.shortCode,
    minAmount: operator.minAmount,
    maxAmount: operator.maxAmount
  };
}

/**
 * Format operator for detail response
 */
function formatOperatorDetail(operator: OperatorConfig): {
  id: string;
  name: string;
  category: string;
  categoryDisplayName: string;
  subcategory?: string;
  shortCode: string;
  logo?: string;
  fields: OperatorConfig['fields'];
  fetchBillFields: OperatorConfig['fetchBillFields'];
  minAmount?: number;
  maxAmount?: number;
  isActive: boolean;
  billValidation?: boolean;
} {
  return {
    id: operator.id,
    name: operator.name,
    category: operator.category,
    categoryDisplayName: getCategoryDisplayName(operator.category as BillCategory),
    subcategory: operator.subcategory,
    shortCode: operator.shortCode,
    logo: operator.logo,
    fields: operator.fields,
    fetchBillFields: operator.fetchBillFields,
    minAmount: operator.minAmount,
    maxAmount: operator.maxAmount,
    isActive: operator.isActive,
    billValidation: operator.billValidation
  };
}

/**
 * Get category icon
 */
function getCategoryIcon(category: BillCategory): string {
  const icons: Record<BillCategory, string> = {
    electricity: 'bolt',
    gas: 'fire',
    water: 'droplet',
    mobile: 'smartphone',
    insurance: 'shield',
    loan: 'landmark',
    dth: 'tv',
    broadband: 'wifi',
    landline: 'phone',
    cable: 'tv-2'
  };
  return icons[category];
}

export { router as operatorRoutes };
export default router;
