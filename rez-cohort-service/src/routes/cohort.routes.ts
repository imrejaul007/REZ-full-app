import { Router, Request, Response } from 'express';
import { CohortService } from '../services/cohortService';
import { CohortModel } from '../models/Cohort';
import { CohortCriteria, CohortDefinition, User, Transaction, ActivityEvent } from '../types';

const cohortModel = new CohortModel();
const cohortService = new CohortService(cohortModel);

const router = Router();

// Initialize cohort model with sample data
cohortModel.seedSampleData();

// ==================== Health Check ====================

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'cohort-analysis-service',
      timestamp: new Date(),
    },
  });
});

// ==================== Cohort Management ====================

/**
 * GET /api/cohorts
 * Get all cohorts with optional filtering
 */
router.get('/cohorts', (req: Request, res: Response) => {
  const { signupMonth, minSize, maxSize, sortBy, sortOrder } = req.query;

  const result = cohortService.getCohorts({
    signupMonth: signupMonth as string | undefined,
    minSize: minSize ? parseInt(minSize as string, 10) : undefined,
    maxSize: maxSize ? parseInt(maxSize as string, 10) : undefined,
    sortBy: sortBy as 'size' | 'cohortKey' | 'createdAt' | undefined,
    sortOrder: sortOrder as 'asc' | 'desc' | undefined,
  });

  res.status(result.success ? 200 : 400).json(result);
});

/**
 * GET /api/cohorts/summary
 * Get cohort summary statistics
 */
router.get('/cohorts/summary', (_req: Request, res: Response) => {
  const result = cohortService.getCohortSummary();
  res.status(result.success ? 200 : 400).json(result);
});

/**
 * GET /api/cohorts/:id
 * Get a single cohort by ID
 */
