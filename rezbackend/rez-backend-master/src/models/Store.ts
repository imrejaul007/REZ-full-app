import { logger } from '../config/logger';
import mongoose, { Schema, Document, Types } from 'mongoose';

// Store location interface
export interface IStoreLocation {
  address: string;
  city: string;
  state?: string;
  pincode?: string;
  coordinates?: [number, number]; // [longitude, latitude]
  deliveryRadius?: number; // in kilometers
  landmark?: string;
}
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  text: string;
  cashbackEarned: number;
  createdAt: Date;
  updatedAt?: Date;
}

// Store contact interface
export interface IStoreContact {
  phone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
}

// Store ratings interface
export interface IStoreRatings {
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

// Store offers interface
export interface IStoreOffers {
  cashback?: number; // Percentage
  minOrderAmount?: number;
  maxCashback?: number;
  discounts?: Types.ObjectId[]; // Reference to offers
  isPartner: boolean;
  partnerLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

// Store QR Code interface
export interface IStoreQR {
  code?: string; // Unique QR code: "REZ-STORE-{storeId}"
  qrImageUrl?: string; // Generated QR image URL
  generatedAt?: Date;
  isActive: boolean;
}

// Store Payment Settings interface (Merchant Controls)
export interface IStorePaymentSettings {
  // Payment Methods
  acceptUPI: boolean;
  acceptCards: boolean;
  acceptPayLater: boolean;

  // Coin Settings
  acceptRezCoins: boolean;
  acceptPromoCoins: boolean;
  acceptPayBill: boolean;
  maxCoinRedemptionPercent: number; // Max % of bill payable via coins (0-100)

  // Hybrid Payment
  allowHybridPayment: boolean;

  // Offers
  allowOffers: boolean;
  allowCashback: boolean;

  // UPI Details for direct payment
  upiId?: string; // Merchant's UPI ID
  upiName?: string; // Display name for UPI
}

// Store Reward Rules interface (Merchant Sets)
export interface IStoreRewardRules {
  baseCashbackPercent: number; // Base cashback % for payments
  reviewBonusCoins: number; // Bonus coins for review
  socialShareBonusCoins: number; // Bonus coins for social share
  minimumAmountForReward: number; // Min bill amount to earn rewards
  coinsPerRupee?: number; // Coins earned per rupee spent (e.g., 0.1 = 1 coin per ₹10)
  extraRewardThreshold?: number; // e.g., Spend ₹400 → get extra coins
  extraRewardCoins?: number; // Extra coins when threshold met
  firstVisitBonus?: number; // Bonus coins for first-ever payment at this store
  visitMilestoneRewards?: {
    // Rewards for visit milestones
    visits: number; // e.g., 5th visit
    coinsReward: number;
  }[];
  /**
   * Scan-to-Earn — coins awarded to a customer who scans the store's
   * QR (canonical.visit.completed event with source=qr_checkin) even
   * if they do NOT pay afterward. Drives walk-in acquisition into the
   * loyalty loop. Daily cap enforced per (customerId, storeId) via the
   * ProcessedEvent ledger inside scanRewardSubscriber.
   */
  scanToEarn?: {
    /** Must be explicitly true — merchants opt in. */
    enabled: boolean;
    /** Coins awarded on the customer's first-ever scan at this store. */
    firstScanBonus: number;
    /** Coins awarded on subsequent scans. */
    repeatScanCoins: number;
    /** Max number of scan rewards per customer per store in any 24h window. */
    dailyCapPerCustomer: number;
  };
}

// Store delivery categories interface
export interface IStoreDeliveryCategories {
  fastDelivery: boolean; // 30 min delivery
  budgetFriendly: boolean; // 1 rupee store
  ninetyNineStore: boolean; // 99 rupees store
  premium: boolean; // Luxury store
  organic: boolean; // Organic store
  alliance: boolean; // Alliance store
  lowestPrice: boolean; // Lowest price guarantee
  mall: boolean; // Rez Mall
  cashStore: boolean; // Cash Store
}

// Store operational info interface
export interface IStoreOperationalInfo {
  hours: {
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    sunday?: { open: string; close: string; closed?: boolean };
  };
  deliveryTime?: string; // "30-45 mins"
  minimumOrder?: number;
  deliveryFee?: number;
  freeDeliveryAbove?: number;
  acceptsWalletPayment: boolean;
  paymentMethods: string[];
}

// Store analytics interface
export interface IStoreAnalytics {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  repeatCustomers: number;
  followersCount: number;
  popularProducts?: Types.ObjectId[];
  peakHours?: string[];
  monthlyStats?: {
    month: number;
    year: number;
    orders: number;
    revenue: number;
  }[];
}

// Store video interface
export interface IStoreVideo {
  url: string;
  thumbnail?: string;
  title?: string;
  duration?: number; // in seconds
  uploadedAt?: Date;
}

// Store action button destination interface
export interface IStoreActionButtonDestination {
  type: 'phone' | 'url' | 'maps' | 'internal';
  value: string;
}

// Store action button interface
export interface IStoreActionButton {
  id: 'call' | 'product' | 'location' | 'custom';
  enabled: boolean;
  label?: string;
  destination?: IStoreActionButtonDestination;
  order?: number;
}

// Store action buttons configuration interface
export interface IStoreActionButtons {
  enabled: boolean;
  buttons: IStoreActionButton[];
}

// Store promotion banner interface
export interface IStorePromotion {
  title: string;
  subtitle?: string;
  image?: string;
  backgroundColor?: string;
  actionText?: string;
  actionUrl?: string;
}

// Main Store interface
export interface IStore extends Document {
  name: string;
  slug: string;
  description?: string;
  logo?: string; // Single logo image
  image?: string; // Store image URL (fallback)
  banner?: string[]; // Array of banner image URLs
  videos?: IStoreVideo[]; // Store promotional videos
  promotions?: IStorePromotion[]; // Ad banners shown in web menu
  googlePlaceId?: string; // Google Maps Place ID for review link
  category: Types.ObjectId;
  subCategories?: Types.ObjectId[];
  location: IStoreLocation;
  contact: IStoreContact;
  ratings: IStoreRatings;
  offers: IStoreOffers;
  operationalInfo: IStoreOperationalInfo;
  deliveryCategories: IStoreDeliveryCategories;
  analytics: IStoreAnalytics;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  merchantId?: Types.ObjectId; // Reference to merchant/owner
  createdViaOnboarding?: boolean; // Flag to indicate if store was created via onboarding

