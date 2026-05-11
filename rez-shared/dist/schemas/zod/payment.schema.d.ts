/**
 * Payment API validation schemas
 * WARNING: This file has been synchronized with packages/shared-types
 * All changes must be made to packages/shared-types as the canonical source
 *
 * Validates CreatePayment, PaymentResponse requests/responses
 * Includes full 11-state FSM for payment statuses
 */
import { z } from 'zod';
export declare const PAYMENT_STATUS: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>;
/**
 * Payment method enum — method types (HOW the customer pays)
 * Canonical values from packages/shared-types: includes cod, bnpl, razorpay, stripe
 */
export declare const PAYMENT_METHOD: z.ZodEnum<["upi", "card", "wallet", "netbanking", "cod", "bnpl", "razorpay", "stripe"]>;
export declare const PAYMENT_GATEWAY: z.ZodEnum<["stripe", "razorpay", "paypal"]>;
export declare const PAYMENT_PURPOSE: z.ZodEnum<["wallet_topup", "order_payment", "event_booking", "financial_service", "other"]>;
export declare const PaymentUserDetailsSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    email?: string;
    phone?: string;
}, {
    name?: string;
    email?: string;
    phone?: string;
}>;
export declare const PaymentGatewayResponseSchema: z.ZodDiscriminatedUnion<"gateway", [z.ZodObject<{
    gateway: z.ZodLiteral<"razorpay">;
    transactionId: z.ZodOptional<z.ZodString>;
    paymentUrl: z.ZodOptional<z.ZodString>;
    razorpayPaymentId: z.ZodOptional<z.ZodString>;
    razorpaySignature: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strict", z.ZodTypeAny, {
    gateway?: "razorpay";
    transactionId?: string;
    paymentUrl?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    timestamp?: string | Date;
}, {
    gateway?: "razorpay";
    transactionId?: string;
    paymentUrl?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    timestamp?: string | Date;
}>, z.ZodObject<{
    gateway: z.ZodLiteral<"stripe">;
    transactionId: z.ZodOptional<z.ZodString>;
    paymentIntentId: z.ZodOptional<z.ZodString>;
    clientSecret: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strict", z.ZodTypeAny, {
    gateway?: "stripe";
    transactionId?: string;
    timestamp?: string | Date;
    paymentIntentId?: string;
    clientSecret?: string;
}, {
    gateway?: "stripe";
    transactionId?: string;
    timestamp?: string | Date;
    paymentIntentId?: string;
    clientSecret?: string;
}>, z.ZodObject<{
    gateway: z.ZodLiteral<"paypal">;
    transactionId: z.ZodOptional<z.ZodString>;
    paypalOrderId: z.ZodOptional<z.ZodString>;
    captureId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strict", z.ZodTypeAny, {
    gateway?: "paypal";
    transactionId?: string;
    timestamp?: string | Date;
    paypalOrderId?: string;
    captureId?: string;
}, {
    gateway?: "paypal";
    transactionId?: string;
    timestamp?: string | Date;
    paypalOrderId?: string;
    captureId?: string;
}>, z.ZodObject<{
    gateway: z.ZodLiteral<"upi">;
    transactionId: z.ZodOptional<z.ZodString>;
    upiId: z.ZodOptional<z.ZodString>;
    qrCode: z.ZodOptional<z.ZodString>;
    expiryTime: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strict", z.ZodTypeAny, {
    gateway?: "upi";
    transactionId?: string;
    timestamp?: string | Date;
    upiId?: string;
    qrCode?: string;
    expiryTime?: string | Date;
}, {
    gateway?: "upi";
    transactionId?: string;
    timestamp?: string | Date;
    upiId?: string;
    qrCode?: string;
    expiryTime?: string | Date;
}>, z.ZodObject<{
    gateway: z.ZodEnum<["wallet", "cod"]>;
    transactionId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strict", z.ZodTypeAny, {
    gateway?: "cod" | "wallet";
    transactionId?: string;
    timestamp?: string | Date;
}, {
    gateway?: "cod" | "wallet";
    transactionId?: string;
    timestamp?: string | Date;
}>]>;
export declare const CreatePaymentSchema: z.ZodObject<{
    paymentId: z.ZodString;
    orderId: z.ZodString;
    user: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    /** How the customer pays: upi, card, wallet, netbanking, cod, bnpl, razorpay, stripe */
    paymentMethod: z.ZodEnum<["upi", "card", "wallet", "netbanking", "cod", "bnpl", "razorpay", "stripe"]>;
    /** Which gateway processes the payment: razorpay, stripe, paypal (optional) */
    gateway: z.ZodOptional<z.ZodEnum<["stripe", "razorpay", "paypal"]>>;
    purpose: z.ZodDefault<z.ZodOptional<z.ZodEnum<["wallet_topup", "order_payment", "event_booking", "financial_service", "other"]>>>;
    userDetails: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        email?: string;
        phone?: string;
    }, {
        name?: string;
        email?: string;
        phone?: string;
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    gatewayResponse: z.ZodOptional<z.ZodDiscriminatedUnion<"gateway", [z.ZodObject<{
        gateway: z.ZodLiteral<"razorpay">;
        transactionId: z.ZodOptional<z.ZodString>;
        paymentUrl: z.ZodOptional<z.ZodString>;
        razorpayPaymentId: z.ZodOptional<z.ZodString>;
        razorpaySignature: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    }, {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    }>, z.ZodObject<{
        gateway: z.ZodLiteral<"stripe">;
        transactionId: z.ZodOptional<z.ZodString>;
        paymentIntentId: z.ZodOptional<z.ZodString>;
        clientSecret: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    }, {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    }>, z.ZodObject<{
        gateway: z.ZodLiteral<"paypal">;
        transactionId: z.ZodOptional<z.ZodString>;
        paypalOrderId: z.ZodOptional<z.ZodString>;
        captureId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    }, {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    }>, z.ZodObject<{
        gateway: z.ZodLiteral<"upi">;
        transactionId: z.ZodOptional<z.ZodString>;
        upiId: z.ZodOptional<z.ZodString>;
        qrCode: z.ZodOptional<z.ZodString>;
        expiryTime: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    }, {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    }>, z.ZodObject<{
        gateway: z.ZodEnum<["wallet", "cod"]>;
        transactionId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    }, {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    }>]>>;
}, "strip", z.ZodTypeAny, {
    user?: string;
    currency?: string;
    amount?: number;
    metadata?: Record<string, any>;
    gateway?: "razorpay" | "stripe" | "paypal";
    paymentId?: string;
    orderId?: string;
    paymentMethod?: "cod" | "wallet" | "card" | "upi" | "netbanking" | "razorpay" | "stripe" | "bnpl";
    purpose?: "wallet_topup" | "order_payment" | "event_booking" | "financial_service" | "other";
    userDetails?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    gatewayResponse?: {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    } | {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    } | {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    } | {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    } | {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    };
}, {
    user?: string;
    currency?: string;
    amount?: number;
    metadata?: Record<string, any>;
    gateway?: "razorpay" | "stripe" | "paypal";
    paymentId?: string;
    orderId?: string;
    paymentMethod?: "cod" | "wallet" | "card" | "upi" | "netbanking" | "razorpay" | "stripe" | "bnpl";
    purpose?: "wallet_topup" | "order_payment" | "event_booking" | "financial_service" | "other";
    userDetails?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    gatewayResponse?: {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    } | {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    } | {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    } | {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    } | {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    };
}>;
export declare const UpdatePaymentStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>;
    failureReason: z.ZodOptional<z.ZodString>;
    walletCredited: z.ZodOptional<z.ZodBoolean>;
    refundedAmount: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status?: "cancelled" | "refunded" | "pending" | "processing" | "completed" | "failed" | "expired" | "refund_initiated" | "refund_processing" | "refund_failed" | "partially_refunded";
    metadata?: Record<string, any>;
    failureReason?: string;
    walletCredited?: boolean;
    refundedAmount?: number;
}, {
    status?: "cancelled" | "refunded" | "pending" | "processing" | "completed" | "failed" | "expired" | "refund_initiated" | "refund_processing" | "refund_failed" | "partially_refunded";
    metadata?: Record<string, any>;
    failureReason?: string;
    walletCredited?: boolean;
    refundedAmount?: number;
}>;
export declare const PaymentResponseSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    paymentId: z.ZodString;
    orderId: z.ZodString;
    user: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodString;
    /** How the customer pays: upi, card, wallet, netbanking */
    paymentMethod: z.ZodEnum<["upi", "card", "wallet", "netbanking", "cod", "bnpl", "razorpay", "stripe"]>;
    /** Which gateway processes the payment: razorpay, stripe, paypal */
    gateway: z.ZodOptional<z.ZodEnum<["stripe", "razorpay", "paypal"]>>;
    purpose: z.ZodEnum<["wallet_topup", "order_payment", "event_booking", "financial_service", "other"]>;
    status: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>;
    userDetails: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        email?: string;
        phone?: string;
    }, {
        name?: string;
        email?: string;
        phone?: string;
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    gatewayResponse: z.ZodOptional<z.ZodDiscriminatedUnion<"gateway", [z.ZodObject<{
        gateway: z.ZodLiteral<"razorpay">;
        transactionId: z.ZodOptional<z.ZodString>;
        paymentUrl: z.ZodOptional<z.ZodString>;
        razorpayPaymentId: z.ZodOptional<z.ZodString>;
        razorpaySignature: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    }, {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    }>, z.ZodObject<{
        gateway: z.ZodLiteral<"stripe">;
        transactionId: z.ZodOptional<z.ZodString>;
        paymentIntentId: z.ZodOptional<z.ZodString>;
        clientSecret: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    }, {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    }>, z.ZodObject<{
        gateway: z.ZodLiteral<"paypal">;
        transactionId: z.ZodOptional<z.ZodString>;
        paypalOrderId: z.ZodOptional<z.ZodString>;
        captureId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    }, {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    }>, z.ZodObject<{
        gateway: z.ZodLiteral<"upi">;
        transactionId: z.ZodOptional<z.ZodString>;
        upiId: z.ZodOptional<z.ZodString>;
        qrCode: z.ZodOptional<z.ZodString>;
        expiryTime: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    }, {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    }>, z.ZodObject<{
        gateway: z.ZodEnum<["wallet", "cod"]>;
        transactionId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    }, {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    }>]>>;
    failureReason: z.ZodOptional<z.ZodString>;
    walletCredited: z.ZodOptional<z.ZodBoolean>;
    walletCreditedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    completedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    failedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    expiresAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    refundedAmount: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    user?: string;
    status?: "cancelled" | "refunded" | "pending" | "processing" | "completed" | "failed" | "expired" | "refund_initiated" | "refund_processing" | "refund_failed" | "partially_refunded";
    currency?: string;
    _id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    amount?: number;
    metadata?: Record<string, any>;
    gateway?: "razorpay" | "stripe" | "paypal";
    paymentId?: string;
    orderId?: string;
    paymentMethod?: "cod" | "wallet" | "card" | "upi" | "netbanking" | "razorpay" | "stripe" | "bnpl";
    purpose?: "wallet_topup" | "order_payment" | "event_booking" | "financial_service" | "other";
    userDetails?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    gatewayResponse?: {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    } | {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    } | {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    } | {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    } | {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    };
    failureReason?: string;
    walletCredited?: boolean;
    refundedAmount?: number;
    walletCreditedAt?: string | Date;
    completedAt?: string | Date;
    failedAt?: string | Date;
    expiresAt?: string | Date;
}, {
    user?: string;
    status?: "cancelled" | "refunded" | "pending" | "processing" | "completed" | "failed" | "expired" | "refund_initiated" | "refund_processing" | "refund_failed" | "partially_refunded";
    currency?: string;
    _id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    amount?: number;
    metadata?: Record<string, any>;
    gateway?: "razorpay" | "stripe" | "paypal";
    paymentId?: string;
    orderId?: string;
    paymentMethod?: "cod" | "wallet" | "card" | "upi" | "netbanking" | "razorpay" | "stripe" | "bnpl";
    purpose?: "wallet_topup" | "order_payment" | "event_booking" | "financial_service" | "other";
    userDetails?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    gatewayResponse?: {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    } | {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    } | {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    } | {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    } | {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    };
    failureReason?: string;
    walletCredited?: boolean;
    refundedAmount?: number;
    walletCreditedAt?: string | Date;
    completedAt?: string | Date;
    failedAt?: string | Date;
    expiresAt?: string | Date;
}>;
export declare const PaymentListResponseSchema: z.ZodArray<z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    paymentId: z.ZodString;
    orderId: z.ZodString;
    user: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodString;
    /** How the customer pays: upi, card, wallet, netbanking */
    paymentMethod: z.ZodEnum<["upi", "card", "wallet", "netbanking", "cod", "bnpl", "razorpay", "stripe"]>;
    /** Which gateway processes the payment: razorpay, stripe, paypal */
    gateway: z.ZodOptional<z.ZodEnum<["stripe", "razorpay", "paypal"]>>;
    purpose: z.ZodEnum<["wallet_topup", "order_payment", "event_booking", "financial_service", "other"]>;
    status: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>;
    userDetails: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        email?: string;
        phone?: string;
    }, {
        name?: string;
        email?: string;
        phone?: string;
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    gatewayResponse: z.ZodOptional<z.ZodDiscriminatedUnion<"gateway", [z.ZodObject<{
        gateway: z.ZodLiteral<"razorpay">;
        transactionId: z.ZodOptional<z.ZodString>;
        paymentUrl: z.ZodOptional<z.ZodString>;
        razorpayPaymentId: z.ZodOptional<z.ZodString>;
        razorpaySignature: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    }, {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    }>, z.ZodObject<{
        gateway: z.ZodLiteral<"stripe">;
        transactionId: z.ZodOptional<z.ZodString>;
        paymentIntentId: z.ZodOptional<z.ZodString>;
        clientSecret: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    }, {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    }>, z.ZodObject<{
        gateway: z.ZodLiteral<"paypal">;
        transactionId: z.ZodOptional<z.ZodString>;
        paypalOrderId: z.ZodOptional<z.ZodString>;
        captureId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    }, {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    }>, z.ZodObject<{
        gateway: z.ZodLiteral<"upi">;
        transactionId: z.ZodOptional<z.ZodString>;
        upiId: z.ZodOptional<z.ZodString>;
        qrCode: z.ZodOptional<z.ZodString>;
        expiryTime: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    }, {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    }>, z.ZodObject<{
        gateway: z.ZodEnum<["wallet", "cod"]>;
        transactionId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    }, "strict", z.ZodTypeAny, {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    }, {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    }>]>>;
    failureReason: z.ZodOptional<z.ZodString>;
    walletCredited: z.ZodOptional<z.ZodBoolean>;
    walletCreditedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    completedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    failedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    expiresAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodString]>>;
    refundedAmount: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodString]>;
}, "strip", z.ZodTypeAny, {
    user?: string;
    status?: "cancelled" | "refunded" | "pending" | "processing" | "completed" | "failed" | "expired" | "refund_initiated" | "refund_processing" | "refund_failed" | "partially_refunded";
    currency?: string;
    _id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    amount?: number;
    metadata?: Record<string, any>;
    gateway?: "razorpay" | "stripe" | "paypal";
    paymentId?: string;
    orderId?: string;
    paymentMethod?: "cod" | "wallet" | "card" | "upi" | "netbanking" | "razorpay" | "stripe" | "bnpl";
    purpose?: "wallet_topup" | "order_payment" | "event_booking" | "financial_service" | "other";
    userDetails?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    gatewayResponse?: {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    } | {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    } | {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    } | {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    } | {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    };
    failureReason?: string;
    walletCredited?: boolean;
    refundedAmount?: number;
    walletCreditedAt?: string | Date;
    completedAt?: string | Date;
    failedAt?: string | Date;
    expiresAt?: string | Date;
}, {
    user?: string;
    status?: "cancelled" | "refunded" | "pending" | "processing" | "completed" | "failed" | "expired" | "refund_initiated" | "refund_processing" | "refund_failed" | "partially_refunded";
    currency?: string;
    _id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    amount?: number;
    metadata?: Record<string, any>;
    gateway?: "razorpay" | "stripe" | "paypal";
    paymentId?: string;
    orderId?: string;
    paymentMethod?: "cod" | "wallet" | "card" | "upi" | "netbanking" | "razorpay" | "stripe" | "bnpl";
    purpose?: "wallet_topup" | "order_payment" | "event_booking" | "financial_service" | "other";
    userDetails?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    gatewayResponse?: {
        gateway?: "razorpay";
        transactionId?: string;
        paymentUrl?: string;
        razorpayPaymentId?: string;
        razorpaySignature?: string;
        timestamp?: string | Date;
    } | {
        gateway?: "stripe";
        transactionId?: string;
        timestamp?: string | Date;
        paymentIntentId?: string;
        clientSecret?: string;
    } | {
        gateway?: "paypal";
        transactionId?: string;
        timestamp?: string | Date;
        paypalOrderId?: string;
        captureId?: string;
    } | {
        gateway?: "upi";
        transactionId?: string;
        timestamp?: string | Date;
        upiId?: string;
        qrCode?: string;
        expiryTime?: string | Date;
    } | {
        gateway?: "cod" | "wallet";
        transactionId?: string;
        timestamp?: string | Date;
    };
    failureReason?: string;
    walletCredited?: boolean;
    refundedAmount?: number;
    walletCreditedAt?: string | Date;
    completedAt?: string | Date;
    failedAt?: string | Date;
    expiresAt?: string | Date;
}>, "many">;
export type CreatePaymentRequest = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentStatusRequest = z.infer<typeof UpdatePaymentStatusSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
export type PaymentListResponse = z.infer<typeof PaymentListResponseSchema>;
export type PaymentStatus = z.infer<typeof PAYMENT_STATUS>;
export type PaymentMethod = z.infer<typeof PAYMENT_METHOD>;
export type PaymentGateway = z.infer<typeof PAYMENT_GATEWAY>;
export type PaymentPurpose = z.infer<typeof PAYMENT_PURPOSE>;
