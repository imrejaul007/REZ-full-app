# REZ Platform — Complete Gap Execution Plan

**Version:** 1.0.0
**Date:** 2026-05-02
**Status:** READY FOR EXECUTION

---

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                 COMPLETE GAP EXECUTION ROADMAP                                    ║
║                                                                                   ║
║    56 Repos │ 3 Segments │ 200+ Gaps │ Phased Execution                         ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## EXECUTIVE SUMMARY

| Segment | Gaps Found | Critical | High | Medium |
|---------|-----------|----------|------|--------|
| Merchant | 80+ | 12 | 25 | 43 |
| Student | 40+ | 8 | 15 | 17 |
| Corporate | 50+ | 10 | 20 | 20 |

**Total Gaps:** 170+
**Build Order:** Student → Corporate → Merchant

---

## PHASE 1: STUDENT PARTNERSHIP SYSTEM

### Why First?
- You said partnerships are priority
- Infrastructure already exists (verification routes, offers)
- Smaller scope than Corporate or Merchant
- Quickest path to revenue

---

### 1.1 Student Document Verification

**Current State:** Email-only verification, no ID upload
**Target State:** Complete verification with document upload

**Files to Create/Modify:**
```
NEW:
├── rez-auth-service/src/services/studentVerificationService.ts
├── rez-auth-service/src/routes/studentVerificationRoutes.ts
├── rez-backend/src/models/StudentVerification.ts
└── rez-app-consumer/app/(tabs)/profile/verify/student-id-upload.tsx

MODIFY:
├── rez-auth-service/src/routes/zoneVerificationRoutes.ts
├── rez-backend/src/routes/zoneVerificationRoutes.ts
└── rez-app-consumer/app/(tabs)/profile/verify/index.tsx
```

**Implementation Steps:**

1. Create `StudentVerification` MongoDB model
```typescript
interface StudentVerification {
  _id: ObjectId;
  userId: ObjectId;
  institutionId: ObjectId;
  studentIdNumber: string;
  documentType: 'id_card' | 'admit_card' | 'bonafide';
  documentUrl: string;  // S3/Cloudinary URL
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  submittedAt: Date;
  verifiedAt?: Date;
  expiresAt: Date;  // Auto-expire after graduation year
  verificationMethod: 'auto' | 'manual';
  verifiedBy?: ObjectId;  // Admin who verified
}
```

2. Add document upload endpoint to auth-service
```typescript
POST /api/student/upload-document
- Accept image (jpg/png/pdf)
- Validate file size < 5MB
- Upload to S3/Cloudinary
- Store URL in StudentVerification
```

3. Add admin approval queue
```typescript
GET /api/admin/student-verifications (paginated)
POST /api/admin/student-verifications/:id/approve
POST /api/admin/student-verifications/:id/reject
```

4. Update consumer app with upload UI

**Timeline:** 3-4 days

---

### 1.2 Student Pricing Engine

**Current State:** Single price for all users
**Target State:** Persona-based pricing with student discounts

**Files to Create/Modify:**
```
NEW:
├── rez-catalog-service/src/services/studentPricingService.ts
├── rez-catalog-service/src/models/StudentPricing.ts
└── rez-catalog-service/src/routes/studentPricingRoutes.ts

MODIFY:
├── rez-catalog-service/src/models/Product.ts
└── rez-catalog-service/src/routes/productRoutes.ts
```

**Implementation Steps:**

1. Add student pricing fields to Product model
```typescript
interface StudentPricing {
  hasStudentDiscount: boolean;
  studentDiscountPercent: number;
  studentPrice?: number;  // Override calculation
  minStudentPrice?: number;  // Floor price
  campusExclusive?: ObjectId[];  // Institution IDs
  validFrom?: Date;
  validUntil?: Date;
}
```

2. Create pricing rules engine
```typescript
class StudentPricingEngine {
  calculatePrice(product: Product, user: User): number {
    if (!user.isVerifiedStudent) return product.price;

    const basePrice = product.studentPrice
      ?? (product.price * (1 - product.studentDiscountPercent / 100));

    return Math.max(basePrice, product.minStudentPrice ?? 0);
  }
}
```

3. Add `GET /api/products?for_student=true` endpoint

4. Update personalization to include student pricing

**Timeline:** 5-6 days

---

### 1.3 Student Tier & Gamification

**Current State:** Bronze/Silver/Gold/Platinum only
**Target State:** Campus-specific tiers and leaderboards

**Files to Create/Modify:**
```
NEW:
├── rez-gamification-service/src/config/studentTiers.ts
├── rez-gamification-service/src/services/studentLeaderboardService.ts
├── rez-gamification-service/src/services/studentMissionService.ts
└── rez-gamification-service/src/routes/studentGamificationRoutes.ts

MODIFY:
├── rez-gamification-service/src/config/tiers.ts
└── rez-gamification-service/src/services/tierService.ts
```

**Student Tiers:**
```typescript
const STUDENT_TIERS = {
  freshman: { minCoins: 0, multiplier: 1.5, badge: 'FRESHMEN' },
  sophomore: { minCoins: 500, multiplier: 1.75, badge: 'SOPHOMORE' },
  junior: { minCoins: 1500, multiplier: 2.0, badge: 'JUNIOR' },
  senior: { minCoins: 3000, multiplier: 2.5, badge: 'SENIOR' },
  scholar: { minCoins: 5000, multiplier: 3.0, badge: 'SCHOLAR' },
};
```

**Student Missions:**
```typescript
const STUDENT_MISSIONS = [
  { id: 'refer_5_classmates', coins: 500, title: 'Study Group Builder' },
  { id: 'first_student_order', coins: 100, title: 'First Bite' },
  { id: 'campus_explorer', coins: 200, title: 'Campus Explorer' },
  { id: 'exam_weekSurvivor', coins: 300, title: 'Exam Week Survivor' },
  { id: 'graduation_gold', coins: 1000, title: 'Golden Graduate' },
];
```

