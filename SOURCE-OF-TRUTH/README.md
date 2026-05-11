# REZ Platform — Source of Truth

**Last Updated:** 2026-05-09
**Version:** 13.0.0 - MERCHANT APP AUDIT COMPLETE

---

## REPOSITORY AUDIT (May 9, 2026)

### TOTAL REPOS: 103

| Category | Count |
|----------|-------|
| ReZ Ecosystem | 56 |
| Archived | 12 |
| Other Projects | 36 |

### REZ ECOSYSTEM: 68 Repos

| Type | Count |
|------|-------|
| lowercase rez- | 55 |
| UPPERCASE REZ- | 13 |

---

## SUPPORT COPILOT ECOSYSTEM

### Primary: `rez-merchant-service` (ACTIVE)

| Endpoint | Purpose |
|----------|---------|
| `/api/v1/merchant/support` | Support tickets |
| `/api/v1/merchant/voice` | Voice ordering |
| `/api/v1/merchant/disputes` | Disputes |
| `/api/v1/merchant/fraud` | Fraud alerts |

### Voice AI: `REZ-intelligence-hub` (ACTIVE)

| Endpoint | Purpose |
|----------|---------|
| `/api/voice/process` | Voice processing |
| `/api/agents/status` | Agent health |
| `/webhook/voice/twilio` | Phone calls |

### Archived: `REZ-support-copilot`

**Status:** Archived - Cannot push (403 error)

---

## VOICE AI - 5 AUTONOMOUS AGENTS

| Agent | Purpose |
|-------|---------|
| OrderAgent | Place, track, cancel orders |
| BookingAgent | Tables, appointments |
| SupportAgent | Complaints, refunds |
| NLUAgent | Entity extraction, sentiment |
| SwarmOrchestrator | Multi-agent coordination |

---

## MERCHANT APP (rez-app-merchant)

### Status: RUNNING ✓

| Attribute | Value |
|-----------|-------|
| **Port** | 8081 |
| **Framework** | Expo SDK 55 |
| **Status** | import.meta error FIXED |
| **Grade** | B+ |

### Critical Fix Applied
```javascript
// metro.config.js
config.resolver.unstable_enablePackageExports = false;
```

### Features
- Dashboard, Orders, Products
- Analytics, Staff Management
- Notifications, Voice Ordering

---

## PRODUCTION DEPLOYMENT INFO

### All Production URLs

