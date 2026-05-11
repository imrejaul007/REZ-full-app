# AGENT 23: Webhook/Event Bus Audit Report

**Auditor:** Agent 23 (Webhook/Event Bus Specialist)
**Date:** May 10, 2026
**Project:** ReZ Full App
**Status:** COMPLETE

---

## Executive Summary

| Category | Finding |
|----------|---------|
| Webhook Handlers Found | 17 |
| Signature Verification Issues | 2 CRITICAL |
| Missing Idempotency | 3 HIGH |
| Missing DLQ Handling | 2 HIGH |
| Missing Retry Logic | 2 HIGH |

---

## Detailed Findings

### CRITICAL ISSUES

#### 1. Missing Signature Verification on Incoming Webhooks
**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-event-platform/src/index.ts`

**ISSUE:** All 17 incoming webhook endpoints (`/webhook/merchant/*`, `/webhook/consumer/*`, `/webhook/ads/*`, `/webhook/marketing/*`) accept any payload without verifying signatures. This allows attackers to inject fake events into the system.

```typescript
// Lines 65-313: No signature verification on ANY webhook endpoint
app.post('/webhook/merchant/inventory', async (req: Request, res: Response) => {
  // NO VERIFICATION - accepts any payload
  const result = await eventEmitter.emitInventoryLow({...});
});
```

**RECOMMENDATION:** Add signature verification middleware for all incoming webhooks:
```typescript
app.post('/webhook/merchant/inventory', 
  verifyWebhookSignature('merchant'),
  async (req: Request, res: Response) => { ... }
);
```

---

#### 2. Webhook Signature Verification Method Never Used
**SEVERITY:** CRITICAL
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-webhook-service/src/services/WebhookService.ts`

**ISSUE:** The `verifySignature()` method exists (line 304-307) but is never called anywhere in the codebase. The service only CREATES signatures for outgoing webhooks, never verifies incoming ones.

```typescript
// Lines 304-307: Method exists but is unused
verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = this.createSignature(body, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```

**RECOMMENDATION:** Call `verifySignature()` before processing any webhook that expects to receive callbacks with signatures.

---

### HIGH ISSUES

#### 3. Missing Idempotency in Webhook Delivery
**SEVERITY:** HIGH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-webhook-service/src/services/WebhookService.ts`

**ISSUE:** The `deliverWebhook` method (lines 107-174) does not check for duplicate deliveries based on eventId/idempotencyKey. The same event can trigger multiple deliveries if the trigger is called twice.

```typescript
// Lines 110-118: Creates new deliveryId each time, no idempotency check
const deliveryId = uuidv4();
const body = JSON.stringify({
  id: deliveryId,  // Generated UUID, not from original event
  timestamp,
  event: payload.eventType,
  data: payload.data,
});
```

**RECOMMENDATION:** Add Redis-based idempotency check:
```typescript
const idempotencyKey = `webhook:${webhook._id}:${payload.eventType}:${payload.data.eventId}`;
const existing = await redis.get(idempotencyKey);
if (existing) return null; // Skip duplicate
await redis.setex(idempotencyKey, 86400, deliveryId);
```

---

#### 4. Event Bus Missing DLQ Handling
**SEVERITY:** HIGH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-event-bus/src/services/EventBusService.ts`

**ISSUE:** The `deliverToSubscriber` method (lines 236-249) only logs failures but never moves failed events to a DLQ or implements any recovery mechanism.

```typescript
// Lines 236-249: No DLQ, no retry
private async deliverToSubscriber(subscriber: Subscription, event: any): Promise<void> {
  try {
    await axios.post(subscriber.url, event, {...});
  } catch (error) {
    console.error(`Failed to deliver to ${subscriber.service}:`, error);
    // NO DLQ - event is lost forever
  }
}
```

**RECOMMENDATION:** Add DLQ integration:
```typescript
import { dlqService } from '../../REZ-dlq-service/src/services/dlq.service';

private async deliverToSubscriber(subscriber: Subscription, event: any): Promise<void> {
  try {
    await axios.post(subscriber.url, event, {...});
  } catch (error) {
    console.error(`Failed to deliver to ${subscriber.service}:`, error);
    await dlqService.storeFailedEvent({
      eventId: event.eventId,
      eventType: event.eventType,
      payload: event,
      error: { message: error.message },
      metadata: { source: 'event-bus', consumer: subscriber.service }
    });
  }
}
```

---

#### 5. Event Bus Missing Retry Logic
**SEVERITY:** HIGH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-event-bus/src/services/EventBusService.ts`

**ISSUE:** Failed webhook deliveries have zero retry attempts. The service just logs the error and moves on.

```typescript
// Lines 236-249: No retry attempts
private async deliverToSubscriber(subscriber: Subscription, event: any): Promise<void> {
  try {
    await axios.post(subscriber.url, event, { timeout: 5000, ... });
  } catch (error) {
    console.error(`Failed to deliver to ${subscriber.service}:`, error);
    // Zero retries - immediate failure
  }
}
```

**RECOMMENDATION:** Implement retry with exponential backoff:
```typescript
private async deliverToSubscriber(subscriber: Subscription, event: any): Promise<void> {
  const maxRetries = 3;
  const delays = [1000, 2000, 4000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await axios.post(subscriber.url, event, { timeout: 5000, ... });
      return; // Success
    } catch (error) {
      if (attempt < maxRetries - 1) {
        await this.delay(delays[attempt]);
      }
    }
  }
  // Only send to DLQ after all retries fail
}
```

---

#### 6. Missing Idempotency in Event Publishing
**SEVERITY:** HIGH
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-event-platform/src/events/emitter.ts`

**ISSUE:** The `publish` method accepts an `idempotencyKey` in options but never uses it for deduplication.

```typescript
// Lines 110-205: idempotencyKey accepted but not implemented
async publish(event: Event, options: PublishOptions = {}): Promise<PublishResult> {
  // options.idempotencyKey is never checked
  const enrichedEvent = this.enrichEvent(event, options);
  // ... publishes without idempotency check
}
```

**RECOMMENDATION:** Add Redis-based idempotency check:
```typescript
async publish(event: Event, options: PublishOptions = {}): Promise<PublishResult> {
  if (options.idempotencyKey) {
    const existing = await redis.get(`idempotency:${options.idempotencyKey}`);
    if (existing) {
      return { success: true, eventId: existing, correlationId: options.correlationId };
    }
  }
  // ... publish logic
  if (options.idempotencyKey) {
    await redis.setex(`idempotency:${options.idempotencyKey}`, 86400, enrichedEvent.id);
  }
}
```

---

### MEDIUM ISSUES

#### 7. Stub Subscription Endpoints
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-event-bus/src/routes/subscription.routes.ts`

**ISSUE:** Activate/deactivate endpoints (lines 84-106) and GET subscriptions (lines 41-60) are non-functional stubs.

```typescript
// Lines 84-91: Stub - no actual implementation
router.put('/:id/activate', async (req: Request, res: Response) => {
  try {
    // In production, update in Redis
    res.json({ success: true });  // FAKE SUCCESS
  } catch (error) { ... }
});

// Lines 41-56: Returns empty array, doesn't query Redis
const subscriptions: any[] = [];
if (service) {
  return res.json({ subscriptions: subscriptions.filter((s) => s.service === service) });
}
```

**RECOMMENDATION:** Implement actual Redis queries for subscription management.

---

#### 8. Event Bus Consumer Uses Unbounded Redis Keys
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-event-bus/src/services/EventBusService.ts`

**ISSUE:** `getEventHistory` uses `redis.keys()` which is O(N) and blocks Redis on large keyspaces.

```typescript
// Lines 146-162: Uses KEYS command - blocks Redis
const pattern = eventType ? `events:${eventType}:*` : 'events:*';
const keys = await redis.keys(pattern);  // O(N) operation
```

**RECOMMENDATION:** Use SCAN instead:
```typescript
const stream = redis.scanStream({ match: pattern, count: 100 });
for await (const key of stream) { ... }
```

---

#### 9. Webhook Retry Lacks Exponential Backoff
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-webhook-service/src/services/WebhookService.ts`

**ISSUE:** The retry mechanism uses fixed delays instead of exponential backoff, which can overwhelm downstream services.

```typescript
// Lines 189-227: Linear retries without backoff
async retryDelivery(deliveryId: string): Promise<IWebhookDelivery | null> {
  // No backoff delay between retries
  // Just increments attempts counter
}
```

**RECOMMENDATION:** Implement exponential backoff for retries.

---

#### 10. DLQ Alert Webhook Has No Error Handling
**SEVERITY:** MEDIUM
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-dlq-service/src/services/dlq.service.ts`

**ISSUE:** The `sendAlert` method (lines 374-408) swallows errors and doesn't retry failed alerts.

```typescript
// Lines 385-408: Silent failure on alert webhook errors
try {
  // Send to webhook
  logger.info('DLQ alert sent to webhook', { alertType: alert.type });
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Failed to send DLQ alert', { error: errorMessage });
  // No retry, alert is lost
}
```

**RECOMMENDATION:** Implement retry queue for failed alerts.

---

### LOW ISSUES

#### 11. Missing Request Timeout Configuration
**SEVERITY:** LOW
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-event-bus/src/services/EventBusService.ts`

**ISSUE:** Event delivery has a 5-second timeout hardcoded, not configurable.

```typescript
// Line 239: Hardcoded timeout
await axios.post(subscriber.url, event, {
  timeout: 5000,  // Not configurable
  ...
});
```

---

#### 12. Webhook Delivery Records Not Linked to Original Events
**SEVERITY:** LOW
**FILE:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-webhook-service/src/services/WebhookService.ts`

**ISSUE:** Delivery records don't store the original eventId from the trigger, making correlation difficult.

```typescript
// Lines 154-165: No eventId reference from original trigger
const delivery = await WebhookDelivery.create({
  webhookId: webhook._id,
  deliveryId,
  eventType: payload.eventType,
  payload: { eventType: payload.eventType, data: payload.data },
  // Missing: original eventId
  ...
});
```

---

## Summary Table

| ID | Severity | File | Issue | Impact |
|----|----------|------|-------|--------|
| 1 | CRITICAL | rez-event-platform/src/index.ts | No signature verification on 17 webhooks | Security breach |
| 2 | CRITICAL | rez-webhook-service/.../WebhookService.ts | verifySignature method never called | Unused code, security risk |
| 3 | HIGH | rez-webhook-service/.../WebhookService.ts | No idempotency in delivery | Duplicate deliveries |
| 4 | HIGH | rez-event-bus/.../EventBusService.ts | No DLQ for failed deliveries | Data loss |
| 5 | HIGH | rez-event-bus/.../EventBusService.ts | No retry on subscriber failure | Poor reliability |
| 6 | HIGH | rez-event-platform/src/events/emitter.ts | idempotencyKey not implemented | Duplicate events |
| 7 | MEDIUM | rez-event-bus/.../subscription.routes.ts | Stub endpoints | Non-functional |
| 8 | MEDIUM | rez-event-bus/.../EventBusService.ts | Uses redis.keys() | Performance |
| 9 | MEDIUM | rez-webhook-service/.../WebhookService.ts | No exponential backoff | Service overload |
| 10 | MEDIUM | REZ-dlq-service/.../dlq.service.ts | Alert webhook no retry | Missing alerts |
| 11 | LOW | rez-event-bus/.../EventBusService.ts | Hardcoded timeout | Inflexibility |
| 12 | LOW | rez-webhook-service/.../WebhookService.ts | Missing eventId linkage | Poor tracing |

---

## Recommendations Priority

### Phase 1 (Critical - Immediate)
1. Add signature verification to ALL incoming webhooks in rez-event-platform
2. Remove or fix unused verifySignature method in WebhookService

### Phase 2 (High - This Week)
3. Add idempotency to webhook delivery in WebhookService
4. Add DLQ integration to EventBusService
5. Add retry logic with exponential backoff to EventBusService
6. Implement idempotencyKey support in EventEmitter

### Phase 3 (Medium - This Sprint)
7. Implement actual subscription management
8. Replace redis.keys() with redis.scan()
9. Add configurable timeouts
10. Implement alert retry mechanism

---

## Files Audited

| Service | Files | Status |
|---------|-------|--------|
| rez-webhook-service | 6 | Audited |
| rez-event-bus | 4 | Audited |
| rez-event-platform | 6 | Audited |
| REZ-dlq-service | 5 | Audited |
| packages/rez-events | 3 | Audited |
| packages/rez-event-replay | 1 | Audited |

**Total Files Audited:** 25
**Total Lines Analyzed:** ~5,500

---

## Conclusion

The webhook and event bus infrastructure has solid foundations with proper DLQ services, retry mechanisms in some areas, and good observability. However, critical security gaps exist around signature verification that must be addressed immediately. The EventBusService lacks DLQ integration and retry logic that could lead to data loss and poor reliability in production.

**Priority Action:** Implement signature verification for all incoming webhooks before any external deployment.
