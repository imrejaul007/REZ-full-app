# Integration Test Suite

## Overview

This test suite validates all 3 platforms work together:
- **Do App** - Food ordering
- **Support Copilot** - Customer support
- **Unified Chat** - Universal chat component

## Test Coverage

### Do App Backend
- [x] Authentication (register, login)
- [x] Wallet (balance, transactions, karma)
- [x] Profile (user data, preferences, behavior)
- [x] Chat (intent detection, AI responses)

### Support Copilot
- [x] Intent detection (15+ types)
- [x] User context
- [x] Health checks

### ReZ Mind (Intent Graph)
- [x] Intent capture
- [x] User profiling
- [x] Event tracking

### Full Product Flow
- [x] Search → Intent → View → Cart → Order → Payment → Profile

## Running Tests

### Run All Tests
```bash
node TEST-INTEGRATION.js
```

### Run with Custom URLs
```bash
DO_APP_URL=http://localhost:3001 \
SUPPORT_COPILOT_URL=http://localhost:4033 \
REZ_MIND_URL=http://localhost:4008 \
node TEST-INTEGRATION.js
```

### Run Specific Tests
```bash
# Test only Do App
node -e "
const { runAllTests } = require('./TEST-INTEGRATION.js');
runAllTests();
"
```

## Expected Results

### With All Services Running
```
✅ ALL TESTS PASSED
```

### With Partial Services
```
⚠️ MOSTLY PASSED - Some services may need configuration
```

### With No Services
```
❌ MULTIPLE FAILURES - Check service configurations
```

## Manual Test Checklist

If running tests manually, verify:

### Do App
- [ ] Register new user
- [ ] Login works
- [ ] Wallet shows balance
- [ ] Profile loads
- [ ] Chat responds to "I want biryani"
- [ ] Intent captured in ReZ Mind

### Support Copilot
- [ ] Health check returns ok
- [ ] Intent detection works
- [ ] User context accessible

### Unified Chat
- [ ] Chat sends message
- [ ] Bot responds
- [ ] Order flow works

### Full Flow
- [ ] Search product → captured in ReZ Mind
- [ ] View product → intent recorded
- [ ] Add to cart → cart_add event
- [ ] Place order → order_placed event
- [ ] Wallet debited → coins reduced
- [ ] Profile shows updated intents

## Test Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DO_APP_URL | http://localhost:3001 | Do App backend |
| SUPPORT_COPILOT_URL | https://REZ-support-copilot.onrender.com | Support Copilot |
| UNIFIED_CHAT_URL | http://localhost:3002 | Unified Chat |
| REZ_MIND_URL | https://rez-intent-graph.onrender.com | Intent Graph |
| REZ_WALLET_URL | https://rez-wallet-service.onrender.com | Wallet |
| REZ_ORDER_URL | https://rez-order-service.onrender.com | Orders |
| REZ_CATALOG_URL | https://rez-catalog-service.onrender.com | Catalog |

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Integration Tests
  run: node TEST-INTEGRATION.js
  env:
    DO_APP_URL: ${{ vars.DO_APP_URL }}
    SUPPORT_COPILOT_URL: ${{ vars.SUPPORT_COPILOT_URL }}
```
