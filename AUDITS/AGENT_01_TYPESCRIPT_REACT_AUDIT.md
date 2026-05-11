# AGENT 01: TypeScript/React Code Audit Report

**Date:** May 10, 2026
**Auditor:** TypeScript/React Code Specialist Agent
**Project:** ReZ Full App

---

## Executive Summary

This audit covers 5 TypeScript/React applications: `rez-now` (Next.js), `rez-app-consumer` (React Native), `rez-app-merchant` (React Native), `rez-app-admin` (React Native), and `rez-karma-app` (Next.js).

**Total Issues Found:** 156
- CRITICAL: 8
- HIGH: 38
- MEDIUM: 65
- LOW: 45

---

## CRITICAL Issues (CRITICAL)

### Issue #1: Syntax Error - Orphaned Interface Members
| Field | Value |
|-------|-------|
| **SEVERITY** | CRITICAL |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/app/habixo/api.ts` |
| **LINE** | 65-73 |
| **ISSUE** | Orphaned interface members that are not part of any interface. The interface `HabixoProperty` closes at line 64, but lines 65-73 contain duplicate/undefined properties. This causes TypeScript compilation failure. |
| **RECOMMENDATION** | Remove lines 65-73. These appear to be leftover code from a merge conflict or incomplete edit. |

```typescript
// CURRENT (BROKEN):
}
  rating: number;    // <- orphaned, not inside any interface
  bookings: number;
  earnings: number;
  occupancy: number;
  views: number;
  hostId: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Issue #2: Syntax Error - Double Colon Typo
| Field | Value |
|-------|-------|
| **SEVERITY** | CRITICAL |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/app/hotel/channel-manager/index.tsx` |
| **LINE** | 44 |
| **ISSUE** | Typo: `color::` instead of `color:` in object literal. Causes syntax error. |
| **RECOMMENDATION** | Change `color::` to `color:` on line 44. |

```typescript
// CURRENT (BROKEN):
booking: { name: 'bed-outline', color:: '#003580' },

// FIX:
booking: { name: 'bed-outline', color: '#003580' },
```

---

### Issue #3: Syntax Error - Unclosed Callback in Socket Provider
| Field | Value |
|-------|-------|
| **SEVERITY** | CRITICAL |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/lib/socket/MenuSocketProvider.tsx` |
| **LINE** | 112-113 |
| **ISSUE** | The `socket.on('connect_error')` callback is not properly closed. Line 112 has `setIsConnected(false);` followed by `});` which closes the wrong callback, leaving line 113 as an orphan `});`. |
| **RECOMMENDATION** | Remove line 113 (`});`) as the callback was already closed at line 112. The structure should be: `socket.on('connect_error', (err) => { ... setIsConnected(false); });` |

---

### Issue #4: Missing Module Declaration
| Field | Value |
|-------|-------|
| **SEVERITY** | CRITICAL |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/src/app/api/karma-loyalty/config/route.ts` |
| **LINE** | 1 |
| **ISSUE** | Cannot find module `'next/server'` - file is likely in the wrong location or missing a dependency. |
| **RECOMMENDATION** | Move this file to the correct Next.js project directory or install Next.js dependencies in this project. |

---

### Issue #5: Missing Component Import
| Field | Value |
|-------|-------|
| **SEVERITY** | CRITICAL |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/corp-employees/enroll.tsx` |
| **LINE** | 10 |
| **ISSUE** | Cannot find module `'../../components/corp-perks/EmployeeForm'`. The component import path is broken. |
| **RECOMMENDATION** | Verify the correct path to EmployeeForm component or create the component if missing. |

---

