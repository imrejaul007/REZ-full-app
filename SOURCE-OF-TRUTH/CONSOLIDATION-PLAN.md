# REZ MARKETING PLATFORM - CONSOLIDATION & UPGRADE PLAN

**Based on:** Brutal audit & upgrade strategy
**Date:** May 5, 2026
**Status:** CONSOLIDATION PHASE

---

## THE BRUTAL TRUTH

```
CURRENT STATE:
9 systems + 3 databases + overlapping features = FRAGMENTATION

TARGET STATE:
1 system + 1 database + unified intelligence = SCALE
```

---

## THE ONE-LINE STRATEGY

> **Consolidate everything into a single AI-driven campaign engine powered by ReZ Mind.**

---

## PHASE 1: CONSOLIDATION (IMMEDIATE)

### Kill / Merge Matrix

| Current System | Action | Replace With |
|---------------|--------|--------------|
| `adsqr` | **MERGE** | Unified Campaign Engine |
| `adBazaar` | **MERGE** | Unified Campaign Engine |
| `rez-adbazaar` | **DELETE** | Unified Campaign Engine |
| `rez-ads-service` | **MERGE** | Campaign Setup Module |
| `rez-ad-platform` | **KEEP** | Core (rename to UCE) |
| `rez-ad-copilot` | **MERGE** | AI Copilot Module |
| `ados` | **MERGE** | DOOH Module |

### What Gets Deleted

```
DELETE:
├── rez-adbazaar/           (legacy, duplicate)
├── adBazaar/              (merge into adsqr)
└── adsqr/                 (merge into UCE)
    └── Keep: Supabase schema
    └── Keep: Frontend components
```

### What Gets Built

```
KEEP & MERGE:
├── rez-ads-service/       → Campaign Setup
├── rez-ad-platform/         → Core UCE
├── rez-ad-copilot/         → AI Copilot
└── adsqr (frontend)       → Dashboard UI
```

---

## NEW UNIFIED CAMPAIGN ENGINE (UCE)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UNIFIED CAMPAIGN ENGINE (UCE)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                        MERCHANT LAYER                                 │  │
│  │                                                                       │  │
│  │   Campaign Creator ──▶ Budget Manager ──▶ Analytics Dashboard      │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    REZ MIND INTEGRATION                               │  │
│  │                                                                       │  │
│  │   Intent Capture ──▶ Audience Engine ──▶ Channel Selector            │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CHANNEL EXECUTION LAYER                            │  │
│  │                                                                       │  │
│  │   WhatsApp ─── Push ─── Email ─── Ads ─── Karma ─── Rendez ─── QR │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    ATTRIBUTION LAYER                                  │  │
│  │                                                                       │  │
│  │   Unified Tracking ───▶ ROI Calculation ───▶ Optimization          │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## MODULES

### 1. Campaign Setup Module

```
Purpose: Create & manage campaigns

Features:
├── Campaign CRUD
├── Offer Builder
├── Budget Allocation
├── Channel Selection
├── Targeting Rules
└── Schedule/Cadence
```

### 2. Audience Engine (via ReZ Mind)

```
Purpose: Find right users

Features:
├── Intent Matching
├── Location Targeting
├── Behavior Segmentation
├── LTV Scoring
├── Dormancy Detection
└── Frequency Control
```

### 3. Channel Selector

```
Purpose: Choose best channels

Decision Matrix:
├── HIGH intent → WhatsApp (direct)
├── MID intent → Push (app)
├── LOW intent → Email (nurture)
├── AWARENESS → AdBazaar (QR/Display)
├── ENGAGEMENT → Karma (rewards)
├── VIRAL → Rendez (referral)
└── TRUST → Verify QR (authentic)
```

### 4. Attribution Engine

```
Purpose: Track & credit

Unified Attribution:
├── Ad View
├── QR Scan
├── Click
├── Visit
├── Add to Cart
├── Purchase
└── Repeat

Attribution Models:
├── First Touch
├── Last Touch
└── Multi-Touch (weighted)
```

### 5. Budget Allocator (AI)

```
Purpose: Optimize spend

Features:
├── Auto-split across channels
├── Real-time reallocation
├── Performance-based
├── Daily/hourly caps
└── Pause on exhaustion
```

### 6. AI Copilot

```
Purpose: Natural language → Campaign

Examples:
├── "Sell biryani in BTM for ₹20k"
├── "Run weekend hotel special"
└── "Launch cosmetic sampling campaign"

Output:
├── Campaign created
├── Audience selected
├── Budget split
└── Ready to launch
```

### 7. DOOH Module (AdOS)

```
Purpose: Offline ad network

Features:
├── Screen inventory
├── QR integration
├── GPS verification
├── Real-time bidding
└── Playlist generation
```

### 8. Control System

```
Purpose: Prevent spam & abuse

Rules:
├── Message limits (per user/day)
│   ├── WhatsApp: 3/day
│   ├── Push: 5/day
│   └── Email: 1/week
├── Fatigue control
│   └── No message if responded in 24h
├── Merchant ranking
│   └── Best offer wins
├── Budget guards
│   └── Daily caps
└── Consent enforcement
```

---

## DATABASE CONSOLIDATION

