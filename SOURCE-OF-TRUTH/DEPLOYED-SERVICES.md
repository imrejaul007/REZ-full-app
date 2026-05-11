# REZ Platform — Deployed Services

**Version:** 1.0
**Date:** May 6, 2026
**Total Services:** 45 active deployments

---

## SUMMARY

| Category | Count | Active |
|----------|-------|--------|
| Core Commerce | 8 | 8 |
| AI/Intelligence | 9 | 9 |
| Marketing | 6 | 6 |
| Hotel/OTA | 5 | 5 |
| CorpPerks | 3 | 3 |
| Web Apps | 6 | 6 |
| Event Pipeline | 3 | 3 |
| Other | 5 | 5 |
| **TOTAL** | **45** | **45** |

---

## CORE COMMERCE SERVICES (8)

### 1. rez-api-gateway
| Property | Value |
|----------|-------|
| **URL** | https://rez-api-gateway.onrender.com |
| **Port** | 3000 |
| **Region** | Singapore |
| **MongoDB** | cluster0 |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | All core services |
| **GitHub** | imrejaul007/rez-api-gateway |
| **Status** | Active |

### 2. rez-auth-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-auth-service.onrender.com |
| **Port** | 4002 |
| **Region** | Singapore |
| **MongoDB** | cluster0/rez-auth |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway |
| **GitHub** | imrejaul007/rez-auth-service |
| **Status** | Active |

### 3. rez-wallet-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-wallet-service-36vo.onrender.com |
| **Port** | 4004 |
| **Region** | Singapore |
| **MongoDB** | cluster0/rez-wallet |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, auth-service, payment-service |
| **GitHub** | imrejaul007/rez-wallet-service |
| **Status** | Active |

### 4. rez-payment-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-payment-service.onrender.com |
| **Port** | 4001 |
| **Region** | Singapore |
| **MongoDB** | cluster0/rez-payments |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, auth-service, wallet-service |
| **GitHub** | imrejaul007/rez-payment-service |
| **Status** | Active |

### 5. rez-order-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-order-service-hz18.onrender.com |
| **Port** | 3006 |
| **Region** | Singapore |
| **MongoDB** | cluster0/rez-orders |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, auth-service, wallet-service, payment-service, merchant-service |
| **GitHub** | imrejaul007/rez-order-service |
| **Status** | Active |

### 6. rez-merchant-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-merchant-service-n3q2.onrender.com |
| **Port** | 4005 |
| **Region** | Singapore |
| **MongoDB** | cluster0/rez-merchant |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, auth-service, catalog-service |
| **GitHub** | imrejaul007/rez-merchant-service |
| **Status** | Active |

### 7. rez-catalog-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-catalog-service-1.onrender.com |
| **Port** | 4003 |
| **Region** | Singapore |
| **MongoDB** | cluster0/rez-catalog |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, merchant-service, search-service |
| **GitHub** | imrejaul007/rez-catalog-service |
| **Status** | Active |

### 8. rez-search-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-search-service.onrender.com |
| **Port** | 4003 |
| **Region** | Singapore |
| **MongoDB** | cluster0/rez-search |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, catalog-service |
| **GitHub** | imrejaul007/rez-search-service |
| **Status** | Active |

---

## AI/INTELLIGENCE SERVICES (9)

### 9. rez-event-platform
| Property | Value |
|----------|-------|
| **URL** | https://rez-event-platform.onrender.com |
| **Port** | 4008 |
| **Region** | Oregon |
| **MongoDB** | rez-intent-graph/rez-events |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | action-engine, feedback-service, first-loop |
| **GitHub** | imrejaul007/rez-event-platform |
| **Status** | Active |

### 10. rez-action-engine
| Property | Value |
|----------|-------|
| **URL** | https://rez-action-engine.onrender.com |
| **Port** | 4009 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-action-engine |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | event-platform, intent-graph, marketing-service |
| **GitHub** | imrejaul007/rez-action-engine |
| **Status** | Active |

### 11. rez-feedback-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-feedback-service.onrender.com |
| **Port** | 4010 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-feedback |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | event-platform, intelligence-hub |
| **GitHub** | imrejaul007/rez-feedback-service |
| **Status** | Active |

