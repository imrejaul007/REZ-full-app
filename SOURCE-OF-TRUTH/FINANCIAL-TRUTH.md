# FINANCIAL TRUTH LAYER

## The Immutable Foundation of Financial Operations

> **Core Principle**: Every financial event in the ReZ ecosystem MUST flow through the **wallet-service**. There is no financial truth outside the ledger.

> **Implementation**: The wallet-service is located at `/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service` (port 4004). It uses MongoDB for storage with double-entry ledger semantics.

---

## Table of Contents

1. [Source of Truth](#1-source-of-truth)
2. [Double-Entry Ledger Architecture](#2-double-entry-ledger-architecture)
3. [Payment-to-Ledger Flow](#3-payment-to-ledger-flow)
4. [Reconciliation](#4-reconciliation)
5. [Dispute Handling](#5-dispute-handling)
6. [Integration Checklist](#6-integration-checklist)
7. [API Contracts](#7-api-contracts)
8. [Code Examples](#8-code-examples)
9. [Key File References](#9-key-file-references)

---

## 1. Core Concepts

### 1.1 What is a Ledger?

A **ledger** is the immutable, double-entry accounting system that records every financial transaction in the ReZ ecosystem. It follows the fundamental accounting equation:

```
ASSETS = LIABILITIES + EQUITY
```

**Double-Entry Accounting Rules:**
- Every transaction creates AT LEAST two entries (debit and credit)
- Total debits MUST equal total credits (always balanced)
- Entries are immutable once committed
- Corrections are made via reversal entries, never deletion

### 1.2 The Golden Rules

| Type | Debit Effect | Credit Effect |
|------|--------------|---------------|
| Asset | Increase | Decrease |
| Liability | Decrease | Increase |
| Equity | Decrease | Increase |
| Revenue | Decrease | Increase |
| Expense | Increase | Decrease |

### 1.3 Why Double-Entry?

```text
SINGLE-ENTRY (FAILURE):
  User A: -$100  ❌ Lost forever, no trace

DOUBLE-ENTRY (TRUTH):
  User A:     -$100 (DEBIT to Cash)
  Platform:  +$100 (CREDIT to Revenue)
  ✅ Every dollar accounted for
  ✅ Full audit trail
  ✅ Impossible to create/destroy money
```

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FINANCIAL TRUTH LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   PAYMENT   │    │   WALLET    │    │  RECONCIL   │    │   DISPUTE   │ │
│  │  PROCESSOR  │───▶│   SERVICE   │◀───│   SERVICE   │───▶│  HANDLER    │ │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘ │
│         │                  │                  │                  │        │
│         └──────────────────┴────────┬─────────┴──────────────────┘        │
│                                     │                                      │
│                          ┌───────────▼───────────┐                         │
│                          │    LEDGER ENGINE      │                         │
│                          │  ┌─────────────────┐  │                         │
│                          │  │ Entry Validator │  │                         │
│                          │  │ Balance Calculator│ │                        │
│                          │  │ Audit Logger    │  │                         │
│                          │  └─────────────────┘  │                         │
│                          └───────────┬───────────┘                         │
│                                      │                                      │
│                          ┌───────────▼───────────┐                         │
│                          │    POSTGRESQL          │                         │
│                          │    (ledgers table)     │                         │
│                          └───────────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SUPPORTING SERVICES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   EVENT     │  │   AUDIT     │  │   IDEMPOT   │  │   SCHEDULER │        │
│  │   BUS       │  │   LOGGER    │  │   STORE     │  │   (CRON)    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
[Payment Intent Created]
         │
         ▼
[Generate Idempotency Key]
         │
         ▼
[Check Idempotency Store] ──▶ [DUPLICATE] ──▶ [Return Cached Result]
         │
         ▼ [NEW REQUEST]
[Validate Transaction]
         │
         ▼
[Create Ledger Entries]
  ├── DEBIT Entry
  └── CREDIT Entry
         │
         ▼
[Update Wallet Balances]
         │
         ▼
[Log Audit Event]
         │
         ▼
[Emit Payment Event]
         │
         ▼
[Schedule Reconciliation]
```

### 2.3 Component Responsibilities

| Component | Responsibility |
|-----------|-----------------|
| **Ledger Engine** | Core double-entry processing, balance calculations |
| **Wallet Service** | Balance queries, balance locking for transactions |
| **Payment Processor** | External payment gateway integration |
| **Reconciliation Service** | Daily balance verification, discrepancy detection |
| **Dispute Handler** | Chargeback processing, ledger reversal |
| **Idempotency Store** | Duplicate request detection |
| **Audit Logger** | Immutable transaction audit trail |

---

## 3. Ledger Mechanics

### 3.1 Ledger Entry Structure

```typescript
interface LedgerEntry {
  id: string;                    // UUID v4
  ledgerId: string;               // Parent ledger reference
  accountId: string;              // User/vendor/platform account
  accountType: AccountType;       // 'user' | 'vendor' | 'platform' | 'escrow'
  entryType: EntryType;           // 'debit' | 'credit'
  amount: number;                 // Integer (cents/smallest unit)
  currency: string;               // ISO 4217 (USD, EUR, etc.)
  transactionId: string;          // Groups related entries
  transactionType: TransactionType;
  description: string;
  metadata: Record<string, any>;  // Flexible for business logic
  createdAt: Date;
  createdBy: string;              // System or user ID
  checksum: string;               // SHA-256 of entry contents
}

type AccountType = 'user' | 'vendor' | 'platform' | 'escrow';
type EntryType = 'debit' | 'credit';
type TransactionType =
  | 'payment'
  | 'refund'
  | 'withdrawal'
  | 'deposit'
  | 'fee'
  | 'dispute'
  | 'reversal'
  | 'adjustment';
```

### 3.2 Ledger Rules Engine

```typescript
class LedgerRulesEngine {
  // Every transaction MUST create balanced entries
  validateBalance(entries: LedgerEntry[]): boolean {
    const totalDebits = entries
      .filter(e => e.entryType === 'debit')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCredits = entries
      .filter(e => e.entryType === 'credit')
      .reduce((sum, e) => sum + e.amount, 0);

    return totalDebits === totalCredits;
  }

  // Prevent negative balances for user accounts
  validateSufficientBalance(accountId: string, amount: number): boolean {
    const balance = this.getBalance(accountId);
    return balance.available >= amount;
  }

  // Validate required entries per transaction type
  getRequiredAccounts(txType: TransactionType): AccountType[] {
    const rules: Record<TransactionType, AccountType[]> = {
      payment: ['user', 'vendor', 'platform', 'escrow'],
      refund: ['vendor', 'user', 'platform', 'escrow'],
      withdrawal: ['user', 'platform'],
      deposit: ['user', 'platform'],
      fee: ['user', 'platform'],
      dispute: ['escrow', 'user', 'vendor'],
      reversal: ['user', 'vendor', 'platform'],
      adjustment: ['platform', 'user'],
    };
    return rules[txType];
  }
}
```

### 3.3 The Invariant: Sum of All Entries = Zero

```typescript
// In any closed ledger, the sum of all entries is always zero
// DEBITS = CREDITS for the entire system

function verifyLedgerIntegrity(ledgerId: string): IntegrityCheck {
  const entries = db.getEntries({ ledgerId });

  const summary = entries.reduce((acc, entry) => {
    if (entry.entryType === 'debit') {
      acc.debits += entry.amount;
    } else {
      acc.credits += entry.amount;
    }
    return acc;
  }, { debits: 0, credits: 0 });

  return {
    isBalanced: summary.debits === summary.credits,
    totalDebits: summary.debits,
    totalCredits: summary.credits,
    discrepancy: Math.abs(summary.debits - summary.credits),
    entryCount: entries.length,
  };
}
```

---

## 4. Wallet System

### 4.1 Wallet as Ledger View

**A wallet is NOT a source of truth. It is a VIEW of ledger balances.**

```typescript
interface Wallet {
  id: string;
  accountId: string;
  accountType: AccountType;
  currency: string;
  balances: {
    available: number;    // Can be spent/withdrawn
    pending: number;      // Processing transactions
    locked: number;       // Held for disputes/escrow
    total: number;        // Sum of all above
  };
  ledgerSnapshot: {
    lastEntryId: string;
    lastUpdated: Date;
    checksum: string;     // Validates view matches ledger
  };
}
```

### 4.2 Balance Calculation (Real-Time View)

```typescript
class WalletService {
  calculateBalance(accountId: string, currency: string): WalletBalances {
    // Always derive from ledger, never cache independently
    const entries = ledger.getEntries({ accountId, currency });

    return {
      available: this.computeAvailable(entries),
      pending: this.computePending(entries),
      locked: this.computeLocked(entries),
      total: this.computeTotal(entries),
    };
  }

  private computeAvailable(entries: LedgerEntry[]): number {
    const settled = entries.filter(e => e.settled && !e.disputed);
    const debits = settled.filter(e => e.entryType === 'debit');
    const credits = settled.filter(e => e.entryType === 'credit');

    // Asset account: Credit - Debit (money in minus money out)
    // This is a simplified view - actual calculation depends on account type
    return credits.reduce((sum, e) => sum + e.amount, 0) -
           debits.reduce((sum, e) => sum + e.amount, 0);
  }
}
```

### 4.3 Wallet Balance States

```
┌─────────────────────────────────────────────────────────────────┐
│                        WALLET BALANCE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   TOTAL: $1000                                                   │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ LOCKED (Disputes/Escrow)     │ AVAILABLE (Spendable)   │  │
│   │         $200                 │         $800           │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    PENDING (Processing)                  │  │
│   │                        $50                              │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   TOTAL = LOCKED + AVAILABLE + PENDING                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Payment Processing

### 5.1 Payment as Ledger Entry Creator

**Every payment MUST create atomic ledger entries.**

```typescript
interface PaymentRequest {
  idempotencyKey: string;
  amount: number;
  currency: string;
  fromAccountId: string;
  toAccountId: string;
  transactionType: 'payment';
  metadata: {
    orderId?: string;
    customerId?: string;
    vendorId?: string;
    paymentMethod?: string;
  };
}

class PaymentProcessor {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Step 1: Idempotency check
    const existing = await this.idempotencyStore.get(request.idempotencyKey);
    if (existing) {
      return existing.result;
    }

    // Step 2: Create payment in pending state
    const payment = await this.createPayment(request);

    try {
      // Step 3: Create ledger entries (atomic)
      const entries = await this.createLedgerEntries(payment);

      // Step 4: Update wallet balances
      await this.updateWalletBalances(entries);

      // Step 5: Mark payment as completed
      await this.completePayment(payment.id);

      // Step 6: Store result for idempotency
      await this.idempotencyStore.set(request.idempotencyKey, {
        result: { success: true, paymentId: payment.id, entries },
      });

      // Step 7: Emit event
      await this.eventBus.emit('payment.completed', payment);

      return { success: true, paymentId: payment.id, entries };
    } catch (error) {
      // Step 8: On failure, create reversal entries
      await this.handlePaymentFailure(payment, error);
      throw error;
    }
  }
}
```

### 5.2 Payment Ledger Entries

For a $100 payment from User to Vendor with 5% platform fee:

```typescript
// Creates 4 ledger entries (always balanced):
const entries = [
  // DEBIT: User's account reduced
  { account: 'user_123', type: 'debit',  amount: 10000, purpose: 'payment_out' },

  // CREDIT: Platform receives payment
  { account: 'platform', type: 'credit', amount: 10000, purpose: 'payment_in' },

  // DEBIT: Platform fee charged
  { account: 'platform', type: 'debit',  amount: 500, purpose: 'fee_debit' },

  // CREDIT: Fee revenue
  { account: 'platform', type: 'credit', amount: 500, purpose: 'fee_revenue' },
];

// Net: User -$100, Platform +$95 (net), Platform Revenue +$5
// Sum: 10000 + 500 = 500 + 10500 ✓ BALANCED
```

### 5.3 Payment States

```
                    ┌─────────────┐
                    │  CREATED    │
                    └──────┬──────┘
                           │ validate()
                           ▼
                    ┌─────────────┐
                    │  PENDING    │
                    │  (Ledger     │
                    │   entries    │
                    │   created)   │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌─────────────┐           ┌─────────────┐
       │  COMPLETED  │           │   FAILED    │
       │  (Funds     │           │  (Reversal  │
       │   moved)    │           │   entries   │
       └─────────────┘           │   created)  │
                                 └─────────────┘
```

---

## 6. Reconciliation

### 6.1 Daily Balance Check

Reconciliation verifies that ledger totals match wallet views and external records.

```typescript
interface ReconciliationReport {
  id: string;
  date: Date;
  status: 'pending' | 'passed' | 'failed' | 'requires_review';
  checks: ReconciliationCheck[];
  discrepancies: Discrepancy[];
  createdBy: string;
  completedAt?: Date;
}

interface ReconciliationCheck {
  name: string;
  description: string;
  expected: number;
  actual: number;
  passed: boolean;
  tolerance: number;  // Acceptable variance
}

class ReconciliationService {
  async runDailyReconciliation(date: Date): Promise<ReconciliationReport> {
    const checks: ReconciliationCheck[] = [];

    // Check 1: Ledger balances
    checks.push(await this.checkLedgerBalance(date));

    // Check 2: Wallet vs Ledger sync
    checks.push(await this.checkWalletLedgerSync(date));

    // Check 3: Pending transactions resolved
    checks.push(await this.checkPendingTransactions(date));

    // Check 4: External payment gateway sync
    checks.push(await this.checkExternalSync(date));

    // Check 5: Fee revenue calculation
    checks.push(await this.checkFeeRevenue(date));

    const report: ReconciliationReport = {
      id: generateUUID(),
      date,
      status: this.determineStatus(checks),
      checks,
      discrepancies: checks.filter(c => !c.passed),
    };

    await this.saveReport(report);
    await this.alertOnDiscrepancies(report);

    return report;
  }
}
```

### 6.2 Reconciliation Check Types

| Check | What it Verifies | Tolerance |
|-------|------------------|-----------|
| **Ledger Balance** | Total debits = total credits | 0 |
| **Wallet Sync** | Wallet balances match ledger | 0 |
| **Pending Txn** | All pending txns resolved or flagged | 0 |
| **External Sync** | Gateway totals match internal records | 1 cent |
| **Fee Revenue** | Calculated fees match ledger entries | 0 |
| **Currency Balances** | Each currency balances to zero | 0 |
| **Audit Trail** | All entries have valid audit records | 0 |

### 6.3 Automated Reconciliation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECONCILIATION SCHEDULE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐       │
│  │  HOURLY │───▶│  DAILY  │───▶│ WEEKLY  │───▶│ MONTHLY │       │
│  │  Light  │    │  Full   │    │  Deep   │    │  Audit  │       │
│  │  Check  │    │  Check  │    │  Audit  │    │ Review  │       │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘       │
│                                                                  │
│  HOURLY:  Pending txn count, obvious anomalies                  │
│  DAILY:   Full ledger balance, wallet sync, external check     │
│  WEEKLY:  Trend analysis, variance detection                    │
│  MONTHLY: Complete audit, compliance report, board review        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Dispute Handling

### 7.1 Dispute as Ledger Reversal

**A dispute does NOT delete the original transaction. It creates reversal entries.**

```typescript
interface DisputeRequest {
  transactionId: string;
  reason: DisputeReason;
  amount: number;
  evidence?: DisputeEvidence;
  requestedBy: string;
}

type DisputeReason =
  | 'fraud'
  | 'duplicate_charge'
  | 'product_not_received'
  | 'product_defective'
  | 'unauthorized_transaction'
  | 'billing_error';

class DisputeHandler {
  async openDispute(request: DisputeRequest): Promise<Dispute> {
    const transaction = await this.ledger.getTransaction(request.transactionId);

    // Step 1: Lock funds in escrow
    await this.createEscrowHold(transaction);

    // Step 2: Create dispute record
    const dispute = await this.createDisputeRecord(request);

    // Step 3: Create reversal ledger entries (draft)
    await this.createReversalEntries(dispute, transaction);

    // Step 4: Notify parties
    await this.notifyDisputeOpened(dispute);

    return dispute;
  }

  async resolveDispute(
    disputeId: string,
    resolution: DisputeResolution,
    arbitratorDecision: 'refund' | 'uphold' | 'partial'
  ): Promise<void> {
    const dispute = await this.getDispute(disputeId);

    switch (resolution) {
      case 'refund':
        await this.executeFullRefund(dispute);
        break;
      case 'uphold':
        await this.releaseEscrowToVendor(dispute);
        break;
      case 'partial':
        await this.executePartialResolution(dispute);
        break;
    }

    await this.closeDispute(disputeId, resolution);
  }
}
```

### 7.2 Dispute Ledger Entries

For a $100 dispute resolution (refund to customer):

```typescript
// Original Payment Entries:
// DEBIT:  user_123   -$100 (money out)
// CREDIT: vendor_456 +$95 (money in, minus fee)
// CREDIT: platform    +$5 (fee revenue)

// Reversal Entries (on dispute):
const reversalEntries = [
  // Reverse original: Vendor account credited back
  { account: 'vendor_456', type: 'credit',  amount: 9500, purpose: 'dispute_debit_vendor' },

  // Reverse original: User account debited back
  { account: 'user_123',   type: 'debit',   amount: 10000, purpose: 'dispute_credit_user' },

  // Reverse fee: Platform returns fee
  { account: 'platform',  type: 'debit',   amount: 500, purpose: 'dispute_fee_reversal' },

  // Fee return to vendor
  { account: 'platform',   type: 'credit',  amount: 500, purpose: 'dispute_fee_return' },
];

// Net effect: User +$100, Vendor -$100, Platform fee returned
// Sum: 9500 + 10000 = 500 + 20000 - 500 = 24500 ✓ BALANCED
```

### 7.3 Dispute State Machine

```
┌───────────┐    open()     ┌────────────┐
│  NONE     │──────────────▶│  OPEN       │
└───────────┘               └──────┬───────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌────────────┐       ┌────────────┐       ┌────────────┐
       │ UNDER      │       │ EVIDENCE   │       │ PRE-
       │ REVIEW     │       │ SUBMITTED  │       │ RESOLVED   │
       └──────┬─────┘       └─────┬──────┘       └─────┬──────┘
              │                    │                    │
              └────────────────────┴────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
              ┌───────────┐ ┌───────────┐ ┌───────────┐
              │  REFUND   │ │  UPHELD   │ │  PARTIAL  │
              │ (User wins)│ │(Vendor wins)│ │ (Split)  │
              └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                    │              │              │
                    └──────────────┴──────────────┘
                                   │
                                   ▼
                          ┌────────────┐
                          │  CLOSED    │
                          │ (Immutable)│
                          └────────────┘
```

---

## 8. API Contracts

### 8.1 Core API Endpoints

```yaml
openapi: 3.0.3
info:
  title: Financial Truth Layer API
  version: 1.0.0
  description: Double-entry ledger API for the ReZ platform

servers:
  - url: https://api.rez.com/v1/financial
    description: Production
  - url: https://api.staging.rez.com/v1/financial
    description: Staging

paths:
  /payments:
    post:
      summary: Create a payment
      operationId: createPayment
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PaymentRequest'
      responses:
        '201':
          description: Payment created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaymentResult'
        '409':
          description: Idempotency conflict
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/IdempotencyError'

  /wallets/{accountId}:
    get:
      summary: Get wallet balance
      operationId: getWallet
      parameters:
        - name: accountId
          in: path
          required: true
          schema:
            type: string
        - name: currency
          in: query
          required: false
          schema:
            type: string
            default: USD
      responses:
        '200':
          description: Wallet retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Wallet'

  /ledger/entries:
    get:
      summary: Query ledger entries
      operationId: queryLedgerEntries
      parameters:
        - name: accountId
          in: query
          required: false
          schema:
            type: string
        - name: transactionId
          in: query
          required: false
          schema:
            type: string
        - name: fromDate
          in: query
          required: false
          schema:
            type: string
            format: date-time
        - name: toDate
          in: query
          required: false
          schema:
            type: string
            format: date-time
        - name: limit
          in: query
          required: false
          schema:
            type: integer
            default: 100
            maximum: 1000
      responses:
        '200':
          description: Entries retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LedgerEntryList'

  /reconciliation:
    get:
      summary: Get reconciliation reports
      operationId: getReconciliationReports
      parameters:
        - name: date
          in: query
          required: false
          schema:
            type: string
            format: date
      responses:
        '200':
          description: Reports retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ReconciliationReportList'

  /disputes:
    post:
      summary: Open a dispute
      operationId: openDispute
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DisputeRequest'
      responses:
        '201':
          description: Dispute opened
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Dispute'

    get:
      summary: List disputes
      operationId: listDisputes
      parameters:
        - name: status
          in: query
          required: false
          schema:
            $ref: '#/components/schemas/DisputeStatus'
      responses:
        '200':
          description: Disputes retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DisputeList'

  /disputes/{disputeId}/resolve:
    post:
      summary: Resolve a dispute
      operationId: resolveDispute
      parameters:
        - name: disputeId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DisputeResolutionRequest'
      responses:
        '200':
          description: Dispute resolved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DisputeResolutionResult'

components:
  schemas:
    PaymentRequest:
      type: object
      required:
        - idempotencyKey
        - amount
        - currency
        - fromAccountId
        - toAccountId
      properties:
        idempotencyKey:
          type: string
          description: Unique key to prevent duplicate payments
        amount:
          type: integer
          description: Amount in smallest currency unit (cents)
        currency:
          type: string
          enum: [USD, EUR, GBP, CAD, AUD]
        fromAccountId:
          type: string
        toAccountId:
          type: string
        metadata:
          type: object
          additionalProperties: true

    PaymentResult:
      type: object
      properties:
        paymentId:
          type: string
        status:
          type: string
          enum: [pending, completed, failed]
        entries:
          type: array
          items:
            $ref: '#/components/schemas/LedgerEntry'
        createdAt:
          type: string
          format: date-time

    Wallet:
      type: object
      properties:
        id:
          type: string
        accountId:
          type: string
        currency:
          type: string
        balances:
          type: object
          properties:
            available:
              type: integer
            pending:
              type: integer
            locked:
              type: integer
            total:
              type: integer
        lastUpdated:
          type: string
          format: date-time

    LedgerEntry:
      type: object
      properties:
        id:
          type: string
        transactionId:
          type: string
        accountId:
          type: string
        accountType:
          type: string
          enum: [user, vendor, platform, escrow]
        entryType:
          type: string
          enum: [debit, credit]
        amount:
          type: integer
        currency:
          type: string
        description:
          type: string
        createdAt:
          type: string
          format: date-time

    DisputeRequest:
      type: object
      required:
        - transactionId
        - reason
        - amount
      properties:
        transactionId:
          type: string
        reason:
          type: string
          enum: [fraud, duplicate_charge, product_not_received, product_defective, unauthorized_transaction, billing_error]
        amount:
          type: integer
        evidence:
          type: object
          additionalProperties: true

    Dispute:
      type: object
      properties:
        disputeId:
          type: string
        transactionId:
          type: string
        status:
          type: string
          enum: [open, under_review, evidence_submitted, resolved, closed]
        reason:
          type: string
        amount:
          type: integer
        createdAt:
          type: string
          format: date-time
        resolvedAt:
          type: string
          format: date-time

    ReconciliationReport:
      type: object
      properties:
        id:
          type: string
        date:
          type: string
          format: date
        status:
          type: string
          enum: [pending, passed, failed, requires_review]
        checks:
          type: array
          items:
            $ref: '#/components/schemas/ReconciliationCheck'
        discrepancies:
          type: array
          items:
            $ref: '#/components/schemas/Discrepancy'

    Error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: object
          additionalProperties: true
```

### 8.2 Webhook Events

```typescript
// Financial Truth Layer emits these events:

interface PaymentEvent {
  event: 'payment.created' | 'payment.completed' | 'payment.failed';
  timestamp: string;
  data: {
    paymentId: string;
    transactionId: string;
    amount: number;
    currency: string;
    entries: LedgerEntry[];
  };
}

interface DisputeEvent {
  event: 'dispute.opened' | 'dispute.updated' | 'dispute.resolved';
  timestamp: string;
  data: {
    disputeId: string;
    transactionId: string;
    status: string;
    amount: number;
  };
}

interface ReconciliationEvent {
  event: 'reconciliation.completed';
  timestamp: string;
  data: {
    reportId: string;
    date: string;
    status: 'passed' | 'failed';
    discrepancyCount: number;
  };
}
```

---

## 9. Code Examples

### 9.1 Core Ledger Service

```typescript
// /Users/rejaulkarim/Documents/ReZ Full App/rez-financial-core/src/services/LedgerService.ts

import { v4 as uuidv4 } from 'uuid';
import { sha256 } from 'crypto-hash';
import { LedgerEntry, TransactionType, AccountType } from '../types';

export class LedgerService {
  constructor(
    private db: Database,
    private eventBus: EventBus,
    private auditLogger: AuditLogger
  ) {}

  async createTransaction(
    entries: Omit<LedgerEntry, 'id' | 'createdAt' | 'checksum'>[]
  ): Promise<LedgerEntry[]> {
    // Validate: At least 2 entries
    if (entries.length < 2) {
      throw new LedgerError('Transaction requires at least 2 entries');
    }

    // Validate: Balanced entries
    if (!this.isBalanced(entries)) {
      throw new LedgerError('Entries are not balanced: debits must equal credits');
    }

    // Validate: No negative amounts
    if (entries.some(e => e.amount <= 0)) {
      throw new LedgerError('Amount must be positive');
    }

    // Validate: Sufficient balance for debit entries
    for (const debitEntry of entries.filter(e => e.entryType === 'debit')) {
      const balance = await this.getBalance(debitEntry.accountId);
      const pendingDebits = await this.getPendingDebits(debitEntry.accountId);

      if (balance.available - pendingDebits < debitEntry.amount) {
        throw new InsufficientFundsError(debitEntry.accountId, debitEntry.amount);
      }
    }

    const transactionId = uuidv4();
    const createdAt = new Date();

    // Create ledger entries
    const ledgerEntries: LedgerEntry[] = entries.map(entry => {
      const checksum = this.calculateChecksum({
        ...entry,
        transactionId,
        createdAt,
      });

      return {
        ...entry,
        id: uuidv4(),
        transactionId,
        createdAt,
        checksum,
      } as LedgerEntry;
    });

    // Atomic write with row-level locking
    await this.db.transaction(async (tx) => {
      for (const entry of ledgerEntries) {
        await tx.query(
          `INSERT INTO ledger_entries (
            id, ledger_id, account_id, account_type, entry_type,
            amount, currency, transaction_id, transaction_type,
            description, metadata, created_at, created_by, checksum
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            entry.id,
            entry.ledgerId,
            entry.accountId,
            entry.accountType,
            entry.entryType,
            entry.amount,
            entry.currency,
            entry.transactionId,
            entry.transactionType,
            entry.description,
            JSON.stringify(entry.metadata),
            entry.createdAt,
            entry.createdBy,
            entry.checksum,
          ]
        );
      }
    });

    // Audit log
    await this.auditLogger.log({
      action: 'ledger.transaction.created',
      transactionId,
      entryCount: ledgerEntries.length,
      totalAmount: ledgerEntries.reduce((sum, e) => sum + e.amount, 0),
    });

    // Emit event
    await this.eventBus.emit('ledger.transaction.created', {
      transactionId,
      entries: ledgerEntries,
    });

    return ledgerEntries;
  }

  private isBalanced(entries: Omit<LedgerEntry, 'id' | 'createdAt' | 'checksum'>[]): boolean {
    const totalDebits = entries
      .filter(e => e.entryType === 'debit')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCredits = entries
      .filter(e => e.entryType === 'credit')
      .reduce((sum, e) => sum + e.amount, 0);

    return totalDebits === totalCredits;
  }

  private calculateChecksum(entry: Partial<LedgerEntry>): string {
    const content = JSON.stringify({
      accountId: entry.accountId,
      accountType: entry.accountType,
      entryType: entry.entryType,
      amount: entry.amount,
      currency: entry.currency,
      transactionId: entry.transactionId,
      transactionType: entry.transactionType,
      createdAt: entry.createdAt?.toISOString(),
    });

    return sha256(content);
  }

  async getBalance(accountId: string, currency: string = 'USD'): Promise<AccountBalance> {
    const result = await this.db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END), 0) as balance,
        COALESCE(SUM(CASE WHEN settled = false THEN amount ELSE 0 END), 0) as pending
      FROM ledger_entries
      WHERE account_id = $1 AND currency = $2 AND disputed = false
    `, [accountId, currency]);

    const { balance, pending } = result.rows[0];

    return {
      available: Number(balance) - Number(pending),
      pending: Number(pending),
      total: Number(balance),
    };
  }

  async getTransaction(transactionId: string): Promise<LedgerEntry[]> {
    const result = await this.db.query(`
      SELECT * FROM ledger_entries
      WHERE transaction_id = $1
      ORDER BY created_at ASC
    `, [transactionId]);

    return result.rows;
  }

  async createReversal(originalTransactionId: string, reason: string, createdBy: string): Promise<LedgerEntry[]> {
    const originalEntries = await this.getTransaction(originalTransactionId);

    if (originalEntries.length === 0) {
      throw new LedgerError(`Transaction not found: ${originalTransactionId}`);
    }

    // Create reversal entries with opposite entry types
    const reversalEntries = originalEntries.map(entry => ({
      ...entry,
      id: undefined,
      entryType: entry.entryType === 'debit' ? 'credit' : 'debit',
      transactionType: 'reversal' as TransactionType,
      description: `Reversal: ${reason}`,
      metadata: {
        ...entry.metadata,
        originalTransactionId,
        reversedAt: new Date().toISOString(),
        reversalReason: reason,
      },
      createdBy,
    }));

    return this.createTransaction(reversalEntries);
  }
}
```

### 9.2 Payment Service with Idempotency

```typescript
// /Users/rejaulkarim/Documents/ReZ Full App/rez-financial-core/src/services/PaymentService.ts

import { v4 as uuidv4 } from 'uuid';
import { LedgerService } from './LedgerService';
import { WalletService } from './WalletService';
import { IdempotencyStore } from '../stores/IdempotencyStore';

export class PaymentService {
  constructor(
    private ledgerService: LedgerService,
    private walletService: WalletService,
    private idempotencyStore: IdempotencyStore,
    private eventBus: EventBus
  ) {}

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Check idempotency first
    const existingResult = await this.idempotencyStore.get(request.idempotencyKey);
    if (existingResult) {
      return existingResult;
    }

    // Validate request
    this.validatePaymentRequest(request);

    // Check sufficient balance
    const balance = await this.walletService.getBalance(request.fromAccountId);
    if (balance.available < request.amount) {
      throw new InsufficientFundsError(request.fromAccountId, request.amount);
    }

    // Calculate fees
    const feeAmount = this.calculateFee(request.amount);
    const netAmount = request.amount - feeAmount;

    // Create ledger entries
    const entries = await this.ledgerService.createTransaction([
      // DEBIT: Payer account
      {
        ledgerId: 'main',
        accountId: request.fromAccountId,
        accountType: 'user',
        entryType: 'debit',
        amount: request.amount,
        currency: request.currency,
        transactionType: 'payment',
        description: `Payment to ${request.toAccountId}`,
        metadata: request.metadata || {},
        createdBy: 'payment-service',
      },
      // CREDIT: Payee account (net amount)
      {
        ledgerId: 'main',
        accountId: request.toAccountId,
        accountType: 'vendor',
        entryType: 'credit',
        amount: netAmount,
        currency: request.currency,
        transactionType: 'payment',
        description: `Payment from ${request.fromAccountId}`,
        metadata: request.metadata || {},
        createdBy: 'payment-service',
      },
      // CREDIT: Platform fee (if applicable)
      ...(feeAmount > 0 ? [{
        ledgerId: 'main',
        accountId: 'platform-fee-account',
        accountType: 'platform',
        entryType: 'credit',
        amount: feeAmount,
        currency: request.currency,
        transactionType: 'fee',
        description: 'Platform fee',
        metadata: { paymentRequestId: request.idempotencyKey },
        createdBy: 'payment-service',
      }] : []),
    ]);

    const result: PaymentResult = {
      paymentId: uuidv4(),
      transactionId: entries[0].transactionId,
      status: 'completed',
      amount: request.amount,
      fee: feeAmount,
      net: netAmount,
      currency: request.currency,
      entries,
      completedAt: new Date(),
    };

    // Store for idempotency
    await this.idempotencyStore.set(request.idempotencyKey, result);

    // Emit event
    await this.eventBus.emit('payment.completed', result);

    return result;
  }

  async processRefund(request: RefundRequest): Promise<RefundResult> {
    const existingResult = await this.idempotencyStore.get(request.idempotencyKey);
    if (existingResult) {
      return existingResult;
    }

    // Get original transaction
    const originalTransaction = await this.ledgerService.getTransaction(request.transactionId);

    if (originalTransaction.length === 0) {
      throw new LedgerError(`Original transaction not found: ${request.transactionId}`);
    }

    // Create reversal entries
    const reversalEntries = await this.ledgerService.createReversal(
      request.transactionId,
      request.reason || 'Customer refund',
      'refund-service'
    );

    const result: RefundResult = {
      refundId: uuidv4(),
      originalTransactionId: request.transactionId,
      status: 'completed',
      amount: request.amount,
      currency: originalTransaction[0].currency,
      entries: reversalEntries,
      completedAt: new Date(),
    };

    await this.idempotencyStore.set(request.idempotencyKey, result);
    await this.eventBus.emit('refund.completed', result);

    return result;
  }

  private calculateFee(amount: number): number {
    // Platform fee: 2.9% + $0.30 (Stripe-like pricing)
    const percentageFee = Math.round(amount * 0.029);
    const fixedFee = 30; // $0.30 in cents
    return percentageFee + fixedFee;
  }

  private validatePaymentRequest(request: PaymentRequest): void {
    if (!request.idempotencyKey) {
      throw new ValidationError('idempotencyKey is required');
    }
    if (!request.fromAccountId || !request.toAccountId) {
      throw new ValidationError('Both fromAccountId and toAccountId are required');
    }
    if (request.amount <= 0) {
      throw new ValidationError('Amount must be positive');
    }
    if (request.fromAccountId === request.toAccountId) {
      throw new ValidationError('Cannot pay yourself');
    }
  }
}
```

### 9.3 Reconciliation Service

```typescript
// /Users/rejaulkarim/Documents/ReZ Full App/rez-financial-core/src/services/ReconciliationService.ts

export class ReconciliationService {
  constructor(
    private db: Database,
    private ledgerService: LedgerService,
    private walletService: WalletService,
    private alertService: AlertService
  ) {}

  async runDailyReconciliation(date: Date): Promise<ReconciliationReport> {
    const startOfDay = startOfDayLocal(date);
    const endOfDay = endOfDayLocal(date);

    const checks: ReconciliationCheck[] = [];

    // Check 1: Ledger integrity (debits = credits)
    const ledgerCheck = await this.checkLedgerIntegrity(startOfDay, endOfDay);
    checks.push(ledgerCheck);

    // Check 2: Wallet-Ledger sync
    const walletSyncCheck = await this.checkWalletLedgerSync();
    checks.push(walletSyncCheck);

    // Check 3: No unresolved pending transactions > 24 hours
    const pendingCheck = await this.checkOldPendingTransactions();
    checks.push(pendingCheck);

    // Check 4: Currency totals balance
    const currencyCheck = await this.checkCurrencyBalances();
    checks.push(currencyCheck);

    // Check 5: Fee calculations match
    const feeCheck = await this.checkFeeRevenue();
    checks.push(feeCheck);

    const failedChecks = checks.filter(c => !c.passed);
    const status = failedChecks.length === 0
      ? 'passed'
      : failedChecks.length > 3
        ? 'failed'
        : 'requires_review';

    const report: ReconciliationReport = {
      id: uuidv4(),
      date,
      status,
      checks,
      discrepancies: failedChecks.map(c => ({
        checkName: c.name,
        expected: c.expected,
        actual: c.actual,
        variance: c.actual - c.expected,
      })),
      createdAt: new Date(),
    };

    await this.saveReport(report);

    if (status !== 'passed') {
      await this.alertService.sendReconciliationAlert(report);
    }

    return report;
  }

  private async checkLedgerIntegrity(
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationCheck> {
    const result = await this.db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0) as total_credits
      FROM ledger_entries
      WHERE created_at >= $1 AND created_at < $2
    `, [startDate, endDate]);

    const { total_debits, total_credits } = result.rows[0];
    const passed = Number(total_debits) === Number(total_credits);

    return {
      name: 'ledger_integrity',
      description: 'Total debits must equal total credits',
      expected: Number(total_debits),
      actual: Number(total_credits),
      passed,
      tolerance: 0,
    };
  }

  private async checkWalletLedgerSync(): Promise<ReconciliationCheck> {
    // Get all wallet balances
    const walletResult = await this.db.query(`
      SELECT account_id, currency, available_balance
      FROM wallets
    `);

    let maxVariance = 0;
    let syncPassed = true;

    for (const wallet of walletResult.rows) {
      const ledgerBalance = await this.ledgerService.getBalance(
        wallet.account_id,
        wallet.currency
      );

      const variance = Math.abs(ledgerBalance.total - Number(wallet.available_balance));
      if (variance > maxVariance) {
        maxVariance = variance;
      }
      if (variance > 0) {
        syncPassed = false;
      }
    }

    return {
      name: 'wallet_ledger_sync',
      description: 'All wallet balances must match ledger calculations',
      expected: 0,
      actual: maxVariance,
      passed: syncPassed,
      tolerance: 0,
    };
  }
}
```

---

## 10. Integration Guide

### 10.1 Getting Started

```bash
# Install the Financial Core SDK
npm install @rez/financial-core

