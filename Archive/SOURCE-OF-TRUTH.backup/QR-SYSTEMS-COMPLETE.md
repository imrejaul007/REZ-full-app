# QR SYSTEMS - COMPLETE DOCUMENTATION

**Last Updated:** 2026-05-05

---

## OVERVIEW

REZ has **6 QR systems** forming a complete distribution + attribution + transaction engine:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REZ 6 QR ECOSYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      DISTRIBUTION LAYER                                │  │
│  │   Store QR ────── Ads QR ────── Creator QR                        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      ATTRIBUTION LAYER                                │  │
│  │              ReZ Intent Graph ─── ReZ Mind                          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      TRANSACTION LAYER                                │  │
│  │   Menu QR ────── Room QR ────── Verify QR                          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## THE 6 QR SYSTEMS

| # | System | URL | Use Case | Drives |
|---|--------|-----|----------|--------|
| 1 | **Menu QR** | `menu.rez.money/{slug}` | Ordering | Transactions |
| 2 | **Store QR** | `now.rez.money/{slug}` | Discovery | Repeat visits |
| 3 | **Room QR** | `room.rez.money/{hotelId}/{roomId}` | Hotel services | Upsells |
| 4 | **Ads QR** | `adsqr.rez.money/c/{campaignId}` | Marketing | Attribution |
| 5 | **Verify QR** | `verify.rez.money/s/{serial}` | Authentication | Trust |
| 6 | **Creator QR** | `creator.rez.money/{creatorId}` | Social commerce | Viral growth |

---

## 1. MENU QR SYSTEM

**Purpose:** Restaurant ordering - dine-in and takeaway

### URL Format
```
menu.rez.money/{slug}
```

### Features

| Feature | Description |
|---------|-------------|
| **Menu Display** | Categories, items, prices |
| **Cart Management** | Add, modify, remove items |
| **Order Processing** | Send to kitchen display |
| **Dietary Filters** | Vegetarian, vegan, allergen |
| **Payment** | Wallet, UPI, card |
| **Split Bill** | Divide among guests |
| **Tip Option** | Add tip to order |
| **Waiter Call** | Request assistance |
| **Checkout** | Guest checkout with charges |
| **Charge Management** | Add items to room bill |
| **Feedback** | Post-stay surveys |
| **Minibar Orders** | Order from room minibar |
| **Restaurant Reservations** | Book restaurant table |
| **Transport Requests** | Book cabs, airport transfer |

### User Flow

```
Guest arrives at hotel
        │
        ▼
┌─────────────────┐
│ Scan Room QR     │
│ (On door/card)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Authenticate     │
│ (Room token)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Service Menu     │
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
│Notif  │ │Ledger│
└───────┘ └───┬───┘
              │
              ▼
         ┌───────┐
         │Checkout│
         └───────┘
```

### Services Used
- `rez-stayown-service` - Room management
- `rez-payment-service` - Charges
- `rez-notification-events` - Staff alerts

---

## 2. MENU QR SYSTEM

**Purpose:** Digital menu and ordering in restaurants

### QR Format
```
rez://menu/{merchantId}?table={tableId}
```

### Features

| Feature | Description |
|---------|-------------|
| **Menu Display** | Categories, items, prices |
| **Cart Management** | Add, modify, remove items |
| **Order Processing** | Send to kitchen display |
| **Dietary Filters** | Vegetarian, vegan, allergen |
| **Payment** | Wallet, UPI, card |
| **Split Bill** | Divide among guests |
| **Tip Option** | Add tip to order |
| **Waiter Call** | Request assistance |

### User Flow

```
Customer sits at table
        │
        ▼
┌─────────────────┐
│ Scan Menu QR     │
│ (On table)     │
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

### Services Used
- `rez-catalog-service` - Product data
- `rez-order-service` - Order processing
- `rez-payment-service` - Payment
- `rez-wallet-service` - ReZ Coins

---

## 3. ADS QR SYSTEM

**Purpose:** Advertising campaigns with QR codes and attribution tracking

### QR Format
```
rez://ad/{campaignId}?source=qr
```

### Features

| Feature | Description |
|---------|-------------|
| **Campaign Management** | Create, edit, pause campaigns |
| **Bulk QR Generation** | Multiple codes per campaign |
| **Attribution Tracking** | Scan → Visit → Purchase |
| **Reward System** | Coins for engagement |
| **Landing Pages** | 3 templates (Product, Lead, Consultation) |
| **Analytics Dashboard** | ROI metrics |
| **A/B Testing** | Test different creatives |

### User Flow

```
User sees ad with QR
        │
        ▼
