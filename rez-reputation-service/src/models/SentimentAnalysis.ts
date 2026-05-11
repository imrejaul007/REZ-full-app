import mongoose, { Document, Schema } from 'mongoose';
import { SentimentLabel } from './Review';

export interface IAspectSentiment {
  aspect: string;
  sentiment: SentimentLabel;
  confidence: number;
  mentions: string[];
}

export interface ISentimentAnalysis extends Document {
  analysisId: string;
  reviewId: string;
  overallSentiment: SentimentLabel;
  overallScore: number;
  confidence: number;
  language: string;
  aspects: IAspectSentiment[];
  keyPhrases: string[];
  keywords: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  summary: string;
  recommendation: 'respond' | 'escalate' | 'ignore';
  model: string;
  modelVersion: string;
  processingTimeMs: number;
  createdAt: Date;
}

const AspectSentimentSchema = new Schema<IAspectSentiment>(
  {
    aspect: { type: String, required: true },
    sentiment: {
      type: String,
      enum: Object.values(SentimentLabel),
      required: true
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    mentions: [{ type: String }]
  },
  { _id: false }
);

const SentimentAnalysisSchema = new Schema<ISentimentAnalysis>(
  {
    analysisId: { type: String, required: true, unique: true, index: true },
    reviewId: { type: String, required: true, index: true },
    overallSentiment: {
      type: String,
      enum: Object.values(SentimentLabel),
      required: true
    },
    overallScore: { type: Number, required: true, min: -1, max: 1 },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    language: { type: String, required: true },
    aspects: [AspectSentimentSchema],
    keyPhrases: [{ type: String }],
    keywords: {
      positive: [{ type: String }],
      negative: [{ type: String }],
      neutral: [{ type: String }]
    },
    summary: { type: String },
    recommendation: {
      type: String,
      enum: ['respond', 'escalate', 'ignore'],
      required: true
    },
    model: { type: String, required: true },
    modelVersion: { type: String, required: true },
    processingTimeMs: { type: Number, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Index for analysis lookups
SentimentAnalysisSchema.index({ reviewId: 1 });
SentimentAnalysisSchema.index({ overallSentiment: 1, createdAt: -1 });
SentimentAnalysisSchema.index({ recommendation: 1, createdAt: -1 });

export const SentimentAnalysis = mongoose.model<ISentimentAnalysis>('SentimentAnalysis', SentimentAnalysisSchema);
