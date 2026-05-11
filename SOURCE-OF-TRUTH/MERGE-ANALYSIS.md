# MERGE ANALYSIS - WHICH SERVICES CAN COMBINE

**Date:** May 6, 2026
**Goal:** Reduce deploys from 40 to ~15-20 to save money

---

## CURRENT: 40 ACTIVE DEPLOYMENTS

---

## MERGE ANALYSIS

### CRITERIA FOR MERGING

Two services CAN merge if:
1. Different ports (no conflict)
2. Same database (optional)
3. Can run concurrently
4. No conflicting dependencies

Two services CANNOT merge if:
1. Same port
2. Different Node versions
3. Conflicting dependencies
4. Heavy CPU/memory usage (will starve each other)

---

## MERGE GROUPS

### GROUP 1: REZ Core (8 → 2 deploys) - SAVE $42/month

#### Sub-Group 1A: Event + Actions (2 services)
| Service | Port | Database | Memory |
|---------|------|----------|--------|
| event-platform | 4008 | rez-events | Light |
| action-engine | 4009 | rez-action-engine | Light |

**MERGE?** YES - Can run together
- Different ports
- Same Redis
- No conflicts

**Combined Deployment:** `rez-core-events`

#### Sub-Group 1B: Intent + Intelligence (5 services)
| Service | Port | Database |
|---------|------|----------|
| intent-graph | 3001 | rez-intent-graph |
| intelligence-hub | 4020 | rez-intelligence |
| user-intelligence | 3004 | rez-user-intelligence |
| merchant-intelligence | 4012 | rez-merchant-intelligence |
| feedback-service | 4010 | rez-feedback |

**MERGE?** YES - Can run together
- Different ports
- All AI/ML - share Redis cache

**Combined Deployment:** `rez-core-ai`

#### Sub-Group 1C: Standalone (1 service)
| Service | Port | Status |
|---------|------|--------|
| first-loop | - | HEAVY - keep separate |

---

### GROUP 2: REZ AI (6 → 1 deploy) - SAVE $35/month

| Service | Port | Database | Use |
|---------|------|----------|-----|
| support-copilot | 4033 | rez-support | Light |
| push-service | 4013 | rez-push | Medium |
| personalization | 4017 | rez-personalization | Medium |
| recommendation | 4015 | rez-recommendation | Medium |
| targeting | 3003 | rez-targeting | Light |
| observability | 4031 | rez-observability | Light |

**MERGE?** YES - All different ports, light-medium usage

**Combined Deployment:** `rez-ai-platform`

---

### GROUP 3: REZ Marketing (5 → 1 deploy) - SAVE $28/month

| Service | Port | Database | External APIs |
|---------|------|----------|---------------|
| marketing-service | 4000 | rez-marketing | Twilio, WhatsApp, SendGrid |
| ads-service | 4007 | rez-ads | - |
| lead-intelligence | 4106 | rez-lead | - |
| abandonment-tracker | 4108 | - | - |
| decision-service | 4027 | rez-decision | - |

**MERGE?** YES - Different ports, all marketing

**Combined Deployment:** `rez-marketing-all`

---

### GROUP 4: REZ Utilities (4 → 1 deploy) - SAVE $21/month

| Service | Port | Use |
|---------|------|-----|
| automation-service | 4014 | Background jobs |
| scheduler-service | 4009 | Background jobs |
| insights-service | - | Background jobs |
| worker | - | Background jobs |

**MERGE?** YES - All background/workers

**Combined Deployment:** `rez-utilities-all`

---

### GROUP 5: REZ Commerce (10 → 10 deploys) - NO CHANGE

| Service | Port | External APIs | Status |
|---------|------|-------------|--------|
| api-gateway | - | - | KEEP SEPARATE |
| auth-service | 4002 | JWT | KEEP SEPARATE |
| merchant-service | 4005 | - | KEEP SEPARATE |
| order-service | 3006 | - | KEEP SEPARATE |
| payment-service | 4001 | Razorpay | KEEP SEPARATE |
| wallet-service | 4004 | - | KEEP SEPARATE |
| catalog-service | 3005 | - | KEEP SEPARATE |
| search-service | 4003 | - | KEEP SEPARATE |
| gamification | 3004 | - | KEEP SEPARATE |
| finance-service | 4007 | - | KEEP SEPARATE |

**REASON:** Core business logic - keep separate for isolation

---

### GROUP 6: REZ Apps (4 → 4 deploys) - NO CHANGE

