# REZ VERIFY QR (Bill Upload) - COMPLETE DOCUMENTATION

**App:** ReZ Consumer
**File:** `app/bill-upload-enhanced.tsx`
**Service:** `services/billUploadService.ts`
**Types:** `types/billVerification.types.ts`
**Last Updated:** 2026-05-03

---

## WHAT IS REZ VERIFY QR?

**REZ Verify QR** (Bill Upload) allows users to:
- Upload bill/receipt photos
- Earn cashback on purchases
- Verify purchases automatically with OCR
- Track verification status

---

## HOW IT WORKS

```
┌─────────────────────────────────────────────────────────────────┐
│ REZ VERIFY QR (BILL UPLOAD) │
├─────────────────────────────────────────────────────────────────┤
│ │
│ USER SCANS BILL │
│ │
│ ┌───────────────┐ │
│ │ 1. Upload │ │ Camera or gallery │
│ └──────┬──────┘ │
│ │ │
│ ▼ │
│ ┌───────────────┐ │
│ │ 2. OCR │ │ Extract text from bill │
│ │ Processing │ │ Merchant, amount, date │
│ └──────┬──────┘ │
│ │ │
│ ▼ │
│ ┌───────────────┐ │
│ │ 3. Verify │ │ Fraud check │
│ │ Bill │ │ Image quality │
│ └──────┬──────┘ │ Amount validation │
│ │ │ Date validity │
│ ▼ │
│ ┌───────────────┐ │
│ │ 4. Match │ │ Find merchant │
│ │ Merchant │ │ Fuzzy/Exact match │
│ └──────┬──────┘ │ │
│ ▼ │
│ ┌───────────────┐ │
│ │ 5. Calculate │ │ Cashback amount │
│ │ Cashback │ │ Based on rules │
│ └──────┬──────┘ │ │
│ ▼ │
│ ┌───────────────┐ │
│ │ 6. CREDIT │ │ Add to wallet │
│ │ WALLET │ │ ReZ Coins │
│ └───────────────┘ │
│ │
└─────────────────────────────────────────────────────────────────┘
```

---

## FEATURES

### 1. Camera Capture

| Feature | Description |
|---------|-------------|
| **Camera Preview** | Live camera feed |
| **Gallery Upload** | Select from photos |
| **Flash Toggle** | Enable/disable flash |
| **Flip Camera** | Front/back camera |
| **Zoom** | Pinch to zoom |

### 2. OCR Processing

```typescript
interface OCRExtractedData {
  merchantName?: string;
  merchantAddress?: string;
  amount?: number;
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  date?: string;
  billNumber?: string;
  invoiceNumber?: string;
  gstNumber?: string;
  phoneNumber?: string;
  items?: OCRExtractedItem[];
  paymentMethod?: string;
  confidence: number; // 0-100
  rawText?: string;
  language?: string;
}
```

### 3. Bill Verification

```typescript
type BillVerificationStatus =
  | 'uploading'
  | 'ocr_processing'
  | 'ocr_completed'
  | 'user_verification'
  | 'merchant_matching'
  | 'amount_verification'
  | 'fraud_check'
  | 'cashback_calculation'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'failed';
```

### 4. Verification Checks

```typescript
interface BillVerificationResult {
  isValid: boolean;
  score: number; // 0-100
  checks: {
    imageQuality: CheckResult;
    dateValidity: CheckResult;
    amountValidity: CheckResult;
    merchantMatch: CheckResult;
    duplicateCheck: CheckResult;
    fraudIndicators: FraudIndicator[];
  };
  warnings?: string[];
  errors?: string[];
}
```

### 5. Merchant Matching

```typescript
interface MerchantMatch {
  merchantId: string;
  merchantName: string;
  logo?: string;
  matchScore: number; // 0-100
  matchMethod: 'exact' | 'fuzzy' | 'manual';
  cashbackPercentage: number;
  category?: string;
  address?: string;
  verificationRequired: boolean;
}
```

