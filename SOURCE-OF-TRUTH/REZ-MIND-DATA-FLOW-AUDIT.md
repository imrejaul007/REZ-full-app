# REZ Mind Hotel Service - Data Flow Audit

**Date:** 2026-05-07
**Service:** REZ Mind Hotel Service (`rez-mind-hotel-service`)
**Port:** 4017
**MongoDB:** `rez_mind_hotel`

---

## Executive Summary

| Category | Status |
|----------|--------|
| Event Ingestion | PARTIAL |
| Hotel-PMS Connection | MISSING |
| StayOwn Connection | MISSING |
| Data Storage | OK |
| Dynamic Pricing | OK |

---

## 1. Event Types Captured

| Event Type | Schema | Endpoint | Storage |
|------------|--------|----------|---------|
| Search Events | `HotelSearchEvent` | `POST /api/events/search` | MongoDB |
| Booking Events | `HotelBookingEvent` | `POST /api/events/booking` | MongoDB |
| Room QR Events | `RoomQREvent` | `POST /api/events/room-qr` | MongoDB |
| Service Request Events | `ServiceRequestEvent` | `POST /api/events/service-request` | MongoDB |
| Checkout Events | `CheckoutEvent` | `POST /api/events/checkout` | MongoDB |
| Guest Preferences | `GuestPreference` | `POST /api/events/preference` | MongoDB |
| **Feedback Events** | **MISSING** | **MISSING** | **MISSING** |

---

## 2. What's Connected

### 2.1 Internal Endpoints (Event Reception)

The service exposes event ingestion endpoints at `/api/events`:

```
POST /api/events/search          - Receive search events
POST /api/events/booking         - Receive booking events
POST /api/events/room-qr         - Receive room QR events
POST /api/events/service-request - Receive service request events
POST /api/events/checkout        - Receive checkout events
POST /api/events/preference      - Receive guest preferences
POST /api/events/batch           - Batch event ingestion
```

**Status:** Endpoints are implemented but require external callers to POST events.

### 2.2 Data Storage

- **Database:** MongoDB (`rez_mind_hotel`)
- **Connection:** `mongodb://localhost:27017/rez_mind_hotel`
- **Indexes:** Compound indexes exist on all event collections
  - `HotelSearchEvent`: `(hotelId, timestamp)`, `(timestamp)`
  - `HotelBookingEvent`: `(hotelId, timestamp)`, `(userId)`, `(bookingId - unique)`
  - `RoomQREvent`: `(hotelId, action, timestamp)`
  - `ServiceRequestEvent`: `(hotelId, requestType, timestamp)`
  - `CheckoutEvent`: `(hotelId, timestamp)`, `(bookingId - unique)`
  - `GuestPreference`: `(userId - unique)`

**Status:** Storage is properly configured with indexes.

### 2.3 AI Features

| Feature | Implementation |
|---------|----------------|
| Dynamic Pricing | `POST /api/ai/pricing` - Calculates rates using demand + seasonality factors |
| Hotel Recommendations | `POST /api/ai/recommendations` - Uses search events + user profiles |
| Satisfaction Prediction | `POST /api/ai/satisfaction` - Based on check-in time, service response, charges |
| SLA Prediction | `POST /api/ai/sla-predict` - Based on pending requests count |

**Status:** AI features work but rely on events being sent first.

### 2.4 Analytics Endpoints

```
GET /api/analytics/hotel/:hotelId     - Hotel performance metrics
GET /api/analytics/user/:userId       - User behavior profile
GET /api/analytics/room-qr/:hotelId  - Room QR usage analytics
GET /api/analytics/services/:hotelId - Service request metrics
GET /api/analytics/revenue/:hotelId  - Revenue breakdown
```

---

## 3. What's Missing

### 3.1 CRITICAL: Hotel-PMS Connection

**Finding:** No integration code exists for Hotel-PMS.

- No webhook receiver for Hotel-PMS events
- No polling mechanism for Hotel-PMS data
- No API client for Hotel-PMS system
- No authentication setup for Hotel-PMS

**Impact:** Booking events from Hotel-PMS will NOT be captured unless another system POSTs them.

### 3.2 CRITICAL: StayOwn Connection

**Finding:** No integration code exists for StayOwn.

- No webhook receiver for StayOwn events
- No polling mechanism for StayOwn data
- No API client for StayOwn system
- No authentication setup for StayOwn

**Impact:** StayOwn events (room service, checkout, etc.) will NOT be captured unless another system POSTs them.

### 3.3 MISSING: Feedback Events

**Finding:** No schema or endpoint for guest feedback/ratings.

- No `FeedbackEvent` schema in `event-schemas.ts`
- No `POST /api/events/feedback` endpoint
- `predictSatisfaction()` accepts ratings but no event stores them

**Impact:** Guest satisfaction predictions will lack real feedback data.

---

## 4. Data Flow Issues

### 4.1 Flow Diagram (Current State)

