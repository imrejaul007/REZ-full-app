# ReZ 6 QR Ecosystem - Complete Documentation

**Last Updated:** May 4, 2026
**Status:** PRODUCTION READY

---

## Overview

The ReZ 6 QR Ecosystem is a **distribution + attribution + transaction engine** that powers the entire ReZ commerce platform.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REZ 6 QR ECOSYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        DISTRIBUTION LAYER                              │  │
│  │                                                                       │  │
│  │   Store QR ────── Ads QR ────── Creator QR                           │  │
│  │   (Discovery)     (Marketing)     (Social Commerce)                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        ATTRIBUTION LAYER                               │  │
│  │                                                                       │  │
│  │   ReZ Intent Graph ─── ReZ Mind ─── AI Analysis                     │  │
│  │   (Tracking)           (Nudges)      (ML Scoring)                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                       TRANSACTION LAYER                               │  │
│  │                                                                       │  │
│  │   Menu QR ────── Room QR ────── Verify QR                            │  │
│  │   (Ordering)      (Services)     (Authentication)                    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The 6 QR Systems

| # | System | URL | Use Case | Drives |
|---|--------|-----|----------|--------|
| 1 | **Menu QR** | `menu.rez.money/{slug}` | Ordering | Transactions |
| 2 | **Store QR** | `now.rez.money/{slug}` | Discovery | Repeat visits |
| 3 | **Room QR** | `room.rez.money/{hotelId}/{roomId}` | Hotel services | Upsells |
| 4 | **Ads QR** | `adsqr.rez.money/c/{campaignId}` | Marketing | Attribution |
| 5 | **Verify QR** | `verify.rez.money/s/{serial}` | Authentication | Trust |
| 6 | **Creator QR** | `creator.rez.money/{creatorId}` | Social commerce | Viral growth |

---

## 1. MENU QR (`menu.rez.money/{slug}`)

### Purpose
Restaurant ordering - dine-in and takeaway

### Use Case Flow
```
Customer sits at table
        │
        ▼
┌─────────────────┐
│ Scan Menu QR     │
│ (On table)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Browse Menu     │
│ Categories      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add to Cart     │
│ Special requests │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Submit Order    │
│ (To kitchen)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pay & Tip       │
│ Split if needed │
└─────────────────┘
```

### Features
| Feature | Description |
|---------|-------------|
| Menu Display | Categories, items, prices |
| Cart Management | Add, modify, remove items |
| Order Processing | Send to kitchen display |
| Dietary Filters | Vegetarian, vegan, allergen |
| Payment | Wallet, UPI, card |
| Split Bill | Divide among guests |
| Tip Option | Add tip to order |
| Waiter Call | Request assistance |
| Nutritional Info | Calories, macros |
| Pairing Suggestions | Wine/food pairing |

### Revenue Attribution
| Event | Weight |
|-------|--------|
| Order placed | 0.85 |
| Payment completed | 1.00 |
| Tip added | 1.00 |

---

## 2. STORE QR (`now.rez.money/{slug}`)

### Purpose
Merchant discovery - anywhere the merchant wants to be found

### Use Case Flow
```
User sees merchant
(anywhere: entrance, packaging, ad, receipt)
        │
        ▼
┌─────────────────┐
│ Scan Store QR   │
│ (now.rez)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Profile    │
│ Offers, Reviews │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Visit  │ │Order  │
│Store  │ │Online │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Attribution     │
│ Tracked         │
└─────────────────┘
```

### Features
| Feature | Description |
|---------|-------------|
| Merchant Profile | Contact info, hours, address |
| Offers & Deals | Current promotions |
| Reviews & Ratings | Customer feedback |
| Directions | Map integration |
| Social Links | Instagram, Facebook, etc. |
| Store Bio | Merchant story |
| Gallery | Photos and videos |
| Services Catalog | List of services |
| Appointment Booking | Book service slots |
| Custom Links | 10 configurable links |

### Revenue Attribution
| Event | Weight |
|-------|--------|
| Profile view | 0.20 |
| Offer viewed | 0.30 |
| Direction clicked | 0.35 |
| First visit | 0.50 |
| Repeat visit | 0.60 |

---

## 3. ROOM QR (`room.rez.money/{hotelId}/{roomId}`)

### Purpose
Hotel guest experience - services and requests

