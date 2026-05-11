/**
 * Input Validation Schemas for REZ Loyalty System
 *
 * Uses Zod for runtime validation of all incoming data.
 * These schemas ensure type safety and prevent injection attacks.
 */

import { z } from 'zod';

// ============================================================================
// User & Profile Schemas
// ============================================================================

/**
 * MongoDB ObjectId validation pattern
 */
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

/**
 * Validates MongoDB ObjectId format
 */
export const userIdSchema = z.string().regex(OBJECT_ID_PATTERN, {
  message: 'Invalid user ID format. Must be a 24-character hex string.',
});

/**
 * Validates profile update data
 */
export const profileUpdateSchema = z.object({
  displayName: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name cannot exceed 50 characters')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email cannot exceed 255 characters')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),
  preferences: z.record(z.string(), z.any()).optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
}).strict();

/**
 * Validates profile query parameters
 */
export const profileQuerySchema = z.object({
  userId: userIdSchema,
  fields: z.array(z.string()).optional(),
  includePrivate: z.boolean().optional().default(false),
});

// ============================================================================
// Score Schemas
// ============================================================================

/**
 * Validates score query parameters
 */
export const scoreQuerySchema = z.object({
  userId: userIdSchema,
  fields: z.array(z.string()).optional(),
  period: z.enum(['day', 'week', 'month', 'year', 'all']).optional().default('all'),
});

/**
 * Validates score update data
 */
export const scoreUpdateSchema = z.object({
  userId: userIdSchema,
  points: z.number().int('Points must be an integer').min(-10000).max(10000),
  reason: z.string().min(1).max(200),
  source: z.enum(['purchase', 'review', 'referral', 'promotion', 'adjustment', 'expiry']),
  metadata: z.record(z.string(), z.any()).optional(),
}).strict();

/**
 * Validates batch score update
 */
export const batchScoreUpdateSchema = z.object({
  updates: z.array(scoreUpdateSchema).min(1).max(100),
}).strict();

// ============================================================================
// Decision Schemas
// ============================================================================

/**
 * Validates decision request payload
 */
export const decisionRequestSchema = z.object({
  userId: userIdSchema,
  amount: z.number().optional(),
  context: z.record(z.string(), z.any()).optional(),
  campaignId: z.string().regex(OBJECT_ID_PATTERN).optional(),
  merchantId: z.string().regex(OBJECT_ID_PATTERN).optional(),
  timestamp: z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
}).strict();

/**
 * Validates decision query parameters
 */
export const decisionQuerySchema = z.object({
  userId: userIdSchema,
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
  startDate: z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
  endDate: z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
});

// ============================================================================
// Streak Schemas
// ============================================================================

/**
 * Validates streak activity
 */
export const streakActivitySchema = z.object({
  userId: userIdSchema,
  activityType: z.enum(['login', 'purchase', 'review', 'checkin']),
  timestamp: z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).strict();

/**
 * Validates streak query
 */
export const streakQuerySchema = z.object({
  userId: userIdSchema,
  includeHistory: z.boolean().optional().default(false),
});

// ============================================================================
// Wallet & Transaction Schemas
// ============================================================================

/**
 * Validates coin credit/debit request
 */
export const coinTransactionSchema = z.object({
  userId: userIdSchema,
  amount: z.number().int().min(1).max(1000000),
  type: z.enum(['credit', 'debit']),
  reason: z.string().min(1).max(200),
  referenceId: z.string().max(100).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
}).strict();

/**
 * Validates wallet query
 */
export const walletQuerySchema = z.object({
  userId: userIdSchema,
  includeTransactions: z.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================================
// Reward & Tier Schemas
// ============================================================================

/**
 * Validates tier change request
 */
export const tierChangeSchema = z.object({
  userId: userIdSchema,
  newTier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
  reason: z.string().min(1).max(200),
  effectiveDate: z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
  adminId: z.string().regex(OBJECT_ID_PATTERN).optional(),
}).strict();

/**
 * Validates reward redemption
 */
export const rewardRedemptionSchema = z.object({
  userId: userIdSchema,
  rewardId: z.string().regex(OBJECT_ID_PATTERN),
  quantity: z.number().int().min(1).max(10).optional().default(1),
  deliveryMethod: z.enum(['instant', 'voucher', 'coupon']).optional().default('instant'),
}).strict();

// ============================================================================
// Admin Schemas
// ============================================================================

/**
 * Validates admin action payload
 */
export const adminActionSchema = z.object({
  action: z.enum([
    'adjust_score',
    'manual_credit',
    'manual_debit',
    'change_tier',
    'reset_streak',
    'ban_user',
    'unban_user',
    'view_sensitive',
  ]),
  targetUserId: userIdSchema,
  parameters: z.record(z.string(), z.any()).optional(),
  reason: z.string().min(10).max(500),
  adminId: z.string().regex(OBJECT_ID_PATTERN),
}).strict();

// ============================================================================
// Pagination & Common Schemas
// ============================================================================

/**
 * Standard pagination parameters
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Date range filter
 */
export const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: 'Start date must be before end date',
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Safely parse and validate data against a schema
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate and throw on error
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.parse(data);
  return result;
}

/**
 * Create a custom error handler for validation errors
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((issue: z.ZodIssue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

export { z };
