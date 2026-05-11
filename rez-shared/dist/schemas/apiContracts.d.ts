/**
 * Canonical API Response Contracts
 *
 * These schemas define the canonical request/response shapes for all client-server communication.
 * All four codebases (consumer, merchant, admin, backend) must conform to these schemas.
 *
 * Generated from unified audit: Phase 3 API contract alignment (2026-04-15)
 * Bug IDs: CA-API-*, MA-API-*, AA-API-*
 */
import { z } from 'zod';
/**
 * Canonical API Response Wrapper
 * All endpoints must return responses conforming to this shape
 */
export declare const apiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodUnknown>;
    message: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    success?: boolean;
    data?: unknown;
    error?: string;
    meta?: Record<string, unknown>;
}, {
    message?: string;
    success?: boolean;
    data?: unknown;
    error?: string;
    meta?: Record<string, unknown>;
}>;
/**
 * User Profile Contract
 * Used by: GET /user/auth/me, PATCH /user/auth/profile
 */
export declare const userProfileSchema: z.ZodObject<{
    id: z.ZodString;
    _id: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        dateOfBirth: z.ZodOptional<z.ZodString>;
        gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
        location: z.ZodOptional<z.ZodObject<{
            address: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            state: z.ZodOptional<z.ZodString>;
            pincode: z.ZodOptional<z.ZodString>;
            coordinates: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        }, "strip", z.ZodTypeAny, {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        }, {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        }>>;
    }, "strip", z.ZodTypeAny, {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        dateOfBirth?: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        location?: {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        };
    }, {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        dateOfBirth?: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        location?: {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        };
    }>>;
    preferences: z.ZodOptional<z.ZodObject<{
        language: z.ZodOptional<z.ZodString>;
        currency: z.ZodOptional<z.ZodString>;
        theme: z.ZodOptional<z.ZodEnum<["light", "dark"]>>;
        notifications: z.ZodOptional<z.ZodObject<{
            push: z.ZodOptional<z.ZodBoolean>;
            email: z.ZodOptional<z.ZodBoolean>;
            sms: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        currency?: string;
        language?: string;
        theme?: "light" | "dark";
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
    }, {
        currency?: string;
        language?: string;
        theme?: "light" | "dark";
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
    }>>;
    statedIdentity: z.ZodOptional<z.ZodString>;
    featureLevel: z.ZodOptional<z.ZodNumber>;
    segment: z.ZodOptional<z.ZodString>;
    verificationSegment: z.ZodOptional<z.ZodString>;
    verifications: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    activeZones: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    role: z.ZodEnum<["user", "admin", "merchant", "customer", "driver", "support", "manager", "owner"]>;
    isVerified: z.ZodBoolean;
    isOnboarded: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
    email?: string;
    id?: string;
    phoneNumber?: string;
    profile?: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        dateOfBirth?: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        location?: {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        };
    };
    preferences?: {
        currency?: string;
        language?: string;
        theme?: "light" | "dark";
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
    };
    statedIdentity?: string;
    featureLevel?: number;
    segment?: string;
    verificationSegment?: string;
    verifications?: Record<string, unknown>;
    activeZones?: string[];
    role?: "user" | "merchant" | "admin" | "support" | "customer" | "driver" | "manager" | "owner";
    isVerified?: boolean;
    isOnboarded?: boolean;
}, {
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
    email?: string;
    id?: string;
    phoneNumber?: string;
    profile?: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        dateOfBirth?: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        location?: {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        };
    };
    preferences?: {
        currency?: string;
        language?: string;
        theme?: "light" | "dark";
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
    };
    statedIdentity?: string;
    featureLevel?: number;
    segment?: string;
    verificationSegment?: string;
    verifications?: Record<string, unknown>;
    activeZones?: string[];
    role?: "user" | "merchant" | "admin" | "support" | "customer" | "driver" | "manager" | "owner";
    isVerified?: boolean;
    isOnboarded?: boolean;
}>;
/**
 * Profile Update Request
 * Used by: PATCH /user/auth/profile
 * Method: PATCH (not PUT) — servers must use PATCH only
 */
