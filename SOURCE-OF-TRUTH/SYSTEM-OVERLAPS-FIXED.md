# ReZ Ecosystem - System Overlaps Analysis & Solution
**Date:** May 4, 2026
**Severity:** CRITICAL (Silent Killer)

---

## Executive Summary

The ReZ ecosystem has **3 major overlap zones** causing:
- Data inconsistency
- Developer confusion
- Scaling challenges
- Feature duplication
- Maintenance burden

**Total overlapping systems: 12+**

---

# OVERLAP ZONE 1: ADS ECOSYSTEM

## Systems Involved (5)
| System | Purpose | Tech |
|--------|---------|------|
| `rez-ads-service` | Core ad campaigns | MongoDB, BullMQ |
| `adBazaar` | QR campaigns | Supabase |
| `AdOS` | ROI optimization | Library |
| `AdSOS` | DOOH ad network | Library |
| `rez-targeting-engine` | User targeting | MongoDB |

## What Each Does

```
┌─────────────────────────────────────────────────────────────┐
│                    ADS ECOSYSTEM (FRAGMENTED)              │
├─────────────────┬─────────────────┬─────────────────────────┤
│  rez-ads-service │    adBazaar     │   AdOS / AdSOS       │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • Campaigns     │ • QR Campaigns  │ • ROI Scoring        │
│ • Placements   │ • Attribution   │ • Budget Allocation  │
│ • Click Track  │ • Coin Rewards │ • Guardrails        │
│ • Retargeting  │ • Multi-touch  │ • Listing Priority   │
└─────────────────┴─────────────────┴─────────────────────────┘
                              ↑
                    DATA IS DUPLICATED
```

## Data Duplication

| Data | Stored In |
|------|-----------|
| Campaigns | `rez-ads-service.campaigns` + `adBazaar.campaigns` |
| QR Codes | `adBazaar.qr_codes` + `adsqr.qr_codes` |
| Attributions | Both systems have attribution tables |
| Budgets | Both systems track budget |

## Problems

1. **Two campaign databases** - sync issues guaranteed
2. **Two attribution systems** - conflicting data
3. **ROI calculated differently** - no single source of truth
4. **Developer confusion** - which system to use?

---

## SOLUTION: Unified Ad Platform

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               UNIFIED AD PLATFORM                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Campaign  │────│ Attribution │────│    ROI     │     │
│  │   Service   │    │   Engine   │    │  Calculator │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                    │              │
│         ▼                                    ▼              │
│  ┌─────────────┐                     ┌─────────────┐       │
│  │    QR      │                     │  Budget    │       │
│  │  Generator │                     │  Allocator │       │
│  └─────────────┘                     └─────────────┘       │
│         │                                    │              │
│         ▼                                    ▼              │
│  ┌─────────────────────────────────────────────────┐       │
│  │              TARGETING ENGINE                    │       │
│  │   User Segments ← AI Agent ← Historical Data  │       │
│  └─────────────────────────────────────────────────┘       │
│                           │                               │
│                           ▼                               │
│  ┌─────────────────────────────────────────────────┐       │
│  │           DELIVERY LAYER                         │       │
│  │  Push │ Email │ In-App │ QR │ DOOH │ Display   │       │
│  └─────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Consolidation Steps

1. **Phase 1**: Deprecate `adBazaar` campaigns, migrate to `rez-ads-service`
2. **Phase 2**: Move QR logic to `rez-ads-service`
3. **Phase 3**: Integrate `AdOS` ROI into `rez-ads-service`
4. **Phase 4**: Keep `AdSOS` ONLY for DOOH, rename to `rez-dooh-service`

---

# OVERLAP ZONE 2: AI/INTELLIGENCE ECOSYSTEM

## Systems Involved (10+)
| System | Purpose |
|--------|---------|
| `rez-intent-graph` | Core intent tracking |
| `rez-intelligence-hub` | Unified profiles |
| `rez-targeting-engine` | User segmentation |
| `rez-action-engine` | Action execution |
| `rez-consumer-copilot` | Consumer AI |
| `rez-merchant-copilot` | Merchant AI |
| `rez-ad-copilot` | Ad AI |
| `REZ-support-copilot` | Support AI |
| `rez-user-intelligence` | User analytics |
| `rez-merchant-intelligence` | Merchant analytics |

