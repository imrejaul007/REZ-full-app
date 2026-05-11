# Merchant App Screens Audit Report

**Audit Date:** 2026-05-09
**Scope:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/app/`
**Platform:** expo-router (React Native/Expo)

---

## Executive Summary

The merchant app contains **90+ screen files** across multiple feature domains. Overall code quality is good with consistent error handling patterns, but several screens have missing error states, potential null pointer issues, and inconsistent error handling approaches.

---

## Screens Inventory

### Authentication (`app/(auth)/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| Login | `login.tsx` | Good | Complete - lockout, OTP, rate limiting |
| Register | `register.tsx` | Review | Partial |
| Forgot Password | `forgot-password.tsx` | Review | Partial |
| Layout | `_layout.tsx` | Good | N/A |

### Dashboard (`app/(dashboard)/`)
| Screen | File | Status | Notes |
|--------|------|--------|-------|
| Main Dashboard | `index.tsx` | Large file | Needs splitting |
| Products | `products.tsx` | Review | Missing error states |
| Orders | `orders.tsx` | Review | Missing error states |
| POS Shortcut | `pos-shortcut.tsx` | Good | Simple navigation |
| Team | `team.tsx` | Review | Partial |
| Analytics | `analytics.tsx` | Review | Missing error states |
| Layout | `_layout.tsx` | Good | Comprehensive |

### Point of Sale (`app/pos/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| POS Index | `index.tsx` | **Issues** | Missing error handling |
| Quick Bill | `quick-bill.tsx` | Review | Needs review |
| Offline Mode | `offline.tsx` | Review | Needs review |
| Recent Orders | `recent-orders.tsx` | Review | Needs review |

### Kitchen Display (`app/kds/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| KDS Index | `index.tsx` | Good | Comprehensive with socket fallback |
| Settings | `settings.tsx` | Review | Needs review |
| REZ Now Orders | `rez-now-orders.tsx` | Review | Needs review |

### Orders (`app/orders/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| Orders Index | `index.tsx` | **Missing** | File does not exist |
| Order Detail | `[id].tsx` | Review | Needs review |

### Khata (`app/khata/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| Khata Index | `index.tsx` | Good | Has error handling |
| Khata Add | `add.tsx` | Review | Partial |
| Khata Detail | `[customerId].tsx` | Review | Partial |

### Settlements (`app/settlements/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| Settlement Index | `index.tsx` | Good | Comprehensive |
| Settlement Detail | `[id].tsx` | Review | Partial |

### Notifications (`app/notifications/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| Notifications Index | `index.tsx` | Good | Comprehensive |
| Notification Detail | `[id].tsx` | Review | Partial |

### Hotel OS (`app/hotel/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| Hotel Index | `index.tsx` | **Issues** | Hardcoded mock data |
| Housekeeping | `housekeeping/index.tsx` | Review | Needs review |
| Channel Manager | `channel-manager/index.tsx` | Review | Needs review |
| Overview | `overview.tsx` | Review | Needs review |

### Staff Management (`app/staff/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| Staff Index | `index.tsx` | Good | Has error handling |
| Staff Add | `add.tsx` | Review | Partial |
| Staff Detail | `detail.tsx` | Review | Partial |

### Reports (`app/`)
| Screen | File | Status | Error Handling |
|--------|------|--------|---------------|
| Reports | `reports.tsx` | **Issues** | Hardcoded mock calculations |
| All Table Bookings | `all-table-bookings.tsx` | Review | Large file |
| Customer Push | `customer-push.tsx` | Review | Partial |
| Hotel OTA | `hotel-ota.tsx` | Review | Large file |
| Promotion Toolkit | `promotion-toolkit.tsx` | Review | Large file |
| QR Checkin | `qr-checkin.tsx` | Review | Partial |

