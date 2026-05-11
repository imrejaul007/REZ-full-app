# REZ Service Dependency Matrix

**Generated:** 2026-05-04
**Version:** 1.0.0

---

## Service Communication Matrix

| Consumer | Provider | Protocol | Type | Criticality |
|----------|----------|----------|------|-------------|
| **API Gateway** | Auth Service | HTTP | Sync | Critical |
| **API Gateway** | Payment Service | HTTP | Sync | Critical |
| **API Gateway** | Wallet Service | HTTP | Sync | Critical |
| **API Gateway** | Order Service | HTTP | Sync | Critical |
| **API Gateway** | Catalog Service | HTTP | Sync | High |
| **API Gateway** | Hotel Service | HTTP | Sync | High |
| **API Gateway** | Notification Service | HTTP | Sync | Medium |
| **API Gateway** | External (Makcorps) | HTTP | Sync | Low |
| **API Gateway** | External (NextaBizz) | HTTP | Sync | Low |
| **Auth Service** | MongoDB | Wire Protocol | Sync | Critical |
| **Auth Service** | Redis | Wire Protocol | Sync | High |
| **Payment Service** | Wallet Service | HTTP | Sync | Critical |
| **Payment Service** | MongoDB | Wire Protocol | Sync | Critical |
| **Payment Service** | Redis | Wire Protocol | Sync | High |
| **Payment Service** | Razorpay | HTTP | Sync | Critical |
| **Wallet Service** | MongoDB | Wire Protocol | Sync | Critical |
| **Wallet Service** | Redis | Wire Protocol | Sync | High |
| **Order Service** | Payment Service | HTTP | Sync | High |
| **Order Service** | Wallet Service | HTTP | Sync | High |
| **Order Service** | Catalog Service | HTTP | Sync | Medium |
| **Order Service** | MongoDB | Wire Protocol | Sync | Critical |
| **Order Service** | Redis | Wire Protocol | Sync | High |
| **Merchant Service** | Auth Service | HTTP | Sync | High |
| **Merchant Service** | MongoDB | Wire Protocol | Sync | Critical |
| **Gamification Service** | Wallet Service | HTTP | Sync | High |
| **Gamification Service** | MongoDB | Wire Protocol | Sync | Critical |
| **CorpPerks Service** | Wallet Service | HTTP | Sync | High |
| **CorpPerks Service** | Merchant Service | HTTP | Sync | Medium |
| **Finance Service** | Wallet Service | HTTP | Sync | High |
| **Finance Service** | MongoDB | Wire Protocol | Sync | Critical |
| **Action Engine** | Event Platform | HTTP | Async | High |
| **Feedback Service** | MongoDB | Wire Protocol | Sync | High |
| **Intelligence Hub** | MongoDB | Wire Protocol | Sync | High |
| **Intent Service** | MongoDB | Wire Protocol | Sync | High |
| **Search Service** | MongoDB | Wire Protocol | Sync | High |
| **Notification Service** | Redis | Wire Protocol | Async | High |
| **Scheduler Service** | MongoDB | Wire Protocol | Sync | Medium |
| **All Services** | Monitoring | Metrics | Push | Medium |
| **All Services** | Logging | HTTP | Push | Medium |

---

## Queue Dependencies (BullMQ)

| Queue Name | Producer | Consumer | Retention |
|------------|----------|----------|-----------|
| `send-email` | All services | Notification | 24h |
| `send-sms` | All services | Notification | 24h |
| `send-push` | All services | Notification | 24h |
| `send-webhook` | All services | Notification | 24h |
| `process-order` | Order Service | Order Service | 7d |
| `payment-capture` | Payment Service | Payment Service | 7d |
| `wallet-credit` | Payment Service | Wallet Service | 7d |
| `wallet-debit` | Order Service | Wallet Service | 7d |
| `inventory-sync` | Order Service | Catalog Service | 24h |

---

## Database Ownership

