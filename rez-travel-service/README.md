# ReZ Travel Service

**Flight, Train, Bus & Cab Booking API**

---

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## API Endpoints

### Flights
- `GET /api/travel/flights/search` - Search flights
- `POST /api/travel/flights/book` - Book flight

### Trains
- `GET /api/travel/trains/search` - Search trains
- `POST /api/travel/trains/book` - Book train

### Buses
- `GET /api/travel/buses/search` - Search buses
- `POST /api/travel/buses/book` - Book bus

### Cabs
- `GET /api/travel/cabs/quotes` - Get cab quotes
- `POST /api/travel/cabs/book` - Book cab

### Health
- `GET /health` - Health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

## Health Checks

Health checks are automatically configured for Render deployment.

## Scripts

```bash
npm run dev    # Development
npm run build  # Build for production
npm start      # Start production server
```

## Dependencies

- Express
- Mongoose
- Redis
- Sentry (error tracking)
- Prometheus (metrics)

---

**Status:** Production Ready
**Version:** 1.0.0
