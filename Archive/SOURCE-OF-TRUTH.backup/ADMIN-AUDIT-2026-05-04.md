# Admin Systems RBAC Audit Report

**Date:** 2026-05-04
**Auditor:** CHRO (Claude Code)
**Status:** COMPLETED

---

## Executive Summary

This audit examined 10 admin/merchant systems across the REZ ecosystem for RBAC implementation, authentication, and authorization. **Critical security issues were found in 3 systems** that require immediate attention.

### Critical Issues Found
1. **CorpPerks** - Missing auth middleware entirely (routes will crash)
2. **rez-ops-dashboard** - All endpoints completely unprotected (no auth/authorization)
3. **REZ-admin-dashboard** - Only contains static HTML, no functional code

---

## Component Audit Results

### Component: rez-auth-service
- **Status:** Production Ready
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-auth-service`
- **Roles Defined:**
  - Super Admin (via admin login)
  - Consumer/User
  - Guest
  - CorpPerks roles: corp_admin, corp_hr, corp_finance, corp_manager, corp_employee
- **Permissions:** JWT-based with role in token payload
- **Authentication:** HS256 JWT with token blacklist via Redis
- **Issues:** None

### Component: rez-admin-service
- **Status:** Minimal Implementation
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-admin-service`
- **Roles Defined:** None (just REE admin service client)
- **Permissions:** Via API key header (X-Admin-Key)
- **Issues:** Only contains REE Admin service wrapper, no comprehensive admin functionality

### Component: rez-app-admin (Mobile Admin App)
- **Status:** Minimal Implementation
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-admin`
- **Roles Defined:** None visible
- **Permissions:** N/A (client app only)
- **Issues:** Only 2 source files, no RBAC implementation

### Component: REZ-admin-dashboard
- **Status:** Not Implemented
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/REZ-admin-dashboard`
- **Roles Defined:** None
- **Permissions:** N/A
- **Issues:** Only contains static HTML file (ree-admin.html), no actual implementation

### Component: rez-ops-dashboard
- **Status:** CRITICAL - No Authentication
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ops-dashboard`
- **Roles Defined:** None
- **Permissions:** None - ALL ENDPOINTS UNPROTECTED
- **Issues:**
  - `/flags` - Anyone can read feature flags
  - `/flags/:key/toggle` - **CRITICAL** Anyone can enable/disable feature flags
  - `/health/status` - Anyone can view system health
  - `/quick-actions` - Information disclosure
  - **Feature flag toggle endpoint allows complete system control without auth**

### Component: rez-admin-training-panel
- **Status:** Minimal Implementation
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-admin-training-panel`
- **Roles Defined:** None visible
- **Permissions:** Via API service calls
- **Issues:** Frontend only, uses API services

### Component: rez-merchant-service
- **Status:** Production Ready
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service`
- **Roles Defined:**
  - owner, admin, manager, staff, cashier, viewer
- **Permissions:** Fine-grained RBAC with 40+ permissions defined
- **Features:**
  - merchantAuth middleware with token blacklist
  - requireVerifiedMerchant for KYC-gated operations
  - ownershipGuard for IDOR protection
  - AuditLog model with 90-day retention
  - Token invalidation on role/status changes
  - Rate limiting on team invitations
- **Issues:** None

### Component: rez-now (Merchant Web Dashboard)
- **Status:** Minimal Implementation
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-now`
- **Roles Defined:** None visible in source
- **Permissions:** Via backend services
- **Issues:** Limited source code, primarily Next.js pages

