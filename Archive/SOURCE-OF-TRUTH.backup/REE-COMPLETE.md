# REE - Complete Source of Truth

**Last Updated:** 2026-05-04
**Version:** 3.0
**Status:** Production Ready

---

## Overview

**REE (ReZ Economic Engine** is the single source of truth for all business logic in the ReZ ecosystem.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ REE (Central Brain) │
├─────────────────────────────────────────────────────────────┤
│ │
│ Services Connected: │
│ • Profile Service │
│ • Merchant Service │
│ • Wallet Service │
│ • Verify Service │
│ • AdsQR Service │
│ │
│ Controls Everything: │
│ • Commission rates │
│ • Cashback percentages │
│ • Karma scoring │
│ • Fraud detection │
│ • Feature flags │
│ • User tiers │
│ • Merchant tiers │
└─────────────────────────────────────────────────────────────┘
```

---

## Repositories

| Service | GitHub | Status |
|---------|---------|---------|
| **REE Core** | `git@github.com:imrejaul007/REE.git` | Running |
| **Profile Service** | `git@github.com:imrejaul007/rezprofile.git` | Connected |
| **Merchant Service** | Local | Connected |

---

## Endpoints

### Health
```
GET /health
Response: {"status":"healthy","service":"rez-economic-engine"}
```

### Feature Flags
```
GET /api/features/tiers/user - All user tiers
GET /api/features/tiers/merchant - All merchant tiers
POST /api/features/user - Check user features
POST /api/features/merchant - Check merchant features
POST /api/features/cashback - Calculate cashback
POST /api/features/commission - Calculate commission
```

### Rules
```
GET /api/admin/rules - List rules
POST /api/admin/rules - Create rule
PUT /api/admin/rules/:id - Update rule
PATCH /api/admin/rules/:id/toggle - Enable/disable
DELETE /api/admin/rules/:id - Delete rule
```

### Karma & Fraud
```
POST /api/query/karma - Calculate karma
POST /api/query/fraud - Fraud check
POST /api/events - Record event
```

### Simulation
```
POST /api/simulate/commission - Simulate commission
POST /api/simulate/cashback - Simulate cashback
POST /api/simulate/impact - Full impact simulation
```

---

## Coin Economics

### 5 Coin Types

| Coin | Purpose | Expiry | Used For |
|------|---------|---------|---------|
| **REZ** | Platform currency | Never | All transactions |
| **BRANDED** | Merchant loyalty | 180 days | Same merchant |
| **PROMO** | Discounts | 90 days | Transaction discount |
| **PRIVE** | Premium rewards | 365 days | Universal |
| **KARMA** | Impact economy | Never | Conversion to REZ |

### User Tiers

| Tier | Min Spend | Cashback | Social | Prive |
|------|----------|---------|--------|-------|
| Starter | ₹0 | 5% | 3/day | No |
| Active | ₹5,000 | 5% | 5/day | No |
| Gold | ₹25,000 | 6% | 10/day | No |
| Platinum | ₹100,000 | 7% | Unlimited | Yes |

### Merchant Tiers

| Tier | Fee/mo | Commission | QR Codes | Features |
|------|--------|-----------|---------|---------|
| Free | ₹0 | 15% | 100/mo | Basic |
| Growth | ₹299 | 12% | 1000/mo | Analytics |
| Pro | ₹799 | 10% | Unlimited | API |
| Enterprise | ₹1999 | 8% | Unlimited | White label |

---

## Karma Scoring (300-900)

### Formula
```
Total = 300 + Impact(0-250) + Rank(0-180) + Trust(0-100) + Momentum(0-70)
Max = 900
```

### Tiers

| Score | Tier | Conversion |
|-------|------|------------|
| 300-499 | Starter | 25% |
| 500-649 | Active | 50% |
| 650-749 | Performer | 75% |
| 750-819 | Leader | 75% |
| 820-879 | Elite | 85% |
| 880-899 | Legend | 100% |
| 900 | Pinnacle | 100% |

---

## Default Rules (12 Seeded)

### Commission
| Rule | Category | Priority |
|------|----------|-----------|
| Restaurant Commission | merchant | 10 |
| Retail Commission | merchant | 10 |

### Cashback
| Rule | Tier | Rate |
|------|------|------|
| Starter Cashback | user | 5% |
| Gold Bonus | user | 7% |

### Social
| Rule | Rate |
|------|------|
| Social Share Bonus | 5% |

### Fraud (Always Active)
| Rule | Threshold | Action |
|------|----------|--------|
| Rapid Click | 10/30s | Flag |
| IP Flooding | 10/hour | Block |
| Impossible Travel | 500km/hr | Block |

### Karma
| Rule | Points |
|------|--------|
| Volunteer Hours | 15 karma/hr |
| Daily Check-in | 2 karma/day |

### Branded
| Rule | Coins |
|------|-------|
| Review Bonus | 10-50 |

---

## Service Integration

### Profile Service
```typescript
// src/services/reeClient.ts
await reeClient.getUserFeatures(lifetimeSpend);
await reeClient.calculateCashback(amount);
await reeClient.recordEvent(event);
```

### Merchant Service
```typescript
// src/utils/reeClient.ts
await merchantREE.getCommission(tier, amount);
await merchantREE.checkFraud(merchantId, action);
```

### Wallet Service
```typescript
// src/utils/reeClient.ts
await walletREE.getMerchantFeatures(tier);
await walletREE.calculateCashback(lifetimeSpend, amount);
```

---

## Environment Variables

```env
REE_URL=http://localhost:4000/api
MONGO_URI=mongodb://localhost:27017/rez-economic-engine
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/config/index.ts` | Service config |
| `src/config/seedData.ts` | Default rules |
| `src/services/featureControl.ts` | Tier definitions |
| `src/services/karmaService.ts` | Karma calculations |
| `src/services/cacheService.ts` | Redis caching |
| `src/engines/ruleEngine.ts` | Rule evaluation |
| `src/engines/fraudEngine.ts` | Fraud detection |

---

## Document Version: 3.0
## Last Updated: 2026-05-04
