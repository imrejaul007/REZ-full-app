# RTMN Commerce Memory - Intent Graph System

## Overview

RTMN Commerce Memory transforms the ReZ ecosystem from a collection of apps into a **Commerce Memory Platform**. The core insight: **Intent as atomic unit** - not transactions or preferences, but what users were about to do.

This creates predictive value through **dormant intent revival**, not just archival data.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    RTMN Commerce Memory                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Hotel OTA  │  │   rez-now   │  │   Retail    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│              ┌───────────────────────┐                          │
│              │   Intent Capture      │                          │
│              │     Service           │                          │
│              └───────────┬───────────┘                          │
│                          ▼                                      │
│              ┌───────────────────────┐                          │
│              │   Intent Graph        │                          │
│              │     (MongoDB)          │                          │
│              └───────────┬───────────┘                          │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              SHARED MEMORY HUB (Redis)                  │    │
│  │  • Demand Signals    • User Profiles                   │    │
│  │  • Scarcity Signals  • Attribution Data               │    │
│  │  • Scored Intents    • Optimization Recs               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                    │
│  ┌──────────┐    ┌──────────────┐   ┌───────────┐              │
│  │  Demand  │    │  Scarcity    │   │ Personal- │              │
│  │  Signal  │    │   Engine     │   │   ization │              │
│  └────┬─────┘    └──────┬───────┘   └─────┬─────┘              │
│       └──────────────────┼──────────────────┘                    │
│                          ▼                                      │
│                  ┌──────────────┐                               │
│                  │  Attribution │                               │
│                  │   Tracker    │                               │
│                  └──────┬───────┘                               │
│                         │                                       │
│                  ┌──────▼───────┐                               │
│                  │  Adaptive    │                               │
│                  │   Scoring    │                               │
│                  └──────┬───────┘                               │
│                         │                                       │
│                  ┌──────▼───────┐                               │
│                  │   Feedback   │                               │
│                  │     Loop     │                               │
│                  └──────┬───────┘                               │
│                         │                                       │
│                  ┌──────▼───────┐                               │
│                  │   Network    │                               │
│                  │   Effects    │                               │
│                  └──────┬───────┘                               │
│                         │                                       │
│                  ┌──────▼───────┐                               │
│                  │   Revenue    │                               │
│                  │ Attribution  │                               │
│                  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Intent Lifecycle

```
SEARCH → VIEW → WISHLIST/CART → HOLD → FULFILLED
                          ↓
                      ABANDONED
                          ↓
                    BECOMES DORMANT
                          ↓
                   REVIVAL NUDGE SENT
                          ↓
              USER RETURNS → FULFILLED
                   OR EXPIRES
```

### Confidence Scoring

**Formula**: `confidence = baseWeight + signalWeights + recencyMultiplier + velocityBonus`

| Event Type | Weight |
|------------|--------|
| search | 0.15 |
| view | 0.10 |
| wishlist | 0.25 |
| cart_add | 0.30 |
| hold | 0.35 |
| checkout_start | 0.40 |
| fulfilled | 1.00 |
| abandoned | -0.20 |

---

## 8 Agent Swarm

### Agent 1: Demand Signal Agent

**File**: `src/src/agents/demand-signal-agent.ts`

**Purpose**: Real-time demand aggregation across all apps

**Capabilities**:
- Aggregate search volume per category/merchant/product
- Detect demand spikes (5x baseline = trending)
- Calculate unmet demand (% of searches not converted)
- Generate procurement signals

**Configuration**:
```typescript
{
  name: 'demand-signal-agent',
  intervalMs: 5 * 60 * 1000, // 5 minutes
  enabled: true,
  priority: 'high'
}
```

**Output**: `DemandSignal[]`

**API**:
- `GET /api/demand/:merchantId/:category` - Get demand signal for merchant
- `GET /api/demand/global/:category` - Get global demand index

---

### Agent 2: Scarcity Agent

**File**: `src/src/agents/scarcity-agent.ts`

**Purpose**: Real-time supply/demand ratio engine

**Capabilities**:
- Track inventory vs search volume
- Calculate scarcity score (0-100)
- Generate urgency signals
- Identify supply gaps

**Configuration**:
```typescript
{
  name: 'scarcity-agent',
  intervalMs: 60 * 1000, // 1 minute
  enabled: true,
  priority: 'high'
}
```

