# REE Integration Guide

**Last Updated:** 2026-05-04
**Status:** Integration Reference for All Services

---

## Overview

The ReZ Economic Engine (REE) provides a unified API for all business logic. This guide shows how each service should integrate with REE.

---

## REE Service Info

| Property | Value |
|----------|-------|
| **Repository** | `git@github.com:imrejaul007/REE.git` |
| **Local Path** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-economic-engine` |
| **Port** | 4000 (default) |
| **Base URL** | `http://localhost:4000/api` |

---

## Integration Points

### 1. ReZ Profile Service

**Purpose:** Unified user profile with karma, coins, engagement stats

**REE Integrations:**
- Query karma score
- Record karma events
- Get coin balances
- Get reward calculations

**API Calls to REE:**

```typescript
// Get karma score
POST /api/query/karma
{
  "userId": "user_123",
  "baseKarma": 10,
  "userTier": "L2"
}

// Calculate cashback preview
POST /api/query/cashback
{
  "billAmount": 500,
  "merchantId": "merchant_456"
}

// Evaluate rules for user
POST /api/query/evaluate
{
  "category": "rewards",
  "context": {
    "user": { "id": "user_123", "tier": "gold" },
    "transaction": { "amount": 500 }
  }
}
```

**Implementation:**

```typescript
// src/services/reeIntegration.ts
const REE_BASE_URL = process.env.REE_URL || 'http://localhost:4000/api';

export const reeClient = {
  // Get karma score
  async getKarmaScore(userId: string) {
    const response = await fetch(`${REE_BASE_URL}/query/karma`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, baseKarma: 0, userTier: 'L1' })
    });
    return response.json();
  },

  // Calculate cashback
  async calculateCashback(billAmount: number, merchantId?: string) {
    const response = await fetch(`${REE_BASE_URL}/query/cashback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ billAmount, merchantId })
    });
    return response.json();
  },

  // Record event
  async recordEvent(event: {
    eventType: string;
    userId: string;
    data: Record<string, any>;
  }) {
    const response = await fetch(`${REE_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    return response.json();
  },

  // Evaluate rules
  async evaluateRules(category: string, context: any) {
    const response = await fetch(`${REE_BASE_URL}/query/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, context })
    });
    return response.json();
  }
};
```

---

### 2. Verify Service

**Purpose:** Product authentication via QR codes

**REE Integrations:**
- Get karma multiplier for rewards
- Check fraud before rewarding
- Record karma signals
- Get reward calculations

**API Calls to REE:**

```typescript
// Check fraud before verifying
POST /api/query/fraud
{
  "context": {
    "userId": "user_123",
    "device": { "ip": "1.2.3.4" },
    "scanHistory": [...]
  }
}

// Record verification event
POST /api/events
{
  "eventType": "qr.verified",
  "source": "verify-service",
  "userId": "user_123",
  "data": {
    "brandId": "brand_123",
    "productId": "product_456",
    "serialId": "serial_789"
  }
}

// Get karma multiplier
POST /api/query/karma
{
  "userId": "user_123",
  "baseKarma": 5,
  "userTier": "L2"
}
```

**Implementation:**

```typescript
// src/lib/reeIntegration.ts
export async function verifyWithREE(userId: string, productData: any) {
  // 1. Check fraud
  const fraudCheck = await reeClient.query('/query/fraud', {
    context: {
      userId,
      event: { type: 'qr.scanned' }
    }
  });

  if (fraudCheck.data.isFraud && fraudCheck.data.action === 'block') {
    return { valid: false, reason: 'blocked', fraud: fraudCheck.data };
  }

  // 2. Get karma multiplier
  const karmaResult = await reeClient.query('/query/karma', {
    userId,
    baseKarma: 5,
    userTier: 'L2'
  });

  // 3. Record event
  await reeClient.recordEvent({
    eventType: 'qr.verified',
    source: 'verify-service',
    userId,
    data: productData
  });

  return {
    valid: true,
    karmaMultiplier: karmaResult.data.rewardMultiplier || 1.0
  };
}
```

---

### 3. AdsQR Service

**Purpose:** Ad campaign QR code scanning

**REE Integrations:**
- Record scan events
- Get karma rewards
- Fraud detection
- Campaign reward calculation

**API Calls to REE:**

```typescript
// Record ad scan
POST /api/events
{
  "eventType": "qr.scanned",
  "source": "adsqr",
  "userId": "user_123",
  "campaignId": "campaign_456",
  "data": {
    "adId": "ad_789",
    "merchantId": "merchant_abc"
  }
}

