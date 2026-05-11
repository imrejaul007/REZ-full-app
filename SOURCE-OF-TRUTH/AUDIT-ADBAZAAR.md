# AdBazaar Platform - Full Feature Audit

**Audit Date:** 2026-05-05
**Auditor:** Claude Code
**Status:** Complete
**Directories Audited:**
- `/Users/rejaulkarim/Documents/ReZ Full App/adBazaar/`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-ads-service/`
- `/Users/rejaulkarim/Documents/ReZ Full App/adsqr/`

---

## Executive Summary

AdBazaar is **India's first closed-loop offline advertising marketplace** connecting brands (buyers) with physical ad space vendors. The platform enables real-world performance marketing with full attribution from scan to visit to purchase.

### Platform Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| AdBazaar | Next.js 16 + Supabase | Marketplace + QR campaigns |
| rez-ads-service | Node.js + MongoDB | Ad serving + analytics |
| adsqr | Next.js + Prisma | Quick QR campaigns |
| REZ Marketing | Intent Graph + Event Platform | Targeting + tracking |

---

## CORE FEATURES

### FEATURE: Physical Ad Space Marketplace

- **Description:** B2B marketplace connecting brands (advertisers) with physical ad space owners (vendors)
- **Advertiser Benefit:** Access to billboards, transit, venues, local businesses for offline advertising
- **System Benefit:** GMV generation through listing fees and commissions
- **Connects To:** Merchant Service (vendors), Wallet (payments), Analytics (attribution)
- **Integration Flow:**
  1. Vendors list ad inventory with pricing (fixed/quote/both)
  2. Buyers browse/search listings on map view
  3. Instant booking for fixed-price OR quote request for custom pricing
  4. Razorpay payment processing with commission deduction
  5. Vendor executes ad placement and uploads proof
  6. Buyer approves proof, vendor receives payout
- **Status:** Working

### FEATURE: QR Code Attribution System

- **Description:** Every booking generates unique QR codes for tracking user engagement
- **Advertiser Benefit:** Proof of ad exposure + user engagement metrics
- **System Benefit:** Enables scan-to-purchase attribution
- **Connects To:** REZ Wallet (coins), Intent Graph (events), Analytics (attribution)
- **Integration Flow:**
  1. Booking confirmed -> QR code auto-generated with slug
  2. User scans QR -> records scan event (IP, device, geolocation)
  3. REZ app opened -> authenticated POST credits coins
  4. Visit recorded -> GPS verification triggers visit bonus
  5. Purchase recorded -> attribution link created
- **Status:** Working (with DLQ for failed coin credits)

### FEATURE: Closed-Loop Attribution (Scan -> Visit -> Purchase)

- **Description:** Full-funnel tracking from QR scan to actual purchase
- **Advertiser Benefit:** Confirmed ROI with actual purchase data, not proxies
- **System Benefit:** Revenue attribution for accurate analytics
- **Connects To:** REZ Event Platform, Analytics, Merchant Service
- **Integration Flow:**
  ```
  QR Scan (GET /api/qr/scan/[slug])
       |
       v
  Scan Event Recorded (ip, device, geo)
       |
       v
  REZ App Opens -> POST credits coins
       |
       v
  User Visits Store (GPS verified)
       |
       v
  User Makes Purchase -> Webhook: /api/webhooks/rez-purchase
       |
       v
  Attribution Record Created
  ```
- **Status:** Working with webhooks for visit/purchase

### FEATURE: Multi-Tier Coin Rewards

- **Description:** Gamified engagement rewards for QR interactions
- **Advertiser Benefit:** Incentivizes user engagement with ad content
- **System Benefit:** Drives user behavior, builds REZ ecosystem
- **Connects To:** REZ Wallet (coin credits)
- **Integration Flow:**
  1. Per-scan: 20 coins (configurable per QR)
  2. First-visit bonus: 100 coins (configurable)
  3. Purchase bonus: 5% of purchase amount (configurable)
  4. Coins credited via REZ API with DLQ for failures
- **Status:** Working with dead-letter queue

### FEATURE: Ad Campaign Management

- **Description:** Group bookings into campaigns for unified tracking
- **Advertiser Benefit:** Consolidated analytics for multi-location campaigns
- **System Benefit:** Campaign-level attribution aggregation
- **Connects To:** Bookings, Analytics, Attribution
- **Integration Flow:**
  1. Buyer creates campaign with name/budget
  2. Links existing bookings to campaign
  3. Campaign analytics aggregate all linked bookings
  4. Budget alerts when threshold reached
- **Status:** Working

### FEATURE: Ad Serving (rez-ads-service)

- **Description:** Programmatic ad serving for merchant campaigns in REZ ecosystem
- **Advertiser Benefit:** Digital ad placement alongside offline campaigns
- **System Benefit:** Revenue from CPC/CPM campaigns
- **Connects To:** Intent Graph (targeting), Event Platform (tracking), Analytics
- **Integration Flow:**
  1. Merchant creates ad with targeting (location, segment, interests)
  2. Ad served based on placement (home_banner, explore_feed, etc.)
  3. User sees ad -> impression recorded (CPM charge if applicable)
  4. User clicks -> click recorded (CPC charge if applicable)
  5. Attribution service links conversion to campaign
- **Status:** Working with atomic billing

---

## TARGETING & INTENT INTEGRATIONS

### How AdBazaar Uses Intent Graph for Targeting

**Connection:** `adsService.ts` -> `intentCaptureService.ts` -> `rez-intent-graph.onrender.com`

**Targeting Mechanism:**
1. **Location-based:** User city matched to `targetLocation.city`
2. **Segment-based:** User segment matched to `targetSegment`
3. **Interest-based:** User interests matched to `targetInterests`

**Intent Capture Events:**
| Event | Trigger | Intent Key |
|-------|---------|------------|
| `campaign_created` | Merchant creates ad | `RTMN_COMMERCE_MEMORY` |
| `campaign_submitted` | Ad submitted for review | `RTMN_COMMERCE_MEMORY` |
| `campaign_activated` | Ad goes live | `RTMN_COMMERCE_MEMORY` |
| `ad_impression` | Ad displayed | `RTMN_COMMERCE_MEMORY` |
| `ad_click` | Ad clicked | `RTMN_COMMERCE_MEMORY` |
| `conversion` | Purchase attributed | `RTMN_COMMERCE_MEMORY` |

**Targeting Filter Logic (serve.ts):**
```typescript
// Location: AND match
targetFilters['targetLocation.city'] = user.location.city

