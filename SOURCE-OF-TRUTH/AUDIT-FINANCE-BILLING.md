# Finance and Billing Services Audit

**Audit Date:** 2026-05-05
**Audited Services:** rez-finance-service, REZ-billing-system

---

## 1. Service Overview

| Service | Directory | Port | Node Version | Framework |
|---------|-----------|------|--------------|-----------|
| rez-finance-service | `/Users/rejaulkarim/Documents/ReZ Full App/rez-finance-service` | 4006 | >= 20.0.0 | Express + Mongoose |
| REZ-billing-system | `/Users/rejaulkarim/Documents/ReZ Full App/REZ-billing-system` | 3000 | >= 18.0.0 | Express (in-memory) |

---

## 2. Service 1: rez-finance-service

### 2.1 Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Borrow (Loans)** | Active | Loan applications, partner offers, BNPL |
| **Credit Score** | Active | ReZ Score, bureau integration (Phase 2 stub) |
| **Bill Payment** | Active | BBPS/Eko/PaySprint aggregator (Phase 1 stub) |
| **Partner Integration** | Active | FinBox adapter, webhook handling |
| **Corp GST** | Active | GST calculation, invoice generation, e-invoicing |
| **AML Compliance** | Active | Transaction monitoring, CTR/STR reporting |
| **Rewards** | Active | Coin awards via BullMQ queue |
| **BNPL Sync** | Active | Nightly reconciliation with wallet service |

### 2.2 How Billing Works

1. **BNPL Billing:**
   - User applies for BNPL via `/finance/borrow/bnpl/check` (eligibility check)
   - Order created via `/finance/borrow/bnpl/create` with atomic limit reservation
   - Settlement via `/internal/finance/bnpl/settle` restores BNPL limit
   - Interest calculated using `InterestCalculator` (tiered rates: 0% at 15d, 2.5% at 30d, up to 3.5% at 90d)

2. **Loan Billing:**
   - Partner offers fetched via FinBox adapter
   - Application submitted to partner, webhook updates status
   - On disbursement: coins awarded (0.5% of amount), `coinsAwarded` field updated atomically
   - EMI payments tracked via `/finance/pay/repay`

3. **Bill Payment Billing:**
   - Static biller catalog (Jio, Airtel, BSNL, FASTag, BESCOM, BWSSB)
   - Aggregator integration (BBPS/Eko/PaySprint) - currently stub mode
   - Transaction created with aggregator status

### 2.3 How Settlements Work

1. **BNPL Settlement Flow:**
   - Called by payment service via `/internal/finance/bnpl/settle`
   - Uses MongoDB transaction for atomicity:
     - Updates `FinanceTransaction.status` to 'completed'
     - Restores BNPL limit via `CreditProfile` update
   - Invalidates profile cache in Redis

2. **Loan Disbursement Settlement:**
   - Partner webhook triggers status update
   - Coins awarded via BullMQ queue with retry logic
   - `coinsAwarded` field updated based on wallet confirmation

3. **BNPL Sync Reconciliation:**
   - Cron job runs nightly at 2:00 AM
   - Reconciles `BNPLTransaction` (wallet) with `FinanceTransaction` (finance)
   - Creates missing finance records, corrects status discrepancies

### 2.4 Issues Identified

| ID | Severity | Issue | Location |
|----|----------|-------|----------|
| FIN-001 | Medium | Mobile recharge returns 501 - feature not implemented | `payRoutes.ts:202` |
| FIN-002 | Low | `getAccountAge()` returns hardcoded 90 days | `fraud.service.ts:244` |
| FIN-003 | Low | `submitEInvoice()` generates mock IRN - no GST portal integration | `corpGSTService.ts:534` |
| FIN-004 | Low | `fetchBureauScore()` is a stub - Phase 2 not implemented | `creditScoreService.ts:106` |
| FIN-005 | Medium | Coin reward failure logs error but continues silently | `loanService.ts:110-115` |
| FIN-006 | Low | Credit score threshold configurable via env but no bounds check | `creditScoreService.ts` |

### 2.5 Security Observations

