# REZ Platform API Standards

**Version:** 1.0.0
**Last Updated:** 2026-05-04
**Owner:** API Development Lead

---

## 1. URL Structure

### 1.1 Base URL Pattern
```
https://api.rez.money/{service}
/api/v1/{resource}
```

### 1.2 Service-Specific Base URLs
| Service | Production URL |
|---------|---------------|
| Auth | `https://api.rez.money/auth` |
| Payment | `https://api.rez.money/payment` |
| Wallet | `https://api.rez.money/wallet` |
| Merchant | `https://api.rez.money/merchant` |
| Order | `https://api.rez.money/order` |
| Finance | `https://api.rez.money/finance` |
| Search | `https://api.rez.money/search` |

### 1.3 Resource Naming
- Use **kebab-case** for URL paths: `/wallet-transactions`, `/order-items`
- Use **plural nouns** for collections: `/orders`, `/payments`
- Use **nouns not verbs** for resources: `/auth/verify-otp` (exception for auth)
- Nest sub-resources max 2 levels deep: `/stores/{storeId}/products`

### 1.4 Versioning
- All APIs must use `/api/v1/` prefix (exception: some legacy routes)
- Version in URL path, not headers
- Maintain backwards compatibility within major version

---

## 2. Request/Response Format

### 2.1 Request Format
```json
{
  "phone": "+919876543210",
  "countryCode": "+91",
  "channel": "sms",
  "force": false
}
```

**Rules:**
- Use camelCase for property names
- Send dates in ISO 8601 format: `2026-05-04T10:30:00Z`
- Send amounts as integers (paisa/cent), not decimals
- Always include `Content-Type: application/json` header

### 2.2 Success Response Format
```typescript
// Single resource
{
  "success": true,
  "data": {
    "id": "ord_abc123",
    "status": "pending",
    "amount": 50000
  }
}

// Collection with pagination
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "hasMore": true
    }
  }
}

// Transaction result
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": { ... }
  }
}
```

### 2.3 Error Response Format
```typescript
// Standard error
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials"
  }
}

// Error with details
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "amount", "message": "Must be positive" }
    ]
  }
}

// Production-safe error (no internal details)
{
  "success": false,
  "message": "An error occurred. Reference: abc123"
}
```

### 2.4 Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_001 | 401 | Invalid credentials |
| AUTH_002 | 401 | Token expired |
| AUTH_003 | 401 | Invalid token |
| AUTH_004 | 403 | Unauthorized |
| AUTH_007 | 401 | MFA required |
| VALIDATION_ERROR | 400 | Request validation failed |
| RES_NOT_FOUND | 404 | Resource not found |
| RATE_LIMIT | 429 | Rate limit exceeded |
| SRV_001 | 500 | Internal server error |

---

## 3. HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH, PUT) |
| 201 | Created (POST) |
| 204 | No content (DELETE) |
| 400 | Bad request (validation failed) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 409 | Conflict (duplicate, already exists) |
| 422 | Unprocessable (business rule violation) |
| 429 | Too many requests (rate limit) |
| 500 | Internal server error |

---

## 4. Pagination

### 4.1 Offset-Based Pagination (Default)
```
GET /api/v1/orders?page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8,
      "hasMore": true
    }
  }
}
```

**Parameters:**
| Param | Type | Default | Max | Description |
|-------|------|--------|-----|-------------|
| page | int | 1 | - | Page number (1-indexed) |
| limit | int | 20 | 100 | Items per page |

### 4.2 Cursor-Based Pagination (Large Datasets)
```
GET /api/v1/transactions?cursor=eyJpZCI6MTIzfQ&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "nextCursor": "eyJpZCI6MTQ3fQ",
      "hasMore": true
    }
  }
}
```

**When to use:**
- Datasets > 10,000 records
- Real-time/streaming data
- Infinite scroll UIs

---

## 5. Authentication

### 5.1 Consumer Authentication
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.2 Internal Service Authentication
```http
Authorization: Bearer <internal-service-token>
X-Internal-Service: rez-auth-service
```

### 5.3 API Key (Server-to-Server)
```http
X-API-Key: <api-key>
```

---

## 6. Rate Limiting

### 6.1 Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1714825800
Retry-After: 60
```

### 6.2 Default Limits
| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Auth (OTP send) | 3 | 1 minute |
| Auth (OTP verify) | 5 | 15 minutes |
| Write operations | 100 | 1 minute |
| Read operations | 500 | 1 minute |
| Search | 60 | 1 minute |

---

## 7. Request Validation

### 7.1 Use Zod for Schema Validation
```typescript
import { z } from 'zod';