```
                    ┌─────────────────────────────────────────────┐
                    │              External Systems                │
                    │  (StayOwn, Hotel-PMS, Consumer App, etc.)   │
                    └─────────────────┬───────────────────────────┘
                                      │
                                      │ POST events
                                      ▼
                    ┌─────────────────────────────────────────────┐
                    │         REZ Mind Hotel Service             │
                    │              (Port 4017)                    │
                    │                                             │
                    │  ┌─────────────────────────────────────┐    │
                    │  │        Event Endpoints             │    │
                    │  │  /api/events/{search,batch,...}    │    │
                    │  └─────────────────┬───────────────────┘    │
                    │                    │                        │
                    │                    ▼                        │
                    │  ┌─────────────────────────────────────┐    │
                    │  │     MongoDB (rez_mind_hotel)        │    │
                    │  │                                     │    │
                    │  │  - HotelSearchEvent                │    │
                    │  │  - HotelBookingEvent                │    │
                    │  │  - ServiceRequestEvent             │    │
                    │  │  - CheckoutEvent                   │    │
                    │  │  - RoomQREvent                     │    │
                    │  └─────────────────────────────────────┘    │
                    │                    │                        │
                    │                    ▼                        │
                    │  ┌─────────────────────────────────────┐    │
                    │  │         AI Service                  │    │
                    │  │  - getDynamicPricing()             │    │
                    │  │  - getRecommendations()            │    │
                    │  │  - predictSatisfaction()          │    │
                    │  └─────────────────────────────────────┘    │
                    └─────────────────────────────────────────────┘
```

### 4.2 Issues Identified

| Issue | Severity | Description |
|-------|----------|-------------|
| Passive Event Reception | HIGH | Service only accepts events via POST - no push mechanism from Hotel-PMS or StayOwn |
| No Authentication | HIGH | Event endpoints have no API key or authentication |
| In-Memory Cache | MEDIUM | `userProfileCache` uses in-memory Map - will reset on restart, won't scale |
| Missing Feedback Schema | MEDIUM | No schema for guest ratings/feedback |
| No Error Handling for Analytics | LOW | Analytics endpoints silently return empty data on errors |

### 4.3 Dynamic Pricing Data Flow

```
Dynamic Pricing Request
        │
        ▼
┌───────────────────┐
│ POST /api/ai/pricing
│ {hotelId, checkIn,
│  checkOut, baseRate}
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ calculateDemandFactor()
│ - Count HotelSearchEvent (7 days)
│ - Count HotelBookingEvent (7 days)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ calculateSeasonality()
│ - Based on check-in month
│ - Oct-Dec: 1.3x
│ - Apr-Jun: 1.2x
│ - Off-seasons: 0.8-0.9x
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Return DynamicPricing
│ {suggestedRate,
│  discountPercent,
│  factors}
└───────────────────┘
```

**Issue:** Dynamic pricing depends on search/booking events being stored first. If Hotel-PMS doesn't send events, pricing will use default demand factor of 1.0.

---

## 5. Recommendations

### 5.1 Immediate Actions

| Priority | Action | File(s) to Create/Modify |
|----------|--------|-------------------------|
| HIGH | Add API key authentication to event endpoints | `event-routes.ts` |
| HIGH | Create Hotel-PMS webhook receiver | `src/integrations/hotel-pms-webhook.ts` |
| HIGH | Create StayOwn webhook receiver | `src/integrations/stayown-webhook.ts` |
| MEDIUM | Add FeedbackEvent schema and endpoint | `event-schemas.ts`, `event-routes.ts` |
| MEDIUM | Replace in-memory cache with Redis | `ai-service.ts` |

### 5.2 Integration Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Hotel-PMS                                  │
│                    (Webhooks on booking events)                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ POST /api/integrations/hotel-pms/webhook
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       REZ Mind Hotel Service                        │
│                                                                     │
│   ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐ │
│   │  Integration    │    │  Event Routes  │    │  AI Service    │ │
│   │  Receivers      │───▶│  (validated,    │───▶│  (analyze,     │ │
│   │  (normalize)    │    │   stored)       │    │   predict)     │ │
│   └─────────────────┘    └─────────────────┘    └────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        StayOwn                                      │
│                   (Webhooks on checkout,                            │
│                    room service events)                            │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ POST /api/integrations/stayown/webhook
                              ▼
```

### 5.3 Required Webhook Endpoints

```typescript
// src/integrations/hotel-pms-webhook.ts
router.post('/integrations/hotel-pms/webhook', async (req, res) => {
  // Receive booking events from Hotel-PMS
  // Normalize to HotelBookingEvent schema
  // Store in MongoDB
});

// src/integrations/stayown-webhook.ts
router.post('/integrations/stayown/webhook', async (req, res) => {
  // Receive checkout, room service events from StayOwn
  // Normalize to ServiceRequestEvent / CheckoutEvent schema
  // Store in MongoDB
});
```

---

## 6. Event Source Attribution

| Event Type | Expected Source | Current Support |
|------------|----------------|-----------------|
| `HotelSearchEvent` | Consumer App | Supported via POST |
| `HotelBookingEvent` | Hotel-PMS | **NOT INTEGRATED** - needs webhook |
| `RoomQREvent` | Consumer App | Supported via POST |
| `ServiceRequestEvent` | StayOwn | **NOT INTEGRATED** - needs webhook |
| `CheckoutEvent` | StayOwn | **NOT INTEGRATED** - needs webhook |
| `FeedbackEvent` | Consumer App | **MISSING** - needs schema + endpoint |

---

## 7. Summary

**Connected:**
- Event ingestion endpoints (require external POST)
- MongoDB storage with proper indexes
- AI features (dynamic pricing, recommendations, predictions)
- Analytics endpoints

**Not Connected:**
- Hotel-PMS (no webhook receiver, no API client)
- StayOwn (no webhook receiver, no API client)

**Missing:**
- Feedback/rating event schema and endpoint
- API authentication on event endpoints
- Persistent caching (Redis vs in-memory)

**Action Required:** Implement webhook receivers for Hotel-PMS and StayOwn integrations before the service can function as intended.
