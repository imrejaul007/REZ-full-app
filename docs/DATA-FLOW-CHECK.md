# ReZ Ecosystem - API Consistency and Data Flow Check Report

**Date:** 2026-05-03
**Status:** AUDIT COMPLETE

---

## Executive Summary

The ReZ ecosystem is a distributed microservices architecture with 30+ services. This audit identified several critical consistency issues that need immediate attention, as well as areas of good practice.

### Critical Issues Found

1. **Duplicate Enum Definitions** - Enums are defined in 10+ locations, causing drift risk
2. **Port Mismatch** - Service port assignments are inconsistent between code and docker-compose
3. **Shared Types Not Imported** - Core services have local type definitions instead of importing from `@rez/shared-types`

### Good Practices Found

1. **Consistent API Response Format** - All services use the same `SuccessResponse`/`ErrorResponse` pattern
2. **Event Bus Consistency** - All event buses use the same `ReZEvent` interface and stream name
3. **Centralized Error Handling** - Shared error response utilities in each service

---

## 1. Shared Types Usage

### Finding: NOT USING CANONICAL SHARED TYPES

**Severity:** HIGH

Services are NOT importing from `@rez/shared-types` package. Instead, they define local types that duplicate canonical definitions.

#### Evidence

| Service | Imports `@rez/shared-types`? | Has Local Types? |
|---------|----------------------------|------------------|
| rez-auth-service | NO | YES (AuthServiceUser) |
| rez-order-service | NO | YES (IOrder, IOrderFields) |
| rez-payment-service | NO | YES (IPayment) |
| rez-wallet-service | NO | YES (IWallet, ICoinTransaction) |

#### Affected Files

- `/rez-auth-service/src/types/user.types.ts` - Defines `AuthServiceUser`
- `/rez-order-service/src/models/Order.ts` - Defines `IOrder`, `IOrderFields`
- `/rez-payment-service/src/models/Payment.ts` - Defines `IPayment`
- `/rez-wallet-service/src/models/Wallet.ts` - Defines wallet types

#### Root Cause

Services reference canonical types in comments but do not actually import them:

```typescript
// Example from rez-order-service/src/models/Order.ts
/**
 * Canonical reference: @rez/shared-types/entities/order
 * OrderStatus enum: placed, confirmed, preparing...
 */
export interface IOrderFields {
  status: 'placed' | 'confirmed' | 'preparing' | ...;  // Local duplicate
}
```

#### Impact

- Type drift between services
- Runtime errors when enum values don't match
- Maintenance burden of keeping duplicates in sync

#### Recommendation

**Migrate services to import from `@rez/shared-types`:**

```typescript
// After migration
import type { IOrder } from '@rez/shared-types';
import { OrderStatus } from '@rez/shared-types';
```

---

## 2. Enum Consistency

### Finding: DUPLICATE ENUM DEFINITIONS ACROSS 10+ LOCATIONS

**Severity:** HIGH

Enums are duplicated in multiple packages, leading to drift risk.

#### Locations with Duplicate Enums

| Package | OrderStatus | PaymentStatus | PaymentMethod |
|---------|-----------|--------------|---------------|
| `packages/shared-types` | YES | YES | YES |
| `packages/rez-shared/enums` | YES | YES | YES |
| `rez-shared/src/enums` | YES | YES | YES |
| `rez-app-consumer/types/enums` | YES | YES | YES |
| `rez-app-admin/@rez/shared/enums` | YES | YES | YES |
| `rezbackend/@rez/shared-types/enums` | YES | YES | YES |
| `src/enums` | YES | YES | YES |
| `archives/shared-types-20260425` | YES | YES | YES |

#### Value Inconsistencies Found

**1. CoinType enum order differs:**

```typescript
// packages/shared-types/src/enums/wallet.ts
export enum CoinType {
  PROMO = 'promo',
  BRANDED = 'branded',
  PRIVE = 'prive',
  CASHBACK = 'cashback',
  REFERRAL = 'referral',
  REZ = 'rez',
}

// rez-app-consumer/types/enums/index.ts
export enum CoinType {
  REZ = 'rez',
  PROMO = 'promo',
  BRANDED = 'branded',
  PRIVE = 'prive',
  CASHBACK = 'cashback',
  REFERRAL = 'referral',
}
```

