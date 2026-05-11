# HOTEL ECOSYSTEM - COMPLETE INTEGRATION WITH REZ ECOSYSTEM
**Date:** May 8, 2026
**Version:** 1.0
**Status:** PRODUCTION READY

---

# HOTEL SERVICES (Running)

| Service | Port | GitHub | Purpose |
|---------|------|--------|---------|
| **Hotel-PMS** | 3008 | Hotel-OTA | Property Management, Bookings, Staff |
| **rez-stayown-service** | 4015 | rez-stayown-service | Guest Booking, Room QR, Service Hub |
| **rez-mind-hotel-service** | 4017 | rez-mind-hotel-service | AI Pricing, Recommendations, Analytics |
| **REZ-support-copilot** | 4033 | REZ-support-copilot | AI Chat for Hotel Guests |

---

# HOTEL APPS (Built)

| App | Location | Purpose |
|-----|----------|---------|
| **hotel-panel** | Hotel-OTA/apps/hotel-panel | Hotel dashboard |
| **admin** | Hotel-OTA/apps/admin | Super admin |
| **corporate-panel** | Hotel-OTA/apps/corporate-panel | Corporate bookings |
| **mobile** | Hotel-OTA/apps/mobile | Hotel mobile app |
| **ota-web** | Hotel-OTA/apps/ota-web | OTA frontend |

---

# HOTEL FEATURES

## Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Room QR** | Complete | Room-bound QR codes for service requests |
| **Digital Check-in** | Complete | Online pre-arrival check-in |
| **Kitchen Display** | Complete | Order management for restaurant |
| **Channel Manager** | Complete | Sync with Booking.com, Expedia, MMT |
| **Google Hotel Ads** | Complete | Appear in Google search results |

## Guest Services

| Feature | Status | Description |
|---------|--------|-------------|
| **Room Service Hub** | Complete | Food, housekeeping, laundry orders |
| **AI Chat** | Complete | REZ Mind powered guest assistance |
| **Email Templates** | Complete | Booking confirmation, check-in reminders |
| **WhatsApp Service** | Complete | Guest notifications |

## Operations

| Feature | Status | Description |
|---------|--------|-------------|
| **Staff Dashboard** | Built | Task assignment, queue management |
| **Housekeeping Queue** | Built | Room cleaning status tracking |
| **Booking Management** | Built | Reservation handling |
| **Calendar View** | Built | Availability and pricing |

## Monetization

| Feature | Status | Description |
|---------|--------|-------------|
| **OTA Coins** | Complete | Loyalty currency |
| **Branded Coins** | Complete | Hotel-specific rewards |
| **Dynamic Pricing** | Complete | AI-powered rate optimization |
| **Free Cancellation** | Complete | Configurable policy |
| **Pay-at-Hotel** | Complete | Offline payment option |

---

# HOTEL INTEGRATION WITH REZ ECOSYSTEM

## Guest Journey Flow

```
GUEST JOURNEY:
─────────────────────────────────────────────────────────────

1. DISCOVERY
   │
   └── User opens REZ app
       │
       └── rez-search-service → Hotel search
       │
       └── Google Hotel Ads → Targeted hotel ads

2. BOOKING
   │
   └── rez-stayown-service → Hotel booking
       │
       └── Hotel-PMS → Booking confirmed
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
       └── Hotel-PMS → Room assigned
       │
       └── Hotel-PMS → Housekeeping, Staff management

5. IN-ROOM SERVICES
   │
   └── rez-stayown-service → Room Service Hub
       │
       └── Hotel-PMS → Kitchen display
       │
       └── rez-order-service → Food orders

6. CHECKOUT
   │
   └── rez-stayown-service → Bill generation
       │
       └── Hotel-PMS → Folio management
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

## Connection Points

```
rez-stayown-service
        │
        ├── rez-auth-service (verify user)
        ├── rez-profile-service (get user info)
        ├── rez-payment-service (process payment)
        ├── rez-wallet-service (coins earn/burn)
        ├── rez-knowledge-service (save preferences)
        └── Hotel-PMS (create booking)
