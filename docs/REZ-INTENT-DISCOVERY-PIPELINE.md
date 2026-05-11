# ReZ Intent → Discovery Pipeline
**Version:** 1.0  
**Date:** May 3, 2026  
**Purpose:** Map ReZ Intent Graph to Spontaa-style personalized recommendations

---

## 1. Overview

This document describes how ReZ Mind's intent graph transforms into personalized discovery experiences — the **Spontaa layer**.

### The Core Loop
```
User Intent → Intent Graph → AI Processing → Personalized Discovery → User Action → Graph Update
```

### What Makes It "Spontaa"
Spontaa's magic was **contextual discovery based on taste, not just data**. We replicate this by:
1. Knowing WHO the user is (intent graph)
2. Knowing WHEN they want it (context)
3. Knowing WHERE they are (location)
4. Knowing WHAT they've done (history)
5. Knowing WHAT they MIGHT like (predictions)

---

## 2. Intent Graph → Discovery Pipeline

### 2.1 Data Sources
```
┌─────────────────────────────────────────────────────────────┐
│                    REZ INTENT GRAPH                         │
├─────────────────────────────────────────────────────────────┤
│  Intent Nodes          │  User Context      │  Time Context │
│  ─────────────         │  ───────────       │  ───────────  │
│  • search_queries      │  • location        │  • time_of_day│
│  • view_events         │  • weather         │  • day_of_week│
│  • booking_history     │  • nearby_devices  │  • season     │
│  • purchase_patterns   │  • app_state       │  • recent     │
│  • feedback_given      │  • session_duration│  • scheduled  │
│  • referrals_made      │                    │               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Pipeline Architecture
```
USER INPUT
    │
    ▼
┌─────────────────┐
│ Intent Capture  │  ← Natural language or action
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Intent Parser   │  ← Extract: what, when, where, who
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Profile    │  ← Fetch from intent graph
│ Lookup          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Context Builder │  ← Merge: intent + profile + context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Recommendation  │  ← ML model / rules engine
│ Engine          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Ranking &      │  ← Re-rank by: karma, distance, freshness
│ Personalization│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Discovery Feed  │  ← Render cards for user
└─────────────────┘
```

---

## 3. User Intent Types

### 3.1 Intent Taxonomy
```typescript
enum DiscoveryIntent {
  // Explicit Discovery
  BROWSE = 'browse',           // "Show me restaurants"
  SEARCH = 'search',           // "Find Italian food"
  NEARBY = 'nearby',           // "What's near me"

  // Mood-Based Discovery
  IM_BORED = 'im_bored',      // "I'm bored"
  CELEBRATE = 'celebrate',     // "Want to celebrate"
  RELAX = 'relax',             // "Need to relax"
  ADVENTURE = 'adventure',     // "Want something new"

  // Context-Aware
  NOW = 'now',                 // "What to do right now"
  LATER = 'later',             // "Plan for later"
  THIS_WEEKEND = 'this_weekend',

  // Habit-Based
  BACK_TO = 'back_to',         // "Go back to that place"
  TRY_AGAIN = 'try_again',     // "I liked that, find similar"
  UNFINISHED = 'unfinished',   // "I was going to try..."

  // Social
  WITH_FRIENDS = 'with_friends',
  DATE_NIGHT = 'date_night',
  FAMILY = 'family_outing',
}
```

### 3.2 Intent → Query Mapping
```typescript
const INTENT_QUERY_MAP: Record<DiscoveryIntent, QueryBuilder> = {
  [DiscoveryIntent.IM_BORED]: {
    // Find diverse options user hasn't tried
    diversityBoost: 0.8,       // Penalize repeat visits
    recencyBoost: 0.3,
    trendingBoost: 0.5,
  },

  [DiscoveryIntent.CELEBRATE]: {
    // Find premium, highly-rated options
    ratingBoost: 0.9,
    ambianceBoost: 0.8,
    priceRange: ['mid', 'high'],
  },

  [DiscoveryIntent.NOW]: {
    // Open right now, close by
    openNow: true,
    distanceWeight: 0.9,
    lastMinuteBoost: 0.7,
  },

  [DiscoveryIntent.BACK_TO]: {
    // User's previously visited, high affinity
    revisitBoost: 1.0,
    userAffinity: 0.9,
  },

  [DiscoveryIntent.WITH_FRIENDS]: {
    // Group-friendly, good atmosphere
    groupFriendly: true,
    averageSpend: 'moderate',
    vibe: ['casual', 'lively'],
  },

  [DiscoveryIntent.DATE_NIGHT]: {
    // Romantic, quiet, highly-rated
    vibe: ['romantic', 'intimate'],
    ratingMin: 4.5,
    noiseLevel: 'low',
  },
};
```

---

## 4. User Profile (from Intent Graph)

### 4.1 Profile Structure
```typescript
interface UserDiscoveryProfile {
  userId: string;