# Configure environment
export FINANCIAL_DB_HOST=postgres.rez.internal
export FINANCIAL_DB_PORT=5432
export FINANCIAL_DB_NAME=ledger
export FINANCIAL_EVENT_BUS=amqp://events.rez.internal
```

### 10.2 Quick Integration

```typescript
import { FinancialClient } from '@rez/financial-core';

const financial = new FinancialClient({
  apiKey: process.env.FINANCIAL_API_KEY,
  environment: 'production', // or 'staging'
  timeout: 30000,
});

// Create a payment
const payment = await financial.payments.create({
  idempotencyKey: `${userId}-${orderId}-${Date.now()}`,
  amount: 9999, // $99.99 in cents
  currency: 'USD',
  fromAccountId: 'user_12345',
  toAccountId: 'vendor_67890',
  metadata: {
    orderId: 'order_abc123',
    productIds: ['prod_1', 'prod_2'],
  },
});

// Get wallet balance
const wallet = await financial.wallets.get('user_12345', { currency: 'USD' });
console.log(`Available: $${wallet.balances.available / 100}`);

// Open a dispute
const dispute = await financial.disputes.create({
  transactionId: payment.transactionId,
  reason: 'product_not_received',
  amount: payment.amount,
  evidence: {
    description: 'Package never arrived',
    trackingNumber: '1Z999AA10123456784',
  },
});
```

### 10.3 Webhook Integration

```typescript
import { WebhookReceiver } from '@rez/financial-core';