| Database | Primary Owner | Read Replicas | Collections |
|----------|--------------|---------------|-------------|
| `rez-auth` | Auth Service | Analytics | `users`, `sessions`, `devices`, `otp` |
| `rez-payments` | Payment Service | Finance | `transactions`, `refunds`, `settlements` |
| `rez-wallet` | Wallet Service | Analytics | `wallets`, `transactions`, `ledger` |
| `rez-orders` | Order Service | Analytics | `orders`, `line_items`, `fulfillment` |
| `rez-merchants` | Merchant Service | Analytics | `merchants`, `locations`, `kyc` |
| `rez-catalog` | Catalog Service | Search | `products`, `categories`, `inventory` |
| `rez-intelligence` | Intelligence Hub | Analytics | `profiles`, `signals`, `segments` |
| `rez-events` | Event Platform | Analytics | `events`, `schemas` |
| `rez-gamification` | Gamification | Analytics | `points`, `rewards`, `achievements` |

---

## External Service Dependencies

| External Service | Used By | Purpose | SLA |
|-----------------|---------|---------|-----|
| Razorpay | Payment Service | Payment processing | 99.9% |
| SendGrid/Resend | Notification Service | Transactional email | 99.5% |
| Twilio | Notification Service | SMS | 99% |
| FCM | Push Service | Push notifications | 99% |
| Makcorps API | Hotel Service | Hotel inventory | N/A |
| NextaBizz API | Catalog Service | Product data | N/A |

---

## Feature Flag Dependencies

| Flag | Default | Controls |
|------|---------|----------|
| `USE_NEW_INTENT_SERVICE` | `false` | Intent routing |
| `USE_NEW_COPILOT` | `false` | Copilot routing |
| `USE_NEW_DECISION_SERVICE` | `false` | Decision routing |
| `USE_NEW_AD_PLATFORM` | `false` | Ad routing |
| `learning_enabled` | `false` | ML feedback loop |
| `adaptive_enabled` | `false` | Auto adjustments |
| `auto_execute_safe` | `true` | Safe auto-execution |
| `require_approval_risky` | `true` | Human approval |

---

## Health Check Endpoints

| Service | Endpoint | Checks |
|---------|----------|--------|
| All services | `/health` | Basic liveness |
| All services | `/health/ready` | Liveness + dependencies |
| API Gateway | `/admin/circuits` | Circuit breaker status |
| MongoDB | Internal | Replica set sync |
| Redis | Internal | Ping/pong |

---

## Circuit Breaker Configuration

| Circuit | Threshold | Timeout | Reset After |
|---------|-----------|---------|-------------|
| `payment-service` | 5 failures | 60s | 30s |
| `order-service` | 5 failures | 60s | 30s |
| `catalog-service` | 3 failures | 30s | 15s |
| `hotel-service` | 5 failures | 60s | 30s |
| `notification-service` | 3 failures | 30s | 15s |
| `wallet-service` | 5 failures | 60s | 30s |
| `makcorps-external` | 3 failures | 45s | 20s |
| `nextabizz-external` | 3 failures | 45s | 20s |

---

## Port Registry

| Port | Service | Protocol | Public |
|------|---------|----------|--------|
| 3000 | api-gateway (legacy) | HTTP | Yes |
| 3001 | rez-api-gateway | HTTP | Yes |
| 4001 | rez-payment-service | HTTP | No |
| 4002 | rez-auth-service | HTTP | No |
| 4003 | rez-catalog-service | HTTP | No |
| 4004 | rez-wallet-service | HTTP | No |
| 4005 | rez-merchant-service | HTTP | No |
| 4007 | rez-ads-service | HTTP | No |
| 4009 | rez-intent-service | HTTP | No |
| 4012 | rez-order-service | HTTP | No |
| 4013 | rez-corpperks-service | HTTP | No |
| 4015 | rez-hotel-service | HTTP | No |
| 4020 | rez-intelligence-hub | HTTP | No |
| 4030 | rez-feature-flags | HTTP | No |
| 6379 | Redis | RESP | No |
| 27017 | MongoDB Primary | Wire | No |
| 27018 | MongoDB Secondary 1 | Wire | No |
| 27019 | MongoDB Secondary 2 | Wire | No |