  // Taste Profile (learned over time)
  tasteProfile: {
    cuisines: AffinityScore[];      // { cuisine: 'italian', score: 0.85 }
    categories: AffinityScore[];   // { category: 'cafes', score: 0.72 }
    priceRange: 'budget' | 'mid' | 'premium';
    vibe: AffinityScore[];         // { vibe: 'quiet', score: 0.65 }
    distance: 'walking' | 'short' | 'any';
  };

  // Behavior Patterns
  patterns: {
    avgPartySize: number;
    preferredTimes: TimeSlot[];
    bookingLeadTime: number;      // hours in advance
    spontaneity: number;          // 0-1, how last-minute
    loyaltyTendency: number;       // 0-1, revisits vs explores
  };

  // Recent History (last 30 days)
  recentActivity: {
    visitedVenues: string[];
    triedTrials: string[];
    purchasedProducts: string[];
    averageSpend: number;
  };

  // Dormant Intents (not acted on)
  dormantIntents: {
    intentId: string;
    query: string;
    createdAt: Date;
    priority: number;             // Decay over time
  }[];

  // Achievements & State
  karma: {
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    points: number;
    multiplier: number;
  };
  coins: number;
  vouchers: number;
}
```

### 4.2 Affinity Scoring
```typescript
interface AffinityScore {
  tag: string;
  score: number;           // 0-1, recency-weighted
  visitCount: number;
  lastVisit: Date;
  avgRating: number;       // User's rating of this tag
  decayFactor: number;     // How fast preference fades
}

// Score calculation
const calculateAffinity = (events: UserEvent[]): AffinityScore[] => {
  return events.reduce((acc, event) => {
    const daysSince = daysBetween(event.timestamp, now());
    const recencyWeight = Math.exp(-daysSince / 30); // Half-life of 30 days
    const ratingWeight = event.rating || 4; // Default neutral

    const score = (event.implicitWeight * recencyWeight * ratingWeight) / 3;

    acc[event.tag] = {
      tag: event.tag,
      score: Math.min(1, (acc[event.tag]?.score || 0) + score),
      visitCount: acc[event.tag]?.visitCount + 1,
      lastVisit: event.timestamp,
      avgRating: event.rating || 4,
      decayFactor: 0.95,
    };
    return acc;
  }, {});
};
```

---

## 5. Context Enrichment

### 5.1 Context Layers
```typescript
interface DiscoveryContext {
  // Immediate Context
  location: {
    lat: number;
    lng: number;
    accuracy: number;           // meters
    heading: number;            // direction facing
    speed: number;               // m/s, 0 if stationary
  };

  // Time Context
  time: {
    now: Date;
    dayOfWeek: 'weekday' | 'weekend';
    mealTime: 'breakfast' | 'lunch' | 'dinner' | 'late_night' | 'none';
    hour: number;
  };

  // Weather Context (optional)
  weather?: {
    condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
    temp: number;
    feelsLike: number;
  };

  // Social Context
  social?: {
    detectedNearby: string[];   // Other users
    activeEventsNearby: number;
    friendsNearby: string[];
  };

