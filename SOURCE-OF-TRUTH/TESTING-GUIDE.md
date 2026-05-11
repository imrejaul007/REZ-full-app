# REZ Platform Testing Guide

**Date:** May 7, 2026
**Status:** Services Deployed - Manual Testing Required

---

## Service Health Status

| Service | Status | Notes |
|---------|--------|-------|
| Auth Service | OK | Requires internal token |
| Wallet Service | OK | Requires internal token |
| Ledger Service | OK | Empty (no transactions yet) |
| Payment Service | OK | Health on internal port |
| Order Service | OK | Requires auth |

---

## How to Test

### 1. Health Checks

```bash
# Auth
curl https://rez-auth-service.onrender.com/health

# Wallet
curl https://rez-wallet-service.onrender.com/health

# Ledger
curl https://rez-ledger.onrender.com/health
```

### 2. Test with Internal Token

Most endpoints require `X-Internal-Token` header.

Contact team for internal token.

### 3. E2E Test Script

```bash
cd E2E-TEST
npm install
node money-flow-test.js
```

---

## Prerequisites for Testing

1. Get internal API token from team
2. Set up test merchant account
3. Set up test consumer account
4. Configure webhooks

---

## Test Scenarios

### Scenario 1: QR -> Order -> Payment -> Coins

1. Create test merchant
2. Generate QR code
3. Consumer scans QR
4. View menu
5. Create order
6. Make payment
7. Verify coins credited

### Scenario 2: Idempotency

1. Send payment with idempotency key
2. Retry with same key
3. Verify single charge

### Scenario 3: Ledger Verification

1. Make 10 payments
2. Check ledger entries
3. Verify DEBIT = CREDIT = 0

---

## Test Results Template

| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|------------|
| Auth login | Token returned | | |
| Create order | Order ID | | |
| Payment | Success | | |
| Coins credited | 5% of amount | | |
| Ledger entry | DEBIT=CREDIT | | |

---

## Issues Found

(To be filled during testing)

---

## Go-Live Criteria

Before going live, ALL tests must pass:

- [ ] QR code generation works
- [ ] Order creation works
- [ ] Payment processing works
- [ ] Coins credited correctly
- [ ] Ledger balances to 0
- [ ] Idempotency works
- [ ] No silent failures
- [ ] Events tracked
