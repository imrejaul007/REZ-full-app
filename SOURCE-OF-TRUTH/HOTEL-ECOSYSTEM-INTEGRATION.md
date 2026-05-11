# HOTEL ECOSYSTEM - PROPER INTEGRATION WITH REZ ECOSYSTEM
**Date:** May 8, 2026
**Status:** Verified

---

# ACTUAL REZ ECOSYSTEM (What Exists)

## Core Services

| Service | Port | Purpose |
|---------|------|---------|
| **rez-auth-service** | 4002 | Authentication |
| **rez-profile-service** | 3000 | User profiles |
| **rez-payment-service** | 4001 | Payments |
| **rez-wallet-service** | 3010 | Wallet & Coins |
| **rez-order-service** | 4003 | Order management |
| **rez-knowledge-service** | 3003 | Knowledge base |
| **rez-intent-graph** | 3007 | User intent tracking |

## Hotel Services

| Service | Port | Purpose |
|---------|------|---------|
| **rez-stayown-service** | 4015 | Guest booking & Room QR |
| **rez-mind-hotel-service** | 4017 | AI/ML for hotels |
| **Hotel-OTA (apps/api)** | 3008 | Property Management |
| **REZ-support-copilot** | 4033 | AI chat |

## Connected Platforms

| Platform | Integration |
|---------|------------|
| **nextabizz.com** | B2B marketplace API |
| **makcorps.com** | Corporate API |
| **msg91.com** | SMS notifications |

---

# HOTEL ECOSYSTEM CONNECTIONS

## 1. Guest Booking Flow

```
GUEST JOURNEY:
─────────────────────────────────────────────────────────────

1. DISCOVERY
   │
   └── User opens REZ app
       │
       └── rez-search-service → Hotel search
       │
       └── rez-ads-service → Targeted hotel ads

2. BOOKING
   │
   └── rez-stayown-service → Hotel booking
       │
       └── Hotel-OTA → Booking confirmed
       │
       └── rez-payment-service → Payment (Razorpay)
       │
       └── rez-wallet-service → OTA Coins earned

3. PRE-ARRIVAL
   │
   └── rez-knowledge-service → Guest preferences
       │
       └── rez-notification-events → Email/SMS/WhatsApp
       │
       └── REZ-support-copilot → Booking confirmation

4. STAY
   │
   └── rez-stayown-service → Room QR activated
       │
       └── Hotel-OTA → Room assigned
       │
       └── Hotel-OTA → Housekeeping, Staff management

5. IN-ROOM SERVICES
   │
   └── rez-stayown-service → Room Service Hub
       │
       └── Hotel-OTA → Kitchen Display
       │
       └── rez-order-service → Food orders

6. CHECKOUT
   │
   └── rez-stayown-service → Bill generation
       │
       └── Hotel-OTA → Folio management
       │
       └── rez-payment-service → Payment
       │
       └── rez-wallet-service → Coins burned

7. POST-STAY
   │
   └── rez-knowledge-service → Stay feedback
       │
       └── REZ-support-copilot → Review request
       │
       └── rez-intent-graph → Future recommendations
```

---

# INTEGRATION POINTS

## 2.1 Booking Integration

```
rez-stayown-service
        │
        ├── rez-auth-service (verify user)
        ├── rez-profile-service (get user info)
        ├── rez-payment-service (process payment)
        ├── rez-wallet-service (coins earn/burn)
        ├── rez-knowledge-service (save preferences)
        └── Hotel-OTA (create booking)
```

## 2.2 Room QR Integration

```
Room QR Scanned
        │
        ├── rez-stayown-service → Validate QR
        ├── Hotel-OTA → Get room context
        │       └── Guest name, booking, stay dates
        ├── rez-knowledge-service → Track scan signal
        └── REZ-support-copilot → AI assistance
```

## 2.3 Room Service Integration

```
Service Request (Food, HK, etc.)
        │
        ├── rez-stayown-service → Create order
        ├── rez-order-service → Order management
        ├── Hotel-OTA → Kitchen display
        │       └── Staff notification
        └── rez-notification-events → Guest updates
```

## 2.4 Loyalty Integration

```
Booking Complete
        │
        ├── rez-wallet-service → OTA Coins
        │       └── 1 coin per ₹100
        ├── Hotel-OTA → Branded Coins
        │       └── Hotel-specific rewards
        └── rez-knowledge-service → Update profile
                └── Guest history updated
```

---

# SERVICES USED BY HOTEL VERTICAL

