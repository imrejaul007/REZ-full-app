# REZ Business Logic Final Audit

**Audit Date:** April 29, 2026  
**Auditor:** Claude Code Business Architect  
**Status:** COMPLETE

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Rules Registry](#business-rules-registry)
3. [Workflow State Machines](#workflow-state-machines)
4. [Validation Frameworks](#validation-frameworks)
5. [Calculation Engines](#calculation-engines)
6. [Business Logic Services](#business-logic-services)
7. [Issues & Risks](#issues--risks)
8. [Recommendations](#recommendations)

---

## Executive Summary

The REZ ecosystem contains a comprehensive microservices architecture with **25+ active services** implementing sophisticated business logic across multiple domains:

| Domain | Services | Key Business Logic |
|--------|----------|-------------------|
| **Karma & Gamification** | `rez-karma-service`, `rez-gamification-service` | Karma scoring, level systems, streak tracking, verification |
| **Commerce** | `rez-merchant-service`, `rez-order-service`, `rez-catalog-service` | Order lifecycle, inventory, product management |
| **Finance** | `rez-payment-service`, `rez-wallet-service`, `rez-finance-service` | Payment processing, BNPL, credit scoring |
| **Intelligence** | `rez-intent-service`, `rez-recommendation-engine`, `rez-personalization-engine` | User intent, recommendations, targeting |
| **Automation** | `rez-automation-service`, `rez-scheduler-service` | Rule engines, scheduled jobs |
| **Corporate** | `rez-corporate-service`, `rez-corpperks-service` | HRIS, GST, travel, expense management |
| **Advertising** | `rez-ad-campaigns`, `rez-targeting-engine`, `rez-decision-service` | Ad targeting, bidding, auction engine |

---

## Business Rules Registry

### 1. Karma Service Rules

#### Location: `/rez-karma-service/src/engines/`

**Karma Score Engine** (`karmaScoreEngine.ts`)
- **Score Range:** 300-900 (KarmaScore)
- **Components:**
  - Base Score: 300
  - Impact: 0-250 (lifetime karma, logarithmic scale)
  - Relative Rank: 0-180
  - Trust: 0-100
  - Momentum: 0-70
- **Bands:**
  - Starter: 300-349
  - Active: 350-449
  - Performer: 450-599
  - Leader: 600-749
  - Elite: 750-819
  - Pinnacle: 820-900

**Level Thresholds** (`karmaEngine.ts`)
```
L1: 0 karma
L2: 500 karma
L3: 2000 karma
L4: 5000 karma
```

**Decay Schedule** (`karmaEngine.ts`)
```
30 days inactive: 20% decay
45 days inactive: 40% decay
60 days inactive: 70% decay
```

**Conversion Rates**
- L4 (5000+): 1 karma = 1 coin
- L3 (2000-4999): 1 karma = 0.75 coins
- L2 (500-1999): 1 karma = 0.5 coins
- L1 (0-499): 1 karma = 0.25 coins

**Weekly Coin Cap:** 300 coins/week

**Difficulty Multipliers**
- Easy: 1.0x karma
- Medium: 1.5x karma
- Hard: 2.0x karma

#### Verification Engine Rules

**Signal Weights** (`verificationEngine.ts`)
```
qr_in: 30%
qr_out: 30%
gps_match: 15%
ngo_approved: 40%
photo_proof: 10%
```

**Approval Thresholds**
- Verified: >= 0.60 confidence
- Partial: >= 0.40 confidence
- Rejected: < 0.40 confidence

#### Micro-Action Triggers
```
app_open → daily_checkin
profile_update → complete_profile
referral_credited → refer_friend
event_completed → first_event_month
streak_updated → streak_7, streak_30
share_click → share_impact
civic_action → civic_litter_pickup, civic_adopt_sapling, civic_waste_pledge, civic_water_conservation
```

---

### 2. Finance Service Rules

#### Location: `/rez-finance-service/src/engines/`

**ReZ Score Engine** (`rezScoreEngine.ts`)
- **Score Range:** 0-850 (like CIBIL)
- **Weights:**
  - Payment History: 35%
  - Total Spend 30d: 20%
  - Order Count 30d: 15%
  - Visit Frequency: 10%
  - Wallet Balance: 10%
  - Account Age: 10%

**Eligibility Bands:**
```
Score >= 750: Loan 50x monthly, Card 40x monthly, BNPL 15000
Score >= 650: Loan 30x monthly, Card 20x monthly, BNPL 10000
Score >= 550: Loan 15x monthly, Card 10x monthly, BNPL 5000
Score >= 450: Loan 8x monthly, Card 5x monthly, BNPL 2000
Score < 450: No credit products
```

**Risk Engine** (`riskEngine.ts`)
- Fraud Detection: High wallet balance (>100k) + Low score (<300) = +30% fraud score
- Default Prediction: Payment history < 0.8 = +20% default probability
- Anomaly Detection: Behavioral pattern analysis

**Merchant Credit Score** (`/rez-wallet-service/src/engines/CreditScoreCalculator.ts`)
- **Components:**
  - Revenue Stability: 30% (coefficient of variation)
  - Payment Regularity: 25%
  - Dispute Rate: 20%
  - Account Age: 15%
  - Order Frequency: 10%
- **Credit Tiers:**
  ```
  Platinum (>=81): 200,000 INR credit line
  Gold (>=61): 75,000 INR credit line
  Silver (>=41): 25,000 INR credit line
  Bronze (<41): 0 INR (no credit)
  ```
- **Minimum History Required:** 3 months

---

### 3. Automation Service Rules

#### Location: `/rez-automation-service/src/`

**Rule Types:**
- `inventoryRules.ts`: Stock management, reordering
- `loyaltyRules.ts`: Points, tiers, rewards
- `customerRules.ts`: Segmentation, engagement
- `pricingRules.ts`: Dynamic pricing, discounts

**Rule Engine Features:**
- Event-driven processing
- Priority-based execution
- Condition evaluation (AND/OR logic)
- Action execution with retry logic

---

### 4. Order Service Rules

#### Location: `/rez-order-service/src/state/`

**Order State Machine:**
```
placed → confirmed → preparing → ready → dispatched → out_for_delivery → delivered
  ↓         ↓            ↓         ↓         ↓                ↓
cancelled cancelled  cancelled cancelled   delivered         delivered
                                                       ↓
                                                 failed_delivery
```

**Terminal States:**
- refunded
- failed_delivery
- return_rejected

**Cancellable States:**
- placed
- confirmed
- preparing
- ready
- dispatched
- out_for_delivery
- cancelling

---

### 5. Gamification Service Rules

#### Location: `/rez-gamification-service/src/config/`

**Streak Milestones:**
```
3 days: 50 coins
7 days: 200 coins
30 days: 500 coins
```

---

## Workflow State Machines

### 1. Order Workflow

**Canonical States:**
```
placed → confirmed → preparing → ready → dispatched → out_for_delivery → delivered
         ↓                    ↓         ↓         ↓
       cancelled          cancelled cancelled cancelled
```

**Merchant Transitions:**
```
placed: [confirmed, cancelled]
confirmed: [preparing, cancelled]
preparing: [ready, cancelled]
ready: [dispatched, cancelled]
dispatched: [out_for_delivery]
out_for_delivery: [delivered]
```

**SLA Thresholds:**
```
placed: 60 min (1 hour to confirm)
confirmed: 30 min (start preparing)
preparing: 120 min (2 hours)
ready: 30 min (dispatch)
dispatched: 180 min (3 hours deliver)
out_for_delivery: 120 min (2 hours)
```

### 2. Payment Workflow

**Payment States:**
```
pending → processing → completed
              ↓           ↓
          failed     refunded
              ↓
         refund_initiated → refund_processing → refunded
                            ↓
                        refund_failed
```

### 3. Return Workflow

```
delivered → return_requested → return_rejected
                              ↓
                          returned → refunded
```

---

## Validation Frameworks

### 1. Order Validation Schema

**Location:** `/rez-order-service/src/validation/orderSchemas.ts`

```typescript
// Order Status Enum (11 states)
placed, confirmed, preparing, ready, dispatched, out_for_delivery, 
delivered, cancelled, cancelling, returned, refunded

// Payment Status Enum (11 states)
pending, processing, completed, failed, cancelled, expired,
refund_initiated, refund_processing, refunded, refund_failed, partially_refunded

// Payment Methods
upi, card, wallet, netbanking
```

**Field Validations:**
- `price`: positive number (INR)
- `quantity`: positive integer
- `discount`: 0-100 percentage
- All monetary fields in rupees (not paise)

### 2. Product Validation Schema

**Location:** `/rez-catalog-service/src/validation/productSchemas.ts`

```typescript
CreateProductSchema:
- name: 1-200 characters
- price (legacy): positive number
- pricing (canonical): { selling, mrp, discount, currency }
- category: optional string
- stock: non-negative integer
- merchantId: required

UpdateProductSchema:
- All CreateProduct fields optional
- Additional: images, thumbnail, variants, addOns, preparationTime, taxRate
```

### 3. Payout Validation

**Location:** `/rez-merchant-service/src/utils/payoutValidator.ts`

```typescript
validatePayoutAmount():
- Must be valid number
- Must be positive
- Maximum: 100,000,000 (10 crores)
- Maximum 2 decimal places

validateBankDetails():
- IFSC: 11 alphanumeric characters
- Account Number: 8-18 digits
- Account Holder: alphabetic characters and spaces only
```

### 4. Action Engine Validation

**Location:** `/rez-action-engine/src/engine/action-engine.ts`

```typescript
Action Levels:
- FORBIDDEN: Cannot be executed
- AUTO: Auto-executable with rate limiting
- APPROVED: Requires approval
- SUPERVISED: Requires admin supervision

Policies:
- maxExecutionsPerHour: Rate limiting
- requireApproval: Boolean flag
- autoExecute: Boolean flag
```

---

## Calculation Engines

### 1. Karma Score Calculator

**File:** `/rez-karma-service/src/engines/karmaScoreEngine.ts`

```typescript
KarmaScore = 300 + (Impact + RelativeRank + Trust + Momentum)

Impact Score Formula:
- Logarithmic scaling
- 500 karma ≈ 50 points
- 2000 karma ≈ 150 points
- 5000 karma ≈ 220 points
- 15000 karma ≈ 250 points (max)
```

### 2. ReZ Score Calculator

**File:** `/rez-finance-service/src/engines/rezScoreEngine.ts`

```typescript
Score = 300 + (normalized_score × 550)

Where normalized_score = Σ(weight × normalized_value)

Normalization ranges:
- paymentHistory: 0-1 (direct)
- totalSpend30d: 0-50000
- orderCount30d: 0-30
- visitFrequency: 0-14 per week
- walletBalance: 0-10000
- accountAgeDays: 0-365
```

### 3. Merchant Credit Calculator

**File:** `/rez-wallet-service/src/engines/CreditScoreCalculator.ts`

```typescript
CreditScore = Σ(component × weight)

Components:
- Revenue Stability: (1 - CV) × 100 × 0.30
- Payment Regularity: payment_rate × 100 × 0.25
- Dispute Rate: (1 - dispute_rate) × 100 × 0.20
- Account Age: min(months / 12, 1) × 100 × 0.15
- Order Frequency: normalized_frequency × 100 × 0.10

CV = stddev(revenue) / mean(revenue)
```

### 4. Dynamic Pricing

**File:** `/rez-decision-service/src/engines/sampling/dynamicPricing.ts`

Factors:
- Time of day
- Day of week
- Demand level
- Competition
- User segment
- Location

### 5. Auction Engine

**File:** `/rez-decision-service/src/engines/sampling/auctionEngine.ts`

Auction Types:
- First-price
- Second-price (Vickrey)
- Floor price enforcement
- Budget pacing

---

## Business Logic Services

### 1. Core Services Map

| Service | Domain | Key Business Logic |
|---------|--------|-------------------|
| `rez-karma-service` | Loyalty | Karma scoring, verification, micro-actions |
| `rez-gamification-service` | Loyalty | Streaks, challenges, leaderboards |
| `rez-merchant-service` | Commerce | Merchant onboarding, orders, payouts |
| `rez-order-service` | Commerce | Order lifecycle, state management |
| `rez-catalog-service` | Commerce | Products, categories, pricing |
| `rez-payment-service` | Finance | Payments, refunds, webhooks |
| `rez-wallet-service` | Finance | Wallets, coins, BNPL, credit |
| `rez-finance-service` | Finance | Credit scoring, risk, loans |
| `rez-intent-service` | Intelligence | User intent, signals, nudges |
| `rez-search-service` | Intelligence | Search, recommendations |
| `rez-recommendation-engine` | Intelligence | Collaborative filtering, content-based |
| `rez-targeting-engine` | Advertising | Campaign targeting, frequency caps |
| `rez-decision-service` | Advertising | Auctions, bidding, sampling |
| `rez-automation-service` | Operations | Rules engine, triggers |
| `rez-scheduler-service` | Operations | Background jobs, notifications |
| `rez-corporate-service` | Enterprise | HRIS, GST, travel, cards |
| `rez-corpperks-service` | Enterprise | Corporate perks management |
| `rez-action-engine` | Platform | Action policies, approval workflows |
| `rez-profile-service` | Platform | User profiles, feature flags |
| `rez-auth-service` | Platform | Authentication, MFA, tokens |
| `rez-feedback-service` | Platform | Feedback collection, NPS |
| `rez-travel-service` | Vertical | Flights, hotels, trains, cabs |
| `rez-abandonment-tracker` | Analytics | Cart abandonment detection |
| `rez-lead-intelligence` | Analytics | Lead scoring, prioritization |
| `rez-intelligence-hub` | Analytics | Data aggregation |

### 2. Integration Patterns

**Event-Driven Architecture:**
- Kafka topics for async communication
- Event schemas in `packages/shared-types`
- Dead letter queues (DLQ) for failed events

**Cross-Service Data Models:**
- Shared through `packages/shared-types`
- Strict schema validation
- Backward compatibility handling

---

## Issues & Risks

### Critical Issues

1. **State Machine Drift**
   - Multiple copies of order state machine across services
   - Location: `rez-merchant-service`, `rez-order-service`, `rezbackend`
   - Risk: Inconsistent state transitions
   - Recommendation: Centralize in shared-types package

2. **Enum Duplication**
   - Order statuses, payment statuses duplicated
   - Location: Multiple services
   - Risk: Divergent implementations
   - Recommendation: Enforce shared enum import via arch-fitness

3. **Validation Schema Inconsistency**
   - Some services use Zod, others use custom validation
   - Location: Various services
   - Risk: Inconsistent input validation
   - Recommendation: Standardize on Zod across all services

### High Priority Issues

4. **Karma Decay Hardcoded**
   - Decay schedule in karma engine hardcoded
   - Location: `rez-karma-service/src/engines/karmaEngine.ts`
   - Risk: Cannot adjust decay without code change
   - Recommendation: Move to configuration/database

5. **Credit Score Threshold Drift**
   - Eligibility thresholds in multiple places
   - Location: `rez-finance-service`, `rez-wallet-service`
   - Risk: Inconsistent credit decisions
   - Recommendation: Centralize credit rules

6. **Missing Transaction Atomicity**
   - Some multi-step operations not atomic
   - Location: Various services
   - Risk: Partial state on failure
   - Recommendation: Use saga pattern for distributed transactions

### Medium Priority Issues

7. **SLA Thresholds in Code**
   - Order SLA thresholds hardcoded
   - Location: `rez-merchant-service/src/utils/orderStateMachine.ts`
   - Risk: Cannot adjust without deploy
   - Recommendation: Externalize to config

8. **Test Coverage Gaps**
   - Business logic untested in some services
   - Location: Various
   - Recommendation: Add unit tests for all engines

9. **Logging Inconsistency**
   - Some services use custom loggers
   - Recommendation: Standardize on shared logger

### Low Priority Issues

10. **Documentation Drift**
    - Business rules documented in code, not central
    - Recommendation: Create business rules registry

---

## Recommendations

### 1. Centralize Business Rules

Create `rez-business-rules` package:
```
packages/rez-business-rules/
├── src/
│   ├── levelThresholds.ts
│   ├── decaySchedule.ts
│   ├── conversionRates.ts
│   ├── creditThresholds.ts
│   ├── slaConfig.ts
│   └── stateMachines.ts
├── tests/
└── package.json
```

### 2. Standardize Validation

- Mandate Zod for all input validation
- Add arch-fitness test for validation framework
- Create shared validation utilities

### 3. Improve Transaction Handling

- Implement saga pattern for distributed transactions
- Add idempotency keys to all mutations
- Add retry logic with exponential backoff

### 4. Create Business Logic Tests

- Unit tests for all engines
- Integration tests for workflows
- Load tests for calculation performance

### 5. Document Business Rules

- Create Business Rules Registry
- Document all thresholds and formulas
- Add inline documentation to engines

---

## Appendix: File Locations

### Karma Service
- `/rez-karma-service/src/engines/karmaEngine.ts`
- `/rez-karma-service/src/engines/karmaScoreEngine.ts`
- `/rez-karma-service/src/engines/verificationEngine.ts`
- `/rez-karma-service/src/engines/microActionEngine.ts`

### Finance Service
- `/rez-finance-service/src/engines/rezScoreEngine.ts`
- `/rez-finance-service/src/engines/riskEngine.ts`
- `/rez-wallet-service/src/engines/CreditScoreCalculator.ts`

### Order Service
- `/rez-order-service/src/state/orderStateMachine.ts`
- `/rez-order-service/src/validation/orderSchemas.ts`

### Catalog Service
- `/rez-catalog-service/src/validation/productSchemas.ts`

### Merchant Service
- `/rez-merchant-service/src/utils/orderStateMachine.ts`
- `/rez-merchant-service/src/utils/payoutValidator.ts`

### Automation Service
- `/rez-automation-service/src/services/ruleEngine.ts`
- `/rez-automation-service/src/rules/*.ts`

### Decision Service
- `/rez-decision-service/src/engines/sampling/auctionEngine.ts`
- `/rez-decision-service/src/engines/sampling/dynamicPricing.ts`

### Gamification Service
- `/rez-gamification-service/src/config/streakMilestones.ts`

---

**Document Version:** 1.0  
**Next Review:** Q2 2026
