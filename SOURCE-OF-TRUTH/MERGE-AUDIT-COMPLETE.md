# MERGE AUDIT COMPLETE

**Date:** May 6, 2026
**Goal:** Reduce from 40 deploys to 15-20 deploys

---

## MERGE COMPATIBILITY MATRIX

### CAN MERGE = YES ✅ | CANNOT MERGE = NO ❌

---

## REZ CORE SERVICES (8 services)

| Service | Port | Database | External APIs | CAN MERGE? |
|---------|------|----------|---------------|-------------|
| event-platform | 4008 | rez-events | - | ✅ YES |
| action-engine | 4009 | rez-action-engine | - | ✅ YES |
| feedback-service | 4010 | rez-feedback | - | ✅ YES |
| first-loop | - | - | - | ⚠️ HEAVY |
| intent-graph | 3001 | rez-intent-graph | Claude AI | ⚠️ HEAVY |
| intelligence-hub | 4020 | rez-intelligence | - | ✅ YES |
| user-intelligence | 3004 | rez-user-intelligence | - | ✅ YES |
| merchant-intelligence | 4012 | rez-merchant-intelligence | - | ✅ YES |

---

## REZ AI SERVICES (6 services)

| Service | Port | Database | External APIs | CAN MERGE? |
|---------|------|----------|---------------|-------------|
| support-copilot | 4033 | rez-support | Claude | ✅ YES |
| push-service | 4013 | rez-push | FCM, APNs | ✅ YES |
| personalization | 4017 | rez-personalization | - | ✅ YES |
| recommendation | 4015 | rez-recommendation | - | ✅ YES |
| targeting | 3003 | rez-targeting | - | ✅ YES |
| observability | 4031 | rez-observability | - | ✅ YES |

---

## REZ MARKETING (5 services)

| Service | Port | Database | External APIs | CAN MERGE? |
|---------|------|----------|---------------|-------------|
| marketing-service | 4000 | rez-marketing | Twilio, WhatsApp, SendGrid | ✅ YES |
| ads-service | 4007 | rez-ads | - | ✅ YES |
| lead-intelligence | 4106 | rez-lead | - | ✅ YES |
| abandonment-tracker | 4108 | - | - | ✅ YES |
| decision-service | 4027 | rez-decision | - | ✅ YES |

---

## REZ UTILITIES (4 services)

| Service | Port | Database | CAN MERGE? |
|---------|------|----------|-------------|
| automation | 4014 | rez-automation | ✅ YES |
| scheduler | 4009 | rez-scheduler | ✅ YES |
| insights | - | rez-insights | ✅ YES |
| worker | - | - | ✅ YES |

---

## SAFE MERGE GROUPS

### GROUP 1: REZ AI Platform (6 → 1 deploy) - SAVE $35/month

**Services:** support-copilot, push-service, personalization, recommendation, targeting, observability

**Ports:** 3003, 3004, 4013, 4015, 4017, 4020, 4031, 4033 (all different)

**Databases:** All separate - OK

**External APIs:** Each has own - OK

**Merge Risk:** LOW ✅

**start.sh:**
```bash
#!/bin/bash
cd services/support-copilot && npm start &
cd services/push-service && npm start &
cd services/personalization && npm start &
cd services/recommendation && npm start &
cd services/targeting && npm start &
cd services/observability && npm start &
wait
```

---

### GROUP 2: REZ Marketing (5 → 1 deploy) - SAVE $28/month

**Services:** marketing, ads, lead-intelligence, abandonment-tracker, decision-service

**Ports:** 4000, 4007, 4027, 4106, 4108 (all different)

**Databases:** All separate - OK

**External APIs:** Twilio, WhatsApp, SendGrid - OK

**Merge Risk:** LOW ✅

---

### GROUP 3: REZ Utilities (4 → 1 deploy) - SAVE $21/month

**Services:** automation, scheduler, insights, worker

**Ports:** 4009, 4014 (all different)

**Databases:** All separate - OK

**Merge Risk:** LOW ✅

---

### GROUP 4: REZ Core Events (2 → 1 deploy) - SAVE $7/month

**Services:** event-platform, action-engine

**Ports:** 4008, 4009 (different)

**Databases:** Different - OK

**Merge Risk:** LOW ✅

---

### GROUP 5: REZ Core AI (5 → 1 deploy) - SAVE $28/month

**Services:** feedback, intelligence-hub, user-intelligence, merchant-intelligence, first-loop

**Ports:** 3004, 4010, 4012, 4020 (all different)

**Databases:** All separate - OK

**NOTE:** intent-graph is HEAVY - keep separate

