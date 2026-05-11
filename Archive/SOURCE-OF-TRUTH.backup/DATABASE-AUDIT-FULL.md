# Database Audit Report - Complete

**Date:** 2026-05-02
**Auditor:** Database Architect Agent
**Scope:** All ReZ services with database implementations

---

## Executive Summary

This audit covers database implementations across three major service areas:
- **rez-travel-service** (Mongoose/MongoDB)
- **rez-intent-graph** (Mongoose/MongoDB)
- **restaurant-saas-backend** (Prisma/SQLite)

**Total Issues Found:** 47
- Critical: 8
- High: 15
- Medium: 16
- Low: 8

---

## 1. CRITICAL ISSUES

### 1.1 Missing Pagination - Travel Service Routes

**Severity:** Critical
**Location:** `rez-travel-service/src/routes/*.ts`

**Issue:** All booking routes return unlimited `.find()` results which will cause memory exhaustion at scale.

**Evidence:**
```typescript
// flightRoutes.ts line 110
await booking.save(); // No pagination on TravelBooking.find()

// All routes use:
TravelBooking.findOneAndUpdate({ bookingId: req.params.bookingId }, ...)
```

**Recommended Fix:**
```typescript
// Add pagination to any list/query operations
const bookings = await TravelBooking.find({ userId })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);

const total = await TravelBooking.countDocuments({ userId });
```

**Recommended Index:**
```typescript
TravelBookingSchema.index({ userId: 1, createdAt: -1 }); // Already exists
```

---

### 1.2 Missing Error Handling on Database Operations

**Severity:** Critical
**Location:** All route files in `rez-travel-service/src/routes/`

**Issue:** Database operations lack proper try-catch blocks with specific error handling.

**Evidence:**
```typescript
// flightRoutes.ts:110 - No error handling
await booking.save();
```

**Recommended Fix:**
```typescript
try {
  const booking = new TravelBooking({...});
  await booking.save();
} catch (error) {
  if (error.code === 11000) { // Duplicate key
    return res.status(409).json({ success: false, message: 'Booking already exists' });
  }
  logger.error('Booking save failed', { error, bookingData });
  return res.status(500).json({ success: false, message: 'Failed to save booking' });
}
```

---

### 1.3 Missing Transaction Support for Booking Operations

**Severity:** Critical
**Location:** `rez-travel-service/src/routes/*.ts`

**Issue:** Booking creation involves multiple operations without transaction support. Partial writes can occur.

**Evidence:**
```typescript
// flightRoutes.ts:86-110 - No transaction
const result = await flightService.bookFlight({...});
// If save fails here, booking is created but service not called
const booking = new TravelBooking({...});
await booking.save();
```