**Campus Leaderboard:**
```typescript
// Leaderboard per institution
GET /api/leaderboard/campus/:institutionId
Response: {
  rankings: [
    { rank: 1, user: {...}, coins: 5000, tier: 'scholar' },
    { rank: 2, user: {...}, coins: 4500, tier: 'senior' },
    ...
  ],
  userRank: 42,
  totalStudents: 1250
}
```

**Timeline:** 4-5 days

---

### 1.4 Student Wallet Features

**Current State:** Single wallet, no student features
**Target State:** Student cash balance with parental controls

**Files to Create/Modify:**
```
NEW:
├── rez-wallet-service/src/features/studentWallet.ts
├── rez-wallet-service/src/services/studentBudgetService.ts
├── rez-wallet-service/src/routes/studentWalletRoutes.ts
└── rez-app-consumer/app/wallet/student-wallet.tsx

MODIFY:
├── rez-wallet-service/src/models/Wallet.ts
└── rez-wallet-service/src/services/walletService.ts
```

**Implementation:**

1. Add student wallet type to Wallet model
```typescript
interface Wallet {
  userId: ObjectId;
  type: 'standard' | 'student';
  studentCash: {
    balance: number;
    fundedBy: ObjectId[];  // Parent user IDs
    monthlyAllowance?: number;
    spentThisMonth: number;
    budgetAlertAt: number;  // e.g., 80% of allowance
  };
  standardCash: { ... };
}
```

2. Parental funding feature
```typescript
POST /api/wallet/student/request-funding
- Student requests amount
- Parent receives notification
- Parent approves/rejects
- Funds transfer on approval

POST /api/wallet/student/transfer-to-parent
- Student transfers earnings to parent wallet
```

3. Budget tracking
```typescript
GET /api/wallet/student/budget-summary
POST /api/wallet/student/set-budget
POST /api/wallet/student/set-alert
```

**Timeline:** 5-6 days

---

### 1.5 Campus Partnership Portal

**Current State:** No campus partnership system
**Target State:** Full merchant-student partnership ecosystem

**Files to Create/Modify:**
```
NEW:
├── rez-marketing-service/src/services/campusPartnerService.ts
├── rez-marketing-service/src/models/CampusPartner.ts
├── rez-marketing-service/src/routes/campusPartnerRoutes.ts
├── rez-app-merchant/src/screens/CampusPartnership.tsx
├── rez-app-consumer/app/discover/campus-deals.tsx
└── rez-app-consumer/app/discover/student-exclusives.tsx

MODIFY:
├── rez-marketing-service/src/models/MarketingCampaign.ts
└── rez-merchant-service/src/services/merchantService.ts
```

**Campus Partner Model:**
```typescript
interface CampusPartner {
  _id: ObjectId;
  merchantId: ObjectId;
  institutionId: ObjectId;
  offerType: 'percentage' | 'fixed' | 'bundle';
  discount: number;
  minOrderValue?: number;
  maxDiscount?: number;
  dailyLimit?: number;
  studentVerificationRequired: boolean;
  status: 'pending' | 'active' | 'paused' | 'expired';
  startDate: Date;
  endDate?: Date;
  stats: {
    totalRedemptions: number;
    totalSavings: number;
    uniqueStudents: number;
  };
}
```

**Merchant Flow:**
1. Merchant logs into REZ Merchant App
2. Goes to "Campus Deals" section
3. Selects institution(s) to partner with
4. Creates student-specific offer
5. Sets verification requirements
6. Activates partnership

**Student Flow:**
1. Student opens REZ App
2. Goes to "Campus Deals" tab
3. Sees verified partners at their campus
4. Shops with automatic student discount
5. Order shows "Student Discount Applied"

**Timeline:** 6-7 days

---

### STUDENT PHASE SUMMARY

| Feature | Days | Priority |
|---------|------|----------|
| Document Verification | 3-4 | P0 |
| Student Pricing Engine | 5-6 | P0 |
| Student Tier & Gamification | 4-5 | P1 |
| Student Wallet | 5-6 | P1 |
| Campus Partnership Portal | 6-7 | P0 |

**Total: 23-28 days**

---

## PHASE 2: CORPORATE INTEGRATION SYSTEM

### Why Second?
- Larger scope
- Revenue-critical (B2B)
- Demo data needs replacement
- HRIS integration is blocking feature

---

### 2.1 HRIS Integration (GreytHR Priority)

**Current State:** Stub with setTimeout(2000)
**Target State:** Real GreytHR API integration

**Files to Create/Modify:**
```
NEW:
├── rez-corpperks-service/src/integrations/hris/greytHRService.ts
├── rez-corpperks-service/src/integrations/hris/bambooHRService.ts
├── rez-corpperks-service/src/integrations/hris/zohoHRService.ts
├── rez-corpperks-service/src/services/employeeSyncService.ts
├── rez-corpperks-service/src/models/HRISConnection.ts
├── rez-corpperks-service/src/routes/corpHRISRoutes.ts (replace existing)
└── CorpPerks/admin/src/pages/HRISConnections.tsx

MODIFY:
├── rez-corpperks-service/src/routes/corpPerksRoutes.ts
├── rez-corpperks-service/src/models/Employee.ts
└── rez-corpperks-service/src/services/benefitsService.ts
```

