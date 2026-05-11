# REZ MARKETING PLATFORM - IMPROVEMENT PLAN

**Based on:** Final diagnosis
**Date:** May 5, 2026
**Version:** 1.0

---

## WHERE WE STAND

### Current State (95% Done)

```
Products: ✅ 8 systems built
Flow: ✅ Merchant → Campaign → AI → Channels → Customer
Multi-channel: ✅ WhatsApp, QR, DOOH, Push, Email
Attribution: ✅ Scan → Try → Redeem → Purchase → Repeat
```

### What's Missing (5% - Critical)

```
GAP 1: Decision Engine is supporting brain (not supreme controller)
GAP 2: No real-time intent triggers
GAP 3: No competition/market dynamics
```

---

## THE VISION

### Current

```
Marketing Platform
```

### After Upgrades

```
AI-powered demand & decision network for all commerce
```

---

## GAP 1: MAKE DECISION ENGINE SUPREME

### Current State

```
rez-uce → rez-decision-service → Channels
         ↑
    Supporting role
```

### Target State

```
rez-uce → rez-decision-service (SUPREME CONTROLLER) → Channels
          ↑
    EVERYTHING flows through
```

### Implementation

```
RULE: NOTHING happens without decision engine
```

| Action | Decision Required? |
|--------|-------------------|
| Send WhatsApp | YES |
| Show QR reward | YES |
| Allocate budget | YES |
| Show merchant to user | YES |
| Send push notification | YES |
| Allocate coins | YES |

### Changes Needed

1. **All channels call RDE first**
   - rez-marketing → calls RDE before sending
   - adsqr → calls RDE before crediting coins
   - adBazaar → calls RDE before showing ad
   - rez-dooh → calls RDE before serving screen

2. **RDE becomes gatekeeper**
   - Every message passes through
   - RDE approves or rejects
   - RDE decides timing, content, channel

3. **Centralized learning**
   - All feedback returns to RDE
   - RDE updates models
   - RDE improves all future decisions

### Code Change Example

```typescript
// BEFORE (current)
async function sendWhatsApp(campaignId, userId) {
  await marketingService.send(campaignId, userId);
}

// AFTER (target)
async function sendWhatsApp(campaignId, userId) {
  // Ask RDE first
  const decision = await rde.decide({
    userId,
    action: 'send_whatsapp',
    context: { campaignId }
  });
  
  if (!decision.approved) {
    return { rejected: true, reason: decision.reason };
  }
  
  return await marketingService.send({
    campaignId,
    userId,
    content: decision.content,
    timing: decision.timing
  });
}
```

---

## GAP 2: REAL-TIME INTENT TRIGGERS

### Current State

```
User searches "biryani"
        ↓
Campaign-driven (batch processing)
```

### Target State

```
User searches "biryani"
        ↓ (within 100ms)
Real-time trigger
        ↓
RDE decides action
        ↓
WhatsApp sent / Offer shown
```

### Implementation

### Event Types

| Event | Latency | Action |
|-------|---------|--------|
| `search` | <100ms | Show relevant offer |
| `scan` | <100ms | Credit coins + offer |
| `location` | <100ms | Show nearby offers |
| `cart_abandon` | <100ms | Recovery message |
| `browse` | <100ms | Show related offers |

### Webhook Events

```typescript
// Real-time events
interface RealtimeEvent {
  userId: string;
  event: 'search' | 'scan' | 'location' | 'cart_abandon' | 'browse';
  data: Record<string, any>;
  timestamp: Date;
}
```

### Implementation

```typescript
// Webhook endpoint for real-time events
app.post('/webhook/intent', async (req, res) => {
  const event = req.body;
  
  // Fire to RDE immediately (< 100ms)
  const decision = await rde.processRealTime(event);
  
  // Execute decision
  if (decision.shouldAct) {
    await executeAction(decision);
  }
  
  res.json({ acknowledged: true });
});
```

### Example Flows

