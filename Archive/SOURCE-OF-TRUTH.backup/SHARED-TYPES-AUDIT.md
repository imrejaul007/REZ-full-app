# SHARED-TYPES AUDIT REPORT

**Date:** 2026-05-03
**Status:** ISSUES FOUND AND FIXED

---

## THE TWO SHARED PACKAGES

### 1. @rez/shared-types
| Item | Value |
|------|-------|
| Location | `packages/shared-types/` |
| GitHub | shared-types.git |
| Version | 2.0.0 |
| Purpose | Type definitions, Zod schemas, type guards, FSM helpers |

**Exports:**
- Entity interfaces (IUser, IOrder, IPayment, etc.)
- Zod schemas (CreateOrderSchema, WalletDebitSchema)
- Type guards (isOrderResponse, isPaymentResponse)
- FSM helpers (isValidPaymentTransition, canOrderBeCancelled)
- Branded types (OrderId, UserId, PaymentId)

### 2. @rez/shared
| Item | Value |
|------|-------|
| Location | `rez-shared/` |
| GitHub | rez-shared.git |
| Version | 2.0.0 |
| Purpose | Utilities, normalization, case conversion |

**Exports:**
- User normalization (normalizeUserResponse, normalizeUserId)
- Case conversion (camelToSnake, snakeToCamel, normalizeCase)
- Coin normalization (normalizeCoinType)
- Loyalty helpers (normalizeCashbackStatus, normalizeLoyaltyTier)

---

## BUILD STATUS

| Package | Before | After |
|---------|--------|-------|
| @rez/shared-types | FAIL (duplicate key) | PASS ✅ |
| @rez/shared | PASS | PASS ✅ |

### Fixed Issues
1. **Duplicate key in intent-qr.ts** - `offer_viewed` appeared twice
2. **Invalid type comparisons** - Simplified `getQRSourceFromIntent` function

---

## USAGE ACROSS SERVICES

### Services Importing @rez/shared-types

```
rez-app-merchant/
├── services/api/products.ts         → isProductResponse
└── utils/validation/schemas.ts     → Zod schemas

rez-app-consumer/
├── services/ordersApi.ts           → isOrderResponse, isArrayOf
└── services/paymentService.ts      → isPaymentResponse

packages/shared-types/ (self-reference)
└── src/index.ts (documentation)
```

### Services Importing @rez/shared

```
rez-app-admin/
├── @rez/shared/types/wallet.types.d.ts
├── @rez/shared/utils/userNormalization.d.ts
└── @rez/shared/utils/caseNormalization.d.ts

rez-shared/ (self-reference)
├── src/enums.ts
├── src/utils/caseNormalization.ts
├── src/utils/userNormalization.ts
└── src/types/wallet.types.ts
```

---

## ISSUES FOUND

### Issue 1: Two Separate Git Repositories ✅ FIXED
| Package | Git Repo | Issue |
|---------|----------|-------|
| @rez/shared-types | shared-types.git | None - correct |
| @rez/shared | rez-shared.git | None - correct |

### Issue 2: Version Misalignment (Potential)
Both packages are at version 2.0.0, but they're developed independently.

### Issue 3: Archives Folder
```
packages/shared-types/archives/
├── shared-types-20260425/   ← Old version (Apr 25)
└── shared-enums-20260425/   ← Old version (Apr 25)
```
**Recommendation:** Remove archives or clearly mark as deprecated.

### Issue 4: Inconsistent Import Patterns
Some files use:
- `from '@rez/shared-types'`
- `from '@rez/shared'`

But both need to be installed via npm or workspace links.

---

## HOW TO UPDATE shared-types

### When you modify shared-types:

```bash
# 1. Make changes in packages/shared-types/src/

# 2. Build
cd packages/shared-types
npm run build

# 3. Commit
git add -A
git commit -m "feat: update shared-types"
git push origin main

# 4. Publish to npm (if public)
npm run publish:npm
```

### Services importing shared-types need to:

```bash
# Either:
# 1. Update via npm
npm update @rez/shared-types

# 2. Or update workspace link
npm install @rez/shared-types@latest
```

---

## ARCHITECTURE DIAGRAM

```
@rez/shared-types (packages/shared-types/)
├── src/index.ts              → Main exports
├── src/intent-qr.ts         → QR Intent types & schemas
└── dist/                    → Compiled output
    └── index.d.ts            → Type declarations

@rez/shared (rez-shared/)
├── src/enums.ts              → Enums
├── src/types/                → Type definitions
├── src/utils/                → Normalization utilities
└── dist/                    → Compiled output
    └── index.d.ts            → Type declarations
```

---

## DEPENDENCY GRAPH

```
rez-app-merchant
├── @rez/shared-types  → schemas, guards
└── @rez/shared       → normalization

rez-app-consumer
├── @rez/shared-types  → schemas, guards
└── @rez/shared       → normalization

rez-app-admin
└── @rez/shared       → normalization
```

---

## RECOMMENDATIONS

### 1. Version Bumping
When updating shared-types, consider semantic versioning:
- **Patch** (2.0.1): Bug fixes, non-breaking
- **Minor** (2.1.0): New features, backward compatible
- **Major** (3.0.0): Breaking changes

### 2. Changelog
Add CHANGELOG.md to track changes:
```markdown
## [2.0.1] - 2026-05-03
### Fixed
- Duplicate `offer_viewed` key in QR weights
- Invalid type comparisons in getQRSourceFromIntent
```

### 3. Remove Archives
Consider removing or archiving:
- `packages/shared-types/archives/`
- `packages/shared-types/archives/shared-enums-20260425/`

### 4. Documentation
Update README with:
- Import examples
- Version history
- Migration guide

---

## CURRENT BUILD STATUS

| Package | Build | npm Published |
|---------|-------|--------------|
| @rez/shared-types | ✅ | ❓ (check) |
| @rez/shared | ✅ | ❓ (check) |

---

**Status:** AUDIT COMPLETE - FIXED
