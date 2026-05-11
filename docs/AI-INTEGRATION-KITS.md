# AI Bus Integration Kits

Ready-to-use code for connecting each service to ReZ Mind.

---

## Kitchen AI (✅ DONE)

**File:** `rez-kitchen-ai/src/server.ts`

```typescript
import { createAIBus, kitchenEvents, mindEvents } from '@rez/ai-bus';

const aiBus = createAIBus({
  service: 'kitchen-ai',
  url: process.env.REZ_MIND_URL,
  enableWebSocket: true,
});

// Emit events
aiBus.emitOrderReceived({ orderId, merchantId, items, estimatedPrepTime });
aiBus.emitOrderCompleted({ orderId, merchantId, actualPrepTime, stationTimes });
aiBus.emitOrderDelayed({ orderId, merchantId, delaySeconds, reason });

// Receive insights
aiBus.on(mindEvents.INSIGHT, (insight) => { ... });
aiBus.on(mindEvents.COMMAND, (command) => { ... });
```

---

## Consumer AI Kit (Intent Graph, Search, Cart)

**File:** `YOUR_SERVICE/src/ai-integration.ts`

```typescript
import { createAIBus, consumerEvents, mindEvents } from '@rez/ai-bus';

const aiBus = createAIBus({
  service: 'intent-graph', // or 'search', 'cart-service'
  url: process.env.REZ_MIND_URL,
  enableWebSocket: true,
});

// Emit events
async function emitSearch(userId: string, query: string, resultsCount: number) {
  await aiBus.emit(consumerEvents.SEARCH, {
    userId,
    query,
    resultsCount,
    timestamp: new Date()
  }, { userId, priority: 'normal' });
}

async function emitItemViewed(userId: string, itemId: string, merchantId: string) {
  await aiBus.emit(consumerEvents.ITEM_VIEWED, {
    userId,
    itemId,
    merchantId,
    timestamp: new Date()
  }, { userId, merchantId });
}

async function emitCartAdded(userId: string, itemId: string, cartValue: number) {
  await aiBus.emit(consumerEvents.CART_ADDED, {
    userId,
    itemId,
    cartValue,
    timestamp: new Date()
  }, { userId });
}

async function emitCartAbandoned(userId: string, cartValue: number) {
  await aiBus.emit(consumerEvents.CART_ABANDONED, {
    userId,
    cartValue,
    timestamp: new Date()
  }, { userId });
}

// Receive recommendations
aiBus.on(mindEvents.RECOMMENDATION, (insight) => {
  console.log('[AI] Recommendation:', insight.payload);
  // Apply recommendation to search results, cart, etc.
});

// Receive personalization
aiBus.on('mind:personalization', (insight) => {
  console.log('[AI] Personalization:', insight.payload);
  // Apply user-specific personalization
});

export { emitSearch, emitItemViewed, emitCartAdded, emitCartAbandoned, aiBus };
```

---

## Fraud Detection Kit

**File:** `YOUR_SERVICE/src/fraud-integration.ts`

```typescript
import { createAIBus, merchantEvents, mindEvents } from '@rez/ai-bus';

const aiBus = createAIBus({
  service: 'fraud-detection',
  url: process.env.REZ_MIND_URL,
  enableWebSocket: true,
});

// Emit when fraud detected
async function emitFraudDetected(data: {
  merchantId: string;
  orderId: string;
  riskScore: number;
  indicators: string[];
}) {
  await aiBus.emit(merchantEvents.FRAUD_DETECTED, {
    merchantId: data.merchantId,
    orderId: data.orderId,
    riskScore: data.riskScore,
    indicators: data.indicators,
    timestamp: new Date()
  }, { merchantId: data.merchantId, orderId: data.orderId, priority: 'high' });
}

// Receive fraud alerts
aiBus.on(mindEvents.ALERT, (alert) => {
  console.log('[Fraud] Alert:', alert.severity, alert.message);
  if (alert.severity === 'critical') {
    // Block transaction immediately
  }
});

// Receive anomaly patterns
aiBus.on(mindEvents.ANOMALY, (anomaly) => {
  console.log('[Fraud] Anomaly detected:', anomaly.reasoning);
  // Update fraud rules based on new patterns
});

export { emitFraudDetected, aiBus };
```

