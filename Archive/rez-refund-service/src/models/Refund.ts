import {
  RefundStatus,
  RefundReason,
  PaymentMethod,
  CreateRefundRequest,
  RefundFilters,
  RefundStatistics
} from '../types/refund.types';

/**
 * Refund Model
 * Represents a refund request in the system
 */
export class Refund {
  public readonly id: string;
  public readonly orderId: string;
  public readonly paymentId: string;
  public readonly customerId: string;
  public amount: number;
  public readonly currency: string;
  public reason: RefundReason;
  public description?: string;
  public status: RefundStatus;
  public isPartial: boolean;
  public partialAmount?: number;
  public reviewerId?: string;
  public reviewerNotes?: string;
  public transactionId?: string;
  public errorMessage?: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  public processedAt?: Date;

  constructor(data: Partial<Refund> & { id: string; orderId: string; paymentId: string; customerId: string; amount: number; currency: string; reason: RefundReason }) {
    this.id = data.id;
    this.orderId = data.orderId;
    this.paymentId = data.paymentId;
    this.customerId = data.customerId;
    this.amount = data.amount;
    this.currency = data.currency;
    this.reason = data.reason;
    this.description = data.description;
    this.status = data.status || RefundStatus.PENDING;
    this.isPartial = data.isPartial || false;
    this.partialAmount = data.partialAmount;
    this.reviewerId = data.reviewerId;
    this.reviewerNotes = data.reviewerNotes;
    this.transactionId = data.transactionId;
    this.errorMessage = data.errorMessage;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.processedAt = data.processedAt;
  }

  /**
   * Create a Refund instance from a create request
   */
  public static fromCreateRequest(request: CreateRefundRequest, id: string): Refund {
    return new Refund({
      id,
      orderId: request.orderId,
      paymentId: request.paymentId,
      customerId: request.customerId,
      amount: request.amount,
      currency: request.currency,
      reason: request.reason,
      description: request.description,
      isPartial: request.isPartial || false,
      partialAmount: request.partialAmount,
      status: RefundStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Get the actual refund amount (full or partial)
   */
  public getRefundAmount(): number {
    if (this.isPartial && this.partialAmount) {
      return this.partialAmount;
    }
    return this.amount;
  }

  /**
   * Check if the refund can be approved
   */
  public canBeApproved(): boolean {
    return this.status === RefundStatus.PENDING;
  }

  /**
   * Check if the refund can be rejected
   */
  public canBeRejected(): boolean {
    return this.status === RefundStatus.PENDING;
  }

  /**
   * Check if the refund can be processed
   */
  public canBeProcessed(): boolean {
    return this.status === RefundStatus.APPROVED;
  }

  /**
   * Check if the refund can be cancelled
   */
  public canBeCancelled(): boolean {
    return this.status === RefundStatus.PENDING;
  }

  /**
   * Approve the refund
   */
  public approve(reviewerId: string, notes?: string): void {
    if (!this.canBeApproved()) {
      throw new Error(`Cannot approve refund in status: ${this.status}`);
    }
    this.status = RefundStatus.APPROVED;
    this.reviewerId = reviewerId;
    this.reviewerNotes = notes;
    this.updatedAt = new Date();
  }

  /**
   * Reject the refund
   */
  public reject(reviewerId: string, notes?: string): void {
    if (!this.canBeRejected()) {
      throw new Error(`Cannot reject refund in status: ${this.status}`);
    }
    this.status = RefundStatus.REJECTED;
    this.reviewerId = reviewerId;
    this.reviewerNotes = notes;
    this.updatedAt = new Date();
  }

  /**
   * Mark refund as processing
   */
  public markAsProcessing(): void {
    if (!this.canBeProcessed()) {
      throw new Error(`Cannot process refund in status: ${this.status}`);
    }
    this.status = RefundStatus.PROCESSING;
    this.updatedAt = new Date();
  }

  /**
   * Mark refund as completed
   */
  public complete(transactionId: string): void {
    if (this.status !== RefundStatus.PROCESSING) {
      throw new Error(`Cannot complete refund in status: ${this.status}`);
    }
    this.status = RefundStatus.COMPLETED;
    this.transactionId = transactionId;
    this.processedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Mark refund as failed
   */
  public fail(errorMessage: string): void {
    if (this.status !== RefundStatus.PROCESSING) {
      throw new Error(`Cannot fail refund in status: ${this.status}`);
    }
    this.status = RefundStatus.FAILED;
    this.errorMessage = errorMessage;
    this.updatedAt = new Date();
  }

  /**
   * Cancel the refund
   */
  public cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error(`Cannot cancel refund in status: ${this.status}`);
    }
    this.status = RefundStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  /**
   * Convert to plain object for storage
   */
  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      orderId: this.orderId,
      paymentId: this.paymentId,
      customerId: this.customerId,
      amount: this.amount,
      currency: this.currency,
      reason: this.reason,
      description: this.description,
      status: this.status,
      isPartial: this.isPartial,
      partialAmount: this.partialAmount,
      reviewerId: this.reviewerId,
      reviewerNotes: this.reviewerNotes,
      transactionId: this.transactionId,
      errorMessage: this.errorMessage,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      processedAt: this.processedAt?.toISOString()
    };
  }

  /**
   * Create a Refund instance from a stored object
   */
  public static fromJSON(data: Record<string, unknown>): Refund {
    return new Refund({
      id: data.id as string,
      orderId: data.orderId as string,
      paymentId: data.paymentId as string,
      customerId: data.customerId as string,
      amount: data.amount as number,
      currency: data.currency as string,
      reason: data.reason as RefundReason,
      description: data.description as string | undefined,
      status: data.status as RefundStatus,
      isPartial: data.isPartial as boolean,
      partialAmount: data.partialAmount as number | undefined,
      reviewerId: data.reviewerId as string | undefined,
      reviewerNotes: data.reviewerNotes as string | undefined,
      transactionId: data.transactionId as string | undefined,
      errorMessage: data.errorMessage as string | undefined,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
      processedAt: data.processedAt ? new Date(data.processedAt as string) : undefined
    });
  }
}

/**
 * Refund Repository
 * In-memory storage for refunds (replace with actual database in production)
 */
export class RefundRepository {
  private refunds: Map<string, Refund> = new Map();

