# Cross-Service Event Inventory — Sprint -1a

**Scope:** 5 Node.js microservices under `/sessions/kind-quirky-gates/mnt/ReZ Full App/`.
**Method:** Ripgrep across each service's `src/` for BullMQ `new Queue(...)`, `new Worker(...)`, `.add(...)`, ioredis `.publish(...)`, `.subscribe(...)`, and `EventBus.emit/on` / `publish*` patterns.
**Date:** 2026-04-21.

> The monolith (`rezbackend/rez-backend-master`) is explicitly out of scope for this inventory, but it's referenced as a publisher/consumer where a microservice is on the other end of the wire.

---

## Per-Service Tables

### 1. rez-payment-service

**Publishers (enqueues / publishes outbound)**

| Queue / channel  | File                                    | Line | Notes                                                                                 |
| ---------------- | --------------------------------------- | ---- | ------------------------------------------------------------------------------------- |
| `wallet-credit`  | `src/services/paymentService.ts`        | 120  | `new Queue('wallet-credit', ...)` — enqueued from the payment completion path        |
| `monolith-sync`  | `src/services/paymentService.ts`        | 479  | `new Queue('monolith-sync', ...)` — write-back to the monolith                       |
| `monolith-sync`  | `src/services/paymentService.ts`        | 501  | `queue.add('webhook-sync', {...})` — only `.add()` call, webhook sync job             |

**Consumers (workers)**

| Queue            | File                                    | Line | Notes                                                                                 |
| ---------------- | --------------------------------------- | ---- | ------------------------------------------------------------------------------------- |
| `wallet-credit`  | `src/worker/walletCreditWorker.ts`      | 107  | `new Worker('wallet-credit', ...)` — calls rez-wallet-service via HTTP, emits socket |
| `wallet-credit`  | `src/worker.ts`                         | 167  | `new Worker(WALLET_CREDIT_QUEUE, ...)` — duplicate / alternate entrypoint for same queue |

**Subscribes:** none
**Redis pub/sub:** none

---

### 2. rez-order-service

**Publishers (enqueues / publishes outbound)**

| Queue / channel        | File              | Line | Notes                                                                                          |
| ---------------------- | ----------------- | ---- | ---------------------------------------------------------------------------------------------- |
| `wallet-events`        | `src/worker.ts`   | 16   | `new Queue('wallet-events', ...)` — settlement enqueued on `order.delivered` (line 129)       |
| `notification-events`  | `src/worker.ts`   | 22   | `new Queue('notification-events', ...)` — cancellation push enqueued on `order.cancelled` (line 168) |

**Consumers (workers)**

| Queue           | File                    | Line | Notes                                            |
| --------------- | ----------------------- | ---- | ------------------------------------------------ |
| `order-events`  | `src/worker.ts`         | 55   | `new Worker('order-events', ...)`, `QUEUE_NAME = 'order-events'` at line 28 |

**Subscribes:** none
**Redis pub/sub:** none

Note: `order-events` is produced by the monolith, not by any of these 5 microservices. rez-order-service is a **consumer only** for that queue; its publishers are downstream fan-outs.

---

### 3. rez-wallet-service

**Publishers (enqueues / publishes outbound)**

| Queue / channel        | File                              | Line | Notes                                                                                   |
| ---------------------- | --------------------------------- | ---- | --------------------------------------------------------------------------------------- |
| `coin-credit` (Redis)  | `src/services/walletService.ts`   | 471  | `pub.publish('coin-credit', payload)` — ioredis pub/sub, comment says "for karma service" |
| `notification-events`  | `src/worker.ts`                   | 19   | `new Queue('notification-events', ...)` — low-balance alert at line 266                  |

**Consumers (workers)**

| Queue            | File             | Line | Notes                                                                                    |
| ---------------- | ---------------- | ---- | ---------------------------------------------------------------------------------------- |
| `wallet-events`  | `src/worker.ts`  | 136  | `new Worker(QUEUE_NAME, ...)` with `QUEUE_NAME = 'wallet-events'` (line 105) — consumes order-service's settlement jobs |

**Subscribes:** none (only publishes on Redis channel)
**Redis pub/sub:** publishes `coin-credit`; no subscriber in any of the 5 services (see Dead Routes)

---

### 4. rez-gamification-service

**Publishers (enqueues / publishes outbound)**