## What Each Does

| System | Input | Output |
|--------|-------|--------|
| Intent Graph | Signals (search, view, cart) | User intent probability |
| Intelligence Hub | Cross-app signals | Unified user profile |
| Targeting Engine | User segments | Campaign targeting params |
| Action Engine | Decision | Execute action |
| Consumer Copilot | Chat | Order assistance |
| Merchant Copilot | Chat | Business insights |
| Ad Copilot | Chat | Campaign optimization |

## The Problem: No Clear Pipeline

```
CURRENT (Chaos):
┌──────┐   ┌──────────┐   ┌─────────┐
│Intent│──▶│Copilot 1│   │Copilot 2│
│Graph │   └──────────┘   └─────────┘
└──────┘        │               │
      │         ▼               ▼
      │    ┌─────────┐    ┌─────────┐
      └────│Action   │    │Targeting│
           │Engine   │    │Engine  │
           └─────────┘    └─────────┘

Problems:
❌ 5 copilots doing similar things
❌ No shared intent pipeline
❌ Data flows 10 different ways
❌ Each copilot has its own "AI"
```

## SOLUTION: Unified Intelligence Pipeline

### The Single Pipeline: Signal → Intent → Decision → Action → Feedback

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   UNIFIED INTELLIGENCE PIPELINE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐         │
│   │ SIGNAL  │────▶│ INTENT  │────▶│DECISION │────▶│ ACTION  │         │
│   │ COLLECT │     │ ANALYZE │     │   MAP   │     │ EXECUTE │         │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘         │
│        │               │               │               │                  │
│        ▼               ▼               ▼               ▼                  │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐         │
│   │ Events  │     │ Profiles│     │  Rules  │     │  Tasks  │         │
│   │ Capture │     │  User/  │     │ Policy  │     │ Webhook │         │
│   │         │     │ Merchant│     │ Engine  │     │  Queue  │         │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘         │
│                                                                          │
│                              │                                          │
│                              ▼                                          │
│                      ┌─────────────┐                                    │
│                      │  FEEDBACK  │                                    │
│                      │   LOOP     │                                    │
│                      │  Learn →   │                                    │
│                      │  Improve   │                                    │
│                      └─────────────┘                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Single AI Agent: "ReZ Mind"

Replace 5 copilots with ONE unified agent:

```typescript
interface ReZMind {
  // Signal Collection
  captureIntent(event: UserEvent): Promise<void>

  // Intent Analysis
  analyzeIntent(userId: string): Promise<IntentProfile>

  // Decision Making
  decide(userId: string, context: Context): Promise<Decision>

  // Action Execution
  execute(decision: Decision): Promise<ActionResult>

  // Feedback Learning
  learn(action: Action, outcome: Outcome): Promise<void>
}
```

### Consolidate to 3 Core Services

| New Service | Merged From | Purpose |
|-------------|-------------|---------|
| `rez-intent-service` | Intent Graph + Intelligence Hub + User/Merchant Intelligence | Signal → Intent |
| `rez-decision-service` | Targeting Engine + Action Engine | Intent → Decision |
| `rez-copilot` | All 5 copilots | Unified chat interface |

### AI Agent Consolidation

| Old Agent | New Role |
|-----------|----------|
| 10 scattered agents | 3 unified agents |
| Consumer Copilot | UI layer on top of `rez-copilot` |
| Merchant Copilot | UI layer on top of `rez-copilot` |
| Ad Copilot | Integration with `rez-decision-service` |
| Support Copilot | Integration with `rez-copilot` |
| Autonomous Orchestrator | Rename to `Pipeline Orchestrator` |

---

# OVERLAP ZONE 3: COMMUNICATION ECOSYSTEM

## Systems Involved (3)
| System | Purpose |
|--------|---------|
| Redis | Cache, sessions |
| BullMQ | Job queues |
| Socket.IO | Real-time |

## What Each Does

