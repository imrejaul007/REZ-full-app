# ReZ Mind - Deployment Guide

## IMPORTANT: Shared Database

**ALL ReZ ecosystem apps share ONE database: `rez_ecosystem`**

This allows Intent Graph to track users across:
- ReZ app (consumer)
- ReZ Now (restaurant)
- ReZ merchants
- Rendez
- Karma
- All other apps

---

## Prerequisites

1. **PostgreSQL Database** - Shared by all apps
2. **Redis** - For shared memory (optional but recommended)
3. **Node.js 20+** - Runtime
4. **Database URL**: `postgresql://ota_user:ota_password@localhost:5432/rez_ecosystem`

---

## Step 1: Database Setup

### 1.1 Create Shared Database

```bash
# Using psql (run once)
psql -U postgres -c "CREATE DATABASE rez_ecosystem;"
psql -U postgres -c "GRANT ALL ON DATABASE rez_ecosystem TO ota_user;"

# Or via Docker Compose (already configured)
docker-compose -f docker-compose.rez-mind.yml up -d postgres
```

### 1.2 Run Prisma Migrations

```bash
cd packages/rez-intent-graph

# Use the SHARED database
export DATABASE_URL="postgresql://ota_user:ota_password@localhost:5432/rez_ecosystem"

# Generate Prisma Client (uses Hotel OTA schema)
npx prisma generate --schema=../../Hotel\ OTA/packages/database/prisma/schema.prisma

# Run migrations
npx prisma migrate deploy
```

---

## Step 2: Configure Environment Variables

Create `.env` file in `packages/rez-intent-graph/`:

```env
# SHARED DATABASE - all ReZ apps use this!
DATABASE_URL="postgresql://ota_user:ota_password@localhost:5432/rez_ecosystem"

# Redis (optional - for shared memory)
REDIS_URL="redis://localhost:6379"

# Server
PORT=3005
NODE_ENV=production

# API Keys (for external services)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# Webhook Secrets
RAZORPAY_WEBHOOK_SECRET=""
```

> **Note:** This same DATABASE_URL should be used by ALL ReZ apps!

---

## Step 3: Build

```bash
cd packages/rez-intent-graph

# Install dependencies
npm install

# Build TypeScript
npm run build
```

---

## Step 4: Deploy Options

### Option A: Run Directly

```bash
npm run start
# Server runs on port 3005
```

### Option B: PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/server/agent-server.js --name rez-mind

# Save PM2 config
pm2 save

# Setup startup script
pm2 startup
```

### Option C: Docker

Create `Dockerfile` in `packages/rez-intent-graph/`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
RUN npx prisma generate
RUN npx prisma migrate deploy || true

COPY dist ./dist/

ENV NODE_ENV=production
ENV PORT=3005

EXPOSE 3005

CMD ["node", "dist/server/agent-server.js"]
```

Build and run:
```bash
docker build -t rez-mind:latest -f Dockerfile .
docker run -d -p 3005:3005 --env-file .env rez-mind:latest
```

### Option D: Kubernetes

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rez-mind
spec:
  replicas: 2
  selector:
    matchLabels:
      app: rez-mind
  template:
    metadata:
      labels:
        app: rez-mind
    spec:
      containers:
      - name: rez-mind
        image: your-registry/rez-mind:latest
        ports:
        - containerPort: 3005
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: rez-mind-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: rez-mind
spec:
  selector:
    app: rez-mind
  ports:
  - port: 80
    targetPort: 3005
  type: LoadBalancer
```

Apply:
```bash
kubectl apply -f k8s/
```

---

## Step 5: Configure Client Apps

Add to each app's environment:

```env
# rez-app-consumer, rez-now, etc.
NEXT_PUBLIC_INTENT_CAPTURE_URL=https://your-rez-mind-domain.com
```

Or for internal services:

```env
INTENT_CAPTURE_URL=http://rez-mind:3005
```

---

## Step 6: Health Check

```bash
# Check if server is running
curl http://localhost:3005/health

