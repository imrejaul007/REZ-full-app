# CRITICAL ISSUES FOUND - MUST FIX

**Date:** May 6, 2026
**Priority:** CRITICAL

---

## CRITICAL ISSUES (19 found)

### 1. EXPOSED SECRETS (13+ .env files)
**Issue:** Live credentials committed to git
**Impact:** Security breach risk
**Fix:** Remove .env files, add to .gitignore

### 2. PORT CONFLICTS
| Service | Conflicting Ports |
|---------|------------------|
| rez-api-gateway | 3000 vs 5002 |
| rez-action-engine | 4009 vs 3014 |
| rez-intent-graph | 3007 vs 4006 |
| rez-gamification-service | 3001 (conflicts with recommendation) |

### 3. REDIS FORMAT INCONSISTENCY
| Format | Used By |
|--------|---------|
| REDIS_HOST/PORT/PASSWORD | Old guides |
| REDIS_URL | New guides |

### 4. MONGODB URI CONFLICTS
| Cluster | Used By |
|---------|---------|
| cluster0 | Auth, Payment |
| rez-intent-graph | Intent Graph |

### 5. DEPLOYMENT GUIDE CONFLICTS
Multiple guides with different information:
- DEPLOYMENT-GUIDE.md
- DEPLOYMENT-GUIDE-FULL.md
- MASTER-DEPLOYMENT-GUIDE.md
- DEPLOYMENT.md

### 6. SERVICE ORDER CONFLICTS
One guide says deploy REZ Mind first, another says deploy Commerce Core first.

---

## HIGH PRIORITY ISSUES (28 found)

### 1. Redis/MongoDB credential reuse
### 2. Duplicate logging implementations
### 3. Missing database projections (N+1 queries)
### 4. E-Invoice stub not implemented
### 5. No rollback capability for deployments

---

## FIX PLAN

### Phase 1: CRITICAL (Must Fix Before Production)

1. **Remove exposed secrets**
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env' \
  --prune-empty --tag-name-filter cat -- --all
```

2. **Fix port conflicts**
- Verify actual ports from source code
- Update all guides to match

3. **Standardize Redis format**
- Choose: REDIS_URL (new format)
- Update all services to use same format

4. **Consolidate deployment guides**
- Keep: MASTER-DEPLOYMENT-GUIDE.md
- Archive: Others

5. **Fix service deploy order**
- REZ Mind first (event-platform, action-engine, feedback-service, intent-graph)
- Then Commerce Core
- Then Marketing
- Then Intelligence

### Phase 2: HIGH (Fix Within 1 Week)

1. Add database projections
2. Remove duplicate loggers
3. Implement E-Invoice
4. Add rollback scripts
5. Fix MongoDB indexes

---

## VERIFIED WORKING

### Services with Correct Ports
| Service | Port | Status |
|---------|------|--------|
| rez-auth-service | 4002 | ✓ |
| rez-payment-service | 4001 | ✓ |
| rez-merchant-service | 4005 | ✓ |
| rez-wallet-service | 4004 | ✓ |
| rez-search-service | 4003 | ✓ |
| rez-order-service | 3006 | ✓ |
| rez-event-platform | 4008 | ✓ |
| rez-feedback-service | 4010 | ✓ |
| rez-intelligence-hub | 4020 | ✓ |
| rez-lead-intelligence | 4106 | ✓ |

### Services Needing Port Verification
| Service | Port Listed | Verify |
|---------|-------------|--------|
| rez-api-gateway | 3000/5002 | Verify |
| rez-action-engine | 4009/3014 | Verify |
| rez-intent-graph | 3007/4006 | Verify |
| rez-gamification | 3001 | Verify |
| rez-catalog-service | 3005 | Verify |

---

## RECOMMENDED ACTIONS

### 1. Remove .env files from git
```bash
# Add to .gitignore
echo ".env" >> .gitignore
git rm --cached .env 2>/dev/null || true
```

### 2. Create single authoritative deployment guide
- Keep: MASTER-DEPLOYMENT-GUIDE.md
- Archive: Other guides

### 3. Standardize ports
- Audit each service's actual PORT
- Update all documentation

### 4. Standardize Redis format
- Use: REDIS_URL=redis://...

---

**END OF CRITICAL ISSUES**