| Service | Production URL | Region | Status |
|---------|----------------|--------|--------|
| **Core API** ||||
| rez-api-gateway | https://rez-api-gateway.onrender.com | Singapore | Active |
| rez-auth-service | https://rez-auth-service.onrender.com | Singapore | Active |
| rez-wallet-service | https://rez-wallet-service-36vo.onrender.com | Singapore | Active |
| rez-payment-service | https://rez-payment-service.onrender.com | Singapore | Active |
| rez-order-service | https://rez-order-service-hz18.onrender.com | Singapore | Active |
| rez-merchant-service | https://rez-merchant-service-n3q2.onrender.com | Singapore | Active |
| **Marketing Platform** ||||
| rez-marketing-service | https://rez-marketing-service.onrender.com | Singapore | Active |
| rez-ads-service | https://rez-ads-service.onrender.com | Singapore | Active |
| rez-decision-service | https://rez-decision-service.onrender.com | Singapore | Active |
| rez-lead-intelligence | https://rez-lead-intelligence.onrender.com | Singapore | Active |
| rez-abandonment-tracker | https://rez-abandonment-tracker.onrender.com | Singapore | Active |
| rez-unified-messaging | https://rez-unified-messaging.onrender.com | Singapore | Active |
| **AI/Intelligence** ||||
| rez-intent-graph | https://rez-intent-graph.onrender.com | Singapore | Active |
| rez-intent-agent | https://rez-intent-agent.onrender.com | Singapore | Active |
| rez-action-engine | https://rez-action-engine.onrender.com | Singapore | Active |
| rez-event-platform | https://rez-event-platform.onrender.com | Oregon | Active |
| rez-feedback-service | https://rez-feedback-service.onrender.com | Singapore | Active |
| rez-first-loop | https://rez-first-loop.onrender.com | Singapore | Active |
| **Intelligence Services** ||||
| REZ-intelligence-hub | https://rez-intelligence-hub.onrender.com | Singapore | Active |
| REZ-user-intelligence-service | https://rez-user-intelligence-service.onrender.com | Singapore | Active |
| REZ-merchant-intelligence-service | https://rez-merchant-intelligence-service.onrender.com | Singapore | Active |
| **Hotel/OTA** ||||
| hotel-ota-api | https://hotel-ota-api.onrender.com | Oregon | Active |
| hotel-ota-web | https://hotel-ota-web.onrender.com | Oregon | Active |
| hotel-ota-hotel-panel | https://hotel-ota-hotel-panel.onrender.com | Oregon | Active |
| hotel-ota-admin | https://hotel-ota-admin.onrender.com | Oregon | Active |
| hotel-ota | https://hotel-ota.onrender.com | Singapore | Active |
| ReZ-Hotel-pms | https://rez-hotel-pms.onrender.com | Singapore | Active |
| **CorpPerks** ||||
| corpperks-api | https://corpperks-api.onrender.com | Singapore | Active |
| corpperks-admin | https://corpperks-admin.onrender.com | Singapore | Active |
| corpperks-hotel | https://corpperks-hotel.onrender.com | Singapore | Active |
| **Other Services** ||||
| rez-karma-service | https://rez-karma-service.onrender.com | Singapore | Active |
| rez-catalog-service-1 | https://rez-catalog-service-1.onrender.com | Singapore | Active |
| rez-search-service | https://rez-search-service.onrender.com | Singapore | Active |
| rez-gamification-service | https://rez-gamification-service-3b5d.onrender.com | Singapore | Active |
| analytics-events | https://analytics-events-37yy.onrender.com | Singapore | Active |
| rez-media-events | https://rez-media-events-lfym.onrender.com | Singapore | Active |
| rez-notification-events | https://rez-notification-events-mwdz.onrender.com | Singapore | Active |
| rez-worker | https://rez-worker.onrender.com | Singapore | Active |
| **Web Applications** ||||
| adBazaar | https://adbazaar.onrender.com | Singapore | Active |
| Rendez | https://rendez-entv.onrender.com | Singapore | Active |
| restaurantapp | https://restaurantapp-28fh.onrender.com | Singapore | Active |
| rez-app-consumer-1 | https://rez-app-consumer-1.onrender.com | Singapore | Active |
| rez-app-consumer | https://rez-app-consumer.onrender.com | Oregon | Active |
| **Deprecated/Suspended** ||||
| REZ-support-copilot | - | Singapore | Suspended |
| REZ-ad-copilot | - | Singapore | Suspended |
| REZ-observability | - | Singapore | Suspended |
| REZ-feature-flags | - | Singapore | Suspended |
| REZ-consumer-copilot | - | Singapore | Suspended |
| REZ-merchant-copilot | - | Singapore | Suspended |
| REZ-personalization-engine | - | Singapore | Suspended |
| REZ-recommendation-engine | - | Singapore | Suspended |
| REZ-targeting-engine | - | Singapore | Suspended |

---

## MONGODB CLUSTER INFO

### Active Clusters

| Cluster Name | Connection URI | Purpose |
|--------------|----------------|---------|
| **rez-intent-graph** | mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net | AI/Intelligence/Marketing |
| **cluster0** | mongodb+srv://work_db_user:RmptskyDLFNSJGCA@cluster0.ku78x6g.mongodb.net | Commerce/Core |
| **karma** | mongodb+srv://work_db_user:w1QynpaAoXz6Bgo7@karma.topsbq1.mongodb.net | Karma/Gamification |
| **hotel-pms** | mongodb+srv://work_db_user:KWQ5Te51URo9hPtq@rez-hotel-pms.xlr3tsy.mongodb.net | Hotel/OTA |

### Service-to-Cluster Mapping

#### REZ Core Platform (rez-intent-graph cluster)
| Service | Database |
|---------|----------|
| event-platform | rez-events |
| action-engine | rez-action-engine |
| feedback-service | rez-feedback |
| first-loop | rez-first-loop |
| intent-graph | rez-intent-graph |
| intelligence-hub | rez-intelligence |
| user-intelligence | rez-user-intelligence |
| merchant-intelligence | rez-merchant-intelligence |

#### REZ AI Platform (rez-intent-graph cluster)
| Service | Database |
|---------|----------|
| support-copilot | rez-support |
| push-service | rez-push |
| observability | rez-observability |
| personalization | rez-personalization |
| recommendation | rez-recommendation |
| targeting | rez-targeting |

#### REZ Marketing Platform (rez-intent-graph cluster)
| Service | Database |
|---------|----------|
| marketing-service | rez-marketing |
| ads-service | rez-ads |
| lead-intelligence | rez-lead |
| abandonment-tracker | rez-abandonment |
| decision-service | rez-decision |
| unified-messaging | rez-messaging |

