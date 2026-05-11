import mongoose, { Document, Schema } from 'mongoose';
import { ReviewSource } from './Review';

export interface IReviewSource extends Document {
  sourceId: string;
  source: ReviewSource;
  hotelId: string;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    placeId?: string;
    propertyId?: string;
    hotelIdExternal?: string;
  };
  configuration: {
    autoFetch: boolean;
    fetchIntervalMinutes: number;
    autoRespond: boolean;
    respondThreshold: number;
    escalateThreshold: number;
    escalationEmail?: string;
    languageFilter?: string[];
  };
  status: 'active' | 'paused' | 'error' | 'disconnected';
  lastSyncAt?: Date;
  lastError?: string;
  errorCount: number;
  totalReviewsFetched: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSourceSchema = new Schema<IReviewSource>(
  {
    sourceId: { type: String, required: true, unique: true, index: true },
    source: { type: String, enum: Object.values(ReviewSource), required: true },
    hotelId: { type: String, required: true, index: true },
    credentials: {
      apiKey: { type: String },
      apiSecret: { type: String },
      accessToken: { type: String },
      refreshToken: { type: String },
      placeId: { type: String },
      propertyId: { type: String },
      hotelIdExternal: { type: String }
    },
    configuration: {
      autoFetch: { type: Boolean, default: true },
      fetchIntervalMinutes: { type: Number, default: 60 },
      autoRespond: { type: Boolean, default: false },
      respondThreshold: { type: Number, default: 3 },
      escalateThreshold: { type: Number, default: 2 },
      escalationEmail: { type: String },
      languageFilter: [{ type: String }]
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'error', 'disconnected'],
      default: 'active',
      index: true
    },
    lastSyncAt: { type: Date },
    lastError: { type: String },
    errorCount: { type: Number, default: 0 },
    totalReviewsFetched: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

// Compound index for hotel-source combinations
ReviewSourceSchema.index({ hotelId: 1, source: 1 }, { unique: true });

export const ReviewSourceModel = mongoose.model<IReviewSource>('ReviewSource', ReviewSourceSchema);