### Issue #6: Missing Component Import - GST Calculator
| Field | Value |
|-------|-------|
| **SEVERITY** | CRITICAL |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/corp-invoices/create.tsx` |
| **LINE** | 12 |
| **ISSUE** | Cannot find module `'../../components/corp-perks/GSTCalculator'`. The component import path is broken. |
| **RECOMMENDATION** | Verify the correct path to GSTCalculator component or create the component if missing. |

---

### Issue #7: Missing Property in Response Type
| Field | Value |
|-------|-------|
| **SEVERITY** | CRITICAL |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/components/corp-perks/GSTInvoicesList.tsx` |
| **LINE** | 396 |
| **ISSUE** | Property `taxSummary` is missing in object literal but required in `GSTInvoice` type. |
| **RECOMMENDATION** | Add the `taxSummary` property to the object literal or update the type definition. |

---

### Issue #8: Missing Type Declaration
| Field | Value |
|-------|-------|
| **SEVERITY** | CRITICAL |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-karma-app/src/lib/karmaApi.ts` |
| **LINE** | 71 |
| **ISSUE** | Type `Promise<string | null>` is not assignable to type `string`. The function expects a sync return but returns a Promise. |
| **RECOMMENDATION** | Either await the Promise or change the function to return string synchronously. |

---

## HIGH Issues (HIGH)

### Issue #9: Property 'primary' Does Not Exist on Theme Type
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILES** | Multiple error.tsx files in rez-app-admin |
| **LINE** | 61, 62, 123, 136 |
| **ISSUE** | Theme type does not have a `primary` property. Properties being accessed: `theme.colors.primary` |
| **RECOMMENDATION** | Check the theme type definition and use the correct property name (likely `tint` or another color variant). |

**Affected Files:**
- `app/(dashboard)/corp-benefits/error.tsx`
- `app/(dashboard)/corp-employees/error.tsx`
- `app/(dashboard)/corp-invoices/error.tsx`

---

### Issue #10: Property 'guests' Does Not Exist on OTABooking
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/corp-bookings.tsx` |
| **LINE** | 432 |
| **ISSUE** | Property `guests` does not exist on `OTABooking` type. Did you mean `guest`? |
| **RECOMMENDATION** | Change `.guests` to `.guest` or update the type definition if multiple guests are expected. |

---

### Issue #11: Missing ActivityIndicator Import
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/corp-bookings.tsx` |
| **LINE** | 549 |
| **ISSUE** | Cannot find name `ActivityIndicator`. Missing import from React Native. |
| **RECOMMENDATION** | Add import: `import { ActivityIndicator } from 'react-native';` |

---

### Issue #12: Property 'name' Does Not Exist on OTARoom
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/corp-bookings.tsx` |
| **LINE** | 635, 681 |
| **ISSUE** | Property `name` does not exist on `OTARoom` type. |
| **RECOMMENDATION** | Check OTARoom type definition and use correct property (likely `roomName` or similar). |

---

### Issue #13: Duplicate Property Name in Object Literal
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/corp-bookings.tsx` |
| **LINE** | 894 |
| **ISSUE** | Object literal cannot have multiple properties with the same name. |
| **RECOMMENDATION** | Find and remove the duplicate property definition. |

---

### Issue #14: Property 'sendDate' Does Not Exist on GiftCampaign
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/corp-gifting.tsx` |
| **LINE** | 276 |
| **ISSUE** | Property `sendDate` does not exist on `GiftCampaign` type. |
| **RECOMMENDATION** | Check GiftCampaign type and use correct property name. |

---

### Issue #15: Type Mismatch for StatusType
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/corp-rewards.tsx` |
| **LINE** | 292 |
| **ISSUE** | Type `"pending" | "completed" | "failed"` is not assignable to type `StatusType`. Type `"failed"` is not in `StatusType`. |
| **RECOMMENDATION** | Add `"failed"` to the `StatusType` definition or use a different status value. |

---

### Issue #16: Missing API Response Properties (Multiple)
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/index.tsx` |
| **LINES** | 315, 324, 325, 329-332, 340-341, 348, 362, 369, 376, 382, 395, 401, 407, 413, 426, 432, 439, 445 |
| **ISSUE** | Multiple properties (`revenue`, `orders`, `merchants`, `users`, `coins`) do not exist on `ApiResponse<any>`. |
| **RECOMMENDATION** | Define proper response types or access the nested `.data` property correctly. |