### 12. rez-first-loop
| Property | Value |
|----------|-------|
| **URL** | https://rez-first-loop.onrender.com |
| **Port** | Worker |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-first-loop |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | event-platform, intent-graph |
| **GitHub** | imrejaul007/rez-first-loop |
| **Status** | Active |

### 13. rez-intent-graph
| Property | Value |
|----------|-------|
| **URL** | https://rez-intent-graph.onrender.com |
| **Port** | 3007 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-intent-graph |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | event-platform, action-engine, intelligence-hub |
| **GitHub** | imrejaul007/rez-intent-graph |
| **Status** | Active |

### 14. rez-intent-agent
| Property | Value |
|----------|-------|
| **URL** | https://rez-intent-agent.onrender.com |
| **Port** | 4009 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | intent-graph, action-engine |
| **GitHub** | imrejaul007/rez-intent-agent |
| **Status** | Active |

### 15. REZ-intelligence-hub
| Property | Value |
|----------|-------|
| **URL** | https://rez-intelligence-hub.onrender.com |
| **Port** | 4020 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-intelligence |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | user-intelligence, merchant-intelligence, personalization |
| **GitHub** | imrejaul007/REZ-intelligence-hub |
| **Status** | Active |

### 16. REZ-user-intelligence-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-user-intelligence-service.onrender.com |
| **Port** | 3004 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-user-intelligence |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | intelligence-hub, intent-graph |
| **GitHub** | imrejaul007/REZ-user-intelligence-service |
| **Status** | Active |

### 17. REZ-merchant-intelligence-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-merchant-intelligence-service.onrender.com |
| **Port** | 4012 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-merchant-intelligence |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | intelligence-hub, merchant-service |
| **GitHub** | imrejaul007/REZ-merchant-intelligence-service |
| **Status** | Active |

---

## MARKETING SERVICES (6)

### 18. rez-marketing-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-marketing-service.onrender.com |
| **Port** | 4001 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-marketing |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, decision-service, unified-messaging |
| **GitHub** | imrejaul007/rez-marketing-service |
| **Status** | Active |

### 19. rez-ads-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-ads-service.onrender.com |
| **Port** | 4002 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-ads |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, targeting-engine, adBazaar web |
| **GitHub** | imrejaul007/rez-ads-service |
| **Status** | Active |

### 20. rez-decision-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-decision-service.onrender.com |
| **Port** | 4101 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-decision |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | lead-intelligence, abandonment-tracker, action-engine |
| **GitHub** | imrejaul007/rez-decision-service |
| **Status** | Active |

### 21. rez-lead-intelligence
| Property | Value |
|----------|-------|
| **URL** | https://rez-lead-intelligence.onrender.com |
| **Port** | 4106 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-lead |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | decision-service, unified-messaging |
| **GitHub** | imrejaul007/rez-lead-intelligence |
| **Status** | Active |

### 22. rez-abandonment-tracker
| Property | Value |
|----------|-------|
| **URL** | https://rez-abandonment-tracker.onrender.com |
| **Port** | 4108 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-abandonment |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | decision-service, unified-messaging |
| **GitHub** | imrejaul007/rez-abandonment-tracker |
| **Status** | Active |

### 23. rez-unified-messaging
| Property | Value |
|----------|-------|
| **URL** | https://rez-unified-messaging.onrender.com |
| **Port** | 4025 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph/rez-messaging |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **External APIs** | Twilio, SendGrid, WhatsApp, Firebase |
| **Connects To** | marketing-service, lead-intelligence, abandonment-tracker |
| **GitHub** | imrejaul007/rez-unified-messaging |
| **Status** | Active |

---

## HOTEL/OTA SERVICES (5)

### 24. hotel-ota-api
| Property | Value |
|----------|-------|
| **URL** | https://hotel-ota-api.onrender.com |
| **Port** | 4000 |
| **Region** | Oregon |
| **MongoDB** | hotel-pms |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | hotel-ota-web, hotel-ota-hotel-panel, hotel-ota-admin |
| **GitHub** | imrejaul007/Hotel-OTA |
| **Status** | Active |

### 25. hotel-ota-web
| Property | Value |
|----------|-------|
| **URL** | https://hotel-ota-web.onrender.com |
| **Port** | 4001 |
| **Region** | Oregon |
| **MongoDB** | hotel-pms |
| **Connects To** | hotel-ota-api |
| **GitHub** | imrejaul007/Hotel-OTA |
| **Status** | Active |

