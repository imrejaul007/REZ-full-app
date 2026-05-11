# REE (ReZ Economic Engine) - COMPLETE AUDIT

**Date:** May 9, 2026
**Service:** rez-karma-service
**Status:** PRODUCTION READY

---

## WHAT IS REE?

**REE = ReZ Economic Engine**

A loyalty and rewards system that creates value for:
- Consumers (earn coins, karma tiers)
- Merchants (karma scoring, customer insights)
- Brands (targeted campaigns)
- Corporates (CSR allocations)

---

## REE PRODUCTS

| Product | Description |
|---------|-------------|
| **REE Dashboard** | Consumer rewards view |
| **REE Admin** | Admin panel |
| **REE Monitoring** | Real-time monitoring |
| **ReZ Karma** | Consumer loyalty app |
| **Karma Service** | Backend service |
| **Karma-Loyalty Bridge** | Connect Karma to REE |

---

## REE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     REE (Karma Service)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CONSUMER LAYER                                                 │
│  ├── REE Dashboard (Web)                                        │
│  ├── ReZ Karma App (Mobile)                                     │
│  └── Impact Resume (PDF)                                        │
│                                                                  │
│  MERCHANT LAYER                                                │
│  ├── Karma Scoring                                              │
│  ├── CSR Allocations                                           │
│  └── Corporate Partner Dashboard                                │
│                                                                  │
│  API LAYER                                                     │
│  ├── /api/karma/* (Karma routes)                              │
│  ├── /api/karma/verify/* (Verification)                       │
│  ├── /api/karma/batch/* (Batch operations)                    │
│  ├── /api/karma/event/* (Event management)                     │
│  ├── /api/karma/wallet/* (Wallet)                             │
│  └── /api/karma/booking/* (Bookings)                           │
│                                                                  │
│  WORKERS                                                        │
│  ├── coinEventSubscriber (Coin events)                          │
│  ├── scoreRankWorker (Leaderboard)                              │
│  ├── decayWorker (Karma decay)                                  │
│  └── rewardWorker (Auto-rewards)                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## REE FEATURES (40+)

### 1. KARMA SCORING (0-1000)

| Tier | Score | Color | Rewards |
|------|-------|-------|---------|
| Starter | 300-499 | Gray | 1x |
| Active | 500-649 | Green | 1.25x |
| Performer | 650-749 | Blue | 1.5x |
| Leader | 750-819 | Purple | 1.75x |
| Elite | 820-879 | Orange | 2x |
| Legend | 880-899 | Red | 2.25x |
| Pinnacle | 900 | Gold | 2.5x |

### 2. COIN ECONOMY

| Aspect | Value |
|--------|-------|
| 1 Coin = | ₹1 |
| Earn | 1 coin per ₹1 spent |
| Redemption | 1 coin per ₹1 |
| Bonus Multipliers | Based on karma tier |

### 3. MICRO ACTIONS (12)

| Action | Coins | Karma |
|--------|-------|-------|
| Sign up | 50 | 10 |
| First order | 100 | 50 |
| Referral | 200 | 100 |
| Review | 20 | 10 |
| Share | 10 | 5 |
| Daily login | 5 | 2 |
| Social share | 10 | 5 |
| Bill upload | 30 | 15 |
| Event join | 50 | 25 |
| Community contribution | 100 | 50 |
| Streak bonus | 10-50 | 5-25 |
| Challenge complete | 25-100 | 12-50 |

### 4. KARMA DECAY

- Decay rate: 1% per week
- Inactive users lose karma slowly
- Re-engagement restores karma

### 5. CROSS-MERCHANT LOYALTY

- Single karma score across all merchants
- Merchants can offer tier-based rewards
- Consumer discovers new merchants via karma

### 6. CSR & IMPACT

| Feature | Description |
|---------|-------------|
| CSR Allocations | Companies allocate % of coin mint |
| Civic Events | NGO events, volunteering |
| Cause Communities | Fundraisers |
| Impact Resume | PDF showing impact history |
| Booking System | Book volunteering slots |

### 7. VERIFICATION

| Type | Description |
|------|-------------|
| Bill Verification | Upload receipts, earn bonus |
| Streak Verification | Daily check-ins |
| Review Verification | Geo-tagged reviews |

### 8. FRAUD DETECTION (10 Rules)

| Rule | Detection |
|------|-----------|
| Velocity Check | 10 actions in 30 seconds |
| Impossible Travel | Geo-distance violation |
| Duplicate Bill | Same bill in time window |
| Future Date | Bills dated in future |
| Referral Loop | Circular referrals |
| Bot Pattern | Automated behavior |
| Device Fingerprint | Same device, different users |
| Session Anomaly | Unusual session patterns |
| Location Anomaly | Impossible locations |
| Time Anomaly | Unusual activity times |

---

## REE API ROUTES

### Karma Routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/karma/user/:userId` | GET | Get karma profile |
| `/api/karma/user/:userId/history` | GET | Get history |
| `/api/karma/user/:userId/level` | GET | Get level info |
| `/api/karma/leaderboard` | GET | Leaderboard |
| `/api/karma/decay-all` | POST | Trigger decay |

### Event Routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/karma/event` | POST | Create event |
| `/api/karma/event/:id` | GET | Get event |
| `/api/karma/events` | GET | List events |

### Wallet Routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/karma/wallet/balance` | GET | Get balance |
| `/api/karma/wallet/transactions` | GET | Get transactions |
| `/api/karma/wallet/transfer` | POST | Transfer coins |

### CSR Routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/karma/csr/allocate` | POST | CSR allocation |
| `/api/karma/csr/report` | GET | CSR report |
| `/api/karma/csr/dashboard` | GET | Dashboard |

### Batch Routes
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/karma/batch/event` | POST | Batch events |
| `/api/karma/batch/verify` | POST | Batch verification |

---

## REE MODELS

| Model | Description |
|-------|-------------|
| KarmaProfile | User karma score, tier, history |
| KarmaEvent | All karma events |
| KarmaTransaction | Coin transactions |
| KarmaRule | Karma calculation rules |
| KarmaLevel | Tier definitions |
| KarmaConversion | Coin to karma mapping |
| CorporatePartner | CSR partners |
| CsrAllocation | CSR fund allocations |
| CauseCommunity | Fundraiser communities |
| CivicEvent | Volunteering events |
| KarmaBooking | Event bookings |
| KarmaPerk | Available perks |
| KarmaPerkRedemption | Perk claims |
| KarmaStreak | Streak tracking |
| KarmaBadge | Achievements |

---

## REE WORKERS

| Worker | Purpose |
|--------|---------|
| coinEventSubscriber | Process coin events |
| scoreRankWorker | Update leaderboard |
| decayWorker | Apply karma decay |
| rewardWorker | Auto-distribute rewards |

---

## REE FILES

```
rez-karma-service/
├── src/
│   ├── index.ts (main)
│   ├── routes/
│   │   ├── karmaRoutes.ts
│   │   ├── karmaScoreRoutes.ts
│   │   ├── verifyRoutes.ts
│   │   ├── batchRoutes.ts
│   │   ├── eventRoutes.ts
│   │   ├── walletRoutes.ts
│   │   ├── bookingRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   ├── civicRoutes.ts
│   │   ├── perkRoutes.ts
│   │   └── health.ts
│   ├── services/
│   │   ├── karmaService.ts
│   │   ├── reportService.ts
│   │   ├── impactResumeService.ts
│   │   ├── csrService.ts
│   │   ├── coinService.ts
│   │   └── rewardService.ts
│   ├── engines/
│   │   └── karmaEngine.ts
│   ├── models/
│   │   ├── KarmaProfile.ts
│   │   ├── KarmaEvent.ts
│   │   ├── KarmaTransaction.ts
│   │   └── ...
│   ├── workers/
│   │   ├── coinEventSubscriber.ts
│   │   ├── scoreRankWorker.ts
│   │   ├── decayWorker.ts
│   │   └── rewardWorker.ts
│   └── config/
│       ├── mongodb.ts
│       ├── redis.ts
│       └── logger.ts
├── tests/
└── dist/
```

---

## REE CONNECTIONS

```
REE connects to:
├── wallet-service (coin balance)
├── payment-service (fraud checks)
├── merchant-service (karma, cashback)
├── order-service (commission)
├── gamification (coins, karma)
├── notification-service (alerts)
└── ReZ Mind (user insights)
```

---

## REE MONGODB

| Database | Collections |
|----------|-----------|
| karma | KarmaProfiles, KarmaEvents, KarmaTransactions |
| karma | KarmaRules, KarmaLevels, KarmaConversions |
| karma | CorporatePartners, CsrAllocations |
| karma | CauseCommunities, CivicEvents |
| karma | KarmaBookings, KarmaPerks, KarmaBadges |

---

## REE DEPLOYMENT

| Aspect | Value |
|--------|-------|
| Port | 4019 |
| GitHub | rez-karma-service |
| Render | rez-karma-service.onrender.com |
| MongoDB | karma database |
| Redis | Session cache |

---

## REE REVENUE MODEL

| Source | Revenue |
|--------|---------|
| Platform fee | 1-2% on coin transactions |
| CSR allocations | 5% admin fee |
| Corporate partnerships | ₹10K-1L/month |
| Premium tiers | ₹99-999/month |
| Data insights | ₹5K-50K/month |

---

## REE METRICS

| Metric | Target |
|--------|--------|
| Active users | 1,00,000 |
| Coins in circulation | 10 Cr |
| Transactions/month | 10,000 |
| Corporate partners | 100 |
| Revenue | ₹10L/month |

---

## REE ISSUES (if any)

| Issue | Status |
|-------|--------|
| Leaderboard | Phase 2 - Not implemented |
| Feed | Phase 2 - Not implemented |
| ML models | TODO |

---

## REE STATUS

| Component | Status |
|-----------|--------|
| Karma scoring | ✅ Built |
| Coin economy | ✅ Built |
| Micro actions | ✅ Built |
| Karma tiers | ✅ Built |
| CSR | ✅ Built |
| Verification | ✅ Built |
| Fraud detection | ✅ Built |
| Leaderboard | ⏳ Phase 2 |
| Feed | ⏳ Phase 2 |
| ML recommendations | ⏳ TODO |

---

## REE IMPROVEMENTS NEEDED

| Improvement | Priority |
|-------------|----------|
| Leaderboard API | HIGH |
| ML-based recommendations | HIGH |
| Push notifications | MEDIUM |
| Deep linking | MEDIUM |
| A/B testing | LOW |

---

*REE Audit - May 9, 2026*