**GreytHR Service Implementation:**
```typescript
class GreytHRService {
  private baseUrl = 'https://api.greythr.com/v3';
  private clientId: string;
  private clientSecret: string;

  async authenticate(): Promise<string> {
    // OAuth2 client credentials flow
  }

  async syncEmployees(companyId: string): Promise<Employee[]> {
    const response = await this.get(`/employees`, {
      params: { company_id: companyId }
    });

    return response.data.map(this.transformEmployee);
  }

  async syncDepartments(): Promise<Department[]> {
    // GET /departments
  }

  async getEmployeeById(id: string): Promise<Employee> {
    // GET /employees/:id
  }

  transformEmployee(raw: GreytHREmployee): Employee {
    return {
      externalId: raw.employee_id,
      email: raw.email,
      firstName: raw.first_name,
      lastName: raw.last_name,
      department: raw.department_name,
      designation: raw.designation,
      doj: new Date(raw.date_of_joining),
      status: raw.status === 'active' ? 'active' : 'inactive',
      managerId: raw.manager_employee_id,
    };
  }

  async onEmployeeUpdate(webhook: GreytHRWebhook): Promise<void> {
    // Handle: new_join, exit, promotion, department_change
    await this.syncEmployee(webhook.employee_id);
  }
}
```

**Sync Service:**
```typescript
class EmployeeSyncService {
  async fullSync(companyId: string): Promise<SyncResult> {
    const hris = await this.getHRISConnection(companyId);
    const remoteEmployees = await hris.syncEmployees(companyId);
    const localEmployees = await this.getLocalEmployees(companyId);

    const { added, updated, removed } = this.diff(remoteEmployees, localEmployees);

    await this.processAdded(added);
    await this.processUpdated(updated);
    await this.processRemoved(removed);

    return { added: added.length, updated: updated.length, removed: removed.length };
  }

  async incrementalSync(companyId: string): Promise<void> {
    // Poll for changes since last sync
  }

  private async processAdded(employees: Employee[]): Promise<void> {
    for (const emp of employees) {
      await EmployeeModel.create({
        ...emp,
        companyId,
        status: 'active',
        syncedAt: new Date(),
      });
      await this.initializeWallet(emp);
      await this.assignDefaultBenefits(emp);
    }
  }
}
```

**Admin UI:**
1. "Connect HRIS" button
2. OAuth2 flow to GreytHR
3. Field mapping UI
4. Test sync button
5. Sync history log
6. Error reporting

**Timeline:** 8-10 days

---

### 2.2 Corporate Card Integration

**Current State:** Demo data with fake card numbers
**Target State:** Real card issuing via partner (Razorpay/Open)

**Files to Create/Modify:**
```
NEW:
├── rez-corpperks-service/src/services/cardIssuingService.ts
├── rez-corpperks-service/src/integrations/cardPartners/razorpayCardService.ts
├── rez-corpperks-service/src/integrations/cardPartners/openCardService.ts
├── rez-corpperks-service/src/models/CorporateCard.ts
├── rez-corpperks-service/src/routes/corpCardRoutes.ts
└── CorpPerks/admin/src/pages/CorporateCards.tsx

MODIFY:
├── rez-corpperks-service/src/routes/corpWalletRoutes.ts
├── rez-corpperks-service/src/services/transactionService.ts
└── rez-corpperks-service/src/models/Transaction.ts
```

**Corporate Card Model:**
```typescript
interface CorporateCard {
  _id: ObjectId;
  companyId: ObjectId;
  employeeId: ObjectId;
  cardNumber: string;  // Last 4 only, full stored encrypted
  cardType: 'virtual' | 'physical';
  network: 'visa' | 'mastercard' | 'rupay';
  status: 'active' | 'blocked' | 'expired' | 'pending';
  spendingLimit: {
    daily?: number;
    monthly?: number;
    perTransaction?: number;
  };
  restrictions: {
    categories?: string[];  // MCC codes
    merchants?: string[];
    countries?: string[];
  };
  issuedAt: Date;
  expiresAt: Date;
  issuedBy: ObjectId;
  cardLastFour: string;
  cardToken: string;  // For tokenization
}
```

**Card Issuing Flow:**
```typescript
async createVirtualCard(employeeId: string, limit: number): Promise<CorporateCard> {
  // 1. Create card via partner API
  const partnerCard = await razorpayCard.createVirtualCard({
    employee_id: employeeId,
    limit: limit,
    currency: 'INR',
  });

  // 2. Store card data securely
  const card = await CorporateCard.create({
    companyId: this.companyId,
    employeeId,
    cardToken: partnerCard.id,
    cardLastFour: partnerCard.last4,
    cardType: 'virtual',
    spendingLimit: { monthly: limit },
    status: 'active',
  });

  // 3. Send card details to employee (encrypted)
  await this.sendCardDetails(employeeId, partnerCard);

  return card;
}
```

**Timeline:** 7-8 days

---

### 2.3 GST e-Invoice Integration

**Current State:** Stub that just sets status
**Target State:** Real e-invoice submission to GST portal

**Files to Create/Modify:**
```
NEW:
├── rez-corpperks-service/src/integrations/gst/eInvoiceService.ts
├── rez-corpperks-service/src/integrations/gst/gstAuthService.ts
├── rez-corpperks-service/src/services/gstReconciliationService.ts
├── rez-corpperks-service/src/routes/gstRoutes.ts (replace existing)
└── CorpPerks/admin/src/pages/GSTManagement.tsx

MODIFY:
├── rez-corpperks-service/src/routes/corpGSTRoutes.ts
└── rez-corpperks-service/src/services/invoiceService.ts
```