**Scarcity Score Calculation**:
```
score = min(100, (demand / supply) / (demand / supply + 2) * 150)
```

**Urgency Levels**:
| Score | Level |
|-------|-------|
| 0-29 | none |
| 30-49 | low |
| 50-69 | medium |
| 70-89 | high |
| 90-100 | critical |

**API**:
- `GET /api/scarcity/:merchantId/:category` - Get scarcity signal
- `GET /api/scarcity/critical` - Get critical scarcity alerts

---

### Agent 3: Personalization Agent

**File**: `src/src/agents/personalization-agent.ts`

**Purpose**: Learn from user response patterns

**Capabilities**:
- Track open/click/convert rates per nudge type
- Build user response profiles
- Optimize send times per user
- Match tone to user history
- A/B test nudge variants

**Configuration**:
```typescript
{
  name: 'personalization-agent',
  intervalMs: 60 * 1000, // 1 minute
  enabled: true,
  priority: 'high'
}
```

**User Profile Fields**:
- `openRates` - Per channel
- `clickRates` - Per channel
- `convertRates` - Per channel
- `optimalSendTimes` - Best hours
- `preferredChannels` - Top 2 channels
- `tonePreferences` - formal/casual/friendly/urgent

**API**:
- `GET /api/profiles/:userId` - Get user personalization profile
- `POST /api/personalization/event` - Process nudge event

---

### Agent 4: Attribution Agent

**File**: `src/src/agents/attribution-agent.ts`

**Purpose**: Full-funnel attribution tracking

**Capabilities**:
- Track nudge → impression → click → convert
- Handle multi-touch attribution models
- Calculate incrementality
- Detect organic vs nudge-influenced

**Attribution Models**:
| Model | Description |
|-------|-------------|
| first | 100% credit to first touchpoint |
| last | 100% credit to last touchpoint |
| linear | Equal credit to all touchpoints |
| time_decay | More credit to recent touchpoints |
| position | 40% first, 40% last, 20% middle |

**Configuration**:
```typescript
{
  name: 'attribution-agent',
  intervalMs: 60 * 1000, // 1 minute
  enabled: true,
  priority: 'high'
}
```

**Default Window**: 7 days

---

### Agent 5: Adaptive Scoring Agent

**File**: `src/src/agents/adaptive-scoring-agent.ts`

**Purpose**: ML-based confidence scoring

**Capabilities**:
- Replace naive formula with learned model
- Factor: user history, time-of-day, category, price, velocity
- Retrain periodically from outcome data
- Predict conversion probability

**Model Features**:
| Factor | Weight |
|--------|--------|
| userHistory | 0.25 |
| timeOfDay | 0.10 |
| category | 0.15 |
| price | 0.20 |
| velocity | 0.30 |
| bias | -0.5 |

**Configuration**:
```typescript
{
  name: 'adaptive-scoring-agent',
  intervalMs: 60 * 60 * 1000, // 1 hour
  enabled: true,
  priority: 'high'
}
```

**Retraining**: Weekly with gradient descent

---

### Agent 6: Feedback Loop Agent

**File**: `src/src/agents/feedback-loop-agent.ts`

**Purpose**: Closed-loop optimization

**Capabilities**:
- Compare predicted vs actual outcomes
- Adjust all agent parameters
- Detect drift in metrics
- Trigger rebalancing
- Pause underperforming strategies

**Health Checks**:
| Metric | Drift Threshold |
|--------|----------------|
| conversionRate | 15% |
| revivalScore | 20% |
| scarcityScore | 25% |
| demandSignal | 30% |

**Configuration**:
```typescript
{
  name: 'feedback-loop-agent',
  intervalMs: 60 * 60 * 1000, // 1 hour
  enabled: true,
  priority: 'critical'
}
```

**API**:
- `GET /api/optimizations` - Get optimization recommendations

---

### Agent 7: Network Effect Agent

**File**: `src/src/agents/network-effect-agent.ts`

**Purpose**: Cross-user collaborative signals

**Capabilities**:
- Build user similarity clusters
- Implement collaborative filtering
- Generate "users like you also wanted" signals
- Detect trend emergence

**Clustering**:
- Based on category affinity (TRAVEL, DINING, RETAIL)
- Cosine similarity for user matching
- Updates daily

