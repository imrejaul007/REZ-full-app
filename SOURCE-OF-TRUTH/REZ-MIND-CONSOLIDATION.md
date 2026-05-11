# REZ Mind - Service Consolidation Analysis

**Version:** 1.0.0
**Date:** 2026-05-02

---

## Current State: 16 Services

```
Event Platform (4008)
Action Engine (4009)
Feedback Service (4010)
User Intelligence (3004)
Merchant Intelligence (4012)
Intent Predictor (4018)
Intelligence Hub (4020)
Targeting Engine (3003)
Recommendation Engine (3001)
Personalization Engine (4017)
Push Service (4013)
Merchant Copilot (4022)
Consumer Copilot (4021)
AdBazaar (4025)
Feature Flags (4030)
Observability (4031)
```

---

## Problem Analysis

### Why 16 Services is Hard to Maintain

| Issue | Impact |
|-------|--------|
| 16 deployments | Time-consuming |
| 16 repos to audit | Security risk |
| 16 MongoDB connections | Performance overhead |
| 16 health checks | Operational complexity |
| 16 repos to research | Context switching |
| 16 log streams | Hard to debug |
| High infrastructure cost | Monthly bills |

---

## Consolidation Options

### Option A: Keep Current (16 Services)

**Pros:**
- Independent scaling
- Isolated failures
- Clear separation

**Cons:**
- Hard to maintain
- Hard to audit
- High cost
- Complex debugging

---

### Option B: Merge to 8 Services (Recommended)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CONSOLIDATED ARCHITECTURE (8 Services)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. REZ MIND CORE (Event Platform + Action Engine + Feedback)               │
│     ├── Event ingestion                                                      │
│     ├── Decision engine                                                      │
│     └── Learning loop                                                        │
│                                                                              │
│  2. INTELLIGENCE SERVICE (User + Merchant + Intent + Hub)                    │
│     ├── User profiles                                                       │
│     ├── Merchant profiles                                                   │
│     ├── Intent prediction                                                   │
│     └── Unified intelligence                                                │
│                                                                              │
│  3. DELIVERY SERVICE (Recommendation + Personalization + Targeting)        │
│     ├── Recommendations                                                      │
│     ├── Personalization                                                      │
│     └── Campaign targeting                                                   │
│                                                                              │
│  4. COPILOT SERVICE (Merchant + Consumer)                                   │
│     ├── Merchant dashboard                                                   │
│     └── Consumer dashboard                                                   │
│                                                                              │
│  5. PUSH SERVICE (Notifications)                                            │
│                                                                              │
│  6. ADVERTISING SERVICE (AdBazaar)                                          │
│                                                                              │
│  7. CONFIG SERVICE (Feature Flags)                                           │
│                                                                              │
│  8. OBSERVABILITY SERVICE (Logs + Traces)                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- 50% fewer services to manage
- Easier to audit (8 repos vs 16)
- Lower infrastructure cost
- Simpler debugging
- Still maintains logical separation

---

### Option C: Merge to 4 Services (Aggressive)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AGGRESSIVE CONSOLIDATION (4 Services)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. REZ MIND CORE                                                           │
│     ├── Events + Actions + Feedback + User Intel + Merchant Intel           │
│     ├── Intent + Hub + Recommendations + Personalization                    │
│                                                                              │
│  2. COPILOT (Merchant + Consumer)                                           │
│                                                                              │
│  3. GROWTH (Push + Ads + Feature Flags)                                    │
│                                                                              │
│  4. OBSERVABILITY                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- 75% fewer services
- Single codebase for intelligence
- Very low maintenance

**Risks:**
- Single point of failure
- Harder to scale independently
- May become too complex

---

## Recommended: Option B (8 Services)

### Why 8 is the Sweet Spot

| Factor | 4 | 8 | 16 |
|--------|---|---|-----|
| Maintenance | Easy | Medium | Hard |
| Scalability | Limited | Good | Best |
| Isolation | Low | Good | Best |
| Cost | Lowest | Low | High |
| Audit complexity | Easy | Medium | Hard |

---

## New Architecture: 8 Services

### Service 1: REZ-MIND-CORE

**Merges:**
- Event Platform (4008)
- Action Engine (4009)
- Feedback Service (4010)

**Why merge:**
- These are the core loop
- Always deployed together
- Tightly coupled
- Common MongoDB database

**Port:** 4008

