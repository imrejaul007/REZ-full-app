# REZ Event Governance Framework

**Version:** 1.0
**Date:** May 9, 2026
**Status:** PRODUCTION READY

---

## Executive Summary

Events are the **operating system** of the REZ ecosystem. This document establishes governance rules for all event-driven communication.

```
Events → Triggers → Profile → ReZ Score → Rewards
```

If event governance fails, the entire ecosystem collapses.

---

## 1. EVENT NAMING CONVENTIONS

### Format

```
{domain}.{action}
```

### Rules

| Rule | Example | Wrong |
|------|---------|-------|
| Lowercase | `order.completed` | `Order.Completed` |
| Past tense for completed | `order.completed` | `order.complete` |
| Present tense for ongoing | `payment.processing` | `payment.processed` |
| No verbs for state | `user.updated` | `user.update_user` |

### Domain List

| Domain | Description | Services |
|--------|-------------|-----------|
| `wallet` | Wallet transactions | wallet-service |
| `order` | Order lifecycle | order-service |
| `karma` | Karma events | karma-service |
| `gamification` | Gamification events | gamification-service |
| `loyalty` | Loyalty events | loyalty-service |
| `profile` | Profile events | profile-service |
| `streak` | Streak events | streak-service |
| `score` | Score events | score-service |
| `cross_merchant` | Cross-merchant events | cross-merchant-service |
| `notification` | Notification events | notification-service |

---

## 2. EVENT SCHEMA STANDARDS

### Required Fields

Every event MUST include:

```typescript
interface BaseEvent {
  // Required
  eventId: string;           // UUID v4
  eventType: string;          // e.g., "order.completed"
  userId: string;             // Target user
  timestamp: string;           // ISO 8601
  
  // Governance
  version: string;           // e.g., "1.0"
  source: string;            // Service name
  correlationId?: string;     // For tracing
  idempotencyKey?: string;   // For deduplication
  
  // Payload
  data: Record<string, any>;
}
```

### Versioning Rules

```
1. Major version (1.x) = Breaking changes
2. Minor version (x.1) = Non-breaking additions
3. Patch version (x.x.1) = Bug fixes
```

### Schema Evolution

| Change Type | Action |
|-------------|--------|
| Add optional field | ✅ Allowed |
| Add required field | ❌ Not allowed |
| Rename field | ❌ Use deprecation |
| Change field type | ❌ Not allowed |
| Remove field | ❌ Mark deprecated |

---

## 3. IDEMPOTENCY RULES

### What Requires Idempotency

| Event Type | Requires Idempotency | Reason |
|------------|---------------------|--------|
| Financial | ✅ Required | Double-credit prevention |
| Points/Cashback | ✅ Required | Money safety |
| Tier changes | ✅ Required | Status integrity |
| Badge awards | ✅ Required | One-time rewards |
| Notifications | ⚠️ Optional | Duplicate okay |
| Analytics | ❌ Not required | Aggregation okay |

### Idempotency Key Format

```
{entity}_{action}_{unique_id}

Examples:
order_completed_123
cashback_credited_user456_order789
loyalty_points_earned_user456_transaction789
```

### Idempotency Storage

```typescript
// Redis key format
idempotency:{key} → { status: 'processing' | 'completed', result?: any }

// TTL by event type
const IDEMPOTENCY_TTL = {
  financial: 24 * 60 * 60,    // 24 hours
  points: 24 * 60 * 60,       // 24 hours
  badges: 7 * 24 * 60 * 60,   // 7 days
  notifications: 1 * 60 * 60,   // 1 hour
};
```

---

## 4. DLQ (DEAD LETTER QUEUE) STRATEGY

### Queue Structure

```
{domain}.events (main)
    ↓ (on failure)
{domain}.events.retry (3 attempts)
    ↓ (after 3 failures)
{domain}.events.dlq (dead letter)
```

### Retry Policy

| Attempt | Delay | Reason |
|---------|-------|--------|
| 1 | Immediate | First attempt |
| 2 | 1 second | Transient error |
| 3 | 5 seconds | Persistent error |
| 4+ | ❌ DLQ | Manual intervention |

