# REZ MIND COMPLETE AUDIT - ALL GAPS IDENTIFIED

**Date:** May 8, 2026
**Auditor:** Claude Code (30 Agent Audit)
**Focus:** REZ Mind - Data Collection, Processing, Output, All Issues

---

## COMPLETE FINDINGS

### PART 1: DATA COLLECTION (INTO REZ MIND)

| Service | Sends Events? | Event Types | Status |
|---------|--------------|-------------|--------|
| **rez-app-consumer** | | search, view, cart_add, checkout, fulfilled, order | |
| **rez-now** | | menu_viewed, item_added, checkout_started, order_placed | |
| **rez-app-merchant** | | merchant events | |
| **Hotel OTA** | | hotel_search, booking, checkout | |
| **rez-ads-service** | | campaign, impression, click | |
| **rez-gamification** | | badge, mission, coin | |
| **rez-feedback** | | rating, review | |
| **rez-catalog** | | catalog_view (different name) | |
| **rez-order** | | order lifecycle | |
| **rez-payment** | | payment events | |
| **rez-search** | | search queries | |
| **rez-wallet** | | wallet events | |
| **rez-auth** | | login, register | |
| **rez-notifications** | | notification events | |

### PART 2: DATA OUTPUT (FROM REZ MIND)

| Destination | Receives Recommendations? | Status |
|------------|------------------------|--------|
| **rez-app-consumer** | | NOT RECEIVING |
| **rez-app-merchant** | | PARTIALLY (copilot exists) |
| **rez-now** | | NOT RECEIVING |
| **Home Feed** | | NOT PERSONALIZED |
| **Search Results** | | NOT PERSONALIZED |
| **Product Pages** | | NOT PERSONALIZED |

### PART 3: GAPS IDENTIFIED

## GAP 1: Consumer App Not Receiving Recommendations

**Problem:** Consumer App sends events to REZ Mind but does NOT receive personalized recommendations back.

**Missing:**
- No call to `getRecommendations()` API
- No call to `getPersonalizedFeed()` API
- No call to `getUserProfile()` API
- Home feed shows generic order

**Fix Required:** Add personalization hook and integrate with home feed

## GAP 2: Intent Capture URL Not Configured

**Problem:** In `rez-app-consumer/services/intentCaptureService.ts`:

```typescript
const INTENT_CAPTURE_URL = process.env.EXPO_PUBLIC_INTENT_CAPTURE_URL || '';
// URL is EMPTY - events are not being sent!
```

**Fix Required:** Set `EXPO_PUBLIC_INTENT_CAPTURE_URL` environment variable

## GAP 3: Hotel OTA Uses Different Event Names

**Problem:** Catalog service sends `catalog.view` instead of `view` event type.

**Mismatch:**
- REZ Mind expects: `view`, `cart_add`, `search`
- Catalog sends: `catalog.view`, `catalog.add`, `catalog.search`

**Fix Required:** Map `catalog.*` events to standard event types

## GAP 4: Intelligence Hub Stubs Return Empty

**Problem:** Methods in Intelligence Hub return empty arrays:

```typescript
getUserIntents(): Promise<Intent[]> {
  return []; // STUB - no MongoDB query
}
```

**Fix Required:** Implement real MongoDB queries

## GAP 5: ML Models Not Trained

**Problem:** 
- `fraud-model.ts` missing
- `price-model.ts` missing
- Only `recommendation-model.ts` exists

**Fix Required:** Train models on real data from Intent Graph

## GAP 6: Action Engine In-Memory Store

**Problem:** Approvals stored in Map (lost on restart)

**Fix Required:** Use MongoDB for persistence

## GAP 7: Missing Services Sending Events

| Service | Should Send | Actually Sends |
|---------|-----------|--------------|
| rez-search | search.query | NOT FOUND |
| rez-order | order.placed | PARTIALLY |
| rez-payment | payment.success | PARTIALLY |
| rez-notifications | notification.sent | NOT FOUND |