  // App State Context
  appState: {
    wasActive: boolean;
    sessionDuration: number;     // seconds
    lastScreen: string;
    inCall: boolean;
  };
}
```

### 5.2 Context → Query Adjustments
```typescript
const applyContext = (query: DiscoveryQuery, context: DiscoveryContext): DiscoveryQuery => {
  let adjusted = { ...query };

  // Time-based adjustments
  if (context.time.mealTime === 'lunch') {
    adjusted.categories = [...adjusted.categories, 'quick_bite', 'casual'];
    adjusted.maxDuration = 60; // Lunch in 60 mins
  }

  if (context.time.mealTime === 'dinner') {
    adjusted.categories = [...adjusted.categories, 'dine_in', 'full_service'];
    adjusted.partySize = adjusted.partySize || 2;
  }

  // Weather adjustments
  if (context.weather?.condition === 'rainy') {
    adjusted.venueTypes = adjusted.venueTypes.filter(t =>
      ['indoor', 'covered', 'delivery'].includes(t)
    );
  }

  // Speed-based adjustments (user moving)
  if (context.location.speed > 1) {
    // User is moving - deprioritize distance, show on-route options
    adjusted.onRoute = true;
    adjusted.detourMax = 5; // minutes
  }

  // Social context
  if (context.social?.friendsNearby.length > 0) {
    // Friends nearby - boost social venues
    adjusted.socialBoost = 0.5;
  }

  return adjusted;
};
```

---

## 6. Recommendation Engine

### 6.1 Multi-Signal Scoring
```typescript
interface RecommendationScore {
  entityId: string;
  entityType: 'venue' | 'trial' | 'event' | 'product';

  // Signal components
  signals: {
    tasteMatch: number;          // User's taste profile match
    relevance: number;           // Query intent match
    recency: number;             // New/trending bonus
    proximity: number;           // Distance score
    availability: number;       // Open, has slots
    karmaValue: number;         // Karma discount available
    socialProof: number;        // Reviews, friends visited
    novelty: number;            // New to user
  };

  // Weighted final score
  finalScore: number;

  // Reasoning (for explainability)
  reasons: string[];
}

const calculateFinalScore = (signals: Signals, weights: Weights): number => {
  return (
    signals.tasteMatch * weights.tasteMatch +
    signals.relevance * weights.relevance +
    signals.recency * weights.recency +
    signals.proximity * weights.proximity +
    signals.availability * weights.availability +
    signals.karmaValue * weights.karmaValue +
    signals.socialProof * weights.socialProof +
    signals.novelty * weights.novelty
  );
};

// Default weights (adjustable per intent)
const DEFAULT_WEIGHTS = {
  tasteMatch: 0.25,
  relevance: 0.20,
  recency: 0.10,
  proximity: 0.15,
  availability: 0.10,
  karmaValue: 0.05,
  socialProof: 0.10,
  novelty: 0.05,
};
```

### 6.2 Intent-Specific Ranking
```typescript
const RANKING_PROFILES: Record<DiscoveryIntent, RankingProfile> = {
  [DiscoveryIntent.IM_BORED]: {
    weights: {
      novelty: 0.30,            // Prioritize new experiences
      tasteMatch: 0.25,
      relevance: 0.15,
      proximity: 0.10,
      karmaValue: 0.10,
      socialProof: 0.05,
      recency: 0.05,
      availability: 0.00,
    },
    diversityRequirement: 0.3,   // Ensure variety
    maxFromSameCategory: 0.4,   // Max 40% from one category
  },

  [DiscoveryIntent.BACK_TO]: {
    weights: {
      tasteMatch: 0.50,
      novelty: 0.00,
      relevance: 0.20,
      karmaValue: 0.10,
      proximity: 0.10,
      socialProof: 0.10,
      recency: 0.00,
      availability: 0.00,
    },
  },

  [DiscoveryIntent.NOW]: {
    weights: {
      proximity: 0.35,
      availability: 0.30,
      tasteMatch: 0.15,
      karmaValue: 0.10,
      relevance: 0.10,
      novelty: 0.00,
      socialProof: 0.00,
      recency: 0.00,
    },
    filterRequirements: {
      openNow: true,
      maxWait: 15, // minutes
    },
  },

  [DiscoveryIntent.CELEBRATE]: {
    weights: {
      socialProof: 0.30,
      tasteMatch: 0.20,
      karmaValue: 0.20,
      relevance: 0.15,
      proximity: 0.05,
      novelty: 0.05,
      availability: 0.05,
      recency: 0.00,
    },
  },
};
```

### 6.3 Dormant Intent Revival
```typescript
// ReZ Mind's unique feature: revive abandoned intents
interface DormantIntentRevival {
  // Find intents user showed interest in but didn't act on
  findDormantIntents = async (userId: string): Promise<DormantIntent[]> => {
    const dormant = await intentGraph.find({
      userId,
      state: 'dormant',
      createdAt: { $gte: subDays(now(), 14) }, // Within 2 weeks
    });

    // Calculate revival priority
    return dormant.map(intent => ({
      ...intent,
      revivalScore: calculateRevivalScore(intent),
    }))
    .sort((a, b) => b.revivalScore - a.revivalScore);
  };

