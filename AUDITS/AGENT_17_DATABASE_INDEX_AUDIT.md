# AGENT 17: DATABASE INDEX AUDIT REPORT

**Project:** ReZ Full App
**Date:** May 10, 2026
**Agent:** Database Index Specialist
**Status:** COMPLETE

---

## EXECUTIVE SUMMARY

This audit comprehensively reviews all MongoDB schema index definitions across the ReZ ecosystem. We identified **8 schema files with indexes**, **1 legacy migration file**, and several index-related issues requiring attention.

**Total Schemas Reviewed:** 13
**Total Indexes Defined:** 85+
**Critical Issues Found:** 5
**High Priority Issues:** 8
**Medium Priority Issues:** 12
**Low Priority Issues:** 6

---

## PART 1: EXISTING INDEXES BY SCHEMA

### 1.1 Migration File: `/migrations/001_indexes.js`

**Collection: orders**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| idx_userId_createdAt | userId: 1, createdAt: -1 | Compound | User order history |
| idx_merchantId_status | merchantId: 1, status: 1 | Compound | Merchant order queries |
| razorpayOrderId | razorpayOrderId: 1 | Unique | Payment lookups |
| ttl_30d | createdAt: 1 | TTL | 30-day expiration |
| idx_merchantId_createdAt | merchantId: 1, createdAt: -1 | Compound | Duplicate - see issues |

**Collection: users**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| phone | phone: 1 | Unique | Auth lookup |
| email | email: 1 | Sparse Unique | Optional email |
| deviceId | deviceId: 1 | Single | Device tracking |
| createdAt | createdAt: 1 | Single | Sorting |

**Collection: wallets**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId | userId: 1 | Unique | One wallet per user |

**Collection: transactions**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| idx_userId_createdAt | userId: 1, createdAt: -1 | Compound | User transaction history |
| orderId | orderId: 1 | Single | Order lookup |
| idx_type_createdAt | type: 1, createdAt: -1 | Compound | Type-based queries |

**Collection: merchants**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| phone | phone: 1 | Unique | Merchant auth |
| idx_status_createdAt | status: 1, createdAt: -1 | Compound | Status filtering |
| location | location: "2dsphere" | Geospatial | Location queries |

**Collection: products**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| idx_merchantId_status | merchantId: 1, status: 1 | Compound | Merchant product list |
| idx_category_status | category: 1, status: 1 | Compound | Category browsing |
| name_description | name: "text", description: "text" | Text | Search |

**Collection: notifications**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| idx_userId_read_createdAt | userId: 1, read: 1, createdAt: -1 | Compound | User notifications |

---

### 1.2 Schema: `rez-user-intelligence-service/src/models/UserIntelligence.ts`

**Collection: user_intelligence**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| user_id | user_id: 1 | Unique | Primary lookup |
| segments | segments: 1 | Single | Segment filtering |
| scores.churn_risk | scores.churn_risk: -1 | Single | Churn sorting |
| scores.ltv | scores.ltv: -1 | Single | LTV sorting |

---

### 1.3 Schema: `rez-user-intelligence-service/src/models/UserProfile.ts`

**Collection: user_profiles**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId | userId: 1 | Unique | Primary key |
| externalUserId | externalUserId: 1 | Sparse | External ID lookup |
| lifetimeValue.totalRevenue | lifetimeValue.totalRevenue: -1 | Single | LTV sorting |
| behavioralScores.engagementScore | behavioralScores.engagementScore: -1 | Single | Engagement sorting |
| behavioralScores.valueSegment | behavioralScores.valueSegment: 1 | Single | Segment filtering |
| behavioralScores.churnRisk | behavioralScores.churnRisk: 1 | Single | Risk filtering |
| preferences.cuisinePreferences.cuisine | preferences.cuisinePreferences.cuisine: 1 | Single | Cuisine preferences |
| metadata.segments | metadata.segments: 1 | Single | Segment membership |
| metadata.tags | metadata.tags: 1 | Single | Tag filtering |
| engagementMetrics.lastSessionAt | engagementMetrics.lastSessionAt: -1 | Single | Recent activity |
| behaviorPatterns.preferredDevice | behaviorPatterns.preferredDevice: 1 | Single | Device filtering |
| profile.accountStatus | profile.accountStatus: 1 | Single | Status filtering |
| metadata.dataCompleteness | metadata.dataCompleteness: -1 | Single | Data quality |
| createdAt | createdAt: -1 | Single | Sorting |
| updatedAt | updatedAt: -1 | Single | Sorting |
| eventHistory.timestamp | eventHistory.timestamp: 1 | TTL (90 days) | Event expiration |
| eventId | eventHistory.eventId: 1 | Single | Event lookup |
| eventType | eventHistory.eventType: 1 | Single | Event type |

