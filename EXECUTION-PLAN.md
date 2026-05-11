# REZ VERIFY - EXECUTION PLAN
**Version:** 1.0  
**Date:** May 3, 2026  
**Status:** Ready for Development

---

## EXECUTIVE SUMMARY

### What We're Building
**ReZ Verify** - A product authentication + rewards system that turns every physical product into a verifiable digital asset.

### How It Fits
```
┌─────────────────────────────────────────────────────────────┐
│                    REZ ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  NOW QR  │  │ MENU QR  │  │  ROOM QR │  │  ADS QR  │  │
│  │  Store   │  │ Restaurant│  │   Hotel  │  │Campaigns │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │              │         │
│       └──────────────┼──────────────┼──────────────┘         │
│                      ▼                                      │
│              ┌──────────────┐                               │
│              │  REZ VERIFY  │  ← NEW                        │
│              │   Product    │                               │
│              │   Authentic. │                               │
│              └──────────────┘                               │
│                      │                                      │
│                      ▼                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SHARED INFRASTRUCTURE                   │    │
│  │  Auth │ Wallet │ Payment │ Mind │ Chat │ Karma    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## COMPARISON: EXISTING vs VERIFY

| Aspect | Existing QR | ReZ Verify |
|--------|-------------|------------|
| **Scan Type** | Service/order | Product |
| **QR Content** | URL/merchant | Serial number |
| **Reward** | Coins | Branded coins + Product |
| **Verification** | None | Hologram + Serial |
| **Tracking** | Single transaction | Full lifecycle |
| **Brand** | Small merchants | Large brands |

---

## INTEGRATION ARCHITECTURE

```
BRAND                                    CONSUMER
 │                                           │
 ▼                                           ▼
┌─────────────┐                      ┌─────────────┐
│   Verify    │                      │  ReZ App    │
│  Dashboard  │                      │  ReZ Now    │
└──────┬──────┘                      └──────┬──────┘
       │                                     │
       │         ┌────────────────┐           │
       │         │                │           │
       ▼         ▼                ▼           ▼
   ┌─────────────────────────────────────────────┐
   │              VERIFY SERVICE                   │
   │  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
   │  │ Product │ │  Serial  │ │    Fraud     │ │
   │  │ Manager │ │  Lookup  │ │   Engine     │ │
   │  └─────────┘ └──────────┘ └──────────────┘ │
   └─────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   SHARED SERVICES   │
              │  Auth │ Wallet │Mind │
              └─────────────────────┘
```

---

## UNIFIED DATA MODEL

### Product Serial (New Table)
```sql
CREATE TABLE verify_products (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  name VARCHAR(255),
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  total_serials INTEGER,
  created_at TIMESTAMP
);

CREATE TABLE verify_serials (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES verify_products(id),
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  signature VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  first_scan_at TIMESTAMP,
  first_user_id UUID,
  scan_count INTEGER DEFAULT 0,
  is_genuine BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP
);

CREATE TABLE verify_scans (
  id UUID PRIMARY KEY,
  serial_id UUID REFERENCES verify_serials(id),
  user_id UUID,
  device_id VARCHAR(255),
  location JSONB,
  ip_address INET,
  user_agent TEXT,
  is_rewarded BOOLEAN,
  created_at TIMESTAMP
);

CREATE TABLE verify_fraud_flags (
  id UUID PRIMARY KEY,
  serial_id UUID REFERENCES verify_serials(id),
  reason VARCHAR(100),
  severity VARCHAR(20),
  details JSONB,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);