export declare const profileUpdateSchema: z.ZodObject<{
    profile: z.ZodOptional<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        dateOfBirth: z.ZodOptional<z.ZodString>;
        gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer_not_to_say"]>>;
        location: z.ZodOptional<z.ZodObject<{
            address: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            state: z.ZodOptional<z.ZodString>;
            pincode: z.ZodOptional<z.ZodString>;
            coordinates: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        }, "strip", z.ZodTypeAny, {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        }, {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        }>>;
    }, "strip", z.ZodTypeAny, {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        dateOfBirth?: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        location?: {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        };
    }, {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        dateOfBirth?: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        location?: {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        };
    }>>;
    preferences: z.ZodOptional<z.ZodObject<{
        language: z.ZodOptional<z.ZodString>;
        currency: z.ZodOptional<z.ZodString>;
        theme: z.ZodOptional<z.ZodEnum<["light", "dark"]>>;
        notifications: z.ZodOptional<z.ZodObject<{
            push: z.ZodOptional<z.ZodBoolean>;
            email: z.ZodOptional<z.ZodBoolean>;
            sms: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }, {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        }>>;
    }, "strip", z.ZodTypeAny, {
        currency?: string;
        language?: string;
        theme?: "light" | "dark";
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
    }, {
        currency?: string;
        language?: string;
        theme?: "light" | "dark";
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
    }>>;
    statedIdentity: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    profile?: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        dateOfBirth?: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        location?: {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        };
    };
    preferences?: {
        currency?: string;
        language?: string;
        theme?: "light" | "dark";
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
    };
    statedIdentity?: string;
}, {
    profile?: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        dateOfBirth?: string;
        gender?: "other" | "male" | "female" | "prefer_not_to_say";
        location?: {
            address?: string;
            city?: string;
            state?: string;
            pincode?: string;
            coordinates?: [number, number, ...unknown[]];
        };
    };
    preferences?: {
        currency?: string;
        language?: string;
        theme?: "light" | "dark";
        notifications?: {
            push?: boolean;
            email?: boolean;
            sms?: boolean;
        };
    };
    statedIdentity?: string;
}>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
/**
 * Payment Method Type
 * Used across consumer, merchant payment endpoints
 */
export declare const paymentMethodSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["upi", "card", "wallet", "netbanking"]>;
    gateway: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    isAvailable: z.ZodBoolean;
    processingFee: z.ZodOptional<z.ZodNumber>;
    processingTime: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "wallet" | "card" | "upi" | "netbanking";
    name?: string;
    description?: string;
    gateway?: string;
    id?: string;
    icon?: string;
    isAvailable?: boolean;
    processingFee?: number;
    processingTime?: string;
}, {
    type?: "wallet" | "card" | "upi" | "netbanking";
    name?: string;
    description?: string;
    gateway?: string;
    id?: string;
    icon?: string;
    isAvailable?: boolean;
    processingFee?: number;
    processingTime?: string;
}>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
/**
 * Payment Request Contract
 * All payment endpoints must accept and validate this shape
 * Amount field must be validated on server (client-computed amounts are advisory)
 */
export declare const paymentRequestSchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    paymentMethod: z.ZodEnum<["razorpay", "paypal", "internal", "wallet"]>;
    paymentMethodType: z.ZodEnum<["card", "upi", "wallet", "netbanking", "rezcoins"]>;
    purpose: z.ZodOptional<z.ZodEnum<["wallet_topup", "order_payment", "event_booking", "financial_service", "other"]>>;
    idempotencyKey: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    currency?: string;
    amount?: number;
    metadata?: Record<string, unknown>;
    paymentMethod?: "wallet" | "razorpay" | "paypal" | "internal";
    purpose?: "wallet_topup" | "order_payment" | "event_booking" | "financial_service" | "other";
    idempotencyKey?: string;
    paymentMethodType?: "wallet" | "card" | "upi" | "netbanking" | "rezcoins";
}, {
    currency?: string;
    amount?: number;
    metadata?: Record<string, unknown>;
    paymentMethod?: "wallet" | "razorpay" | "paypal" | "internal";
    purpose?: "wallet_topup" | "order_payment" | "event_booking" | "financial_service" | "other";
    idempotencyKey?: string;
    paymentMethodType?: "wallet" | "card" | "upi" | "netbanking" | "rezcoins";
}>;
export type PaymentRequest = z.infer<typeof paymentRequestSchema>;
/**
 * Gateway Response Contract
 * Returned by payment gateways (Razorpay, PayPal, etc.)
 * Clients must not assume additional fields
 */
