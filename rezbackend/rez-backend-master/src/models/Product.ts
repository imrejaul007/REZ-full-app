import mongoose, { Schema, Types } from 'mongoose';

// Enhanced Product variant interface
export interface IProductVariant {
  variantId: string;
  type: string; // 'size', 'color', 'flavor', etc.
  value: string; // 'XL', 'Red', 'Chocolate', etc.
  attributes?: Map<string, string>; // e.g., {color: 'red', size: 'M'}
  price?: number; // Variant price (overrides base price)
  compareAtPrice?: number; // Original price for variant
  stock: number;
  sku?: string;
  images?: string[]; // Variant-specific images
  barcode?: string;
  weight?: number; // in grams
  isAvailable?: boolean;
}

// GST tax configuration — applied at product level for line-item billing
export interface IProductGST {
  hsnCode?: string; // HSN / SAC code for the item (e.g. '2106' for food)
  sacCode?: string; // Service Accounting Code (for services)
  gstRate?: number; // Total GST rate as percentage (e.g. 5, 12, 18, 28)
  taxSlab?: '0' | '5' | '12' | '18' | '28' | 'exempt'; // Standard Indian GST slab
  isIGST?: boolean; // true for inter-state supply (IGST instead of CGST+SGST)
}

// Product pricing interface
export interface IProductPricing {
  original: number;
  selling: number;
  discount?: number; // Percentage
  currency: string;
  bulk?: {
    minQuantity: number;
    price: number;
  }[];
  gst?: IProductGST; // GST configuration for line-item billing
}

// Product inventory interface
export interface IProductInventory {
  stock: number;
  isAvailable: boolean;
  lowStockThreshold?: number;
  variants?: IProductVariant[];
  unlimited: boolean; // For digital products
  estimatedRestockDate?: Date; // When product will be back in stock
  allowBackorder?: boolean; // Allow orders when out of stock
  reservedStock?: number; // Stock reserved for pending orders
}

// Product ratings interface
export interface IProductRatings {
  average: number;
  count: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Product review stats (cached from Review model)
export interface IProductReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  lastUpdated?: Date;
}

// Product specifications interface
export interface IProductSpecification {
  key: string;
  value: string;
  group?: string; // 'dimensions', 'material', 'features', etc.
}

// Product SEO interface
export interface IProductSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  metaTags?: { [key: string]: string };
}

// Product analytics interface
export interface IProductAnalytics {
  views: number;
  purchases: number;
  conversions: number;
  wishlistAdds: number;
  shareCount: number;
  returnRate: number;
  avgRating: number;
  todayPurchases?: number;
  todayViews?: number;
  lastResetDate?: Date;
}

// Product cashback interface
export interface IProductCashback {
  percentage: number;
  maxAmount?: number;
  minPurchase?: number;
  validUntil?: Date;
  terms?: string;
  isActive?: boolean; // Whether cashback is currently active
  conditions?: string[]; // Cashback conditions array
}

// Product delivery info interface
export interface IProductDeliveryInfo {
  estimatedDays?: string;
  freeShippingThreshold?: number;
  expressAvailable?: boolean;
  standardDeliveryTime?: string;
  expressDeliveryTime?: string;
  deliveryPartner?: string;
}

// Frequently bought together interface
export interface IFrequentlyBoughtWith {
  productId: Types.ObjectId;
  purchaseCount: number;
  lastUpdated?: Date;
}

// Service details interface (for products with productType: 'service')
export interface IServiceDetails {
  duration: number; // Service duration in minutes
  serviceType: 'home' | 'store' | 'online';
  maxBookingsPerSlot: number; // How many bookings per time slot
  requiresAddress: boolean; // For home services
  requiresPaymentUpfront: boolean; // Merchant choice: pay now or pay later
  serviceArea?: {
    radius: number; // km (for home services)
    cities?: string[];
  };
  serviceCategory?: Types.ObjectId; // Reference to ServiceCategory
  freeCancellationHours?: number; // Hours before appointment for free cancellation (default 24)
  lateCancellationFee?: 'none' | 'partial' | 'full'; // Type of late cancellation fee
  cancellationFeeAmount?: number; // INR amount for partial/full cancellation fee
}