# Expected response:
# {"status":"ok","timestamp":"2026-04-27T00:00:00.000Z"}
```

---

## API Verification

### Test Intent Capture

```bash
curl -X POST http://localhost:3005/api/intent/capture \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "appType": "hotel_ota",
    "intentKey": "hotel_search_mumbai",
    "eventType": "search",
    "category": "TRAVEL",
    "metadata": {"city": "Mumbai"}
  }'
```

### Test User Intents

```bash
curl http://localhost:3005/api/agent/intents/test_user
```

### Test Dashboard Metrics

```bash
curl http://localhost:3005/api/monitoring/dashboard
```

---

## Monitoring

### Metrics Endpoint

```bash
curl http://localhost:3005/api/monitoring/metrics
```

### Active Alerts

```bash
curl http://localhost:3005/api/monitoring/alerts
```

### WebSocket (for real-time)

Connect to `ws://localhost:3005/ws` with channels:
- `demand_signals`
- `scarcity_alerts`
- `nudge_events`
- `system_metrics`

---

## Scaling

### Horizontal Scaling

ReZ Mind is **stateless** - can run multiple replicas behind a load balancer.

### Redis Clustering

For production, use Redis cluster for shared memory:
```env
REDIS_URL="redis://redis-cluster:6379"
```

### Database Connection Pooling

Use PgBouncer or similar:
```env
DATABASE_URL="postgresql://user:pass@pgbouncer:5432/rez_mind?pgbouncer=true"
```

---

## Troubleshooting

### Database Connection Error

```
Error: P1001: Can't reach database server
```

**Fix:** Check DATABASE_URL and ensure PostgreSQL is running.

### Prisma Schema Not Found

```
Error: P2021: Table 'Intent' does not exist
```

**Fix:** Run `npx prisma migrate deploy`

### WebSocket Connection Failed

```
WebSocket connection failed
```

**Fix:** Ensure firewall allows WebSocket upgrade on port 3005.

---

## Production Checklist

- [ ] PostgreSQL with connection pooling
- [ ] Redis for session/queue storage
- [ ] Environment variables configured
- [ ] Prisma migrations applied
- [ ] Health check endpoint verified
- [ ] Metrics monitoring enabled
- [ ] Load balancer configured (for multiple instances)
- [ ] SSL/TLS termination
- [ ] Logging aggregated
- [ ] Alerts configured

---

# REZ Ecosystem - Full Deployment Guide

## Overview

This document describes the deployment process for the REZ ecosystem, a multi-service platform consisting of:

| Service | Port | Description |
|---------|------|-------------|
| rez-now | 3003 | Merchant QR payment platform |
| verify-service | 3001 | Product verification API |
| rez-try | 3002 | Trial discovery platform |
| auth-api | 4002 | Authentication service |
| merchant-api | 4005 | Merchant management API |
| rendez-backend | 4000 | Rendezvous backend |
| hotel-ota-api | 3000 | Hotel OTA API |

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB disk space

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/rezmoney/rez-ecosystem
cd rez-ecosystem
```

### 2. Environment Variables

Create `.env` files for each service:

```bash
# rez-auth-service/.env
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ADMIN_SECRET=your-admin-secret
JWT_MERCHANT_SECRET=your-merchant-secret
OTP_HMAC_SECRET=your-otp-secret
OTP_TOTP_ENCRYPTION_KEY=your-totp-key

# rez-merchant-service/.env
JWT_MERCHANT_SECRET=your-merchant-secret
ENCRYPTION_KEY=your-encryption-key
INTERNAL_SERVICE_TOKEN=your-service-token

# rendez-backend/.env
JWT_SECRET=your-jwt-secret
REZ_OAUTH_CLIENT_SECRET=your-oauth-secret
```

### 3. Deploy All Services

```bash
# Full deployment (build + start + migrate)
./scripts/deploy.sh