┌─────────────────┐
│ Scan Ad QR       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Record Scan     │
│ Attribution    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Landing Page    │
│ (Template)     │
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
│ Credit Rewards   │
│ Track ROI       │
└─────────────────┘
```

### Campaign Templates

| Template | Use Case | Goal |
|----------|----------|------|
| **Product** | Physical product ads | Direct sale |
| **Lead Gen** | Contact forms | Signup |
| **Consultation** | Booking calls | Appointment |

### Attribution Weights

| Event | Weight | Description |
|-------|--------|-------------|
| `campaign_scanned` | 0.30 | QR scan |
| `offer_viewed` | 0.25 | Landing page viewed |
| `sample_requested` | 0.45 | Free sample claimed |
| `consultation_booked` | 0.55 | Appointment booked |
| `purchase_attributed` | 0.85 | Sale completed |
| `lead_captured` | 0.50 | Form submitted |

### Services Used
- `adsqr` - Campaign management
- `adBazaar` - Marketplace
- `rez-wallet-service` - Rewards
- `rez-intent-graph` - Attribution

---

## 4. STORE QR SYSTEM

**Purpose:** Merchant discovery - anywhere the merchant wants to be found

### URL Format
```
now.rez.money/{slug}
```

### Features

| Feature | Description |
|---------|-------------|
| **Merchant Profile** | Contact info, hours, address |
| **Offers & Deals** | Current promotions |
| **Reviews & Ratings** | Customer feedback |
| **Directions** | Map integration |
| **Social Links** | Instagram, Facebook, etc. |
| **Store Bio** | Merchant story |
| **Gallery** | Photos and videos |
| **Services Catalog** | List of services |
| **Appointment Booking** | Book service slots |
| **Custom Links** | 10 configurable links |

### User Flow

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

### Attribution Weights

| Event | Weight |
|-------|--------|
| Profile view | 0.20 |
| Offer viewed | 0.30 |
| Direction clicked | 0.35 |
| First visit | 0.50 |
| Repeat visit | 0.60 |

---

## 5. VERIFY QR SYSTEM

**Purpose:** Product authentication - trust and brand protection

### URL Format
```
verify.rez.money/s/{serial}
```

### Features

| Feature | Description |
|---------|-------------|
| **Serial Validation** | Cryptographic verification |
| **Supply Chain Tracking** | End-to-end journey |
| **Brand Storytelling** | Product origin, journey |
| **Hologram Matching** | Multi-layer verification |
| **NFC Support** | NFC chip reading |
| **Report Counterfeit** | Consumer reports |
| **Recall Alerts** | Real-time notifications |
| **Batch Verification** | Multi-item scanning |
| **Offline Verification** | Works without internet |

### User Flow

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

### Attribution Weights

| Event | Weight |
|-------|--------|
| Verification completed | 0.25 |
| Story viewed | 0.15 |
| Supply chain viewed | 0.20 |
| Report submitted | 0.30 |
| Brand followed | 0.40 |

---

## 6. CREATOR QR SYSTEM

**Purpose:** Social commerce - influencer marketing and viral growth

### URL Format
```
creator.rez.money/{creatorId}
```

### Features

| Feature | Description |
|---------|-------------|
| **Creator Profile** | Bio, photo, stats |
| **Product Recommendations** | Curated picks |
| **Affiliate Tracking** | Commission attribution |
| **Content Gallery** | Posts, videos |
| **Social Proof** | Followers, engagement |
| **Commission System** | Per-sale earnings |
| **Creator Dashboard** | Analytics, earnings |
| **Exclusive Content** | Members-only |
| **Live Integration** | Shoppable streams |

### User Flow

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
│ Products         │
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

### Attribution Weights

| Event | Weight |
|-------|--------|
| Profile viewed | 0.20 |
| Product viewed | 0.30 |
| Affiliate link clicked | 0.50 |
| Purchase via affiliate | 0.70 |
| Content shared | 0.35 |
| Creator followed | 0.40 |

---

## SHARED QR INFRASTRUCTURE

### QR Data Structure

```typescript
interface QRCode {
  id: string;
  type: 'menu' | 'store' | 'room' | 'ad' | 'verify' | 'creator';
  entityId: string;
  metadata: {
    merchantId?: string;
    storeId?: string;
    campaignId?: string;
    tableId?: string;
    roomId?: string;
    serial?: string;
    creatorId?: string;
  };
  token: string; // Encrypted/hashed
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}
```

### QR URL Scheme

```
{type}.rez.money/{slug}
```

### URL Patterns

| Type | Pattern | Example |
|------|---------|---------|
| Menu | `menu.rez.money/{slug}` | `menu.rez.money/pizza-hut-mall` |
| Store | `now.rez.money/{slug}` | `now.rez.money/kfc-india` |
| Room | `room.rez.money/{hotelId}/{roomId}` | `room.rez.money/hotel123/room456` |
| Ad | `adsqr.rez.money/c/{campaignId}` | `adsqr.rez.money/c/camp123` |
| Verify | `verify.rez.money/s/{serial}` | `verify.rez.money/s/ABC123XYZ` |
| Creator | `creator.rez.money/{creatorId}` | `creator.rez.money/chef_vikas` |

---

## TECHNICAL ARCHITECTURE

### Services Involved

```
┌─────────────────────────────────────────────────────────────────┐
│                      QR PROCESSING LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  QR Generator   │  │   QR Parser     │  │  QR Validator   │  │
│  │  (Merchant App) │  │  (ReZ Now)      │  │  (All Apps)     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│                                ▼                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    QR ROUTER                            │  │
│  │  (Determines type, validates, redirects)                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                │                                │
└────────────────────────────────┼────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│  Menu QR     │      │  Store QR     │      │  Room QR      │
│  Service     │      │  Service      │      │  Service      │
│  (catalog)  │      │  (now)        │      │  (stayown)    │
└───────────────┘      └───────────────┘      └───────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                ▼
        ┌─────────────────────────────────────────────────┐
        │              Ads QR + Verify QR + Creator QR     │
        │              (adsqr, verify, creator)           │
        └─────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Endpoint | QR Type | Purpose |