---

### 1.4 Schema: `rez-intelligence-hub/src/index.ts`

**Collection: user_profiles**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId | userId: 1 | Single | Primary lookup |
| cuisines | derived_signals.preferences.cuisines: 1 | Single | Cuisine array |
| current_intent | derived_signals.intent_signals.current_intent: 1 | Single | Intent tracking |
| segments | segments: 1 | Single | Segments |
| updatedAt | updatedAt: 1 | Single | Sorting |
| segments_engagement | segments: 1, derived_signals.behavior.engagement_level: 1 | Compound | Segment + engagement |
| intent_confidence | derived_signals.intent_signals.current_intent: 1, intent_confidence: -1 | Compound | Intent sorting |

**Collection: merchant_profiles**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| merchantId | merchantId: 1 | Single | Primary lookup |
| demand_pattern | derived_signals.demand_pattern: 1 | Single | Demand tracking |
| customer_type | derived_signals.customer_type: 1 | Single | Customer types |
| segments | segments: 1 | Single | Segments |
| updatedAt | updatedAt: 1 | Single | Sorting |
| segments_demand | segments: 1, derived_signals.demand_pattern: 1 | Compound | Segment + demand |

---

### 1.5 Schema: `rez-wallet-service/src/models/Wallet.ts`

**Collection: wallets**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| user | user: 1 | Unique | One wallet per user |
| user_isActive | user: 1, isActive: 1 | Compound | Active wallet query |
| isActive | isActive: 1 | Single | Active filtering |
| isFrozen | isFrozen: 1 | Single | Frozen filtering |
| createdAt | createdAt: -1 | Single | Sorting |
| transactions.createdAt | user: 1, transactions.createdAt: -1 | Compound | **BROKEN** - transactions field not in schema |
| transactions.type | transactions.type: 1, transactions.createdAt: -1 | Compound | **BROKEN** - transactions field not in schema |
| balance.total | balance.total: -1 | Single | Balance sorting |
| isActive_balance | isActive: 1, balance.total: -1 | Compound | Active leaderboard |
| deletedAt | deletedAt: 1 | Single | Soft delete |

---

### 1.6 Schema: `rez-wallet-service/src/models/CoinTransaction.ts`

**Collection: cointransactions**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| user | user: 1 | Single | User lookup |
| user_createdAt | user: 1, createdAt: -1 | Compound | User history |
| user_coinType_createdAt | user: 1, coinType: 1, createdAt: -1 | Compound | Coin type history |
| idempotencyKey | idempotencyKey: 1 | Sparse Unique | Idempotency |
| sourceId | sourceId: 1 | Single | Source tracking |
| type | type: 1 | Single | Type filtering |
| status | status: 1 | Single | Status filtering |
| user_type_createdAt | user: 1, type: 1, createdAt: -1 | Compound | User + type history |
| merchantId_createdAt | merchantId: 1, createdAt: -1 | Compound | Merchant transactions |
| merchantId_status_createdAt | merchantId: 1, status: 1, createdAt: -1 | Compound | Merchant settlement |
| deletedAt | deletedAt: 1 | Single | Soft delete |

---

