# REZ UNIFIED MARKETING PLATFORM - MASTER PLAN

**Based on:** Complete ecosystem audit
**Date:** May 5, 2026
**Status:** PLANNING PHASE

---

## THE VISION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ UNIFIED MARKETING PLATFORM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   MERCHANT ──▶ CREATE CAMPAIGN ──▶ REZ MIND ──▶ MATCH + TARGET            │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                        CHANNELS                                        │  │
│   │                                                                       │  │
│   │   WhatsApp ─── Push ─── Email ─── Ads ─── Karma ─── Rendez ─── QR    │  │
│   │                                                                       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│   USER <─── PERSONALIZED MESSAGE <─── INTENT + LOCATION + BUDGET            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## THE CORE FLOW

### 1. Merchant Creates Campaign

```
Merchant (Restaurant/Hotel/Cosmetic/Corporate)
 │
 ▼
┌─────────────────────────────────────────────────────────────┐
│ MERCHANT DASHBOARD                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Select Category (Restaurant/Hotel/Cosmetic/Corporate) │
│ 2. Create Offer (Discount/Deal/Bundle)                  │
│ 3. Set Budget (₹20,000)                                 │
│ 4. Select Location (BTM/Banashankari/HSR)                 │
│ 5. Set Goal (Orders/Bookings/Awareness)                  │
│ 6. Select Channels (WhatsApp/Push/Ads/Karma/Rendez)      │
└─────────────────────────────────────────────────────────────┘
```

### 2. ReZ Mind Processes

```
ReZ Mind
 │
 ├─▶ INTENT CAPTURE
 │    Search history, scan history, chat history
 │
 ├─▶ USER PROFILE
 │    Location, budget, preferences, LTV
 │
 ├─▶ MATCHING
 │    Find users who want briyani
 │
 ├─▶ CHANNEL SELECTION
 │    WhatsApp (high intent) / Push (mid) / Ads (low)
 │
 └─▶ BUDGET ALLOCATION
      Distribute across channels for max ROI
```

### 3. Execution Across Channels

```
┌─────────────────────────────────────────────────────────────┐
│ CAMPAIGN EXECUTION                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 WHATSAPP (High Intent)                                │
│     "Best briyani in BTM! 20% off for next 2 hours"      │
│     Direct message to interested users                       │
│                                                             │
│  🔔 PUSH (Mid Intent)                                     │
│     "Briyani deals near you"                               │
│     ReZ App notification                                   │
│                                                             │
│  📧 EMAIL (Low Intent / Nurture)                          │
│     "New restaurant opened near you"                        │
│     Weekly digest                                          │
│                                                             │
│  🏙️ ADS (Awareness)                                      │
│     AdBazaar QR codes on autos/hoardings                   │
│     Display ads targeting BTM area                           │
│                                                             │
│  🎁 KARMA (Engagement)                                    │
│     "Clean BTM Lake campaign - Earn ₹100 coins"           │
│     Community engagement + brand awareness                   │
│                                                             │
│  👥 RENDEZ (Viral)                                       │
│     "Invite your date for briyani"                         │
│     Referral system for social sharing                       │
│                                                             │
│  ✅ VERIFY QR (Trust)                                     │
│     Scan product QR for authenticity                         │
│     "Briyani made with authentic spices"                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Attribution & ROI

```
Campaign Running...
 │
 ├─▶ Scan Tracking (QR codes)
 ├─▶ Click Tracking (WhatsApp/Email)
 ├─▶ Location Tracking (GPS)
 ├─▶ Purchase Attribution
 │
 └─▶ ROI Calculation
      Cost per acquisition
      Revenue generated
      Profit margin
