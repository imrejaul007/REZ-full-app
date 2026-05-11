# REZ MARKETING PLATFORM - UPGRADE PLAN

**Based on:** Complete audit of AdsQr + REZ TRY + existing systems
**Date:** May 5, 2026
**Status:** READY TO EXECUTE

---

## THE REAL SYSTEM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ SAMPLING & MARKETING ECOSYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    DISTRIBUTION (ADSQR)                                 │  │
│  │                                                                       │  │
│  │   QR on AUTOS ─── QR on HOARDINGS ─── QR on FLYERS ─── QR on PACKAGING │  │
│  │                                                                       │  │
│  │   "Scan to get FREE [product] sample!"                               │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    COINS (REZ TRY + BRANDED)                          │  │
│  │                                                                       │  │
│  │   REZ TRY Coins ──────────────────────────── Brand Coins            │  │
│  │   (Platform)                               (Merchant branded)        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    REDEMPTION (REZ TRY)                               │  │
│  │                                                                       │  │
│  │   Discover ─── Book ─── Redeem ─── Review                         │  │
│  │   try.rez.money                                                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    ATTRIBUTION + GROWTH                               │  │
│  │                                                                       │  │
│  │   Karma ─── Rendez ─── ReZ Mind ─── RDE                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CURRENT STATE

### What Exists

| System | Service | Purpose | Status |
|--------|---------|---------|--------|
| **Distribution** | `adsqr` | QR on ads | Production |
| **Discovery** | `rez-try` | Trial platform | Production |
| **Coins** | `rez-wallet-service` | Coin management | Production |
| **Sampling** | `rez-try` | Trial booking | Production |
| **Attribution** | `rez-intent-graph` | Tracking | Production |
| **Decisions** | `rez-decision-service` | Basic | Basic |
| **Channels** | `rez-marketing-service` | WhatsApp/Push/Email | Production |

### What's Fragmented

| Issue | Problem |
|-------|---------|
| **AdsQr ↔ REZ TRY** | No direct integration |
| **Coins** | REZ TRY coins ≠ REZ Coins ≠ Brand Coins (confusing) |
| **Attribution** | Scan → Coins → Redeem → tracked separately |
| **Merchants** | Different dashboards for AdsQr vs REZ TRY |
| **Decisions** | No real-time decision engine |

---

## THE UPGRADE

### The Vision

```
Merchant creates campaign
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UCE (Unified Campaign Engine)                           │
│                                                                       │
│   Campaign Setup ─── Budget ─── Offer ─── Targeting                     │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RDE (Decision Engine)                                 │
│                                                                       │
│   WHO gets coins? ─── HOW MUCH? ─── WHICH coin? ─── WHEN?                 │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DISTRIBUTION LAYER                                       │
│                                                                       │
│   ADSQR QR ──── PLACED ON ──── AUTOS │ HOARDINGS │ PACKAGING │ TABLETS  │
│                                                                       │
│   "Scan & Win FREE [product]!"                                        │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COIN LAYER                                             │
│                                                                       │
│   REZ TRY Coins ────────── OR ────────── Brand Coins                   │
│   (Platform)                               (Merchant branded)            │
│                                                                       │
│   Coins credited to wallet instantly                                     │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REDEMPTION (REZ TRY)                                   │
│                                                                       │
│   User opens try.rez.money ──── Sees "50 coins" ──── Redeems trial    │
│                                                                       │
│   Visits merchant ──── Shows coins ──── Gets FREE sample                │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ATTRIBUTION LAYER                                      │
│                                                                       │
│   Scan ─── Visit ─── Redeem ─── Purchase ─── Repeat                    │
│                                                                       │
│   Full funnel tracked in ReZ Mind                                        │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FEEDBACK LOOP                                          │
│                                                                       │
│   RDE learns ─── Optimizes ─── Next campaign better                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1: INTEGRATION (Week 1-2)

### Task 1.1: Connect AdsQr ↔ REZ TRY

```
PROBLEM: QR scan gives coins, but user doesn't know where to redeem

SOLUTION: Direct integration
```

| Step | Action | File |
|------|--------|------|
| 1 | Add `try_redemption_url` to AdsQr scan response | adsqr |
| 2 | Create scan → REZ TRY redirect | adsqr |
| 3 | Pass `coins` + `campaignId` via URL params | adsqr |
| 4 | Show "You won X coins!" modal on REZ TRY | rez-try |
| 5 | Auto-add coins to wallet | rez-try → wallet |

### Task 1.2: Unify Coin System

```
PROBLEM: Multiple coin types confusing

SOLUTION: Unified coin wallet with clear labels
```

| Coin Type | Label | Where Earned | Where Redeemable |
|----------|-------|-------------|-----------------|
| REZ TRY Coins | "Try Coins" | AdsQr scans, missions | REZ TRY merchants |
| Brand Coins | "[Brand] Coins" | Brand campaigns | That brand only |
| REZ Coins | "REZ Coins" | General engagement | Anywhere |

### Task 1.3: Unified Dashboard

```
PROBLEM: Merchants use different dashboards