### 1.7 Schema: `rez-wallet-service/src/models/LedgerEntry.ts`

**Collection: ledgerentries**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| pairId | pairId: 1 | Single | Pair tracking |
| accountId | accountId: 1 | Single | Account lookup |
| accountId_createdAt | accountId: 1, createdAt: -1 | Compound | Account history |
| accountType_operationType | accountType: 1, operationType: 1 | Compound | Type filtering |
| accountId_coinType_createdAt | accountId: 1, coinType: 1, createdAt: -1 | Compound | Coin history |
| pairId_direction | pairId: 1, direction: 1 | Unique | Pair uniqueness |
| reversalReferenceId | reversalReferenceId: 1 | Sparse | Reversal tracking |
| yearMonth_accountType | yearMonth: 1, accountType: 1 | Compound | Monthly reporting |
| ledger_idempotency | referenceId: 1, referenceModel: 1, operationType: 1, direction: 1 | Unique | Idempotency |
| operationType | operationType: 1 | Single | Operation filtering |
| accountType_accountId_createdAt | accountType: 1, accountId: 1, createdAt: -1 | Compound | Account reporting |

---

### 1.8 Schema: `rez-wallet-service/src/models/MerchantWallet.ts`

**Collection: merchantwallets**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| merchant | merchant: 1 | Unique | One wallet per merchant |
| store | store: 1 | Single | Store filtering |
| isActive | isActive: 1 | Single | Active filtering |
| createdAt | createdAt: -1 | Single | Sorting |
| merchant_isActive | merchant: 1, isActive: 1 | Compound | Active merchant |

---

### 1.9 Schema: `rez-payment-service/src/models/Payment.ts`

**Collection: payments**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| paymentId | paymentId: 1 | Unique | Primary key |
| orderId | orderId: 1 | Single | Order lookup |
| expiresAt | expiresAt: 1 | TTL Partial | Non-completed expiration |
| user_status | user: 1, status: 1 | Compound | User payment status |
| user_status_createdAt | user: 1, status: 1, createdAt: -1 | Compound | User payment history |
| status_createdAt | status: 1, createdAt: 1 | Compound | Status timeline |
| razorpayOrderId | metadata.razorpayOrderId: 1 | Sparse | Razorpay lookup |
| merchantId_status_completedAt | metadata.merchantId: 1, status: 1, completedAt: -1 | Compound Sparse | Merchant settlements |
| wallet_recovery | status: 1, walletCredited: 1, walletCreditRecoveryAttempted: 1, completedAt: 1 | Compound | Recovery scan |
| status_updatedAt | status: 1, updatedAt: 1 | Compound | Status updates |
| orchestratorIdempotencyKey | metadata.orchestratorIdempotencyKey: 1 | Sparse Unique | Idempotency |
| status | status: 1 | Single | Status filtering |
| orderId | orderId: 1 | Single | Order filtering |
| user | user: 1 | Single | User filtering |
| createdAt | createdAt: -1 | Single | Sorting |
| user_createdAt | user: 1, createdAt: -1 | Compound | User payment history |

---

### 1.10 Schema: `rez-order-service/src/models/Order.ts`

**Collection: orders**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| user_createdAt | user: 1, createdAt: -1 | Compound | User orders |
| _id | _id: 1 | Single | ID lookup |
| status | status: 1 | Single | Status filtering |
| status_createdAt | status: 1, createdAt: -1 | Compound | Status timeline |
| payment.status | payment.status: 1 | Single | Payment status |
| user_status | user: 1, status: 1 | Compound | User order status |
| items.itemId_status | items.itemId: 1, status: 1 | Compound | Product orders |
| payment.id | payment.id: 1 | Sparse | Payment lookup |
| orderNumber | orderNumber: 1 | Unique | Order number |
| merchant_status_createdAt | merchant: 1, status: 1, createdAt: -1 | Compound | Merchant orders |
| store_status | store: 1, status: 1 | Compound | Store orders |
| deletedAt | deletedAt: 1 | Single | Soft delete |
| idempotency | user: 1, clientIdempotencyKey: 1 | Partial Unique | Idempotency |