```

---

## CURRENT STATE AUDIT

### What Exists

| Component | Service | Status |
|-----------|---------|--------|
| **Intent Capture** | rez-intent-graph, rez-intent-service | ✅ Production |
| **Marketing Service** | rez-marketing-service | ✅ Production |
| **WhatsApp Integration** | rez-marketing-service | ✅ Production |
| **Push Notifications** | rez-marketing-service | ✅ Production |
| **Email/SMS** | rez-marketing-service | ✅ Production |
| **Ads Platform** | adsqr, adBazaar | ✅ Production |
| **Karma System** | karma service | ✅ Production |
| **Rendez System** | rendez service | ✅ Production |
| **Verify QR** | verify service | 📋 Planned |
| **CorpSparks** | Corporate booking | 📋 Planned |
| **Merchant Dashboard** | rez-app-merchant | ✅ Production |

### What's Missing

| Component | Status | Priority |
|-----------|--------|----------|
| **Unified Campaign Dashboard** | ❌ Missing | HIGH |
| **Channel Orchestrator** | ❌ Missing | HIGH |
| **Budget Allocator** | ❌ Missing | HIGH |
| **Multi-category Support** | ❌ Partial | HIGH |
| **CorpSparks Integration** | ❌ Missing | MEDIUM |
| **Verify QR Integration** | ❌ Missing | MEDIUM |
| **AI Campaign Optimizer** | ❌ Missing | MEDIUM |
| **Merchant Self-Service** | ❌ Partial | HIGH |

---

## THE UNIFIED PLATFORM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNIFIED MARKETING PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      MERCHANT LAYER                                     │  │
│  │                                                                       │  │
│  │   Merchant Dashboard                                                  │  │
│  │   ├── Campaign Creator                                                │  │
│  │   ├── Budget Manager                                                  │  │
│  │   ├── Channel Selector                                                │  │
│  │   └── Analytics Dashboard                                             │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      REZ MIND LAYER                                  │  │
│  │                                                                       │  │
│  │   Intent Engine ───▶ Matching Engine ───▶ Channel Selector            │  │
│  │   │                      │                       │                    │  │
│  │   │                      ▼                       ▼                    │  │
│  │   │              Budget Allocator ───▶ Campaign Orchestrator        │  │
│  │   │                                   │                             │  │
│  │   └───────────────────────────────────┘                             │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CHANNEL EXECUTION LAYER                            │  │
│  │                                                                       │  │
│  │   WhatsApp ─── Push ─── Email ─── Ads ─── Karma ─── Rendez ─── QR │  │
│  │      │           │         │        │        │         │         │    │  │
│  │      └───────────┴─────────┴────────┴────────┴─────────┴─────────┘    │  │
│  │                               │                                          │  │
│  │                    Attribution & Tracking                              │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      FEEDBACK LAYER                                  │  │
│  │                                                                       │  │
│  │   ROI Calculation ───▶ Optimization ───▶ Next Campaign              │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CATEGORY STRATEGIES

### 1. RESTAURANT

**Decision Cycle:** Fast (minutes to hours)

```
Focus Channels: WhatsApp + Push + Karma
Secondary: Rendez + Verify QR
```

| Channel | Use Case | Example |
|---------|----------|---------|
| **WhatsApp** | High intent, urgent offers | "20% off on biryani - order now!" |
| **Push** | Mid intent, nearby deals | "Biryani deals within 2km" |
| **Karma** | Community campaigns | "Clean BTM Lake - Earn ₹100 coins" |
| **Rendez** | Social sharing | "Invite date for dinner - 50% off" |
| **Verify QR** | Trust building | "Authentic Hyderabadi spices" |

**Campaign Example:**
```
Merchant: Biryani Palace
Offer: 20% off on briyani
Budget: ₹20,000
Location: BTM Layout

Execution:
├─ WhatsApp: 5,000 users (₹10,000)
│   "Best briyani in BTM! 20% off today only"
│
├─ Push: 10,000 users (₹3,000)
│   "Briyani deals near you"
│
├─ Karma: 500 participants (₹5,000)
│   "Participate in food festival - Earn coins"
│
└─ Ads: 2,000 impressions (₹2,000)
    "Biryani Palace - Now in BTM"
```

---

### 2. HOTEL

**Decision Cycle:** Long (days to weeks)

```
Focus Channels: Email + WhatsApp + Push
Secondary: Ads + Karma
```

| Channel | Use Case | Example |
|---------|----------|---------|
| **Email** | Nurture sequence | "Weekend getaway packages" |
| **WhatsApp** | High intent, direct | "Early bird discount for your booking" |
| **Push** | Reminder | "Weekend is here! 15% off rooms" |
| **Ads** | Awareness | "Luxury staycation starting ₹3,999" |
| **Karma** | Corporate events | "Team offsite at our venue" |

**Campaign Example:**
```
Merchant: Grand Hotel
Offer: Weekend package ₹4,999
Budget: ₹50,000
Location: Indiranagar

Execution:
├─ Email: 2,000 users (₹5,000)
│   Series: Day 1, Day 3, Day 5 nurture
│
├─ WhatsApp: 500 high-intent users (₹15,000)
│   "Your weekend escape awaits - Book now"
│
├─ Push: 3,000 users (₹5,000)
│   "Weekend getaway starting ₹3,999"
│
└─ Karma: Corporate campaign (₹25,000)
    "Book team outing - Get 30% off"
