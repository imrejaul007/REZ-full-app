# LOAD TESTS (k6)

## Targets

| Endpoint | RPS |
|----------|-----|
| /health | 1000 |
| /api/payments | 100 |
| /api/orders | 50 |
| /api/wallet | 100 |

## Run

```bash
k6 run tests/load/k6-load-test.js
```
