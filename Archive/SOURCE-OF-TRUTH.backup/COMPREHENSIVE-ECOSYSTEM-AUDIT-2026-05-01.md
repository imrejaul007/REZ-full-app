# ReZ Ecosystem - Comprehensive Audit Report
**Generated:** 2026-05-01
**Last Updated:** 2026-05-01
**Status:** COMPLETE

---

## Executive Summary

This document is the definitive audit of the entire ReZ ecosystem, covering:
- **10 Frontend Apps** (Mobile + Web)
- **17 Backend Services** (Microservices)
- **15 Shared Packages**
- **12 AI/Intelligence Components**

### Key Metrics

| Category | Count | Status |
|----------|-------|--------|
| Frontend Apps | 10 | 7 Active, 3 Minimal |
| Backend Services | 17 | 14 Active, 3 New |
| Shared Packages | 15 | 13 Built, 2 Standalone |
| AI Components | 12 | 8 Active, 4 Minimal |

---

## Part 1: Frontend Applications

### 1.1 Mobile Apps

#### A. rez-app-consumer (Consumer App - "Nuqta")
**Location:** `rez-app-consumer`
**Platform:** React Native/Expo | **Version:** 1.0.0

| Attribute | Value |
|-----------|-------|
| Framework | Expo SDK 53, React Native 0.79, React 19 |
| Navigation | expo-router ~5.1.11 |
| State | zustand ^5.0.11, @tanstack/react-query ^5.90.21 |
| Payments | react-native-razorpay ^2.3.0 |
| Real-time | socket.io-client ^4.8.1 |
| Shared | @rez/chat, @rez/shared-types |

**Features:**
- OTP/PIN authentication with SecureStore
- Product browsing with category search and filters
- Cart & checkout with multi-item support
- Wallet & cashback with transaction history
- Referral program with tier benefits
- Push notifications via Firebase FCM
- Real-time order tracking
- Offline support with request deduplication

**API Services Called:**
| Service | URL |
|---------|-----|
| API Gateway | https://rez-api-gateway.onrender.com/api |
| Auth | https://rez-auth-service.onrender.com |
| Wallet | https://rez-wallet-service-36vo.onrender.com |
| Payment | https://rez-payment-service.onrender.com |
| Catalog | https://rez-catalog-service-1.onrender.com |

**Issues/TODOs:**
- Push notification delivery tracking incomplete
- Certificate pinning not implemented

---

#### B. rez-app-merchant (Merchant App)
**Location:** `rez-app-merchant`
**Platform:** React Native/Expo | **Version:** 1.0.0

| Attribute | Value |
|-----------|-------|
| Framework | Expo SDK 55, React Native 0.76, React 18.3 |
| Navigation | expo-router ~4.0.0 |
| State | @tanstack/react-query ^5.45.0 |
| Charts | victory-native 36.9.2 |
| Shared | @rez/shared, @rez/shared-types |

**Features:**
- Dashboard with revenue/orders/cashback metrics
- Product CRUD with inventory tracking
- Real-time order processing
- Cashback administration
- POS terminal, KDS, Khata
- Settlements & payouts
- Campaigns with ROI simulator
- Loyalty punch cards
- AI Copilot dashboard

**Issues/TODOs:**
- i18n: All UI strings hardcoded (Phase 2)

---

#### C. rez-app-admin (Admin Dashboard)
**Location:** `rez-app-admin`
**Platform:** React Native/Expo | **Version:** 1.0.0

| Attribute | Value |
|-----------|-------|
| Framework | Expo SDK 53, React Native 0.79, React 19 |
| State | @tanstack/react-query ^5.85.3 |
| Shared | @rez/shared |

**Features:**
- User management (search, verify, block)
- Merchant onboarding with KYC verification
- Settlement & payout management
- Fraud detection with device fingerprint blocking
- Campaign management
- Push/SMS/email broadcasting
- Analytics dashboards
- Role-based access (super_admin, finance_admin, trust_safety_admin, marketing_admin, support_admin)

---

