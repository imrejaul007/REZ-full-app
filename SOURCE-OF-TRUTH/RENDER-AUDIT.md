# RENDER SERVICES AUDIT

**Date:** May 6, 2026
**Total Services:** 74

---

## ACTIVE SERVICES: 59

### REZ CORE (Keep - 20)
| Service | Status |
|---------|--------|
| rez-event-platform | ACTIVE |
| rez-action-engine | ACTIVE |
| rez-feedback-service | ACTIVE |
| rez-first-loop | ACTIVE |
| rez-intent-graph | ACTIVE |
| REZ-intelligence-hub | ACTIVE |
| REZ-user-intelligence-service | ACTIVE |
| REZ-merchant-intelligence-service | ACTIVE |
| REZ-personalization-engine | ACTIVE |
| REZ-recommendation-engine | ACTIVE |
| REZ-targeting-engine | ACTIVE |
| REZ-push-service | ACTIVE |
| REZ-support-copilot | ACTIVE |
| REZ-observability | ACTIVE |
| REZ-feature-flags | ACTIVE |
| rez-automation-service | ACTIVE |
| rez-scheduler-service | ACTIVE |
| rez-finance-service | ACTIVE |
| rez-insights-service | ACTIVE |
| rez-merchant-integrations | ACTIVE |

### REZ APPS (Keep - 4)
| Service | Status |
|---------|--------|
| rez-app-consumer | ACTIVE |
| rez-backend | ACTIVE |
| rez-worker | ACTIVE |
| Rendez | ACTIVE |

### REZ MARKETING (Keep - 5)
| Service | Status |
|---------|--------|
| rez-marketing-service | ACTIVE |
| rez-ads-service | ACTIVE |
| REZ-ad-copilot | ACTIVE |
| REZ-adbazaar | ACTIVE |
| adBazaar | ACTIVE |

### REZ COMMERCE (Keep - 8)
| Service | Status |
|---------|--------|
| rez-api-gateway | ACTIVE |
| rez-auth-service | ACTIVE |
| rez-merchant-service | ACTIVE |
| rez-order-service | ACTIVE |
| rez-payment-service | ACTIVE |
| rez-wallet-service | ACTIVE |
| rez-catalog-service | ACTIVE |
| rez-search-service | ACTIVE |

### REZ GAMIFICATION (Keep - 1)
| Service | Status |
|---------|--------|
| rez-karma-service | ACTIVE |

---

## HOTEL/OTAS (Separate Product - 7)
| Service | Status |
|---------|--------|
| hotel-ota-api | ACTIVE |
| hotel-ota-web | ACTIVE |
| hotel-ota-hotel-panel | ACTIVE |
| hotel-ota-admin | ACTIVE |
| hotel-ota | ACTIVE |
| ReZ-Hotel-pms | ACTIVE |
| ReZ-Hotel-pms-1 | ACTIVE |

### CORPPERKS (Separate Product - 3)
| Service | Status |
|---------|--------|
| corpperks-api | ACTIVE |
| corpperks-admin | ACTIVE |
| corpperks-hotel | ACTIVE |

---

## ARCHIVED/LEGACY (SUSPEND - 15)

### Duplicate Services (suspend old versions)
| Service | Keep | Suspend |
|---------|------|--------|
| rez-catalog-service | Current | rez-catalog-service-1 |
| rez-merchant-service | Current | old versions |
| rez-order-service | Current | old versions |
| rez-wallet-service | Current | old versions |
| rez-app-consumer | Current | rez-app-consumer-1 |
| ReZ-Hotel-pms | Current | ReZ-Hotel-pms-1 |
| rez-action-engine | Current | rez-action-engine-1 |

### Copilot Legacy (suspend - merged into unified)
| Service | Reason |
|---------|--------|
| REZ-consumer-copilot | Merged into REZ-support-copilot |
| REZ-merchant-copilot | Merged into REZ-support-copilot |
| REZ-ad-copilot | Merged into REZ-adbazaar |

### Event Legacy (suspend - merged into rez-event-platform)
| Service | Reason |
|---------|--------|
| analytics-events | Merged into event-platform |
| rez-media-events | Merged into event-platform |
| rez-notification-events | Merged into event-platform |

### Other Legacy (suspend - not needed)
| Service | Reason |
|---------|--------|
| rez-web-menu | Duplicate |
| rez-backend-1 | Duplicate |
| rez-marketing | Duplicate of rez-marketing-service |

---

## SUSPENDED: 15

