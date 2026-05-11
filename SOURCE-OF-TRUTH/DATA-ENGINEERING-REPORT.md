# REZ Data Engineering Report

**Date:** 2026-05-04
**Author:** Data Engineering Lead
**Status:** COMPLETE

---

## Executive Summary

The REZ ecosystem has a mature but fragmented data pipeline architecture. Four dedicated event services handle different aspects of the data flow, using BullMQ as the core message queue infrastructure with MongoDB as the primary data store. The architecture is functional but has significant gaps in data loss prevention, replay capability, and observability.

**Key Findings:**
- **Strengths:** Strong schema validation, DLQ implementation, idempotent processing
- **Critical Gaps:** No event replay mechanism, inconsistent data loss handling, no unified event bus
- **Priority Fixes:** Implement event sourcing store, add replay capability, standardize observability

---

## 1. Current Architecture

### 1.1 Service Topology

```
                                    +-------------------+
                                    |   rez-app-*      |
                                    |   (Mobile Apps)  |
                                    +--------+----------+
                                             |
                                             v
+----------+    HTTP     +------------------+------------------+
| ReZ Mind | <--------> |     rez-event-platform             |
| Client   | webhooks   |     (Port 3003)                    |
+----------+            |  - Schema Registry                  |
                        |  - Event Emitter                   |
                        |  - Event Store (MongoDB)           |
                        |  - BullMQ Workers (10 types)       |
                        +------------------+------------------+
                                             |
                         +-------------------+-------------------+
                         |                   |                   |
                         v                   v                   v
               +-----------------+  +------------------+  +------------------+
               | analytics-events|  |notification-events|  |   media-events   |
               |   (Port 3002)   |  |   (Port 3005)    |  |   (Port 3008)    |
               +-----------------+  +------------------+  +------------------+
                     |                       |                       |
                     v                       v                       v
               +-----------------+  +------------------+  +------------------+
               | MongoDB         |  | MongoDB          |  | Cloudinary       |
               | - appevents     |  | - notifications  |  | - Image variants|
               | - analyticsevents| | - dlq_log       |  | - CDN cache     |
               | - dailymetrics  |  | - DLQ Archive   |  | - Media assets  |
               +-----------------+  +------------------+  +------------------+
                     |
                     v
               +------------------+
               | rez-intent-graph |
               |   (Port 3007)    |
               +------------------+
                     |
                     v
               +------------------+
               | Internal         |
               | EventBus (Node)  |
               +------------------+
```

### 1.2 Event Types Registered

| Service | Event Types |
|---------|-------------|
| **rez-event-platform** | inventory.low, order.completed, payment.success, ad.impression, ad.click, conversion, campaign.created, voucher.issued, notification.sent, notification.opened |
| **analytics-events** | app events, web events, batch events, merchant analytics |
| **notification-events** | notification delivery (push, email, sms, whatsapp, in_app) |
| **media-events** | image.uploaded, generate-variants, delete-asset, invalidate-cdn, cleanup-temp |
| **rez-intent-graph** | Intent signals: search, view, wishlist, cart_add, hold, checkout_start, fulfilled, abandoned |

### 1.3 Data Flow Summary

```
User Action
    |
    v
[Capture Point] ---> [Event Platform] ---> [Event Store (MongoDB)]
                           |                        |
                           v                        v
                    [BullMQ Queue]         [DLQ if failed]
                           |
           +---------------+---------------+
           |               |               |
           v               v               v
    [Analytics]    [Notification]    [Media Processing]
        |               |               |
        v               v               v
    [Appevents]    [Notifications]  [Cloudinary/MongoDB]
        |               |               |
        v               v               v
    [Dailymetrics] [DLQ Archive]   [Variant URLs]
```

---

## 2. Data Pipeline Analysis

### 2.1 Processing Modes

| Service | Mode | Latency | Batch Support |
|---------|------|---------|---------------|
| rez-event-platform | **Real-time** | < 100ms | No |
| analytics-events | **Real-time + Batch** | < 500ms | Yes (500 events/batch) |
| notification-events | **Real-time** | < 2s | No |
| media-events | **Real-time** | < 30s | No |
| rez-intent-graph | **Real-time** | < 100ms | No |

### 2.2 BullMQ Configuration

| Service | Queue Name | Concurrency | Max Retries | Backoff |
|---------|------------|-------------|-------------|---------|
| rez-event-platform | events-{type} | 10 | 3 | exponential |
| analytics-events | analytics-events | 15 | 3 | exponential |
| notification-events | notification-events | 3 | 5 | exponential |
| media-events | media-events | 5 | 3 | exponential |

### 2.3 Schema Validation

