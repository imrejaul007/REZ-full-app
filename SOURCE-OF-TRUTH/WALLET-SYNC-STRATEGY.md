# WALLET-SYNC-STRATEGY.md

**Document Type:** Architecture Decision Record
**Status:** Draft
**Owner:** Platform Team
**Last Updated:** 2026-05-01

---

## Table of Contents

1. [Current State](#current-state)
2. [Why They Need to Sync](#why-they-need-to-sync)
3. [Proposed Sync Architectures](#proposed-sync-architectures)
4. [API Endpoints for Sync](#api-endpoints-for-sync)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Implementation Steps](#implementation-steps)

---

## Current State

### ReZ Wallet Service (`rez-wallet-service`)

| Attribute | Value |
|-----------|-------|
| **Port** | 4004 |
| **Database** | MongoDB |
| **Tech Stack** | TypeScript, Express, Mongoose |
| **Deploy** | https://rez-wallet-service-36vo.onrender.com |

**Collections:**
- `wallets` - Consumer wallets (balance, currency)
- `transactions` - All transaction records
- `merchant_wallets` - Merchant wallets
- `credit_accounts` - BNPL accounts

**Features:**
- CQRS pattern with read model (`WalletReadService`)
- Distributed locking for balance operations
- XFF spoofing protection
- Redis-backed rate limiting

**Current API Routes:**
```
/wallet/*           - Consumer wallet operations
/merchant-wallet/*  - Merchant wallet operations
/api/corp/*         - CorpPerks routes
/api/credit/*       - Consumer credit (BNPL)
/internal/*         - Internal operations
```

### Hotel OTA Wallet (`hotel-ota-api`)

| Attribute | Value |
|-----------|-------|
| **Port** | 3000 |
| **Database** | PostgreSQL (Prisma) |
| **Tech Stack** | TypeScript, Express, Prisma |
| **Deploy** | https://hotel-ota-api.onrender.com |

**Database Tables:**
- `coinWallet` - User wallets (ota_coin_balance_paise)
- `coinTransaction` - Transaction records
- `hotelBrandCoinBalance` - Hotel-specific brand coins
- `earnRule` - Earn rate rules by campaign/hotel/tier

**Coin Types:**
- `ota_coin` - Platform-wide OTA coins
- `rez_coin` - Cross-platform ReZ coins (synced with ReZ wallet)
- `hotel_brand` - Hotel-specific brand coins

**Current Integration:**
```typescript
// hotel-ota-api/src/routes/wallet.routes.ts (line 22-24)
if (user?.rezUserId) {
  RezIntegrationService.syncRezWalletBalance(userId, user.rezUserId)
    .catch(err => console.warn('[WalletGet] REZ balance sync failed:', err.message));
}
```

### The Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE (ISOLATED)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────┐         ┌─────────────────┐              │
│   │   ReZ Wallet    │         │  Hotel OTA      │              │
│   │   (MongoDB)     │    X    │  Wallet (Prisma)│              │
│   │                 │         │                 │              │
│   │  - Balance      │         │  - ota_coin     │              │
│   │  - ReZ Coins    │         │  - rez_coin     │              │
│   │  - BNPL         │         │  - hotel_brand  │              │
│   └─────────────────┘         └─────────────────┘              │
│           │                           │                        │
│           └───────────────────────────┼────────────────────────┘
│                                       │                         │
│                              Manual/Event-Sync                   │
│                              (unreliable)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why They Need to Sync

### 1. User Experience Fragmentation

Users earning coins via Hotel OTA bookings cannot use them on the main ReZ platform (food ordering, merchant payments), and vice versa. This creates a fragmented loyalty experience.

**Example Flow (Current - Broken):**
1. User books hotel via StayOwn (Hotel OTA) - earns 500 ota_coins
2. User tries to use coins at a ReZ restaurant - **FAILS** (separate systems)
3. User must manually track balances across platforms

### 2. Business Logic Duplication

Both systems implement:
- Balance management
- Transaction recording
- Earn/burn rules
- Expiry handling
- Rate limiting

This leads to maintenance burden and potential inconsistencies.

### 3. Cross-Platform Transactions

Future features require unified balance:
- Pay at hotel restaurant using ReZ Coins
- Earn coins from ReZ food orders usable at hotels
- Corporate accounts managing both travel and dining expenses

### 4. Audit & Compliance

Separate ledgers make it difficult to:
- Track total user liability
- Reconcile inter-platform transfers
- Generate unified transaction history for compliance

### 5. Technical Debt

The current `syncRezWalletBalance` is fire-and-forget and unreliable:
```typescript
// hotel-ota-api/src/services/integrations/rez-integration.service.ts
RezIntegrationService.syncRezWalletBalance(userId, user.rezUserId)
  .catch(err => console.warn('[WalletGet] REZ balance sync failed:', err.message));
//                                                      ^^^^^^^^^^^^^^^^
//                                          Silent failures, no retry, no monitoring
```

---

## Proposed Sync Architectures

### Option A: Unified Wallet Service (RECOMMENDED)

**Concept:** Merge both wallet systems into a single service that handles all coin types.

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTION A: UNIFIED WALLET                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Unified Wallet Service                      │   │
│   │              (Single Source of Truth)                    │   │
│   │                                                          │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │   │
│   │  │ ReZ Coins  │  │ OTA Coins   │  │Brand Coins │      │   │
│   │  │ (global)   │  │ (platform) │  │ (hotel)    │      │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                    │
│              ┌───────────────┼───────────────┐                   │
│              ▼               ▼               ▼                   │
│       ┌──────────┐     ┌──────────┐    ┌──────────┐             │
│       │  ReZ     │     │ Hotel    │    │ Corp     │             │
│       │  Apps    │     │ OTA      │    │ Perks    │             │
│       └──────────┘     └──────────┘    └──────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Single source of truth for all balances
- Atomic cross-coin transactions
- Unified audit trail
- Easier compliance reporting
- No sync latency issues

**Cons:**
- Higher risk migration (both systems depend on it)
- Larger blast radius for bugs
- Requires coordinated deployment
- Hotel OTA loses independence

**Implementation Complexity:** High (6-8 weeks)

---

### Option B: Event-Driven Sync (PHASE 1 - Recommended for Migration)

**Concept:** Keep wallets independent but sync via event bus with eventual consistency.

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTION B: EVENT-DRIVEN SYNC                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────┐                    ┌─────────────────┐    │
│   │   ReZ Wallet    │                    │  Hotel OTA      │    │
│   │   (MongoDB)    │◄──────────────────►│  Wallet (Prisma)│    │
│   │                 │   Event Bus Sync   │                 │    │
│   └────────┬────────┘                    └────────┬────────┘    │
│            │                                      │              │
│            └────────────────┬───────────────────┘              │
│                             ▼                                    │
│                    ┌─────────────────┐                          │
│                    │   Event Bus     │                          │
│                    │   (Redis Pub/   │                          │
│                    │    Sub + Jobs)   │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Lower risk migration (incremental)
- Services remain loosely coupled
- Can rollback event sync without code changes
- Works with current architecture

**Cons:**
- Eventual consistency (not suitable for real-time balance checks)
- Requires idempotency handling
- More complex failure modes
- Dual-write risk during migration

**Implementation Complexity:** Medium (3-4 weeks)

---

### Option C: Read-Through Cache (Best for Reads)

**Concept:** Hotel OTA continues to own OTA coins; ReZ wallet provides read-through cache for ReZ coin balance.

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPTION C: READ-THROUGH CACHE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────┐                    ┌─────────────────┐    │
│   │   Hotel OTA     │                    │  ReZ Wallet     │    │
│   │   (Primary)     │──read-through──────│  (Cache +      │    │
│   │                 │◄──────invalidate───│   Authority)   │    │
│   │  - ota_coin     │                    │                │    │
│   │  - rez_coin     │                    │  - ReZ coins   │    │
│   │  - hotel_brand  │                    │    (authoritative)   │
│   └─────────────────┘                    └─────────────────┘    │
│                                                                   │
│   On read rez_coin:                                              │
│   1. Check local cache (Hotel OTA DB)                           │
│   2. If stale or miss, fetch from ReZ Wallet                    │
│   3. Cache result with TTL                                      │
│   4. Invalidate on ReZ Wallet writes                             │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:**
- Minimal changes to Hotel OTA
- Fast reads from local cache
- Clear ownership (ReZ = ReZ coins, OTA = OTA coins)
- Easy to implement

**Cons:**
- Cache invalidation complexity
- Stale reads possible during cache window
- Two systems to maintain
- Doesn't solve unified transaction history

**Implementation Complexity:** Low (1-2 weeks)

---

### Architecture Comparison Matrix

| Criteria | Option A: Unified | Option B: Event-Driven | Option C: Cache |
|----------|------------------|------------------------|-----------------|
| **Consistency** | Strong | Eventual | Eventual |
| **Risk** | High | Medium | Low |
| **Timeline** | 6-8 weeks | 3-4 weeks | 1-2 weeks |
| **Complexity** | High | Medium | Low |
| **Rollback** | Difficult | Easy | Easy |
| **Audit Trail** | Unified | Dual | Dual |
| **Cross-Coin TX** | Atomic | Requires Saga | N/A |
| **Recommended For** | New systems | Migration path | Quick fix |

---

## API Endpoints for Sync

### Sync Service API

Regardless of option chosen, we need standardized sync endpoints:

```typescript
// ============================================
// SYNC SERVICE ENDPOINTS
// ============================================

// Health & Status
GET  /health                    // Basic health
GET  /health/detailed          // Full dependency check
GET  /metrics                   // Prometheus metrics

// Balance Sync (for Option B/C)
GET  /api/sync/balance/:userId        // Get cross-platform balance
POST /api/sync/balance/:userId        // Trigger balance sync
GET  /api/sync/status/:userId         // Last sync status

// Transaction Sync (for Option B)
POST /api/sync/transaction             // Record cross-platform transaction
GET  /api/sync/transactions/:userId    // Get unified transaction history
POST /api/sync/reconcile               // Run reconciliation job

// Event Publishing (for Option B)
POST /api/events/wallet.credit         // Publish credit event
POST /api/events/wallet.debit          // Publish debit event
POST /api/events/wallet.transfer      // Publish transfer event

// Webhook Subscriptions (for Option B)
POST /api/webhooks/subscribe            // Subscribe to wallet events
DELETE /api/webhooks/:webhookId         // Unsubscribe
GET  /api/webhooks                      // List subscriptions

// Admin Endpoints
POST /api/admin/migrate                 // Migration operations
GET  /api/admin/sync-jobs              // List sync job status
POST /api/admin/retry-failed           // Retry failed syncs
```

### Request/Response Schemas

```typescript
// GET /api/sync/balance/:userId
interface SyncBalanceResponse {
  userId: string;
  syncedAt: string; // ISO timestamp
  balances: {
    platform: 'rez' | 'ota';
    coinType: string;
    balancePaise: number;
    lastModified: string;
    syncStatus: 'synced' | 'pending' | 'stale';
  }[];
  totalRezCoinsPaise: number; // Aggregated across platforms
}

// POST /api/sync/transaction
interface SyncTransactionRequest {
  source: {
    platform: 'rez' | 'ota';
    transactionId: string;
  };
  userId: string;
  type: 'credit' | 'debit' | 'transfer';
  coinType: string;
  amountPaise: number;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
}

interface SyncTransactionResponse {
  transactionId: string;
  syncedTransactionId: string; // On other platform
  status: 'synced' | 'pending' | 'failed';
  retryAt?: string;
}

// POST /api/events/wallet.credit
interface WalletCreditEvent {
  eventType: 'wallet.credit';
  timestamp: string;
  payload: {
    userId: string;
    coinType: string;
    amountPaise: number;
    source: 'earn' | 'refund' | 'transfer' | 'bonus';
    referenceId: string;
    metadata?: Record<string, unknown>;
  };
  signature: string; // HMAC for verification
}
```

### Internal Service API (for Option A)

```typescript
// Internal endpoints (x-internal-token required)

// Wallet Operations
POST   /internal/wallet/create
GET    /internal/wallet/:userId
POST   /internal/wallet/:userId/credit
POST   /internal/wallet/:userId/debit
POST   /internal/wallet/:userId/transfer
GET    /internal/wallet/:userId/transactions

// Balance Queries
GET    /internal/balance/:userId
GET    /internal/balance/:userId/all  // All coin types

// Sync Operations
POST   /internal/sync/push            // Push to subscriber
POST   /internal/sync/pull            // Pull from publisher
POST   /internal/sync/reconcile       // Reconcile balances

// Admin
GET    /internal/admin/sync-status
POST   /internal/admin/force-sync
```

---

## Data Flow Diagrams

### Option B: Event-Driven Sync Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EVENT-DRIVEN SYNC FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER ACTION → CREDIT                             2. PUBLISH EVENT         │
│  ┌─────────┐                                          ┌─────────────┐        │
│  │ User    │                                          │ Event Bus   │        │
│  │ earns   │──► Hotel OTA ──publish──►┤              │ (Redis)     │        │
│  │ coins   │     wallet.credit       │              │             │        │
│  └─────────┘                         │              └──────┬──────┘        │
│                                       │                     │               │
│                                       │                     ▼               │
│  4. PROCESS                        3. ROUTE          ┌─────────────┐        │
│  ┌─────────────┐              ┌─────────────┐      │ Subscribers │        │
│  │ ReZ Wallet  │◄────────────│  Job Queue  │◄─────│             │        │
│  │ Service     │   enqueue    │ (BullMQ)    │       │ - ReZ Wallet│        │
│  │             │              │             │       │ - Analytics │        │
│  └──────┬──────┘              └─────────────┘       │ - Notifs    │        │
│         │                                            └─────────────┘        │
│         │                                                                    │
│         ▼                                                                    │
│  5. APPLY CREDIT                                                           │
│  ┌─────────────────────────────────────────────┐                           │
│  │ 1. Acquire distributed lock (Redis)         │                           │
│  │ 2. Validate balance >= 0                    │                           │
│  │ 3. Credit balance in MongoDB                 │                           │
│  │ 4. Record transaction with idempotency key  │                           │
│  │ 5. Publish wallet.credited event             │                           │
│  │ 6. Release lock                              │                           │
│  └─────────────────────────────────────────────┘                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Option C: Read-Through Cache Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        READ-THROUGH CACHE FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  READ PATH                                          WRITE PATH                │
│  ─────────                                          ──────────               │
│                                                                              │
│  ┌─────────┐                                       ┌─────────────┐           │
│  │ Client  │                                       │ ReZ Wallet  │           │
│  │         │                                       │   writes    │           │
│  └────┬────┘                                       └──────┬──────┘           │
│       │                                                   │                  │
│       ▼                                                   ▼                  │
│  ┌─────────────────┐                              ┌──────────────┐            │
│  │ Hotel OTA API   │                              │ Publish to   │            │
│  │                 │                              │ Hotel OTA    │            │
│  │ Check cache:    │                              │ webhook/inbox│           │
│  │ - If hit: serve │                              │              │            │
│  │ - If miss: fetch│                              └──────┬───────┘            │
│  └────────┬────────┘                                     │                   │
│           │                                                ▼                   │
│           │ Check                              ┌──────────────────┐            │
│           ▼ TTL                               │ Hotel OTA        │            │
│  ┌─────────────────┐                        │                  │            │
│  │ Stale?          │──No──► Serve cache      │ Invalidate local │            │
│  │                 │                         │ rez_coin cache   │            │
│  │ If Yes:         │                          │ for userId      │            │
│  │ Call ReZ API    │──► Update cache ◄───────┘                  │            │
│  │ Get balance     │                          └─────────────────┘            │
│  └─────────────────┘                                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cross-Platform Transaction Flow (Option B with Saga)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CROSS-PLATFORM TRANSFER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User transfers 1000 ReZ Coins → Hotel OTA for hotel booking                 │
│                                                                              │
│  ┌─────────┐    1. Init    ┌────────────┐    2. Lock   ┌─────────────┐    │
│  │ Client  │──────────────►│   Saga     │─────────────►│  ReZ Wallet │    │
│  │         │               │ Orchestrator│              │   (lock)    │    │
│  └─────────┘               └──────┬─────┘              └─────────────┘    │
│                                   │                                          │
│                                   │ 3. Check balance                         │
│                                   ▼                                          │
│                              ┌────────────┐                                 │
│                              │  ReZ Wallet │                                 │
│                              │  balance >= │                                 │
│                              │  1000?      │                                 │
│                              └─────┬──────┘                                 │
│                              Yes  │  No                                     │
│                      ┌───────────┤  └────────┐                              │
│                      ▼                       ▼                              │
│               ┌────────────┐           ┌─────────────┐                       │
│               │ 4. Debit  │           │  COMPENSATE │                       │
│               │ ReZ Wallet│           │ (no action) │                       │
│               └─────┬──────┘           └─────────────┘                       │
│                     │                                                     │
│                     ▼                                                     │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │ 5. Publish transfer.out event                               │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                   │                                        │
│                                   ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │ 6. Hotel OTA receives event, credits local wallet          │             │
│  │    - Idempotency check (transactionId)                    │             │
│  │    - Record transaction                                     │             │
│  │    - Publish transfer.in event (confirmation)             │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                   │                                        │
│                                   ▼                                        │
│                              ┌────────────┐                                 │
│                              │ 7. Confirm │                                 │
│                              │ to Saga    │                                 │
│                              └────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Read-Through Cache (Quick Win - 2 weeks)

**Goal:** Enable Hotel OTA to read ReZ coin balance without full migration.

1. **Week 1: Infrastructure**
   ```bash
   # Deploy sync service
   cd rez-sync-service
   npm install
   npm run build

   # Add to Render
   # - Environment variables
   # - Health check endpoint
   ```

2. **Week 1: API Implementation**
   - Implement `GET /api/sync/balance/:userId` in ReZ Wallet
   - Implement cache layer in Hotel OTA
   - Add Redis for cache storage
   - Configure TTL (suggest: 5 minutes)

3. **Week 2: Testing & Deployment**
   - Integration tests
   - Load testing
   - Staged rollout (10% → 50% → 100%)

### Phase 2: Event-Driven Sync (3-4 weeks)

**Goal:** Enable real-time sync via events.

1. **Week 1: Event Bus Setup**
   - Configure Redis pub/sub channels
   - Define event schemas
   - Implement event publisher in ReZ Wallet

2. **Week 2: Subscriber Implementation**
   - Implement sync subscriber in Hotel OTA
   - Add BullMQ job queue for reliability
   - Implement idempotency handling

3. **Week 3: Error Handling & Retry**
   - Implement dead letter queue
   - Add retry logic with exponential backoff
   - Monitoring and alerting

4. **Week 4: Testing**
   - End-to-end integration tests
   - Chaos testing (kill events, restart services)
   - Performance benchmarking

### Phase 3: Unified Wallet (6-8 weeks) - Future

**Goal:** Complete migration to unified wallet.

1. **Week 1-2: Schema Design**
   - Design unified wallet schema
   - Plan data migration scripts
   - Define backward compatibility layer

2. **Week 3-4: Core Implementation**
   - Implement unified wallet service
   - Port business logic from both systems
   - Implement CQRS pattern

3. **Week 5-6: Migration**
   - Run parallel systems
   - Migrate existing data
   - Validate balances match

4. **Week 7-8: Cutover**
   - Staged migration of consumers
   - Monitor for issues
   - Rollback plan ready

### Implementation Checklist

```markdown
## Pre-Migration Checklist

- [ ] All services have health endpoints
- [ ] Redis is configured and accessible
- [ ] BullMQ is configured for job queue
- [ ] Monitoring/alerting is set up
- [ ] Database backups are enabled
- [ ] Rollback plan is documented
- [ ] Test users are provisioned
- [ ] Staged rollout plan is defined

## Post-Migration Checklist

- [ ] Balance reconciliation completed
- [ ] Transaction history is complete
- [ ] Rate limiting is configured
- [ ] Circuit breakers are tested
- [ ] Rollback procedure is tested
- [ ] Documentation is updated
- [ ] Team is trained
```

---

## Appendix: Migration Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA MIGRATION STRATEGY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Before Migration:                    After Option B Migration:              │
│                                                                              │
│  ┌──────────────────┐              ┌──────────────────┐                      │
│  │    ReZ Wallet    │              │    ReZ Wallet    │                      │
│  │    (MongoDB)     │              │    (MongoDB)     │                      │
│  │                  │              │                  │                      │
│  │  userId, balance │              │  userId, balance │                      │
│  │  transactions    │              │  transactions    │                      │
│  └────────┬─────────┘              │  + sync metadata │                      │
│           │                         └────────┬─────────┘                      │
│           │                                  │                                │
│           ▼                                  ▼                                │
│  ┌──────────────────┐              ┌──────────────────┐                      │
│  │   Hotel OTA     │              │   Hotel OTA     │                      │
│  │   (PostgreSQL)  │              │   (PostgreSQL) │                      │
│  │                  │              │                  │                      │
│  │  userId,        │              │  userId,        │                      │
│  │  ota_coin,      │              │  ota_coin,      │                      │
│  │  rez_coin (sync)│              │  rez_coin (sync)│                      │
│  │  hotel_brand    │              │  hotel_brand    │                      │
│  └──────────────────┘              └────────┬─────────┘                      │
│                                             │                                │
│                                             ▼                                │
│                                    ┌──────────────────┐                    │
│                                    │    Event Bus     │                    │
│                                    │    + Sync Jobs   │                    │
│                                    └──────────────────┘                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## References

- [ReZ Wallet Service](./SERVICES.md#rez-wallet-service)
- [Hotel OTA Integration](./COMPREHENSIVE-AUDIT-2026-05-01-FULL.md#hotel-stack)
- [Kong Gateway Config](./OPS-003-NO-API-GATEWAY.md)
- [Event Schemas](./EVENT-SCHEMAS.md)
- [Redis Auth Guide](./REDIS-AUTH-GUIDE.md)