---

### 1.11 Schema: `rez-streak-service/src/models/UserStreak.ts`

**Collection: userstreaks**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId | userId: 1 | Unique | Primary key |
| userId_lastVisitDate | userId: 1, lastVisitDate: -1 | Compound | Recent activity |
| streakHistory.date | streakHistory.date: -1 | Single | History sorting |

---

### 1.12 Schema: `rez-auth-service/src/models/User.ts`

**Collection: users**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| phoneNumber | phoneNumber: 1 | Unique | Auth lookup |
| email | email: 1 | Sparse | Email lookup |

---

### 1.13 Schema: `rez-wallet-service/src/models/savingsIndexes.ts`

**Collection: savingsentries**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId_createdAt | userId: 1, createdAt: -1 | Compound | User savings |
| userId_type_createdAt | userId: 1, type: 1, createdAt: -1 | Compound | Type history |
| userId_category_createdAt | userId: 1, category: 1, createdAt: -1 | Compound | Category history |
| entryId | entryId: 1 | Unique | Entry lookup |
| createdAt | createdAt: -1 | Single | Sorting |
| type_createdAt | type: 1, createdAt: -1 | Compound | Type filtering |
| category_createdAt | category: 1, createdAt: -1 | Compound | Category filtering |

**Collection: savingsgoals**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId_goalId | userId: 1, goalId: 1 | Unique | Goal lookup |
| userId_isCompleted | userId: 1, isCompleted: 1 | Compound | Active goals |
| userId_createdAt | userId: 1, createdAt: -1 | Compound | User goals |
| isCompleted_completedAt | isCompleted: 1, completedAt: -1 | Compound | Completion tracking |

**Collection: savingsstreakschemas**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId | userId: 1 | Unique | User streak |
| currentStreak_active | currentStreak: -1, streakActive: 1 | Compound | Leaderboard |
| longestStreak | longestStreak: -1 | Single | All-time leaderboard |

**Collection: savingsinsights**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId_insightType | userId: 1, insightType: 1 | Unique | Insight lookup |
| userId_updatedAt | userId: 1, updatedAt: -1 | Compound | Recent insights |

**Collection: savingsprojections**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId | userId: 1 | Unique | User projection |
| monthlyAverage | monthlyAverage: -1 | Single | Projection sorting |
| trendDirection_calculatedAt | trendDirection: 1, calculatedAt: -1 | Compound | Trend analysis |

**Collection: usersavingssummaries**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId | userId: 1 | Unique | User summary |
| totalSavings | totalSavings: -1 | Single | Top savers |
| thisMonth | thisMonth: -1 | Single | Monthly ranking |
| transactionCount | transactionCount: -1 | Single | Activity ranking |

**Collection: aml_alerts**
| Index | Fields | Type | Notes |
|-------|--------|------|-------|
| userId_createdAt | userId: 1, createdAt: -1 | Compound | User alerts |
| status_createdAt | status: 1, createdAt: -1 | Compound | Status tracking |
| severity_createdAt | severity: 1, createdAt: -1 | Compound | Severity filtering |
| type_createdAt | type: 1, createdAt: -1 | Compound | Type filtering |

---

## PART 2: INDEX ISSUES

### 2.1 CRITICAL ISSUES