### DLQ Monitoring Alerts

| Alert | Threshold | Action |
|-------|-----------|---------|
| DLQ Growth | >10 events/hour | PagerDuty |
| DLQ Size | >100 events | Slack alert |
| Same Event Failing | >5x | Critical alert |

---

## 5. EVENT REGISTRY

### Registered Events

#### Wallet Events

| Event | Version | Consumer | Idempotency |
|-------|---------|----------|-------------|
| `wallet.credited` | 1.0 | profile-aggregator, notifications | ✅ |
| `wallet.debited` | 1.0 | profile-aggregator | ✅ |
| `wallet.created` | 1.0 | profile-aggregator | ✅ |
| `wallet.transfer_completed` | 1.0 | profile-aggregator | ✅ |

#### Order Events

| Event | Version | Consumer | Idempotency |
|-------|---------|----------|-------------|
| `order.placed` | 1.0 | profile-aggregator, streak, loyalty | ✅ |
| `order.confirmed` | 1.0 | notifications | ❌ |
| `order.completed` | 1.0 | profile, streak, loyalty, wallet, score, cross-merchant | ✅ |
| `order.cancelled` | 1.0 | profile-aggregator | ❌ |
| `order.refunded` | 1.0 | profile-aggregator, wallet | ✅ |

#### Karma Events

| Event | Version | Consumer | Idempotency |
|-------|---------|----------|-------------|
| `karma.earned` | 1.0 | karma-loyalty-bridge | ✅ |
| `karma.level_up` | 1.0 | karma-loyalty-bridge | ✅ |
| `karma.badge_earned` | 1.0 | karma-loyalty-bridge | ✅ |

#### Loyalty Events

| Event | Version | Consumer | Idempotency |
|-------|---------|----------|-------------|
| `loyalty.points_earned` | 1.0 | profile-aggregator | ✅ |
| `loyalty.tier_updated` | 1.0 | profile-aggregator, notifications | ✅ |
| `loyalty.stamp_issued` | 1.0 | profile-aggregator | ✅ |
| `loyalty.reward_redeemed` | 1.0 | profile-aggregator | ✅ |

#### Streak Events

| Event | Version | Consumer | Idempotency |
|-------|---------|----------|-------------|
| `streak.updated` | 1.0 | profile-aggregator | ✅ |
| `streak.milestone_reached` | 1.0 | notifications, wallet | ✅ |
| `streak.lost` | 1.0 | notifications | ❌ |
| `streak.recovered` | 1.0 | notifications | ✅ |

#### Score Events

| Event | Version | Consumer | Idempotency |
|-------|---------|----------|-------------|
| `score.updated` | 1.0 | profile-aggregator, notifications | ❌ |
| `score.tier_changed` | 1.0 | notifications | ✅ |

#### Cross-Merchant Events

| Event | Version | Consumer | Idempotency |
|-------|---------|----------|-------------|
| `cross_merchant.visit` | 1.0 | cross-merchant-service | ✅ |
| `cross_merchant.badge_earned` | 1.0 | notifications, wallet | ✅ |
| `cross_merchant.progress_updated` | 1.0 | profile-aggregator | ❌ |

#### Notification Events

| Event | Version | Consumer | Idempotency |
|-------|---------|----------|-------------|
| `notification.sent` | 1.0 | - | ❌ |
| `notification.failed` | 1.0 | dlq-service | ❌ |

---

## 6. CONSUMER CONTRACTS

### Profile Aggregator (Consumer)

```typescript
interface ProfileAggregatorContract {
  subscribes: [
    'wallet.credited',
    'wallet.debited',
    'order.completed',
    'karma.earned',
    'streak.updated',
    'score.updated',
    'loyalty.tier_updated'
  ],
  
  idempotencyKeys: {
    'order.completed': 'order_{orderId}_user_{userId}',
    'karma.earned': 'karma_{eventId}_{userId}',
  },
  
  errorHandling: {
    retry: 3,
    backoff: 'exponential',
    dlq: 'profile-aggregator.dlq'
  }
}
```

### Karma-Loyalty Bridge (Consumer)

