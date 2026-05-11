# ReZ Full App - Payment Services Audit Report

**Audit Date:** May 11, 2026
**Auditor:** Claude Code (FinTech Architect)
**Scope:** ReZ ecosystem payment infrastructure

---

## Executive Summary

| Component | Status | Risk Level |
|-----------|--------|------------|
| Razorpay Integration | PARTIAL | MEDIUM |
| Stripe Integration | BACKUP | LOW |
| Webhook Security | GOOD | LOW |
| API Keys | NEEDS REVIEW | HIGH |
| Payment Idempotency | GOOD | LOW |
| Refund Logic | GOOD | LOW |
| Settlement Config | GOOD | LOW |
| Ledger Entries | GOOD | LOW |
| Reconciliation | GOOD | LOW |
| Fraud Detection | WEAK | MEDIUM |

---

## 1. Razorpay Configuration

### 1.1 Environment Variables
| Variable | Location | Status |
|----------|----------|--------|
| `RAZORPAY_KEY_ID` | `.env.example:30`, `rez-payment-service/.env.example` | REQUIRED |
| `RAZORPAY_KEY_SECRET` | `.env.example:31`, `rez-payment-service/.env.example` | REQUIRED |
| `RAZORPAY_WEBHOOK_SECRET` | `.env.example:146` | REQUIRED |
| `RAZORPAY_CURRENCY` | Default: INR | OK |

### 1.2 Key Files
- **Main Service:** `/RABTUL-Technologies/rez-payment-service/src/`
- **Config:** `src/config/env.ts` - Zod schema validation
- **Models:** `src/models/Payment.ts`
- **Webhook Handler:** `src/webhookIdempotency.ts`

### 1.3 Configuration Validation
```typescript
// src/config/env.ts lines 102-109
const hasRazorpayId = !!process.env.RAZORPAY_KEY_ID;
const hasRazorpaySecret = !!process.env.RAZORPAY_KEY_SECRET;
if ((hasRazorpayId || hasRazorpaySecret) && (!hasRazorpayId || !hasRazorpaySecret)) {
  log.warn('[STARTUP] Razorpay partially configured...');
}
if (hasRazorpayId && hasRazorpaySecret && !process.env.RAZORPAY_WEBHOOK_SECRET) {
  log.warn('[STARTUP] RAZORPAY_WEBHOOK_SECRET not set — webhook verification will fail');
}
```

**Finding:** Partial configuration warning exists but does not block startup.

---

## 2. Stripe Configuration

### 2.1 Status
Stripe is mentioned as a **backup payment gateway** in the architecture but is not fully integrated in the main payment service.

### 2.2 Environment Variables
| Variable | Location | Status |
|----------|----------|--------|
| `STRIPE_WEBHOOK_SECRET` | `.env.example:147` | Placeholder only |

### 2.3 References Found
- `/RABTUL-Technologies/rez-payment-service/src/models/Payment.ts` - Supports `PaymentGateway` enum with stripe, razorpay, paypal
- `/packages/shared-types/rez-payment-service` - Type definitions include Stripe
- Archive references in `adBazaar.backup` with Stripe webhook endpoint

**Finding:** Stripe is defined in types but not actively implemented.

---

## 3. Webhook Security

### 3.1 Razorpay Webhook
**File:** `/RABTUL-Technologies/rez-payment-service/src/webhookIdempotency.ts`

| Feature | Implementation | Status |
|---------|-----------------|--------|
| Secret Validation | `RAZORPAY_WEBHOOK_SECRET` env var | OK |
| HMAC Verification | Server-side signature check | OK |
| Idempotency TTL | 72 hours (259200 seconds) | OK |
| Redis Storage | `webhook:processed:{eventId}` key | OK |

### 3.2 Other Webhook Implementations

| Service | File | Secrets |
|---------|------|---------|
| Reputation Service | `src/routes/webhook.routes.ts` | GOOGLE_WEBHOOK_SECRET, TRIPADVISOR_WEBHOOK_SECRET, BOOKINGCOM_WEBHOOK_SECRET |
| Delivery Service | `src/routes/aggregators.ts` | SWIGGY_WEBHOOK_SECRET, ZOMATO_WEBHOOK_SECRET |
| AdBazaar | `src/app/api/webhooks/razorpay/route.ts` | RAZORPAY_WEBHOOK_SECRET (HMAC-SHA256) |

### 3.3 Security Findings

**GOOD:**
- Webhook secrets loaded from environment variables
- Signature verification implemented via HMAC-SHA256
- Idempotency prevents duplicate processing
- Redis TTL set to 72 hours (matches Razorpay retry window)

