import mongoose, { Document, Schema } from 'mongoose';

// Hotel Website Configuration Schema
export interface IHotelWebsite extends Document {
  _id: mongoose.Types.ObjectId;
  hotelId: string;
  domain: string;
  websiteName: string;
  contactEmail: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  customDomain?: string;
  isActive: boolean;
  apiKey: string;
  settings: {
    allowDirectPayment: boolean;
    requirePaymentUpfront: boolean;
    showLoyaltyOption: boolean;
    showReviews: boolean;
    minAdvanceBookingHours: number;
    maxAdvanceBookingDays: number;
    cancellationPolicy: 'free' | 'partial' | 'non-refundable';
    termsUrl?: string;
    privacyUrl?: string;
  };
  analytics: {
    totalBookings: number;
    totalRevenue: number;
    conversionRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const HotelWebsiteSchema = new Schema<IHotelWebsite>(
  {
    hotelId: { type: String, required: true, unique: true, index: true },
    domain: { type: String, required: true },
    websiteName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    branding: {
      primaryColor: { type: String, default: '#1a56db' },
      secondaryColor: { type: String, default: '#ffffff' },
      accentColor: { type: String, default: '#f59e0b' },
      fontFamily: { type: String, default: 'Inter, sans-serif' },
      logoUrl: { type: String },
      faviconUrl: { type: String },
    },
    customDomain: { type: String },
    isActive: { type: Boolean, default: true },
    apiKey: { type: String, required: true, unique: true },
    settings: {
      allowDirectPayment: { type: Boolean, default: true },
      requirePaymentUpfront: { type: Boolean, default: false },
      showLoyaltyOption: { type: Boolean, default: true },
      showReviews: { type: Boolean, default: true },
      minAdvanceBookingHours: { type: Number, default: 2 },
      maxAdvanceBookingDays: { type: Number, default: 365 },
      cancellationPolicy: {
        type: String,
        enum: ['free', 'partial', 'non-refundable'],
        default: 'free',
      },
      termsUrl: { type: String },
      privacyUrl: { type: String },
    },
    analytics: {
      totalBookings: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

HotelWebsiteSchema.index({ domain: 1 });
HotelWebsiteSchema.index({ apiKey: 1 });

export const HotelWebsite = mongoose.model<IHotelWebsite>('HotelWebsite', HotelWebsiteSchema);