### Additional Feature Screens
| Screen | File | Error Handling |
|--------|------|---------------|
| Campaigns | `campaigns/index.tsx` | Review needed |
| Habixo | `habixo/index.tsx` | **Issues** - Hardcoded mock data |
| Delivery | `delivery/index.tsx` | Review needed |
| Loyalty | `loyalty/index.tsx` | Review needed |
| Discounts | `discounts/index.tsx` | Review needed |
| Expenses | `expenses/index.tsx` | Review needed |
| Staff Shifts | `staff-shifts/index.tsx` | Review needed |
| Inventory | `inventory/index.tsx` | Review needed |
| Triggers | `triggers/index.tsx` | Review needed |
| Copilot | `copilot/index.tsx` | Review needed |

---

## Critical Issues Found

### 1. Missing `orders/index.tsx` File
**Severity:** High
**Location:** `app/orders/index.tsx`

The file does not exist but is referenced in `_layout.tsx`:
```tsx
<Stack.Screen name="orders" options={{ headerShown: false }} />
```

This will cause a runtime error when navigating to `/orders`.

### 2. Hardcoded Mock Data in Hotel Index
**Severity:** Medium
**Location:** `app/hotel/index.tsx`

```tsx
// Lines 117-129: Hardcoded stats
<View style={styles.statCard}>
  <Text style={styles.statValue}>78%</Text>  // Hardcoded
  <Text style={styles.statLabel}>Occupancy</Text>
</View>
```

No API integration - all data is hardcoded.

### 3. Hardcoded Mock Data in Habixo Dashboard
**Severity:** Medium
**Location:** `app/habixo/index.tsx`

```tsx
// Lines 8-27: Default mock profile
const DEFAULT_HOST_PROFILE = {
  name: 'Rahul Sharma',
  email: 'rahul@habixo.com',
  // ...
};

// Lines 69-70: Hardcoded HOST_ID
const HOST_ID = 'host_123';
```

### 4. Hardcoded Calculations in Reports
**Severity:** Medium
**Location:** `app/reports.tsx`

```tsx
// Lines 649-650: Mock COGS calculation
<Text style={styles.tabRowValue}>
  {formatCurrency((revenueReport?.summary?.grossRevenue ?? monthlyRevenue) * 0.4)}
</Text>
```

P&L tab uses hardcoded 40% COGS instead of real data.

---

## Missing Error Handling

### POS Screen (`app/pos/index.tsx`)
**Issues:**
1. No try-catch around `checkProductStock` API call error handling (line 143-156)
2. No error boundary around main component
3. Missing `productError` state handling in UI
4. No retry mechanism for failed API calls

### Hotel Screens
**Issues:**
1. No error handling around API calls
2. No loading states for async data
3. No offline detection
4. No retry functionality

### Reports Screen
**Issues:**
1. API failures silently ignored (lines 255-261)
2. Export failures show toast only (line 318-320)
3. No error boundary for chart rendering

---

## Potential Runtime Errors

### 1. Null Pointer in `reports.tsx`
```tsx
// Line 330
const todayRevenue = salesData.length > 0 ? salesData[salesData.length - 1].amount : 0;
// salesData can be undefined if Promise.allSettled partially fails
```

### 2. Undefined `apiOrder` in KDS
```tsx
// Line 798: String conversion on potentially undefined _id
orderNumber: apiOrder.orderNumber || String(apiOrder._id).slice(-6).toUpperCase(),
// apiOrder._id could be undefined
```

### 3. Missing Type Guard in Staff List
```tsx
// Line 306: No null check on staff item
keyExtractor={(item) => item._id || item.id || ''}
// Could cause duplicate keys
```

### 4. Unsafe Type Assertion in Login
```tsx
// Line 219: Type assertion without validation
await storageService.setMerchantData({
  id: response.merchant.id,
  // ...
} as any);  // Unchecked assertion
```

---

## Inconsistent Patterns

### Error Handling Approach
| Screen | Approach |
|--------|----------|
| Login | `platformAlertSimple`, lockout state |
| Khata | Uses `useAlert` hook + `Alert` component |
| POS | `console.error`, `platformAlertSimple` |
| KDS | `logger.error`, `Alert.alert` |
| Reports | `logger.warn`, toast messages |
| Staff | `showAlert`, `logger.error` |

