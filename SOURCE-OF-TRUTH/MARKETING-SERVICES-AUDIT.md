# ReZ Marketing Services - Complete Audit

**Last Updated:** 2026-05-05
**Status:** CONSOLIDATION NEEDED

---

## Overview

ReZ has **9 marketing/advertising related services** that need consolidation:

| # | Service | Purpose | Database | Status |
|---|---------|---------|----------|--------|
| 1 | `rez-ads-service` | Ad campaign management | MongoDB | Production |
| 2 | `rez-marketing-service` | Multi-channel campaigns | MongoDB | Production |
| 3 | `adsqr` | QR-based campaigns | Supabase | Production |
| 4 | `adBazaar` | QR campaigns marketplace | Supabase | Production |
| 5 | `rez-ad-platform` | Unified ad platform | Redis | New |
| 6 | `rez-ad-copilot` | AI ad assistant | - | New |
| 7 | `adsos` | DOOH screen network | - | Research |
| 8 | `rez-adbazaar` | Adbazaar service | MongoDB | Legacy |
| 9 | `adBazaar-creator` | Creator ads | - | Planned |

---

## Service Details

### 1. REZ ADS SERVICE

**Path:** `rez-ads-service/`
**Port:** 4007
**Database:** MongoDB

#### Purpose
Core ad campaign management service handling:
- Campaign CRUD operations
- Ad placements
- Click and impression tracking
- Budget management
- Intent capture for ReZ Mind

#### Key Files
| File | Purpose |
|------|---------|
| `src/models/AdCampaign.ts` | Campaign model |
| `src/models/AdInteraction.ts` | Interaction tracking |
| `src/services/attribution.ts` | Attribution engine |
| `src/services/billing.ts` | Budget tracking |
| `src/services/clickFraud.ts` | Fraud detection |
| `src/routes/*.ts` | API routes |

#### API Endpoints
| Category | Endpoints |
|----------|-----------|
| Campaigns | GET/POST/PUT/DELETE `/api/campaigns` |
| Placements | GET/POST/PUT `/api/placements` |
| Analytics | `/api/analytics/*` |
| Conversion | `/api/conversion/*` |
| Interaction | `/api/interaction/*` |

#### Integrations
- ReZ Intent Graph (intent capture)
- Redis (caching)
- MongoDB (data)

---

### 2. REZ MARKETING SERVICE

**Path:** `rez-marketing-service/`
**Port:** 4000
**Database:** MongoDB

#### Purpose
Multi-channel marketing automation handling:
- WhatsApp Business API
- SMS (Twilio/MSG91)
- Email (SMTP/SES)
- Push notifications (Firebase)
- Audience management
- Campaign scheduling (BullMQ)

#### Key Files
| File | Purpose |
|------|---------|
| `src/models/MarketingCampaign.ts` | Campaign model |
| `src/models/Voucher.ts` | Voucher management |
| `src/campaigns/CampaignOrchestrator.ts` | Campaign coordination |
| `src/audience/*.ts` | AudienceBuilder, BirthdayScheduler, InterestEngine |
| `src/routes/*.ts` | API routes |

#### API Endpoints
| Category | Endpoints |
|----------|-----------|
| Campaigns | CRUD `/api/campaigns` |
| Vouchers | CRUD `/api/vouchers` |
| Notifications | WhatsApp, SMS, Email, Push |
| Webhooks | `/api/webhooks/*` |

#### Integrations
- WhatsApp Graph API
- Twilio/MSG91
- AWS SES
- Firebase Cloud Messaging
- BullMQ (job queue)
- ReZ Intent Graph

---

### 3. ADSQR

**Path:** `adsqr/`
**Platform:** Next.js + Vercel
**Database:** Supabase (PostgreSQL)

#### Purpose
QR-based advertising campaigns:
- Quick campaign creation
- Bulk QR generation
- Attribution tracking
- Landing page templates
- Coin rewards

