import mongoose, { Document, Schema, Model } from 'mongoose';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum ValueSegment {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ChurnRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
}

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  TABLET = 'tablet',
}

export enum PaymentMethod {
  CARD = 'card',
  WALLET = 'wallet',
  COD = 'cod',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
}

export enum CuisineType {
  ITALIAN = 'italian',
  CHINESE = 'chinese',
  INDIAN = 'indian',
  MEXICAN = 'mexican',
  JAPANESE = 'japanese',
  THAI = 'thai',
  AMERICAN = 'american',
  MEDITERRANEAN = 'mediterranean',
  KOREAN = 'korean',
  VIETNAMESE = 'vietnamese',
  FRENCH = 'french',
  MIDDLE_EASTERN = 'middle_eastern',
  OTHER = 'other',
}

export enum OrderFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  OCCASIONAL = 'occasional',
}

export enum EventType {
  // Transaction Events
  ORDER_PLACED = 'order_placed',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_REFUNDED = 'order_refunded',

  // Search Events
  SEARCH_QUERY = 'search_query',
  SEARCH_RESULT_CLICKED = 'search_result_clicked',
  SEARCH_FILTER_APPLIED = 'search_filter_applied',

  // Feedback Events
  RATING_GIVEN = 'rating_given',
  REVIEW_WRITTEN = 'review_written',
  COMPLAINT_FILED = 'complaint_filed',

  // Intent Signals
  ITEM_VIEWED = 'item_viewed',
  ITEM_ADDED_TO_CART = 'item_added_to_cart',
  ITEM_REMOVED_FROM_CART = 'item_removed_from_cart',
  CART_ABANDONED = 'cart_abandoned',
  ITEM_ADDED_TO_WISHLIST = 'item_added_to_wishlist',
  ITEM_REMOVED_FROM_WISHLIST = 'item_removed_from_wishlist',

  // Engagement Events
  APP_OPENED = 'app_opened',
  APP_CLOSED = 'app_closed',
  PAGE_VIEWED = 'page_viewed',
  FEATURE_USED = 'feature_used',
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',

  // User Actions
  PROFILE_UPDATED = 'profile_updated',
  PAYMENT_METHOD_ADDED = 'payment_method_added',
  ADDRESS_ADDED = 'address_added',
  NOTIFICATION_ENABLED = 'notification_enabled',
  NOTIFICATION_DISABLED = 'notification_disabled',

  // Life Events
  BIRTHDAY_SET = 'birthday_set',
  WORK_SCHEDULE_UPDATED = 'work_schedule_updated',
}

// ============================================================================
// SUB-SCHEMA DEFINITIONS
// ============================================================================

// Transaction Sub-Schema
export interface ITransaction {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    category: string;
  }>;
  totalAmount: number;
  tip: number;
  deliveryFee: number;
  taxes: number;
  discounts: number;
  finalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded';
  paymentMethod: PaymentMethod;
  orderType: 'delivery' | 'pickup' | 'dine_in';
  specialInstructions?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  completedAt?: Date;
}

// Search Behavior Sub-Schema
export interface ISearchQuery {
  queryId: string;
  query: string;
  filters: {
    cuisine?: CuisineType[];
    priceRange?: [number, number];
    rating?: number;
    deliveryTime?: number;
    distance?: number;
  };
  resultsCount: number;
  resultsClicked: Array<{
    resultIndex: number;
    itemId: string;
    itemName: string;
    position: number;
    timestamp: Date;
  }>;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  sessionId: string;
  deviceType: DeviceType;
  timestamp: Date;
}

// Feedback Sub-Schema
export interface IFeedback {
  feedbackId: string;
  type: 'rating' | 'review' | 'complaint' | 'suggestion';
  targetType: 'order' | 'restaurant' | 'item' | 'delivery' | 'app';
  targetId: string;
  rating?: number;
  title?: string;
  comment?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  tags?: string[];
  images?: string[];
  response?: {
    text: string;
    respondedAt: Date;
    responderId: string;
  };
  isPublic: boolean;
  createdAt: Date;
}

