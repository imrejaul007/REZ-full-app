import mongoose, { Document, Schema } from 'mongoose';

// Canonical source: @rez/shared-types/enums - keep in sync
// These types are defined locally because @rez/shared-types is not an npm dependency.
export type LoanType = 'personal' | 'instant' | 'merchant' | 'bnpl';
export type LoanStatus =
  | 'pending'
  | 'pre_approved'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'disbursed'
  | 'rejected'
  | 'cancelled';

export interface ILoanApplication extends Document {
  userId: string;
  merchantId?: string;            // set for merchant financing / BNPL
  partnerId: string;              // which aggregator/bank fulfilled this
  partnerApplicationId?: string;  // external ID from partner

  type: LoanType;
  amount: number;
  tenure: number;                 // months
  interestRate?: number;          // APR %
  emi?: number;
  processingFee?: number;         // ₹ or % — BE-FIN-008: Track partner fees atomically

  status: LoanStatus;
  rejectionReason?: string;

  // contextual metadata — where in the app was this triggered
  context?: {
    screen: string;               // e.g. 'booking_checkout', 'post_spend_upsell'
    orderId?: string;
    bookingId?: string;
  };

  coinsAwarded: number;
  firstEmiPaid: boolean;
  disbursedAt?: Date;
  repaidAt?: Date;
  overdueDays?: number;
  outcomeTracked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LoanApplicationSchema = new Schema<ILoanApplication>(
  {
    userId: { type: String, required: true, index: true },
    merchantId: { type: String },
    partnerId: { type: String, required: true },
    partnerApplicationId: { type: String },
    type: { type: String, enum: ['personal', 'instant', 'merchant', 'bnpl'], required: true },
    amount: { type: Number, required: true },
    tenure: { type: Number, required: true },
    interestRate: { type: Number },
    emi: { type: Number },
    processingFee: { type: Number }, // BE-FIN-008: Track partner fees atomically
    status: {
      type: String,
      enum: ['pending', 'pre_approved', 'submitted', 'under_review', 'approved', 'disbursed', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String },
    context: {
      screen: { type: String },
      orderId: { type: String },
      bookingId: { type: String },
    },
    coinsAwarded: { type: Number, default: 0 },
    firstEmiPaid: { type: Boolean, default: false },
    disbursedAt: { type: Date },
    repaidAt: { type: Date },
    overdueDays: { type: Number },
    outcomeTracked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

LoanApplicationSchema.index({ userId: 1, status: 1 });
LoanApplicationSchema.index({ userId: 1, createdAt: -1 });
// DM-H5 fix: partner webhook callbacks query by partnerApplicationId — needs index to avoid full-scan
LoanApplicationSchema.index({ partnerApplicationId: 1 });

export const LoanApplication = mongoose.model<ILoanApplication>('LoanApplication', LoanApplicationSchema);