  /**
   * Save a refund
   */
  public save(refund: Refund): Refund {
    this.refunds.set(refund.id, refund);
    return refund;
  }

  /**
   * Find a refund by ID
   */
  public findById(id: string): Refund | undefined {
    return this.refunds.get(id);
  }

  /**
   * Find all refunds
   */
  public findAll(): Refund[] {
    return Array.from(this.refunds.values());
  }

  /**
   * Find refunds by customer ID
   */
  public findByCustomerId(customerId: string): Refund[] {
    return Array.from(this.refunds.values()).filter(
      refund => refund.customerId === customerId
    );
  }

  /**
   * Find refunds by order ID
   */
  public findByOrderId(orderId: string): Refund[] {
    return Array.from(this.refunds.values()).filter(
      refund => refund.orderId === orderId
    );
  }

  /**
   * Find refunds by payment ID
   */
  public findByPaymentId(paymentId: string): Refund[] {
    return Array.from(this.refunds.values()).filter(
      refund => refund.paymentId === paymentId
    );
  }

  /**
   * Find refunds by status
   */
  public findByStatus(status: RefundStatus): Refund[] {
    return Array.from(this.refunds.values()).filter(
      refund => refund.status === status
    );
  }

  /**
   * Find refunds with filters
   */
  public findWithFilters(filters: RefundFilters, page: number = 1, limit: number = 20): { data: Refund[]; total: number } {
    let results = Array.from(this.refunds.values());

    if (filters.status) {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters.customerId) {
      results = results.filter(r => r.customerId === filters.customerId);
    }
    if (filters.orderId) {
      results = results.filter(r => r.orderId === filters.orderId);
    }
    if (filters.reason) {
      results = results.filter(r => r.reason === filters.reason);
    }
    if (filters.startDate) {
      results = results.filter(r => r.createdAt >= filters.startDate!);
    }
    if (filters.endDate) {
      results = results.filter(r => r.createdAt <= filters.endDate!);
    }
    if (filters.minAmount !== undefined) {
      results = results.filter(r => r.getRefundAmount() >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      results = results.filter(r => r.getRefundAmount() <= filters.maxAmount!);
    }

    // Sort by createdAt descending
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginatedResults = results.slice(startIndex, startIndex + limit);

    return { data: paginatedResults, total };
  }

  /**
   * Get statistics
   */
  public getStatistics(): RefundStatistics {
    const allRefunds = Array.from(this.refunds.values());
    const totalRefunds = allRefunds.length;
    const totalAmount = allRefunds.reduce((sum, r) => sum + r.getRefundAmount(), 0);

    const statusCounts = {
      pending: allRefunds.filter(r => r.status === RefundStatus.PENDING).length,
      approved: allRefunds.filter(r => r.status === RefundStatus.APPROVED).length,
      rejected: allRefunds.filter(r => r.status === RefundStatus.REJECTED).length,
      completed: allRefunds.filter(r => r.status === RefundStatus.COMPLETED).length,
      failed: allRefunds.filter(r => r.status === RefundStatus.FAILED).length
    };

    return {
      totalRefunds,
      totalAmount,
      pendingCount: statusCounts.pending,
      approvedCount: statusCounts.approved,
      rejectedCount: statusCounts.rejected,
      completedCount: statusCounts.completed,
      failedCount: statusCounts.failed,
      averageRefundAmount: totalRefunds > 0 ? totalAmount / totalRefunds : 0,
      refundRate: 0 // Would need total orders to calculate
    };
  }

  /**
   * Delete a refund
   */
  public delete(id: string): boolean {
    return this.refunds.delete(id);
  }

  /**
   * Clear all refunds
   */
  public clear(): void {
    this.refunds.clear();
  }
}