  // When showing discovery, opportunistically revive
  const revivalPrompt = (dormant: DormantIntent): string | null => {
    if (dormant.intent.query.includes('italian')) {
      return "You were curious about Italian places last week. Found a new one!";
    }
    if (dormant.intent.query.includes('spa')) {
      return "That spa you were looking at? They have a deal right now.";
    }
    return null;
  };
}
```

---

## 7. Feed Personalization

### 7.1 Feed Layout Strategy
```typescript
interface FeedLayout {
  sections: FeedSection[];
  density: 'compact' | 'standard' | 'spacious';
}

interface FeedSection {
  type: 'hero' | 'carousel' | 'grid' | 'list' | 'prompt';

  // Content
  items?: DiscoveryCard[];
  prompt?: string;           // For 'prompt' type
  title?: string;

  // Behavior
  horizontalScroll?: boolean;
  seeMore?: string;          // CTA link

  // Targeting
  triggerCondition?: (context: DiscoveryContext) => boolean;
}

const DEFAULT_FEED_LAYOUT: FeedLayout = {
  sections: [
    // Hero: Only for specific intents
    {
      type: 'hero',
      triggerCondition: (ctx) => ctx.time.mealTime === 'lunch',
      title: 'Lunch spots nearby',
    },

    // "Back to" - high relevance
    {
      type: 'carousel',
      title: 'Pick up where you left off',
      triggerCondition: (ctx) => ctx.user.hasDormantIntents,
    },

    // "Try something new" - high novelty
    {
      type: 'carousel',
      title: 'You haven\'t tried these yet',
    },

    // Trending in user's taste
    {
      type: 'grid',
      title: 'Trending in your style',
    },

    // Karma-friendly
    {
      type: 'carousel',
      title: 'Use your karma here',
      triggerCondition: (ctx) => ctx.user.karma.tier !== 'bronze',
    },

    // Nearby now
    {
      type: 'list',
      title: 'Open now',
    },

    // Events/Experiences
    {
      type: 'carousel',
      title: 'Happening this week',
      triggerCondition: (ctx) => ctx.user.categoryAffinity.trials > 0.5,
    },
  ],
  density: 'standard',
};
```

### 7.2 Card Personalization
```typescript
interface DiscoveryCard {
  id: string;
  type: 'venue' | 'trial' | 'event' | 'product';
  entity: Entity;

  // Personalized signals
  whyShown: string[];         // "Matches your Italian preference", "New in your area"
  karmaDiscount?: number;     // "20% off with your Gold status"
  coinEarning?: number;      // "+50 coins"

  // Visual
  image: string;
  badges: Badge[];

  // Actions
  primaryAction: Action;
  secondaryActions: Action[];
}