### Use Case Flow
```
Guest arrives at hotel
        │
        ▼
┌─────────────────┐
│ Scan Room QR    │
│ (On door/card) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service Menu    │
│ Options         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Request│ │Add    │
│Service│ │Charge │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Staff  │ │Room   │
│Notif  │ │Ledger │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
         ▼
    ┌───────┐
    │Checkout│
    └───────┘
```

### Features
| Feature | Description |
|---------|-------------|
| Housekeeping Requests | Cleaning, towels, toiletries |
| Room Service | Food and beverage orders |
| Maintenance | Report issues |
| Minibar | Order from minibar |
| Transport | Book cabs, transfers |
| Restaurant Reservations | Book hotel restaurant |
| Checkout | View charges, express checkout |
| Guest Preferences | Store preferences |
| Late Checkout | Request extension |
| Early Check-in | Request early arrival |

### Revenue Attribution
| Event | Weight |
|-------|--------|
| Service requested | 0.40 |
| Charge added | 0.60 |
| Checkout completed | 0.80 |

---

## 4. ADS QR (`adsqr.rez.money/c/{campaignId}`)

### Purpose
Campaign tracking - measure marketing ROI

### Use Case Flow
```
User sees ad
(Offline: billboard, flyer, packaging)
(Online: social media, display ads)
        │
        ▼
┌─────────────────┐
│ Scan Ads QR     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Record Scan     │
│ Attribution     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Landing Page    │
│ (Template)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Browse │ │Purchase│
│Engage │ │Convert │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Credit Rewards  │
│ Track ROI       │
└─────────────────┘
```

### Features
| Feature | Description |
|---------|-------------|
| Campaign Management | Create, edit, pause campaigns |
| Bulk QR Generation | Multiple codes per campaign |
| Dynamic QR Content | Change without reprinting |
| Time-based Redirects | Different content by time |
| Location-based Content | Different by location |
| 8 Landing Templates | Video, Coupon, Lead Capture, etc. |
| GPS Verification | Verify physical presence |
| Attribution Tracking | Scan → Visit → Purchase |
| Reward System | REZ Coins for engagement |
| A/B Testing | Test different creatives |
| Brand Coins | Custom branded rewards |
| Sample Distribution | Free sample requests |

### Attribution Funnel
| Event | Weight |
|-------|--------|
| campaign_scanned | 0.30 |
| offer_viewed | 0.25 |
| sample_requested | 0.45 |
| consultation_booked | 0.55 |
| purchase_attributed | 0.85 |
| lead_captured | 0.50 |

### Landing Page Templates
| Template | Use Case | Goal |
|----------|----------|------|
| Product | Physical product ads | Direct sale |
| Video | Brand storytelling | Engagement |
| Coupon | Discount offers | Conversion |
| Lead Capture | Contact forms | Signup |
| Contest | Sweepstakes | Engagement |
| Consultation | Booking calls | Appointment |
| Sample | Free samples | Trial |
| Custom | Branded experience | Custom |

---

## 5. VERIFY QR (`verify.rez.money/s/{serial}`)

### Purpose
Product authentication - trust and brand protection

### Use Case Flow
```
Consumer buys product
(with Verify QR on packaging)
        │
        ▼
┌─────────────────┐
│ Scan Verify QR  │
│ (verify.rez)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Auth     │
│ Serial Number   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Show Result     │
│ Authentic/Fake  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Authentic│ │Counterfeit│
│Show Story│ │Report It │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Supply │ │Fraud  │
│Chain  │ │Alert  │
└───────┘ └───────┘
```

### Features
| Feature | Description |
|---------|-------------|
| Serial Validation | Cryptographic verification |
| Supply Chain Tracking | End-to-end journey |
| Brand Storytelling | Product origin, journey |
| Hologram Matching | Multi-layer verification |
| NFC Support | NFC chip reading |
| Report Counterfeit | Consumer reports |
| Recall Alerts | Real-time notifications |
| Batch Verification | Multi-item scanning |
| Offline Verification | Works without internet |
| Karma Integration | Earn points for verification |

### Verification Layers
| Layer | Description |
|-------|-------------|
| Serial Number | Cryptographic validation |
| HMAC Signature | Tamper-proof |
| Supply Chain | Manufacturer → Distributor → Retailer |
| Hologram | Physical anti-counterfeit |
| NFC | Embedded chip (optional) |

### Revenue Attribution
| Event | Weight |
|-------|--------|
| Verification completed | 0.25 |
| Story viewed | 0.15 |
| Supply chain viewed | 0.20 |
| Report submitted | 0.30 |
| Brand followed | 0.40 |

