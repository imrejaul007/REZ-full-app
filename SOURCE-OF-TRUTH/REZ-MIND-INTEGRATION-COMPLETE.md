# REZ MIND INTEGRATION - COMPLETE
**Date:** May 8, 2026

---

# WHAT WAS BUILT

## Complete Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ MIND - THE BRAIN │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ DATA INPUTS │ │
│ │ │ │
│ │ ├─ Hotel-PMS ──→ Booking events │ │
│ │ ├─ Hotel-PMS ──→ Check-in/out events │ │
│ │ ├─ Hotel-PMS ──→ Room status events │ │
│ │ ├─ StayOwn ──→ Search events │ │
│ │ ├─ StayOwn ──→ Booking events │ │
│ │ ├─ StayOwn ──→ Room QR events │ │
│ │ ├─ StayOwn ──→ Service order events │ │
│ │ ├─ StayOwn ──→ Checkout events │ │
│ │ └─ StayOwn ──→ Feedback events │ │
│ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ SIGNAL COLLECTOR │ │
│ │ │ │
│ │ ├─ Search Signals (query, filters, results) │ │
│ │ ├─ Booking Signals (started, abandoned, completed) │ │
│ │ ├─ Stay Signals (QR scanned, service ordered) │ │
│ │ ├─ Feedback Signals (rating, review, complaint) │ │
│ │ └─ Behavioral Signals (all user actions) │ │
│ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ AI ENGINES │ │
│ │ │ │
│ │ ├─ Dynamic Pricing Engine │ │
│ │ ├─ Recommendations Engine │ │
│ │ ├─ User Knowledge Base │ │
│ │ ├─ Event Calendar │ │
│ │ └─ Satisfaction Predictor │ │
│ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ DATA OUTPUTS │ │
│ │ │ │
│ │ ├─→ StayOwn (dynamic prices, recommendations) │ │
│ │ ├─→ Hotel-PMS (insights, forecasts) │ │
│ │ ├─→ Marketing (targeted campaigns) │ │
│ │ └─→ Karma (loyalty triggers) │ │
│ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# FILES CREATED

## REZ Mind Service (Port 4017)

| File | Purpose |
|------|---------|
| `services/signal-collector.ts` | Collect all user signals |
| `services/signal-store.ts` | Store signals in MongoDB |
| `services/data-pipeline.ts` | Receive events from all services |
| `services/user-knowledge.service.ts` | User profile + preferences |
| `services/recommendations-engine.ts` | AI recommendations |
| `services/dynamic-pricing-engine.ts` | Real-time pricing |
| `services/event-calendar.service.ts` | Local events for pricing |
| `services/pricing-engine.ts` | Pricing calculation |
| `routes/event-routes.ts` | Updated with webhooks |
| `routes/knowledge-routes.ts` | User knowledge endpoints |
| `routes/pricing-routes.ts` | Dynamic pricing endpoints |
| `routes/calendar-routes.ts` | Event calendar endpoints |

## StayOwn Service (Port 4015)

| File | Purpose |
|------|---------|
| `services/rez-mind-client.ts` | Client to call REZ Mind |
| `services/rez-mind-integration.ts` | Integration layer |
| `routes/ai-routes.ts` | AI endpoints for app |

## Hotel-PMS Service (Port 3008)

| File | Purpose |
|------|---------|
| `services/rez-mind-client.ts` | Client to call REZ Mind |

---

# SIGNAL TYPES COLLECTED

## Search Signals
```typescript
{
  type: 'SEARCH_SIGNALS',
  signals: [
    'search_query',
    'filters_applied',
    'results_viewed',
    'hotels_compared',
    'sort_options'
  ]
}
```

## Booking Signals
```typescript
{
  type: 'BOOKING_SIGNALS',
  signals: [
    'booking_started',
    'booking_abandoned',
    'booking_completed',
    'payment_method',
    'discount_used'
  ]
}
```

## Stay Signals
```typescript
{
  type: 'STAY_SIGNALS',
  signals: [
    'room_qr_scanned',
    'service_ordered',
    'checkout_initiated',
    'feedback_submitted'
  ]
}
```

## Feedback Signals
```typescript
{
  type: 'FEEDBACK_SIGNALS',
  signals: [
    'rating_given',
    'review_written',
    'complaint_logged',
    'nps_score'
  ]
}
```

---

# DYNAMIC PRICING ENGINE

## Pricing Factors

| Factor | Range | Data Source |
|--------|-------|-------------|
| Base Rate | Hotel-set | Hotel-PMS |
| Demand Factor | 0.8 - 2.0 | Occupancy data |
| Event Factor | 1.0 - 1.5 | Event Calendar |
| Competitor Factor | 0.9 - 1.1 | Market data |
| User Factor | 0.9 - 1.2 | User tier |
| Season Factor | 0.8 - 1.3 | Date patterns |
| Lead Time Factor | 0.9 - 1.2 | Days to check-in |

## Formula
```
Final Price = Base Rate × Demand × Event × Competitor × User × Season × Lead Time
```

## Example
```
Base Rate: ₹5,000
Demand (75% occupancy): 1.20
Event (Festival): 1.15
Competitor (Market avg): 1.00
User (Gold tier): 0.95
Season (Peak): 1.10
Lead Time (5 days): 1.05

Final Price = 5000 × 1.20 × 1.15 × 1.00 × 0.95 × 1.10 × 1.05
           = ₹7,038
```

---

# USER KNOWLEDGE BASE

## User Profile Structure

