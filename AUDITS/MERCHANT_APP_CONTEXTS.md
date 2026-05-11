# Merchant App Context Audit Report

**Audit Date:** 2026-05-08
**Scope:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/contexts/` and `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/src/contexts/`

---

## 1. Context Inventory

| Context | Location | Size | Purpose |
|---------|----------|------|---------|
| **AuthContext** | `contexts/AuthContext.tsx` | 7.8KB | Login/logout, session, permissions |
| **StoreContext** | `contexts/StoreContext.tsx` | 13KB | Multi-store management, active store |
| **MerchantContext** | `contexts/MerchantContext.tsx` | 11.4KB | Products, orders, cashback, analytics |
| **TeamContext** | `contexts/TeamContext.tsx` | 26.8KB | Team members, roles, invitations |
| **NotificationContext** | `contexts/NotificationContext.tsx` | 6.6KB | Unread notifications, real-time |
| **OnboardingContext** | `contexts/OnboardingContext.tsx` | 26.5KB | 5-step merchant onboarding wizard |
| **PreferencesContext** | `contexts/PreferencesContext.tsx` | 15.7KB | UI preferences, persistence |
| **AuditFilterContext** | `contexts/AuditFilterContext.tsx` | 8.2KB | Audit log filtering state |
| **CopilotContext** | `contexts/CopilotContext.tsx` | 13.1KB | AI insights, demand signals |
| **SocketContext** | `src/contexts/SocketContext.tsx` | 11.9KB | WebSocket management, typed subscriptions |
| **SocketContext** | `contexts/SocketContext.tsx` | 4.6KB | Duplicate, simpler WebSocket wrapper |

**Total Contexts:** 11 (2 are duplicates of SocketContext)

---

## 2. Critical Issues

### 2.1 Broken Dynamic Import in SocketContext

**File:** `src/contexts/SocketContext.tsx`
**Lines:** 74-82

```typescript
function useMerchantId(): string | null {
  // Try to get from AuthContext if available
  try {
    const { useAuth } = require('@/contexts/AuthContext');  // BROKEN
    const { state } = useAuth();
    return state.merchant?.id || state.merchantId || null;
  } catch {
    return null;
  }
}
```

**Problems:**
- Uses `require()` instead of static ES import
- `@/contexts/AuthContext` does not exist in `src/` - AuthContext is at `contexts/AuthContext.tsx`
- This function will always return `null` silently, breaking auto-connect functionality
- Should use `import { useAuth } from '@/contexts/AuthContext'` but with proper path alias

**Fix Required:** Either:
1. Move SocketContext to `contexts/` and import properly
2. Fix path alias to point to correct location

### 2.2 Duplicate SocketContext Files

| Location | Size | Status |
|----------|------|--------|
| `src/contexts/SocketContext.tsx` | 11.9KB | **Complete**, typed subscriptions, 5 custom hooks |
| `contexts/SocketContext.tsx` | 4.6KB | **Minimal**, basic wrapper |

**Recommendation:** Delete the minimal duplicate at `contexts/SocketContext.tsx` and use the comprehensive `src/` version.

### 2.3 Missing Zustand Store Discovery

The `package.json` shows `zustand@5.0.12` is installed, but no Zustand stores were found in the codebase. The app uses React Context for all state management despite having a dedicated state management library available.

**Recommendation:** Consider migrating complex contexts (TeamContext, MerchantContext) to Zustand for better performance and testability.

---

## 3. Performance Issues

### 3.1 Unmemoized Context Values

**Affected Contexts:**

| Context | Line | Issue |
|---------|------|-------|
| `MerchantContext` | 314-327 | `value` object recreated every render |
| `NotificationContext` | 165-172 | `value` object recreated every render |
| `AuditFilterContext` | 257-286 | Only partially memoized |

**Correct Pattern (used in PreferencesContext):**
```typescript
const value = useMemo<ContextType>(
  () => ({ /* ... */ }),
  [/* dependencies */]
);
```

### 3.2 Unnecessary State Mutations in Reducers

**MerchantContext Line 295-301:**
```typescript
const payload = response.data;
const analyticsData = {
  totalRevenue: payload?.revenue?.total || 0,
  // ...
};
dispatch({ type: 'SET_ANALYTICS', payload: analyticsData });
```
**Issue:** `analyticsData` computed inline instead of derived. Consider using selectors.

### 3.3 No React Query Cache Sync

**Contexts missing cache invalidation:**

| Context | Operations | Missing |
|---------|-----------|---------|
| `MerchantContext` | Products, Orders, Cashback | `queryClient.invalidateQueries()` |
| `NotificationContext` | Mark read, delete | Only partial sync |
| `OnboardingContext` | Step submission | No cache management |

---

## 4. Architectural Issues

### 4.1 Context Hierarchy Violations

```
CopilotContext
  ├── depends on AuthContext
  └── depends on StoreContext

TeamContext
  └── depends on AuthContext

NotificationContext
  └── depends on AuthContext
