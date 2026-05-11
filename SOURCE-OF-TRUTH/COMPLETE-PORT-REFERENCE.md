# VERIFIED SERVICE PORTS

**Date:** May 6, 2026
**Source:** Actual source code verification

---

## VERIFIED CORRECT PORTS

### REZ Mind (Deploy First)
| Service | Port | Verified |
|---------|------|----------|
| rez-event-platform | 4008 | ✓ |
| REZ-action-engine | 4009 | ✓ |
| rez-feedback-service | 4010 | ✓ |
| rez-intent-graph | 3001 | ✓ |

### Commerce Core (Deploy Second)
| Service | Port | Verified |
|---------|------|----------|
| rez-auth-service | 4002 | ✓ |
| rez-payment-service | 4001 | ✓ |
| rez-merchant-service | 4005 | ✓ |
| rez-wallet-service | 4004 | ✓ |
| rez-search-service | 4003 | ✓ |
| rez-order-service | 3006 | ✓ |
| rez-catalog-service | 3005 | ✓ |
| rez-gamification-service | 3004 | ✓ |
| rez-api-gateway | 3001 | ✓ |

### Marketing Platform (Deploy Third)
| Service | Port | Verified |
|---------|------|----------|
| rez-marketing-service | 4000 | ✓ |
| rez-lead-intelligence | 4106 | ✓ |
| rez-abandonment-tracker | 4108 | ✓ |
| rez-decision-service | 4027 | ✓ |
| rez-unified-messaging | 4025 | ✓ |

### Intelligence Platform (Deploy Fourth)
| Service | Port | Verified |
|---------|------|----------|
| REZ-intelligence-hub | 4020 | ✓ |
| REZ-user-intelligence-service | 3004 | ✓ |
| REZ-merchant-intelligence-service | 4012 | ✓ |
| REZ-personalization-engine | 4017 | ✓ |
| REZ-recommendation-engine | 3001 | ⚠️ CONFLICT |

### Infrastructure
| Service | Port | Verified |
|---------|------|----------|
| REZ-push-service | 4013 | ✓ |
| REZ-support-copilot | 4033 | ✓ |
| rez-automation-service | 3001 | ⚠️ CONFLICT |
| REZ-observability | 4031 | ✓ |

---

## PORT CONFLICTS

### CONFLICT 1: Port 3001
| Service | Default Port | Issue |
|---------|--------------|-------|
| rez-intent-graph | 3001 | AI Brain - keep |
| REZ-recommendation-engine | 3001 | Move to 4015 |
| rez-api-gateway | 3001 | Move to 4016 |
| rez-automation-service | 3001 | Move to 4017 |

### CONFLICT 2: Port 4005
| Service | Default Port | Issue |
|---------|--------------|-------|
| rez-merchant-service | 4005 | Keep |
| rez-gamification-service | 4005 | Move to 3004 |

---

## RECOMMENDED FIXES

### Move these services to resolve conflicts:
| Service | Current | Recommended |
|---------|---------|-------------|
| REZ-recommendation-engine | 3001 | 4015 |
| REZ-personalization-engine | 4017 | Keep |
| REZ-targeting-engine | 3003 | Keep |
| REZ-observability | 4031 | Keep |

---

## ENVIRONMENT VARIABLE STANDARDIZATION

### Redis Format
**Use this format:**
```bash
REDIS_URL=redis://default:password@host:port
```

### MongoDB Format
**Use this format:**
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
```

---

## DEPLOY ORDER

### Phase 1: REZ Mind (Critical)
1. rez-event-platform (4008)
2. REZ-action-engine (4009)
3. rez-feedback-service (4010)
4. rez-intent-graph (3001)

### Phase 2: Commerce Core
1. rez-auth-service (4002)
2. rez-payment-service (4001)
3. rez-merchant-service (4005)
4. rez-wallet-service (4004)
5. rez-search-service (4003)
6. rez-order-service (3006)
7. rez-catalog-service (3005)
8. rez-gamification-service (3004)
9. rez-api-gateway (3001)

### Phase 3: Marketing Platform
1. rez-marketing-service (4000)
2. rez-lead-intelligence (4106)
3. rez-abandonment-tracker (4108)
4. rez-decision-service (4027)
5. rez-unified-messaging (4025)

### Phase 4: Intelligence Platform
1. REZ-intelligence-hub (4020)
2. REZ-user-intelligence-service (3004)
3. REZ-merchant-intelligence-service (4012)
4. REZ-personalization-engine (4017)
5. REZ-recommendation-engine (4015)

### Phase 5: Infrastructure
1. REZ-push-service (4013)
2. REZ-support-copilot (4033)
3. REZ-observability (4031)

---

## HEALTH CHECKS

| Service | Health Endpoint |
|---------|----------------|
| All services | GET /health |

---

**END OF PORT REFERENCE**