**GOOD:** All services implement Zod schema validation at the ingress point:
- rez-event-platform: Schema registry with 10 event types
- notification-events: Zod schemas for all event types
- media-events: JSON Schema validation
- analytics-events: Request validation middleware

**ISSUE:** Schema versions are not enforced across service boundaries.

---

## 3. Issues Identified

### 3.1 Critical Issues

| Issue | Service | Impact | Evidence |
|-------|---------|--------|----------|
| **No Event Replay** | All | Cannot reprocess historical events after bugs | No replay mechanism exists |
| **Event Store is Write-Only** | rez-event-platform | Cannot read/store events for replay | storeEvent() catches errors silently |
| **Fire-and-Forget Webhooks** | rez-event-platform | Some webhooks don't wait for queue confirmation | webhook handlers return immediately |
| **Missing Transaction Boundaries** | analytics-events | Batch inserts can partially fail | insertMany without transaction |

### 3.2 High Priority Issues

| Issue | Service | Impact | Evidence |
|-------|---------|--------|----------|
| **DLQ Cleanup Only for Notifications** | notification-events | Other services have no cleanup | Only dlqWorker.ts implements cleanup |
| **No Event Correlation Across Services** | All | Cannot trace event through pipeline | Each service uses different correlation IDs |
| **Inconsistent Retry Logic** | media-events | Some failures don't retry | delete-asset rethrows but doesn't wait |
| **Missing Dead Letter Queue Monitoring** | rez-event-platform | DLQ entries not persisted | DLQ exists but no MongoDB logging |
| **No Backpressure Handling** | analytics-events | Can overwhelm MongoDB | No circuit breaker pattern |

### 3.3 Medium Priority Issues

| Issue | Service | Impact |
|-------|---------|--------|
| **Internal EventBus is Node.js Emitter** | rez-intent-graph | Not distributed, single-process only |
| **No Event Versioning** | All | Schema changes break old events |
| **Missing Event Compression** | All | High-volume events (impressions) not compressed |
| **No Event Sampling** | All | All events processed identically |

### 3.4 Low Priority Issues

| Issue | Service | Impact |
|-------|---------|--------|
| **No Event Deduplication Window** | analytics-events | 24h dedup may miss same-day duplicates |
| **Missing Event Enrichment** | All | Services don't add metadata consistently |
| **No Event Archival** | All | Historical events stay in primary storage |

---

## 4. Data Loss Analysis

### 4.1 Current Safeguards

| Mechanism | Implemented | Location |
|-----------|-------------|----------|
| Dead Letter Queue | **YES** | All services have DLQ |
| Idempotent Processing | **YES** | analytics-events, notification-events |
| Job Lock Duration | **YES** | All workers have 30s lock |
| Stalled Job Detection | **YES** | All workers detect stalled jobs |
| Retry with Backoff | **YES** | Exponential backoff configured |
| DLQ Persistence | **PARTIAL** | Only notification-events persists to MongoDB |

### 4.2 Data Loss Scenarios

| Scenario | Current Protection | Gap |
|----------|---------------------|-----|
| Worker crash mid-processing | BullMQ auto-retry | Job data may be lost if not stored |
| MongoDB write fails | Silently logged | No secondary storage |
| Redis connection lost | BullMQ reconnection | Events stuck in queue |
| DLQ overflow | No limit | No max DLQ size |
| App sends events before auth | 403 returned | Consent gate implemented |

### 4.3 Critical Data Loss Path

```typescript
// analytics-events/src/index.ts (line 150-161)
// Fire-and-forget pattern - events can be dropped
res.status(200).json({ success: true });  // Returns immediately
mongoose.connection.collection('webevents').insertOne({...})
  .catch(() => {});  // Error swallowed!
```

---

## 5. Recommendations

### 5.1 Priority 1: Implement Event Replay

**Problem:** No mechanism to reprocess historical events.

**Solution:**
```typescript
// Add replay endpoint to rez-event-platform
app.post('/events/replay', async (req, res) => {
  const { eventType, fromDate, toDate, batchSize = 100 } = req.body;

  // Read from EventStore
  const events = await EventStore.find({
    type: eventType,
    timestamp: { $gte: fromDate, $lte: toDate },
    processed: true  // Only replay completed events
  }).limit(batchSize);

  // Re-publish to queue
  for (const event of events) {
    await queue.add(event.type, { event: event.payload });
  }

  res.json({ replayed: events.length });
});
```

**Files to Modify:**
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-event-platform/src/index.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-event-platform/src/models/event-store.ts`

### 5.2 Priority 2: Add DLQ Persistence to All Services

**Problem:** Only notification-events persists DLQ entries to MongoDB.

**Solution:** Create shared DLQ handler module.

**Files to Create:**
```
packages/rez-shared/src/dlq/
  - dlqHandler.ts       (shared DLQ logic)
  - dlqCleanup.ts       (shared cleanup logic)
  - dlqMetrics.ts       (Prometheus metrics)