|--------|-----------|---------|---------|
| POST | `/api/qr/generate` | All | Generate QR |
| GET | `/api/qr/{id}` | All | Get QR details |
| POST | `/api/qr/scan` | All | Record scan |
| GET | `/api/qr/analytics` | All | QR analytics |
| POST | `/api/qr/bulk` | Ads | Bulk generate |

### Database Schema

```typescript
// QR Codes Table
interface QRCodeRecord {
  id: string;
  type: 'menu' | 'store' | 'room' | 'ad' | 'verify' | 'creator';
  entityId: string;
  merchantId?: string;
  storeId?: string;
  campaignId?: string;
  serial?: string;
  creatorId?: string;
  createdBy: string;
  createdAt: Date;
  scanCount: number;
  lastScanAt?: Date;
  isActive: boolean;
}

// Scan Events Table
interface ScanEvent {
  id: string;
  qrId: string;
  qrType: string;
  userId?: string;
  deviceInfo: {
    os: string;
    appVersion: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  metadata: Record<string, any>;
}
```

---

## INTEGRATION WITH REZ MIND

### Intent Tracking

All QR scans trigger intent signals:

```typescript
// Menu QR scan
{ type: 'restaurant_intent', merchantId, tableId }

// Store QR scan
{ type: 'merchant_discovery', merchantId, slug }

// Room QR scan
{ type: 'room_service_request', roomId, merchantId }

// Ad QR scan
{ type: 'campaign_scanned', campaignId, source: 'qr' }

// Verify QR scan
{ type: 'product_verified', serial, brandId }

// Creator QR scan
{ type: 'creator_viewed', creatorId }
```

### Attribution Flow