**e-Invoice Implementation:**
```typescript
class EInvoiceService {
  private baseUrl = 'https://einvoice.gst.gov.in';
  private einvoiceToken: string;

  async authenticate(company: Company): Promise<void> {
    // Get OAuth token from GST Portal
    const token = await this.getAccessToken({
      client_id: company.gstCredentials.clientId,
      client_secret: company.gstCredentials.clientSecret,
      username: company.gstCredentials.username,
      password: company.gstCredentials.password,
    });
    this.einvoiceToken = token;
  }

  async generateIRN(invoice: Invoice): Promise<IRNResponse> {
    // Generate Invoice Reference Number
    const payload = this.buildInvoicePayload(invoice);

    const response = await this.post('/invoice', payload, {
      headers: { 'Authorization': `Bearer ${this.einvoiceToken}` }
    });

    return {
      irn: response.data.Irn,
      signedInvoice: response.data.SignedInvoice,
      qrCodeImage: response.data.QrCodeImage,
      ewayBillNumber: response.data.EwbNo,
      einvoiceDate: new Date(response.data.IrnDate),
    };
  }

  async cancelIRN(irn: string, reason: string): Promise<void> {
    await this.post('/invoice/cancel', {
      Irn,
      CnlRsn: reason,
      CnlRem: 'Duplicate invoice / Other',
    });
  }

  async generateEwayBill(params: EwayBillParams): Promise<string> {
    // For B2C transactions > 50,000
  }
}
```

**GST Reconciliation:**
```typescript
async reconcileGSTR2B(): Promise<ReconciliationResult> {
  // 1. Get filed GSTR-2B from GST portal
  const gstr2b = await this.fetchGSTR2B(this.quarter);

  // 2. Get our recorded purchases
  const purchases = await this.getPurchaseInvoices({
    dateRange: this.quarter,
    status: 'paid',
  });

  // 3. Match ITC claims
  const matches = [];
  const unmatched = [];

  for (const purchase of purchases) {
    const matched = gstr2b.find(item =>
      item.gstin === purchase.vendorGstin &&
      item.invoiceNo === purchase.invoiceNumber &&
      item.taxableValue === purchase.taxableAmount
    );

    if (matched) {
      matches.push({ purchase, gstr2b: matched, itcClaimed: matched.igst + matched.cgst + matched.sgst });
    } else {
      unmatched.push(purchase);
    }
  }

  return { matches, unmatched, totalITC: sum(matches.map(m => m.itcClaimed)) };
}
```

**Timeline:** 8-10 days

---

### 2.4 Travel Booking Integration

**Current State:** Demo hotel data
**Target State:** Real GDS integration (TBO/RateGain)

**Files to Create/Modify:**
```
NEW:
├── rez-corpperks-service/src/integrations/travel/tboService.ts
├── rez-corpperks-service/src/integrations/travel/hotelSearchService.ts
├── rez-corpperks-service/src/integrations/travel/bookingService.ts
├── rez-corpperks-service/src/services/travelPolicyService.ts
├── rez-corpperks-service/src/models/TravelBooking.ts
├── rez-corpperks-service/src/routes/travelRoutes.ts
└── CorpPerks/admin/src/pages/TravelPolicy.tsx

MODIFY:
├── rez-corpperks-service/src/routes/makcorpsRoutes.ts
└── rez-corpperks-service/src/services/benefitsService.ts
```

**Travel Policy Engine:**
```typescript
interface TravelPolicy {
  _id: ObjectId;
  companyId: ObjectId;
  rules: TravelPolicyRule[];
  approvals: ApprovalRule[];
}

interface TravelPolicyRule {
  type: 'hotel_star' | 'meal_allowance' | 'flight_class' | 'cab_tier';
  condition: PolicyCondition;
  limit?: number;
  allowed?: string[];
}

class TravelPolicyService {
  async checkPolicyCompliance(booking: TravelBooking, employee: Employee): Promise<PolicyCheck> {
    const policy = await this.getPolicy(employee.companyId);

    const violations = [];

    // Check hotel star rating
    if (booking.type === 'hotel') {
      const hotelRule = policy.rules.find(r => r.type === 'hotel_star');
      if (hotelRule && booking.hotelStar > hotelRule.limit) {
        violations.push({
          rule: 'hotel_star',
          message: `Hotel exceeds ${hotelRule.limit}-star limit`,
          requiresApproval: true,
        });
      }
    }

    // Check flight class based on designation
    if (booking.type === 'flight') {
      const flightRule = policy.rules.find(r => r.type === 'flight_class');
      if (flightRule && !flightRule.allowed.includes(booking.flightClass)) {
        violations.push({
          rule: 'flight_class',
          message: `${booking.flightClass} not allowed for your level`,
          requiresApproval: true,
        });
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
      autoApproved: violations.filter(v => !v.requiresApproval).length === violations.length,
    };
  }

  async submitForApproval(booking: TravelBooking, violations: Violation[]): Promise<void> {
    // Create approval request
    // Notify manager
    // Track status
  }
}
```

**Timeline:** 10-12 days

---

### 2.5 Budget Enforcement & Approvals

**Current State:** Just checks balance
**Target State:** Full budget controls with workflow

**Files to Create/Modify:**
```
NEW:
├── rez-corpperks-service/src/services/budgetEnforcementService.ts
├── rez-corpperks-service/src/services/approvalWorkflowService.ts
├── rez-corpperks-service/src/models/BudgetAllocation.ts
├── rez-corpperks-service/src/models/ApprovalRequest.ts
├── rez-corpperks-service/src/routes/budgetRoutes.ts
└── CorpPerks/admin/src/pages/BudgetManagement.tsx

MODIFY:
├── rez-corpperks-service/src/routes/corpWalletRoutes.ts
├── rez-corpperks-service/src/services/transactionService.ts
└── CorpPerks/admin/src/pages/EmployeeBenefits.tsx
```

