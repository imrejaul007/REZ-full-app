/**
 * Conversion Stats Schema
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IConversionStats extends Document {
  userId: string;
  totalKarmaConverted: number;
  totalLoyaltyAwarded: number;
  conversionCount: number;
  lastConversionAt?: Date;
  milestones: string[];
  updatedAt: Date;
}

const ConversionStatsSchema = new Schema<IConversionStats>({
  userId: { type: String, required: true, unique: true, index: true },
  totalKarmaConverted: { type: Number, default: 0 },
  totalLoyaltyAwarded: { type: Number, default: 0 },
  conversionCount: { type: Number, default: 0 },
  lastConversionAt: Date,
  milestones: [String],
}, { timestamps: true });

export const ConversionStats = mongoose.model<IConversionStats>('ConversionStats', ConversionStatsSchema);
