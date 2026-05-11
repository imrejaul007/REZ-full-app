# Scale Recommendations Implementation Plan
**Date:** 2026-04-25
**Status:** IN PROGRESS (Phase 1 & 2 Complete)

---

## Executive Summary

| Phase | Item | Status | Priority |
|-------|------|--------|----------|
| 1 | Prometheus Targets + Grafana | ✅ DONE | NOW |
| 2 | Sentry Integration (14 services) | ✅ DONE | NOW |
| 3 | Grafana Dashboards | ✅ DONE | NEXT |
| 4 | CQRS Wallet | ⏳ PENDING | LATER |
| 5 | Event Sourcing | ⏳ PENDING | FUTURE |
| 6 | GraphQL Federation | ⏳ PENDING | OPTIONAL |

### Completed Work

**Phase 1: Prometheus + /metrics Endpoints**
- prometheus.yml updated with all 14 services ✅
- /metrics endpoint added to 4 services: rez-ads-service, rez-marketing-service, rez-media-events, rez-notification-events ✅
- Commits: `43f1815e` (rez-backend), `c2235fe`, `1452513`, `3f2a2a4`, `cebe204`

**Phase 2: Sentry Integration**
- Sentry added to 14/14 services ✅
- Commits: `82d1915` (ads), `b211322` (marketing), `4a899de` (order)

**Phase 3: Grafana Dashboards**
- service-health.json (uptime, requests, latency, memory) ✅
- bullmq-queue.json (queue depths, failed jobs) ✅
- business-metrics.json (credits, orders, payments) ✅
- Provisioning configs for auto-load ✅
- Commit: `6783fee8` (rez-backend)

---

## Phase 1: Prometheus + Grafana Foundation (1 Day)

### 1.1 Configure Prometheus Scrape Targets

**File:** `rezbackend/rez-backend-master/prometheus.yml`

```yaml
scrape_configs:
  - job_name: 'rez-services'
    static_configs:
      - targets:
        - 'rez-auth-service:3001'
        - 'rez-merchant-service:3002'
        - 'rez-wallet-service:3003'
        - 'rez-payment-service:3004'
        - 'rez-order-service:3005'
        - 'rez-catalog-service:3006'
        - 'rez-search-service:3007'
        - 'rez-gamification-service:3008'
        - 'rez-ads-service:3009'
        - 'rez-marketing-service:3010'
        - 'rez-media-events:3011'
        - 'rez-notification-events:3012'
        - 'rez-finance-service:3013'
        - 'rez-karma-service:3014'
```

### 1.2 Add /metrics Endpoint to Services Missing It

Services missing `/metrics`:
- [x] rez-ads-service ✅
- [x] rez-marketing-service ✅
- [x] rez-media-events ✅
- [x] rez-notification-events ✅