router.get('/cohorts/:id', (req: Request, res: Response) => {
  const result = cohortService.getCohortById(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
});

/**
 * POST /api/cohorts
 * Create a new cohort
 */
router.post('/cohorts', (req: Request, res: Response) => {
  const { name, signupMonth, criteria } = req.body;

  if (signupMonth) {
    const result = cohortService.createCohortBySignupMonth(name || `Cohort ${signupMonth}`, signupMonth);
    res.status(result.success ? 201 : 400).json(result);
  } else if (criteria) {
    const result = cohortService.createCohortFromCriteria({ name, criteria } as Partial<CohortDefinition>);
    res.status(result.success ? 201 : 400).json(result);
  } else {
    res.status(400).json({
      success: false,
      error: 'Either signupMonth or criteria must be provided',
      timestamp: new Date(),
    });
  }
});

/**
 * POST /api/cohorts/bulk
 * Create cohorts for a range of months
 */
router.post('/cohorts/bulk', (req: Request, res: Response) => {
  const { startMonth, endMonth } = req.body;

  if (!startMonth || !endMonth) {
    res.status(400).json({
      success: false,
      error: 'startMonth and endMonth are required',
      timestamp: new Date(),
    });
    return;
  }

  const result = cohortService.createCohortsByMonthRange(startMonth, endMonth);
  res.status(result.success ? 201 : 400).json(result);
});

/**
 * DELETE /api/cohorts/:id
 * Delete a cohort
 */
router.delete('/cohorts/:id', (req: Request, res: Response) => {
  const result = cohortService.deleteCohort(req.params.id);
  res.status(result.success ? 200 : 404).json(result);
});

// ==================== Retention Analysis ====================

/**
 * GET /api/retention/:cohortId
 * Get retention analysis for a cohort
 */
router.get('/retention/:cohortId', (req: Request, res: Response) => {
  const { maxPeriods, periodType } = req.query;

  const result = cohortService.getRetentionAnalysis(req.params.cohortId, {
    maxPeriods: maxPeriods ? parseInt(maxPeriods as string, 10) : 12,
    periodType: periodType as 'day' | 'week' | 'month' | undefined,
  });

  res.status(result.success ? 200 : 404).json(result);
});

/**
 * GET /api/retention/:cohortId/trend
 * Get retention trend over time
 */
router.get('/retention/:cohortId/trend', (req: Request, res: Response) => {
  const { periods } = req.query;

  const result = cohortService.getRetentionTrend(
    req.params.cohortId,
    periods ? parseInt(periods as string, 10) : 12
  );

  res.status(result.success ? 200 : 404).json(result);
});

/**
 * GET /api/retention/:cohortId/health
 * Get retention health score
 */
router.get('/retention/:cohortId/health', (req: Request, res: Response) => {
  const result = cohortService.getRetentionHealthScore(req.params.cohortId);
  res.status(result.success ? 200 : 404).json(result);
});

/**
 * POST /api/retention/multi
 * Get retention for multiple cohorts
 */
router.post('/retention/multi', (req: Request, res: Response) => {
  const { cohortIds, maxPeriods } = req.body;

  if (!cohortIds || !Array.isArray(cohortIds)) {
    res.status(400).json({
      success: false,
      error: 'cohortIds array is required',
      timestamp: new Date(),
    });
    return;
  }

  const result = cohortService.getMultiCohortRetention(
    cohortIds,
    maxPeriods || 12
  );

  res.status(200).json(result);
});

// ==================== Engagement Metrics ====================

/**
 * GET /api/engagement/:cohortId
 * Get engagement metrics for a cohort
 */
router.get('/engagement/:cohortId', (req: Request, res: Response) => {
  const { periodIndex } = req.query;

  const result = cohortService.getEngagementMetrics(
    req.params.cohortId,
    periodIndex ? parseInt(periodIndex as string, 10) : 0
  );

  res.status(result.success ? 200 : 404).json(result);
});

/**
 * POST /api/engagement/compare
 * Compare engagement across multiple cohorts
 */
router.post('/engagement/compare', (req: Request, res: Response) => {
  const { cohortIds } = req.body;

  if (!cohortIds || !Array.isArray(cohortIds)) {
    res.status(400).json({
      success: false,
      error: 'cohortIds array is required',
      timestamp: new Date(),
    });
    return;
  }

  const result = cohortService.getEngagementComparison(cohortIds);
  res.status(200).json(result);
});

// ==================== Revenue Cohorts ====================

/**
 * GET /api/revenue/:cohortId
 * Get revenue cohort analysis
 */
router.get('/revenue/:cohortId', (req: Request, res: Response) => {
  const { maxPeriods } = req.query;

  const result = cohortService.getRevenueCohort(
    req.params.cohortId,
    maxPeriods ? parseInt(maxPeriods as string, 10) : 12
  );

  res.status(result.success ? 200 : 404).json(result);
});

/**
 * POST /api/revenue/compare
 * Compare revenue across multiple cohorts
 */
router.post('/revenue/compare', (req: Request, res: Response) => {
  const { cohortIds } = req.body;

  if (!cohortIds || !Array.isArray(cohortIds)) {
    res.status(400).json({
      success: false,
      error: 'cohortIds array is required',
      timestamp: new Date(),
    });
    return;
  }

  const result = cohortService.getRevenueComparison(cohortIds);
  res.status(200).json(result);
});

// ==================== Chart Data ====================

/**
 * POST /api/charts/retention
 * Generate retention chart data
 */
router.post('/charts/retention', (req: Request, res: Response) => {
  const { cohortIds, maxPeriods } = req.body;

  if (!cohortIds || !Array.isArray(cohortIds)) {
    res.status(400).json({
      success: false,
      error: 'cohortIds array is required',
      timestamp: new Date(),
    });
    return;
  }

  const result = cohortService.getRetentionChartData(
    cohortIds,
    maxPeriods || 12
  );

  res.status(200).json(result);
});

/**
 * POST /api/charts/revenue
 * Generate revenue chart data
 */
router.post('/charts/revenue', (req: Request, res: Response) => {
  const { cohortIds, maxPeriods } = req.body;

  if (!cohortIds || !Array.isArray(cohortIds)) {
    res.status(400).json({
      success: false,
      error: 'cohortIds array is required',
      timestamp: new Date(),
    });
    return;
  }

  const result = cohortService.getRevenueChartData(
    cohortIds,
    maxPeriods || 12
  );

  res.status(200).json(result);
});

/**
 * POST /api/charts/engagement
 * Generate engagement chart data
 */
router.post('/charts/engagement', (req: Request, res: Response) => {
  const { cohortIds, periodIndex } = req.body;

  if (!cohortIds || !Array.isArray(cohortIds)) {
    res.status(400).json({
      success: false,
      error: 'cohortIds array is required',
      timestamp: new Date(),
    });
    return;
  }

  const result = cohortService.getEngagementChartData(
    cohortIds,
    periodIndex || 0
  );

  res.status(200).json(result);
});

// ==================== Cohort Comparison ====================

/**
 * POST /api/compare
 * Compare two cohorts
 */
router.post('/compare', (req: Request, res: Response) => {
  const { cohortIdA, cohortIdB } = req.body;

  if (!cohortIdA || !cohortIdB) {
    res.status(400).json({
      success: false,
      error: 'cohortIdA and cohortIdB are required',
      timestamp: new Date(),
    });
    return;
  }

  const result = cohortService.compareCohorts(cohortIdA, cohortIdB);
  res.status(result.success ? 200 : 404).json(result);
});

// ==================== User Management ====================

/**
 * POST /api/users
 * Add a new user
 */
router.post('/users', (req: Request, res: Response) => {
  const { email, signupDate, metadata } = req.body;

  if (!email || !signupDate) {
    res.status(400).json({
      success: false,
      error: 'email and signupDate are required',
      timestamp: new Date(),
    });
    return;
  }

  try {
    const user = cohortModel.addUser({
      email,
      signupDate: new Date(signupDate),
      metadata,
    });

    res.status(201).json({
      success: true,
      data: user,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error adding user',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/users/:id
 * Get a user by ID
 */
router.get('/users/:id', (req: Request, res: Response) => {
  const user = cohortModel.getUserById(req.params.id);

  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found',
      timestamp: new Date(),
    });
    return;
  }

  res.json({
    success: true,
    data: user,
    timestamp: new Date(),
  });
});

/**
 * GET /api/users
 * Get users by signup month
 */
router.get('/users', (req: Request, res: Response) => {
  const { signupMonth } = req.query;

  if (!signupMonth) {
    res.status(400).json({
      success: false,
      error: 'signupMonth query parameter is required',
      timestamp: new Date(),
    });
    return;
  }

  const users = cohortModel.getUsersBySignupMonth(signupMonth as string);
  res.json({
    success: true,
    data: users,
    timestamp: new Date(),
  });
});

// ==================== Activity Tracking ====================

/**
 * POST /api/activities
 * Record an activity event
 */
router.post('/activities', (req: Request, res: Response) => {
  const { userId, eventType, properties } = req.body;

  if (!userId || !eventType) {
    res.status(400).json({
      success: false,
      error: 'userId and eventType are required',
      timestamp: new Date(),
    });
    return;
  }

  try {
    const activity = cohortModel.recordActivity(userId, eventType, properties);
    res.status(201).json({
      success: true,
      data: activity,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error recording activity',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/activities/:userId
 * Get activities for a user
 */
router.get('/activities/:userId', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;

  const activities = cohortModel.getUserActivities(
    req.params.userId,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({
    success: true,
    data: activities,
    timestamp: new Date(),
  });
});

// ==================== Transactions ====================

/**
 * POST /api/transactions
 * Record a transaction
 */
router.post('/transactions', (req: Request, res: Response) => {
  const { userId, amount, currency, date, type, metadata } = req.body;

  if (!userId || amount === undefined || !currency || !date || !type) {
    res.status(400).json({
      success: false,
      error: 'userId, amount, currency, date, and type are required',
      timestamp: new Date(),
    });
    return;
  }

  try {
    const transaction = cohortModel.recordTransaction({
      userId,
      amount,
      currency,
      date: new Date(date),
      type,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: transaction,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error recording transaction',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/transactions/:userId
 * Get transactions for a user
 */
router.get('/transactions/:userId', (req: Request, res: Response) => {
  const transactions = cohortModel.getUserTransactions(req.params.userId);

  res.json({
    success: true,
    data: transactions,
    timestamp: new Date(),
  });
});

export default router;