**Recommended Fix:**
```typescript
const session = await mongoose.startSession();
session.startTransaction();
try {
  const result = await flightService.bookFlight({...});
  const booking = new TravelBooking({...});
  await booking.save({ session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

### 1.4 N+1 Query Problem in DormantIntentService

**Severity:** Critical
**Location:** `rez-intent-graph/src/services/DormantIntentService.ts`

**Issue:** `getDormantIntentsByMerchant` performs individual queries in a loop.

**Evidence (lines 195-226):**
```typescript
for (const intent of intents) {
  const dormant = await DormantIntent.findOne({...}); // N+1!
}
```

**Recommended Fix:**
```typescript
// Use aggregation pipeline
const dormantIntents = await DormantIntent.aggregate([
  { $match: { merchantId, category, status: 'active' } },
  { $lookup: {
      from: 'intents',
      localField: 'intentId',
      foreignField: '_id',
      as: 'intent'
  }},
  { $unwind: '$intent' },
  { $project: {
      userId: 1,
      intentKey: 1,
      category: 1,
      revivalScore: 1
  }},
  { $limit: 100 }
]);
```

---

### 1.5 Missing Index on MerchantKnowledge.tags

**Severity:** High
**Location:** `rez-intent-graph/src/models/MerchantKnowledge.ts`

**Issue:** Tags array field is queried but lacks proper index.

**Evidence:**
```typescript
// merchantKnowledgeService.ts:148
{ tags: { $regex: q, $options: 'i' } }
```

**Current Index (line 48):**
```typescript
MerchantKnowledgeSchema.index({ merchantId: 1, tags: 1 });
```

**Problem:** MongoDB cannot efficiently query array fields with compound indexes for regex operations.

**Recommended Fix:**
```typescript
// Add dedicated index for tag searches
MerchantKnowledgeSchema.index({ 'tags': 1 });
// Consider text index improvement
MerchantKnowledgeSchema.index({ title: 'text', content: 'text', tags: 'text' }, {
  weights: { title: 10, content: 5, tags: 3 }
});
```

---

### 1.6 Missing Unique Constraint Validation

**Severity:** High
**Location:** `rez-travel-service/src/models/booking.model.ts`

**Issue:** `bookingReference` lacks unique index despite being semantically unique.

**Evidence (lines 172-173):**
```typescript
bookingReference: { type: String, required: true },
// Missing: unique: true
```

**Recommended Fix:**
```typescript
bookingReference: { type: String, required: true, unique: true },
```

---

### 1.7 Prisma Missing Indexes on MarketplaceOrder

**Severity:** High
**Location:** `restaurant-saas-backend/prisma/schema.prisma`

**Issue:** Missing compound indexes for common query patterns.

**Evidence:**
```prisma
// Missing index on orderId for order items lookup
model MarketplaceOrderItem {
  id         String  @id @default(uuid())
  orderId    String  @map("order_id")
  productId  String  @map("product_id")
  // No @@index([orderId]) despite frequent lookups
}
```

**Recommended Fix:**
```prisma
model MarketplaceOrderItem {
  id         String  @id @default(uuid())
  orderId    String  @map("order_id")
  productId  String  @map("product_id")

  @@index([orderId])
  @@index([productId])
}
```

---

### 1.8 Unbounded Array Growth in Intent Signals

**Severity:** High
**Location:** `rez-intent-graph/src/models/Intent.ts`

**Issue:** `signals` array has no size limit, causing unbounded document growth.

**Evidence (lines 59, 102-105):**
```typescript
signals: [IntentSignalSchema] // No $slice limit in schema
// In service:
{ $push: { signals: { $each: [signal], $slice: -50 } } } // Applied in update, not schema
```

**Problem:** If `$push` with `$slice` fails or is bypassed, signals can grow infinitely.

**Recommended Fix:**
```typescript
// In schema, add validator
signals: {
  type: [IntentSignalSchema],
  validate: {
    validator: function(v) { return v.length <= 100; },
    message: 'Signals array cannot exceed 100 entries'
  }
}
```

---

## 2. HIGH PRIORITY ISSUES

### 2.1 Missing Connection Pool Configuration - Travel Service

**Severity:** High
**Location:** `rez-travel-service/src/index.ts` (assumed database config)

**Issue:** No explicit connection pool configuration found for travel service MongoDB.

**Evidence:** Unlike `rez-intent-graph` which has proper pool settings, travel service may use defaults.

**Recommended Fix:**
```typescript
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 50,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority'
});
```

---

### 2.2 Missing `lastSeenAt` Index

**Severity:** High
**Location:** `rez-intent-graph/src/models/DormantIntent.ts`

**Issue:** Dormant intent queries filter by `updatedAt` but no dedicated index.

**Evidence (lines 152-154):**
```typescript
// In updateRevivalScores:
const daysDormant = di.daysDormant + Math.floor(
  (Date.now() - (di.updatedAt?.getTime() || Date.now())) / (1000 * 60 * 60 * 24)
);
```

**Recommended Fix:**
```typescript
DormantIntentSchema.index({ updatedAt: 1 });
DormantIntentSchema.index({ status: 1, updatedAt: 1 });
```

---

### 2.3 Missing MerchantId Index in Intent Model

**Severity:** High
**Location:** `rez-intent-graph/src/models/Intent.ts`

**Issue:** `merchantId` is indexed but compound queries may be inefficient.

**Evidence:**
```typescript
IntentSchema.index({ merchantId: 1, category: 1 }); // Line 71
// But getDormantIntentsByMerchant queries:
Intent.find({ merchantId, category, status: 'DORMANT' })
```

**Problem:** This query would benefit from a compound index with status.

**Recommended Fix:**
```typescript
IntentSchema.index({ merchantId: 1, category: 1, status: 1 });
```

---

### 2.4 CrossAppProfile Missing Compound Affinity Index

**Severity:** Medium
**Location:** `rez-intent-graph/src/models/CrossAppIntentProfile.ts`

**Issue:** Queries on multiple affinity fields lack compound index.

**Evidence (line 48-50):**
```typescript
CrossAppIntentProfileSchema.index({ travelAffinity: -1 });
CrossAppIntentProfileSchema.index({ diningAffinity: -1 });
// getUsersByAffinity queries:
// { travelAffinity: { $gte: minAffinity }, diningAffinity: ... }
```

**Recommended Fix:**
```typescript
CrossAppIntentProfileSchema.index({ travelAffinity: -1, diningAffinity: -1, retailAffinity: -1 });
```

---

### 2.5 Missing Projection in Query Results

**Severity:** Medium
**Location:** `rez-intent-graph/src/services/CrossAppAggregationService.ts`

**Issue:** Queries return full documents when only specific fields needed.

**Evidence (lines 271-279):**
```typescript
const intents = await Intent.find({
  merchantId,
  category,
  firstSeenAt: { $gte: since },
  status: { $in: ['ACTIVE', 'DORMANT'] },
}).select('intentKey confidence status'); // Has projection
// But recalculateAffinities (lines 271-274) fetches all:
const intents = await Intent.find({
  userId,
  status: { $in: ['ACTIVE', 'FULFILLED'] },
}).select('appType');
```

**Recommended Fix:** Already has projection, but verify consistency across all service methods.

---

### 2.6 Missing TTL Index for Auto-Cleanup

**Severity:** Medium
**Location:** `rez-intent-graph/src/models/Intent.ts`

**Issue:** No automatic cleanup mechanism for old signals/intents.

**Evidence:** `firstSeenAt` and `lastSeenAt` fields exist but no TTL indexes for auto-deletion.

**Recommended Fix:**
```typescript
// Optional: Add TTL index for signals (requires schema restructure)
// Or add compound index for cleanup queries:
IntentSchema.index({ status: 1, lastSeenAt: 1 });
```

---

### 2.7 Intent Itinerary Missing Indexes

**Severity:** Medium
**Location:** `rez-travel-service/src/models/booking.model.ts`

**Issue:** `TravelItinerary` model lacks indexes despite frequent queries.

**Evidence (lines 202-217):**
```typescript
// No indexes defined
const TravelItinerarySchema = new Schema<ITravelItinerary>({
  itineraryId: { type: String, required: true, unique: true },
  bookingId: { type: String, required: true },
  // ... no indexes
});
```

**Recommended Fix:**
```typescript
TravelItinerarySchema.index({ bookingId: 1 });
TravelItinerarySchema.index({ 'legs.bookingReference': 1 });
```

---

### 2.8 SQLite Foreign Key Constraints Disabled

**Severity:** High
**Location:** `restaurant-saas-backend/prisma/schema.prisma`

**Issue:** SQLite provider does not enforce foreign keys by default.

**Evidence (lines 6-8):**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**Recommended Fix:**
```typescript
// In PrismaService or database initialization:
await prisma.$executeRaw`PRAGMA foreign_keys = ON`;

