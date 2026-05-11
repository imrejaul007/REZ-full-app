# KARMA SYSTEM - COMPLETE SPECIFICATION

**Last Updated:** 2026-05-04
**Status:** Complete - Ready for REE Implementation

---

## EXECUTIVE SUMMARY

This is the **final, clean karma scoring system** to implement in REE.

**Previous audit found issues in existing code:**
- karmaScoreEngine.ts had momentum placeholder (always 0)
- Band conversion rates differed from karmaEngine.ts
- Two confusing scoring systems

**Solution:** Implement this clean specification in REE.

---

## KARMA INDEX (FINAL MODEL)

### Score Range: 300 – 900

* **300 = Base (everyone starts here)**
* **900 = Theoretical max (almost unreachable)**

---

## 1. CORE STRUCTURE (5 Components)

```
KarmaScore = 300 (Base) + Impact(0-250) + RelativeRank(0-180) + Trust(0-100) + Momentum(0-70)

Total Max = 900
```

---

## 2. COMPONENT BREAKDOWN

### A. Base Score — 300 (Fixed)

* Every user starts at 300
* Never goes below this (except fraud cases)

### B. Impact Score — 0 to 250

Measures actual contribution.

| Sub-component | Max Points |
|--------------|-----------|
| Volunteer hours | 0–80 |
| Event difficulty | 0–50 |
| Category diversity | 0–40 |
| Lifetime karma | 0–50 |
| Completion quality | 0–30 |

### C. Relative Rank Score — 0 to 180

Percentile-based (computed nightly via Redis ZSET).

| Percentile | Score |
|------------|-------|
| Top 50% | +30 |
| Top 25% | +70 |
| Top 10% | +110 |
| Top 5% | +140 |
| Top 1% | +170 |
| Top 0.1% | +180 |

### D. Trust Score — 0 to 100

Measures credibility.

| Factor | Weight |
|--------|--------|
| Approval rate | High |
| Verification confidence | High |
| Fraud-free history | High |
| Consistency | Medium |
| Check-in/check-out integrity | Medium |

### E. Momentum Score — 0 to 70

Measures recent activity.

| Factor | Weight |
|--------|--------|
| Last 30-day activity | High |
| Streaks | High |
| Score trend | Medium |
| Recency of participation | Medium |

---

## 3. SCORE MOVEMENT SYSTEM

### During the day
* Impact updates immediately
* Trust updates immediately

### Nightly (1:00 AM worker)
* Recalculate percentile (Relative Rank)
* Recompute full KarmaScore
* Store in ScoreHistory

---

## 4. SCORE DECAY

To prevent inflation:

| Inactivity | Effect |
|-----------|--------|
| 30 days | Momentum drops (~ -5) |
| 60 days | Momentum + slight Trust drop |
| 90 days | Larger Momentum drop |

Decay affects:
* Momentum
* (optionally small Trust)

---

## 5. SCORE BANDS (TIERS)

| Score Range | Tier | Color |
|-------------|------|--------|
| 300–499 | Starter | #9CA3AF |
| 500–649 | Active | #10B981 |
| 650–749 | Performer | #3B82F6 |
| 750–819 | Leader | #8B5CF6 |
| 820–879 | Elite | #F59E0B |
| 880–899 | Legend | #EF4444 |
| 900 | Pinnacle | #FFD700 |

---

## 6. DISTRIBUTION TARGET

* **70%** users → 500–700
* **20%** → 700–780
* **8%** → 780–850
* **~2%** → 850+

Ensures prestige at top.

---

## 7. SCORE STABILITY RULES

* Max daily movement: **±5 (normal)**
* Extreme cases: **±10 max**
* Smooth transitions (no sudden drops)

---

## 8. WHAT USERS SEE (UI Example)

```
┌─────────────────────────────────────┐
│  Karma Index: 782                    │
│  Top 8% in Bengaluru               │
│                                     │
│  Trend: ↑ +11 this month            │
│  Trust: A                          │
│  Momentum: Strong                   │
└─────────────────────────────────────┘
```

---

## 9. THREE-LAYER SYSTEM

| System | Range | Purpose | Spendable? |
|--------|-------|---------|-------------|
| **Karma Index** | 300-900 | Reputation | No |
| **Karma Points** | 0-∞ | Raw earned value | No |
| **ReZ Coins** | 0-∞ | Spendable rewards | Yes |

