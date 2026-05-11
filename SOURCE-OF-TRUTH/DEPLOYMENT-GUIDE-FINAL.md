# REZ PLATFORM - DEPLOYMENT GUIDE

**Date:** May 6, 2026

---

## DEPLOYMENT STEPS

### STEP 1: Deploy REZ Core Platform

**GitHub:** https://github.com/imrejaul007/rez-core-platform

For each service, go to Render Dashboard → New → Web Service:

#### 1.1 event-platform
```
Root Directory: services/event-platform
PORT: 4008
```

**.env variables:**
```bash
SERVICE_NAME=rez-event-platform
PORT=4008
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-events
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
BULLMQ_CONCURRENCY=5
LOG_LEVEL=info
```

#### 1.2 action-engine
```
Root Directory: services/action-engine
PORT: 4009
```

**.env variables:**
```bash
PORT=4009
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-action-engine
REDIS_URL=redis://default:password@redis-host:6379
EVENT_PLATFORM_HOST=rez-event-platform.onrender.com
EVENT_PLATFORM_PORT=4008
LOG_LEVEL=info
```

#### 1.3 feedback-service
```
Root Directory: services/feedback-service
PORT: 4010
```

**.env variables:**
```bash
PORT=4010
NODE_ENV=production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-feedback
REDIS_URL=redis://default:password@redis-host:6379
REZ_MIND_URL=https://rez-intent-graph.onrender.com
REZ_MIND_API_KEY=your-api-key
LOG_LEVEL=info
```

#### 1.4 intent-graph
```
Root Directory: services/intent-graph
PORT: 3001
```

**.env variables:**
```bash
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-intent-graph
REDIS_URL=redis://default:password@redis-host:6379
ANTHROPIC_API_KEY=your-anthropic-key
LOG_LEVEL=info
```

#### 1.5 intelligence-hub
```
Root Directory: services/intelligence-hub
PORT: 4020
```

**.env variables:**
```bash
PORT=4020
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-intelligence
REDIS_URL=redis://default:password@redis-host:6379
LOG_LEVEL=info
```

#### 1.6 user-intelligence
```
Root Directory: services/user-intelligence
PORT: 3004
```

**.env variables:**
```bash
PORT=3004
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-user-intelligence
REDIS_URL=redis://default:password@redis-host:6379
LOG_LEVEL=info
```

#### 1.7 merchant-intelligence
```
Root Directory: services/merchant-intelligence
PORT: 4012
```

**.env variables:**
```bash
PORT=4012
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-merchant-intelligence
REDIS_URL=redis://default:password@redis-host:6379
LOG_LEVEL=info
```

---

### STEP 2: Deploy REZ Marketing Backend

**GitHub:** https://github.com/imrejaul007/rez-marketing-backend

#### 2.1 marketing-service
```
Root Directory: services/marketing-service
PORT: 4000
```

**.env variables:**
```bash
PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-marketing
REDIS_URL=redis://default:password@redis-host:6379
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_ID=your-phone-id
SENDGRID_API_KEY=your-sendgrid-key
LOG_LEVEL=info
```

#### 2.2 ads-service
```
Root Directory: services/ads-service
PORT: 4007
```

**.env variables:**
```bash
PORT=4007
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-ads
REDIS_URL=redis://default:password@redis-host:6379
LOG_LEVEL=info
```

#### 2.3 lead-intelligence
```
Root Directory: services/lead-intelligence
PORT: 4106
```

**.env variables:**
```bash
PORT=4106
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-lead-intelligence
REDIS_URL=redis://default:password@redis-host:6379
REZMIND_URL=https://rez-intent-graph.onrender.com
MARKETING_URL=https://rez-marketing-service.onrender.com
LOG_LEVEL=info
```

#### 2.4 abandonment-tracker
```
Root Directory: services/abandonment-tracker
PORT: 4108
```

**.env variables:**
```bash
PORT=4108
NODE_ENV=production
REZMIND_URL=https://rez-intent-graph.onrender.com
LEAD_INTELLIGENCE_URL=https://rez-lead-intelligence.onrender.com
MARKETING_URL=https://rez-marketing-service.onrender.com
LOG_LEVEL=info
```

#### 2.5 decision-service
```
Root Directory: services/decision-service
PORT: 4027
```

**.env variables:**
```bash
PORT=4027
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-decision
REDIS_URL=redis://default:password@redis-host:6379
REZMIND_URL=https://rez-intent-graph.onrender.com
LOG_LEVEL=info
```

#### 2.6 unified-messaging
```
Root Directory: services/unified-messaging
PORT: 4025
```

**.env variables:**
```bash
PORT=4025
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-messaging
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_ID=your-phone-id
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
REZMIND_URL=https://rez-intent-graph.onrender.com
LOG_LEVEL=info
```

---

### STEP 3: Deploy REZ AI Platform

