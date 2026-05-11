# REZ Ecosystem - Merchant & Admin Deep Audit Report

**Date:** 2026-04-30
**Audit Type:** Deep Connectivity & Architecture
**Status:** COMPLETE

---

## EXECUTIVE SUMMARY

| Component | Status | Notes |
|-----------|--------|-------|
| **REZ Merchant** | ✅ Well Connected | 85+ API services, WebSocket, Intent Graph |
| **REZ Admin** | ✅ Superior Dashboard | 126 dashboard pages, manages ALL services |
| **REZ Consumer** | ✅ Connected | Core ordering, wallet, profile |
| **REZ Now** | ✅ Connected | Web ordering, chat |
| **REZ Web Menu** | ✅ Connected | QR menu, ordering |
| **Hotel OTA (StayOwn)** | ⚠️ Partial | Admin separate from REZ Admin |
| **RestoPapa** | ❌ Standalone | NOT integrated |
| **AdBazaar** | ⚠️ Partial | Admin separate |
| **NextaBiZ** | ⚠️ Partial | Admin separate |

---

## PART 1: REZ ADMIN - SUPERIOR DASHBOARD

### 1.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REZ ADMIN (SUPERIOR)                                 │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Dashboard   │ │ Users       │ │ Merchants   │ │ Orders      │       │
│  │ Analytics   │ │ Management  │ │ Management  │ │ Management  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Payments    │ │ Wallet     │ │ Offers      │ │ Campaigns   │       │
│  │ Admin      │ │ Platform   │ │ Admin      │ │ Admin      │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ Gamificati-│ │ Loyalty    │ │ Marketing   │ │ BBPS       │       │
│  │ on Admin   │ │ Admin      │ │ Admin      │ │ Admin      │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ CorpPerks  │ │ Analytics   │ │ Error       │ │ System      │       │
│  │ Admin      │ │ Dashboard   │ │ Monitoring  │ │ Settings   │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Services Under REZ Admin Control

| Service | Admin Capabilities | Status |
|---------|-------------------|--------|
| **Merchant/Store** | Full CRUD, approval, wallet, withdrawals, analytics | ✅ |
| **Users** | Management, wallet freeze/adjust, verification, tiers | ✅ |
| **Orders** | Full management, refunds, disputes, status updates | ✅ |
| **Payments** | Reconciliation, revenue, payroll, partner earnings | ✅ |
| **Wallet (Platform)** | Overview, configuration, kill switches, maker-checker | ✅ |
| **Offers** | Full CRUD, approval workflow, homepage deals, flash sales | ✅ |
| **Campaigns** | Cashback, coins, bank offers, double campaigns, coin drops | ✅ |
| **Vouchers** | Brand management, coupons, gift cards | ✅ |
| **Gamification** | Achievements, challenges, tournaments, leaderboards | ✅ |
| **Loyalty** | Tier management, milestones, check-in config | ✅ |
| **Events** | Event creation, rewards, categories | ✅ |
| **Marketing** | SMS/WhatsApp campaigns, templates, flows | ✅ |
| **CorpPerks** | Corporate accounts, benefits, employees | ✅ |
| **Analytics** | Dashboard, reports, insights | ✅ |
| **Error Monitoring** | Sentry integration, error tracking | ✅ |

### 1.3 Admin Endpoints by Service

#### rez-auth-service
| Endpoint | Method | Auth | Purpose |
|---------|--------|------|---------|
| `/auth/admin/login` | POST | Rate-limited | Admin login |
| `/auth/admin/mfa/verify` | POST | pendingToken | MFA verification |
| `/admin/oauth/partners` | GET/POST | `requireInternalToken` | OAuth partners |
| `/internal/users` | GET | `requireInternalToken` | User lookup |
| `/internal/users/bulk` | POST | `requireInternalToken` | Bulk lookup |

#### rez-merchant-service
| Endpoint | Method | Auth | Purpose |
|---------|--------|------|---------|
| `/admin/stores` | GET/POST | `requireInternalToken` | Store management |
| `/admin/stores/:id` | GET/PUT/DELETE | `requireInternalToken` | Store CRUD |
| `/admin/stores/:id/approve` | POST | `requireInternalToken` | Approval |
| `/admin/stores/:id/wallet` | GET/PUT | `requireInternalToken` | Wallet mgmt |
| `/internal/stores` | GET | `requireInternalToken` | Internal lookup |