SOLUTION: Single merchant dashboard
```

| Feature | Description |
|---------|-------------|
| Campaign Creator | Create sampling + ad campaigns |
| Coin Manager | View/create brand coins |
| Analytics | Scan → Redeem → Purchase |
| REZ TRY | Manage trial offers |

---

## PHASE 2: DECISION ENGINE (Week 3-4)

### Task 2.1: Build RDE for Sampling

```typescript
interface SamplingDecision {
  userId: string;
  campaignId: string;
  
  // WHO gets coins?
  eligibility: boolean;  // Does user qualify?
  priority: number;      // 1-100
  
  // HOW MUCH?
  coinAmount: number;     // 10, 50, 100 coins
  
  // WHICH coin?
  coinType: 'try' | 'brand';
  brandId?: string;
  
  // WHEN?
  timingScore: number;     // Right time?
  fatigueCheck: boolean;  // Not too frequent?
  
  // Budget
  campaignBudget: number;
  dailyLimit: number;
}
```

### Task 2.2: Trigger Engine

```typescript
type SamplingTrigger = 
  | 'location_enter'     // User enters area
  | 'time_based'        // Lunch, dinner, weekend
  | 'user_behavior'     // Browsing similar products
  | 'campaign_launch'   // New campaign
  | 'inventory_alert'; // Merchant has excess inventory
```

### Task 2.3: Fatigue Engine

```typescript
// Prevent spam
const FATIGUE_RULES = {
  max_scans_per_day: 3,           // Don't spam with scans
  min_gap_between_scans: 4,        // Hours
  cooldown_after_redeem: 24,       // Hours
  no_redeem_if_full_wallet: true  // Max 500 coins
};
```

---

## PHASE 3: AUTOMATION (Week 5-6)

### Task 3.1: Smart Coin Allocation

```typescript
// RDE decides coin amount based on:
const coinAllocation = {
  // Merchant factors
  merchantValue: calculateMerchantValue(merchantId),  // LTV, rating, conversion
  
  // Campaign factors
  campaignUrgency: campaign.deadline ? timeRemaining : 'low',
  inventoryLevel: merchant.stockLevel,  // High stock = more coins
  
  // User factors
  userAffinity: userAffinityScore(userId, merchant.category),
  userStage: getUserStage(userId),  // NEW, WARM, HOT
  
  // Market factors
  timeOfDay: lunchOrDinner(),
  dayOfWeek: weekdayOrWeekend()
};

// Output
{
  coinAmount: 50,           // Final coin amount
  rationale: "High stock + lunch time + new user"
}
```

### Task 3.2: Auto-Campaign Creation

```
RDE detects:
- Merchant has excess inventory
- It's lunch time
- User is near the merchant

RDE suggests:
"Give 30% more coins to nearby users for next 2 hours?"
```

### Task 3.3: Dynamic QR Pricing

```
Based on:
- Time of day
- Inventory level
- User affinity
- Campaign budget

QR scan gives:
- 50 coins (normal)
- 75 coins (slow lunch)
- 100 coins (excess inventory)
- 25 coins (busy time)
```

---

## PHASE 4: BRAND COINS (Week 7-8)

### Task 4.1: Brand Coin Builder

```typescript
interface BrandCoin {
  brandId: string;
  name: string;           // "KFCCoins"
  symbol: string;         // "KFC"
  color: string;          // "#FC0000"
  value: number;           // 1 coin = ₹1
  minRedeem: number;      // Min 50 coins to redeem
  validFor: number;        // Days until expiry
  merchantIds: string[];   // Where redeemable
}
```

### Task 4.2: Brand Coin Campaigns

```
Merchant creates brand coin campaign:
1. Design coin (name, color, symbol)
2. Set value (1 coin = ₹X)
3. Set budget (1000 coins)
4. Define redemption (Free zinger piece)
5. Generate QR codes
6. RDE distributes coins
```

### Task 4.3: Cross-Brand Coins

```
Future: "Partner Coins"
- Multiple related brands
- Example: "Foodie Coins" redeemable at:
  - KFC
  - Pizza Hut
  - Domino's
  - McDonald's
```

---

## PHASE 5: DOOH INTEGRATION (Week 9-10)

### Task 5.1: Auto Screen Network

```
QR on screens:
- Auto tablets
- Restaurant TVs
- Mall kiosks
- Hotel lobbies

Digital QR that changes based on:
- Time of day
- Inventory level
- Nearby users
- Campaign budget
```

### Task 5.2: DOOH Attribution

```
Screen shown
    │
    ▼
Face detection (anonymous)
    │
    ▼
QR code visible on screen
    │
    ▼
User scans with phone
    │
    ▼
Attribution: "DOOH → Scan → Visit"
```

---

## TECHNICAL ARCHITECTURE

### Before

```
adsqr ──────► Supabase
   │
   └──► REZ TRY (separate)

REZ TRY ────► wallet
   │
   └──► rez-try DB