#### Features
| Feature | Description |
|---------|-------------|
| Campaign Management | Create, edit, pause campaigns |
| QR Generation | Single + bulk (up to 1000) |
| Attribution | Scan → Visit → Purchase |
| Landing Pages | 3 templates |
| Rewards | REZ Coins for engagement |

#### Architecture
```
User scans QR
         │
         ▼
┌─────────────────────────────────────┐
│           Supabase                  │
│  campaigns, qr_codes, scan_events   │
└─────────────────────────────────────┘
         │
         ▼
   REZ Wallet (coins credited)
```

#### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/campaigns` | Create campaign |
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns/[id]/qr` | Generate QR |
| POST | `/api/scan/[slug]` | Record scan |
| POST | `/api/visit` | Record visit |
| POST | `/api/purchase` | Record purchase |

---

### 4. ADBAZAAR

**Path:** `adBazaar/`
**Platform:** Next.js + Vercel
**Database:** Supabase (PostgreSQL)

#### Purpose
Advertising marketplace with QR-based campaign tracking.

#### Features
| Category | Features |
|----------|----------|
| Campaign | Creation, status, budget tracking |
| QR System | Single, bulk, customization, tracking |
| Attribution | Multi-step, GPS verification, cross-device |
| Rewards | Scan, visit, purchase rewards |
| Analytics | ROI metrics, performance dashboard |

#### Difference from AdsQr
| Feature | AdsQr | AdBazaar |
|---------|-------|----------|
| Platform | Simple | Advanced |
| QR Bulk | Up to 1000 | Unlimited |
| GPS Verification | No | Yes |
| DOOH | No | Planned |

---

### 5. REZ AD PLATFORM (NEW)

**Path:** `rez-ad-platform/`
**Port:** 4028
**Database:** Redis

#### Purpose
Unified ad platform consolidating all ad services:
- Campaign management
- QR generation
- Attribution tracking
- Rewards distribution

#### Features
| Feature | Description |
|---------|-------------|
| Campaign CRUD | Full campaign lifecycle |
| QR Generation | Single + bulk |
| Attribution | Scan → Visit → Purchase |
| Rewards | Automatic coin distribution |

#### This is the NEW unified service created during this session.

---

### 6. REZ AD COPILOT

**Path:** `rez-ad-copilot/`
**Purpose:** AI-powered ad assistant

#### Features
| Feature | Description |
|---------|-------------|
| Campaign Creation | Natural language to campaign |
| Targeting | AI-powered audience selection |
| Optimization | Budget and placement optimization |
| Analytics | Intelligent insights |

---

### 7. ADOS (Advertising Operating System)

**Path:** `adsos/`
**Status:** Research

#### Purpose
Intelligence layer for real-world advertising:
- Campaign optimization
- Budget allocation
- DOOH screen network

#### Components
| Component | Description |
|-----------|-------------|
| ROI Engine | Calculates Return on Ad Spend |
| Scoring Engine | Scores listings using weighted factors |
| Allocation Engine | Optimizes budget distribution |
| DOOH Screen Manager | Physical screen management |
| Delivery Engine | Ad delivery to screens |
| Playlist Generator | Content scheduling |

---

### 8. REZ ADBAZAAR (Legacy)

**Path:** `rez-adbazaar/`
**Status:** Legacy

#### Purpose
Legacy service for adbazaar functionality (MongoDB).

---

### 9. ADBAZAAR-CREATOR

**Path:** `adBazaar-creator/`
**Status:** Planned

#### Purpose
Creator-focused advertising:
- Influencer partnerships
- Content campaigns
- Affiliate tracking

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REZ MARKETING ECOSYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CAMPAIGN CREATION                                   │  │
│  │                                                                       │  │
│  │   rez-ad-copilot ──▶ rez-marketing-service ──▶ rez-ads-service     │  │
│  │   (AI Assistant)      (Multi-channel)        (Core Ads)            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CAMPAIGN DELIVERY                                  │  │
│  │                                                                       │  │
│  │   adsqr ──────────── adBazaar ─────────────── adsos                 │  │
│  │   (QR Campaigns)      (Marketplace)           (DOOH)                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    ATTRIBUTION & REWARDS                              │  │
│  │                                                                       │  │
│  │   rez-ad-platform ───▶ ReZ Intent Graph ───▶ ReZ Wallet             │  │
│  │   (Unified)          (Tracking)             (Rewards)              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Analysis

| Service | Database | Tables/Collections |
|---------|----------|-------------------|
| `rez-ads-service` | MongoDB | AdCampaign, AdInteraction |
| `rez-marketing-service` | MongoDB | MarketingCampaign, Voucher |
| `adsqr` | Supabase | campaigns, qr_codes, scan_events |
| `adBazaar` | Supabase | campaigns, qr_codes, scan_events |
| `rez-ad-platform` | Redis | In-memory |

---

## Port Allocation

| Service | Port | Status |
|---------|------|--------|
| `rez-ads-service` | 4007 | In use |
| `rez-marketing-service` | 4000 | In use |
| `rez-ad-platform` | 4028 | New |
| `rez-ad-copilot` | 4026 | New |

---

## Recommendations

### Phase 1: Consolidation

1. **Merge adsqr + adBazaar** → Use adsqr as primary (more complete)
2. **Deprecate rez-adbazaar** → Migrate to rez-ads-service
3. **Keep rez-ads-service** → Core ad management
4. **Keep rez-marketing-service** → Multi-channel campaigns

### Phase 2: Integration

1. **Connect rez-ads-service** → ReZ Intent Graph
2. **Connect rez-marketing-service** → ReZ Intent Graph
3. **Connect adsqr** → ReZ Intent Graph
4. **Connect rez-ad-platform** → ReZ Intent Graph (done)

### Phase 3: New Features

1. **Build rez-ad-copilot** → AI campaign assistant
2. **Build AdOS DOOH** → Physical screen network
3. **Build adBazaar-creator** → Influencer campaigns

---

## Feature Matrix

| Feature | rez-ads | rez-mkt | adsqr | adBazaar | ad-platform |
|---------|---------|---------|-------|-----------|-------------|
| Campaign CRUD | ✅ | ✅ | ✅ | ✅ | ✅ |
| QR Generation | ❌ | ❌ | ✅ | ✅ | ✅ |
| Multi-channel | ❌ | ✅ | ❌ | ❌ | ❌ |
| Attribution | ✅ | ❌ | ✅ | ✅ | ✅ |
| Rewards | ❌ | ✅ | ✅ | ✅ | ✅ |
| AI Copilot | ❌ | ❌ | ❌ | ❌ | Planned |
| DOOH | ❌ | ❌ | ❌ | ❌ | ❌ |
| Bulk QR | ❌ | ❌ | ✅ | ✅ | ✅ |
| GPS Verify | ❌ | ❌ | ❌ | ✅ | ❌ |

---

## Issues Found

| Issue | Service | Fix |
|-------|---------|-----|
| Duplicate campaign models | adsqr + adBazaar | Consolidate |
| No DOOH support | All | Build AdOS |
| No AI optimization | All | Build Ad Copilot |
| Fragmented attribution | All | Use rez-ad-platform |
| Legacy service | rez-adbazaar | Deprecate |

---

## Action Items

| Priority | Action | Owner |
|----------|--------|-------|
| HIGH | Consolidate adsqr + adBazaar | Platform Team |
| HIGH | Connect all to ReZ Intent Graph | Backend Team |
| MEDIUM | Deprecate rez-adbazaar | Platform Team |
| MEDIUM | Build AdOS DOOH | Product Team |
| LOW | Build Ad Copilot | AI Team |
| LOW | Build adBazaar-creator | Product Team |

---

**Documentation:**
- [REZ-ADS-SERVICE.md](rez-ads-service/README.md)
- [REZ-MARKETING-SERVICE.md](rez-marketing-service/README.md)
- [ADSQR.md](adsqr/README.md)
- [ADBAZAAR.md](adBazaar/README.md)