CREATE TABLE verify_rewards (
  id UUID PRIMARY KEY,
  serial_id UUID REFERENCES verify_serials(id),
  brand_id UUID REFERENCES brands(id),
  user_id UUID,
  reward_type VARCHAR(50),
  coin_amount INTEGER,
  is_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE verify_campaigns (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  product_id UUID REFERENCES verify_products(id),
  name VARCHAR(255),
  reward_type VARCHAR(50),
  reward_amount INTEGER,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  budget INTEGER,
  spent INTEGER DEFAULT 0,
  status VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE verify_brand_settings (
  id UUID PRIMARY KEY,
  brand_id UUID UNIQUE REFERENCES brands(id),
  coin_name VARCHAR(50),
  coin_symbol VARCHAR(10),
  reward_per_scan INTEGER,
  logo_url TEXT,
  created_at TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX idx_verify_serials_serial ON verify_serials(serial_number);
CREATE INDEX idx_verify_serials_status ON verify_serials(status);
CREATE INDEX idx_verify_scans_serial ON verify_scans(serial_id);
CREATE INDEX idx_verify_scans_user ON verify_scans(user_id);
CREATE INDEX idx_verify_fraud_serial ON verify_fraud_flags(serial_id);
CREATE INDEX idx_verify_campaigns_brand ON verify_campaigns(brand_id);
```

---

## UNIFIED API DESIGN

### Brand APIs
```typescript
// Create product
POST /api/verify/brands/{brandId}/products
{
  name: string;
  category: string;
  totalSerials: number;
  rewardPerScan: number;
  coinName: string;
}

// Generate serials
POST /api/verify/brands/{brandId}/products/{productId}/serials
{
  quantity: number;
  batchName: string;
}
// Returns: { serials: [{ serial, signature, qrUrl }] }

// Get analytics
GET /api/verify/brands/{brandId}/analytics
// Returns: { totalSerials, scans, uniqueUsers, fraudRate, roi }
```

### Consumer APIs
```typescript
// Verify product
POST /api/verify/verify
{
  serial: string;
  signature: string;
  userId?: string;
  deviceId: string;
  location: { lat: number; lng: number };
}
// Returns: { status, product, brand, reward?, message }

// Claim reward
POST /api/verify/rewards/{rewardId}/claim
// Returns: { success, coins, message }

// Get scan history
GET /api/verify/users/{userId}/history
// Returns: { scans: [{ serial, product, brand, date }] }
```

### Admin APIs
```typescript
// Get fraud queue
GET /api/verify/admin/fraud-queue
// Returns: { flags: [{ serial, reason, severity, createdAt }] }

// Resolve fraud
PUT /api/verify/admin/fraud/{flagId}/resolve
{
  action: 'confirm' | 'dismiss';
  notes: string;
}
```

---

## FRAUD DETECTION ENGINE

### Rules Configuration
```typescript
const FRAUD_RULES = {
  // Velocity: max scans per device per hour
  velocity: {
    max: 5,
    window: '1h',
    action: 'flag'
  },
  
  // Impossible travel: max speed km/hour
  impossibleTravel: {
    maxSpeed: 100, // km/h
    action: 'block'
  },
  
  // Serial abuse: same serial scanned by different users
  serialMultiUser: {
    maxUsers: 2,
    action: 'flag'
  },
  
  // Device fingerprinting
  deviceFingerprint: {
    patterns: ['vpn', 'proxy', 'tor'],
    action: 'flag'
  },
  
  // GPS spoofing detection
  gpsSpoofing: {
    accuracyThreshold: 100, // meters
    action: 'flag'
  }
};
```

### Score Calculation
```typescript
function calculateFraudScore(scan: Scan): number {
  let score = 0;
  
  if (scan.velocity > 5) score += 0.3;
  if (scan.impossibleTravel) score += 0.4;
  if (scan.serialMultiUser) score += 0.2;
  if (scan.vpnDetected) score += 0.2;
  if (scan.gpsSuspicious) score += 0.1;
  
  return Math.min(score, 1.0);
}

// Decisions
// score < 0.3: ALLOW
// score 0.3-0.6: FLAG
// score > 0.6: BLOCK
```

---

## UNIFIED REWARDS SYSTEM

### Integration with Existing Loyalty
```typescript
interface UnifiedReward {
  type: 'verify' | 'now' | 'menu' | 'room' | 'ads';
  source: 'verify_product' | 'order' | 'visit' | 'campaign';
  coins: number;
  bonusCoins: number;
  multiplier: number; // From Karma-Loyalty
  expiresAt?: Date;
}

// Coin flow
// Branded Coins → ReZ Coins → Rupee Value
// 1 Branded Coin = 1 ReZ Coin = ₹1
```

### Reward Calculation
```typescript
function calculateReward(scan: Scan, karmaLevel: string, loyaltyTier: string) {
  // Base reward from brand
  const base = scan.brandReward;
  
  // Karma multiplier (1.0x - 2.0x)
  const karmaMult = KARMA_MULTIPLIERS[karmaLevel];
  
  // Loyalty multiplier (1.0x - 2.0x)
  const loyaltyMult = LOYALTY_MULTIPLIERS[loyaltyTier];
  
  // Total
  return base * karmaMult * loyaltyMult;
}
```

---

## UNIFIED VERIFY SCREEN (Consumer App)

### Flow
```
┌─────────────────────────────────────────┐
│              SCAN CAMERA                │
│                                         │
│         [Capture QR/Serial]             │
│                                         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           VERIFICATION RESULT           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │     ✅ VERIFIED / ❌ FAKE       │   │
│  │                                 │   │
│  │     Product: XYZ Protein       │   │
│  │     Brand: ABC Nutrition        │   │
│  │     Batch: 2024-A              │   │
│  │                                 │   │
│  │     🎁 50 Branded Coins        │   │
│  │                                 │   │
│  │     [Claim Reward]             │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### UI States
| State | Color | Message |
|-------|-------|---------|
| VERIFIED | Green | "Genuine product" |
| ALREADY_SCANNED | Gray | "Already scanned by you" |
| SUSPICIOUS | Yellow | "Unusual scan detected" |
| FAKE | Red | "Product not verified" |

---

## UNIFIED BRAND DASHBOARD

### Menu Structure
```
Brand Dashboard
├── Products
│   ├── List
│   ├── Add Product
│   ├── Edit Product
│   └── Archive Product
├── Serial Numbers
│   ├── View All
│   ├── Generate Batch
│   ├── Download Sheet
│   └── Search Serial
├── Campaigns
│   ├── Active
│   ├── Create
│   ├── Budget
│   └── Performance
├── Analytics
│   ├── Overview
│   ├── Scans Map
│   ├── Timeline
│   └── ROI
├── Fraud
│   ├── Flagged Serials
│   ├── Suspicious Devices
│   └── Reports
└── Settings
    ├── Coin Settings
    └── Team Access
```

---

## UNIFIED QR GENERATION

### Serial Format
```
REZ-{BRAND_PREFIX}-{PRODUCT_CODE}-{RANDOM_12_CHARS}

Example: REZ-ABC-P1-X7K9M2N4P6Q8
```

### QR Content
```typescript
const qrContent = {
  type: 'verify',
  s: serialNumber,
  sig: hmacSha256(serial, secretKey),
  v: 1 // version
};
// Encoded as: REZ-ABC-P1-X7K9...?sig=xxx
```

### Reusable Components (90% match with existing)
- QR generation logic ✓
- Scan tracking ✓
- Reward issuance ✓
- Analytics dashboard ✓
- User notification ✓

---

## EXECUTION TIMELINE

### Phase 1: Foundation (2 weeks)
```
Week 1-2
├── Database schema
├── Core APIs
├── Serial generation
├── Basic verification
└── Unit tests
```

### Phase 2: Rewards (1 week)
```
Week 3
├── Branded coin issuance
├── Reward claiming
├── Wallet integration
└── Notification system
```

### Phase 3: Fraud Engine (1 week)
```
Week 4
├── Velocity detection
├── Geo validation
├── Device fingerprinting
├── Admin fraud queue
└── Manual review flow
```

### Phase 4: Dashboard (2 weeks)
```
Week 5-6
├── Brand dashboard
├── Product management
├── Serial management
├── Analytics
└── Campaign builder
```

### Phase 5: Integration (1 week)
```
Week 7
├── ReZ App integration
├── ReZ Now integration
├── Unified rewards
├── Analytics sync
└── Production deploy
```

---

## ESTIMATED EFFORT

| Component | Complexity | Estimate |
|-----------|-----------|----------|
| Database Schema | Medium | 4 hours |
| Serial Generation | Low | 8 hours |
| Verification API | Medium | 16 hours |
| Reward System | High | 24 hours |
| Fraud Engine | High | 32 hours |
| Brand Dashboard | High | 40 hours |
| Consumer Flow | Medium | 16 hours |
| Testing + Docs | Medium | 16 hours |
| **Total** | - | **~160 hours** |

---

## TEAM REQUIREMENTS

| Role | Tasks |
|------|-------|
| Backend Dev | APIs, fraud engine, serial gen |
| Frontend Dev | Dashboard, consumer UI |
| DevOps | Infrastructure, monitoring |
| Product | UX, flows, testing |

---

## SUCCESS METRICS

| Metric | Target | Timeline |
|--------|--------|----------|
| Scan verification time | <500ms | Launch |
| Fraud detection accuracy | >99% | 1 month |
| Brands onboarded | 10 | 3 months |
| Scans processed | 100K | 6 months |
| Revenue | ₹5L | 6 months |

---

## RISKS & MITIGATION

| Risk | Mitigation |
|------|------------|
| QR copying | Unique serial per unit |
| Fake serials | HMAC signature validation |
| Low brand adoption | Show clear ROI |
| User won't scan | Gamification + rewards |
| Competitor copy | First-mover + ecosystem |

---

## NEXT STEPS

1. [ ] Approve this plan
2. [ ] Assign team
3. [ ] Set up repository
4. [ ] Start Phase 1 development
5. [ ] Weekly standups
6. [ ] Beta with 2-3 brands
7. [ ] Public launch

---

*Execution Plan - May 3, 2026*
