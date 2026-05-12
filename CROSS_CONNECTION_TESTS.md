# REZ Platform - Cross Connection Tests
**Date:** May 12, 2026

---

## TEST PLAN: All Cross-Connections

---

## 1. REZ-Consumer → REZ-Intelligence

### Tests
```
[ ] REZ-scan → Intent Graph (scan events)
[ ] REZ-expense → Analytics (spend data)
[ ] REZ-assistant → REZ-Mind (AI queries)
[ ] REZ-save → Intelligence (wishlist intent)
[ ] verify-qr → Intelligence (warranty data)
```

### Expected APIs
- `POST ${INTENT_API}/api/intent/track`
- `POST ${ANALYTICS_API}/api/track`
- `POST ${MIND_API}/api/chat`

---

## 2. REZ-Consumer → RABTUL-Technologies

### Tests
```
[ ] verify-qr → REZ-wallet (cashback)
[ ] REZ-bills → REZ-wallet (cashback)
[ ] All services → REZ-auth (auth)
[ ] All services → REZ-notifications (alerts)
[ ] All services → REZ-privacy (masking)
```

### Expected APIs
- `POST ${WALLET_API}/api/earn`
- `POST ${AUTH_API}/api/verify`
- `POST ${NOTIF_API}/api/send`

---

## 3. REZ-Media → REZ-Intelligence

### Tests
```
[ ] REZ-attribution → Intelligence (attribution data)
[ ] REZ-referral → Intelligence (referral tracking)
[ ] adsqr → Intelligence (ad scans)
[ ] creators → Intelligence (creator metrics)
```

### Expected APIs
- `POST ${INTELLIGENCE_API}/api/attribution/track`
- `POST ${INTELLIGENCE_API}/api/intent/track`

---

## 4. REZ-Merchant → All

### Tests
```
[ ] verify-qr → Merchant (serial lookup)
[ ] REZ-attribution → Merchant (conversion data)
[ ] REZ-scan → Merchant (foot traffic)
[ ] verify-qr → Merchant (warranty claims)
```

### Expected APIs
- `GET ${MERCHANT_API}/api/products/serial/:serial`
- `POST ${MERCHANT_API}/api/warranty/claim-filed`

---

## 5. RTNM-Group → All

### Tests
```
[ ] REZ-trust → REZ-bnpl (trust scores)
[ ] REZ-trust → REZ-capital (credit scores)
[ ] REZ-trust → verify-qr (ownership)
[ ] verify-qr → REZ-trust (fraud data)
```

### Expected APIs
- `GET ${TRUST_API}/api/trust/:userId`
- `POST ${TRUST_API}/api/trust/score`

---

## 6. REZ-Agent (Communication Layer)

### Tests
```
[ ] verify-qr → Agent (warranty alerts)
[ ] REZ-assistant → Agent (support)
[ ] REZ-bills → Agent (receipt alerts)
[ ] REZ-referral → Agent (rewards)
```

### Expected APIs
- `POST ${AGENT_API}/api/agent/whatsapp/send`
- `POST ${AGENT_API}/api/agent/workflow/trigger`

---

## 7. QR Ecosystem Connections

### Tests
```
[ ] ReZ Now → verify-qr (warranty check)
[ ] adsqr → REZ-attribution (ad attribution)
[ ] REZ-scan → verify-qr (product verification)
[ ] REZ-scan → REZ-attribution (offline tracking)
```

---

## Connection Diagram

```
                    ┌─────────────────┐
                    │ REZ-Intelligence │
                    └────────┬────────┘
                             │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ REZ-Consumer  │  │  REZ-Media   │  │REZ-Merchant  │
│               │  │               │  │               │
│ • REZ-scan    │  │ • Attribution │  │ • Serial API │
│ • REZ-expense│  │ • Referral    │  │ • Warranty   │
│ • REZ-assist │  │ • adsqr       │  │ • Claims     │
│ • REZ-save   │  │ • creators    │  │               │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────────────────────────────────────────────┐
│              RABTUL-Technologies                       │
│  Auth │ Wallet │ Notifications │ Privacy │ Analytics   │
└───────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    RTNM-Group   │
                    │                 │
                    │ • REZ-trust     │
                    │ • REZ-bnpl      │
                    │ • REZ-capital   │
                    └─────────────────┘
```