- **Rate Limiting:** Implemented via Lua scripts for BNPL (5/hour) and credit score (1/10s)
- **Webhook Auth:** HMAC-SHA256 signature verification for partner webhooks
- **Internal Auth:** Internal service token validation
- **Input Validation:** Zod schemas for all API inputs
- **SQL Injection:** Protected via MongoDB/Mongoose ORM
- **Error Handling:** Global error handler, Sentry integration

### 2.6 Data Models

| Model | Collection | Purpose |
|-------|-----------|---------|
| `FinanceTransaction` | `financetransactions` | All financial transactions |
| `CreditProfile` | `creditprofiles` | User credit data, eligibility |
| `LoanApplication` | `loanapplications` | Loan applications |
| `PartnerOffer` | `partners` | Partner credit offers |
| `GSTInvoice` | `gstinvoices` | GST invoices |
| `BNPLTransaction` | `bnpltransactions` | BNPL records (reconciliation) |

---

## 3. Service 2: REZ-billing-system

### 3.1 Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Wallet Management** | Active | Create wallets, credit/debit, transfers |
| **Invoice Management** | Active | Create, issue, pay, cancel invoices |
| **Fraud Detection** | Active | Velocity checks, pattern detection |
| **Settlement Processing** | Active | Batch settlements, fee calculation |

### 3.2 How Billing Works

1. **Wallet Billing:**
   - In-memory wallet storage (no database persistence)
   - Credit adds funds, Debit subtracts funds
   - Transfer between wallets (debit source + credit destination)
   - Supports USD, EUR, GBP, INR currencies

2. **Invoice Billing:**
   - Invoice number format: `INV-YYYYMM-NNNN`
   - Line items with quantity, unit price
   - Tax calculation (configurable rate)
   - Status workflow: draft -> issued -> paid (or overdue/cancelled)

3. **Fee Structure:**
   - Percentage fee: 2.9%
   - Fixed fee: $0.30 per transaction
   - Effective rate varies by transaction amount

### 3.3 How Settlements Work

1. **Settlement Creation:**
   - Aggregates transactions by merchant
   - Calculates gross amount, fees, net amount
   - Status workflow: pending -> processing -> completed/failed

2. **Batch Processing:**
   - Transactions added to pending batch
   - Batch processed after configurable window (24 hours default)
   - Creates settlement with fee breakdown

3. **Fee Breakdown:**
   ```
   Gross Amount - (Percentage Fee + Fixed Fee) = Net Amount
   Example: $100 - ($2.90 + $0.30) = $96.80
   ```

### 3.4 Issues Identified

| ID | Severity | Issue | Location |
|----|----------|-------|----------|
| BILL-001 | **Critical** | In-memory storage - data lost on restart | `wallet.service.ts:15` |
| BILL-002 | **Critical** | In-memory storage - data lost on restart | `invoice.service.ts:13` |
| BILL-003 | **Critical** | In-memory storage - data lost on restart | `settlement.service.ts:19` |
| BILL-004 | **Critical** | In-memory storage - fraud data lost on restart | `fraud.service.ts:19-20` |
| BILL-005 | High | `getAccountAge()` returns hardcoded 90 days | `fraud.service.ts:244` |
| BILL-006 | Medium | `updateFeeConfig()` validates but doesn't persist | `settlement.service.ts:411` |
| BILL-007 | Low | CORS allowedOrigins defaults to '*' | `app.ts:11` |
| BILL-008 | Medium | No transaction rollback on multi-step operations | `wallet.service.ts` |

### 3.5 Security Observations

- **Helmet:** Enabled for security headers
- **CORS:** Configurable but defaults to '*'
- **Input Validation:** Manual validation in routes
- **Error Handling:** Global error handler
- **Missing:**
  - No authentication on endpoints
  - No rate limiting
  - No webhook signature verification
  - No internal service token validation

### 3.6 Data Models

| Model | Storage | Purpose |
|-------|---------|---------|
| `Wallet` | In-Memory Map | User wallet with balances |
| `Transaction` | In-Memory Map | Wallet transactions |
| `Invoice` | In-Memory Map | Billing invoices |
| `Settlement` | In-Memory Map | Merchant settlements |
| `FraudCheckResult` | In-Memory Map | Fraud detection results |

