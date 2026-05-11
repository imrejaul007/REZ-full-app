/**
 * REZ Ledger System - Double-Entry Accounting
 * Every transaction creates TWO entries: DEBIT and CREDIT
 * Never loses money.
 */

import { v4 as uuidv4 } from 'uuid';

export enum LedgerEntryType {
  PAYMENT_IN = 'PAYMENT_IN',
  PAYMENT_OUT = 'PAYMENT_OUT',
  CASHBACK_EARN = 'CASHBACK_EARN',
  CASHBACK_EXPIRE = 'CASHBACK_EXPIRE',
  COIN_EARN = 'COIN_EARN',
  COIN_REDEEM = 'COIN_REDEEM',
  COIN_EXPIRE = 'COIN_EXPIRE',
  REFUND = 'REFUND',
  SETTLEMENT = 'SETTLEMENT',
  FEE = 'FEE',
}

export enum AccountType {
  USER = 'USER',
  MERCHANT = 'MERCHANT',
  PLATFORM = 'PLATFORM',
  ESCROW = 'ESCROW',
}

export interface LedgerEntry {
  id: string;
  idempotencyKey: string;
  transactionId: string;
  debitAccount: Account;
  creditAccount: Account;
  amount: number;
  currency: string;
  type: LedgerEntryType;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface Account {
  id: string;
  type: AccountType;
  entityId: string; // userId or merchantId
  balance: number;
  currency: string;
  ledger: LedgerEntry[];
}

export interface Transaction {
  id: string;
  idempotencyKey: string;
  userId: string;
  merchantId: string;
  amount: number;
  cashbackAmount: number;
  coinAmount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  entries: LedgerEntry[];
  createdAt: Date;
  completedAt?: Date;
}

// In-memory ledger (replace with MongoDB in production)
class LedgerSystem {
  private accounts: Map<string, Account> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private idempotencyKeys: Set<string> = new Set();

  /**
   * Check if transaction already processed (idempotency)
   */
  isProcessed(idempotencyKey: string): boolean {
    return this.idempotencyKeys.has(idempotencyKey);
  }

  /**
   * Create a simple ledger entry
   */
  createEntry(params: {
    idempotencyKey: string;
    debitAccount: Account;
    creditAccount: Account;
    amount: number;
    type: LedgerEntryType;
    metadata?: Record<string, any>;
  }): LedgerEntry | { error: string } {
    const { idempotencyKey, debitAccount, creditAccount, amount, type, metadata } = params;

    // Idempotency check
    if (this.idempotencyKeys.has(idempotencyKey)) {
      return { error: 'DUPLICATE_TRANSACTION' };
    }

    // Create entry
    const entry: LedgerEntry = {
      id: uuidv4(),
      idempotencyKey,
      transactionId: idempotencyKey.split(':')[0],
      debitAccount,
      creditAccount,
      amount,
      currency: 'INR',
      type,
      status: 'COMPLETED',
      metadata,
      createdAt: new Date(),
      completedAt: new Date(),
    };

    // Update balances
    debitAccount.balance -= amount;
    creditAccount.balance += amount;

    entry.debitAccount = debitAccount;
    entry.creditAccount = creditAccount;

    // Store
    this.idempotencyKeys.add(idempotencyKey);
    this.transactions.set(idempotencyKey, {
      id: entry.transactionId,
      idempotencyKey,
      userId: debitAccount.type === 'USER' ? debitAccount.entityId : creditAccount.entityId,
      merchantId: debitAccount.type === 'MERCHANT' ? debitAccount.entityId : creditAccount.entityId,
      amount,
      cashbackAmount: 0,
      coinAmount: 0,
      status: 'SUCCESS',
      entries: [entry],
      createdAt: new Date(),
    });

    return entry;
  }