**Budget Enforcement:**
```typescript
class BudgetEnforcementService {
  async processTransaction(tx: Transaction): Promise<TransactionResult> {
    const allocation = await this.getAllocation(tx.employeeId, tx.category);

    // Check category budget
    if (allocation.spent + tx.amount > allocation.monthlyLimit) {
      const remaining = allocation.monthlyLimit - allocation.spent;

      if (allocation.isHardLimit) {
        return { approved: false, reason: 'Budget exhausted', canRequestApproval: true };
      } else {
        // Soft limit - allow with warning
        await this.sendBudgetAlert(tx.employeeId, allocation);
      }
    }

    // Check department budget
    const deptBudget = await this.getDepartmentBudget(tx.employeeId);
    if (deptBudget && deptBudget.spent + tx.amount > deptBudget.monthlyLimit) {
      return {
        approved: false,
        reason: 'Department budget exceeded',
        canRequestApproval: true,
        approvalType: 'department_budget_exceed',
      };
    }

    // Check policy compliance
    const policyCheck = await this.travelPolicyService.checkPolicyCompliance(tx);
    if (!policyCheck.compliant && policyCheck.violations.some(v => v.requiresApproval)) {
      return {
        approved: false,
        reason: 'Travel policy violation',
        canRequestApproval: true,
        approvalType: 'policy_exception',
        violations: policyCheck.violations,
      };
    }

    return { approved: true };
  }
}
```

**Approval Workflow:**
```typescript
class ApprovalWorkflowService {
  async createApprovalRequest(params: ApprovalParams): Promise<ApprovalRequest> {
    const request = await ApprovalRequest.create({
      ...params,
      status: 'pending',
      approverId: await this.determineApprover(params.employeeId, params.type),
      createdAt: new Date(),
    });

    await this.notifyApprover(request);
    return request;
  }

  async approve(requestId: string, approverId: string, notes?: string): Promise<void> {
    const request = await ApprovalRequest.findById(requestId);
    if (request.approverId !== approverId) {
      throw new Error('Not authorized to approve');
    }

    request.status = 'approved';
    request.approvedAt = new Date();
    request.approverNotes = notes;
    await request.save();

    await this.executeApprovedAction(request);
    await this.notifyRequester(request);
  }
}
```

**Timeline:** 6-7 days

---

### 2.6 Expense Reporting

**Current State:** Missing
**Target State:** Full expense workflow

**Files to Create/Modify:**
```
NEW:
├── rez-corpperks-service/src/models/ExpenseReport.ts
├── rez-corpperks-service/src/services/expenseReportService.ts
├── rez-corpperks-service/src/routes/expenseRoutes.ts
├── rez-corpperks-service/src/services/receiptParserService.ts
├── CorpPerks/employee-app/src/screens/ExpenseReport.tsx
├── CorpPerks/employee-app/src/screens/CreateExpense.tsx
└── CorpPerks/admin/src/pages/ExpenseApproval.tsx

MODIFY:
├── rez-corpperks-service/src/services/transactionService.ts
└── rez-corpperks-service/src/routes/corpWalletRoutes.ts
```

**Expense Report Model:**
```typescript
interface ExpenseReport {
  _id: ObjectId;
  employeeId: ObjectId;
  companyId: ObjectId;
  title: string;
  description?: string;
  category: 'travel' | 'meal' | 'supplies' | 'client' | 'other';
  expenses: Expense[];
  totalAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: ObjectId;
  approverNotes?: string;
  receiptUrls: string[];
  tripId?: ObjectId;  // Link to travel booking
}

interface Expense {
  date: Date;
  merchant: string;
  amount: number;
  category: string;
  description?: string;
  receiptUrl?: string;
  currency: string;
  exchangeRate?: number;
  inrAmount?: number;
}
```

**Receipt Parsing:**
```typescript
class ReceiptParserService {
  async parseReceipt(imageUrl: string): Promise<ParsedReceipt> {
    // 1. Download image
    const image = await this.downloadImage(imageUrl);

    // 2. OCR using Google Vision / AWS Textract
    const text = await this.ocr(image);

    // 3. Extract key fields using regex/ML
    const parsed = this.extractFields(text);

    // 4. Return structured data
    return {
      merchantName: parsed.merchant,
      amount: parsed.amount,
      date: parsed.date,
      category: this.categorizeFromText(parsed.description),
      confidence: parsed.confidence,
    };
  }
}
```

**Timeline:** 8-10 days

---

### 2.7 Corporate SSO (SAML)

**Current State:** OAuth2 partner only
**Target State:** SAML 2.0 enterprise SSO

**Files to Create/Modify:**
```
NEW:
├── rez-auth-service/src/integrations/saml/samlService.ts
├── rez-auth-service/src/integrations/saml/samlMiddleware.ts
├── rez-auth-service/src/models/SAMLConfig.ts
├── rez-auth-service/src/routes/samlRoutes.ts
├── rez-auth-service/src/routes/admin/samlAdminRoutes.ts
└── rez-corpperks-service/src/pages/SSOSetup.tsx

MODIFY:
├── rez-auth-service/src/routes/oauthPartnerRoutes.ts
└── rez-auth-service/src/middleware/auth.ts
```

**Timeline:** 6-8 days

---

### CORPORATE PHASE SUMMARY

| Feature | Days | Priority |
|---------|------|----------|
| HRIS Integration (GreytHR) | 8-10 | P0 |
| Corporate Card Issuing | 7-8 | P0 |
| GST e-Invoice | 8-10 | P0 |
| Travel Booking (TBO) | 10-12 | P1 |
| Budget Enforcement | 6-7 | P1 |
| Expense Reporting | 8-10 | P1 |
| Corporate SSO (SAML) | 6-8 | P2 |

**Total: 53-65 days**

---

## PHASE 3: MERCHANT AI & CONNECTIONS

### Why Third?
- Largest scope (80+ gaps)
- Merchant Copilot is most visible
- AdBazaar integration critical for revenue
- Foundation for other features

---

### 3.1 Fix Merchant Copilot (Replace Mock Data)

**Current State:** Hardcoded health scores, fake recommendations
**Target State:** Real ML-powered insights