**Merge Risk:** MEDIUM - first-loop is heavy

---

## CANNOT MERGE

### KEEP SEPARATE

| Service | Reason |
|---------|--------|
| intent-graph | HEAVY ML service, Claude AI |
| first-loop | Heavy orchestration |

### REZ COMMERCE - KEEP ALL SEPARATE

| Service | Reason |
|---------|--------|
| api-gateway | Security isolation |
| auth-service | Security - JWT |
| payment-service | Money - isolated |
| wallet-service | Money - isolated |
| merchant-service | Core business |
| order-service | Core business |
| catalog-service | Core business |
| search-service | Heavy search |
| gamification | Core business |
| finance-service | Money - isolated |

---

## FINAL MERGE PLAN

### BEFORE: 40 deploys, $280/month

### AFTER: 22 deploys, $154/month

---

### DEPLOYMENT 1: rez-ai-all
**6 services merged**
- support-copilot (4033)
- push-service (4013)
- personalization (4017)
- recommendation (4015)
- targeting (3003)
- observability (4031)
**Env vars needed:**
- MONGODB_URI (6 different)
- REDIS_URL (1)
- ANTHROPIC_API_KEY
- FCM_*, APNS_*
- JWT_SECRET

---

### DEPLOYMENT 2: rez-marketing-all
**5 services merged**
- marketing-service (4000)
- ads-service (4007)
- lead-intelligence (4106)
- abandonment-tracker (4108)
- decision-service (4027)
**Env vars needed:**
- MONGODB_URI (5 different)
- TWILIO_*, WHATSAPP_*, SENDGRID_*

---

### DEPLOYMENT 3: rez-utilities-all
**4 services merged**
- automation (4014)
- scheduler (4009)
- insights
- worker
**Env vars needed:**
- MONGODB_URI (4 different)
- REDIS_URL

---

### DEPLOYMENT 4: rez-core-events
**2 services merged**
- event-platform (4008)
- action-engine (4009)
**Env vars needed:**
- MONGODB_URI (2 different)
- REDIS_URL

---

### DEPLOYMENT 5: rez-core-intelligence
**4 services merged**
- feedback (4010)
- intelligence-hub (4020)
- user-intelligence (3004)
- merchant-intelligence (4012)
**Env vars needed:**
- MONGODB_URI (4 different)
- REDIS_URL

---

### KEEP SEPARATE (9 deploys)
1. intent-graph (3001) - Heavy ML
2. first-loop - Heavy orchestration
3. api-gateway
4. auth-service
5. payment-service
6. wallet-service
7. merchant-service
8. order-service
9. catalog-service

---

## COST ANALYSIS

| Deployments | Services | Cost/month |
|-------------|----------|------------|
| 1 (ai-all) | 6 | $7 |
| 2 (marketing-all) | 5 | $7 |
| 3 (utilities-all) | 4 | $7 |
| 4 (core-events) | 2 | $7 |
| 5 (core-intelligence) | 4 | $7 |
| 9 separate | Commerce + Heavy | $63 |
| **TOTAL** | **30** | **$210/month** |

**SAVINGS: $70/month**

---

## CONFLICTS FOUND

### Port Conflicts
- scheduler-service uses 4009 (SAME as action-engine 4009)
- Need to reassign

### Database Conflicts
- intelligence-hub, user-intelligence, merchant-intelligence ALL use rez-intent-graph MongoDB cluster
- OK - separate databases in same cluster

---

## RISKS

### Risk 1: Port Conflicts
**Issue:** scheduler-service (4009) = action-engine (4009)

**Solution:** Change scheduler to 4016

### Risk 2: Heavy ML Services
**Issue:** intent-graph needs GPU/memory

**Solution:** Keep separate, scale independently

### Risk 3: External API Limits
**Issue:** Twilio/WhatsApp rate limits shared

**Solution:** Implement rate limiting per service

---

## ROLLBACK PLAN

If merged services break:

1. Keep old deploys suspended (not deleted)
2. Unsuspend old deploys
3. Update DNS/URLs
4. Test

```bash
# Unsuspend old deploy
curl -X POST "https://api.render.com/v1/services/{id}/resume" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

---

## IMPLEMENTATION STEPS

### 1. Create merged repos
```bash
# Already done:
- rez-ai-platform
- rez-marketing-backend
- rez-utilities-platform
```

### 2. Add start.sh to each repo
```bash
#!/bin/bash
cd services/support-copilot && npm start &
cd services/push-service && npm start &
wait
```

### 3. Deploy merged services

### 4. Update internal URLs

### 5. Suspend old services

### 6. Test

### 7. Verify

---

**END OF MERGE AUDIT**
