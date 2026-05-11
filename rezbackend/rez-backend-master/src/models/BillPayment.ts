import mongoose, { Document, Schema, Types } from 'mongoose';
import { BillType, BILL_TYPES } from './BillProvider';

export type BillPaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type BillRefundStatus = 'none' | 'pending' | 'processed' | 'failed';

export interface IBillPayment extends Document {
  userId: Types.ObjectId;
  provider: Types.ObjectId;
  billType: BillType;
  customerNumber: string;
  amount: number;
  // Coin rewards
  cashbackAmount: number; // legacy cashback ₹ equivalent
  promoCoinsIssued: number; // promo coins given after payment
  promoExpiryDays: number; // expiry of those coins
  maxRedemptionPercent: number; // cap on how coins can be redeemed
  // Payment tracking
  status: BillPaymentStatus;
  transactionRef?: string; // internal REZ ref: BP-xxxx
  aggregatorRef?: string; // Razorpay/Setu transaction ID
  aggregatorName?: 'razorpay' | 'setu' | 'manual';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  webhookVerified: boolean;
  walletDebited: boolean;
  walletDebitedAmount: number;
  // Refund
  refundStatus: BillRefundStatus;
  refundRef?: string;
  refundAmount?: number;
  refundedAt?: Date;
  refundReason?: string;
  // Reminder
  dueDateRaw?: Date;
  reminderSent: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BillPaymentSchema = new Schema<IBillPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'User is required'] },
    provider: { type: Schema.Types.ObjectId, ref: 'BillProvider', required: [true, 'Provider is required'] },
    billType: { type: String, required: [true, 'Bill type is required'], enum: BILL_TYPES },
    customerNumber: { type: String, required: [true, 'Customer number is required'], trim: true, maxlength: 50 },
    amount: { type: Number, required: [true, 'Amount is required'], min: [1, 'Amount must be at least 1'] },
    cashbackAmount: { type: Number, default: 0, min: 0 },
    promoCoinsIssued: { type: Number, default: 0, min: 0 },
    promoExpiryDays: { type: Number, default: 7 },
    maxRedemptionPercent: { type: Number, default: 15 },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
    transactionRef: { type: String, trim: true },
    aggregatorRef: { type: String, trim: true },
    aggregatorName: { type: String, enum: ['razorpay', 'setu', 'manual'], default: 'razorpay' },
    razorpayOrderId: { type: String, trim: true },
    razorpayPaymentId: { type: String, trim: true },
    webhookVerified: { type: Boolean, default: false },
    walletDebited: { type: Boolean, default: false },
    walletDebitedAmount: { type: Number, default: 0, min: 0 },
    refundStatus: { type: String, enum: ['none', 'pending', 'processed', 'failed'], default: 'none' },
    refundRef: { type: String, trim: true },
    refundAmount: { type: Number, min: 0 },
    refundedAt: { type: Date },
    refundReason: { type: String, trim: true },
    dueDateRaw: { type: Date },
    reminderSent: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

BillPaymentSchema.index({ userId: 1, createdAt: -1 });
BillPaymentSchema.index({ userId: 1, status: 1 });
BillPaymentSchema.index({ userId: 1, billType: 1, createdAt: -1 });
BillPaymentSchema.index({ transactionRef: 1 }, { unique: true, sparse: true });
BillPaymentSchema.index({ aggregatorRef: 1 }, { sparse: true });
BillPaymentSchema.index({ status: 1, createdAt: -1 }); // admin monitoring
BillPaymentSchema.index({ dueDateRaw: 1, reminderSent: 1 }); // reminder cron job
BillPaymentSchema.index({ razorpayOrderId: 1 }, { sparse: true });

export const BillPayment = mongoose.model<IBillPayment>('BillPayment', BillPaymentSchema);
