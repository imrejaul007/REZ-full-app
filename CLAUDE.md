# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Turborepo monorepo** containing the ReZ commerce platform. The platform consists of:

| Layer | Description |
|-------|-------------|
| **Apps** | Consumer apps (Hotel OTA, AdBazaar, Rendez, DOOH, etc.) |
| **ReZ Mind** | Intent tracking, ML scoring, autonomous AI agents |
| **Backend Services** | Payment, Wallet, Order, Auth, Notification, DOOH, etc. |
| **Shared Packages** | @rez/ui, @rez/shared, @rez/shared-types, etc. |

The monorepo uses npm workspaces. Each service has its own `package.json` and can be developed independently.

## Build & Test Commands

```bash
# Root level - all workspaces
npm run build          # Build all packages
npm run test           # Test all packages
npm run lint           # Lint all packages

# Individual service (example: payment service)
cd rez-payment-service && npm run build && npm run test

# DOOH service
cd REZ-Media/rez-dooh-service && npm run build && npm run test

# DOOH screen app
cd REZ-Media/dooh-screen-app && npm run build
```

---

## DOOH Ecosystem

**Digital Out of Home Advertising Network** - Connects physical screens to intelligent ad delivery.

### Components

| Component | Location | Description |
|-----------|----------|-------------|
| **DOOH Shared Types** | `RTNM-Group/shared-types/dooh/` | **Canonical** type definitions, Zod schemas, state machines |
| **DOOH Service** | `REZ-Media/rez-dooh-service/` | Unified backend (Port 4018) |
| **DOOH Screen App** | `REZ-Media/dooh-screen-app/` | Next.js display app |
| **DOOH Mobile** | `REZ-Media/dooh-mobile/` | React Native owner app |

### DOOH Architecture

```
ReZ Mind (Context Signals)
        ↓
AdOS (Decision Engine)
        ↓
DOOH Services
        ↓
┌─────────────────────────────────────────┐
│           Screen Network                │
│  Cab Tablets | Restaurants | Airports │
└─────────────────────────────────────────┘
        ↓
User Interaction (QR / Visit)
```

### DOOH Security

**Authentication**:
- Internal services: `X-Internal-Token` header
- Screen devices: `X-Api-Key` header (per-screen unique keys)
- Service tokens in `INTERNAL_SERVICE_TOKENS_JSON`

**Rate Limiting**:
- All API: 100 requests/minute
- Write operations: 30 requests/minute

**State Machine Validation**:
- Screen statuses: `active`, `inactive`, `offline`, `maintenance`
- Campaign statuses: `draft`, `active`, `paused`, `completed`, `budget_exhausted`

### DOOH Key Files

| File | Purpose |
|------|---------|
| `RTNM-Group/shared-types/dooh/src/types.ts` | Canonical type definitions |
| `RTNM-Group/shared-types/dooh/src/schemas.ts` | Zod validation schemas |
| `RTNM-Group/shared-types/dooh/src/state-machines.ts` | Status transition validation |
| `RTNM-Group/shared-types/dooh/src/money.ts` | Financial calculations (cents) |
| `REZ-Media/rez-dooh-service/src/middleware/auth.ts` | Auth & rate limiting middleware |
| `REZ-Media/rez-dooh-service/src/services/screenManagement.ts` | Screen CRUD, per-screen API keys |
| `REZ-Media/rez-dooh-service/api-spec.yaml` | OpenAPI specification |

### DOOH Screen Types

| Type | Default CPM (INR) |
|------|------------------|
| `cab_tablet` | 15 |
| `restaurant_tv` | 10 |
| `mall_kiosk` | 22 |
| `gym_screen` | 12 |
| `hotel_lobby` | 15 |
| `airport_display` | 35 |
| `office_lobby` | 20 |
| `bus_shelter` | 20 |
| `billboard_digital` | 50 |

---

## Architecture Patterns

### Payment Service (`rez-payment-service/`)
The canonical source of truth for payment state. Key patterns:

- **FSM Validation**: Payment status transitions are validated via `config/paymentTransitions.ts`. Invalid transitions are rejected at save time.
- **Atomic Operations**: All state changes use MongoDB transactions (`session.withTransaction`).
- **Replay Prevention**: Razorpay payment IDs are deduplicated in Redis before processing.
- **Idempotency Keys**: Payment initiation uses `orchestratorIdempotencyKey` to prevent duplicates.
- **Wallet Credit**: Uses BullMQ with atomic Redis tracking to prevent double-crediting.

### DOOH Service (`REZ-Media/rez-dooh-service/`)
Unified backend for DOOH operations. Key patterns:

- **Per-Screen API Keys**: Each screen gets a unique API key for authentication
- **State Machine Validation**: Screen and campaign status transitions validated
- **Money Utilities**: All financial values stored as cents to avoid floating-point errors
- **Zod Validation**: All API inputs validated via schemas from `@rez/dooh-shared`
- **Rate Limiting**: Built-in middleware for request throttling

### Webhook Security
Webhook handlers in `webhookService.ts` follow these patterns:
- Signature verification via HMAC-SHA256
- Event deduplication via Redis (24-hour window)
- Amount verification against Razorpay API
- State machine validation before processing