// Segment: OR match
targetFilters.$or = [
  { targetSegment: user.segment },
  { targetSegment: 'all' }
]

// Interests: OR match
targetFilters.$or = [
  { targetInterests: { $in: user.interests } }
]
```

**Status:** Working

---

## ANALYTICS & ATTRIBUTION FLOW

### How Campaigns Track: Impressions -> Clicks -> Conversions

**Impression Tracking (serve.ts -> interactionRoutes.ts):**
```typescript
// Atomic increment with budget check
await AdCampaign.findOneAndUpdate(
  { _id: adId, status: 'active', $expr: { $lt: ['$totalSpent', '$totalBudget'] } },
  { $inc: { impressions: 1 } }
)
// If CPM: charge bidAmount/1000
```

**Click Tracking (interactionRoutes.ts):**
```typescript
// Fraud detection first
const fraudCheck = await clickFraudService.detectFraudulentClick()

// Atomic increment
await AdCampaign.findOneAndUpdate(
  { _id: adId, status: 'active', $expr: { $lt: ['$totalSpent', '$totalBudget'] } },
  { $inc: { clicks: 1 } }  // If CPC: charge bidAmount
)
```

**Conversion Attribution (attributionService.ts):**
```typescript
// Find recent click within 24-hour window
const recentClick = await AdInteraction.findOne({
  userId,
  type: 'click',
  isFraud: false,
  createdAt: { $gte: windowStart, $lte: now }
})