**WARNING:** No webhook secret in some services triggers only a warning, not a failure.

---

## 4. API Keys (Test/Live)

### 4.1 Current Status
| Key Type | Status | Location |
|----------|--------|----------|
| `RAZORPAY_KEY_ID` | Placeholder in `.env.example` | Multiple locations |
| `RAZORPAY_KEY_SECRET` | Placeholder in `.env.example` | Multiple locations |
| Live Keys | FOUND in archived contexts | adBazaar Vercel env vars |

### 4.2 Exposure Concerns
**CRITICAL:** Live Razorpay keys found in `.claude-flow/data/auto-memory-store.json`:
```
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
```

**Recommendation:**
1. Rotate all exposed keys immediately
2. Remove keys from Claude memory files
3. Use only environment variables, never hardcode

### 4.3 Test vs Production Keys
```typescript
// Test keys use separate env vars
TEST_RAZORPAY_KEY_ID=rzp_test_xxxxx
TEST_RAZORPAY_KEY_SECRET=xxxxx
TEST_RAZORPAY_WEBHOOK_SECRET
```

---

## 5. Payment Idempotency

### 5.1 Implementation
**File:** `/RABTUL-Technologies/rez-payment-service/src/webhookIdempotency.ts`

```typescript
export class WebhookIdempotency {
  private ttl = 72 * 60 * 60; // 72 hours

  async handleWebhook(eventId: string, handler: () => Promise<void>) {
    if (await this.isProcessed(eventId)) {
      logger.info(`Webhook ${eventId} already processed, skipping`);
      return;
    }
    await handler();
    await this.markProcessed(eventId);
  }
}
```

### 5.2 Order Idempotency
**File:** `/RABTUL-Technologies/rez-order-service/src/httpServer.ts`

```typescript
// Unique compound index: { user: 1, clientIdempotencyKey: 1 }
const idempotencyKey = (headerKeyStr ?? bodyKey ?? '').trim() || undefined;
let lockKey = `order:lock:${rawUserId}:${idempotencyKey || 'no-key'}`;
```

### 5.3 Payment Model Index
```typescript
// Unique sparse index for orchestrator idempotency
PaymentSchema.index(
  { 'metadata.orchestratorIdempotencyKey': 1 },
  { sparse: true, unique: true }
);
```

### 5.4 Findings
| Aspect | Status |
|--------|--------|
| Webhook deduplication | GOOD - Redis with 72h TTL |
| Order idempotency | GOOD - Compound unique index |
| Orchestrator idempotency | GOOD - Sparse unique index |
| Refund idempotency | GOOD - razorpay_refund_id uniqueness |

---

## 6. Refund Logic

### 6.1 Refund Service
**File:** `/rez-refund-service/src/services/refundService.ts`

### 6.2 Refund States
```
PENDING → APPROVED → PROCESSING → COMPLETED
         ↘ REJECTED
         ↘ CANCELLED
         ↘ FAILED
```

### 6.3 Refund Reasons
- `DUPLICATE_CHARGE`
- `FRAUDULENT_TRANSACTION`
- `PRODUCT_NOT_RECEIVED`
- `PRODUCT_UNSATISFACTORY`
- `SERVICE_NOT_RECEIVED`
- `SUBSCRIPTION_CANCELLED`
- `ORDER_CANCELLED`
- `OTHER`

### 6.4 Refund Validation
```typescript
// Amount validation
if (refundAmount > paymentStatus.refundableAmount) {
  return { success: false, error: 'Refund amount exceeds refundable amount' };
}

// refundedAmount precision (2 decimal places)
refundedAmount: {
  type: Number,
  set: (v: number) => Math.round(v * 100) / 100,
}

// Never exceeds original amount
if (doc.refundedAmount && doc.refundedAmount > doc.amount) {
  return next(new Error(`Refund amount exceeds payment amount`));
}
```

### 6.5 Findings
| Aspect | Status |
|--------|--------|
| State machine | GOOD - Pre-save validation |
| Amount validation | GOOD - Precision and bounds |
| Duplicate check | GOOD - Pending/approved check |
| Idempotency | GOOD - razorpay_refund_id uniqueness |

---

## 7. Settlement Configuration

### 7.1 Settlement Flow
**File:** `/RABTUL-Technologies/rez-order-service/src/worker.ts`

```typescript
// Settlement trigger on delivery
const settlementEventId = `settlement:${event.payload.orderId}`;

// HIGH-08 FIX: Validate settlement amount upfront
if (!isValidAmount(settlementAmount)) {
  logger.error('[Worker] Settlement validation failed: invalid amount');
  return;
}
if (settlementAmount > MAX_SETTLEMENT_LIMIT) {
  logger.error('[Worker] Settlement validation failed: amount exceeds maximum');
  return;
}

// Deterministic jobId prevents duplicate settlements
const jobId = settlementEventId;
```

