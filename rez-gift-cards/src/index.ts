/**
 * ReZ Gift Card System
 * A complete gift card management system with create, check balance, redeem, and expiry handling.
 */

import crypto from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface GiftCard {
  id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  redeemedAt?: Date;
  transactionHistory: GiftCardTransaction[];
}

export interface GiftCardTransaction {
  id: string;
  type: 'CREATE' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  amount: number;
  description: string;
  timestamp: Date;
  balanceAfter: number;
}

export interface CreateGiftCardOptions {
  initialBalance: number;
  currency?: string;
  expiryMonths?: number;
  code?: string;
}

export interface RedeemGiftCardOptions {
  amount: number;
  description?: string;
}

export interface GiftCardResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: 'CARD_NOT_FOUND' | 'INSUFFICIENT_BALANCE' | 'CARD_EXPIRED' | 'CARD_INACTIVE' | 'INVALID_AMOUNT';
}

export interface GiftCardBalance {
  id: string;
  code: string;
  currentBalance: number;
  currency: string;
  expiresAt: Date;
  isExpired: boolean;
  daysUntilExpiry: number;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_EXPIRY_MONTHS = 12;
const DEFAULT_CURRENCY = 'USD';
const MIN_GIFT_CARD_BALANCE = 0;
const MAX_GIFT_CARD_BALANCE = 10000;

// ============================================================================
// Gift Card Store (In-Memory - Replace with Database in Production)
// ============================================================================

class GiftCardStore {
  private cards: Map<string, GiftCard> = new Map();
  private codeIndex: Map<string, string> = new Map(); // code -> id

  generateId(): string {
    return crypto.randomUUID();
  }

  generateCode(): string {
    // Format: GIFT-XXXX-XXXX-XXXX (alphanumeric)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [4, 4, 4];
    return segments
      .map(len =>
        Array.from({ length: len }, () =>
          chars.charAt(crypto.randomInt(0, chars.length))
        ).join('')
      )
      .join('-')
      .replace(/^([A-Z0-9]{4})/, 'GIFT-$1');
  }

  async create(card: GiftCard): Promise<GiftCard> {
    this.cards.set(card.id, card);
    this.codeIndex.set(card.code, card.id);
    return card;
  }

  async getById(id: string): Promise<GiftCard | undefined> {
    return this.cards.get(id);
  }

  async getByCode(code: string): Promise<GiftCard | undefined> {
    const id = this.codeIndex.get(code.toUpperCase());
    return id ? this.cards.get(id) : undefined;
  }

  async update(card: GiftCard): Promise<GiftCard> {
    this.cards.set(card.id, card);
    return card;
  }

  async getAll(): Promise<GiftCard[]> {
    return Array.from(this.cards.values());
  }

  async getActiveCards(): Promise<GiftCard[]> {
    return Array.from(this.cards.values()).filter(card => card.isActive);
  }

  async getExpiredCards(): Promise<GiftCard[]> {
    const now = new Date();
    return Array.from(this.cards.values()).filter(
      card => card.isActive && card.expiresAt <= now
    );
  }
}

// ============================================================================
// Gift Card Service
// ============================================================================

export class GiftCardService {
  private store: GiftCardStore;

  constructor(store?: GiftCardStore) {
    this.store = store || new GiftCardStore();
  }

  /**
   * Create a new gift card
   */
  async createCard(options: CreateGiftCardOptions): Promise<GiftCardResult<GiftCard>> {
    // Validate initial balance
    if (options.initialBalance < MIN_GIFT_CARD_BALANCE) {
      return {
        success: false,
        error: `Initial balance must be at least ${MIN_GIFT_CARD_BALANCE}`,
        errorCode: 'INVALID_AMOUNT',
      };
    }

    if (options.initialBalance > MAX_GIFT_CARD_BALANCE) {
      return {
        success: false,
        error: `Initial balance cannot exceed ${MAX_GIFT_CARD_BALANCE}`,
        errorCode: 'INVALID_AMOUNT',
      };
    }

    if (!Number.isFinite(options.initialBalance) || options.initialBalance <= 0) {
      return {
        success: false,
        error: 'Initial balance must be a positive number',
        errorCode: 'INVALID_AMOUNT',
      };
    }

    const now = new Date();
    const expiryMonths = options.expiryMonths ?? DEFAULT_EXPIRY_MONTHS;
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + expiryMonths);

    const transactionId = crypto.randomUUID();

    const giftCard: GiftCard = {
      id: this.store.generateId(),
      code: options.code || this.store.generateCode(),
      initialBalance: options.initialBalance,
      currentBalance: options.initialBalance,
      currency: options.currency ?? DEFAULT_CURRENCY,
      createdAt: now,
      expiresAt,
      isActive: true,
      transactionHistory: [
        {
          id: transactionId,
          type: 'CREATE',
          amount: options.initialBalance,
          description: 'Gift card created',
          timestamp: now,
          balanceAfter: options.initialBalance,
        },
      ],
    };

    await this.store.create(giftCard);

    return {
      success: true,
      data: giftCard,
    };
  }