#### REZ Commerce (cluster0)
| Service | Database |
|---------|----------|
| api-gateway | - |
| auth-service | rez-auth |
| merchant-service | rez-merchant |
| order-service | rez-orders |
| payment-service | rez-payments |
| wallet-service | rez-wallet |
| catalog-service | rez-catalog |
| search-service | rez-search |
| finance-service | rez-finance |

#### Karma/Gamification (karma cluster)
| Service | Database |
|---------|----------|
| karma-service | karma |
| gamification | rez-gamification |

#### Hotel/OTA (hotel-pms cluster)
| Service | Database |
|---------|----------|
| hotel-pms | - |

---

## SERVICE CONNECTIONS

### Core Transaction Flow
```
rez-api-gateway (3000)
    │
    ├── rez-auth-service (4002) ──→ cluster0/rez-auth
    ├── rez-wallet-service (4004) ──→ cluster0/rez-wallet
    ├── rez-payment-service (4001) ──→ cluster0/rez-payments
    ├── rez-order-service (3006) ──→ cluster0/rez-orders
    ├── rez-merchant-service (4005) ──→ cluster0/rez-merchant
    ├── rez-catalog-service ──→ cluster0/rez-catalog
    └── rez-search-service ──→ cluster0/rez-search
```

### REZ Mind Flow
```
rez-event-platform (4008)
    │
    ├── rez-action-engine (4009)
    ├── rez-feedback-service (4010)
    ├── rez-first-loop
    └── rez-intent-graph (3007)
            │
            ├── rez-intelligence-hub (4020)
            ├── REZ-user-intelligence-service (3004)
            ├── REZ-merchant-intelligence-service (4012)
            └── Marketing Services
```

### Marketing Flow
```
rez-decision-service (4101)
    │
    ├── rez-lead-intelligence (4106)
    ├── rez-abandonment-tracker (4108)
    ├── rez-marketing-service
    ├── rez-ads-service
    └── rez-unified-messaging (4025)
            │
            ├── WhatsApp
            ├── SMS (Twilio)
            ├── Email (SendGrid)
            └── Push (Firebase)
```

### Event Pipeline
```
analytics-events (37yy)
    │
    ├── rez-media-events (lfym)
    ├── rez-notification-events (mwdz)
    └── All services consume from event stream
```

---

## RENDER DEPLOYMENT SUMMARY

| Metric | Count |
|--------|-------|
| **Total Services** | 74 |
| **Active** | 40 |
| **Suspended** | 34 |
| **Regions** | Singapore (44), Oregon (4) |

### Render Account
- **Account ID:** tea-d705u1ea2pns73av4frg
- **Dashboard:** https://dashboard.render.com

---

## ENVIRONMENT VARIABLES

### All Platforms (rez-intent-graph)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/?appName=rez-ai
```

### REZ Commerce (cluster0)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://work_db_user:RmptskyDLFNSJGCA@cluster0.ku78x6g.mongodb.net/rez-app?retryWrites=true&w=majority&appName=Cluster0
```

### Hotel/PMS
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://work_db_user:KWQ5Te51URo9hPtq@rez-hotel-pms.xlr3tsy.mongodb.net
```

### Karma/Gamification
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://work_db_user:w1QynpaAoXz6Bgo7@karma.topsbq1.mongodb.net/?appName=karma
```

### Redis (All Platforms)
```
REDIS_URL=redis://default:YOUR_REDIS_PASSWORD@redis-cluster.redns.redis-cloud.com:12121
```

### External APIs
```
TWILIO_ACCOUNT_SID=YOUR_TWILIO_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_TOKEN
WHATSAPP_ACCESS_TOKEN=YOUR_WHATSAPP_TOKEN
WHATSAPP_PHONE_ID=YOUR_PHONE_ID
SENDGRID_API_KEY=YOUR_SENDGRID_KEY
```

---

## CONSOLIDATED MONOREPO REPOS: 4 Created