const WHY_SHOWN_TEMPLATES = {
  tasteMatch: [
    "You've visited {count} {category} places",
    "Matches your {vibe} vibe",
    "Based on your love of {cuisine}",
  ],
  novelty: [
    "New to you",
    "You haven't tried this yet",
    "First time on ReZ",
  ],
  timing: [
    "Open right now",
    "Closes at {time}",
    "{distance} away",
    "Good for {mealTime}",
  ],
  social: [
    "{count} friends visited this week",
    "Trending locally",
    "{rating}★ from {count} reviews",
  ],
  karma: [
    "Save {percent}% with your {tier} status",
    "Earn {coins} coins here",
    "Part of your loyalty program",
  ],
};
```

---

## 8. A/B Testing Framework

### 8.1 Test Configurations
```typescript
interface FeedExperiment {
  id: string;
  name: string;
  variants: {
    [variantId: string]: {
      weights: Weights;
      layout: FeedLayout;
      signals: string[];        // Which signals to show
    };
  };
  targeting: {
    userSegments?: string[];
    intents?: DiscoveryIntent[];
    contextConditions?: Condition[];
  };
  metrics: {
    primary: 'discovery_ctr' | 'booking_rate' | 'engagement';
    secondary: string[];
  };
}

// Example: Novelty vs Relevance test
const NOVELTY_VS_RELEVANCE_TEST: FeedExperiment = {
  id: 'feed-novelty-v-relevance',
  name: 'Novelty vs Relevance Ranking',
  variants: {
    control: {
      weights: DEFAULT_WEIGHTS,
      layout: DEFAULT_FEED_LAYOUT,
      signals: ['tasteMatch', 'proximity'],
    },
    novelty: {
      weights: {
        ...DEFAULT_WEIGHTS,
        novelty: 0.40,
        relevance: 0.10,
      },
      layout: DEFAULT_FEED_LAYOUT,
      signals: ['tasteMatch', 'novelty', 'recency'],
    },
  },
  targeting: {
    userSegments: ['explorers'], // Users with high novelty tendency
  },
  metrics: {
    primary: 'discovery_ctr',
    secondary: ['booking_rate', 'revisit_rate', 'diversity_score'],
  },
};
```

---

## 9. Performance Requirements

| Metric | Target | SLO |
|--------|--------|-----|
| Feed load time | < 200ms | p95 |
| Personalization latency | < 100ms | p95 |
| Feed render (20 items) | < 50ms | p95 |
| Scroll FPS | 60fps | p99 |
| Memory (100 items) | < 30MB | max |

---

## 10. Analytics & Monitoring

### 10.1 Discovery Events
```typescript
const DISCOVERY_EVENTS = {
  feedImpression: {
    section: string;
    position: number;
    cardType: string;
    score: number;
  },

  cardView: {
    cardId: string;
    timeOnCard: number;
    scrollDepth: number;
  },

  cardAction: {
    cardId: string;
    action: 'book' | 'directions' | 'save' | 'share' | 'dismiss';
    timeToAction: number;
  },

  feedRefresh: {
    trigger: 'pull' | 'auto' | 'intent_change';
    resultsCount: number;
    personalizationApplied: boolean;
  },
};
```

### 10.2 Quality Metrics
```typescript
interface FeedQualityMetrics {
  coverage: number;            // % users with personalized feed
  diversity: number;           // Avg unique categories in top 20
  freshness: number;           // Avg days since entity update
  relevance: number;           // Avg predicted CTR
  recency: number;             // Avg entity age in feed
}
```

---

## 11. Implementation Checklist

### Infrastructure
- [ ] Intent graph queries optimized (< 50ms p99)
- [ ] Entity embeddings indexed
- [ ] Feature store for user profiles
- [ ] Redis cache for hot paths

### ML Pipeline
- [ ] Affinity scoring service
- [ ] Context enrichment service
- [ ] Recommendation model (can start with rules)
- [ ] A/B testing infrastructure

### Frontend
- [ ] Feed component with sections
- [ ] Card personalization display
- [ ] "Why shown" explainability
- [ ] Infinite scroll with pagination

### Testing
- [ ] Unit tests for scoring logic
- [ ] Integration tests for pipeline
- [ ] A/B test for ranking weights
- [ ] Shadow mode for new model