### 6. Fraud Detection

```typescript
interface FraudDetectionResult {
  isFraudulent: boolean;
  riskScore: number; // 0-100
  indicators: FraudIndicator[];
  flags: string[];
}

interface FraudIndicator {
  type: 'duplicate_bill' | 'suspicious_amount' | 'invalid_merchant' | 'old_bill' | 'blurry_image';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: Record<string, any>;
}
```

### 7. Cashback Calculation

```typescript
interface CashbackCalculation {
  totalBillAmount: number;
  cashbackPercentage: number;
  cashbackAmount: number;
  coinType: 'REZ' | 'KARMA' | 'CASH';
  calculationMethod: 'automatic' | 'manual';
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  bonusMultiplier?: number;
  expiresAt?: Date;
}
```

---

## USER FLOW

### Step 1: Upload Bill

```
┌─────────────────────┐
│ 📷 Scan / Upload Bill │
├─────────────────────┤
│                      │
│  [Camera Preview]   │
│                      │
│  ┌────────────────┐ │
│  │ Take Photo    │ │
│  └────────────────┘ │
│                      │
│  ┌────────────────┐ │
│  │ Choose Gallery │ │
│  └────────────────┘ │
└─────────────────────┘
```

### Step 2: OCR Processing

```
┌─────────────────────┐
│ 🔍 Processing...     │
├─────────────────────┤
│                      │
│  [Bill Preview]     │
│                      │
│  ████████░░ 80%    │
│                      │
│  Extracting text...  │
└─────────────────────┘
```

### Step 3: Verify Data

```
┌─────────────────────┐
│ ✓ Verify Details     │
├─────────────────────┤
│                      │
│  Merchant: Starbucks │
│  Amount: ₹450       │
│  Date: 15 Mar 2024  │
│                      │
│  [Edit if wrong]     │
│                      │
│  ┌────────────────┐ │
│  │ Confirm & Submit │ │
│  └────────────────┘ │
└─────────────────────┘
```

### Step 4: Approval Status

```
┌─────────────────────┐
│ ⏳ Verification      │
├─────────────────────┤
│                      │
│  Status: Pending    │
│                      │
│  ██████░░░░ 60%    │
│                      │
│  ☑ OCR Complete      │
│  ☑ Bill Valid       │
│  ◯ Merchant Match    │
│  ◯ Cashback Calc     │
└─────────────────────┘
```

### Step 5: Cashback Credited

```
┌─────────────────────┐
│ 🎉 Success!          │
├─────────────────────┤
│                      │
│  ₹22.50 Cashback   │
│  credited to wallet  │
│                      │
│  ┌────────────────┐ │
│  │ View Receipt    │ │
│  └────────────────┘ │
│                      │
│  ┌────────────────┐ │
│  │ Upload Another │ │
│  └────────────────┘ │
└─────────────────────┘
```

---

## VERIFICATION STATUS FLOW

```
Upload Bill
    │
    ▼
OCR Processing (ocr_processing)
    │
    ▼
OCR Completed (ocr_completed)
    │
    ▼
User Verification (user_verification)
    │
    ▼
Merchant Matching (merchant_matching)
    │
    ▼
Amount Verification (amount_verification)
    │
    ▼
Fraud Check (fraud_check)
    │
    ▼
Cashback Calculation (cashback_calculation)
    │
    ├─▶ APPROVED → Wallet Credited
    │
    └─▶ REJECTED → User Notified
```

---

## API ENDPOINTS

### Upload Bill

```bash
POST /api/bills/upload
Content-Type: multipart/form-data

{
  billImage: file,
  merchantId?: string,
  amount?: number,
  billDate?: string,
  notes?: string
}
```

### Verify OCR Data

```bash
POST /api/bills/verify
{
  billId: string,
  ocrData: OCRExtractedData,
  verificationResult: BillVerificationResult
}
```

### Get Bill Status

```bash
GET /api/bills/:id/status
```

### Get User Bills

