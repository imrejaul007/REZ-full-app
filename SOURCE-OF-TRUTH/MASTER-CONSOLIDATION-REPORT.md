# MASTER CONSOLIDATION REPORT

**Date:** May 6, 2026
**Version:** 1.0

---

## EXECUTIVE SUMMARY

| Metric | Current | Target |
|--------|---------|--------|
| Total Services | 54 active | 22 |
| Monthly Cost | ~$378 | ~$154 |
| Repos | 101 | 60 |
| Savings | - | $224/mo |

---

## ALL 54 ACTIVE SERVICES

### REZ CORE PLATFORM (8 services)

| Service | Port | Database | External APIs |
|---------|------|----------|---------------|
| rez-event-platform | 4008 | MongoDB | - |
| rez-action-engine | 4009 | MongoDB, Redis | - |
| rez-feedback-service | 4010 | MongoDB | - |
| rez-first-loop | - | MongoDB | - |
| rez-intent-graph | 3001 | MongoDB | Claude AI |
| REZ-intelligence-hub | 4020 | MongoDB | - |
| REZ-user-intelligence-service | 3004 | MongoDB, Redis | - |
| REZ-merchant-intelligence-service | 4012 | MongoDB, Redis | - |

**Can Merge:** YES - All 8 into `rez-core-platform`

---

### REZ COMMERCE (10 services)

| Service | Port | Database | External APIs |
|---------|------|----------|---------------|
| rez-api-gateway | 3001 | - | Internal only |
| rez-auth-service | 4002 | MongoDB | JWT |
| rez-merchant-service | 4005 | MongoDB | - |
| rez-order-service | 3006 | MongoDB | - |
| rez-payment-service | 4001 | MongoDB | Razorpay |
| rez-wallet-service | 4004 | MongoDB, Redis | - |
| rez-catalog-service | 3005 | MongoDB | - |
| rez-search-service | 4003 | MongoDB, Redis | - |
| rez-gamification-service | 3004 | MongoDB | - |
| rez-finance-service | 4007 | MongoDB | - |

**Can Merge:** NO - Keep separate (different external APIs, different scaling)

---

### REZ MARKETING (8 services)

| Service | Port | Database | External APIs |
|---------|------|----------|---------------|
| rez-marketing-service | 4000 | MongoDB, Redis | Twilio, Meta WhatsApp, SendGrid |
| rez-ads-service | 4007 | MongoDB | - |
| adBazaar | - | PostgreSQL | Meta |
| analytics-events | - | MongoDB | - |
| rez-media-events | - | MongoDB | Firebase |
| rez-notification-events | - | Redis | Firebase, APNs |
| REZ-ad-copilot | - | - | (SUSPENDED) |
| REZ-adbazaar | - | - | (SUSPENDED) |

**Can Merge:** YES - Marketing backend 5 services into `rez-marketing-backend`
**Can Merge:** YES - Event services into `rez-event-platform`

---

### REZ AI/INTELLIGENCE (11 services)

| Service | Port | Database | External APIs |
|---------|------|----------|---------------|
| REZ-support-copilot | 4033 | MongoDB | Claude AI |
| REZ-push-service | 4013 | MongoDB, Redis | Firebase, APNs, Twilio |
| REZ-observability | 4031 | MongoDB | - |
| REZ-personalization-engine | 4017 | MongoDB | - |
| REZ-recommendation-engine | 4015 | MongoDB | - |
| REZ-targeting-engine | 3003 | MongoDB | - |
| REZ-feature-flags | 4030 | MongoDB | (SUSPENDED) |
| REZ-intent-predictor | - | MongoDB | (SUSPENDED) |
| rez-intent-agent | - | - | - |
| rez-automation-service | 4014 | MongoDB, Redis | - |
| rez-scheduler-service | 4009 | MongoDB, Redis | - |

**Can Merge:** YES - AI services 6 into `rez-ai-platform`
**Can Merge:** YES - Utilities 4 into `rez-utilities-platform`