### 7.2 Settlement Validation
| Check | Status |
|-------|--------|
| Amount > 0 | Required |
| Amount <= MAX_LIMIT | Required |
| Deterministic jobId | OK |
| Settlement event emission | WALLET_SERVICE_URL required |

### 7.3 Wallet Settlement Emission
**File:** `/RABTUL-Technologies/rez-wallet-service/src/worker.ts`

```typescript
// MISS-02 / WAL-020 FIX: Emit settlement event with retry backoff
async function emitSettlementEvent(data: {...}) {
  const response = await fetch(`${monolithUrl}/api/internal/payments/settlement-notify`, {
    headers: { 'Authorization': `Bearer ${INTERNAL_SERVICE_TOKEN}` }
  });
}
```

---

## 8. Ledger Entries

### 8.1 Transaction Audit Log
**File:** `/RABTUL-Technologies/rez-payment-service/src/models/TransactionAuditLog.ts`

### 8.2 Ledger Balance Computation
**File:** `/RABTUL-Technologies/rez-wallet-service/scripts/reconcileWallets.ts`

```typescript
async function computeLedgerBalance(userId: Types.ObjectId): Promise<number> {
  const result = await CoinTxModel.aggregate([
    { $match: { user: userId, coinType: 'rez' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return result[0]?.total ?? 0;
}
```

### 8.3 CoinTransaction Fields
- `user` - User reference
- `type` - 'credit' | 'debit'
- `coinType` - 'rez' (main coin type)
- `amount` - Transaction amount

### 8.4 Findings
| Aspect | Status |
|--------|--------|
| Immutable ledger | TransactionAuditLog model |
| Balance computation | Aggregation pipeline |
| Reconciliation | Script with threshold (0.01 coins) |

---

## 9. Reconciliation

### 9.1 Reconciliation Script
**File:** `/RABTUL-Technologies/rez-wallet-service/scripts/reconcileWallets.ts`

```typescript
// Configuration
const DISCREPANCY_THRESHOLD = parseFloat(process.env.RECONCILE_THRESHOLD ?? '0.01');
const BATCH_SIZE = parseInt(process.env.RECONCILE_BATCH_SIZE ?? '200', 10);
const DRY_RUN = process.argv.includes('--dry-run');

// Process
for (wallet of wallets) {
  const ledgerBalance = await computeLedgerBalance(userId);
  const diff = Math.abs(walletBalance - ledgerBalance);
  if (diff > DISCREPANCY_THRESHOLD) {
    // Flag discrepancy
  }
}
```

### 9.2 Reconciliation Routes
**File:** `/RABTUL-Technologies/rez-wallet-service/src/routes/reconciliationRoutes.ts`

Protected by internal auth middleware.

### 9.3 Findings
| Aspect | Status |
|--------|--------|
| Balance verification | GOOD - wallet vs ledger comparison |
| Threshold tolerance | OK - 0.01 coins default |
| Batch processing | OK - 200 wallets per batch |
| Dry-run mode | OK - Report only, no writes |
| Internal auth required | GOOD - X-Internal-Token |

---

## 10. Fraud Detection

### 10.1 Fraud Middleware
**File:** `/RABTUL-Technologies/rez-order-service/src/middleware/fraud.middleware.ts`

```typescript
interface FraudSignal {
  userId: string;
  action: string;
  ip: string;
  deviceId: string;
  timestamp: number;
}

// Velocity check: 10 orders in 60 seconds = suspicious
export function checkVelocity(userId: string): boolean {
  const count = velocityCache.get(key) || 0;
  if (count > 10) return false; // blocked
  velocityCache.set(key, count + 1);
  setTimeout(() => velocityCache.delete(key), 60000);
  return true;
}

// Impossible travel: speed > 500km/h
export async function checkImpossibleTravel(order: Order): Promise<boolean> {
  const speed = distance / (timeDiff / 3600000);
  return speed < 500;
}
```

### 10.2 REE Client Fraud Check
**File:** `/RABTUL-Technologies/rez-wallet-service/src/utils/reeClient.ts`

```typescript
async checkFraud(
  entityType: 'user' | 'merchant',
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<{ isFraud: boolean; reason?: string }> {
  const result = await this.post('/query/fraud', { entityType, entityId, action, metadata });
  return { isFraud: result.isFraud };
}
```