const createOrderSchema = z.object({
  storeId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().int().min(0)
  })).min(1),
  totalAmount: z.number().int().positive(),
  paymentMethod: z.enum(['upi', 'card', 'wallet'])
});
```

### 7.2 Validation Middleware Pattern
```typescript
function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: Function) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }
      });
    }
    req.body = result.data;
    next();
  };
}
```

---

## 8. Idempotency

### 8.1 Idempotency Key Header
```http
X-Idempotency-Key: <uuid>
```

### 8.2 Response for Duplicate Requests
```json
{
  "success": true,
  "data": { ... },
  "idempotent": true
}
```

### 8.3 When to Use
- Payment initiation
- Wallet credits/debits
- Order creation
- Any non-idempotent write operations

---

## 9. Logging & Tracing

### 9.1 Request ID
```http
X-Request-ID: req_abc123def456
```

### 9.2 Logging Format
```typescript
{
  "timestamp": "2026-05-04T10:30:00Z",
  "level": "info",
  "requestId": "req_abc123",
  "service": "rez-wallet-service",
  "endpoint": "/api/v1/wallet/balance",
  "method": "GET",
  "userId": "user_xyz789",
  "duration": 45,
  "status": 200
}
```

---

## 10. OpenAPI Documentation

### 10.1 Required Fields
Every endpoint must document:
- Summary and description
- Tags (for grouping)
- Security requirements
- Request/response schemas
- Error responses
- Example requests/responses

### 10.2 File Location
```
{service}/docs/openapi.yaml
```

### 10.3 Schema Components
```yaml
components:
  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
              example: AUTH_001
            message:
              type: string
              example: Invalid credentials

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## 11. Testing Requirements

### 11.1 Unit Tests
- Controller/route handlers
- Input validation
- Error handling paths

### 11.2 Integration Tests
- Full request/response cycle
- Database interactions
- External service mocks

### 11.3 Contract Tests
- API response schema validation
- Backwards compatibility

---

## 12. Migration Checklist

When adding new endpoints, ensure:

- [ ] OpenAPI spec updated
- [ ] Request validation implemented
- [ ] Error codes documented
- [ ] Rate limiting configured
- [ ] Pagination implemented (if collection)
- [ ] Idempotency handled (if write operation)
- [ ] Unit tests written
- [ ] API.md updated

---

## Appendix A: Response Helper Functions

### success(data)
```typescript
function success(data: unknown) {
  return { success: true, data };
}
```

### err(code, details?)
```typescript
function err(code: string, details?: unknown) {
  const def = ErrorCodes[code as keyof typeof ErrorCodes];
  return {
    success: false,
    error: {
      code: def.code,
      message: def.message,
      ...(details && { details })
    }
  };
}
```

### paginated(items, total, page, limit)
```typescript
function paginated(items: unknown[], total: number, page: number, limit: number) {
  return {
    success: true,
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    }
  };
}
```

---

## Appendix B: Standard Error Codes

```typescript
export const ErrorCodes = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: { code: 'AUTH_001', message: 'Invalid credentials' },
  AUTH_TOKEN_EXPIRED: { code: 'AUTH_002', message: 'Token has expired' },
  AUTH_TOKEN_INVALID: { code: 'AUTH_003', message: 'Invalid token' },
  AUTH_UNAUTHORIZED: { code: 'AUTH_004', message: 'Unauthorized access' },
  AUTH_MFA_REQUIRED: { code: 'AUTH_007', message: 'MFA verification required' },

  // Validation
  VALIDATION_ERROR: { code: 'VAL_001', message: 'Validation failed' },
  INVALID_REQUEST: { code: 'VAL_002', message: 'Invalid request format' },

  // Resources
  RES_NOT_FOUND: { code: 'RES_001', message: 'Resource not found' },
  RES_ALREADY_EXISTS: { code: 'RES_002', message: 'Resource already exists' },

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: { code: 'RATE_001', message: 'Rate limit exceeded' },

  // Server
  SRV_INTERNAL_ERROR: { code: 'SRV_001', message: 'Internal server error' },
  SRV_UNAVAILABLE: { code: 'SRV_002', message: 'Service temporarily unavailable' }
} as const;
```