// Product modifier option interface
export interface IModifierOption {
  label: string; // "Yes +₹50", "No onion", "Small"
  price: number; // Additional price for this option
  isDefault?: boolean; // Whether this option is selected by default
}

// Product modifier interface
export interface IModifier {
  _id?: Types.ObjectId;
  name: string; // "Add Cheese", "Size", "Spice Level"
  required?: boolean; // Whether customer must select this modifier
  multiSelect?: boolean; // Whether customer can select multiple options
  options: IModifierOption[]; // Available options for this modifier
}

// R13 — Canonical image shape used throughout the codebase.
// Stored as JSON strings in the DB (e.g. '{"url":"...","alt":"...","isPrimary":true}')
// Use Product.parseImage() / Product.parseImages() to deserialize.
export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

// Main Product interface
export interface IProduct {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  productType: 'product' | 'service'; // Type: physical product or service
  category: Types.ObjectId;
  subCategory?: Types.ObjectId;
  subSubCategory?: string; // Sub-sub-category (cuisine/item type)
  store: Types.ObjectId;
  merchantId?: Types.ObjectId; // Link to merchant for easier querying
  brand?: string;
  model?: string;
  sku: string;
  barcode?: string;
  images: string[];
  videos?: string[];
  pricing: IProductPricing;
  inventory: IProductInventory;
  ratings: IProductRatings;
  reviewStats?: IProductReviewStats; // Cached review statistics
  specifications: IProductSpecification[];
  tags: string[];
  seo: IProductSEO;
  analytics: IProductAnalytics;
  cashback?: IProductCashback;
  deliveryInfo?: IProductDeliveryInfo;
  serviceDetails?: IServiceDetails; // For services only
  serviceCategory?: Types.ObjectId; // Reference to ServiceCategory for services
  bundleProducts?: Types.ObjectId[];
  frequentlyBoughtWith?: IFrequentlyBoughtWith[];
  modifiers?: IModifier[];
  // Menu scheduling (breakfast/lunch/dinner availability)
  availableFrom?: string; // Time in HH:mm format, default '00:00'
  availableTo?: string; // Time in HH:mm format, default '23:59'
  menuPeriod?: 'all_day' | 'breakfast' | 'lunch' | 'dinner' | 'custom'; // Default: 'all_day'
  // 86-item tracking (out of stock mid-service)
  is86d?: boolean; // Currently marked as unavailable
  restores86At?: Date; // Auto-restore time (next day 6am)
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  visibility?: 'public' | 'hidden' | 'featured'; // Product visibility status
  weight?: number; // in grams
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit: 'cm' | 'inch';
  };
  shippingInfo?: {
    weight: number;
    freeShipping: boolean;
    shippingCost?: number;
    processingTime?: string; // "1-2 days"
  };
  relatedProducts?: Types.ObjectId[];

  // R14: Shop by Occasion filter — controller queries { occasion } but model had no field.
  // Added as an optional string to enable occasion-based product filtering.
  occasion?: string;

  createdAt: Date;
  updatedAt: Date;

  // Soft delete fields
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId; // Reference to User or Merchant who deleted
  deletedByModel?: 'User' | 'Merchant'; // Model reference for deletedBy

  // Admin Control Fields
  adminApproved?: boolean;
  adminNotes?: string;
  isSuspended?: boolean;
  suspensionReason?: string;
  deactivatedReason?: string;
  lowStockAlert?: number;

  // Privé Review Eligibility
  isPriveReviewEligible?: boolean;
  priveReviewRewardCoins?: number;

  // Methods
  isInStock(): boolean;
  getVariantByType(type: string, value: string): IProductVariant | null;
  calculateDiscountedPrice(): number;
  updateRatings(): Promise<void>;
  incrementViews(): Promise<void>;
  incrementTodayPurchases(): Promise<void>;
  resetDailyAnalytics(): Promise<void>;
  calculateCashback(purchaseAmount?: number): number;
  getEstimatedDelivery(userLocation?: any): string;
  softDelete(deletedBy: Types.ObjectId): Promise<void>;
  restore(): Promise<void>;
  permanentDelete(): Promise<void>;
}