---

## Recommendation Engine Kit

**File:** `YOUR_SERVICE/src/recommendation-integration.ts`

```typescript
import { createAIBus, mindEvents } from '@rez/ai-bus';

const aiBus = createAIBus({
  service: 'recommendation-engine',
  url: process.env.REZ_MIND_URL,
  enableWebSocket: true,
});

// Emit when recommendation is shown
async function emitRecommendationShown(data: {
  userId: string;
  recommendations: Array<{ itemId: string; score: number }>;
  position: string;
  type: string;
}) {
  await aiBus.emit('recommendation:shown', data, { userId: data.userId });
}

// Emit when recommendation is clicked
async function emitRecommendationClicked(data: {
  userId: string;
  itemId: string;
  recommendationType: string;
}) {
  await aiBus.emit('recommendation:clicked', data, { userId: data.userId });
}

// Emit when recommendation converts (purchased)
async function emitRecommendationConverted(data: {
  userId: string;
  itemId: string;
  orderId: string;
  revenue: number;
}) {
  await aiBus.emit('recommendation:converted', data, { userId: data.userId, orderId: data.orderId });
}

// Emit when recommendation is ignored
async function emitRecommendationIgnored(data: {
  userId: string;
  itemId: string;
  reason: string;
}) {
  await aiBus.emit('recommendation:ignored', data, { userId: data.userId });
}

// Receive personalization updates
aiBus.on(mindEvents.PERSONALIZATION, (insight) => {
  console.log('[Rec] Personalization update:', insight.payload);
  // Update recommendation model based on new personalization data
});

// Receive predictions
aiBus.on(mindEvents.PREDICTION, (prediction) => {
  console.log('[Rec] Prediction:', prediction.payload);
  // Adjust recommendation weights based on demand predictions
});

export {
  emitRecommendationShown,
  emitRecommendationClicked,
  emitRecommendationConverted,
  emitRecommendationIgnored,
  aiBus
};
```

---

## Personalization Engine Kit

**File:** `YOUR_SERVICE/src/personalization-integration.ts`

```typescript
import { createAIBus, mindEvents } from '@rez/ai-bus';

const aiBus = createAIBus({
  service: 'personalization-engine',
  url: process.env.REZ_MIND_URL,
  enableWebSocket: true,
});

// Emit when user segment updates
async function emitSegmentUpdated(data: {
  userId: string;
  previousSegment: string;
  newSegment: string;
  confidence: number;
}) {
  await aiBus.emit('segment:updated', data, { userId: data.userId });
}

// Emit when personalization is applied
async function emitPersonalizationApplied(data: {
  userId: string;
  features: string[];
  appliedTo: string;
}) {
  await aiBus.emit('personalization:applied', data, { userId: data.userId });
}

// Emit user behavior summary (periodic)
async function emitUserProfileUpdate(data: {
  userId: string;
  preferences: Record<string, any>;
  behavioralScore: number;
}) {
  await aiBus.emit('user:profile:updated', data, { userId: data.userId });
}

// Receive AI insights
aiBus.on(mindEvents.INSIGHT, (insight) => {
  console.log('[Personalization] Insight:', insight);
  // Apply insights to user personalization
});

// Receive recommendations
aiBus.on(mindEvents.RECOMMENDATION, (recommendation) => {
  console.log('[Personalization] Recommendation:', recommendation.payload);
  // Integrate recommendations into personalization
});

export { emitSegmentUpdated, emitPersonalizationApplied, emitUserProfileUpdate, aiBus };
```

---

## Targeting Engine Kit

**File:** `YOUR_SERVICE/src/targeting-integration.ts`