No communication between systems
```

### After

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED SAMPLING SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   MERCHANT DASHBOARD                                                         │
│   Campaign Creator ─── Coin Manager ─── Analytics                          │
│            │                     │                                               │
│            ▼                     ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         UCE                                           │  │
│   │              Campaign Management + Coin Allocation                   │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│            │                                                               │
│            ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         RDE                                           │  │
│   │        Scoring ─── Ranking ─── Fatigue ─── Timing                  │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│            │                                                               │
│            ▼                                                               │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐             │
│   │   ADSQR     │     │   REZ TRY    │     │   WALLET    │             │
│   │   (QR)      │────►│   (Redeem)   │────►│   (Coins)   │             │
│   └─────────────┘     └─────────────┘     └─────────────┘             │
│            │                    │                    │                       │
│            └────────────────────┼────────────────────┘                       │
│                                 ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    REZ MIND + ATTRIBUTION                            │  │
│   │              Scan ─── Visit ─── Redeem ─── Purchase               │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Campaigns (merged)
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  merchant_id UUID,
  type ENUM('sample', 'trial', 'brand', 'awareness'),
  
  -- Coin config
  coin_type ENUM('try', 'brand'),
  brand_coin_id UUID NULL,
  coin_amount_min INT,
  coin_amount_max INT,
  
  -- Distribution
  distribution_channel ENUM('adsqr', 'dooh', 'both'),
  qr_placement JSONB,  -- {autos: 500, hoardings: 200}
  
  -- Targeting
  targeting JSONB,  -- {location: {}, time: {}, users: {}}
  
  -- Budget
  budget_total DECIMAL,
  budget_spent DECIMAL,
  coins_total INT,
  coins_distributed INT,
  
  -- Status
  status ENUM('draft', 'active', 'paused', 'completed'),
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Coin Transactions (unified)
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY,
  user_id UUID,
  campaign_id UUID,
  
  coin_type ENUM('try', 'brand', 'rez'),
  coin_amount INT,
  
  source ENUM('scan', 'mission', 'purchase', 'referral'),
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP NULL,
  redeemed_at_merchant UUID NULL,
  
  attribution JSONB,  -- {scan_id, visit_id, purchase_id}
  
  created_at TIMESTAMP
);

-- Brand Coins (new)
CREATE TABLE brand_coins (
  id UUID PRIMARY KEY,
  merchant_id UUID,
  name VARCHAR(50),
  symbol VARCHAR(10),
  color VARCHAR(7),
  value_paise INT,  -- 1 coin = X paise
  min_redeem INT,
  valid_days INT,
  
  created_at TIMESTAMP
);
```

---

## SERVICES STRUCTURE

### Services to Build/KEEP

| Service | Action | Port |
|---------|--------|------|
| `rez-try` | KEEP + enhance | 3002 |
| `adsqr` | MERGE into UCE | - |
| `rez-wallet-service` | KEEP | 4004 |
| `rez-intent-graph` | KEEP | 3007 |
| `rez-decision-service` | UPGRADE to RDE | 4027 |
| `uce` | BUILD new | 4030 |
| `sampling-engine` | BUILD new | 4031 |

---

## DELIVERABLES

### Week 1-2: Integration
- [ ] AdsQr → REZ TRY integration
- [ ] Unified coin wallet display
- [ ] Scan → Coins → REZ TRY flow

### Week 3-4: Decision Engine
- [ ] RDE for sampling
- [ ] Trigger engine
- [ ] Fatigue engine

### Week 5-6: Automation
- [ ] Smart coin allocation
- [ ] Auto-campaign suggestions
- [ ] Dynamic QR pricing

### Week 7-8: Brand Coins
- [ ] Brand coin builder
- [ ] Brand campaign campaigns
- [ ] Cross-brand coins

### Week 9-10: DOOH
- [ ] Screen network
- [ ] DOOH attribution
- [ ] Digital QR

---

## METRICS

| Metric | Target | Description |
|--------|--------|-------------|
| Scan → Redeem | > 60% | Conversion rate |
| Coins Distributed | Track | Volume |
| Redemption Rate | > 70% | Coins → Trials |
| Merchant ROI | Track | Cost → Revenue |
| User Satisfaction | > 4.5/5 | After trial |

---

## FILES & DOCUMENTATION

| File | Purpose |
|------|---------|
| `SOURCE-OF-TRUTH/UPGRADE-PLAN.md` | This plan |
| `SOURCE-OF-TRUTH/ADSQR-REZTRY-SYSTEM.md` | System audit |
| `SOURCE-OF-TRUTH/DECISION-ENGINE-SPEC.md` | RDE spec |
| `SOURCE-OF-TRUTH/CONSOLIDATION-PLAN.md` | Consolidation |

---

## NEXT STEPS

1. **Approve** this plan
2. **Week 1-2:** Start integration
3. **Week 3-4:** Build RDE
4. **Week 5-6:** Automation
5. **Week 7-8:** Brand coins
6. **Week 9-10:** DOOH

---

**UPGRADE PLAN: From fragmented sampling to unified sampling engine powered by AI decisions.**