```
SCENARIO 1: User searches "biryani"
─────────────────────────────────────
User types "biryani"
        ↓
Search service detects
        ↓
Webhook to RDE (< 100ms)
        ↓
RDE checks:
  - User intent score
  - Nearby biryani merchants
  - Active campaigns
        ↓
Decision: Send WhatsApp
        ↓
User receives: "Best biryani in BTM! 20% off"
        ↓ (within 30 seconds)

SCENARIO 2: User scans cosmetic QR
─────────────────────────────────────
User scans QR
        ↓
adsqr records scan
        ↓
Webhook to RDE
        ↓
RDE decides:
  - Credit coins (yes/no)
  - Follow-up timing
  - Next best channel
        ↓
5 minutes later: WhatsApp
"Found your shade! Complete your routine"
```

---

## GAP 3: COMPETITION & MARKET DYNAMICS

### Current State

```
Merchant A → campaign → user
Merchant B → campaign → user
Merchant C → campaign → user
        ↓
All 3 reach user (confusion)
```

### Target State

```
Merchant A → score: 85
Merchant B → score: 72
Merchant C → score: 68
        ↓
ONLY Merchant A reaches user
(Ranked by RDE)
```

### Auction System

```typescript
interface MerchantScore {
  merchantId: string;
  score: number;
  
  // Components
  intentMatch: number;      // How well matches user intent
  budgetRemaining: number;   // Campaign budget left
  historicalCTR: number;     // Past performance
  offerQuality: number;      // Discount/rewards
  userAffinity: number;      // User history with merchant
  conversionRate: number;    // Historical conversion
}

function calculateScore(context: DecisionContext): MerchantScore {
  return {
    intentMatch: context.intentScore * 0.30,
    budgetRemaining: context.budgetScore * 0.15,
    historicalCTR: context.ctrScore * 0.20,
    offerQuality: context.offerScore * 0.20,
    userAffinity: context.affinityScore * 0.10,
    conversionRate: context.conversionScore * 0.05
  };
}
```

### Ranking Logic

```typescript
async function rankMerchants(userId: string): Promise<Merchant[]> {
  // Get all merchants targeting this user
  const merchants = await getTargetingMerchants(userId);
  
  // Calculate score for each
  const scored = await Promise.all(
    merchants.map(async (m) => ({
      merchant: m,
      score: await calculateScore({
        userId,
        merchantId: m.id,
        context: await rde.getContext(userId)
      })
    }))
  );
  
  // Sort by score (highest first)
  scored.sort((a, b) => b.score.total - a.score.total);
  
  // Only return top merchant (or top 3 with different offers)
  return scored.slice(0, 3);
}
```

### Anti-Spam Rules

```
RULE 1: Only ONE merchant per user per 2 hours
RULE 2: If 3 merchants target same → highest score wins
RULE 3: User can override (preferences)
RULE 4: Merchant can bid for priority
```

---

## UPGRADED ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FINAL ARCHITECTURE                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MERCHANT                                                                │
│  Campaign Created                                                         │
│         ↓                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                         UCE                                            │  │
│  │                    (Campaign Setup)                                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│         ↓                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              REZ MIND (Intent Capture)                               │  │
│  │                                                                       │  │
│  │   User searches ──▶ User scans ──▶ User location ──▶ User browses    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│         ↓                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │            RDE (SUPREME CONTROLLER)                                 │  │
│  │                                                                       │  │
│  │   1. Receive real-time event (< 100ms)                               │  │
│  │   2. Score all competing merchants                                   │  │
│  │   3. Rank by score                                                  │  │
│  │   4. Decide: approve/reject, channel, timing, content                 │  │
│  │   5. Execute action                                                 │  │
│  │   6. Learn from result                                              │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│         ↓                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CHANNELS (Only approved actions)                  │  │
│  │                                                                       │  │
│  │   WhatsApp ─── Push ─── Email ─── QR ─── DOOH ─── adBazaar         │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│         ↓                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    CUSTOMER ACTION                                    │  │
│  │                                                                       │  │
│  │   User sees ─── User responds ─── User converts                       │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│         ↓                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    FEEDBACK LOOP                                       │  │
│  │                                                                       │  │
│  │   Attribution ────▶ Update models ────▶ Better decisions             │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## REAL-TIME DECISION FLOW