### 26. hotel-ota-hotel-panel
| Property | Value |
|----------|-------|
| **URL** | https://hotel-ota-hotel-panel.onrender.com |
| **Port** | 4002 |
| **Region** | Oregon |
| **MongoDB** | hotel-pms |
| **Connects To** | hotel-ota-api |
| **GitHub** | imrejaul007/Hotel-OTA |
| **Status** | Active |

### 27. hotel-ota-admin
| Property | Value |
|----------|-------|
| **URL** | https://hotel-ota-admin.onrender.com |
| **Port** | 4003 |
| **Region** | Oregon |
| **MongoDB** | hotel-pms |
| **Connects To** | hotel-ota-api |
| **GitHub** | imrejaul007/Hotel-OTA |
| **Status** | Active |

### 28. hotel-ota
| Property | Value |
|----------|-------|
| **URL** | https://hotel-ota.onrender.com |
| **Port** | 4004 |
| **Region** | Singapore |
| **MongoDB** | hotel-pms |
| **Connects To** | hotel-ota-api |
| **GitHub** | imrejaul007/Hotel-OTA |
| **Status** | Active |

---

## CORPPERKS SERVICES (3)

### 29. corpperks-api
| Property | Value |
|----------|-------|
| **URL** | https://corpperks-api.onrender.com |
| **Port** | 4005 |
| **Region** | Singapore |
| **MongoDB** | cluster0 |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | corpperks-admin, corpperks-hotel |
| **GitHub** | imrejaul007/CorpPerks |
| **Status** | Active |

### 30. corpperks-admin
| Property | Value |
|----------|-------|
| **URL** | https://corpperks-admin.onrender.com |
| **Port** | 4006 |
| **Region** | Singapore |
| **MongoDB** | cluster0 |
| **Connects To** | corpperks-api |
| **GitHub** | imrejaul007/CorpPerks |
| **Status** | Active |

### 31. corpperks-hotel
| Property | Value |
|----------|-------|
| **URL** | https://corpperks-hotel.onrender.com |
| **Port** | 4007 |
| **Region** | Singapore |
| **MongoDB** | cluster0 |
| **Connects To** | corpperks-api, hotel-ota-api |
| **GitHub** | imrejaul007/CorpPerks |
| **Status** | Active |

---

## WEB APPLICATIONS (6)

### 32. adBazaar
| Property | Value |
|----------|-------|
| **URL** | https://adbazaar.onrender.com |
| **Region** | Singapore |
| **Backend** | rez-ads-service |
| **Connects To** | rez-ads-service, targeting-engine |
| **GitHub** | imrejaul007/adBazaar |
| **Status** | Active |

### 33. Rendez
| Property | Value |
|----------|-------|
| **URL** | https://rendez-entv.onrender.com |
| **Region** | Singapore |
| **Backend** | api-gateway |
| **Connects To** | rez-api-gateway, auth-service |
| **GitHub** | imrejaul007/Rendez |
| **Status** | Active |

### 34. restaurantapp
| Property | Value |
|----------|-------|
| **URL** | https://restaurantapp-28fh.onrender.com |
| **Region** | Singapore |
| **Backend** | merchant-service |
| **Connects To** | rez-merchant-service, catalog-service |
| **GitHub** | imrejaul007/restaurantapp |
| **Status** | Active |

### 35. rez-app-consumer-1
| Property | Value |
|----------|-------|
| **URL** | https://rez-app-consumer-1.onrender.com |
| **Region** | Singapore |
| **Backend** | api-gateway |
| **Connects To** | rez-api-gateway, auth-service, wallet-service, order-service |
| **GitHub** | imrejaul007/rez-app-consumer |
| **Status** | Active |

### 36. rez-app-consumer
| Property | Value |
|----------|-------|
| **URL** | https://rez-app-consumer.onrender.com |
| **Region** | Oregon |
| **Backend** | api-gateway |
| **Connects To** | rez-api-gateway, auth-service, wallet-service, order-service |
| **GitHub** | imrejaul007/rez-app-consumer |
| **Status** | Active |

