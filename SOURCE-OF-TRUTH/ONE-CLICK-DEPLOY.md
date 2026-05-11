# REZ Ecosystem - One-Click Deployment Guide

Complete deployment guide for the REZ ecosystem on Render.com

---

## Table of Contents

1. [Pre-requisites](#pre-requisites)
2. [Architecture Overview](#architecture-overview)
3. [Service Dependencies](#service-dependencies)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Pre-requisites

### Required Accounts

- [ ] Render.com account (with payment method for paid plans)
- [ ] GitHub account with access to all REZ repositories
- [ ] Supabase account (or other PostgreSQL provider)
- [ ] OpenAI API key (for AI-powered services)
- [ ] Firebase Cloud Messaging credentials (for push notifications)
- [ ] Email service provider credentials (SendGrid/Resend)

### Tools

```bash
# Install Render CLI
npm install -g @render/cli

# Install additional tools
brew install jq curl git

# Verify installations
render --version
jq --version
```

### Local Setup

```bash
# Clone all REZ repositories
git clone git@github.com:your-org/REZ-event-platform.git
git clone git@github.com:your-org/REZ-action-engine.git
git clone git@github.com:your-org/REZ-feedback-service.git
git clone git@github.com:your-org/REZ-user-intelligence-service.git
git clone git@github.com:your-org/REZ-merchant-intelligence-service.git
git clone git@github.com:your-org/REZ-intent-predictor.git
git clone git@github.com:your-org/REZ-intelligence-hub.git
git clone git@github.com:your-org/REZ-targeting-engine.git
git clone git@github.com:your-org/REZ-recommendation-engine.git
git clone git@github.com:your-org/REZ-personalization-engine.git
git clone git@github.com:your-org/REZ-push-service.git
git clone git@github.com:your-org/REZ-merchant-copilot.git
git clone git@github.com:your-org/REZ-consumer-copilot.git
git clone git@github.com:your-org/REZ-adbazaar.git
git clone git@github.com:your-org/REZ-feature-flags.git
git clone git@github.com:your-org/REZ-observability.git
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           REZ ECOSYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │   Consumer   │     │   Merchant   │     │   Ad Bazaar  │            │
│  │   Copilot    │     │   Copilot   │     │              │            │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘            │
│         │                   │                    │                     │
│         └───────────────────┼────────────────────┘                     │
│                             ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    ENGAGEMENT LAYER                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ Targeting   │  │Recommendation│  │Personalization│            │   │
│  │  │  Engine     │  │   Engine    │  │    Engine   │              │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │   │
│  │         │                │                │                      │   │
│  │         └────────────────┼────────────────┘                      │   │
│  │                          ▼                                         │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │                    Intelligence Hub                        │  │   │
│  │  └──────┬─────────────────┬─────────────────┬────────────────┘  │   │
│  └─────────┼─────────────────┼─────────────────┼────────────────────┘   │
│            │                 │                 │                         │
│  ┌─────────▼─────────┐ ┌─────▼─────────┐ ┌─────▼─────────┐              │
│  │User Intelligence │ │Merchant Intel │ │Intent Predictor│              │
│  └─────────┬─────────┘ └─────┬─────────┘ └─────┬─────────┘              │
│            │                 │                 │                         │
│  ┌─────────▼─────────────────▼─────────────────▼────────────────────┐ │
│  │                      CORE ANALYTICS LAYER                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │ │
│  │  │Event Platform│  │Action Engine │  │Feedback Svc  │              │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │Feature Flags │  │ Push Service │  │Observability │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Service Dependencies

### Tier 1 - Foundation (Deploy First)

| Service | Dependencies | Description |
|---------|--------------|-------------|
| `REZ-feature-flags` | None | Feature flag management |
| `REZ-observability` | None | Logging, metrics, tracing |
| `REZ-push-service` | None | Push notification delivery |

### Tier 2 - Core Analytics

| Service | Dependencies | Description |
|---------|--------------|-------------|
| `REZ-event-platform` | `REZ-observability` | Event ingestion and processing |
| `REZ-action-engine` | `REZ-event-platform`, `REZ-observability` | User action tracking |
| `REZ-feedback-service` | `REZ-event-platform` | Feedback collection and analysis |

### Tier 3 - Intelligence Layer

| Service | Dependencies | Description |
|---------|--------------|-------------|
| `REZ-user-intelligence-service` | `REZ-event-platform`, `REZ-feedback-service` | User behavior analysis |
| `REZ-merchant-intelligence-service` | `REZ-event-platform` | Merchant analytics |
| `REZ-intent-predictor` | `REZ-user-intelligence-service` | Intent prediction models |
| `REZ-intelligence-hub` | All intelligence services | Central intelligence API |

### Tier 4 - Engagement Layer

| Service | Dependencies | Description |
|---------|--------------|-------------|
| `REZ-targeting-engine` | `REZ-intelligence-hub`, `REZ-feature-flags` | Audience targeting |
| `REZ-recommendation-engine` | `REZ-intelligence-hub`, `REZ-user-intelligence-service` | Product/content recommendations |
| `REZ-personalization-engine` | `REZ-user-intelligence-service`, `REZ-feature-flags` | User experience personalization |

### Tier 5 - Copilots & Marketplace

| Service | Dependencies | Description |
|---------|--------------|-------------|
| `REZ-merchant-copilot` | `REZ-intelligence-hub`, `REZ-merchant-intelligence-service` | AI assistant for merchants |
| `REZ-consumer-copilot` | `REZ-intelligence-hub`, `REZ-recommendation-engine` | AI assistant for consumers |
| `REZ-adbazaar` | `REZ-targeting-engine`, `REZ-event-platform` | Ad campaign management |

---

## Step-by-Step Deployment

### Step 1: Create Render Account and Connect GitHub

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "Get Started" and sign up with GitHub
3. Authorize Render to access your repositories
4. Create a new Render API key at [dashboard.render.com/settings/api-keys](https://dashboard.render.com/settings/api-keys)

### Step 2: Deploy Foundation Services

#### 2.1 Deploy Feature Flags Service

```bash
# Using Render CLI
render deploy --service-name=REZ-feature-flags --plan=starter

# Or create via dashboard:
# 1. New > Web Service
# 2. Connect GitHub repo: REZ-feature-flags
# 3. Configure:
#    - Root Directory: .
#    - Build Command: npm install && npm run build
#    - Start Command: npm start
# 4. Add environment variables (see below)
# 5. Click "Create Web Service"
```

#### 2.2 Deploy Observability Service

```bash
render deploy --service-name=REZ-observability --plan=starter
```

#### 2.3 Deploy Push Service

```bash
render deploy --service-name=REZ-push-service --plan=starter
```

### Step 3: Deploy Core Analytics

#### 3.1 Deploy Event Platform

```bash
render deploy --service-name=REZ-event-platform --plan=starter
```

#### 3.2 Deploy Action Engine

```bash
render deploy --service-name=REZ-action-engine --plan=starter
```

#### 3.3 Deploy Feedback Service

```bash
render deploy --service-name=REZ-feedback-service --plan=starter
```

### Step 4: Deploy Intelligence Layer

Deploy in this order:

```bash
render deploy --service-name=REZ-user-intelligence-service --plan=starter
render deploy --service-name=REZ-merchant-intelligence-service --plan=starter
render deploy --service-name=REZ-intent-predictor --plan=starter
render deploy --service-name=REZ-intelligence-hub --plan=starter
```

### Step 5: Deploy Engagement Layer

```bash
render deploy --service-name=REZ-targeting-engine --plan=starter
render deploy --service-name=REZ-recommendation-engine --plan=starter
render deploy --service-name=REZ-personalization-engine --plan=starter
```

### Step 6: Deploy Copilots & Marketplace

```bash
render deploy --service-name=REZ-merchant-copilot --plan=starter
render deploy --service-name=REZ-consumer-copilot --plan=starter
render deploy --service-name=REZ-adbazaar --plan=starter
```

---

## Environment Variables

### Common Variables (All Services)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Logging level | `info` |
| `RENDER` | Running on Render | `true` |

### Feature Flags Service

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `CORS_ORIGINS` | Allowed CORS origins | Yes |

### Observability Service

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL for logs/metrics | Yes |
| `LOGDNA_KEY` | LogDNA ingestion key | No |
| `DD_API_KEY` | Datadog API key | No |
| `DD_SITE` | Datadog site | No |

### Event Platform

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `KAFKA_BROKERS` | Kafka broker addresses | Yes |
| `REDIS_URL` | Redis for caching | Yes |
| `OBSERVABILITY_URL` | Observability service URL | Yes |
| `EVENT_RETENTION_DAYS` | Days to retain events | No |

### Action Engine

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `EVENT_PLATFORM_URL` | Event platform API URL | Yes |
| `REDIS_URL` | Redis connection | Yes |
| `ACTION_QUEUE_URL` | Queue connection | Yes |

### Feedback Service

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `OPENAI_API_KEY` | OpenAI for sentiment | Yes |
| `EVENT_PLATFORM_URL` | Event platform URL | Yes |
| `SENTIMENT_THRESHOLD` | Sentiment threshold | No |

### User Intelligence Service

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `EVENT_PLATFORM_URL` | Event platform URL | Yes |
| `FEEDBACK_SERVICE_URL` | Feedback service URL | Yes |
| `ML_MODEL_PATH` | Path to ML models | Yes |
| `SEGMENT_CACHE_TTL` | Segment cache TTL | No |

### Merchant Intelligence Service

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `EVENT_PLATFORM_URL` | Event platform URL | Yes |
| `MERCHANT_API_KEY` | Merchant API key | Yes |

### Intent Predictor

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `USER_INTELLIGENCE_URL` | User intelligence URL | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `MODEL_NAME` | OpenAI model to use | No |
| `PREDICTION_CONFIDENCE_THRESHOLD` | Confidence threshold | No |

### Intelligence Hub

| Variable | Description | Required |
|----------|-------------|----------|
| `USER_INTELLIGENCE_URL` | User intelligence URL | Yes |
| `MERCHANT_INTELLIGENCE_URL` | Merchant intelligence URL | Yes |
| `INTENT_PREDICTOR_URL` | Intent predictor URL | Yes |
| `CACHE_TTL` | Cache TTL in seconds | No |

### Targeting Engine

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `INTELLIGENCE_HUB_URL` | Intelligence hub URL | Yes |
| `FEATURE_FLAGS_URL` | Feature flags URL | Yes |
| `TARGETING_RULES_CACHE_TTL` | Rules cache TTL | No |

### Recommendation Engine

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `INTELLIGENCE_HUB_URL` | Intelligence hub URL | Yes |
| `USER_INTELLIGENCE_URL` | User intelligence URL | Yes |
| `REDIS_URL` | Redis for recommendations | Yes |
| `RECOMMENDATION_CACHE_TTL` | Cache TTL | No |

### Personalization Engine

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `USER_INTELLIGENCE_URL` | User intelligence URL | Yes |
| `FEATURE_FLAGS_URL` | Feature flags URL | Yes |
| `REDIS_URL` | Redis for sessions | Yes |

### Push Service

| Variable | Description | Required |
|----------|-------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Yes |
| `APNS_KEY_ID` | Apple Push key ID | No |
| `APNS_TEAM_ID` | Apple team ID | No |
| `APNS_KEY_PATH` | Path to Apple key | No |

### Merchant Copilot

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `INTELLIGENCE_HUB_URL` | Intelligence hub URL | Yes |
| `MERCHANT_INTELLIGENCE_URL` | Merchant intelligence URL | Yes |
| `MAX_TOKENS` | Max response tokens | No |
| `TEMPERATURE` | AI temperature | No |

### Consumer Copilot

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `INTELLIGENCE_HUB_URL` | Intelligence hub URL | Yes |
| `RECOMMENDATION_ENGINE_URL` | Recommendation engine URL | Yes |
| `MAX_TOKENS` | Max response tokens | No |
| `TEMPERATURE` | AI temperature | No |

### Ad Bazaar

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `TARGETING_ENGINE_URL` | Targeting engine URL | Yes |
| `EVENT_PLATFORM_URL` | Event platform URL | Yes |
| `STRIPE_SECRET_KEY` | Stripe for payments | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `MIN_BID_AMOUNT` | Minimum bid amount | No |
| `MAX_BID_AMOUNT` | Maximum bid amount | No |

---

## Post-Deployment Verification

### Run Health Checks

```bash
# Make scripts executable
chmod +x scripts/health-check.sh
chmod +x scripts/verify-integration.sh

# Run health checks
./scripts/health-check.sh
```

Expected output:
```
==========================================
REZ Ecosystem - Health Check Script
==========================================

Checking health endpoints...

[OK] rez-event-platform - OK
[OK] rez-action-engine - OK
[OK] rez-feedback-service - OK
...
==========================================
Health Check Summary
==========================================

Total Services: 16
Passed: 16
Failed: 0

All services are healthy!
```

### Verify Integrations

```bash
# Run integration tests
./scripts/verify-integration.sh
```

### Check Service URLs

| Service | Expected URL |
|---------|--------------|
| Event Platform | `https://rez-event-platform.onrender.com` |
| Action Engine | `https://rez-action-engine.onrender.com` |
| Feedback Service | `https://rez-feedback-service.onrender.com` |
| User Intelligence | `https://rez-user-intelligence-service.onrender.com` |
| Merchant Intelligence | `https://rez-merchant-intelligence-service.onrender.com` |
| Intent Predictor | `https://rez-intent-predictor.onrender.com` |
| Intelligence Hub | `https://rez-intelligence-hub.onrender.com` |
| Targeting Engine | `https://rez-targeting-engine.onrender.com` |
| Recommendation Engine | `https://rez-recommendation-engine.onrender.com` |
| Personalization Engine | `https://rez-personalization-engine.onrender.com` |
| Push Service | `https://rez-push-service.onrender.com` |
| Merchant Copilot | `https://rez-merchant-copilot.onrender.com` |
| Consumer Copilot | `https://rez-consumer-copilot.onrender.com` |
| Ad Bazaar | `https://rez-adbazaar.onrender.com` |
| Feature Flags | `https://rez-feature-flags.onrender.com` |
| Observability | `https://rez-observability.onrender.com` |

### Manual API Testing

```bash
# Test Event Platform
curl -X POST https://rez-event-platform.onrender.com/api/events \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "event_type": "page_view", "properties": {"page": "/home"}}'

# Test Recommendation Engine
curl -X POST https://rez-recommendation-engine.onrender.com/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "context": "homepage"}'

# Test Feature Flags
curl https://rez-feature-flags.onrender.com/api/flags \
  -H "Authorization: Bearer <token>"
```

---

## Troubleshooting

### Service Won't Start

1. Check environment variables are set
2. Review Build Logs in Render dashboard
3. Verify `package.json` has correct scripts
4. Ensure `npm install` completes successfully

### Database Connection Failed

1. Verify `DATABASE_URL` is correct
2. Check Render's PostgreSQL is running
3. Ensure IP allowlist includes Render IPs
4. Check connection pooling settings

### CORS Errors

1. Set `CORS_ORIGINS` environment variable
2. Verify frontend URL is included
3. Check preflight request handling

### Authentication Errors

1. Verify `JWT_SECRET` is set
2. Check token expiration settings
3. Ensure API keys are correctly formatted

### High Latency

1. Check Render plan (upgrade if needed)
2. Review database query performance
3. Enable caching with Redis
4. Check for N+1 query patterns

### Cost Alerts

Monitor usage at [dashboard.render.com/usage](https://dashboard.render.com/usage)

---

## Quick Reference

### Render CLI Commands

```bash
# Deploy a service
render deploy --service-name=<service-name>

# View logs
render logs --service-name=<service-name>

# Scale a service
render scale --service-name=<service-name> --quantity=2

# Environment variables
render env:set --service-name=<service-name> KEY=VALUE
```

### Emergency Rollback

```bash
# Rollback to previous deploy
render rollback --service-name=<service-name>
```

---

## Support

- Render Documentation: [docs.render.com](https://docs.render.com)
- REZ Documentation: [docs.rez.app](https://docs.rez.app)
- Support Email: support@rez.app
