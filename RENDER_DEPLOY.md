# Render Deployment Guide

This document covers manual deployment steps for systems that require Render hosting.

---

## Hotel OTA

### Option 1: Render Dashboard (Recommended)

1. **Go to** [dashboard.render.com](https://dashboard.render.com)

2. **Click** "New +" → "Blueprint"

3. **Connect** your GitHub repo: `REZ-intelligence-hub`

4. **Select** `Hotel OTA/render.yaml`

5. **Configure Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/hotel_ota

# Auth
JWT_SECRET=<generate with: openssl rand -base64 48>
JWT_EXPIRY=3600
REFRESH_TOKEN_SECRET=<generate with: openssl rand -base64 48>
REFRESH_TOKEN_EXPIRY=2592000
ADMIN_JWT_SECRET=<generate with: openssl rand -base64 48>

# SMS (MSG91)
MSG91_API_KEY=your_msg91_key
MSG91_SENDER_ID=REZHOT

# Payment (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=rzp_test_xxx
RAZORPAY_WEBHOOK_SECRET=<from Razorpay dashboard>

# Redis
REDIS_URL=redis://localhost:6379

# ReZ Integration
REZ_API_KEY=your_api_key
REZ_API_BASE_URL=https://api.rez.com
REZ_WEBHOOK_SECRET=your_webhook_secret
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
```

6. **Click** "Create Blueprint"

### Option 2: Render CLI

```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Navigate to Hotel OTA
cd "Hotel OTA"

# Deploy
render deploy --service=hotel-ota-api
```

---

## CorpPerks

### Deploy to Render

1. **Go to** [dashboard.render.com](https://dashboard.render.com)

2. **Create** new Web Service

3. **Settings:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Environment Variables** (from CorpPerks env template):
```bash
DATABASE_URL=<postgresql connection string>
JWT_SECRET=<generate>
REDIS_URL=<redis connection string>
```

---

## Restaurant AI

### Deploy to Render

1. **Go to** [dashboard.render.com](https://dashboard.render.com)

2. **Create** new Background Worker

3. **Settings:**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Starter (Free)

4. **Environment Variables:**
```bash
INTENT_GRAPH_URL=http://localhost:3007
INTELLIGENCE_URL=http://localhost:4020
MONGODB_URI=<mongodb connection string>
```

---

## Required Environment Variables

### Generate Secrets

```bash
# Generate JWT Secret
openssl rand -base64 48

# Generate API Keys
openssl rand -hex 32
```

### Database Setup

1. Create PostgreSQL database on Render
2. Copy internal URL to `DATABASE_URL`
3. Run migrations:
```bash
cd packages/database
npm install
npx prisma migrate deploy
```

### Redis Setup

1. Create Redis instance on Render
2. Copy connection URL to `REDIS_URL`

---

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
npm cache clean --force
rm -rf node_modules
npm install
```

### Database Connection

1. Check DATABASE_URL format
2. Verify Render PostgreSQL is running
3. Check SSL settings for production

### Service Dependencies

Ensure these services are deployed first:
1. REZ Auth Service
2. REZ Wallet Service
3. Database (PostgreSQL)
4. Redis

---

## Monitoring

- **Logs**: Render Dashboard → Service → Logs
- **Metrics**: Render Dashboard → Service → Insights
- **Health**: Add `/health` endpoint to all services

---

## Support

For issues, check:
1. Render Status: status.render.com
2. Service logs in Render Dashboard
3. GitHub Actions for CI/CD issues