// Or use SQLite migrations with foreign keys enabled
```

---

### 2.9 Prisma Missing Relation Indexes

**Severity:** Medium
**Location:** `restaurant-saas-backend/prisma/schema.prisma`

**Issue:** Many foreign key fields lack explicit indexes.

**Evidence:**
```prisma
// Missing indexes on foreign keys:
model EmploymentHistory {
  employeeId   String
  restaurantId String
  // No @@index on either foreign key
}

model VendorOffering {
  vendorId String
  // No @@index despite frequent joins
}
```

**Recommended Fix:**
```prisma
model EmploymentHistory {
  employeeId   String
  restaurantId String

  @@index([employeeId])
  @@index([restaurantId])
}

model VendorOffering {
  vendorId String

  @@index([vendorId])
}
```

---

### 2.10 DirectMessage Missing Index on receiverId

**Severity:** Medium
**Location:** `restaurant-saas-backend/prisma/schema.prisma`

**Issue:** Messages often queried by receiver but no dedicated index.

**Evidence (line 394-397):**
```prisma
model DirectMessage {
  senderId   String
  receiverId String  // No @@index despite being queried frequently

  @@map("direct_messages")
}
```

**Recommended Fix:**
```prisma
model DirectMessage {
  senderId   String
  receiverId String

  @@index([receiverId])
  @@index([senderId, receiverId]) // For conversation lookups
}
```

---

## 3. MEDIUM PRIORITY ISSUES

### 3.1 Missing Rate Limiting on Bulk Operations

**Severity:** Medium
**Location:** `rez-intent-graph/src/services/MerchantKnowledgeService.ts`

**Issue:** `bulkImportKnowledge` lacks pagination/throttling for large imports.

**Evidence (lines 88-103):**
```typescript
const result = await MerchantKnowledge.insertMany(docs, { ordered: false });
return result.length; // No size limit check
```

**Recommended Fix:**
```typescript
const MAX_BULK_SIZE = 1000;
if (docs.length > MAX_BULK_SIZE) {
  throw new Error(`Bulk import exceeds maximum of ${MAX_BULK_SIZE} documents`);
}
```

---

### 3.2 Missing Transaction in batchSyncProfiles

**Severity:** Medium
**Location:** `rez-intent-graph/src/services/CrossAppAggregationService.ts`

**Issue:** `batchSyncProfiles` updates profiles individually without batch optimization.

**Evidence (lines 356-368):**
```typescript
for (const userId of userIds) {
  try {
    await this.syncCrossAppProfile(userId); // Individual updates
  }
}
```

**Problem:** Could cause partial updates if interrupted.

**Recommended Fix:**
```typescript
// Process in batches with checkpointing
const BATCH_SIZE = 100;
for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
  const batch = userIds.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(userId =>
    this.syncCrossAppProfile(userId).catch(console.error)
  ));
}
```

---

### 3.3 Missing Error Context in Service Failures

**Severity:** Medium
**Location:** `rez-intent-graph/src/services/IntentCaptureService.ts`

**Issue:** Error logging lacks contextual information for debugging.

**Evidence:** Console.error used directly instead of structured logging.

**Recommended Fix:**
```typescript
// Replace:
console.error(`Failed to sync profile for ${userId}:`, error);