#### D. rez-karma-mobile (Karma Mobile)
**Location:** `rez-karma-mobile`
**Platform:** React Native/Expo | **Version:** 1.0.0

| Attribute | Value |
|-----------|-------|
| Framework | Expo SDK 52, React Native 0.76, React 18.3 |
| HTTP | axios ^1.7.9 |
| Camera | expo-camera ~16.0.18 |

**Features:**
- Karma home with snapshot card
- Karma passport with history
- Event listings and details
- Mission tracking, Micro-actions
- Leaderboard, QR scanning
- Community groups

**Issues/TODOs:**
- No Sentry or analytics
- No offline support
- Simpler auth (no SecureStore)

---

### 1.2 Web Apps

#### A. rez-now (Consumer Web App)
**Location:** `rez-now`
**Platform:** Next.js 16.2.3

| Attribute | Value |
|-----------|-------|
| Framework | Next.js 16.2.3 |
| State | zustand ^5.0.12 |
| i18n | next-intl (en, hi locales) |
| Output | standalone |
| Hosting | Vercel |

**Key Routes:**
| Route | Purpose |
|-------|---------|
| `/` | Home with search |
| `/:storeSlug` | Restaurant/menu page |
| `/orders` | Order history |
| `/wallet` | REZ coins |
| `/scan` | QR scanning |

---

#### B. adBazaar (Ad Marketplace)
**Location:** `adBazaar`
**Platform:** Next.js 16.2.4

| Attribute | Value |
|-----------|-------|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Razorpay |
| Maps | @react-google-maps/api |

**CRITICAL Issues (64 open of 111 total):**
| ID | Issue |
|----|-------|
| AB-C3 | Bank data exposed in API |
| AB-C4 | No idempotency on booking |
| AB-C5 | Payment amount never verified |
| AB3-C1 | Buyer can remove others' bookings |
| AB3-C2 | Any user can create listing |

---

#### C. CorpPerks (Enterprise Portal)
**Location:** `CorpPerks`

**Services:**
| Service | Port | Description |
|---------|------|-------------|
| rez-corpperks-service | 4014 | Gateway API |
| rez-hotel-service | 4011 | Makcorps integration |
| rez-procurement-service | 4012 | NextaBizz integration |

**Modules:**
- Benefits (Meal, Travel, Wellness, Learning, Gift)
- Employees (HRIS sync)
- Hotel Bookings (GST-ready invoices)
- GST Invoicing
- Corporate Gifting
- Karma/CSR

---

### 1.3 Mobile Apps Comparison

| Feature | Consumer | Merchant | Admin | Karma-Mobile |
|---------|---------|---------|-------|--------------|
| Auth | OTP + PIN | Email/Password | 2FA | OTP |
| Token Storage | SecureStore | AsyncStorage | AsyncStorage | AsyncStorage |
| Framework | Expo 53 | Expo 55 | Expo 53 | Expo 52 |
| React | 19 | 18.3 | 19 | 18.3 |
| Sentry | Yes | Yes | Yes | **No** |
| Analytics | Yes | No | No | **No** |
| i18n | Phase 2 | Phase 2 | Phase 2 | No |

---

## Part 2: Backend Services

### 2.1 Core Services Port Map

| Service | HTTP Port | Health Port |
|---------|-----------|-------------|
| rez-auth-service | 4002 | 4102 |
| rez-order-service | 3006 | - |
| rez-payment-service | 4001 | 4101 |
| rez-wallet-service | 4004 | - |
| rez-merchant-service | 4005 | - |
| rez-catalog-service | 3005 | - |
| rez-search-service | 4003 | 4103 |
| rez-karma-service | 3009 | - |
| rez-notification-events | 3001 | - |
| rez-gamification-service | 3004 | - |
| rez-scheduler-service | 3012 | 3112 |
| rez-ads-service | 4007 | - |
| rez-corpperks-service | 4014 | - |
| rez-event-platform | 4008 | - |
| rez-action-engine | 4009 | - |
| rez-feedback-service | 4010 | - |