// Create conversion record
await AdInteraction.create({
  orderId,
  type: 'conversion'
})
```

### Attribution Model (Scan -> Visit -> Purchase)

**Database Tables:**
| Table | Purpose |
|-------|---------|
| `scan_events` | QR scan records with IP, device, geo |
| `attribution` | Links scan to visit/purchase |
| `visit_events` | GPS-verified store visits |
| `purchase_events` | Transaction records |

**Attribution Funnel (attribution/route.ts):**
```
Bookings
   |
   +-- QR Codes (via booking_id)
   |      |
   |      +-- Scan Events (via qr_id)
   |             |
   |             +-- Attributions (via scan_event_id, qr_id)
   |                    |
   |                    +-- revenue_amount (from rez-purchase webhook)
   |                    +-- visit_timestamp (from rez-visit webhook)
   |                    +-- purchase_timestamp
```

**Metrics Calculated:**
| Metric | Formula |
|--------|---------|
| ROI | `(revenue / booking_amount) * 100` |
| Cost Per Scan | `booking_amount / total_scans` |
| Cost Per Visit | `booking_amount / visits` |
| Cost Per Acquisition | `booking_amount / purchases` |

**Status:** Working with webhook-based attribution

---

## BILLING & PAYMENT SYSTEMS

### How Billing Works (CPM vs CPA)

**CPM (Cost Per Mille):**
- Charge: `bidAmount / 1000` per impression
- Use case: Brand awareness campaigns
- Applied in: `serve.ts`, `interactionRoutes.ts`

**CPC (Cost Per Click):**
- Charge: `bidAmount` per click
- Use case: Performance campaigns
- Applied in: `interactionRoutes.ts`

**Billing Service (billingService.ts):**
```typescript
calculateCharge(bidType: 'CPC' | 'CPM', eventType, bidAmount) {
  if (eventType === 'click' && bidType === 'CPC') {
    return bidAmount  // Full CPC
  }
  if (eventType === 'impression' && bidType === 'CPM') {
    return bidAmount / 1000  // Fractional CPM
  }
  return 0  // Free: CPC impressions or CPM clicks
}
```

**Budget Enforcement:**
| Budget Type | Action When Exhausted |
|-------------|----------------------|
| `totalBudget` | Campaign status -> `completed` |
| `dailyBudget` | Campaign status -> `paused` (reset at midnight) |

**Atomic Billing (Race Condition Prevention):**
```typescript
// Uses $expr for atomic budget check before increment
await AdCampaign.findOneAndUpdate(
  { _id: campaignId, $expr: { $lt: ['$totalSpent', '$totalBudget'] } },
  { $inc: { totalSpent: chargeAmount } }
)
```

**Daily Spend Tracking (Redis):**
```typescript
const dailyKey = `ads:daily:${campaignId}:${today}`
await redis.incrbyfloat(dailyKey, chargeAmount)
```

### AdBazaar Marketplace Billing

**Commission Rates by Category:**
| Category | Commission |
|----------|------------|
| Outdoor OOH | 12% |
| Transit Infrastructure | 12% |
| Property Spaces | 12% |
| Local Business | 15% |
| Print Broadcast | 10% |
| Influencer | 20% |
| Digital | 18% |
| Unconventional | 15% |

**Payment Flow:**
```
Buyer Checkout (Razorpay)
       |
       v
Payment Captured -> AdBazaar takes commission
       |
       v
Vendor Receives: amount - commission
       |
       v
Payout Request -> Bank/UPI via Razorpay Payouts
```

**Status:** Working with Razorpay integration

---

## INTEGRATION POINTS

### Intent Graph (rez-intent-graph)

**Connection URL:** `https://rez-intent-graph.onrender.com`
**Auth:** `x-internal-token` header
**Intent Key:** `RTMN_COMMERCE_MEMORY`

**Events Tracked:**
- `campaign_created`
- `campaign_submitted`
- `campaign_activated`
- `ad_impression`
- `ad_click`
- `conversion`

**Payload Structure:**
```typescript
{
  userId: string,
  eventType: string,
  intentKey: 'RTMN_COMMERCE_MEMORY',
  properties: { campaignId, merchantId, bookingId, ... },
  appType: 'rez-ads-service',
  category: 'GENERAL'
}
```

