# REPOSITORIES AUDIT REPORT

**Date:** May 11, 2026

---

## SUMMARY

| Category | Count |
|----------|-------|
| Repos with ONLY main branch | 12 (SAFE TO DELETE) |
| Repos with multiple branches | 7 (NEEDS REVIEW) |

---

## SAFE TO DELETE (Only main branch)

These repos have NO unique branches - main branch content is already in new repos:

| Repo | New Location | Reason |
|------|-------------|--------|
| dooh-screen-app | REZ-Consumer | Only main |
| REZ-circuit-breaker | RABTUL-Technologies | Only main |
| REZ-retry-service | RABTUL-Technologies | Only main |
| REZ-dlq-service | RABTUL-Technologies | Only main |
| REZ-idempotency-service | RABTUL-Technologies | Only main |
| rez-insights-service | REZ-Intelligence | Only main |
| rez-habixo-service | StayOwn-Hospitality | Only main |

---

## NEEDS REVIEW - Multiple Branches

### 1. rez-payment-service (8 branches)

Branches:
- main
- feat/add-readme
- feature/rez-v5-20260430-payment-service
- fix/payment-service/type-fixes
- fix/security/payment-hardening
- fix/wallet-credit-race-condition
- security-fix/audit-wave-11-13
- security-fix/fail-fast-auth-url

**Important branches:**
- security-fix/* (security hardening)
- fix/wallet-credit-race-condition (bug fix)

### 2. rez-wallet-service (4 branches)

Branches:
- main
- feature/rez-v5-20260430-wallet-service
- feature/security/fraud-limits-day1
- fix/audit-wave2/m19-m23-m24-n1-hmac

**Important branches:**
- feature/security/fraud-limits-day1 (security feature)
- fix/* (audit fixes)

### 3. rez-app-consumer (20 branches)

Branches:
- main
- bugfix/*
- feat/*
- feature/*
- fix/*
- launch-prep
- launch-prep-phase3
- production-audit-fixes

**Important branches:**
- launch-prep-phase3 (launch prep)
- production-audit-fixes (production fixes)
- bugfix/* (bug fixes)

### 4. rez-intent-graph (10 branches)

Branches:
- main
- feat/*
- fix/*

**Important branches:**
- feat/* (features)
- fix/* (fixes)

### 5. rez-app-admin (20 branches)

Branches:
- main
- audit
- feature/*
- fix/*
- production-audit-fixes
- refactor
- ten-agent-round

**Important branches:**
- production-audit-fixes
- audit
- ten-agent-round

### 6. hotel-ota (7 branches)

Branches:
- main
- bugfix/*
- fix/*

### 7. rez-merchant-service (4 branches)

Branches:
- main
- feature/*
- fix/*
- local-changes-20260510

---

## RECOMMENDATION

### STEP 1: Merge important branches FIRST

Before deleting old repos, merge these branches:

1. **rez-payment-service** → RABTUL-Technologies
   - security-fix/payment-hardening
   - fix/wallet-credit-race-condition

2. **rez-wallet-service** → RABTUL-Technologies
   - feature/security/fraud-limits-day1

3. **rez-app-consumer** → REZ-Consumer
   - launch-prep-phase3
   - production-audit-fixes

4. **rez-app-admin** → RTNM-Group
   - production-audit-fixes
   - ten-agent-round

5. **rez-merchant-service** → REZ-Merchant
   - local-changes-20260510

### STEP 2: Then delete old repos

After merging, these repos can be safely deleted.

---

## REPOS TO DELETE (After merge)

All 19 old individual repos.

---

## NEW 8 COMPANY REPOS (Keep)

1. RTNM-Group
2. RABTUL-Technologies
3. REZ-Intelligence
4. REZ-Media
5. REZ-Merchant
6. REZ-Consumer
7. StayOwn-Hospitality
8. CorpPerks
