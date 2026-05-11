# ReZ Platform - Missing Features & Gaps Audit

**Audit Date:** May 7, 2026
**Auditor:** Claude Code
**Status:** CRITICAL GAPS IDENTIFIED

---

## EXECUTIVE SUMMARY

| Category | Documented | Implemented | Gap |
|----------|-----------|-------------|-----|
| QR Types | 14 | 4 | 10 MISSING |
| AI Agents (8 ReZ Mind) | 8 | 8 (different names) | NAMING MISMATCH |
| Merchant Features | 20+ | ~12 | 8+ MISSING |
| Hotel PMS Features | 12+ | ~4 | 8+ MISSING |
| Services (empty stubs) | 46 | ~20 | 26 NOT DEPLOYED |

**Overall Platform Readiness: ~40%**

---

## MISSING FEATURES

### 1. QR TYPES (10 Missing)

| QR Type | Should be in | Documented In | Status |
|---------|-------------|--------------|--------|
| **Table QR** | rez-now, catalog-service | REZ-PRODUCT-MAP.md (Line 451) | **NOT IMPLEMENTED** - No table-specific QR routing |
| **Product QR** | catalog-service | REZ-PRODUCT-MAP.md (Line 452) | **NOT IMPLEMENTED** - No product-level QR codes |
| **Payment QR** | payment-service | REZ-PRODUCT-MAP.md (Line 453) | **NOT IMPLEMENTED** - No dedicated payment QR system |
| **Menu QR** | rez-now | REZ-PRODUCT-MAP.md (Line 454) | PARTIAL - Basic menu QR exists |
| **Store QR** | rez-now | REZ-PRODUCT-MAP.md (Line 455) | PARTIAL - Store profiles exist |
| **Campaign QR** | ads-service | REZ-PRODUCT-MAP.md (Line 456) | PARTIAL - Ad QR codes exist |
| **Room QR** | hotel-ota | REZ-PRODUCT-MAP.md (Line 457) | PARTIAL - Basic room QR exists |
| **Review QR** | feedback-service | REZ-PRODUCT-MAP.md (Line 458) | **NOT IMPLEMENTED** |
| **Referral QR** | auth-service | REZ-PRODUCT-MAP.md (Line 459) | **NOT IMPLEMENTED** |
| **Loyalty QR** | gamification | REZ-PRODUCT-MAP.md (Line 460) | **NOT IMPLEMENTED** |
| **Feedback QR** | feedback-service | REZ-PRODUCT-MAP.md (Line 461) | **NOT IMPLEMENTED** |
| **Share QR** | social | REZ-PRODUCT-MAP.md (Line 462) | **NOT IMPLEMENTED** |
| **Check-in QR** | events | REZ-PRODUCT-MAP.md (Line 462) | **NOT IMPLEMENTED** |
| **Loyalty Card QR** | gamification | REZ-PRODUCT-MAP.md (Line 463) | **NOT IMPLEMENTED** |

**Impact:** QR codes are the PRIMARY acquisition channel. Missing 10 of 14 types severely limits user engagement.

---

### 2. AI AGENTS - NAMING MISMATCH

| Documented Agent | Code Equivalent | Status |
|-----------------|----------------|--------|
| Acquisition Agent | **NOT FOUND** | **MISSING** - No acquisition-specific agent |
| Dormant Revival Agent | **NOT FOUND** | **MISSING** - Dormancy detection exists in intent-graph but no dedicated revival agent |
| Upsell Agent | **NOT FOUND** | **MISSING** - No dedicated upsell orchestration |
| Retention Agent | **NOT FOUND** | **MISSING** - No dedicated retention agent |
| Feedback Agent | feedback-loop-agent | PARTIAL - Feedback collection exists, routing to action NOT implemented |
| Support Agent | support-agent | **IMPLEMENTED** - Found in rez-intent-graph/src/agents/support-agent.ts |
| Merchant Intelligence Agent | demand-signal-agent + merchant-intelligence | PARTIAL - Demand signals exist, but not named "Merchant Intelligence" |
| Ad Optimization Agent | **NOT FOUND** | **MISSING** - No dedicated bid optimization or ad optimization agent |

