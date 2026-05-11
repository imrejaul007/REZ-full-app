# AI Services Integration with ReZ Mind

## Overview

All AI services communicate bidirectionally with ReZ Mind (Central AI Brain).

```
┌─────────────────────────────────────────────────────────────────────┐
│                          REZ MIND                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Insights    │  │ Predictions │  │ Commands    │             │
│  │ Engine      │  │ Engine      │  │ Engine      │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                  │                  │                     │
│  ┌──────┴──────────────────┴──────────────────┴──────┐            │
│  │              EVENT BUS (WebSocket/REST)           │            │
│  │  • Real-time events    • Insights       • Commands │         │
│  └────────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
          ▲                          │                          ▲
          │                          │                          │
    ┌─────┴─────┐            ┌─────┴─────┐            ┌─────┴─────┐
    │  Kitchen  │            │  Consumer  │            │  Merchant  │
    │    AI     │            │    AI      │            │    AI     │
    └───────────┘            └───────────┘            └───────────┘
```

---

## AI Services Inventory

| Service | Type | Function | Connected |
|---------|------|----------|-----------|
| **kitchen-ai** | Local | Station routing, prep times | ✅ Done |
| **intent-graph** | Cloud | User intent recognition | 🔄 Todo |
| **recommendation-engine** | Cloud | Product recommendations | 🔄 Todo |
| **fraud-detection** | Cloud | Payment fraud detection | 🔄 Todo |
| **personalization-engine** | Cloud | User personalization | 🔄 Todo |
| **targeting-engine** | Cloud | Ad targeting | 🔄 Todo |
| **decision-engine** | Cloud | Decision automation | 🔄 Todo |
| **ai-restaurant** | Local | Restaurant insights | 🔄 Todo |
| **ai-salon-fitness** | Local | Salon/fitness insights | 🔄 Todo |

---

## Events Reference

### Kitchen Events (→ ReZ Mind)

```typescript
// Emit when order received
kitchenAI.emit('kitchen:order:received', {
  orderId: string;
  merchantId: string;
  items: Array<{ id: string; station: string }>;
  estimatedPrepTime: number;
});

// Emit when order completed
kitchenAI.emit('kitchen:order:completed', {
  orderId: string;
  merchantId: string;
  actualPrepTime: number;
  stationTimes: Record<string, number>;
});

// Emit when order delayed
kitchenAI.emit('kitchen:order:delayed', {
  orderId: string;
  merchantId: string;
  delaySeconds: number;
  reason: string;
});
```

### Consumer Events (→ ReZ Mind)

```typescript
// Emit on search
consumerAI.emit('consumer:search', {
  userId: string;
  query: string;
  resultsCount: number;
});

// Emit on item view
consumerAI.emit('consumer:item:viewed', {
  userId: string;
  itemId: string;
  merchantId: string;
});

// Emit on cart add
consumerAI.emit('consumer:cart:added', {
  userId: string;
  itemId: string;
  cartValue: number;
});
```

### Merchant Events (→ ReZ Mind)

```typescript
// Emit on inventory low
merchantAI.emit('merchant:inventory:low', {
  merchantId: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  threshold: number;
});

// Emit on fraud detected
merchantAI.emit('merchant:fraud:detected', {
  merchantId: string;
  orderId: string;
  riskScore: number;
  indicators: string[];
});
```

### ReZ Mind Events (← ReZ Mind)

```typescript
// Receive insights
aiBus.on('mind:insight', (insight) => {
  if (insight.type === 'RECOMMENDATION') {
    // Apply recommendation
  }
});

// Receive commands
aiBus.on('mind:command', (command) => {
  if (command.action.type === 'ADJUST_PREP_TIME') {
    // Adjust prep time
  }
});
```

---

## Integration Checklist

### Phase 1: Kitchen AI ✅ DONE
- [x] Add `@rez/ai-bus` package
- [x] Emit `kitchen:order:received`
- [x] Emit `kitchen:order:completed`
- [x] Emit `kitchen:order:delayed`
- [x] Subscribe to `mind:insight`
- [x] Subscribe to `mind:command`

### Phase 2: Consumer AI (Todo)
- [ ] Integrate intent-graph with ai-bus
- [ ] Emit consumer events
- [ ] Receive personalization recommendations
- [ ] Emit cart events

### Phase 3: Merchant AI (Todo)
- [ ] Integrate fraud-detection with ai-bus
- [ ] Emit fraud events
- [ ] Receive fraud alerts
- [ ] Integrate inventory prediction

### Phase 4: Decision Engine (Todo)
- [ ] Integrate decision-engine with ai-bus
- [ ] Emit decision events
- [ ] Receive optimization commands

---

## Quick Start: Connecting a New AI Service

### 1. Install the package

```bash
npm install @rez/ai-bus
```

### 2. Initialize the client

```typescript
import { createAIBus } from '@rez/ai-bus';

const aiBus = createAIBus({
  service: 'my-ai-service',
  url: process.env.REZ_MIND_URL,
  enableWebSocket: true,
});
```

### 3. Emit events

```typescript
// When something happens in your AI service
await aiBus.emit('my:event', {
  data: 'value'
}, {
  merchantId: 'merchant_123',
  priority: 'high'
});
```

### 4. Receive insights

```typescript
// When ReZ Mind sends an insight
aiBus.on('mind:insight', (insight) => {
  console.log('Received insight:', insight);
});

aiBus.on('mind:command', (command) => {
  console.log('Received command:', command);
  // Execute the command
});
```

---

## Architecture Decisions

### Why WebSocket + REST?

| Method | Use Case | Latency |
|--------|----------|---------|
| **WebSocket** | Real-time events, insights, commands | ~50ms |
| **REST** | Fire-and-forget events, retries | ~200ms |

### Event Schema

All events follow the same schema:

```typescript
interface AIEvent {
  id: string;           // Unique ID
  source: string;       // Service name
  target: string | '*'; // Recipient or broadcast
  type: string;        // Event type
  payload: any;        // Event data
  timestamp: Date;
  metadata: {
    merchantId?: string;
    userId?: string;
    priority: 'high' | 'normal' | 'low';
  };
}
```

---

## Monitoring

Each AI service should emit metrics:

```typescript
// Track event emission success
aiBus.on('*', (event) => {
  metrics.increment('ai.event.emitted', {
    service: event.source,
    type: event.type,
  });
});

// Track insight receipt
aiBus.on('mind:insight', (insight) => {
  metrics.increment('ai.insight.received', {
    type: insight.type,
    confidence: insight.confidence,
  });
});
```

---

## Error Handling

```typescript
// Events are queued if emit fails
// Retry up to 3 times with exponential backoff

try {
  await aiBus.emit('event:type', payload);
} catch (error) {
  // Event was queued for retry
  // Check queue size
  console.log('Pending events:', aiBus.getQueueSize());
}
```

---

## Security

- All events include source service identification
- ReZ Mind validates event signatures
- Rate limiting per service
- Auth token required for WebSocket connection

---

*Last Updated: 2026-05-10*