---

## 10. SUPPORTING DATA LAYER

### ScoreHistory (daily snapshot)

Stores:
* Total score
* Component breakdown
* Percentile
* Daily movement
* Streak days

Used for:
* Graphs
* Momentum calculation
* Transparency

---

## 11. KEY DESIGN PRINCIPLES

### 1. Hybrid system
* Absolute (Impact)
* Relative (Rank)

### 2. Not gameable
* Trust + verification
* Caps + diminishing returns

### 3. Dynamic but stable
* Daily updates (not real-time chaos)
* Movement limits

### 4. Prestige at top
* Hard to reach 850+
* 900 nearly impossible

---

## 12. FUTURE EXTENSIONS

* Green Bengaluru Score (sub-score)
* Civic Corps bonus multipliers
* Corporate leaderboards
* Reputation portability (finance, hiring)

---

## 13. FINAL ONE-LINE DEFINITION

**Karma Index is a 300–900 dynamic reputation score that reflects a user's real-world impact, trustworthiness, consistency, and standing relative to the community.**

---

## 14. REE IMPLEMENTATION

### karmaConfig.ts

```typescript
export const KARMA_CONFIG = {
  SCORE: {
    MIN: 300,
    MAX: 900,
    BASE: 300,
  },
  COMPONENTS: {
    IMPACT: { min: 0, max: 250 },
    RELATIVE_RANK: { min: 0, max: 180 },
    TRUST: { min: 0, max: 100 },
    MOMENTUM: { min: 0, max: 70 },
  },
  DECAY: {
    30_DAYS: -5,
    60_DAYS: -10,
    90_DAYS: -20,
  },
  STABILITY: {
    MAX_DAILY_CHANGE: 5,
    EXTREME_MAX: 10,
  },
  DISTRIBUTION: {
    P50: { score: 30 },
    P25: { score: 70 },
    P10: { score: 110 },
    P5: { score: 140 },
    P1: { score: 170 },
    P01: { score: 180 },
  },
};

export const KARMA_TIERS = [
  { name: 'Starter', minScore: 300, maxScore: 499, color: '#9CA3AF' },
  { name: 'Active', minScore: 500, maxScore: 649, color: '#10B981' },
  { name: 'Performer', minScore: 650, maxScore: 749, color: '#3B82F6' },
  { name: 'Leader', minScore: 750, maxScore: 819, color: '#8B5CF6' },
  { name: 'Elite', minScore: 820, maxScore: 879, color: '#F59E0B' },
  { name: 'Legend', minScore: 880, maxScore: 899, color: '#EF4444' },
  { name: 'Pinnacle', minScore: 900, maxScore: 900, color: '#FFD700' },
];
```

### karmaService.ts

```typescript
interface KarmaResult {
  userId: string;
  total: number;           // 300-900
  components: {
    base: 300;             // Always 300
    impact: number;         // 0-250
    relativeRank: number;    // 0-180
    trust: number;          // 0-100
    momentum: number;        // 0-70
  };
  tier: KarmaTier;
  percentile: number;
  dailyChange: number;      // ±5 max
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  nextUpdate: Date;        // Next nightly job
}

async function calculateKarmaScore(userId: string): Promise<KarmaResult> {
  // 1. Calculate Impact (immediate)
  const impact = await calculateImpactScore(userId);

  // 2. Calculate Trust (immediate)
  const trust = await calculateTrustScore(userId);

  // 3. Get Relative Rank (from Redis ZSET - nightly)
  const { rank, percentile } = await getRelativeRank(userId);
  const relativeRank = getRankScore(percentile);

  // 4. Calculate Momentum (nightly)
  const momentum = await calculateMomentumScore(userId);

  // 5. Apply stability rules
  const total = applyStability(300 + impact + trust + relativeRank + momentum);

  // 6. Get tier
  const tier = getTier(total);

  return {
    userId,
    total,
    components: { base: 300, impact, trust, relativeRank, momentum },
    tier,
    percentile,
    dailyChange: total - previousScore,
    trend: total > previousScore ? 'up' : total < previousScore ? 'down' : 'stable',
    lastUpdated: new Date(),
    nextUpdate: getNextMidnight(),
  };
}
```

---

## DOCUMENT INFO

**Version:** 2.0
**Last Updated:** 2026-05-04
**Status:** Ready for REE Implementation