// Product Schema
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    productType: {
      type: String,
      enum: ['product', 'service'],
      default: 'product',
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    subSubCategory: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    model: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    videos: [String],
    pricing: {
      original: {
        type: Number,
        required: true,
        min: 0,
      },
      selling: {
        type: Number,
        required: true,
        min: 0,
      },
      discount: {
        type: Number,
        min: 0,
        max: 100,
      },
      currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'AED', 'CNY'],
      },
      bulk: [
        {
          minQuantity: { type: Number, min: 1 },
          price: { type: Number, min: 0 },
        },
      ],
      gst: {
        hsnCode: { type: String, trim: true, uppercase: true },
        sacCode: { type: String, trim: true, uppercase: true },
        gstRate: { type: Number, min: 0, max: 28 },
        taxSlab: { type: String, enum: ['0', '5', '12', '18', '28', 'exempt'] },
        isIGST: { type: Boolean, default: false },
      },
    },
    inventory: {
      stock: {
        type: Number,
        required: true,
        min: 0,
      },
      isAvailable: {
        type: Boolean,
        default: true,
      },
      lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0,
      },
      variants: [
        {
          variantId: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            required: true,
            trim: true,
          },
          value: {
            type: String,
            required: true,
            trim: true,
          },
          attributes: {
            type: Map,
            of: String,
          },
          price: {
            type: Number,
            min: 0,
          },
          compareAtPrice: {
            type: Number,
            min: 0,
          },
          stock: {
            type: Number,
            required: true,
            min: 0,
          },
          sku: String,
          images: [String],
          barcode: String,
          weight: Number,
          isAvailable: {
            type: Boolean,
            default: true,
          },
        },
      ],
      unlimited: {
        type: Boolean,
        default: false,
      },
      estimatedRestockDate: {
        type: Date,
      },
      allowBackorder: {
        type: Boolean,
        default: false,
      },
      reservedStock: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
        min: 0,
      },
      distribution: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },
    reviewStats: {
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalReviews: {
        type: Number,
        default: 0,
        min: 0,
      },
      ratingDistribution: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
      lastUpdated: Date,
    },
    specifications: [
      {
        key: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: String,
          required: true,
          trim: true,
        },
        group: {
          type: String,
          trim: true,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    seo: {
      title: {
        type: String,
        trim: true,
        maxlength: 60,
      },
      description: {
        type: String,
        trim: true,
        maxlength: 160,
      },
      keywords: [String],
      metaTags: {
        type: Map,
        of: String,
      },
    },
    analytics: {
      views: {
        type: Number,
        default: 0,
        min: 0,
      },
      purchases: {
        type: Number,
        default: 0,
        min: 0,
      },
      conversions: {
        type: Number,
        default: 0,
        min: 0,
      },
      wishlistAdds: {
        type: Number,
        default: 0,
        min: 0,
      },
      shareCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      returnRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      avgRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      todayPurchases: {
        type: Number,
        default: 0,
        min: 0,
      },
      todayViews: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },
    cashback: {
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 5,
      },
      maxAmount: {
        type: Number,
        min: 0,
      },
      minPurchase: {
        type: Number,
        min: 0,
        default: 0,
      },
      validUntil: Date,
      terms: String,
      isActive: {
        type: Boolean,
        default: true,
      },
      conditions: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    deliveryInfo: {
      estimatedDays: {
        type: String,
        default: '2-3 days',
      },
      freeShippingThreshold: {
        type: Number,
        default: 500,
      },
      expressAvailable: {
        type: Boolean,
        default: false,
      },
      standardDeliveryTime: {
        type: String,
        default: '2-3 days',
      },
      expressDeliveryTime: {
        type: String,
        default: 'Under 30min',
      },
      deliveryPartner: String,
    },
    // Service-specific fields (for productType: 'service')
    serviceDetails: {
      duration: {
        type: Number,
        min: 15,
        max: 480, // max 8 hours
      },
      serviceType: {
        type: String,
        enum: ['home', 'store', 'online'],
        default: 'store',
      },
      maxBookingsPerSlot: {
        type: Number,
        min: 1,
        default: 1,
      },
      requiresAddress: {
        type: Boolean,
        default: false,
      },
      requiresPaymentUpfront: {
        type: Boolean,
        default: false,
      },
      serviceArea: {
        radius: {
          type: Number,
          min: 0,
        },
        cities: [
          {
            type: String,
            trim: true,
          },
        ],
      },
      serviceCategory: {
        type: Schema.Types.ObjectId,
        ref: 'ServiceCategory',
      },
      freeCancellationHours: {
        type: Number,
        default: 24,
        min: 0,
        max: 720, // max 30 days
      },
      lateCancellationFee: {
        type: String,
        enum: ['none', 'partial', 'full'],
        default: 'none',
      },
      cancellationFeeAmount: {
        type: Number,
        min: 0,
      },
    },
    serviceCategory: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      index: true,
    },
    bundleProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    frequentlyBoughtWith: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
        purchaseCount: {
          type: Number,
          default: 0,
          min: 0,
        },
        lastUpdated: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    modifiers: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        required: {
          type: Boolean,
          default: false,
        },
        multiSelect: {
          type: Boolean,
          default: false,
        },
        options: [
          {
            label: {
              type: String,
              required: true,
              trim: true,
            },
            price: {
              type: Number,
              default: 0,
              min: 0,
            },
            isDefault: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ['public', 'hidden', 'featured'],
      default: 'public',
    },
    weight: {
      type: Number,
      min: 0, // in grams
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: {
        type: String,
        enum: ['cm', 'inch'],
        default: 'cm',
      },
    },
    shippingInfo: {
      weight: { type: Number, min: 0 },
      freeShipping: { type: Boolean, default: false },
      shippingCost: { type: Number, min: 0 },
      processingTime: String,
    },
    relatedProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],

    // R14: occasion field for Shop by Occasion feature (controller queries this at line ~170)
    occasion: {
      type: String,
      trim: true,
      index: true,
    },

    // R16: lowStockAlert — merchant frontend sends this via PATCH /merchant/products/:id
    // (see rez-merchant-service/src/routes/products.ts patchableFields).
    // The field was accepted by the route but had no model definition, so it was silently dropped.
    // Stored as a number (threshold count) — true = 1, false = 0, or explicit count.
    lowStockAlert: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Soft delete fields
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      refPath: 'deletedByModel', // Dynamic reference
    },
    deletedByModel: {
      type: String,
      enum: ['User', 'Merchant'],
      default: null,
    },

    // Admin Control Fields
    adminApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspensionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    deactivatedReason: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },
    isPriveReviewEligible: {
      type: Boolean,
      default: false,
      index: true,
    },
    priveReviewRewardCoins: {
      type: Number,
      default: 0,
      min: 0,
      max: 500,
    },

    // Menu scheduling (breakfast/lunch/dinner availability)
    availableFrom: {
      type: String,
      default: '00:00',
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format'],
    },
    availableTo: {
      type: String,
      default: '23:59',
      trim: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format'],
    },
    menuPeriod: {
      type: String,
      enum: ['all_day', 'breakfast', 'lunch', 'dinner', 'custom'],
      default: 'all_day',
    },

    // 86-item tracking (out of stock mid-service)
    is86d: {
      type: Boolean,
      default: false,
      index: true,
    },
    restores86At: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ subSubCategory: 1, isActive: 1 });