export declare const gatewayResponseSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    transactionId: z.ZodOptional<z.ZodString>;
    authCode: z.ZodOptional<z.ZodString>;
    rrn: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code?: string;
    message?: string;
    transactionId?: string;
    authCode?: string;
    rrn?: string;
}, {
    code?: string;
    message?: string;
    transactionId?: string;
    authCode?: string;
    rrn?: string;
}>;
export type GatewayResponse = z.infer<typeof gatewayResponseSchema>;
/**
 * Payment Response Contract
 * Returned by: POST /wallet/payment, POST /order/payment, etc.
 */
export declare const paymentResponseSchema: z.ZodObject<{
    paymentId: z.ZodString;
    orderId: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    currency: z.ZodString;
    status: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled"]>;
    gateway: z.ZodString;
    paymentUrl: z.ZodOptional<z.ZodString>;
    qrCode: z.ZodOptional<z.ZodString>;
    upiId: z.ZodOptional<z.ZodString>;
    expiryTime: z.ZodOptional<z.ZodString>;
    transactionId: z.ZodOptional<z.ZodString>;
    gatewayResponse: z.ZodOptional<z.ZodObject<{
        code: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        transactionId: z.ZodOptional<z.ZodString>;
        authCode: z.ZodOptional<z.ZodString>;
        rrn: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code?: string;
        message?: string;
        transactionId?: string;
        authCode?: string;
        rrn?: string;
    }, {
        code?: string;
        message?: string;
        transactionId?: string;
        authCode?: string;
        rrn?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    status?: "cancelled" | "pending" | "processing" | "completed" | "failed";
    currency?: string;
    amount?: number;
    gateway?: string;
    transactionId?: string;
    paymentUrl?: string;
    upiId?: string;
    qrCode?: string;
    expiryTime?: string;
    paymentId?: string;
    orderId?: string;
    gatewayResponse?: {
        code?: string;
        message?: string;
        transactionId?: string;
        authCode?: string;
        rrn?: string;
    };
}, {
    status?: "cancelled" | "pending" | "processing" | "completed" | "failed";
    currency?: string;
    amount?: number;
    gateway?: string;
    transactionId?: string;
    paymentUrl?: string;
    upiId?: string;
    qrCode?: string;
    expiryTime?: string;
    paymentId?: string;
    orderId?: string;
    gatewayResponse?: {
        code?: string;
        message?: string;
        transactionId?: string;
        authCode?: string;
        rrn?: string;
    };
}>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
/**
 * Error Response Contract
 * All error responses must use this shape
 */
export declare const errorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    message: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
    errorCode: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    success?: false;
    error?: string;
    errorCode?: string;
    details?: Record<string, unknown>;
}, {
    message?: string;
    success?: false;
    error?: string;
    errorCode?: string;
    details?: Record<string, unknown>;
}>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
/**
 * Pagination Metadata
 * Used in list responses
 */
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    hasNext: z.ZodBoolean;
    hasPrev: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
}, {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
}>;
/**
 * Generic Paginated Response
 * Used for list endpoints across all services
 */
