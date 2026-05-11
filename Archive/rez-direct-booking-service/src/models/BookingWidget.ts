import mongoose, { Document, Schema } from 'mongoose';

// Widget Display Configuration
export type WidgetTheme = 'light' | 'dark' | 'auto';
export type WidgetPosition = 'embedded' | 'floating' | 'modal' | 'slide-in';
export type WidgetLayout = 'horizontal' | 'vertical' | 'compact' | 'detailed';

// Room Type Availability
export interface IRoomType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  maxOccupancy: number;
  amenities: string[];
  images: string[];
  availableRooms: number;
}

// Booking Widget Configuration
export interface IBookingWidget extends Document {
  _id: mongoose.Types.ObjectId;
  hotelWebsiteId: mongoose.TypesObjectId;
  widgetId: string;
  name: string;
  isActive: boolean;

  // Display Configuration
  display: {
    theme: WidgetTheme;
    position: WidgetPosition;
    layout: WidgetLayout;
    width: string;
    height: string;
    borderRadius: string;
    shadowEnabled: boolean;
    animationEnabled: boolean;
  };

  // Content Configuration
  content: {
    title: string;
    subtitle: string;
    checkInLabel: string;
    checkOutLabel: string;
    guestsLabel: string;
    searchButtonText: string;
    currency: string;
    language: string;
  };

  // Room Configuration
  rooms: IRoomType[];

  // Availability Windows
  availability: {
    checkInTime: string;
    checkOutTime: string;
    minNights: number;
    maxNights: number;
    blockedDates: Date[];
  };

  // Pricing Configuration
  pricing: {
    showMemberPrice: boolean;
    memberDiscountPercent: number;
    includeTaxes: boolean;
    taxPercent: number;
    showFees: boolean;
  };

  // Campaign / Promo Configuration
  campaign?: {
    enabled: boolean;
    headline?: string;
    description?: string;
    badgeColor?: string;
    discountPercent?: number;
    promoCode?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const RoomTypeSchema = new Schema<IRoomType>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    basePrice: { type: Number, required: true },
    maxOccupancy: { type: Number, required: true, default: 2 },
    amenities: [{ type: String }],
    images: [{ type: String }],
    availableRooms: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const BookingWidgetSchema = new Schema<IBookingWidget>(
  {
    hotelWebsiteId: { type: Schema.Types.ObjectId, ref: 'HotelWebsite', required: true },
    widgetId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },

    display: {
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
      position: { type: String, enum: ['embedded', 'floating', 'modal', 'slide-in'], default: 'embedded' },
      layout: { type: String, enum: ['horizontal', 'vertical', 'compact', 'detailed'], default: 'vertical' },
      width: { type: String, default: '100%' },
      height: { type: String, default: 'auto' },
      borderRadius: { type: String, default: '12px' },
      shadowEnabled: { type: Boolean, default: true },
      animationEnabled: { type: Boolean, default: true },
    },

    content: {
      title: { type: String, default: 'Book Your Stay' },
      subtitle: { type: String, default: 'Best rates guaranteed' },
      checkInLabel: { type: String, default: 'Check-in' },
      checkOutLabel: { type: String, default: 'Check-out' },
      guestsLabel: { type: String, default: 'Guests' },
      searchButtonText: { type: String, default: 'Search Rooms' },
      currency: { type: String, default: 'USD' },
      language: { type: String, default: 'en' },
    },

    rooms: [RoomTypeSchema],

    availability: {
      checkInTime: { type: String, default: '15:00' },
      checkOutTime: { type: String, default: '11:00' },
      minNights: { type: Number, default: 1 },
      maxNights: { type: Number, default: 30 },
      blockedDates: [{ type: Date }],
    },

    pricing: {
      showMemberPrice: { type: Boolean, default: true },
      memberDiscountPercent: { type: Number, default: 10 },
      includeTaxes: { type: Boolean, default: false },
      taxPercent: { type: Number, default: 12 },
      showFees: { type: Boolean, default: true },
    },

    campaign: {
      enabled: { type: Boolean, default: false },
      headline: { type: String },
      description: { type: String },
      badgeColor: { type: String },
      discountPercent: { type: Number },
      promoCode: { type: String },
    },
  },
  { timestamps: true }
);

BookingWidgetSchema.index({ hotelWebsiteId: 1 });
BookingWidgetSchema.index({ widgetId: 1 });

export const BookingWidget = mongoose.model<IBookingWidget>('BookingWidget', BookingWidgetSchema);