ProductSchema.index({ store: 1, isActive: 1, isDeleted: 1 });
ProductSchema.index({ brand: 1, isActive: 1 });
ProductSchema.index({ 'pricing.selling': 1 });
ProductSchema.index({ 'ratings.average': -1, isActive: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ tags: 1, isActive: 1 });
ProductSchema.index({ 'inventory.stock': 1, 'inventory.isAvailable': 1 });
ProductSchema.index({ createdAt: -1 });
// Service-specific indexes
ProductSchema.index({ productType: 1, isActive: 1 });
ProductSchema.index({ serviceCategory: 1, isActive: 1, productType: 1 });
ProductSchema.index({ productType: 1, 'ratings.average': -1, isActive: 1 });

// FIX: Missing indexes for common queries
ProductSchema.index({ category: 1, occasion: 1, isActive: 1 }); // Occasion-based queries
ProductSchema.index({ isActive: 1, 'inventory.isAvailable': 1, createdAt: -1 }); // New arrivals with availability
ProductSchema.index({ store: 1, isFeatured: 1, isActive: 1 }); // Featured products by store
ProductSchema.index({ category: 1, 'ratings.average': -1, isActive: 1 }); // Top-rated by category

// Text search index
ProductSchema.index(
  { name: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 10, brand: 5, tags: 3, description: 1 }, name: 'product_text_search' },
);