// Preferences Sub-Schema
export interface IPreferences {
  cuisinePreferences: Array<{
    cuisine: CuisineType;
    score: number; // 0-100 preference score
    orderCount: number;
    lastOrdered?: Date;
  }>;
  priceRange: {
    min: number;
    max: number;
    preferred: number;
  };
  dietaryRestrictions: string[];
  allergenAvoidances: string[];
  favoriteRestaurants: Array<{
    restaurantId: string;
    visitCount: number;
    avgOrderValue: number;
    lastVisit: Date;
  }>;
  preferredOrderTime: {
    dayOfWeek: number[];
    timeRange: { start: string; end: string };
    typicalTime: string;
  };
  deliveryPreferences: {
    leaveAtDoor: boolean;
    contactlessDelivery: boolean;
    ringBell: boolean;
    gateCode?: string;
    deliveryInstructions?: string;
  };
  notificationPreferences: {
    orderUpdates: boolean;
    promotions: boolean;
    recommendations: boolean;
    newsletters: boolean;
    channels: NotificationChannel[];
  };
}

// Behavior Pattern Sub-Schema
export interface IBehaviorPattern {
  orderFrequency: OrderFrequency;
  averageOrderValue: number;
  orderValueRange: { min: number; max: number };
  typicalOrderDays: number[]; // 0-6, Sunday = 0
  typicalOrderTimes: string[]; // HH:mm format
  preferredDevice: DeviceType;
  deviceUsage: {
    [key in DeviceType]?: {
      sessions: number;
      lastUsed: Date;
    };
  };
  preferredPaymentMethod: PaymentMethod;
  paymentMethodUsage: {
    [key in PaymentMethod]?: {
      transactions: number;
      lastUsed: Date;
    };
  };
  sessionPatterns: {
    avgSessionDuration: number; // in seconds
    avgPagesPerSession: number;
    avgOrdersPerSession: number;
    peakActivityHours: number[];
  };
  weekendVsWeekday: {
    weekendOrders: number;
    weekdayOrders: number;
    weekendAvgOrderValue: number;
    weekdayAvgOrderValue: number;
  };
}

// Intent Signals Sub-Schema
export interface IIntentSignal {
  signalId: string;
  type: 'browsing' | 'cart_action' | 'wishlist' | 'price_watch' | 'comparison';
  itemId?: string;
  restaurantId?: string;
  category?: string;
  action: 'viewed' | 'added' | 'removed' | 'updated' | 'abandoned';
  metadata: {
    price?: number;
    originalPrice?: number;
    discount?: number;
    quantity?: number;
    sessionId?: string;
    source?: 'search' | 'recommendation' | 'direct' | 'social';
  };
  dwellTime?: number; // seconds
  scrollDepth?: number; // 0-100
  intentScore?: number; // 0-100
  timestamp: Date;
}

// Engagement Metrics Sub-Schema
export interface IEngagementMetrics {
  totalSessions: number;
  totalActiveDays: number;
  firstSessionAt?: Date;
  lastSessionAt?: Date;
  avgSessionsPerWeek: number;
  avgSessionsPerMonth: number;
  avgSessionDuration: number;
  totalPageViews: number;
  avgPageViewsPerSession: number;
  featureUsage: {
    [featureName: string]: {
      count: number;
      lastUsed: Date;
    };
  };
  pushNotificationStats: {
    sent: number;
    opened: number;
    clicked: number;
    conversionRate: number;
  };
  retentionMetrics: {
    d1: number; // Day 1 retention
    d7: number; // Day 7 retention
    d30: number; // Day 30 retention
    d90: number; // Day 90 retention
  };
  growthMetrics: {
    ordersTrend: 'increasing' | 'stable' | 'decreasing';
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
    valueTrend: 'increasing' | 'stable' | 'decreasing';
  };
}

// Inferred Demographics Sub-Schema
export interface IInferredDemographics {
  inferredAgeRange?: {
    min: number;
    max: number;
    confidence: number; // 0-100
  };
  inferredGender?: {
    value: string;
    confidence: number;
  };
  inferredLocation?: {
    type: 'home' | 'work' | 'other';
    coordinates?: [number, number];
    neighborhood?: string;
    city?: string;
    confidence: number;
  };
  inferredIncomeBracket?: {
    bracket: string;
    confidence: number;
  };
  inferredFamilyStatus?: {
    status: 'single' | 'couple' | 'family_with_kids' | 'unknown';
    confidence: number;
  };
  inferredInterests: Array<{
    category: string;
    score: number;
  }>;
  inferredLifestyle: {
    healthConscious: number; // 0-100
    convenienceOriented: number; // 0-100
    priceSensitive: number; // 0-100
    brandLoyal: number; // 0-100
    experimental: number; // 0-100
  };
  dataSources: string[]; // Which sources contributed to inference
  lastInferredAt: Date;
}