export declare const paginatedResponseSchema: <T extends z.ZodTypeAny>(schema: T) => z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodArray<T, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        total?: number;
        page?: number;
        limit?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }, {
        total?: number;
        page?: number;
        limit?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    success?: true;
    data?: T["_output"][];
    pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}, {
    success?: true;
    data?: T["_input"][];
    pagination?: {
        total?: number;
        page?: number;
        limit?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}>;
/**
 * Admin Auth Response Contract
 * Returned by: POST /admin/auth/login
 */
export declare const adminAuthResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodObject<{
        token: z.ZodString;
        refreshToken: z.ZodOptional<z.ZodString>;
        user: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            name: z.ZodString;
            role: z.ZodEnum<["admin", "super_admin", "support"]>;
            permissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name?: string;
            email?: string;
            id?: string;
            role?: "admin" | "support" | "super_admin";
            permissions?: string[];
        }, {
            name?: string;
            email?: string;
            id?: string;
            role?: "admin" | "support" | "super_admin";
            permissions?: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        user?: {
            name?: string;
            email?: string;
            id?: string;
            role?: "admin" | "support" | "super_admin";
            permissions?: string[];
        };
        token?: string;
        refreshToken?: string;
    }, {
        user?: {
            name?: string;
            email?: string;
            id?: string;
            role?: "admin" | "support" | "super_admin";
            permissions?: string[];
        };
        token?: string;
        refreshToken?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    success?: true;
    data?: {
        user?: {
            name?: string;
            email?: string;
            id?: string;
            role?: "admin" | "support" | "super_admin";
            permissions?: string[];
        };
        token?: string;
        refreshToken?: string;
    };
}, {
    success?: true;
    data?: {
        user?: {
            name?: string;
            email?: string;
            id?: string;
            role?: "admin" | "support" | "super_admin";
            permissions?: string[];
        };
        token?: string;
        refreshToken?: string;
    };
}>;
export type AdminAuthResponse = z.infer<typeof adminAuthResponseSchema>;
/**
 * Idempotency Key Contract
 * Required on all mutating endpoints (POST, PATCH, DELETE on money/order/wallet endpoints)
 * Backend stores key for 24h minimum; returns same response on retry
 */
export declare const idempotencyKeyHeaderSchema: z.ZodObject<{
    'Idempotency-Key': z.ZodString;
}, "strip", z.ZodTypeAny, {
    'Idempotency-Key'?: string;
}, {
    'Idempotency-Key'?: string;
}>;
/**
 * Gamification Streak Contract
 * Used by: GET /gamification/streak, GET /gamification/streaks
 * Returns user's current or historical streak data for loyalty tracking
 */
export declare const streakSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["purchase", "visit", "referral", "engagement"]>;
    current: z.ZodNumber;
    longest: z.ZodNumber;
    lastActivityAt: z.ZodString;
    nextMilestoneAt: z.ZodOptional<z.ZodString>;
    rewards: z.ZodOptional<z.ZodObject<{
        pointsPerDay: z.ZodNumber;
        bonusAt: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        pointsPerDay?: number;
        bonusAt?: number[];
    }, {
        pointsPerDay?: number;
        bonusAt?: number[];
    }>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type?: "referral" | "purchase" | "visit" | "engagement";
    createdAt?: string;
    updatedAt?: string;
    id?: string;
    userId?: string;
    current?: number;
    longest?: number;
    lastActivityAt?: string;
    nextMilestoneAt?: string;
    rewards?: {
        pointsPerDay?: number;
        bonusAt?: number[];
    };
}, {
    type?: "referral" | "purchase" | "visit" | "engagement";
    createdAt?: string;
    updatedAt?: string;
    id?: string;
    userId?: string;
    current?: number;
    longest?: number;
    lastActivityAt?: string;
    nextMilestoneAt?: string;
    rewards?: {
        pointsPerDay?: number;
        bonusAt?: number[];
    };
}>;
export type Streak = z.infer<typeof streakSchema>;
/**
 * Coupon/Discount Contract
 * Used by: GET /coupons/{id}, GET /coupons, POST /coupons/apply
 * Represents available coupons and discount codes
 */
export declare const couponSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    type: z.ZodEnum<["percentage", "fixed", "bogo", "freeshipping"]>;
    value: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    minPurchaseAmount: z.ZodOptional<z.ZodNumber>;
    maxDiscount: z.ZodOptional<z.ZodNumber>;
    usageLimit: z.ZodOptional<z.ZodNumber>;
    usageCount: z.ZodNumber;
    userUsageLimit: z.ZodOptional<z.ZodNumber>;
    validFrom: z.ZodString;
    validUntil: z.ZodString;
    applicableCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    excludedCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value?: number;
    code?: string;
    type?: "percentage" | "fixed" | "bogo" | "freeshipping";
    currency?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    id?: string;
    minPurchaseAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    usageCount?: number;
    userUsageLimit?: number;
    validFrom?: string;
    validUntil?: string;
    applicableCategories?: string[];
    excludedCategories?: string[];
}, {
    value?: number;
    code?: string;
    type?: "percentage" | "fixed" | "bogo" | "freeshipping";
    currency?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    id?: string;
    minPurchaseAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    usageCount?: number;
    userUsageLimit?: number;
    validFrom?: string;
    validUntil?: string;
    applicableCategories?: string[];
    excludedCategories?: string[];
}>;
export type Coupon = z.infer<typeof couponSchema>;
/**
 * Coupon Application Request
 * Used by: POST /coupons/apply
 * Applies a coupon code to a cart/order and returns discount breakdown
 */