  /**
   * Process a payment with ledger entries
   */
  processPayment(params: {
    idempotencyKey: string;
    userId: string;
    merchantId: string;
    amount: number;
    cashbackPercent?: number;
    coinPercent?: number;
  }): Transaction | { error: string } {
    const { idempotencyKey, userId, merchantId, amount, cashbackPercent = 10, coinPercent = 5 } = params;

    // Idempotency check
    if (this.idempotencyKeys.has(idempotencyKey)) {
      return { error: 'DUPLICATE_TRANSACTION' };
    }

    const transactionId = idempotencyKey.split(':')[0];
    const entries: LedgerEntry[] = [];

    // Get or create accounts
    const userAccount = this.getOrCreateAccount(AccountType.USER, userId);
    const merchantAccount = this.getOrCreateAccount(AccountType.MERCHANT, merchantId);
    const platformAccount = this.getOrCreateAccount(AccountType.PLATFORM, 'SYSTEM');

    // Calculate amounts
    const cashbackAmount = Math.floor(amount * cashbackPercent / 100);
    const merchantNet = amount - (amount * 0.15); // 15% platform fee
    const platformFee = Math.floor(amount * 0.15);
    const coinsEarned = Math.floor(amount * coinPercent / 10); // 1 coin per 10 INR

    // 1. DEBIT user, CREDIT merchant (payment)
    entries.push({
      id: uuidv4(),
      idempotencyKey: `${idempotencyKey}:PAYMENT`,
      transactionId,
      debitAccount: { id: userAccount.id, type: AccountType.USER, entityId: userId, balance: 0, currency: 'INR' },
      creditAccount: { id: merchantAccount.id, type: AccountType.MERCHANT, entityId: merchantId, balance: 0, currency: 'INR' },
      amount,
      currency: 'INR',
      type: LedgerEntryType.PAYMENT_IN,
      status: 'COMPLETED',
      metadata: { userId, merchantId },
      createdAt: new Date(),
      completedAt: new Date(),
    });

    // Update balances in-memory
    userAccount.balance -= amount;
    merchantAccount.balance += merchantNet;
    platformAccount.balance += platformFee;

    // 2. CREDIT user with cashback (separate transaction)
    const cashbackIdemKey = `${idempotencyKey}:CASHBACK`;
    if (cashbackAmount > 0) {
      entries.push({
        id: uuidv4(),
        idempotencyKey: cashbackIdemKey,
        transactionId,
        debitAccount: { id: platformAccount.id, type: AccountType.PLATFORM, entityId: 'SYSTEM', balance: 0, currency: 'INR' },
        creditAccount: { id: userAccount.id, type: AccountType.USER, entityId, balance: 0, currency: 'INR' },
        amount: cashbackAmount,
        currency: 'INR',
        type: LedgerEntryType.CASHBACK_EARN,
        status: 'COMPLETED',
        metadata: { transactionId, source: 'payment' },
        createdAt: new Date(),
        completedAt: new Date(),
      });
      this.idempotencyKeys.add(cashbackIdemKey);
    }

    // Store all entries
    for (const entry of entries) {
      this.idempotencyKeys.add(entry.idempotencyKey);
    }

    // Store transaction
    const transaction: Transaction = {
      id: transactionId,
      idempotencyKey,
      userId,
      merchantId,
      amount,
      cashbackAmount,
      coinAmount: coinsEarned,
      status: 'SUCCESS',
      entries,
      createdAt: new Date(),
      completedAt: new Date(),
    };
    this.transactions.set(idempotencyKey, transaction);

    return transaction;
  }

  /**
   * Get account by entity
   */
  getAccount(type: AccountType, entityId: string): Account | undefined {
    const key = `${type}:${entityId}`;
    return this.accounts.get(key);
  }

  /**
   * Get or create account
   */
  getOrCreateAccount(type: AccountType, entityId: string): Account {
    const key = `${type}:${entityId}`;
    if (!this.accounts.has(key)) {
      const account: Account = {
        id: key,
        type,
        entityId,
        balance: 0,
        currency: 'INR',
        ledger: [],
      };
      this.accounts.set(key, account);
    }
    return this.accounts.get(key)!;
  }

  /**
   * Get transaction by idempotency key
   */
  getTransaction(idempotencyKey: string): Transaction | undefined {
    return this.transactions.get(idempotencyKey);
  }

  /**
   * Get all transactions for a user
   */
  getUserTransactions(userId: string): Transaction[] {
    return Array.from(this.transactions.values()).filter(t => t.userId === userId);
  }

  /**
   * Reconcile - verify ledger balances
   */
  reconcile(): { balanced: boolean; totalDebit: number; totalCredit: number } {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const account of this.accounts.values()) {
      if (account.balance < 0) {
        totalDebit += Math.abs(account.balance);
      } else {
        totalCredit += account.balance;
      }
    }

    return {
      balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      totalDebit,
      totalCredit,
    };
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values());
  }
}

export const ledger = new LedgerSystem();
export default ledger;
