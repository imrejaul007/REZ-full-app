# Intelligence Platform Deployment Guide

This document covers the deployment process for all ReZ Intelligence Platform microservices.

## Service Overview

| Service | Port | Type | Node.js | Key Dependencies |
|---------|------|------|---------|------------------|
| REZ-intelligence-hub | 4020 | TypeScript | >=18 | Express, Mongoose, Redis |
| REZ-user-intelligence-service | 3004 | TypeScript | >=18 | Express, Mongoose, Redis, RabbitMQ |
| REZ-merchant-intelligence-service | 4012 | TypeScript | >=18 | Express, Mongoose, Redis, RabbitMQ, Swagger |
| REZ-personalization-engine | 4017 | JavaScript | >=18 | Express, Mongoose, Node-cache |
| REZ-recommendation-engine | 3001 | JavaScript (ESM) | >=20 | Express, Mongoose, Lodash, Mathjs |

---

## Deployment Order (Critical)

Services must be deployed in the following order due to dependency chain:

1. **REZ-intelligence-hub** (port 4020) - Core hub, coordinates all services
2. **REZ-user-intelligence-service** (port 3004) - User analytics and behavioral scoring
3. **REZ-merchant-intelligence-service** (port 4012) - Merchant analytics and insights
4. **REZ-personalization-engine** (port 4017) - User personalization engine
5. **REZ-recommendation-engine** (port 3001) - Final recommendations for users

---

## Prerequisites

### Infrastructure
- Node.js 18+ (20+ for recommendation-engine)
- MongoDB Atlas cluster or local MongoDB
- Redis server (optional for development, required for production)
- RabbitMQ server (optional, for event-driven features)

### Environment Files
Each service requires a `.env` file created from `.env.example`. Do not commit `.env` files to version control.

---

## Service-Specific Deployment

### 1. REZ-intelligence-hub

**Directory:** `packages/intelligence-platform/services/REZ-intelligence-hub`

**Health Check:** `GET /health`

**Setup:**
```bash
cd packages/intelligence-platform/services/REZ-intelligence-hub
cp .env.example .env
# Edit .env with production values
```

**Build & Deploy:**
```bash
npm install
npm run build
npm start
```

**Important Notes:**
- Requires `tsconfig.json` for TypeScript compilation
- If build fails with type errors, move `@types/*` packages from devDependencies to dependencies
- Coordinates communication between all other intelligence services

**Required Environment Variables:**
```
PORT=4020
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
INTERNAL_SERVICE_TOKEN=<secure-random-string>
SENTRY_DSN=https://...@sentry.io/...
```

---

### 2. REZ-user-intelligence-service

**Directory:** `packages/intelligence-platform/services/REZ-user-intelligence-service`

**Health Check:** `GET /health` (or service-specific endpoint)

**Setup:**
```bash
cd packages/intelligence-platform/services/REZ-user-intelligence-service
cp .env.example .env
# Edit .env with production values
```

**Build & Deploy:**
```bash
npm install
npm run build
npm start
```

**Development:**
```bash
npm run dev  # Uses ts-node-dev with hot reload
```

**Features:**
- Behavioral scoring with configurable weights
- Predictive analytics
- Real-time scoring (optional, toggle with `ENABLE_REAL_TIME_SCORING`)
- Cache TTL management for profiles, recommendations, preferences

**Required Environment Variables:**
```
PORT=3004
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_HOST=<redis-host>
REDIS_PORT=6379
RABBITMQ_URL=amqp://...
SENTRY_DSN=https://...@sentry.io/...
INTENT_GRAPH_SERVICE_URL=https://...
```

---

### 3. REZ-merchant-intelligence-service

**Directory:** `packages/intelligence-platform/services/REZ-merchant-intelligence-service`

**API Documentation:** Swagger UI at `/api-docs`

**Setup:**
```bash
cd packages/intelligence-platform/services/REZ-merchant-intelligence-service
cp .env.example .env
# Edit .env with production values
```

**Build & Deploy:**
```bash
npm install
npm run build
npm start
```

**Development:**
```bash
npm run dev
```

**Features:**
- Merchant health scoring with configurable weights
- Competitor analysis
- Order, inventory, and feedback event processing
- Swagger API documentation at `/api-docs`

**Required Environment Variables:**
```
PORT=4012
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
MONGODB_DB=merchant_intelligence
REDIS_HOST=<redis-host>
REDIS_PORT=6379
RABBITMQ_URL=amqp://...
ORDER_SERVICE_QUEUE=order_events
INVENTORY_EVENTS_QUEUE=inventory_events
FEEDBACK_EVENTS_QUEUE=feedback_events
SENTRY_DSN=https://...@sentry.io/...
```

