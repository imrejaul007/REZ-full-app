# REZ ECOSYSTEM - COMPREHENSIVE AUDIT REPORT
**Date:** May 7, 2026
**Scope:** 94 services, docker-compose, dependencies, APIs

---

## SECTION 1: SERVICE INVENTORY

### Services Overview
| Metric | Count |
|--------|-------|
| Total directories | 94 |
| With src/ | 78 |
| With package.json | 81 |
| With build script | 64 |
| With dist/ | 33 |

### Services Missing src/ (16)
These services exist but have NO source code:
- rez-ab-testing-service
- rez-ads
- rez-ai-platform
- rez-consumer-copilot
- rez-contracts
- rez-core-platform
- rez-devops-config
- rez-error-intelligence
- rez-fraud-detection-service
- rez-karma-mobile
- rez-marketing-backend
- rez-marketing-service
- rez-ride
- rez-training-data-service
- rez-utilities-platform
- rez-web-menu

### Services Missing package.json (13)
These services exist but have NO package.json:
- rez-ab-testing-service
- rez-abandonment-tracker
- rez-admin-service
- rez-ads
- rez-api-gateway
- rez-devops-config
- rez-error-intelligence
- rez-fraud-detection-service
- rez-marketing-service
- rez-ml-engine
- rez-ops-dashboard
- rez-ride
- rez-training-data-service

---

## SECTION 2: CRITICAL PORT ISSUES

### Services with WRONG Ports
| Service | Current Port | Issue |
|---------|-------------|-------|
| rez-targeting-engine | 900000 | Obviously wrong |
| rez-intelligence-hub | 1 | Obviously wrong |
| rez-dooh-service | 3000 | Conflicts with API Gateway |

### PORT CONFLICTS
| Port | Service A | Service B |
|------|-----------|-----------|
| 3000 | rez-dooh-service | API Gateway (standard) |
| 3006 | rez-order-service | rez-media-events |
| 4007 | rez-ad-campaigns | rez-ads-service |
| 4004 | rez-wallet-service | rez-dooh-service |
| 3004 | rez-gamification-service | rez-user-intelligence-service |

### Documented vs Actual Ports
| Service | Documented | Actual |
|---------|-----------|--------|
| rez-payment-service | 4001 | 4001 ✓ |
| rez-order-service | 3006 | 3006 ✓ |
| rez-catalog-service | 3005 | 3005 ✓ |
| rez-wallet-service | 4004 | 4004 ✓ |
| rez-merchant-service | 4005 | 4005 ✓ |
| rez-auth-service | 4002 | 4002 ✓ |
| rez-search-service | 4003 | 4003 ✓ |

---

## SECTION 3: DOCKER-COMPOSE ISSUES

### Services in docker-compose.yml (22)
```
mongodb-primary, mongodb-secondary-1, mongodb-secondary-2
postgres
auth-api, merchant-api, rendez-backend, hotel-ota-api
rez-intelligence-hub
rez-intent-graph
rez-personalization-engine
rez-targeting-engine
rez-action-engine
rez-scheduler-service
rez-automation-service
rez-corporate-service
rez-feedback-service
rez-stayown-service
nextabizz-web, hotel-panel
rez-now
```

### CRITICAL: Core Services NOT in docker-compose
- rez-auth-service
- rez-payment-service
- rez-wallet-service
- rez-order-service
- rez-catalog-service
- rez-merchant-service
- rez-search-service
- rez-api-gateway
- rez-karma-service
- rez-gamification-service
- rez-marketing
- rez-ad-ai
- rez-ad-campaigns
- rez-ads-service

---

## SECTION 4: DEPENDENCY ISSUES

### zod Version Conflicts
| Service | Version | Status |
|---------|---------|--------|
| rez-payment-service | 4.3.6 | v4 (breaking) |
| rez-auth-service | 3.22.0 | v3 (ok) |
| rez-merchant-service | 3.23.6 | v3 (ok) |
| @rez/shared-types | 3.22.0 | v3 (ok) |

### @sentry/node Version Conflicts
| Service | Version | Status |
|---------|---------|--------|
| rez-merchant-service | 8.0.0 | v8 (breaking) |
| rez-auth-service | 7.120.4 | v7 (ok) |
| rez-payment-service | 7.120.4 | v7 (ok) |