---

### REZ APPS (9 services)

| Service | Platform | Connects To |
|---------|----------|-------------|
| rez-app-consumer | React Native | API Gateway, Auth, Catalog, Orders |
| rez-app-marchant | React Native | API Gateway, Merchant, Orders |
| rez-app-admin | React Native | API Gateway, All services |
| rez-now | Next.js | Auth, Wallet, Payment, Order |
| rez-unified-chat | React Library | - |
| rez-web-menu | Monorepo | Merchant, Catalog |
| rez-admin-training-panel | React | AI services |
| rez-backend | Express | MongoDB |
| rez-worker | Node | Redis, MongoDB |

**Can Merge:** NO - Keep separate (different platforms, different purposes)

---

### HOTEL/STAYOWN (7 services)

| Service | Database | Purpose |
|---------|----------|---------|
| hotel-ota | PostgreSQL | User booking |
| hotel-ota-api | PostgreSQL | API |
| hotel-ota-web | - | Web frontend |
| hotel-ota-admin | - | Admin panel |
| hotel-ota-hotel-panel | - | Hotel dashboard |
| ReZ-Hotel-pms | PostgreSQL | Property Management |
| rez-student-service | MongoDB | Student bookings |

**Can Merge:** YES - Hotel services 5 into 3 deploys

---

### CORPPERKS (3 services)

| Service | Database | Purpose |
|---------|----------|---------|
| corpperks-api | MongoDB | Corporate perks API |
| corpperks-admin | - | HR/Admin panel |
| corpperks-hotel | - | Hotel integration |

**Can Merge:** YES - 3 into 2 deploys

---

### STANDALONE (6 services)

| Service | Purpose | Keep? |
|---------|---------|--------|
| Rendez | Social dating | YES |
| Do | AI app | YES |
| restaurantapp | Restaurant platform | YES |
| nextabizz | - | SUSPENDED |
| rez-karma-service | Gamification | YES |
| rez-profile-service | User profiles | YES |

---

## RECOMMENDED TARGET ARCHITECTURE

### 1. REZ CORE PLATFORM (1 deployment)
```
rez-core-platform/
├── services/
│   ├── event-platform/
│   ├── action-engine/
│   ├── feedback-service/
│   ├── first-loop/
│   ├── intent-graph/
│   ├── intelligence-hub/
│   ├── user-intelligence/
│   └── merchant-intelligence/
└── render.yaml
```

### 2. REZ MARKETING BACKEND (1 deployment)
```
rez-marketing-backend/
├── services/
│   ├── marketing-service/
│   ├── ads-service/
│   ├── lead-intelligence/
│   ├── abandonment-tracker/
│   ├── decision-service/
│   └── unified-messaging/
└── render.yaml
```

### 3. REZ AI PLATFORM (1 deployment)
```
rez-ai-platform/
├── services/
│   ├── support-copilot/
│   ├── push-service/
│   ├── observability/
│   ├── personalization/
│   ├── recommendation/
│   └── targeting/
└── render.yaml
```

### 4. REZ UTILITIES PLATFORM (1 deployment)
```
rez-utilities-platform/
├── services/
│   ├── automation/
│   ├── scheduler/
│   ├── insights/
│   └── worker/
└── render.yaml
```

### 5. REZ COMMERCE (10 deployments - KEEP SEPARATE)
All 10 commerce services stay separate

### 6. REZ APPS (5 deployments - KEEP SEPARATE)
All 5 apps stay separate

### 7. HOTEL (3 deployments)
```
stayown-user/      - User OTA frontend
hotel-pms/        - Property Management
hotel-backend/     - Shared API
```

### 8. CORPPERKS (2 deployments)
```
corpperks-frontend/ - Admin panel
corpperks-backend/  - API
```

### 9. STANDALONE (6 deployments)
Rendez, Do, restaurant, karma, profile, knowledge-base

---

## SERVICES TO SUSPEND