#### rez-order-service
| Endpoint | Method | Auth | Purpose |
|---------|--------|------|---------|
| `/admin/orders` | GET | `requireInternalToken` | Order list |
| `/admin/orders/:id` | GET/PUT | `requireInternalToken` | Order mgmt |
| `/admin/orders/:id/refund` | POST | `requireInternalToken` | Refund |
| `/admin/dlq/*` | GET | `requireInternalToken` | DLQ admin |

#### rez-wallet-service
| Endpoint | Method | Auth | Purpose |
|---------|--------|------|---------|
| `/admin/wallet` | GET | `requireInternalToken` | Platform overview |
| `/admin/transactions` | GET | `requireInternalToken` | All transactions |
| `/admin/wallet/freeze/:id` | POST | `requireInternalToken` | Freeze wallet |
| `/admin/wallet/adjust/:id` | POST | `requireInternalToken` | Adjust balance |
| `/admin/dlq/*` | GET | `requireInternalToken` | DLQ admin |

#### rez-payment-service
| Endpoint | Method | Auth | Purpose |
|---------|--------|------|---------|
| `/admin/payments` | GET | `requireInternalToken` | Payment list |
| `/admin/payments/reconcile` | POST | `requireInternalToken` | Reconciliation |
| `/admin/revenue` | GET | `requireInternalToken` | Revenue dashboard |
| `/admin/dlq/*` | GET | `requireInternalToken` | DLQ admin |

#### rez-gamification-service
| Endpoint | Method | Auth | Purpose |
|---------|--------|------|---------|
| `/admin/achievements` | GET/POST | `requireInternalToken` | Achievements |
| `/admin/challenges` | GET/POST | `requireInternalToken` | Challenges |
| `/admin/tournaments` | GET/POST | `requireInternalToken` | Tournaments |
| `/admin/leaderboard` | GET | `requireInternalToken` | Leaderboards |
| `/admin/coin/governor` | GET/PUT | `requireInternalToken` | Coin settings |

### 1.4 Issues Found

| Issue | Severity | Description |
|-------|----------|-------------|
| REZ Admin not connected to Hotel OTA | HIGH | Separate admin for StayOwn |
| REZ Admin not connected to RestoPapa | HIGH | Standalone, not integrated |
| REZ Admin not connected to AdBazaar | MEDIUM | Separate admin |
| REZ Admin not connected to NextaBiZ | MEDIUM | Separate admin |
| gamification-service `/internal/visit` lacks auth | HIGH | Security issue |
| gamification-service `/internal/dlq` lacks auth | HIGH | Security issue |

---

## PART 2: REZ MERCHANT - CONNECTIVITY AUDIT

### 2.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REZ MERCHANT APP                                    │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │   Dashboard     │  │   Orders       │  │   Menu         │           │
│  │   Analytics    │  │   KDS          │  │   Management   │           │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           │
│           │                    │                    │                     │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐           │
│  │   Wallet       │  │   Payments    │  │   Analytics    │           │
│  │   Management   │  │   Tracking    │  │   Reports      │           │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           │
│           │                    │                    │                     │
└───────────┼────────────────────┼────────────────────┼─────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │ API Gateway   │    │ WebSocket    │    │ ReZ Mind     │
    │               │    │ Server       │    │ Intent Graph  │
    └───────┬───────┘    └───────────────┘    └───────────────┘
            │
    ┌───────┴───────────────────────────────────────────┐
    │                                                   │
    ▼                                                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Merchant        │  │ Wallet         │  │ Order          │
│ Service        │  │ Service        │  │ Service        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Payment         │  │ Analytics      │  │ Auth           │
│ Service         │  │ Events         │  │ Service        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 API Connections

#### Direct Service Calls (via API Client)

| Service | Endpoint | Purpose | Status |
|---------|----------|---------|--------|
| Merchant Service | `/merchants/profile` | Store profile | ✅ |
| Merchant Service | `/merchants/menu` | Menu items | ✅ |
| Merchant Service | `/merchants/orders` | Order list | ✅ |
| Merchant Service | `/merchants/offers` | Offers | ✅ |
| Merchant Service | `/merchants/analytics` | Reports | ✅ |
| Order Service | `/orders/*` | Order lifecycle | ✅ |
| Payment Service | `/payments/*` | Payment tracking | ✅ |
| Wallet Service | `/wallet/*` | Balance, txns | ✅ |
| Auth Service | `/auth/*` | Authentication | ✅ |

#### WebSocket Connections