### 2.2 Services Summary

| Service | Features | Events Emitted | Events Consumed |
|---------|----------|----------------|----------------|
| rez-auth-service | OTP, TOTP, PIN, JWT | notification-events | - |
| rez-order-service | Order lifecycle, SSE | wallet-events, notification-events | order-events |
| rez-payment-service | Razorpay, refunds | wallet-events, notification-events | payment-events |
| rez-wallet-service | Multi-coin, BNPL | wallet-events | wallet-events |
| rez-merchant-service | Store, product, team | notification-events | - |
| rez-catalog-service | Catalog, caching | - | catalog-events |
| rez-search-service | Search, recommendations | Redis pub/sub | catalog:invalidate |
| rez-karma-service | Karma, communities | Redis pub/sub | coin-credit |
| rez-notification-events | Push, email, SMS | - | notification-events |
| rez-gamification-service | Achievements, streaks | notification-events | gamification-events |
| rez-scheduler-service | 16 cron jobs | Various | - |
| rez-ads-service | Self-serve ads | intent capture | - |

---

## Part 3: Shared Packages

### 3.1 Package Inventory

| Package | Version | Purpose | Consumers |
|---------|---------|---------|----------|
| @rez/shared-types | 2.0.0 | FSM, Branded IDs, Zod schemas | 8+ services |
| @rez/shared | 1.0.0 | Rate limiting, health, audit | All services |
| @rez/ui | 1.0.0 | Button, Card, Input, Modal | React Native |
| @rez/service-core | 1.0.1 | Redis, MongoDB, BullMQ, Sentry | 8+ services |
| @rez/agent-memory | 1.0.0 | Cross-app preferences | Agent OS |
| @rez/chat-ai | 1.0.0 | Claude integration, sanitization | Chat services |
| @rez/chat | 1.0.0 | Socket.IO client, hooks | 5+ apps |
| @rez/chat-integration | 1.0.0 | Service orchestration | Chat AI |
| @rez/chat-rn | 1.0.0 | React Native AI chat | React Native |
| @rez/intent-capture-sdk | 1.0.0 | Intent tracking | All apps |
| shared-types | 2.0.0 | Enums, interfaces | Multiple |

### 3.2 Package Dependencies

```
@rez/chat-integration → @rez/chat-ai
@rez/chat → @rez/chat-ai (optional)
Other packages: No internal dependencies
```

---

## Part 4: AI & Intelligence

### 4.1 Components

| Component | Port | Features |
|-----------|------|----------|
| rez-intent-graph (ReZ Mind) | 3001/3005 | 8 Autonomous Agents, Intent capture, Dormant revival |
| rez-agent-os | - | @rez/agent-core, @rez/agent-rn, @rez/agent-web |
| rez-event-platform | 4008 | Central event bus, Zod validation, DLQ |
| rez-action-engine | 4009 | Decision execution, Guardrails, Action levels |
| rez-feedback-service | 4010 | Explicit/implicit feedback, Pattern detection |

### 4.2 8 Autonomous Agents

| Agent | Schedule | Purpose |
|-------|----------|---------|
| DemandSignalAgent | 5 min | Demand per merchant/category |
| ScarcityAgent | 1 min | Supply/demand ratios, urgency |
| PersonalizationAgent | Event | User response profiling |
| AttributionAgent | Event | Multi-touch conversion |
| AdaptiveScoringAgent | Hourly | ML retraining |
| FeedbackLoopAgent | Event | Closed-loop optimization |
| NetworkEffectAgent | Daily | Collaborative filtering |
| RevenueAttributionAgent | 15 min | GMV tracking, ROI |

---

## Part 5: Cross-Component Analysis

### 5.1 API Gateway Routing

