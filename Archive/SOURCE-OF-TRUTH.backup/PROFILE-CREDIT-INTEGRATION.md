# REZ Unified Profile & Credit Scoring - Integration Status

**Last updated:** 2026-04-26
**Status:** ✅ COMPLETE

---

## Overview

The unified customer profile and credit scoring ecosystem tracks cross-vertical spending, LTV, engagement, and BNPL (Buy Now Pay Later) across all REZ verticals.

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNIFIED PROFILE & CREDIT ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │ REZ Order    │────▶│ REZ Payment │────▶│  REZ Wallet  │              │
│  │ Service      │     │  Service    │     │  Service     │              │
│  │              │     │             │     │              │              │
│  │ onDelivery() │     │ onCapture() │     │ BNPL Engine │              │
│  │ + BNPL init  │     │ + BNPL init │     │              │              │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘              │
│         │                     │                     │                       │
│         │ Profile Transaction │ Profile Transaction │ Credit Score          │
│         │                    │                    │ BNPL Transaction        │
│         └────────────────────┴────────────────────┘                       │
│                              │                                              │
│                              ▼                                              │
│                    ┌──────────────────┐                                   │
│                    │   REZ Auth        │                                   │
│                    │   Service         │                                   │
│                    │                   │                                   │
│                    │ UserProfile Model │                                   │
│                    │ - verticals{}     │                                   │
│                    │ - lifetimeValue   │                                   │
│                    │ - engagementScore │                                   │
│                    │ - tier            │                                   │
│                    └──────────────────┘                                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    REZ Scheduler Service                               │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  │  │
│  │  │ creditScoreRefresh │ │profileRefresh  │  │ bnplOverdueProcessing  │  │  │
│  │  │ (Weekly Sun 3AM) │  │(Weekly Sun 4AM)│  │  (Daily 8AM)          │  │  │
│  │  └────────┬─────────┘  └───────┬───────┘  └───────────┬─────────┘  │  │
│  │           │                     │                       │              │  │
│  │           ▼                     ▼                       ▼              │  │
│  │  /internal/credit/refresh  /internal/profile/refresh  /internal/      │  │
│  │                             │                      credit/process-     │  │
│  │                             │                      overdue            │  │
│  └─────────────────────────────┴──────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Summary

### 1. REZ Auth Service - Profile Model

**File:** `rez-auth-service/src/models/UserProfile.ts`

```typescript
interface UserProfile {
  userId: string;
  phone: string;
  verticals: {
    hotel: { totalSpend: number; transactionCount: number; ... };
    restaurant: { ... };
    fashion: { ... };
    pharmacy: { ... };
    retail: { ... };
    d2c: { ... };
  };
  totalLifetimeSpend: number;
  lifetimeValue: number;
  engagementScore: number;
  daysActive: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastActivity: Date;
}
```

**Routes:**
- `POST /internal/profile/transaction` - Record transaction from any vertical
- `POST /internal/profile/engagement` - Record engagement activity
- `GET /internal/profile/:userId` - Get profile summary
- `POST /internal/profile/refresh` - Batch refresh engagement scores

---

### 2. REZ Wallet Service - Credit Score & BNPL

**Files:**
- `src/models/CreditScore.ts` - Credit score model (300-850 range)
- `src/models/BNPLTransaction.ts` - BNPL transaction model
- `src/services/creditScore.service.ts` - BNPL lifecycle management

**Credit Score Factors:**
- Payment history (40%)
- Wallet stability (30%)
- Spending regularity (20%)
- Engagement score (10%)

**Risk Tiers:**
- LOW: Score 700+
- MEDIUM: Score 550-699
- HIGH: Score <550

**Routes:**
- `GET /api/credit/score` - Get user's credit score (consumer)
- `GET /api/credit/bnpl` - Get active BNPLs (consumer)
- `POST /api/credit/check-eligibility` - Check BNPL eligibility (consumer)
- `POST /api/credit/apply` - Apply for BNPL (consumer)
- `POST /api/credit/repay` - Repay BNPL (consumer)
- `POST /internal/credit/refresh` - Batch refresh (scheduler)
- `POST /internal/credit/process-overdue` - Process overdue (scheduler)

---

### 3. Integration Points

