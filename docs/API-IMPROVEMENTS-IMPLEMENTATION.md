# API Improvements Implementation Guide

## What's Already Built

### 1. Shared Package (`packages/rez-shared`)
- Rate limiting middleware
- OpenAPI template
- Health checks
- Audit logging
- Tracing middleware

### 2. Shared Types (`packages/shared-types`)
- Validation middleware (validateBody, validateQuery, validateParams)
- Common schemas (pagination, objectId, dateRange, search)
- Finance schemas
- User schemas
- Payment schemas
- Order schemas

### 3. Response Format (Existing)
- Success/error envelope format already in use
- `success: boolean` + `data` or `error`

## What to Add

### Phase 1: Response Helpers
File: `packages/shared/src/api/response.ts`

Create standard response helpers:
```typescript
export function success<T>(data: T, meta?: PaginationMeta): ApiResponse<T>
export function err(code: string, message: string, details?: unknown): ApiErrorResponse
export function paginate<T>(data: T[], total: number, page: number, limit: number): ApiResponse<T[]>
```

### Phase 2: Validation Schemas
File: `packages/shared-types/src/validation/finance.ts`

Create finance-specific schemas:
```typescript
export const applyLoanSchema = z.object({...})
export const checkCreditScoreSchema = z.object({...})
export const bnplEligibilitySchema = z.object({...})
```

### Phase 3: Error Codes
File: `packages/shared/src/api/errors.ts`

Create standardized error codes:
```typescript
export const ErrorCodes = {
  AUTH_001: { code: 'AUTH_001', message: 'Invalid credentials' },
  VAL_001: { code: 'VAL_001', message: 'Invalid input' },
  // ...
}
```

## Migration Steps

### Step 1: Update Finance Service
1. Add `import { success, err, ErrorCodes } from '@rez/shared/api'`
2. Replace inline error messages with `err('CODE', details)`
3. Replace `{ success: true, data }` with `success(data)`

### Step 2: Update Other Services
1. Auth Service
2. Wallet Service
3. Payment Service
4. Merchant Service

### Step 3: Add Zod Validation
1. Import schemas from shared-types
2. Add `validateBody()` middleware to routes
3. Test validation

### Step 4: Add OpenAPI
1. Use existing `openApiSpec` template
2. Add JSDoc comments to routes
3. Generate Swagger UI

## Files to Modify

| Service | Files | Changes |
|---------|-------|---------|
| rez-finance-service | All route files | Add imports, update responses |
| rez-auth-service | All route files | Add imports, update responses |
| rez-wallet-service | All route files | Add imports, update responses |
| rez-payment-service | All route files | Add imports, update responses |
| rez-merchant-service | All route files | Add imports, update responses |

## Testing Checklist

- [ ] All responses follow standard format
- [ ] All inputs validated with Zod
- [ ] Error codes are standardized
- [ ] Pagination works consistently
- [ ] Rate limiting applied
- [ ] OpenAPI docs generated

## Estimated Time

- Phase 1 (Response Helpers): 1 day
- Phase 2 (Validation): 2 days
- Phase 3 (Documentation): 2 days
- Phase 4 (Testing): 2 days

**Total: 1 week**
