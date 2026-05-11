# Financial API Idempotency Audit Report

**Date:** May 7, 2026
**Audited:** 21 financial POST endpoints across wallet and payment services

---

## Summary

| Status | Count |
|--------|-------|
| PASS | 11 |
| NEEDS FIX | 10 |

---

## Critical Issues (Priority 1)

### 1. Refund Endpoints - NO IDEMPOTENCY

**HIGH RISK: Duplicate refunds**

```typescript
// Current: No idempotencyKey
router.post('/pay/refund', refundHandler);

// MISSING: idempotencyKey in schema
const refundSchema = z.object({
  paymentId: z.string(),
  amount: z.number(),
  // idempotencyKey MISSING
});
```

**Fix:** Add idempotencyKey to all refund endpoints

### 2. BNPL Endpoints - NO IDEMPOTENCY

**Files:** consumerCredit.ts, internalCredit.ts

**Risk:** Duplicate BNPL applications/repayments

---

## High Priority Issues (Priority 2)

| Endpoint | Risk |
|----------|------|
| Savings goals | Duplicate creation |
| Merchant withdrawal | Duplicate requests |
| Corporate benefits | Duplicate enrollments |

---

## Fix Pattern

```typescript
const idempotencySchema = z.object({
  idempotencyKey: z.string().min(1).max(200),
});

// Check before create
const existing = await Transaction.findOne({ idempotencyKey });
if (existing) {
  return res.status(200).json({ data: existing, idempotent: true });
}
```

---

## Compliance

| Requirement | Pass | Fail |
|-------------|------|------|
| Idempotency-Key | 11 | 10 |
| MongoDB Transaction | 5 | 0 |
| Rate Limiting | 15 | 6 |