  // Menu fields
  hasMenu?: boolean; // Indicates if store has a menu (for restaurants/food stores)
  menuCategories?: string[]; // Quick reference to menu categories

  // Booking & Store Visit fields
  bookingType?: 'RESTAURANT' | 'SERVICE' | 'CONSULTATION' | 'RETAIL' | 'HYBRID';
  bookingConfig?: {
    enabled: boolean;
    requiresAdvanceBooking: boolean; // true for restaurants/salons
    allowWalkIn: boolean; // true for retail "store visit"
    slotDuration: number; // minutes
    advanceBookingDays: number; // how many days in advance
    maxTableCapacity: number; // max guests per time slot (restaurant seating capacity)
    workingHours?: {
      start: string; // e.g., "09:00"
      end: string; // e.g., "21:00"
    };
    tables?: Array<{
      tableNumber: string;
      capacity: number;
      qrCodeUrl?: string;
      qrData?: string;
      isActive: boolean;
    }>;
    tableCount?: number;
  };
  storeVisitConfig?: {
    // For RETAIL stores - plan store visit
    enabled: boolean;
    features: ('queue_system' | 'visit_scheduling' | 'live_availability')[];
    maxVisitorsPerSlot?: number;
    averageVisitDuration?: number; // minutes
  };
  serviceTypes?: string[]; // For SERVICE stores: ['haircut', 'massage', 'facial']
  consultationTypes?: string[]; // For CONSULTATION stores: ['general', 'dental', 'eye']

  // Action buttons configuration for ProductPage
  actionButtons?: IStoreActionButtons;

  // QR Code Configuration for Store Payments
  storeQR?: IStoreQR;

  // Payment Settings (Merchant Controls)
  paymentSettings?: IStorePaymentSettings;

  // REZ Merchant Program membership
  estimatedPrepMinutes?: number; // shown as "Ready in ~X mins" on web menu (0 = hidden)
  isProgramMerchant?: boolean; // true = subscribed to REZ Merchant Program (coins + loyalty enabled)

  // Reward Rules (Merchant Sets)
  rewardRules?: IStoreRewardRules;

  // Service Capabilities - unified service type configuration
  serviceCapabilities?: {
    homeDelivery: {
      enabled: boolean;
      deliveryRadius?: number; // km
      minOrder?: number;
      deliveryFee?: number;
      freeDeliveryAbove?: number;
      estimatedTime?: string; // "30-45 min"
    };
    driveThru: {
      enabled: boolean;
      estimatedTime?: string; // "5-10 min"
      menuType?: 'full' | 'limited';
    };
    tableBooking: {
      enabled: boolean;
      // Detailed config lives in bookingConfig
    };
    dineIn: {
      enabled: boolean;
    };
    storePickup: {
      enabled: boolean;
      estimatedTime?: string; // "15-20 min"
    };
  };

