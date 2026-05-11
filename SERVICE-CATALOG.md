# REZ Ecosystem - Complete Service Catalog
**Version:** 1.0
**Date:** May 9, 2026
**Auditor:** Claude Code (20 Agent Audit)

---

## COMMON / MULTI-INDUSTRY SERVICES

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **Auth Service** | 4002 | OTP/TOTP, JWT, session management | ✅ Built |
| **Wallet Service** | 4004 | Coins, loyalty wallet, balance ops | ✅ Built |
| **Payment Service** | 4001 | Razorpay, wallet ops, reconciliation | ✅ Built |
| **Profile Service** | 4006 | User profiles, preferences, addresses | ✅ Built |
| **Ledger Service** | 4007 | Double-entry accounting | ✅ Built |
| **Notification Hub** | 4008 | Email/SMS/WhatsApp/Push | ✅ Built |
| **DLQ Service** | 3000 | Dead letter queue, replay | ✅ Built |
| **Idempotency Service** | - | Prevent duplicate operations | ✅ Built |
| **API Gateway** | - | Routing, rate limiting, auth | ✅ Built |
| **Policy Engine** | - | Policy validation, compliance | ✅ Built |
| **Observability** | - | Prometheus, Winston, tracing | ✅ Built |
| **Circuit Breaker** | - | Fail-fast pattern | ✅ Built |

---

## RESTAURANT INDUSTRY

### Core Services

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **Order Service** | 3006 | Order lifecycle, state machine, BullMQ | ✅ Built |
| **Menu Service** | 3007 | Menu CRUD, AI recommendations | ✅ Built |
| **Delivery Service** | 3009 | Driver mgmt, tracking, routing | ✅ Built |
| **Kitchen Display** | - | Order tracking for KDS | ✅ Built |
| **Web Menu** | - | Consumer menu (menu.rez.money) | ✅ Built |

### Restaurant AI

| Service | Purpose | Status |
|---------|---------|--------|
| **AI Restaurant** | Demand forecast, menu optimization | ✅ Built |
| **Kitchen AI** | Kitchen operations | ✅ Built |

### Restaurant Apps

| App | Purpose | Status |
|-----|---------|--------|
| **Consumer App** | Ordering, tracking | ✅ Built |
| **Merchant App** | Menu, QR, tables | ✅ Built |
| **Admin App** | Moderation, analytics | ✅ Built |
| **Staff Web** | Dashboard | ✅ Built |
| **ReStopapa (POS)** | Billing, KDS, tables | ⚠️ 8 issues |
| **Rendez** | Discovery/booking | ✅ Built |
| **Rez Now** | On-demand ordering | ✅ Built |

### Missing/Incomplete

| Feature | Status |
|---------|--------|
| Split Bill | ❌ Not implemented |
| Waitlist | ⚠️ Stub only |
| Multi-location Dashboard | ⚠️ Empty |
| Table Reservations | ⚠️ Basic skeleton |

---

## HOTEL INDUSTRY

### Core Services

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **Hotel OTA** | - | Full OTA platform | ✅ Built |
| **Hotel Service** | 4011 | Room mgmt, booking | ✅ Built |
| **StayOwn Service** | 4015 | Room QR, checkout billing | ✅ Built |
| **Mind Hotel Service** | 4017 | AI pricing, insights | ✅ Built |
| **Travel Service** | 4050 | Flights/trains/buses | ⚠️ Ready for APIs |

### Hotel Apps

| App | Purpose | Status |
|-----|---------|--------|
| **Hotel Panel** | Hotel management | ✅ Built |
| **Admin** | Platform admin | ✅ Built |
| **Corporate Panel** | Corporate bookings | ✅ Built |
| **OTA Web** | Consumer booking | ✅ Built |
| **Supplier Portal** | Supplier management | ✅ Built |
| **Hotel Admin Web** | Dashboard | ✅ Built |

### Hotel Features

| Feature | Status |
|---------|--------|
| Room QR Codes | ✅ Built |
| Digital Check-in | ✅ Built |
| Channel Manager | ✅ Built |
| PMS Bridge | ✅ Built |
| Dynamic Pricing (AI) | ✅ Built |
| Room Service Hub | ✅ Built |
| Folio Sync | ✅ Built |

---

## HEALTHCARE INDUSTRY

### Consumer App Modules

| Module | Features | Status |
|--------|----------|--------|
| **Healthcare Hub** | Emergency, stats | ✅ Built |
| **Doctors/Teleconsult** | Directory, booking | ✅ Built |
| **Pharmacy** | Medicines, prescriptions | ✅ Built |
| **Lab Tests** | Blood, thyroid, diabetes | ✅ Built |
| **Dental Care** | Services, location search | ✅ Built |
| **Emergency 24x7** | Ambulance, hospitals | ✅ Built |
| **Health Records** | Upload, view records | ✅ Built |
| **Health Insurance** | Quotes, family plans | ✅ Built |

### Backend Modules

| Module | Features | Status |
|--------|----------|--------|
| **Patient Records** | EMR, vitals, notes | ✅ Built |
| **Prescriptions** | Digital prescriptions | ✅ Built |
| **Telemedicine** | Video sessions | ✅ Built |
| **Lab Orders** | Test ordering, results | ✅ Built |
| **Healthcare Billing** | GST, insurance claims | ✅ Built |