### helmet Version Conflicts
| Service | Version | Status |
|---------|---------|--------|
| rez-merchant-service | 8.1.0 | v8 (breaking) |
| rez-auth-service | 7.1.0 | v7 (ok) |
| rez-payment-service | 7.1.0 | v7 (ok) |

---

## SECTION 5: BUILD STATUS

### Services that BUILD (33)
```
rez-auth-service ✓
rez-payment-service ✓
rez-order-service ✓
rez-wallet-service ✓
rez-catalog-service ✓
rez-merchant-service ✓
rez-search-service ✓
rez-api-gateway ✓
rez-intent-graph ✓
rez-intelligence-hub ✓
rez-action-engine ✓
rez-feedback-service ✓
rez-targeting-engine ✓
rez-scheduler-service ✓
rez-automation-service ✓
rez-corporate-service ✓
rez-stayown-service ✓
rez-ad-ai ✓
rez-ad-campaigns ✓
rez-ads-service ✓
rez-marketing ✓
rez-notification-events ✓
rez-push-service ✓
rez-gamification-service ✓
rez-user-intelligence-service ✓
rez-media-events ✓
rez-insights-service ✓
rez-ml-model-registry ✓
rez-ml-feature-store ✓
rez-procurement-service ✓
rez-profile-service ✓
rez-hotel-service ✓
rez-travel-service ✓
rez-knowledge-base-service ✓
```

### Services that DON'T BUILD (need investigation)
```
rez-karma-service
rez-finance-service
rez-uce
rez-unified-chat
rez-event-platform
rez-observability
rez-ops-dashboard
rez-contracts
rez-error-intelligence
rez-fraud-detection-service
```

---

## SECTION 6: ACTION PLAN

### Priority 1: CRITICAL FIXES

#### 1.1 Fix Port Assignments
```bash
# Fix rez-targeting-engine port
# File: rez-targeting-engine/src/index.ts
# Change: parseInt(process.env.PORT || '3013', 10)
# To: parseInt(process.env.PORT || '4013', 10)

# Fix rez-intelligence-hub port
# File: rez-intelligence-hub/src/index.ts
# Change: parseInt(process.env.PORT || '1', 10)
# To: parseInt(process.env.PORT || '4020', 10)

# Fix rez-dooh-service port conflict
# File: rez-dooh-service/src/index.ts
# Change: PORT || '3000'
# To: PORT || '4018'
```

#### 1.2 Add Core Services to docker-compose.yml
Add these services to docker-compose.yml:
- rez-auth-service
- rez-payment-service
- rez-wallet-service
- rez-order-service
- rez-catalog-service
- rez-merchant-service
- rez-api-gateway

#### 1.3 Standardize Dependencies
```bash
# Choose ONE version for each package:
zod: v3.23.x (all services)
@sentry/node: v7.x (all services)
helmet: v7.x (all services)
```

### Priority 2: HIGH PRIORITY

#### 2.1 Create Missing Services
For services without src/ - decide:
- Build them (if needed)
- Remove from documentation (if deprecated)

#### 2.2 Fix PORT Conflicts
Resolve:
- 3006: rez-order-service vs rez-media-events
- 4007: rez-ad-campaigns vs rez-ads-service
- 4004: rez-wallet-service vs rez-dooh-service
- 3004: rez-gamification-service vs rez-user-intelligence-service

### Priority 3: MEDIUM

#### 3.1 Increase Build Coverage
Get more services to build:
- Audit build errors
- Fix circular dependencies
- Increase Node memory for TypeScript

#### 3.2 Document API Endpoints
- Generate OpenAPI specs
- Update SOURCE-OF-TRUTH.md

---

## SECTION 7: RECOMMENDED IMMEDIATE ACTIONS

1. **Fix the 2 obviously wrong ports** (rez-targeting-engine, rez-intelligence-hub)
2. **Add core services to docker-compose.yml**
3. **Standardize zod/sentry/helmet to v3/v7**
4. **Resolve port conflicts** (3006, 4007, 4004, 3004)
5. **Remove or build 16 services without src/**