**Implementation:**
```typescript
import client from 'prom-client';
const register = new client.Registry();
client.collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 1.3 Add prom-client to package.json

```bash
npm install prom-client --save
```

### 1.4 Tasks

| Task | Status | Commit |
|------|--------|--------|
| Update prometheus.yml with all service targets | ✅ Done | `43f1815e` |
| Add /metrics to rez-ads-service | ✅ Done | `c2235fe` |
| Add /metrics to rez-marketing-service | ✅ Done | `1452513` |
| Add /metrics to rez-media-events | ✅ Done | `3f2a2a4` |
| Add /metrics to rez-notification-events | ✅ Done | `cebe204` |
| Test Prometheus scrape locally | ⏳ Pending | - |

---

## Phase 2: Sentry Integration ✅ DONE

### 2.1 Sentry in All Services

All 14 services now have Sentry code integrated:
| Service | Status | Commit |
|---------|--------|--------|
| rez-auth-service | ✅ Already had | - |
| rez-merchant-service | ✅ Already had | - |
| rez-wallet-service | ✅ Already had | - |
| rez-payment-service | ✅ Already had | - |
| rez-order-service | ✅ Added requestHandler | `4a899de` |
| rez-catalog-service | ✅ Already had | - |
| rez-search-service | ✅ Already had | - |
| rez-gamification-service | ✅ Already had | - |
| rez-ads-service | ✅ Added | `82d1915` |
| rez-marketing-service | ✅ Added | `b211322` |
| rez-media-events | ✅ Already had | - |
| rez-notification-events | ✅ Already had | - |
| rez-finance-service | ✅ Already had | - |
| rez-karma-service | ✅ Already had | - |

### 2.2 Manual Step Required

**On Render Dashboard:**
1. Go to each service → Environment → Add variable
2. Add `SENTRY_DSN` with value from Sentry dashboard
3. Deploy to activate

---

## Phase 3: Grafana Dashboards ✅ DONE

### 3.1 Dashboards Created

| Dashboard | File | Metrics |
|----------|------|---------|
| Service Health | `service-health.json` | Services up, request rate, response time p95, memory |
| BullMQ Queue | `bullmq-queue.json` | Queue depths, failed jobs, completion rate |
| Business Metrics | `business-metrics.json` | Wallet credits, orders, payments, users |

**Files:** `rezbackend/rez-backend-master/monitoring/`
**Commit:** `6783fee8`

### 3.2 Manual Step - Import Dashboards

If using existing Grafana:
1. Login to Grafana at port 3002
2. Dashboards → Import
3. Upload each JSON file

Dashboards will auto-load via provisioning config on restart.

### 3.3 Original Design (for reference)

### 3.1 Service Health Overview Dashboard

```json
{
  "title": "REZ Service Health",
  "panels": [
    {
      "title": "Service Uptime",
      "type": "stat",
      "targets": [{ "expr": "up{job='rez-services'}" }]
    },
    {
      "title": "Error Rate by Service",
      "type": "graph",
      "targets": [{ "expr": "rate(http_requests_total{status=~'5..'}[5m])" }]
    },
    {
      "title": "Response Time (p95)",
      "type": "graph",
      "targets": [{ "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))" }]
    }
  ]
}
```

### 3.2 BullMQ Queue Dashboard

```json
{
  "title": "REZ Queue Health",
  "panels": [
    {
      "title": "Queue Depths",
      "type": "graph",
      "targets": [
        { "expr": "bull_queue_length{queue='notifications'}" },
        { "expr": "bull_queue_length{queue='gamification'}" },
        { "expr": "bull_queue_length{queue='wallet'}" }
      ]
    },
    {
      "title": "Failed Jobs (24h)",
      "type": "stat",
      "targets": [{ "expr": "sum(bull_jobs_failed_total)" }]
    }
  ]
}
```

### 3.3 Custom Metrics to Add

In each service:
```typescript
import { Counter, Histogram } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});
```

### 3.4 Tasks

| Task | Owner | Time |
|------|-------|------|
| Create Service Health Dashboard JSON | DevOps | 1h |
| Create BullMQ Dashboard JSON | DevOps | 1h |
| Create Business Metrics Dashboard | DevOps | 1h |
| Import dashboards to Grafana | DevOps | 1h |

---

## Phase 4: CQRS for Wallet (1 Week)

### 4.1 Architecture Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         CQRS WIDGET                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COMMAND SIDE                    │  QUERY SIDE                   │
│                                 │                               │
│  ┌──────────────────┐           │  ┌──────────────────┐         │
│  │ Wallet Service   │           │  │ Read Model       │         │
│  │ (Commands)       │           │  │ (Projections)    │         │
│  │                  │           │  │                  │         │
│  │ credit()         │──────────►│  │ balance: X       │         │
│  │ debit()          │   Event   │  │ lastUpdated: Y   │         │
│  │ transfer()        │           │  │ history: [...]    │         │
│  └────────┬─────────┘           │  └────────▲─────────┘         │
│           │                      │           │                    │
│           ▼                      │           │                    │
│  ┌──────────────────┐           │           │                    │
│  │ Event Store      │           │           │                    │
│  │ (Append Only)    │───────────┼───────────┘                    │
│  │                  │ Projection│                                │
│  │ WALLET_CREDITED  │           │                                │
│  │ WALLET_DEBITED   │           │                                │
│  │ TRANSFER_INIT     │           │                                │
│  └──────────────────┘           │                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Event Schema

```typescript
// In @rez/shared
interface WalletEvent {
  eventId: string;
  walletId: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER';
  amount: number;
  balance: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

// Events
interface WalletCredited extends WalletEvent {
  type: 'CREDIT';
  source: 'order' | 'refund' | 'admin' | 'promotion';
  orderId?: string;
}

interface WalletDebited extends WalletEvent {
  type: 'DEBIT';
  reason: 'purchase' | 'withdrawal' | 'fee' | 'refund';
  orderId?: string;
}
```

### 4.3 Command Model

```typescript
// WalletCommandService
class WalletCommandService {
  async credit(userId: string, amount: number, source: string): Promise<WalletEvent> {
    const event: WalletCredited = {
      eventId: crypto.randomUUID(),
      walletId: await this.getWalletId(userId),
      userId,
      type: 'CREDIT',
      amount,
      balance: await this.calculateNewBalance(userId, amount),
      timestamp: new Date(),
      source,
      metadata: { correlationId: getCorrelationId() }
    };
    await this.eventStore.append(event);
    return event;
  }
}
```

### 4.4 Query Model (Projection)

```typescript
// WalletReadModel
interface WalletSnapshot {
  walletId: string;
  userId: string;
  balance: number;
  lastUpdated: Date;
  version: number;
}

// Projection updates from events
class WalletProjection {
  async project(event: WalletEvent): Promise<void> {
    const snapshot = await this.getSnapshot(event.walletId);
    if (event.type === 'CREDIT') {
      snapshot.balance += event.amount;
    } else if (event.type === 'DEBIT') {
      snapshot.balance -= event.amount;
    }
    snapshot.lastUpdated = event.timestamp;
    snapshot.version++;
    await this.saveSnapshot(snapshot);
  }
}
```

### 4.5 Tasks

| Task | Duration | Dependencies |
|------|----------|-------------|
| Define event schemas in @rez/shared | 2h | - |
| Create EventStore model in MongoDB | 4h | - |
| Implement WalletCommandService | 8h | EventStore |
| Implement WalletReadModel projection | 8h | CommandService |
| Add snapshot strategy (every 100 events) | 4h | ReadModel |
| Update wallet API to use CQRS | 8h | Services |
| Write integration tests | 8h | API |
| Migration script for existing data | 16h | - |

**Total: ~2.5 days**

---

## Phase 5: Event Sourcing (2 Weeks)

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT SOURCING                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Command    │───►│  Event Store │───►│  Projections │       │
│  │   Handler    │    │  (MongoDB)   │    │  (Read Models)│       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  Events are immutable, append-only                                │
│  Any point-in-time state can be reconstructed                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Event Store Schema

```typescript
interface EventRecord {
  _id: ObjectId;
  aggregateId: string;      // e.g., walletId, orderId
  aggregateType: string;    // e.g., 'Wallet', 'Order'
  eventType: string;        // e.g., 'OrderPlaced', 'PaymentReceived'
  eventData: object;        // Payload
  metadata: {
    correlationId: string;
    causationId?: string;
    userId?: string;
    timestamp: Date;
    version: number;         // Sequence number
  };
  // Indexes
  createdAt: Date;
}
```

### 5.3 Aggregate Pattern

```typescript
abstract class AggregateRoot<T> {
  protected abstract initialState: T;
  protected state: T;
  protected uncommittedEvents: Event[] = [];

