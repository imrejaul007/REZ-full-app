# REZ DECISION ENGINE (RDE) - COMPLETE SPECIFICATION

**Based on:** Final upgrade strategy
**Date:** May 5, 2026
**Status:** SPECIFICATION PHASE

---

## THE FINAL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REZ UNIFIED MARKETING SYSTEM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         UCE                                             │  │
│  │                    (Campaign Management)                               │  │
│  └─────────────────────────────────┬───────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    RDE - DECISION ENGINE                            │  │
│  │                   (THE REAL-TIME CORE BRAIN)                        │  │
│  │                                                                       │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │   │   Scoring   │  │   Ranking   │  │   Trigger   │            │  │
│  │   │   Engine   │  │   Engine    │  │   Engine    │            │  │
│  │   └──────────────┘  └──────────────┘  └──────────────┘            │  │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │  │
│  │   │   Fatigue   │  │   Budget    │  │   Timing    │            │  │
│  │   │   Engine   │  │   Engine    │  │   Engine    │            │  │
│  │   └──────────────┘  └──────────────┘  └──────────────┘            │  │
│  └─────────────────────────────────┬───────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    REZ MIND LAYER                                  │  │
│  │                   (Intent + Intelligence)                           │  │
│  └─────────────────────────────────┬───────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CHANNEL EXECUTOR                                 │  │
│  │           (WhatsApp / Push / Email / Ads / Karma / Rendez)      │  │
│  └─────────────────────────────────┬───────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    ATTRIBUTION ENGINE                               │  │
│  └─────────────────────────────────┬───────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    RDE (FEEDBACK LOOP)                              │  │
│  │                         (Learning)                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## RDE - WHAT IT DOES

RDE makes **ALL real-time decisions**:

### 1. WHO gets the message?

```
Input:
├── User intent score (0-100)
├── Merchant match score (0-100)
├── Fatigue level (0-100)
└── Timing score (0-100)

Output:
└── Action Decision (SEND / WAIT / SKIP)
```

### 2. WHEN to send?

```
Based on:
├── Time of day
├── Day of week
├── User behavior patterns
├── Campaign urgency
└── Channel best practices
```

### 3. WHICH channel?

```
Decision Matrix:
├── HIGH intent + HOT offer → WhatsApp (immediate)
├── HIGH intent + WARM offer → Push (app notification)
├── MEDIUM intent → Email (nurture)
├── LOW intent + Awareness → AdBazaar (QR/Display)
├── ENGAGEMENT focus → Karma (rewards)
├── VIRAL potential → Rendez (referral)
└── TRUST needed → Verify QR (authentic)
```

### 4. WHICH merchant wins?

```
If 5 merchants target same user:

RDE scores each:
├── Merchant A: 85
├── Merchant B: 72
├── Merchant C: 68
├── Merchant D: 55
├── Merchant E: 41

Result: Merchant A wins (only one message sent)
```

### 5. HOW MUCH budget?

```
Real-time optimization:
├── Channel converting well → INCREASE budget
├── Channel failing → REDUCE budget
├── Budget exhausted → PAUSE channel
└── High ROI → EXPAND to new users
```

---

## RDE ENGINES

### 1. SCORING ENGINE

```typescript
interface ScoringInput {
  userId: string;
  merchantId: string;
  campaignId: string;
  intentScore: number;      // From ReZ Mind
  merchantMatchScore: number; // How well merchant matches user
  fatigueScore: number;       // How many messages recently
  timingScore: number;       // Is this the right time?
}

interface ScoringOutput {
  finalScore: number;        // 0-100
  decision: 'SEND' | 'WAIT' | 'SKIP';
  channel: ChannelType;
  budgetAllocation: number;
}

// Formula
finalScore = (
  intentScore * 0.35 +
  merchantMatchScore * 0.30 +
  timingScore * 0.20 +
  (100 - fatigueScore) * 0.15
);
```

### 2. RANKING ENGINE

```typescript
interface RankingInput {
  userId: string;
  campaigns: Campaign[];
  scores: Map<string, number>;
}

interface RankingOutput {
  winningCampaign: Campaign | null;
  reason: string;
  alternativeChannels: Channel[];
}

// Rules
if (highestScore > 70) → WINNER
if (highestScore < 50) → SKIP (no message)
if (scores within 10 points) → Tiebreaker by:
  1. Best offer (discount %)
  2. Merchant rating
  3. Budget remaining
```

