/**
 * Store Payment Model
 *
 * Tracks in-store QR payments with coin redemption,
 * Stripe integration, and reward calculations.
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// Coin redemption breakdown
export interface ICoinRedemption {
  rezCoins: number;
  promoCoins: number;
  brandedCoins: number; // Merchant-specific coins
  payBill: number;
  totalAmount: number;
}

// Rewards earned from payment
export interface IPaymentRewards {
  cashbackEarned: number;
  coinsEarned: number;
  bonusCoins: number;
  firstVisitBonus?: number;
  cashbackBreakdown?: {
    baseCashbackPercent: number;
    baseCashbackAmount: number;
    subscriptionMultiplier: number;
    priveMultiplier: number;
    priveTier: string;
    finalCashbackAmount: number;
    rateSource?: string;
  };
  loyaltyProgress?: {
    currentVisits: number;
    nextMilestone: number;
    milestoneReward: string;
  };
}

// Line item for GST billing
// CD-CRIT-06 FIX: Added productId so the backend can validate client-submitted
// prices against the canonical Product.pricing.selling price at payment initiation.
export interface ILineItem {
  name: string;
  qty: number;
  price: number;
  gstRate?: number;
  gstAmount?: number;
  productId?: string; // MongoDB ObjectId of the Product — enables server-side price validation
}

// GST details interface
export interface IGstDetails {
  gstNumber: string;
  hsnCode: string;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  gstRate: number;
  isGstBill: boolean;
}

// Store Payment interface
export interface IStorePayment extends Document {
  paymentId: string;
  clientTxnId?: string;
  userId: Types.ObjectId;
  storeId: Types.ObjectId;
  storeName: string;
  customerName?: string;
  customerPhone?: string;

  // Amounts
  billAmount: number;
  discountAmount: number;
  tipAmount?: number;
  coinRedemption: ICoinRedemption;
  remainingAmount: number;

  // Payment method
  paymentMethod: 'upi' | 'card' | 'credit_card' | 'debit_card' | 'netbanking' | 'coins_only';

  // Stripe integration
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;

  // Applied offers
  offersApplied: string[];

  // Status
  status: 'initiated' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';
  failureReason?: string;
  cancelledAt?: Date;
  cancellationReason?: string;

  // Timestamps
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Rewards (populated after completion)
  rewards?: IPaymentRewards;

  // Transaction ID from gateway
  transactionId?: string;

  // Razorpay integration — stored so webhook handler can correlate events
  razorpayOrderId?: string;

  // Offline sync flag
  offlineSynced?: boolean;

  // GST line items
  lineItems?: ILineItem[];

  // GST Invoice fields
  gstDetails?: IGstDetails;
  invoiceNumber?: string;
  invoiceDate?: Date;
  billNumber?: string;
  merchantId?: Types.ObjectId;
  totalAmount?: number;

  // Methods
  markCompleted(transactionId: string, rewards: IPaymentRewards): Promise<IStorePayment>;
  markFailed(reason: string): Promise<IStorePayment>;
  markCancelled(): Promise<IStorePayment>;
}

// Static methods interface
export interface IStorePaymentModel extends Model<IStorePayment> {
  findByPaymentId(paymentId: string): Promise<IStorePayment | null>;
  findActivePaymentsForUser(userId: string): Promise<IStorePayment[]>;
  findByStripePaymentIntent(paymentIntentId: string): Promise<IStorePayment | null>;
  generatePaymentId(): string;
}

const StorePaymentSchema = new Schema<IStorePayment>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientTxnId: {
      type: String,
      sparse: true,
      index: true,
      // Allows null/undefined for legacy payments, but unique when set
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    storeName: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      default: null,
    },
    customerPhone: {
      type: String,
      default: null,
    },

    // Amounts
    billAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tipAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    coinRedemption: {
      rezCoins: { type: Number, default: 0, min: 0 },
      promoCoins: { type: Number, default: 0, min: 0 },
      brandedCoins: { type: Number, default: 0, min: 0 }, // Merchant-specific coins
      payBill: { type: Number, default: 0, min: 0 },
      totalAmount: { type: Number, default: 0, min: 0 },
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment method
    paymentMethod: {
      type: String,
      required: true,
      enum: ['upi', 'card', 'credit_card', 'debit_card', 'netbanking', 'coins_only'],
    },

    // Stripe integration
    stripePaymentIntentId: {
      type: String,
      sparse: true,
      index: true,
    },
    stripeClientSecret: {
      type: String,
    },
    // Razorpay integration — stored so webhook handler can correlate payment.captured
    // events back to StorePayment and emit payment:received to the merchant's PayDisplay.
    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },

    // Applied offers
    offersApplied: [
      {
        type: String,
      },
    ],

    // Status
    status: {
      type: String,
      required: true,
      enum: ['initiated', 'processing', 'completed', 'failed', 'cancelled', 'expired'],
      default: 'initiated',
      index: true,
    },
    failureReason: {
      type: String,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },

    // Timestamps
    expiresAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },

    // Rewards
    rewards: {
      cashbackEarned: { type: Number, default: 0 },
      coinsEarned: { type: Number, default: 0 },
      bonusCoins: { type: Number, default: 0 },
      firstVisitBonus: { type: Number, default: 0 },
      cashbackBreakdown: {
        baseCashbackPercent: { type: Number },
        baseCashbackAmount: { type: Number },
        subscriptionMultiplier: { type: Number },
        priveMultiplier: { type: Number },
        priveTier: { type: String },
        finalCashbackAmount: { type: Number },
      },
      loyaltyProgress: {
        currentVisits: { type: Number },
        nextMilestone: { type: Number },
        milestoneReward: { type: String },
      },
    },

    // Transaction ID
    transactionId: {
      type: String,
      sparse: true,
    },

    // GST Invoice fields
    gstDetails: {
      gstNumber: { type: String, default: '' },
      hsnCode: { type: String, default: '' },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
      totalGst: { type: Number, default: 0 },
      gstRate: { type: Number, default: 0 },
      isGstBill: { type: Boolean, default: false },
    },
    invoiceNumber: {
      type: String,
      default: '',
      sparse: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
    },
    billNumber: {
      type: String,
      default: '',
    },
    merchantId: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      index: true,
    },
    totalAmount: {
      type: Number,
      min: 0,
    },
    offlineSynced: {
      type: Boolean,
      default: false,
    },

    // GST line items
    // CD-CRIT-06 FIX: Added productId to enable server-side price validation.
    lineItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        gstRate: { type: Number, default: 0 },
        gstAmount: { type: Number, default: 0 },
        productId: { type: String, default: null }, // MongoDB ObjectId string
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
StorePaymentSchema.index({ userId: 1, status: 1 });
StorePaymentSchema.index({ storeId: 1, status: 1 });
StorePaymentSchema.index({ userId: 1, createdAt: -1 });
StorePaymentSchema.index({ storeId: 1, createdAt: -1 });
StorePaymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Composite indexes for reconciliation and analytics
StorePaymentSchema.index({ storeId: 1, createdAt: -1, status: 1 }); // For payment reconciliation job
StorePaymentSchema.index({ storeId: 1, status: 1, completedAt: -1 }); // For merchant payment history sorted by completedAt
StorePaymentSchema.index({ merchantId: 1, createdAt: -1 }); // For merchant payment history
// Note: { userId: 1, createdAt: -1 } already declared above — removed duplicate

// Virtual for checking if expired
StorePaymentSchema.virtual('isExpired').get(function () {
  return this.expiresAt < new Date();
});

// Virtual for checking if active
StorePaymentSchema.virtual('isActive').get(function () {
  return ['initiated', 'processing'].includes(this.status) && this.expiresAt > new Date();
});

// Static: Generate unique payment ID
StorePaymentSchema.statics.generatePaymentId = function (): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomUUID().replace('-', '').substring(0, 6).toUpperCase();
  return `SP-${timestamp}-${random}`;
};

// Static: Find by payment ID
StorePaymentSchema.statics.findByPaymentId = function (paymentId: string) {
  return this.findOne({ paymentId });
};

// Static: Find active payments for user
StorePaymentSchema.statics.findActivePaymentsForUser = function (userId: string) {
  return this.find({
    userId,
    status: { $in: ['initiated', 'processing'] },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

// Static: Find by Stripe PaymentIntent ID
StorePaymentSchema.statics.findByStripePaymentIntent = function (paymentIntentId: string) {
  return this.findOne({ stripePaymentIntentId: paymentIntentId });
};

// Method: Mark as completed
StorePaymentSchema.methods.markCompleted = async function (
  transactionId: string,
  rewards: IPaymentRewards,
): Promise<IStorePayment> {
  this.status = 'completed';
  this.transactionId = transactionId;
  this.completedAt = new Date();
  this.rewards = rewards;
  return this.save();
};

// Method: Mark as failed
StorePaymentSchema.methods.markFailed = async function (reason: string): Promise<IStorePayment> {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Method: Mark as cancelled
StorePaymentSchema.methods.markCancelled = async function (): Promise<IStorePayment> {
  this.status = 'cancelled';
  return this.save();
};

// Pre-save: Set expiry if not provided
StorePaymentSchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    // 15 minutes expiry
    this.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  }
  next();
});

export const StorePayment = mongoose.model<IStorePayment, IStorePaymentModel>('StorePayment', StorePaymentSchema);
export default StorePayment;