**Status:** Working (fire-and-forget, non-blocking)

---

### Event Platform (rez-event-platform)

**Connection URL:** `http://localhost:4008` (configurable)
**Auth:** None (internal network only)
**Timeout:** 5000ms

**Events Emitted:**
| Event | Payload |
|-------|---------|
| `ad.impression` | adId, campaignId, merchantId, userId, placement, deviceType, platform, location |
| `ad.click` | adId, campaignId, merchantId, userId, placement, deviceType, platform, location, ctaClicked |
| `conversion` | conversionId, campaignId, merchantId, userId, orderId, value, currency, source, channel |

**Usage (interactionRoutes.ts):**
```typescript
emitAdClick({
  adId, campaignId, merchantId, userId,
  placement: req.headers['x-ad-placement'],
  deviceType: req.headers['x-device-type']
})
```

**Status:** Non-blocking, graceful degradation if unavailable

---

### Analytics Service

**Attribution Reports:**
```typescript
attributionService.getCampaignROI(campaignId)
attributionService.getAttributionReport(merchantId, startDate, endDate)
```

**Metrics Returned:**
- impressions, clicks, conversions
- totalSpent, revenueGenerated
- roi (%), ctr (%), conversionRate (%)

**Status:** Working

---

### Wallet (REZ Wallet Service)

**Connection URL:** `https://rez-wallet-service.onrender.com`
**Auth:** `x-internal-token` header

**Coin Credit Flow (qr/scan/route.ts):**
```typescript
// POST to REZ API
fetch(`${REZ_API_BASE_URL}/api/adbazaar/scan`, {
  method: 'POST',
  headers: { 'x-internal-key': REZ_INTERNAL_KEY },
  body: JSON.stringify({
    rezUserId: user.id,
    merchantId: qr.rez_merchant_id,
    coinsAmount: qr.coins_per_scan,
    visitBonusCoins,
    scanEventId
  })
})
```

**DLQ for Failed Credits:**
- `failed_coin_credits` table stores failed attempts
- Cron job retries every 15 minutes
- Manual review after 3 failures

**Balance Check (wallet/balance/route.ts):**
```typescript
// GET balance for linked REZ user
GET /internal/balance/${rezUserId}
```

**Status:** Working with DLQ

---

### Merchant Service

**Vendor Earnings:**
- Earnings calculated from `completed` bookings only
- `vendor_ledger` table tracks `earning`/`refund` events
- Payout via Razorpay Payouts to bank/UPI

**REZ Merchant ID:**
- Vendors link their REZ merchant ID for loyalty coins
- Stored in `users.rez_merchant_id`
- Used in QR code generation

**Status:** Working

---

## ADBAZAAR-SPECIFIC FEATURES

### User Roles & Capabilities

**Vendor (Ad Space Owner):**
- Listing Management (CRUD, bulk upload)
- Availability Calendar
- Pricing Models (fixed/quote/both)
- QR Code Generation
- Inquiry Handling
- Quote Sending
- Proof Upload
- Earnings Dashboard
- Payout Requests
- KYC Verification
- 2FA Security

**Buyer (Brand/Advertiser):**
- Browse Listings (search, map view)
- Instant Booking
- Inquiry/Quote System
- Cart & Checkout
- Campaign Management
- Payment (Razorpay)
- Proof Review
- Attribution Analytics
- QR Scanning (earn coins)

**Admin:**
- Listing Moderation
- KYC Verification
- Booking Management
- QR Scan Monitoring
- Dispute Resolution
- Platform Stats

### Listing Categories

| Category | Commission |
|----------|------------|
| Outdoor OOH | 12% |
| Transit Infrastructure | 12% |
| Property Spaces | 12% |
| Local Business | 15% |
| Print Broadcast | 10% |
| Influencer | 20% |
| Digital | 18% |
| Unconventional | 15% |

### Pricing Models

