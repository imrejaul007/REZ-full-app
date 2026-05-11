// Core data models for the billing system

export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

export interface Money {
  amount: string; // Using string for precise decimal handling
  currency: Currency;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: Money;
  availableBalance: Money;
  pendingBalance: Money;
  status: 'active' | 'frozen' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: Money;
  balanceBefore: Money;
  balanceAfter: Money;
  status: TransactionStatus;
  reference: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: InvoiceItem[];
  subtotal: Money;
  tax: Money;
  total: Money;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
}

export interface Settlement {
  id: string;
  batchId: string;
  merchantId: string;
  transactions: string[]; // Transaction IDs
  grossAmount: Money;
  fees: Money;
  netAmount: Money;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FraudCheckResult {
  isFraudulent: boolean;
  riskScore: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  flaggedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