---

## 6. CREATOR QR (`creator.rez.money/{creatorId}`)

### Purpose
Social commerce - influencer marketing and viral growth

### Use Case Flow
```
User sees creator content
(Social media, bio, content)
        │
        ▼
┌─────────────────┐
│ Scan Creator QR │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Creator    │
│ Profile         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ See Recommended │
│ Products        │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Browse │ │Purchase│
│Content│ │Via Link│
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│ Attribution     │
│ to Creator      │
└─────────────────┘
```

### Features
| Feature | Description |
|---------|-------------|
| Creator Profile | Bio, photo, stats |
| Product Recommendations | Curated picks |
| Affiliate Tracking | Commission attribution |
| Content Gallery | Posts, videos |
| Social Proof | Followers, engagement |
| Commission System | Per-sale earnings |
| Creator Dashboard | Analytics, earnings |
| Exclusive Content | Members-only |
| Live Integration | Shoppable streams |
| Challenge/Contest | Engagement campaigns |

### Revenue Attribution
| Event | Weight |
|-------|--------|
| Profile viewed | 0.20 |
| Product viewed | 0.30 |
| Affiliate link clicked | 0.50 |
| Purchase via affiliate | 0.70 |
| Content shared | 0.35 |
| Creator followed | 0.40 |

---

## Attribution Engine

All QR scans flow through ReZ Intent Graph:

```
QR Scan
   │
   ▼
┌──────────────────────┐
│ ReZ Intent Graph    │
├──────────────────────┤
│ 1. Record event     │
│ 2. Assign weight     │
│ 3. Track journey    │
│ 4. ML scoring       │
│ 5. Dormancy check   │
└──────────────────────┘
   │
   ▼
┌──────────────────────┐
│ ReZ Mind            │
├──────────────────────┤
│ - 8 AI Agents       │
│ - Signal capture     │
│ - Dormancy detect   │
│ - Nudge triggers    │
└──────────────────────┘
   │
   ▼
┌──────────────────────┐
│ ReZ Decision Engine │
├──────────────────────┤
│ - 9 segments        │
│ - Frequency caps     │
│ - Action execution   │
│ - Reward distribution│
└──────────────────────┘
```

---

## Services Integration

| QR Type | Primary Services | Attribution |
|---------|------------------|-------------|
| Menu QR | catalog, order, payment, wallet | ReZ Intent Graph |
| Store QR | now, catalog, wallet | ReZ Intent Graph |
| Room QR | stayown, payment, notifications | ReZ Intent Graph |
| Ads QR | adsqr, adBazaar, wallet | ReZ Intent Graph |
| Verify QR | karma, wallet, auth | ReZ Intent Graph |
| Creator QR | now, wallet, catalog | ReZ Intent Graph |

---

## Shared Infrastructure

### QR URL Scheme
```
rez://{type}/{id}?{params}
```

### Supported Types
| Type | Pattern |
|------|---------|
| menu | `rez://menu/{merchantId}?table={tableId}` |
| profile | `rez://profile/{profileId}` |
| room | `rez://room/{roomId}?token={jwt}` |
| ad | `rez://ad/{campaignId}?source=qr` |
| verify | `rez://verify/{brand}/{serial}` |
| creator | `rez://creator/{creatorId}` |

---

## Status

| QR System | Frontend | Backend | Production |
|-----------|----------|---------|------------|
| Menu QR | 95% | ✅ | ✅ |
| Store QR | 90% | ✅ | ✅ |
| Room QR | 95% | ✅ | ✅ |
| Ads QR | 92% | ✅ | ✅ |
| Verify QR | Planned | Research | 📋 |
| Creator QR | Planned | Research | 📋 |

---

## Documentation

| File | Description |
|------|-------------|
| `SOURCE-OF-TRUTH/QR-SYSTEMS-COMPLETE.md` | Full documentation |
| `SOURCE-OF-TRUTH/REZ-VERIFY-QR.md` | Verify QR details |
| `SOURCE-OF-TRUTH/QR-SDK-CONSOLIDATION.md` | SDK decisions |
| `docs/QR-SYSTEMS-MASTER-AUDIT.md` | Implementation audit |
| `docs/REZ-VERIFY-RESEARCH.md` | Verify QR research |
| `docs/QR-SYSTEMS-FINAL-PLAN.md` | Roadmap |