**2. LoyaltyTier missing DIAMOND in consumer app:**

```typescript
// packages/shared-types - Has DIAMOND
export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',  // Present
}

// rez-app-consumer - Missing DIAMOND
export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',  // Missing DIAMOND
}
```

#### Impact

- Enum comparison failures between services
- Incorrect tier logic in consumer app
- Coin priority ordering issues

#### Recommendation

1. Consolidate all enum definitions to `@rez/shared-types`
2. Remove all duplicate enum files from other packages
3. Update all imports to use canonical source
4. Add arch-fitness test to prevent future duplicates

---

## 3. API Response Format

### Finding: CONSISTENT RESPONSE FORMAT

**Severity:** GOOD (No action needed)

All services use the same response format pattern.

#### Standard Response Interfaces

```typescript
// All services define this consistently
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
}
```

#### Files Implementing Standard Format

| Service | File |
|---------|------|
| rez-order-service | `src/utils/errorResponse.ts` |
| rez-payment-service | `src/utils/errorResponse.ts` |
| rez-wallet-service | `src/utils/errorResponse.ts` |

#### Minor Issue: Copy-paste header error

The wallet service errorResponse.ts file has an incorrect header comment:

```typescript
// Header says "rez-payment-service" but file is in wallet service
/**
 * Standardized error response utilities for rez-payment-service.
 */
```

---

## 4. Service Ports

### Finding: PORT MISMATCH BETWEEN CODE AND DOCKER-COMPOSE

**Severity:** MEDIUM

There are inconsistencies between service port assignments.

#### Port Assignments

| Service | docker-compose.yml | Code Default |
|---------|-------------------|--------------|
| rez-auth-service | 4002 | 4002 |
| rez-merchant-service | 4005 | N/A |
| rez-order-service | 3006 | 3006 |
| rez-payment-service | **4006** (comment) | **4001** |
| rez-wallet-service | **4001** (comment) | **4004** |

#### Issue Details

**docker-compose.yml comments state:**
```
#   REZ Wallet:          4001
#   REZ Payment:         4006
```

**Code defaults:**
```typescript
// rez-payment-service/src/index.ts
const port = parseInt(process.env.PORT || '4001', 10);

// rez-wallet-service/src/index.ts
const PORT = parseInt(process.env.PORT || '4004', 10);
```

**rez-now frontend expects:**
```yaml
REZ_WALLET_SERVICE_URL: http://localhost:4001
```

This means the frontend is pointing to payment service port (4001) instead of wallet service port (4004).

#### Impact

- Service discovery failures in local development
- Wrong service receiving requests in Docker environments

#### Recommendation

1. Standardize port assignments:
   - Auth: 4002
   - Payment: 4001
   - Wallet: 4004
   - Merchant: 4005
   - Order: 3006
2. Update docker-compose.yml comments to match code defaults
3. Update REZ_WALLET_SERVICE_URL in rez-now to port 4004

---

## 5. Environment Variables

### Finding: INCONSISTENT SERVICE URL NAMING

**Severity:** MEDIUM

Services use different environment variable names for inter-service communication.

#### Service URL Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `REZ_AUTH_SERVICE_URL` | order, payment, wallet | Auth service endpoint |
| `WALLET_SERVICE_URL` | payment | Wallet service endpoint |
| `REZ_PAYMENT_SERVICE_URL` | wallet | Payment service endpoint |
| `REZ_MERCHANT_SERVICE_URL` | payment, wallet, now | Merchant service endpoint |
| `MARKETING_SERVICE_URL` | order | Marketing service endpoint |
| `ADS_SERVICE_URL` | order | Ads service endpoint |

#### Issues

1. **Inconsistent prefixes**: Some use `REZ_` prefix, others don't
2. **Different naming patterns**: `WALLET_SERVICE_URL` vs `REZ_PAYMENT_SERVICE_URL`

#### Impact

- Confusion when configuring services
- Potential for typos in environment variable names

#### Recommendation

Standardize to `REZ_<SERVICE>_SERVICE_URL` pattern:

```
REZ_AUTH_SERVICE_URL
REZ_PAYMENT_SERVICE_URL
REZ_WALLET_SERVICE_URL
REZ_MERCHANT_SERVICE_URL
REZ_ORDER_SERVICE_URL
```

