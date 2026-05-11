# REE SERVICE & ADMIN AUDIT
**Date:** May 10, 2026

---

## REE SERVICE (Reward, Engagement, Experience)

### REE Client (verify-service)
```typescript
interface REEVerifyResult {
  success: boolean;
  verified: boolean;
  fraud: { isFraud: boolean; riskScore: number; action: 'allow' | 'flag' | 'block' };
  rewards: { coinType: 'rez'; amount: number };
  karma: { earned: number; total: number; multiplier: number; tier: string };
}
```

### REE Core Services Found

| Service | Purpose | Location |
|---------|----------|-----------|
| karma service | Points/Scoring | rez-karma-service |
| REE Dashboard | Admin panel | REE-Dashboard |
| REE Admin | Rule manager | REE-Admin |
| verify-service | QR verification | verify-service |
| RTMN-CORE | Rule engine | RTMN-CORE |

---

## DISCOUNT STRUCTURE (REE Admin)

### Discount Tiers
| Tier | Discount | Users |
|------|----------|-------|
| platinum | 20% | Premium members |
| gold | 15% | Verified users |
| silver | 10% | Standard users |
| bronze | 5% | Basic users |
| none | 0% | Guests |

### User Type Discounts
| Type | Default | Max |
|------|---------|-----|
| student | 10% | 20% |
| corporate | B2B pricing | 25% |
| doctor | 20% | 25% |
| army/police | 20% | 25% |
| teacher | 15% | 20% |
| nurse | 15% | 20% |
| driver | 5% | 10% |
| merchant | 0% | 0% |
| vendor | 0% | 0% |
| host | 5% | 15% |
| guest | 0% | 0% |
| traveller | 10% | 20% |

---

## KARMA SERVICE (ReZ Karma)

### Models
| Model | Fields |
|-------|--------|
| KarmaConfig | rules, tiers, multipliers |
| KarmaTransaction | userId, points, reason, source |
| KarmaRule | condition, action, points, tier |
| KarmaTier | name, minPoints, maxPoints, benefits |

### Routes
| Route | Purpose |
|-------|---------|
| /karma/score | Get user karma |
| /karma/tier | Get user tier |
| /karma/history | Transaction history |
| /karma/earn | Add points |
| /karma/redeem | Use points |
| /karma/leaderboard | Top users |

---

## ADMIN SERVICES

### ReZ Admin (HTML Dashboard)
- Rule management
- Discount configuration
- User management
- Analytics

### REE Admin (ree-admin.html)
- Karma rules engine
- Tier configuration
- Multiplier settings
- Event rules

### REE Dashboard (ree-dashboard.html)
- Real-time karma stats
- User segments
- Discount tracking

---

## DISCOUNT FLOW

```
User Type → Verification → REE Rules → Discount Tier → Admin Approval
    ↓
  Student/Doctor/Army/etc → Documents → REE evaluates → Approved discount
```

---

## VERIFICATION SERVICE

### Types
| Type | Documents | Discount |
|------|------------|----------|
| student | Student ID | 10-20% |
| corporate | Company email | B2B |
| doctor | License | 20% |
| army | ID card | 20% |
| police | Badge | 20% |
| teacher | School ID | 15% |
| nurse | Hospital ID | 15% |
| driver | License | 5-10% |
| merchant | GST/VAT | 0% |
| vendor | Business docs | 0% |
| host | Address proof | 5% |
| traveller | Email/Phone | 10% |

---

## STATUS

| Component | Status |
|-----------|--------|
| REE Client | Built |
| Karma Service | Built |
| REE Admin | HTML Dashboard |
| REE Dashboard | HTML Dashboard |
| Verify Service | Built |
| Discount Rules | Configurable |
| User Types | 12 types |

---

**Audit Complete**