# Or step by step:
./scripts/deploy.sh --build
./scripts/deploy.sh --start
./scripts/deploy.sh --migrate
```

## Deployment Commands

| Command | Description |
|---------|-------------|
| `./scripts/deploy.sh` | Full deployment |
| `./scripts/deploy.sh --build` | Build Docker images only |
| `./scripts/deploy.sh --start` | Start services only |
| `./scripts/deploy.sh --stop` | Stop all services |
| `./scripts/deploy.sh --restart` | Restart all services |
| `./scripts/deploy.sh --logs` | View all logs |
| `./scripts/deploy.sh --logs <service>` | View specific service logs |
| `./scripts/deploy.sh --status` | Check service health |
| `./scripts/deploy.sh --migrate` | Run database migrations |
| `./scripts/deploy.sh --cleanup` | Remove containers and volumes |

## Services

### Databases

| Database | Port | Type | Purpose |
|----------|------|------|---------|
| PostgreSQL | 5432 | Primary DB | rendez-backend, hotel-ota-api |
| MongoDB | 27017-27019 | Document Store | auth-api, merchant-api |
| Redis | 6379 | Cache | Session, rate limiting |

### MongoDB Replica Set

The system uses a 3-node MongoDB replica set:
- `mongodb-primary` (port 27017) - Primary node
- `mongodb-secondary-1` (port 27018) - Secondary node
- `mongodb-secondary-2` (port 27019) - Hidden node

Connection string:
```
mongodb://mongodb-primary:27017,mongodb-secondary-1:27017,mongodb-secondary-2:27017/?replicaSet=rs0
```

## Production Deployment

### 1. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. SSL/TLS Configuration

For production, configure nginx with SSL certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name now.rez.money;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://rez-now:3000;
        # ... rest of proxy configuration
    }
}
```

### 3. Environment Configuration

For production, use environment variables:

```bash
# Set in docker-compose.prod.yml
environment:
  - NODE_ENV=production
  - JWT_SECRET=${JWT_SECRET}
  - DATABASE_URL=${DATABASE_URL}
```

### 4. Health Checks

All services expose health check endpoints:

```bash
# Check all services
./scripts/deploy.sh --status

# Individual health checks
curl http://localhost:4002/health  # auth-api
curl http://localhost:4005/health  # merchant-api
curl http://localhost:4000/health  # rendez-backend
curl http://localhost:3003/health  # rez-now
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f rez-now

# Last 100 lines
docker-compose logs --tail=100
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Troubleshooting

### Services Not Starting

```bash
# Check service logs
docker-compose logs <service-name>

# Restart a specific service
docker-compose restart <service-name>

# Rebuild and restart
docker-compose up -d --build <service-name>
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U rez

# Check MongoDB
docker-compose exec mongodb-primary mongosh --eval "db.runCommand({ping:1})"

# Check Redis
docker-compose exec redis redis-cli ping
```

### Clean Reinstall

```bash
# Stop everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Full reinstall
./scripts/deploy.sh --cleanup
./scripts/deploy.sh
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx                                 │
│              (Reverse Proxy / Load Balancer)                   │
└──────────┬──────────┬──────────┬──────────┬──────────┬─────┘
           │          │          │          │          │
    ┌──────▼───┐ ┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌──▼────┐
    │  Auth    │ │ Merchant│ │ Rendez │ │ Hotel  │ │ REZ   │
    │   API    │ │   API   │ │Backend │ │ OTA    │ │ Now   │
    │  :4002   │ │  :4005  │ │ :4000  │ │  :3000 │ │ :3003 │
    └──────┬───┘ └────┬───┘ └───┬────┘ └───┬────┘ └───┬────┘
           │          │          │          │          │
    ┌──────▼──────────▼──────────▼──────────▼──────────▼─────┐
    │                                                             │
    │  ┌─────────┐  ┌──────────┐  ┌─────────┐                   │
    │  │MongoDB  │  │PostgreSQL│  │  Redis  │                   │
    │  │Replica │  │          │  │         │                   │
    │  │  Set    │  │          │  │         │                   │
    │  └─────────┘  └──────────┘  └─────────┘                   │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

## Security

- All services use health checks for monitoring
- Environment variables for secrets (never commit .env files)
- Non-root users in containers
- TLS/SSL for production
- Rate limiting via Redis