```typescript
interface KarmaLoyaltyBridgeContract {
  subscribes: [
    'karma.earned',
    'karma.level_up',
    'karma.badge_earned'
  ],
  
  idempotencyKeys: {
    'karma.earned': 'karma_earn_{eventId}_{userId}',
    'karma.level_up': 'karma_level_{oldLevel}_to_{newLevel}_{userId}',
    'karma.badge_earned': 'karma_badge_{badgeId}_{userId}'
  },
  
  errorHandling: {
    retry: 3,
    backoff: 'exponential',
    dlq: 'karma-loyalty-bridge.dlq'
  }
}
```

### Notification Service (Consumer)

```typescript
interface NotificationServiceContract {
  subscribes: [
    'streak.milestone_reached',
    'score.tier_changed',
    'cross_merchant.badge_earned',
    'loyalty.tier_updated'
  ],
  
  idempotencyKeys: {
    'streak.milestone_reached': 'streak_milestone_{streakDays}_{userId}'
  },
  
  errorHandling: {
    retry: 2,
    backoff: 'linear',
    dlq: 'notifications.dlq'
  }
}
```

---

## 7. DISTRIBUTED TRACING

### Correlation ID Flow

```
Request → {correlationId}
    ↓
Service A publishes event {correlationId}
    ↓
Service B receives event {correlationId}
    ↓
Service B publishes event {correlationId}
    ↓
... (chain continues)
```

### Tracing Headers

| Header | Format | Purpose |
|--------|--------|---------|
| `X-Correlation-ID` | UUID | Request tracing |
| `X-Trace-ID` | UUID | Event tracing |
| `X-Span-ID` | UUID | Component tracing |
| `X-Parent-Span-ID` | UUID | Parent tracing |

### Trace Context Propagation

```typescript
// Propagate via events
const event = {
  correlationId: headers['x-correlation-id'],
  traceId: generateTraceId(),
  spanId: generateSpanId(),
  parentSpanId: headers['x-span-id'],
};
```

---

## 8. EVENT REPLAY STRATEGY

### When to Replay

| Scenario | Replay Allowed | Method |
|----------|---------------|--------|
| Consumer crashed mid-processing | ✅ | Replay from last checkpoint |
| Consumer deployed bug | ✅ | Selective replay |
| Data corruption | ✅ | Full replay with version check |
| Scheduled maintenance | ⚠️ | During low traffic |
| Normal operation | ❌ | Not needed |

### Replay Commands

```bash
# Replay all events for user
rez-event-cli replay --user-id user123 --from 2026-05-01

# Replay specific event type
rez-event-cli replay --event-type order.completed --from 2026-05-01 --to 2026-05-07

# Replay to specific service
rez-event-cli replay --consumer profile-aggregator --from 2026-05-01

# Dry run (no actual replay)
rez-event-cli replay --dry-run --user-id user123
```

### Replay Safety

1. **Always replay to DLQ first**
2. **Test in staging**
3. **Use time-bounded replays**
4. **Monitor for anomalies**
5. **Have rollback plan**

---

## 9. MONITORING & ALERTS

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Events/Second | Throughput | >1000/s |
| Event Latency | Time to reach consumers | <100ms p99 |
| DLQ Size | Failed events | <100 |
| Consumer Lag | Processing delay | <10s |
| Idempotency Hits | Duplicate prevention | >100/day |

### Alert Rules

| Alert | Condition | Severity | Action |
|-------|-----------|----------|---------|
| DLQ Spike | >10 events in 5min | Critical | PagerDuty |
| Consumer Down | No heartbeat 30s | Critical | PagerDuty |
| High Latency | >500ms p99 | Warning | Slack |
| Idempotency Miss | Duplicate detected | Warning | Slack |
| Event Drop | Processing failure | Critical | PagerDuty |

### Dashboards

1. **Event Flow Dashboard** - Real-time event visualization
2. **Consumer Health** - Per-consumer metrics
3. **DLQ Monitor** - Failed events by type
4. **Latency Distribution** - p50, p95, p99

---

## 10. TESTING STANDARDS

### Unit Tests

