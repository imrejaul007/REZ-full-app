/**
 * Shared Validation Schemas using Zod
 *
 * Centralized validation for common objects across services.
 * Usage:
 * ```typescript
 * const { success, data, error } = createOrderSchema.safeParse(req.body);
 * ```
 */
import { z } from 'zod';
/**
 * Product cashback subdocument schema (Zod)
 * Field names match the backend Product.cashback subdocument shape
 */
export declare const productCashbackSchema: z.ZodObject<{
    percentage: z.ZodOptional<z.ZodNumber>;
    maxAmount: z.ZodOptional<z.ZodNumber>;
    minPurchase: z.ZodOptional<z.ZodNumber>;
    validUntil: z.ZodOptional<z.ZodString>;
    terms: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    conditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean;
    percentage?: number;
    validUntil?: string;
    maxAmount?: number;
    minPurchase?: number;
    terms?: string;
    conditions?: string[];
}, {
    isActive?: boolean;
    percentage?: number;
    validUntil?: string;
    maxAmount?: number;
    minPurchase?: number;
    terms?: string;
    conditions?: string[];
}>;
/**
 * Address schema
 * Note: Backend enforces max 5 addresses per user (see address service)
 */
export declare const addressSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    addressLine1: z.ZodString;
    addressLine2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    pincode: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    landmark: z.ZodOptional<z.ZodString>;
    addressType: z.ZodDefault<z.ZodEnum<["home", "work", "other"]>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    pincode?: string;
    addressLine1?: string;
    addressLine2?: string;
    country?: string;
    landmark?: string;
    addressType?: "other" | "home" | "work";
}, {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    pincode?: string;
    addressLine1?: string;
    addressLine2?: string;
    country?: string;
    landmark?: string;
    addressType?: "other" | "home" | "work";
}>;
export type Address = z.infer<typeof addressSchema>;
/**
 * Order creation schema
 */