### 3. TRIGGER ENGINE

```typescript
type TriggerType = 
  | 'search'        // User searched
  | 'scan'          // User scanned QR
  | 'abandon'       // User abandoned cart
  | 'location'      // User entered area
  | 'time'          // Scheduled trigger
  | 'behavior'      // Behavioral trigger
  | 'campaign'       // Campaign campaign trigger
  | 'manual';       // Merchant initiated

interface TriggerEvent {
  type: TriggerType;
  userId: string;
  entityId: string;  // merchantId / campaignId / locationId
  timestamp: Date;
  metadata: Record<string, any>;
}
```

### 4. FATIGUE ENGINE

```typescript
interface FatigueState {
  userId: string;
  messagesReceived: number;      // Last 24h
  messagesClicked: number;         // Last 7 days
  messagesIgnored: number;         // Last 7 days
  lastMessageAt: Date;
  lastClickAt: Date;
  optedOutChannels: Channel[];
}

interface FatigueOutput {
  fatigueLevel: number;  // 0-100 (100 = max fatigue)
  canReceive: boolean;
  waitUntil: Date | null;  // If too fatigued
  bestChannel: Channel | null;
}

// Fatigue Rules
if (messagesReceived >= 5) → canReceive = false, waitUntil = 24h
if (messagesIgnored >= 3) → fatigueLevel += 20
if (messagesClicked >= 1) → fatigueLevel -= 30 (positive signal)
```

### 5. BUDGET ENGINE

```typescript
interface BudgetAllocation {
  campaignId: string;
  totalBudget: number;
  channelBudgets: {
    whatsapp: number;
    push: number;
    email: number;
    ads: number;
    karma: number;
    rendez: number;
  };
  spent: {
    whatsapp: number;
    push: number;
    email: number;
    ads: number;
    karma: number;
    rendez: number;
  };
  conversions: {
    whatsapp: number;
    push: number;
    email: number;
    ads: number;
    karma: number;
    rendez: number;
  };
}

interface BudgetDecision {
  action: 'INCREASE' | 'DECREASE' | 'MAINTAIN' | 'PAUSE';
  channel: Channel;
  newBudget: number;
  reason: string;
}

// Reallocation Rules
if (channel.conversions > threshold && channel.spent < budget) → INCREASE 20%
if (channel.conversions < threshold && channel.spent > threshold) → DECREASE 50%
if (channel.spent >= budget) → PAUSE
```

### 6. TIMING ENGINE

```typescript
interface TimingScore {
  hourOfDay: number;
  dayOfWeek: number;
  userPattern: UserTimingPattern;
  campaignType: CampaignType;
  score: number;  // 0-100
}

// Timing Rules
const TIME_RULES = {
  restaurant: {
    lunch: [12, 13, 14],      // 12-2 PM
    dinner: [19, 20, 21, 22], // 7-10 PM
    scoreBoost: 20
  },
  hotel: {
    weekday: [9, 10, 11],      // Morning planning
    weekend: [10, 11, 12],    // Late morning
    scoreBoost: 15
  },
  cosmetic: {
    evening: [18, 19, 20, 21], // After work
    weekend: [11, 12, 13, 14],  // Shopping time
    scoreBoost: 20
  }
};
```

---

## REAL-TIME DECISION FLOW

```
User Action Detected
        │
        ▼
┌───────────────────────┐
│    Trigger Engine     │
│  (What happened?)    │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│    Scoring Engine    │
│  (Calculate scores)  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   Fatigue Engine     │
│  (Can we send?)     │
└───────────┬───────────┘
            │
     ┌──────┴──────┐
     │               │
     ▼               ▼
  NO               YES
(SKIP)             │
                    ▼
        ┌───────────────────────┐
        │   Ranking Engine     │
        │  (Which wins?)      │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Timing Engine      │
        │  (When to send?)    │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Channel Selector    │
        │  (Best channel?)    │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Budget Engine      │
        │  (Allocate spend?)   │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   EXECUTE ACTION      │
        │  (Send message)      │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Attribution Engine   │
        │  (Track result)      │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │    RDE Learning       │
        │  (Update models)     │
        └───────────────────────┘
```

---

## API ENDPOINTS