---

## ENVIRONMENT VARIABLES NEEDED

```env
# REZ-Consumer
INTENT_API=https://rez-intent-graph.onrender.com
VERIFY_API=https://rez-verify-qr.onrender.com
AGENT_API=https://REZ-agent.onrender.com
ANALYTICS_API=https://rez-analytics.onrender.com
MIND_API=https://REZ-mind.onrender.com

# RABTUL-Technologies
AUTH_API=https://rez-auth.onrender.com
WALLET_API=https://rez-wallet.onrender.com
NOTIF_API=https://rez-notifications.onrender.com
PRIVACY_API=https://rez-privacy.onrender.com

# REZ-Media
MERCHANT_API=https://rez-merchant.onrender.com
INTELLIGENCE_API=https://rez-intelligence.onrender.com

# RTNM-Group
TRUST_API=https://rez-trust.onrender.com
BNPL_API=https://rez-bnpl.onrender.com
```

---

## TEST EXECUTION CHECKLIST

### Phase 1: Unit Tests (Each Service)
```bash
# Test each service independently
npm test -- --testPathPattern=verify-qr
npm test -- --testPathPattern=REZ-scan
npm test -- --testPathPattern=REZ-expense
```

### Phase 2: Integration Tests (Connections)
```bash
# Test cross-service connections
npm test -- --testPathPattern=integration
```

### Phase 3: E2E Tests (Full Flow)
```bash
# Test complete user flows
npm run test:e2e
```

---

## TEST RESULTS TEMPLATE

| Connection | Test | Status | Notes |
|-----------|------|--------|-------|
| REZ-scan → Intent | POST /intent/track | ❌❓✅ | |
| REZ-expense → Analytics | POST /track | ❌❓✅ | |
| verify-qr → Wallet | POST /earn | ❌❓✅ | |
| REZ-attribution → Intelligence | POST /track | ❌❓✅ | |
| REZ-referral → Wallet | POST /earn | ❌❓✅ | |
| REZ-trust → BNPL | GET /score | ❌❓✅ | |

---

## MANUAL TEST CASES

### 1. REZ-Scan → Intelligence
```
1. Open REZ-scan app
2. Scan a product QR
3. Verify: Intent Graph receives scan event
4. Verify: Analytics receives scan event
```

### 2. verify-qr → Wallet
```
1. Scan product QR
2. Activate warranty
3. Verify: Cashback added to wallet
4. Verify: Transaction logged
```

### 3. REZ-Attribution → Intelligence
```
1. Create ad campaign with QR
2. User scans QR
3. User visits store
4. User makes purchase
5. Verify: Attribution report shows full funnel
```

### 4. REZ-Referral → Wallet
```
1. User refers friend
2. Friend signs up
3. Verify: Referrer gets reward in wallet
4. Verify: Intelligence tracks referral
```

### 5. REZ-Bills → Privacy
```
1. User scans receipt
2. View transaction (default privacy)
3. Verify: Amount masked
4. Change privacy to full
5. Verify: Full details shown
```

---

## MONITORING CHECKS

### 1. Check Intent Graph
```bash
curl -X GET ${INTENT_API}/api/intent/stats
```

### 2. Check Analytics
```bash
curl -X GET ${ANALYTICS_API}/api/stats
```

### 3. Check Wallet
```bash
curl -X GET ${WALLET_API}/api/wallet/:userId
```

### 4. Check Trust Scores
```bash
curl -X GET ${TRUST_API}/api/trust/:userId
```

---

## ERROR HANDLING

If connection fails:
1. Check service is deployed
2. Check environment variables
3. Check API keys
4. Check CORS settings
5. Check rate limits

---

## LAST UPDATED

May 12, 2026