| Connection | Purpose | Status |
|------------|---------|--------|
| Order WebSocket | Real-time orders | ✅ |
| Kitchen Display | KDS updates | ✅ |
| Analytics WebSocket | Live stats | ✅ |

#### External Integrations

| Integration | Purpose | Status |
|-------------|---------|--------|
| Razorpay | Payment gateway | ✅ |
| Cloudinary | Media upload | ✅ |
| MSG91 | SMS notifications | ✅ |
| Twilio | WhatsApp | ✅ |

### 2.3 Issues Found

| Issue | Severity | Description |
|-------|----------|-------------|
| Port inconsistency | MEDIUM | Code uses 3020, env uses 4005 |
| Mixed @rez/shared | MEDIUM | Some use file path, some use version |
| WebSocket reconnection | MEDIUM | Auto-reconnect not implemented |
| No offline mode | LOW | Requires internet |

---

## PART 3: SERVICE-TO-SERVICE CONNECTIONS

### 3.1 Master Connection Matrix

```
                    │ Auth │ Wallet │ Order │ Payment │ Merchant │ Catalog │ Search │ Gamif │ Market │ Notif │ Analytics │
────────────────────┼──────┼───────┼───────┼─────────┼──────────┼─────────┼────────┼───────┼────────┼───────┼──────────┤
rez-api-gateway     │  ✅  │   ✅   │   ✅   │    ✅    │    ✅    │    ✅   │   ✅   │   ✅  │   ✅   │   ✅  │    ✅     │
rez-auth-service    │  ─   │   ✅   │   ✅   │    ✅    │    ✅    │    ─    │   ─    │   ─   │   ✅   │   ─   │    ─     │
rez-wallet-service  │  ✅  │   ─   │   ✅   │    ✅    │    ✅    │    ─    │   ─    │   ✅  │   ─   │   ─   │    ✅     │
rez-order-service    │  ✅  │   ✅   │   ─   │    ✅    │    ✅    │    ✅   │   ✅   │   ✅  │   ✅   │   ✅  │    ✅     │
rez-payment-service  │  ✅  │   ✅   │   ✅   │    ─    │    ─    │    ─    │   ─    │   ─   │   ─   │   ─   │    ─     │
rez-merchant-service │  ✅  │   ✅   │   ✅   │    ─    │    ─    │    ✅   │   ✅   │   ✅  │   ✅   │   ✅  │    ✅     │
rez-catalog-service  │  ✅  │   ─   │   ✅   │    ─    │    ✅    │    ─    │   ✅   │   ─   │   ✅   │   ─   │    ─     │
rez-search-service   │  ✅  │   ─   │   ✅   │    ─    │    ✅    │    ✅   │    ─   │   ─   │   ✅   │   ─   │    ─     │
rez-gamification     │  ✅  │   ✅   │   ✅   │    ─    │    ✅    │    ─    │   ─    │   ─   │   ✅   │   ✅  │    ✅     │
rez-marketing        │  ✅  │   ✅   │   ✅   │    ✅    │    ✅    │    ✅   │   ✅   │   ✅  │   ─   │   ✅  │    ✅     │
rez-corpperks        │  ✅  │   ✅   │   ✅   │    ✅    │    ✅    │    ─    │   ─    │   ✅  │   ✅   │   ✅  │    ✅     │
```

### 3.2 Vertical Service Gaps

```
                    │ REZ Admin │ REZ Merchant │ REZ Consumer │ Status  │
────────────────────┼───────────┼──────────────┼──────────────┼─────────┤
Hotel OTA (StayOwn) │     ❌     │       ❌      │      ✅       │ GAP     │
RestoPapa           │     ❌     │       ❌      │      ❌       │ NOT INT │
AdBazaar            │     ❌     │       ✅      │      ✅       │ PARTIAL │
NextaBiZ            │     ❌     │       ❌      │      ❌       │ GAP     │
CorpPerks           │     ✅     │       ❌      │      ✅       │ PARTIAL │
```

---

## PART 4: SECURITY AUDIT

### 4.1 Internal Token Authentication

All services use `requireInternalToken` middleware:
```typescript
// Constant-time token comparison
const valid = timingSafeEqual(
  Buffer.from(token),
  Buffer.from(INTERNAL_SERVICE_TOKENS[serviceName])
);
```

### 4.2 Security Issues Found

