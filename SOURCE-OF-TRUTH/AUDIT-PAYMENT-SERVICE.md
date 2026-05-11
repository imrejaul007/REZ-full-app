# ReZ Payment Service Audit Report

**Service:** rez-payment-service
**Audited:** 2026-05-05
**Version:** 1.0.0

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Features](#features)
3. [Razorpay Integration](#razorpay-integration)
4. [UPI Support](#upi-support)
5. [Service-to-Service Connections](#service-to-service-connections)
6. [Security Features](#security-features)
7. [Issues and Bugs Found](#issues-and-bugs-found)
8. [Architecture Notes](#architecture-notes)

---

## Service Overview

The rez-payment-service is a Node.js/Express backend service that handles payment processing, wallet operations, and transaction reconciliation for the ReZ Platform. It integrates with Razorpay as the primary payment gateway and manages a MongoDB-based payment ledger with Redis for caching and job queuing.

**Tech Stack:**
- Runtime: Node.js >= 20.0.0
- Framework: Express.js
- Database: MongoDB (Mongoose)
- Cache/Queue: Redis (IORedis, BullMQ)
- Payment Gateway: Razorpay
- Language: TypeScript
- Observability: Prometheus metrics, Sentry, Winston logging

---

## Features

### Feature 1: Payment Initiation

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Payment Initiation |
| **Description** | Creates a payment record in MongoDB and generates a Razorpay order for the client to complete payment via checkout. Supports idempotency to prevent duplicate initiations. |
| **Razorpay/UPI Connection** | Creates Razorpay orders via `razorpay.orders.create()`. Converts rupees to paise (x100). Supports UPI, card, wallet, netbanking payment methods. |
| **Other Service Connections** | - Queries orders collection in MongoDB for authoritative amount verification<br>- Calls razorpayService.createOrder() |
| **Endpoint** | `POST /pay/initiate` |
| **Rate Limit** | 20 requests/minute per user |
| **Limits** | Max amount: 500,000 INR |

**Payment Purposes Supported:**
- `wallet_topup` (max 100,000 INR)
- `order_payment`
- `event_booking`
- `financial_service` (max 500,000 INR)
- `other`

---

### Feature 2: Payment Capture

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Payment Capture |
| **Description** | Captures payment after Razorpay Checkout completes. Verifies HMAC signature, updates payment status to 'completed', and triggers wallet credit. Implements replay prevention via Razorpay payment ID deduplication in Redis. |
| **Razorpay/UPI Connection** | Verifies signature via `razorpayService.verifySignature()` using HMAC-SHA256. |
| **Other Service Connections** | - Enqueues wallet credit job via BullMQ<br>- Updates Payment document in MongoDB<br>- Creates audit log entry<br>- Calls profileIntegration for user LTV tracking<br>- Sends payment event to REZ Mind |
| **Endpoint** | `POST /pay/capture` |
| **Replay Protection** | Redis SET NX with 25-hour TTL on `pay:nonce:{razorpayPaymentId}` |

---

### Feature 3: Webhook Processing

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Razorpay Webhook Handler |
| **Description** | Receives and processes payment status updates from Razorpay. Verifies webhook signature, deduplicates events, and updates payment status. |
| **Razorpay/UPI Connection** | Verifies webhook signature via `razorpayService.verifyWebhookSignature()`. Events: `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed` |
| **Other Service Connections** | - Updates Payment documents in MongoDB<br>- Enqueues wallet credit jobs<br>- Emits refund events to monolith via BullMQ<br>- Reconciliation worker syncs status to monolith |
| **Endpoint** | `POST /pay/webhook/razorpay` |
| **Security** | Webhook signature verification, Redis connectivity check before processing, rate limiting (100 req/min per IP) |

---

### Feature 4: Refund Processing

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Payment Refund |
| **Description** | Processes refunds for completed payments through Razorpay. Three-phase operation: atomic reservation, Razorpay API call, status update with atomic reversal on failure. Supports full and partial refunds. |
| **Razorpay/UPI Connection** | Calls `razorpay.payments.refund()` with amount in paise. |
| **Other Service Connections** | - Updates Payment document in MongoDB with transaction<br>- Creates audit log entry<br>- Emits refund event to monolith |
| **Endpoint** | `POST /pay/refund` |
| **Rate Limit** | 5 requests/minute per user |
| **Required Role** | merchant, admin, super_admin, or operator |

---

### Feature 5: BNPL (Buy Now Pay Later)

| Attribute | Details |
|-----------|---------|
| **Feature Name** | BNPL Payment |
| **Description** | Handles BNPL payments by checking eligibility and creating BNPL records. Skips Razorpay for BNPL flow. |
| **Razorpay/UPI Connection** | None - BNPL bypasses Razorpay |
| **Other Service Connections** | - Calls wallet service `/internal/credit/check-eligibility`<br>- Calls wallet service `/internal/credit/apply`<br>- Creates payment record in MongoDB |
| **Endpoint** | Part of `POST /pay/initiate` with `paymentMethod: 'bnpl'` |

---

### Feature 6: Wallet Credit

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Wallet Credit After Payment |
| **Description** | Credits user wallet with coins equal to payment amount after successful capture. Uses BullMQ for reliable delivery with retry logic. |
| **Razorpay/UPI Connection** | None |
| **Other Service Connections** | - Calls wallet service `/internal/credit`<br>- Emits coins:awarded Socket.IO event to monolith<br>- Lost coins recovery worker ensures credits |
| **Queues** | `wallet-credit` (BullMQ) with 5 retry attempts, exponential backoff |

---

### Feature 7: Lost Coins Recovery

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Lost Coins Recovery Worker |
| **Description** | Background worker that scans for payments where `walletCredited=true` but no BullMQ job was successfully enqueued. Re-enqueues credits and verifies via CoinTransaction collection. |
| **Razorpay/UPI Connection** | None |
| **Other Service Connections** | - Queries Payment collection in MongoDB<br>- Calls creditWalletAfterPayment() from paymentService<br>- Verifies credits via `cointransactions` collection |
| **Schedule** | Every 5 minutes |
| **Safety** | Max 3 recovery attempts per payment, 24-hour lookback window |

---

### Feature 8: Transaction Reconciliation

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Payment Reconciliation |
| **Description** | Cron job that reconciles stuck payments by querying Razorpay for actual status. Also expires payments stuck in pending for >1 hour. |
| **Razorpay/UPI Connection** | Calls `razorpay.payments.fetch()` to verify payment status |
| **Other Service Connections** | - Updates Payment documents in MongoDB<br>- Triggers wallet credit for recovered payments<br>- Creates audit log entries |
| **Schedule** | Every 15 minutes (reconciliation), every 5 minutes (expiration) |

---

### Feature 9: Monolith Sync

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Payment Status Sync to Monolith |
| **Description** | Syncs payment status changes back to the monolith backend via BullMQ queue with retry logic. |
| **Razorpay/UPI Connection** | None |
| **Other Service Connections** | - Calls monolith `/api/internal/payments/webhook-sync`<br>- Uses `monolith-sync` BullMQ queue |
| **Queue** | `monolith-sync` with 5 retry attempts |

---

### Feature 10: Merchant Settlements

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Merchant Settlement Reporting |
| **Description** | Retrieves paginated list of completed payments for a merchant, used for settlement reporting. |
| **Razorpay/UPI Connection** | None |
| **Other Service Connections** | - Queries Payment collection in MongoDB by merchantId |
| **Endpoint** | `GET /pay/merchant/settlements` |
| **IDOR Protection** | Merchant ID from JWT verified against queried merchantId |

---

### Feature 11: Payment Regularity API

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Payment Regularity for Credit Scoring |
| **Description** | Returns the fraction of payments completed on-time over trailing 90 days. Used by credit scoring service for merchant risk assessment. |
| **Razorpay/UPI Connection** | None |
| **Other Service Connections** | - Called by rez-wallet-service creditScore.ts<br>- Queries Payment collection in MongoDB |
| **Endpoint** | `GET /internal/merchants/:merchantId/payment-regularity` |
| **Response** | `onTimeRate` (0.0-1.0), totalPayments, completedPayments |

---

### Feature 12: Dead Letter Queue (DLQ) Administration

| Attribute | Details |
|-----------|---------|
| **Feature Name** | DLQ Admin API |
| **Description** | Admin interface for inspecting and managing failed BullMQ jobs in wallet-credit and monolith-sync queues. |
| **Razorpay/UPI Connection** | None |
| **Other Service Connections** | - Direct BullMQ queue access |
| **Endpoints** | `GET /admin/dlq`, `GET /admin/dlq/:queue/jobs`, `POST /admin/dlq/:queue/jobs/:jobId/retry`, `POST /admin/dlq/:queue/retry-all`, `DELETE /admin/dlq/:queue/jobs/:jobId` |
| **Required Auth** | X-Internal-Token header |

---

### Feature 13: Prometheus Metrics

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Metrics Collection |
| **Description** | Exposes Prometheus-compatible metrics for HTTP requests, BullMQ jobs, payment operations, webhook events, wallet operations, and reconciliation. |
| **Razorpay/UPI Connection** | Tracks Razorpay webhook events and payment operations |
| **Other Service Connections** | Tracks all BullMQ queue operations |
| **Endpoint** | `GET /metrics` |

---

### Feature 14: Health Checks

| Attribute | Details |
|-----------|---------|
| **Feature Name** | Health Server |
| **Description** | Separate HTTP server on dedicated port for liveness and readiness probes. Checks MongoDB and Redis connectivity. |
| **Razorpay/UPI Connection** | None |
| **Other Service Connections** | - Pings MongoDB<br>- Pings Redis |
| **Endpoints** | `/health/live`, `/health/ready`, `/health`, `/healthz` |
| **Ports** | Main: 4001, Health: 4101 (configurable) |

---

### Feature 15: NBFC Partner Integration (Stub)

| Attribute | Details |
|-----------|---------|
| **Feature Name** | NBFC Partner Abstraction |
| **Description** | Abstraction layer for NBFC (Non-Banking Financial Company) partners for credit facilities. Currently stub implementation. |
| **Razorpay/UPI Connection** | None |
| **Other Service Connections** | None - stub only |
| **Methods** | applyForCredit(), checkStatus(), disburse() |

---

## Razorpay Integration

### Order Creation
```
razorpay.orders.create({
  amount: amount * 100,  // rupees to paise
  currency: 'INR',
  receipt: receipt,
  notes: notes
})
```

### Payment Capture
- Webhook-driven: Razorpay calls `/pay/webhook/razorpay` on payment events
- Client-driven: Client calls `/pay/capture` after checkout with HMAC signature

### Signature Verification
- Client signature: HMAC-SHA256 of `${orderId}|${paymentId}` with `RAZORPAY_KEY_SECRET`
- Webhook signature: HMAC-SHA256 of raw request body with `RAZORPAY_WEBHOOK_SECRET`
- Both use `crypto.timingSafeEqual()` to prevent timing attacks

### Refund Processing
```
razorpay.payments.refund({
  amount: amount * 100,
  notes: { reason, paymentId },
  speed: 'normal'
})
```

---

## UPI Support

UPI is supported as a payment method through Razorpay. The `paymentMethod` field accepts:
- `upi`

When a user selects UPI at checkout, Razorpay handles the UPI flow (collect request, UPI intent, etc.) and sends webhook notifications back to the service.

---

## Service-to-Service Connections

### Wallet Service (rez-wallet-service)
| Endpoint | Purpose |
|----------|---------|
| `POST /internal/credit` | Credit coins to user wallet |
| `POST /internal/credit/check-eligibility` | Check BNPL eligibility |
| `POST /internal/credit/apply` | Create BNPL record |
| `GET /internal/balance` | (not called from payment service) |

**Env Var:** `WALLET_SERVICE_URL`

### Monolith Backend
| Endpoint | Purpose |
|----------|---------|
| `POST /api/internal/payments/webhook-sync` | Sync payment status |
| `POST /api/internal/payments/refund-notify` | Refund event notification |
| `POST /api/internal/payments/coins-awarded-notify` | Wallet credit notification |

**Env Var:** `MONOLITH_URL`

### Auth Service (rez-auth-service)
| Endpoint | Purpose |
|----------|---------|
| `POST /internal/profile/transaction` | Record payment for LTV tracking |

**Env Var:** `REZ_AUTH_SERVICE_URL`

### REZ Mind Platform
| Endpoint | Purpose |
|----------|---------|
| `POST /webhook/merchant/payment` | Payment event for analytics |

**Env Var:** `REZ_MIND_URL`

### AI/ML Platform
| Endpoint | Purpose |
|----------|---------|
| Various | ML model inference (referenced in env) |

**Env Var:** `REZ_AI_URL`, `REZ_EVENTS_URL`, `REZ_INTELLIGENCE_URL`

---

## Security Features

### Authentication
- **JWT Auth:** Bearer token verification with HS256 algorithm constraint
- **Internal Auth:** HMAC-SHA256 token verification with scoped tokens per service
- **Redis Blacklist:** Token revocation checking on every request

### Rate Limiting
- General: 300 req/15 min per IP
- Payment: 20 req/min per user
- Sensitive (refund): 5 req/min per user
- Webhook: 100 req/min per IP

### Input Validation
- Zod schemas for all request validation
- MongoDB injection prevention via `express-mongo-sanitize`
- URL-encoded body limit: 100kb
- JSON body limit: 1mb

### XSS Protection
- Helmet.js middleware enabled
- CORS with configurable origins

### Replay Prevention
- Razorpay payment ID deduplication in Redis (25-hour TTL)
- Webhook event ID deduplication in Redis (24-hour TTL)
- Idempotency keys for payment initiation

### Security Headers
- Helmet.js enabled
- W3C traceparent propagation for request tracing

### Fail-Closed Design
- Redis unavailable: Reject payments (fail-closed)
- Auth token revocation check failure: Return 503 (fail-closed)

---

## Issues and Bugs Found

### CRITICAL Issues

#### 1. F-01: Lost Coins Due to BullMQ Enqueue Failure
**Status:** FIXED (with recovery worker)
**Description:** In capturePayment() and handleWebhookCaptured(), MongoDB `walletCredited=true` was set inside a transaction, then BullMQ job enqueue happened AFTER commit. If enqueue failed, coins were permanently lost.
**Fix:** Recovery worker (`lostCoinsRecoveryWorker.ts`) scans every 5 minutes for stuck payments and re-enqueues. Redis tracking keys (`pay-credit-queued:{paymentId}`) with states: pending/enqueued/failed.
**File:** `src/jobs/lostCoinsRecoveryWorker.ts`

#### 2. PAY-002: Silent Wallet Credit Failure
**Status:** FIXED
**Description:** Internal wallet credit endpoint was setting `walletCredited=true` even when the wallet service returned 4xx/5xx, causing silent coin loss.
**Fix:** Only mark `walletCredited=true` after HTTP 2xx confirmation from wallet service.
**File:** `src/routes/paymentRoutes.ts` (internalWalletCreditHandler)

#### 3. BE-PAY-009: Fake Webhook Injection
**Status:** FIXED
**Description:** Webhook handler was crediting wallets without verifying payment was actually captured by Razorpay.
**Fix:** Now calls `razorpay.payments.fetch()` to verify payment status before crediting.
**File:** `src/services/webhookService.ts`

#### 4. BE-PAY-002: Replay Protection Fail-Open
**Status:** FIXED
**Description:** Redis unavailable for payment nonce check was failing open, allowing duplicate captures.
**Fix:** Now fails closed in ALL environments when Redis unavailable.
**File:** `src/routes/paymentRoutes.ts` (isReplayedPaymentId)

### HIGH Issues

#### 5. BAK-CROSS-021: Race Condition on Wallet Credits
**Status:** FIXED
**Description:** Concurrency >1 on wallet-credit queue risked double-crediting on balance updates.
**Fix:** concurrency=1 enforced on BullMQ worker.
**File:** `src/worker/index.ts`

#### 6. BE-PAY-017: IDOR on Merchant Settlements
**Status:** FIXED
**Description:** Merchant could query another merchant's settlement history.
**Fix:** Added verification that queried merchantId matches authenticated merchant from JWT.
**File:** `src/routes/paymentRoutes.ts` (settlementsHandler)

#### 7. PAY-004: Refund Reversal Not Atomic
**Status:** FIXED
**Description:** If Razorpay refund API failed, DB reservation reversal was not in a transaction.
**Fix:** Wrapped reversal in `session.withTransaction()`.
**File:** `src/services/refundService.ts`

#### 8. BAK-CROSS-022: Fire-and-Forget Monolith Sync
**Status:** FIXED
**Description:** Webhook sync to monolith was fire-and-forget without retry.
**Fix:** Now uses BullMQ `monolith-sync` queue with exponential backoff.
**File:** `src/services/paymentService.ts` (enqueueMonolithSync)

### MEDIUM Issues

#### 9. PAY-007/PAY-008: Missing TypeScript Types
**Status:** FIXED
**Description:** PaymentMetadata and LeanPayment interfaces were missing, causing `any` types.
**Fix:** Added explicit interfaces in `paymentService.ts`.
**Files:** `src/services/paymentService.ts`

#### 10. PAY-009: Redis Config Accessed via any-type Cast
**Status:** FIXED
**Description:** `redis.options` was accessed via `(redis as any).options` to get host/port.
**Fix:** Exported `redisHost` and `redisPort` directly from `config/redis.ts`.
**File:** `src/config/redis.ts`

#### 11. PAY-HMAC-001: Default HMAC Fallback Key
**Status:** FIXED
**Description:** If no internal token configured, fell back to literal string 'fallback'.
**Fix:** Now fails closed (503) if neither auth mechanism is configured.
**File:** `src/middleware/internalAuth.ts`

#### 12. BAK-CROSS-015: XFF Spoofing
**Status:** FIXED
**Description:** X-Forwarded-For header trusted blindly, allowing IP spoofing.
**Fix:** Validates outermost XFF IP is not loopback/private address.
**File:** `src/index.ts`

### LOW Issues

#### 13. BUG-002: Duplicate Payment State Machine Definitions
**Status:** FIXED
**Description:** Payment model and webhook routes had duplicate transition definitions that could drift.
**Fix:** Created shared `paymentTransitions.ts` config file.
**File:** `src/config/paymentTransitions.ts`

#### 14. PAY-011: Redis Unavailable Fail-Open on Auth
**Status:** FIXED
**Description:** Redis unavailable during token blacklist check was failing open.
**Fix:** Now returns 503 AUTH_SERVICE_UNAVAILABLE.
**File:** `src/middleware/auth.ts`

#### 15. PAY-010: Incomplete Razorpay Types
**Status:** FIXED
**Description:** Razorpay TypeScript types incomplete for `.payments` sub-interface.
**Fix:** Added typed `RazorpayPayments` interface wrapper.
**File:** `src/services/razorpayService.ts`

---

## Architecture Notes

### State Machine
Payments follow a strict state machine with defined transitions:
- `pending` -> processing, cancelled, expired
- `processing` -> completed, failed
- `completed` -> refund_initiated
- `failed` -> pending (retry)
- `refund_initiated` -> refund_processing
- `refund_processing` -> refunded, refund_failed
- `refund_failed` -> refund_initiated (retry)

### Idempotency Keys
1. **orchestratorIdempotencyKey**: Prevents duplicate payment initiation
2. **idempotencyKey**: Alternative idempotency key for initiation
3. **pay-credit-{paymentId}**: BullMQ job ID prevents duplicate wallet credits
4. **webhook:event:{eventId}**: Redis key prevents duplicate webhook processing

### BullMQ Queues
| Queue | Purpose | Concurrency | Retries |
|-------|---------|-------------|---------|
| wallet-credit | Wallet coin credits | 1 | 5 (exponential) |
| monolith-sync | Payment status sync to monolith | 3 | 5 (exponential) |

### Database Indexes
Key indexes for performance:
- `status, walletCredited, walletCreditRecoveryAttempted, completedAt` (recovery scan)
- `metadata.razorpayOrderId` (webhook lookups)
- `metadata.merchantId, status, completedAt` (settlement queries)
- `metadata.orchestratorIdempotencyKey` (idempotency, sparse unique)

### Environment Variables Summary
| Variable | Required | Description |
|----------|----------|-------------|
| MONGODB_URI | Yes | MongoDB connection |
| REDIS_URL | Yes | Redis connection |
| JWT_SECRET | Yes | JWT verification |
| INTERNAL_SERVICE_TOKENS_JSON | Yes | Internal service auth |
| RAZORPAY_KEY_ID | No | Razorpay API key |
| RAZORPAY_KEY_SECRET | No | Razorpay API secret |
| RAZORPAY_WEBHOOK_SECRET | No | Webhook signature verification |
| WALLET_SERVICE_URL | No | Wallet service endpoint |
| MONOLITH_URL | No | Monolith backend endpoint |
| REZ_AUTH_SERVICE_URL | Yes | Auth service for profile updates |
| SENTRY_DSN | No | Error tracking |

---

## File Structure

```
rez-payment-service/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── worker.ts                   # BullMQ wallet-credit consumer
│   ├── health.ts                   # Health check server
│   ├── metrics.ts                  # Prometheus metrics
│   ├── config/
│   │   ├── index.ts
│   │   ├── env.ts                 # Zod validation
│   │   ├── logger.ts              # Winston logging
│   │   ├── mongodb.ts             # MongoDB connection
│   │   ├── redis.ts              # Redis connection
│   │   └── paymentTransitions.ts  # State machine config
│   ├── models/
│   │   ├── index.ts
│   │   ├── Payment.ts            # Payment document schema
│   │   └── TransactionAuditLog.ts # Audit log schema
│   ├── routes/
│   │   ├── index.ts
│   │   ├── paymentRoutes.ts      # Main payment routes
│   │   └── dlqAdmin.ts          # DLQ admin routes
│   ├── services/
│   │   ├── paymentService.ts    # Core payment logic
│   │   ├── razorpayService.ts   # Razorpay API wrapper
│   │   ├── webhookService.ts    # Webhook handlers
│   │   ├── refundService.ts     # Refund processing
│   │   ├── reconciliationService.ts # Reconciliation jobs
│   │   ├── profileIntegration.ts # LTV tracking
│   │   └── rezMindService.ts   # REZ Mind events
│   ├── jobs/
│   │   ├── reconciliation.ts    # Cron job scheduler
│   │   └── lostCoinsRecoveryWorker.ts # Recovery worker
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication
│   │   ├── internalAuth.ts     # Service-to-service auth
│   │   ├── rateLimiter.ts     # Rate limiting
│   │   └── tracing.ts         # W3C trace propagation
│   ├── integrations/
│   │   └── nbfc-partner.ts    # NBFC abstraction (stub)
│   └── utils/
│       └── response.ts        # Response helpers
├── docs/
│   └── openapi.yaml          # OpenAPI specification
├── .env.example
├── package.json
├── tsconfig.json
├── README.md
└── CLAUDE.md
```

---

## API Endpoints Summary

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /pay/initiate | JWT | Initiate payment |
| POST | /pay/capture | JWT | Capture payment |
| POST | /pay/refund | JWT (admin) | Process refund |
| GET | /pay/status/:paymentId | JWT | Get payment status |
| GET | /pay/merchant/settlements | JWT | Merchant settlements |
| POST | /pay/webhook/razorpay | None | Razorpay webhook |
| POST | /pay/internal/wallet-credit | Internal | Credit wallet |
| POST | /internal/pay/deduct | Internal | Deduct payment |
| GET | /internal/pay/:paymentId | Internal | Get payment |
| GET | /internal/merchants/:id/payment-regularity | Internal | Credit scoring |
| POST | /api/razorpay/create-order | JWT | Create Razorpay order |
| GET | /api/razorpay/config | JWT | Get Razorpay config |
| GET | /api/razorpay/verify-payment | Internal | Verify signature |
| GET | /admin/dlq | Internal | DLQ summary |
| GET | /admin/dlq/:queue/jobs | Internal | Failed jobs |
| POST | /admin/dlq/:queue/jobs/:id/retry | Internal | Retry job |
| POST | /admin/dlq/:queue/retry-all | Internal | Bulk retry |
| DELETE | /admin/dlq/:queue/jobs/:id | Internal | Discard job |
| GET | /metrics | None | Prometheus metrics |
| GET | /health/live | None | Liveness probe |
| GET | /health/ready | None | Readiness probe |

---

*Report generated by Claude Code audit of rez-payment-service source code.*