  // Category page metadata
  is60MinDelivery?: boolean;
  hasStorePickup?: boolean;
  priceForTwo?: number; // Average cost for two people

  // REZ Now page config
  storeType?: 'restaurant' | 'cafe' | 'bakery' | 'salon' | 'spa' | 'retail' | 'other';
  fssaiNumber?: string;
  gstNumber?: string;
  instagramHandle?: string;
  facebookUrl?: string;
  twitterHandle?: string;
  websiteUrl?: string;
  acceptsOnlineOrders?: boolean;
  acceptsScanPay?: boolean;
  showLoyaltyStamps?: boolean;

  // REZ Now delivery config
  deliveryEnabled?: boolean;
  deliveryRadiusKm?: number;
  deliveryFee?: number;
  storeLatitude?: number;
  storeLongitude?: number;

  // REZ Now operating hours override (per-day, top-level)
  // When present, these override operationalInfo.hours for web-ordering responses.
  operatingHours?: {
    [day in 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday']?: {
      open: string;
      close: string;
      closed: boolean;
    };
  };

  // Table Reservation (REZ Now)
  reservationsEnabled?: boolean;
  maxTableCapacity?: number;

  // Admin Control Fields
  adminApproved?: boolean;
  adminNotes?: string;
  adminApprovedAt?: Date;
  adminApprovedBy?: Types.ObjectId;
  isSuspended?: boolean;
  suspensionReason?: string;
  isTrending?: boolean;

  // GST and Tax Information
  gstin?: string;
  gstRate?: number;

  // Multi-outlet fields
  outletCode?: string;
  outletCity?: string;
  isPrimaryOutlet?: boolean;

  // Table Management
  totalTables?: number;
  tableConfig?: Array<{
    tableNumber?: number;
    capacity?: number;
    x?: number;
    y?: number;
    status?: 'available' | 'occupied' | 'reserved';
  }>;

  createdAt: Date;
  updatedAt: Date;