| Issue | Service | Severity | Status |
|-------|---------|----------|--------|
| `/internal/visit` no auth | gamification | HIGH | ⚠️ |
| `/internal/dlq` no auth | gamification | HIGH | ⚠️ |
| OTEL endpoint hardcoded | auth | MEDIUM | ⚠️ |
| Test URLs hardcoded | payment | MEDIUM | ⚠️ |

### 4.3 Rate Limiting

| Service | Rate Limit | Status |
|---------|------------|--------|
| Auth (login) | 5/min | ✅ |
| Auth (OTP) | 3/min | ✅ |
| Merchant | 100/min | ✅ |
| Payment webhook | 1000/min | ✅ |
| General API | 100/min | ✅ |

---

## PART 5: GAPS & RECOMMENDATIONS

### 5.1 Critical Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| Hotel OTA not under REZ Admin | HIGH | Create integration layer |
| RestoPapa not integrated | HIGH | Either integrate or deprecate |
| AdBazaar separate admin | MEDIUM | Merge into REZ Admin |
| NextaBiZ separate admin | MEDIUM | Merge into REZ Admin |

### 5.2 Quick Fixes

| Fix | Priority | Effort |
|-----|----------|--------|
| Add auth to gamification /internal/* | HIGH | 1 hour |
| Create Hotel OTA → REZ Admin bridge | HIGH | 1 day |
| Standardize port numbers | MEDIUM | 1 day |
| Align @rez/shared references | MEDIUM | 1 day |

### 5.3 Architecture Recommendations

```
CURRENT (Partial Integration):
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Hotel OTA │    │ AdBazaar │    │ NextaBiZ │    │ RestoPapa │
│ (sep)    │    │ (sep)    │    │ (sep)    │    │ (NOT INT) │
└──────────┘    └──────────┘    └──────────┘    └──────────┘

TARGET (Unified):
┌─────────────────────────────────────────────────────────────────┐
│                        REZ ADMIN                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ Hotel   │  │ AdBazaar│  │NextaBiZ │  │ Restaurant│          │
│  │ Panel   │  │ Admin   │  │ Admin   │  │ Admin    │           │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 6: CONNECTIVITY CHECKLIST

### REZ Admin ✅
- [x] Auth Service - Connected
- [x] Merchant Service - Connected
- [x] Order Service - Connected
- [x] Payment Service - Connected
- [x] Wallet Service - Connected
- [x] Catalog Service - Connected
- [x] Gamification Service - Connected
- [x] Marketing Service - Connected
- [x] CorpPerks Service - Connected
- [ ] Hotel OTA - NOT CONNECTED
- [ ] RestoPapa - NOT INTEGRATED
- [ ] AdBazaar - SEPARATE ADMIN
- [ ] NextaBiZ - SEPARATE ADMIN

### REZ Merchant ✅
- [x] API Gateway - Connected
- [x] Merchant Service - Connected
- [x] Order Service - Connected
- [x] Payment Service - Connected
- [x] Wallet Service - Connected
- [x] Auth Service - Connected
- [x] WebSocket Server - Connected
- [x] ReZ Mind (Intent Graph) - Connected

### REZ Consumer ✅
- [x] API Gateway - Connected
- [x] Catalog Service - Connected
- [x] Order Service - Connected
- [x] Payment Service - Connected
- [x] Wallet Service - Connected
- [x] Auth Service - Connected
- [x] ReZ Mind (Intent Graph) - Connected

---

## SUMMARY

| Category | Status | Details |
|----------|--------|---------|
| REZ Admin superiority | ✅ | Central admin for 14+ services |
| REZ Merchant connectivity | ✅ | Well connected to all services |
| Service-to-service | ✅ | Proper internal auth |
| Security | ⚠️ | 2 auth gaps found |
| Hotel OTA integration | ❌ | Not connected to REZ Admin |
| RestoPapa integration | ❌ | Standalone, not integrated |
| AdBazaar integration | ⚠️ | Separate admin |
| NextaBiZ integration | ⚠️ | Separate admin |

---

## RECOMMENDED ACTIONS

### Immediate (This Week)
1. Add auth to gamification /internal/* endpoints
2. Create Hotel OTA integration documentation

### Short-term (This Month)
1. Create integration bridge for Hotel OTA → REZ Admin
2. Document RestoPapa integration decision (integrate or deprecate)
3. Merge AdBazaar admin into REZ Admin

### Long-term (This Quarter)
1. Create unified admin for all verticals
2. Implement unified auth across all apps
3. Build event backbone for all services

---

**Audit Status:** COMPLETE
**Next Review:** 2026-05-07