// Life Events Sub-Schema
export interface ILifeEvent {
  eventId: string;
  type: 'birthday' | 'anniversary' | 'work_schedule_change' | 'location_change' | 'lifestyle_change';
  eventDate?: Date;
  description?: string;
  detectedFrom: 'explicit' | 'inferred';
  confidence: number;
  createdAt: Date;
  updatedAt?: Date;
}

// Behavioral Scores Sub-Schema
export interface IBehavioralScores {
  engagementScore: number; // 0-100
  engagementBreakdown: {
    searchActivity: number;
    transactionActivity: number;
    feedbackActivity: number;
    appEngagement: number;
  };
  valueSegment: ValueSegment;
  churnRisk: ChurnRisk;
  churnRiskFactors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  upsellOpportunity: boolean;
  upsellOpportunityReason?: string;
  preferredChannels: NotificationChannel[];
  channelPreferences: {
    [key in NotificationChannel]?: {
      engagementRate: number;
      lastUsed?: Date;
    };
  };
  healthScore: number; // 0-100, overall user health
  npsScore?: number; // Net Promoter Score if available
  lastCalculatedAt: Date;
}

// Event History for Real-time Tracking
export interface IEventHistory {
  eventId: string;
  eventType: EventType;
  payload: Record<string, unknown>;
  source: string;
  timestamp: Date;
  processedAt?: Date;
}

// Push Tokens Sub-Schema
export interface IPushToken {
  tokenId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  deviceName?: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  invalidatedAt?: Date;
}

// ============================================================================
// MAIN USER PROFILE DOCUMENT INTERFACE
// ============================================================================

export interface IUserProfile extends Document {
  // Core Identifiers
  userId: string;
  externalUserId?: string; // ID from other services

  // Profile Information
  profile: {
    email?: string;
    phone?: string;
    displayName?: string;
    avatarUrl?: string;
    accountCreatedAt: Date;
    accountVerified: boolean;
    accountStatus: 'active' | 'suspended' | 'deactivated' | 'pending_verification';
  };

  // Behavioral Data Collections
  transactions: ITransaction[];
  searchHistory: ISearchQuery[];
  feedback: IFeedback[];
  preferences: IPreferences;
  behaviorPatterns: IBehaviorPattern;
  intentSignals: IIntentSignal[];
  engagementMetrics: IEngagementMetrics;
  inferredDemographics: IInferredDemographics;
  lifeEvents: ILifeEvent[];
  behavioralScores: IBehavioralScores;
  eventHistory: IEventHistory[];
  pushTokens: IPushToken[];

  // Computed Fields
  lifetimeValue: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    firstOrderDate?: Date;
    lastOrderDate?: Date;
    predictedLifetimeValue: number;
    lastCalculatedAt: Date;
  };

  // Metadata
  metadata: {
    dataFreshness: {
      profileLastUpdated: Date;
      preferencesLastUpdated: Date;
      scoresLastUpdated: Date;
    };
    dataCompleteness: number; // 0-100
    privacySettings: {
      dataCollectionEnabled: boolean;
      analyticsEnabled: boolean;
      personalizationEnabled: boolean;
      marketingConsent: boolean;
      thirdPartySharing: boolean;
    };
    tags: string[];
    segments: string[];
    sources: string[]; // Which services contributed data
  };

  // Versioning for optimistic concurrency
  version: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

const PushTokenSchema = new Schema<IPushToken>({
  tokenId: { type: String, required: true },
  token: { type: String, required: true },
  platform: { type: String, enum: ['ios', 'android', 'web'], required: true },
  deviceId: { type: String },
  deviceName: { type: String },
  isActive: { type: Boolean, default: true },
  lastUsedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  invalidatedAt: { type: Date },
});