export declare const couponApplySchema: z.ZodObject<{
    code: z.ZodString;
    cartTotal: z.ZodNumber;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        price: z.ZodNumber;
        quantity: z.ZodNumber;
        category: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        category?: string;
        quantity?: number;
        price?: number;
        id?: string;
    }, {
        category?: string;
        quantity?: number;
        price?: number;
        id?: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    code?: string;
    items?: {
        category?: string;
        quantity?: number;
        price?: number;
        id?: string;
    }[];
    cartTotal?: number;
}, {
    code?: string;
    items?: {
        category?: string;
        quantity?: number;
        price?: number;
        id?: string;
    }[];
    cartTotal?: number;
}>;
export type CouponApply = z.infer<typeof couponApplySchema>;
/**
 * Coupon Application Response
 * Returned by: POST /coupons/apply
 * Contains coupon validity and discount details
 */
export declare const couponApplicationResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    couponId: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    isValid: z.ZodBoolean;
    discountAmount: z.ZodNumber;
    discountPercentage: z.ZodOptional<z.ZodNumber>;
    newTotal: z.ZodNumber;
    savings: z.ZodNumber;
    message: z.ZodOptional<z.ZodString>;
    errors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    code?: string;
    message?: string;
    success?: boolean;
    couponId?: string;
    isValid?: boolean;
    discountAmount?: number;
    discountPercentage?: number;
    newTotal?: number;
    savings?: number;
    errors?: string[];
}, {
    code?: string;
    message?: string;
    success?: boolean;
    couponId?: string;
    isValid?: boolean;
    discountAmount?: number;
    discountPercentage?: number;
    newTotal?: number;
    savings?: number;
    errors?: string[];
}>;
export type CouponApplicationResponse = z.infer<typeof couponApplicationResponseSchema>;
/**
 * Referral Contract
 * Used by: GET /referrals/me, GET /referrals/code, POST /referrals/send
 * Tracks user's referral code, referred users, and rewards
 */
export declare const referralSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    referralCode: z.ZodString;
    referrerName: z.ZodOptional<z.ZodString>;
    totalReferred: z.ZodNumber;
    successfulReferrals: z.ZodNumber;
    pendingReferrals: z.ZodNumber;
    totalEarnings: z.ZodNumber;
    rewardsPerReferral: z.ZodNumber;
    referredUsers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodString;
        signupDate: z.ZodString;
        status: z.ZodEnum<["pending", "completed", "cancelled"]>;
        earnings: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        status?: "cancelled" | "pending" | "completed";
        name?: string;
        email?: string;
        userId?: string;
        signupDate?: string;
        earnings?: number;
    }, {
        status?: "cancelled" | "pending" | "completed";
        name?: string;
        email?: string;
        userId?: string;
        signupDate?: string;
        earnings?: number;
    }>, "many">>;
    shareUrl: z.ZodOptional<z.ZodString>;
    termsAccepted: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt?: string;
    updatedAt?: string;
    id?: string;
    userId?: string;
    referralCode?: string;
    referrerName?: string;
    totalReferred?: number;
    successfulReferrals?: number;
    pendingReferrals?: number;
    totalEarnings?: number;
    rewardsPerReferral?: number;
    referredUsers?: {
        status?: "cancelled" | "pending" | "completed";
        name?: string;
        email?: string;
        userId?: string;
        signupDate?: string;
        earnings?: number;
    }[];
    shareUrl?: string;
    termsAccepted?: boolean;
}, {
    createdAt?: string;
    updatedAt?: string;
    id?: string;
    userId?: string;
    referralCode?: string;
    referrerName?: string;
    totalReferred?: number;
    successfulReferrals?: number;
    pendingReferrals?: number;
    totalEarnings?: number;
    rewardsPerReferral?: number;
    referredUsers?: {
        status?: "cancelled" | "pending" | "completed";
        name?: string;
        email?: string;
        userId?: string;
        signupDate?: string;
        earnings?: number;
    }[];
    shareUrl?: string;
    termsAccepted?: boolean;
}>;
export type Referral = z.infer<typeof referralSchema>;
/**
 * Notification Contract
 * Used by: GET /notifications, GET /notifications/{id}, POST /notifications/mark-read
 * Represents user notifications across all channels
 */
