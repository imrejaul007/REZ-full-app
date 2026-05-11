# Karma and Gamification Code Review Report

**Review Date:** 2026-05-08
**Reviewer:** Code Review Agent
**Files Reviewed:** 18 files

---

## Executive Summary

The Karma and Gamification system is well-structured with clear separation between frontend (Next.js) and backend (Node.js/Mongoose) services. The code demonstrates good practices in some areas but has several issues requiring attention.

**Overall Assessment:** Needs Improvement

---

## Files Reviewed

### Frontend Components (rez-karma-app)

| File | Status |
|------|--------|
| `src/app/karma/dashboard.tsx` | Reviewed |
| `src/components/KarmaLevelCard.tsx` | Reviewed |
| `src/components/TierProgress.tsx` | Reviewed |
| `src/hooks/useKarmaProfile.ts` | Reviewed |
| `src/app/karma/leaderboard/page.tsx` | Reviewed |
| `src/lib/karmaApi.ts` | Reviewed |
| `src/types/karma.ts` | Reviewed |

### Backend Services (rez-karma-service)

| File | Status |
|------|--------|
| `src/models/KarmaProfile.ts` | Reviewed |
| `src/models/Challenge.ts` | Reviewed |
| `src/models/SocialShare.ts` | Reviewed |
| `src/models/ShareLog.ts` | Reviewed |
| `src/models/Notification.ts` | Reviewed |
| `src/services/leaderboardService.ts` | Reviewed |
| `src/services/streakService.ts` | Reviewed |
| `src/services/challengeService.ts` | Reviewed |
| `src/services/karmaNotificationService.ts` | Reviewed |
| `src/services/notificationService.ts` | Reviewed |

---

## Issues Found

### 1. TypeScript Type Checking Disabled

**Severity:** High
**Files Affected:** All backend service files

**Issue:** Files use `@ts-nocheck` and `@ts-ignore` directives, disabling type checking.

```typescript
// @ts-nocheck
// @ts-ignore
import mongoose, { Schema, Document, Model } from 'mongoose';
```

**Recommendation:** Remove `@ts-nocheck` and `@ts-ignore` directives. Add proper TypeScript types to all functions and variables. This is a significant technical debt issue.

---

### 2. Missing Leaderboard Routes File

**Severity:** Medium
**File:** `src/routes/leaderboardRoutes.ts`

**Issue:** The original path `src/routes/leaderboardRoutes.ts` does not exist. Leaderboard functionality is implemented in `leaderboardService.ts` but there are no corresponding routes.

**Recommendation:** Create `leaderboardRoutes.ts` to expose leaderboard endpoints, or verify if leaderboard routes are defined elsewhere (e.g., in `karmaRoutes.ts`).

---

### 3. Missing Badge Model and Service

**Severity:** Medium
**Files:** `src/models/Badge.ts`, `src/services/badgeService.ts`

**Issue:** The specified files for Badge model and service do not exist. Badge functionality appears to be handled via the `IBadge` interface embedded in `KarmaProfile.ts`.

```typescript
// In KarmaProfile.ts
export interface IBadge {
  id: string;
  name: string;
  icon?: string;
  earnedAt: Date;
}
```

**Recommendation:** Create dedicated `Badge.ts` model and `badgeService.ts` for better separation of concerns and maintainability.

---

### 4. Missing Social Share Service

**Severity:** Medium
**File:** `src/services/socialShareService.ts`

**Issue:** The specified social share service file does not exist. Only the models (`SocialShare.ts`, `ShareLog.ts`) exist.

**Recommendation:** Create `socialShareService.ts` to handle share operations, karma bonus awards, and daily share limits.

---

### 5. Aggregation Pipeline Error in LeaderboardService

**Severity:** High
**File:** `src/services/leaderboardService.ts`
**Lines:** 314-318

```typescript
const totalCount = result[0]?.totalCount[0]?.count ?? 0;
const profiles = result[0]?.entries ?? [];
```

**Issue:** The aggregation pipeline (lines 283-312) does not include `$facet` to create both `entries` and `totalCount` in the same query. The code assumes `result[0]` contains both, but the pipeline only returns profiles.

**Recommendation:** Add `$facet` to the aggregation pipeline:

```typescript
const pipeline: mongoose.PipelineStage[] = [
  { $match: query },
  {
    $facet: {
      entries: [
        { $sort: { [sortField]: sortOrder } },
        { $skip: offset },
        { $limit: effectiveLimit },
        // ... rest of pipeline
      ],
      totalCount: [
        { $count: 'count' }
      ]
    }
  }
];
```

---

### 6. API Validation Missing in ChallengeService

**Severity:** Medium
**File:** `src/services/challengeService.ts`
**Lines:** 27-43

```typescript
export async function createChallenge(data: Partial<IChallenge>): Promise<ChallengeDocument> {
  const challenge = new Challenge({
    name: data.name,
    description: data.description,
    type: data.type,
    // ...
  });
  // No validation of required fields
  await challenge.save();
```

**Issue:** No validation that required fields (`name`, `description`, `type`, `goal`, `reward`) are present before creating the challenge. Schema defaults will handle some cases, but business logic validation is missing.

**Recommendation:** Add validation before creating the challenge:

```typescript
if (!data.name || !data.description || !data.type || !data.goal || !data.reward) {
  throw new Error('Missing required fields: name, description, type, goal, reward');
}
```

---

### 7. Security: FCM Server Key in Header

**Severity:** High
**File:** `src/services/notificationService.ts`
**Lines:** 127-129

```typescript
headers: {
  'Content-Type': 'application/json',
  Authorization: `key=${process.env.FCM_SERVER_KEY}`,
},
```

**Issue:** FCM server key is being passed in the Authorization header. While the key is stored in an environment variable, the Authorization header format should use `Bearer` token scheme, not `key=` prefix for FCM.

**Recommendation:** Use the correct FCM Authorization header format or ensure this matches Firebase documentation exactly. The current approach may work but verify against current FCM API documentation.

---

### 8. Leaderboard Service: Missing User Population for Cause Scope

**Severity:** Medium
**File:** `src/services/leaderboardService.ts`
**Lines:** 275-280

```typescript
// Scope-specific filters
if (scope === 'cause') {
  // For cause leaderboard, we don't filter here - we group by top cause in aggregation
  // This is a simplified implementation; full cause leaderboard uses category aggregation
}
// Note: 'city' scope requires city field on KarmaProfile which is not currently available.
```

**Issue:** Both `cause` and `city` scopes are not fully implemented. The code explicitly documents this limitation.

**Recommendation:** Either implement proper cause/city filtering or return an error when these scopes are requested, rather than silently falling back to global ranking.

---

### 9. LeaderboardService: Race Condition in Cache Invalidation

**Severity:** Low
**File:** `src/services/leaderboardService.ts`
**Lines:** 442-461

```typescript
export async function invalidateCache(): Promise<void> {
  try {
    // ...
    if (keysToDelete.length > 0) {
      await redis.del(...keysToDelete);
    }
  }
}
```

**Issue:** If `redis.del` fails for one key, the entire operation may not complete. No transaction or partial success handling.

**Recommendation:** Consider using Redis pipeline for atomic deletion or log individual key deletion failures.

---

### 10. Hardcoded Default Fallback Secret

**Severity:** Medium
**File:** `src/lib/karmaApi.ts`
**Line:** 15

```typescript
const TOKEN_DERIV_SECRET = process.env.NEXT_PUBLIC_TOKEN_DERIV_SECRET || 'karma-app-deriv-secret-change-in-production';
```

**Issue:** A fallback secret is hardcoded. If the environment variable is missing, the app will use an insecure default.

**Recommendation:** Throw an error if the environment variable is missing in production:

```typescript
const TOKEN_DERIV_SECRET = process.env.NEXT_PUBLIC_TOKEN_DERIV_SECRET;
if (!TOKEN_DERIV_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_TOKEN_DERIV_SECRET is required in production');
}
```

---

### 11. Empty Catch Blocks

**Severity:** Low
**File:** `src/hooks/useKarmaProfile.ts`
**Lines:** 47-48

```typescript
} catch {
  setIsError(true);
} finally {
```

**Issue:** Errors are silently caught without logging. This makes debugging difficult.

**Recommendation:** Log the error for debugging purposes:

```typescript
} catch (err) {
  console.error('Failed to fetch karma profile:', err);
  setIsError(true);
}
```

---