| Queue / channel        | File                                       | Line  | Notes                                                             |
| ---------------------- | ------------------------------------------ | ----- | ----------------------------------------------------------------- |
| `notification-events`  | `src/worker.ts`                            | 108   | `new Queue('notification-events', ...)` — coin-earned notification at line 127 |
| `achievement-events`   | `src/worker.ts`                            | 116   | `new Queue('achievement-events', ...)` — fans out visit_checked_in (line 358) |
| `notification-events`  | `src/workers/achievementWorker.ts`         | 111   | second `new Queue('notification-events', ...)` instance            |
| `notification-events`  | `src/workers/storeVisitStreakWorker.ts`    | 55    | third `new Queue('notification-events', ...)` instance             |

**Consumers (workers)**

| Queue                  | File                                       | Line  | Notes                                                    |
| ---------------------- | ------------------------------------------ | ----- | -------------------------------------------------------- |
| `gamification-events`  | `src/worker.ts`                            | 156   | `new Worker(QUEUE_NAME, ...)`, `QUEUE_NAME = 'gamification-events'` (line 17) |
| `gamification-events`  | `src/workers/achievementWorker.ts`         | 352   | second worker on same queue name (documented as sharing `visit_checked_in`) |
| (streak scheduler)     | `src/workers/storeVisitStreakWorker.ts`    | 286   | scheduled / cron worker                                  |

**Subscribes (Redis pub/sub)**

| Channel                | File                                | Line |
| ---------------------- | ----------------------------------- | ---- |
| `game-config:updated`  | `src/gameConfigSubscription.ts`     | 19   |

**Redis pub/sub publishers:** none

> **Critical gap:** gamification-service has no subscriber on any payment, order, wallet, or `coin-credit` channel. It only ingests what the monolith chooses to drop onto `gamification-events`. Game-config updates are the only cross-process input it can react to.

---

### 5. rez-notification-events

**Publishers (enqueues / publishes outbound)**

| Queue / channel    | File                                     | Line | Notes                                                                        |
| ------------------ | ---------------------------------------- | ---- | ---------------------------------------------------------------------------- |
| `notification-dlq` | `src/workers/dlqWorker.ts`               | 114  | `dlqQueue.add('dlq-entry', ...)` — DLQ on processing failure                 |
| (streak scheduler) | `src/workers/streakAtRiskWorker.ts`      | 135  | `new Queue(SCHEDULER_QUEUE, ...)` registers a BullMQ repeatable cron job     |

**Consumers (workers)**

| Queue                                       | File                                | Line | Notes                                                                                                                    |
| ------------------------------------------- | ----------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------ |
| `notification-events-${INTERNAL_SERVICE_NAME}` | `src/worker.ts`                  | 441  | `QUEUE_NAME = ``notification-events-${process.env.INTERNAL_SERVICE_NAME \|\| 'default'}` `` (line 35) — **suffixed queue** |
| streak-at-risk scheduler queue              | `src/workers/streakAtRiskWorker.ts` | 151  | processes cron-triggered "streak at risk" warnings                                                                       |

**Subscribes:** none (notif-events service does not listen to Redis pub/sub)
**QueueEvents listener:** `src/workers/dlqWorker.ts:172` monitors `notification-events` (the non-suffixed name) for failed jobs

> **Smoking gun:** the consumer worker reads from `notification-events-<suffix>`, but every publisher (order-service, wallet-service, gamification-service, monolith) writes to the non-suffixed `notification-events`. These jobs never reach this standalone service; they are only drained if the monolith's worker is running (see Dead Routes).

---

## Cross-Service Flow Graph (ASCII)

### Flow 1 — Payment completion

```
rez-payment-service
    ├── enqueues wallet-credit (BullMQ)
    │     └── consumed by: rez-payment-service/src/worker/walletCreditWorker.ts
    │                      (SELF-consumer: calls rez-wallet-service HTTP /internal/credit,
    │                       then emits coins:awarded to monolith socket)
    │
    └── enqueues monolith-sync (BullMQ, job: 'webhook-sync')
          └── consumed by: monolith (assumed — no microservice consumer found)
```

**Key point:** rez-payment-service's wallet-credit queue is in-process. No other microservice reads from it. The fan-out to "the wallet was credited" is done **not** via a broadcast event but via a direct HTTP call and a socket emit. Gamification, loyalty, cashback — none of them see a payment-completed event.

---

### Flow 2 — Order lifecycle