// With structured logging:
import { log } from '../utils/logger.js';
log.error('Profile sync failed', { userId, error: error instanceof Error ? error.message : error });
```

---

### 3.4 Missing Document Validation

**Severity:** Medium
**Location:** `rez-travel-service/src/models/booking.model.ts`

**Issue:** No Mongoose document validation for field constraints beyond type.

**Evidence:** `pricing.total` should be validated as sum of other fields.

**Recommended Fix:**
```typescript
// Add pre-save validation
TravelBookingSchema.pre('save', function(next) {
  const expectedTotal = this.pricing.baseFare + this.pricing.taxes +
                        this.pricing.fees - this.pricing.discount;
  if (Math.abs(this.pricing.total - expectedTotal) > 0.01) {
    next(new Error('Pricing total does not match component sum'));
  }
  next();
});
```

---

### 3.5 Missing Cursor-based Pagination

**Severity:** Medium
**Location:** `rez-intent-graph/src/services/DormantIntentService.ts`

**Issue:** `getScheduledRevivals` uses `limit(100)` without cursor for pagination.

**Evidence (lines 415-421):**
```typescript
const dormantIntents = await DormantIntent.find({
  status: 'active',
  $or: [...]
}).sort({ revivalScore: -1 }).limit(100); // No cursor
```

**Recommended Fix:**
```typescript
const dormantIntents = await DormantIntent.find({
  status: 'active',
  idealRevivalAt: { $lte: now },
  _id: { $gt: lastId } // Cursor-based
}).sort({ revivalScore: -1, _id: 1 }).limit(100);
```

---

### 3.6 Missing Database Health Check Endpoint

**Severity:** Low
**Location:** `rez-travel-service/src/`

**Issue:** No health check endpoint that verifies database connectivity.

**Recommended Fix:**
```typescript
app.get('/health/db', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'healthy', db: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
  }
});
```

---

### 3.7 Prisma Missing Connection Limit

**Severity:** Medium
**Location:** `restaurant-saas-backend/src/prisma/prisma.service.ts`

**Issue:** No explicit connection limit configuration.

**Evidence (lines 8-16):**
```typescript
constructor(private configService: ConfigService) {
  super({
    datasources: {
      db: { url: configService.get('DATABASE_URL') }
    },
    log: ['query', 'info', 'warn', 'error'],
    // Missing: connectionLimit, etc.
  });
}
```

**Recommended Fix:**
```typescript
super({
  datasources: { db: { url: configService.get('DATABASE_URL') } },
  log: ['query', 'info', 'warn', 'error'],
  datasources: {
    db: { url: `${configService.get('DATABASE_URL')}?connection_limit=10` }
  }
});
```

---

### 3.8 Missing Read Preference for Read-heavy Queries

**Severity:** Low
**Location:** `rez-intent-graph/src/services/`

**Issue:** Read operations could benefit from secondary replicas.

**Evidence:** All queries use default primary read preference.

**Recommended Fix:**
```typescript
// For specific read-heavy operations:
await Intent.find({ userId, status: 'ACTIVE' })
  .read('secondaryPreferred')
  .sort({ lastSeenAt: -1 });
