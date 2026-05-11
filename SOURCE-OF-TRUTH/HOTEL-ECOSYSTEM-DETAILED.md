# HOTEL ECOSYSTEM - COMPLETE TECHNICAL DOCUMENTATION
**Version:** 1.0
**Date:** May 8, 2026

---

# TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [Services Deep Dive](#services-deep-dive)
3. [Data Flows](#data-flows)
4. [Database Schemas](#database-schemas)
5. [API Reference](#api-reference)
6. [App Screens](#app-screens)
7. [Security](#security)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Deployment](#deployment)

---

# ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HOTEL ECOSYSTEM ARCHITECTURE │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ APPS │
│ │ ├─ Consumer App (rez-app-consumer) - Guest-facing │ │
│ │ └─ Merchant App (rez-app-merchant) - Staff-facing │
│ └─────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ BACKEND SERVICES │
│ │ │
│ │ ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐ │ │
│ │ │StayOwn │ │Hotel-PMS│ │REZ Mind │ │REZ-Support│ │
│ │ │ (4015) │ │ (3008) │ │ (4017) │ │ Copilot │ │
│ │ │ │ │ │ │ │ (4033) │ │
│ │ └────┬────┘ └────┬────┘ └────┬─────┘ └────┬─────┘ │ │
│ │ │ │ │ │ │ │ │
│ │ └────┼───────────┼─────────┼─────┘ │
│ │ │ │ │ │
│ └────┼──────────┼─────────┘ │
│ │ │ │
│ │ ┌────┴─────────┴────┐ │
│ │ │ SHARED INFRASTRUCTURE │ │
│ │ ├─ MongoDB (rez_stayown, rez_mind_hotel) │ │
│ │ ├─ PostgreSQL (hotel_pms) │ │
│ │ ├─ Redis (cache, queues, rate limiting) │ │
│ │ ├─ Razorpay (payments) │ │
│ │ └─ MSG91/WhatsApp (notifications) │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ │
│ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ EXTERNAL SYSTEMS │ │
│ ├─ Guest Email/SMS/WhatsApp │
│ ├─ Hotel Channel Managers (Booking.com, Expedia) │
│ └─ Airport Transport, Local Services │
│ │
└─────────────────────────────────────────────────────────────────┘
```

---

# SERVICES DEEP DIVE

## 1. STAYOWN SERVICE (Port 4015)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-stayown-service`

### Purpose
Guest-facing hotel booking and room service platform

### Technology Stack
- Node.js + Express + TypeScript
- MongoDB for persistence
- JWT for authentication
- Redis for rate limiting

### Core Modules

```typescript
// Service Architecture
src/
├── routes/
│   ├── stayownRoutes.ts      // Hotel search, booking
│   ├── room-qr-routes.ts     // QR management
│   ├── room-qr-manager.routes.ts // Room-bound QR system
│   ├── room-service-hub.routes.ts // Service ordering
│   ├── pms-webhooks.ts       // PMS integration
│   └── merchant-qr.routes.ts   // Staff scanning
├── services/
│   ├── room-qr-manager.ts    // QR logic
│   ├── payment-service.ts    // Razorpay
│   ├── feedback-service.ts   // Guest feedback
│   ├── sla-monitor.ts      // SLA tracking
│   └── notification-service.ts // Email/SMS/WhatsApp
└── middleware/
    ├── auth.ts              // JWT validation
    └── rateLimiter.ts        // Per-endpoint limits
```

### Key Features

| Feature | Description |
|---------|-------------|
| Hotel Search | City-based search with filters |
| Booking | Hold → Confirm → Cancel flow |
| Room QR | Pre-generated, room-bound |
| Room Service Hub | Food, housekeeping, spa, transport |
| AI Chat | Conversational ordering |
| Feedback | Star ratings, NPS |
| Checkout | Itemized bill, Razorpay |
| Webhooks | PMS synchronization |

---

## 2. HOTEL-PMS (Port 3008)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/Hotel-OTA`

### Purpose
Property Management System for hotel operations

### Technology Stack
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Redis for jobs/queues

### Core Modules

```typescript
apps/api/src/
├── routes/
│   ├── booking.routes.ts        // Hold, confirm, cancel
│   ├── hotel.routes.ts          // Inventory, rates
│   ├── staff.routes.ts          // Staff management
│   ├── room.routes.ts          // Housekeeping, status
│   ├── pms-ota-webhooks.ts     // Inbound webhooks
│   └── webhook/                 # Outbound webhooks
├── services/
│   ├── booking.service.ts       // Booking logic
│   ├── room.service.ts          # Room operations
│   └── staff.service.ts         # Staff management
└── jobs/
    └── queues.ts               # Background jobs
```

### Key Features

| Feature | Description |
|---------|-------------|
| Booking Engine | Hold (10min), Confirm, Cancel |
| Inventory | Room types, rates, availability |
| Housekeeping | Task queue, staff assignment |
| Front Desk | Check-in, check-out |
| Settlement | OTA coins, hotel payout |
| Webhooks | Real-time PMS ↔ OTA sync |

---

## 3. REZ MIND HOTEL (Port 4017)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-mind-hotel-service`

### Purpose
AI/ML for hotel optimization

### AI Models

```typescript
services/ai-service.ts
├── getRecommendations()    // Hotel suggestions
├── getDynamicPricing()      // Demand-based rates
├── predictSatisfaction()   // Guest NPS prediction
└── predictSLA()          // Service time prediction
```

---

## 4. REZ-SUPPORT-COPILOT (Port 4033)

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-support-copilot`

### Hotel Intents

```javascript
// Intent patterns
const HOTEL_INTENTS = {
  hotel_search: /hotels?\s*(in|@|searching).*/i,
  room_service: /order\s+(food|breakfast|dinner)/i,
  housekeeping: /(clean|towels|extra\s+(bedding|soap)/i,
  checkout: /checkout|checking out/i,
  complaint: /(issue|problem|not\s+(working|happy)/i
};
```

---

# DATA FLOWS

## Booking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ BOOKING LIFECYCLE │
├─────────────────────────────────────────────────────────────┤
│ │
│ 1. GUEST SEARCHES │
│ Consumer App → StayOwn /search → MongoDB │
│ │
│ 2. HOLD PLACED │
│ StayOwn → Hotel-PMS /hold → PostgreSQL │
│ Reservation locked for 10 minutes │
│ │
│ 3. PAYMENT │
│ Guest pays via Razorpay │
│ │
│ 4. CONFIRM │
│ StayOwn ← PMS /confirm │
│ Booking status: "confirmed" │
│ │
│ 5. CHECK-IN AT HOTEL │
│ Staff assigns Room 101 in PMS │
│ PMS webhook → StayOwn /webhooks/pms/check-in │
│ │
│ 6. ROOM QR ACTIVATED │
│ Guest receives WhatsApp/SMS │
│ │
│ 7. STAY │
│ Guest orders room service │
│ │
│ 8. CHECKOUT │
│ Bill generated, payment collected │
│ PMS webhook → StayOwn /webhooks/pms/check-out │
│ │
└──────────────────────────────────────────────────────────────┘
```

## Room QR Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ROOM QR SCAN FLOW │
├────────────────────────────────────────────────────────────┤
│ │
│ 1. STAFF SCANS QR │
│ Merchant App → POST /api/merchant/scan │
│ │
│ 2. VALIDATE TOKEN │
│ JWT signature verified │
│ Room lookup in MongoDB │
│ │
│ 3. GET CONTEXT │
│ Room linked guest, booking, stay dates │
│ │
│ 4. STAFF ACTION │
│ Check-in, verify access, create request │
│ │
│ 5. KITCHEN/HK RECEIVES │
│ Real-time notification │
│ │
└──────────────────────────────────────────────────────────
```

## Webhook Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ WEBHOOK FLOW │
├─────────────────────────────────────────────────────────────┤
│ │
│ INBOUND (PMS → StayOwn) │
│ POST /webhooks/pms/check-in │
│ POST /webhooks/pms/check-out │
│ POST /webhooks/pms/booking-update │
│ │
│ SECURITY │
│ ├─ HMAC-SHA256 signature │
│ ├─ 5-minute timestamp tolerance │
│ ├─ 24-hour event dedup │
│ └─ Rate limiting (100/min) │
│ │
│ OUTBOUND (StayOwn → PMS) │
│ POST /v1/bookings/hold │
│ POST /v1/bookings/confirm │
│ POST /v1/room-service/charge │
│ │
└─────────────────────────────────────────────────────────
```

---

# DATABASE SCHEMAS

## MongoDB (StayOwn)

```javascript
// Room QR Template (pre-generated per room)
{
  _id: ObjectId,
  roomId: "R101",
  roomNumber: "101",
  hotelId: "H001",
  token: "jwt...",
  currentLink: {
    bookingId: "BK123",
    guestId: "G001",
    guestName: "John Doe",
    checkedInAt: ISODate(),
    checkOut: ISODate(),
    expiresAt: ISODate()
  },
  isActive: true,
  useCount: 15,
  lastUsedAt: ISODate()
}

// Service Request
{
  _id: ObjectId,
  roomId: "R101",
  requestType: "food",
  items: [{ name: "Breakfast", qty: 2, pricePaise: 110000 }],
  status: "pending" | "acknowledged" | "in_progress" | "completed",
  createdAt: ISODate()
}
```

## PostgreSQL (Hotel-PMS)

```sql
-- Booking with room assignment
CREATE TABLE "Booking" (
  id UUID PRIMARY KEY,
  booking_ref VARCHAR(20) UNIQUE,
  user_id UUID,
  hotel_id UUID,
  room_type_id UUID,
  room_id UUID, -- Physical room assigned at check-in
  status VARCHAR(20),
  checkin_date DATE,
  checkout_date DATE,
  total_value_paise INT
);

-- Staff with roles
CREATE TABLE "HotelStaff" (
  id UUID PRIMARY KEY,
  hotel_id UUID,
  role VARCHAR(20), -- 'frontdesk', 'housekeeping', 'manager'
  permissions JSONB
);

-- Service Request
CREATE TABLE "ServiceRequest" (
  id UUID PRIMARY KEY,
  room_id UUID,
  request_type VARCHAR(20),
  status VARCHAR(20),
  assigned_to UUID,
  SLA_due_at TIMESTAMPTZ
);
```

---

# API REFERENCE

## StayOwn Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/hotels/search | Search hotels |
| GET | /api/hotels/:id | Hotel details |
| POST | /api/hotels/bookings | Create hold |
| GET | /api/room-qr/:id | QR details |
| POST | /api/room-qr/manager/link | Link guest to room |
| POST | /api/room-service/order | Place order |
| POST | /api/room-service/checkout | Process payment |
| GET | /api/analytics/revenue | Hotel revenue |

## Hotel-PMS Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/bookings/hold | Reserve room |
| POST | /v1/bookings/confirm | Confirm booking |
| GET | /v1/hotel/dashboard | Stats |
| POST | /v1/staff/requests | Service queue |
| GET | /v1/room/status | Room availability |
| POST | /v1/payments/webhook | Payment updates |

## Webhook Payloads

```typescript
// Check-in webhook (PMS → StayOwn)
interface CheckInWebhook {
  event: "check_in";
  bookingId: string;
  roomId: string;
  roomNumber: string;
  guestName: string;
  checkInTime: string;
}

// Order webhook (StayOwn → PMS)
interface ServiceRequestWebhook {
  event: "service_request";
  roomId: string;
  requestType: string;
  items: OrderItem[];
  guestName: string;
}
```

---

# APP SCREENS

## Consumer App - Room Hub

```
Room Service Hub
├── Header: Hotel name, Room number
├── Quick Actions
│   ├── Order Now → Menu grid
│   ├── My Orders → Order tracking
│   ├── Bill → Checkout
│   ├── Offers → Deals
│   ├── Feedback → Ratings
│   └── Help → AI Chat
├── Service Categories
│   ├── Food & Dining
│   ├── Housekeeping
│   ├── Spa & Wellness
│   ├── Laundry
│   ├── Transport
│   └── Concierge
├── Stay Info
│   ├── Check-in/out dates
│   └── Amenities
└── AI Chat FAB

Order Flow
├── Categories → Menu Items
├── Add to Cart → Checkout
├── Payment → Confirmation
└── Order Tracking → Complete
```

## Merchant App - Staff Dashboard

```
Staff Features
├── QR Scanner
├── Service Queue
│   ├── Pending requests
│   ├── In Progress
│   └── Completed today
├── Room Status
│   ├── Available
│   ├── Occupied
│   ├── Dirty
│   └── Maintenance
└── Analytics
    ├── SLA metrics
    └── Revenue today
```

---

# SECURITY

## Authentication

| Layer | Method |
|-------|--------|
| Guest API | JWT Bearer token |
| Staff API | Session + RBAC |
| Webhooks | HMAC-SHA256 |
| Rate Limiting | Redis + memory fallback |

## Rate Limits

| Endpoint | Limit |
|----------|--------|
| Booking hold | 10/min |
| QR validation | 60/min |
| Service order | 30/min |
| Checkout | 5/min |
| Search | 100/min |

---

# ERROR HANDLING

```typescript
// Standard error response
interface APIError {
  success: false;
  message: string;       // Human-readable
  code: string;         // Machine-readable
  details?: object;      // Debug info
}

// Error codes
const ErrorCodes = {
  BOOKING_HOLD_EXPIRED: "E001",
  ROOM_NOT_AVAILABLE: "E002",
  PAYMENT_FAILED: "E003",
  INVALID_TOKEN: "E004",
  SLA_BREACHED: "E005"
};
```

---

# TESTING

## Test Coverage

| Type | Coverage | Tool |
|------|----------|-------|
| Unit | 70% | Jest |
| Integration | 50% | Supertest |
| E2E | 30% | Playwright |
| Load | Manual | k6 |

## Key Test Scenarios

1. Booking hold → confirm → cancel
2. QR scan → order → fulfill → checkout
3. Webhook delivery → idempotency
4. Rate limit burst → 429 response
5. Token expiry → refresh flow

---

# DEPLOYMENT

## Docker Compose

```yaml
services:
  stayown:
    image: rez-stayown:latest
    ports:
      - "4015:4015"
    environment:
      - MONGODB_URI=mongodb://mongo:27017
  hotel-pms:
    image: hotel-pms:latest
    ports:
      - "3008:3008"
    environment:
      - DATABASE_URL=postgresql://postgres:5432
  rez-mind:
    image: rez-mind:latest
    ports:
      - "4017:4017"
```

## Health Checks

| Service | Endpoint | Expected |
|----------|-----------|--------|
| StayOwn | GET /health | status: ok |
| Hotel-PMS | GET /health | status: ok |
| REZ Mind | GET /health | status: ok |

---

# MONITORING

## Metrics

- Booking conversion rate
- QR scan rate
- SLA compliance (target: <15min response)
- Revenue per available room (RevPAR)
- NPS score
- Error rate (<1% target)

## Alerts

| Alert | Threshold |
|-------|-----------|
| High error rate | >1% |
| Slow checkout | >5min avg |
| SLA breach | >20min response |
| DB connection | Pool >80% |
| Queue depth | >100 pending |

---

**Document Complete**</parameter>
