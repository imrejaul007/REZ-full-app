# Travel Service - Built 2026-05-02

## Overview

ReZ Travel Service handles all travel bookings:
- **Flight** - Domestic & International flights
- **Train** - IRCTC train tickets
- **Bus** - Intercity bus booking
- **Cab** - Local, outstation, airport cabs

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ REZ TRAVEL SERVICE (4050) │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌───────────────────────────────────────────────────────────────────────┐ │
│ │ ROUTES │ │
│ ├── flightRoutes.ts - Flight search, book, cancel │ │
│ ├── trainRoutes.ts - Train search, book, cancel │ │
│ ├── busRoutes.ts - Bus search, book, cancel │ │
│ └── cabRoutes.ts - Cab quotes, book, track │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────────────────────┐ │
│ │ SERVICES (STUBBED - Ready for real API) │ │
│ ├── flightService.ts - TBO/Cleartrip API ready │ │
│ ├── trainService.ts - IRCTC API ready │ │
│ ├── busService.ts - RedBus/AbhiBus API ready │ │
│ └── cabService.ts - Uber/Ola API ready │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│ │
│ ┌───────────────────────────────────────────────────────────────────────┐ │
│ │ MODELS │ │
│ ├── TravelBooking - All booking types │ │
│ └── TravelItinerary - Multi-leg trips │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Flight
```
GET  /api/travel/flights/search      - Search flights
GET  /api/travel/flights/:id         - Flight details
POST /api/travel/flights/book        - Book flight
GET  /api/travel/flights/pnr/:pnr    - PNR status
POST /api/travel/flights/:id/cancel  - Cancel
```

### Train
```
GET  /api/travel/trains/search       - Search trains
GET  /api/travel/trains/:id          - Train details
POST /api/travel/trains/book          - Book ticket
GET  /api/travel/trains/pnr/:pnr     - PNR status
POST /api/travel/trains/:id/cancel    - Cancel
```

### Bus
```
GET  /api/travel/buses/search        - Search buses
GET  /api/travel/buses/:id           - Bus details
GET  /api/travel/buses/:id/seats     - Seat layout
POST /api/travel/buses/book          - Book bus
GET  /api/travel/buses/booking/:id    - Booking status
POST /api/travel/buses/:id/cancel     - Cancel
```

### Cab
```
GET  /api/travel/cabs/quotes         - Get quotes
GET  /api/travel/cabs/outstation     - Outstation cabs
GET  /api/travel/cabs/airport        - Airport cabs
POST /api/travel/cabs/book           - Book cab
GET  /api/travel/cabs/track/:id     - Track cab
GET  /api/travel/cabs/driver/:id    - Driver details
POST /api/travel/cabs/:id/cancel     - Cancel
```

### All Bookings
```
GET /api/travel/bookings             - List all bookings
GET /api/travel/bookings/:id        - Booking details
```

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| Flight Service | STUBBED | Ready for TBO API |
| Train Service | STUBBED | Ready for IRCTC |
| Bus Service | STUBBED | Ready for RedBus |
| Cab Service | STUBBED | Ready for Uber/Ola |
| MongoDB Models | WORKING | Saves bookings |

## Connecting Real APIs

When you have API credentials, update the services:

### Flight (TBO Example)
```typescript
// services/flightService.ts
async searchFlights(params) {
  // Replace stub with:
  const token = await this.tboClient.authenticate();
  return await this.tboClient.searchFlights(params, token);
}
```

### Train (IRCTC Example)
```typescript
// services/trainService.ts
async searchTrains(params) {
  // Replace stub with:
  return await this.irctcClient.search(params);
}
```

## Deployment

```bash
cd rez-travel-service
gh repo create imrejaul007/rez-travel-service --public
git push -u origin main
# Then deploy via Render Blueprint
```

## Environment Variables

```
MONGODB_URI=mongodb://...
PORT=4050
REZ_API_BASE_URL=https://api.rez.app
INTERNAL_SERVICE_TOKEN=...
CORPORATE_SERVICE_URL=https://rez-corporate-service.onrender.com
```

## Future Integrations

| Provider | Type | Priority |
|----------|------|----------|
| TBO | Flights + Hotels | P0 |
| IRCTC | Trains | P1 |
| RedBus | Buses | P1 |
| Uber/Ola | Cabs | P1 |

---

**Status:** Built, ready to deploy
**GitHub:** `imrejaul007/rez-travel-service` (needs push)
