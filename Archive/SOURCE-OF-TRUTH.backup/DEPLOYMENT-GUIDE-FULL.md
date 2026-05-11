# REZ MIND - COMPLETE DEPLOYMENT GUIDE
**Version:** 1.0
**Date:** May 6, 2026
**For:** Developer Execution

---

## TABLE OF CONTENTS

1. [Prerequisites](#1-prerequisites)
2. [MongoDB Setup](#2-mongodb-setup)
3. [Redis Setup](#3-redis-setup)
4. [Core Services Deployment](#4-core-services-deployment)
5. [AI Services Deployment](#5-ai-services-deployment)
6. [ML Services Deployment](#6-ml-services-deployment)
7. [Revenue Services Deployment](#7-revenue-services-deployment)
8. [Environment Variables](#8-environment-variables)
9. [Health Checks](#9-health-checks)
10. [Testing](#10-testing)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. PREREQUISITES

### System Requirements
```bash
- Node.js >= 20.0.0
- npm >= 9.0.0
- MongoDB Atlas account
- Redis Cloud account (or self-hosted)
- Git
```

### Install Node.js
```bash
# macOS
brew install node@20

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Clone Repository
```bash
cd /Users/rejaulkarim/Documents
git clone <your-repo-url> "ReZ Full App"
cd "ReZ Full App"
```

---

## 2. MONGODB SETUP

### 2.1 Create MongoDB Atlas Cluster

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create free tier cluster (M0)
3. Region: Mumbai (ap-mumbai) - closest to users
4. Wait for cluster to provision (~5 minutes)

### 2.2 Create Databases

After cluster is ready, run these commands in MongoDB Atlas → Collections:

```
Databases to create:
- rez_auth
- rez_wallet
- rez_payment
- rez_order
- rez_merchant
- rez_catalog
- rez_intent
- rez_user_intelligence
- rez_merchant_intelligence
- rez_ml_feature_store
- rez_ml_training
- rez_data_quality
- rez_retraining
- rez_bbps
- rez_recharge
- rez_einvoice
```

### 2.3 Create Users

In MongoDB Atlas → Security → Database Access:

| Database | Username | Role |
|----------|----------|------|
| All databases | rez_app_user | readWrite |
| Admin | rez_admin_user | readWriteAnyDatabase |

### 2.4 Network Access

In MongoDB Atlas → Security → Network Access:
- Add IP: `0.0.0.0/0` (allow from anywhere for development)
- For production: Add specific IP ranges

### 2.5 Get Connection String

In MongoDB Atlas → Deployment → Database → Connect:
```
mongodb+srv://rez_app_user:<password>@cluster0.xxxxx.mongodb.net
```

---

## 3. REDIS SETUP

### 3.1 Redis Cloud (Recommended)

1. Go to [redis.com](https://redis.com) - Redis Cloud free tier
2. Create database in Mumbai region
3. Get connection string:
```
redis://default:<password>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345
```

### 3.2 Or Self-hosted Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

---

## 4. CORE SERVICES DEPLOYMENT

### 4.1 Service Order

Deploy in this order (dependencies matter):

```
1. rez-auth-service       (4002) - Auth first
2. rez-wallet-service    (4004) - Depends on auth
3. rez-payment-service   (4001) - Depends on auth + wallet
4. rez-merchant-service  (4005) - Standalone
5. rez-order-service     (3006) - Depends on auth + payment
6. rez-api-gateway       (3000) - Entry point, depends on all
```

### 4.2 Deploy Each Service

For each service, run:

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/<service-name>

# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Create .env file (see section 8)
cp .env.example .env

# 3. Edit .env with your values
nano .env  # or use your editor

# 4. Build
npm run build

# 5. Start
npm run start

# 6. Verify health (see section 9)
curl http://localhost:<port>/health
```

---

## 5. AI SERVICES DEPLOYMENT

### 5.1 Service Order

```
1. rez-intent-graph         (3007) - Core intent tracking
2. rez-user-intelligence   (3004) - User profiles
3. rez-merchant-intelligence (4012) - Merchant insights
4. rez-personalization-engine (4017) - Recommendations
5. rez-targeting-engine     (3013) - Ad targeting
6. rez-action-engine       (3014) - Nudge delivery
7. rez-intelligence-hub    (4020) - Analytics aggregation
```

### 5.2 Copilot Services

```
8. rez-consumer-copilot    (4021) - Consumer AI chat
9. rez-merchant-copilot    (4022) - Merchant AI chat
10. rez-support-copilot    (4033) - Support AI chat
```

### 5.3 Deploy Command

```bash
# For each AI service
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/<ai-service>

npm install --legacy-peer-deps
cp .env.example .env
# Edit .env with your values
npm run build
npm run start

# Verify
curl http://localhost:<port>/health
```

---

## 6. ML SERVICES DEPLOYMENT

### 6.1 Service Order

```
1. rez-ml-feature-store     (4100) - Feature caching
2. rez-ml-model-registry    (4101) - Model versioning
3. rez-training-data-service (4102) - Training data
4. rez-fraud-detection-service (4103) - Fraud ML
5. rez-data-quality-monitor  (4106) - Drift detection
6. rez-ml-retraining-pipeline (4107) - Auto-training
```

### 6.2 Revenue ML

```
7. rez-price-optimization-service (4104) - Dynamic pricing
8. rez-ab-testing-service         (4105) - Experiments
```

### 6.3 ML Training (Run Once)

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-ml-engine

# Generate training data
npm install
npm run generate:all

# Train models
npm run train:all

# Models saved to trained-models/
```

---

## 7. REVENUE SERVICES DEPLOYMENT

### 7.1 Service Order

```
1. rez-bbps-service        (4110) - Bill payments
2. rez-recharge-service    (4111) - Mobile recharge
3. rez-einvoice-service   (4112) - GST e-invoice
```

---

## 8. ENVIRONMENT VARIABLES

### 8.1 rez-auth-service (.env)

```bash
# ============================================
# REZ AUTH SERVICE - Environment Variables
# Port: 4002
# ============================================

# Server
PORT=4002
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_auth?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# OTP (for SMS)
OTP_SECRET=your-otp-secret
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Service URLs (for internal communication)
WALLET_SERVICE_URL=http://localhost:4004
PAYMENT_SERVICE_URL=http://localhost:4001
ORDER_SERVICE_URL=http://localhost:3006
```

### 8.2 rez-wallet-service (.env)

```bash
# ============================================
# REZ WALLET SERVICE - Environment Variables
# Port: 4004
# ============================================

PORT=4004
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_wallet?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# JWT (for internal auth)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Coin Configuration
COIN_EARN_RATE=1        # Coins earned per 1 INR spent
COIN_REDEEM_RATE=0.01   # INR value per coin
MIN_COIN_BALANCE=0
MAX_COIN_BALANCE=100000

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Service URLs
AUTH_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4001

# Logging
LOG_LEVEL=info

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 8.3 rez-payment-service (.env)

```bash
# ============================================
# REZ PAYMENT SERVICE - Environment Variables
# Port: 4001
# ============================================

PORT=4001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_payment?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Payment Gateways
# Razorpay (India)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Stripe (International)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# UPI (India)
UPI_ENABLED=true
UPI_MERCHANT_ID=your-merchant-id

# Simulated Mode (for testing)
SIMULATED_PAYMENTS=true

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Service URLs
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
ORDER_SERVICE_URL=http://localhost:3006

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 8.4 rez-order-service (.env)

```bash
# ============================================
# REZ ORDER SERVICE - Environment Variables
# Port: 3006
# ============================================

PORT=3006
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_order?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Order Configuration
ORDER_EXPIRY_MINUTES=30
MAX_ITEMS_PER_ORDER=50
MIN_ORDER_VALUE=10
MAX_ORDER_VALUE=100000

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Service URLs
AUTH_SERVICE_URL=http://localhost:4002
PAYMENT_SERVICE_URL=http://localhost:4001
WALLET_SERVICE_URL=http://localhost:4004
MERCHANT_SERVICE_URL=http://localhost:4005
CATALOG_SERVICE_URL=http://localhost:4007
NOTIFICATION_SERVICE_URL=http://localhost:4005

# Intent Service (for AI)
INTENT_SERVICE_URL=http://localhost:3007

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 8.5 rez-merchant-service (.env)

```bash
# ============================================
# REZ MERCHANT SERVICE - Environment Variables
# Port: 4005
# ============================================

PORT=4005
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_merchant?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Merchant Configuration
COMMISSION_RATE=0.15      # 15% platform commission
SETTLEMENT_FREQUENCY=daily
MIN_SETTLEMENT_AMOUNT=100

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money,https://merchant.rez.money

# Service URLs
AUTH_SERVICE_URL=http://localhost:4002
ORDER_SERVICE_URL=http://localhost:3006
PAYMENT_SERVICE_URL=http://localhost:4001
WALLET_SERVICE_URL=http://localhost:4004

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 8.6 rez-api-gateway (.env)

```bash
# ============================================
# REZ API GATEWAY - Environment Variables
# Port: 3000
# ============================================

PORT=3000
NODE_ENV=development

# MongoDB (for rate limiting)
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_gateway?retryWrites=true&w=majority

# Redis (for rate limiting and caching)
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Rate Limiting
RATE_LIMIT_WINDOW=1m
RATE_LIMIT_MAX=100
RATE_LIMIT_AUTH_MAX=10

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money,https://merchant.rez.money,https://admin.rez.money

# Service URLs (Backend microservices)
AUTH_SERVICE_URL=http://localhost:4002
WALLET_SERVICE_URL=http://localhost:4004
PAYMENT_SERVICE_URL=http://localhost:4001
ORDER_SERVICE_URL=http://localhost:3006
MERCHANT_SERVICE_URL=http://localhost:4005
CATALOG_SERVICE_URL=http://localhost:4007
NOTIFICATION_SERVICE_URL=http://localhost:4005
SEARCH_SERVICE_URL=http://localhost:4008
MARKETING_SERVICE_URL=http://localhost:4009
INTENT_SERVICE_URL=http://localhost:3007

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 8.7 rez-intent-graph (.env)

```bash
# ============================================
# REZ INTENT GRAPH - Environment Variables
# Port: 3007
# ============================================

PORT=3007
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_intent?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Intent Configuration
SIGNAL_WEIGHTS={
  "search": 0.15,
  "view": 0.10,
  "wishlist": 0.25,
  "cart_add": 0.30,
  "hold": 0.35,
  "checkout_start": 0.40,
  "fulfilled": 1.00,
  "abandoned": -0.20
}

DORMANCY_THRESHOLD_DAYS=7
DORMANCY_CONFIDENCE_THRESHOLD=0.30
REVIVAL_SCORE_THRESHOLD=0.50

# Nudge Configuration
NUDGE_MAX_PER_USER_PER_WEEK=3
NUDGE_COOLDOWN_DAYS=7

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Service URLs
AUTH_SERVICE_URL=http://localhost:4002
USER_INTELLIGENCE_URL=http://localhost:3004
ACTION_ENGINE_URL=http://localhost:3014

# Logging
LOG_LEVEL=info
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 8.8 rez-user-intelligence (.env)

```bash
# ============================================
# REZ USER INTELLIGENCE - Environment Variables
# Port: 3004
# ============================================

PORT=3004
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_user_intelligence?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# User Intelligence
PROFILE_CACHE_TTL_SECONDS=1800
AFFINITY_CALCULATION_WINDOW_DAYS=90
ENGAGEMENT_WINDOW_DAYS=30

# Recommendation Config
RECOMMENDATION_LIMIT=20
COLD_START_POPULAR_COUNT=50

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Service URLs
AUTH_SERVICE_URL=http://localhost:4002
INTENT_SERVICE_URL=http://localhost:3007
ORDER_SERVICE_URL=http://localhost:3006

# Logging
LOG_LEVEL=info
```

### 8.9 rez-action-engine (.env)

```bash
# ============================================
# REZ ACTION ENGINE - Environment Variables
# Port: 3014
# ============================================

PORT=3014
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_action?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Action Approval Levels
APPROVAL_SAFE_DISCOUNT=0.10      # 10% - auto-approve
APPROVAL_SEMISAFE_DISCOUNT=0.25   # 25% - manager approval
APPROVAL_RISKY_DISCOUNT=0.40      # 40% - senior approval
APPROVAL_FORBIDDEN_DISCOUNT=0.50   # 50%+ - blocked

# Nudge Budget
DAILY_NUDGE_BUDGET=10000
NUDGE_COST_PER_MESSAGE=0.10

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Service URLs
AUTH_SERVICE_URL=http://localhost:4002
INTENT_SERVICE_URL=http://localhost:3007
NOTIFICATION_SERVICE_URL=http://localhost:4005

# Logging
LOG_LEVEL=info
```

### 8.10 rez-ml-feature-store (.env)

```bash
# ============================================
# REZ ML FEATURE STORE - Environment Variables
# Port: 4100
# ============================================

PORT=4100
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_ml_feature_store?retryWrites=true&w=majority

# Redis (for feature caching)
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# Feature TTL (seconds)
USER_FEATURE_TTL=1800      # 30 minutes
PRODUCT_FEATURE_TTL=3600   # 1 hour
MERCHANT_FEATURE_TTL=1800  # 30 minutes

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Logging
LOG_LEVEL=info
```

### 8.11 rez-ml-model-registry (.env)

```bash
# ============================================
# REZ ML MODEL REGISTRY - Environment Variables
# Port: 4101
# ============================================

PORT=4101
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_ml_registry?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# Model Storage (local or S3)
MODEL_STORAGE_PATH=./models
# MODEL_STORAGE_BUCKET=s3://rez-ml-models (for production)

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Logging
LOG_LEVEL=info
```

### 8.12 rez-fraud-detection-service (.env)

```bash
# ============================================
# REZ FRAUD DETECTION - Environment Variables
# Port: 4103
# ============================================

PORT=4103
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_fraud?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# Fraud Thresholds
FRAUD_THRESHOLD=0.70
HIGH_RISK_THRESHOLD=0.90

# Model
FRAUD_MODEL_PATH=./models/fraud-model-v1.0.0.json

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Logging
LOG_LEVEL=info
```

### 8.13 rez-bbps-service (.env)

```bash
# ============================================
# REZ BBPS SERVICE - Environment Variables
# Port: 4110
# ============================================

PORT=4110
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_bbps?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# BBPS Provider ( Bharat BillPay API)
BBPS_API_URL=https://api.bharatbillpay.com/v1
BBPS_MERCHANT_ID=your-merchant-id
BBPS_API_KEY=your-api-key
BBPS_CLIENT_ID=your-client-id
BBPS_CLIENT_SECRET=your-client-secret

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Service URLs
WALLET_SERVICE_URL=http://localhost:4004
PAYMENT_SERVICE_URL=http://localhost:4001

# Logging
LOG_LEVEL=info
```

### 8.14 rez-recharge-service (.env)

```bash
# ============================================
# REZ RECHARGE SERVICE - Environment Variables
# Port: 4111
# ============================================

PORT=4111
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_recharge?retryWrites=true&w=majority

# Redis
REDIS_URL=redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# Recharge Provider APIs
# Airtel
AIRTEL_API_URL=https://airtelapi.abc.com
AIRTEL_API_KEY=your-airtel-key

# Jio
JIO_API_URL=https://jiorechargeapi.abc.com
JIO_API_KEY=your-jio-key

# Vi
VI_API_URL=https://virechargeapi.abc.com
VI_API_KEY=your-vi-key

# BSNL
BSNL_API_URL=https://bsnlapi.abc.com
BSNL_API_KEY=your-bsnl-key

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Service URLs
WALLET_SERVICE_URL=http://localhost:4004
PAYMENT_SERVICE_URL=http://localhost:4001

# Logging
LOG_LEVEL=info
```

### 8.15 rez-einvoice-service (.env)

```bash
# ============================================
# REZ E-INVOICE SERVICE - Environment Variables
# Port: 4112
# ============================================

PORT=4112
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_einvoice?retryWrites=true&w=majority

# GST e-Invoice API (NIC/GST Portal)
EINVOICE_API_URL=https://einvoice.gst.gov.in
EINVOICE_USERNAME=your-username
EINVOICE_PASSWORD=your-password
EINVOICE_GSTIN=your-gstin

# e-Waybill API
EWAYBILL_API_URL=https://ewaybill.gst.gov.in
EWAYBILL_USERNAME=your-username
EWAYBILL_PASSWORD=your-password

# CORS
CORS_ORIGIN=http://localhost:3000,https://rez.money

# Service URLs
ORDER_SERVICE_URL=http://localhost:3006

# Logging
LOG_LEVEL=info
```

---

## 9. HEALTH CHECKS

After deploying each service, verify with:

```bash
# Core Services
curl http://localhost:4002/health   # Auth
curl http://localhost:4004/health   # Wallet
curl http://localhost:4001/health   # Payment
curl http://localhost:4005/health   # Merchant
curl http://localhost:3006/health   # Order
curl http://localhost:3000/health   # Gateway

# AI Services
curl http://localhost:3007/health   # Intent Graph
curl http://localhost:3004/health   # User Intelligence
curl http://localhost:4012/health   # Merchant Intelligence
curl http://localhost:4017/health   # Personalization
curl http://localhost:3013/health   # Targeting
curl http://localhost:3014/health   # Action Engine
curl http://localhost:4020/health   # Intelligence Hub

# ML Services
curl http://localhost:4100/health   # Feature Store
curl http://localhost:4101/health   # Model Registry
curl http://localhost:4102/health   # Training Data
curl http://localhost:4103/health   # Fraud Detection
curl http://localhost:4106/health   # Data Quality
curl http://localhost:4107/health   # Retraining

# Revenue Services
curl http://localhost:4104/health   # Price Optimization
curl http://localhost:4105/health   # A/B Testing
curl http://localhost:4110/health   # BBPS
curl http://localhost:4111/health   # Recharge
curl http://localhost:4112/health   # E-Invoice
```

Expected response:
```json
{"status":"ok","service":"service-name","uptime":12345}
```

---

## 10. TESTING

### 10.1 Run Transaction Loop Test

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App

# Make test script executable
chmod +x TEST-TRANSACTION-LOOP.sh

# Run tests (requires all services running)
./TEST-TRANSACTION-LOOP.sh
```

### 10.2 Manual API Tests

```bash
# Test 1: Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@rez.money","password":"Test123456!"}'

# Test 2: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@rez.money","password":"Test123456!"}'

# Test 3: Check wallet (use token from login)
curl http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer <TOKEN>"

# Test 4: Capture intent
curl -X POST http://localhost:3000/api/intent/capture \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "eventType": "search",
    "category": "DINING",
    "intentKey": "pizza_nearby",
    "metadata": {"query": "pizza", "location": "mumbai"}
  }'

# Test 5: Get user profile
curl http://localhost:3000/api/intent/profile \
  -H "Authorization: Bearer <TOKEN>"
```

### 10.3 Load Testing (Optional)

```bash
# Install Apache Bench (macOS)
brew install ab

# Load test gateway
ab -n 1000 -c 10 http://localhost:3000/health
```

---

## 11. TROUBLESHOOTING

### Service Won't Start

```bash
# Check if port is in use
lsof -i :4002

# Kill existing process
kill -9 <PID>

# Check logs
tail -100 <service-name>.log
```

### MongoDB Connection Failed

```bash
# Test connection string
mongosh "mongodb+srv://rez_app_user:<PASS>@cluster0.xxxxx.mongodb.net/rez_auth"

# Check network access in MongoDB Atlas
# Add your IP to whitelist
```

### Redis Connection Failed

```bash
# Test Redis connection
redis-cli -u redis://default:<PASS>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345 ping

# Should return: PONG
```

### JWT Validation Failed

```bash
# Make sure JWT_SECRET is same across all services
# Check for whitespace in .env file
# Verify token is not expired
```

### CORS Errors

```bash
# Make sure CORS_ORIGIN includes your frontend URL
# For development: http://localhost:3000
# For production: https://rez.money
```

### Service Can't Reach Other Services

```bash
# Check service URLs in .env
# Make sure all services are running
# Check firewall rules
```

---

## QUICK START CHECKLIST

```bash
# Step 1: Setup MongoDB and Redis
[ ] Create MongoDB Atlas cluster
[ ] Create databases (see section 2.2)
[ ] Create database user
[ ] Create Redis Cloud database
[ ] Get connection strings

# Step 2: Deploy Core Services
[ ] Deploy rez-auth-service (4002)
[ ] Deploy rez-wallet-service (4004)
[ ] Deploy rez-payment-service (4001)
[ ] Deploy rez-merchant-service (4005)
[ ] Deploy rez-order-service (3006)
[ ] Deploy rez-api-gateway (3000)

# Step 3: Verify Core Services
[ ] Health checks pass
[ ] Transaction loop test passes

# Step 4: Deploy AI Services
[ ] Deploy all AI services (ports 3004-4033)
[ ] Health checks pass

# Step 5: Deploy ML Services
[ ] Deploy all ML services (ports 4100-4107)
[ ] Train ML models
[ ] Health checks pass

# Step 6: Deploy Revenue Services
[ ] Deploy BBPS, Recharge, E-Invoice (ports 4110-4112)
[ ] Health checks pass

# Step 7: Launch
[ ] All health checks green
[ ] Transaction loop works
[ ] No errors in logs
[ ] Ready for users!
```

---

## CONTACT

For issues, check:
1. Service logs (`<service>.log`)
2. MongoDB Atlas monitoring
3. Redis Cloud monitoring
4. Sentry dashboard

---

*Document Version: 1.0*
*Created: 2026-05-06*
*For: Developer Execution*
