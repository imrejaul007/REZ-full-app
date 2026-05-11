# Environment Variables Guide

> **Complete reference for all environment variables required by ReZ QR systems**

---

## Table of Contents

1. [Global Variables](#global-variables)
2. [rez-now](#rez-now)
3. [Hotel OTA](#hotel-ota)
4. [adBazaar](#adbazaar)
5. [adsqr](#adsqr)
6. [rez-app-merchant](#rez-app-merchant)
7. [Backend Services](#backend-services)
8. [AI/ML Services (ReZ Mind)](#ai-ml-services-rez-mind)
9. [Business Services](#business-services)
10. [Third-Party Services](#third-party-services)
11. [Example Configurations](#example-configurations)

---

## Global Variables

These variables apply to all services:

```env
# Node Environment
NODE_ENV=development          # development | staging | production

# Service URLs (for internal communication)
REZ_AUTH_URL=http://localhost:3001
REZ_WALLET_URL=http://localhost:3002
REZ_PAYMENT_URL=http://localhost:3003
REZ_MERCHANT_URL=http://localhost:3004
INTENT_GRAPH_URL=http://localhost:3005
KNOWLEDGE_BASE_URL=http://localhost:3006
CHAT_SERVICE_URL=http://localhost:3007

# Internal Service Authentication
INTERNAL_SERVICE_TOKEN=your-secure-random-token
```

---

## rez-now

### Public (Client-Side)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_WALLET=true
NEXT_PUBLIC_ENABLE_QR_SCAN=true
```

### Server-Side

```env
# Supabase Service Role (server only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ReZ Services
REZ_AUTH_URL=http://localhost:3001
REZ_WALLET_URL=http://localhost:3002
REZ_PAYMENT_URL=http://localhost:3003

# QR Configuration
QR_TOKEN_SECRET=your-qr-encryption-key
QR_TOKEN_EXPIRY_HOURS=24
```

---

## Hotel OTA

### Public (Client-Side)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your-key-id

# MakCorps (Hotel Search API)
MAKCORPS_API_KEY=your-makcorps-key
```

### Server-Side

```env
# Razorpay
RAZORPAY_KEY_SECRET=rzp_test_your-key-secret

# ReZ Services
REZ_AUTH_URL=http://localhost:3001
REZ_WALLET_URL=http://localhost:3002
REZ_PAYMENT_URL=http://localhost:3003
REZ_MERCHANT_URL=http://localhost:3004

# StayOwn Integration
STAYOWN_API_URL=https://api.stayown.com
STAYOWN_API_KEY=your-stayown-key
```

---

## adBazaar

### Public (Client-Side)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

### Server-Side

```env
# Supabase Service Role
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ReZ Services
REZ_WALLET_URL=http://localhost:3002
REZ_AUTH_URL=http://localhost:3001

# Campaign Limits
MAX_QR_CODES_PER_CAMPAIGN=1000
DEFAULT_ATTRIBUTION_WINDOW_DAYS=30

# Coin Configuration
COIN_REWARD_SCAN=10
COIN_REWARD_VISIT=25
COIN_REWARD_PURCHASE=100
```

---

## adsqr

### Public (Client-Side)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### Server-Side

```env
# Supabase Service Role
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ReZ Services
REZ_WALLET_URL=http://localhost:3002

# Campaign Configuration
CAMPAIGN_MIN_BUDGET=1000
CAMPAIGN_MAX_BUDGET=1000000
```

---

## rez-app-merchant

### Backend

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez-merchant
MONGODB_USER=your-mongodb-user
MONGODB_PASSWORD=your-mongodb-password

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Backend Services

### ReZ Auth Service

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/rez-auth

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

### ReZ Wallet Service

```env
# Server
PORT=3002
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/rez-wallet

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Coin Configuration
COIN_NAME=ReZ Coins
COIN_SYMBOL=RZC
INITIAL_COIN_BALANCE=1000
```

### ReZ Payment Service

```env
# Server
PORT=3003
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/rez-payment

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your-key-id
RAZORPAY_KEY_SECRET=rzp_test_your-key-secret

# Currency
DEFAULT_CURRENCY=INR
SUPPORTED_CURRENCIES=INR,USD
```

### ReZ Merchant Service

```env
# Server
PORT=3004
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/rez-merchant

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## AI/ML Services (ReZ Mind)

### rez-intent-graph (Port 3001)

```env
# Environment
NODE_ENV=development
PORT=3001
AGENT_PORT=3006

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:<PASSWORD>@rez-intent-graph.a8ilqgi.mongodb.net/?appName=rez-intent-graph

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# OpenAI (Optional)
OPENAI_API_KEY=

# Authentication
INTERNAL_SERVICE_TOKEN=change-me-to-a-secure-random-string
MERCHANT_API_KEY=
INTENT_WEBHOOK_SECRET=change-me-to-a-secure-random-string
INTENT_CRON_SECRET=change-me-to-a-secure-random-string

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=info
```

### rez-intelligence-hub (Port 4020)

```env
# Environment
NODE_ENV=development
PORT=4020

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:<PASSWORD>@rez-intent-graph.a8ilqgi.mongodb.net/rez-intelligence

# Redis
REDIS_URL=redis://localhost:6379

# AI APIs
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Authentication
INTERNAL_SERVICE_TOKEN=change-me-to-a-secure-random-string

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=info
```

### rez-personalization-engine (Port 4017)

```env
# Service
PORT=4017
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:<PASSWORD>@rez-intent-graph.a8ilqgi.mongodb.net/rez_personalization

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=rez-personalization-secret-key-change-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Personalization Settings
COLLABORATIVE_FILTERING_WEIGHT=0.4
CONTENT_BASED_WEIGHT=0.35
CONTEXTUAL_BANDIT_EXPLORATION_RATE=0.1
DIVERSITY_THRESHOLD=0.3
CACHE_TTL_SECONDS=300
```

### rez-targeting-engine (Port 3003)

```env
# Environment
NODE_ENV=development
PORT=3003

# MongoDB
MONGODB_URI=mongodb+srv://work_db_user:<PASSWORD>@rez-intent-graph.a8ilqgi.mongodb.net/rez_targeting

# Application Settings
API_VERSION=v1
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Budget Settings
DEFAULT_DAILY_BUDGET=1000
DEFAULT_COST_PER_IMPRESSION=0.05
```

### rez-action-engine (Port 4009)

```env
# Service
PORT=4009
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez-action-engine

# Event Platform
EVENT_PLATFORM_HOST=localhost
EVENT_PLATFORM_PORT=4001
EVENT_PLATFORM_API_KEY=

# NextaBiZ
NEXTABIZ_API_URL=http://localhost:4002
NEXTABIZ_API_KEY=

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Business Services

### rez-feedback-service (Port 4010)

```env
PORT=4010
NODE_ENV=development

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez-feedback

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# ReZ Mind Integration
REZ_MIND_URL=http://localhost:4000
REZ_MIND_API_KEY=your-api-key

# Logging
LOG_LEVEL=info
```

### rez-automation-service (Port 3001)

```env
# Server
PORT=3001
NODE_ENV=development

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez-automation
MONGODB_USER=admin
MONGODB_PASSWORD=your_secure_password_here
MONGODB_AUTH_SOURCE=admin

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here
REDIS_DB=0
REDIS_KEY_PREFIX=rez:automation:

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/automation.log

# Worker Configuration
WORKER_CONCURRENCY=5
WORKER_INTERVAL_MS=1000

# Event Configuration
EVENT_RETRY_ATTEMPTS=3
EVENT_RETRY_DELAY_MS=1000

# Feature Flags
ENABLE_SCHEDULED_RULES=true
ENABLE_EVENT_LISTENER=true
```

### rez-procurement-service (Port 4012)

```env
# Service
PORT=4012
NODE_ENV=production

# CORS
CORS_ORIGIN=https://admin.rez.money,https://rez-app.vercel.app

# MongoDB
MONGO_INITDB_ROOT_USERNAME=rez_admin
MONGO_INITDB_ROOT_PASSWORD=change-me-generate-with-openssl-rand-base64-24
MONGODB_URI=mongodb://rez_admin:password@localhost:27017/rez-procurement?authSource=admin

# Redis
REDIS_PASSWORD=change-me-generate-with-openssl-rand-hex-32
REDIS_URL=redis://:change-me@localhost:6379

# NextaBizz API
NEXTABIZZ_API_URL=https://api.nextabizz.com
NEXTABIZZ_API_KEY=your_api_key_here
NEXTABIZZ_CLIENT_ID=your_client_id
NEXTABIZZ_CLIENT_SECRET=your_client_secret

# Internal Service Auth
INTERNAL_SERVICE_TOKEN=your_internal_token_here
```

### rez-corporate-service (Port 4030)

```env
# Server
PORT=4030
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/rez-corporate

# TBO Travel API
TBO_API_URL=https://api.tbotech.in/v1
TBO_API_KEY=your_tbo_api_key
TBO_API_SECRET=your_tbo_api_secret
TBO_CLIENT_ID=your_tbo_client_id

# Razorpay Corporate Cards
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# GST e-Invoice
GST_EINVOICE_URL=https://einvoice.gst.gov.in

# Notifications
NOTIFICATION_SERVICE_URL=http://localhost:4011

# Logging
LOG_LEVEL=info
```

### rez-finance-service (Port 4005)

```env
# Server
PORT=4005
NODE_ENV=development
SERVICE_NAME=rez-finance-service

# MongoDB
MONGO_INITDB_ROOT_USERNAME=rez_admin
MONGO_INITDB_ROOT_PASSWORD=change-me-generate-with-openssl-rand-base64-24
MONGODB_URI=mongodb://rez_admin:password@localhost:27017/rez-finance?authSource=admin

# Redis
REDIS_PASSWORD=change-me-generate-with-openssl-rand-hex-32
REDIS_URL=redis://:change-me@localhost:6379

# Auth
JWT_SECRET=your_jwt_secret_here
INTERNAL_SERVICE_TOKEN=your_internal_token_here

# CORS
CORS_ORIGIN=https://rez.money,https://app.rez.money

# Partner Aggregator (FinBox)
FINBOX_API_KEY=
FINBOX_API_SECRET=
FINBOX_BASE_URL=https://api.finbox.in

# Credit Bureau
EXPERIAN_CLIENT_ID=
EXPERIAN_CLIENT_SECRET=
EXPERIAN_BASE_URL=

# Sentry
SENTRY_DSN=

# Coins reward rates
COINS_PER_LOAN_DISBURSAL_PERCENT=0.5
COINS_CREDIT_CARD_APPROVAL=500
COINS_CREDIT_SCORE_CHECK=10
COINS_FIRST_EMI_BONUS=200

# AML Compliance Limits (in paise)
AML_CASH_THRESHOLD=10000000
AML_STR_THRESHOLD=5000000
AML_DAILY_LIMIT=50000000
AML_WEEKLY_LIMIT=200000000
AML_MONTHLY_LIMIT=500000000
```

---

## Third-Party Services

### Supabase

```env
# Get these from Supabase Dashboard > Settings > API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database Connection (for migrations)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### Razorpay

```env
# Get from Razorpay Dashboard > Settings > API Keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx

# Test vs Live
RAZORPAY_MODE=test  # test | live
```

### MakCorps (Hotel Search)

```env
# Get from MakCorps API
MAKCORPS_API_KEY=your-api-key
MAKCORPS_API_URL=https://api.makcorps.com

# Optional
MAKCORPS_CACHE_TTL=3600
```

### StayOwn (Property Management)

```env
# Get from StayOwn
STAYOWN_API_URL=https://api.stayown.com
STAYOWN_API_KEY=your-api-key
STAYOWN_WEBHOOK_SECRET=your-webhook-secret
```

---

## Example Configurations

### Development (.env.local)

```env
# ===========================================
# DEVELOPMENT ENVIRONMENT
# ===========================================

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Service URLs
REZ_AUTH_URL=http://localhost:3001
REZ_WALLET_URL=http://localhost:3002
REZ_PAYMENT_URL=http://localhost:3003
REZ_MERCHANT_URL=http://localhost:3004

# Internal Token
INTERNAL_SERVICE_TOKEN=dev-internal-token-change-in-prod

# Razorpay (Test)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# MakCorps
MAKCORPS_API_KEY=dev-makcorps-key

# Node
NODE_ENV=development
```

### Staging (.env.staging)

```env
# ===========================================
# STAGING ENVIRONMENT
# ===========================================

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Service URLs
REZ_AUTH_URL=https://rez-auth.staging.vercel.app
REZ_WALLET_URL=https://rez-wallet.staging.vercel.app
REZ_PAYMENT_URL=https://rez-payment.staging.vercel.app
REZ_MERCHANT_URL=https://rez-merchant.staging.vercel.app

# Internal Token
INTERNAL_SERVICE_TOKEN=staging-internal-token-get-from-vault

# Razorpay (Test)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# MakCorps
MAKCORPS_API_KEY=staging-makcorps-key

# Node
NODE_ENV=staging
```

### Production (.env.production)

```env
# ===========================================
# PRODUCTION ENVIRONMENT
# ===========================================

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Service URLs
REZ_AUTH_URL=https://rez-auth.production.vercel.app
REZ_WALLET_URL=https://rez-wallet.production.vercel.app
REZ_PAYMENT_URL=https://rez-payment.production.vercel.app
REZ_MERCHANT_URL=https://rez-merchant.production.vercel.app

# Internal Token
INTERNAL_SERVICE_TOKEN=get-from-vault-production

# Razorpay (Live)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx

# MakCorps
MAKCORPS_API_KEY=prod-makcorps-key

# Node
NODE_ENV=production
```

---

## Environment Variable Files

| File | Purpose | Git |
|------|---------|-----|
| `.env` | Default values | No |
| `.env.local` | Local overrides | No |
| `.env.development` | Dev specific | No |
| `.env.staging` | Staging | No |
| `.env.production` | Production | No |
| `.env.example` | Template | Yes |
| `.env.template` | Documentation | Yes |

### Creating .env from Template

```bash
# Copy template
cp .env.example .env.local

# Fill in values
nano .env.local
```

---

## Security Notes

1. **Never commit .env files** - Add to `.gitignore`
2. **Use Vault for secrets** - Consider HashiCorp Vault or AWS Secrets Manager
3. **Rotate keys regularly** - Especially in production
4. **Use different keys per environment** - Dev, staging, production
5. **Validate on startup** - Check required vars exist

### .gitignore Entry

```
# Environment files
.env
.env.local
.env.*.local
.env.staging
.env.production
```

---

## Validation Script

Add to your app startup:

```typescript
// src/lib/env-validate.ts
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

export function validateEnv() {
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}`
    );
  }
}
```

---

## Related Documentation

- [Deployment Guide](./DEPLOYMENT-GUIDE.md)
- [Quick Start - Setup](./QUICK-START/SETUP.md)
- [QR Systems Guide](./QR-SYSTEMS-COMPLETE-GUIDE.md)