**Configuration**:
```typescript
{
  name: 'network-effect-agent',
  intervalMs: 24 * 60 * 60 * 1000, // 24 hours
  enabled: true,
  priority: 'medium'
}
```

**API**:
- `GET /api/trending/:category` - Get trending intents

---

### Agent 8: Revenue Attribution Agent

**File**: `src/src/agents/revenue-attribution-agent.ts`

**Purpose**: P&L impact measurement

**Capabilities**:
- Calculate nudge-influenced GMV
- Measure conversion lift vs control
- Track ROI per campaign/merchant
- Generate revenue reports
- Alert on revenue drops

**Metrics**:
| Metric | Description |
|--------|-------------|
| nudgeInfluencedGMV | Revenue from nudge-attributed orders |
| organicGMV | Revenue without nudge influence |
| totalGMV | All revenue |
| nudgeLiftPct | Nudge % of total |
| conversionLift | % improvement over control |

**Configuration**:
```typescript
{
  name: 'revenue-attribution-agent',
  intervalMs: 15 * 60 * 1000, // 15 minutes
  enabled: true,
  priority: 'critical'
}
```

**API**:
- `GET /api/revenue/latest` - Get latest revenue report

---

## Shared Memory Hub

**File**: `src/src/agents/shared-memory.ts`

In-memory store (Redis-ready abstraction) for inter-agent communication.

**Key Features**:
- TTL-based expiration
- Pub/Sub messaging
- Pattern-based queries
- Health monitoring

**Key Prefixes**:
```
demand:signals:*       - Demand signals (TTL: 5 min)
scarcity:signals:*     - Scarcity signals (TTL: 1 min)
profiles:*             - User profiles (TTL: 24 hours)
attribution:*          - Attribution records (TTL: 7 days)
scored:intents:*       - Scored intents (TTL: 1 hour)
optimizations:*        - Optimization recs (TTL: 1 hour)
collaborative:*        - Collaborative signals (TTL: 12 hours)
revenue:reports:*      - Revenue reports (TTL: 15 min)
health:*               - Agent health (TTL: 5 min)
messages:*             - Message queue
```

---

## Swarm Coordinator

**File**: `src/src/agents/swarm-coordinator.ts`

Manages agent lifecycle, inter-agent communication, and health monitoring.

**Methods**:
```typescript
startAllAgents()           // Start all enabled agents
stopAllAgents()            // Stop all agents
getSwarmStatus()           // Get health of all agents
runAgent(name)             // Run single agent on-demand
runAllAgentsOnce()         // Run all agents sequentially
```

---

## Agent Server

**File**: `src/src/server/agent-server.ts`

Standalone Express server for running the swarm.

**Port**: 3005 (default)

**Endpoints**:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/swarm/status | Swarm status |
| POST | /api/swarm/run/:name | Run single agent |
| POST | /api/swarm/run-all | Run all agents |
| GET | /api/memory/stats | Memory statistics |
| GET | /api/demand/:m/:c | Get demand signal |
| GET | /api/scarcity/:m/:c | Get scarcity signal |
| GET | /api/scarcity/critical | Get critical scarcity |
| GET | /api/profiles/:uid | Get user profile |
| GET | /api/revenue/latest | Get latest revenue report |
| GET | /api/optimizations | Get optimization recs |
| GET | /api/trending/:cat | Get trending intents |

---

## Integration with rez-agent-os

**Files**:
- `rez-agent-os/packages/agent-core/src/memory/intentGraph.ts`
- `rez-agent-os/packages/agent-core/src/tools/intentTools.ts`
- `rez-agent-os/packages/agent-core/src/handlers/intentContextBuilder.ts`

**Tools Provided**:
1. `get_user_intents` - Get active intents for personalization
2. `get_dormant_intents` - Get dormant intents for revival
3. `get_enriched_context` - Get full intent context for AI
4. `suggest_intent_revive` - Suggest reviving a dormant intent
5. `capture_intent` - Capture new intent from conversation

---

## Database Schema

**File**: `src/models/` (MongoDB Mongoose models)

**Core Models**:
- `Intent` - User intent with confidence, status, metadata
- `IntentSignal` - Individual signal events
- `DormantIntent` - Detected dormant intents with revival scores
- `IntentSequence` - Event sequences for pattern detection
- `CrossAppIntentProfile` - Aggregated user profile

**Nudge Models**:
- `Nudge` - Nudge delivery and interaction events
- `NudgeSchedule` - Scheduled nudge delivery