```

---

### 3. COSMETIC

**Decision Cycle:** Medium (hours to days)

```
Focus Channels: Verify QR + WhatsApp + Ads
Secondary: Push + Karma
```

| Channel | Use Case | Example |
|---------|----------|---------|
| **Verify QR** | Trust + authenticity | "Scan to verify authenticity" |
| **WhatsApp** | High intent, detailed info | "Complete skincare routine" |
| **Ads** | Awareness + education | "Organic skincare" |
| **Push** | Reminder | "Your serum is running low" |
| **Karma** | Sampling campaigns | "Free sample - Review & earn coins" |

**Campaign Example:**
```
Merchant: GlowUp Cosmetics
Offer: Free serum sample + 30% off
Budget: ₹30,000
Location: Koramangala

Execution:
├─ Verify QR: 5,000 product QR codes (₹0)
│   "Scan to verify authenticity + get offer"
│
├─ WhatsApp: 1,000 interested users (₹15,000)
│   "Your skin analysis shows you need this serum"
│
├─ Ads: 10,000 impressions (₹10,000)
│   "100% organic - Verify QR on every product"
│
└─ Karma: 500 reviews (₹5,000)
    "Try sample + write review = Earn ₹100"
```

---

### 4. CORPORATE (CorpSparks)

**Decision Cycle:** Very Long (weeks to months)

```
Focus Channels: Direct + Email + WhatsApp
Secondary: Meeting/Call
```

| Channel | Use Case | Example |
|---------|----------|---------|
| **Direct** | Bulk orders | "Corporate bulk order - 40% off" |
| **Email** | Proposals | "Employee wellness program" |
| **WhatsApp** | Follow-ups | "Following up on our proposal" |
| **Meeting** | Demo/Sales | "Product demo for HR team" |

**Campaign Example:**
```
Merchant: Corporate Catering Co.
Offer: Employee lunch program
Budget: ₹1,00,000
Target: HR admins in tech companies

Execution:
├─ Email: 200 HR contacts (₹10,000)
│   "Transform your employee lunch program"
│
├─ WhatsApp: 50 decision makers (₹20,000)
│   "Following up - Want to schedule demo?"
│
├─ Direct: 10 key accounts (₹50,000)
│   Personal outreach + demo
│
└─ Karma: Corporate challenge (₹20,000)
    "Health challenge for employees"
```

---

## DISTRIBUTION CHANNELS (Complete)

### 1. AdBazaar (Top Funnel - Awareness)

```
Offline Spaces:
├─ Autos (QR codes on back)
├─ Hoardings (QR codes)
├─ Mall Kiosks
├─ Restaurant TVs
└─ Hotel Lobbies

Targeting: Location + Demographics
```

### 2. ReZ App (Discovery)

```
Discovery:
├─ Home feed
├─ Nearby section
├─ Search results
└─ Category pages

Push Notifications:
├─ Location-based
├─ Interest-based
└─ Behavioral triggers
```

### 3. WhatsApp (High Intent - Conversion)

```
Direct Messaging:
├─ Campaign broadcasts
├─ Personalized offers
├─ Order confirmations
└─ Re-engagement

Rules:
├─ Opt-in required
├─ 24-hour window
└─ Template approval
```

### 4. Email (Nurture)

```
Types:
├─ Welcome series
├─ Cart abandonment
├─ Browse abandonment
├─ Win-back
└─ Weekly digest

Best for: Long decision cycles
```

### 5. Karma (Engagement)

```
Campaign Types:
├─ Community challenges
├─ Brand partnerships
├─ Loyalty rewards
└─ Viral contests

Earn coins → Redeem for merchant offers
```

### 6. Rendez (Viral/Referral)

```
Features:
├─ Invite friends
├─ Group bookings
├─ Date packages
└─ Social sharing

Example: "Book table for 4, 5th free"
```

### 7. Verify QR (Trust)

```
Use Cases:
├─ Product authenticity
├─ Origin story
├─ Supply chain
└─ Brand engagement

Drives: Trust → Purchase
```

### 8. CorpSparks (B2B)

```
Features:
├─ Corporate bulk orders
├─ Employee programs
├─ Event catering
└─ Custom campaigns