Every event publisher MUST test:

```typescript
describe('Order Event Publisher', () => {
  it('should publish with correct schema', () => {
    const event = createOrderCompletedEvent({...});
    expect(event.eventId).toMatch(/^[a-f0-9-]{36}$/);
    expect(event.version).toBe('1.0');
    expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  
  it('should include idempotency key for financial events', () => {
    const event = createOrderCompletedEvent({amount: 100});
    expect(event.idempotencyKey).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Order → Loyalty Flow', () => {
  it('should credit loyalty points on order completed', async () => {
    // Publish order.completed
    await eventBus.publish('order.completed', orderEvent);
    
    // Wait for processing
    await wait(1000);
    
    // Verify loyalty points credited
    const points = await loyaltyService.getPoints(userId);
    expect(points).toBeGreaterThan(0);
  });
});
```

### Chaos Tests

| Scenario | Test |
|----------|------|
| Consumer down | Events queue, process on recovery |
| Network partition | Idempotency prevents duplicates |
| High load | Backpressure handling |
| Consumer slow | Eventual consistency |

---

## 11. SECURITY RULES

### Event Publishing

| Rule | Enforcement |
|------|-------------|
| Service auth | JWT with service role |
| Schema validation | Zod schemas required |
| PII masking | Sensitive fields encrypted |
| Rate limiting | 10,000 events/min/service |

### Event Consumption

| Rule | Enforcement |
|------|-------------|
| Consumer auth | Service-to-service JWT |
| Schema validation | Reject unknown fields |
| Idempotency | Redis deduplication |
| DLQ access | Admin role only |

---

## 12. ROLES & RESPONSIBILITIES

| Role | Responsibility |
|------|---------------|
| **Event Owner** | Schema changes, versioning |
| **Consumer** | Error handling, idempotency |
| **Platform** | Infrastructure, monitoring |
| **Security** | Auth, PII compliance |
| **QA** | Integration testing |

---

## 13. CHANGE PROCESS

### Adding New Event

1. Propose in RFC (Request for Comments)
2. Register in Event Registry
3. Add schema to registry package
4. Implement with tests
5. Update consumer contracts
6. Deploy with feature flag
7. Monitor for 24 hours
8. Remove feature flag

### Modifying Existing Event

1. Check backward compatibility
2. Version the event (e.g., 1.0 → 2.0)
3. Support both versions during transition
4. Update all consumers
5. Deprecate old version
6. Remove after 30 days

### Deprecating Event

1. Mark as deprecated in registry
2. Notify all consumers
3. Set sunset date (30 days)
4. Update documentation
5. Remove from registry

---

## 14. TOOLS & COMMANDS

### CLI Commands

```bash
# List all events
rez-event-cli list

# Check event schema
rez-event-cli schema order.completed

# Verify consumer contract
rez-event-cli verify contract profile-aggregator

# Monitor DLQ
rez-event-cli dlq watch

# Replay from DLQ
rez-event-cli dlq replay --service profile-aggregator

# Health check
rez-event-cli health

# Metrics
rez-event-cli metrics
```

---

## 15. GLOSSARY

| Term | Definition |
|------|-------------|
| **Event** | Immutable record of something that happened |
| **Command** | Request for an action to happen |
| **Publisher** | Service that emits events |
| **Consumer** | Service that receives events |
| **Idempotency** | Same event processed multiple times = same result |
| **DLQ** | Dead Letter Queue for failed events |
| **Correlation ID** | Links related events across services |
| **Schema Registry** | Central source of truth for event schemas |

---

## 16. APPENDIX: QUICK REFERENCE

### Event Checklist

```
Before Publishing:
□ Schema defined in registry
□ Version assigned
□ Idempotency key format defined
□ Consumer contracts updated
□ Tests written
□ Monitoring alerts configured

Before Consuming:
□ Idempotency check implemented
□ Error handling with retries
□ DLQ configured
□ Correlation ID propagated
□ Monitoring alerts configured
```

---

## VERSION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 9, 2026 | Claude Code | Initial |

---

**This document is the source of truth for all event-driven communication in the REZ ecosystem.**