### Service-to-Service Communication
- Internal endpoints use `X-Internal-Token` header for authentication
- Service tokens are stored in `INTERNAL_SERVICE_TOKENS_JSON` (JSON map, not single token)
- Tokens are scoped per calling service for audit trails

### Error Handling
- All async operations use try/finally for cleanup (session.endSession, redis.quit)
- Fail-closed behavior for security-critical operations when dependencies are unavailable
- All errors logged with context before propagating

## Environment Variables

```bash
# Required for all services
INTERNAL_SERVICE_TOKENS_JSON={"service-name":"token"}  # JSON map of service tokens
JWT_SECRET=<secret>
REDIS_URL=redis://localhost:6379
MONGODB_URI=<connection-string>

# Payment service specific
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<secret>
WALLET_SERVICE_URL=http://localhost:4002

# DOOH service specific
INTERNAL_SERVICE_TOKEN=<secret>          # REQUIRED - no fallback
DOOH_API_KEY=<secret>                    # Screen authentication
DOOH_SERVER_URL=https://dooh.rezapp.com
ALLOWED_ORIGINS=https://rezapp.com,https://www.rezapp.com
```

## Common Development Patterns

### Adding a New Payment Status
1. Add to `PaymentStatus` enum in `@rez/shared-types`
2. Update `PAYMENT_MODEL_TRANSITIONS` in `config/paymentTransitions.ts`
3. Update `PAYMENT_WEBHOOK_TRANSITIONS` for webhook handlers
4. Add migration for existing records if needed

### Adding a New DOOH Screen Type
1. Add to `ScreenType` enum in `RTNM-Group/shared-types/dooh/src/types.ts`
2. Add display name and default CPM to documentation
3. Update `DEFAULT_CPM_RATES` in `REZ-Media/rez-dooh-service/src/types.ts`

### Adding a New Screen Status Transition
1. Update `SCREEN_STATUS_TRANSITIONS` in `RTNM-Group/shared-types/dooh/src/state-machines.ts`
2. Add validation in route handlers
3. Update documentation

### Adding a New Webhook Event
1. Add route handler in `routes/paymentRoutes.ts` webhookHandler
2. Add handler function in `services/webhookService.ts`
3. Add state transition to webhook transition map
4. Add audit log entry

### Modifying Payment State
Always use MongoDB transactions and validate transitions:
```typescript
await session.withTransaction(async () => {
  // Validate current state
  const payment = await Payment.findOne({ paymentId }).session(session);
  // Validate transition is allowed
  const allowed = VALID_TRANSITIONS[payment.status];
  if (!allowed.includes(newStatus)) throw new Error('Invalid transition');
  // Update
  payment.status = newStatus;
  await payment.save({ session });
});
```

### DOOH API Request Validation
Use Zod schemas for all API inputs:
```typescript
import { ScreenRegistrationSchema } from '@rez/dooh-shared';

const result = ScreenRegistrationSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({
    success: false,
    error: 'Invalid input',
    details: result.error.flatten(),
  });
}
```

## Key Files by Service

| Service | Key Files |
|---------|-----------|
| Payment | `src/services/paymentService.ts`, `src/services/webhookService.ts`, `src/services/refundService.ts`, `src/routes/paymentRoutes.ts` |
| DOOH Shared | `RTNM-Group/shared-types/dooh/src/types.ts`, `schemas.ts`, `state-machines.ts`, `money.ts` |
| DOOH Service | `REZ-Media/rez-dooh-service/src/index.ts`, `src/middleware/auth.ts`, `src/services/*.ts` |
| DOOH Screen | `REZ-Media/dooh-screen-app/src/app/page.tsx`, `src/middleware.ts` |
| DOOH Mobile | `REZ-Media/dooh-mobile/App.tsx` |
| Shared | `packages/rez-shared/`, `packages/rez-ui/`, `packages/shared-types/` |
| Intent | `packages/rez-intent-graph/` |

## Testing

```bash
# Run tests for a specific service
cd rez-payment-service && npm test

# Run a single test file
cd rez-payment-service && node --test test/webhookService.test.ts

# DOOH service tests
cd REZ-Media/rez-dooh-service && npm test
```

## Security Rules

- NEVER commit `.env` files or any file containing secrets
- ALWAYS validate user input at system boundaries (use Zod schemas)
- ALWAYS verify webhook signatures before processing
- Use parameterized queries for MongoDB (never string concatenation)
- Log all authentication/authorization failures with context
- DOOH: Use money utilities for financial calculations (store as cents)
- DOOH: Each screen must have a unique API key, never share keys

## Additional Documentation

| Document | Location | Description |
|----------|----------|-------------|
| DOOH Architecture | `REZ-Media/dooh-architecture.md` | Complete system architecture |
| DOOH API Spec | `REZ-Media/rez-dooh-service/api-spec.yaml` | OpenAPI 3.0 specification |
| DOOH Shared README | `RTNM-Group/shared-types/dooh/README.md` | Type library documentation |