| SEVERITY | FILE | SCHEMA | ISSUE | RECOMMENDATION |
|----------|------|--------|-------|----------------|
| **CRITICAL** | `rez-wallet-service/src/models/Wallet.ts` | Wallet | Lines 172-175: Indexes reference `transactions` field that does NOT exist in the schema. These indexes will never be used and waste space. | Remove indexes at lines 172-175, or add the transactions array field to the schema. |
| **CRITICAL** | `rez-wallet-service/src/models/Wallet.ts` | Wallet | No index on `currency` field despite multiple currency values ('REZ_COIN', 'RC', 'NC', 'INR'). Queries filtering by currency will perform collection scans. | Add index: `{ currency: 1 }` |
| **CRITICAL** | `rez-order-service/src/models/Order.ts` | Order | Schema uses `strict: false` but indexes reference fields that may not exist in all documents. Fields like `merchant`, `payment.id` may cause index on undefined values. | Add `partialFilterExpression` or document validation. |
| **CRITICAL** | Multiple schemas | Various | No text indexes for full-text search on product names, descriptions, or user search queries. | Add text indexes on searchable fields. |
| **CRITICAL** | `rez-wallet-service/src/models/Wallet.ts` | Wallet | No index on `statistics.transactionCount` for queries like "users with X transactions". | Add index: `{ 'statistics.transactionCount': -1 }` |

---

### 2.2 HIGH PRIORITY ISSUES

| SEVERITY | FILE | SCHEMA | ISSUE | RECOMMENDATION |
|----------|------|--------|-------|----------------|
| **HIGH** | `migrations/001_indexes.js` | orders | Duplicate index: `merchantId + status` exists twice (lines 4 and 29). Wastes storage and slows writes. | Drop duplicate: `db.orders.dropIndex('merchantId_1_status_1')` |
| **HIGH** | `rez-wallet-service/src/models/Wallet.ts` | Wallet | No compound index for `isActive: 1, isFrozen: 1` combination. Common query pattern for active non-frozen wallets. | Add: `WalletSchema.index({ isActive: 1, isFrozen: 1 })` |
| **HIGH** | `rez-order-service/src/models/Order.ts` | Order | No index on `totals.total` for amount-based queries (e.g., "orders over 1000"). | Add: `OrderSchema.index({ 'totals.total': 1 })` |
| **HIGH** | `rez-payment-service/src/models/Payment.ts` | Payment | Index on `createdAt: -1` exists but `updatedAt: -1` also exists. No compound index for date range queries with status. | Add: `PaymentSchema.index({ createdAt: 1, status: 1 })` |
| **HIGH** | `rez-user-intelligence-service/src/models/UserProfile.ts` | UserProfile | Index on `engagementMetrics.lastSessionAt` exists but no compound index for `lastSessionAt + behavioralScores.churnRisk` (common for re-engagement campaigns). | Add: `{ engagementMetrics.lastSessionAt: -1, 'behavioralScores.churnRisk': 1 }` |
| **HIGH** | `rez-wallet-service/src/models/LedgerEntry.ts` | LedgerEntry | No index on `metadata.idempotencyKey` alone. Used for idempotency checks but only compound index exists. | Add: `LedgerEntrySchema.index({ 'metadata.idempotencyKey': 1 }, { sparse: true })` |
| **HIGH** | `rez-auth-service/src/models/User.ts` | User | No index on `role` field for admin queries filtering by user role. | Add: `UserSchema.index({ role: 1 })` |
| **HIGH** | `rez-wallet-service/src/models/CoinTransaction.ts` | CoinTransaction | No index on `coinType` alone (only compound with user). Direct coin type queries will scan. | Add: `CoinTransactionSchema.index({ coinType: 1 })` |

---

### 2.3 MEDIUM PRIORITY ISSUES

