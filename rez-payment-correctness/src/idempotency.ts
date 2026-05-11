/**
 * REZ Idempotency Middleware
 * Ensures transactions are processed exactly once.
 */

import { v4 as uuidv4 } from 'uuid';

export interface IdempotencyRecord {
  id: string;
  key: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  response?: any;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface IdempotentOperation<T> {
  operation: () => Promise<T>;
  key: string;
  ttlMs?: number;
}

export class IdempotencySystem {
  private store: Map<string, IdempotencyRecord> = new Map();
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check if operation already processed
   */
  isProcessed(key: string): boolean {
    const record = this.store.get(key);
    return record?.status === 'COMPLETED';
  }

  /**
   * Check if operation is processing
   */
  isProcessing(key: string): boolean {
    const record = this.store.get(key);
    return record?.status === 'PROCESSING';
  }

  /**
   * Mark operation as processing (lock)
   */
  lock(key: string, ttlMs?: number): boolean {
    const record = this.store.get(key);

    // Already processing or completed
    if (record) {
      return false;
    }

    this.store.set(key, {
      id: uuidv4(),
      key,
      status: 'PROCESSING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (ttlMs || this.DEFAULT_TTL),
    });

    return true;
  }

  /**
   * Mark operation as completed
   */
  complete(key: string, response: any): void {
    const record = this.store.get(key);
    if (record) {
      record.status = 'COMPLETED';
      record.response = response;
      record.completedAt = new Date();
    }
  }

  /**
   * Mark operation as failed (allows retry
   */
  fail(key: string): void {
    const record = this.store.get(key);
    if (record) {
      record.status = 'FAILED';
      record.completedAt = new Date();
    }
    this.store.delete(key);
  }

  /**
   * Execute operation idempotently
   */
  async execute<T>(params: IdempotentOperation<T>): Promise<{ result?: T; cached: boolean }> {
    const { operation, key, ttlMs } = params;

    // Check if already processed
    const existing = this.store.get(key);
    if (existing?.status === 'COMPLETED') {
      return { result: existing.response, cached: true };
    }

    // Try to lock
    const locked = this.lock(key, ttlMs);
    if (!locked) {
      // Another process is handling this
      // Wait for it to complete
      await this.waitForCompletion(key);
      const final = this.store.get(key);
      if (final?.status === 'COMPLETED') {
        return { result: final.response, cached: true };
      }
    }

    try {
      const result = await operation();
      this.complete(key, result);
      return { result, cached: false };
    } catch (error) {
      this.fail(key);
      throw error;
    }
  }

  /**
   * Wait for operation to complete
   */
  private async waitForCompletion(key: string, maxWait = 30000): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < maxWait) {
      const record = this.store.get(key);
      if (record?.status === 'COMPLETED' || record?.status === 'FAILED') {
        return;
      }
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Timeout waiting for ${key}`);
  }

  /**
   * Generate idempotency key for payment
   */
  static paymentKey(userId: string, orderId: string, action: string): string {
    return `payment:${userId}:${orderId}:${action}:${Date.now().toString(36)}`;
  }

  /**
   * Generate idempotency key for wallet operation
   */
  static walletKey(userId: string, operation: string, referenceId: string): string {
    return `wallet:${userId}:${operation}:${referenceId}`;
  }

  /**
   * Clear expired records (cleanup)
   */
  cleanup(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, record] of this.store) {
      if (record.expiresAt.getTime() < now) {
        this.store.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get record
   */
  get(key: string): IdempotencyRecord | undefined {
    return this.store.get(key);
  }

  /**
   * Get all records
   */
  getAll(): IdempotencyRecord[] {
    return Array.from(this.store.values());
  }
}

export const idempotency = new IdempotencySystem();
export default idempotency;