  // Methods
  isOpen(): boolean;
  calculateDistance(userCoordinates: [number, number]): number;
  isEligibleForDelivery(userCoordinates: [number, number]): boolean;
  updateRatings(): Promise<void>;
}

// Store Schema
const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
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
      maxlength: 1000,
    },
    logo: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    banner: {
      type: [String], // Array of banner image URLs
      default: [],
    },
    videos: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        thumbnail: {
          type: String,
          trim: true,
        },
        title: {
          type: String,
          trim: true,
          maxlength: 200,
        },
        duration: {
          type: Number,
          min: 0,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    location: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      pincode: {
        type: String,
        trim: true,
        match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function (v: number[] | null | undefined) {
            // Allow null/undefined/empty coordinates
            if (!v || v.length === 0) return true;
            return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
      deliveryRadius: {
        type: Number,
        default: 5, // 5 km default
        min: 0,
        max: 500, // Allow up to 500km for regional delivery
      },
      landmark: {
        type: String,
        trim: true,
      },
    },
    contact: {
      phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number'],
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      },
      website: {
        type: String,
        trim: true,
      },
      whatsapp: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid WhatsApp number'],
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
    offers: {
      cashback: {
        type: Number,
        min: 0,
        max: 100, // Percentage
      },
      minOrderAmount: {
        type: Number,
        min: 0,
      },
      maxCashback: {
        type: Number,
        min: 0,
      },
      discounts: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Offer',
        },
      ],
      isPartner: {
        type: Boolean,
        default: false,
      },
      partnerLevel: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
      },
    },
    operationalInfo: {
      hours: {
        monday: {
          open: String,
          close: String,
          closed: { type: Boolean, default: false },
        },
        tuesday: {
          open: String,
          close: String,
          closed: { type: Boolean, default: false },
        },
        wednesday: {
          open: String,
          close: String,
          closed: { type: Boolean, default: false },
        },
        thursday: {
          open: String,
          close: String,
          closed: { type: Boolean, default: false },
        },
        friday: {
          open: String,
          close: String,
          closed: { type: Boolean, default: false },
        },
        saturday: {
          open: String,
          close: String,
          closed: { type: Boolean, default: false },
        },
        sunday: {
          open: String,
          close: String,
          closed: { type: Boolean, default: false },
        },
      },
      deliveryTime: {
        type: String,
        default: '30-45 mins',
      },
      minimumOrder: {
        type: Number,
        default: 0,
        min: 0,
      },
      deliveryFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      freeDeliveryAbove: {
        type: Number,
        min: 0,
      },
      acceptsWalletPayment: {
        type: Boolean,
        default: true,
      },
      paymentMethods: {
        type: [String],
        enum: ['cash', 'card', 'upi', 'wallet', 'netbanking', 'bnpl', 'pay-later', 'installment'],
        default: ['upi', 'card', 'wallet', 'cash'],
      },
    },
    deliveryCategories: {
      fastDelivery: {
        type: Boolean,
        default: false,
      },
      budgetFriendly: {
        type: Boolean,
        default: false,
      },
      ninetyNineStore: {
        type: Boolean,
        default: false,
      },
      premium: {
        type: Boolean,
        default: false,
      },
      organic: {
        type: Boolean,
        default: false,
      },
      alliance: {
        type: Boolean,
        default: false,
      },
      lowestPrice: {
        type: Boolean,
        default: false,
      },
      mall: {
        type: Boolean,
        default: false,
      },
      cashStore: {
        type: Boolean,
        default: false,
      },
    },
    analytics: {
      totalOrders: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalRevenue: {
        type: Number,
        default: 0,
        min: 0,
      },
      avgOrderValue: {
        type: Number,
        default: 0,
        min: 0,
      },
      repeatCustomers: {
        type: Number,
        default: 0,
        min: 0,
      },
      followersCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      popularProducts: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
      peakHours: [String],
      monthlyStats: [
        {
          month: { type: Number, min: 1, max: 12 },
          year: { type: Number, min: 2000 },
          orders: { type: Number, default: 0 },
          revenue: { type: Number, default: 0 },
        },
      ],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant', // TODO: register Merchant model import before deploying (currently only lazy-resolved via mongoose.model('Merchant') in Bill.ts)
    },
    createdViaOnboarding: {
      type: Boolean,
      default: false,
    },

    // Menu fields
    hasMenu: {
      type: Boolean,
      default: false,
    },
    menuCategories: [
      {
        type: String,
        trim: true,
      },
    ],

    // Booking & Store Visit fields
    bookingType: {
      type: String,
      enum: ['RESTAURANT', 'SERVICE', 'CONSULTATION', 'RETAIL', 'HYBRID'],
      default: 'RETAIL',
    },
    bookingConfig: {
      enabled: { type: Boolean, default: false },
      requiresAdvanceBooking: { type: Boolean, default: false },
      allowWalkIn: { type: Boolean, default: true },
      slotDuration: { type: Number, default: 30 }, // minutes
      advanceBookingDays: { type: Number, default: 7 }, // days
      maxTableCapacity: { type: Number, default: 50 }, // max guests per time slot
      workingHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '21:00' },
      },
      tables: [
        {
          tableNumber: { type: String, required: true, trim: true },
          capacity: { type: Number, default: 4, min: 1, max: 20 },
          qrCodeUrl: { type: String },
          qrData: { type: String },
          isActive: { type: Boolean, default: true },
        },
      ],
      tableCount: { type: Number, default: 0, min: 0 },
    },
    storeVisitConfig: {
      enabled: { type: Boolean, default: false },
      features: [
        {
          type: String,
          enum: ['queue_system', 'visit_scheduling', 'live_availability'],
        },
      ],
      maxVisitorsPerSlot: { type: Number, default: 10 },
      averageVisitDuration: { type: Number, default: 30 }, // minutes
    },
    serviceTypes: [
      {
        type: String,
        trim: true,
      },
    ],
    consultationTypes: [
      {
        type: String,
        trim: true,
      },
    ],

    // Action buttons configuration for ProductPage
    actionButtons: {
      enabled: {
        type: Boolean,
        default: true,
      },
      buttons: [
        {
          id: {
            type: String,
            enum: ['call', 'product', 'location', 'custom'],
            required: true,
          },
          enabled: {
            type: Boolean,
            default: true,
          },
          label: {
            type: String,
            maxlength: 30,
            trim: true,
          },
          destination: {
            type: {
              type: String,
              enum: ['phone', 'url', 'maps', 'internal'],
            },
            value: {
              type: String,
              trim: true,
            },
          },
          order: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      ],
    },

    // QR Code Configuration for Store Payments
    storeQR: {
      code: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
        trim: true,
      },
      qrImageUrl: {
        type: String,
        trim: true,
      },
      generatedAt: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },

    // Payment Settings (Merchant Controls)
    paymentSettings: {
      // Payment Methods
      acceptUPI: {
        type: Boolean,
        default: true,
      },
      acceptCards: {
        type: Boolean,
        default: true,
      },
      acceptPayLater: {
        type: Boolean,
        default: false,
      },

      // Coin Settings
      acceptRezCoins: {
        type: Boolean,
        default: true,
      },
      acceptPromoCoins: {
        type: Boolean,
        default: true,
      },
      acceptPayBill: {
        type: Boolean,
        default: true,
      },
      maxCoinRedemptionPercent: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },

      // Hybrid Payment
      allowHybridPayment: {
        type: Boolean,
        default: true,
      },

      // Offers
      allowOffers: {
        type: Boolean,
        default: true,
      },
      allowCashback: {
        type: Boolean,
        default: true,
      },

      // UPI Details
      upiId: {
        type: String,
        trim: true,
      },
      upiName: {
        type: String,
        trim: true,
      },
    },

    // Estimated preparation / wait time shown on web menu (set by merchant or admin)
    estimatedPrepMinutes: {
      type: Number,
      default: 0, // 0 = not set, won't display
      min: 0,
      max: 180,
    },

    // REZ Merchant Program membership flag
    isProgramMerchant: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Reward Rules (Merchant Sets)
    rewardRules: {
      baseCashbackPercent: {
        type: Number,
        default: 0, // 0 = coins disabled (free tier). Set >0 when merchant joins REZ Program.
        min: 0,
        max: 100,
      },
      reviewBonusCoins: {
        type: Number,
        default: 5,
        min: 0,
      },
      reviewBonusCoinType: {
        type: String,
        enum: ['rez', 'branded'],
        default: 'branded',
      },
      socialShareBonusCoins: {
        type: Number,
        default: 10,
        min: 0,
      },
      minimumAmountForReward: {
        type: Number,
        default: 100,
        min: 0,
      },
      extraRewardThreshold: {
        type: Number,
        min: 0,
      },
      extraRewardCoins: {
        type: Number,
        min: 0,
      },
      firstVisitBonus: {
        type: Number,
        default: 0,
        min: 0,
      },
      visitMilestoneRewards: [
        {
          visits: {
            type: Number,
            required: true,
            min: 1,
          },
          coinsReward: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      // Scan-to-Earn (Sprint-2 growth feature). Merchant opts in, picks
      // first-scan bonus, repeat-scan coins, and a daily cap per customer.
      // See src/events/canonical/subscribers/scanRewardSubscriber.ts.
      scanToEarn: {
        enabled: { type: Boolean, default: false },
        firstScanBonus: { type: Number, default: 20, min: 0 },
        repeatScanCoins: { type: Number, default: 5, min: 0 },
        dailyCapPerCustomer: { type: Number, default: 1, min: 1 },
      },
    },

    // Service Capabilities - unified service type configuration
    serviceCapabilities: {
      homeDelivery: {
        enabled: { type: Boolean, default: false },
        deliveryRadius: { type: Number, min: 0 },
        minOrder: { type: Number, min: 0 },
        deliveryFee: { type: Number, min: 0 },
        freeDeliveryAbove: { type: Number, min: 0 },
        estimatedTime: { type: String, trim: true },
      },
      driveThru: {
        enabled: { type: Boolean, default: false },
        estimatedTime: { type: String, trim: true },
        menuType: { type: String, enum: ['full', 'limited'], default: 'full' },
      },
      tableBooking: {
        enabled: { type: Boolean, default: false },
      },
      dineIn: {
        enabled: { type: Boolean, default: false },
      },
      storePickup: {
        enabled: { type: Boolean, default: false },
        estimatedTime: { type: String, trim: true },
      },
    },

    // Category page metadata
    is60MinDelivery: {
      type: Boolean,
      default: false,
    },
    hasStorePickup: {
      type: Boolean,
      default: false,
    },
    priceForTwo: {
      type: Number,
      min: 0,
      default: 350, // Default average price for two
    },

    // Admin Control Fields
    adminApproved: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    adminApprovedAt: {
      type: Date,
    },
    adminApprovedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },

    // GST and Tax Information
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format'],
      sparse: true,
    },
    gstRate: {
      type: Number,
      enum: [0, 5, 12, 18, 28],
      default: 18,
    },

    // Multi-outlet fields
    outletCode: { type: String },
    outletCity: { type: String },
    isPrimaryOutlet: { type: Boolean, default: false },

    // Table Management
    totalTables: {
      type: Number,
      default: 10,
    },
    tableConfig: [
      {
        tableNumber: { type: Number },
        capacity: { type: Number, default: 4 },
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
      },
    ],

    // REZ Now page config — writable via GET/PATCH /merchant/rez-now-config
    storeType: {
      type: String,
      trim: true,
      enum: ['restaurant', 'cafe', 'bakery', 'salon', 'spa', 'retail', 'other'],
    },
    fssaiNumber: {
      type: String,
      trim: true,
      match: [/^\d{14}$/, 'fssaiNumber must be exactly 14 digits'],
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        'gstNumber must be a valid 15-character GST identification number',
      ],
    },
    instagramHandle: {
      type: String,
      trim: true,
    },
    facebookUrl: {
      type: String,
      trim: true,
    },
    twitterHandle: {
      type: String,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
    acceptsOnlineOrders: {
      type: Boolean,
    },
    acceptsScanPay: {
      type: Boolean,
    },
    showLoyaltyStamps: {
      type: Boolean,
    },

    // Table Reservation (REZ Now)
    reservationsEnabled: {
      type: Boolean,
      default: false,
    },
    maxTableCapacity: {
      type: Number,
      default: 50,
      min: 1,
    },

    // REZ Now delivery config
    deliveryEnabled: {
      type: Boolean,
      default: false,
    },
    deliveryRadiusKm: {
      type: Number,
      default: 5,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    storeLatitude: {
      type: Number,
    },
    storeLongitude: {
      type: Number,
    },

    // Google Maps Place ID — used to build a direct review URL in the web menu
    googlePlaceId: {
      type: String,
      trim: true,
    },

    // Promotional banners shown in the web-ordering menu (ad banners)
    promotions: [
      {
        title: { type: String, required: true, trim: true, maxlength: 120 },
        subtitle: { type: String, trim: true, maxlength: 200 },
        image: { type: String, trim: true },
        backgroundColor: { type: String, trim: true, default: '#1e3a5f' },
        actionText: { type: String, trim: true, maxlength: 40 },
        actionUrl: { type: String, trim: true },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance - SCALEPILOT OPTIMIZED
// Unique indexes

// Geospatial for location-based queries
StoreSchema.index({ 'location.coordinates': '2dsphere' });

// Critical single-field indexes
StoreSchema.index({ category: 1, isActive: 1 });
StoreSchema.index({ 'location.city': 1, isActive: 1 });
StoreSchema.index({ 'location.pincode': 1 });
StoreSchema.index({ 'ratings.average': -1, isActive: 1 });
StoreSchema.index({ tags: 1, isActive: 1 });
StoreSchema.index({ createdAt: -1 });
StoreSchema.index({ hasMenu: 1, isActive: 1 }); // Menu index
StoreSchema.index({ bookingType: 1, isActive: 1 }); // Booking type index
StoreSchema.index({ merchantId: 1 }); // Merchant lookups
StoreSchema.index({ 'paymentSettings.upiId': 1 }); // UPI ID lookup index

// FIX: Missing compound indexes for common queries
StoreSchema.index({ isActive: 1, merchantId: 1, createdAt: -1 }); // Merchant store listing
StoreSchema.index({ isActive: 1, 'location.city': 1, 'ratings.average': -1 }); // City ranking
StoreSchema.index({ isActive: 1, bookingType: 1, createdAt: -1 }); // Booking type timeline
StoreSchema.index({ isSuspended: 1, createdAt: -1 }); // Suspension tracking
StoreSchema.index({ slug: 1 }); // Slug-based lookups
StoreSchema.index({ isProgramMerchant: 1, isActive: 1 }); // Program merchant filtering

// Service capability indexes (kept high-traffic, removed driveThru + storePickup — low usage)
StoreSchema.index({ 'serviceCapabilities.homeDelivery.enabled': 1, category: 1, isActive: 1, 'ratings.average': -1 });
StoreSchema.index({ 'serviceCapabilities.tableBooking.enabled': 1, category: 1, isActive: 1 });
StoreSchema.index({ 'serviceCapabilities.dineIn.enabled': 1, category: 1, isActive: 1 });

// Delivery category indexes (kept high-traffic, removed budgetFriendly/organic/alliance/lowestPrice — low usage, covered by collection scans)
StoreSchema.index({ 'deliveryCategories.fastDelivery': 1, isActive: 1 });
StoreSchema.index({ 'deliveryCategories.premium': 1, isActive: 1 });
StoreSchema.index({ 'deliveryCategories.mall': 1, isActive: 1 });
StoreSchema.index({ 'deliveryCategories.cashStore': 1, isActive: 1 });

// Compound indexes
StoreSchema.index({ category: 1, 'location.city': 1, isActive: 1 });
StoreSchema.index({ 'offers.isPartner': 1, 'ratings.average': -1 });

// Homepage query indexes
StoreSchema.index({ isActive: 1, 'analytics.totalOrders': -1, 'ratings.average': -1 }); // trending stores
StoreSchema.index({ isActive: 1, isFeatured: 1, 'ratings.average': -1 }); // featured stores sorted by rating

// Mall tab compound indexes (optimizes mallService.ts queries)
StoreSchema.index({
  'deliveryCategories.mall': 1,
  isActive: 1,
  adminApproved: 1,
  isFeatured: 1,
  'ratings.average': -1,
}); // featured mall stores
StoreSchema.index({ 'deliveryCategories.mall': 1, isActive: 1, adminApproved: 1, createdAt: -1 }); // new mall stores
StoreSchema.index({
  'deliveryCategories.mall': 1,
  isActive: 1,
  adminApproved: 1,
  'ratings.count': 1,
  'ratings.average': -1,
}); // top rated mall stores
StoreSchema.index({ 'deliveryCategories.mall': 1, 'deliveryCategories.premium': 1, isActive: 1, adminApproved: 1 }); // premium mall stores
StoreSchema.index({ 'deliveryCategories.mall': 1, isActive: 1, adminApproved: 1, 'analytics.totalOrders': -1 }); // trending mall stores
StoreSchema.index({ 'deliveryCategories.mall': 1, isActive: 1, 'offers.cashback': -1 }); // reward booster stores
StoreSchema.index({ 'deliveryCategories.mall': 1, category: 1, isActive: 1, adminApproved: 1, 'ratings.average': -1 }); // mall stores by category
StoreSchema.index({ 'deliveryCategories.alliance': 1, isActive: 1, 'ratings.average': -1 }); // alliance stores

// Text index for search (replaces slow $regex searches)
StoreSchema.index(
  { name: 'text', description: 'text', tags: 'text' },
  { weights: { name: 10, tags: 5, description: 1 }, name: 'store_text_search' },
);

// Virtual for current operational status
StoreSchema.virtual('isCurrentlyOpen').get(function () {
  if (typeof this.isOpen === 'function') {
    return this.isOpen();
  }
  // Fallback: inline check when isOpen method is not available (e.g., plain object context)
  try {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);
    const hours = this.operationalInfo?.hours as Record<string, any> | undefined;
    if (!hours) return false;
    const todayHours = hours[dayName] || hours[dayName.charAt(0).toUpperCase() + dayName.slice(1)];
    if (!todayHours || todayHours.closed) return false;
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  } catch (_e) {
    return false;
  }
});

// Pre-save hook to generate slug
StoreSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  next();
});

// CROSS-SERVICE COMPAT: The `stores` collection is shared with
// rez-merchant-service, whose Store model uses `merchant` (not `merchantId`)
// as the foreign key to Merchant. Any doc written by either service only
// has ONE of the two fields populated, which breaks all cross-service
// queries that filter by ownership. This hook keeps both fields in sync
// on every save so legacy queries keep working regardless of which service
// wrote the doc. Combined with the reverse hook in rez-merchant-service
// and a one-time backfill, this closes the 102-file drift gap.
StoreSchema.pre('save', function (this: any, next) {
  if (this.merchantId && !this.merchant) this.merchant = this.merchantId;
  if (this.merchant && !this.merchantId) this.merchantId = this.merchant;
  next();
});

// Pre-save hook to keep legacy fields in sync with serviceCapabilities
StoreSchema.pre('save', function (this: any, next) {
  if (this.isModified('serviceCapabilities')) {
    const caps = this.serviceCapabilities;

    // Sync tableBooking -> bookingConfig.enabled
    if (caps?.tableBooking && this.bookingConfig) {
      this.bookingConfig.enabled = caps.tableBooking.enabled;
    }

    // Sync storePickup -> hasStorePickup
    if (caps?.storePickup !== undefined) {
      this.hasStorePickup = !!caps.storePickup.enabled;
    }

    // Sync homeDelivery -> is60MinDelivery flag
    if (caps?.homeDelivery !== undefined) {
      if (caps.homeDelivery.enabled && !this.is60MinDelivery) {
        this.is60MinDelivery = true;
      }
    }

    // Sync dineIn -> bookingType (only set if not already set)
    if (caps?.dineIn?.enabled && !this.bookingType) {
      this.bookingType = 'RESTAURANT';
    }
  }
  next();
});

// Post-save hook to update parent Category's materialized store count
// Uses pre-save tracking to only update when category or isActive actually changed
StoreSchema.pre('save', function (this: any, next) {
  // Track whether category or isActive was modified for post-save hook
  this._categoryChanged = this.isNew || this.isModified('category') || this.isModified('isActive');
  this._prevCategory = this.isModified('category') ? this._original?.category : null;
  next();
});

StoreSchema.post('save', async function (doc: any) {
  try {
    if (!doc._categoryChanged) return;
    if (doc.category) {
      const StoreModel = mongoose.model('Store');
      const CategoryModel = mongoose.model('Category');
      const count = await StoreModel.countDocuments({ category: doc.category, isActive: true });
      await CategoryModel.findByIdAndUpdate(doc.category, { storeCount: count });
    }
    // If category changed, also update old category's count
    if (doc._prevCategory && doc._prevCategory.toString() !== doc.category?.toString()) {
      const StoreModel = mongoose.model('Store');
      const CategoryModel = mongoose.model('Category');
      const oldCount = await StoreModel.countDocuments({ category: doc._prevCategory, isActive: true });
      await CategoryModel.findByIdAndUpdate(doc._prevCategory, { storeCount: oldCount });
    }
  } catch (err) {
    logger.error('Error updating store count after save:', err);
  }
});

// Post-findOneAndDelete hook to update parent Category's materialized store count
StoreSchema.post('findOneAndDelete', async function (doc: any) {
  try {
    if (doc && doc.category) {
      const StoreModel = mongoose.model('Store');
      const Category = mongoose.model('Category');
      const count = await StoreModel.countDocuments({ category: doc.category, isActive: true });
      await Category.findByIdAndUpdate(doc.category, { storeCount: count });
    }
  } catch (err) {
    logger.error('Error updating store count after delete:', err);
  }
});

// Method to check if store is currently open
StoreSchema.methods.isOpen = function (): boolean {
  try {
    const now = new Date();
    const hours = this.operationalInfo?.hours;
    if (!hours) return false;

    // Support both lowercase ("monday") and capitalized ("Monday") day name keys
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const todayHours = hours[dayName] || hours[dayName.charAt(0).toUpperCase() + dayName.slice(1)];
    if (!todayHours || todayHours.closed) {
      return false;
    }

    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  } catch (_e) {
    return false;
  }
};

// Method to calculate distance from user coordinates
StoreSchema.methods.calculateDistance = function (userCoordinates: [number, number]): number {
  if (!this.location.coordinates) return Infinity;

  const [lon1, lat1] = userCoordinates;
  const [lon2, lat2] = this.location.coordinates;

  const R = 6371; // Radius of Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// Method to check delivery eligibility
StoreSchema.methods.isEligibleForDelivery = function (userCoordinates: [number, number]): boolean {
  const distance = this.calculateDistance(userCoordinates);
  return distance <= (this.location.deliveryRadius || 5);
};

// Method to update ratings
StoreSchema.methods.updateRatings = async function (): Promise<void> {
  const Review = this.model('Review');
  const reviews = await Review.find({
    targetType: 'Store',
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
};

// Static method to find nearby stores
StoreSchema.statics.findNearby = function (coordinates: [number, number], radius: number = 10, options: any = {}) {
  const query: any = {
    'location.coordinates': {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates,
        },
        $maxDistance: radius * 1000, // Convert km to meters
      },
    },
    isActive: true,
  };

  if (options.category) {
    query.category = options.category;
  }

  if (options.isPartner !== undefined) {
    query['offers.isPartner'] = options.isPartner;
  }

  return this.find(query)
    .populate('category')
    .sort({ 'ratings.average': -1 })
    .limit(options.limit || 50);
};

// Static method to get featured stores
StoreSchema.statics.getFeatured = function (limit: number = 10) {
  return this.find({
    isFeatured: true,
    isActive: true,
  })
    .populate('category')
    .sort({ 'ratings.average': -1 })
    .limit(limit);
};

// Use existing model if already registered, otherwise create new one
// Delete cached model to force schema update (for development)
if (mongoose.models.Store) {
  delete mongoose.models.Store;
}
export const Store = mongoose.model<IStore>('Store', StoreSchema);
