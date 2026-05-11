/**
 * Input Validation Schemas for REZ Loyalty System
 *
 * Uses Zod for runtime validation of all incoming data.
 * These schemas ensure type safety and prevent injection attacks.
 */
import { z } from 'zod';
/**
 * Validates MongoDB ObjectId format
 */
export declare const userIdSchema: z.ZodString;
/**
 * Validates profile update data
 */
export declare const profileUpdateSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    avatar: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
/**
 * Validates profile query parameters
 */
export declare const profileQuerySchema: z.ZodObject<{
    userId: z.ZodString;
    fields: z.ZodOptional<z.ZodArray<z.ZodString>>;
    includePrivate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Validates score query parameters
 */
export declare const scoreQuerySchema: z.ZodObject<{
    userId: z.ZodString;
    fields: z.ZodOptional<z.ZodArray<z.ZodString>>;
    period: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        year: "year";
        week: "week";
        day: "day";
        all: "all";
        month: "month";
    }>>>;
}, z.core.$strip>;
/**
 * Validates score update data
 */
export declare const scoreUpdateSchema: z.ZodObject<{
    userId: z.ZodString;
    points: z.ZodNumber;
    reason: z.ZodString;
    source: z.ZodEnum<{
        purchase: "purchase";
        review: "review";
        referral: "referral";
        promotion: "promotion";
        adjustment: "adjustment";
        expiry: "expiry";
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strict>;
/**
 * Validates batch score update
 */
export declare const batchScoreUpdateSchema: z.ZodObject<{
    updates: z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        points: z.ZodNumber;
        reason: z.ZodString;
        source: z.ZodEnum<{
            purchase: "purchase";
            review: "review";
            referral: "referral";
            promotion: "promotion";
            adjustment: "adjustment";
            expiry: "expiry";
        }>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
/**
 * Validates decision request payload
 */
export declare const decisionRequestSchema: z.ZodObject<{
    userId: z.ZodString;
    amount: z.ZodOptional<z.ZodNumber>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    campaignId: z.ZodOptional<z.ZodString>;
    merchantId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
/**
 * Validates decision query parameters
 */
export declare const decisionQuerySchema: z.ZodObject<{
    userId: z.ZodString;
    limit: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
/**
 * Validates streak activity
 */
export declare const streakActivitySchema: z.ZodObject<{
    userId: z.ZodString;
    activityType: z.ZodEnum<{
        purchase: "purchase";
        review: "review";
        login: "login";
        checkin: "checkin";
    }>;
    timestamp: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strict>;
/**
 * Validates streak query
 */
export declare const streakQuerySchema: z.ZodObject<{
    userId: z.ZodString;
    includeHistory: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Validates coin credit/debit request
 */
export declare const coinTransactionSchema: z.ZodObject<{
    userId: z.ZodString;
    amount: z.ZodNumber;
    type: z.ZodEnum<{
        credit: "credit";
        debit: "debit";
    }>;
    reason: z.ZodString;
    referenceId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strict>;
/**
 * Validates wallet query
 */
export declare const walletQuerySchema: z.ZodObject<{
    userId: z.ZodString;
    includeTransactions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
}, z.core.$strip>;
/**
 * Validates tier change request
 */
export declare const tierChangeSchema: z.ZodObject<{
    userId: z.ZodString;
    newTier: z.ZodEnum<{
        bronze: "bronze";
        silver: "silver";
        gold: "gold";
        platinum: "platinum";
        diamond: "diamond";
    }>;
    reason: z.ZodString;
    effectiveDate: z.ZodOptional<z.ZodString>;
    adminId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
/**
 * Validates reward redemption
 */
export declare const rewardRedemptionSchema: z.ZodObject<{
    userId: z.ZodString;
    rewardId: z.ZodString;
    quantity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    deliveryMethod: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        instant: "instant";
        voucher: "voucher";
        coupon: "coupon";
    }>>>;
}, z.core.$strict>;
/**
 * Validates admin action payload
 */
export declare const adminActionSchema: z.ZodObject<{
    action: z.ZodEnum<{
        change_tier: "change_tier";
        adjust_score: "adjust_score";
        manual_credit: "manual_credit";
        manual_debit: "manual_debit";
        reset_streak: "reset_streak";
        ban_user: "ban_user";
        unban_user: "unban_user";
        view_sensitive: "view_sensitive";
    }>;
    targetUserId: z.ZodString;
    parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    reason: z.ZodString;
    adminId: z.ZodString;
}, z.core.$strict>;
/**
 * Standard pagination parameters
 */
export declare const paginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>>;
}, z.core.$strip>;
/**
 * Date range filter
 */
export declare const dateRangeSchema: z.ZodObject<{
    startDate: z.ZodString;
    endDate: z.ZodString;
}, z.core.$strip>;
/**
 * Safely parse and validate data against a schema
 */
export declare function safeParse<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    errors: z.ZodError;
};
/**
 * Validate and throw on error
 */
export declare function validateOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T;
/**
 * Create a custom error handler for validation errors
 */
export declare function formatValidationErrors(error: z.ZodError): string[];
export { z };
//# sourceMappingURL=inputValidation.d.ts.map