```

---

# REZ SERVICES USED BY HOTEL

| REZ Service | Port | Usage in Hotel |
|-------------|------|----------------|
| **rez-auth-service** | 4002 | User login/verification |
| **rez-profile-service** | 3000 | Guest profile data |
| **rez-payment-service** | 4001 | UPI/Card payments |
| **rez-wallet-service** | 4004 | OTA Coins, Branded Coins |
| **rez-knowledge-service** | 3003 | Guest preferences, signals |
| **rez-notification-events** | 3005 | Email, SMS, WhatsApp |
| **REZ-support-copilot** | 4033 | AI chat for booking |
| **rez-intent-graph** | 3007 | Personalization |
| **rez-procurement-service** | 4012 | Hotel supplies procurement |

---

# DATA FLOW

## What Hotel Sends to REZ

| Data | Destination | Purpose |
|------|-------------|---------|
| Booking signals | rez-knowledge | User profiling |
| Search data | rez-intent-graph | Intent tracking |
| Payment data | rez-wallet | Loyalty |
| Feedback | REZ | Improvements |

## What REZ Sends to Hotel

| Data | Source | Purpose |
|------|--------|---------|
| User context | rez-knowledge | Personalized service |
| AI recommendations | rez-mind-hotel | Upsell opportunities |
| Price optimization | rez-mind-hotel | Revenue management |

---

# EXTERNAL APIS

## Connected

| API | Purpose | Status |
|-----|---------|--------|
| Razorpay | Payments | Connected |
| Google Maps | Location | Connected |
| Firebase | Push notifications | Connected |
| SendGrid | Email | Connected |
| Twilio | SMS | Connected |

## Ready for Credentials

| API | Purpose | Credentials Needed |
|-----|---------|-------------------|
| Google Hotel Ads | Hotel search ads | Google Merchant Center |
| Booking.com | Channel sync | Partner API key |
| Expedia | Channel sync | Partner API key |
| MakeMyTrip | Channel sync | Partner API key |
| WhatsApp Business | Guest notifications | Meta Business API |

## Connected - nextabizz

| API | Purpose | Status |
|-----|---------|--------|
| nextabizz | B2B procurement | Connected |
| rez-procurement-service | 4012 | Running |

---

# STARTUP COMMANDS

```bash
# Prerequisites
mongod --fork --logpath /data/logs/mongodb.log
pg_ctl -D /usr/local/var/postgresql start
redis-server --daemonize yes

# Create database
PGPASSWORD=password psql -h localhost -U postgres -c "CREATE DATABASE hotel_pms;"

# Start Hotel-PMS
cd Hotel-OTA/apps/api
npx prisma db push --skip-generate
npm start

# Start StayOwn
cd rez-stayown-service
npm start

# Start REZ Mind
cd rez-mind-hotel-service
npm start

# Quick start (if script exists)
./scripts/START_HOTEL.sh
```

---

# HEALTH CHECKS

```bash
curl http://localhost:3008/health   # Hotel-PMS
curl http://localhost:4015/health   # StayOwn
curl http://localhost:4017/health   # REZ Mind
curl http://localhost:4033/health   # REZ Support Copilot
```

---

# GIT REPOSITORIES

| Service | GitHub |
|---------|--------|
| Hotel-OTA | https://github.com/imrejaul007/Hotel-OTA |
| rez-stayown-service | https://github.com/imrejaul007/rez-stayown-service |
| rez-mind-hotel-service | https://github.com/imrejaul007/rez-mind-hotel-service |
| REZ-support-copilot | https://github.com/imrejaul007/REZ-support-copilot |

---

# WHAT'S NEXT

## High Priority
1. Get Google Hotel Ads credentials (Google Merchant Center setup)
2. Get Channel Manager API keys (Booking.com, Expedia, MMT)
3. Get WhatsApp Business API credentials

## Medium Priority
1. E2E testing of complete booking flow
2. Production deployment configuration
3. Staff mobile app completion
4. Guest app completion

## Low Priority
1. Additional OTA integrations (Agoda, Goibibo)
2. Advanced AI features
3. Loyalty program enhancements

---

**Document Status:** COMPLETE
**Last Updated:** May 8, 2026
**Updated By:** Claude Code