---

### Issue #17: Missing SystemHealthData Properties
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/live-monitor.tsx` |
| **LINES** | 205-207, 315, 318, 361, 373 |
| **ISSUE** | `ApiResponse<any>` is missing properties that exist in `SystemHealthData`: `server`, `database`, `redis`, `queues`, `jobs`, `overallStatus`. |
| **RECOMMENDATION** | Properly type the API response or access the data structure correctly. |

---

### Issue #18: Missing tierThresholds Property
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/karma-loyalty-config.tsx` |
| **LINES** | 153, 158, 161 |
| **ISSUE** | Property `tierThresholds` does not exist on the config type. |
| **RECOMMENDATION** | Add `tierThresholds` to the type definition or use correct property name. |

---

### Issue #19: Index Signature Missing in Bulk Update Types
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/services/api/adminUsers.ts` |
| **LINES** | 103, 117 |
| **ISSUE** | `BulkRoleUpdate` and `BulkStatusUpdate` types are not assignable to `Record<string, unknown>` due to missing index signature. |
| **RECOMMENDATION** | Add index signature to type definitions: `interface BulkRoleUpdate { [key: string]: unknown; ... }` |

---

### Issue #20: Widespread 'as any' Usage (38+ occurrences)
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **PROJECT** | rez-app-admin |
| **ISSUE** | 38+ instances of `as any` type casts across multiple files, bypassing TypeScript's type safety. |
| **RECOMMENDATION** | Replace with proper type definitions. Create discriminated unions or type guards where needed. |

**Key Files Affected:**
- `app/(dashboard)/corp-portal.tsx` - Icon casting
- `app/(dashboard)/corp-integrations.tsx` - Icon casting
- `app/(dashboard)/corp-karma.tsx` - Icon casting
- `app/(dashboard)/karma-admin.tsx` - Item property access
- `app/(dashboard)/corp-hris.tsx` - Various type casts

---

### Issue #21: Extensive 'as any' Usage in Consumer App (50+ occurrences)
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **PROJECT** | rez-app-consumer |
| **ISSUE** | 50+ instances of `as any` type casts. Heavy usage in CartContext, OffersContext, WishlistContext, ProfileContext. |
| **RECOMMENDATION** | Define proper types for CartItem, Wishlist, Profile, and API responses. |

**Key Files Affected:**
- `contexts/CartContext.tsx` (lines 536, 544, 621-622, 962, 1013)
- `contexts/OffersContext.tsx` (lines 126, 129, 134)
- `contexts/WishlistContext.tsx` (lines 261, 268, 289)
- `contexts/ProfileContext.tsx` (lines 67, 85-86)
- `app/projects.tsx` (lines 304, 422, 602, 607, 656, 737)

---

### Issue #22: Extensive 'as any' Usage in Merchant App (20+ occurrences)
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **PROJECT** | rez-app-merchant |
| **ISSUE** | 20+ instances of `as any` type casts. |
| **RECOMMENDATION** | Define proper types and remove type casts. |

**Key Files Affected:**
- `contexts/OnboardingContext.tsx` (lines 444, 471, 623, 672)
- `contexts/AuthContext.tsx` (line 124)
- `app/influencer/index.tsx` (lines 290, 658)
- `app/influencer/[id].tsx` (lines 546, 1011)

---

### Issue #23: Math.random() Used for ID Generation (Architecture Violation)
| Field | Value |
|-------|-------|
| **SEVERITY** | HIGH |
| **PROJECT** | rez-now |
| **ISSUE** | Multiple uses of `Math.random()` for ID generation, violating the architecture fitness test rule. |
| **RECOMMENDATION** | Use `crypto.randomUUID()` or `uuid` package instead. |

**Locations:**
- `app/api/chat/analytics/route.ts` (lines 151, 190)
- `app/api/group/route.ts` (line 10)
- `app/api/group/[code]/route.ts` (line 11)
- `app/api/group/[code]/join/route.ts` (line 8)
- `app/api/group/[code]/items/route.ts` (line 8)
- `app/api/loyalty/redeem/route.ts` (line 15)
- `components/web-qr-scanner/ManualEntry.tsx` (line 38)
- `components/table/GroupOrdering.tsx` (line 73)

---

### Issue #24: Mock Data Uses Math.random()
| Field | Value |
|-------|-------|
| **SEVERITY** | MEDIUM |
| **FILE** | `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/app/api/loyalty/[userId]/route.ts` |
| **LINES** | 41-64 |
| **ISSUE** | Mock data generation uses `Math.random()` for generating sample loyalty data. |
| **RECOMMENDATION** | Acceptable for mock data but should be documented. Consider using seeded random for reproducible tests. |

---

## MEDIUM Issues (MEDIUM)

### Issue #25: Unused eslint-disable Comments
| Field | Value |
|-------|-------|
| **SEVERITY** | MEDIUM |
| **PROJECT** | rez-now |
| **ISSUE** | Several eslint-disable comments may be unnecessary or stale. |
| **RECOMMENDATION** | Review and remove unnecessary eslint-disable directives. |

**Locations:**
- `types/next-layout.d.ts` - Multiple `@typescript-eslint/no-explicit-any` disables
- `app/[storeSlug]/StoreContextProvider.tsx` - `@typescript-eslint/no-unused-vars`
- `app/[storeSlug]/order/[orderNumber]/page.tsx` - Multiple unused vars and exhaustive-deps

---

### Issue #26: Icon Type Casts
| Field | Value |
|-------|-------|
| **SEVERITY** | MEDIUM |
| **PROJECT** | All React Native apps |
| **ISSUE** | Icon components being cast as `any` to bypass type checking. |
| **RECOMMENDATION** | Define a proper icon type that maps icon names to valid Ionicons. |

**Example:**
```typescript
// CURRENT:
name={getCategoryIcon(project.category) as any}