export declare const createOrderSchema: z.ZodObject<{
    deliveryAddress: z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        addressLine1: z.ZodString;
        addressLine2: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        state: z.ZodString;
        pincode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        landmark: z.ZodOptional<z.ZodString>;
        addressType: z.ZodDefault<z.ZodEnum<["home", "work", "other"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        email?: string;
        phone?: string;
        city?: string;
        state?: string;
        pincode?: string;
        addressLine1?: string;
        addressLine2?: string;
        country?: string;
        landmark?: string;
        addressType?: "other" | "home" | "work";
    }, {
        name?: string;
        email?: string;
        phone?: string;
        city?: string;
        state?: string;
        pincode?: string;
        addressLine1?: string;
        addressLine2?: string;
        country?: string;
        landmark?: string;
        addressType?: "other" | "home" | "work";
    }>;
    paymentMethod: z.ZodEnum<["cod", "wallet", "razorpay", "upi", "card", "netbanking"]>;
    fulfillmentType: z.ZodDefault<z.ZodEnum<["delivery", "pickup", "dine_in", "drive_thru"]>>;
    specialInstructions: z.ZodOptional<z.ZodString>;
    couponCode: z.ZodOptional<z.ZodString>;
    coinsUsed: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        rezCoins: z.ZodOptional<z.ZodNumber>;
        promoCoins: z.ZodOptional<z.ZodNumber>;
        storePromoCoins: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        rezCoins?: number;
        promoCoins?: number;
        storePromoCoins?: number;
    }, {
        rezCoins?: number;
        promoCoins?: number;
        storePromoCoins?: number;
    }>, {
        rezCoins?: number;
        promoCoins?: number;
        storePromoCoins?: number;
    }, {
        rezCoins?: number;
        promoCoins?: number;
        storePromoCoins?: number;
    }>>;
    idempotencyKey: z.ZodString;
    fulfillmentDetails: z.ZodOptional<z.ZodObject<{
        tableNumber: z.ZodOptional<z.ZodString>;
        storeAddress: z.ZodOptional<z.ZodString>;
        estimatedReadyTime: z.ZodEffects<z.ZodOptional<z.ZodString>, Date, string>;
        pickupInstructions: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tableNumber?: string;
        storeAddress?: string;
        estimatedReadyTime?: Date;
        pickupInstructions?: string;
    }, {
        tableNumber?: string;
        storeAddress?: string;
        estimatedReadyTime?: string;
        pickupInstructions?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    paymentMethod?: "cod" | "wallet" | "card" | "upi" | "netbanking" | "razorpay";
    idempotencyKey?: string;
    deliveryAddress?: {
        name?: string;
        email?: string;
        phone?: string;
        city?: string;
        state?: string;
        pincode?: string;
        addressLine1?: string;
        addressLine2?: string;
        country?: string;
        landmark?: string;
        addressType?: "other" | "home" | "work";
    };
    fulfillmentType?: "delivery" | "pickup" | "dine_in" | "drive_thru";
    specialInstructions?: string;
    couponCode?: string;
    coinsUsed?: {
        rezCoins?: number;
        promoCoins?: number;
        storePromoCoins?: number;
    };
    fulfillmentDetails?: {
        tableNumber?: string;
        storeAddress?: string;
        estimatedReadyTime?: Date;
        pickupInstructions?: string;
    };
}, {
    paymentMethod?: "cod" | "wallet" | "card" | "upi" | "netbanking" | "razorpay";
    idempotencyKey?: string;
    deliveryAddress?: {
        name?: string;
        email?: string;
        phone?: string;
        city?: string;
        state?: string;
        pincode?: string;
        addressLine1?: string;
        addressLine2?: string;
        country?: string;
        landmark?: string;
        addressType?: "other" | "home" | "work";
    };
    fulfillmentType?: "delivery" | "pickup" | "dine_in" | "drive_thru";
    specialInstructions?: string;
    couponCode?: string;
    coinsUsed?: {
        rezCoins?: number;
        promoCoins?: number;
        storePromoCoins?: number;
    };
    fulfillmentDetails?: {
        tableNumber?: string;
        storeAddress?: string;
        estimatedReadyTime?: string;
        pickupInstructions?: string;
    };
}>;
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
/**
 * Order status update schema
 */
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<[string, ...string[]]>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string;
    note?: string;
}, {
    status?: string;
    note?: string;
}>;
export type UpdateOrderStatusRequest = z.infer<typeof updateOrderStatusSchema>;
/**
 * Offer creation schema
 * Note: Backend validates non-overlapping offers per merchant (see merchant service)
 */
export declare const createOfferSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["discount", "cashback", "voucher", "combo", "special", "walk_in"]>;
    validity: z.ZodObject<{
        startDate: z.ZodDate;
        endDate: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        startDate?: Date;
        endDate?: Date;
    }, {
        startDate?: Date;
        endDate?: Date;
    }>;
    restrictions: z.ZodOptional<z.ZodObject<{
        minOrderValue: z.ZodOptional<z.ZodNumber>;
        usageLimit: z.ZodOptional<z.ZodNumber>;
        usageLimitPerUser: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    }, {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    applicableCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    applicableProducts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    userSegments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
}, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
}>, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
}, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
}>;
export type CreateOfferRequest = z.infer<typeof createOfferSchema>;
/**
 * Discount offer schema (specific)
 */
export declare const createDiscountOfferSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["discount", "cashback", "voucher", "combo", "special", "walk_in"]>;
    validity: z.ZodObject<{
        startDate: z.ZodDate;
        endDate: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        startDate?: Date;
        endDate?: Date;
    }, {
        startDate?: Date;
        endDate?: Date;
    }>;
    restrictions: z.ZodOptional<z.ZodObject<{
        minOrderValue: z.ZodOptional<z.ZodNumber>;
        usageLimit: z.ZodOptional<z.ZodNumber>;
        usageLimitPerUser: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    }, {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    applicableCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    applicableProducts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    userSegments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    discountType: z.ZodEnum<["percentage", "fixed"]>;
    discountValue: z.ZodNumber;
    maxDiscountAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    maxDiscountAmount?: number;
}, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    maxDiscountAmount?: number;
}>, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    maxDiscountAmount?: number;
}, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    maxDiscountAmount?: number;
}>;
export type CreateDiscountOfferRequest = z.infer<typeof createDiscountOfferSchema>;
/**
 * Cashback offer schema (specific)
 */