**Endpoints:**
```
POST /webhook/merchant/order
POST /webhook/merchant/inventory
POST /webhook/merchant/payment
POST /webhook/consumer/order
POST /webhook/consumer/search
POST /webhook/consumer/view
POST /webhook/consumer/booking
GET  /intelligence/user/:userId
GET  /intelligence/merchant/:merchantId
POST /decisions/trigger
GET  /feedback/:correlationId
```

---

### Service 2: REZ-INTELLIGENCE

**Merges:**
- User Intelligence (3004)
- Merchant Intelligence (4012)
- Intent Predictor (4018)
- Intelligence Hub (4020)

**Why merge:**
- All about profiles
- Share user/merchant data
- Common use cases
- Can share MongoDB

**Port:** 4004

**Endpoints:**
```
GET  /profile/user/:userId
GET  /profile/merchant/:merchantId
GET  /segments/user/:userId
GET  /intent/user/:userId
GET  /predict/:userId
POST /profile/merge
```

---

### Service 3: REZ-DELIVERY

**Merges:**
- Recommendation Engine (3001)
- Personalization Engine (4017)
- Targeting Engine (3003)

**Why merge:**
- All about content ranking
- Similar algorithms
- Can share ML models
- Common caching layer

**Port:** 4003

**Endpoints:**
```
GET  /recommend/user/:userId
GET  /recommend/merchant/:merchantId
POST /rank/results
POST /target/segment
GET  /personalize/user/:userId
```

---

### Service 4: REZ-COPILOT

**Merges:**
- Merchant Copilot (4022)
- Consumer Copilot (4021)

**Why merge:**
- Similar UI patterns
- Share AI logic
- Common dashboard code
- Easy to maintain

**Port:** 4022

**Endpoints:**
```
GET  /merchant/insights
GET  /merchant/suggestions
GET  /consumer/recommendations
GET  /consumer/nudges
POST /merchant/action
```

---

### Service 5: REZ-PUSH

**Kept separate:** Notifications are distinct
**Port:** 4013

---

### Service 6: REZ-ADVERTISING

**Merges:** AdBazaar stays alone (complexity)
**Port:** 4025

---

### Service 7: REZ-CONFIG

**Merges:** Feature Flags stays alone
**Port:** 4030

---

### Service 8: REZ-OBSERVABILITY

**Kept separate:** Critical for monitoring
**Port:** 4031

---

## Migration Plan

### Phase 1: Create 8 Consolidated Services

```bash
# Create new repos
1. Create REZ-mind-core (merge 3)
2. Create REZ-intelligence (merge 4)
3. Create REZ-delivery (merge 3)
4. Create REZ-copilot (merge 2)

# Keep existing for compatibility
5. Keep REZ-push as-is
6. Keep REZ-advertising as-is
7. Keep REZ-config as-is
8. Keep REZ-observability as-is
```

### Phase 2: Migrate Traffic

```
1. Deploy new consolidated services
2. Update REZ_MIND_URL in apps
3. Run in parallel for 1 week
4. Decommission old services
```

---

## File Structure (Example: REZ-MIND-CORE)

```
REZ-mind-core/
├── src/
│   ├── events/
│   │   ├── platform.ts      # Event Platform logic
│   │   ├── schemas/
│   │   └── webhooks/
│   ├── actions/
│   │   ├── engine.ts        # Action Engine logic
│   │   └── rules/
│   ├── feedback/
│   │   ├── service.ts      # Feedback logic
│   │   └── learning/
│   └── index.ts
├── package.json
├── render.yaml
└── README.md
```

---

## Comparison Table

| Metric | Before (16) | After (8) | Improvement |
|--------|-------------|-----------|-------------|
| Repos to audit | 16 | 8 | 50% less |
| Deployments | 16 | 8 | 50% less |
| MongoDB connections | 16 | 8 | 50% less |
| Health checks | 16 | 8 | 50% less |
| Log streams | 16 | 8 | 50% less |
| Infrastructure cost | High | Medium | 40% less |

---

## Recommendation

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║  RECOMMENDATION: Option B - Merge to 8 Services                           ║
║                                                                             ║
║  • Maintain logical separation                                              ║
║  • Reduce operational overhead by 50%                                      ║
║  • Lower infrastructure costs                                               ║
║  • Easier to audit and research                                             ║
║  • Still allows independent scaling if needed                               ║
║                                                                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## Next Steps

1. **Decision:** User approves consolidation plan
2. **Create:** Create 8 new service repos
3. **Migrate:** Move code from 16 to 8 services
4. **Test:** Run consolidated services
5. **Deploy:** Replace old services
6. **Audit:** Verify all functionality

---

**Last Updated:** 2026-05-02