### Before (Fragmented)

```
adsqr         → Supabase (PostgreSQL)
adBazaar      → Supabase (PostgreSQL)
rez-ads       → MongoDB
rez-marketing → MongoDB
rez-intent    → MongoDB
```

### After (Unified)

```
┌─────────────────────────────────────────────┐
│            UNIFIED DATA LAYER                  │
├─────────────────────────────────────────────┤
│                                              │
│  MongoDB (Primary)                          │
│  ├── campaigns                               │
│  ├── audiences                               │
│  ├── attributions                            │
│  ├── budgets                                │
│  └── analytics                              │
│                                              │
│  Redis (Cache/Real-time)                    │
│  ├── sessions                               │
│  ├── rate_limits                            │
│  ├── active_campaigns                       │
│  └── metrics                                │
│                                              │
│  Supabase (Optional/Backwards compat)       │
│  └── Legacy QR data                         │
│                                              │
└─────────────────────────────────────────────┘
```

---

## SERVICE CONSOLIDATION

### Before (9 Services)

```
rez-ads-service
rez-marketing-service
adsqr
adBazaar
rez-adbazaar
rez-ad-platform
rez-ad-copilot
rez-intent-graph
rez-intent-service
```

### After (5 Services)

```
1. unified-campaign-engine (UCE)
   └── rez-ads-service + rez-ad-platform + adsqr (merged)

2. channel-executor
   └── rez-marketing-service (refactored)

3. rez-intent-service
   └── Intent capture & AI agents (keep)

4. attribution-engine
   └── Unified tracking (new)

5. ai-copilot
   └── Campaign AI (new)
```

---

## IMPLEMENTATION ROADMAP

### PHASE 1: KILL (Week 1)

| Task | Action | Owner |
|------|--------|-------|
| Delete `rez-adbazaar` | Remove directory | Platform |
| Deprecate `adBazaar` | Point to adsqr | Platform |
| Backup `adsqr` data | Export Supabase | DBA |
| Archive old code | Git tag | All |

### PHASE 2: MERGE (Week 2-3)

| Task | Action | Owner |
|------|--------|-------|
| Create UCE core | New service structure | Backend |
| Move campaign logic | From rez-ads | Backend |
| Move QR logic | From adsqr | Backend |
| Move attribution | From both | Backend |
| Connect ReZ Mind | Intent integration | Backend |

### PHASE 3: REBUILD (Week 4-6)

| Task | Action | Owner |
|------|--------|-------|
| Budget Allocator | AI module | AI Team |
| Attribution Engine | Unified tracking | Backend |
| Channel Executor | WhatsApp/Push/Email | Backend |
| Control System | Rate limits | Backend |

### PHASE 4: INTELLIGENCE (Week 7-8)

| Task | Action | Owner |
|------|--------|-------|
| AI Copilot | Natural language campaigns | AI Team |
| DOOH Module | AdOS integration | Product |
| Optimization Engine | Auto-optimize | AI Team |

### PHASE 5: LAUNCH (Week 9-10)

| Task | Action | Owner |
|------|--------|-------|
| Testing | E2E + Load | QA |
| Migration | Move data | DBA |
| Deploy | Production | DevOps |
| Monitor | Launch | All |

---

## METRICS TO TRACK

### Consolidation Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Services | 9 | 5 |
| Databases | 3 | 1-2 |
| Campaign types | Fragmented | Unified |
| Attribution | Split | Unified |
| Time to launch | Days | Minutes |

### Performance Metrics

| Metric | Target |
|--------|--------|
| Campaign creation | < 1 min |
| Attribution accuracy | > 95% |
| ROI calculation | Real-time |
| Budget optimization | Auto |

---

## FILES & DOCUMENTATION

| File | Purpose |
|------|---------|
| `SOURCE-OF-TRUTH/CONSOLIDATION-PLAN.md` | This plan |
| `SOURCE-OF-TRUTH/MARKETING-SERVICES-AUDIT.md` | Audit results |
| `SOURCE-OF-TRUTH/REZ-UNIFIED-MARKETING-PLATFORM-PLAN.md` | Full vision |

---

## CONTROL SYSTEM RULES

### Message Limits

| Channel | Limit/User/Day |
|---------|---------------|
| WhatsApp | 3 |
| Push | 5 |
| Email | 1 |

### Fatigue Rules

```
IF user responded in 24h → NO message
IF user purchased in 1h → NO message
IF user opted out → NEVER message
```

### Merchant Ranking

```
IF multiple merchants target same user:
  1. Highest intent match → wins
  2. Best offer (discount %) → tiebreaker
  3. Merchant rating → tiebreaker
```

---

## SUCCESS CRITERIA

| Criteria | Definition |
|----------|------------|
| Consolidation | 9 → 5 services |
| Attribution | 100% unified |
| Campaign launch | < 1 minute |
| Intelligence | AI-powered |
| Control | Zero spam |

---

## NEXT STEPS

1. **Approve this plan**
2. **Start PHASE 1: Kill legacy**
3. **Begin PHASE 2: Merge into UCE**
4. **Weekly status with CTO**

---

**No more fragmentation. One system. One truth. One engine.**
