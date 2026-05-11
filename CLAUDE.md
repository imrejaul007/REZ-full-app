# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Turborepo monorepo** containing the ReZ commerce platform. The platform consists of:

| Layer | Description |
|-------|-------------|
| **Apps** | Consumer apps (Hotel OTA, AdBazaar, Rendez, etc.) |
| **ReZ Mind** | Intent tracking, ML scoring, autonomous AI agents |
| **Backend Services** | Payment, Wallet, Order, Auth, Notification, etc. |
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
```

## Architecture Patterns

### Payment Service (`rez-payment-service/`)
The canonical source of truth for payment state. Key patterns:

- **FSM Validation**: Payment status transitions are validated via `config/paymentTransitions.ts`. Invalid transitions are rejected at save time.
- **Atomic Operations**: All state changes use MongoDB transactions (`session.withTransaction`).
- **Replay Prevention**: Razorpay payment IDs are deduplicated in Redis before processing.
- **Idempotency Keys**: Payment initiation uses `orchestratorIdempotencyKey` to prevent duplicates.
- **Wallet Credit**: Uses BullMQ with atomic Redis tracking to prevent double-crediting.

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
```

## Common Development Patterns

### Adding a New Payment Status
1. Add to `PaymentStatus` enum in `@rez/shared-types`
2. Update `PAYMENT_MODEL_TRANSITIONS` in `config/paymentTransitions.ts`
3. Update `PAYMENT_WEBHOOK_TRANSITIONS` for webhook handlers
4. Add migration for existing records if needed

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

## Key Files by Service

| Service | Key Files |
|---------|-----------|
| Payment | `src/services/paymentService.ts`, `src/services/webhookService.ts`, `src/services/refundService.ts`, `src/routes/paymentRoutes.ts` |
| Shared | `packages/rez-shared/`, `packages/rez-ui/`, `packages/shared-types/` |
| Intent | `packages/rez-intent-graph/` |

## Testing

```bash
# Run tests for a specific service
cd rez-payment-service && npm test

# Run a single test file
cd rez-payment-service && node --test test/webhookService.test.ts
```

## Security Rules

- NEVER commit `.env` files or any file containing secrets
- ALWAYS validate user input at system boundaries (use Zod schemas)
- ALWAYS verify webhook signatures before processing
- Use parameterized queries for MongoDB (never string concatenation)
- Log all authentication/authorization failures with context