**Recommendation:** Standardize on `useAlert` hook pattern across all screens.

### Loading States
| Screen | Loading Pattern |
|--------|-----------------|
| Most screens | `isLoading` state + ActivityIndicator |
| KDS | `isLoading` state + ActivityIndicator |
| Hotel | **None** - hardcoded data |

**Recommendation:** All data-fetching screens should show loading states.

---

## File Size Analysis

| File | Lines | Recommendation |
|------|-------|----------------|
| `_layout.tsx` | 554 | Split providers into separate file |
| `(dashboard)/_layout.tsx` | 650 | Split tab configuration |
| `pos/index.tsx` | 2009 | Split into smaller components |
| `reports.tsx` | 1077 | Split into tab components |
| `kds/index.tsx` | 1244 | Good modularization |
| `hotel-ota.tsx` | ~600 | Split into cards |
| `promotion-toolkit.tsx` | ~600 | Split into sections |

---

## Security Concerns

### 1. Sensitive Data in Storage
```tsx
// login.tsx line 199-220
await storageService.setUserData({
  id: response.user.id,
  email: response.user.email,
  phone: response.user.phone,
  // ...
});
```
**Issue:** Phone number stored without encryption consideration.

### 2. API Token Handling
```tsx
// kds/index.tsx line 919
const authToken = await storageService.getAuthToken();
// Token passed in socket auth - verify proper sanitization
```

### 3. URL Handling
```tsx
// _layout.tsx line 229-246: Deep link validation
function parseAndValidateUrl(url: string): string | null
```
**Good:** Properly validates and sanitizes URLs.

---

## Performance Observations

### 1. Missing Memoization
```tsx
// pos/index.tsx
const renderProduct = useCallback(...) // Good

// But many inline functions not memoized
onPress={() => handleAddItem(item)}
```

### 2. Unnecessary Re-renders
```tsx
// reports.tsx: Stats recalculated on every render
const avgOrderValue = totalOrders > 0 ? monthlyRevenue / totalOrders : 0;
```
**Fix:** Use `useMemo` for derived values.

### 3. Large List Without Optimization
```tsx
// Some FlatLists may benefit from getItemLayout
// or windowSize optimization
```

---

## Recommendations

### Priority 1 (Critical)
1. Create missing `app/orders/index.tsx` file
2. Add error boundaries to POS screen
3. Add null checks for API responses in KDS

### Priority 2 (High)
4. Replace hardcoded mock data in Hotel/Habixo with API integration
5. Standardize error handling pattern across all screens
6. Add loading states to Hotel feature screens

### Priority 3 (Medium)
7. Split large files (>500 lines)
8. Add `useMemo` for derived calculations
9. Implement proper TypeScript types instead of `any`

### Priority 4 (Low)
10. Consider React.memo for list item components
11. Add accessibility labels to interactive elements
12. Implement skeleton loading states

---

## Testing Checklist

- [ ] Navigation to `/orders` (currently broken)
- [ ] POS offline mode error handling
- [ ] KDS socket reconnection
- [ ] Reports export failure scenarios
- [ ] Hotel feature loading states
- [ ] Habixo data fetching fallback

---

## Appendix: File Locations

| Category | Directory |
|----------|-----------|
| Auth | `app/(auth)/` |
| Dashboard | `app/(dashboard)/` |
| POS | `app/pos/` |
| KDS | `app/kds/` |
| Orders | `app/orders/` |
| Khata | `app/khata/` |
| Settlements | `app/settlements/` |
| Notifications | `app/notifications/` |
| Hotel | `app/hotel/` |
| Staff | `app/staff/` |
| Reports | `app/reports.tsx` |
| Features | Various subdirectories |

---

**Audit Completed:** 2026-05-09
**Auditor:** Claude Code
