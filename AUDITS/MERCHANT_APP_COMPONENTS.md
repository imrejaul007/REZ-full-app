# Merchant App Components Audit Report

**Date:** 2026-05-09
**Auditor:** Claude Code Architecture Audit
**Scope:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/src/components/`

---

## 1. Component Inventory

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| RevenueDashboard | `RevenueDashboard.tsx` | 684 | Active |
| QRCodeManager | `QRCodeManager.tsx` | 1089 | Active |
| OfferManager | `OfferManager.tsx` | 873 | Active |
| OfferCreator | `OfferCreator.tsx` | 720 | Active |
| OrderTracker | `OrderTracker.tsx` | 1067 | Active |

**Total Components:** 5
**Total Lines:** 4433

---

## 2. Issues Found

### 2.1 Critical Issues (Build-Breaking)

#### Issue #1: Missing Dependencies
| File | Import | Status |
|------|--------|--------|
| All Components | `../contexts/MerchantContext` | **MISSING** |
| OrderTracker.tsx | `../types/api` | **MISSING** |

**Impact:** TypeScript compilation will fail. These files do not exist in the codebase.

**Evidence:**
```typescript
// All 5 components import:
import { useMerchant } from '../contexts/MerchantContext';

// OrderTracker specifically imports:
import { Order, OrderStatus } from '../types/api';
```

#### Issue #2: Circular/Conflicting Imports
| Source | Imports From | Issue |
|--------|--------------|-------|
| `merchant.service.ts` | `./errors` | Exists and works |
| `qrCodeService.ts` | `./errors` | Exists and works |
| Components | `../services/merchant.service` | Works (types re-exported) |
| Components | `../services/qrCodeService` | Works (types re-exported) |

### 2.2 TypeScript Type Errors

#### Issue #3: Type Definitions Mismatch

**Location:** `QRCodeManager.tsx` lines 20-30

```typescript
// Component imports QRCode from qrCodeService:
import { QRCode } from '../services/qrCodeService';