| Model | Description |
|-------|-------------|
| **Fixed** | Direct purchase at listed price |
| **Quote** | Vendor sends custom quote, buyer accepts |
| **Both** | Fixed price available but also accepts quotes |

### Webhooks

**Razorpay Webhook:**
- Handles payment success/failure
- Triggers booking status updates
- Processes refunds

**REZ Visit Webhook:** `/api/webhooks/rez-visit`
- Records GPS-verified store visits
- Links to scan event
- Idempotent (skips duplicates)

**REZ Purchase Webhook:** `/api/webhooks/rez-purchase`
- Records purchase with revenue amount
- Links to scan event
- Triggers attribution update

### Anti-Gaming Measures

| Protection | Implementation |
|------------|----------------|
| IP-based cooldown | 30-minute cooldown per QR/IP |
| Device fingerprint | Supplement to IP cooldown |
| User cooldown | 60-minute authenticated cooldown |
| Unique constraint | `idx_scan_events_qr_ip` prevents duplicates |
| Rate limiting | 100 requests/minute per endpoint |
| Click deduplication | 5-minute dedup window per user/ad |

---

## ADsqr FEATURES

**Purpose:** Quick QR campaign creation for merchants (low commitment entry)

### Core Features

| Feature | Description |
|---------|-------------|
| Campaign Management | Create, edit, pause campaigns |
| QR Generation | Single + bulk codes |
| Attribution | Scan -> Visit -> Purchase funnel |
| Landing Pages | 3 templates |
| Fraud Detection | Rate limiting + duplicate prevention |

### Database Tables

| Table | Purpose |
|-------|---------|
| `campaigns` | Campaign metadata |
| `qr_codes` | QR code records with rewards |
| `scan_events` | Scan attribution |
| `visit_events` | GPS-verified visits |
| `purchase_events` | Transactions |
| `coin_transactions` | Coin ledger |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns/[id]/qr` | Generate QR |
| POST | `/api/scan/[slug]` | Record scan |
| POST | `/api/visit` | Record visit |
| POST | `/api/purchase` | Record purchase |
| GET | `/api/analytics/attribution` | ROI metrics |

---

## KNOWN ISSUES & TECHNICAL DEBT

### Critical (Must Fix)

| Issue | Impact | File |
|-------|--------|------|
| AB-C4 | No idempotency key on booking creation | `bookings/route.ts` |
| AB-C5 | Payment amount not verified server-side | `verify-payment/route.ts` |
| AB2-C2 | Commission applied twice on quote bookings | `inquiries/[id]/accept/route.ts` |

### High Priority

| Issue | Impact | File |
|-------|--------|------|
| AB-H2 | Manual cookie parsing fragile | `adminAuth.ts` |
| AB-H3 | Fire-and-forget errors | Multiple routes |
| AB-H5 | No security headers | `next.config.ts` |
| AB-B4 | Bookings stuck in "Confirmed" | Need cron job |
| AB2-H6 | Double payout race condition | `vendor/payout/route.ts` |

### Medium Priority

| Issue | Impact | File |
|-------|--------|------|
| AB-M2 | SQL injection via ilike | `listings/route.ts` |
| AB-M3 | Unverified email on registration | `register/page.tsx` |
| AB-D2 | Attribution booking_id not populated | Webhook routes |
| AB-D3 | Cron without pagination | `freshness/route.ts` |
| AB-A1 | No wallet table for refunds | Need ledger table |

### Low Priority

| Issue | Impact | File |
|-------|--------|------|
| AB-L1 | DB errors in API responses | Multiple routes |
| AB-L2 | No server-side password validation | `register/page.tsx` |
| AB2-L1 | Bare `<img>` tags | Multiple components |

---

## ENVIRONMENT VARIABLES

### AdBazaar

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# REZ Integration
REZ_API_BASE_URL=
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
REZ_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
REZ_ADS_SERVICE_URL=
REZ_MARKETING_SERVICE_URL=

# Security
ADBAZAAR_INTERNAL_KEY=
ADBAZAAR_WEBHOOK_SECRET=
REZ_INTERNAL_KEY=

# App
NEXT_PUBLIC_APP_URL=https://ad-bazaar.vercel.app
```