**Implemented Agents (unmatched to docs):**
- DemandSignalAgent
- ScarcityAgent
- PersonalizationAgent
- AttributionAgent
- AdaptiveScoringAgent
- FeedbackLoopAgent
- NetworkEffectAgent
- RevenueAttributionAgent
- SwarmCoordinator
- AutonomousOrchestrator

**Impact:** The 8 ReZ Mind agents are NOT the same as the 8 documented agents. Marketing materials describe business outcomes, but code implements technical components.

---

### 3. MERCHANT FEATURES (8+ Missing)

| Feature | Documented In | Status |
|---------|--------------|--------|
| **Point of Sale (POS)** | REZ-PRODUCT-MAP.md (Line 595) | PARTIAL - Order processing exists, full POS NOT |
| **Kitchen Display (KDS)** | REZ-PRODUCT-MAP.md (Line 596) | **IMPLEMENTED** - Found in rez-now/app/api/kds/ |
| **CRM** | REZ-PRODUCT-MAP.md (Line 597) | **MISSING** - Customer profiles exist, full CRM NOT |
| **Inventory Management** | REZ-PRODUCT-MAP.md (Line 598) | **MISSING** - No dedicated inventory service |
| **QR Code Generator** | REZ-PRODUCT-MAP.md (Line 599) | PARTIAL - QR generation exists, customization NOT |
| **Analytics Dashboard** | REZ-PRODUCT-MAP.md (Line 600) | PARTIAL - Reports exist, AI-powered analytics NOT |
| **Campaign Manager** | REZ-PRODUCT-MAP.md (Line 601) | PARTIAL - Ad service exists, merchant self-serve NOT |
| **Multi-location** | REZ-PRODUCT-MAP.md (Line 602) | **MISSING** |
| **Staff Management** | REZ-PRODUCT-MAP.md (Line 603) | **MISSING** - Roles exist, scheduling/payroll NOT |
| **Order Management** | REZ-PRODUCT-MAP.md (Line 605) | **IMPLEMENTED** - order-service exists |
| **Reports** | REZ-PRODUCT-MAP.md (Line 607) | PARTIAL - Basic reports exist |
| **Menu Builder** | REZ-PRODUCT-MAP.md (Line 608) | **IMPLEMENTED** - catalog-service has menu CRUD |
| **Customer Tags** | REZ-PRODUCT-MAP.md (Line 609) | **MISSING** |
| **Feedback** | REZ-PRODUCT-MAP.md (Line 610) | PARTIAL - feedback-service exists |
| **Tax Management** | REZ-PRODUCT-MAP.md (Line 613) | **MISSING** |
| **Digital Marketing** | REZ-PRODUCT-MAP.md (Line 614) | **MISSING** |

---

### 4. HOTEL PMS FEATURES (8+ Missing)

| Feature | Documented In | Status |
|---------|--------------|--------|
| **Property Management** | REZ-PRODUCT-MAP.md (Line 693) | PARTIAL - Basic room management |
| **Booking Calendar** | REZ-PRODUCT-MAP.md (Line 694) | **MISSING** |
| **Channel Manager** | REZ-PRODUCT-MAP.md (Line 695) | **NOT IMPLEMENTED** - Booking.com/Expedia sync NOT found |
| **Rate Plans** | REZ-PRODUCT-MAP.md (Line 696) | **MISSING** |
| **Housekeeping** | REZ-PRODUCT-MAP.md (Line 697) | **NOT IMPLEMENTED** - Separate from room service |
| **Staff Scheduling** | REZ-PRODUCT-MAP.md (Line 698) | **MISSING** |
| **Financial Reports** | REZ-PRODUCT-MAP.md (Line 699) | **MISSING** |
| **Guest Messaging** | REZ-PRODUCT-MAP.md (Line 700) | **MISSING** |
| **Dynamic Pricing** | REZ-PRODUCT-MAP.md (Line 702) | **MISSING** |
| **Multi-property** | REZ-PRODUCT-MAP.md (Line 703) | **MISSING** |
| **Spa Booking** | REZ-PRODUCT-MAP.md (Line 727) | **NOT IMPLEMENTED** |
| **Minibar** | REZ-PRODUCT-MAP.md (Line 728) | **NOT IMPLEMENTED** |

