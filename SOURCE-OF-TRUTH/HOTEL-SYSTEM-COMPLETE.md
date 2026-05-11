# HOTEL ECOSYSTEM - COMPLETE DOCUMENTATION

**Version:** 1.0
**Date:** May 7, 2026
**Status:** FULLY IMPLEMENTED

---

## TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [Service Definitions](#service-definitions)
3. [API Endpoints](#api-endpoints)
4. [Database Models](#database-models)
5. [Feature Matrix](#feature-matrix)
6. [Integration Points](#integration-points)
7. [Room QR System](#room-qr-system)
8. [REZ Mind Integration](#rez-mind-integration)
9. [Deployment](#deployment)

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HOTEL ECOSYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │   STAYOWN      │     │   HOTEL-PMS    │     │  REZ MIND       │       │
│  │   (OTA)        │◄───►│   (Operations) │◄───►│  (AI/Analytics) │       │
│  │   Port: 4015   │     │   Port: 3008   │     │  Port: 4017     │       │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘       │
│           │                       │                       │                  │
│           │                       │                       │                  │
│           ▼                       ▼                       ▼                  │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                        SHARED SERVICES                          │       │
│  │  • MongoDB (rez_stayown, hotel_pms)                          │       │
│  │  • Redis (Cache, Rate Limiting)                                │       │
│  │  • Razorpay (Payments)                                       │       │
│  │  • MSG91 (SMS)                                               │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  CONSUMER APP   │     │  MERCHANT APP  │     │   ADMIN PANEL   │       │
│  │  (Guest)        │     │  (Hotel Staff) │     │  (Management)   │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SERVICE DEFINITIONS

### 1. STAYOWN (Hotel OTA)

**Purpose:** Online Travel Agency - guest-facing booking platform

**Port:** 4015
**Technology:** Node.js, Express, TypeScript, MongoDB
**Repository:** `rez-stayown-service`

#### Core Features

| Category | Feature | Status |
|----------|---------|--------|
| **Hotel Search** | City-based search | Implemented |
| | Hotel details | Implemented |
| | Room availability | Implemented |
| **Booking** | Create booking | Implemented |
| | Cancel booking | Implemented |
| | Pricing calculation (GST 12%) | Implemented |
| | Confirmation numbers | Implemented |
| **Pre-Arrival** | Temperature preference | Implemented |
| | Lighting preference | Implemented |
| | Pillow type | Implemented |
| | Dietary restrictions | Implemented |
| | Transport requests | Implemented |
| **Room QR** | Generate QR codes | Implemented |
| | Send notifications | Implemented |
| | Token validation | Implemented |
| | Service charges | Implemented |
| | Checkout billing | Implemented |
| **Authentication** | JWT validation | Implemented |
| | Service-to-service | Implemented |
| **REZ Mind** | Event tracking | Implemented |
| | Analytics sync | Implemented |

---

### 2. HOTEL-PMS (Property Management System)

**Purpose:** Hotel operations backend - front desk, housekeeping, billing

**Port:** 3008
**Technology:** Node.js, Express, TypeScript, Prisma, PostgreSQL
**Repository:** `Hotel-OTA/hotel-pms`

#### Core Features

| Category | Feature | Status |
|----------|---------|--------|
| **Authentication** | JWT auth (users, admins, staff) | Implemented |
| | Partner API key auth | Implemented |
| | PMS API key auth | Implemented |
| | HMAC webhook verification | Implemented |
| **Booking Management** | Hold booking (10 min) | Implemented |
| | Confirm booking with payment | Implemented |
| | Cancel booking | Implemented |
| | Booking status tracking | Implemented |
| **Front Desk** | Check-in | Implemented |
| | Check-out | Implemented |
| | Today's arrivals | Implemented |
| | Today's departures | Implemented |
| **Room Management** | Inventory management | Implemented |
| | Room status tracking | Implemented |
| **Housekeeping** | Room status | Implemented |
| | Service request workflow | Implemented |
| | SLA tracking | Implemented |
| | Staff assignment | Implemented |
| **Billing** | Folio management | Implemented |
| | Minibar tracking | Implemented |
| | Laundry charges | Implemented |
| | Settlement/payout | Implemented |
| **Loyalty** | OTA Coins | Implemented |
| | ReZ Coins | Implemented |
| | Coin earn/burn rules | Implemented |
| **Channel Manager** | SiteMinder | Scaffolded |
| | STAAH | Scaffolded |
| | Rategain | Scaffolded |
| **Integrations** | Razorpay | Implemented |
| | MSG91 SMS | Implemented |
| | AWS S3 | Implemented |

---

### 3. REZ MIND (Hotel Intelligence)

**Purpose:** AI-powered analytics, recommendations, predictions

**Port:** 4017
**Technology:** Node.js, Express, TypeScript, MongoDB
**Repository:** `rez-mind-hotel-service`

#### Core Features

| Category | Feature | Status |
|----------|---------|--------|
| **Event Ingestion** | Search events | Implemented |
| | Booking events | Implemented |
| | Room QR events | Implemented |
| | Service request events | Implemented |
| | Checkout events | Implemented |
| **AI Predictions** | Hotel recommendations | Implemented |
| | Dynamic pricing | Implemented |
| | Satisfaction prediction | Implemented |
| | SLA prediction | Implemented |
| | Upsell recommendations | Implemented |
| **Analytics** | Hotel performance | Implemented |
| | User behavior | Implemented |
| | Room QR analytics | Implemented |
| | Service metrics | Implemented |
| | Revenue analytics | Implemented |

---

## API ENDPOINTS

### STAYOWN SERVICE (Port 4015)

#### Hotel Routes (`/api/hotels`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search hotels by city |
| GET | `/:propertyId` | Get hotel details |
| GET | `/:propertyId/availability` | Get room availability |
| POST | `/bookings` | Create booking |
| GET | `/bookings` | List user bookings |
| GET | `/bookings/:bookingId` | Get booking details |
| POST | `/bookings/:bookingId/cancel` | Cancel booking |
| POST | `/pricing/calculate` | Calculate pricing |

#### Room QR Routes (`/api/room-qr`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate` | Generate QR for booking |
| GET | `/:bookingId` | Get QR details |
| POST | `/:bookingId/send` | Resend notification |
| POST | `/validate` | Validate QR token |
| POST | `/charge` | Add service charge |
| GET | `/:bookingId/charges` | Get charges |
| GET | `/:bookingId/bill` | Get checkout bill |
| POST | `/:bookingId/checkout` | Process checkout |
| POST | `/:bookingId/deactivate` | Deactivate QR |
| GET | `/hotel/:hotelId/stats` | QR statistics |
| POST | `/webhook` | Webhook handler |

#### Room Service Hub (`/api/room-service`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:hotelId/:roomId` | Get room service info |
| GET | `/menu/:hotelId` | Get services menu |
| POST | `/order` | Place service order |
| GET | `/bill/:bookingId` | Get current bill |
| POST | `/checkout` | Process checkout |

#### Merchant Routes (`/api/merchant`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/scan` | Scan and validate QR |
| POST | `/checkin` | Quick check-in via QR |
| GET | `/booking/:token` | Get booking details |
| POST | `/verify-access` | Verify room access |

#### Bulk Operations (`/api/room-qr/bulk`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate` | Bulk generate QRs |
| GET | `/status/:batchId` | Check batch status |

#### Pre-Arrival (`/api/pre-arrival`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:bookingId` | Get preferences |
| PUT | `/:bookingId` | Save preferences |
| POST | `/:bookingId/sync` | Sync to Room QR |
| GET | `/guest/:guestId` | Get all guest preferences |

---

### HOTEL-PMS SERVICE (Port 3008)

#### Booking Routes (`/v1/bookings`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/hold` | Place booking hold |
| POST | `/confirm` | Confirm booking |
| GET | `/` | List user bookings |
| GET | `/:booking_id` | Get booking details |
| POST | `/:booking_id/cancel` | Cancel booking |

#### Hotel Panel (`/v1/hotel`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard stats |
| GET | `/inventory` | Get inventory slots |
| PUT | `/inventory/:room_type_id/:date` | Update inventory |
| GET | `/bookings` | List hotel bookings |
| GET | `/bookings/today-checkins` | Today's arrivals |
| GET | `/bookings/today-checkouts` | Today's departures |
| POST | `/bookings/:booking_id/checkin` | Guest check-in |
| POST | `/bookings/:booking_id/checkout` | Guest check-out |
| GET | `/analytics` | Revenue analytics |
| GET | `/settlement` | Settlement statement |

#### Staff Operations (`/v1/staff`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Staff dashboard |
| GET | `/requests` | List service requests |
| PUT | `/requests/:id/status` | Update request status |
| PUT | `/requests/:id/assign` | Assign request |
| GET | `/rooms` | Room status overview |
| PUT | `/rooms/:id/status` | Update room status |
| GET | `/messages` | Guest conversations |
| POST | `/checkout/:bookingId/approve` | Approve checkout |
| POST | `/checkout/:bookingId/complete` | Complete checkout |

#### Room Service (`/v1/room-service`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create service request |
| GET | `/` | List requests |
| GET | `/:id` | Get request details |
| PATCH | `/:id` | Update request |
| GET | `/guest/my-requests` | Guest's requests |
| GET | `/menu/:hotelId` | Service menu |
| GET | `/minibar/:hotelId/menu` | Minibar menu |
| GET | `/checkout/:bookingId/bill` | Checkout folio |

---

### REZ MIND SERVICE (Port 4017)

#### Event Routes (`/api/events`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/search` | Track search event |
| POST | `/booking` | Track booking event |
| POST | `/room-qr` | Track QR event |
| POST | `/service-request` | Track service request |
| POST | `/checkout` | Track checkout event |
| POST | `/preference` | Update preferences |
| POST | `/batch` | Batch event ingestion |

#### Analytics Routes (`/api/analytics`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hotel/:hotelId` | Hotel performance |
| GET | `/user/:userId` | User behavior profile |
| GET | `/room-qr/:hotelId` | Room QR analytics |
| GET | `/services/:hotelId` | Service SLA metrics |
| GET | `/revenue/:hotelId` | Revenue analytics |

#### AI Routes (`/api/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/recommendations` | Get hotel recommendations |
| POST | `/pricing` | Get dynamic pricing |
| POST | `/satisfaction` | Predict satisfaction |
| POST | `/sla-predict` | Predict SLA times |

---

## DATABASE MODELS

### STAYOWN (MongoDB)

#### RoomQR Collection

```javascript
{
  bookingId: String (indexed, unique),
  hotelId: String (indexed),
  roomId: String (indexed),
  roomNumber: String,
  guestId: String,
  guestName: String,
  guestEmail: String,
  guestPhone: String,
  token: String (unique),
  qrPayload: String (JSON),
  qrImage: String (Base64 PNG),
  qrUrl: String,
  checkIn: Date,
  checkOut: Date,
  expiresAt: Date,
  isActive: Boolean,
  lastUsedAt: Date,
  useCount: Number,
  notifications: {
    emailSent: Boolean,
    emailSentAt: Date,
    whatsappSent: Boolean,
    whatsappSentAt: Date,
    smsSent: Boolean,
    smsSentAt: Date
  }
}
```

#### ServiceCharge Collection

```javascript
{
  bookingId: String (indexed),
  hotelId: String (indexed),
  roomId: String (indexed),
  category: String,
  description: String,
  amountPaise: Number,
  quantity: Number,
  unitPricePaise: Number,
  source: String,
  syncedToFolio: Boolean,
  syncedAt: Date,
  folioTransactionId: String
}
```

---

### HOTEL-PMS (PostgreSQL - Prisma)

#### Core Models

- `User` - Guest accounts
- `Hotel` - Hotel properties
- `RoomType` - Room categories
- `InventorySlot` - Daily inventory
- `Booking` - Reservations
- `Room` - Physical rooms
- `HotelStaff` - Staff accounts
- `CoinWallet` - User coin balances
- `SettlementEntry` - Payout records
- `RoomServiceRequest` - Service requests
- `MinibarConsumption` - Minibar items

---

### REZ MIND (MongoDB)

#### Event Collections

- `HotelSearchEvent` - Search tracking
- `HotelBookingEvent` - Booking tracking
- `RoomQREvent` - QR usage tracking
- `ServiceRequestEvent` - Service request tracking
- `CheckoutEvent` - Checkout tracking
- `GuestPreference` - Preference storage

---

## FEATURE MATRIX

| Feature | StayOwn | Hotel-PMS | Room QR |
|---------|:-------:|:---------:|:--------:|
| Hotel Search | | | - |
| Booking Create | | | - |
| Booking Confirm | | | - |
| Booking Cancel | | | - |
| Check-in | | | - |
| Check-out | | | - |
| Room Assignment | | | - |
| Inventory Mgmt | | | - |
| Housekeeping | | | - |
| Service Requests | | | - |
| Minibar/Charges | | | |
| Folio/Billing | | | |
| Settlement | | | - |
| QR Generation | - | - | |
| QR Validation | - | - | |
| QR Notifications | - | - | |
| QR Analytics | - | - | |
| Guest Prefs | | | - |
| Corporate Rates | - | | - |
| OTA Coins | | | - |
| ReZ Coins | | | - |
| Channel Manager | | | - |
| Razorpay | | | - |
| Webhooks | | | |
| AI Recommendations | - | - | - |
| Dynamic Pricing | - | - | - |
| SLA Prediction | - | - | - |

**Legend:**
- ✅ = Implemented
- ⏳ = In Progress
- 📋 = Planned
- - = Not Applicable

---

## INTEGRATION POINTS

### StayOwn → Hotel-PMS

| Direction | Integration | Endpoint |
|-----------|-------------|----------|
| StayOwn → PMS | Create booking hold | POST /v1/bookings/hold |
| StayOwn → PMS | Sync booking status | POST /v1/bookings/sync |
| StayOwn → PMS | Add folio charge | POST /v1/room-service/charge |
| StayOwn → PMS | Complete checkout | POST /v1/staff/checkout/:id/complete |
| PMS → StayOwn | Booking webhook | POST /api/webhooks/room-service |

### StayOwn → REZ Mind

| Direction | Integration | Endpoint |
|-----------|-------------|----------|
| StayOwn → Mind | Search event | POST /api/events/search |
| StayOwn → Mind | Booking event | POST /api/events/booking |
| StayOwn → Mind | QR event | POST /api/events/room-qr |
| StayOwn → Mind | Checkout event | POST /api/events/checkout |
| Mind → StayOwn | Recommendations | POST /api/ai/recommendations |
| Mind → StayOwn | Dynamic pricing | POST /api/ai/pricing |

---

## ROOM QR SYSTEM

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROOM QR LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. BOOKING CONFIRMED                                                       │
│     └── StayOwn creates booking                                              │
│                                                                             │
│  2. QR GENERATED                                                           │
│     └── JWT token created                                                    │
│     └── QR code generated (Base64 PNG)                                      │
│     └── Stored in MongoDB                                                    │
│                                                                             │
│  3. QR DELIVERED                                                           │
│     └── Email sent with QR image                                             │
│     └── WhatsApp notification                                                │
│     └── SMS with link                                                       │
│                                                                             │
│  4. GUEST SCANS QR                                                          │
│     └── Token validated                                                      │
│     └── Access time checked (check-in/out)                                   │
│     └── Room Service Hub accessible                                         │
│                                                                             │
│  5. SERVICES ORDERED                                                       │
│     └── Room service ordered                                                │
│     └── Charges recorded                                                    │
│     └── Synced to PMS folio                                                 │
│                                                                             │
│  6. CHECKOUT                                                               │
│     └── Bill generated                                                      │
│     └── Payment processed                                                   │
│     └── QR deactivated                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### QR Payload Structure

```json
{
  "intent": "room-hub",
  "v": 1,
  "hotelId": "H001",
  "roomId": "R101",
  "bookingId": "BK123456",
  "guestId": "G789",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "checkIn": "2026-05-07T14:00:00Z",
  "checkOut": "2026-05-10T12:00:00Z"
}
```

---

## REZ MIND INTEGRATION

### AI Features

#### 1. Hotel Recommendations
- Based on user search history
- Based on past bookings
- Based on preferences
- Collaborative filtering

#### 2. Dynamic Pricing
- Demand-based pricing
- Seasonality adjustments
- Competitor analysis
- User segment pricing

#### 3. Satisfaction Prediction
- Check-in time analysis
- Service response tracking
- Spending pattern analysis
- Risk factor identification

#### 4. SLA Prediction
- Current load calculation
- Staff availability
- Historical response times
- Confidence scoring

#### 5. Upsell Recommendations
- Room upgrade suggestions
- Service package offers
- Package deals
- Conversion probability scoring

---

## DEPLOYMENT

### Environment Variables

#### StayOwn Service
```bash
PORT=4015
MONGODB_URI=mongodb://localhost:27017/rez_stayown
JWT_SECRET=your-jwt-secret
HOTEL_PMS_URL=http://localhost:3008
REZ_MIND_URL=http://localhost:4017
```

#### Hotel PMS Service
```bash
PORT=3008
DATABASE_URL=postgresql://localhost:5432/hotel_pms
REDIS_URL=redis://localhost:6379
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

#### REZ Mind Service
```bash
PORT=4017
MONGODB_URI=mongodb://localhost:27017/rez_mind_hotel
```

### Docker Compose

```yaml
version: '3.8'
services:
  stayown:
    build: ./rez-stayown-service
    ports:
      - "4015:4015"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/rez_stayown
      - HOTEL_PMS_URL=http://hotel-pms:3008
      - REZ_MIND_URL=http://rez-mind:4017

  hotel-pms:
    build: ./Hotel-OTA
    ports:
      - "3008:3008"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/hotel_pms
      - REDIS_URL=redis://redis:6379

  rez-mind:
    build: ./rez-mind-hotel-service
    ports:
      - "4017:4017"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/rez_mind_hotel

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=password

  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

---

## ERROR HANDLING

### Error Response Format

```json
{
  "success": false,
  "message": "Human readable message",
  "error": "error_code",
  "details": {}
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `validation_error` | 400 | Invalid input |
| `unauthorized` | 401 | Missing auth |
| `forbidden` | 403 | Access denied |
| `not_found` | 404 | Resource not found |
| `rate_limited` | 429 | Too many requests |
| `internal_error` | 500 | Server error |

---

## SECURITY

### Authentication

| Service | Auth Method |
|---------|------------|
| StayOwn | JWT Bearer token |
| Hotel PMS | JWT + API keys |
| REZ Mind | Service-to-service token |

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| QR Generation | 10/min |
| QR Validation | 60/min |
| Charge Operations | 30/min |
| Checkout | 10/min |
| General | 100/min |

---

## MONITORING

### Health Endpoints

| Service | Endpoint |
|---------|----------|
| StayOwn | GET /health |
| StayOwn | GET /health/ready |
| Hotel PMS | GET /health |
| REZ Mind | GET /health |
| REZ Mind | GET /health/ready |

### Metrics to Track

- Booking conversion rate
- QR scan rate
- Service request SLA compliance
- Checkout completion rate
- Revenue per available room (RevPAR)
- Average daily rate (ADR)
- Guest satisfaction score

---

## FUTURE ENHANCEMENTS

1. **Channel Manager** - Full OTA integrations (Booking.com, Expedia)
2. **AI Chatbot** - Guest assistance via chat
3. **Predictive Maintenance** - Room maintenance scheduling
4. **Dynamic Pricing Engine** - Real-time rate optimization
5. **Guest Loyalty Program** - Tiered rewards system
6. **Multi-property Support** - Chain management
7. **Inventory Forecasting** - Demand prediction
8. **Revenue Management** - Yield optimization

---

## SUPPORT

For technical support, contact:
- Email: support@rez.money
- Documentation: docs.rez.money/hotel

---

**Document Version:** 1.0
**Last Updated:** May 7, 2026
