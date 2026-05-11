/**
 * Order API validation schemas
 * Validates CreateOrder, UpdateOrderStatus, and OrderResponse requests/responses
 * Includes all 11 order statuses
 */
import { z } from 'zod';
export declare const ORDER_STATUS: z.ZodEnum<["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "delivered", "cancelled", "cancelling", "returned", "refunded"]>;
export declare const PAYMENT_STATUS: z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>;
export declare const OrderItemSchema: z.ZodObject<{
    itemId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    itemId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    itemId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const OrderTotalsSchema: z.ZodObject<{
    subtotal: z.ZodOptional<z.ZodNumber>;
    tax: z.ZodOptional<z.ZodNumber>;
    discount: z.ZodOptional<z.ZodNumber>;
    deliveryFee: z.ZodOptional<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    subtotal: z.ZodOptional<z.ZodNumber>;
    tax: z.ZodOptional<z.ZodNumber>;
    discount: z.ZodOptional<z.ZodNumber>;
    deliveryFee: z.ZodOptional<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    subtotal: z.ZodOptional<z.ZodNumber>;
    tax: z.ZodOptional<z.ZodNumber>;
    discount: z.ZodOptional<z.ZodNumber>;
    deliveryFee: z.ZodOptional<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const OrderPaymentSchema: z.ZodObject<{
    method: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
    amount: z.ZodOptional<z.ZodNumber>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    method: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
    amount: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    method: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
    amount: z.ZodOptional<z.ZodNumber>;
}, z.ZodTypeAny, "passthrough">>;
export declare const OrderDeliverySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const CreateOrderSchema: z.ZodObject<{
    user: z.ZodString;
    store: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totals: z.ZodOptional<z.ZodObject<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    payment: z.ZodOptional<z.ZodObject<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    delivery: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    user?: string;
    currency?: string;
    store?: string;
    items?: z.objectOutputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">[];
    totals?: {
        discount?: number;
        subtotal?: number;
        tax?: number;
        deliveryFee?: number;
        total?: number;
    } & {
        [k: string]: unknown;
    };
    payment?: {
        status?: "cancelled" | "refunded" | "pending" | "processing" | "completed" | "failed" | "expired" | "refund_initiated" | "refund_processing" | "refund_failed" | "partially_refunded";
        method?: string;
        amount?: number;
    } & {
        [k: string]: unknown;
    };
    delivery?: {
        type?: string;
        address?: Record<string, any>;
    } & {
        [k: string]: unknown;
    };
}, {
    user?: string;
    currency?: string;
    store?: string;
    items?: z.objectInputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">[];
    totals?: {
        discount?: number;
        subtotal?: number;
        tax?: number;
        deliveryFee?: number;
        total?: number;
    } & {
        [k: string]: unknown;
    };
    payment?: {
        status?: "cancelled" | "refunded" | "pending" | "processing" | "completed" | "failed" | "expired" | "refund_initiated" | "refund_processing" | "refund_failed" | "partially_refunded";
        method?: string;
        amount?: number;
    } & {
        [k: string]: unknown;
    };
    delivery?: {
        type?: string;
        address?: Record<string, any>;
    } & {
        [k: string]: unknown;
    };
}>;
export declare const UpdateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "delivered", "cancelled", "cancelling", "returned", "refunded"]>;
    reason: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status?: "placed" | "confirmed" | "preparing" | "ready" | "dispatched" | "out_for_delivery" | "delivered" | "cancelling" | "cancelled" | "returned" | "refunded";
    reason?: string;
    metadata?: Record<string, any>;
}, {
    status?: "placed" | "confirmed" | "preparing" | "ready" | "dispatched" | "out_for_delivery" | "delivered" | "cancelling" | "cancelled" | "returned" | "refunded";
    reason?: string;
    metadata?: Record<string, any>;
}>;
export declare const OrderResponseSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    orderNumber: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "delivered", "cancelled", "cancelling", "returned", "refunded"]>;
    user: z.ZodString;
    store: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totals: z.ZodOptional<z.ZodObject<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    payment: z.ZodOptional<z.ZodObject<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    delivery: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    currency: z.ZodString;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    _id: z.ZodOptional<z.ZodString>;
    orderNumber: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "delivered", "cancelled", "cancelling", "returned", "refunded"]>;
    user: z.ZodString;
    store: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totals: z.ZodOptional<z.ZodObject<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    payment: z.ZodOptional<z.ZodObject<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    delivery: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    currency: z.ZodString;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    _id: z.ZodOptional<z.ZodString>;
    orderNumber: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "delivered", "cancelled", "cancelling", "returned", "refunded"]>;
    user: z.ZodString;
    store: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totals: z.ZodOptional<z.ZodObject<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    payment: z.ZodOptional<z.ZodObject<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    delivery: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    currency: z.ZodString;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, z.ZodTypeAny, "passthrough">>;
export declare const OrderListResponseSchema: z.ZodArray<z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    orderNumber: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "delivered", "cancelled", "cancelling", "returned", "refunded"]>;
    user: z.ZodString;
    store: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totals: z.ZodOptional<z.ZodObject<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    payment: z.ZodOptional<z.ZodObject<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    delivery: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    currency: z.ZodString;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    _id: z.ZodOptional<z.ZodString>;
    orderNumber: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "delivered", "cancelled", "cancelling", "returned", "refunded"]>;
    user: z.ZodString;
    store: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totals: z.ZodOptional<z.ZodObject<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    payment: z.ZodOptional<z.ZodObject<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    delivery: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    currency: z.ZodString;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    _id: z.ZodOptional<z.ZodString>;
    orderNumber: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["placed", "confirmed", "preparing", "ready", "dispatched", "out_for_delivery", "delivered", "cancelled", "cancelling", "returned", "refunded"]>;
    user: z.ZodString;
    store: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        itemId: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        quantity: z.ZodOptional<z.ZodNumber>;
        price: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    totals: z.ZodOptional<z.ZodObject<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        subtotal: z.ZodOptional<z.ZodNumber>;
        tax: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        deliveryFee: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    payment: z.ZodOptional<z.ZodObject<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        method: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed", "cancelled", "expired", "refund_initiated", "refund_processing", "refunded", "refund_failed", "partially_refunded"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>>;
    delivery: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    currency: z.ZodString;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, z.ZodTypeAny, "passthrough">>, "many">;
export type CreateOrderRequest = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusSchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;
export type OrderStatus = z.infer<typeof ORDER_STATUS>;