---

## 6. Data Flow

### Finding: CONSISTENT EVENT BUS PATTERN

**Severity:** GOOD (No action needed)

All services use the same event bus implementation pattern.

#### Event Bus Interface

```typescript
export interface ReZEvent {
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  correlationId?: string;
}
```

#### Event Stream

All services publish to: `rez:events` (configurable via `EVENT_STREAM_NAME`)

#### Implemented Event Buses

| Service | File | Events Published |
|---------|------|-----------------|
| rez-order-service | `eventBus.ts` | order.created, order.updated, order.cancelled, order.completed, order.status_changed |
| rez-wallet-service | `eventBus.ts` | wallet.debited, wallet.credited, wallet.balance_updated, wallet.created, wallet.transfer_completed |

#### Event Consumers

| Service | Consumer File |
|---------|--------------|
| rez-payment-service | `worker/walletCreditWorker.ts` |
| rez-payment-service | `worker/intentGraphConsumer.ts` |

---

## 7. Database Schemas

### Finding: LOOSE SCHEMA FOR MONOLITH COMPATIBILITY

**Severity:** INFORMATIONAL

Order service uses `strict: false` for MongoDB schema compatibility with monolith.

#### Example from rez-order-service

```typescript
// Required for monolith compatibility
const OrderSchema = new Schema({}, { strict: false, collection: 'orders', timestamps: true });
```

#### Impact

- Flexible reads from legacy collection
- No compile-time validation of document structure
- Risk of silently ignoring field mismatches

---

## 8. Authentication Flow

### Finding: JWT-BASED AUTH WITH SERVICE-TO-SERVICE TOKENS

**Severity:** GOOD with minor improvements needed

Services use consistent authentication patterns.

#### Auth Methods

1. **User JWT**: `JWT_SECRET` - User authentication
2. **Merchant JWT**: `JWT_MERCHANT_SECRET` - Merchant-specific auth
3. **Admin JWT**: `JWT_ADMIN_SECRET` - Admin operations
4. **Internal Service Token**: `INTERNAL_SERVICE_TOKEN` - Service-to-service

#### Consistency Check

| Service | Uses JWT Auth | Uses Internal Token |
|---------|--------------|---------------------|
| rez-auth-service | YES | YES |
| rez-order-service | YES | YES |
| rez-payment-service | YES | YES |
| rez-wallet-service | YES | YES |

---

## Summary of Issues and Recommendations

### Critical (Fix Immediately)

1. **Duplicate Enums** - Consolidate to `@rez/shared-types`
2. **Shared Types Not Used** - Migrate services to import from canonical source

### High Priority

3. **Port Mismatch** - Fix wallet/payment port assignments
4. **Service URL Naming** - Standardize environment variable names

### Medium Priority

5. **Copy-Paste Header Errors** - Fix file header comments

### No Action Needed

- API response format consistency (GOOD)
- Event bus pattern consistency (GOOD)
- Authentication flow consistency (GOOD)

---

## Next Steps

1. **Week 1**: Create enum migration script to consolidate all enums
2. **Week 2**: Update services to import from `@rez/shared-types`
3. **Week 3**: Fix port assignments in code and docker-compose
4. **Week 4**: Standardize service URL environment variable names
5. **Ongoing**: Run arch-fitness tests to prevent future drift

---

## Appendix: File Locations

### Canonical Type Definitions
- `/packages/shared-types/src/entities/` - Entity interfaces
- `/packages/shared-types/src/enums/` - Enum definitions
- `/packages/shared-types/src/schemas/` - Zod schemas

### Service Models (Duplicates)
- `/rez-auth-service/src/types/user.types.ts`
- `/rez-order-service/src/models/Order.ts`
- `/rez-payment-service/src/models/Payment.ts`
- `/rez-wallet-service/src/models/Wallet.ts`

### Response Utilities
- `/rez-order-service/src/utils/errorResponse.ts`
- `/rez-payment-service/src/utils/errorResponse.ts`
- `/rez-wallet-service/src/utils/errorResponse.ts`

### Event Buses
- `/rez-order-service/src/eventBus.ts`
- `/rez-wallet-service/src/eventBus.ts`