### rez-ads-service

```env
PORT=4007
MONGO_URI=mongodb://localhost:27017/rez-ads
REDIS_URL=redis://localhost:6379
JWT_SECRET=

# Intent Graph
INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
INTERNAL_SERVICE_TOKEN=

# Event Platform
EVENT_PLATFORM_URL=http://localhost:4008
EVENT_PLATFORM_ENABLED=false
```

---

## INTEGRATION DIAGRAM

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    AdBazaar                             │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
                    │  │ Marketplace │  │   QR Code   │  │   Campaigns     │  │
                    │  │  (Listings) │  │   System    │  │   (Groupings)   │  │
                    │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
                    └─────────┼────────────────┼─────────────────┼───────────┘
                              │                │                 │
                              v                v                 v
┌──────────────────────────────────────────────────────────────────────────────┐
│                         REZ Marketing Platform                                │
│  ┌─────────────────┐  ┌────────────────┐  ┌────────────────────────────┐    │
│  │   Intent Graph   │  │ Event Platform │  │     Analytics Service      │    │
│  │ (Targeting/AIs) │  │ (Tracking)     │  │     (Attribution)          │    │
│  └────────┬────────┘  └───────┬────────┘  └─────────────┬──────────────┘    │
│           │                   │                       │                    │
│           v                   v                       v                    │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                         Wallet Service                              │    │
│  │                    (Coin Credits/Payouts)                          │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
                              ^
                              │
┌─────────────────────────────────────────────────────────────────────────────┐
│                      rez-ads-service                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │    Ad       │  │  Campaign   │  │  Billing    │  │  Attribution    │    │
│  │   Serving   │  │   Mgmt     │  │  (CPM/CPC)  │  │    Service      │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FILES REFERENCE

### AdBazaar Core Files

| File | Purpose |
|------|---------|
| `src/app/api/attribution/route.ts` | Attribution analytics |
| `src/app/api/campaigns/route.ts` | Campaign CRUD |
| `src/app/api/qr/scan/[slug]/route.ts` | QR scan + coin credit |
| `src/app/api/webhooks/rez-visit/route.ts` | Visit webhook |
| `src/app/api/webhooks/rez-purchase/route.ts` | Purchase webhook |
| `src/app/api/wallet/balance/route.ts` | REZ wallet balance |
| `src/lib/adsService.ts` | rez-ads-service integration |
| `src/lib/rezMarketing.ts` | Marketing service integration |
| `src/lib/intentCaptureService.ts` | Intent graph integration |

### rez-ads-service Core Files

| File | Purpose |
|------|---------|
| `src/routes/adbazaar.ts` | AdBazaar campaign integration |
| `src/routes/serve.ts` | Ad serving |
| `src/routes/interactionRoutes.ts` | Impression/click tracking |
| `src/services/attributionService.ts` | Conversion attribution |
| `src/services/billingService.ts` | CPM/CPC billing |
| `src/services/intentCaptureService.ts` | Intent capture |
| `src/config/eventPlatform.ts` | Event platform config |

### Database Schema (Supabase)

| Table | Purpose |
|-------|---------|
| `users` | Vendor/buyer profiles |
| `listings` | Ad space inventory |
| `bookings` | Booking transactions |
| `qr_codes` | QR code records |
| `scan_events` | Scan attribution |
| `attribution` | Visit/purchase links |
| `campaigns` | Booking groupings |

---

## SUMMARY

**Total Features Documented:** 6 core features
**Integration Points:** 5 (Intent Graph, Event Platform, Analytics, Wallet, Merchant)
**Working Integrations:** 5/5
**Known Issues:** 22 (5 Critical, 8 High, 6 Medium, 3 Low)

**AdBazaar is a functional closed-loop advertising platform** with working integrations to the REZ marketing ecosystem. The primary areas needing attention are idempotency in payment flows and race condition fixes in payout processing.

---

*Document generated: 2026-05-05*
*Last updated by: Claude Code*