### 37. ReZ-Hotel-pms
| Property | Value |
|----------|-------|
| **URL** | https://rez-hotel-pms.onrender.com |
| **Region** | Singapore |
| **Backend** | hotel-ota-api |
| **Connects To** | hotel-ota-api |
| **GitHub** | imrejaul007/ReZ-Hotel-pms |
| **Status** | Active |

---

## EVENT PIPELINE SERVICES (3)

### 38. analytics-events
| Property | Value |
|----------|-------|
| **URL** | https://analytics-events-37yy.onrender.com |
| **Port** | 3015 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | event-platform, all services |
| **GitHub** | imrejaul007/analytics-events |
| **Status** | Active |

### 39. rez-media-events
| Property | Value |
|----------|-------|
| **URL** | https://rez-media-events-lfym.onrender.com |
| **Port** | 3008 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | analytics-events, event-platform |
| **GitHub** | imrejaul007/rez-media-events |
| **Status** | Active |

### 40. rez-notification-events
| Property | Value |
|----------|-------|
| **URL** | https://rez-notification-events-mwdz.onrender.com |
| **Port** | 3005 |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | unified-messaging, event-platform |
| **GitHub** | imrejaul007/rez-notification-events |
| **Status** | Active |

---

## OTHER SERVICES (5)

### 41. rez-worker
| Property | Value |
|----------|-------|
| **URL** | https://rez-worker.onrender.com |
| **Type** | Background Worker |
| **Region** | Singapore |
| **MongoDB** | rez-intent-graph |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | scheduler-service, all services |
| **GitHub** | imrejaul007/rez-worker |
| **Status** | Active |

### 42. rez-karma-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-karma-service.onrender.com |
| **Port** | 3009 |
| **Region** | Singapore |
| **MongoDB** | karma/karma |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, auth-service |
| **GitHub** | imrejaul007/rez-karma-service |
| **Status** | Active |

### 43. rez-gamification-service
| Property | Value |
|----------|-------|
| **URL** | https://rez-gamification-service-3b5d.onrender.com |
| **Port** | 3001 |
| **Region** | Singapore |
| **MongoDB** | karma/rez-gamification |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | api-gateway, wallet-service, order-service |
| **GitHub** | imrejaul007/rez-gamification-service |
| **Status** | Active |

### 44. rez-backend
| Property | Value |
|----------|-------|
| **URL** | https://rez-backend-8dfu.onrender.com |
| **Port** | 3000 |
| **Region** | Singapore |
| **MongoDB** | cluster0 |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | All services |
| **GitHub** | imrejaul007/rez-backend |
| **Status** | Active |

### 45. rez-merchant-integrations
| Property | Value |
|----------|-------|
| **URL** | https://rez-merchant-integrations.onrender.com |
| **Port** | 4012 |
| **Region** | Singapore |
| **MongoDB** | cluster0 |
| **Redis** | redis-cluster.redns.redis-cloud.com:12121 |
| **Connects To** | merchant-service, catalog-service |
| **GitHub** | imrejaul007/rez-merchant-integrations |
| **Status** | Active |

---

## SUSPENDED SERVICES (34)

These services are suspended and should be archived:

### REZ Core Duplicates (8)
- REZ-intelligence-hub
- REZ-user-intelligence-service
- REZ-merchant-intelligence-service
- rez-event-platform
- rez-action-engine
- rez-feedback-service
- rez-first-loop
- rez-intent-graph

### REZ AI Duplicates (10)
- REZ-support-copilot
- REZ-ad-copilot
- REZ-push-service
- REZ-observability
- REZ-feature-flags
- REZ-personalization-engine
- REZ-recommendation-engine
- REZ-targeting-engine
- REZ-consumer-copilot
- REZ-merchant-copilot

### REZ Marketing Duplicates (3)
- analytics-events
- rez-media-events
- rez-notification-events

### REZ Utilities Duplicates (4)
- rez-automation-service
- rez-scheduler-service
- rez-insights-service
- rez-worker

### Other Suspended (9)
- nextabizz
- rez-karma-app
- rez-web-menu
- rez-wallet-service (background_worker)
- rez-order-service (background_worker)
- rez-merchant-service (background_worker)
- rez-gamification-service (background_worker)
- rez-catalog-service
- rez-backend-1

---

## SERVICE DEPENDENCY GRAPH