---

## COMPLETE FIX PLAN

### PHASE 1: Fix Consumer App (CRITICAL)

#### Fix 1.1: Add Intent Capture URL
```bash
# In .env or build config
EXPO_PUBLIC_INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com
```

#### Fix 1.2: Create Personalization Hook
Create `rez-app-consumer/hooks/usePersonalization.ts`:
```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

export function usePersonalization(userId: string) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  async function fetchRecommendations() {
    setLoading(true);
    try {
      const response = await apiClient.get(`/personalization/${userId}/recommendations`);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
    setLoading(false);
  }

  return { recommendations, loading, refresh: fetchRecommendations };
}
```

#### Fix 1.3: Integrate with Home Feed
Modify `rez-app-consumer/app/(tabs)/index.tsx`:
```typescript
import { usePersonalization } from '../hooks/usePersonalization';

// In component:
const { recommendations } = usePersonalization(userId);

// Use recommendations to rank/sort the feed
```

### PHASE 2: Fix Intelligence Hub

#### Fix 2.1: Implement Real Queries
Update `rez-intelligence-hub/src/services/userIntelligence.ts`:
```typescript
async getUserIntents(userId: string): Promise<Intent[]> {
  const intents = await this.intentCollection
    .find({ userId, status: 'ACTIVE' })
    .sort({ lastSeenAt: -1 })
    .limit(20)
    .toArray();
  return intents;
}
```

### PHASE 3: Fix Event Mapping

#### Fix 3.1: Standardize Event Types
Update `rez-catalog-service/src/services/rezMindService.ts`:
```typescript
// Map catalog.view to standard 'view' event
function mapToStandardEvent(catalogEvent: string): EventType {
  const mapping: Record<string, EventType> = {
    'catalog.view': 'view',
    'catalog.add': 'cart_add',
    'catalog.search': 'search',
    'catalog.checkout': 'checkout_start',
  };
  return mapping[catalogEvent] || 'view';
}
```

### PHASE 4: Fix Action Engine

#### Fix 4.1: Add MongoDB Persistence
Update `rez-action-engine/src/services/approvalQueue.ts`:
```typescript
// Replace in-memory Map with MongoDB collection
const approvalCollection = db.collection('action_approvals');

// Save approval
await approvalCollection.insertOne({ actionId, status, createdAt });

// Load approvals on startup
const approvals = await approvalCollection.find({}).toArray();
```

### PHASE 5: Add Missing Event Senders

#### Fix 5.1: Search Service Events
Add to `rez-search-service/src/routes/searchRoutes.ts`:
```typescript
// After search query
await captureIntent({
  userId,
  eventType: 'search',
  intentKey: query,
  category: 'GENERAL',
  confidence: 0.15
});
```

#### Fix 5.2: Order Service Events
Add to `rez-order-service/src/services/orderService.ts`:
```typescript
// After order placed
await emitEvent('order.placed', { orderId, userId, merchantId, total });
```

---

## ACTION ITEMS

| # | Gap | File to Create/Modify | Priority |
|---|-----|---------------------|----------|
| 1 | Intent URL empty | `.env` | CRITICAL |
| 2 | No personalization hook | `hooks/usePersonalization.ts` | CRITICAL |
| 3 | Home feed not personalized | `app/(tabs)/index.tsx` | CRITICAL |
| 4 | Intelligence Hub stubs | `services/userIntelligence.ts` | HIGH |
| 5 | Event type mismatch | `services/rezMindService.ts` | HIGH |
| 6 | Action Engine memory | `services/approvalQueue.ts` | MEDIUM |
| 7 | Search events missing | `routes/searchRoutes.ts` | MEDIUM |
| 8 | ML models missing | `ml-engine/` | LOW |

---

*Audit Complete - All Gaps Identified*
*Next: Implementing Fixes*