```typescript
interface UserProfile {
  userId: string;
  
  // Preferences
  preferences: {
    roomType?: string;      // "deluxe", "suite"
    bedType?: string;         // "king", "twin"
    floor?: string;          // "high", "low"
    smoking?: boolean;
    earlyCheckin?: boolean;
    lateCheckout?: boolean;
    dietary?: string[];       // "vegetarian", "vegan"
  };
  
  // History
  history: {
    bookings: number;
    totalSpent: number;
    avgStay: number;          // nights
    favoriteHotels: string[];
    favoriteCities: string[];
    avgRating: number;
    lastBooking: Date;
  };
  
  // Behavior
  behavior: {
    avgLeadTime: number;     // days before booking
    discountSensitivity: number; // 0-1
    loyaltyTier: string;
    engagementScore: number;
  };
  
  // Signals (recent 100)
  signals: UserSignal[];
}
```

---

# EVENT CALENDAR

## Event Types

| Type | Example | Price Impact |
|------|---------|-------------|
| Festival | Diwali, Holi | +20-35% |
| Conference | Tech Summit | +15-25% |
| Concert | Artist performance | +10-20% |
| Sports | Cricket match | +15-25% |
| Exhibition | Trade show | +10-15% |
| Holiday | Weekend, New Year | +20-30% |

---

# RECOMMENDATIONS ENGINE

## Types of Recommendations

| Type | Trigger | Output |
|------|---------|--------|
| **Search Results** | User searches | Ranked hotel list |
| **Upsell** | Booking created | Room upgrades, spa, dining |
| **Cross-sell** | Checkout | Future destinations |
| **Re-engagement** | User inactive | Return offers |
| **Personalized** | User profile | "For You" section |

---

# API ENDPOINTS

## REZ Mind Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events/webhook/hotel-pms` | Receive PMS events |
| POST | `/api/events/webhook/stayown` | Receive StayOwn events |
| GET | `/api/events/signals/:hotelId` | Get hotel signals |
| GET | `/api/pricing/:hotelId/:roomTypeId` | Get dynamic price |
| GET | `/api/pricing/forecast/:hotelId` | Price forecast |
| GET | `/api/recommendations/:userId` | Get recommendations |
| GET | `/api/knowledge/profile/:userId` | Get user profile |
| POST | `/api/knowledge/signal` | Add user signal |
| GET | `/api/calendar/events/:hotelId` | Get local events |

## StayOwn AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/pricing/:hotelId` | Get dynamic price |
| GET | `/ai/recommendations` | Get recommendations |
| GET | `/ai/insights/:hotelId` | Get hotel insights |

---

# INTEGRATION FLOW

## StayOwn → REZ Mind

```
User searches "hotels in Mumbai"
     │
     ▼
StayOwn records search signal
     │
     ▼
POST /api/events/webhook/stayown
{
  eventType: "search",
  source: "stayown",
  userId: "U001",
  data: {
    query: "hotels in Mumbai",
    city: "Mumbai",
    resultsCount: 15
  }
}
     │
     ▼
REZ Mind stores signal
     │
     ▼
REZ Mind updates user profile
     │
     ▼
REZ Mind returns dynamic price + recommendations
     │
     ▼
StayOwn shows prices + "For You" section
```

## Hotel-PMS → REZ Mind

```
Staff assigns Room 101 to guest
     │
     ▼
Hotel-PMS records booking event
     │
     ▼
POST /api/events/webhook/hotel-pms
{
  eventType: "booking.confirmed",
  source: "hotel_pms",
  data: {
    bookingId: "BK123",
    hotelId: "H001",
    roomId: "R101",
    checkIn: "2026-05-10",
    checkOut: "2026-05-12"
  }
}
     │
     ▼
REZ Mind updates hotel signals
     │
     ▼
REZ Mind recalculates demand
     │
     ▼
REZ Mind suggests rate adjustment
```

---

# KNOWLEDGE BASE FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER KNOWLEDGE BASE │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ User searches hotels │
│ ├── Query stored │
│ ├── Filters stored │
│ └── Results viewed stored │
│ │
│ User books hotel │
│ ├── Booking stored │
│ ├── Preferences captured │
│ └── Payment method stored │
│ │
│ User stays at hotel │
│ ├── Room QR scanned │
│ ├── Services used │
│ ├── Feedback given │
│ └── All actions stored │
│ │
│ User returns │
│ ├── History analyzed │
│ ├── Preferences updated │
│ └── Recommendations personalized │
│ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# SUMMARY

## What's Connected

| Source | Data Sent | Frequency |
|--------|-----------|-----------|
| Hotel-PMS | Booking events | Real-time |
| Hotel-PMS | Check-in/out | Real-time |
| Hotel-PMS | Room status | Real-time |
| StayOwn | Search events | Real-time |
| StayOwn | Booking events | Real-time |
| StayOwn | Room QR scans | Real-time |
| StayOwn | Service orders | Real-time |
| StayOwn | Checkout events | Real-time |

## What's Stored

| Data | Retention | Use |
|------|-----------|-----|
| User signals | 90 days | AI training |
| User profiles | Permanent | Personalization |
| Hotel signals | 90 days | Analytics |
| Event calendar | Permanent | Pricing |

## What's Powered

| Feature | Source | Output |
|---------|--------|--------|
| Dynamic Pricing | REZ Mind | Real-time rates |
| Recommendations | REZ Mind | "For You" section |
| User Profile | REZ Mind | Preferences |
| Event Impact | REZ Mind | Price multiplier |

---

**REZ Mind is now the complete brain of the hotel ecosystem!**</parameter>