| Service | Reason |
|---------|--------|
| REZ-ad-copilot | Merged into ad platform |
| REZ-adbazaar | Merged |
| REZ-consumer-copilot | Merged |
| REZ-feature-flags | Merged |
| REZ-intent-predictor | Merged |
| REZ-merchant-copilot | Merged |
| analytics-events | Merged into event platform |
| rez-media-events | Merged into event platform |
| rez-notification-events | Merged into event platform |
| nextabizz | Not used |
| rez-action-engine-1 | Duplicate |
| rez-backend-1 | Duplicate |
| rez-catalog-service | Duplicate (use -1) |
| rez-catalog-service2 | Duplicate |
| rez-gamification-service | Duplicate |
| rez-karma-app | Duplicate |
| rez-merchant-service | Duplicate |
| rez-notification-events | Duplicate |
| rez-order-service | Duplicate |
| rez-wallet-service | Duplicate |
| rez-web-menu | Duplicate |

---

## FEATURES MATRIX

### What Each Consolidated Platform Does

#### rez-core-platform
- [x] Event ingestion & routing
- [x] Decision execution
- [x] Feedback & learning
- [x] Agent orchestration
- [x] Intent detection
- [x] User profiles
- [x] Merchant profiles
- [x] Intelligence hub

#### rez-marketing-backend
- [x] Campaign management
- [x] Lead scoring
- [x] Abandonment tracking
- [x] Decision engine
- [x] Multi-channel messaging
- [x] Ad campaigns
- [x] Analytics

#### rez-ai-platform
- [x] AI Copilot
- [x] Push notifications
- [x] Observability
- [x] Personalization
- [x] Recommendations
- [x] Targeting
- [x] Feature flags

#### rez-utilities-platform
- [x] Automation
- [x] Scheduling
- [x] Insights
- [x] Background workers

---

## MIGRATION CHECKLIST

- [ ] Create rez-core-platform repo
- [ ] Copy all 8 core services
- [ ] Update internal URLs
- [ ] Test all endpoints
- [ ] Deploy to Render
- [ ] Update DNS/URLs
- [ ] Verify all features work
- [ ] Suspend old services

Repeat for each platform.

---

## VERIFICATION CHECKLIST

### Core Platform
- [ ] Event platform health check
- [ ] Action engine routes
- [ ] Feedback service connections
- [ ] Intent graph AI responses
- [ ] Intelligence hub profiles
- [ ] User/Merchant intelligence

### Marketing Backend
- [ ] Campaign creation
- [ ] Lead scoring
- [ ] Abandonment recovery
- [ ] Multi-channel messaging
- [ ] Ad attribution

### AI Platform
- [ ] Copilot chat responses
- [ ] Push notifications
- [ ] Personalization
- [ ] Recommendations
- [ ] Targeting

### Utilities Platform
- [ ] Automation rules
- [ ] Scheduled jobs
- [ ] Analytics/Insights
- [ ] Worker processes

---

## DATABASE CONNECTIONS

### MongoDB Clusters Used
| Cluster | Services |
|---------|----------|
| cluster0 | Commerce services |
| rez-events | Event platform |
| rez-intent | Intent graph |
| rez-intelligence | Intelligence services |
| rez-marketing | Marketing services |

### Redis Connections
| Service | Purpose |
|---------|---------|
| Commerce | Sessions, cache |
| Marketing | Queue, cache |
| Intelligence | Profiles, cache |

---

## EXTERNAL APIS

| API | Services Using It |
|-----|------------------|
| Razorpay | payment-service, wallet-service |
| Twilio | marketing-service, push-service |
| Meta WhatsApp | marketing-service, unified-messaging |
| Firebase | push-service, notification-events |
| Claude AI | support-copilot, intent-graph |
| SendGrid | marketing-service |

---

## CONCLUSION

**Total Deployments:** 54 → 22
**Cost Savings:** $224/month
**Features Preserved:** ALL
**Risk:** LOW (staged migration with rollback)

---

**END OF MASTER REPORT**
