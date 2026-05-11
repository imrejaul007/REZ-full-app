/**
 * BBPS MongoDB Models
 * Bill, Transaction, and Payment schemas
 */

import mongoose, { Document, Schema, Model } from 'mongoose';

// ============ TYPE DEFINITIONS ============

export type BillStatus = 'pending' | 'generated' | 'paid' | 'overdue' | 'cancelled';
export type TransactionStatus = 'initiated' | 'pending' | 'processing' | 'success' | 'failed' | 'refunded';
export type PaymentMethod = 'upi' | 'netbanking' | 'card' | 'wallet';
export type TransactionType = 'bill_payment' | 'recharge' | 'bill_fetch' | 'refund';

export interface IBillAmount {
  total: number;
  due: number;
  partial: number;
  currency: string;
}

export interface IBillPeriod {
  from: Date;
  to: Date;
  label?: string;
}

export interface ICustomerDetails {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface IPaymentDetails {
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  reference?: string;
  timestamp?: Date;
}

export interface IBillDocument extends Document {
  // Bill identification
  billId: string;
  bbpsBillId: string;
  operatorId: string;
  operatorShortCode: string;
  category: string;

  // Customer info
  customerId: string;
  billNumber?: string;
  billDate?: Date;
  billDueDate: Date;

  // Amount details
  amount: IBillAmount;

  // Bill period
  billPeriod?: IBillPeriod;

  // Customer details
  customerDetails?: ICustomerDetails;

  // Bill fields (operator-specific)
  billFields: Record<string, string>;

