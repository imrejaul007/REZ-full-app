import mongoose, { Document, Schema } from 'mongoose';

// ─── Bill Types ────────────────────────────────────────────────────────────

export const BILL_TYPES = [
  'electricity',
  'water',
  'gas',
  'internet',
  'mobile_postpaid',
  'mobile_prepaid', // Jio/Airtel/BSNL/Vi prepaid recharge
  'broadband',
  'dth',
  'landline',
  'insurance', // LIC, health insurance
  'fastag', // FASTag recharge
  'education_fee', // school/college fees
] as const;

export type BillType = (typeof BILL_TYPES)[number];

// ─── Interfaces ───────────────────────────────────────────────────────────

export interface IRequiredField {
  fieldName: string;
  label: string;
  placeholder: string;
  type: 'text' | 'number';
}

export interface IBillProvider extends Document {
  name: string;
  code: string;
  type: BillType;
  logo: string;
  region?: string;
  requiredFields: IRequiredField[];
  cashbackPercent: number;
  // ── Aggregator ──────────────────────────────
  aggregatorCode: string; // Razorpay operator code: "JIO", "BESCOM", "AIRTEL"
  aggregatorName: 'razorpay' | 'setu' | 'manual';
  // ── Coin Economics ──────────────────────────
  promoCoinsFixed: number; // coins given per successful payment
  promoExpiryDays: number; // expiry for promo coins (7–30)
  maxRedemptionPercent: number; // max % of any bill payable with these coins (5–50)
  // ── UI ──────────────────────────────────────
  displayOrder: number;
  isFeatured: boolean;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────

const RequiredFieldSchema = new Schema<IRequiredField>(
  {
    fieldName: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    placeholder: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'number'], default: 'text' },
  },
  { _id: false },
);

const BillProviderSchema = new Schema<IBillProvider>(
  {
    name: { type: String, required: [true, 'Provider name is required'], trim: true, maxlength: 100 },
    code: {
      type: String,
      required: [true, 'Provider code is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
    },
    type: { type: String, required: [true, 'Bill type is required'], enum: BILL_TYPES },
    logo: { type: String, default: '' },
    region: { type: String, trim: true, lowercase: true, maxlength: 50 },
    requiredFields: {
      type: [RequiredFieldSchema],
      default: [
        {
          fieldName: 'consumerNumber',
          label: 'Consumer Number',
          placeholder: 'Enter your consumer/account number',
          type: 'text',
        },
      ],
    },
    cashbackPercent: { type: Number, default: 0, min: 0, max: 100 },
    // Aggregator
    aggregatorCode: { type: String, trim: true, default: '' },
    aggregatorName: { type: String, enum: ['razorpay', 'setu', 'manual'], default: 'razorpay' },
    // Coin Economics
    promoCoinsFixed: { type: Number, default: 10, min: 0, max: 500 },
    promoExpiryDays: { type: Number, default: 7, min: 1, max: 30 },
    maxRedemptionPercent: { type: Number, default: 15, min: 5, max: 50 },
    // UI
    displayOrder: { type: Number, default: 99 },
    isFeatured: { type: Boolean, default: false },
    minAmount: { type: Number, default: 10, min: 1 },
    maxAmount: { type: Number, default: 100000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

BillProviderSchema.index({ type: 1, isActive: 1, displayOrder: 1 });
BillProviderSchema.index({ isFeatured: 1, isActive: 1 });
BillProviderSchema.index({ aggregatorCode: 1 });

export const BillProvider = mongoose.model<IBillProvider>('BillProvider', BillProviderSchema);
