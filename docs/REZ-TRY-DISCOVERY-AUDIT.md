# ReZ Try Discovery Audit
**Version:** 1.0  
**Date:** May 3, 2026  
**Purpose:** Identify gaps between current ReZ Try and Spontaa-style discovery

---

## 1. Current State Summary

### What ReZ Try Has
Based on SOURCE-OF-TRUTH.md, ReZ Try includes:
- Discovery Feed (location-based trials)
- Trial Booking
- QR Redemption
- Coin Wallet
- Explorer Score
- Missions
- Badges
- Leaderboard
- Surprise Trials
- Bundles
- Campaigns
- Review System

### 13 Features Implemented ✓
| Feature | Mobile | Web | Backend |
|---------|--------|-----|---------|
| Discovery Feed | ✓ | ✓ | ✓ |
| Trial Booking | ✓ | ✓ | ✓ |
| QR Redemption | ✓ | ✓ | ✓ |
| Coin Wallet | ✓ | ✓ | ✓ |
| Coin Purchase | ✓ | ✓ | ✓ |
| Explorer Score | ✓ | ✓ | ✓ |
| Missions | ✓ | ✓ | ✓ |
| Badges | ✓ | ✓ | ✓ |
| Leaderboard | ✓ | ✓ | ✓ |
| Surprise Trials | ✓ | ✓ | ✓ |
| Bundles | ✓ | ✓ | ✓ |
| Campaigns | ✓ | ✓ | ✓ |
| Review System | ✓ | ✓ | ✓ |

---

## 2. Spontaa Gap Analysis

### 2.1 Discovery Intelligence

| Capability | Spontaa | ReZ Try | Gap |
|------------|---------|---------|-----|
| **Intent-based discovery** | ✓ "What should I do?" | ✗ Manual browse | **HIGH** |
| **Mood-based recommendations** | ✓ "I'm bored" | ✗ None | **HIGH** |
| **Context-aware suggestions** | ✓ Time, weather, location | ✗ Location only | **MEDIUM** |
| **"Taste" matching** | ✓ AI personality | ✗ None | **HIGH** |
| **Why shown explainability** | ✓ "Because you liked X" | ✗ None | **HIGH** |

### 2.2 Personalization Depth

| Capability | Spontaa | ReZ Try | Gap |
|------------|---------|---------|-----|
| **User preference learning** | ✓ Implicit + explicit | ✗ None | **HIGH** |
| **Visit history integration** | ✓ "Back to favorites" | ✗ Trial history only | **MEDIUM** |
| **Affinity scoring** | ✓ Cuisines, vibes, price | ✗ None | **HIGH** |
| **Dormant intent revival** | ✓ "You were looking at..." | ✗ None | **HIGH** |
| **Diversity in results** | ✓ Avoids repetition | ✗ Random | **MEDIUM** |

### 2.3 Content Quality

| Capability | Spontaa | ReZ Try | Gap |
|------------|---------|---------|-----|
| **Curated AI voice/tone** | ✓ "You'd vibe with this" | ✗ Generic | **HIGH** |
| **Rich entity data** | ✓ Events, venues, experiences | ✗ Trials only | **MEDIUM** |
| **Fresh content** | ✓ Real-time events | ✗ Merchant-managed | **MEDIUM** |
| **Social proof** | ✓ Friends' activity | ✗ Leaderboard only | **MEDIUM** |
| **Trending detection** | ✓ What's hot now | ✗ Static categories | **MEDIUM** |

---

## 3. Critical Gaps Detail

### Gap 1: No Natural Language Discovery
**Problem:** Users can only browse by category/location, not express intent naturally.

**Spontaa:**
```
User: "What should I do tonight?"
Spontaa: "Based on your vibe, I'd suggest..."
```

**ReZ Try (Current):**
```
User: Must navigate categories, filter manually
ReZ Try: Returns filtered list
```

**Impact:** High - discovery friction is 10x higher

**Recommendation:** Add intent parser + natural language interface (from REZ-CHAT-INTERFACE-SPEC.md)

---

### Gap 2: No Personalization Engine
**Problem:** Feed is same for all users (or based on location only).

**Spontaa:**
- Learns user preferences over time
- Adjusts recommendations based on:
  - Past visits
  - Ratings given
  - Time of day
  - Weather
  - Social context

**ReZ Try (Current):**
```typescript
// Current feed query
const feed = await Trial.find({
  location: { $near: userLocation },
  status: 'active',
  // No personalization
});
```

**Impact:** High - users see irrelevant content

**Recommendation:** Implement intent graph integration (from REZ-INTENT-DISCOVERY-PIPELINE.md)

---

### Gap 3: No "Taste Profile"
**Problem:** No concept of user preferences beyond karma tier.