| Path | Routes To |
|------|-----------|
| `/api/auth/*` | rez-auth-service:4002 |
| `/api/orders/*` | rez-order-service:3006 |
| `/api/payments/*` | rez-payment-service:4001 |
| `/api/wallet/*` | rez-wallet-service:4004 |
| `/api/merchant/*` | rez-merchant-service:4005 |
| `/api/search/*` | rez-search-service:4003 |
| `/api/karma/*` | rez-karma-service:3009 |
| `/api/notifications/*` | rez-notification-events:3001 |
| `/api/gamification/*` | rez-gamification-service:3004 |
| `/api/ads/*` | rez-ads-service:4007 |

### 5.2 Event Bus Topology

```
BULLMQ QUEUES:
  notification-events  → rez-notification-events
  wallet-events     → rez-wallet-service
  order-events     → rez-order-service
  payment-events   → rez-payment-service
  catalog-events   → rez-catalog-service
  gamification-events → rez-gamification-service

REDIS PUB/SUB:
  catalog:invalidate → rez-search-service
  coin-credit       → rez-karma-service
```

---

## Part 6: Issues & Gaps

### 6.1 Critical Issues

| ID | Component | Issue | Impact |
|----|-----------|-------|--------|
| AB-C3 | adBazaar | Bank data exposed in API | Security |
| AB-C4 | adBazaar | No idempotency on booking | Financial |
| AB-C5 | adBazaar | Payment amount never verified | Financial |
| AB3-C1 | adBazaar | Authorization bypass | Security |
| AB3-C2 | adBazaar | Any user can create listing | Security |

### 6.2 High Priority Gaps

| Gap | Services | Recommendation |
|-----|----------|----------------|
| karma-mobile: No Sentry/analytics | karma-mobile | Add monitoring |
| karma-mobile: Simpler auth | karma-mobile | Upgrade auth |
| Search passive indexing | rez-search | Event-driven |
| i18n pending | All apps | Prioritize Phase 2 |
| Certificate pinning | Mobile apps | Implement |

### 6.3 Version Mismatches

| Dependency | Consumer | Merchant | Admin | Karma-Mobile |
|-----------|----------|----------|-------|--------------|
| React | 19 | 18.3 | 19 | 18.3 |
| Expo SDK | 53 | 55 | 53 | 52 |
| React Native | 0.79 | 0.76 | 0.79 | 0.76 |

---

## Part 7: Security Status

### 7.1 Security Controls

| Control | Status |
|---------|--------|
| Rate Limiting | ✅ All services |
| JWT Auth | ✅ All services |
| Internal Tokens | ✅ All services |
| CORS | ✅ All services |
| Helmet | ✅ All services |
| MongoDB Sanitize | ✅ All services |
| MongoDB AUTH | ❌ TODO |
| Redis AUTH | ❌ TODO |
| Certificate Pinning | ❌ Planned |

### 7.2 Security TODOs

| Item | Priority |
|------|----------|
| Enable MongoDB AUTH | Critical |
| Enable Redis AUTH | Critical |
| Fix adBazaar security | Critical |
| Certificate Pinning | High |
| Credential Rotation | High |

---

## Part 8: Recommendations

### Immediate (1-2 weeks)
1. Fix adBazaar CRITICAL issues
2. Enable MongoDB AUTH across all services
3. Enable Redis AUTH across all services
4. Add Sentry to karma apps

### Short-term (2-4 weeks)
1. Standardize auth patterns
2. Complete i18n
3. Implement certificate pinning
4. Add offline support

### Medium-term (1-2 months)
1. Event-driven search indexing
2. ML-based fraud detection
3. Expand ReZ Mind integration
4. Complete rez-api-gateway

---

## Appendix: Production URLs

```
API Gateway:     https://rez-api-gateway.onrender.com
Auth:           https://rez-auth-service.onrender.com
Order:          https://rez-order-service.onrender.com
Payment:        https://rez-payment-service.onrender.com
Wallet:         https://rez-wallet-service-36vo.onrender.com
Merchant:       https://rez-merchant-service.onrender.com
ReZ Mind:       https://rez-intent-graph.onrender.com
WebSocket:      https://rez-backend-8dfu.onrender.com
```

---

**Document Version:** 2.0
**Audit Date:** 2026-05-01
**Next Review:** 2026-05-15