export declare const notificationSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["order_status", "payment_received", "promotion", "system_alert", "delivery_update", "referral_success", "gamification_milestone"]>;
    channel: z.ZodEnum<["push", "email", "sms", "in_app"]>;
    title: z.ZodString;
    message: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    actionUrl: z.ZodOptional<z.ZodString>;
    actionLabel: z.ZodOptional<z.ZodString>;
    read: z.ZodBoolean;
    archived: z.ZodOptional<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    sentAt: z.ZodString;
    readAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message?: string;
    type?: "order_status" | "payment_received" | "promotion" | "system_alert" | "delivery_update" | "referral_success" | "gamification_milestone";
    createdAt?: string;
    metadata?: Record<string, unknown>;
    id?: string;
    icon?: string;
    userId?: string;
    channel?: "push" | "email" | "sms" | "in_app";
    title?: string;
    actionUrl?: string;
    actionLabel?: string;
    read?: boolean;
    archived?: boolean;
    sentAt?: string;
    readAt?: string;
}, {
    message?: string;
    type?: "order_status" | "payment_received" | "promotion" | "system_alert" | "delivery_update" | "referral_success" | "gamification_milestone";
    createdAt?: string;
    metadata?: Record<string, unknown>;
    id?: string;
    icon?: string;
    userId?: string;
    channel?: "push" | "email" | "sms" | "in_app";
    title?: string;
    actionUrl?: string;
    actionLabel?: string;
    read?: boolean;
    archived?: boolean;
    sentAt?: string;
    readAt?: string;
}>;
export type Notification = z.infer<typeof notificationSchema>;
/**
 * Campaign Contract
 * Used by: GET /campaigns, GET /campaigns/{id}, GET /campaigns/active
 * Represents marketing/promotional campaigns available to users
 */
export declare const campaignSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["seasonal", "flash_sale", "loyalty", "referral", "first_purchase"]>;
    bannerUrl: z.ZodOptional<z.ZodString>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    isActive: z.ZodBoolean;
    targetSegments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    eligibilityRules: z.ZodOptional<z.ZodObject<{
        minPurchaseAmount: z.ZodOptional<z.ZodNumber>;
        maxDiscount: z.ZodOptional<z.ZodNumber>;
        applicableCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        firstTimeUsersOnly: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        minPurchaseAmount?: number;
        maxDiscount?: number;
        applicableCategories?: string[];
        excludedCategories?: string[];
        firstTimeUsersOnly?: boolean;
    }, {
        minPurchaseAmount?: number;
        maxDiscount?: number;
        applicableCategories?: string[];
        excludedCategories?: string[];
        firstTimeUsersOnly?: boolean;
    }>>;
    rewards: z.ZodOptional<z.ZodObject<{
        points: z.ZodOptional<z.ZodNumber>;
        cashback: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        cashback?: number;
        discount?: number;
        points?: number;
    }, {
        cashback?: number;
        discount?: number;
        points?: number;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type?: "referral" | "seasonal" | "flash_sale" | "loyalty" | "first_purchase";
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    metadata?: Record<string, unknown>;
    id?: string;
    rewards?: {
        cashback?: number;
        discount?: number;
        points?: number;
    };
    bannerUrl?: string;
    startDate?: string;
    endDate?: string;
    targetSegments?: string[];
    eligibilityRules?: {
        minPurchaseAmount?: number;
        maxDiscount?: number;
        applicableCategories?: string[];
        excludedCategories?: string[];
        firstTimeUsersOnly?: boolean;
    };
}, {
    type?: "referral" | "seasonal" | "flash_sale" | "loyalty" | "first_purchase";
    name?: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    metadata?: Record<string, unknown>;
    id?: string;
    rewards?: {
        cashback?: number;
        discount?: number;
        points?: number;
    };
    bannerUrl?: string;
    startDate?: string;
    endDate?: string;
    targetSegments?: string[];
    eligibilityRules?: {
        minPurchaseAmount?: number;
        maxDiscount?: number;
        applicableCategories?: string[];
        excludedCategories?: string[];
        firstTimeUsersOnly?: boolean;
    };
}>;
export type Campaign = z.infer<typeof campaignSchema>;
/**
 * Search Request Contract
 * Used by: GET /search, GET /search/autocomplete
 * Standardized search parameters across all services
 */
