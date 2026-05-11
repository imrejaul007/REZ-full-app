# ReZ Platform - SOLVE ALL ISSUES

**Version:** 1.0
**Date:** May 7, 2026
**Status:** ACTION PLAN

---

## ISSUE 1: STUB REPOS (no source code)

### Problem
These repos have node_modules but NO source code:
- rez-bbps-service (stub)
- rez-recharge-service (stub)
- rez-einvoice-service (stub)
- rez-ml-feature-store (stub)
- rez-ml-model-registry (stub)

### Solution
| Option | Action |
|--------|--------|
| A | Delete stub repos from Render |
| B | Copy source from services/ folder |
| C | Keep stubs, implement later |

### Decision Needed
**What do you want to do with stub repos?**
1. Delete from GitHub/Render
2. Copy source from services/
3. Keep as stubs for later implementation

---

## ISSUE 2: AI AGENTS - Naming Mismatch

### Problem
Documented as "8 ReZ Mind Agents" but code uses specific file names:
- action-trigger.ts
- adaptive-scoring-agent.ts
- attribution-agent.ts
- autonomous-orchestrator.ts
- demand-signal-agent.ts
- feedback-loop-agent.ts
- network-effect-agent.ts
- personalization-agent.ts
- revenue-attribution-agent.ts
- scarcity-agent.ts
- support-agent.ts
- swarm-coordinator.ts

### Solution
**Action:** Update REZ-PRODUCT-MAP.md to list actual agent files with their purposes.

---

## ISSUE 3: HOTEL PMS Features

### Problem
Some features documented but stub:
- Channel Manager (stub)
- Dynamic Pricing (stub)
- Multi-property (stub)
- Coin Integration (stub)

### Solution
**Action:** Verify which features are implemented vs stub.

---

## ISSUE 4: KARMA APP Not Documented

### Solution
**Status:** Added to PRODUCT-MAP.md

---

## ISSUE 5: 6 QR TYPES

### Status
| QR Type | Status |
|---------|--------|
| ReZ Now QR | WORKING |
| Web Menu QR | WORKING |
| Room QR | WORKING |
| AdSQR | WORKING |
| Verify QR | PARTIAL |
| Creator QR | PARTIAL |

**Action:** Verify each QR type is implemented.

---

## ISSUE 6: MISSING DEPLOYMENTS

### Services Not Deployed
| Service | render.yaml | Has Source |
|---------|-------------|------------|
| rez-ml-* | Yes | Check services/ |
| rez-bbps-service | Yes | NO SOURCE |
| rez-recharge-service | Yes | NO SOURCE |
| rez-einvoice-service | Yes | NO SOURCE |

---

## ACTION PLAN

### IMMEDIATE (Today)

1. [ ] Delete stub repos OR copy source from services/
2. [ ] Verify 6 QR types working
3. [ ] Update PRODUCT-MAP.md with correct AI agents
4. [ ] Push all updates

### SHORT TERM (This Week)

1. [ ] Deploy stub repos OR delete them
2. [ ] Verify Hotel PMS features
3. [ ] Complete any missing implementations

### DECISIONS NEEDED

1. **Delete stubs or implement?**
2. **Which services are priority?**
3. **Which QR types need work?**

---

**User Decision Required:**
- Delete stubs or implement BBPS/Recharge/Einvoice/ML services?
- Priority order for deployment?