| Service | Reason |
|---------|--------|
| nextabizz | Legacy |
| rez-karma-app | Duplicate of rez-karma-service |
| rez-action-engine-1 | Old version |
| rez-catalog-service2 | Duplicate |
| rez-wallet-service | Duplicate |
| rez-order-service | Duplicate |
| rez-merchant-service | Duplicate |
| rez-gamification-service | Duplicate |
| rez-notification-events | Merged |
| rez-catalog-service | Duplicate |
| rez-media-events | Merged |
| analytics-events | Merged |
| rez-web-menu | Duplicate |
| rez-backend-1 | Duplicate |

---

## NEEDS DEPLOYMENT

### REZ Core Services (Already Deployed)
| Service | URL | Status |
|---------|-----|--------|
| rez-event-platform | https://rez-event-platform.onrender.com | DEPLOYED |
| rez-action-engine | https://rez-action-engine.onrender.com | DEPLOYED |
| rez-feedback-service | https://rez-feedback-service.onrender.com | DEPLOYED |
| rez-intent-graph | https://rez-intent-graph.onrender.com | DEPLOYED |
| rez-auth-service | https://rez-auth-service.onrender.com | DEPLOYED |
| rez-payment-service | https://rez-payment-service.onrender.com | DEPLOYED |
| rez-merchant-service | https://rez-merchant-service.onrender.com | DEPLOYED |
| rez-wallet-service | https://rez-wallet-service.onrender.com | DEPLOYED |
| rez-order-service | https://rez-order-service.onrender.com | DEPLOYED |
| rez-api-gateway | https://rez-api-gateway.onrender.com | DEPLOYED |
| rez-catalog-service | https://rez-catalog-service.onrender.com | DEPLOYED |
| rez-search-service | https://rez-search-service.onrender.com | DEPLOYED |

### REZ Marketing Platform (Need Deploy)
| Service | Port | Status |
|---------|------|--------|
| rez-marketing-service | 4000 | NEED DEPLOY |
| rez-lead-intelligence | 4106 | NEED DEPLOY |
| rez-abandonment-tracker | 4108 | NEED DEPLOY |
| rez-decision-service | 4027 | NEED DEPLOY |
| rez-unified-messaging | 4025 | NEED DEPLOY |

### REZ Intelligence Platform (Need Deploy)
| Service | Port | Status |
|---------|------|--------|
| REZ-intelligence-hub | 4020 | NEED DEPLOY |
| REZ-user-intelligence | 3004 | NEED DEPLOY |
| REZ-merchant-intelligence | 4012 | NEED DEPLOY |
| REZ-personalization-engine | 4017 | NEED DEPLOY |
| REZ-recommendation-engine | 4015 | NEED DEPLOY |

---

## TO SUSPEND - Manual Steps

Go to Render Dashboard and suspend these:

### Duplicate Copilots (use unified REZ-support-copilot)
1. REZ-consumer-copilot → https://dashboard.render.com/web/srv-d7qr4jgg4nts73c7c0og
2. REZ-merchant-copilot → https://dashboard.render.com/web/srv-d7qr41km0tmc73fsbi70
3. REZ-ad-copilot → https://dashboard.render.com/web/srv-d7s381rrjlhs73830ed0

### Duplicate Ad Platforms (use adBazaar)
4. REZ-adbazaar → https://dashboard.render.com/web/srv-d7qr5ajbc2fs73fu048g
5. REZ-feature-flags → Already archived

### Old/Not Used
6. nextabizz (already suspended)
7. rez-karma-app (already suspended)
8. analytics-events → Merge into event-platform
9. rez-media-events → Merge into event-platform
10. rez-notification-events → Merge into event-platform
11. rez-intent-predictor → Merge into intent-graph
12. REZ-ops-dashboard → Archive

### Duplicate Workers
13. rez-worker (check if needed)
14. hotel-ota (separate product)
15. ReZ-Hotel-pms (separate product)

---

## TO DEPLOY (Marketing + Intelligence Platform)

### Deploy Order:
1. REZ Mind first
2. Commerce Core
3. Marketing Platform
4. Intelligence Platform

---

## TO DEPLOY (10 services)

### Marketing Platform
```bash
# Deploy these services
rez-marketing-service (4000)
rez-lead-intelligence (4106)
rez-abandonment-tracker (4108)
rez-decision-service (4027)
rez-unified-messaging (4025)
```

### Intelligence Platform
```bash
REZ-intelligence-hub (4020)
REZ-user-intelligence-service (3004)
REZ-merchant-intelligence-service (4012)
REZ-personalization-engine (4017)
REZ-recommendation-engine (4015)
```

---

## SUMMARY

| Category | Count |
|----------|-------|
| Total Services | 74 |
| Active | 59 |
| Suspended | 15 |
| To Suspend (legacy) | 15 |
| Need Deploy | 10 |
| Already Deployed | ~40 |

---

**END OF AUDIT**
