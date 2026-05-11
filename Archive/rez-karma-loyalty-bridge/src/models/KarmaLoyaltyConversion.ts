/**
 * Karma-Loyalty Conversion Schema
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IConversion extends Document {
  userId: string;
  karmaAmount: number;
  loyaltyPointsAwarded: number;
  source: string;
  milestone?: string;
  convertedAt: Date;
  createdAt: Date;
}

const ConversionSchema = new Schema<IConversion>({
  userId: { type: String, required: true, index: true },
  karmaAmount: { type: Number, required: true },
  loyaltyPointsAwarded: { type: Number, required: true },
  source: { type: String, required: true },
  milestone: String,
  convertedAt: { type: Date, default: Date.now },
}, { timestamps: true });

ConversionSchema.index({ userId: 1, createdAt: -1 });

export const Conversion = mongoose.model<IConversion>('Conversion', ConversionSchema);
