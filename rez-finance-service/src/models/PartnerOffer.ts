import mongoose, { Document, Schema } from 'mongoose';

export type OfferType = 'personal_loan' | 'instant_loan' | 'credit_card' | 'bnpl' | 'merchant_finance';

export interface IPartnerOffer extends Document {
  userId: string;
  partnerId: string;              // 'finbox' | 'hdfc' | 'icici' | 'bajaj'
  partnerOfferId: string;         // external offer ID from partner

  type: OfferType;
  displayName: string;            // e.g. "HDFC Personal Loan"
  logoUrl?: string;

  // Loan / card details
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
  minTenure?: number;             // months
  maxTenure?: number;
  interestRate?: number;          // APR %
  processingFee?: number;         // ₹ or %

  // Credit card details
  creditLimit?: number;
  annualFee?: number;

  isPreApproved: boolean;
  expiresAt: Date;

  // REZ reward for conversion
  coinsOnApproval: number;

  // Tracking
  shownCount: number;
  clickCount: number;
  appliedCount: number;
  approvedCount: number;

  createdAt: Date;
  updatedAt: Date;
}

const PartnerOfferSchema = new Schema<IPartnerOffer>(
  {
    userId: { type: String, required: true, index: true },
    partnerId: { type: String, required: true },
    partnerOfferId: { type: String, required: true },
    type: {
      type: String,
      enum: ['personal_loan', 'instant_loan', 'credit_card', 'bnpl', 'merchant_finance'],
      required: true,
    },
    displayName: { type: String, required: true },
    logoUrl: { type: String },
    amount: { type: Number },
    minAmount: { type: Number },
    maxAmount: { type: Number },
    minTenure: { type: Number },
    maxTenure: { type: Number },
    interestRate: { type: Number },
    processingFee: { type: Number },
    creditLimit: { type: Number },
    annualFee: { type: Number },
    isPreApproved: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true },
    coinsOnApproval: { type: Number, default: 0 },
    shownCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    appliedCount: { type: Number, default: 0 },
    approvedCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PartnerOfferSchema.index({ userId: 1, type: 1, expiresAt: 1 });
PartnerOfferSchema.index({ userId: 1, isPreApproved: 1 });

export const PartnerOffer = mongoose.model<IPartnerOffer>('PartnerOffer', PartnerOfferSchema);