---

### 4. REZ-personalization-engine

**Directory:** `packages/intelligence-platform/services/REZ-personalization-engine`

**Setup:**
```bash
cd packages/intelligence-platform/services/REZ-personalization-engine
cp .env.example .env
# Edit .env with production values
```

**Build & Deploy:**
```bash
npm install
npm start
```

**Development:**
```bash
npm run dev  # Uses nodemon
```

**Features:**
- Collaborative filtering weight: 0.4
- Content-based weight: 0.35
- Contextual bandit exploration rate: 0.1
- Diversity threshold: 0.3
- In-memory caching with Node-cache

**Required Environment Variables:**
```
PORT=4017
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://localhost:6379  # Optional
JWT_SECRET=<secure-jwt-secret>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

### 5. REZ-recommendation-engine

**Directory:** `packages/intelligence-platform/services/REZ-recommendation-engine`

**Important:** Uses ES Modules (`"type": "module"`)

**Setup:**
```bash
cd packages/intelligence-platform/services/REZ-recommendation-engine
cp .env.example .env
# Edit .env with production values
```

**Build & Deploy:**
```bash
npm install
npm start
```

**Development:**
```bash
npm run dev  # Uses Node.js --watch flag
```

**Additional Scripts:**
```bash
npm run seed   # Seed database with initial data
npm run clean # Remove node_modules and coverage
```

**Features:**
- Max recommendations per user per day: 50 (configurable)
- Diversity boost enabled by default
- Cooldown period: 24 hours
- Rate limiting per window

**Required Environment Variables:**
```
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
LOG_LEVEL=info
MAX_RECOMMENDATIONS_PER_USER_PER_DAY=50
DIVERSITY_BOOST_ENABLED=true
COOLDOWN_PERIOD_HOURS=24
RATE_LIMIT_WINDOW_MS=86400000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Production Deployment Checklist

### Pre-deployment
- [ ] All `.env` files configured with production values
- [ ] MongoDB Atlas cluster accessible
- [ ] Redis cluster configured (if using distributed caching)
- [ ] RabbitMQ cluster configured (if using message queues)
- [ ] Sentry DSN configured for error tracking
- [ ] All secrets are secure random strings (min 32 characters)
- [ ] `NODE_ENV=production` set in all services

### Build Verification
- [ ] `npm run build` succeeds for all TypeScript services
- [ ] No TypeScript compilation errors
- [ ] No missing type definitions

### Health Checks
- [ ] All services respond to health check endpoints
- [ ] Services can reach MongoDB
- [ ] Services can reach Redis (if configured)
- [ ] Inter-service communication verified

### Monitoring
- [ ] Sentry capturing errors
- [ ] Log level set appropriately (info in production)
- [ ] Health check endpoints monitored

---

## Docker Deployment (Optional)

If using Docker, create a `Dockerfile` in each service directory:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE <PORT>
CMD ["npm", "start"]
```

---

## Rollback Procedure

If deployment fails:

1. Stop the failing service
2. Revert to previous version (git checkout, docker pull previous tag)
3. Restore previous `.env` if needed
4. Restart service
5. Verify health check passes
6. Check Sentry for any errors

---

## Service Dependencies

```
REZ-intelligence-hub
    ├── REZ-user-intelligence-service
    ├── REZ-merchant-intelligence-service
    ├── REZ-personalization-engine
    └── REZ-recommendation-engine

REZ-personalization-engine
    └── REZ-recommendation-engine (for enriched recommendations)

All services require:
    └── MongoDB (shared database cluster)
```

---

## Troubleshooting

### Service Won't Start
1. Check port is not already in use: `lsof -i :<PORT>`
2. Verify `.env` file exists and has required variables
3. Check MongoDB connection string is valid
4. Review logs for specific error messages

### TypeScript Compilation Errors
1. Run `npm install` to ensure all dependencies are installed
2. Check `@types/*` packages are in dependencies, not devDependencies
3. Run `npx tsc --noEmit` to see detailed errors

### Redis Connection Issues
1. Verify Redis is running: `redis-cli ping`
2. Check `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT` in `.env`
3. For development, Redis is optional for most services

### RabbitMQ Connection Issues
1. Verify RabbitMQ is running
2. Check `RABBITMQ_URL` in `.env`
3. Queues will be created automatically on first connection

---

## Version History

| Date | Changes |
|------|---------|
| 2026-05-04 | Initial deployment guide created |
