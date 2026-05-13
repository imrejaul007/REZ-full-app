# UNIT TESTS

## Coverage

| Service | Tests |
|---------|-------|
| Payment | status, validation, transitions |
| Wallet | balance, limits, idempotency |
| Auth | JWT, hashing, rate limiting |
| Order | state machine, calculations |

## Run

```bash
npm test
npm run coverage
```