// Compound indexes
ProductSchema.index({ category: 1, 'pricing.selling': 1, isActive: 1, isDeleted: 1 });
ProductSchema.index({ store: 1, 'ratings.average': -1, isDeleted: 1 });
ProductSchema.index({ isFeatured: 1, 'ratings.average': -1, isActive: 1, isDeleted: 1 });

// Analytics indexes for merchant dashboard
ProductSchema.index({ store: 1, 'analytics.purchases': -1, isDeleted: 1 }); // Top selling by quantity
ProductSchema.index({ store: 1, category: 1, createdAt: -1, isDeleted: 1 }); // Category performance
ProductSchema.index({ store: 1, 'inventory.stock': 1, 'inventory.lowStockThreshold': 1, isDeleted: 1 }); // Low stock alerts

// Homepage query indexes
ProductSchema.index({ isActive: 1, isFeatured: 1, 'inventory.isAvailable': 1, 'analytics.views': -1 }); // featured products
ProductSchema.index({ isActive: 1, 'inventory.isAvailable': 1, createdAt: -1 }); // new arrivals

// Query performance indexes
ProductSchema.index({ isActive: 1, createdAt: -1 }); // Product listing sorted by date
ProductSchema.index({ isActive: 1, 'analytics.views': -1 }); // Popular products sort
ProductSchema.index({ store: 1, isActive: 1, createdAt: -1 }); // Store menu listing
ProductSchema.index({ category: 1, isActive: 1, 'pricing.selling': 1 }); // Category product listing with price sort

// Soft delete indexes
ProductSchema.index({ isDeleted: 1, deletedAt: 1 }); // For cleanup queries
// store + isActive + isDeleted covered by the compound index on line 860
ProductSchema.index({ merchantId: 1, isDeleted: 1 }); // For merchant queries with deleted filter

// Virtual for discount percentage
ProductSchema.virtual('discountPercentage').get(function (this: IProduct) {
  if (this.pricing.original <= this.pricing.selling) return 0;
  return Math.round(((this.pricing.original - this.pricing.selling) / this.pricing.original) * 100);
});

// Virtual for low stock status
ProductSchema.virtual('isLowStock').get(function (this: IProduct) {
  if (this.inventory.unlimited) return false;
  return this.inventory.stock <= (this.inventory.lowStockThreshold || 5);
});

// Virtual for out of stock status
ProductSchema.virtual('isOutOfStock').get(function (this: IProduct) {
  if (this.inventory.unlimited) return false;
  return this.inventory.stock === 0;
});

// RC-2 — Virtual: price — canonical price shape exposed by the API response transform layer.
// DEPRECATED: Controllers inject this shape. This virtual makes it explicit in the model.
// Remove controller-level injection after this virtual is stable.
ProductSchema.virtual('price').get(function (this: IProduct) {
  return {
    current: this.pricing?.selling ?? 0,
    original: this.pricing?.original ?? 0,
    currency: this.pricing?.currency ?? '₹',
    discount: this.pricing?.discount ?? 0,
  };
});

// RC-2 — Setter for the price virtual. Allows writes via doc.price = { current, original, ... }
// to be stored back into the underlying pricing subdocument.
ProductSchema.virtual('price').set(function (this: IProduct, v: any) {
  if (v && typeof v === 'object') {
    if (v.current !== undefined) {
      if (!this.pricing) this.pricing = { original: 0, selling: 0, currency: 'INR' };
      this.pricing.selling = Number(v.current);
    }
    if (v.original !== undefined) {
      if (!this.pricing) this.pricing = { original: 0, selling: 0, currency: 'INR' };
      this.pricing.original = Number(v.original);
    }
  }
});

