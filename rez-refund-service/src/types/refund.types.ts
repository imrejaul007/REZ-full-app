// Refund Status Enum
export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Refund Reason Enum
export enum RefundReason {
  DUPLICATE_CHARGE = 'DUPLICATE_CHARGE',
  FRAUDULENT_TRANSACTION = 'FRAUDULENT_TRANSACTION',
  PRODUCT_NOT_RECEIVED = 'PRODUCT_NOT_RECEIVED',
  PRODUCT_UNSATISFACTORY = 'PRODUCT_UNSATISFACTORY',
  SERVICE_NOT_RECEIVED = 'SERVICE_NOT_RECEIVED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  OTHER = 'OTHER'
}

// Payment Method Enum
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  STORE_CREDIT = 'STORE_CREDIT'
}

// Interface for creating a refund request
export interface CreateRefundRequest {
  orderId: string;
  paymentId: string;
  customerId: string;
  amount: number;
  currency: string;
  reason: RefundReason;
  description?: string;
  isPartial?: boolean;
  partialAmount?: number;
}

// Interface for approving/rejecting a refund
export interface RefundDecisionRequest {
  refundId: string;
  decision: 'APPROVED' | 'REJECTED';
  reviewerId: string;
  reviewerNotes?: string;
}

// Interface for refund processing result
export interface RefundProcessingResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  processedAt?: Date;
}

// Interface for payment reversal
export interface PaymentReversalRequest {
  paymentId: string;
  amount: number;
  currency: string;
  refundTransactionId: string;
  reason: RefundReason;
}

export interface PaymentReversalResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  timestamp: Date;
}

// Interface for paginated results
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface for refund filters
export interface RefundFilters {
  status?: RefundStatus;
  customerId?: string;
  orderId?: string;
  startDate?: Date;
  endDate?: Date;
  reason?: RefundReason;
  minAmount?: number;
  maxAmount?: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

// Refund statistics
export interface RefundStatistics {
  totalRefunds: number;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  completedCount: number;
  failedCount: number;
  averageRefundAmount: number;
  refundRate: number;
}
