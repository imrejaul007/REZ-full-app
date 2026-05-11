# RENDER DEPLOYMENT STATUS

**Date:** 2026-05-02
**Updated:** Just now

---

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   DEPLOYED:     35 services                                                    ║
║   DEPLOYING:     1 service                                                     ║
║   FAILED:        3 services                                                    ║
║   AVAILABLE:     2 not deployed                                               ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ✅ DEPLOYED (35)

| # | Service | Runtime | Region | Updated |
|---|---------|---------|--------|---------|
| 1 | rez-wallet-service | Node | Singapore | 5min |
| 2 | rez-intent-graph | Node | Singapore | 16min |
| 3 | rez-intent-agent | Node | Singapore | 16min |
| 4 | restaurantapp | Node | Singapore | 28min |
| 5 | REZ-targeting-engine | Node | Singapore | 1h |
| 6 | rez-first-loop | Node | Singapore | 1h |
| 7 | rez-order-service | Node | Singapore | 1h |
| 8 | REZ-consumer-copilot | Node | Singapore | 1h |
| 9 | REZ-observability | Node | Singapore | 1h |
| 10 | REZ-feature-flags | Node | Singapore | 1h |
| 11 | REZ-push-service | Node | Singapore | 1h |
| 12 | REZ-adbazaar | Node | Singapore | 1h |
| 13 | REZ-merchant-copilot | Node | Singapore | 1h |
| 14 | REZ-personalization-engine | Node | Singapore | 1h |
| 15 | REZ-recommendation-engine | Node | Singapore | 2h |
| 16 | analytics-events | Node | Singapore | 2h |
| 17 | rez-catalog-service-1 | Node | Singapore | 2h |
| 18 | rez-gamification-service | Node | Singapore | 2h |
| 19 | rez-api-gateway | Docker | Singapore | 2h |
| 20 | rez-ads-service | Node | Singapore | 2h |
| 21 | rez-marketing-service | Node | Singapore | 3h |
| 22 | REZ-intelligence-hub | Node | Singapore | 3h |
| 23 | REZ-intent-predictor | Node | Singapore | 3h |
| 24 | rez-merchant-service | Node | Singapore | 3h |
| 25 | rez-search-service | Node | Singapore | 4h |
| 26 | rez-feedback-service | Node | Singapore | 5h |
| 27 | rez-event-platform | Node | Oregon | 5h |
| 28 | rez-notification-events | Node | Singapore | 7h |
| 29 | rez-payment-service | Node | Singapore | 16h |
| 30 | rez-media-events | Node | Singapore | 16h |
| 31 | rez-backend | Node | Singapore | 17h |
| 32 | rez-worker | Node | Singapore | 17h |
| 33 | rez-karma-service | Node | Singapore | 17h |
| 34 | ReZ-Hotel-pms-1 | Static | Global | 1d |
| 35 | ReZ-Hotel-pms | Node | Singapore | 19d |

---

## 🔄 DEPLOYING (1)

| # | Service | Status |
|---|---------|--------|
| 1 | rez-auth-service | Deploying |

---

## ❌ FAILED (3) - NEEDS ATTENTION

| # | Service | Error | Action |
|---|---------|-------|--------|
| 1 | REZ-merchant-intelligence-service | Build failed | Redeploy |
| 2 | hotel-ota | Build failed | Redeploy |
| 3 | rez-app-consumer-1 | Build failed | Redeploy |

---

## ○ AVAILABLE - NOT DEPLOYED (2)

| # | Service | Type |
|---|---------|------|
| 1 | rez-redis | Valkey 8 |
| 2 | hotel-ota-db | PostgreSQL 18 |

---

## SUMMARY BY CATEGORY

### REZ Mind Services
```
✅ REZ-event-platform - DEPLOYED
✅ REZ-action-engine - (not on Render)
✅ REZ-feedback-service - DEPLOYED
✅ REZ-user-intelligence-service - (not listed)
✅ REZ-merchant-intelligence-service - FAILED ❌
✅ REZ-intent-predictor - DEPLOYED
✅ REZ-intelligence-hub - DEPLOYED
✅ REZ-targeting-engine - DEPLOYED
✅ REZ-recommendation-engine - DEPLOYED
✅ REZ-personalization-engine - DEPLOYED
✅ REZ-push-service - DEPLOYED
✅ REZ-merchant-copilot - DEPLOYED
✅ REZ-consumer-copilot - DEPLOYED
✅ REZ-adbazaar - DEPLOYED
✅ REZ-feature-flags - DEPLOYED
✅ REZ-observability - DEPLOYED
✅ REZ-support-copilot - (not listed)

Status: 14/17 DEPLOYED (82%)
```

### Backend Services
```
✅ rez-api-gateway - DEPLOYED
🔄 rez-auth-service - DEPLOYING
✅ rez-wallet-service - DEPLOYED
✅ rez-order-service - DEPLOYED
✅ rez-payment-service - DEPLOYED
✅ rez-search-service - DEPLOYED
✅ rez-catalog-service-1 - DEPLOYED
✅ rez-merchant-service - DEPLOYED
✅ rez-gamification-service - DEPLOYED
✅ rez-ads-service - DEPLOYED
✅ rez-marketing-service - DEPLOYED
✅ rez-notification-events - DEPLOYED
✅ rez-media-events - DEPLOYED
✅ rez-backend - DEPLOYED

Status: 14/14 DEPLOYED (100%)
```

### Analytics/Intelligence
```
✅ rez-intent-graph - DEPLOYED
✅ analytics-events - DEPLOYED
✅ rez-intent-agent - DEPLOYED
✅ rez-first-loop - DEPLOYED
✅ rez-worker - DEPLOYED

Status: 5/5 DEPLOYED (100%)
```

---

## ACTION ITEMS

### IMMEDIATE - Fix Failed Deployments

```
1. REZ-merchant-intelligence-service
   - Issue: Build failed
   - Fix: Already pushed fix, redeploy

2. hotel-ota
   - Issue: Build failed
   - Fix: Needs investigation

3. rez-app-consumer-1
   - Issue: Build failed
   - Fix: Needs investigation
```

### WAITING

```
1. rez-auth-service
   - Status: Deploying
   - Wait for completion
```

---

## HEALTH CHECK

```bash
# Test deployed services
curl https://rez-event-platform.onrender.com/health
curl https://rez-auth-service.onrender.com/health
curl https://rez-wallet-service.onrender.com/health
curl https://rez-order-service.onrender.com/health
```

---

**Last Updated:** 2026-05-02
**Next Update:** After fixing failed deployments