```
monolith (rezbackend)
    └── publishes order-events (BullMQ)
          └── consumed by: rez-order-service/src/worker.ts (QUEUE_NAME=order-events)
                │
                ├── on 'order.delivered':
                │     └── enqueues wallet-events (BullMQ, job: 'merchant-settlement')
                │           └── consumed by: rez-wallet-service/src/worker.ts (QUEUE_NAME=wallet-events)
                │                 └── credits merchant wallet
                │                 └── publishes coin-credit (Redis pub/sub) ◀── DEAD (no subscriber)
                │                 └── enqueues notification-events ◀── see Flow 3 caveat
                │
                └── on 'order.cancelled':
                      └── enqueues notification-events (BullMQ, job: 'order-cancelled')
                            └── consumed by: monolith notification worker (if WORKER_ROLE=noncritical)
                                OR rez-notification-events ◀── MISROUTED (queue name suffix mismatch)
```

---

### Flow 3 — Gamification inputs

```
rez-gamification-service
    ├── subscribes Redis pub/sub: game-config:updated
    │     └── published by: (expected) admin tooling / rez-scheduler-service per its docs,
    │                       but we did not find an in-tree publisher
    │
    └── consumes BullMQ: gamification-events
          └── published by: monolith only (no microservice in this set publishes to it)

NOT subscribed to:
    ✗ payment completion (no channel exists — payment-service never broadcasts)
    ✗ order.delivered   (no subscriber on order-events)
    ✗ wallet credited   (no subscriber on wallet-events; coin-credit pub/sub has no listener)
```

> Gamification is effectively a sink for whatever the monolith hand-picks and enqueues onto `gamification-events`. If we retire the monolith's orchestration, gamification goes deaf.

---

## Queue Collision Map