| SEVERITY | FILE | SCHEMA | ISSUE | RECOMMENDATION |
|----------|------|--------|-------|----------------|
| **MEDIUM** | `rez-user-intelligence-service/src/models/UserProfile.ts` | UserProfile | No index on `preferences.dietaryRestrictions` for dietary-based filtering. | Add: `{ 'preferences.dietaryRestrictions': 1 }` |
| **MEDIUM** | `rez-user-intelligence-service/src/models/UserProfile.ts` | UserProfile | No index on `behaviorPatterns.preferredPaymentMethod` for payment analytics. | Add: `{ 'behaviorPatterns.preferredPaymentMethod': 1 }` |
| **MEDIUM** | `rez-payment-service/src/models/Payment.ts` | Payment | No index on `gateway` field for gateway-specific queries. | Add: `PaymentSchema.index({ gateway: 1 })` |
| **MEDIUM** | `rez-wallet-service/src/models/CoinTransaction.ts` | CoinTransaction | Index on `type` exists but `coinType` alone is not indexed. Consider dropping single `type` index if compound `user_type_createdAt` is used. | Review and consolidate if `user_type_createdAt` covers all queries. |
| **MEDIUM** | `rez-order-service/src/models/Order.ts` | Order | Index on `payment.status` exists but no index on `delivery.status` for delivery tracking. | Add: `OrderSchema.index({ 'delivery.status': 1 })` |
| **MEDIUM** | `rez-streak-service/src/models/UserStreak.ts` | UserStreak | No index on `currentStreak` alone for leaderboard queries without streakActive filter. | Add: `UserStreakSchema.index({ currentStreak: -1 })` |
| **MEDIUM** | `migrations/001_indexes.js` | products | Text index on `name` and `description` exists but not on `tags` which is commonly searched. | Update text index to include tags. |
| **MEDIUM** | `rez-wallet-service/src/models/Wallet.ts` | Wallet | No index on `savingsInsights.thisMonth` for monthly savings leaderboards. | Add: `{ 'savingsInsights.thisMonth': -1 }` |
| **MEDIUM** | `rez-wallet-service/src/models/MerchantWallet.ts` | MerchantWallet | No index on `balance.available` for settlement queries. | Add: `MerchantWalletSchema.index({ 'balance.available': -1 })` |
| **MEDIUM** | `rez-user-intelligence-service/src/models/UserProfile.ts` | UserProfile | No index on `inferredDemographics.inferredLocation.city` for geographic segmentation. | Add: `{ 'inferredDemographics.inferredLocation.city': 1 }` |
| **MEDIUM** | `rez-payment-service/src/models/Payment.ts` | Payment | No index on `paymentMethod` for payment method analytics. | Add: `PaymentSchema.index({ paymentMethod: 1 })` |
| **MEDIUM** | `rez-auth-service/src/models/User.ts` | User | No index on `isSuspended` for suspended user queries. | Add: `UserSchema.index({ isSuspended: 1 })` |

---

### 2.4 LOW PRIORITY ISSUES

| SEVERITY | FILE | SCHEMA | ISSUE | RECOMMENDATION |
|----------|------|--------|-------|----------------|
| **LOW** | `rez-user-intelligence-service/src/models/UserProfile.ts` | UserProfile | No TTL index on `lifetimeValue.lastCalculatedAt` for stale LTV data. | Consider adding TTL if LTV data becomes stale. |
| **LOW** | `rez-wallet-service/src/models/LedgerEntry.ts` | LedgerEntry | Index on `yearMonth` alone exists but compound `yearMonth_accountType` may cover most queries. | Review usage and potentially drop single field index. |
| **LOW** | `rez-wallet-service/src/models/Wallet.ts` | Wallet | Index on `isActive` exists but also `isActive_balance`. Consider if single field index is needed. | Keep single field for status-only queries; drop if not used. |
| **LOW** | `rez-order-service/src/models/Order.ts` | Order | Index on `_id` (line 106) is redundant as MongoDB always indexes `_id`. | Remove redundant index. |
| **LOW** | `rez-user-intelligence-service/src/models/UserIntelligence.ts` | UserIntelligence | Schema has `preferences` subdocument but only indexes on `segments`. Missing indexes on `preferences.cuisines`, `preferences.dietary`. | Add: `userIntelligenceSchema.index({ 'preferences.cuisines': 1 })` |
| **LOW** | `rez-wallet-service/src/models/CoinTransaction.ts` | CoinTransaction | No index on `balanceAfter` for balance-range queries. | Consider adding if balance-based queries are needed. |

---

## PART 3: MISSING COMPOUND INDEXES

The following compound indexes are recommended for common query patterns:

