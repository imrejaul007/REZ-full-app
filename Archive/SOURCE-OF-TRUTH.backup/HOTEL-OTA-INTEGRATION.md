# Hotel OTA Integration - Built 2026-05-02

## Overview

ReZ has its own Hotel OTA platform that handles hotel bookings. We use this instead of external providers like Makcorps.

## Components

### 1. Hotel OTA Backend
**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/Hotel OTA/`

| Service | Port | Status |
|---------|------|--------|
| hotel-ota-api | 3001 | ✅ Deployed |
| hotel-ota-web | 3002 | ✅ Deployed |
| hotel-ota-hotel-panel | 3003 | ✅ Deployed |
| hotel-ota-admin | 3004 | ✅ Deployed |

### 2. Hotel OTA Features

| Feature | Status | Details |
|---------|--------|---------|
| Hotel Search | Working | City, dates, filters |
| Room Availability | Working | Real-time inventory |
| Booking Hold | Working | 30-min hold |
| Booking Confirm | Working | With payment |
| PMS Integration | Working | Webhook sync |
| Channel Manager | Working | OTA sync |
| Corporate Accounts | Working | Credit limits |
| GST Invoicing | Working | e-Invoice ready |

## Integration Points

### Corporate Service
**Location:** `rez-corporate-service/src/integrations/travel/`

```
├── hotelOtaService.ts  ✅ NEW - Uses our Hotel OTA
├── rezTravelService.ts  ✅ NEW - Uses rez-travel-service
└── tboService.ts       (Backup for TBO)
```

### CorpPerks App
**Location:** `CorpPerks/src/backend/`

```
├── hotelRoutes.ts      ✅ NEW - Uses our Hotel OTA
└── makcorpsRoutes.ts  ⚠️ Deprecated - Replaced
```

## API Integration

### Hotel OTA Endpoints
```
GET  /v1/hotels/search
GET  /v1/hotels/:id
GET  /v1/hotels/:id/availability
POST /v1/bookings/hold
POST /v1/bookings/confirm
POST /v1/bookings/:id/cancel
```

### Corporate Service Integration
```typescript
// rez-corporate-service/src/integrations/travel/hotelOtaService.ts
import { hotelOtaService } from './hotelOtaService';

// Search hotels
const hotels = await hotelOtaService.searchHotels({
  city: 'Delhi',
  checkIn: '2024-12-20',
  checkOut: '2024-12-22',
  rooms: 1
});

// Book hotel
const booking = await hotelOtaService.holdBooking({
  hotelId: 'hotel_123',
  roomId: 'room_456',
  checkIn: '2024-12-20',
  checkOut: '2024-12-22',
  guestName: 'John Doe',
  guestEmail: 'john@example.com',
  guestPhone: '+919876543210'
});
```

## CorpPerks Hotel Routes

### CorpPerks/src/backend/hotelRoutes.ts
```typescript
// New routes that use our Hotel OTA
router.get('/search', ...)     // Search hotels
router.get('/:id', ...)       // Hotel details
router.get('/:id/rooms', ...) // Room availability
router.post('/hold', ...)      // Create hold
router.post('/confirm', ...)   // Confirm booking
router.post('/cancel', ...)    // Cancel booking
```

## Environment Variables

### Hotel OTA
```env
HOTEL_OTA_URL=https://hotel-ota-api.onrender.com/v1
HOTEL_OTA_API_KEY=xxx
REZ_API_KEY=xxx
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
```

### CorpPerks
```env
HOTEL_OTA_URL=https://hotel-ota-api.onrender.com/v1
HOTEL_OTA_API_KEY=xxx
```

## Makcorps Deprecation

Makcorps routes have been replaced with our Hotel OTA:

| Old | New |
|-----|-----|
| `makcorpsRoutes.ts` | `hotelRoutes.ts` |
| Makcorps API | Hotel OTA API |
| External provider | Own platform |

## Deployment Status

| Component | GitHub | Render | Status |
|-----------|--------|--------|--------|
| Hotel OTA | ✅ | ✅ | Deployed |
| rez-corporate-service | ✅ | ⏳ | Needs deploy |
| CorpPerks | ✅ | ⏳ | Needs deploy |

---

**Status:** Complete - Hotel OTA integrated
**Note:** Makcorps removed, using own platform