### Component: Hotel OTA Admin Panel
- **Status:** Production Ready
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/Hotel OTA`
- **Apps:**
  - `apps/admin` - Platform admin (middleware protection)
  - `apps/hotel-panel` - Hotel staff panel
  - `apps/corporate-panel` - Corporate dashboard
  - `apps/ota-web` - Public web interface
- **Roles Defined:**
  - ADMIN, SUPERADMIN
  - Hotel staff roles
- **Permissions:**
  - authenticateAdmin middleware
  - requireAdminRole() for specific roles
  - authenticateHotelStaff with DB verification
  - authenticatePartner with scoped API keys (READ_INVENTORY, WRITE_INVENTORY, etc.)
  - requirePartnerScope() for permission checking
- **Features:**
  - Token blacklist via Redis
  - Fail-closed on Redis unavailability
  - Staff-to-hotel verification in JWT claims
  - Per-partner scoped API keys
- **Issues:** None

### Component: CorpPerks
- **Status:** CRITICAL - Missing Auth Middleware
- **Location:** `/Users/rejaulkarim/Documents/ReZ Full App/CorpPerks`
- **Roles Defined:**
  - corp_admin, corp_hr, corp_finance, corp_manager, corp_employee
- **Permissions:** Via corpRole middleware (imported but missing)
- **Issues:**
  - **MISSING FILE:** `src/middleware/auth.ts` - Routes import `requireAuth`, `requireAdminAuth`, `requireInternalToken` from `../../middleware/auth` but file does not exist
  - All routes referencing these functions will crash at runtime
  - IDOR protection added to benefit and employee endpoints (good)

---

## RBAC Implementation Analysis

### Well-Implemented Systems

| System | Auth | RBAC | IDOR Protection | Audit Logging |
|--------|------|------|-----------------|---------------|
| rez-auth-service | JWT+Redis | Role-based | N/A | Login tracking |
| rez-merchant-service | JWT | Fine-grained | ownershipGuard | AuditLog model |
| Hotel OTA | JWT | Role+Scope | Company ID filter | Reviewer tracking |

### Missing/Broken Systems

| System | Auth | RBAC | Status |
|--------|------|------|--------|
| rez-ops-dashboard | NONE | NONE | CRITICAL - Full access |
| CorpPerks | MISSING | MISSING | CRITICAL - Will crash |
| REZ-admin-dashboard | N/A | N/A | Not implemented |

---

## Role Definitions by System

### Global Roles (rez-auth-service)
- `user` / `consumer` - Standard customer
- `guest` - Unauthenticated web-menu user
- `corp_admin` - CorpPerks full access
- `corp_hr` - CorpPerks HR functions
- `corp_finance` - CorpPerks finance functions
- `corp_manager` - CorpPerks manager
- `corp_employee` - CorpPerks basic employee

### Merchant Roles (rez-merchant-service)
| Role | Key Permissions |
|------|-----------------|
| owner | All permissions including API key management |
| admin | All except billing manage, log export, API manage_keys |
| manager | Products CRUD, orders, analytics, promotions |
| staff | View products, update order status, view reports |
| cashier | POS operations, order status |
| viewer | Read-only analytics and data |

### Hotel OTA Roles
| Role | Access Level |
|------|-------------|
| ADMIN | Full platform admin access |
| SUPERADMIN | All admin + system config |
| Hotel Staff | Hotel-specific operations |

### CorpPerks Roles (defined but not implemented)
| Role | Purpose |
|------|---------|
| corp_admin | Full corporate access |
| corp_hr | HR functions |
| corp_finance | Finance functions |
| corp_manager | Department manager |
| corp_employee | Basic employee access |

---

## Required Fixes

### P0 - Critical (Production Blockers)

#### 1. CorpPerks - Create Missing Auth Middleware
**File:** `/Users/rejaulkarim/Documents/ReZ Full App/CorpPerks/src/middleware/auth.ts`

Required exports:
```typescript
export function requireAuth(req, res, next)
export function requireAdminAuth(req, res, next)
export function requireInternalToken(req, res, next)
```

Should integrate with:
- JWT validation using JWT_SECRET
- CorpPerks-specific role checking (corp_admin, corp_hr, corp_finance)
- Company ID verification via x-company-id header

#### 2. rez-ops-dashboard - Add Authentication
**File:** `/Users/rejaulkarim/Documents/ReZ Full App/rez-ops-dashboard/src/index.ts`

Critical endpoints requiring protection:
- `POST /flags/:key/toggle` - Feature flag changes
- `GET /flags` - Feature flag enumeration
- `GET /health/status` - System health data

Recommended approach:
- Add JWT authentication middleware
- Restrict feature flag toggles to ADMIN role only
- Add rate limiting

### P1 - High Priority

#### 3. REZ-admin-dashboard - Implement Dashboard
The current `ree-admin.html` is static. Implement proper Next.js dashboard with:
- Authentication flow
- Role-based route protection
- Admin API integration

---

## Verification Checklist

### Authentication Verification
- [x] rez-auth-service - JWT with HS256, Redis blacklist
- [x] rez-merchant-service - JWT with merchant-specific claims
- [x] Hotel OTA - JWT with admin/staff/partner variants
- [ ] CorpPerks - MISSING middleware
- [ ] rez-ops-dashboard - NO AUTH

### Authorization Verification
- [x] rez-auth-service - requireAuth, requireCorpAdminAuth
- [x] rez-merchant-service - Fine-grained ROLE_FINE_PERMISSIONS
- [x] Hotel OTA - requireAdminRole, requirePartnerScope
- [ ] CorpPerks - Imports exist but file missing
- [ ] rez-ops-dashboard - No authorization

### Route Protection Verification
- [x] rez-auth-service - All routes require auth
- [x] rez-merchant-service - Team routes protected
- [x] Hotel OTA admin routes - authenticateAdmin required
- [ ] CorpPerks - Routes will crash
- [ ] rez-ops-dashboard - All routes public

### Audit Logging Verification
- [x] rez-merchant-service - AuditLog model with 90-day TTL
- [ ] rez-auth-service - Limited to login events
- [ ] Hotel OTA - Reviewer tracking in stay registrations
- [ ] CorpPerks - No audit logging
- [ ] rez-ops-dashboard - No audit logging

---

## Team Management Features

### Staff Management (rez-merchant-service)
- [x] Add/remove staff - POST/DELETE /team
- [x] Role assignment - PUT /team/:id/role
- [x] Shift scheduling - /staff-shifts routes
- [ ] Attendance tracking - Not implemented

### Merchant Onboarding (rez-merchant-service)
- [x] KYC verification - requireVerifiedMerchant middleware
- [x] Document upload - Not in scope
- [x] Store creation - /merchants routes
- [ ] Bank account linking - Not in scope

### Customer Support
- [ ] Ticket system - Not implemented in audited systems
- [ ] Escalation matrix - Not implemented
- [ ] SLA tracking - Not implemented

---

## Recommendations

### Immediate Actions (P0)
1. **Create CorpPerks auth middleware** - Without this, CorpPerks backend will crash
2. **Add auth to rez-ops-dashboard** - Feature flag toggle is a critical control

### Short-term Actions (P1)
3. Implement REZ-admin-dashboard with proper authentication
4. Add audit logging to rez-ops-dashboard for compliance
5. Add attendance tracking to merchant staff management

### Long-term Actions (P2)
6. Implement customer support ticket system
7. Add SLA tracking across admin systems
8. Centralize RBAC definitions in shared package

---

## Appendix: File Locations

| System | Key Files |
|--------|-----------|
| rez-auth-service | src/middleware/auth.ts, src/routes/authRoutes.ts |
| rez-merchant-service | src/middleware/auth.ts, src/routes/team.ts, src/middleware/ownershipGuard.ts |
| Hotel OTA | apps/api/src/middleware/auth.ts, apps/api/src/routes/admin.routes.ts |
| CorpPerks | src/backend/corpPerksRoutes.ts (MISSING: src/middleware/auth.ts) |
| rez-ops-dashboard | src/index.ts (NO AUTH) |

---

**Report Generated:** 2026-05-04
**Next Audit:** 2026-06-04