Target: HR, Admin, Procurement
```

---

## CAMPAIGN CREATION FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAMPAIGN WIZARD                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: BASIC INFO                                                        │
│  ├─ Campaign Name: [________________]                                      │
│  ├─ Category: [Restaurant ▼]                                                │
│  └─ Start/End Date: [____] to [____]                                       │
│                                                                              │
│  STEP 2: OFFER                                                             │
│  ├─ Offer Type: [Discount ▼]                                                │
│  ├─ Discount: [20]% OFF                                                     │
│  ├─ Minimum Order: ₹[500]                                                   │
│  └─ Description: [________________]                                          │
│                                                                              │
│  STEP 3: BUDGET                                                            │
│  ├─ Total Budget: ₹[20,000]                                                 │
│  └─ Cost Cap: ₹[5] per user                                                 │
│                                                                              │
│  STEP 4: LOCATION                                                           │
│  ├─ City: [Bangalore ▼]                                                     │
│  ├─ Area: [BTM ▼]                                                           │
│  └─ Radius: [3] km                                                          │
│                                                                              │
│  STEP 5: CHANNELS                                                           │
│  ├─ ☑ WhatsApp (₹10,000)                                                   │
│  ├─ ☑ Push (₹3,000)                                                         │
│  ├─ ☑ Email (₹2,000)                                                        │
│  ├─ ☑ AdBazaar (₹5,000)                                                     │
│  └─ ☑ Karma (₹0) - Community campaign                                       │
│                                                                              │
│  STEP 6: TARGETING                                                          │
│  ├─ Users: [High Intent ▼]                                                  │
│  ├─ Dietary: [Biryani lovers]                                               │
│  └─ Max per user: [3] messages/day                                           │
│                                                                              │
│  [CREATE CAMPAIGN]                                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CONTROL SYSTEM (CRITICAL)

### 1. Spam Prevention

```
Rules:
├─ Opt-in required for all channels
├─ WhatsApp: Meta-approved templates
├─ Push: Max 3/day per user
├─ Email: Max 1/week per category
└─ Frequency cap: 5/day max across all
```

### 2. Merchant Competition

```
If multiple merchants target same user:
 │
 ▼
┌─────────────────────────────────────────┐
│           RANKING ENGINE                  │
├─────────────────────────────────────────┤
│                                          │
│  1. Highest intent match                  │
│  2. Best offer (discount %)             │
│  3. User preference history             │
│  4. Merchant rating                      │
│  5. Budget remaining                     │
│                                          │
│  Result: Show BEST ONE only              │
│                                          │
└─────────────────────────────────────────┘
```

### 3. Budget Control

```
├─ Daily cap: Configurable
├─ Per-user cap: Configurable
├─ Auto-pause at budget exhaustion
├─ Alerts at 80% budget used
└─ ROI-based auto-optimization
```

### 4. Consent Management

```
├─ Granular opt-in per channel
├─ Easy unsubscribe
├─ Preference center
├─ Consent audit trail
└─ GDPR-compliant
```

---

## REVENUE MODEL

| Stream | Description | Rate |
|--------|-------------|------|
| **Campaign Fee** | Per campaign creation | ₹500-5,000 |
| **Channel Markup** | Markup on WhatsApp/SMS | 10-20% |
| **Commission** | Per transaction | 5-15% |
| **Subscription** | Merchant tools | ₹999-9,999/month |
| **Ads Revenue** | AdBazaar placements | CPM |
| **CorpSparks** | B2B deals | 10% commission |

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)

| Task | Owner | Status |
|------|-------|--------|
| Unified Campaign Dashboard | Platform | |
| Channel Orchestrator | Backend | |
| Budget Allocator | Backend | |
| Connect rez-marketing-service | Backend | |
| Connect adsqr | Backend | |

### Phase 2: Integration (Week 3-4)

| Task | Owner | Status |
|------|-------|--------|
| Connect Karma | Backend | |
| Connect Rendez | Backend | |
| Connect Verify QR | Backend | |
| Build CorpSparks | Product | |
| Merchant Self-Service | Frontend | |

### Phase 3: Intelligence (Week 5-6)

| Task | Owner | Status |
|------|-------|--------|
| AI Channel Selector | AI Team | |
| Budget Optimizer | AI Team | |
| ROI Calculator | Analytics | |
| A/B Testing | Product | |

### Phase 4: Scale (Week 7-8)

| Task | Owner | Status |
|------|-------|--------|
| Multi-city support | Platform | |
| Category expansion | Product | |
| API for partners | Backend | |
| Mobile app | Mobile | |

---

## FILES & DOCUMENTATION

| File | Purpose |
|------|---------|
| `SOURCE-OF-TRUTH/MARKETING-SERVICES-AUDIT.md` | Current services audit |
| `SOURCE-OF-TRUTH/REZ-UNIFIED-MARKETING-PLATFORM-PLAN.md` | This master plan |

---

## NEXT STEPS

1. **Approve this plan** ✅
2. **Assign owners** to each phase
3. **Start Phase 1** - Foundation
4. **Weekly reviews** with CTO

---

**Ready to execute?** 🚀