export declare const searchRequestSchema: z.ZodObject<{
    query: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<["product", "merchant", "category", "all"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    filters: z.ZodOptional<z.ZodObject<{
        category: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        priceRange: z.ZodOptional<z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>>;
        rating: z.ZodOptional<z.ZodNumber>;
        inStock: z.ZodOptional<z.ZodBoolean>;
        sortBy: z.ZodOptional<z.ZodEnum<["relevance", "price_asc", "price_desc", "rating", "newest"]>>;
    }, "strip", z.ZodTypeAny, {
        category?: string[];
        rating?: number;
        priceRange?: [number, number, ...unknown[]];
        inStock?: boolean;
        sortBy?: "rating" | "relevance" | "price_asc" | "price_desc" | "newest";
    }, {
        category?: string[];
        rating?: number;
        priceRange?: [number, number, ...unknown[]];
        inStock?: boolean;
        sortBy?: "rating" | "relevance" | "price_asc" | "price_desc" | "newest";
    }>>;
}, "strip", z.ZodTypeAny, {
    type?: "merchant" | "category" | "product" | "all";
    limit?: number;
    query?: string;
    offset?: number;
    filters?: {
        category?: string[];
        rating?: number;
        priceRange?: [number, number, ...unknown[]];
        inStock?: boolean;
        sortBy?: "rating" | "relevance" | "price_asc" | "price_desc" | "newest";
    };
}, {
    type?: "merchant" | "category" | "product" | "all";
    limit?: number;
    query?: string;
    offset?: number;
    filters?: {
        category?: string[];
        rating?: number;
        priceRange?: [number, number, ...unknown[]];
        inStock?: boolean;
        sortBy?: "rating" | "relevance" | "price_asc" | "price_desc" | "newest";
    };
}>;
export type SearchRequest = z.infer<typeof searchRequestSchema>;
/**
 * Search Result Contract
 * Returned by: GET /search
 * Contains unified search results from all indexes
 */
export declare const searchResultItemSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["product", "merchant", "category"]>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    rating: z.ZodOptional<z.ZodNumber>;
    reviewCount: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodNumber>;
    discount: z.ZodOptional<z.ZodNumber>;
    inStock: z.ZodOptional<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type?: "merchant" | "category" | "product";
    discount?: number;
    name?: string;
    description?: string;
    rating?: number;
    price?: number;
    metadata?: Record<string, unknown>;
    id?: string;
    inStock?: boolean;
    image?: string;
    reviewCount?: number;
}, {
    type?: "merchant" | "category" | "product";
    discount?: number;
    name?: string;
    description?: string;
    rating?: number;
    price?: number;
    metadata?: Record<string, unknown>;
    id?: string;
    inStock?: boolean;
    image?: string;
    reviewCount?: number;
}>;
export type SearchResultItem = z.infer<typeof searchResultItemSchema>;
/**
 * Autocomplete Result Contract
 * Returned by: GET /search/autocomplete
 * Lightweight suggestions for search-as-you-type
 */
export declare const autocompleteResultSchema: z.ZodObject<{
    success: z.ZodLiteral<true>;
    suggestions: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        type: z.ZodEnum<["recent", "trending", "popular", "category"]>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        type?: "category" | "recent" | "trending" | "popular";
        metadata?: Record<string, unknown>;
        text?: string;
    }, {
        type?: "category" | "recent" | "trending" | "popular";
        metadata?: Record<string, unknown>;
        text?: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    success?: true;
    suggestions?: {
        type?: "category" | "recent" | "trending" | "popular";
        metadata?: Record<string, unknown>;
        text?: string;
    }[];
}, {
    success?: true;
    suggestions?: {
        type?: "category" | "recent" | "trending" | "popular";
        metadata?: Record<string, unknown>;
        text?: string;
    }[];
}>;
export type AutocompleteResult = z.infer<typeof autocompleteResultSchema>;
/**
 * Validation helper: Ensure API response conforms to contract
 */
export declare function validateApiResponse<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    error?: string;
};
