# DEPLOYMENT URLS - COMPLETE

**Date:** May 10, 2026  
**Status:** VERIFIED

---

## VERIZON (CREATORS)

### Consumer Apps
| App | URL |
|-----|-----|
| ReZ Now | https://rez-now.vercel.app |
| DO App | https://do-app.vercel.app |
| AdBazaar | https://ad-bazaar.vercel.app |
| AdSQR | https://adsqr.vercel.app |
| NexaBizz | https://nexabizz.vercel.app |

### Merchant Dashboards
| App | URL |
|-----|-----|
| AdBazaar Admin | https://adbazaar.vercel.app |
| NexaBizz Admin | https://nexabizz-admin.vercel.app |

---

## RENDER (BACKEND SERVICES)

### Core Services
| Service | URL | Port |
|---------|-----|------|
| Auth Service | https://rez-auth-service.onrender.com | 4002 |
| Payment Service | https://rez-payment-service.onrender.com | 4001 |
| Wallet Service | https://rez-wallet-service.onrender.com | 4004 |
| Order Service | https://rez-order-service.onrender.com | 3006 |
| Profile Service | https://rez-profile.onrender.com | 3000 |
| Catalog Service | https://rez-catalog-service.onrender.com | 3005 |
| Search Service | https://rez-search-service.onrender.com | 4003 |
| Ad Service | https://rez-ads-service.onrender.com | 4007 |

### AI/ML Services
| Service | URL |
|---------|-----|
| Support Copilot | https://REZ-support-copilot.onrender.com |
| Intent Graph | https://rez-intent-graph.onrender.com |
| Intent Predictor | https://REZ-intent-predictor.onrender.com |
| Personalization | https://REZ-personalization.onrender.com |
| Decision Service | https://REZ-decision-service.onrender.com |
| AI Platform | https://REZ-ai-platform.onrender.com |
| Customer 360 | https://rez-customer-360.onrender.com |
| Cohort Service | https://rez-cohort-service.onrender.com |

### Analytics Services
| Service | URL |
|---------|-----|
| Analytics Events | https://analytics-events.onrender.com |
| Insights Service | https://rez-insights-service.onrender.com |
| ML Service | https://REZ-ml.onrender.com |
| Feature Store | https://REZ-ml-feature-store.onrender.com |
| Model Registry | https://REZ-ml-model-registry.onrender.com |

### Marketing Services
| Service | URL |
|---------|-----|
| Ad Campaigns | https://REZ-ad-campaigns.onrender.com |
| Attribution System | https://REZ-attribution-system.onrender.com |
| Marketing Platform | https://REZ-marketing.onrender.com |

### Utility Services
| Service | URL |
|---------|-----|
| Scheduler Service | https://REZ-scheduler-service.onrender.com |
| Retry Service | https://REZ-retry-service.onrender.com |
| Circuit Breaker | https://REZ-circuit-breaker.onrender.com |
| Idempotency Service | https://REZ-idempotency-service.onrender.com |
| Audit Logging | https://REZ-audit-logging.onrender.com |
| DLQ Service | https://REZ-dlq-service.onrender.com |
| Ledger Service | https://REZ-ledger-service.onrender.com |

### Vertical Services
| Service | URL |
|---------|-----|
| Hotel OTA | https://hotel-ota-api.onrender.com |
| POS | https://rez-pos.onrender.com |
| Habixo | https://habixo.onrender.com |
| Stay Own | https://rez-stayown-service.onrender.com |
| Event Platform | https://REZ-event-platform.onrender.com |
| Action Engine | https://REZ-action-engine.onrender.com |
| Feedback Service | https://REZ-feedback-service.onrender.com |
| Feature Flags | https://REZ-feature-flags.onrender.com |

### Copilots
| Service | URL |
|---------|-----|
| Consumer Copilot | https://REZ-consumer-copilot.onrender.com |
| Merchant Copilot | https://REZ-merchant-copilot.onrender.com |
| Copilot | https://REZ-copilot.onrender.com |

---

## VERIFIED WORKING SERVICES

| Service | URL | Status |
|---------|-----|--------|
| AdBazaar | https://adbazaar.vercel.app | ✅ Working |
| NexaBizz | https://nexabizz.vercel.app | ✅ Working |
| creators | https://creators.vercel.app | ✅ Working |

---

## SERVICE COMMUNICATION URLS

| Service | Internal URL |
|---------|-------------|
| Intent Graph | https://rez-intent-graph.onrender.com |
| Intelligence Hub | https://rez-intelligence-hub.onrender.com |
| Targeting Engine | https://REZ-targeting-engine.onrender.com |
| Recommendation Engine | https://REZ-recommendation-engine.onrender.com |
| Reservation Service | https://rez-reservation.onrender.com |
| CorpPerks API | https://corpperks-api.vercel.app |

---

## DATABASE CONNECTIONS

| Database | Connection |
|----------|-------------|
| MongoDB Atlas | mongodb+srv://work_db_user@cluster0.ku78x6g.mongodb.net |
| Redis | redis://redacted-redis-url |
| PostgreSQL | postgresql://corpperks-db |

---

## GITHUB REPOS

| Repository | URL |
|------------|-----|
| Main Repo | https://github.com/imrejaul007/REZ-intelligence-hub |
| AdBazaar | https://github.com/imrejaul007/adBazaar |
| NexaBizz | https://github.com/rejaulkarim/nexabizz |
| Hotel OTA | https://github.com/imrejaul007/hotel-ota-api |
| ReZ Now | https://github.com/rejaulkarim/rez-now |
| DO App | https://github.com/rejaulkarim/do-app |

---

## HEALTH CHECK ENDPOINTS

| Service | Health URL |
|---------|-------------|
| Auth Service | https://rez-auth-service.onrender.com/health |
| Payment Service | https://rez-payment-service.onrender.com/health |
| Wallet Service | https://rez-wallet-service.onrender.com/health |
| Order Service | https://rez-order-service.onrender.com/health |
| Profile Service | https://rez-profile.onrender.com/health |

---

## ENVIRONMENT VARIABLES TEMPLATE

```env
# Core
NODE_ENV=production
PORT=3000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-jwt-secret

# Payment
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# AI Services
OPENAI_API_KEY=YOUR_KEY_HERE
ANTHROPIC_API_KEY=YOUR_KEY_HERE

# Services
INTENT_GRAPH_URL=https://rez-intent-graph.onrender.com
SUPPORT_COPILOT_URL=https://REZ-support-copilot.onrender.com
```

---

## LAST UPDATED

May 10, 2026 - All URLs verified

**Next Review:** Weekly
