# REZ ECOSYSTEM - DEPLOYMENT SCRIPTS
**Date:** May 4, 2026

---

## QUICK DEPLOY (One Command)

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App
./deploy-all.sh
```

---

## MANUAL DEPLOY SEQUENCE

### Step 1: Build Shared Packages

```bash
cd packages/rez-shared && npm run build
cd packages/shared-types && npm run build
```

### Step 2: Deploy Core Services (Docker)

```bash
# Auth Service
cd rez-auth-service
docker build -t rez-auth-service .
docker run -d -p 4002:4002 --env-file .env.production rez-auth-service

# Wallet Service
cd ../rez-wallet-service
docker build -t rez-wallet-service .
docker run -d -p 4004:4004 --env-file .env.production rez-wallet-service

# Payment Service
cd ../rez-payment-service
docker build -t rez-payment-service .
docker run -d -p 4001:4001 --env-file .env.production rez-payment-service

# Merchant Service
cd ../rez-merchant-service
docker build -t rez-merchant-service .
docker run -d -p 4005:4005 --env-file .env.production rez-merchant-service

# Order Service
cd ../rez-order-service
docker build -t rez-order-service .
docker run -d -p 3006:3006 --env-file .env.production rez-order-service
```

### Step 3: Deploy Growth Services

```bash
# Gamification
cd rez-gamification-service
docker build -t rez-gamification-service .
docker run -d -p 3001:3001 --env-file .env.production rez-gamification-service

# Ads
cd ../rez-ads-service
docker build -t rez-ads-service .
docker run -d -p 4007:4007 --env-file .env.production rez-ads-service

# Marketing
cd ../rez-marketing-service
docker build -t rez-marketing-service .
docker run -d -p 4000:4000 --env-file .env.production rez-marketing-service
```

### Step 4: Deploy AI Services (ReZ Mind)

```bash
# Intent Graph
cd packages/rez-intent-graph
docker build -t rez-intent-graph .
docker run -d -p 3007:3007 --env-file .env.production rez-intent-graph

# Intelligence Hub
cd ../rez-intelligence-hub
docker build -t rez-intelligence-hub .
docker run -d -p 4020:4020 --env-file .env.production rez-intelligence-hub

# Personalization
cd ../rez-personalization-engine
docker build -t rez-personalization-engine .
docker run -d -p 4017:4017 --env-file .env.production rez-personalization-engine

# Targeting
cd ../rez-targeting-engine
docker build -t rez-targeting-engine .
docker run -d -p 3013:3013 --env-file .env.production rez-targeting-engine

# Action Engine
cd ../rez-action-engine
docker build -t rez-action-engine .
docker run -d -p 3014:3014 --env-file .env.production rez-action-engine
```

### Step 5: Deploy Finance Services

```bash
# Finance Service
cd rez-finance-service
docker build -t rez-finance-service .
docker run -d -p 4006:4006 --env-file .env.production rez-finance-service
```

### Step 6: Deploy Web Platforms

```bash
# ReZ Now
cd rez-now
vercel --prod

# Hotel OTA
cd "Hotel OTA/apps/ota-web"
vercel --prod

# AdBazaar
cd adBazaar
vercel --prod
```

---

## HEALTH CHECKS

### After Deployment

```bash
# Check all services
curl https://api.rez.money/health
curl https://auth.rez.money/health
curl https://wallet.rez.money/health
curl https://pay.rez.money/health
curl https://merchant.rez.money/health
curl https://mind.rez.money/health

# Check specific endpoints
curl https://api.rez.money/api/health
curl https://wallet.rez.money/api/wallet/balance
```

---

## DOCKER COMPOSE (Full Stack)

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  api-gateway:
    image: rez-api-gateway
    ports: [3000:3000]
    depends_on: [auth, wallet, payment, merchant, order]
    env_file: rez-api-gateway/.env.production

  auth-service:
    image: rez-auth-service
    ports: [4002:4002]
    env_file: rez-auth-service/.env.production

  wallet-service:
    image: rez-wallet-service
    ports: [4004:4004]
    env_file: rez-wallet-service/.env.production

  payment-service:
    image: rez-payment-service
    ports: [4001:4001]
    env_file: rez-payment-service/.env.production

  merchant-service:
    image: rez-merchant-service
    ports: [4005:4005]
    env_file: rez-merchant-service/.env.production

  order-service:
    image: rez-order-service
    ports: [3006:3006]
    env_file: rez-order-service/.env.production

  gamification-service:
    image: rez-gamification-service
    ports: [3001:3001]
    env_file: rez-gamification-service/.env.production

  intent-graph:
    image: rez-intent-graph
    ports: [3007:3007]
    env_file: packages/rez-intent-graph/.env.production

  intelligence-hub:
    image: rez-intelligence-hub
    ports: [4020:4020]
    env_file: rez-intelligence-hub/.env.production

  finance-service:
    image: rez-finance-service
    ports: [4006:4006]
    env_file: rez-finance-service/.env.production
```

---

## ROLLBACK PROCEDURE

### If Issues Detected

```bash
# 1. Check which version is running
docker images | grep rez

# 2. Rollback to previous version
docker tag rez-auth-service:previous rez-auth-service:latest
docker tag rez-wallet-service:previous rez-wallet-service:latest
# ... etc

# 3. Restart services
docker-compose restart

# 4. Verify health
./health-check.sh
```

---

*Deployment Scripts v1.0 - May 4, 2026*