| SEVERITY | SCHEMA | COMPOUND INDEX | QUERY PATTERN |
|----------|--------|----------------|---------------|
| **HIGH** | Order | `{ user: 1, status: 1, createdAt: -1 }` | User orders by status over time |
| **HIGH** | Order | `{ store: 1, status: 1, createdAt: -1 }` | Store orders by status |
| **HIGH** | Payment | `{ user: 1, paymentMethod: 1, createdAt: -1 }` | User payments by method |
| **HIGH** | Wallet | `{ isActive: 1, isFrozen: 1, 'balance.total': -1 }` | Active non-frozen wallets sorted by balance |
| **MEDIUM** | CoinTransaction | `{ user: 1, status: 1, coinType: 1 }` | User coin transactions by status |
| **MEDIUM** | UserProfile | `{ 'metadata.segments': 1, 'behavioralScores.churnRisk': 1 }` | Users by segment and churn risk |
| **MEDIUM** | LedgerEntry | `{ accountType: 1, coinType: 1, createdAt: -1 }` | Ledger by type and coin |
| **MEDIUM** | Order | `{ user: 1, 'totals.total': 1 }` | User orders by amount |

---

## PART 4: UNIQUE INDEX RECOMMENDATIONS

| SEVERITY | SCHEMA | FIELD | REASON |
|----------|--------|-------|--------|
| **HIGH** | MerchantWallet | `{ merchant: 1, store: 1 }` | One wallet per merchant per store |
| **HIGH** | LedgerEntry | `{ referenceId: 1, referenceModel: 1 }` | Unique reference per model |
| **MEDIUM** | UserProfile | `{ userId: 1, 'metadata.source': 1 }` | One profile per source per user |
| **MEDIUM** | SavingsGoal | `{ userId: 1, category: 1 }` | One goal per category per user |

---

## PART 5: REDUNDANT INDEXES

The following indexes should be reviewed for removal:

| INDEX | LOCATION | REASON |
|-------|----------|--------|
| `_id: 1` | Order.ts:106 | MongoDB always indexes `_id` by default |
| `isActive: 1` | Wallet.ts:167 | May be redundant if `user_isActive` covers queries |
| `type: 1` | CoinTransaction.ts:77 | May be redundant if `user_type_createdAt` covers queries |
| `createdAt: 1` | Migration users | May not be used without filtering |

---

## PART 6: SUMMARY OF RECOMMENDATIONS

### Immediate Actions (Critical)

1. **Fix broken Wallet indexes** - Remove or implement `transactions` field indexes
2. **Add currency index** to Wallet schema
3. **Add transactionCount index** to Wallet schema
4. **Drop duplicate merchant+status index** from migration

### Short-term (High Priority)

1. Add compound indexes for common query patterns
2. Add missing unique indexes
3. Add role/isSuspended indexes to User schema
4. Add paymentMethod and gateway indexes to Payment schema
5. Add dietary and payment preference indexes to UserProfile

### Medium-term (Medium Priority)

1. Review and consolidate redundant indexes
2. Add text indexes for search functionality
3. Add geospatial indexes where applicable
4. Add partial indexes for filtered queries

---

## APPENDIX: INDEX COUNTS BY SERVICE

| Service | Schema Files | Total Indexes |
|---------|-------------|---------------|
| rez-wallet-service | 5 | 35+ |
| rez-user-intelligence-service | 2 | 22+ |
| rez-payment-service | 1 | 15+ |
| rez-order-service | 1 | 13+ |
| rez-intelligence-hub | 1 | 10+ |
| rez-auth-service | 1 | 2+ |
| rez-streak-service | 1 | 3+ |
| migrations | 1 | 20+ |
| **TOTAL** | **13** | **120+** |

---

**Audit Completed By:** Agent 17 - Database Index Specialist
**Report Location:** `/Users/rejaulkarim/Documents/ReZ Full App/AUDITS/AGENT_17_DATABASE_INDEX_AUDIT.md`