| Platform | GitHub | Services |
|----------|--------|----------|
| [rez-core-platform](https://github.com/imrejaul007/rez-core-platform) | imrejaul007 | 8 services |
| [rez-marketing-backend](https://github.com/imrejaul007/rez-marketing-backend) | imrejaul007 | 6 services |
| [rez-ai-platform](https://github.com/imrejaul007/rez-ai-platform) | imrejaul007 | 6 services |
| [rez-utilities-platform](https://github.com/imrejaul007/rez-utilities-platform) | imrejaul007 | 4 services |

### rez-core-platform Services
| Service | Port | MongoDB |
|---------|------|---------|
| event-platform | 4008 | rez-intent-graph |
| action-engine | 4009 | rez-intent-graph |
| feedback-service | 4010 | rez-intent-graph |
| intent-graph | 3007 | rez-intent-graph |
| intelligence-hub | 4020 | rez-intent-graph |
| user-intelligence | 3004 | rez-intent-graph |
| merchant-intelligence | 4012 | rez-intent-graph |
| intent-predictor | 4018 | rez-intent-graph |

### rez-marketing-backend Services
| Service | Port | MongoDB |
|---------|------|---------|
| marketing-service | 4001 | rez-intent-graph |
| ads-service | 4002 | rez-intent-graph |
| lead-intelligence | 4106 | rez-intent-graph |
| abandonment-tracker | 4108 | rez-intent-graph |
| decision-service | 4101 | rez-intent-graph |
| unified-messaging | 4025 | rez-intent-graph |

### rez-ai-platform Services
| Service | Port | MongoDB |
|---------|------|---------|
| support-copilot | 4022 | rez-intent-graph |
| push-service | 4013 | rez-intent-graph |
| observability | 4031 | rez-intent-graph |
| personalization-engine | 4017 | rez-intent-graph |
| recommendation-engine | 4015 | rez-intent-graph |
| targeting-engine | 3013 | rez-intent-graph |

### rez-utilities-platform Services
| Service | Port | MongoDB |
|---------|------|---------|
| automation-service | 4011 | rez-intent-graph |
| scheduler-service | 3012 | rez-intent-graph |
| insights-service | 4019 | rez-intent-graph |
| worker | - | rez-intent-graph |

---

## ARCHIVED REPOSITORIES: 11

- [x] REZ-adbazaar
- [x] REZ-consumer-copilot
- [x] REZ-feature-flags
- [x] REZ-mind-client
- [x] Rez_v-2
- [x] adbazaar-creator
- [x] rezprive
- [x] REZ-ad-copilot
- [x] adsos
- [x] REZ-ops-dashboard
- [x] REE

---

## QUICK LINKS

| Resource | Link |
|----------|------|
| Marketing Platform | [rez-marketing-platform](https://github.com/imrejaul007/rez-marketing-platform) |
| Commerce Platform | [rez-commerce-platform](https://github.com/imrejaul007/rez-commerce-platform) |
| AI Platform | [rez-ai-platform](https://github.com/imrejaul007/rez-ai-platform) |
| Intelligence Platform | [rez-intelligence-platform](https://github.com/imrejaul007/rez-intelligence-platform) |
| Master Deployment Guide | MASTER-DEPLOYMENT-GUIDE.md |
| Architecture | PRODUCTION-ARCHITECTURE.md |
| All Services | DEPLOYED-SERVICES.md |
| Consolidation | FINAL-CONSOLIDATION.md |

---

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║         REZ PLATFORM - OPERATING SYSTEM FOR LOCAL COMMERCE                  ║
║                                                                             ║
║                    Events → Intelligence → Decisions → Growth                ║
║                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## DOCUMENTATION STRUCTURE

### For Deployment
| Document | Purpose |
|----------|---------|
| [DEPLOYED-SERVICES.md](DEPLOYED-SERVICES.md) | Complete list of all deployed services with URLs |
| [MONGODB-CLUSTERS.md](MONGODB-CLUSTERS.md) | MongoDB cluster configuration |
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | Complete deployment guide |
| [DEPLOYMENT-QUICK-REF.md](DEPLOYMENT-QUICK-REF.md) | Quick deploy card |
| [BUILD-STATUS.md](BUILD-STATUS.md) | Build status |

### For Architecture
| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture |
| [REZ-MIND-V2.md](REZ-MIND-V2.md) | REZ Mind intelligence layer |
| [GROWTH-SERVICES.md](GROWTH-SERVICES.md) | Ads, marketing, analytics |

### For Development
| Document | Purpose |
|----------|---------|
| [API-ENDPOINTS.md](API-ENDPOINTS.md) | All API endpoints |
| [INTEGRATION-GUIDE.md](INTEGRATION-GUIDE.md) | How to integrate apps |
| [EVENT-SCHEMAS.md](EVENT-SCHEMAS.md) | Event schemas |

---

**Last Updated:** 2026-05-06
**Maintained by:** REZ Team