| Queue name                                  | Publishers (service / file)                                                                                                                                                                                                                                                                                  | Consumers (service / file)                                                                                                                                                                                                       | Collision?                                                                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `wallet-credit`                             | rez-payment-service/src/services/paymentService.ts:120                                                                                                                                                                                                                                                       | rez-payment-service/src/worker/walletCreditWorker.ts:107 **and** rez-payment-service/src/worker.ts:167                                                                                                                           | Yes — **two workers in the same service consuming the same queue** (duplicate job processing) |
| `monolith-sync`                             | rez-payment-service/src/services/paymentService.ts:479                                                                                                                                                                                                                                                       | none in the 5 microservices (monolith assumed)                                                                                                                                                                                   | No, but enqueue exists without in-scope consumer                                             |
| `wallet-events`                             | rez-order-service/src/worker.ts:16                                                                                                                                                                                                                                                                          | rez-wallet-service/src/worker.ts:136                                                                                                                                                                                             | No — clean producer/consumer                                                                 |
| `order-events`                              | (monolith)                                                                                                                                                                                                                                                                                                  | rez-order-service/src/worker.ts:55                                                                                                                                                                                               | No (monolith only publisher)                                                                 |
| `gamification-events`                       | (monolith)                                                                                                                                                                                                                                                                                                  | rez-gamification-service/src/worker.ts:156 **and** rez-gamification-service/src/workers/achievementWorker.ts:352                                                                                                                 | Yes — **two workers on same queue within gamification service** (file header comment calls out ~50% job loss when running together; the achievementWorker later moved to `achievement-events`) |
| `achievement-events`                        | rez-gamification-service/src/worker.ts:358                                                                                                                                                                                                                                                                  | rez-gamification-service (achievementWorker uses this queue per header comment at achievementWorker.ts:344)                                                                                                                      | No                                                                                           |
| `notification-events` (non-suffixed)        | rez-order-service/src/worker.ts:22; rez-wallet-service/src/worker.ts:19; rez-gamification-service/src/worker.ts:108, achievementWorker.ts:111, storeVisitStreakWorker.ts:55; monolith                                                                                                                      | monolith `startNotificationWorker()` (when `NOTIFICATION_WORKER_EXTERNAL !== 'true'`); DLQ listener rez-notification-events/src/workers/dlqWorker.ts:172 (QueueEvents only — doesn't process)                                     | **Multi-publisher / fragile consumer** — see Dead Routes                                      |
| `notification-events-${INTERNAL_SERVICE_NAME}` | none — nobody publishes with the suffix                                                                                                                                                                                                                                                                 | rez-notification-events/src/worker.ts:441                                                                                                                                                                                        | **Dead — consumer listens on a queue nobody writes to**                                     |
| `notification-dlq`                          | rez-notification-events/src/workers/dlqWorker.ts:114                                                                                                                                                                                                                                                       | (dlq review only, no retry worker in this set)                                                                                                                                                                                   | No                                                                                           |
| `coin-credit` (Redis pub/sub)               | rez-wallet-service/src/services/walletService.ts:471                                                                                                                                                                                                                                                       | **none** (config comment says "karma service" — not present)                                                                                                                                                                     | **Dead — blind publish**                                                                     |
| `game-config:updated` (Redis pub/sub)       | (docs reference rez-scheduler-service / admin tooling)                                                                                                                                                                                                                                                     | rez-gamification-service/src/gameConfigSubscription.ts:19                                                                                                                                                                        | Subscriber-only in this set (publisher out of scope)                                        |

---

## Dead Routes

### A. Enqueues with no consumer (in the 5 services)

1. **`monolith-sync`** (rez-payment-service/src/services/paymentService.ts:479,501) — no microservice consumer. Assumes the monolith still runs its own worker. If the monolith is retired or the worker flag is off, webhook-sync jobs pile up.

2. **`notification-events`** (non-suffixed, enqueued by rez-order-service, rez-wallet-service, rez-gamification-service) — the standalone rez-notification-events service consumes **`notification-events-${INTERNAL_SERVICE_NAME}`**, not the raw name. These jobs are only drained if the monolith's `startNotificationWorker()` is still running on the noncritical dyno. If `NOTIFICATION_WORKER_EXTERNAL=true` is set on the monolith **and** the standalone service is expected to handle them, every notification from the 3 services above is silently lost.

3. **`notification-events-${INTERNAL_SERVICE_NAME}`** (consumed by rez-notification-events/src/worker.ts:441) — **no publisher anywhere writes to this suffixed name.** The suffix was introduced in BAK-CROSS-020 to eliminate cross-service interference, but the publishers were never migrated. This consumer sits idle.

### B. Publishes with no subscriber

4. **`coin-credit`** Redis pub/sub channel (rez-wallet-service/src/services/walletService.ts:471) — no subscriber found in any of the 5 services. The config.ts comment explicitly says "the karma service can subscribe," but there is no karma service in this tree. Every coin credit is published to the void.

### C. Intra-service conflicts (not strictly dead, but broken)

5. **rez-payment-service** has **two workers bound to `wallet-credit`** (`src/worker/walletCreditWorker.ts:107` and `src/worker.ts:167`). If both are started in the same process, each job will be processed twice or randomly by one of them, leading to duplicate wallet credits or duplicate socket emits. This needs deduplication before go-live.

6. **rez-gamification-service** has (had) two workers on `gamification-events` — the header comment in achievementWorker.ts notes "~50% loss" when both run on the same queue. The code was partially migrated to `achievement-events`, but both start-functions still reference the old queue name, so the migration is incomplete.

---

## Growth Engine Implications

Sprint 0's canonical `order.placed` cannot safely reach CRM / loyalty / cashback over the current microservices fabric. The plumbing has three disqualifying defects: (1) the only event that fans out across services today is `wallet-events`, which is a **merchant settlement** signal triggered on `order.delivered` — not `order.placed`; (2) the `notification-events` queue has a producer/consumer name mismatch (`notification-events` vs `notification-events-${INTERNAL_SERVICE_NAME}`) that makes the standalone notification service invisible to every microservice publisher — reliable delivery still depends on the monolith's in-process worker; (3) there is no cross-service subscriber for payment completion, order placement, or wallet credit — rez-gamification-service (the de-facto loyalty/cashback input) only listens to `gamification-events` (published by the monolith) and `game-config:updated`. A canonical `order.placed` published from the monolith or rez-order-service would therefore reach exactly zero microservice consumers without new code.

**Recommendation: keep Sprint 0 monolith-only.** The honest path is to publish `order.placed` from the monolith into a single in-process EventBus that CRM / loyalty / cashback modules subscribe to, and let the existing BullMQ fan-outs (`wallet-events`, `gamification-events`, `notification-events`) remain the only cross-process touchpoints for now. Defer the cross-service `order.placed` fan-out to Sprint 1 behind a dedicated remediation ticket that (a) unifies the notification-events queue naming, (b) picks a single transport for `coin-credit` (BullMQ with a real consumer, or delete it), and (c) introduces an `order.placed` topic with explicit subscribers wired into gamification and any future loyalty service.
