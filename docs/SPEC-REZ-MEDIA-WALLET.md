# REZ Media Wallet - Complete Specification

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** May 12, 2026

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Wallet Features](#3-wallet-features)
4. [Credit System](#4-credit-system)
5. [Payment Integration](#5-payment-integration)
6. [Billing & Pricing](#6-billing--pricing)
7. [API Endpoints](#7-api-endpoints)

---

# 1. OVERVIEW

## 1.1 What is REZ Media Wallet?

REZ Media Wallet enables merchants to pay for REZ Media services (WhatsApp messages, AI voice calls, campaigns) using a credit-based system.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ MEDIA WALLET - AT A GLANCE                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    MERCHANT DASHBOARD                                  │  │
│  │                                                                       │  │
│  │  REZ MEDIA WALLET                                                  │  │
│  │  ──────────────────────────────────────────────────────────────   │  │
│  │                                                                       │  │
│  │  Balance: 2,500 credits                                           │  │
│  │                                                                       │  │
│  │  This Month:                                                      │  │
│  │  ├── WhatsApp: 1,234 messages = 123.40 credits                   │  │
│  │  ├── AI Voice: 56 minutes = 28.00 credits                        │  │
│  │  └── Campaigns: 15,000 sends = 15,000.00 credits                 │  │
│  │  ──────────────────────────────────────────────────────────────   │  │
│  │  Total Spent: 15,151.40 credits                                  │  │
│  │                                                                       │  │
│  │  [Purchase Credits] [Auto-Recharge Settings] [View Usage]        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Credit System

| Service | Credits | Cost |
|---------|---------|------|
| WhatsApp Message | 1 | ₹0.10 |
| AI Voice Call (per minute) | 1 | ₹0.50 |
| Campaign Send (per recipient) | 1 | ₹1.00 |
| AI Copilot Query | 1 | ₹0.05 |
| Analytics Export | 10 | ₹1.00 |

---

# 2. ARCHITECTURE

## 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ MEDIA WALLET - ARCHITECTURE                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              MERCHANT APPS                                   │
│                         (POS, Dashboard, Copilot)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ MEDIA WALLET SERVICE                            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                           WALLET API                                    │  │
│  │  • GET /balance    • POST /recharge    • GET /transactions          │  │
│  │  • POST /deduct    • PUT /settings    • GET /usage                 │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      CREDIT ENGINE                                    │  │
│  │  • Rate calculation    • Credit deduction    • Refund processing     │  │
│  │  • Auto-recharge      • Balance tracking     • Low balance alerts    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      PRICING ENGINE                                    │  │
│  │  • Service pricing    • Volume discounts    • Tier management         │  │
│  │  • Promo codes        • Loyalty tiers       • Usage analytics         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
        │   WhatsApp       │ │    Voice         │ │   Campaigns      │
        │   Service        │ │    Service       │ │   Service        │
        └───────────────────┘ └───────────────────┘ └───────────────────┘
```

---

# 3. WALLET FEATURES

## 3.1 Wallet Data Model

```typescript
interface MediaWallet {
  walletId: string;
  merchantId: string;

  // Balance
  balance: {
    current: number;           // Available credits
    reserved: number;         // Reserved for pending operations
    total: number;           // current + reserved
    lifetimePurchased: number;
    lifetimeUsed: number;
  };

  // Auto-recharge
  autoRecharge: {
    enabled: boolean;
    threshold: number;        // Trigger when balance < threshold
    amount: number;           // Amount to recharge
    paymentMethodId: string;
    maxAutoRecharges: number; // Per day limit
    autoRechargesToday: number;
  };

  // Settings
  settings: {
    lowBalanceAlert: boolean;
    lowBalanceThreshold: number;
    alertEmail: boolean;
    alertWhatsApp: boolean;
    defaultPaymentMethod: 'REZ_WALLET' | 'UPI' | 'CARD';
  };

  // Tier
  tier: 'FREE' | 'STARTER' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  tierBenefits: {
    discount: number;         // Percentage discount on credits
    prioritySupport: boolean;
    dedicatedAccountManager: boolean;
    customPricing: boolean;
  };

  // Usage limits
  usageLimits: {
    monthlyCredits: number;   // Included in plan
    monthlyUsed: number;
    resetsAt: Date;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastRechargedAt?: Date;
}
```

## 3.2 Transaction Types

```typescript
interface WalletTransaction {
  transactionId: string;
  walletId: string;
  merchantId: string;

  // Type
  type: 'DEBIT' | 'CREDIT' | 'ADJUSTMENT';
  category: 'USAGE' | 'RECHARGE' | 'REFUND' | 'BONUS' | 'ADJUSTMENT';

  // Amount
  credits: number;
  rate: number;              // Cost per credit at time of transaction
  amountInr: number;         // Actual cost in rupees

  // Source
  source: {
    service: 'WHATSAPP' | 'VOICE' | 'CAMPAIGN' | 'COPILOT' | 'MANUAL';
    operation: string;        // 'message_sent', 'minute_used', 'campaign_sent'
    reference: string;       // Service-specific reference (call ID, message ID, etc.)
  };

  // Details
  details: {
    // For usage
    channel?: string;
    duration?: number;       // For voice (seconds)
    recipients?: number;     // For campaign

    // For recharge
    paymentId?: string;
    paymentMethod?: string;
    promoCode?: string;
    bonusCredits?: number;

    // For refund
    originalTransactionId?: string;
    refundReason?: string;
  };

  // Balance
  balanceBefore: number;
  balanceAfter: number;

  // Status
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  createdAt: Date;
  completedAt?: Date;
}
```

## 3.3 Credit Deduction Flow

```typescript
// Credit deduction when service is used
async function deductCredits(
  merchantId: string,
  service: ServiceType,
  operation: string,
  details: OperationDetails
): Promise<DeductionResult> {
  // 1. Get pricing for service
  const pricing = getPricing(service, merchantId);

  // 2. Calculate credits
  const credits = calculateCredits(service, operation, details);

  // 3. Check balance
  const wallet = await getWallet(merchantId);
  if (wallet.balance.current < credits) {
    // Check auto-recharge
    if (wallet.autoRecharge.enabled && shouldAutoRecharge(wallet)) {
      await triggerAutoRecharge(merchantId);
      // Retry after recharge
      const newWallet = await getWallet(merchantId);
      if (newWallet.balance.current < credits) {
        throw new InsufficientBalanceError(credits, newWallet.balance.current);
      }
    } else {
      throw new InsufficientBalanceError(credits, wallet.balance.current);
    }
  }

  // 4. Reserve credits (prevent double-spend)
  await reserveCredits(wallet.walletId, credits);

  try {
    // 5. Process the operation
    const result = await processServiceOperation(service, operation, details);

    // 6. Confirm deduction
    const transaction = await confirmDeduction(wallet.walletId, {
      credits,
      rate: pricing.rate,
      source: { service, operation, reference: result.reference }
    });

    return {
      success: true,
      transactionId: transaction.transactionId,
      creditsUsed: credits,
      balanceRemaining: transaction.balanceAfter
    };
  } catch (error) {
    // 7. Release reservation on failure
    await releaseReservation(wallet.walletId, credits);
    throw error;
  }
}
```

---

# 4. CREDIT SYSTEM

## 4.1 Credit Calculation

```typescript
interface CreditCalculator {
  // WhatsApp
  calculateWhatsAppCredits: (messageType: 'text' | 'template' | 'interactive') => number;

  // Voice
  calculateVoiceCredits: (durationSeconds: number) => number;

  // Campaign
  calculateCampaignCredits: (recipients: number, channel: 'whatsapp' | 'sms' | 'email') => number;

  // Copilot
  calculateCopilotCredits: (queryCount: number) => number;
}

// Credit rates
const creditRates = {
  whatsapp: {
    text: 1,
    template: 1,
    interactive: 1,
    media: 1
  },
  voice: {
    perMinute: 1,
    connectionFee: 0
  },
  campaign: {
    whatsapp: 1,
    sms: 0.5,
    email: 0.1
  },
  copilot: {
    perQuery: 1
  }
};
```

## 4.2 Volume Discounts

```typescript
interface VolumeDiscounts {
  // Credits purchased at once
  purchaseDiscounts: {
    500: { discount: 0, price: 50 },     // ₹0.10/credit
    1000: { discount: 10, price: 90 },   // ₹0.09/credit
    5000: { discount: 20, price: 400 },  // ₹0.08/credit
    10000: { discount: 30, price: 700 }, // ₹0.07/credit
    50000: { discount: 40, price: 3000 } // ₹0.06/credit
  };

  // Monthly usage discounts
  usageDiscounts: {
    monthly10000: { threshold: 10000, discount: 5 },   // 5% off
    monthly50000: { threshold: 50000, discount: 10 },  // 10% off
    monthly100000: { threshold: 100000, discount: 15 } // 15% off
  };

  // Tier discounts
  tierDiscounts: {
    FREE: 0,
    STARTER: 0,
    BASIC: 5,
    PRO: 10,
    ENTERPRISE: 15
  };
}
```

## 4.3 Promo Codes

```typescript
interface PromoCode {
  code: string;
  type: 'PERCENTAGE' | 'CREDITS' | 'DISCOUNT';
  value: number;
  minPurchase?: number;
  maxCredits?: number;
  validFrom: Date;
  validTo: Date;
  usageLimit?: number;
  usedCount: number;
  applicableTo: 'ALL' | 'WHATSAPP' | 'VOICE' | 'CAMPAIGN';
}

// Apply promo code
async function applyPromoCode(
  walletId: string,
  code: string,
  amount: number
): Promise<PromoResult> {
  const promo = await getPromoCode(code);

  // Validate
  if (!promo || promo.validTo < new Date()) {
    throw new InvalidPromoError();
  }
  if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
    throw new PromoLimitReachedError();
  }

  // Calculate discount
  let bonusCredits = 0;
  switch (promo.type) {
    case 'PERCENTAGE':
      bonusCredits = Math.floor(amount * promo.value / 100);
      break;
    case 'CREDITS':
      bonusCredits = promo.value;
      break;
    case 'DISCOUNT':
      // Convert discount amount to credits
      bonusCredits = promo.value / 0.10; // Assuming ₹0.10/credit
      break;
  }

  // Cap at max
  if (promo.maxCredits) {
    bonusCredits = Math.min(bonusCredits, promo.maxCredits);
  }

  return {
    creditsPurchased: amount / 0.10,
    bonusCredits,
    totalCredits: (amount / 0.10) + bonusCredits
  };
}
```

---

# 5. PAYMENT INTEGRATION

## 5.1 Recharge Flow

```typescript
interface RechargeRequest {
  merchantId: string;
  credits: number;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING';
  promoCode?: string;
  autoRecharge?: boolean;
}

interface RechargeResult {
  success: boolean;
  orderId: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  amountInr: number;
  paymentUrl?: string;    // For redirect to payment gateway
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

// Create recharge order
async function createRechargeOrder(
  request: RechargeRequest
): Promise<RechargeResult> {
  // 1. Calculate pricing
  const baseCredits = request.credits;
  let bonusCredits = 0;
  let discount = 0;

  // Apply volume discount
  const volumePricing = getVolumePricing(baseCredits);
  bonusCredits = volumePricing.bonusCredits;
  discount = volumePricing.discount;

  // Apply promo code
  if (request.promoCode) {
    const promoResult = await applyPromoCode(
      request.merchantId,
      request.promoCode,
      baseCredits
    );
    bonusCredits += promoResult.bonusCredits;
  }

  const totalCredits = baseCredits + bonusCredits;
  const amountInr = volumePricing.price;

  // 2. Create order
  const order = await createPaymentOrder({
    merchantId: request.merchantId,
    amount: amountInr,
    credits: totalCredits,
    paymentMethod: request.paymentMethod
  });

  // 3. Update auto-recharge settings if requested
  if (request.autoRecharge) {
    await updateAutoRecharge(request.merchantId, {
      enabled: true,
      threshold: Math.floor(totalCredits * 0.2),
      amount: totalCredits
    });
  }

  return {
    success: true,
    orderId: order.id,
    credits: baseCredits,
    bonusCredits,
    totalCredits,
    amountInr,
    paymentUrl: order.paymentUrl,
    status: 'PENDING'
  };
}
```

## 5.2 Payment Processing

```typescript
// Handle payment callback
async function handlePaymentCallback(
  orderId: string,
  paymentResult: PaymentResult
): Promise<void> {
  const order = await getOrder(orderId);

  if (paymentResult.status === 'SUCCESS') {
    // Credit the wallet
    await creditWallet(order.merchantId, {
      credits: order.credits,
      type: 'RECHARGE',
      source: {
        service: 'MANUAL',
        operation: 'purchase',
        reference: orderId
      },
      details: {
        paymentId: paymentResult.paymentId,
        promoCode: order.promoCode
      }
    });

    // Update order status
    await updateOrder(orderId, {
      status: 'COMPLETED',
      paymentId: paymentResult.paymentId,
      completedAt: new Date()
    });

    // Send confirmation
    await sendRechargeConfirmation(order.merchantId, order.credits);
  } else {
    // Handle failure
    await updateOrder(orderId, {
      status: 'FAILED',
      failureReason: paymentResult.error
    });
  }
}
```

---

# 6. BILLING & PRICING

## 6.1 Pricing Tables

```typescript
// Service pricing
const servicePricing = {
  whatsapp: {
    name: 'WhatsApp Messages',
    unit: 'per message',
    baseRate: 0.10,        // ₹0.10 per message
    tiers: [
      { min: 0, max: 1000, rate: 0.10 },
      { min: 1001, max: 10000, rate: 0.09 },
      { min: 10001, max: 50000, rate: 0.08 },
      { min: 50001, max: Infinity, rate: 0.07 }
    ]
  },
  voice: {
    name: 'AI Voice Calls',
    unit: 'per minute',
    baseRate: 0.50,        // ₹0.50 per minute
    tiers: [
      { min: 0, max: 100, rate: 0.50 },
      { min: 101, max: 500, rate: 0.45 },
      { min: 501, max: 2000, rate: 0.40 },
      { min: 2001, max: Infinity, rate: 0.35 }
    ]
  },
  campaign: {
    name: 'Campaign Sends',
    unit: 'per recipient',
    channelRates: {
      whatsapp: 1.00,
      sms: 0.50,
      email: 0.10
    }
  },
  copilot: {
    name: 'AI Copilot Queries',
    unit: 'per query',
    baseRate: 0.05
  }
};

// Recharge pricing
const rechargePricing = {
  STARTER: {
    minCredits: 500,
    pricePerCredit: 0.10,
    benefits: []
  },
  BASIC: {
    minCredits: 1000,
    pricePerCredit: 0.09,
    benefits: ['5% discount on usage']
  },
  PRO: {
    minCredits: 5000,
    pricePerCredit: 0.08,
    benefits: ['10% discount on usage', 'Priority support']
  },
  ENTERPRISE: {
    minCredits: 10000,
    pricePerCredit: 0.07,
    benefits: ['15% discount on usage', 'Dedicated support', 'Custom pricing']
  }
};
```

## 6.2 Usage Tracking

```typescript
interface UsageMetrics {
  merchantId: string;
  period: { start: Date; end: Date };

  // By service
  byService: {
    whatsapp: {
      messages: number;
      credits: number;
      costInr: number;
    };
    voice: {
      minutes: number;
      credits: number;
      costInr: number;
    };
    campaign: {
      sends: number;
      credits: number;
      costInr: number;
    };
    copilot: {
      queries: number;
      credits: number;
      costInr: number;
    };
  };

  // Total
  total: {
    credits: number;
    costInr: number;
  };

  // Trends
  trends: {
    comparedToLastPeriod: {
      percentChange: number;
      direction: 'UP' | 'DOWN';
    };
    dailyAverage: number;
    projectedMonthly: number;
  };
}
```

## 6.3 Low Balance Alerts

```typescript
// Alert configuration
interface AlertConfig {
  enabled: boolean;
  thresholds: number[];     // [500, 200, 100]
  channels: ('EMAIL' | 'WHATSAPP' | 'DASHBOARD')[];
  frequency: 'ONCE' | 'DAILY' | 'EVERY_TIME';
}

// Check and trigger alerts
async function checkBalanceAndAlert(merchantId: string): Promise<void> {
  const wallet = await getWallet(merchantId);
  const alerts = wallet.settings.alerts;

  if (!alerts.enabled) return;

  // Check each threshold
  for (const threshold of alerts.thresholds) {
    if (wallet.balance.current <= threshold) {
      // Check if we've already alerted for this threshold today
      const lastAlert = await getLastAlert(merchantId, threshold);
      if (lastAlert && alerts.frequency === 'ONCE') continue;
      if (lastAlert && isToday(lastAlert.date) && alerts.frequency === 'DAILY') continue;

      // Send alerts
      await sendAlerts(merchantId, {
        type: 'LOW_BALANCE',
        threshold,
        currentBalance: wallet.balance.current,
        channels: alerts.channels
      });

      // Log alert
      await logAlert(merchantId, threshold);
    }
  }
}
```

---

# 7. API ENDPOINTS

## 7.1 Wallet Endpoints

```typescript
// Get wallet balance
GET /api/media-wallet/:merchantId/balance

Response: {
  walletId: string;
  merchantId: string;
  balance: {
    current: number;
    reserved: number;
    total: number;
  };
  tier: string;
  autoRechargeEnabled: boolean;
}

// Get transactions
GET /api/media-wallet/:merchantId/transactions

Query: {
  page?: number;
  limit?: number;
  type?: 'DEBIT' | 'CREDIT';
  category?: 'USAGE' | 'RECHARGE' | 'REFUND';
  startDate?: string;
  endDate?: string;
}

Response: {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Get usage summary
GET /api/media-wallet/:merchantId/usage

Query: {
  period?: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  groupBy?: 'SERVICE' | 'DAY' | 'MONTH';
}

Response: {
  period: { start: Date; end: Date };
  usage: UsageMetrics;
  breakdown: {
    service: string;
    count: number;
    credits: number;
    costInr: number;
  }[];
}
```

## 7.2 Recharge Endpoints

```typescript
// Create recharge order
POST /api/media-wallet/:merchantId/recharge

Body: {
  credits: number;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING';
  promoCode?: string;
}

Response: {
  orderId: string;
  credits: number;
  bonusCredits: number;
  totalCredits: number;
  amountInr: number;
  paymentUrl: string;
}

// Validate promo code
POST /api/media-wallet/:merchantId/validate-promo

Body: {
  code: string;
  credits: number;
}

Response: {
  valid: boolean;
  bonusCredits?: number;
  message?: string;
}
```

## 7.3 Settings Endpoints

```typescript
// Update auto-recharge
PUT /api/media-wallet/:merchantId/auto-recharge

Body: {
  enabled: boolean;
  threshold?: number;
  amount?: number;
  paymentMethodId?: string;
}

// Get pricing
GET /api/media-wallet/pricing

Response: {
  services: {
    whatsapp: { rate: number; tiers: Tier[] };
    voice: { rate: number; tiers: Tier[] };
    campaign: { rates: Record<string, number> };
    copilot: { rate: number };
  };
  recharge: {
    tiers: { credits: number; price: number; perCredit: number }[];
  };
}
```

---

# APPENDIX

## A. Error Codes

| Code | Error | Description |
|------|-------|-------------|
| `INSUFFICIENT_BALANCE` | Not enough credits | Balance too low |
| `AUTO_RECHARGE_FAILED` | Auto-recharge failed | Payment failed |
| `INVALID_PROMO` | Invalid promo code | Code not found or expired |
| `PROMO_LIMIT_REACHED` | Promo limit reached | Already used max times |
| `SERVICE_UNAVAILABLE` | Service unavailable | REZ Media down |

## B. Webhooks

| Event | Trigger |
|-------|---------|
| `wallet.recharged` | Credits added |
| `wallet.deducted` | Credits spent |
| `wallet.low_balance` | Below threshold |
| `wallet.balance_zero` | Balance reached zero |
