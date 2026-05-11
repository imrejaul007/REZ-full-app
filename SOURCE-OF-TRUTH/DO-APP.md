# DO APP - AI Commerce OS

**Last Updated:** 2026-05-04
**Repo:** `imrejaul007/do`
**Purpose:** AI-powered consumer app with unified intelligence

---

## Overview

Do is an AI-first commerce app that:
- Uses unified intelligence from ReZ Mind
- Syncs with Auth + Wallet + Profile services
- Powers both Do App and Support Copilot

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ REZ MIND (Central Intelligence) │
├─────────────────────────────────────────────────────────────┤
│ │
│ • Training Data │
│ • Intent Patterns (25+) │
│ • Knowledge Base │
│ • User Profiles │
│ • Transaction History │
│ • Merchant KB │
│ │
└─────────────────────────────┬───────────────────────────────┘
 │
 ┌────────────────┼────────────────┐
 ▼ ▼ ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ DO APP │ │ SUPPORT │ │ OTHER │
│ │ │ COPILOT │ │ APPS │
│ • Chat │ │ • Room QR │ │ rez-app │
│ • Wallet │ │ • All QR │ │ Merchant │
│ • Profile │ │ • Web Menu │ │ Hotel │
│ • Explore │ │ • Dashboard │ │ ... │
└─────────┘ └─────────┘ └─────────┘
```

---

## Services

| Service | URL | Purpose | Owner |
|---------|-----|---------|--------|
| Auth | `rez-auth-service.onrender.com` | User authentication | Core |
| **Profile** | `rezprofile.onrender.com` | Preferences, addresses | Profile Team |
| Wallet | `rez-wallet-service-36vo.onrender.com` | Coins, balance | Core |
| Order | `rez-order-service-hz18.onrender.com` | Bookings, orders | Core |
| Catalog | `rez-catalog-service-1.onrender.com` | Products, venues | Core |
| Gamification | `rez-gamification-service-3b5d.onrender.com` | Karma, rewards | Core |
| Search | `rez-search-service.onrender.com` | Discovery | Core |
| Intent | `rez-intent-graph.onrender.com` | AI intelligence | AI Team |
| Merchant | `rez-merchant-service-n3q2.onrender.com` | Merchant data | Core |
| **REE** | `rez-economic-engine.onrender.com` | Subscription tier, pricing | Business Logic |

## Data Ownership

| Data | Service |
|------|---------|
| userId, phone | Auth |
| name, avatar, prefs | Profile |
| coins, balance | Wallet |
| **subscription tier** | **REE** |
| **pricing rules** | **REE** |
| **karma points** | Gamification |

---

## Screens

| Screen | Status | Description |
|--------|---------|-------------|
| **Auth** | Built | Phone + OTP |
| **Onboarding** | Built | 4-slide intro |
| **Chat** | Built | AI conversation |
| **Explore** | Built | Trending, nearby, mood |
| **Wallet** | Built | Coins, history |
| **Profile** | Built | User info, karma |
| **Complaints** | Built | View complaints |
| **Refunds** | Built | View refunds |

---

## Unified Intent System

### 25+ Intent Types

| Category | Intents |
|----------|---------|
| **Commerce** | ORDER_FOOD, BOOK_TABLE, BOOK_HOTEL, BOOK_SPA, BOOK_EVENT |
| **Transaction** | CANCEL_ORDER, MODIFY_ORDER, RESCHEDULE |
| **Payment** | REFUND_REQUEST, PAYMENT_ISSUE, CHECK_BALANCE |
| **Support** | COMPLAINT, HELP_REQUEST, TRACK_ORDER |
| **Discovery** | SEARCH_RESTAURANT, SEARCH_HOTEL, BROWSE_NEARBY |
| **Loyalty** | CHECK_KARMA, VIEW_OFFERS, REFER_FRIEND |

---

## API Endpoints

### Chat
```
POST /do/chat/message
GET /do/chat/history/:sessionId
POST /do/chat/sales/transaction
GET /do/chat/sales/opportunities/:userId
```

### Complaints
```
POST /do/complaint
GET /do/complaints
GET /do/complaint/:id
```

### Refunds
```
POST /do/refund
GET /do/refunds
GET /do/refund/:id
```

### Auth
```
POST /auth/otp/send
POST /auth/otp/verify
GET /auth/me
POST /auth/logout
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React Native + Expo |
| Backend | Node.js + Express |
| Navigation | expo-router |
| State | Zustand + MMKV |
| HTTP | Axios |
| Styling | StyleSheet |

---

## Bundle IDs

| Platform | Bundle ID |
|----------|----------|
| iOS | `com.do.app` |
| Android | `com.do.app` |

---

## Deployment

| Platform | Status |
|----------|--------|
| **EAS Build** | Configured |
| **iOS Profiles** | Development, Preview, Production |
| **Android** | Configured |

---

## Docs

- [FEATURES.md](do-app/FEATURES.md) - Complete feature list
- [INTEGRATION.md](do-app/INTEGRATION.md) - Integration guide
- [SETUP.md](do-app/SETUP.md) - Setup instructions
- [EAS-SETUP.md](do-app/EAS-SETUP.md) - EAS build guide

---

## Related

- [REZ-MIND-UNIFIED-SUPPORT.md](SOURCE-OF-TRUTH/REZ-MIND-UNIFIED-SUPPORT.md) - ReZ Mind + Support Copilot
- [PROFILE-CREDIT-INTEGRATION.md](SOURCE-OF-TRUTH/PROFILE-CREDIT-INTEGRATION.md) - Profile service