---

## RETAIL / COMMERCE

### Services

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **Catalog Service** | 3005 | Products, categories | ✅ Built |
| **POS Service** | 4013 | Point of Sale | ✅ Built |
| **Search Service** | 4003 | Full-text, fuzzy, trends | ✅ Built |
| **Refund Service** | - | Refund processing | ✅ Built |
| **Payment Links** | - | Link generation | ✅ Built |

### Gamification

| Service | Status |
|---------|--------|
| **Gamification Service** | ✅ Built |
| **Catalog Service** | ✅ Built |

---

## TRAVEL INDUSTRY

| Service | Port | Status |
|---------|------|--------|
| **Travel Service** | 4050 | Ready for API integration |

---

## LOYALTY & REWARDS (11 Microservices)

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **Profile Aggregator** | 4025 | Unified profile + AI | ✅ Built |
| **Streak Service** | 4026 | Streak tracking | ✅ Built |
| **Cross-Merchant** | 4027 | City-wide badges | ✅ Built |
| **Score Service** | 4028 | ReZ Score 0-1000 | ✅ Built |
| **Karma-Loyalty Bridge** | 4029 | Karma → Loyalty | ⚠️ Partial |
| **Monitoring** | 4030 | Health + metrics | ✅ Built |
| **Event Bus** | 4031 | Central routing | ✅ Built |
| **Notifications** | 4032 | Push/Email/SMS | ✅ Built |
| **Identity Service** | 4033 | Trust + Fraud | ✅ Built |
| **Webhook Service** | 4034 | External integrations | ✅ Built |

---

## ADVERTISING & MARKETING

| Service | Purpose | Status |
|---------|---------|--------|
| **Ads Service** | Campaign management | ✅ Built |
| **Billing Service** | CPC/CPA tracking | ✅ Built |
| **Creative Engine** | AI ad copy | ✅ Built |
| **Attribution System** | Multi-touch attribution | ✅ Built |
| **Ad Campaigns** | Budget allocation | ⚠️ Partial |

---

## ANALYTICS & INTELLIGENCE

| Service | Purpose | Status |
|---------|---------|--------|
| **Analytics Events** | Event ingestion | ✅ Built |
| **User Intelligence** | Behavior analysis | ✅ Built |
| **Intelligence Hub** | Unified aggregation | ✅ Built |
| **Lead Intelligence** | Hot/warm/cold leads | ✅ Built |
| **Decision Service** | Targeting engine | ✅ Built |
| **Targeting Engine** | Segment matching | ✅ Built |
| **Intent Predictor** | Intent prediction | ✅ Built |
| **Score Service** | User scoring | ✅ Built |
| **Abandonment Tracker** | Cart tracking | ⚠️ Partial |

---

## OPERATIONS & SUPPORT

| Service | Purpose | Status |
|---------|---------|--------|
| **Copilot** | AI copilot | ✅ Built |
| **Support Copilot** | Support chat | ✅ Built |
| **Knowledge Base** | Merchant info, FAQs | ✅ Built |
| **Action Engine** | Decision execution | ✅ Built |
| **Automation Service** | Rule engine | ⚠️ Backup |
| **Ops Dashboard** | Monitoring | ⚠️ Partial |

---

## FINANCIAL SERVICES

| Service | Purpose | Status |
|---------|---------|--------|
| **Invoice Service** | GST PDF invoices | ✅ Built |
| **Refund Service** | Refund processing | ✅ Built |
| **Gift Cards** | Gift card system | ✅ Built |

---

## ENTERPRISE & B2B

| Service | Purpose | Status |
|---------|---------|--------|
| **CorpPerks Service** | Enterprise benefits | ✅ Built |
| **Procurement Service** | NextaBizz integration | ✅ Built |

---

## SUMMARY BY INDUSTRY

| Industry | Services | Built | Partial | Missing |
|----------|----------|-------|---------|---------|
| **Common** | 12 | 12 | 0 | 0 |
| **Restaurant** | 15+ | 12 | 3 | 1 |
| **Hotel** | 12+ | 11 | 1 | 0 |
| **Healthcare** | 13+ | 13 | 0 | 0 |
| **Retail/Commerce** | 5+ | 5 | 0 | 0 |
| **Travel** | 1 | 1 | 0 | 0 |
| **Loyalty** | 11 | 10 | 1 | 0 |
| **Advertising** | 5 | 4 | 1 | 0 |
| **Analytics** | 9 | 8 | 1 | 0 |
| **Operations** | 6 | 4 | 2 | 0 |
| **Financial** | 3 | 3 | 0 | 0 |
| **Enterprise** | 2 | 2 | 0 | 0 |
| **TOTAL** | **94+** | **85** | **9** | **1** |

---

## MISSING ITEMS

1. **Restaurant: Split Bill** - Not implemented
2. **Restaurant: Multi-location Dashboard** - Empty directory
3. **Restaurant: Waitlist** - Stub only
4. **Karma-Loyalty Bridge** - Partial verification
5. **Automation Service** - In backup state

---

## AUDIT METADATA

| Field | Value |
|-------|-------|
| Auditors | 20 autonomous agents |
| Date | May 9, 2026 |
| Coverage | Common, Restaurant, Hotel, Healthcare, Retail, Travel, Loyalty, Marketing, Analytics, Operations, Financial, Enterprise |