**Files to Create/Modify:**
```
NEW:
├── rez-merchant-intelligence-service/src/services/merchantHealthScorer.ts
├── rez-merchant-intelligence-service/src/services/recommendationEngine.ts
├── rez-merchant-intelligence-service/src/services/competitorAnalyzer.ts
├── rez-merchant-intelligence-service/src/ml/models/merchantHealthModel.ts
├── rez-merchant-intelligence-service/src/ml/training/healthTraining.ts
├── REZ-merchant-copilot/src/services/realDataService.ts
├── REZ-merchant-copilot/src/routes/merchantInsightsRoutes.ts
└── REZ-merchant-copilot/public/dashboard.html (rewrite)

MODIFY:
├── REZ-merchant-copilot/src/index.ts
├── REZ-merchant-copilot/src/routes/copilotRoutes.ts
└── rez-merchant-service/src/services/merchantAnalyticsService.ts
```

**Merchant Health Score Algorithm:**
```typescript
class MerchantHealthScorer {
  async calculateHealthScore(merchantId: string): Promise<HealthScore> {
    const [orders, revenue, customers, reviews, inventory] = await Promise.all([
      this.getOrderMetrics(merchantId),
      this.getRevenueMetrics(merchantId),
      this.getCustomerMetrics(merchantId),
      this.getReviewMetrics(merchantId),
      this.getInventoryMetrics(merchantId),
    ]);

    // Weighted scoring
    const scores = {
      orderHealth: this.scoreOrders(orders),      // 25%
      revenueHealth: this.scoreRevenue(revenue),  // 30%
      customerHealth: this.scoreCustomers(customers), // 20%
      reviewHealth: this.scoreReviews(reviews),    // 15%
      inventoryHealth: this.scoreInventory(inventory), // 10%
    };

    const overall = Object.values(scores)
      .reduce((sum, s, i) => sum + s * WEIGHTS[i], 0);

    return {
      overall: Math.round(overall),
      breakdown: scores,
      trend: await this.getTrend(merchantId),
      recommendations: await this.generateRecommendations(merchantId, scores),
    };
  }

  private scoreOrders(orders: OrderMetrics): number {
    // Compare to historical average
    const change = (orders.thisWeek - orders.lastWeek) / orders.lastWeek;
    const base = 70; // Average score

    if (change > 0.2) return Math.min(100, base + 30);
    if (change > 0) return base + (change * 100);
    if (change > -0.1) return base + (change * 100);
    return Math.max(0, base + (change * 200));
  }

  private scoreRevenue(revenue: RevenueMetrics): number {
    // Compare to target
    const achievement = revenue.actual / revenue.target;
    if (achievement >= 1) return Math.min(100, 80 + (achievement - 1) * 20);
    if (achievement >= 0.8) return 60 + (achievement - 0.8) * 100;
    return Math.max(0, achievement * 75);
  }
}
```

**Real Recommendations Engine:**
```typescript
class MerchantRecommendationEngine {
  async generateRecommendations(merchantId: string): Promise<Recommendation[]> {
    const [health, competitorData, marketTrends] = await Promise.all([
      this.healthScorer.calculateHealthScore(merchantId),
      this.competitorAnalyzer.analyze(merchantId),
      this.marketTrends.getTrends(merchantId),
    ]);

    const recommendations: Recommendation[] = [];

    // Based on health issues
    if (health.breakdown.orderHealth < 50) {
      recommendations.push({
        category: 'orders',
        priority: 'high',
        title: 'Boost Your Orders',
        description: 'Your order volume dropped 20% this week',
        actions: [
          { type: 'run_promotion', title: 'Launch a 10% off promo' },
          { type: 'boost_ads', title: 'Increase AdBazaar budget' },
        ],
      });
    }

    // Based on competitor gaps
    if (competitorData.priceGap > 10) {
      recommendations.push({
        category: 'pricing',
        priority: 'medium',
        title: 'Price Positioning',
        description: `Your prices are ${competitorData.priceGap}% higher than competitors`,
        actions: [
          { type: 'adjust_pricing', title: 'Review pricing strategy' },
          { type: 'add_value', title: 'Bundle products to justify price' },
        ],
      });
    }

    // Based on market trends
    if (marketTrends.demandIncrease.includes(merchantId.category)) {
      recommendations.push({
        category: 'inventory',
        priority: 'medium',
        title: 'Stock Up',
        description: 'Demand for ${category} items is rising in your area',
        actions: [
          { type: 'reorder', title: 'Check low-stock items' },
          { type: 'prepare', title: 'Plan prep for weekend' },
        ],
      });
    }

    return recommendations.sort((a, b) => PRIORITY[a.priority] - PRIORITY[b.priority]);
  }
}
```

**Real Competitor Analysis:**
```typescript
class CompetitorAnalyzer {
  async analyze(merchantId: string): Promise<CompetitorAnalysis> {
    const merchant = await this.getMerchant(merchantId);

    // Find competitors in same category/location
    const competitors = await Merchant.find({
      _id: { $ne: merchantId },
      category: merchant.category,
      location: {
        $geoWithin: {
          $centerSphere: [merchant.location.coordinates, 5 / 6378.1] // 5km
        }
      }
    }).limit(5);

    // Analyze pricing
    const competitorPrices = await this.getAveragePrices(competitors);
    const ourPrices = await this.getAveragePrices([merchant]);

    return {
      competitors: competitors.map(c => ({
        id: c._id,
        name: c.name,
        rating: c.rating,
        priceLevel: this.calculatePriceLevel(c),
      })),
      priceGap: ((ourPrices.avg - competitorPrices.avg) / competitorPrices.avg) * 100,
      ratingGap: merchant.rating - competitorPrices.avgRating,
      marketShare: await this.calculateMarketShare(merchant, competitors),
    };
  }
}
```

**Timeline:** 10-12 days

