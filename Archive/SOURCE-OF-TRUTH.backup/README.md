# REZ Platform — Source of Truth

**Last Updated:** 2026-05-06
**Version:** 8.0.0 - COMPLETE MARKETING PLATFORM

---

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║         REZ PLATFORM - OPERATING SYSTEM FOR LOCAL COMMERCE                  ║
║                                                                             ║
║                    Events → Intelligence → Decisions → Growth                ║
║                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🚀 QUICK START (For Developer)

### Step 1: Deploy REZ Mind (Priority)

**Deploy these 3 services FIRST:**

| # | Service | GitHub | Port |
|---|---------|--------|------|
| 1 | Event Platform | [imrejaul007/rez-event-platform](https://github.com/imrejaul007/rez-event-platform) | 4008 |
| 2 | Action Engine | [imrejaul007/rez-action-engine](https://github.com/imrejaul007/rez-action-engine) | 4009 |
| 3 | Feedback Service | [imrejaul007/rez-feedback-service](https://github.com/imrejaul007/rez-feedback-service) | 4010 |
| 4 | First Loop | [imrejaul007/rez-first-loop](https://github.com/imrejaul007/rez-first-loop) | Worker |

**How to Deploy:**
```
1. Go to: https://dashboard.render.com
2. New → Web Service
3. Connect GitHub repo
4. Use settings from DEPLOYMENT-GUIDE.md
5. Add MONGODB_URI env var
```

### Step 2: Update App Env Vars

After Event Platform is live:
```bash
REZ_MIND_URL=https://rez-event-platform.onrender.com
EXPO_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
NEXT_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
```

### Step 3: Test

```bash
curl https://rez-event-platform.onrender.com/health
```

---

## 📁 DOCUMENTATION STRUCTURE

### For Deployment
| Document | Purpose |
|----------|---------|
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | **Complete deployment guide** |
| [DEPLOYMENT-QUICK-REF.md](DEPLOYMENT-QUICK-REF.md) | **Quick deploy card** |
| [DEPLOY-FIX-REPORT-2026-05-02.md](DEPLOY-FIX-REPORT-2026-05-02.md) | **Deploy fix log** — all fixes, new services, build errors resolved |
| [BUILD-STATUS.md](BUILD-STATUS.md) | **Build status** — per-service build/deploy status |
| [FIXED-ISSUES.md](FIXED-ISSUES.md) | **Fix log** — all issues and resolutions |
| [REPOS.md](REPOS.md) | All repos with links |

### For Architecture
| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture |
| [REZ-MIND-V2.md](REZ-MIND-V2.md) | REZ Mind intelligence layer |
| [GROWTH-SERVICES.md](GROWTH-SERVICES.md) | Ads, marketing, analytics |

### For Development
| Document | Purpose |
|----------|---------|
| [API-ENDPOINTS.md](API-ENDPOINTS.md) | All API endpoints |
| [INTEGRATION-GUIDE.md](INTEGRATION-GUIDE.md) | How to integrate apps |
| [EVENT-SCHEMAS.md](EVENT-SCHEMAS.md) | Event schemas |

---

---

## 💬 UNIFIED MESSAGING PLATFORM (WhatsApp Commerce)

**GitHub:** [imrejaul007/rez-unified-messaging](https://github.com/imrejaul007/rez-unified-messaging)

### What It Is

```
One platform for ALL messaging across ReZ ecosystem
```

### Merchant WhatsApp OS

Each merchant gets:
- Dedicated WhatsApp Business number
- AI-powered responses (via ReZ Mind)
- Campaign integration
- Analytics dashboard

### Channels Supported

| Channel | Purpose |
|---------|---------|
| **WhatsApp** | Chat commerce, support, offers |
| **SMS** | OTPs, alerts, reminders |
| **Email** | Receipts, newsletters |
| **Push** | Notifications, re-engagement |
| **In-App** | Real-time messaging |

### Flow

```
Customer sends WhatsApp
        ↓
Webhook → ReZ Mind (intent detection)
        ↓
AI generates response
        ↓
Send from merchant's number
        ↓
ReZ Mind learns
```

### APIs

| Endpoint | Purpose |
|----------|---------|
| `/api/merchant/whatsapp/numbers` | Manage WhatsApp numbers |
| `/api/merchant/whatsapp/webhook` | Receive messages |
| `/api/merchant/whatsapp/conversations` | List conversations |
| `/api/channels/whatsapp` | Send WhatsApp |
| `/api/channels/sms` | Send SMS |
| `/api/channels/email` | Send Email |
| `/api/channels/push` | Send Push |

---

## 🧠 REZ MIND (Intelligence Layer)

**Refined Vision:** Behavioral Signal Engine - not "knows everything"

```
Events → Signal Processing → Intelligence → Decisions → Feedback → Learning
```

### Services (Deploy Order)
| Tier | Service | Port | Purpose |
|------|---------|------|---------|
| **CRITICAL** | Event Platform | 4008 | Event ingestion hub |
| **CRITICAL** | Action Engine | 4009 | Decision engine |
| **CRITICAL** | Feedback Service | 4010 | Learning loop |
| **Intelligence** | User Intelligence | 3004 | User profiles |
| **Intelligence** | Merchant Intelligence | 4012 | Merchant profiles |
| **Intelligence** | Intent Predictor | 4018 | Intent prediction |
| **Intelligence** | Intelligence Hub | 4020 | Unified profiles |
| **Delivery** | Targeting Engine | 3003 | Campaign targeting |
| **Delivery** | Recommendation Engine | 3001 | Product recommendations |
| **Delivery** | Personalization Engine | 4017 | Content ranking |
| **Delivery** | Push Service | 4013 | Notifications |
| **Dashboards** | Merchant Copilot | 4022 | Merchant dashboard |
| **Dashboards** | Consumer Copilot | 4021 | Consumer dashboard |
| **Dashboards** | AdBazaar | 4025 | Intent-based ads |
| **Dashboards** | Feature Flags | 4030 | Feature toggles |
| **Dashboards** | Observability | 4031 | Logs & traces |

**All services have render.yaml** - Ready for one-click deploy.

---

## 📱 APPS

### Consumer Apps
| App | REZ Mind | GitHub |
|-----|----------|--------|
| rez-app-consumer | ✅ | [Link](https://github.com/imrejaul007/rez-app-consumer) |
| rez-now | ✅ | [Link](https://github.com/imrejaul007/rez-now) |
| rendez | ✅ | [Link](https://github.com/imrejaul007/Rendez) |
| rez-karma-app | 🔄 | - |

### Merchant Apps
| App | REZ Mind | GitHub |
|-----|----------|--------|
| rez-app-merchant | ✅ | [Link](https://github.com/imrejaul007/rez-app-marchant) |
| rez-restopapa | 🔄 | - |
| rez-pms-app | 🔄 | - |

### Admin
| App | GitHub |
|-----|--------|
| rez-app-admin | [Link](https://github.com/imrejaul007/rez-app-admin) |

---

## 🔧 CORE BACKEND SERVICES

| Service | GitHub | Status |
|---------|--------|--------|
| rez-api-gateway | [Link](https://github.com/imrejaul007/rez-api-gateway) | Active |
| rez-auth-service | [Link](https://github.com/imrejaul007/rez-auth-service) | Active |
| rez-order-service | [Link](https://github.com/imrejaul007/rez-order-service) | Active |
| rez-payment-service | [Link](https://github.com/imrejaul007/rez-payment-service) | Active |
| rez-search-service | [Link](https://github.com/imrejaul007/rez-search-service) | Active |
| rez-wallet-service | [Link](https://github.com/imrejaul007/rez-wallet-service) | Active |
| rez-catalog-service | [Link](https://github.com/imrejaul007/rez-catalog-service) | Active |
| rez-merchant-service | [Link](https://github.com/imrejaul007/rez-merchant-service) | Active |
| rez-gamification-service | [Link](https://github.com/imrejaul007/rez-gamification-service) | Active |

---

## 📱 MARKETING PLATFORM (Built May 6, 2026)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REZ MARKETING ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REZ MIND                                                                    │
│  (Signals + User Knowledge)                                                 │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                    CONSUMER APPS                                      │     │
│  │  • Recommend products/services based on user profile                   │     │
│  │  • Knowledge base powered recommendations                            │     │
│  │  • Personalized offers                                                 │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                    SEARCH & DISCOVERY                                 │     │
│  │  • Sponsored results based on bidding                                 │     │
│  │  • Ranked by merchant performance                                     │     │
│  │  • Organic + Sponsored interleaved                                    │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                    MULTI-CHANNEL REACH                                │     │
│  │                                                                      │     │
│  │  HOT: Abandoned search, half-left → Curated offers                 │     │
│  │  COLD: Knowledge base → Promotions they might like                  │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐     │
│  │                    OFFLINE ADS (DOOH + AdOS)                        │     │
│  │  1:1 Screens ──▶ Targeted ads (personalized)                     │     │
│  │  Mass Screens ──▶ Area-based ads (contextual)                     │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
│         │                                                                     │
│         ▼                                                                     │
│  ADBAZAAR ──▶ Campaigns (bus, auto, billboards, DOOH)                    │
│         │                                                                     │
│         ▼                                                                     │
│  ADQR ──▶ User scans ──▶ Gets brand coins / Free trial via ReZ Try      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Services

| Service | GitHub | Purpose |
|---------|--------|---------|
| **rez-decision-service** | [Link](https://github.com/imrejaul007/rez-decision-service) | RDE Core |
| **rez-lead-intelligence** | [Link](https://github.com/imrejaul007/rez-lead-intelligence) | Hot/Warm/Cold detection |
| **rez-abandonment-tracker** | [Link](https://github.com/imrejaul007/rez-abandonment-tracker) | Abandoned recovery |
| **rez-dooh-service** | [Link](https://github.com/imrejaul007/rez-dooh-service) | DOOH + AdOS |
| **rez-unified-messaging** | [Link](https://github.com/imrejaul007/rez-unified-messaging) | WhatsApp/SMS/Push/Email |
| **rez-marketing-service** | [Link](https://github.com/imrejaul007/rez-marketing-service) | Multi-channel campaigns |
| **rez-ads-service** | [Link](https://github.com/imrejaul007/rez-ads-service) | Brand Dashboard |
| **rez-intent-graph** | [Link](https://github.com/imrejaul007/rez-intent-graph) | Intent tracking + AI |
| **adBazaar** | [Link](https://github.com/imrejaul007/adBazaar) | Marketplace frontend |
| **adsqr** | [Link](https://github.com/imrejaul007/adsqr) | QR sampling |

### Integration Flow

```
User Action (search/scan/chat)
        │
        ▼
RDE SUPREME CONTROLLER
        │
        ├── Check fatigue
        ├── Get user context (ReZ Mind)
        └── Approve/Reject
        │
        ▼
REAL-TIME TRIGGERS (< 100ms)
        │
        ▼
AUCTION ENGINE
        │
        ├── Score merchants
        └── Best wins
        │
        ▼
SPONSORED RANKING
        │
        ├── Relevance (35%)
        ├── Bid (25%)
        ├── Quality (20%)
        ├── Offer (15%)
        └── Affinity (5%)
        │
        ▼
SLOTS ALLOCATION (30% max)
        │
        ▼
CHANNEL ROUTING (Lead Intelligence)
        │
        ├── Hot ≥ 75 → WhatsApp
        ├── Warm 40-74 → Push
        └── Cold < 40 → SMS/Email
        │
        ▼
WHATSAPP AI COMMERCE
        │
        ├── Intent detection
        ├── AI response
        └── Order flow
        │
        ▼
ATTRIBUTION → REZ MIND LEARNS
```

### RDE Core Features

| Component | Purpose |
|-----------|---------|
| Supreme Controller | All decisions pass through |
| Real-Time Triggers | < 100ms response |
| Auction Engine | Merchant competition |
| Sponsored Ranking | Score formula |

### Lead Intelligence

| Score | Threshold | Action | Message Example |
|-------|-----------|--------|----------------|
| Hot | ≥ 75 | WhatsApp immediate | "Your cart is waiting! 30 min left" |
| Warm | 40-74 | Push notification | "Still thinking about that biryani?" |
| Cold | < 40 | SMS/Email discovery | "Discover something new today" |

### DOOH Targets

| Screen Type | Targeting | How |
|-------------|-----------|-----|
| 1:1 Screens | Personalized | User ID known → personalized ads |
| Mass Screens | Area-based | Demographics + time + top intents |

---

## 💰 DYNAMIC PRICING ENGINE (Built May 6, 2026)

**GitHub:** [imrejaul007/rez-price-optimization-service](https://github.com/imrejaul007/rez-price-optimization-service)

### What It Does

```
Dynamic pricing based on:
├── Time factors (day, hour, season)
├── Inventory factors (stock, expiry)
├── Demand factors (historical, real-time)
└── Competition factors (market)
```

### Pricing Rules

| Factor | High Demand | Low Demand |
|--------|-------------|------------|
| **Day** | Sunday -5% | Wednesday -20% |
| **Time** | Peak -10% | Off-peak -25% |
| **Inventory** | Scarcity +10% | Overstock -20% |
| **Expiry** | Normal | <3 days -40% |

### Merchant AI Suggestions

```
├── "Stock running low - Reorder alert"
├── "Wednesday discount recommended"
├── "Near expiry - 40% off"
├── "Overstock - Consider bundle"
└── "Trending item - Premium pricing"
```

### APIs

| Endpoint | Purpose |
|----------|---------|
| `/api/price/calculate` | Calculate dynamic price |
| `/api/price/recommend` | Get recommendations |
| `/api/demand/forecast` | Demand prediction |
| `/api/inventory/alerts` | Stock alerts |
| `/api/offers/suggest` | Offer suggestions |

---

## 📦 ALL MARKETING SERVICES - COMPLETE LIST

### Core Services

| Service | GitHub | Port | Status |
|---------|--------|------|--------|
| **rez-decision-service** | [Link](https://github.com/imrejaul007/rez-decision-service) | 4101 | ✅ Ready |
| **rez-lead-intelligence** | [Link](https://github.com/imrejaul007/rez-lead-intelligence) | 4106 | ✅ Ready |
| **rez-abandonment-tracker** | [Link](https://github.com/imrejaul007/rez-abandonment-tracker) | 4108 | ✅ Ready |
| **rez-dooh-service** | [Link](https://github.com/imrejaul007/rez-dooh-service) | 4107 | ✅ Ready |
| **rez-unified-messaging** | [Link](https://github.com/imrejaul007/rez-unified-messaging) | 4025 | ✅ Ready |
| **rez-price-optimization-service** | [Link](https://github.com/imrejaul007/rez-price-optimization-service) | 4105 | ✅ Ready |

### Marketing Services

| Service | GitHub | Port | Status |
|---------|--------|------|--------|
| **rez-marketing-service** | [Link](https://github.com/imrejaul007/rez-marketing-service) | 4001 | ✅ Ready |
| **rez-ads-service** | [Link](https://github.com/imrejaul007/rez-ads-service) | 4002 | ✅ Ready |
| **rez-intent-graph** | [Link](https://github.com/imrejaul007/rez-intent-graph) | 4018 | ✅ Ready |
| **adBazaar** | [Link](https://github.com/imrejaul007/adBazaar) | 4025 | ✅ Ready |
| **adsqr** | [Link](https://github.com/imrejaul007/adsqr) | 4026 | ✅ Ready |

### Deployment

Each service has:
- `render.yaml` - 1-click Render deploy
- `Dockerfile` - Docker deployment
- `README.md` - Complete documentation

### Deploy Order

1. **REZ Mind** (Event Platform, Action Engine, Feedback)
2. **Core Services** (rez-decision-service, rez-lead-intelligence)
3. **Marketing** (rez-marketing-service, rez-ads-service)
4. **Channels** (rez-unified-messaging, rez-dooh-service)
5. **Optimization** (rez-price-optimization-service, rez-abandonment-tracker)

### Environment Variables Needed

```bash
# REZ Mind
REZMIND_URL=https://rez-event-platform.onrender.com

# All services need
MONGODB_URI=mongodb://...
REDIS_URL=redis://...

# Merchant integration
MERCHANT_SERVICE_URL=https://rez-merchant.onrender.com

# WhatsApp (Unified Messaging)
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_ID=...

# SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# Email
SENDGRID_API_KEY=...

# Push
FIREBASE_SERVER_KEY=...
```

---

## 📊 CHAT & SUPPORT

| Component | Status | REZ Mind Ready |
|-----------|--------|----------------|
| Rendez messaging | ✅ | ❌ |
| Admin support tickets | ✅ | ❌ |
| Merchant chat | ✅ | ❌ |
| Consumer chat | ✅ | ❌ |
| Support Copilot | ❌ | N/A |

**See:** [CHAT-SUPPORT-STATUS.md](CHAT-SUPPORT-STATUS.md)

---

## 🔒 SECURITY

| Item | Status |
|------|--------|
| Rate limiting | ✅ |
| RBAC middleware | ✅ |
| CORS explicit domains | ✅ |
| Security headers | ✅ |
| MongoDB AUTH | ✅ Config ready |
| Redis AUTH | ✅ Config ready |

**See:** [SECURITY.md](SECURITY.md)

---

## 📈 LAUNCH PHASES

| Phase | Features | Safety |
|-------|----------|--------|
| **Phase 1: Internal** | Merchant Copilot ON, Learning OFF | Maximum |
| **Phase 2: Controlled** | 5-20 merchants, safe mode | High |
| **Phase 3: Progressive** | Learning ON, Full Personalization | Medium |

---

## 🎯 CONSULTANT REFINEMENTS

Key correction:
- ❌ "ReZ Mind knows everything"
- ✅ "ReZ Mind continuously learns patterns and predicts intent"

**See:** [REZ-MIND-V2.md](REZ-MIND-V2.md)

---

## ⚡ QUICK COMMANDS

```bash
# Check feature flags
curl https://rez-event-platform.onrender.com/flags

# Send test event
curl -X POST https://rez-event-platform.onrender.com/webhook/merchant/order \
  -H "Content-Type: application/json" \
  -d '{"merchant_id":"test","order_id":"123","total_amount":500}'
```

---

## 📞 NEED HELP?

1. Read DEPLOYMENT-GUIDE.md for step-by-step
2. Check REPOS.md for all repo links
3. See INTEGRATION-GUIDE.md for app integration

---

**Last Updated:** 2026-05-02
**Maintained by:** REZ Team
