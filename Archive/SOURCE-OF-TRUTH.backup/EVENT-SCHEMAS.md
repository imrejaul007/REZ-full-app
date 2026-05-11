# REZ Event Platform - Canonical Event Schemas

**Document Version:** 1.0.0
**Last Updated:** 2026-05-01
**Schema Registry:** `/SOURCE-OF-TRUTH/EVENT-SCHEMAS.md`

---

## Table of Contents

1. [Schema Conventions](#schema-conventions)
2. [Event Schemas](#event-schemas)
   - [inventory.low](#1-inventorylow)
   - [order.completed](#2-ordercompleted)
   - [payment.success](#3-paymentsuccess)
3. [Validation Rules](#validation-rules)
4. [Version History](#version-history)
5. [Migration Guide](#migration-guide)

---

## Schema Conventions

All REZ events follow these conventions:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | `string` | Yes | Event name in `domain.action` format |
| `version` | `string` | Yes | Semantic version (e.g., `v1`, `v2`) |
| `correlation_id` | `string` | Yes | UUID v4 for tracing across services |
| `source` | `string` | Yes | Originating service name |
| `timestamp` | `number` | Yes | Unix timestamp in milliseconds |
| `data` | `object` | Yes | Event-specific payload |

### Naming Standards

- Event names: `lowercase.domain.action` (e.g., `inventory.low`, `order.completed`)
- Versions: `v{major}` (e.g., `v1`, `v2`)
- Service names: `kebab-case` (e.g., `inventory-service`, `payment-gateway`)

---

## Event Schemas

### 1. inventory.low

Fired when an item's stock falls below its configured threshold.

#### Zod Schema

```typescript
import { z } from 'zod';

export const InventoryLowSchema = z.object({
  event: z.literal('inventory.low'),
  version: z.literal('v1'),
  correlation_id: z.string().uuid(),
  source: z.string().min(1).max(100),
  timestamp: z.number().int().positive(),
  data: z.object({
    merchant_id: z.string().uuid(),
    store_id: z.string().uuid(),
    item_id: z.string().uuid(),
    item_name: z.string().min(1).max(255),
    current_stock: z.number().int().min(0),
    threshold: z.number().int().positive(),
    unit: z.string().min(1).max(50),
    supplier_id: z.string().uuid().optional(),
  }),
});

export type InventoryLowEvent = z.infer<typeof InventoryLowSchema>;
```

#### JSON Example

```json
{
  "event": "inventory.low",
  "version": "v1",
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "inventory-service",
  "timestamp": 1746057600000,
  "data": {
    "merchant_id": "123e4567-e89b-12d3-a456-426614174000",
    "store_id": "789e0123-e45b-67d8-a901-234567890123",
    "item_id": "abc12345-6789-0def-a123-456789abcdef",
    "item_name": "Organic Coffee Beans 500g",
    "current_stock": 5,
    "threshold": 10,
    "unit": "units",
    "supplier_id": "sup-456-789-abc-def"
  }
}
```

#### Business Rules

- `current_stock` must be less than `threshold` when event is emitted
- `unit` should match catalog unit (e.g., `units`, `kg`, `liters`)
- `supplier_id` should be populated when supplier linkage exists

---

### 2. order.completed

Fired when an order is successfully completed and payment confirmed.

#### Zod Schema

```typescript
import { z } from 'zod';

const OrderItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

export const OrderCompletedSchema = z.object({
  event: z.literal('order.completed'),
  version: z.literal('v1'),
  correlation_id: z.string().uuid(),
  source: z.string().min(1).max(100),
  timestamp: z.number().int().positive(),
  data: z.object({
    order_id: z.string().uuid(),
    merchant_id: z.string().uuid(),
    user_id: z.string().uuid(),
    total_amount: z.number().min(0),
    coin_discount: z.number().min(0),
    items: z.array(OrderItemSchema).min(1),
    payment_method: z.enum(['cash', 'card', 'digital_wallet', 'crypto', 'coin_balance']),
    coins_earned: z.number().int().min(0),
  }),
});

export type OrderCompletedEvent = z.infer<typeof OrderCompletedSchema>;
```

#### JSON Example

```json
{
  "event": "order.completed",
  "version": "v1",
  "correlation_id": "661f9511-f30c-52e5-b827-557765441111",
  "source": "order-service",
  "timestamp": 1746057700000,
  "data": {
    "order_id": "ord-987654321-abcdef",
    "merchant_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "usr-111222333-444555",
    "total_amount": 89.99,
    "coin_discount": 10.00,
    "items": [
      {
        "item_id": "item-aaa-bbb-ccc-ddd",
        "quantity": 2,
        "price": 29.99
      },
      {
        "item_id": "item-eee-fff-ggg-hhh",
        "quantity": 1,
        "price": 30.01
      }
    ],
    "payment_method": "digital_wallet",
    "coins_earned": 899
  }
}
```

#### Business Rules

- `total_amount` must equal sum of (`item.quantity` x `item.price`)
- `total_amount` minus `coin_discount` equals actual payment amount
- `coins_earned` should be calculated as floor(`total_amount` * 10) unless promotional rules apply
- `payment_method` must be a valid enum value

---

### 3. payment.success

Fired when a payment transaction is successfully processed.

#### Zod Schema

```typescript
import { z } from 'zod';

export const PaymentSuccessSchema = z.object({
  event: z.literal('payment.success'),
  version: z.literal('v1'),
  correlation_id: z.string().uuid(),
  source: z.string().min(1).max(100),
  timestamp: z.number().int().positive(),
  data: z.object({
    payment_id: z.string().min(1).max(100),
    order_id: z.string().uuid(),
    merchant_id: z.string().uuid(),
    amount: z.number().positive(),
    method: z.enum(['cash', 'card', 'digital_wallet', 'crypto', 'coin_balance']),
    gateway: z.string().min(1).max(100),
    gateway_transaction_id: z.string().min(1).max(255),
    coins_credited: z.number().int().min(0),
    cashback_amount: z.number().min(0),
  }),
});

export type PaymentSuccessEvent = z.infer<typeof PaymentSuccessSchema>;
```

#### JSON Example

```json
{
  "event": "payment.success",
  "version": "v1",
  "correlation_id": "772a0622-41d7-63f6-c938-668876552222",
  "source": "payment-gateway",
  "timestamp": 1746057750000,
  "data": {
    "payment_id": "pay_172a3456b789c012d",
    "order_id": "ord-987654321-abcdef",
    "merchant_id": "123e4567-e89b-12d3-a456-426614174000",
    "amount": 79.99,
    "method": "digital_wallet",
    "gateway": "stripe",
    "gateway_transaction_id": "txn_3MqL9k2eZvKYlo2C1234ABCD",
    "coins_credited": 799,
    "cashback_amount": 2.40
  }
}
```

#### Business Rules

- `gateway_transaction_id` must be unique across the gateway
- `amount` should match order's payment amount after discounts
- `coins_credited` may include signup bonuses or promotional credits
- `cashback_amount` applies only to cashback-eligible payment methods

---

## Validation Rules

### Global Validators

```typescript
import { z } from 'zod';

// Base event header schema
const EventHeaderSchema = z.object({
  event: z.string().regex(/^[a-z]+\.[a-z]+$/, 'Format: domain.action'),
  version: z.string().regex(/^v\d+$/, 'Format: v1, v2, etc.'),
  correlation_id: z.string().uuid('Must be valid UUID v4'),
  source: z.string().min(1).max(100),
  timestamp: z.number().int().positive('Must be positive Unix ms'),
});

// Validation utility
export function validateEvent<T extends z.ZodType>(
  schema: T,
  payload: unknown
): z.infer<T> {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );
    throw new EventValidationError('Event validation failed', errors);
  }

  return result.data;
}

export class EventValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(message);
    this.name = 'EventValidationError';
  }
}
```

### Cross-Event Validation

| Rule | Description |
|------|-------------|
| Timestamp Precision | All timestamps must be in milliseconds (Unix epoch) |
| UUID Versions | Use UUID v4 for all ID fields |
| Amount Precision | Currency amounts support up to 2 decimal places |
| Array Safety | Empty arrays must be explicitly allowed or rejected |

### Validation in Different Environments

```typescript
// Development: Log warnings but don't throw
// Production: Throw on validation failure
// Test: Mock validation for deterministic testing

export const validationConfig = {
  development: { throwOnError: false, logLevel: 'warn' },
  production: { throwOnError: true, logLevel: 'error' },
  test: { throwOnError: false, logLevel: 'silent' },
};
```

---

## Version History

### Changelog Template

```markdown
## [Version] - YYYY-MM-DD

### Added
- New field or event

### Changed
- Modified field constraints or types

### Deprecated
- Fields scheduled for removal

### Removed
- Removed fields or event versions

### Fixed
- Bug corrections

### Security
- Security-related changes
```

### Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v1.0.0 | 2026-05-01 | Platform Team | Initial schema definitions |

---

## Migration Guide

### Adding New Fields

1. Add field to schema with `.optional()` or `.nullable()`
2. Add to JSON examples with realistic values
3. Document in changelog under "Added"
4. Update version if breaking changes occur

```typescript
// Before (v1)
data: z.object({
  merchant_id: z.string().uuid(),
  // ...
})

// After (v2)
data: z.object({
  merchant_id: z.string().uuid(),
  branch_id: z.string().uuid().optional(),  // New field
  // ...
})
```

### Updating Field Types

1. Create new schema version (e.g., `v1` -> `v2`)
2. Use Zod union for gradual migration:

```typescript
// Migration pattern
export const PaymentSuccessSchemaV2 = z.object({
  // ... existing fields
  data: z.object({
    // ... existing fields
    amount: z.union([
      z.number(),           // Old format
      z.string(),          // New format (e.g., "79.99 USD")
    ]),
  }),
});
```

### Deprecating Events

1. Mark as deprecated in documentation
2. Add deprecation notice to schema comments
3. Set version to deprecated status
4. Maintain schema for backward compatibility

```typescript
/**
 * @deprecated Since v2. Use `inventory.critical` instead.
 * Will be removed in v4 (2027-01-01).
 */
export const InventoryLowSchemaV1 = z.object({ ... });
```

### Consumer Migration Checklist

- [ ] Update Zod schema dependency to latest version
- [ ] Run schema validation against existing consumers
- [ ] Update event handlers for new/changed fields
- [ ] Add field-level logging for new fields
- [ ] Update integration tests with new payloads
- [ ] Notify downstream services of breaking changes

### Version Compatibility Matrix

| Consumer Version | Producer v1 | Producer v2 | Producer v3 |
|-----------------|-------------|-------------|-------------|
| Consumer v1 | Full | Partial | Partial |
| Consumer v2 | Full | Full | Partial |
| Consumer v3 | Full | Full | Full |

---

## Appendix

### Schema Registry Location

All canonical schemas are stored in:
```
/SOURCE-OF-TRUTH/EVENT-SCHEMAS.md
```

### Related Documents

- [Event Naming Conventions](./EVENT-NAMING.md)
- [Schema Validation Library](./lib/schemas/)
- [Event Testing Guide](./TESTING.md)

### Contact

For schema requests or questions:
- **Team:** Platform Engineering
- **Slack:** #event-platform
- **RFC Process:** See [RFC-001](../rfcs/rfc-001-schema-evolution.md)
