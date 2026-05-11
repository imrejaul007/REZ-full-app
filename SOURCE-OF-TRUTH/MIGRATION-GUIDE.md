# How to Migrate Services to @rez/shared-types

This guide explains how to migrate existing services to use `@rez/shared-types` as the canonical source of truth for types, schemas, and FSM helpers.

## Step 1: Install the Package

```bash
npm install @rez/shared-types
```

For services using Zod (backend, admin, merchant):

```bash
npm install @rez/shared-types zod
```

For consumer apps (no Zod dependency):

```bash
npm install @rez/shared-types
```

## Step 2: Import Entities and Enums

Replace local interfaces with imports from the shared package:

```typescript
// BEFORE — local interface
interface IUser {
  _id: string;
  name: string;
  email: string;
}

// AFTER — import from shared-types
import type { IUser } from '@rez/shared-types';
```

Import enums for type-safe constants:

```typescript
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentGateway,
  CoinType,
  UserRole,
  VerificationStatus,
} from '@rez/shared-types';
```

### Common Entity Imports

```typescript
// User entities
import type { IUser, IUserProfile, IUserWallet, IUserVerifications } from '@rez/shared-types';

// Order entities
import type { IOrder, IOrderItem, IOrderTotals, IOrderDelivery } from '@rez/shared-types';

// Payment entities
import type { IPayment, IPaymentGatewayResponse, PaymentMetadata } from '@rez/shared-types';

// Product entities
import type { IProduct, IProductPricing, IProductInventory } from '@rez/shared-types';

// Wallet entities
import type { IWallet, ICoin, ICoinTransaction } from '@rez/shared-types';

// Merchant and Store
import type { IMerchant, IStore, IOffer } from '@rez/shared-types';
```

## Step 3: Use Zod Schemas for Validation

Replace manual validation with Zod schemas at API boundaries:

```typescript
import { CreateOrderSchema, UpdateOrderStatusSchema } from '@rez/shared-types';
import { CreatePaymentSchema } from '@rez/shared-types';
import { WalletDebitSchema, WalletCreditSchema } from '@rez/shared-types';
import { CreateProductSchema, UpdateProductSchema } from '@rez/shared-types';

// Example: Order creation endpoint
router.post('/orders', async (req, res) => {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  // parsed.data is fully typed
  const order = await createOrder(parsed.data);
  res.json(order);
});
```

### Common Schema Imports

```typescript
// Order schemas
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  OrderResponseSchema,
  OrderListResponseSchema,
  OrderItemSchema,
  OrderAddressSchema,
  OrderDeliverySchema,
} from '@rez/shared-types';

// Payment schemas
import {
  CreatePaymentSchema,
  UpdatePaymentStatusSchema,
  PaymentResponseSchema,
  PaymentGatewayResponseSchema,
} from '@rez/shared-types';

// Wallet schemas
import { WalletDebitSchema, WalletCreditSchema } from '@rez/shared-types';

// Product schemas
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductResponseSchema,
  ProductPricingSchema,
} from '@rez/shared-types';
```

## Step 4: Use Branded IDs for Type Safety

Replace string IDs with branded types for compile-time safety:

```typescript
import {
  toUserId,
  toOrderId,
  toPaymentId,
  toProductId,
  toWalletId,
  type UserId,
  type OrderId,
  type PaymentId,
  type ProductId,
  type WalletId,
} from '@rez/shared-types';

// Convert string to branded type (validates 24-hex format)
const userId: UserId = toUserId('507f1f77bcf86cd799439011');

// All branded ID types available:
// - OrderId, UserId, MerchantId, StoreId, ProductId
// - PaymentId, WalletId, CategoryId, CampaignId
// - CouponId, RefundId
```

### Example: API Controller with Branded IDs

```typescript
// BEFORE
app.get('/orders/:id', async (req, res) => {
  const orderId = req.params.id; // string
  const order = await Order.findById(orderId);
});

// AFTER
import { toOrderId, type OrderId } from '@rez/shared-types';

app.get('/orders/:id', async (req, res) => {
  const orderId: OrderId = toOrderId(req.params.id); // throws if invalid
  const order = await Order.findById(orderId);
});
```

## Step 5: Use FSM Helpers for State Transitions

Replace manual state machine checks with canonical FSM helpers:

```typescript
import {
  // Payment FSM
  isValidPaymentTransition,
  assertValidPaymentTransition,
  isTerminalPaymentStatus,
  PAYMENT_SUCCESS_STATES,

  // Order FSM
  isValidOrderTransition,
  canOrderBeCancelled,
  isTerminalOrderStatus,
  ORDER_CANCELLABLE_STATES,

  // Order Payment FSM
  isValidOrderPaymentTransition,
  mapPaymentStatusToOrderPaymentStatus,
} from '@rez/shared-types';

// Example: Payment status update
if (!isValidPaymentTransition(currentStatus, newStatus)) {
  throw new InvalidTransitionError();
}

// Example: Check if order can be cancelled
if (!canOrderBeCancelled(order.status)) {
  throw new OrderCannotBeCancelledError();
}
```

## Common Migration Patterns

### Pattern 1: Replace Local Enums with Imports

```typescript
// BEFORE
enum OrderStatus {
  Created = 'created',
  Confirmed = 'confirmed',
  // ...
}

// AFTER
import { OrderStatus } from '@rez/shared-types';
```

### Pattern 2: Replace Local Interfaces with Imports

```typescript
// BEFORE — src/types/Order.ts
export interface IOrder {
  _id: string;
  orderNumber: string;
  // 100+ lines of interface
}

// AFTER — re-export from shared-types
export type { IOrder } from '@rez/shared-types';
// OR use directly in consuming code
import type { IOrder } from '@rez/shared-types';
```

### Pattern 3: Replace Zod Schemas

```typescript
// BEFORE — local schema
const CreateOrderSchema = z.object({
  user: z.string(),
  items: z.array(z.any()),
  // ...
});

// AFTER
import { CreateOrderSchema } from '@rez/shared-types';
```

### Pattern 4: Replace State Machine Constants

```typescript
// BEFORE — local state machine
import { PAYMENT_TRANSITIONS } from '../config/financialStateMachine';

// AFTER — canonical FSM
import { PAYMENT_STATE_TRANSITIONS } from '@rez/shared-types';

// If you need the old name, create a compat shim:
export const PAYMENT_TRANSITIONS = PAYMENT_STATE_TRANSITIONS;
```

### Pattern 5: Use Runtime Guards (Consumer Apps)

For consumer apps that cannot depend on Zod:

```typescript
import {
  isOrderResponse,
  isPaymentResponse,
  isArrayOf,
  asOrderStatus,
} from '@rez/shared-types';

// Validate API responses at the boundary
const data = await fetchOrder(id);
if (!isOrderResponse(data)) {
  throw new Error('Malformed order response');
}

// Type narrowing with as* functions
const status = asOrderStatus(rawStatus);
```

## Breaking Changes to Be Aware Of

| v1 Behavior | v2 Behavior | Action Required |
|-------------|-------------|-----------------|
| `.passthrough()` on schemas | `.strict()` on requests | Extra fields now throw validation errors |
| `idempotencyKey` optional | `idempotencyKey` required (min 8 chars) | Add idempotencyKey to wallet operations |
| `selling > mrp` allowed | `selling <= mrp` enforced | Validate pricing on product create/edit |
| String ID types | Branded ID types | Use `toUserId()`, `toOrderId()` etc. |

## Services Already Migrated

Based on package configuration and usage patterns:

- **rezbackend** - Uses FSM helpers via compat shims
- **rez-payment-service** - Types re-exported from shared-types
- **rez-wallet-service** - Types re-exported from shared-types
- **rez-app-merchant** - Uses Zod schemas for product forms
- **rez-app-admin** - Uses Zod schemas for admin mutations

## Additional Resources

- [Package README](file:///Users/rejaulkarim/Documents/ReZ%20Full%20App/packages/shared-types/README.md)
- [v1 to v2 Migration Guide](file:///Users/rejaulkarim/Documents/ReZ%20Full%20App/packages/shared-types/MIGRATION.md)
- [API Reference](file:///Users/rejaulkarim/Documents/ReZ%20Full%20App/packages/shared-types/src/index.ts)

## Troubleshooting

### Type 'string' is not assignable to type 'UserId'

Use the conversion function:
```typescript
const userId = toUserId(stringFromDatabase);
```

### Zod validation failing for extra fields

Remove extra fields from input or use `.strip()` for response schemas.

### FSM transition rejected

Check valid transitions using `getValidNextOrderStates(currentStatus)`.