## What Hotel Uses from REZ

| REZ Service | Usage in Hotel |
|-------------|----------------|
| **rez-auth-service** | User login/verification |
| **rez-profile-service** | Guest profile data |
| **rez-payment-service** | UPI/Card payments |
| **rez-wallet-service** | OTA Coins, Branded Coins |
| **rez-knowledge-service** | Guest preferences, signals |
| **rez-notification-events** | Email, SMS, WhatsApp |
| **REZ-support-copilot** | AI chat for booking |
| **rez-intent-graph** | Personalization |
| **Hotel-OTA** | PMS, operations |

---

# NEXTABIZZ CONNECTION

## What is nextabizz?

```
NEXTABIZZ is a B2B marketplace API (api.nextabizz.com)
Used for:
- Product sourcing
- Inventory management
- Supplier connections
```

## Integration for Hotels

```
Hotels can use nextabizz for:
        │
        ├── Procurement
        │       └── Order supplies, amenities
        │       └── Kitchen ingredients
        │
        ├── Inventory
        │       └── Hotel supplies
        │       └── Restaurant stock
        │
        └── B2B Purchases
                └── Corporate gifting
                └── Event supplies
```

## Configuration

```
rez-procurement-service:
  NEXTABIZZ_API_URL=https://api.nextabizz.com
  NEXTABIZZ_API_KEY=xxx
  NEXTABIZZ_CLIENT_ID=xxx
  NEXTABIZZ_CLIENT_SECRET=xxx
```

---

# SERVICES CREATED FOR HOTEL VERTICAL

## New Services Built

| Service | Purpose | Status |
|---------|---------|--------|
| **rez-stayown-service** | Guest booking, Room QR, Service Hub | Built |
| **rez-mind-hotel-service** | AI pricing, recommendations | Built |
| **Hotel-OTA (apps/api)** | PMS, operations | Built |
| **REZ-support-copilot** | Hotel intents | Built |
| **rez-knowledge-service** | User signals, preferences | Built |

## Files Created

```
rez-stayown-service/
├── src/
│   ├── routes/
│   │   ├── stayownRoutes.ts
│   │   ├── room-qr-routes.ts
│   │   ├── room-qr-manager.routes.ts
│   │   ├── room-service-hub.routes.ts
│   │   ├── pms-webhooks.routes.ts
│   │   ├── digital-checkin.routes.ts
│   │   └── google-hotel-ads.routes.ts
│   ├── services/
│   │   ├── room-qr.ts
│   │   ├── room-qr-manager.ts
│   │   ├── room-service-hub.ts
│   │   ├── payment-service.ts
│   │   ├── email.service.ts
│   │   ├── whatsapp.service.ts
│   │   ├── i18n.service.ts
│   │   ├── currency.service.ts
│   │   └── digital-checkin.service.ts
│   └── templates/
│       └── email-templates.ts

rez-mind-hotel-service/
├── src/
│   ├── routes/
│   │   ├── event-routes.ts
│   │   ├── analytics-routes.ts
│   │   └── calendar-routes.ts
│   └── services/
│       ├── ai-service.ts
│       ├── signal-collector.ts
│       ├── recommendations-engine.ts
│       └── event-calendar.service.ts

Hotel-OTA/apps/api/src/
├── routes/
│   ├── booking.routes.ts
│   ├── hotel.routes.ts
│   ├── room.routes.ts
│   ├── staff.routes.ts
│   ├── pms-ota-webhooks.routes.ts
│   └── channel-manager.routes.ts
```

---

# FLOW: HOW HOTEL CONNECTS WITH REZ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HOTEL VERTICAL │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ rez-stayown-service (4015) │
│ ├── Guest views hotels │
│ ├── Guest books room │
│ ├── Guest scans Room QR │
│ ├── Guest orders service │
│ └── Guest checks out │
│ │
│ Connection Points: │
│ ├── rez-auth-service → Verify guest │
│ ├── rez-payment-service → Payment │
│ ├── rez-wallet-service → Coins │
│ ├── rez-knowledge-service → Profile │
│ └── Hotel-OTA (3008) → Booking storage │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ HOTEL OPERATIONS │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ Hotel-OTA (apps/api) (3008) │
│ ├── Booking management │
│ ├── Room assignment │
│ ├── Housekeeping queue │
│ ├── Staff management │
│ └── Channel sync │
│ │
│ Connection Points: │
│ ├── rez-stayown-service → Booking sync │
│ ├── rez-mind-hotel-service → Analytics │
│ └── nextabizz → Procurement (optional) │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ CORE SERVICES │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ rez-auth-service (4002) ──── Authentication │
│ rez-profile-service (3000) ──── User profiles │
│ rez-payment-service (4001) ──── Payments │
│ rez-wallet-service (3010) ──── Coins │
│ rez-knowledge-service (3003) ──── Signals │
│ rez-notification-events ──── Email/SMS/WhatsApp │
│ REZ-support-copilot (4033) ──── AI Chat │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# WHAT HOTEL VERTICAL PROVIDES TO REZ