```
USER ACTION (search/scan/location)
        │
        ↓ (< 100ms)
RDE RECEIVES EVENT
        │
        ↓
FETCH USER CONTEXT
        │
        ├── User intent profile
        ├── User location
        ├── User preferences
        ├── User fatigue level
        └── User history
        │
        ↓
FETCH COMPETING MERCHANTS
        │
        ├── All merchants targeting this user
        ├── Their active campaigns
        └── Their budgets
        │
        ↓
SCORE ALL MERCHANTS
        │
        ├── Intent match × 0.30
        ├── Budget × 0.15
        ├── CTR × 0.20
        ├── Offer quality × 0.20
        ├── User affinity × 0.10
        └── Conversion rate × 0.05
        │
        ↓
RANK MERCHANTS
        │
        └── Merchant A (85) > Merchant B (72) > Merchant C (68)
        │
        ↓
DECIDE ACTION
        │
        ├── Approved: YES/NO
        ├── Channel: WhatsApp
        ├── Content: "Best biryani in BTM! 20% off"
        ├── Timing: NOW
        ├── Coins: 50
        └── Next action: Follow-up in 2 hours
        │
        ↓
EXECUTE ACTION
        │
        └── Send via selected channel
        │
        ↓
TRACK RESULT
        │
        └── Open, Click, Convert, Nothing
        │
        ↓
LEARN & UPDATE
        │
        ├── Update user profile
        ├── Update merchant score
        └── Update RDE model
```

---

## IMPLEMENTATION ROADMAP

### Week 1-2: RDE as Supreme Controller

| Task | Description |
|------|-------------|
| 1.1 | Make RDE gatekeeper for all channels |
| 1.2 | Add approval/rejection logic |
| 1.3 | Update rez-marketing to call RDE first |
| 1.4 | Update adsqr to call RDE first |
| 1.5 | Update adBazaar to call RDE first |
| 1.6 | Test end-to-end |

### Week 3-4: Real-Time Triggers

| Task | Description |
|------|-------------|
| 2.1 | Build webhook endpoint for events |
| 2.2 | Add < 100ms latency requirement |
| 2.3 | Connect search events |
| 2.4 | Connect scan events |
| 2.5 | Connect location events |
| 2.6 | Connect browse events |

### Week 5-6: Competition Layer

| Task | Description |
|------|-------------|
| 3.1 | Build scoring algorithm |
| 3.2 | Implement merchant ranking |
| 3.3 | Add anti-spam rules |
| 3.4 | Build auction fallback |
| 3.5 | Add user preference override |
| 3.6 | Test with multiple merchants |

### Week 7-8: Learning Loop

| Task | Description |
|------|-------------|
| 4.1 | Build feedback collector |
| 4.2 | Implement model updater |
| 4.3 | Add A/B testing framework |
| 4.4 | Build reporting dashboard |
| 4.5 | Optimize based on results |
| 4.6 | Full system test |

---

## SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Decision latency | < 100ms |
| Conversion rate | +50% |
| User fatigue | < 5 messages/week |
| Merchant satisfaction | > 4.5/5 |
| Attribution accuracy | > 95% |

---

## FINAL POSITIONING

### Before

```
ReZ is a marketing platform
```

### After

```
ReZ is a real-time decision engine that routes demand to supply across channels.
```

### Platform Comparison

| Platform | Controls |
|----------|----------|
| Zomato | Discovery |
| Swiggy | Delivery |
| Meta | Ads |
| Google | Search |

```
ReZ controls: DECISION LAYER across all of them
```

---

## FILES

| File | Purpose |
|------|---------|
| `SOURCE-OF-TRUTH/IMPROVEMENT-PLAN.md` | This plan |

---

**Ready to execute?**

---

**Next: Implement GAP 1 - Make RDE Supreme Controller**