// But also uses types from merchant.service:
import { getQRCodes, getQRCodeById, createQRCode, ... } from '../services/merchant.service';
```

**Problem:** `QRCode` is defined in BOTH `merchant.service.ts` and `qrCodeService.ts` with slightly different interfaces:

```typescript
// merchant.service.ts defines:
export interface QRCode {
  id: string;
  merchantId: string;
  name: string;
  type: 'table' | 'product' | 'promotional' | 'feedback' | 'loyalty';
  targetUrl: string;
  shortCode: string;
  scanCount: number;
  uniqueScans: number;
  lastScannedAt?: string;
  createdAt: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

// qrCodeService.ts defines:
export interface QRCode {
  id: string;
  merchantId: string;
  name: string;
  type: QRCodeType;
  targetUrl: string;
  shortCode: string;
  scanCount: number;
  uniqueScans: number;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt?: string;  // <-- Different: added updatedAt
  isActive: boolean;
  metadata?: Record<string, unknown>;
  qrImageUrl?: string;  // <-- Different: added qrImageUrl
}
```

**Recommendation:** Consolidate into a single `QRCode` interface.

#### Issue #4: Unused Function Import
**Location:** `QRCodeManager.tsx` line 27
```typescript
import { generateQRImage } from '../services/qrCodeService';
```
**Issue:** `generateQRImage` is imported but never used.

### 2.3 Code Quality Issues

#### Issue #5: Magic Numbers
Multiple locations use hardcoded magic numbers without constants:

| Location | Issue |
|----------|-------|
| `RevenueDashboard.tsx` line 99 | Hardcoded color `#10B981` |
| `RevenueDashboard.tsx` line 105 | Hardcoded color `#EF4444` |
| All components | Repeated color definitions |

**Recommendation:** Extract to a shared `colors.ts` constants file.

#### Issue #6: Repetitive Styles
Each component defines its own styles for common patterns:
- `loadingContainer` - duplicated in all 5 components
- `emptyState` - duplicated in all 5 components
- `modalOverlay` - duplicated in 4 components
- `statCard` - duplicated in 4 components

**Recommendation:** Extract to shared `commonStyles.ts` or create a `SharedComponents` library.

#### Issue #7: Missing Keyboard Handling
**Location:** `OfferCreator.tsx`
```typescript
<ScrollView
  style={styles.scrollView}
  contentContainerStyle={styles.scrollContent}
  showsVerticalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"  // Good!
/>
```
This is correctly implemented, but other components (RevenueDashboard, QRCodeManager, OfferManager) do NOT have `keyboardShouldPersistTaps="handled"`.

#### Issue #8: Console.error Usage
**Locations:**
- `RevenueDashboard.tsx` line 61
- `QRCodeManager.tsx` lines 77, 98
- `OfferManager.tsx` line 71
- `OrderTracker.tsx` line 209

**Issue:** Using `console.error()` instead of centralized telemetry/logger.

**Per CLAUDE.md Governance Rules:**
> **No Console Logs:** Logging must use `rez-shared/telemetry` logger

#### Issue #9: Math.random() for ID Generation
**Location:** `merchant.service.ts` lines 1367-1374
```typescript
function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));  // <-- VIOLATION
  }
  return result;
}
```

**Per CLAUDE.md Governance Rules:**
> **No Math.random() for IDs:** Use `uuid` or `crypto.randomUUID()` instead

#### Issue #10: Mock Data Mixed with Real Code
**Location:** `OrderTracker.tsx` lines 42-191
- MOCK_ORDERS array is 150 lines of mock data
- No indicator that these are mock/fixture data
- Should be in separate `__fixtures__` or `__mocks__` directory

---

## 3. Missing Components

Based on the codebase analysis, the following reusable components are **MISSING** and should be created:

### 3.1 Required Missing Components

| Component | Purpose | Priority |
|-----------|---------|----------|
| `MerchantContext` | Global merchant state provider | **Critical** |
| `types/api.ts` | Order, OrderStatus types | **Critical** |
| `LoadingSpinner` | Reusable loading indicator | High |
| `EmptyState` | Reusable empty state view | High |
| `StatCard` | Currently defined inline | Medium |
| `FilterPills` | Reusable filter component | Medium |
| `Badge` | Status/target audience badge | Medium |
| `ModalContainer` | Standard modal wrapper | Medium |
| `SearchInput` | Reusable search field | Medium |

### 3.2 Architecture Issues

**Current State:**
```
components/
  index.ts        --> Exports 5 components
  RevenueDashboard.tsx   (684 lines)
  QRCodeManager.tsx      (1089 lines)
  OfferManager.tsx       (873 lines)
  OfferCreator.tsx       (720 lines)
  OrderTracker.tsx       (1067 lines)
```

**Problem:** Components are 600-1100 lines each. Per CLAUDE.md:
> **Keep files under 500 lines**

**Recommended Structure:**
```
components/
  common/
    LoadingSpinner.tsx
    EmptyState.tsx
    Badge.tsx
    Button.tsx
    Card.tsx
    Modal.tsx
  dashboard/
    RevenueDashboard.tsx
    StatCard.tsx
    HealthScoreCard.tsx
    RevenueChart.tsx
  qr-codes/
    QRCodeManager.tsx
    QRCodeCard.tsx
    QRCodeDetailModal.tsx
    CreateQRModal.tsx
  offers/
    OfferManager.tsx
    OfferCard.tsx
    OfferDetailModal.tsx
    OfferCreator.tsx
  orders/
    OrderTracker.tsx
    OrderCard.tsx
    OrderDetailModal.tsx
    ProgressTracker.tsx
  index.ts
```

---

## 4. Type Errors Summary

| Error Type | Count | Severity |
|------------|-------|----------|
| Missing import files | 2 | Critical |
| Duplicate type definitions | 2 interfaces | High |
| Unused imports | 1 | Medium |
| Magic numbers/strings | 50+ | Medium |
| Missing keyboard handlers | 3 | Low |
| Console.error usage | 5 | Medium |

---

## 5. Dependencies Analysis

### 5.1 Service Dependencies

```
Components
    |
    +-- MerchantContext (MISSING)
    |
    +-- merchant.service.ts
    |       |
    |       +-- errors.ts (EXISTS)
    |
    +-- qrCodeService.ts
            |
            +-- errors.ts (EXISTS)
```

### 5.2 External Dependencies Used
| Package | Usage |
|---------|-------|
| react-native | Core framework |
| @react-navigation/* | Navigation |
| @shopify/flash-list | List optimization |
| react-native-reanimated | Animations |
| expo-* | Native modules |
| zustand | State management |

---

## 6. Recommendations

### Immediate Actions (Critical)
1. Create `src/contexts/MerchantContext.tsx` with merchant state
2. Create `src/types/api.ts` with `Order` and `OrderStatus` types
3. Consolidate `QRCode` interface into single location

### Short-term Actions (High Priority)
4. Extract common styles to shared module
5. Replace `Math.random()` with `uuid` in `merchant.service.ts`
6. Replace `console.error` with `@rez/shared/telemetry` logger

### Medium-term Actions
7. Break down large components (>500 lines) into smaller sub-components
8. Create reusable UI component library
9. Move mock data to `__fixtures__` directory
10. Add `keyboardShouldPersistTaps` to all ScrollViews with inputs

---

## 7. Files to Create/Modify

### Create:
- `/src/contexts/MerchantContext.tsx`
- `/src/types/api.ts`
- `/src/components/common/LoadingSpinner.tsx`
- `/src/components/common/EmptyState.tsx`
- `/src/constants/colors.ts`
- `/src/styles/common.ts`

### Modify:
- `/src/components/QRCodeManager.tsx` - remove unused import
- `/src/services/merchant.service.ts` - replace Math.random()
- All components - replace console.error

---

**End of Report**