// Get reward
POST /api/query/evaluate
{
  "category": "ads_qr",
  "context": {
    "user": { "id": "user_123" },
    "campaign": { "id": "campaign_456" }
  }
}
```

---

### 4. Bill Upload Service

**Purpose:** Receipt verification and cashback

**REE Integrations:**
- Calculate cashback amount
- Record bill upload event
- Fraud detection (duplicate, future date)
- Karma recording

**API Calls to REE:**

```typescript
// Calculate cashback
POST /api/query/cashback
{
  "billAmount": 500,
  "merchantId": "merchant_456",
  "merchantTier": "gold"
}

// Response
{
  "success": true,
  "data": {
    "billAmount": 500,
    "cashbackPercent": 7,
    "cashbackAmount": 35,
    "maxCashback": 500,
    "coinType": "cashback",
    "expiresInDays": 365
  }
}

// Record bill upload
POST /api/events
{
  "eventType": "bill.uploaded",
  "source": "bill-upload",
  "userId": "user_123",
  "data": {
    "billId": "bill_789",
    "merchantId": "merchant_456",
    "amount": 500
  }
}
```

**Implementation:**

```typescript
// Calculate cashback for bill
export async function calculateBillCashback(billAmount: number, merchantId: string) {
  // 1. Get merchant tier from DB
  const merchant = await getMerchant(merchantId);

  // 2. Calculate via REE
  const result = await fetch(`${REE_BASE_URL}/query/cashback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      billAmount,
      merchantId,
      merchantTier: merchant.tier
    })
  });

  return result.data;
}
```

---

### 5. Social Impact Service

**Purpose:** Event participation tracking

**REE Integrations:**
- Record check-in/check-out events
- Get karma points
- Calculate event rewards
- Track engagement

**API Calls to REE:**

```typescript
// Record check-in
POST /api/events
{
  "eventType": "qr.scanned",
  "source": "social-impact",
  "userId": "user_123",
  "data": {
    "eventId": "event_456",
    "type": "checkin"
  }
}

// Record check-out
POST /api/events
{
  "eventType": "qr.scanned",
  "source": "social-impact",
  "userId": "user_123",
  "data": {
    "eventId": "event_456",
    "type": "checkout"
  }
}

// Get karma earned
POST /api/query/karma
{
  "userId": "user_123",
  "baseKarma": 30,  // Event base karma
  "userTier": "L3"
}
```

---

### 6. Karma Service

**Purpose:** Karma score management

**REE Integrations:**
- Calculate karma score (300-900)
- Get karma tiers
- Get percentile ranking
- Weekly conversion

**REE Uses Karma Service For:**
- Storing karma profiles
- Tracking karma history
- Batch conversion jobs

**Implementation:**

```typescript
// Weekly karma to coins conversion
export async function weeklyKarmaConversion() {
  const users = await karmaService.getAllUsers();

  for (const user of users) {
    // Get user's karma tier from REE
    const karmaData = await fetch(`${REE_BASE_URL}/query/karma`, {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        baseKarma: 0,
        userTier: getTierFromScore(user.karmaScore)
      })
    });

    // Calculate conversion
    const conversionRate = karmaData.data.conversionRate || 0.25;
    const coinsEarned = Math.floor(user.activeKarma * conversionRate);

    // Credit to wallet
    await walletService.credit({
      userId: user.id,
      amount: coinsEarned,
      coinType: 'rez',
      source: 'karma_conversion'
    });
  }
}
```

---

### 7. Wallet Service

**Purpose:** Coin management

**REE Integrations:**
- Get coin limits
- Calculate expiry
- Coin conversion rules
- Redemption validation

**Implementation:**

```typescript
// Coin limits from REE config
export const COIN_LIMITS = {
  DAILY_CAP: 1000,
  WEEKLY_CAP: 3000,
  MIN_REDEMPTION: 10,
  MAX_REDEMPTION: 5000,
  TO_RUPEE_RATE: 1.0
};

// Check if redemption is valid
export function validateRedemption(amount: number, dailyUsed: number) {
  if (amount < COIN_LIMITS.MIN_REDEMPTION) {
    return { valid: false, reason: 'Below minimum' };
  }
  if (amount > COIN_LIMITS.MAX_REDEMPTION) {
    return { valid: false, reason: 'Above maximum' };
  }
  if (dailyUsed + amount > COIN_LIMITS.DAILY_CAP) {
    return { valid: false, reason: 'Daily cap reached' };
  }
  return { valid: true };
}
```

---

## Environment Variables

Add to each service:

```env
# REE Integration
REE_URL=http://localhost:4000/api
REE_API_KEY=your-api-key
```

---

## Error Handling

```typescript
export async function withREE<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('REE call failed:', error);
    // Return fallback or throw
    return fallback;
  }
}

// Usage
const cashback = await withREE(
  () => reeClient.calculateCashback(500),
  { cashbackAmount: 0 } // Fallback
);
```

---

## Event Types

All services should use these event types:

| Event | Source | Data |
|--------|---------|------|
| `qr.scanned` | All QR services | `{ qrId, type, userId }` |
| `qr.verified` | verify-service | `{ brandId, productId, serialId }` |
| `qr.fraud_detected` | All | `{ reason, userId }` |
| `transaction.completed` | All orders | `{ orderId, amount }` |
| `bill.uploaded` | bill-upload | `{ billId, amount, merchantId }` |
| `reward.earned` | All | `{ coinType, amount, source }` |
| `karma.earned` | All | `{ points, action }` |

---

## Caching Strategy

Services should cache REE responses:

```typescript
// Cache karma score for 1 minute
const cache = new Map();
const CACHE_TTL = 60000;

export async function getCachedKarmaScore(userId: string) {
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await reeClient.getKarmaScore(userId);
  cache.set(userId, { data, timestamp: Date.now() });
  return data;
}
```

---

## Mock/Fallback

During development, services can mock REE:

```typescript
// src/lib/reeMock.ts
export const reeMock = {
  async query(endpoint: string, body: any) {
    console.log('[REE Mock]', endpoint, body);
    return { success: true, data: getMockData(endpoint, body) };
  },

  async recordEvent(event: any) {
    console.log('[REE Mock] Event:', event);
    return { success: true, data: { eventId: 'mock_' + Date.now() } };
  }
};

function getMockData(endpoint: string, body: any) {
  if (endpoint.includes('cashback')) {
    return {
      billAmount: body.billAmount,
      cashbackPercent: 5,
      cashbackAmount: Math.floor(body.billAmount * 0.05),
      coinType: 'cashback'
    };
  }
  if (endpoint.includes('karma')) {
    return {
      karmaEarned: body.baseKarma || 5,
      tier: 'L2',
      conversionRate: 0.5,
      rewardMultiplier: 1.25
    };
  }
  return {};
}

// Use in dev
export const ree = process.env.NODE_ENV === 'production' ? reeClient : reeMock;
```

---

## DOCUMENT INFO

**Version:** 1.0
**Last Updated:** 2026-05-04