| App | Platform | Status |
|-----|----------|--------|
| app-consumer | React Native | KEEP SEPARATE |
| app-merchant | React Native | KEEP SEPARATE |
| app-admin | React Native | KEEP SEPARATE |
| backend | Express | KEEP SEPARATE |

---

### GROUP 7: Hotel (8 → 3 deploys) - SAVE $35/month

#### Sub-Group 7A: Hotel User Apps (3 services)
| Service | Platform |
|---------|----------|
| hotel-ota | React Native |
| hotel-ota-web | Next.js |
| hotel-ota-api | Express |

**MERGE?** YES - Same product

**Combined Deployment:** `hotel-ota-user`

#### Sub-Group 7B: Hotel Admin (4 services)
| Service | Platform |
|---------|----------|
| hotel-ota-admin | Next.js |
| hotel-ota-hotel-panel | Next.js |
| hotel-pms | Next.js |
| hotel-ota-api | Express |

**MERGE?** YES - Hotel admin panel

**Combined Deployment:** `hotel-ota-admin`

#### Sub-Group 7C: Hotel Backend (1 service)
| Service | Status |
|---------|--------|
| hotel-ota-api | Keep separate |

---

### GROUP 8: CorpPerks (3 → 1 deploy) - SAVE $14/month

| Service | Platform |
|---------|----------|
| corpperks-api | Express |
| corpperks-admin | Next.js |
| corpperks-hotel | React Native |

**MERGE?** YES - Same product

**Combined Deployment:** `corpperks-all`

---

### GROUP 9: Duplicates to Suspend (SAVE $0 - already suspended)

| Service | Status |
|---------|--------|
| app-consumer-1 | SUSPEND |
| ReZ-Hotel-pms-1 | SUSPEND |
| rez-gamification-service | SUSPEND |

---

## FINAL MERGE PLAN

### DEPLOYMENTS AFTER MERGE: 20

| # | Deployment | Services | Current Deploys | Savings |
|---|-----------|----------|-----------------|---------|
| 1 | rez-core-events | event + action-engine | 2 | $14 |
| 2 | rez-core-ai | intent + intelligence + feedback | 5 | $35 |
| 3 | rez-core-orchestration | first-loop | 1 | $0 |
| 4 | rez-ai-all | 6 AI services | 6 | $35 |
| 5 | rez-marketing-all | 5 marketing services | 5 | $28 |
| 6 | rez-utilities-all | 4 utility services | 4 | $21 |
| 7-16 | rez-commerce-* | 10 commerce services | 10 | $0 |
| 17-20 | rez-apps-* | 4 apps | 4 | $0 |
| 21 | hotel-ota-user | 3 user services | 3 | $14 |
| 22 | hotel-ota-admin | 4 admin services | 4 | $21 |
| 23 | hotel-ota-api | API | 1 | $0 |
| 24 | corpperks-all | 3 services | 3 | $14 |
| 25 | Others | adBazaar, Rendez, restaurant | 3 | $0 |

**TOTAL DEPLOYMENTS: 25 (was 40)**
**SAVINGS: $182/month**

---

## HOW TO MERGE

### Step 1: Create start.sh for merged service

```bash
#!/bin/bash
# Start multiple services concurrently
npm run dev:event-platform &
npm run dev:action-engine &
wait
```

### Step 2: Use concurrently in package.json

```json
"scripts": {
  "dev": "concurrently \"npm:event\" \"npm:action\"",
  "event": "cd services/event-platform && npm start",
  "action": "cd services/action-engine && npm start"
}
```

### Step 3: Deploy merged repo to Render

---

## COST COMPARISON

| Scenario | Deploys | Cost/month |
|----------|---------|------------|
| Current | 40 | $280 |
| Merge everything | 15 | $105 |
| Merge recommended | 25 | $175 |
| **SAVINGS** | **15** | **$105** |

---

## RECOMMENDATION: MERGE THESE

### Priority 1 (Easy wins - save $182/month)
1. REZ AI: 6 → 1 deploy
2. REZ Marketing: 5 → 1 deploy
3. REZ Utilities: 4 → 1 deploy
4. REZ Core: 8 → 3 deploys
5. Hotel: 8 → 3 deploys
6. CorpPerks: 3 → 1 deploy

### Result
- From 40 deploys to ~15-20 deploys
- Save ~$140-175/month

---

## WHICH TO KEEP SEPARATE

### REZ Commerce (Keep all 10 separate)
- Payment service (security isolation)
- Auth service (security isolation)
- Wallet (money - keep isolated)

### REZ Apps (Keep separate)
- Mobile apps are separate deployments anyway
- Backend can be merged with apps

---

**END OF MERGE ANALYSIS**