// Pre-find middleware to exclude soft-deleted products by default
ProductSchema.pre(/^find/, function (this: any, next) {
  // Only apply filter if not explicitly querying for deleted products
  if (!this.getQuery().hasOwnProperty('isDeleted')) {
    // Use $ne: true to include products where isDeleted is false OR doesn't exist (for backward compatibility)
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Pre-findOne middleware
ProductSchema.pre('findOne', function (this: any, next) {
  // Only apply filter if not explicitly querying for deleted products
  if (!this.getQuery().hasOwnProperty('isDeleted')) {
    // Use $ne: true to include products where isDeleted is false OR doesn't exist (for backward compatibility)
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Pre-count middleware
ProductSchema.pre('countDocuments', function (this: any, next) {
  // Only apply filter if not explicitly querying for deleted products
  if (!this.getQuery().hasOwnProperty('isDeleted')) {
    // Use $ne: true to include products where isDeleted is false OR doesn't exist (for backward compatibility)
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Canonical shape for product images — stored as flat strings but accepts
// object arrays from the merchant frontend and validator.
// Shape: `{ url: string; alt?: string; isPrimary?: boolean }`
// Stored as: `string`  (JSON-serialized, e.g. '{"url":"https://..."}')
function normalizeImages(raw: any[]): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((img) => {
    // Already a plain string URL — use as-is
    if (typeof img === 'string') return img;
    // Object shape from merchant frontend / validator
    if (img && typeof img === 'object' && typeof img.url === 'string') {
      return JSON.stringify({
        url: img.url,
        alt: typeof img.alt === 'string' ? img.alt : (img.altText ?? undefined),
        isPrimary: img.isPrimary ?? img.isMain ?? false,
      });
    }
    // Unknown shape — try to stringify
    return typeof img.toJSON === 'function' ? img.toJSON() : String(img);
  });
}

// Pre-save hook to generate slug, calculate discount, normalize images
ProductSchema.pre('save', function (this: IProduct, next) {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  // Calculate discount percentage
  if (this.pricing.original && this.pricing.selling) {
    if (this.pricing.original > this.pricing.selling) {
      this.pricing.discount = Math.round(
        ((this.pricing.original - this.pricing.selling) / this.pricing.original) * 100,
      );
    } else {
      this.pricing.discount = 0;
    }
  }

  // Update availability based on stock
  if (!this.inventory.unlimited) {
    this.inventory.isAvailable = this.inventory.stock > 0;
  }

  // Normalize images to canonical string[] shape (R13)
  if (this.images) {
    this.images = normalizeImages(this.images as any);
  }

  next();
});

// Method to check if product is in stock
ProductSchema.methods.isInStock = function (): boolean {
  if (this.inventory.unlimited) return true;
  return this.inventory.isAvailable && this.inventory.stock > 0;
};

// Method to get variant by type and value
ProductSchema.methods.getVariantByType = function (type: string, value: string): IProductVariant | null {
  if (!this.inventory.variants) return null;

  const variant = this.inventory.variants.find(
    (v: IProductVariant) =>
      v.type.toLowerCase() === type.toLowerCase() && v.value.toLowerCase() === value.toLowerCase(),
  );

  return variant || null;
};

// Method to calculate discounted price
ProductSchema.methods.calculateDiscountedPrice = function (): number {
  return this.pricing.selling;
};

// Method to update ratings
ProductSchema.methods.updateRatings = async function (): Promise<void> {
  const Review = this.model('Review');
  const reviews = await Review.find({
    targetType: 'Product',
    targetId: this._id,
    isApproved: true,
  });

  if (reviews.length === 0) {
    this.ratings = {
      average: 0,
      count: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
    return;
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;

  reviews.forEach((review: any) => {
    const rating = Math.round(review.rating) as keyof typeof distribution;
    distribution[rating]++;
    totalRating += review.rating;
  });

  this.ratings = {
    average: Math.round((totalRating / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution,
  };

  // Update analytics
  this.analytics.avgRating = this.ratings.average;
};

// Method to increment views
ProductSchema.methods.incrementViews = async function (): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReset = new Date(this.analytics.lastResetDate || Date.now());
  lastReset.setHours(0, 0, 0, 0);

  const updateData: any = {
    $inc: { 'analytics.views': 1 },
  };

  // Check if we need to reset daily analytics (if it's a new day)
  if (today.getTime() > lastReset.getTime()) {
    updateData.$set = {
      'analytics.todayViews': 1,
      'analytics.todayPurchases': 0,
      'analytics.lastResetDate': today,
    };
  } else {
    updateData.$inc['analytics.todayViews'] = 1;
  }

  // Update directly without triggering full validation
  await (this.constructor as mongoose.Model<IProduct>).findByIdAndUpdate(this._id, updateData);

  // Update the local instance
  this.analytics.views += 1;
  if (today.getTime() > lastReset.getTime()) {
    this.analytics.todayViews = 1;
    this.analytics.todayPurchases = 0;
    this.analytics.lastResetDate = today;
  } else {
    this.analytics.todayViews = (this.analytics.todayViews || 0) + 1;
  }
};

// Method to increment today's purchases
ProductSchema.methods.incrementTodayPurchases = async function (): Promise<void> {
  this.analytics.purchases += 1;
  this.analytics.todayPurchases = (this.analytics.todayPurchases || 0) + 1;

  // Check if we need to reset daily analytics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastReset = new Date(this.analytics.lastResetDate || Date.now());
  lastReset.setHours(0, 0, 0, 0);

  if (today.getTime() > lastReset.getTime()) {
    this.analytics.todayPurchases = 1;
    this.analytics.todayViews = 0;
    this.analytics.lastResetDate = today;
  }

  await this.save();
};

// Method to reset daily analytics
ProductSchema.methods.resetDailyAnalytics = async function (): Promise<void> {
  this.analytics.todayPurchases = 0;
  this.analytics.todayViews = 0;
  this.analytics.lastResetDate = new Date();
  await this.save();
};

// Method to calculate cashback
ProductSchema.methods.calculateCashback = function (purchaseAmount?: number): number {
  // pricing is a required subdocument: selling = current selling price, original = MRP
  const amount = purchaseAmount ?? this.pricing?.selling ?? this.pricing?.original ?? 0;

  // If amount is 0 or invalid, return 0
  if (!amount || amount <= 0 || isNaN(amount)) {
    return 0;
  }

  // Check if purchase meets minimum requirement
  if (this.cashback?.minPurchase && amount < this.cashback.minPurchase) {
    return 0;
  }

  // Check if cashback is still valid
  if (this.cashback?.validUntil && new Date() > new Date(this.cashback.validUntil)) {
    return 0;
  }

  // Calculate cashback amount
  const percentage = this.cashback?.percentage || 5; // Default 5% if not specified
  let cashbackAmount = (amount * percentage) / 100;

  // Apply max amount limit if specified
  if (this.cashback?.maxAmount && cashbackAmount > this.cashback.maxAmount) {
    cashbackAmount = this.cashback.maxAmount;
  }

  return Math.round(cashbackAmount);
};

// Method to get estimated delivery time
ProductSchema.methods.getEstimatedDelivery = function (userLocation?: any): string {
  // If express is available and user is in same city
  if (this.deliveryInfo?.expressAvailable && userLocation?.city === this.store?.location?.city) {
    return this.deliveryInfo.expressDeliveryTime || 'Under 30min';
  }

  // Check stock levels for delivery estimation
  if (this.inventory.stock < 5 && !this.inventory.unlimited) {
    return '3-5 days'; // Longer for low stock
  }

  // Return standard delivery time
  return this.deliveryInfo?.standardDeliveryTime || this.deliveryInfo?.estimatedDays || '2-3 days';
};

// Method to soft delete product
ProductSchema.methods.softDelete = async function (deletedBy: Types.ObjectId): Promise<void> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  this.deletedByModel = 'Merchant'; // Default to Merchant, can be User if needed
  this.isActive = false; // Also mark as inactive
  await this.save();
};

// Method to restore soft-deleted product
ProductSchema.methods.restore = async function (): Promise<void> {
  // Check if product was deleted within 30 days
  if (this.deletedAt) {
    const daysSinceDeletion = Math.floor((Date.now() - this.deletedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDeletion > 30) {
      throw new Error('Cannot restore product deleted more than 30 days ago');
    }
  }

  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  this.deletedByModel = null;
  this.isActive = true; // Restore to active state
  await this.save();
};

// Method to permanently delete product (admin only)
ProductSchema.methods.permanentDelete = async function (): Promise<void> {
  await this.deleteOne();
};

/** Canonical image shape returned by parseImage(). */
export interface ParsedProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

/**
 * Parse a single stored image value (string or legacy object) into the
 * canonical ParsedProductImage shape.
 *
 * Handles:
 *  - Plain URL string            → { url }
 *  - JSON string                 → { url, alt?, isPrimary? }
 *  - Legacy object { url }       → { url }
 *  - Legacy object { url, alt }  → { url, alt }
 */
ProductSchema.statics.parseImage = function (raw: any): ParsedProductImage {
  if (!raw) return { url: '' };
  // Plain URL string
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return { url: parsed.url ?? raw, alt: parsed.alt, isPrimary: parsed.isPrimary };
    } catch {
      return { url: raw };
    }
  }
  // Object shape (legacy or already-parsed)
  if (typeof raw === 'object') {
    const url = typeof raw.url === 'string' ? raw.url : '';
    const alt = raw.alt ?? raw.altText ?? undefined;
    const isPrimary = raw.isPrimary ?? raw.isMain ?? false;
    return { url, alt: typeof alt === 'string' ? alt : undefined, isPrimary };
  }
  return { url: String(raw) };
};

/** Parse the full images array into ParsedProductImage[]. */
ProductSchema.statics.parseImages = function (raw: string[] | ParsedProductImage[] | any[]): ParsedProductImage[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((img) => (Product as any).parseImage(img));
};

/** Extract the primary (first) image URL from a stored images array.
 *  Handles both old flat strings and new normalized JSON strings.
 */
ProductSchema.statics.getPrimaryImageUrl = function (images: string[] | any[]): string {
  if (!Array.isArray(images) || images.length === 0) return '';
  const first = (Product as any).parseImage(images[0]);
  return first.url || '';
};

// Static method to search products
ProductSchema.statics.searchProducts = function (searchText: string, filters: any = {}, options: any = {}) {
  const query: any = {
    $text: { $search: searchText },
    isActive: true,
  };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.store) {
    query.store = filters.store;
  }

  if (filters.brand) {
    query.brand = new RegExp(filters.brand, 'i');
  }

  if (filters.priceRange) {
    query['pricing.selling'] = {
      $gte: filters.priceRange.min || 0,
      $lte: filters.priceRange.max || Number.MAX_VALUE,
    };
  }

  if (filters.inStock) {
    query['inventory.isAvailable'] = true;
    query['inventory.stock'] = { $gt: 0 };
  }

  if (filters.rating) {
    query['ratings.average'] = { $gte: filters.rating };
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .populate('category store')
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get featured products
ProductSchema.statics.getFeatured = function (limit: number = 10) {
  return this.find({
    isFeatured: true,
    isActive: true,
    'inventory.isAvailable': true,
  })
    .populate('category store')
    .sort({ 'ratings.average': -1, createdAt: -1 })
    .limit(limit);
};

// Static method to get products by category
ProductSchema.statics.getByCategory = function (categoryId: string, options: any = {}) {
  const query: any = {
    category: categoryId,
    isActive: true,
    'inventory.isAvailable': true,
  };

  let sortOptions: any = {};

  switch (options.sortBy) {
    case 'price_low':
      sortOptions = { 'pricing.selling': 1 };
      break;
    case 'price_high':
      sortOptions = { 'pricing.selling': -1 };
      break;
    case 'rating':
      sortOptions = { 'ratings.average': -1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    default:
      sortOptions = { 'ratings.average': -1, createdAt: -1 };
  }

  return this.find(query)
    .populate('category store')
    .sort(sortOptions)
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};
export const Product =
  (mongoose.models.Product as import('mongoose').Model<IProduct>) || mongoose.model<IProduct>('Product', ProductSchema);
