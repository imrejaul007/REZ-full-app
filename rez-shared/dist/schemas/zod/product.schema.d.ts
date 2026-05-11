/**
 * Product API validation schemas
 * Validates CreateProduct, UpdateProduct, and ProductResponse requests/responses
 * Canonical pricing format: selling + mrp (not price.current/original)
 */
import { z } from 'zod';
export declare const ProductImageSchema: z.ZodObject<{
    url: z.ZodOptional<z.ZodString>;
    alt: z.ZodOptional<z.ZodString>;
    isPrimary: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    url?: string;
    alt?: string;
    isPrimary?: boolean;
}, {
    url?: string;
    alt?: string;
    isPrimary?: boolean;
}>;
export declare const ProductPricingSchema: z.ZodObject<{
    selling: z.ZodNumber;
    mrp: z.ZodNumber;
    discount: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    selling?: number;
    mrp?: number;
    discount?: number;
    currency?: string;
}, {
    selling?: number;
    mrp?: number;
    discount?: number;
    currency?: string;
}>;
export declare const ProductRatingSchema: z.ZodObject<{
    value: z.ZodOptional<z.ZodNumber>;
    count: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    value?: number;
    count?: number;
}, {
    value?: number;
    count?: number;
}>;
export declare const CreateProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    isActive: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isFeatured: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    pricing: z.ZodObject<{
        selling: z.ZodNumber;
        mrp: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    }, {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    }>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }, {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }>, "many">>;
    rating: z.ZodOptional<z.ZodObject<{
        value: z.ZodOptional<z.ZodNumber>;
        count: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: number;
        count?: number;
    }, {
        value?: number;
        count?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    category?: string;
    store?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    pricing?: {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    };
    images?: {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }[];
    rating?: {
        value?: number;
        count?: number;
    };
}, {
    name?: string;
    description?: string;
    category?: string;
    store?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    pricing?: {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    };
    images?: {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }[];
    rating?: {
        value?: number;
        count?: number;
    };
}>;
export declare const UpdateProductSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isFeatured: z.ZodOptional<z.ZodBoolean>;
    pricing: z.ZodOptional<z.ZodObject<{
        selling: z.ZodNumber;
        mrp: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    }, {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    }>>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }, {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }>, "many">>;
    rating: z.ZodOptional<z.ZodObject<{
        value: z.ZodOptional<z.ZodNumber>;
        count: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: number;
        count?: number;
    }, {
        value?: number;
        count?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    category?: string;
    store?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    pricing?: {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    };
    images?: {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }[];
    rating?: {
        value?: number;
        count?: number;
    };
}, {
    name?: string;
    description?: string;
    category?: string;
    store?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    pricing?: {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    };
    images?: {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }[];
    rating?: {
        value?: number;
        count?: number;
    };
}>;
export declare const ProductResponseSchema: z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    isActive: z.ZodBoolean;
    isFeatured: z.ZodBoolean;
    pricing: z.ZodObject<{
        selling: z.ZodNumber;
        mrp: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    }, {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    }>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }, {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }>, "many">>;
    rating: z.ZodOptional<z.ZodObject<{
        value: z.ZodOptional<z.ZodNumber>;
        count: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: number;
        count?: number;
    }, {
        value?: number;
        count?: number;
    }>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    category?: string;
    store?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    pricing?: {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    };
    images?: {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }[];
    rating?: {
        value?: number;
        count?: number;
    };
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}, {
    name?: string;
    description?: string;
    category?: string;
    store?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    pricing?: {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    };
    images?: {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }[];
    rating?: {
        value?: number;
        count?: number;
    };
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}>;
export declare const ProductListResponseSchema: z.ZodArray<z.ZodObject<{
    _id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    store: z.ZodOptional<z.ZodString>;
    isActive: z.ZodBoolean;
    isFeatured: z.ZodBoolean;
    pricing: z.ZodObject<{
        selling: z.ZodNumber;
        mrp: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    }, {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    }>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        alt: z.ZodOptional<z.ZodString>;
        isPrimary: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }, {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }>, "many">>;
    rating: z.ZodOptional<z.ZodObject<{
        value: z.ZodOptional<z.ZodNumber>;
        count: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: number;
        count?: number;
    }, {
        value?: number;
        count?: number;
    }>>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    description?: string;
    category?: string;
    store?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    pricing?: {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    };
    images?: {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }[];
    rating?: {
        value?: number;
        count?: number;
    };
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}, {
    name?: string;
    description?: string;
    category?: string;
    store?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    pricing?: {
        selling?: number;
        mrp?: number;
        discount?: number;
        currency?: string;
    };
    images?: {
        url?: string;
        alt?: string;
        isPrimary?: boolean;
    }[];
    rating?: {
        value?: number;
        count?: number;
    };
    _id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}>, "many">;
export type CreateProductRequest = z.infer<typeof CreateProductSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
