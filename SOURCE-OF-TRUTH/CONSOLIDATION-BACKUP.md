# CONSOLIDATION BACKUP & CONNECTIONS DOCUMENT

**Date:** May 6, 2026
**Version:** 1.0

---

## BACKUP STATUS

All services backed up before consolidation:
- [x] rez-lead-intelligence
- [x] rez-abandonment-tracker
- [x] rez-marketing-service
- [x] rez-ads-service
- [x] rez-decision-service
- [x] REZ-intelligence-hub
- [x] REZ-user-intelligence-service
- [x] REZ-merchant-intelligence-service
- [x] REZ-personalization-engine
- [x] REZ-recommendation-engine

---

## SERVICE CONNECTIONS (BEFORE MERGE)

### rez-lead-intelligence
```
Port: 4106
Dependencies:
- MONGODB_URI
- REDIS_URL
- REZMIND_URL (localhost:4010)
- MARKETING_URL (localhost:4000)

Connects to:
- rez-marketing-service (campaign creation)
- REZ Mind (user signals)
- Notification Service (re-engagement)

Environment Variables:
- PORT=4106
- MONGODB_URI=mongodb://...
- REDIS_URL=redis://...
- REZMIND_URL=http://localhost:4010
- MARKETING_URL=http://localhost:4001
```

### rez-abandonment-tracker
```
Port: 4108
Dependencies: None (in-memory)
Environment Variables:
- PORT=4108
- REZMIND_URL=http://localhost:4010
- LEAD_INTELLIGENCE_URL=http://localhost:4106
- MARKETING_URL=http://localhost:4001
```

### rez-marketing-service
```
Port: 4000
Dependencies:
- MongoDB
- Redis
- BullMQ
- Twilio (SMS/WhatsApp)
- Meta WhatsApp
- Firebase
- SMTP/SendGrid

Connects to:
- Intent Graph (external)
- Notification Service
- Redis
```

### rez-ads-service
```
Port: 4002
Dependencies: @rez/shared-types
Environment Variables:
- PORT=4002
- MONGODB_URI
```

### rez-decision-service
```
Port: 4101
Dependencies:
- MongoDB
- Redis
- BullMQ

Connects to:
- REZ Mind (user intent)

Environment Variables:
- PORT=4101
- REZMIND_URL=http://localhost:4010
```

---

## REZ Mind Integration Points

### Before Merge
```
Services that connect to REZ Mind:
1. rez-lead-intelligence → REZMIND_URL
2. rez-abandonment-tracker → REZMIND_URL
3. rez-decision-service → REZMIND_URL
4. rez-unified-messaging → REZMIND_URL
5. rez-dooh-service → REZMIND_URL
6. rez-price-optimization → REZMIND_URL
```

### After Merge
```
All services in marketing-platform will keep same REZMIND_URL
Each service keeps its own port:
- rez-lead-intelligence: 4106
- rez-abandonment-tracker: 4108
- rez-marketing-service: 4000
- rez-ads-service: 4002
- rez-decision-service: 4101
```

---

## MARKETING PLATFORM STRUCTURE

```
packages/marketing-platform/
├── package.json
├── README.md
├── render.yaml
└── services/
    ├── rez-lead-intelligence/
    │   ├── src/
    │   ├── package.json
    │   ├── .env.example
    │   └── README.md
    ├── rez-abandonment-tracker/
    ├── rez-marketing-service/
    ├── rez-ads-service/
    └── rez-decision-service/
```

### Ports (Must Keep)
| Service | Port |
|---------|------|
| rez-lead-intelligence | 4106 |
| rez-abandonment-tracker | 4108 |
| rez-marketing-service | 4000 |
| rez-ads-service | 4002 |
| rez-decision-service | 4101 |

---

## INTELLIGENCE PLATFORM STRUCTURE

```
packages/intelligence-platform/
├── package.json
├── README.md
├── render.yaml
└── services/
    ├── REZ-intelligence-hub/
    ├── REZ-user-intelligence-service/
    ├── REZ-merchant-intelligence-service/
    ├── REZ-personalization-engine/
    └── REZ-recommendation-engine/
```

### Ports (Must Keep)
| Service | Port |
|---------|------|
| REZ-intelligence-hub | 4020 |
| REZ-user-intelligence-service | 3004 |
| REZ-merchant-intelligence-service | 4012 |
| REZ-personalization-engine | 4017 |
| REZ-recommendation-engine | 3001 |

---

## ROLLBACK PLAN

If anything goes wrong:

### Marketing Platform
```bash
# Revert to individual services
cd services/rez-lead-intelligence
git checkout main
npm install && npm start

# Repeat for each service
```

### Intelligence Platform
```bash
# Revert to individual services
cd services/REZ-intelligence-hub
git checkout main
npm install && npm start
```

---

## VERIFICATION CHECKLIST

After merge, verify:

- [ ] All services start
- [ ] Health checks pass
- [ ] Database connections work
- [ ] Redis connections work
- [ ] REZ Mind connections work
- [ ] Individual service endpoints respond
- [ ] Cross-service communication works
- [ ] No port conflicts
- [ ] Environment variables documented

---

## DEPLOYMENT ORDER

### Marketing Platform
1. Deploy rez-lead-intelligence (4106)
2. Deploy rez-abandonment-tracker (4108)
3. Deploy rez-marketing-service (4000)
4. Deploy rez-ads-service (4002)
5. Deploy rez-decision-service (4101)

### Intelligence Platform
1. Deploy REZ-intelligence-hub (4020)
2. Deploy REZ-user-intelligence-service (3004)
3. Deploy REZ-merchant-intelligence-service (4012)
4. Deploy REZ-personalization-engine (4017)
5. Deploy REZ-recommendation-engine (3001)

---

## POST-MERGE DOCUMENTATION

After successful merge, update:
- [ ] SOURCE-OF-TRUTH
- [ ] Environment variables for all services
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Runbooks