```

### 5.3 Priority 3: Fix Fire-and-Forget Pattern

**Problem:** analytics-events webhooks return before MongoDB write.

**Solution:**
```typescript
// Before (bad)
res.status(200).json({ success: true });
insertOne({...}).catch(() => {});

// After (good)
await insertOne({...});
res.status(200).json({ success: true });
```

**Files to Modify:**
- `/Users/rejaulkarim/Documents/ReZ Full App/analytics-events/src/index.ts`

### 5.4 Priority 4: Add Event Correlation Across Services

**Problem:** correlationId not propagated through all services.

**Solution:**
```typescript
// Standardize correlation header
const CORRELATION_HEADER = 'x-correlation-id';

// Add to all HTTP clients
headers: {
  'x-correlation-id': correlationId || uuid()
}

// Log correlation in all workers
logger = logger.child({ correlationId: event.correlationId });
```

### 5.5 Priority 5: Implement Transaction Boundaries

**Problem:** Batch operations can partially fail.

**Solution:**
```typescript
// analytics-events batch insert with transaction
const session = await mongoose.startSession();
session.startTransaction();
try {
  await AppEvents.insertMany(docs, { session });
  await session.commitTransaction();
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

---

## 6. Implementation Plan

### Phase 1: Stabilization (Week 1)
1. Fix fire-and-forget in analytics-events webhooks
2. Add DLQ persistence to rez-event-platform
3. Implement shared DLQ handler in rez-shared
4. Add Prometheus metrics to all queues

### Phase 2: Observability (Week 2)
1. Standardize correlation ID propagation
2. Add Grafana dashboards for queue depth
3. Implement DLQ monitoring alerts
4. Add dead letter rate metrics

### Phase 3: Resilience (Week 3-4)
1. Implement event replay mechanism
2. Add transaction boundaries to batch operations
3. Implement circuit breaker for MongoDB writes
4. Add backpressure handling

### Phase 4: Scale (Week 5-6)
1. Implement event compression for high-volume events
2. Add event sampling for analytics
3. Implement event archival strategy
4. Add distributed tracing (OpenTelemetry)

---

## 7. Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Queue Depth | > 1000 | Scale workers |
| DLQ Size | > 100 | Investigate failures |
| Processing Time | > 5000ms | Optimize handlers |
| Failed Job Rate | > 5% | Review DLQ |
| Stalled Jobs | > 0 | Restart worker |

---

## 8. Appendix: Service Endpoints

### rez-event-platform (Port 3003)
- `POST /events/publish` - Publish raw event
- `POST /events/{type}` - Publish typed event
- `POST /webhook/{source}/{type}` - Webhook ingestion
- `GET /stats` - Queue statistics
- `GET /schemas` - Schema documentation

### analytics-events (Port 3002)
- `POST /api/analytics/batch` - Batch event ingestion
- `POST /api/analytics/web-events` - Web event ingestion
- `GET /api/analytics/*` - Analytics queries (protected)

### notification-events (Port 3005)
- `POST /api/marketing/*` - Marketing notifications
- `GET /health` - Health check

### media-events (Port 3006)
- `POST /api/media/upload` - Media upload
- `GET /health` - Health check

### rez-intent-graph (Port 3007)
- `POST /api/intent/capture` - Capture intent
- `GET /api/intent/{userId}` - Get user intents

---

## 9. Files Audited

| File | Purpose | Issues Found |
|------|---------|--------------|
| packages/rez-intent-graph/src/types/events.ts | Intent types | N/A - types only |
| rez-event-platform/src/events/emitter.ts | Event publishing | Silent storeEvent failures |
| rez-event-platform/src/events/consumer.ts | Event processing | No DLQ MongoDB persistence |
| rez-event-platform/src/events/schema-registry.ts | Schema validation | GOOD - comprehensive |
| analytics-events/src/index.ts | Main entry | Fire-and-forget pattern |
| analytics-events/src/worker.ts | Analytics worker | GOOD - idempotent upsert |
| analytics-events/src/workers/eventPlatformConsumer.ts | EP consumer | GOOD - dual storage |
| analytics-events/src/workers/merchantAggregationWorker.ts | Nightly job | No transaction boundaries |
| notification-events/src/index.ts | Main entry | GOOD - proper shutdown |
| notification-events/src/worker.ts | Notification worker | GOOD - comprehensive |
| notification-events/src/workers/dlqWorker.ts | DLQ handling | BEST - full implementation |
| media-events/src/worker.ts | Media processing | Some retry gaps |
| rez-intent-graph/src/eventBus.ts | Internal bus | Node.js Emitter only |

---

**End of Report**