---

### 5. EMPTY SERVICE STUBS (Not Implemented)

| Service | Should Have | Status |
|---------|-------------|--------|
| rez-bbps-service | Bill payment, recharge | **EMPTY** - Only node_modules and render.yaml |
| rez-recharge-service | Mobile/DTH recharge | **EMPTY** - No src directory |
| rez-einvoice-service | GST e-invoicing | **EMPTY** - No src directory |
| rez-fraud-detection-service | ML fraud detection | **EMPTY** - No src directory |
| rez-intent-predictor | ML predictions | PARTIAL - Basic structure exists |
| rez-feature-flags | Feature toggles | PARTIAL - Basic index.js only |
| rez-ride | Cab booking | **DOCUMENTED ONLY** - Docs exist, no code |

---

### 6. CONSUMER APP FEATURES

| Feature | Documented | Status |
|---------|-----------|--------|
| **Split Bill** | REZ-PRODUCT-MAP.md (Line 443) | PARTIAL - Mentioned in docs |
| **Gift Coins** | REZ-PRODUCT-MAP.md (Line 444) | **MISSING** - No gift functionality |
| **Mobile Recharge** | REZ-PRODUCT-MAP.md (Line 445) | **MISSING** - rez-recharge-service is empty |
| **Split Expense** | REZ-PRODUCT-MAP.md (Line 476) | **MISSING** |

---

## GAPS FOUND

### GAP 1: Transaction Loop Not Verified

| Aspect | Status |
|--------|--------|
| Core services deployment | NOT DONE |
| Health checks | NOT CONFIGURED |
| Transaction loop tests | NOT PASSED |
| Real data flow | NOT CONNECTED |

**Impact:** REZ-MIND-LAUNCH-STATUS.md shows 0% progress on foundation services.

**Recommendation:** Deploy auth-service, wallet-service, payment-service, order-service first.

---

### GAP 2: AI Agents Not Business-Aligned

**Issue:** Document describes agents as business outcomes (Acquisition, Retention, Upsell), but code implements technical components (DemandSignal, Attribution).

**Impact:** Marketing claims cannot be verified against code.

**Recommendation:** Either:
1. Rename code agents to match business language
2. Update documentation to match technical names
3. Implement missing business agents (Acquisition, Upsell, Retention)

---

### GAP 3: QR System Incomplete

**Issue:** 10 of 14 QR types not implemented. QR scanning is the PRIMARY acquisition channel.

**Impact:** Cannot launch with full QR functionality.

**Recommendation:** Prioritize Table QR, Payment QR, Referral QR for initial launch.

---

### GAP 4: Hotel PMS Incomplete

**Issue:** Channel Manager, Housekeeping, Dynamic Pricing not implemented.

**Impact:** Cannot compete with established PMS (Oracle, Lightspeed).

**Recommendation:** Either partner with Channel Manager provider or build integration.

---

### GAP 5: B2B Features Missing

| Feature | Status |
|---------|--------|
| RFQ (Nextabizz) | PARTIAL - Exists but not fully integrated |
| Supplier Management | **MISSING** |
| Inventory Sync | **MISSING** |
| Credit/Payment Terms | **MISSING** |

**Impact:** Cannot monetize B2B SaaS.

---

### GAP 6: Do App (Voice) Not Implemented

**Documented:** REZ-PRODUCT-MAP.md (Line 480-517)
**Implemented:** **NO VOICE FEATURES FOUND**

**Impact:** Metro accessibility claim cannot be fulfilled.

---

### GAP 7: Rendez (Dating) Partial

