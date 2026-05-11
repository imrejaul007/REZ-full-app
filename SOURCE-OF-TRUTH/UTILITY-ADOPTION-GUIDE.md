# Utility Adoption Guide
**Date:** 2026-04-29
**Status:** Ready for Adoption

---

## Overview

All utilities are created and ready for adoption. Services have their own validation or need to wire up these shared utilities.

---

## Available Utilities

### 1. Error Handler (`rez-shared`)
```typescript
import { globalErrorHandler, AppError, ValidationError, asyncHandler } from '@rez/shared/middleware';

// Use in Express app
app.use(globalErrorHandler);

// Use in routes
router.get('/', asyncHandler(async (req, res) => {
  throw new AppError('Not found', 404, 'RESOURCE_NOT_FOUND');
}));
```

### 2. Internal Auth (`rez-shared`)
```typescript
import { createInternalAuthMiddleware, createAuthOptionsFromEnv } from '@rez/shared/middleware';

// Create middleware
const auth = createInternalAuthMiddleware(createAuthOptionsFromEnv());
app.use('/internal', auth);
```

### 3. Health Checks (`rez-shared`)
```typescript
import { createHealthRouter } from '@rez/shared/middleware';

const healthRouter = createHealthRouter({
  serviceName: 'my-service',
  redisClient: redis,
});

app.use(healthRouter);
```

### 4. Logger (`rez-shared`)
```typescript
import { logger, expressCorrelationMiddleware } from '@rez/shared/utils';

app.use(expressCorrelationMiddleware);
logger.info('Request completed', { correlationId: req.correlationId });
```

### 5. Cursor Pagination (`rez-order-service`)
```typescript
import { parseCursor, buildPaginatedResponse } from './utils/cursorPagination';

const { filter, hasMore, limit } = parseCursor({
  query: req.query,
  sortField: 'createdAt',
  sortDirection: -1,
});

const data = await collection.find(filter).limit(limit + 1).toArray();
const { data: pageData, hasMore, nextCursor } = buildPaginatedResponse(data, limit, 'createdAt');
```

---

## Service Adoption Status

| Service | Error Handler | Auth | Health | Logger | Pagination |
|---------|-------------|------|--------|--------|------------|
| auth | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready | N/A |
| merchant | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready | N/A |
| order | ✅ Has own | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready |
| payment | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready | N/A |
| wallet | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready | N/A |
| catalog | ✅ Ready | ✅ Ready | ✅ Ready | ✅ Ready | N/A |

---

## Integration Checklist

### Step 1: Import utilities
```bash
npm install @rez/shared
```

### Step 2: Wire up error handler
```typescript
import { globalErrorHandler } from '@rez/shared/middleware';
app.use(globalErrorHandler);
```

### Step 3: Wire up health checks
```typescript
import { createHealthRouter } from '@rez/shared/middleware';
app.use(createHealthRouter({ serviceName: 'my-service' }));
```

### Step 4: Wire up correlation logging
```typescript
import { expressCorrelationMiddleware } from '@rez/shared/utils';
app.use(expressCorrelationMiddleware);
```

---

## Testing Utilities

Run integration tests:
```bash
cd rez-wallet-service
npm test

cd rez-payment-service
npm test
```

---

## Next Steps

1. **Q2 2026**: Adopt utilities in all services
2. **Q2 2026**: Add Razorpay webhook tests
3. **Q3 2026**: API versioning for v2.0