const EventHistorySchema = new Schema<IEventHistory>({
  eventId: { type: String, required: true, index: true },
  eventType: { type: String, enum: Object.values(EventType), required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  source: { type: String, required: true },
  timestamp: { type: Date, required: true, index: true },
  processedAt: { type: Date },
}, { _id: false });

const UserProfileSchema = new Schema<IUserProfile>({
  // Core Identifiers
  userId: { type: String, required: true, unique: true, index: true },
  externalUserId: { type: String, sparse: true, index: true },

  // Profile Information
  profile: {
    email: { type: String },
    phone: { type: String },
    displayName: { type: String },
    avatarUrl: { type: String },
    accountCreatedAt: { type: Date, required: true },
    accountVerified: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'deactivated', 'pending_verification'],
      default: 'active'
    },
  },

  // Behavioral Data Collections
  transactions: [{
    orderId: { type: String, required: true },
    restaurantId: { type: String, required: true },
    restaurantName: { type: String, required: true },
    items: [{
      itemId: { type: String, required: true },
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      category: { type: String },
    }],
    totalAmount: { type: Number, required: true },
    tip: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discounts: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
      required: true
    },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },
    orderType: { type: String, enum: ['delivery', 'pickup', 'dine_in'], required: true },
    specialInstructions: { type: String },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    createdAt: { type: Date, required: true },
    completedAt: { type: Date },
  }],

  searchHistory: [{
    queryId: { type: String, required: true },
    query: { type: String, required: true },
    filters: {
      cuisine: [{ type: String }],
      priceRange: [{ type: Number }],
      rating: { type: Number },
      deliveryTime: { type: Number },
      distance: { type: Number },
    },
    resultsCount: { type: Number, required: true },
    resultsClicked: [{
      resultIndex: { type: Number },
      itemId: { type: String },
      itemName: { type: String },
      position: { type: Number },
      timestamp: { type: Date },
    }],
    timeOfDay: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'] },
    dayOfWeek: { type: Number },
    sessionId: { type: String },
    deviceType: { type: String, enum: Object.values(DeviceType) },
    timestamp: { type: Date, required: true },
  }],

  feedback: [{
    feedbackId: { type: String, required: true },
    type: { type: String, enum: ['rating', 'review', 'complaint', 'suggestion'], required: true },
    targetType: { type: String, enum: ['order', 'restaurant', 'item', 'delivery', 'app'], required: true },
    targetId: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    tags: [{ type: String }],
    images: [{ type: String }],
    response: {
      text: { type: String },
      respondedAt: { type: Date },
      responderId: { type: String },
    },
    isPublic: { type: Boolean, default: false },
    createdAt: { type: Date, required: true },
  }],

  preferences: {
    cuisinePreferences: [{
      cuisine: { type: String, enum: Object.values(CuisineType), required: true },
      score: { type: Number, default: 0, min: 0, max: 100 },
      orderCount: { type: Number, default: 0 },
      lastOrdered: { type: Date },
    }],
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100 },
      preferred: { type: Number, default: 30 },
    },
    dietaryRestrictions: [{ type: String }],
    allergenAvoidances: [{ type: String }],
    favoriteRestaurants: [{
      restaurantId: { type: String, required: true },
      visitCount: { type: Number, default: 1 },
      avgOrderValue: { type: Number, default: 0 },
      lastVisit: { type: Date },
    }],
    preferredOrderTime: {
      dayOfWeek: [{ type: Number }],
      timeRange: {
        start: { type: String, default: '11:00' },
        end: { type: String, default: '22:00' },
      },
      typicalTime: { type: String },
    },
    deliveryPreferences: {
      leaveAtDoor: { type: Boolean, default: false },
      contactlessDelivery: { type: Boolean, default: true },
      ringBell: { type: Boolean, default: true },
      gateCode: { type: String },
      deliveryInstructions: { type: String },
    },
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
      newsletters: { type: Boolean, default: false },
      channels: [{ type: String, enum: Object.values(NotificationChannel) }],
    },
  },

  behaviorPatterns: {
    orderFrequency: { type: String, enum: Object.values(OrderFrequency), default: 'occasional' },
    averageOrderValue: { type: Number, default: 0 },
    orderValueRange: { min: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
    typicalOrderDays: [{ type: Number }],
    typicalOrderTimes: [{ type: String }],
    preferredDevice: { type: String, enum: Object.values(DeviceType), default: 'ios' },
    deviceUsage: {
      ios: { sessions: { type: Number, default: 0 }, lastUsed: { type: Date } },
      android: { sessions: { type: Number, default: 0 }, lastUsed: { type: Date } },
      web: { sessions: { type: Number, default: 0 }, lastUsed: { type: Date } },
      tablet: { sessions: { type: Number, default: 0 }, lastUsed: { type: Date } },
    },
    preferredPaymentMethod: { type: String, enum: Object.values(PaymentMethod), default: 'card' },
    paymentMethodUsage: {
      card: { transactions: { type: Number, default: 0 }, lastUsed: { type: Date } },
      wallet: { transactions: { type: Number, default: 0 }, lastUsed: { type: Date } },
      cod: { transactions: { type: Number, default: 0 }, lastUsed: { type: Date } },
      upi: { transactions: { type: Number, default: 0 }, lastUsed: { type: Date } },
      bank_transfer: { transactions: { type: Number, default: 0 }, lastUsed: { type: Date } },
    },
    sessionPatterns: {
      avgSessionDuration: { type: Number, default: 0 },
      avgPagesPerSession: { type: Number, default: 0 },
      avgOrdersPerSession: { type: Number, default: 0 },
      peakActivityHours: [{ type: Number }],
    },
    weekendVsWeekday: {
      weekendOrders: { type: Number, default: 0 },
      weekdayOrders: { type: Number, default: 0 },
      weekendAvgOrderValue: { type: Number, default: 0 },
      weekdayAvgOrderValue: { type: Number, default: 0 },
    },
  },

  intentSignals: [{
    signalId: { type: String, required: true },
    type: { type: String, enum: ['browsing', 'cart_action', 'wishlist', 'price_watch', 'comparison'], required: true },
    itemId: { type: String },
    restaurantId: { type: String },
    category: { type: String },
    action: { type: String, enum: ['viewed', 'added', 'removed', 'updated', 'abandoned'], required: true },
    metadata: {
      price: { type: Number },
      originalPrice: { type: Number },
      discount: { type: Number },
      quantity: { type: Number },
      sessionId: { type: String },
      source: { type: String },
    },
    dwellTime: { type: Number },
    scrollDepth: { type: Number },
    intentScore: { type: Number },
    timestamp: { type: Date, required: true },
  }],

  engagementMetrics: {
    totalSessions: { type: Number, default: 0 },
    totalActiveDays: { type: Number, default: 0 },
    firstSessionAt: { type: Date },
    lastSessionAt: { type: Date },
    avgSessionsPerWeek: { type: Number, default: 0 },
    avgSessionsPerMonth: { type: Number, default: 0 },
    avgSessionDuration: { type: Number, default: 0 },
    totalPageViews: { type: Number, default: 0 },
    avgPageViewsPerSession: { type: Number, default: 0 },
    featureUsage: {
      type: Map,
      of: {
        count: { type: Number, default: 0 },
        lastUsed: { type: Date },
      },
    },
    pushNotificationStats: {
      sent: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
    },
    retentionMetrics: {
      d1: { type: Number, default: 0 },
      d7: { type: Number, default: 0 },
      d30: { type: Number, default: 0 },
      d90: { type: Number, default: 0 },
    },
    growthMetrics: {
      ordersTrend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' },
      engagementTrend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' },
      valueTrend: { type: String, enum: ['increasing', 'stable', 'decreasing'], default: 'stable' },
    },
  },

  inferredDemographics: {
    inferredAgeRange: {
      min: { type: Number },
      max: { type: Number },
      confidence: { type: Number },
    },
    inferredGender: {
      value: { type: String },
      confidence: { type: Number },
    },
    inferredLocation: {
      type: { type: String, enum: ['home', 'work', 'other'] },
      coordinates: [{ type: Number }],
      neighborhood: { type: String },
      city: { type: String },
      confidence: { type: Number },
    },
    inferredIncomeBracket: {
      bracket: { type: String },
      confidence: { type: Number },
    },
    inferredFamilyStatus: {
      status: { type: String, enum: ['single', 'couple', 'family_with_kids', 'unknown'] },
      confidence: { type: Number },
    },
    inferredInterests: [{
      category: { type: String, required: true },
      score: { type: Number, required: true },
    }],
    inferredLifestyle: {
      healthConscious: { type: Number, default: 50 },
      convenienceOriented: { type: Number, default: 50 },
      priceSensitive: { type: Number, default: 50 },
      brandLoyal: { type: Number, default: 50 },
      experimental: { type: Number, default: 50 },
    },
    dataSources: [{ type: String }],
    lastInferredAt: { type: Date },
  },

  lifeEvents: [{
    eventId: { type: String, required: true },
    type: {
      type: String,
      enum: ['birthday', 'anniversary', 'work_schedule_change', 'location_change', 'lifestyle_change'],
      required: true
    },
    eventDate: { type: Date },
    description: { type: String },
    detectedFrom: { type: String, enum: ['explicit', 'inferred'], required: true },
    confidence: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date },
  }],

  behavioralScores: {
    engagementScore: { type: Number, default: 0, min: 0, max: 100 },
    engagementBreakdown: {
      searchActivity: { type: Number, default: 0 },
      transactionActivity: { type: Number, default: 0 },
      feedbackActivity: { type: Number, default: 0 },
      appEngagement: { type: Number, default: 0 },
    },
    valueSegment: { type: String, enum: Object.values(ValueSegment), default: 'medium' },
    churnRisk: { type: String, enum: Object.values(ChurnRisk), default: 'medium' },
    churnRiskFactors: [{
      factor: { type: String, required: true },
      weight: { type: Number, required: true },
      description: { type: String },
    }],
    upsellOpportunity: { type: Boolean, default: false },
    upsellOpportunityReason: { type: String },
    preferredChannels: [{ type: String, enum: Object.values(NotificationChannel) }],
    channelPreferences: {
      push: { engagementRate: { type: Number }, lastUsed: { type: Date } },
      email: { engagementRate: { type: Number }, lastUsed: { type: Date } },
      sms: { engagementRate: { type: Number }, lastUsed: { type: Date } },
    },
    healthScore: { type: Number, default: 50, min: 0, max: 100 },
    npsScore: { type: Number },
    lastCalculatedAt: { type: Date },
  },

  eventHistory: [EventHistorySchema],
  pushTokens: [PushTokenSchema],

  // Computed Fields
  lifetimeValue: {
    totalRevenue: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    firstOrderDate: { type: Date },
    lastOrderDate: { type: Date },
    predictedLifetimeValue: { type: Number, default: 0 },
    lastCalculatedAt: { type: Date },
  },

  // Metadata
  metadata: {
    dataFreshness: {
      profileLastUpdated: { type: Date, default: Date.now },
      preferencesLastUpdated: { type: Date, default: Date.now },
      scoresLastUpdated: { type: Date, default: Date.now },
    },
    dataCompleteness: { type: Number, default: 0 },
    privacySettings: {
      dataCollectionEnabled: { type: Boolean, default: true },
      analyticsEnabled: { type: Boolean, default: true },
      personalizationEnabled: { type: Boolean, default: true },
      marketingConsent: { type: Boolean, default: false },
      thirdPartySharing: { type: Boolean, default: false },
    },
    tags: [{ type: String }],
    segments: [{ type: String }],
    sources: [{ type: String }],
  },

  // Versioning
  version: { type: Number, default: 1 },

}, {
  timestamps: true,
  collection: 'user_profiles',
  // Compound indexes for common queries
});