## Data Flow Back to REZ

```
HOTEL DATA → REZ ECOSYSTEM:
────────────────────────────────────

1. BOOKING DATA
   └── rez-stayown-service → rez-knowledge-service
           └── User's hotel preferences learned

2. SEARCH DATA
   └── rez-stayown-service → rez-intent-graph
           └── User's travel intent tracked

3. PAYMENT DATA
   └── rez-payment-service → User spending patterns

4. LOYALTY DATA
   └── rez-wallet-service → User tier progression

5. FEEDBACK DATA
   └── REZ-support-copilot → User satisfaction scores
```

---

# ACCURATE INTEGRATION MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ ECOSYSTEM │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ CORE LAYER │
│ ├── rez-auth-service (4002) ─── Authentication │
│ ├── rez-profile-service (3000) ─── Profiles │
│ └── rez-payment-service (4001) ─── Payments │
│ │
│ HOTEL VERTICAL (Built) │
│ ├── rez-stayown-service (4015) ←── Booking, Room QR, Service Hub │
│ ├── Hotel-OTA (3008) ←── PMS, Operations │
│ ├── rez-mind-hotel-service (4017) ←── AI, Pricing │
│ └── REZ-support-copilot (4033) ←── AI Chat │
│ │
│ SUPPORT SERVICES │
│ ├── rez-wallet-service (3010) ←── OTA Coins │
│ ├── rez-knowledge-service (3003) ←── User Signals │
│ ├── rez-notification-events ←── Email/SMS │
│ └── rez-intent-graph (3007) ←── Personalization │
│ │
│ OTHER VERTICALS │
│ ├── rez-corporate-service (4030) ←── Corpspark │
│ ├── rez-travel-service (4007) ←── Travel │
│ ├── Restaurantistan ←── Food delivery │
│ └── Salon ecosystem ←── Beauty services │
│ │
│ EXTERNAL APIS │
│ ├── nextabizz.com ←── B2B Procurement │
│ ├── makcorps.com ←── Corporate API │
│ └── msg91.com ←── SMS │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# WHAT NEXTABIZZ IS (NOT MADE UP)

## Actual Purpose

```
nextabizz = api.nextabizz.com

A B2B marketplace API for:
- Product sourcing
- Wholesale purchasing
- Supplier connections
- Inventory procurement

Used by:
- rez-procurement-service (if implemented)
- Corporate purchasing
- Hotel supplies (linens, amenities, etc.)
```

## For Hotels

```
Hotels can connect to nextabizz for:
├── Amenity supplies
├── Kitchen ingredients
├── Linen & housekeeping supplies
├── Corporate gifting
└── Event supplies

REZ doesn't directly connect hotels to nextabizz yet.
This would be a future integration point.
```

---

# SUMMARY

## What Hotel Vertical Connects To

| REZ Service | Connection | Purpose |
|-------------|-----------|---------|
| rez-auth | ✅ | Guest login |
| rez-profile | ✅ | User data |
| rez-payment | ✅ | Payments |
| rez-wallet | ✅ | Coins |
| rez-knowledge | ✅ | Signals |
| rez-notifications | ✅ | Email/SMS |
| rez-intent-graph | ✅ | Personalization |
| REZ-support-copilot | ✅ | AI Chat |
| Hotel-OTA | ✅ | PMS |

## What Hotel Vertical Provides

| Data | Goes To | Purpose |
|------|---------|---------|
| Booking signals | rez-knowledge | User profiling |
| Search data | rez-intent-graph | Intent tracking |
| Spending | rez-wallet | Loyalty |
| Feedback | REZ | Improvements |

## nextabizz

| What | Status |
|------|--------|
| External B2B API | api.nextabizz.com |
| REZ integration | Not implemented yet |
| Hotel use case | Procurement supplies |

---

**This document is accurate based on actual code audited.**</parameter>