const receiver = new WebhookReceiver({
  webhookSecret: process.env.WEBHOOK_SECRET,
});

app.post('/webhooks/financial', async (req, res) => {
  const event = receiver.verify(req.body, req.headers['x-signature']);

  switch (event.type) {
    case 'payment.completed':
      await handlePaymentCompleted(event.data);
      break;

    case 'payment.failed':
      await handlePaymentFailed(event.data);
      break;

    case 'dispute.opened':
      await handleDisputeOpened(event.data);
      break;

    case 'dispute.resolved':
      await handleDisputeResolved(event.data);
      break;

    case 'reconciliation.completed':
      await handleReconciliationCompleted(event.data);
      break;
  }

  res.json({ received: true });
});
```

### 10.4 Best Practices

1. **Always use idempotency keys** - Prevent duplicate payments
2. **Handle webhooks asynchronously** - Use queues for processing
3. **Cache wallet balances carefully** - Always verify with ledger for critical operations
4. **Reconcile daily** - Catch discrepancies early
5. **Never modify ledger entries** - Use reversals only
6. **Store transaction metadata** - Enables dispute resolution
7. **Use the checksum** - Verify entry integrity

### 10.5 Error Handling

```typescript
try {
  const payment = await financial.payments.create(request);
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    // Handle insufficient balance
    await notifyUser('Insufficient funds');
  } else if (error instanceof IdempotencyConflictError) {
    // Return cached result
    return error.cachedResult;
  } else if (error instanceof LedgerError) {
    // Log and escalate - this is a system error
    await alertOperations(error);
  }
}
```

---

## 11. GitHub Repositories

### Primary Repositories

| Repository | Description | Language |
|------------|-------------|----------|
| [rez-financial-core](https://github.com/rez-platform/rez-financial-core) | Core ledger engine and payment processing | TypeScript |
| [rez-wallet-service](https://github.com/rez-platform/rez-wallet-service) | Wallet balance management | TypeScript |
| [rez-payment-gateway](https://github.com/rez-platform/rez-payment-gateway) | External payment gateway integration | TypeScript |
| [rez-reconciliation-service](https://github.com/rez-platform/rez-reconciliation-service) | Daily reconciliation automation | Python |
| [rez-dispute-handler](https://github.com/rez-platform/rez-dispute-handler) | Dispute resolution workflow | TypeScript |

### SDK Repositories

| Repository | Description |
|------------|-------------|
| [rez-financial-sdk-node](https://github.com/rez-platform/rez-financial-sdk-node) | Node.js/TypeScript SDK |
| [rez-financial-sdk-python](https://github.com/rez-platform/rez-financial-sdk-python) | Python SDK |
| [rez-financial-sdk-go](https://github.com/rez-platform/rez-financial-sdk-go) | Go SDK |

### Documentation

| Repository | Description |
|------------|-------------|
| [rez-financial-docs](https://github.com/rez-platform/rez-financial-docs) | API documentation |
| [rez-financial-runbooks](https://github.com/rez-platform/rez-financial-runbooks) | Operations runbooks |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Ledger** | Immutable record of all financial transactions using double-entry accounting |
| **Wallet** | View of ledger balances for a specific account |
| **Entry** | Single debit or credit record in the ledger |
| **Transaction** | Group of related ledger entries (always balanced) |
| **Reconciliation** | Process of verifying ledger integrity |
| **Dispute** | Customer challenge to a transaction |
| **Reversal** | Ledger entries that negate a previous transaction |
| **Escrow** | Funds held pending resolution |
| **Idempotency Key** | Unique key preventing duplicate transactions |

## Appendix B: Compliance Notes

- All ledger entries must be retained for 7 years (PCI DSS requirement)
- Reconciliation reports must be archived
- All financial operations are GDPR compliant
- SOX compliance for public company subsidiaries

---

**Document Version**: 1.0.0
**Last Updated**: 2026-05-04
**Owner**: Financial Platform Team
**Review Cycle**: Quarterly