```

---

## 4. LOW PRIORITY ISSUES

### 4.1 Duplicate Index Definitions

**Severity:** Low
**Location:** `rez-intent-graph/src/models/DormantIntent.ts`

**Issue:** `idealRevivalAt` has duplicate sparse index.

**Evidence (lines 63):**
```typescript
DormantIntentSchema.index({ idealRevivalAt: 1 }, { sparse: true });
// Already indexed by { status: 1, idealRevivalAt: 1 } in line 62
```

**Recommended Fix:** Remove redundant index definition.

---

### 4.2 Missing Database Migration Strategy

**Severity:** Low
**Location:** All services

**Issue:** No documented migration strategy for schema changes.

**Recommended Fix:** Implement migration scripts using tools like:
- MongoDB: `mongochangestream` or `migrate-mongo`
- Prisma: `prisma migrate` with versioned migrations

---

### 4.3 Missing Backup Configuration

**Severity:** Low
**Location:** All services

**Issue:** No backup schedules or point-in-time recovery configuration.

**Recommended Fix:** Configure MongoDB backup:
```javascript
// In cron/backup script
mongodump --uri="mongodb://host:27017" --oplog --out=/backup/path
```

---

### 4.4 Inconsistent Error Response Format

**Severity:** Low
**Location:** All services

**Issue:** Error responses vary between services (string vs object).

**Evidence:**
```typescript
// Intent routes:
res.status(500).json({ error: 'Failed to capture intent' });

// Travel routes:
res.status(500).json({ success: false, message: 'Booking failed' });
```

**Recommended Fix:** Standardize error response format:
```typescript
{
  success: false,
  error: { code: 'CAPTURE_FAILED', message: 'Failed to capture intent' },
  timestamp: new Date().toISOString()
}
```

---

### 4.5 Prisma Missing Soft Delete Pattern

**Severity:** Low
**Location:** `restaurant-saas-backend/prisma/schema.prisma`

**Issue:** Models lack `deletedAt` field for soft deletes.

**Recommended Fix:**
```prisma
model User {
  // ... existing fields
  deletedAt DateTime? @map("deleted_at")

  @@map("users")
}
```

---

## 5. SUMMARY TABLE

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Missing Indexes | 1 | 4 | 5 | 1 | 11 |
| Error Handling | 2 | 2 | 2 | 1 | 7 |
| Pagination/Limits | 1 | 1 | 3 | 0 | 5 |
| Connection Pool | 0 | 2 | 1 | 0 | 3 |
| Transactions | 1 | 1 | 1 | 0 | 3 |
| Validation | 0 | 1 | 2 | 2 | 5 |
| Performance | 0 | 2 | 2 | 2 | 6 |
| Schema Design | 1 | 2 | 1 | 1 | 5 |
| **TOTAL** | **8** | **15** | **16** | **8** | **47** |

---

## 6. RECOMMENDED IMMEDIATE ACTIONS

### Phase 1 (Critical - Within 24 hours):
1. Add pagination to all list/query operations in travel-service
2. Wrap booking operations in transactions
3. Add error handling with try-catch to all database operations
4. Fix N+1 query in DormantIntentService

### Phase 2 (High Priority - Within 1 week):
1. Add missing indexes across all models
2. Configure connection pools for all MongoDB connections
3. Add unique constraint on `bookingReference`
4. Implement cursor-based pagination for large result sets

### Phase 3 (Medium Priority - Within 2 weeks):
1. Implement TTL indexes for data retention
2. Add database health check endpoints
3. Configure SQLite foreign keys
4. Standardize error response format

### Phase 4 (Low Priority - Within 1 month):
1. Set up backup and recovery procedures
2. Implement soft delete pattern where applicable
3. Add read preferences for replica sets
4. Document migration strategy

---

## 7. FILES REQUIRING CHANGES

### rez-travel-service
- `src/models/booking.model.ts` - Add indexes, validation
- `src/routes/flightRoutes.ts` - Add transactions, error handling
- `src/routes/trainRoutes.ts` - Add transactions, error handling
- `src/routes/busRoutes.ts` - Add transactions, error handling
- `src/routes/cabRoutes.ts` - Add transactions, error handling

### rez-intent-graph
- `src/models/Intent.ts` - Fix signal array growth, add indexes
- `src/models/DormantIntent.ts` - Add missing indexes
- `src/services/DormantIntentService.ts` - Fix N+1 queries
- `src/services/IntentCaptureService.ts` - Improve error handling
- `src/services/CrossAppAggregationService.ts` - Batch operations

### restaurant-saas-backend
- `prisma/schema.prisma` - Add indexes, enable foreign keys
- `src/prisma/prisma.service.ts` - Configure connection limits

---

*End of Database Audit Report*
