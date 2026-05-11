# Critical Gaps — Testing, Fraud, Observability, Latency

**Date:** May 7, 2026

---

## 1. TESTING (Almost None)

### Current State
- No unit tests
- No integration tests
- No E2E tests

### What's Needed

```
npm test                    # Unit tests
npm run test:integration   # API tests
npm run test:e2e           # Playwright/Cypress
```

### Priority Tests

| Test | Coverage |
|------|----------|
| Auth | JWT validation, OTP flow |
| Order | Create → Pay → Complete |
| Wallet | Earn → Spend → Balance |
| Webhook | Payment callback |
| QR Scan | Decode → Route |

### Action Items

```bash
# Install Jest
npm install --save-dev jest @testing-library/react @playwright/test

# Create test files
test/
├── auth.test.ts
├── order.test.ts
├── wallet.test.ts
└── webhook.test.ts
```

---

## 2. FRAUD SYSTEM (Not Fully Active)

### Current Rules

| Rule | Status |
|------|--------|
| Velocity Check | Stub |
| Impossible Travel | Stub |
| Duplicate Bill | Stub |
| Bot Pattern | Stub |

### Fraud Types to Implement

| Fraud | Detection |
|-------|-----------|
| Same device, multiple accounts | Device fingerprint |
| Rapid OTP requests | Rate limit |
| Impossible travel | Geo validation |
| Fake orders | ML model |
| Self-refunds | Transaction analysis |

### Webhook needed

```
POST /api/fraud/check → { risk: "high" }
```

---

## 3. OBSERVABILITY (Not Complete)

### Missing

| Component | Status |
|-----------|--------|
| Prometheus metrics | Stub |
| Grafana dashboards | Missing |
| Alertmanager | Missing |
| Distributed tracing | Missing |
| Error tracking | Sentry (partial) |

### Implement

```
# Prometheus metrics endpoint
GET /metrics

# Grafana dashboards
- Service health
- Request latency
- Error rate
- Coin flow
```

---

## 4. LATENCY (Not Proven)

### Target

| Endpoint | Current | Target |
|----------|---------|--------|
| /health | ? | <50ms |
| /orders | ? | <200ms |
| /wallet/earn | ? | <100ms |

### Optimization

- [ ] Database indexes
- [ ] Redis cache
- [ ] CDN for assets
- [ ] Load test with k6

---

## Priority Action Items

1. **Testing**
   - Add Jest + 5 core tests
   
2. **Fraud**
   - Implement velocity check
   - Add device fingerprinting

3. **Observability**
   - Add /metrics endpoint
   - Create Grafana dashboard

4. **Latency**
   - Run k6 load test
   - Add Redis cache
