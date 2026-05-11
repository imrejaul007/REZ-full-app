# REZ ADVERTISING SYSTEM - COMPLETE

**Date:** May 5, 2026
**Version:** 2.0

---

## SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ ADVERTISING ECOSYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         UCE (Unified Campaign Engine)                     │  │
│  │                         rez-uce                                         │  │
│  │                                                                       │  │
│  │   Campaign Management → Budget Allocation → Channel Orchestration       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    RDE (Decision Engine)                               │  │
│  │                    rez-decision-service                                │  │
│  │                                                                       │  │
│  │   WHO? ─── HOW MUCH? ─── WHEN? ─── WHICH CHANNEL?                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         CHANNELS                                        │  │
│  │                                                                       │  │
│  │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │  │
│  │   │ adBazaar │ │  adsqr    │ │   DOOH   │ │ Marketing │   │  │
│  │   │(Marketplace)│ │ (QR Ads) │ │ (Screens) │ │ (Multi-ch)│   │  │
│  │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SERVICES

| Service | Purpose | Type |
|---------|---------|------|
| **adBazaar** | Marketplace for ad placements | Frontend |
| **adsqr** | QR codes for all ads + customer scanning | Frontend |
| **rez-uce** | Unified Campaign Engine | Backend |
| **rez-decision-service** | Decision Engine (18 engines) | Backend |
| **rez-ad-campaigns** | Campaign management | Backend |
| **rez-marketing** | Multi-channel (WhatsApp/SMS/Push) | Backend |
| **rez-ad-ai** | AI campaign assistant | Backend |
| **rez-dooh** | Digital Out of Home screens | Backend |

---

## adBazaar (MARKETPLACE)

**Keep as:** `adBazaar`
**Purpose:** Marketplace where merchants buy ad placements

```
Features:
├── Ad placement marketplace
├── Offline placements (autos, hoardings, kiosks)
├── QR code campaigns
├── GPS verification
├── Campaign analytics
└── Multi-merchant campaigns
```

---

## adsqr (QR ADS PLATFORM)

**Keep as:** `adsqr`
**Purpose:** QR code platform for ALL ads - customers scan, try products, get branded coins

```
Core Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│ CUSTOMER SCANS QR │
│ │
│ ▼ │
│ adsqr recognizes campaign │
│ │
│ ▼ │
│ CUSTOMER GETS: │
│ ├── Free product/service trial │
│ ├── Branded coins from merchant │
│ └── Attribution tracked │
│ │
│ ▼ │
│ MERCHANT GETS: │
│ ├── Customer insights │
│ ├── Conversion tracking │
│ └── Campaign analytics │
└─────────────────────────────────────────────────────────────────────────────┘
```

```
Features:
├── QR code generation (all ad types)
├── Customer scanning → try product/service
├── Branded coin rewards
├── REZ TRY integration
├── Campaign insights & analytics
├── Attribution tracking
└── Redemption flow
```

---

## rez-uce (Unified Campaign Engine)

**Purpose:** Central hub for all campaign management

```
Features:
├── Campaign creation & management
├── Budget allocation
├── Channel orchestration
├── Attribution tracking
└── Cross-channel analytics
```

---

## rez-decision-service (Decision Engine)

**Purpose:** The brain - decides WHO, HOW MUCH, WHEN, WHICH CHANNEL

**18 Engines:**
| Engine | Purpose |
|--------|---------|
| Sampling Decision | Base decision logic |
| Smart Coin Allocation | Dynamic coin calculation |
| Dynamic QR Pricing | Uber-style surge pricing |
| Campaign Optimizer | A/B testing, ROI |
| Auto-Campaign | AI suggestions |
| Budget Allocator | Real-time budget distribution |
| Attribution Tracker | Multi-touch funnel |
| Cross-Brand Coins | Multi-merchant redemption |
| Coin Marketplace | Buy/sell coins |
| Coin Bundles | Package deals |
| Auto Distribution | Smart coin allocation |
| DOOH Attribution | Screen → QR → Purchase |
| DOOH Analytics | Screen metrics |
| Screen Network | Screen inventory |
| Real-time Bidding | CPM/slot auctions |
| DOOH QR | Dynamic QR on screens |

---

## rez-ad-campaigns

**Purpose:** Core ad campaign management

```
Features:
├── Campaign CRUD
├── Ad placements
├── Click tracking
├── Budget management
├── Fraud detection
└── Intent capture
```

---

## rez-marketing

**Purpose:** Multi-channel marketing automation

```
Features:
├── WhatsApp Business API
├── SMS (Twilio/MSG91)
├── Email (SES/SMTP)
├── Push notifications (FCM)
├── Audience management
└── Campaign scheduling
```

---

## rez-ad-ai

**Purpose:** AI-powered campaign assistant

```
Features:
├── Natural language → campaign
├── AI targeting suggestions
├── Auto-optimization
└── Campaign insights
```

---

## rez-dooh

**Purpose:** Digital Out of Home screen network

```
Features:
├── 23 screen types
├── Screen management
├── Playlist generation
├── Real-time bidding
└── DOOH attribution
```

---

## DATA FLOW

```
MERCHANT creates campaign
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      rez-uce                                            │
│              Campaign management + orchestration                          │
└─────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  rez-decision-service                                  │
│                                                                       │
│   WHO? ─── HOW MUCH? ─── WHEN? ─── WHICH CHANNEL?                    │
└─────────────────────────────────────────────────────────────────────┘
        │
        ├──── WhatsApp ─── rez-marketing
        ├──── Push ──────── rez-marketing
        ├──── Email ─────── rez-marketing
        ├──── QR ────────── adsqr
        ├──── Offline ──── adBazaar
        ├──── DOOH ─────── rez-dooh
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    adsqr (Customer Flow)                               │
│                                                                       │
│   Customer scans QR ─── Tries product/service ─── Gets branded coins │
│                                                                       │
│   Insights: Scan → Visit → Redeem → Purchase                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CONNECTIONS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CUSTOMER JOURNEY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Customer sees ad                                                   │
│         │                                                             │
│         ▼                                                             │
│  Scans QR (adsqr)                                                  │
│         │                                                             │
│         ▼                                                             │
│  Tries product/service                                              │
│         │                                                             │
│         ▼                                                             │
│  Gets branded coins                                                 │
│         │                                                             │
│         ▼                                                             │
│  Attributed to campaign (adBazaar/adsqr)                          │
│         │                                                             │
│         ▼                                                             │
│  Merchant sees insights                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## NAMING

| Service | Name | Why |
|---------|------|-----|
| `adBazaar` | **adBazaar** | Marketplace for ad placements |
| `adsqr` | **adsqr** | QR codes for all ads + customer scanning + try + branded coins |

---

## FILES

| File | Purpose |
|------|---------|
| `SOURCE-OF-TRUTH/REZ-AD-SYSTEM.md` | This document |
| `SOURCE-OF-TRUTH/AD-SERVICES-NAMING-PLAN.md` | Naming plan |

---

## STATUS

| Component | Status |
|-----------|--------|
| adBazaar | |
| adsqr | |
| rez-uce | |
| rez-decision-service | |
| rez-ad-campaigns | |
| rez-marketing | |
| rez-ad-ai | |
| rez-dooh | |

---

**Last Updated:** May 5, 2026
