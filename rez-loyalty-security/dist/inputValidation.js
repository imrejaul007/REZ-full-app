"use strict";
/**
 * Input Validation Schemas for REZ Loyalty System
 *
 * Uses Zod for runtime validation of all incoming data.
 * These schemas ensure type safety and prevent injection attacks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = exports.dateRangeSchema = exports.paginationSchema = exports.adminActionSchema = exports.rewardRedemptionSchema = exports.tierChangeSchema = exports.walletQuerySchema = exports.coinTransactionSchema = exports.streakQuerySchema = exports.streakActivitySchema = exports.decisionQuerySchema = exports.decisionRequestSchema = exports.batchScoreUpdateSchema = exports.scoreUpdateSchema = exports.scoreQuerySchema = exports.profileQuerySchema = exports.profileUpdateSchema = exports.userIdSchema = void 0;
exports.safeParse = safeParse;
exports.validateOrThrow = validateOrThrow;
exports.formatValidationErrors = formatValidationErrors;
const zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
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
exports.userIdSchema = zod_1.z.string().regex(OBJECT_ID_PATTERN, {
    message: 'Invalid user ID format. Must be a 24-character hex string.',
});
/**
 * Validates profile update data
 */
exports.profileUpdateSchema = zod_1.z.object({
    displayName: zod_1.z.string()
        .min(2, 'Display name must be at least 2 characters')
        .max(50, 'Display name cannot exceed 50 characters')
        .optional(),
    email: zod_1.z.string()
        .email('Invalid email format')
        .max(255, 'Email cannot exceed 255 characters')
        .optional()
        .or(zod_1.z.literal('')),
    phone: zod_1.z.string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
        .optional(),
    preferences: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    avatar: zod_1.z.string().url('Avatar must be a valid URL').optional(),
}).strict();
/**
 * Validates profile query parameters
 */
exports.profileQuerySchema = zod_1.z.object({
    userId: exports.userIdSchema,
    fields: zod_1.z.array(zod_1.z.string()).optional(),
    includePrivate: zod_1.z.boolean().optional().default(false),
});
// ============================================================================
// Score Schemas
// ============================================================================
/**
 * Validates score query parameters
 */
exports.scoreQuerySchema = zod_1.z.object({
    userId: exports.userIdSchema,
    fields: zod_1.z.array(zod_1.z.string()).optional(),
    period: zod_1.z.enum(['day', 'week', 'month', 'year', 'all']).optional().default('all'),
});
/**
 * Validates score update data
 */
exports.scoreUpdateSchema = zod_1.z.object({
    userId: exports.userIdSchema,
    points: zod_1.z.number().int('Points must be an integer').min(-10000).max(10000),
    reason: zod_1.z.string().min(1).max(200),
    source: zod_1.z.enum(['purchase', 'review', 'referral', 'promotion', 'adjustment', 'expiry']),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
}).strict();
/**
 * Validates batch score update
 */
exports.batchScoreUpdateSchema = zod_1.z.object({
    updates: zod_1.z.array(exports.scoreUpdateSchema).min(1).max(100),
}).strict();
// ============================================================================
// Decision Schemas
// ============================================================================
/**
 * Validates decision request payload
 */
exports.decisionRequestSchema = zod_1.z.object({
    userId: exports.userIdSchema,
    amount: zod_1.z.number().optional(),
    context: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    campaignId: zod_1.z.string().regex(OBJECT_ID_PATTERN).optional(),
    merchantId: zod_1.z.string().regex(OBJECT_ID_PATTERN).optional(),
    timestamp: zod_1.z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
}).strict();
/**
 * Validates decision query parameters
 */
exports.decisionQuerySchema = zod_1.z.object({
    userId: exports.userIdSchema,
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(10),
    offset: zod_1.z.coerce.number().int().min(0).optional().default(0),
    startDate: zod_1.z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
    endDate: zod_1.z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
});
// ============================================================================
// Streak Schemas
// ============================================================================
/**
 * Validates streak activity
 */
exports.streakActivitySchema = zod_1.z.object({
    userId: exports.userIdSchema,
    activityType: zod_1.z.enum(['login', 'purchase', 'review', 'checkin']),
    timestamp: zod_1.z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
}).strict();
/**
 * Validates streak query
 */
exports.streakQuerySchema = zod_1.z.object({
    userId: exports.userIdSchema,
    includeHistory: zod_1.z.boolean().optional().default(false),
});
// ============================================================================
// Wallet & Transaction Schemas
// ============================================================================
/**
 * Validates coin credit/debit request
 */
exports.coinTransactionSchema = zod_1.z.object({
    userId: exports.userIdSchema,
    amount: zod_1.z.number().int().min(1).max(1000000),
    type: zod_1.z.enum(['credit', 'debit']),
    reason: zod_1.z.string().min(1).max(200),
    referenceId: zod_1.z.string().max(100).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
}).strict();
/**
 * Validates wallet query
 */
exports.walletQuerySchema = zod_1.z.object({
    userId: exports.userIdSchema,
    includeTransactions: zod_1.z.boolean().optional().default(false),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
    offset: zod_1.z.coerce.number().int().min(0).optional().default(0),
});
// ============================================================================
// Reward & Tier Schemas
// ============================================================================
/**
 * Validates tier change request
 */
exports.tierChangeSchema = zod_1.z.object({
    userId: exports.userIdSchema,
    newTier: zod_1.z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
    reason: zod_1.z.string().min(1).max(200),
    effectiveDate: zod_1.z.string().datetime({ message: 'Invalid ISO 8601 datetime format' }).optional(),
    adminId: zod_1.z.string().regex(OBJECT_ID_PATTERN).optional(),
}).strict();
/**
 * Validates reward redemption
 */
exports.rewardRedemptionSchema = zod_1.z.object({
    userId: exports.userIdSchema,
    rewardId: zod_1.z.string().regex(OBJECT_ID_PATTERN),
    quantity: zod_1.z.number().int().min(1).max(10).optional().default(1),
    deliveryMethod: zod_1.z.enum(['instant', 'voucher', 'coupon']).optional().default('instant'),
}).strict();
// ============================================================================
// Admin Schemas
// ============================================================================
/**
 * Validates admin action payload
 */
exports.adminActionSchema = zod_1.z.object({
    action: zod_1.z.enum([
        'adjust_score',
        'manual_credit',
        'manual_debit',
        'change_tier',
        'reset_streak',
        'ban_user',
        'unban_user',
        'view_sensitive',
    ]),
    targetUserId: exports.userIdSchema,
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    reason: zod_1.z.string().min(10).max(500),
    adminId: zod_1.z.string().regex(OBJECT_ID_PATTERN),
}).strict();
// ============================================================================
// Pagination & Common Schemas
// ============================================================================
/**
 * Standard pagination parameters
 */
exports.paginationSchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
    offset: zod_1.z.coerce.number().int().min(0).optional().default(0),
    sortBy: zod_1.z.string().max(50).optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
});
/**
 * Date range filter
 */
exports.dateRangeSchema = zod_1.z.object({
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string(),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: 'Start date must be before end date',
});
// ============================================================================
// Validation Helper Functions
// ============================================================================
/**
 * Safely parse and validate data against a schema
 */
function safeParse(schema, data) {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return { success: false, errors: result.error };
}
/**
 * Validate and throw on error
 */
function validateOrThrow(schema, data) {
    const result = schema.parse(data);
    return result;
}
/**
 * Create a custom error handler for validation errors
 */
function formatValidationErrors(error) {
    return error.issues.map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
    });
}
//# sourceMappingURL=inputValidation.js.map