# MONGODB CLUSTERS REFERENCE

**Date:** May 6, 2026

---

## YOUR MONGODB CLUSTERS (REAL URIs)

| Cluster | URI | Purpose |
|---------|-----|---------|
| **rez-intent-graph** | mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net | AI/Intelligence |
| **cluster0** | mongodb+srv://work_db_user:RmptskyDLFNSJGCA@cluster0.ku78x6g.mongodb.net | Commerce |
| **karma** | mongodb+srv://work_db_user:w1QynpaAoXz6Bgo7@karma.topsbq1.mongodb.net | Karma/Gamification |
| **hotel-pms** | mongodb+srv://work_db_user:KWQ5Te51URo9hPtq@rez-hotel-pms.xlr3tsy.mongodb.net | Hotel/OTA |

---

## SERVICES → CLUSTER MAPPING

### REZ Core Platform

| Service | Cluster | Database |
|---------|---------|----------|
| event-platform | rez-intent-graph | rez-events |
| action-engine | rez-intent-graph | rez-action-engine |
| feedback-service | rez-intent-graph | rez-feedback |
| first-loop | rez-intent-graph | rez-first-loop |
| intent-graph | rez-intent-graph | rez-intent-graph |
| intelligence-hub | rez-intent-graph | rez-intelligence |
| user-intelligence | rez-intent-graph | rez-user-intelligence |
| merchant-intelligence | rez-intent-graph | rez-merchant-intelligence |

### REZ AI Platform

| Service | Cluster | Database |
|---------|---------|----------|
| support-copilot | rez-intent-graph | rez-support |
| push-service | rez-intent-graph | rez-push |
| observability | rez-intent-graph | rez-observability |
| personalization | rez-intent-graph | rez-personalization |
| recommendation | rez-intent-graph | rez-recommendation |
| targeting | rez-intent-graph | rez-targeting |

### REZ Marketing Platform

| Service | Cluster | Database |
|---------|---------|----------|
| marketing-service | rez-intent-graph | rez-marketing |
| ads-service | rez-intent-graph | rez-ads |
| lead-intelligence | rez-intent-graph | rez-lead |
| abandonment-tracker | rez-intent-graph | rez-abandonment |
| decision-service | rez-intent-graph | rez-decision |
| unified-messaging | rez-intent-graph | rez-messaging |

### REZ Utilities Platform

| Service | Cluster | Database |
|---------|---------|----------|
| automation-service | rez-intent-graph | rez-automation |
| scheduler-service | rez-intent-graph | rez-scheduler |
| insights-service | rez-intent-graph | rez-insights |
| worker | rez-intent-graph | rez-worker |

### REZ Commerce

| Service | Cluster | Database |
|---------|---------|----------|
| api-gateway | cluster0 | - |
| auth-service | cluster0 | rez-auth |
| merchant-service | cluster0 | rez-merchant |
| order-service | cluster0 | rez-orders |
| payment-service | cluster0 | rez-payments |
| wallet-service | cluster0 | rez-wallet |
| catalog-service | cluster0 | rez-catalog |
| search-service | cluster0 | rez-search |
| gamification | karma | rez-gamification |
| finance-service | cluster0 | rez-finance |

### Hotel/StayOwn

| Service | Cluster | Database |
|---------|---------|----------|
| hotel-pms | hotel-pms | - |

### Karma/Gamification

| Service | Cluster | Database |
|---------|---------|----------|
| karma-service | karma | karma |
| rez-gamification | karma | rez-gamification |

---

## ENVIRONMENT VARIABLES FOR RENDER

### All Platforms
```
NODE_ENV=production
LOG_LEVEL=info
```

### rez-ai-platform, rez-marketing-backend, rez-utilities-platform, rez-core-events, rez-core-intelligence
```
MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/?appName=rez-ai
```

### REZ Commerce
```
MONGODB_URI=mongodb+srv://work_db_user:RmptskyDLFNSJGCA@cluster0.ku78x6g.mongodb.net/rez-app?retryWrites=true&w=majority&appName=Cluster0
```

### Hotel/PMS
```
MONGODB_URI=mongodb+srv://work_db_user:KWQ5Te51URo9hPtq@rez-hotel-pms.xlr3tsy.mongodb.net
```

### Karma/Gamification
```
MONGODB_URI=mongodb+srv://work_db_user:w1QynpaAoXz6Bgo7@karma.topsbq1.mongodb.net/?appName=karma
```

### Redis (All Platforms)
```
REDIS_URL=redis://default:YOUR_REDIS_PASSWORD@redis-cluster.redns.redis-cloud.com:12121
```

### External APIs (Marketing)
```
TWILIO_ACCOUNT_SID=YOUR_TWILIO_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_TOKEN
WHATSAPP_ACCESS_TOKEN=YOUR_WHATSAPP_TOKEN
WHATSAPP_PHONE_ID=YOUR_PHONE_ID
SENDGRID_API_KEY=YOUR_SENDGRID_KEY
```

---

## CLUSTER SUMMARY

| Cluster | Used By |
|---------|---------|
| **rez-intent-graph** | All platforms (AI, Marketing, Utilities, Core) |
| **cluster0** | Commerce services |
| **karma** | Karma/Gamification |
| **hotel-pms** | Hotel/PMS |

---

## REDIS

| Redis URI | Used By |
|-----------|---------|
| redis://default:YOUR_PASS@redis-cluster.redns.redis-cloud.com:12121 | All platforms |

---

## IMPORTANT NOTES

1. **Most services use rez-intent-graph cluster** - ONE cluster for most services
2. **Commerce uses cluster0** - Separate cluster for commerce
3. **Karma/Hotel use their own clusters** - Isolated

---

**END OF MONGODB CLUSTERS**
