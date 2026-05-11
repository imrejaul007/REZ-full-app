# REE Service - Business Logic

**Status:** Built
**Repo:** `rez-economic-engine`
**Purpose:** Subscription tier decisions, pricing rules, discounts, karma scoring

---

## What REE Handles

| Data | Description |
|------|-------------|
| **Subscription Tier** | basic, student, gold, pro, diamond |
| **Karma Scoring** | 300-900 system |
| **Pricing Rules** | Dynamic pricing based on tier |
| **Discount Logic** | Tier-based discounts |
| **Business Rules** | Feature access control |
| **Fraud Detection** | Risk scoring |
| **Cashback** | Coin calculations |

---

## API Endpoints

```typescript
// GET /user/:id/state
// Returns real-time user state for apps

// GET /user/:id/subscription
// Returns subscription tier

// GET /pricing/:productId
// Returns price with applicable discounts

// GET /discounts/user/:id
// Returns active discounts for user
```

---

## Connects To

| Service | URL |
|---------|-----|
| Auth | `rez-auth-service.onrender.com` |
| Profile | `rezprofile.onrender.com` |
| Wallet | `rez-wallet-service-36vo.onrender.com` |

---

## Response Shape

```typescript
interface REEState {
  userId: string;
  subscriptionTier: 'basic' | 'student' | 'gold' | 'pro' | 'diamond';
  pricingRules: PricingRule[];
  activeDiscounts: Discount[];
  availableOffers: Offer[];
}
```