// ============================================================================
// INDEXES
// ============================================================================

UserProfileSchema.index({ 'lifetimeValue.totalRevenue': -1 });
UserProfileSchema.index({ 'behavioralScores.engagementScore': -1 });
UserProfileSchema.index({ 'behavioralScores.valueSegment': 1 });
UserProfileSchema.index({ 'behavioralScores.churnRisk': 1 });
UserProfileSchema.index({ 'preferences.cuisinePreferences.cuisine': 1 });
UserProfileSchema.index({ 'metadata.segments': 1 });
UserProfileSchema.index({ 'metadata.tags': 1 });
UserProfileSchema.index({ 'engagementMetrics.lastSessionAt': -1 });
UserProfileSchema.index({ 'behaviorPatterns.preferredDevice': 1 });
UserProfileSchema.index({ 'profile.accountStatus': 1 });
UserProfileSchema.index({ 'metadata.dataCompleteness': -1 });
UserProfileSchema.index({ 'createdAt': -1 });
UserProfileSchema.index({ 'updatedAt': -1 });

// TTL index for event history (keep last 90 days)
UserProfileSchema.index({ 'eventHistory.timestamp': 1 }, { expireAfterSeconds: 7776000 });

// ============================================================================
// MODEL EXPORTS
// ============================================================================

export const UserProfile: Model<IUserProfile> = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

// Type exports for use in services
export type UserProfileDocument = IUserProfile;

export default UserProfile;