### Decision Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/decision/trigger` | Process trigger event |
| POST | `/api/decision/score` | Calculate scores |
| GET | `/api/decision/rank/{userId}` | Get ranked campaigns |
| GET | `/api/decision/fatigue/{userId}` | Get fatigue state |
| POST | `/api/decision/allocate` | Allocate budget |

### Real-time Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| WS | `/ws/decision` | Real-time decisions stream |

---

## SERVICE INTEGRATION

### With UCE

```typescript
// When campaign is created
uce.on('campaign_created', async (campaign) => {
  // RDE prepares targeting
  const audience = await rde.prepareAudience(campaign);
  // RDE allocates budget
  const allocation = await rde.allocateBudget(campaign);
});
```

### With ReZ Mind

```typescript
// Get intent data
const intent = await rezMind.getIntent(userId);

// Get user profile
const profile = await rezMind.getProfile(userId);

// Feed back results
await rezMind.feedback(userId, {
  channel,
  action: 'clicked' | 'ignored' | 'converted',
  campaignId,
  timestamp
});
```

### With Channel Executor

```typescript
// Execute decision
const decision = await rde.decide(userId, campaignId);

// Send via channel
await channelExecutor.execute(decision.channel, {
  userId,
  message: decision.message,
  template: decision.template
});
```

---

## DECISION RULES

### Rule 1: No Spam

```
IF messagesReceived >= 5 in 24h → NO
IF optedOut → NEVER
IF reportedSpam → NEVER
```

### Rule 2: Timing Rules

```
IF time < 8 AM → NO (except urgent)
IF time > 10 PM → NO (except late delivery)
IF weekend AND hotel → YES
```

### Rule 3: Merchant Competition

```
IF multiple merchants target same user:
  → Send only the WINNER
  → Others queued for 24h
```

### Rule 4: Budget Rules

```
IF campaign budget < 10% remaining → WARN
IF campaign budget exhausted → PAUSE
IF channel budget exhausted → REALLOCATE
```

---

## METRICS

### Decision Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `decisions_made` | Total decisions | - |
| `decisions_send` | Messages sent | - |
| `decisions_skip` | Messages skipped | < 30% |
| `decision_latency_ms` | Decision time | < 50ms |
| `conversion_rate` | Decisions → Conversion | > 5% |

### Fatigue Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `avg_fatigue_level` | Average fatigue | < 50 |
| `users_at_max_fatigue` | Maxed out users | < 5% |
| `fatigue_recovery_time` | Time to recover | < 24h |

### Budget Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `budget_efficiency` | Spend / Conversion | Optimize |
| `channel_roi` | Per channel ROI | Track |
| `reallocation_count` | Auto reallocations | - |

---

## EXISTING SERVICE UPGRADE

Currently: `rez-decision-service` (basic)

```
UPGRADE TO: Full RDE

Current capabilities:
├── Targeting segments ✅
├── Frequency capping ✅
└── Basic actions ❌

New capabilities needed:
├── Scoring Engine ❌
├── Ranking Engine ❌
├── Trigger Engine ❌
├── Fatigue Engine ❌
├── Budget Engine ❌
├── Timing Engine ❌
└── Real-time WebSocket ❌
```

---

## FILES & DOCUMENTATION

| File | Purpose |
|------|---------|
| `SOURCE-OF-TRUTH/DECISION-ENGINE-SPEC.md` | This specification |
| `SOURCE-OF-TRUTH/CONSOLIDATION-PLAN.md` | Consolidation plan |
| `SOURCE-OF-TRUTH/REZ-UNIFIED-MARKETING-PLATFORM-PLAN.md` | Platform plan |

---

## SUCCESS CRITERIA

| Criteria | Target |
|----------|--------|
| Decision latency | < 50ms |
| Conversion rate | > 5% |
| Fatigue recovery | < 24h |
| Zero spam | 100% |
| Budget efficiency | Optimize |
| Learning accuracy | > 90% |

---

## NEXT STEPS

1. **Upgrade** `rez-decision-service` → Full RDE
2. **Build** 6 engines (Scoring, Ranking, Trigger, Fatigue, Budget, Timing)
3. **Integrate** with UCE, ReZ Mind, Channel Executor
4. **Test** with restaurant campaign
5. **Monitor** and iterate

---

**RDE: The brain that makes every other component work.**