```
┌─────────────────────────────────────────────────────────────┐
│              COMMUNICATION STACK (Confusing)                  │
├─────────────────┬─────────────────┬─────────────────────────┤
│     Redis       │    BullMQ       │      Socket.IO        │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • Session      │ • Job Queue     │ • Real-time           │
│ • Cache        │ • Scheduled Jobs│ • WebSocket           │
│ • Pub/Sub      │ • Retry Logic  │ • Room Management      │
│ • Streams      │ • Dead Letters │ • Events              │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
                    WHY 3 DIFFERENT PATTERNS?
```

## Problems

1. **BullMQ IS Redis** - BullMQ uses Redis underneath
2. **Redis Streams AND BullMQ** - Duplicated functionality
3. **Socket.IO needs Redis Adapter** - But also has its own rooms

## SOLUTION: Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              COMMUNICATION LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 3: Real-time (Socket.IO)                           │
│  ┌─────────────────────────────────────────────────┐       │
│  │  • Order updates    • Chat    • Notifications  │       │
│  │  • Live tracking   • KDS     • Presence       │       │
│  └─────────────────────────────────────────────────┘       │
│                           │                               │
│  LAYER 2: Async Jobs (BullMQ)                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │  • Email/SMS       • Image processing          │       │
│  │  • Webhooks        • Scheduled tasks          │       │
│  │  • Retries         • Dead letter handling     │       │
│  └─────────────────────────────────────────────────┘       │
│                           │                               │
│  LAYER 1: Cache/Events (Redis)                             │
│  ┌─────────────────────────────────────────────────┐       │
│  │  • Sessions        • API cache                 │       │
│  │  • Rate limiting   • Feature flags             │       │
│  │  • Pub/Sub        • Hot data                  │       │
│  └─────────────────────────────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Clear Responsibilities

| System | Use Only For |
|--------|-------------|
| **Redis** | Sessions, cache, rate limiting, pub/sub |
| **BullMQ** | Background jobs, scheduled tasks, retries |
| **Socket.IO** | Real-time events, live updates |

**Rule:** If it needs to be fast/real-time → Socket.IO
If it can be async → BullMQ
If it's just data → Redis

---

# IMPLEMENTATION ROADMAP

## Phase 1: AI Pipeline (4 weeks)
| Week | Task |
|------|------|
| 1 | Audit all 10 agents, document intents |
| 2 | Merge Intent Graph + Intelligence Hub → `rez-intent-service` |
| 3 | Merge Targeting + Action → `rez-decision-service` |
| 4 | Replace 5 copilots with unified `rez-copilot` |

## Phase 2: Ad Consolidation (4 weeks)
| Week | Task |
|------|------|
| 1 | Audit campaign data in both systems |
| 2 | Migrate adBazaar campaigns to `rez-ads-service` |
| 3 | Move QR logic to `rez-ads-service` |
| 4 | Integrate AdOS ROI, deprecate AdOS |

## Phase 3: Communication Cleanup (2 weeks)
| Week | Task |
|------|------|
| 1 | Document all Redis/BullMQ/Socket usage |
| 2 | Create clear guidelines, enforce via lint rules |

---

# FILES TO DELETE AFTER CONSOLIDATION

## After Phase 1
- `rez-intelligence-hub/` (merged into intent-service)
- `rez-consumer-copilot/` (merged into rez-copilot)
- `rez-merchant-copilot/` (merged into rez-copilot)
- `rez-ad-copilot/` (merged into rez-copilot)
- `REZ-support-copilot/` (merged into rez-copilot)

## After Phase 2
- `adBazaar/` (migrated to ads-service)
- `adsqr/` (migrated to ads-service)
- `AdOS/` (merged into ads-service)
- `AdSOS/` (rename to `rez-dooh-service` if needed)

---

# METRICS AFTER FIX

| Before | After |
|--------|-------|
| 12+ overlapping systems | 3 unified platforms |
| 5 copilots | 1 unified copilot |
| 2 ad campaign systems | 1 unified ad platform |
| 3 communication patterns | Clear layered architecture |
| 30+ services | ~20 core services |

---

*Generated: May 4, 2026*
*Priority: CRITICAL*