```bash
GET /api/bills?status=approved&page=1&limit=20
```

### Manual Approval (Admin)

```bash
POST /api/bills/:id/approve
{
  approved: boolean,
  cashbackAmount?: number,
  rejectionReason?: string
}
```

---

## FRAUD INDICATORS

| Indicator | Severity | Description |
|-----------|----------|-------------|
| `duplicate_bill` | high | Same bill uploaded before |
| `suspicious_amount` | medium | Unusual amount for merchant |
| `invalid_merchant` | high | Merchant not in database |
| `old_bill` | low | Bill older than 90 days |
| `blurry_image` | medium | Low quality image |
| `tampered_image` | critical | Image appears edited |

---

## VALIDATION RULES

### Image Requirements

| Rule | Value |
|------|-------|
| Max file size | 10MB |
| Min resolution | 640x480 |
| Formats | JPEG, PNG |
| Bill must show | Amount, Date, Merchant |

### Date Requirements

| Rule | Value |
|------|-------|
| Max bill age | 90 days |
| Min bill date | Today |
| Date format | Auto-detected |

### Amount Requirements

| Rule | Value |
|------|-------|
| Min amount | ₹10 |
| Max amount | ₹1,00,000 |
| Currency | Auto-detected |

---

## CASHBACK TIERS

| Tier | Multiplier | Condition |
|------|------------|-----------|
| Bronze | 1.0x | Default |
| Silver | 1.25x | 10+ uploads |
| Gold | 1.5x | 25+ uploads, 90%+ accuracy |
| Platinum | 2.0x | 50+ uploads, 95%+ accuracy |

---

## FILES REFERENCE

### Consumer App

| File | Purpose |
|------|---------|
| `app/bill-upload-enhanced.tsx` | Main upload screen |
| `services/billUploadService.ts` | API calls |
| `types/billVerification.types.ts` | Type definitions |
| `hooks/useBillVerification.ts` | Verification hook |
| `components/bills/BillVerificationStatus.tsx` | Status component |
| `components/bills/BillPreviewModal.tsx` | Preview modal |
| `components/bills/CashbackCalculator.tsx` | Cashback calc |
| `components/bills/BillRequirements.tsx` | Requirements |
| `components/bills/ManualCorrectionForm.tsx` | Edit form |

### Backend Service

| Service | File | Purpose |
|---------|------|---------|
| `rez-finance-service` | `src/routes/bills.ts` | Bill routes |
| `rez-finance-service` | `src/services/ocrService.ts` | OCR processing |
| `rez-finance-service` | `src/services/fraudDetection.ts` | Fraud check |

---

## STATUS FLOW

| Status | Description | Next Step |
|--------|-------------|-----------|
| `uploading` | Image being uploaded | `ocr_processing` |
| `ocr_processing` | OCR extracting text | `ocr_completed` |
| `ocr_completed` | Text extracted | `user_verification` |
| `user_verification` | User confirms/edits | `merchant_matching` |
| `merchant_matching` | Finding merchant | `amount_verification` |
| `amount_verification` | Validating amount | `fraud_check` |
| `fraud_check` | Running fraud checks | `cashback_calculation` |
| `cashback_calculation` | Calculating rewards | `approved` or `rejected` |
| `approved` | Cashback credited | Done |
| `rejected` | User notified | Done |

---

## BENEFITS

### For Users

- Earn cashback on every purchase
- No need for physical coupons
- Quick OCR verification
- Track all uploaded bills

### For Platform

- Verify purchases
- Prevent fraud
- Build merchant database
- Increase engagement

### For Merchants

- Track customer purchases
- Marketing reach
- No POS integration needed

---

## STATUS

| Component | Status |
|-----------|--------|
| Bill Upload UI | ✅ Production |
| OCR Service | ✅ Production |
| Fraud Detection | ✅ Production |
| Merchant Matching | ✅ Production |
| Cashback Calculation | ✅ Production |
| Admin Approval | ✅ Production |

---

**Last Updated:** 2026-05-03
