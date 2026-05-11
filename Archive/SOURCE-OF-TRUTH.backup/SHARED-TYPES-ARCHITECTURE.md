# SHARED-TYPES ARCHITECTURE

**Last Updated:** 2026-05-03

---

## OVERVIEW

`@rez/shared-types` is the canonical package for all shared TypeScript types, Zod schemas, and type guards in the Rez ecosystem.

**Location:** `/Users/rejaulkarim/Documents/ReZ Full App/packages/shared-types/`
**GitHub:** https://github.com/imrejaul007/shared-types
**npm:** `@rez/shared-types`
**Version:** 2.0.0

---

## EXPORTS

### From `packages/shared-types/src/index.ts`

```typescript
// Entity Types
import type { IUser, IOrder, IPayment, IWallet } from '@rez/shared-types';

// Zod Schemas
import { OrderStatus, CreateOrderSchema, WalletDebitSchema } from '@rez/shared-types';

// FSM Helpers
import { isValidPaymentTransition, canOrderBeCancelled } from '@rez/shared-types';

// Branded IDs
import { toOrderId, type OrderId } from '@rez/shared-types';

// Runtime Guards
import { isOrderResponse, asPaymentStatus } from '@rez/shared-types';

// Enums
import { USER_ROLES, LOYALTY_TIERS, TRANSACTION_TYPES } from '@rez/shared-types';
```

---

## WHAT'S IN shared-types

### 1. Entity Interfaces
- `IUser` - User entity
- `IOrder` - Order entity
- `IPayment` - Payment entity
- `IWallet` - Wallet entity
- `IMerchant` - Merchant entity
- `IStore` - Store entity
- `IProduct` - Product entity

### 2. Zod Schemas
- `CreateOrderSchema` - Order creation validation
- `WalletDebitSchema` - Wallet debit validation
- `UserSchema` - User validation
- `PaymentSchema` - Payment validation

### 3. FSM Helpers
- `isValidPaymentTransition()` - Validate payment state transitions
- `canOrderBeCancelled()` - Check if order can be cancelled
- `canOrderBeRefunded()` - Check if order can be refunded

### 4. Branded Types
```typescript
type OrderId = string & { __brand: 'OrderId' };
type UserId = string & { __brand: 'UserId' };
type PaymentId = string & { __brand: 'PaymentId' };

// Conversion
const orderId = toOrderId('order_123'); // OrderId
```

### 5. Type Guards
- `isOrderResponse()`
- `isPaymentResponse()`
- `isUserResponse()`
- `asPaymentStatus()`

### 6. Enums
```typescript
enum USER_ROLES { ADMIN, MERCHANT, USER }
enum LOYALTY_TIERS { BRONZE, SILVER, GOLD, PLATINUM }
enum TRANSACTION_TYPES { EARN, REDEEM, BONUS, REFUND }
```

---

## SERVICES USING @rez/shared-types

### rez-app-merchant
```typescript
// services/api/products.ts
import { isProductResponse } from '@rez/shared-types';

// utils/validation/schemas.ts
import { CreateOrderSchema, WalletDebitSchema } from '@rez/shared-types';
```

### rez-app-consumer
```typescript
// services/ordersApi.ts
import { isOrderResponse, isArrayOf } from '@rez/shared-types';

// services/paymentService.ts
import { isPaymentResponse } from '@rez/shared-types';
```

### packages/shared-types (self-reference)
```typescript
// src/index.ts - Comments show how to import
import type { IOrder, IUser } from '@rez/shared-types';
import { OrderStatus, CoinType } from '@rez/shared-types';
```

---

## BUILDING & PUBLISHING

### Build
```bash
cd packages/shared-types
npm run build
```

### Publish to npm
```bash
npm run publish:npm
```

### Version
Current: `2.0.0`

---

## MIGRATION

See `MIGRATION.md` for upgrading from v1 to v2.

---

## ARCHITECTURE NOTE

There are TWO shared packages:
1. `@rez/shared-types` - Types, schemas, guards
2. `@rez/shared` - Utilities, components (in rez-web-menu/rez-shared)

---

**Status:** DOCUMENTED