```
QR Scan
   │
   ▼
ReZ Intent Graph
   │
   ├─▶ Track: scan_count++
   │
   ├─▶ Assign: attribution_weights
   │
   ├─▶ Calculate: conversion_probability
   │
   └─▶ Trigger: nudge_if_dormant
```

---

## FILES REFERENCE

### Core QR Services

| File | Service | Purpose |
|------|---------|---------|
| `rez-stayown-service/src/room-qr.ts` | Room | Room QR logic |
| `rez-catalog-service/src/routes/qrMenu.ts` | Menu | Menu QR routes |
| `adsqr/src/app/api/campaigns/` | Ads | Campaign QR API |
| `rez-now/` | Store | Store QR generation |
| `verify-service/` | Verify | Product verification |
| `creator-service/` | Creator | Creator profiles |

### Documentation

| File | Description |
|------|-------------|
| `SOURCE-OF-TRUTH/SIX-QR-ECOSYSTEM.md` | 6 QR systems complete guide |
| `docs/QR-SYSTEMS-COMPLETE-GUIDE.md` | Complete guide |
| `docs/ROOM-QR-BACKEND-API.md` | Room QR API |
| `docs/MENU-QR-BACKEND-API.md` | Menu QR API |
| `docs/ADS-QR-BACKEND-API.md` | Ads QR API |
| `docs/REZ-VERIFY-RESEARCH.md` | Verify QR research |
| `adsqr/README.md` | AdsQR setup |

---

## SECURITY

### Token Validation

```typescript
// All QR tokens are encrypted/hashed
const validateQRToken = (token: string, type: string): boolean => {
  const decoded = decrypt(token);
  const { type: tokenType, entityId, exp } = decoded;
  
  // Verify type matches
  if (tokenType !== type) return false;
  
  // Check expiration
  if (exp < Date.now()) return false;
  
  return true;
};
```

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| QR Scan | 100 | per minute |
| QR Generate | 10 | per minute |
| Bulk Generate | 1 | per minute |

---

## MONITORING

### Metrics Tracked

| Metric | Description |
|---------|-------------|
| `qr_scan_total` | Total scans |
| `qr_scan_by_type` | Scans by QR type |
| `qr_scan_by_merchant` | Scans by merchant |
| `qr_conversion_rate` | Scans → Actions |
| `qr_avg_response_time` | Load time |

### Analytics Dashboard

```
┌─────────────────────────────────────────────────────────┐
│                    QR ANALYTICS                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  TODAY              │  THIS WEEK       │  THIS MONTH   │
│  ───────────────    │  ──────────────  │  ─────────── │
│  Scans: 1,234       │  Scans: 8,901    │  Scans: 34K  │
│  Revenue: ₹45,678   │  Revenue: ₹3.2L  │  Revenue: ₹12L│
│                                                         │
│  ┌─────────────────────────────────────────────┐    │
│  │           SCANS BY TYPE (Pie Chart)            │    │
│  │                                               │    │
│  │    Menu QR   ████████████████████ 30%         │    │
│  │    Store QR  ████████████ 25%               │    │
│  │    Room QR   ███████████ 20%                │    │
│  │    Ads QR    ██████ 15%                     │    │
│  │    Verify QR ███ 7%                         │    │
│  │    Creator QR ██ 3%                         │    │
│  └─────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────┐    │
│  │         CONVERSION FUNNEL                     │    │
│  │                                               │    │
│  │  Scan ──▶ View ──▶ Cart ──▶ Order ──▶ Pay   │    │
│  │  100%    65%     40%     25%     15%        │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## STATUS

| QR System | URL | Status |
|-----------|-----|--------|
| Menu QR | `menu.rez.money/{slug}` | ✅ Production |
| Store QR | `now.rez.money/{slug}` | ✅ Production |
| Room QR | `room.rez.money/{hotelId}/{roomId}` | ✅ Production |
| Ads QR | `adsqr.rez.money/c/{campaignId}` | ✅ Production |
| Verify QR | `verify.rez.money/s/{serial}` | 📋 Planned |
| Creator QR | `creator.rez.money/{creatorId}` | 📋 Planned |

---

**Last Updated:** 2026-05-05