---

### 3.2 AdBazaar Integration

**Current State:** Separate database, no ROI tracking
**Target State:** Full integration with merchant analytics

**Files to Create/Modify:**
```
NEW:
├── rez-ads-service/src/services/adAnalyticsService.ts
├── rez-ads-service/src/services/conversionTrackingService.ts
├── rez-ads-service/src/routes/adAnalyticsRoutes.ts
├── rez-merchant-service/src/services/adCampaignSyncService.ts
├── rez-merchant-service/src/routes/adCampaignRoutes.ts
└── rez-app-merchant/app/screens/CampaignAnalytics.tsx

MODIFY:
├── rez-adbazaar/src/services/campaignService.ts
├── rez-adbazaar/src/webhooks/merchantWebhook.ts
└── rez-merchant-service/src/services/merchantAnalyticsService.ts
```

**Conversion Tracking:**
```typescript
class ConversionTrackingService {
  async trackConversion(params: ConversionParams): Promise<void> {
    // 1. Find attributed campaign
    const attribution = await this.findAttribution(params);

    if (!attribution) return; // Organic order

    // 2. Update campaign metrics
    await this.updateCampaignMetrics(attribution.campaignId, {
      conversions: 1,
      conversionValue: params.orderAmount,
      attributedOrders: params.orderId,
    });

    // 3. Calculate ROI
    const campaign = await Campaign.findById(attribution.campaignId);
    const roi = this.calculateROI(campaign, params.orderAmount);

    // 4. Update merchant analytics
    await this.updateMerchantAdPerformance(attribution.merchantId, {
      campaignId: attribution.campaignId,
      conversions: 1,
      revenue: params.orderAmount,
      roi,
    });
  }

  private async findAttribution(params: ConversionParams): Promise<Attribution | null> {
    // Check click-through attribution first (7 days)
    const click = await ClickAttribution.findOne({
      deviceId: params.deviceId,
      campaignId: { $exists: true },
      clickedAt: { $gte: subDays(new Date(), 7) },
    }).sort({ clickedAt: -1 });

    if (click) {
      return { type: 'click', campaignId: click.campaignId, merchantId: click.merchantId };
    }

    // Check view-through attribution (24 hours)
    const view = await ViewAttribution.findOne({
      deviceId: params.deviceId,
      campaignId: { $exists: true },
      viewedAt: { $gte: subDays(new Date(), 1) },
    }).sort({ viewedAt: -1 });

    if (view) {
      return { type: 'view', campaignId: view.campaignId, merchantId: view.merchantId };
    }

    return null;
  }
}
```

**Timeline:** 8-10 days

---

### 3.3 Aggregator Integration (Swiggy/Zomato)

**Current State:** Channel manager stub
**Target State:** Real order sync

**Files to Create/Modify:**
```
NEW:
├── rez-merchant-service/src/integrations/aggregators/swiggyService.ts
├── rez-merchant-service/src/integrations/aggregators/zomatoService.ts
├── rez-merchant-service/src/integrations/aggregators/channelManager.ts
├── rez-merchant-service/src/services/orderSyncService.ts
├── rez-merchant-service/src/routes/aggregatorRoutes.ts
├── rez-app-merchant/app/screens/AggregatorOrders.tsx
└── rez-merchant-service/src/models/AggregatorConfig.ts

MODIFY:
├── rez-merchant-service/src/models/Order.ts
├── rez-merchant-service/src/services/orderService.ts
└── rez-merchant-service/src/routes/orderRoutes.ts
```

**Channel Manager Implementation:**
```typescript
class ChannelManager {
  private aggregators: Map<string, AggregatorAdapter> = new Map();

  async initialize(): Promise<void> {
    this.aggregators.set('swiggy', new SwiggyAdapter());
    this.aggregators.set('zomato', new ZomatoAdapter());
    this.aggregators.set('dunzo', new DunzoAdapter());
  }

  async syncOrders(merchantId: string): Promise<Order[]> {
    const orders: Order[] = [];

    for (const [name, adapter] of this.aggregators) {
      try {
        const config = await this.getAggregatorConfig(merchantId, name);
        if (config?.enabled) {
          const aggregatorOrders = await adapter.fetchNewOrders(config);
          const localOrders = await this.convertOrders(aggregatorOrders, name);
          orders.push(...localOrders);
        }
      } catch (error) {
        await this.logSyncError(name, error);
      }
    }

    return orders;
  }

  async pushMenu(merchantId: string, menu: Menu): Promise<void> {
    for (const [name, adapter] of this.aggregators) {
      const config = await this.getAggregatorConfig(merchantId, name);
      if (config?.enabled) {
        await adapter.updateMenu(config, menu);
      }
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const order = await Order.findById(orderId);
    const adapter = this.aggregators.get(order.aggregator);

    if (adapter) {
      await adapter.updateOrderStatus(order.aggregatorOrderId, status);
    }
  }
}
```

**Timeline:** 12-15 days

---

### 3.4 Delivery Partner Integration

**Files to Create/Modify:**
```
NEW:
├── rez-order-service/src/integrations/delivery/dunzoService.ts
├── rez-order-service/src/integrations/delivery/shadowfaxService.ts
├── rez-order-service/src/services/deliveryAssignmentService.ts
├── rez-order-service/src/models/DeliveryOrder.ts
├── rez-order-service/src/routes/deliveryRoutes.ts
└── rez-app-merchant/app/screens/DeliveryTracking.tsx

MODIFY:
├── rez-order-service/src/services/orderService.ts
└── rez-order-service/src/routes/orderRoutes.ts
```

**Timeline:** 8-10 days

---

### 3.5 Tally Integration