  // Status
  status: BillStatus;

  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface ITransactionDocument extends Document {
  // Transaction identification
  transactionId: string;
  bbpsTxnId?: string;
  operatorTxnId?: string;

  // Reference
  billId?: string;
  userId: string;

  // Type
  type: TransactionType;
  operatorId: string;
  category: string;

  // Amount
  amount: number;
  convenienceFee: number;
  totalAmount: number;
  currency: string;

  // Customer fields
  customerFields: Record<string, string>;

  // Payment details
  paymentMethod: PaymentMethod;
  paymentDetails?: IPaymentDetails;

  // Status tracking
  status: TransactionStatus;
  statusHistory: ITransactionStatusHistory[];

  // Response from operator
  operatorResponse?: Record<string, unknown>;

  // Error handling
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;

  // User device info
  userAgent?: string;
  ipAddress?: string;

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamps
  initiatedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionStatusHistory {
  status: TransactionStatus;
  timestamp: Date;
  message?: string;
  errorCode?: string;
}

export interface IPaymentDocument extends Document {
  // Payment identification
  paymentId: string;
  transactionId: string;

  // User info
  userId: string;

  // Amount
  amount: number;
  currency: string;

  // Payment method
  method: PaymentMethod;
  paymentGateway?: string;
  gatewayTransactionId?: string;

  // Payment status
  status: 'pending' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';
  statusHistory: IPaymentStatusHistory[];

  // Payer info
  payerVpa?: string;
  payerAccount?: string;
  payerCardLast4?: string;

  // Gateway response
  gatewayResponse?: Record<string, unknown>;

  // Refund info
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentStatusHistory {
  status: string;
  timestamp: Date;
  message?: string;
  gatewayResponse?: Record<string, unknown>;
}

export interface IOperatorDocument extends Document {
  operatorId: string;
  name: string;
  category: string;
  shortCode: string;
  isActive: boolean;
  lastSyncAt?: Date;
  syncStatus: 'success' | 'failed' | 'pending';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefundDocument extends Document {
  refundId: string;
  transactionId: string;
  paymentId: string;
  userId: string;

  // Amount
  originalAmount: number;
  refundAmount: number;
  currency: string;

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  statusHistory: IRefundStatusHistory[];

  // Reason
  reason: string;
  initiatedBy: string;

  // Gateway refund
  gatewayRefundId?: string;
  gatewayResponse?: Record<string, unknown>;

  // Error handling
  errorCode?: string;
  errorMessage?: string;

  // Timestamps
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefundStatusHistory {
  status: string;
  timestamp: Date;
  message?: string;
}

// ============ SCHEMAS ============

const billAmountSchema = new Schema<IBillAmount>(
  {
    total: { type: Number, required: true },
    due: { type: Number, required: true },
    partial: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },
  { _id: false }
);

const billPeriodSchema = new Schema<IBillPeriod>(
  {
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    label: { type: String }
  },
  { _id: false }
);

const customerDetailsSchema = new Schema<ICustomerDetails>(
  {
    name: { type: String },
    address: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  { _id: false }
);

const billSchema = new Schema<IBillDocument>(
  {
    billId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    bbpsBillId: {
      type: String,
      index: true
    },
    operatorId: {
      type: String,
      required: true,
      index: true
    },
    operatorShortCode: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    customerId: {
      type: String,
      required: true,
      index: true
    },
    billNumber: {
      type: String,
      index: true
    },
    billDate: {
      type: Date
    },
    billDueDate: {
      type: Date,
      required: true,
      index: true
    },
    amount: {
      type: billAmountSchema,
      required: true
    },
    billPeriod: {
      type: billPeriodSchema
    },
    customerDetails: {
      type: customerDetailsSchema
    },
    billFields: {
      type: Map,
      of: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'generated', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    expiresAt: {
      type: Date,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'bbps_bills'
  }
);

// Indexes for bill schema
billSchema.index({ customerId: 1, operatorId: 1 });
billSchema.index({ billDueDate: 1, status: 1 });
billSchema.index({ createdAt: -1 });

const transactionStatusHistorySchema = new Schema<ITransactionStatusHistory>(
  {
    status: {
      type: String,
      required: true,
      enum: ['initiated', 'pending', 'processing', 'success', 'failed', 'refunded']
    },
    timestamp: { type: Date, required: true },
    message: { type: String },
    errorCode: { type: String }
  },
  { _id: false }
);

const transactionSchema = new Schema<ITransactionDocument>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    bbpsTxnId: {
      type: String,
      index: true
    },
    operatorTxnId: {
      type: String,
      index: true
    },
    billId: {
      type: String,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['bill_payment', 'recharge', 'bill_fetch', 'refund'],
      required: true
    },
    operatorId: {
      type: String,
      required: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    convenienceFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    customerFields: {
      type: Map,
      of: String,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'netbanking', 'card', 'wallet'],
      required: true
    },
    paymentDetails: {
      transactionId: { type: String },
      reference: { type: String },
      timestamp: { type: Date }
    },
    status: {
      type: String,
      enum: ['initiated', 'pending', 'processing', 'success', 'failed', 'refunded'],
      default: 'initiated',
      index: true
    },
    statusHistory: {
      type: [transactionStatusHistorySchema],
      default: []
    },
    operatorResponse: {
      type: Schema.Types.Mixed
    },
    errorCode: {
      type: String
    },
    errorMessage: {
      type: String
    },
    retryCount: {
      type: Number,
      default: 0
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    userAgent: {
      type: String
    },
    ipAddress: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    initiatedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    failedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'bbps_transactions'
  }
);

// Indexes for transaction schema
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ operatorId: 1, status: 1 });
transactionSchema.index({ status: 1, initiatedAt: -1 });
transactionSchema.index({ bbpsTxnId: 1 });

const paymentStatusHistorySchema = new Schema<IPaymentStatusHistory>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
    message: { type: String },
    gatewayResponse: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const paymentSchema = new Schema<IPaymentDocument>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    transactionId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    method: {
      type: String,
      enum: ['upi', 'netbanking', 'card', 'wallet'],
      required: true
    },
    paymentGateway: {
      type: String
    },
    gatewayTransactionId: {
      type: String,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'captured', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true
    },
    statusHistory: {
      type: [paymentStatusHistorySchema],
      default: []
    },
    payerVpa: {
      type: String
    },
    payerAccount: {
      type: String
    },
    payerCardLast4: {
      type: String
    },
    gatewayResponse: {
      type: Schema.Types.Mixed
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundReason: {
      type: String
    },
    refundedAt: {
      type: Date
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    collection: 'bbps_payments'
  }
);

// Indexes for payment schema
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const operatorSchema = new Schema<IOperatorDocument>(
  {
    operatorId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      index: true
    },
    shortCode: {
      type: String,
      required: true,
      unique: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastSyncAt: {
      type: Date
    },
    syncStatus: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending'
    },
    errorMessage: {
      type: String
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true,
    collection: 'bbps_operators'
  }
);

const refundStatusHistorySchema = new Schema<IRefundStatusHistory>(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
    message: { type: String }
  },
  { _id: false }
);

const refundSchema = new Schema<IRefundDocument>(
  {
    refundId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    transactionId: {
      type: String,
      required: true,
      index: true
    },
    paymentId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    originalAmount: {
      type: Number,
      required: true
    },
    refundAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    statusHistory: {
      type: [refundStatusHistorySchema],
      default: []
    },
    reason: {
      type: String,
      required: true
    },
    initiatedBy: {
      type: String,
      required: true
    },
    gatewayRefundId: {
      type: String
    },
    gatewayResponse: {
      type: Schema.Types.Mixed
    },
    errorCode: {
      type: String
    },
    errorMessage: {
      type: String
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    collection: 'bbps_refunds'
  }
);

// Indexes for refund schema
refundSchema.index({ userId: 1, createdAt: -1 });
refundSchema.index({ transactionId: 1, status: 1 });

// ============ MODEL EXPORTS ============

export const Bill: Model<IBillDocument> = mongoose.model<IBillDocument>('Bill', billSchema);
export const Transaction: Model<ITransactionDocument> = mongoose.model<ITransactionDocument>('Transaction', transactionSchema);
export const Payment: Model<IPaymentDocument> = mongoose.model<IPaymentDocument>('Payment', paymentSchema);
export const Operator: Model<IOperatorDocument> = mongoose.model<IOperatorDocument>('Operator', operatorSchema);
export const Refund: Model<IRefundDocument> = mongoose.model<IRefundDocument>('Refund', refundSchema);

// ============ HELPER FUNCTIONS ============

/**
 * Generate unique bill ID
 */
export function generateBillId(): string {
  return `BB${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Generate unique transaction ID
 */
export function generateTransactionId(): string {
  return `TXN${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Generate unique payment ID
 */
export function generatePaymentId(): string {
  return `PAY${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Generate unique refund ID
 */
export function generateRefundId(): string {
  return `REF${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}
