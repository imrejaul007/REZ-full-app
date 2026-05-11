# ReZ Tracking Service

Real-time delivery driver tracking service with GPS tracking, ETA calculation, route optimization, and geofencing alerts.

## Features

- **Real-time Tracking**: Track delivery driver locations with WebSocket updates
- **ETA Calculation**: Accurate estimated time of arrival based on current conditions
- **Route Optimization**: Optimize delivery routes using nearest neighbor algorithm
- **Geofencing Alerts**: Trigger events when drivers enter or exit defined zones
- **Historical Tracking**: Store and retrieve historical tracking data
- **Batch Updates**: Handle high-frequency location updates efficiently

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## API Endpoints

### Tracking Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tracking/sessions` | Create a new tracking session |
| GET | `/api/tracking/sessions` | Get all active sessions |
| GET | `/api/tracking/sessions/:id` | Get session by ID |
| PUT | `/api/tracking/sessions/:id/location` | Update driver location |
| PUT | `/api/tracking/sessions/:id/destination` | Set destination |
| PUT | `/api/tracking/sessions/:id/route` | Set route |
| POST | `/api/tracking/sessions/:id/complete` | Complete session |
| POST | `/api/tracking/sessions/:id/cancel` | Cancel session |
| GET | `/api/tracking/sessions/:id/history` | Get session history |

### Driver Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracking/drivers/:id/active` | Get active session for driver |
| GET | `/api/tracking/drivers/:id/history` | Get driver tracking history |
| GET | `/api/tracking/drivers/:id/stats` | Get driver statistics |

### Geofences

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tracking/geofences` | Create a geofence |
| GET | `/api/tracking/geofences` | Get all geofences |
| GET | `/api/tracking/geofences/:id` | Get geofence by ID |
| PUT | `/api/tracking/geofences/:id` | Update geofence |
| DELETE | `/api/tracking/geofences/:id` | Delete geofence |

### Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tracking/routes/optimize` | Optimize route between waypoints |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tracking/stats` | Get service statistics |
| POST | `/api/tracking/locations/batch` | Batch location update |

## WebSocket Events

### Client -> Server

```javascript
// Register as a driver
socket.emit('register_driver', { driverId: 'driver-123' });

// Subscribe to delivery updates
socket.emit('subscribe_delivery', { deliveryId: 'delivery-456' });

// Subscribe to session updates
socket.emit('subscribe_session', { sessionId: 'session-789' });

// Send location update
socket.emit('location_update', {
  driverId: 'driver-123',
  deliveryId: 'delivery-456',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    timestamp: Date.now(),
    speed: 15.5,
    heading: 90
  }
});
```

### Server -> Client

```javascript
// Receive location updates
socket.on('location_update', (data) => {
  console.log('Location:', data.payload.location);
});

// Receive geofence alerts
socket.on('geofence_alert', (data) => {
  console.log('Geofence:', data.payload.alert);
});

// Receive ETA updates
socket.on('eta_update', (data) => {
  console.log('ETA:', data.payload.eta);
});

// Receive route updates
socket.on('route_update', (data) => {
  console.log('Route:', data.payload.route);
});
```

## Example Usage

### Create a Tracking Session

```bash
curl -X POST http://localhost:4032/api/tracking/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "driver-123",
    "deliveryId": "delivery-456"
  }'
```

### Update Location

```bash
curl -X PUT http://localhost:4032/api/tracking/sessions/{sessionId}/location \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "speed": 15.5,
    "heading": 90
  }'
```

### Set Destination

```bash
curl -X PUT http://localhost:4032/api/tracking/sessions/{sessionId}/destination \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": {
      "latitude": 37.8044,
      "longitude": -122.2712
    },
    "address": "123 Main St, San Francisco, CA",
    "radius": 100
  }'
```

### Create Geofence

```bash
curl -X POST http://localhost:4032/api/tracking/geofences \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Zone",
    "type": "restricted",
    "coordinates": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "radius": 500
  }'
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 4032 | Server port |
| NODE_ENV | development | Environment (development/production) |
| CORS_ORIGIN | * | CORS allowed origins |
| CLEANUP_INTERVAL | 3600000 | Cleanup interval in ms |

## Architecture

```
src/
├── index.ts              # Main entry point
├── models/
│   └── Tracking.ts       # In-memory data store
├── routes/
│   └── tracking.routes.ts # API routes
├── services/
│   ├── locationService.ts   # GPS tracking & route optimization
│   └── notificationService.ts # WebSocket push updates
├── middleware/
│   └── errorHandler.ts   # Error handling & security
├── types/
│   └── index.ts          # TypeScript interfaces
└── utils/
    └── index.ts          # Utility functions
```

## License

MIT