**Files to Create/Modify:**
```
NEW:
├── rez-merchant-service/src/integrations/tally/tallyService.ts
├── rez-merchant-service/src/integrations/tally/tallyXMLParser.ts
├── rez-merchant-service/src/services/accountingSyncService.ts
├── rez-merchant-service/src/routes/tallyRoutes.ts
└── rez-app-merchant/app/screens/AccountingSync.tsx

MODIFY:
├── rez-merchant-service/src/services/settlementService.ts
└── rez-merchant-service/src/routes/settlementRoutes.ts
```

**Timeline:** 6-8 days

---

### 3.6 Cross-App Connections

**Rendez Social Integration:**
```typescript
// Connect merchant to Rendez events
POST /api/merchant/:id/rendez/events
- Link merchant to local events
- Enable "Order from event" button
- Track event-driven orders
```

**Hotel OTA Cross-Sell:**
```typescript
// For hotel merchants, enable restaurant cross-sell
GET /api/merchant/:id/hotel-nearby-restaurants
- Find restaurant partners near hotel
- Show "Order food to your room" in hotel app
- Commission tracking
```

**Timeline:** 5-7 days

---

### MERCHANT PHASE SUMMARY

| Feature | Days | Priority |
|---------|------|----------|
| Merchant AI Copilot | 10-12 | P0 |
| AdBazaar ROI Integration | 8-10 | P0 |
| Aggregator Sync (Swiggy/Zomato) | 12-15 | P1 |
| Delivery Partner Integration | 8-10 | P1 |
| Tally Two-Way Sync | 6-8 | P1 |
| Cross-App Connections (Rendez/Hotel) | 5-7 | P2 |

**Total: 49-62 days**

---

## EXECUTION TIMELINE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXECUTION TIMELINE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WEEK 1-4: STUDENT SYSTEM                                                       │
│  ├── Day 1-4: Document Verification                                             │
│  ├── Day 5-10: Student Pricing Engine                                           │
│  ├── Day 11-15: Student Tier & Gamification                                     │
│  ├── Day 16-21: Student Wallet                                                  │
│  └── Day 22-28: Campus Partnership Portal                                       │
│                                                                                  │
│  WEEK 5-14: CORPORATE SYSTEM                                                    │
│  ├── Day 29-38: HRIS Integration (GreytHR)                                      │
│  ├── Day 39-46: Corporate Card Issuing                                          │
│  ├── Day 47-56: GST e-Invoice                                                    │
│  ├── Day 57-68: Travel Booking (TBO)                                            │
│  ├── Day 69-75: Budget Enforcement                                              │
│  ├── Day 76-85: Expense Reporting                                               │
│  └── Day 86-93: Corporate SSO                                                   │
│                                                                                  │
│  WEEK 15-25: MERCHANT SYSTEM                                                    │
│  ├── Day 94-105: Merchant AI Copilot                                            │
│  ├── Day 106-115: AdBazaar ROI Integration                                      │
│  ├── Day 116-130: Aggregator Sync                                               │
│  ├── Day 131-140: Delivery Partner Integration                                  │
│  ├── Day 141-148: Tally Integration                                             │
│  └── Day 149-155: Cross-App Connections                                         │
│                                                                                  │
│  TOTAL: ~155 days (~31 weeks ~ 7.5 months)                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## RESOURCE REQUIREMENTS

### Team Structure

| Role | Count | Phase |
|------|-------|-------|
| Senior Backend (Node.js) | 2 | All |
| Senior Frontend (React/React Native) | 2 | All |
| ML Engineer | 1 | Merchant AI Phase |
| DevOps | 1 | Infrastructure |

### Infrastructure

| Resource | Purpose |
|----------|---------|
| MongoDB Atlas (M30) | Production database upgrade |
| Redis (100GB) | Cache & sessions |
| S3/Cloudinary | Document & receipt storage |
| Twilio/MSG91 | SMS for verifications |
| Sentry | Error tracking |
| Grafana | Dashboards |

---

## IMPLEMENTATION TRACKING

### Source of Truth Updates

After each feature completion, update:

1. `SOURCE-OF-TRUTH/SERVICES.md` - Service details
2. `SOURCE-OF-TRUTH/ARCHITECTURE.md` - Architecture changes
3. `SOURCE-OF-TRUTH/ECOSYSTEM.md` - App integrations
4. `SOURCE-OF-TRUTH/API-ENDPOINTS.md` - New endpoints
5. `SOURCE-OF-TRUTH/STATUS-YYYY-MM-DD.md` - Current status
6. `SOURCE-OF-TRUTH/INDEX.md` - Quick navigation

### New Repositories to Create

```
NEW REPOS:
├── rez-student-service         # Student feature orchestration
├── rez-budget-service          # Budget tracking engine
├── rez-institution-service     # Campus partnership management
├── rez-expense-service         # Corporate expense (if extracted)
├── rez-hris-connector           # HRIS integration hub
├── rez-card-service             # Corporate card management
└── rez-accounting-connector     # Tally/QuickBooks integration
```

---

## RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| HRIS API changes | Build adapter pattern, version configs |
| Payment card compliance | Partner with PCI-DSS compliant provider |
| GST API reliability | Add retry logic, offline queue |
| Student verification fraud | Combine multiple signals, random audit |
| Aggregator API rate limits | Cache aggressively, batch updates |

---

## SUCCESS METRICS

### Student
- [ ] 1000 verified students in first month
- [ ] 50 campus partnerships activated
- [ ] 20% increase in student transaction value

### Corporate
- [ ] 10 corporate clients onboarded
- [ ] 500 corporate cards issued
- [ ] 95% GST compliance rate

### Merchant
- [ ] Merchant Copilot engagement > 50%
- [ ] AdBazaar attribution accuracy > 80%
- [ ] Aggregator orders synced > 1000/day

---

**Document Version:** 1.0.0
**Last Updated:** 2026-05-02
**Next Update:** On feature completion
