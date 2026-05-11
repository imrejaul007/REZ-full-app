# REZ Platform - Local Development Ports

Every service listens on a specific local port. Use these when developing locally.

**Last Updated:** 2026-04-30

## Service Ports

### Core Services

| Service | Port | Local URL | Health Endpoint |
|---------|------|-----------|-----------------|
| rez-api-gateway | 5002 | http://localhost:5002 | http://localhost:5002/health |
| rez-auth-service | 4002 | http://localhost:4002 | http://localhost:4002/health |
| rez-merchant-service | 4005 | http://localhost:4005 | http://localhost:4005/health |
| rez-order-service | 3008 | http://localhost:3008 | http://localhost:3008/health |
| rez-payment-service | 4001 | http://localhost:4001 | http://localhost:4001/health |
| rez-wallet-service | 3010 | http://localhost:3010 | http://localhost:3010/health |
| rez-catalog-service | 3005 | http://localhost:3005 | http://localhost:3005/health |
| rez-search-service | 4003 | http://localhost:4003 | http://localhost:4003/health |
| rez-gamification-service | 3001 | http://localhost:3001 | http://localhost:3001/health |

### Supporting Services

| Service | Port | Local URL | Health Endpoint |
|---------|------|-----------|-----------------|
| rez-ads-service | 4007 | http://localhost:4007 | http://localhost:4007/health |
| rez-marketing-service | 4000 | http://localhost:4000 | http://localhost:4000/health |
| rez-scheduler-service | 3012 | http://localhost:3012 | http://localhost:3012/health |
| rez-finance-service | 4005 | http://localhost:4005 | http://localhost:4005/health |
| rez-karma-service | 3009 | http://localhost:3009 | http://localhost:3009/health |

### Event Workers

| Service | Port | Local URL | Health Endpoint |
|---------|------|-----------|-----------------|
| rez-notification-events | 3005 | http://localhost:3005 | http://localhost:3005/health |
| analytics-events | 3006 | http://localhost:3006 | http://localhost:3006/health |
| rez-media-events | 3008 | http://localhost:3008 | http://localhost:3008/health |

### CorpPerks Services

| Service | Port | Local URL | Health Endpoint |
|---------|------|-----------|-----------------|
| rez-corpperks-service | 4013 | http://localhost:4013 | http://localhost:4013/health |
| rez-hotel-service | 4011 | http://localhost:4011 | http://localhost:4011/health |
| rez-procurement-service | 4012 | http://localhost:4012 | http://localhost:4012/health |

### Mobile Apps (Expo/EAS)

| App | Platform | Notes |
|-----|----------|-------|
| rez-app-consumer | iOS/Android | Expo / EAS Build |
| rez-app-marchant | iOS/Android | Expo / EAS Build |

### Web Apps

| App | Platform | Deploy |
|-----|----------|--------|
| rez-app-admin | Web | Vercel |
| rez-web-menu | Web | Vercel |

## CORS Origins (for local dev)

```
https://rez-app-admin.vercel.app
https://rez-app-consumer.vercel.app
https://rez-app-marchant.vercel.app
https://www.rez.money
https://rez.money
https://menu.rez.money
https://admin.rez.money
https://merchant.rez.money
https://rez-web-menu.vercel.app
https://ad-bazaar.vercel.app
https://rez-karma-app.vercel.app
```

## Quick Start - Starting All Services

```bash
# Start MongoDB and Redis first (Docker)
docker run -d -p 27017:27017 mongo:7
docker run -d -p 6379:6379 redis:7-alpine

# Start services in parallel (example)
npm run dev &  # rez-api-gateway
npm run dev &  # rez-auth-service
npm run dev &  # rez-wallet-service
npm run dev &  # rez-payment-service
npm run dev &  # rez-order-service
npm run dev &  # rez-merchant-service
npm run dev &  # rez-catalog-service
npm run dev &  # rez-search-service
npm run dev &  # rez-gamification-service
```

## Service Dependency Map

```
rez-api-gateway:5002
    |
    +-- rez-auth-service:4002
    +-- rez-wallet-service:3010
    +-- rez-payment-service:4001
    +-- rez-order-service:3008
    +-- rez-merchant-service:4005
    +-- rez-catalog-service:3005
    +-- rez-search-service:4003
    +-- rez-gamification-service:3001
    +-- rez-ads-service:4007
    +-- rez-marketing-service:4000
    +-- rez-scheduler-service:3012
    +-- rez-finance-service:4005
    +-- rez-karma-service:3009

rez-corpperks-service:4013
    |
    +-- rez-hotel-service:4011
    +-- rez-procurement-service:4012
    +-- rez-wallet-service:3010
    +-- rez-finance-service:4005
    +-- rez-karma-service:3009
```

## Port Conflicts

If you encounter port conflicts:
1. Check which process is using the port: `lsof -i :PORT`
2. Kill the process: `kill -9 PID`
3. Or change the port in the service's .env file

## Testing Individual Services

```bash
# Test health endpoint
curl http://localhost:4002/health

# Test API endpoint (example)
curl -H "Authorization: Bearer <token>" http://localhost:4002/api/auth/me
```
