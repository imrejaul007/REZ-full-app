# DEPLOYMENT QUICK REFERENCE
**For:** Developer
**Status:** Ready to Execute

---

## ONE-COMMAND DEPLOY (After Setup)

```bash
# Deploy everything
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App
chmod +x DEPLOY-CORE-SERVICES.sh DEPLOY-REZ-MIND.sh TEST-TRANSACTION-LOOP.sh
./DEPLOY-CORE-SERVICES.sh
./TEST-TRANSACTION-LOOP.sh
```

---

## SERVICE PORTS (All in One Table)

| Service | Port | Order |
|---------|------|-------|
| **rez-api-gateway** | 3000 | 1 |
| **rez-order-service** | 3006 | 2 |
| **rez-intent-graph** | 3007 | 3 |
| **rez-user-intelligence** | 3004 | 4 |
| **rez-auth-service** | 4002 | 5 |
| **rez-merchant-service** | 4005 | 6 |
| **rez-wallet-service** | 4004 | 7 |
| **rez-payment-service** | 4001 | 8 |
| **rez-targeting-engine** | 3013 | 9 |
| **rez-action-engine** | 3014 | 10 |
| **rez-merchant-intelligence** | 4012 | 11 |
| **rez-personalization-engine** | 4017 | 12 |
| **rez-intelligence-hub** | 4020 | 13 |
| **rez-consumer-copilot** | 4021 | 14 |
| **rez-merchant-copilot** | 4022 | 15 |
| **rez-support-copilot** | 4033 | 16 |
| **rez-ml-feature-store** | 4100 | 17 |
| **rez-ml-model-registry** | 4101 | 18 |
| **rez-training-data-service** | 4102 | 19 |
| **rez-fraud-detection-service** | 4103 | 20 |
| **rez-price-optimization-service** | 4104 | 21 |
| **rez-ab-testing-service** | 4105 | 22 |
| **rez-data-quality-monitor** | 4106 | 23 |
| **rez-ml-retraining-pipeline** | 4107 | 24 |
| **rez-bbps-service** | 4110 | 25 |
| **rez-recharge-service** | 4111 | 26 |
| **rez-einvoice-service** | 4112 | 27 |

---

## .env FILE CHECKLIST

For each service, create `.env` with:

```bash
# REQUIRED (Every Service)
PORT=XXXX
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db_name
REDIS_URL=redis://default:pass@host:port
JWT_SECRET=your-32-char-secret-key-here
CORS_ORIGIN=http://localhost:3000,https://rez.money

# LOGGING (Every Service)
LOG_LEVEL=info
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## DEPLOY EACH SERVICE

```bash
# Template for each service
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/<service-name>

# 1. Install
npm install --legacy-peer-deps

# 2. Setup env
cp .env.example .env
# Edit .env with values from DEPLOYMENT-GUIDE-FULL.md

# 3. Build
npm run build

# 4. Start
npm run start

# 5. Test
curl http://localhost:<PORT>/health
```

---

## HEALTH CHECK COMMAND

```bash
# Check all services at once
for port in 3000 3004 3006 3007 3013 3014 4001 4002 4004 4005 4012 4017 4020 4021 4022 4033 4100 4101 4102 4103 4104 4105 4106 4107 4110 4111 4112; do
  if curl -s http://localhost:$port/health | grep -q "ok"; then
    echo "✓ Port $port"
  else
    echo "✗ Port $port (FAILED)"
  fi
done
```

---

## TRANSACTION LOOP TEST

```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App
./TEST-TRANSACTION-LOOP.sh
```

Expected output:
```
✓ User Registration
✓ User Login
✓ Wallet Balance
✓ Payment Simulation
✓ Coin Earning
✓ Order Creation
✓ Order Status
✓ Coin Redemption
✓ Transaction History
```

---

## COMMON FIXES

### Port Already in Use
```bash
lsof -i :4002
kill -9 <PID>
```

### MongoDB Auth Failed
```bash
# Test connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/db" --authenticationDatabase admin
```

### Redis Connection Failed
```bash
redis-cli -u redis://default:pass@host:port ping
# Should return: PONG
```

### JWT Errors
```bash
# Make sure JWT_SECRET is same in all .env files
# Must be at least 32 characters
```

---

## DEPLOYMENT ORDER

```
PHASE 1 (Deploy First):
1. rez-auth-service (4002)
2. rez-wallet-service (4004)
3. rez-payment-service (4001)
4. rez-merchant-service (4005)
5. rez-order-service (3006)
6. rez-api-gateway (3000)

PHASE 2 (Deploy Second):
7. rez-intent-graph (3007)
8. rez-user-intelligence (3004)
9. rez-merchant-intelligence (4012)
10. rez-personalization-engine (4017)
11. rez-targeting-engine (3013)
12. rez-action-engine (3014)
13. rez-intelligence-hub (4020)

PHASE 3 (Deploy Third):
14. rez-consumer-copilot (4021)
15. rez-merchant-copilot (4022)
16. rez-support-copilot (4033)

PHASE 4 (Deploy Fourth):
17. rez-ml-feature-store (4100)
18. rez-ml-model-registry (4101)
19. rez-training-data-service (4102)
20. rez-fraud-detection-service (4103)
21. rez-data-quality-monitor (4106)
22. rez-ml-retraining-pipeline (4107)
23. rez-price-optimization-service (4104)
24. rez-ab-testing-service (4105)

PHASE 5 (Deploy Last):
25. rez-bbps-service (4110)
26. rez-recharge-service (4111)
27. rez-einvoice-service (4112)
```

---

## SUCCESS CRITERIA

All 27 services deployed AND:
- [ ] All health checks return `{"status":"ok"}`
- [ ] Transaction loop test passes 100%
- [ ] No errors in service logs

---

## FULL GUIDE

See: [DEPLOYMENT-GUIDE-FULL.md](DEPLOYMENT-GUIDE-FULL.md)

---

*Quick Reference Card - Version 1.0*