export declare const createCashbackOfferSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["discount", "cashback", "voucher", "combo", "special", "walk_in"]>;
    validity: z.ZodObject<{
        startDate: z.ZodDate;
        endDate: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        startDate?: Date;
        endDate?: Date;
    }, {
        startDate?: Date;
        endDate?: Date;
    }>;
    restrictions: z.ZodOptional<z.ZodObject<{
        minOrderValue: z.ZodOptional<z.ZodNumber>;
        usageLimit: z.ZodOptional<z.ZodNumber>;
        usageLimitPerUser: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    }, {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    applicableCategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    applicableProducts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    userSegments: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
} & {
    cashbackType: z.ZodEnum<["coins", "wallet"]>;
    cashbackPercentage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
    cashbackType?: "wallet" | "coins";
    cashbackPercentage?: number;
}, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
    cashbackType?: "wallet" | "coins";
    cashbackPercentage?: number;
}>, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
    cashbackType?: "wallet" | "coins";
    cashbackPercentage?: number;
}, {
    type?: "cashback" | "discount" | "voucher" | "combo" | "special" | "walk_in";
    description?: string;
    isActive?: boolean;
    applicableCategories?: string[];
    title?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
    };
    applicableProducts?: string[];
    userSegments?: string[];
    cashbackType?: "wallet" | "coins";
    cashbackPercentage?: number;
}>;
export type CreateCashbackOfferRequest = z.infer<typeof createCashbackOfferSchema>;
/**
 * Update offer schema — all fields optional (Zod equivalent of updateOfferSchema)
 */
