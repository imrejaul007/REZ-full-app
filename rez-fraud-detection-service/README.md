# ReZ Fraud Detection Service

ML-powered fraud detection with rule-based fallback for ReZ platform.

## Features

- Real-time fraud checking
- ML model integration
- Rule-based fraud detection
- Batch processing support
- Redis caching
- Asynchronous processing with BullMQ

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4009 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/rez_fraud_detection |
| REDIS_URL | Redis connection string | redis://localhost:6379 |
| MODEL_VERSION | ML model version | v1.0.0 |
| ALLOWED_ORIGINS | CORS allowed origins | https://rez.money |

## API Endpoints

### Fraud Checking

- `POST /api/fraud/check` - Perform synchronous fraud check
- `POST /api/fraud/check-batch` - Perform batch fraud check
- `POST /api/fraud/queue-check` - Queue async fraud check
- `GET /api/fraud/result/:type/:entityId` - Get cached fraud result

### Statistics

- `GET /api/fraud/stats` - Get fraud statistics

### ML Model

- `GET /api/fraud/model/status` - Get model status
- `GET /api/fraud/model/health` - Check model health

### Health

- `GET /health` - Service health check

## Risk Levels

| Level | Score Range | Recommendation |
|-------|-------------|----------------|
| Low | 0-29 | Allow |
| Medium | 30-59 | Review |
| High | 60-79 | Block |
| Critical | 80-100 | Block |

## Fraud Check Types

- **Order**: Checks for order fraud patterns
- **Payment**: Checks for payment fraud patterns
- **Account**: Checks for account takeover attempts

## Development

```bash
# Type check
npm run typecheck

# Run tests
npm test
```
