import mongoose, { Schema, Document } from 'mongoose';

// Enums
export enum BillingModel {
  CPC = 'CPC',  // Cost Per Click
  CPA = 'CPA',  // Cost Per Action
  CPM = 'CPM'   // Cost Per Mille (Impression)
}

export enum BillingStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed'
}

export enum WalletStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed'
}

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit'
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum FraudAlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum FraudAlertStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive'
}

// Interfaces
export interface IBillingEvent {
  eventId: string;
  campaignId: string;
  merchantId: string;
  billingModel: BillingModel;
  amount: number;
  currency: string;
  eventType: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface IBillingRecord {
  merchantId: string;
  campaignId: string;
  billingModel: BillingModel;
  totalAmount: number;
  currency: string;
  eventCount: number;
  startDate: Date;
  endDate: Date;
  status: BillingStatus;
  events: IBillingEvent[];
}

export interface IWallet {
  merchantId: string;
  balance: number;
  pendingBalance: number;
  currency: string;
  autoTopUpEnabled: boolean;
  autoTopUpThreshold: number;
  autoTopUpAmount: number;
  autoTopUpLimit: number;
  status: WalletStatus;
  lastTopUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  transactionId: string;
  walletId: string;
  merchantId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  status: TransactionStatus;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
}

export interface IInvoice {
  invoiceNumber: string;
  merchantId: string;
  billingPeriod: {
    start: Date;
    end: Date;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  billingModel: BillingModel;
}

export interface IFraudAlert {
  alertId: string;
  merchantId: string;
  type: string;
  severity: FraudAlertSeverity;
  status: FraudAlertStatus;
  description: string;
  evidence: Record<string, unknown>;
  affectedTransactions: string[];
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface ISettlement {
  settlementId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
  };
  transactions: string[];
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schemas

const BillingEventSchema = new Schema<IBillingEvent>({
  eventId: { type: String, required: true },
  campaignId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  billingModel: { type: String, enum: Object.values(BillingModel), required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  eventType: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: { type: Schema.Types.Mixed }
});

const BillingRecordSchema = new Schema<IBillingRecord & Document>({
  merchantId: { type: String, required: true, index: true },
  campaignId: { type: String, required: true, index: true },
  billingModel: { type: String, enum: Object.values(BillingModel), required: true, index: true },
  totalAmount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: 'USD' },
  eventCount: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: Object.values(BillingStatus), default: BillingStatus.PENDING },
  events: [BillingEventSchema]
}, { timestamps: true });

const WalletSchema = new Schema<IWallet & Document>({
  merchantId: { type: String, required: true, unique: true, index: true },
  balance: { type: Number, required: true, default: 0 },
  pendingBalance: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  autoTopUpEnabled: { type: Boolean, default: false },
  autoTopUpThreshold: { type: Number, default: 100 },
  autoTopUpAmount: { type: Number, default: 500 },
  autoTopUpLimit: { type: Number, default: 5000 },
  status: { type: String, enum: Object.values(WalletStatus), default: WalletStatus.ACTIVE }
}, { timestamps: true });

const TransactionSchema = new Schema<ITransaction & Document>({
  transactionId: { type: String, required: true, unique: true, index: true },
  walletId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  type: { type: String, enum: Object.values(TransactionType), required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.PENDING },
  reference: { type: String },
  description: { type: String },
  metadata: { type: Schema.Types.Mixed },
  completedAt: { type: Date }
}, { timestamps: true });

const InvoiceItemSchema = new Schema<InvoiceItem>({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  amount: { type: Number, required: true },
  billingModel: { type: String, enum: Object.values(BillingModel), required: true }
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice & Document>({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  billingPeriod: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: Object.values(InvoiceStatus), default: InvoiceStatus.DRAFT },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date }
}, { timestamps: true });

const FraudAlertSchema = new Schema<IFraudAlert & Document>({
  alertId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  severity: { type: String, enum: Object.values(FraudAlertSeverity), required: true },
  status: { type: String, enum: Object.values(FraudAlertStatus), default: FraudAlertStatus.OPEN },
  description: { type: String, required: true },
  evidence: { type: Schema.Types.Mixed, default: {} },
  affectedTransactions: [{ type: String }],
  resolution: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

const SettlementSchema = new Schema<ISettlement & Document>({
  settlementId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    routingNumber: String
  },
  transactions: [{ type: String }],
  processedAt: { type: Date }
}, { timestamps: true });

// Indexes for performance
BillingRecordSchema.index({ merchantId: 1, startDate: -1 });
BillingRecordSchema.index({ campaignId: 1, billingModel: 1, status: 1 });
TransactionSchema.index({ merchantId: 1, createdAt: -1 });
TransactionSchema.index({ walletId: 1, createdAt: -1 });
InvoiceSchema.index({ merchantId: 1, status: 1 });
InvoiceSchema.index({ dueDate: 1, status: 1 });
FraudAlertSchema.index({ merchantId: 1, severity: 1, status: 1 });
SettlementSchema.index({ merchantId: 1, status: 1 });

// Export models
export const BillingRecord = mongoose.model<IBillingRecord & Document>('BillingRecord', BillingRecordSchema);
export const Wallet = mongoose.model<IWallet & Document>('Wallet', WalletSchema);
export const Transaction = mongoose.model<ITransaction & Document>('Transaction', TransactionSchema);
export const Invoice = mongoose.model<IInvoice & Document>('Invoice', InvoiceSchema);
export const FraudAlert = mongoose.model<IFraudAlert & Document>('FraudAlert', FraudAlertSchema);
export const Settlement = mongoose.model<ISettlement & Document>('Settlement', SettlementSchema);