```

**Issue:** No explicit provider nesting requirements documented. If providers are not wrapped correctly, runtime errors occur.

**Missing:** No root `AppProviders` component that ensures correct ordering.

### 4.2 Inconsistent Hook Naming

| Context | Export Name | Expected |
|---------|-------------|----------|
| `AuthContext` | `useAuth()` | `useAuth()` |
| `StoreContext` | `useStore()` | `useStore()` |
| `TeamContext` | `useTeamContext()` | `useTeam()` |
| `MerchantContext` | `useMerchant()` | `useMerchant()` |
| `NotificationContext` | `useNotificationContext()` | `useNotifications()` |
| `AuditFilterContext` | `useAuditFilters()` | `useAuditFilters()` |
| `CopilotContext` | `useCopilot()` | `useCopilot()` |

**Inconsistent:** `TeamContext` and `NotificationContext` use verbose names while others use concise names.

### 4.3 Silent Failures in Async Operations

**OnboardingContext (Line 398-423):**
```typescript
try {
  const status = await onboardingService.getOnboardingStatus();
  dispatch({ type: 'INIT_SUCCESS', payload: status });
} catch (error) {
  // Fallback to AsyncStorage silently
  const cachedState = await storageService.get<OnboardingStatus>(STORAGE_KEY);
}
```
**Issue:** If both API and cache fail, the error is swallowed. No error state set.

### 4.4 Missing Cancellation in Async Effects

**CopilotContext (Line 135-227):**
```typescript
const loadData = useCallback(async () => {
  const results = await Promise.allSettled([...11 API calls]);
  // No abort controller, no cancellation
}, []);
```

**Issue:** If merchant changes during loading, stale data may be set after newer request completes.

---

## 5. Security Concerns

### 5.1 OnboardingContext - Good Example of Redaction

**Lines 43-67:** Correctly redacts sensitive fields (accountNumber, PAN, Aadhaar) before AsyncStorage persistence.

**MA-SEC-010 Fix Applied:** Proper sensitive data redaction implemented.

### 5.2 Missing Error Boundaries

No context has error boundaries. If API call fails during provider initialization, entire component tree crashes.

---

## 6. State Management Issues

### 6.1 State Not Reset on Logout

**PreferencesContext (Intentional):**
```typescript
// Note: We do NOT clear preferences on logout
```
This is documented but could cause UX issues if merchant switches accounts on same device.

### 6.2 Stale Closure Risks

**MerchantContext (Line 151-163):**
```typescript
const loadProducts = async () => {
  dispatch({ type: 'SET_LOADING', payload: true });
  try {
    const response = await productsService.getProducts();
    // State updates happen after await
  }
};
```

Functions defined as `async () => {}` without `useCallback` may capture stale closures.

### 6.3 Optimistic Updates Without Rollback

**TeamContext - updateMemberRole (Line 589-637):**
```typescript
} catch (error: unknown) {
  logger.error('[TeamContext] updateMemberRole failed:', error);
  // No rollback dispatch here
  throw error;
}
```

Contrast with `inviteMember` (Line 575-580) which correctly rolls back.

---

## 7. Missing Functionality

### 7.1 No Global AppProviders Component

**Missing:** No centralized provider composition component:
```typescript
// Should exist
export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <StoreProvider>
        <TeamProvider>
          <NotificationProvider>
            {/* ... rest of providers */}
          </NotificationProvider>
        </TeamProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
```

### 7.2 No Context DevTools

No development mode warnings or debug helpers for context state inspection.

### 7.3 No Type-Safe Selectors

**Current Pattern:**
```typescript
const { state } = useMerchant();
// Then access state.products, state.orders, etc.
```

**Missing:** Selector pattern for granular subscriptions:
```typescript
const products = useMerchantSelector(s => s.products);
```

### 7.4 No Loading State Per-Operation

**MerchantContext:**
```typescript
const [isLoading, setIsLoading] = useState(true); // Single loading state
```

**Missing:** Separate loading states per operation:
```typescript
isLoadingProducts: boolean;
isLoadingOrders: boolean;
isSubmittingOrder: boolean;
```

---

## 8. Testing Gaps

### 8.1 No Context Unit Tests

Only `contexts/__tests__/` folder exists with no files inside.

### 8.2 No Mock Patterns

No provided examples of how to mock contexts in component tests.

---

## 9. Recommendations Priority Matrix

| Priority | Issue | Context | Effort |
|----------|-------|---------|--------|
| **P0** | Broken require() in SocketContext | SocketContext | Low |
| **P0** | Delete duplicate SocketContext | SocketContext | Trivial |
| **P1** | Add `useMemo` to MerchantContext value | MerchantContext | Low |
| **P1** | Fix TeamContext updateMemberRole rollback | TeamContext | Low |
| **P1** | Create AppProviders component | All | Medium |
| **P2** | Rename hooks to consistent pattern | Team, Notification | Low |
| **P2** | Add React Query cache sync | Merchant, Notification | Medium |
| **P2** | Add selectors pattern | All | Medium |
| **P3** | Consider Zustand migration | Team, Merchant | High |
| **P3** | Add error boundaries | All | Medium |
| **P3** | Add unit tests | All | High |

---

## 10. Summary Scores

| Metric | Score | Notes |
|--------|-------|-------|
| **Code Quality** | 7/10 | Good patterns in newer contexts, tech debt in older ones |
| **Type Safety** | 9/10 | Well-typed interfaces, some `any` usage in OnboardingContext |
| **Performance** | 6/10 | Missing memoization, no selectors |
| **Error Handling** | 6/10 | Silent failures in some contexts |
| **Testing** | 2/10 | No test coverage |
| **Documentation** | 8/10 | JSDoc comments present, well-structured |
| **Security** | 8/10 | Good redaction in OnboardingContext |
| **Architecture** | 6/10 | Works but inconsistent patterns |

**Overall Score: 6.5/10**

---

## Appendix: File Paths

```
/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/
├── contexts/
│   ├── AuthContext.tsx
│   ├── StoreContext.tsx
│   ├── MerchantContext.tsx
│   ├── TeamContext.tsx
│   ├── NotificationContext.tsx
│   ├── OnboardingContext.tsx
│   ├── PreferencesContext.tsx
│   ├── AuditFilterContext.tsx
│   ├── CopilotContext.tsx
│   ├── SocketContext.tsx (DUPLICATE)
│   └── auth/
│       ├── useAuthSession.ts
│       └── useAuthPermissions.ts
└── src/
    └── contexts/
        └── SocketContext.tsx (PRIMARY)
```