**Spontaa:**
```typescript
// Learned taste profile
tasteProfile: {
  cuisines: [{ italian: 0.85 }, { japanese: 0.72 }],
  vibes: [{ quiet: 0.65 }, { lively: 0.40 }],
  priceRange: 'mid',
}
```

**ReZ Try (Current):**
```typescript
// User model - no preference data
interface User {
  id: string;
  karma: number;
  coins: number;
  tier: 'bronze' | 'silver' | 'gold';
  // No taste data!
}
```

**Impact:** High - can't personalize beyond generic

**Recommendation:** Add taste profile to user model, populate from behavior

---

### Gap 4: No Explainability
**Problem:** Users don't know WHY a trial is shown.

**Spontaa:**
```
┌────────────────────────────────────┐
│ Hidden Speakeasy Bar 🍸            │
│ ████████████░░ 0.8km              │
│ ⭐ 4.8 (234 reviews)              │
│                                    │
│ 💡 Because you love jazz bars     │
│ 💰 Save 15% with Gold status      │
└────────────────────────────────────┘
```

**ReZ Try (Current):**
```
┌────────────────────────────────────┐
│ Spa Massage Trial                  │
│ ████████████░░ 2km                │
│ ⭐ 4.5 (89 reviews)               │
│                                    │
│ [Book Now]                         │
└────────────────────────────────────┘
```

**Impact:** Medium - users trust less without context

**Recommendation:** Add `whyShown` field to discovery cards

---

### Gap 5: No Dormant Intent Revival
**Problem:** User interest that isn't acted on disappears forever.

**Spontaa:**
```
User searched "italian restaurants" last week but didn't book
→ "That Italian place you looked at? They have a trial now."
```

**ReZ Try (Current):**
- Search history exists but isn't used for recommendations
- No concept of "intent decay"

**Impact:** Medium - lost conversion opportunities

**Recommendation:** Implement dormant intent tracking + revival prompts

---

### Gap 6: No Mood/Context Intents
**Problem:** Can't respond to emotional/intentional queries.

**Spontaa intents:**
- "I'm bored" → Surprise me
- "Want to celebrate" → Premium options
- "Need to relax" → Spa/wellness focus
- "On a date" → Romantic venues

**ReZ Try (Current):**
- Only supports: browse by category, search by name

**Impact:** High - missing majority of discovery moments

**Recommendation:** Add mood-based intent classifier

---

### Gap 7: No "Back To" / Habit Loop
**Problem:** No re-engagement with user's past interests.

**Spontaa:**
```
"Welcome back! Ready for your usual?"
[Show top 3 previously visited venues]
```

**ReZ Try (Current):**
- "My Trials" exists but separate from discovery feed
- No habit-based suggestions

**Impact:** Medium - missed loyalty opportunity

**Recommendation:** Add "Continue Your Journey" section to feed

---

### Gap 8: No Surprise/Delight Factor
**Problem:** Discovery is utilitarian, not delightful.

**Spontaa:**
```
🎲 SURPRISE PICK
"We think you'd love this hidden gem..."
[Blind reveal with swipe]
```

**ReZ Try (Current):**
- "Surprise Trial" exists but is separate feature
- Not integrated into main discovery

**Impact:** Low-Medium - nice to have

**Recommendation:** Integrate surprise element into discovery cards

---

### Gap 9: No Social Discovery
**Problem:** No visibility into friends' activity.

**Spontaa:**
```
👥 Friends' picks:
Sarah tried "Jazz Bar" - loved it
Alex is going to "Sushi Spot" tonight
```

**ReZ Try (Current):**
- Leaderboard exists but separate
- No friends' activity in discovery

**Impact:** Medium - social proof is powerful

**Recommendation:** Add friends' activity section to feed

---

### Gap 10: No "Serendipity" Factor
**Problem:** Too algorithmic, misses chance for serendipitous discovery.

**Spontaa:**
```
🌟 "This week's wild card..."
[High novelty, low predicted relevance, high reward]
```

**ReZ Try (Current):**
- Explorer Score exists but doesn't drive discovery
- No controlled serendipity

**Impact:** Low - users get bored with pure relevance

**Recommendation:** Add "Explore Beyond" section with diverse options

---

## 4. Technical Gap Analysis

### 4.1 Missing Services

| Service | Exists | Status | Needed For |
|---------|--------|--------|------------|
| Intent Parser | ✗ | New | Natural language discovery |
| Recommendation Engine | ✗ | New | Personalized feed |
| Affinity Scoring | ✗ | New | Taste matching |
| Context Enrichment | ✗ | New | Context-aware suggestions |
| Dormant Intent Service | ✗ | New | Intent revival |
| Feed Personalization | ✗ | New | Customized ranking |

### 4.2 Missing Data Models

| Model | Exists | Needed For |
|-------|--------|----------|
| UserTasteProfile | ✗ | Preference storage |
| UserIntentHistory | Partial | Intent tracking |
| AffinityScores | ✗ | Taste matching |
| DormantIntent | ✗ | Intent revival |
| FeedSection | ✗ | Personalized layouts |