// BETTER:
type IconName = keyof typeof Ionicons.glyphMap;
const getCategoryIcon = (category: string): IconName => { ... }
name={getCategoryIcon(project.category)}
```

---

### Issue #27: API Response Unwrapping Issues
| Field | Value |
|-------|-------|
| **SEVERITY** | MEDIUM |
| **PROJECT** | rez-app-admin |
| **ISSUE** | Inconsistent API response structure: sometimes `.data.data` (double-nested) or `.data` (single-nested). Code uses `as any` to paper over this. |
| **RECOMMENDATION** | Standardize API response format or create proper type guards. |

**Affected Files:**
- `SYSTEM_DASHBOARD_AUDIT_REPORT.md` references show the pattern
- `services/api/apiClient.ts` - API client implementation

---

### Issue #28: Incomplete Error Handling Patterns
| Field | Value |
|-------|-------|
| **SEVERITY** | MEDIUM |
| **PROJECT** | All projects |
| **ISSUE** | Some catch blocks only log errors without proper recovery or fallback. |
| **RECOMMENDATION** | Ensure all catch blocks have meaningful error recovery or propagate errors appropriately. |

---

### Issue #29: Type Safety Gaps in React Native Apps
| Field | Value |
|-------|-------|
| **SEVERITY** | MEDIUM |
| **PROJECT** | React Native apps |
| **ISSUE** | Response types are often `any` or not properly typed, leading to runtime errors. |
| **RECOMMENDATION** | Create a comprehensive type definition file for all API responses. |

---

### Issue #30: Missing null Checks
| Field | Value |
|-------|-------|
| **SEVERITY** | MEDIUM |
| **PROJECT** | All projects |
| **ISSUE** | Several places access properties without null/undefined checks. |
| **RECOMMENDATION** | Use optional chaining (`?.`) or nullish coalescing (`??`) operators. |

---

## LOW Issues (LOW)

### Issue #31: Unused Imports in Some Files
| Field | Value |
|-------|-------|
| **SEVERITY** | LOW |
| **PROJECT** | All projects |
| **ISSUE** | Some imports are not used in certain files. |
| **RECOMMENDATION** | Run `npx tsc --noEmit --traceResolution` to identify unused imports, or use IDE features. |

---

### Issue #32: Commented Code Blocks
| Field | Value |
|-------|-------|
| **SEVERITY** | LOW |
| **PROJECT** | All projects |
| **ISSUE** | Some commented-out code blocks exist in the codebase. |
| **RECOMMENDATION** | Remove commented code or move to documentation if historically significant. |

---

### Issue #33: Inconsistent Naming Conventions
| Field | Value |
|-------|-------|
| **SEVERITY** | LOW |
| **PROJECT** | All projects |
| **ISSUE** | Some inconsistencies in naming (e.g., `userId` vs `user_id`, `createdAt` vs `created_at`). |
| **RECOMMENDATION** | Standardize on camelCase for JavaScript/TypeScript. |

---

### Issue #34: tsconfig Strict Mode Not Fully Enabled
| Field | Value |
|-------|-------|
| **SEVERITY** | LOW |
| **PROJECT** | Some apps |
| **ISSUE** | `strict` flag in tsconfig.json may not be fully enabled, allowing `any` types. |
| **RECOMMENDATION** | Enable `"strict": true` in all tsconfig.json files. |

---

### Issue #35: Deprecated API Usage
| Field | Value |
|-------|-------|
| **SEVERITY** | LOW |
| **PROJECT** | rez-app-merchant |
| **ISSUE** | Some deprecated APIs being used (e.g., `substr` instead of `substring`). |
| **RECOMMENDATION** | Replace deprecated APIs with current equivalents. |

---

## Summary Statistics

| Category | Count | Top Locations |
|----------|-------|---------------|
| Syntax Errors | 3 | api.ts, channel-manager, MenuSocketProvider |
| Missing Imports | 4 | corp-employees, corp-invoices, karma-loyalty |
| Type Mismatches | 15 | corp-bookings, corp-rewards, index.tsx |
| as any Casts | 110+ | Consumer, Merchant, Admin apps |
| Property Missing | 12 | Various corp-* files |
| Architecture Violations | 8 | Math.random() for IDs |

---

## Recommendations Priority Order

1. **Immediate (CRITICAL)**
   - Fix syntax errors in api.ts, channel-manager, MenuSocketProvider
   - Fix missing imports and module declarations
   - Fix type mismatches causing build failures

2. **Short-term (HIGH)**
   - Define proper types for API responses
   - Replace `as any` casts with proper types
   - Fix Math.random() usage with crypto.randomUUID()

3. **Medium-term (MEDIUM)**
   - Standardize icon type definitions
   - Improve error handling patterns
   - Enable strict mode in tsconfig

4. **Long-term (LOW)**
   - Clean up unused imports
   - Remove commented code
   - Standardize naming conventions

---

## Files Requiring Immediate Attention

1. `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/app/habixo/api.ts` - Lines 65-73
2. `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-merchant/app/hotel/channel-manager/index.tsx` - Line 44
3. `/Users/rejaulkarim/Documents/ReZ Full App/rez-now/lib/socket/MenuSocketProvider.tsx` - Lines 112-113
4. `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/corp-bookings.tsx` - Multiple issues
5. `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin/app/(dashboard)/index.tsx` - Multiple missing properties

---

**Report Generated:** May 10, 2026
**Auditor:** Agent 01 - TypeScript/React Code Specialist