#### Order Service → Profile Service
**Trigger:** Order status changes to 'delivered'
**File:** `rez-order-service/src/httpServer.ts:1137-1151`

```typescript
if (status === 'delivered' && result) {
  recordProfileTransaction({
    userId: order.user?.toString() || order.consumerId?.toString() || '',
    phone: order.userPhone || order.phone || '',
    vertical: getVerticalFromOrder(order.orderType || order.type),
    amount: order.totalAmount || order.amount || 0,
    merchantId: order.merchant?.toString() || '',
    category: order.category || 'order',
  });
}
```

#### Payment Service → Profile Service (Standard Payment)
**Trigger:** Payment captured via webhook
**File:** `rez-payment-service/src/routes/paymentRoutes.ts:223`

```typescript
await recordPaymentProfileUpdate({
  userId: req.userId!,
  phone,
  amount: payment.amount || 0,
  merchantId: payment.merchantId || '',
  vertical: mapPaymentTypeToVertical(payment.purpose),
  orderId: payment.orderId,
});
```

#### Payment Service → Profile Service (BNPL)
**Trigger:** BNPL payment initiated
**File:** `rez-payment-service/src/services/paymentService.ts:522-532`

```typescript
await recordPaymentProfileUpdate({
  userId: input.userId,
  phone: input.userDetails?.phone || '',
  amount: input.amount,
  merchantId: input.metadata?.merchantId || '',
  vertical: mapPaymentTypeToVertical(input.purpose || metadataVertical || 'order'),
  category: 'bnpl',
  orderId: input.orderId,
});
```

---

### 4. Scheduler Jobs

| Job | Schedule | Endpoint | Service |
|-----|----------|----------|---------|
| `creditScoreRefresh` | Weekly Sun 3AM | `POST /internal/credit/refresh` | Wallet |
| `profileRefresh` | Weekly Sun 4AM | `POST /internal/profile/refresh` | Auth |
| `bnplOverdueProcessing` | Daily 8AM | `POST /internal/credit/process-overdue` | Wallet |

---

### 5. Consumer App Integration

**Files:**
- `services/financeApi.ts` - Finance API client
- `services/profileApi.ts` - Profile API client
- `app/(tabs)/finance.tsx` - Finance tab UI

**API Methods:**
```typescript
// Credit Score
getWalletCreditScore()     // GET /api/credit/score
getWalletBNPLs()           // GET /api/credit/bnpl
checkBNPLEligibility()     // POST /api/credit/check-eligibility
applyBNPL()                // POST /api/credit/apply
repayBNPL()                // POST /api/credit/repay

// Profile
getUnifiedProfile()       // GET /api/profile/summary
getTierInfo()             // GET /api/profile/tier
```

---

## Build Status

| Service | TypeScript | Status |
|---------|------------|--------|
| rez-auth-service | ✅ Pass | Production Ready |
| rez-wallet-service | ✅ Pass | Production Ready |
| rez-order-service | ✅ Pass | Production Ready |
| rez-payment-service | ✅ Pass | Production Ready |
| rez-scheduler-service | ✅ Pass | Production Ready |
| rez-app-consumer | ✅ Pass | Production Ready |

---

## Verified Integrations

| Integration | Status | Evidence |
|-------------|--------|----------|
| Order → Profile (on delivery) | ✅ | `httpServer.ts:1137-1151` |
| Payment → Profile (on capture) | ✅ | `paymentRoutes.ts:223` |
| BNPL → Profile (on init) | ✅ | `paymentService.ts:522-532` |
| Scheduler → Credit Refresh | ✅ | `userEngagementProcessor.ts:75` |
| Scheduler → Profile Refresh | ✅ | `userEngagementProcessor.ts:235` |
| Scheduler → BNPL Overdue | ✅ | `userEngagementProcessor.ts:275` |
| Consumer → Credit API | ✅ | `financeApi.ts:175-196` |

---

## Cross-Verification Checklist

- [x] Profile routes registered in auth-service
- [x] Credit routes registered in wallet-service
- [x] Scheduler processors registered in workers
- [x] Scheduler config matches processor names
- [x] Endpoint paths match between scheduler and services
- [x] Auth service URL configured in scheduler
- [x] TypeScript errors resolved
- [x] All services build successfully

---

## Last Updated
- 2026-04-26: Complete implementation and verification