### 4.3 API Gaps

| Endpoint | Exists | Needed For |
|----------|--------|------------|
| POST /api/discover | ✗ | Intent-based search |
| GET /api/feed/personalized | ✗ | Customized feed |
| GET /api/why-shown/:entityId | ✗ | Explainability |
| GET /api/revive | ✗ | Dormant intent revival |
| POST /api/feedback/recommendation | ✗ | Implicit feedback |

---

## 5. Competitive Position

### 5.1 ReZ Try Advantages Over Spontaa

| Advantage | Description |
|-----------|-------------|
| **Transaction capability** | Can book + pay in-app |
| **Karma rewards** | Loyalty built-in |
| **QR redemption** | Physical bridging |
| **Multi-category** | Beyond just discovery |
| **Existing infrastructure** | Wallet, orders, etc. |

### 5.2 ReZ Try Disadvantages vs Spontaa

| Disadvantage | Impact |
|--------------|--------|
| No personalization | Low relevance |
| No natural language | High friction |
| No explainability | Low trust |
| No taste profiling | One-size-fits-all |
| No intent revival | Lost opportunities |

---

## 6. Priority Recommendations

### P0 - Critical (Launch blockers)
1. **Natural Language Interface** - Add chat discovery
2. **Personalization Engine** - Connect to intent graph

### P1 - High (Significant impact)
3. **Taste Profile** - Learn user preferences
4. **Why Shown** - Explain recommendations
5. **Mood Intents** - Support "I'm bored", "celebrate", etc.

### P2 - Medium (Nice to have)
6. **Dormant Intent Revival** - Re-engage
7. **Social Discovery** - Friends' activity
8. **Serendipity Mode** - Explore beyond

### P3 - Low (Polish)
9. **Surprise Integration** - Delight factor
10. **Context Enrichment** - Weather, time awareness

---

## 7. Implementation Priority Matrix

```
Impact
  HIGH │ [P0]        │ [P1]         │
       │ Chat +      │ Taste +      │
       │ Personalize │ Why Shown    │
───────┼─────────────┼──────────────┼─────────
 MED   │             │              │
       │ [P1]        │ [P2]         │
       │ Mood Intents│ Social +     │
       │             │ Dormant      │
───────┼─────────────┼──────────────┼─────────
 LOW   │             │              │
       │             │ [P3]         │
       │             │ Surprise +   │
       │             │ Context      │
───────┴─────────────┴──────────────┴─────────
       URGENT       MODERATE      WHEN READY
              Development Effort
```

---

## 8. Quick Wins

### 8.1 Add "Why Shown" to Cards (2 hours)
```typescript
// In trial card component
const whyShown = [
  "Matches your wellness preference",
  "New trial in your area",
  "Earn 50 coins on first visit"
];
```

### 8.2 Add Mood Categories (1 day)
```typescript
const MOOD_CATEGORIES = [
  { id: 'bored', label: "I'm bored", icon: '🤔' },
  { id: 'celebrate', label: 'Celebrating', icon: '🎉' },
  { id: 'relax', label: 'Need to relax', icon: '🧘' },
  { id: 'adventure', label: 'Feeling adventurous', icon: '🌟' },
];
```

### 8.3 Add "Because You Liked X" Section (2 days)
```typescript
// Discovery feed section
{
  title: "More like your favorites",
  query: { similarTo: user.topVisitedCategories },
}
```

### 8.4 Add Dormant Intent Banner (1 day)
```typescript
// Show banner if user has unacted intents
{
  message: "You were curious about spas last week...",
  cta: "See what's available",
}
```

---

## 9. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Discovery CTR | ? | 15% | Cards clicked / cards shown |
| Feed engagement | ? | 5 scrolls/user | Avg scroll depth |
| Intent fulfillment | ? | 60% | Queries leading to booking |
| User understanding | ? | 80% | "Why shown" seen |
| Return discovery | ? | 40% | Repeat discovery sessions |

---

## 10. Audit Summary

### What's Working ✓
- Core trial discovery functionality
- Booking flow
- Gamification (coins, score, badges)
- QR redemption
- Technical infrastructure

### Critical Gaps ✗
1. No natural language discovery
2. No personalization
3. No taste profiling
4. No explainability
5. No mood-based intents
6. No dormant intent revival

### Path Forward
1. **Phase 1:** Add chat interface + personalization (2 weeks)
2. **Phase 2:** Add taste profile + explainability (2 weeks)
3. **Phase 3:** Add mood intents + revival (2 weeks)
4. **Phase 4:** Polish + social + serendipity (2 weeks)

**Total: 8 weeks to close the gap with Spontaa + exceed it with ReZ's transaction capabilities.**