```typescript
import { createAIBus, mindEvents } from '@rez/ai-bus';

const aiBus = createAIBus({
  service: 'targeting-engine',
  url: process.env.REZ_MIND_URL,
  enableWebSocket: true,
});

// Emit when campaign matches user
async function emitCampaignMatched(data: {
  userId: string;
  campaignId: string;
  matchScore: number;
  segment: string;
}) {
  await aiBus.emit('campaign:matched', data, { userId: data.userId });
}

// Emit when ad is shown
async function emitAdShown(data: {
  userId: string;
  adId: string;
  campaignId: string;
  position: string;
}) {
  await aiBus.emit('ad:shown', data, { userId: data.userId });
}

// Emit when ad is clicked
async function emitAdClicked(data: {
  userId: string;
  adId: string;
}) {
  await aiBus.emit('ad:clicked', data, { userId: data.userId });
}

// Emit when ad converts
async function emitAdConverted(data: {
  userId: string;
  adId: string;
  orderId: string;
  revenue: number;
}) {
  await aiBus.emit('ad:converted', data, { userId: data.userId, orderId: data.orderId });
}

// Emit when ad is blocked/flagged
async function emitAdFlagged(data: {
  userId: string;
  adId: string;
  reason: string;
}) {
  await aiBus.emit('ad:flagged', data, { userId: data.userId });
}

// Receive anomaly alerts
aiBus.on(mindEvents.ANOMALY, (anomaly) => {
  console.log('[Targeting] Anomaly:', anomaly.reasoning);
  // Update targeting rules based on anomalies
});

// Receive predictions
aiBus.on(mindEvents.PREDICTION, (prediction) => {
  console.log('[Targeting] Prediction:', prediction.payload);
  // Adjust targeting based on conversion predictions
});

export { emitCampaignMatched, emitAdShown, emitAdClicked, emitAdConverted, emitAdFlagged, aiBus };
```

---

## Inventory AI Kit

**File:** `YOUR_SERVICE/src/inventory-integration.ts`

```typescript
import { createAIBus, merchantEvents, mindEvents } from '@rez/ai-bus';

const aiBus = createAIBus({
  service: 'inventory-ai',
  url: process.env.REZ_MIND_URL,
  enableWebSocket: true,
});

// Emit when stock is low
async function emitInventoryLow(data: {
  merchantId: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  threshold: number;
  avgDailySales: number;
}) {
  await aiBus.emit(merchantEvents.INVENTORY_LOW, data, { merchantId: data.merchantId });
}

// Emit when stock is received
async function emitInventoryReceived(data: {
  merchantId: string;
  itemId: string;
  quantity: number;
  supplierId: string;
}) {
  await aiBus.emit(merchantEvents.INVENTORY_RECEIVED, data, { merchantId: data.merchantId });
}

// Emit waste/spoilage
async function emitWasteRecorded(data: {
  merchantId: string;
  itemId: string;
  quantity: number;
  reason: string;
}) {
  await aiBus.emit('inventory:waste', data, { merchantId: data.merchantId });
}

// Receive reorder predictions
aiBus.on(mindEvents.PREDICTION, (prediction) => {
  if (prediction.payload.type === 'demand') {
    console.log('[Inventory] Demand forecast:', prediction.payload);
    // Adjust reorder suggestions based on predictions
  }
});

// Receive demand insights
aiBus.on(mindEvents.INSIGHT, (insight) => {
  if (insight.payload.category === 'inventory') {
    console.log('[Inventory] Insight:', insight);
    // Apply inventory optimization insights
  }
});

export { emitInventoryLow, emitInventoryReceived, emitWasteRecorded, aiBus };
```

---

## Quick Integration Checklist

For each service, add the following:

### 1. Install dependency
```bash
npm install @rez/ai-bus
```

### 2. Create integration file
Copy the appropriate kit above to `src/ai-integration.ts`

### 3. Update environment
```bash
REZ_MIND_URL=https://rez-mind.onrender.com
```

### 4. Emit events at key points
```typescript
import { emitSearch, emitItemViewed } from './ai-integration';

// When user searches
await emitSearch(userId, query, results.length);

// When user views item
await emitItemViewed(userId, item.id, merchantId);
```

### 5. Handle received insights
```typescript
import { aiBus } from './ai-integration';

aiBus.on('mind:recommendation', (insight) => {
  // Apply recommendation
});
```

---

## Testing Your Integration

```typescript
// Test emitting
async function testIntegration() {
  const aiBus = createAIBus({
    service: 'test-service',
    url: 'http://localhost:4008', // Local dev
  });

  // Emit test event
  await aiBus.emit('test:ping', { message: 'Hello from test' });
  console.log('Event sent:', aiBus.isConnected());

  // Listen for events
  aiBus.on('test:pong', (event) => {
    console.log('Received:', event);
  });
}
```

---

*Last Updated: May 10, 2026*
