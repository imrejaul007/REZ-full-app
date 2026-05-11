import mongoose, { Document, Schema } from 'mongoose';

// Embed Configuration for specific pages/placements
export type EmbedPlacement = 'homepage' | 'rooms' | 'checkout' | 'sidebar' | 'footer' | 'custom';

// Analytics Event Types
export type EmbedEventType =
  | 'widget_load'
  | 'search_initiated'
  | 'room_viewed'
  | 'booking_started'
  | 'booking_completed'
  | 'payment_initiated'
  | 'payment_failed'
  | 'widget_closed'
  | 'loyalty_joined';

// Embed Analytics Event
export interface IEmbedEvent {
  type: EmbedEventType;
  timestamp: Date;
  sessionId: string;
  widgetId: string;
  hotelId: string;
  metadata?: Record<string, unknown>;
}

// Embed Script Configuration
export interface IEmbedConfig extends Document {
  _id: mongoose.Types.ObjectId;
  hotelWebsiteId: mongoose.Types.ObjectId;
  configId: string;
  name: string;
  description?: string;
  isActive: boolean;

  // Placement Configuration
  placement: EmbedPlacement;
  customPlacement?: string;

  // Embed Script Settings
  script: {
    version: string;
    async: boolean;
    defer: boolean;
    customAttributes?: Record<string, string>;
  };

  // Widget ID Reference
  widgetId: string;

  // Page Targeting
  targeting: {
    includePaths: string[];
    excludePaths: string[];
    targetHotelIds?: string[];
  };

  // A/B Testing Configuration
  abTest?: {
    enabled: boolean;
    variant: 'A' | 'B';
    conversionGoal: string;
  };

  // Tracking Configuration
  tracking: {
    trackAllEvents: boolean;
    trackConversions: boolean;
    trackRevenue: boolean;
    customDimensions?: Record<string, string>;
  };

  // Performance Settings
  performance: {
    lazyLoad: boolean;
    prefetchData: boolean;
    cacheDuration: number; // in seconds
    cdnUrl?: string;
  };

  // Security
  security: {
    restrictDomain: boolean;
    allowedDomains: string[];
    nonceEnabled: boolean;
    sriEnabled: boolean;
  };

  // Events Log
  events: IEmbedEvent[];

  // Stats
  stats: {
    totalLoads: number;
    totalSearches: number;
    totalBookings: number;
    totalRevenue: number;
    conversionRate: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const EmbedEventSchema = new Schema<IEmbedEvent>(
  {
    type: {
      type: String,
      enum: [
        'widget_load',
        'search_initiated',
        'room_viewed',
        'booking_started',
        'booking_completed',
        'payment_initiated',
        'payment_failed',
        'widget_closed',
        'loyalty_joined',
      ],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    sessionId: { type: String, required: true },
    widgetId: { type: String, required: true },
    hotelId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const EmbedConfigSchema = new Schema<IEmbedConfig>(
  {
    hotelWebsiteId: { type: Schema.Types.ObjectId, ref: 'HotelWebsite', required: true },
    configId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },

    placement: {
      type: String,
      enum: ['homepage', 'rooms', 'checkout', 'sidebar', 'footer', 'custom'],
      default: 'homepage',
    },
    customPlacement: { type: String },

    script: {
      version: { type: String, default: '1.0.0' },
      async: { type: Boolean, default: true },
      defer: { type: Boolean, default: true },
      customAttributes: { type: Schema.Types.Mixed },
    },

    widgetId: { type: String, required: true },

    targeting: {
      includePaths: [{ type: String }],
      excludePaths: [{ type: String }],
      targetHotelIds: [{ type: String }],
    },

    abTest: {
      enabled: { type: Boolean, default: false },
      variant: { type: String, enum: ['A', 'B'] },
      conversionGoal: { type: String },
    },

    tracking: {
      trackAllEvents: { type: Boolean, default: true },
      trackConversions: { type: Boolean, default: true },
      trackRevenue: { type: Boolean, default: true },
      customDimensions: { type: Schema.Types.Mixed },
    },

    performance: {
      lazyLoad: { type: Boolean, default: true },
      prefetchData: { type: Boolean, default: false },
      cacheDuration: { type: Number, default: 300 },
      cdnUrl: { type: String },
    },

    security: {
      restrictDomain: { type: Boolean, default: true },
      allowedDomains: [{ type: String }],
      nonceEnabled: { type: Boolean, default: true },
      sriEnabled: { type: Boolean, default: true },
    },

    events: [EmbedEventSchema],

    stats: {
      totalLoads: { type: Number, default: 0 },
      totalSearches: { type: Number, default: 0 },
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

EmbedConfigSchema.index({ hotelWebsiteId: 1 });
EmbedConfigSchema.index({ configId: 1 });
EmbedConfigSchema.index({ 'stats.totalBookings': -1 });

export const EmbedConfig = mongoose.model<IEmbedConfig>('EmbedConfig', EmbedConfigSchema);