  protected abstract apply(event: Event): void;

  loadFromHistory(events: Event[]): void {
    events.forEach(e => this.apply(e));
  }

  getUncommittedEvents(): Event[] {
    return [...this.uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this.uncommittedEvents = [];
  }
}

// Example: Order Aggregate
class OrderAggregate extends AggregateRoot<OrderState> {
  place(data: PlaceOrderData): void {
    this.assertStateIs('Draft');
    this.apply(new OrderPlacedEvent(data));
  }

  private apply(event: OrderPlacedEvent): void {
    this.state = { ...this.state, status: 'Placed', orderId: event.orderId };
  }
}
```

### 5.4 Tasks

| Task | Duration | Complexity |
|------|----------|------------|
| Design event schemas for core aggregates | 1 day | Medium |
| Implement EventStore base class | 2 days | High |
| Create event versioning strategy | 1 day | High |
| Implement snapshot mechanism | 2 days | Medium |
| Build projection framework | 2 days | High |
| Migrate Order aggregate | 3 days | Very High |
| Migrate Wallet aggregate (extends CQRS) | 2 days | Very High |
| Add replay capability | 1 day | High |
| Write comprehensive tests | 2 days | Medium |

**Total: ~2 weeks**

---

## Phase 6: GraphQL Federation (4 Weeks) - OPTIONAL

### 6.1 Federation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   GRAPHQL FEDERATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────┐                                             │
│    │   Client   │                                             │
│    └──────┬──────┘                                             │
│           │ query                                              │
│           ▼                                                    │
│  ┌────────────────┐                                           │
│  │ Federation     │ supergraph.graphql                         │
│  │ Gateway        │                                           │
│  └────┬─────┬─────┘                                           │
│       │     │                                                 │
│   query  query mutation                                        │
│       │     │                                                 │
│  ┌────▼┐ ┌──▼───┐ ┌─────────┐ ┌──────────┐                    │
│  │Order│ │User  │ │Wallet   │ │Catalog   │                    │
│  │Svc  │ │Svc   │ │Svc      │ │Svc       │                    │
│  └─────┘ └──────┘ └─────────┘ └──────────┘                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 When to Consider

- Client apps making 10+ API calls per screen
- Over-fetching causing performance issues
- Schema consistency across platforms
- Mobile bandwidth optimization needed

### 6.3 Decision Matrix

| Factor | REST | GraphQL |
|--------|------|---------|
| Complexity | Low | High |
| Client flexibility | Low | High |
| Caching | Easy (HTTP) | Complex |
| Tooling | Good | Excellent |
| Learning curve | Low | High |
| Migration effort | None | 4+ weeks |

**Recommendation:** Only pursue if pain is significant. REST improvements (caching, BFF) may solve 80% of issues.

---

## Implementation Order

```
Week 1: Phase 1 (Prometheus) + Phase 2 (Sentry Env)
          │
Week 2: Phase 3 (Grafana Dashboards)
          │
Week 3-4: Phase 4 (CQRS Wallet) ─────────────────┐
          │                                        │
Week 5-6: Phase 5 (Event Sourcing) ◄─────────────┘
          │
Week 7+:  Phase 6 (GraphQL) - ONLY if needed
```

---

## Risk Assessment

| Phase | Risk | Mitigation |
|-------|------|------------|
| Prometheus | Config errors cause downtime | Test in staging first |
| Sentry | Performance overhead | Use sampling (10% trace rate) |
| Grafana | Dashboard proliferation | Create templates, limit access |
| CQRS | Migration complexity | Run parallel with existing, validate |
| Event Sourcing | Learning curve | Train team first, start with 1 aggregate |
| GraphQL | Full rewrite | Consider REST improvements first |

---

## Success Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| Prometheus | Services monitored | 14/14 |
| Sentry | Error coverage | 14/14 |
| Grafana | Dashboards created | 5+ |
| CQRS | Wallet read latency | <10ms |
| Event Sourcing | Aggregate coverage | 5+ |
| GraphQL | (if pursued) Client satisfaction | +20% |

---

## Last Updated: 2026-04-25