---

## 4. Cross-Service Comparison

| Aspect | rez-finance-service | REZ-billing-system |
|--------|---------------------|--------------------|
| **Persistence** | MongoDB | In-Memory |
| **Transactions** | Atomic (MongoDB sessions) | Not atomic |
| **Authentication** | JWT + Internal tokens | None |
| **Rate Limiting** | Lua scripts | None |
| **Webhook Security** | HMAC-SHA256 | N/A |
| **Error Tracking** | Sentry + Winston | Console only |
| **Cache** | Redis | None |
| **Job Queue** | BullMQ | None |
| **AML/Compliance** | Implemented | Basic fraud checks |

---

## 5. Recommendations

### 5.1 Critical (Must Fix)

1. **REZ-billing-system - Add Database Persistence**
   - Replace in-memory Maps with MongoDB or PostgreSQL
   - Add connection pooling and retry logic
   - Implement proper indexing

2. **REZ-billing-system - Add Authentication**
   - Implement JWT or internal token authentication
   - Add rate limiting for all endpoints

3. **REZ-billing-system - Fix CORS Configuration**
   - Remove wildcard default
   - Configure specific allowed origins

### 5.2 High Priority

4. **rez-finance-service - Implement Mobile Recharge**
   - Complete BBPS/Eko/PaySprint integration
   - Add real transaction execution

5. **rez-finance-service - Complete Bureau Integration**
   - Implement `fetchBureauScore()` for Experian/CRIF
   - Add proper error handling for API failures

6. **Both Services - Fix Hardcoded Values**
   - `getAccountAge()` should query actual wallet creation date
   - Move hardcoded thresholds to configuration

### 5.3 Medium Priority

7. **Coin Reward Failure Handling**
   - Add alerting for permanent coin award failures
   - Consider dead-letter queue monitoring

8. **GST E-Invoice Integration**
   - Integrate with actual GST portal
   - Generate valid IRN numbers

9. **Settlement Fee Configuration**
   - Persist fee config to database
   - Add audit trail for fee changes

### 5.4 Architecture Improvements

10. **Shared Types Package**
    - Both services define types locally
    - Consider centralizing in `@rez/shared-types`
    - Currently marked as file dependency in finance-service

---

## 6. API Endpoints Summary

### rez-finance-service

| Route | Methods | Description |
|-------|---------|-------------|
| `/finance/borrow/*` | GET, POST | Loans, BNPL, applications |
| `/finance/credit/*` | GET, POST | Credit score |
| `/finance/pay/*` | GET, POST | Bill payment, recharge |
| `/finance/partner/webhook/*` | POST | Partner webhooks |
| `/internal/finance/*` | POST | Internal APIs |
| `/finance/admin/*` | GET, PUT, POST | Admin operations |
| `/gst/*` | GET, POST | GST operations |
| `/finance/*` | GET, POST | Risk, marketplace, merchant |

### REZ-billing-system

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/wallets/*` | GET, POST | Wallet operations |
| `/api/invoices/*` | GET, POST, PUT | Invoice operations |
| `/api/fraud/*` | GET, POST, PUT, DELETE | Fraud detection |
| `/api/settlements/*` | GET, POST, PUT | Settlement operations |

---

## 7. Known Bugs/Technical Debt

| ID | Description | Impact |
|----|-------------|--------|
| BAK-CROSS-005 | DLQ visibility for coin-reward queue failures | Fixed in `dlqAdmin.ts` |
| CRIT-015 | Coin award atomicity | Fixed in `loanService.ts` |
| CVE-WAL-001 | BNPL settlement atomicity | Fixed in `bnplService.ts` |
| CVE-WAL-002 | Loan disbursal coin atomicity | Fixed in `loanService.ts` |
| FIN-02/BNPL-001 | Atomic BNPL reservation | Fixed with MongoDB sessions |
| BE-FIN-011 | BNPL rate limiting | Fixed with Lua scripts |
| BE-FIN-022 | Credit score rate limiting | Fixed with Lua scripts |

---

**Audit Completed By:** Claude Code
**Next Review Date:** 2026-06-05