**Documented:** Full dating app with verification
**Found:** Basic structure, but QR meetup verification NOT implemented

---

## SERVICE DEPLOYMENT STATUS

| Service | Directory | Has Code? | Deployed? |
|---------|-----------|-----------|----------|
| auth-service | rez-auth-service | YES | NEEDS VERIFICATION |
| wallet-service | rez-wallet-service | YES | NEEDS VERIFICATION |
| payment-service | rez-payment-service | YES | NEEDS VERIFICATION |
| order-service | rez-order-service | YES | NEEDS VERIFICATION |
| merchant-service | rez-merchant-service | YES | NEEDS VERIFICATION |
| catalog-service | rez-catalog-service | YES | NEEDS VERIFICATION |
| search-service | rez-search-service | YES | NEEDS VERIFICATION |
| gamification | rez-gamification-service | YES | NEEDS VERIFICATION |
| finance-service | rez-finance-service | YES | NEEDS VERIFICATION |
| hotel-ota | rez-hotel-ota | YES | NEEDS VERIFICATION |
| hotel-pms | rez-hotel-service | MINIMAL | NOT IMPLEMENTED |
| ads-service | rez-ads-service | YES | NEEDS VERIFICATION |
| support-copilot | REZ-support-copilot | YES | NEEDS VERIFICATION |
| intent-graph | rez-intent-graph | YES | NEEDS VERIFICATION |
| personalization | rez-personalization-engine | YES | NEEDS VERIFICATION |
| recommendation | rez-recommendation-engine | YES | NEEDS VERIFICATION |
| targeting | rez-targeting-engine | YES | NEEDS VERIFICATION |

---

## RECOMMENDATIONS (Priority Order)

### CRITICAL (Must Fix Before Launch)

1. **Deploy Core Transaction Loop**
   - Verify auth-service, wallet-service, payment-service, order-service
   - Test end-to-end transaction
   - Set up health checks

2. **Implement Missing QR Types**
   - Table QR (Restaurant dine-in)
   - Payment QR (All merchants)
   - Referral QR (Viral growth)

3. **Align AI Agent Documentation**
   - Map existing code agents to documented names
   - OR implement missing business agents

### HIGH (Should Fix in Q2)

4. **Complete Hotel PMS**
   - Channel Manager (Booking.com sync)
   - Housekeeping management
   - Dynamic pricing

5. **Implement Merchant POS**
   - Full POS terminal
   - Inventory management
   - Staff scheduling

6. **BBPS/Recharge**
   - Mobile recharge
   - Bill payment
   - Utility payments

### MEDIUM (Q3+)

7. **Do App Voice Features**
8. **B2B Procurement**
9. **Multi-property Hotel**
10. **Fraud Detection ML**

---

## FILES ANALYZED

| File | Key Findings |
|------|--------------|
| REZ-PRODUCT-MAP.md | Complete product specification |
| REZ-MIND-LAUNCH-STATUS.md | 0% launch readiness |
| REZ-MIND-LAUNCH-READINESS.md | Foundation not deployed |
| rez-intent-graph/src/agents/index.ts | 8+ agents implemented |
| rez-now/app/api/kds/ | KDS implemented |
| shared-types/packages/rez-qr-sdk/ | 4 QR modules (Room, Menu, Store, Campaign) |

---

## SUMMARY

The ReZ platform has a **comprehensive product vision** but **incomplete implementation**. The gap between documentation and code is significant:

- **QR System:** 71% incomplete (10/14 types missing)
- **AI Agents:** 50% naming mismatch (8 implemented, not business-aligned)
- **Merchant Features:** 40% incomplete
- **Hotel PMS:** 67% incomplete
- **Core Transaction Loop:** NOT VERIFIED

**Required Actions:**
1. Verify core services deployment
2. Complete transaction loop testing
3. Implement critical missing QR types
4. Align AI agent naming
5. Build missing hotel PMS features

---

*Audit completed: May 7, 2026*
*Next review: Weekly until launch readiness >80%*