### 12. Leaderboard Page: Silent Error Handling

**Severity:** Low
**File:** `src/app/karma/leaderboard/page.tsx`
**Lines:** 105-116

```typescript
try {
  // ...
} catch { /* silent */ }
finally { setLoading(false); }
```

**Issue:** Errors are silently caught without user feedback or logging.

**Recommendation:** Show a user-friendly error message or log for debugging.

---

### 13. MongoDB ObjectId Validation Inconsistency

**Severity:** Low
**Files:** Multiple service files

**Issue:** Some functions validate ObjectId with `mongoose.Types.ObjectId.isValid()` while others assume valid input.

**Recommendation:** Create a utility function for consistent ObjectId validation across all services.

---

### 14. ShareLog Karma Award Logic Missing

**Severity:** Medium
**File:** `src/models/ShareLog.ts`

**Issue:** The ShareLog model tracks `karmaAwarded` and `bonusRejected` but there's no service implementing the karma bonus award logic for social shares.

**Recommendation:** Implement the social share service to award karma bonuses and enforce daily limits.

---

### 15. TTL Index Without Service Implementation

**Severity:** Low
**File:** `src/models/SocialShare.ts`
**Line:** 63

```typescript
// TTL index to auto-delete expired shares
SocialShareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

**Issue:** TTL index is defined but there's no service that creates shares with proper `expiresAt` values.

**Recommendation:** Ensure the social share service properly sets `expiresAt` when creating share records.

---

## Security Concerns

| Issue | Severity | Location |
|-------|----------|----------|
| FCM Server Key handling | Medium | notificationService.ts:128 |
| Hardcoded encryption fallback secret | Medium | karmaApi.ts:15 |
| No input sanitization in share data | Low | SocialShare.ts |
| Missing authorization checks | Medium | All service files |

---

## Code Quality Notes

### Positives

1. **Good Type Definitions:** Frontend types in `karma.ts` are well-structured
2. **Proper Error Handling:** Most services use try-catch blocks
3. **Logging:** Uses centralized logger instead of console.log
4. **Redis Caching:** Leaderboard service implements caching with TTL
5. **Index Creation:** Proper MongoDB indexes for query performance
6. **Fire-and-Forget Pattern:** Notifications use non-blocking patterns correctly

### Areas for Improvement

1. **TypeScript Discipline:** Extensive use of `@ts-nocheck` undermines type safety
2. **Consistent Validation:** No centralized input validation
3. **Error Messages:** Some errors are generic strings, not descriptive
4. **Test Coverage:** No test files found
5. **Documentation:** Inline comments are sparse in some areas

---

## Recommendations

### Priority 1 (Critical)

1. Remove `@ts-nocheck` and `@ts-ignore` directives from all backend files
2. Fix leaderboard aggregation pipeline to properly return totalCount
3. Address the hardcoded encryption fallback secret
4. Create missing badge and social share services

### Priority 2 (Important)

1. Implement proper cause/city leaderboard filtering or return errors
2. Add input validation to challengeService.createChallenge
3. Create leaderboardRoutes.ts or document where routes are defined
4. Add proper error logging in hooks

### Priority 3 (Nice to Have)

1. Create centralized ObjectId validation utility
2. Add test files for core services
3. Implement social share karma bonus awards
4. Add Redis pipeline for atomic cache invalidation

---

## Missing Files

The following files were specified in the review request but do not exist:

- `/rez-karma-service/src/routes/leaderboardRoutes.ts`
- `/rez-karma-service/src/models/Badge.ts`
- `/rez-karma-service/src/services/badgeService.ts`
- `/rez-karma-service/src/services/socialShareService.ts`

Please verify if these files should be created or if functionality is implemented elsewhere.

---

## Compliance Checklist

| Check | Status |
|-------|--------|
| TypeScript types correct | FAIL - @ts-nocheck used |
| Error handling implemented | PARTIAL - Some empty catch blocks |
| API validation done | PARTIAL - Missing in some services |
| Security considerations | PARTIAL - FCM key, hardcoded secret |
| No hardcoded values | FAIL - Hardcoded fallback secret |
| Proper imports | PASS |
| Code compiles | UNKNOWN - Type checking disabled |
| Follows existing patterns | PASS |

---

*Report generated by Code Review Agent*