export declare const updateOfferSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["food", "retail", "travel", "healthcare", "entertainment", "beauty", "wellness", "fitness", "groceries", "pharmacy", "other"]>>;
    cashbackPercentage: z.ZodOptional<z.ZodNumber>;
    validity: z.ZodOptional<z.ZodObject<{
        startDate: z.ZodDate;
        endDate: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        startDate?: Date;
        endDate?: Date;
    }, {
        startDate?: Date;
        endDate?: Date;
    }>>;
    restrictions: z.ZodOptional<z.ZodObject<{
        minOrderValue: z.ZodOptional<z.ZodNumber>;
        usageLimit: z.ZodOptional<z.ZodNumber>;
        usageLimitPerUser: z.ZodOptional<z.ZodNumber>;
        applicableOn: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludedProducts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        ageRestriction: z.ZodOptional<z.ZodObject<{
            minAge: z.ZodOptional<z.ZodNumber>;
            maxAge: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            minAge?: number;
            maxAge?: number;
        }, {
            minAge?: number;
            maxAge?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
        applicableOn?: string[];
        excludedProducts?: string[];
        ageRestriction?: {
            minAge?: number;
            maxAge?: number;
        };
    }, {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
        applicableOn?: string[];
        excludedProducts?: string[];
        ageRestriction?: {
            minAge?: number;
            maxAge?: number;
        };
    }>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    category?: "other" | "pharmacy" | "retail" | "food" | "travel" | "healthcare" | "entertainment" | "beauty" | "wellness" | "fitness" | "groceries";
    isActive?: boolean;
    title?: string;
    image?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
        applicableOn?: string[];
        excludedProducts?: string[];
        ageRestriction?: {
            minAge?: number;
            maxAge?: number;
        };
    };
    cashbackPercentage?: number;
}, {
    description?: string;
    category?: "other" | "pharmacy" | "retail" | "food" | "travel" | "healthcare" | "entertainment" | "beauty" | "wellness" | "fitness" | "groceries";
    isActive?: boolean;
    title?: string;
    image?: string;
    validity?: {
        startDate?: Date;
        endDate?: Date;
    };
    restrictions?: {
        usageLimit?: number;
        minOrderValue?: number;
        usageLimitPerUser?: number;
        applicableOn?: string[];
        excludedProducts?: string[];
        ageRestriction?: {
            minAge?: number;
            maxAge?: number;
        };
    };
    cashbackPercentage?: number;
}>;
export type UpdateOfferRequest = z.infer<typeof updateOfferSchema>;
/**
 * Create product schema (Zod equivalent of createProductSchema)
 */
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    pricing: z.ZodObject<{
        original: z.ZodOptional<z.ZodNumber>;
        selling: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        selling?: number;
        discount?: number;
        original?: number;
    }, {
        selling?: number;
        discount?: number;
        original?: number;
    }>;
    inventory: z.ZodOptional<z.ZodObject<{
        stock: z.ZodOptional<z.ZodNumber>;
        inStock: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        inStock?: boolean;
        stock?: number;
    }, {
        inStock?: boolean;
        stock?: number;
    }>>;
    category: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    cashback: z.ZodOptional<z.ZodObject<{
        percentage: z.ZodOptional<z.ZodNumber>;
        maxAmount: z.ZodOptional<z.ZodNumber>;
        minPurchase: z.ZodOptional<z.ZodNumber>;
        validUntil: z.ZodOptional<z.ZodString>;
        terms: z.ZodOptional<z.ZodString>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        conditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        isActive?: boolean;
        percentage?: number;
        validUntil?: string;
        maxAmount?: number;
        minPurchase?: number;
        terms?: string;
        conditions?: string[];
    }, {
        isActive?: boolean;
        percentage?: number;
        validUntil?: string;
        maxAmount?: number;
        minPurchase?: number;
        terms?: string;
        conditions?: string[];
    }>>;
}, "strip", z.ZodTypeAny, {
    cashback?: {
        isActive?: boolean;
        percentage?: number;
        validUntil?: string;
        maxAmount?: number;
        minPurchase?: number;
        terms?: string;
        conditions?: string[];
    };
    name?: string;
    description?: string;
    category?: string;
    pricing?: {
        selling?: number;
        discount?: number;
        original?: number;
    };
    images?: string[];
    inventory?: {
        inStock?: boolean;
        stock?: number;
    };
}, {
    cashback?: {
        isActive?: boolean;
        percentage?: number;
        validUntil?: string;
        maxAmount?: number;
        minPurchase?: number;
        terms?: string;
        conditions?: string[];
    };
    name?: string;
    description?: string;
    category?: string;
    pricing?: {
        selling?: number;
        discount?: number;
        original?: number;
    };
    images?: string[];
    inventory?: {
        inStock?: boolean;
        stock?: number;
    };
}>;
export type CreateProductRequest = z.infer<typeof createProductSchema>;
/**
 * Merchant login schema
 */
export declare const merchantLoginSchema: z.ZodObject<{
    email: z.ZodUnion<[z.ZodString, z.ZodString]>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
}, {
    email?: string;
    password?: string;
}>;
export type MerchantLoginRequest = z.infer<typeof merchantLoginSchema>;
/**
 * Coupon code validation schema
 * Note: Case-insensitive validation is done at the backend (see coupon service)
 * Do NOT transform to uppercase to preserve original code format
 */
export declare const couponCodeSchema: z.ZodObject<{
    code: z.ZodString;
    orderAmount: z.ZodNumber;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code?: string;
    userId?: string;
    orderAmount?: number;
}, {
    code?: string;
    userId?: string;
    orderAmount?: number;
}>;
export type CouponCodeRequest = z.infer<typeof couponCodeSchema>;
/**
 * Validation middleware factory
 */
export declare function validateRequest(schema: z.ZodSchema): (req: any, res: any, next: any) => any;
/**
 * Validate URL parameters
 * Prevents injection attacks via URL parameters (e.g., /orders/:id where id is a MongoDB ObjectId)
 */
export declare function validateParams(schema: z.ZodSchema): (req: any, res: any, next: any) => any;
/**
 * Validate query parameters
 */
export declare function validateQuery(schema: z.ZodSchema): (req: any, res: any, next: any) => any;