  /**
   * Check balance of a gift card
   */
  async checkBalance(identifier: string): Promise<GiftCardResult<GiftCardBalance>> {
    const card = await this.store.getByCode(identifier) || await this.store.getById(identifier);

    if (!card) {
      return {
        success: false,
        error: 'Gift card not found',
        errorCode: 'CARD_NOT_FOUND',
      };
    }

    const now = new Date();
    const isExpired = card.expiresAt <= now || !card.isActive;
    const daysUntilExpiry = Math.max(
      0,
      Math.ceil((card.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      success: true,
      data: {
        id: card.id,
        code: card.code,
        currentBalance: card.currentBalance,
        currency: card.currency,
        expiresAt: card.expiresAt,
        isExpired,
        daysUntilExpiry,
      },
    };
  }

  /**
   * Redeem (spend) from a gift card
   */
  async redeemCard(identifier: string, options: RedeemGiftCardOptions): Promise<GiftCardResult<GiftCard>> {
    const card = await this.store.getByCode(identifier) || await this.store.getById(identifier);

    if (!card) {
      return {
        success: false,
        error: 'Gift card not found',
        errorCode: 'CARD_NOT_FOUND',
      };
    }

    // Check if card is expired
    const now = new Date();
    if (card.expiresAt <= now) {
      return {
        success: false,
        error: 'Gift card has expired',
        errorCode: 'CARD_EXPIRED',
      };
    }

    // Check if card is inactive
    if (!card.isActive) {
      return {
        success: false,
        error: 'Gift card is no longer active',
        errorCode: 'CARD_INACTIVE',
      };
    }

    // Validate redemption amount
    if (!Number.isFinite(options.amount) || options.amount <= 0) {
      return {
        success: false,
        error: 'Redemption amount must be a positive number',
        errorCode: 'INVALID_AMOUNT',
      };
    }

    // Check sufficient balance
    if (options.amount > card.currentBalance) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${card.currency} ${card.currentBalance.toFixed(2)}`,
        errorCode: 'INSUFFICIENT_BALANCE',
      };
    }

    // Process redemption
    const newBalance = card.currentBalance - options.amount;
    const transaction: GiftCardTransaction = {
      id: crypto.randomUUID(),
      type: 'REDEEM',
      amount: -options.amount,
      description: options.description || 'Redemption',
      timestamp: now,
      balanceAfter: newBalance,
    };

    card.currentBalance = newBalance;
    card.transactionHistory.push(transaction);

    // Deactivate card if balance reaches zero
    if (newBalance === 0) {
      card.isActive = false;
      card.redeemedAt = now;
    }

    await this.store.update(card);

    return {
      success: true,
      data: card,
    };
  }

  /**
   * Process expired cards (should be called periodically)
   */
  async processExpiredCards(): Promise<GiftCardResult<{ processed: number; expiredCards: GiftCard[] }>> {
    const expiredCards = await this.store.getExpiredCards();
    const now = new Date();
    const processedCards: GiftCard[] = [];

    for (const card of expiredCards) {
      const transaction: GiftCardTransaction = {
        id: crypto.randomUUID(),
        type: 'EXPIRE',
        amount: -card.currentBalance,
        description: 'Gift card expired',
        timestamp: now,
        balanceAfter: 0,
      };

      card.currentBalance = 0;
      card.isActive = false;
      card.transactionHistory.push(transaction);
      processedCards.push(card);

      await this.store.update(card);
    }

    return {
      success: true,
      data: {
        processed: processedCards.length,
        expiredCards: processedCards,
      },
    };
  }

  /**
   * Get full gift card details by identifier
   */
  async getCard(identifier: string): Promise<GiftCardResult<GiftCard>> {
    const card = await this.store.getByCode(identifier) || await this.store.getById(identifier);

    if (!card) {
      return {
        success: false,
        error: 'Gift card not found',
        errorCode: 'CARD_NOT_FOUND',
      };
    }

    return {
      success: true,
      data: card,
    };
  }

  /**
   * Deactivate a gift card manually
   */
  async deactivateCard(identifier: string): Promise<GiftCardResult<GiftCard>> {
    const card = await this.store.getByCode(identifier) || await this.store.getById(identifier);

    if (!card) {
      return {
        success: false,
        error: 'Gift card not found',
        errorCode: 'CARD_NOT_FOUND',
      };
    }

    card.isActive = false;
    await this.store.update(card);

    return {
      success: true,
      data: card,
    };
  }
}

// ============================================================================
// Default Export & Convenience Functions
// ============================================================================

export const giftCardService = new GiftCardService();

export const createCard = (options: CreateGiftCardOptions) => giftCardService.createCard(options);
export const checkBalance = (identifier: string) => giftCardService.checkBalance(identifier);
export const redeemCard = (identifier: string, options: RedeemGiftCardOptions) => giftCardService.redeemCard(identifier, options);
export const processExpiredCards = () => giftCardService.processExpiredCards();
export const getCard = (identifier: string) => giftCardService.getCard(identifier);
export const deactivateCard = (identifier: string) => giftCardService.deactivateCard(identifier);

export default GiftCardService;