**GitHub:** https://github.com/imrejaul007/rez-ai-platform

#### 3.1 support-copilot
```
Root Directory: services/support-copilot
PORT: 4033
```

**.env variables:**
```bash
PORT=4033
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-support
REZ_MIND_URL=https://rez-intent-graph.onrender.com
REZ_EVENT_PLATFORM_URL=https://rez-event-platform.onrender.com
LOG_LEVEL=info
```

#### 3.2 push-service
```
Root Directory: services/push-service
PORT: 4013
```

**.env variables:**
```bash
PORT=4013
NODE_ENV=production
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-push
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
FCM_PROJECT_ID=your-fcm-project
FCM_PRIVATE_KEY=your-fcm-private-key
FCM_CLIENT_EMAIL=your-fcm-client-email
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_BUNDLE_ID=your-apns-bundle-id
LOG_LEVEL=info
```

#### 3.3 observability
```
Root Directory: services/observability
PORT: 4031
```

**.env variables:**
```bash
PORT=4031
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-observability
LOG_LEVEL=info
```

#### 3.4 personalization-engine
```
Root Directory: services/personalization-engine
PORT: 4017
```

**.env variables:**
```bash
PORT=4017
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-personalization
REDIS_URL=redis://default:password@redis-host:6379
JWT_SECRET=your-jwt-secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

#### 3.5 recommendation-engine
```
Root Directory: services/recommendation-engine
PORT: 4015
```

**.env variables:**
```bash
PORT=4015
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-recommendation
LOG_LEVEL=info
```

#### 3.6 targeting-engine
```
Root Directory: services/targeting-engine
PORT: 3003
```

**.env variables:**
```bash
PORT=3003
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-targeting
REDIS_URL=redis://default:password@redis-host:6379
LOG_LEVEL=info
```

---

### STEP 4: Deploy REZ Utilities Platform

**GitHub:** https://github.com/imrejaul007/rez-utilities-platform

#### 4.1 automation-service
```
Root Directory: services/automation-service
PORT: 4014
```

**.env variables:**
```bash
PORT=4014
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-automation
REDIS_URL=redis://default:password@redis-host:6379
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
LOG_LEVEL=info
```

#### 4.2 scheduler-service
```
Root Directory: services/scheduler-service
PORT: 4009
```

**.env variables:**
```bash
PORT=4009
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-scheduler
REDIS_URL=redis://default:password@redis-host:6379
LOG_LEVEL=info
```

#### 4.3 insights-service
```
Root Directory: services/insights-service
PORT: (check service)
```

**.env variables:**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-insights
LOG_LEVEL=info
```

#### 4.4 worker
```
Root Directory: services/worker
```

**.env variables:**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-worker
REDIS_URL=redis://default:password@redis-host:6379
LOG_LEVEL=info
```

---

## DEPLOYMENT ORDER

1. **REZ Core Platform** (wait for each before next)
   - event-platform (4008)
   - action-engine (4009)
   - feedback-service (4010)
   - intent-graph (3001)
   - intelligence-hub (4020)
   - user-intelligence (3004)
   - merchant-intelligence (4012)

2. **REZ Marketing Backend**
   - marketing-service (4000)
   - ads-service (4007)
   - lead-intelligence (4106)
   - abandonment-tracker (4108)
   - decision-service (4027)
   - unified-messaging (4025)

3. **REZ AI Platform**
   - support-copilot (4033)
   - push-service (4013)
   - observability (4031)
   - personalization-engine (4017)
   - recommendation-engine (4015)
   - targeting-engine (3003)

4. **REZ Utilities Platform**
   - automation-service (4014)
   - scheduler-service (4009)
   - insights-service
   - worker

---

## COMMON VARIABLES

### MongoDB Clusters
| Cluster | Database |
|---------|----------|
| rez-events | Event platform |
| rez-intent-graph | Intent, AI services |
| rez-intelligence | User/Merchant profiles |
| rez-marketing | Marketing services |
| rez-commerce | Commerce services |

### Redis
```bash
REDIS_URL=redis://default:password@redis-cloud-host:port
```

### External APIs
| Service | API Key |
|---------|---------|
| Anthropic | ANTHROPIC_API_KEY |
| Twilio | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN |
| WhatsApp | WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID |
| SendGrid | SENDGRID_API_KEY |
| Firebase | FCM_PROJECT_ID, FCM_PRIVATE_KEY, FCM_CLIENT_EMAIL |
| Sentry | SENTRY_DSN |

---

## RENDER DEPLOYMENT STEPS

1. Go to https://dashboard.render.com
2. Click "New" → "Web Service"
3. Connect GitHub account
4. Select repo: `rez-core-platform`
5. Set Root Directory: `services/event-platform`
6. Add environment variables
7. Click "Create Web Service"
8. Wait for deployment
9. Repeat for each service

---

**END OF DEPLOYMENT GUIDE**