**Knowledge Models**:
- `MerchantKnowledge` - Merchant knowledge base for autonomous chat
- `MerchantDemandSignal` - Merchant demand aggregation

---

## Usage

### Start Agent Server
```typescript
import { startAgentServer } from '@rez/intent-graph';
startAgentServer();
```

### Start Swarm Programmatically
```typescript
import { getSwarmCoordinator } from '@rez/intent-graph';

const coordinator = getSwarmCoordinator();
coordinator.start();

// Check status
const status = await coordinator.status();
console.log(status);
```

### Capture Intent
```typescript
import { intentCaptureService } from '@rez/intent-graph';

await intentCaptureService.capture({
  userId: 'user_123',
  appType: 'hotel_ota',
  eventType: 'search',
  category: 'TRAVEL',
  intentKey: 'hotel_goa_weekend',
  intentQuery: 'hotels in Goa',
  metadata: { city: 'Goa', checkIn: '2026-05-01' }
});
```

### Get Dormant Intents
```typescript
import { dormantIntentService } from '@rez/intent-graph';

const dormantIntents = await dormantIntentService.getUserDormantIntents('user_123');
console.log(dormantIntents);
```

---

## Files Reference

### Core Package (separate repo: [rez-intent-graph](https://github.com/imrejaul007/rez-intent-graph))
```
rez-intent-graph/
├── package.json
├── tsconfig.json
├── render.yaml                    # Render Blueprint deployment
├── .env.example
└── src/
    ├── index.ts                    # Public exports
    ├── types/
    │   └── intent.ts               # Core types
    ├── models/                     # MongoDB Mongoose models
    ├── services/
    │   ├── IntentCaptureService.ts
    │   ├── IntentScoringService.ts
    │   ├── DormantIntentService.ts
    │   ├── CrossAppAggregationService.ts
    │   └── MerchantKnowledgeService.ts
    ├── agents/
    │   ├── index.ts                # Agent exports
    │   ├── types.ts                # Agent types
    │   ├── shared-memory.ts        # Memory hub
    │   ├── swarm-coordinator.ts    # Orchestration
    │   ├── demand-signal-agent.ts  # Agent 1
    │   ├── scarcity-agent.ts       # Agent 2
    │   ├── personalization-agent.ts # Agent 3
    │   ├── attribution-agent.ts    # Agent 4
    │   ├── adaptive-scoring-agent.ts # Agent 5
    │   ├── feedback-loop-agent.ts  # Agent 6
    │   ├── network-effect-agent.ts  # Agent 7
    │   └── revenue-attribution-agent.ts # Agent 8
    ├── nudge/
    │   └── NudgeDeliveryService.ts
    ├── triggers/
    │   └── revivalTriggers.ts
    ├── api/
    │   ├── intent.routes.ts
    │   ├── commerce-memory.routes.ts
    │   ├── merchant.routes.ts
    │   ├── chat.routes.ts
    │   └── webhooks.ts
    ├── middleware/
    │   ├── auth.ts
    │   └── rateLimit.ts
    ├── config/
    │   └── services.ts             # 14 external service URLs
    └── server/
        ├── server.ts               # API server (port 3001)
        └── agent-server.ts         # Agent server (port 3005)
```

**Database**: MongoDB Atlas (separate cluster: `rez-intent-graph`)
**Deployment**: Render Blueprint (2 services)

---

## Live URLs

| Service | URL |
|---------|-----|
| **rez-intent-api** | https://rez-intent-graph.onrender.com |
| **rez-intent-agent** | https://rez-intent-agent.onrender.com |

## Git Repositories

| Repo | Purpose |
|------|---------|
| [rez-intent-graph](https://github.com/imrejaul007/rez-intent-graph) | Commerce Memory Intent Graph + 8 AI agents |
| [shared-types](https://github.com/imrejaul007/shared-types) | Shared types, enums, utilities |
| `rez-agent-os` | AI Agent OS with LLM handlers, tools |

---

## Related Documentation

- [RTMN Super Agents Plan](.claude/plans/rtmn-super-agents.md)
- [Intent Graph Implementation](.claude/plans/playful-seeking-lecun.md)
- [rez-agent-os Architecture](../rez-agent-os/docs/)

---

*Last Updated: 2026-04-27*
*Author: Claude Code*