### 10.3 Device Risk Assessment
**File:** `/RABTUL-Technologies/rez-auth-service/src/routes/authRoutes.ts`

```typescript
let deviceRisk: 'trusted' | 'new' | 'suspicious' = 'new';
deviceRisk = await deviceService.assessRisk(userId, deviceHash);
```

### 10.4 Verification Engine Fraud Detection
**File:** `/RABTUL-Technologies/rez-scheduler-service/rez-karma-service/src/engines/verificationEngine.ts`

```typescript
export async function detectFraudAnomalies(bookingId: string): Promise<FraudAlert[]> {
  const alerts: FraudAlert[] = [];
  // Detection logic...
  return alerts;
}
```

### 10.5 Findings

| Aspect | Status | Gap |
|--------|--------|-----|
| Velocity check | WEAK | In-memory only, lost on restart |
| Impossible travel | OK | Haversine calculation implemented |
| Device fingerprint | STUB | Returns true always |
| REE fraud service | GOOD | External service integration |
| Verification anomalies | OK | Booking fraud detection |

**WEAKNESS:** Fraud signals stored in-memory Map, not persistent storage.

---

## 11. Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Payment Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Client    │───▶│   API Gateway   │───▶│   Payment    │ │
│  │   Apps      │    │                 │    │   Service    │ │
│  └─────────────┘    └─────────────────┘    │              │ │
│                                              │ razorpay.ts  │ │
│  ┌─────────────┐    ┌─────────────────┐    │ webhook.ts   │ │
│  │   Razorpay  │───▶│   Webhook       │───▶│ idempotency  │ │
│  │   Gateway   │    │   Handler       │    └──────────────┘ │
│  └─────────────┘    └─────────────────┘           │          │
│                                                      │          │
│  ┌─────────────┐    ┌─────────────────┐            ▼          │
│  │   Refund    │◀───│   Refund        │◀───┌──────────────┐ │
│  │   Service   │    │   Service       │    │   MongoDB    │ │
│  └─────────────┘    └─────────────────┘    │   Payments   │ │
│                                             └──────────────┘ │
│  ┌─────────────┐    ┌─────────────────┐                     │
│  │   Wallet    │◀───│   Settlement    │                     │
│  │   Service   │    │   Trigger       │                     │
│  └─────────────┘    └─────────────────┘                     │
│                                                              │
│  ┌─────────────┐    ┌─────────────────┐                     │
│  │   Redis     │    │   Idempotency   │                     │
│  │   Cache     │───▶│   & Rate Limit  │                     │
│  └─────────────┘    └─────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Risk Matrix

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| API Key Exposure | CRITICAL | MEDIUM | Rotate keys, remove from memory |
| Partial Razorpay Config | HIGH | MEDIUM | Block startup if incomplete |
| Fraud Memory Loss | MEDIUM | HIGH | Persist to Redis/MongoDB |
| Webhook Secret Missing | MEDIUM | LOW | Fail-closed in production |
| Duplicate Settlement | LOW | LOW | Deterministic jobId implemented |

---

## 13. Recommendations

### Critical (Immediate Action Required)
1. **Rotate Razorpay API keys** - Live keys found in memory files
2. **Remove exposed secrets** from `.claude-flow/data/` files

### High Priority
3. **Add startup validation** - Block if Razorpay partially configured in production
4. **Persist fraud signals** - Move from in-memory Map to Redis

### Medium Priority
5. **Implement Stripe webhook** - For international payments backup
6. **Add more fraud checks** - Device fingerprint is a stub
7. **Secret scanning** - Add pre-commit hooks to detect secrets

### Low Priority
8. **Reconciliation automation** - Schedule wallet reconciliation
9. **Monitoring alerts** - Settlement failures and refund spikes

---

## 14. Service Locations

| Service | Path |
|---------|------|
| Payment Service | `/RABTUL-Technologies/rez-payment-service/` |
| Refund Service | `/rez-refund-service/` |
| Wallet Service | `/RABTUL-Technologies/rez-wallet-service/` |
| Order Service | `/RABTUL-Technologies/rez-order-service/` |
| Shared Types | `/packages/shared-types/rez-payment-service/` |

---

## 15. Test Coverage

| Test | Location |
|------|----------|
| Webhook Tests | `src/__tests__/webhook.test.ts` |
| Payment Tests | `src/__tests__/payment.test.ts` |
| State Machine Tests | `src/__tests__/paymentStateMachine.test.ts` |
| Idempotency Tests | Integration in webhook.test.ts |
| Reconciliation Tests | `src/__tests__/reconciliationPagination.test.ts` |

---

**End of Report**
