import mongoose, { Document, Schema } from 'mongoose';

export enum ReviewSource {
  GOOGLE = 'google',
  TRIPADVISOR = 'tripadvisor',
  BOOKINGCOM = 'bookingcom',
  INTERNAL = 'internal'
}

export enum SentimentLabel {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

export enum ReviewStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  RESPONDED = 'responded',
  ESCALATED = 'escalated',
  ARCHIVED = 'archived'
}

export interface IReview extends Document {
  reviewId: string;
  externalId: string;
  source: ReviewSource;
  hotelId: string;
  guestName: string;
  guestEmail?: string;
  rating: number;
  title?: string;
  content: string;
  language: string;
  sentiment?: SentimentLabel;
  sentimentScore?: number;
  categories: string[];
  responseId?: string;
  respondedAt?: Date;
  respondedBy?: string;
  status: ReviewStatus;
  metadata: {
    platformRating?: number;
    visitDate?: Date;
    roomType?: string;
    travelType?: string;
    helpfulCount?: number;
    photos?: string[];
  };
  sourceMetadata: Record<string, unknown>;
  receivedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewId: { type: String, required: true, unique: true, index: true },
    externalId: { type: String, required: true, index: true },
    source: { type: String, enum: Object.values(ReviewSource), required: true, index: true },
    hotelId: { type: String, required: true, index: true },
    guestName: { type: String, required: true },
    guestEmail: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    content: { type: String, required: true },
    language: { type: String, default: 'en' },
    sentiment: { type: String, enum: Object.values(SentimentLabel) },
    sentimentScore: { type: Number, min: -1, max: 1 },
    categories: [{ type: String }],
    responseId: { type: String },
    respondedAt: { type: Date },
    respondedBy: { type: String },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PENDING,
      index: true
    },
    metadata: {
      platformRating: { type: Number },
      visitDate: { type: Date },
      roomType: { type: String },
      travelType: { type: String },
      helpfulCount: { type: Number },
      photos: [{ type: String }]
    },
    sourceMetadata: { type: Schema.Types.Mixed },
    receivedAt: { type: Date, default: Date.now, index: true },
    processedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

// Compound indexes for common queries
ReviewSchema.index({ hotelId: 1, source: 1, receivedAt: -1 });
ReviewSchema.index({ hotelId: 1, sentiment: 1, receivedAt: -1 });
ReviewSchema.index({ hotelId: 1, rating: 1, receivedAt: -1 });
ReviewSchema.index({ status: 1, receivedAt: -1 });

// Text index for search
ReviewSchema.index({ content: 'text', title: 'text', guestName: 'text' });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