```
                                    ┌─────────────────┐
                                    │   Consumers     │
                                    │  Mobile Apps    │
                                    └────────┬────────┘
                                             │
                                             ▼
                                   ┌─────────────────┐
                                   │ rez-api-gateway │ (3000)
                                   └────────┬────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                                   │                                   │
        ▼                                   ▼                                   ▼
┌───────────────┐                   ┌───────────────┐                   ┌───────────────┐
│ auth-service  │                   │ wallet-service│                   │order-service  │
│ (4002)       │                   │ (4004)        │                   │ (3006)        │
└───────────────┘                   └───────────────┘                   └───────────────┘
        │                                   │                                   │
        └───────────┬───────────────────────┘                                   │
                    │                                                           │
                    ▼                                                           ▼
           ┌───────────────┐                                           ┌───────────────┐
           │payment-service│                                           │merchant-svc   │
           │ (4001)       │                                           │ (4005)        │
           └───────────────┘                                           └───────────────┘
                    │                                                           │
                    └───────────────────┬───────────────────────────────────────┘
                                        │
                                        ▼
                               ┌───────────────┐
                               │ catalog-svc   │
                               │ (4003)       │
                               └───────────────┘

                                    ┌─────────────────┐
                                    │   REZ MIND      │
                                    │ Intelligence    │
                                    └────────┬────────┘
                                             │
                                             ▼
                         ┌───────────────────────────────────┐
                         │      rez-event-platform           │
                         │           (4008)                  │
                         └───────────────┬───────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ action-engine   │           │ feedback-service│           │  intent-graph   │
│ (4009)          │           │ (4010)          │           │ (3007)          │
└─────────────────┘           └─────────────────┘           └────────┬────────┘
         │                                                       │
         │                                                       ▼
         │                                           ┌─────────────────────┐
         │                                           │   intelligence-hub  │
         │                                           │      (4020)         │
         │                                           └──────────┬──────────┘
         │                                                      │
         ▼                                                      ▼
┌─────────────────┐                                   ┌─────────────────┐
│ intent-agent    │                                   │user/merchant    │
│ (4009)         │                                   │intelligence     │
└─────────────────┘                                   │(3004/4012)      │
                                                     └─────────────────┘

                                    ┌─────────────────┐
                                    │   Marketing     │
                                    │   Platform      │
                                    └────────┬────────┘
                                             │
                                             ▼
                         ┌───────────────────────────────────┐
                         │     rez-decision-service          │
                         │           (4101)                  │
                         └───────────────┬───────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│lead-intelligence│           │abandonment-trk │           │ unified-messaging│
│ (4106)          │           │ (4108)          │           │ (4025)          │
└─────────────────┘           └─────────────────┘           └────────┬────────┘
                                                                 │
                                    ┌──────────────────────────────┴──────────┐
                                    │                                               │
                                    ▼                                               ▼
                            ┌─────────────┐                               ┌─────────────┐
                            │  WhatsApp   │                               │    SMS      │
                            │  Twilio     │                               │   Email     │
                            └─────────────┘                               └─────────────┘
```

---

## HEALTH CHECK ENDPOINTS

| Service | Health Endpoint |
|---------|----------------|
| rez-api-gateway | https://rez-api-gateway.onrender.com/health |
| rez-auth-service | https://rez-auth-service.onrender.com/health |
| rez-wallet-service | https://rez-wallet-service-36vo.onrender.com/health |
| rez-payment-service | https://rez-payment-service.onrender.com/health |
| rez-order-service | https://rez-order-service-hz18.onrender.com/health |
| rez-merchant-service | https://rez-merchant-service-n3q2.onrender.com/health |
| rez-event-platform | https://rez-event-platform.onrender.com/health |
| rez-action-engine | https://rez-action-engine.onrender.com/health |
| rez-feedback-service | https://rez-feedback-service.onrender.com/health |
| rez-intent-graph | https://rez-intent-graph.onrender.com/health |
| rez-marketing-service | https://rez-marketing-service.onrender.com/health |
| rez-ads-service | https://rez-ads-service.onrender.com/health |
| rez-decision-service | https://rez-decision-service.onrender.com/health |
| hotel-ota-api | https://hotel-ota-api.onrender.com/health |
| corpperks-api | https://corpperks-api.onrender.com/health |

---

**Document Version:** 1.0
**Last Updated:** May 6, 2026
**Total Active Services:** 45
**Total Suspended:** 34
