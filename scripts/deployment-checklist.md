# REZ Ecosystem - Production Deployment Checklist

**Date:** May 5, 2026
**Status:** 13 Services to Deploy

---

## Deployment Status Summary

| # | Service | Status | Health Endpoint | Port |
|---|---------|--------|-----------------|------|
| 1 | rez-gamification-service | READY | /health | 3001 |
| 2 | rez-ads-service | READY | /health | 4007 |
| 3 | rez-marketing-service | READY | /health | - |
| 4 | rez-profile-service | READY | /health | 10000 |
| 5 | rez-feedback-service | READY | /health/live | - |
| 6 | rez-media-events | READY | /health | 3001 |
| 7 | rez-corporate-service | READY | /health | 4030 |
| 8 | rez-karma-service | READY | /health/live | 3009 |
| 9 | rez-travel-service | READY | /health | 4050 |
| 10 | rez-knowledge-base-service | READY | /health | 4025 |
| 11 | rez-observability | READY | /health | 4031 |
| 12 | rez-feature-flags | READY | /health | 4030 |
| 13 | rez-stayown-service | CREATED | /health | 4015 |
| 14 | rez-merchant-intelligence-service | READY | /health | 4012 |

---

## Required Environment Variables

### All Services (Shared)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Set to `production` | Yes |
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `REDIS_URL` | Redis connection URL | Service-specific |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `INTERNAL_SERVICE_TOKEN` | Internal API authentication | Yes |
| `SENTRY_DSN` | Error monitoring | Optional |

### Service-Specific Variables

#### rez-gamification-service
- `PORT`: 3001
- `AUTH_SERVICE_URL`: https://rez-auth-service.onrender.com
- `WALLET_SERVICE_URL`: https://rez-wallet-service.onrender.com

#### rez-ads-service
- `PORT`: 4007
- `ADS_MONGO_URI`: Separate MongoDB for ads data
- `JWT_SECRET`: Required for ad verification
- `INTERNAL_SERVICE_KEY`: Internal API auth

#### rez-marketing-service
- `CORS_ORIGIN`: Comma-separated allowed origins
- `RAZORPAY_KEY_ID/SECRET`: Payment processing
- `TWILIO_*`: SMS notifications
- `WHATSAPP_*`: WhatsApp Business API
- `AWS_*`: Email (SES) configuration
- `FCM_SERVER_KEY`: Push notifications

#### rez-profile-service
- `PORT`: 10000
- `AUTH_SERVICE_URL`: https://rez-auth-service.onrender.com
- `WALLET_SERVICE_URL`: https://rez-wallet-service.onrender.com
- `REE_SERVICE_URL`: https://rez-economic-engine.onrender.com

#### rez-feedback-service
- `MONGODB_URI`: Feedback database
- `EVENT_PLATFORM_URL`: https://rez-event-platform.onrender.com

#### rez-media-events
- `HEALTH_PORT`: 3001
- `CLOUDINARY_*`: Image processing (cloud name, API key, secret)
- `INTERNAL_SERVICE_TOKENS_JSON`: Internal auth

#### rez-corporate-service
- `PORT`: 4030
- `TBO_API_KEY/SECRET/CLIENT_ID`: Travel booking (TBO)
- `RAZORPAY_KEY_ID/SECRET`: Corporate card payments
- `NOTIFICATION_SERVICE_URL`: https://rez-push-service.onrender.com

#### rez-karma-service
- `PORT`: 3009
- `AUTH_SERVICE_URL`: Auth service URL
- `WALLET_SERVICE_URL`: Wallet service URL
- `MERCHANT_SERVICE_URL`: Merchant service URL
- `BATCH_CRON_SCHEDULE`: Cron for batch processing (default: `59 23 * * 0`)
- `CORS_ORIGIN`: Allowed origins
- `RATE_LIMIT_*`: Rate limiting configuration

#### rez-travel-service
- `PORT`: 4050
- `TBO_*`: TBO API credentials

#### rez-knowledge-base-service
- `PORT`: 4025
- `MONGODB_URI`: Knowledge base data

#### rez-observability
- `PORT`: 4031
- `MONGODB_URI`: Observability metrics storage

#### rez-feature-flags
- `PORT`: 4030
- `REDIS_URL`: Feature flag state cache

#### rez-stayown-service
- `PORT`: 4015
- `MONGODB_URI`: StayOwn hotel data
- `SENTRY_DSN`: Error monitoring
- `CORS_ORIGIN`: Allowed origins

#### rez-merchant-intelligence-service
- `PORT`: 4012
- `EVENT_PLATFORM_URL`: Event data source

---

## Pre-Deployment Checklist

- [ ] Verify MongoDB Atlas cluster is accessible
- [ ] Verify Redis instance is running
- [ ] Verify all environment variables are set in Render dashboard
- [ ] Ensure GitHub repositories are linked for auto-deploy
- [ ] Verify render.yaml files exist in each service root

---

## Deployment Order

Deploy services in this order to respect dependencies:

### Tier 1: Foundation Services
1. rez-feature-flags (no dependencies)
2. rez-observability (no dependencies)
3. rez-knowledge-base-service (no dependencies)

### Tier 2: Core Business Services
4. rez-gamification-service
5. rez-karma-service
6. rez-profile-service
7. rez-ads-service

### Tier 3: Integration Services
8. rez-media-events
9. rez-feedback-service
10. rez-stayown-service

### Tier 4: External Integration
11. rez-corporate-service
12. rez-travel-service
13. rez-marketing-service
14. rez-merchant-intelligence-service

---

## Post-Deployment Verification

### Health Check Commands

```bash
# After deployment, verify each service:
curl https://rez-gamification-service.onrender.com/health
curl https://rez-ads-service.onrender.com/health
curl https://rez-marketing-service.onrender.com/health
curl https://rez-profile-service.onrender.com/health
curl https://rez-feedback-service.onrender.com/health/live
curl https://rez-media-events.onrender.com/health
curl https://rez-corporate-service.onrender.com/health
curl https://rez-karma-service.onrender.com/health/live
curl https://rez-travel-service.onrender.com/health
curl https://rez-knowledge-base-service.onrender.com/health
curl https://rez-observability.onrender.com/health
curl https://rez-feature-flags.onrender.com/health
curl https://rez-stayown-service.onrender.com/health
curl https://rez-merchant-intelligence.onrender.com/health
```

### Expected Response
```json
{"status": "ok", "service": "<service-name>"}
```

---

## Rollback Procedure

If deployment fails:

1. **Via Render Dashboard:**
   - Go to Service > Deploys > select previous successful deploy
   - Click "Redeploy" on the working version

2. **Via Render CLI:**
   ```bash
   render deploy --service=<service-name> --env=production --no-wait
   ```

---

## Monitoring

After deployment, monitor:
- Render Dashboard logs for each service
- Sentry dashboard for error rates
- MongoDB Atlas metrics for connection pool
- Redis memory usage

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Infra Lead | Claude | May 5, 2026 | Pending |
| DevOps | | | Pending |
| QA | | | Pending |
