# ReZ Merchant Architecture Audit

**Date:** May 8, 2026
**Purpose:** Understand current structure and plan consolidation

---

## Current State

### Services (50+)

| Service | Purpose | Status |
|---------|---------|--------|
| `rez-merchant-service` | Main merchant platform | Active |
| `rez-order-service` | Order management | Active |
| `rez-payment-service` | Payment processing | Active |
| `rez-wallet-service` | Wallet & points | Active |
| `rez-catalog-service` | Menu/catalog | Active |
| `rez-auth-service` | Authentication | Active |
| `rez-api-gateway` | API routing | Active |
| `rez-ai-platform` | AI features | Active |
| `rez-ab-testing-service` | A/B testing | Active |
| `rez-abandonment-tracker` | Cart abandonment | Active |
| `rez-ad-ai` | Ad intelligence | Active |
| `rez-ad-campaigns` | Ad campaigns | Active |
| `rez-ads-service` | Ads | Active |
| `rez-aggregator-hub` | Swiggy/Zomato | Active |
| `rez-admin-service` | Admin panel | Active |
| `rez-billing-service` | Billing | Active |
| `rez-catalog-service` | Catalog | Active |
| `rez-consumer-copilot` | AI assistant | Active |
| `rez-contracts` | Contracts | Active |
| `rez-karma-service` | Gamification | Active |

---

## Problem: Too Many Services

### Issues:
1. **Scattered code** - Similar functionality in multiple services
2. **Duplication** - Auth, notifications, analytics repeated
3. **Complexity** - Hard to maintain
4. **Performance** - Service-to-service calls add latency

---

## Solution: Unified Merchant Platform

### Architecture

```
rez-merchant/
├── src/
│ ├── modules/
│ │   ├── common/          # Shared across all industries
│ │   │   ├── auth/
│ │ │   │   ├── jwt.ts
│ │ │   │   ├── oauth.ts
│ │ │   │   └── permissions.ts
│ │   │   ├── notifications/
│ │ │   │   ├── push.ts
│ │ │   │   ├── sms.ts
│ │ │   │   ├── email.ts
│ │   │   │   └── whatsapp.ts
│ │   │   ├── payments/
│ │   │   ├── wallet.ts
│ │   │   ├── billing.ts
│ │   │   └── invoices.ts
│ │   │   ├── analytics/
│ │   │   ├── reports.ts
│ │   │   ├── exports.ts
│ │   │   └── dashboards.ts
│ │   │   ├── users/
│ │   │   ├── profiles.ts
│ │   │   ├── addresses.ts
│ │   │   └── preferences.ts
│ │   │   ├── staff/
│ │   │   ├── scheduling.ts
│ │   │   ├── payroll.ts
│ │   │   └── attendance.ts
│ │   │   ├── inventory/
│ │   │   ├── stock.ts
│ │   │   ├── suppliers.ts
│ │   │   └── orders.ts
│ │   │   └── compliance/
│ │   │       ├── gst.ts
│ │   │       └── audits.ts
│ │   │
│ │   ├── restaurant/       # Restaurant-specific
│ │   │   ├── orders/
│ │   │   │   ├── dine-in.ts
│ │   │   │   ├── delivery.ts
│ │   │   │   ├── takeaway.ts
│ │   │   │   └── aggregator.ts
│ │   │   ├── menu/
│ │   │   │   ├── items.ts
│ │   │   │   ├── modifiers.ts
│ │   │   │   ├── pricing.ts
│ │   │   │   └── recipe.ts
│ │   │   ├── kitchen/
│ │   │   │   ├── kds.ts
│ │   │   │   ├── prep-times.ts
│ │   │   │   └── alerts.ts
│ │   │   ├── tables/
│ │   │   │   ├── reservations.ts
│ │   │   │   ├── waitlist.ts
│ │   │   │   └── sections.ts
│ │   │   └── customer/
│ │   │       ├── loyalty.ts
│ │   │       ├── reviews.ts
│ │   │       └── preferences.ts
│ │   │
│ │   ├── hotel/           # Hotel-specific
│ │   │   ├── rooms/
│ │   │   ├── booking.ts
│ │   │   ├── housekeeping.ts
│ │   │   └── guest-services.ts
│ │   │
│ │   ├── retail/         # Retail-specific
│ │   │   ├── pos/
│ │   │   ├── inventory/
│ │   │   └── loyalty.ts
│ │   │
│ │   ├── salon/          # Salon-specific
│ │   │   ├── appointments/
│ │   │   ├── services/
│ │   │   └── staff/
│ │   │
│ │   └── gym/            # Gym-specific
│ │       ├── memberships/
│ │       ├── classes/
│ │       └── trainers/
│ │
│ ├── routes/             # API routes
│ ├── middleware/         # Auth, logging, etc
│ ├── config/            # Configuration
│ └── index.ts          # Entry point
```

---

## Common Modules (All Industries)

| Module | Features |
|--------|---------|
| **Auth** | JWT, OAuth, Permissions, 2FA |
| **Notifications** | Push, SMS, Email, WhatsApp |
| **Payments** | Wallet, Billing, Invoices |
| **Analytics** | Reports, Exports, Dashboards |
| **Users** | Profiles, Addresses, Preferences |
| **Staff** | Scheduling, Payroll, Attendance |
| **Inventory** | Stock, Suppliers, Orders |
| **Compliance** | GST, Audits, Documents |

---

## Industry-Specific Modules

### Restaurant
| Module | Features |
|--------|---------|
| **Orders** | Dine-in, Delivery, Takeaway, Aggregator |
| **Menu** | Items, Modifiers, Pricing, Recipe Costing |
| **Kitchen** | KDS, Prep Times, Fire Alerts |
| **Tables** | Reservations, Waitlist, Sections |
| **Customer** | Loyalty, Reviews, Preferences |

### Hotel
| Module | Features |
|--------|---------|
| **Rooms** | Room types, Availability |
| **Booking** | Reservations, Check-in/out |
| **Housekeeping** | Tasks, Scheduling |
| **Guest Services** | Room service, Concierge |

### Retail
| Module | Features |
|--------|---------|
| **POS** | Checkout, Returns |
| **Inventory** | Stock tracking |
| **Loyalty** | Points, Tiers |

### Salon
| Module | Features |
|--------|---------|
| **Appointments** | Booking, Calendar |
| **Services** | Treatments, Pricing |
| **Staff** | Schedules, Skills |

### Gym
| Module | Features |
|--------|---------|
| **Memberships** | Plans, Renewals |
| **Classes** | Timetable, Bookings |
| **Trainers** | Profiles, Availability |

---

## Migration Plan

### Phase 1: Consolidate Common (1-2 months)
1. Move auth to `common/auth`
2. Move notifications to `common/notifications`
3. Move analytics to `common/analytics`
4. Move payments to `common/payments`

### Phase 2: Create Industry Modules (2-3 months)
1. Create `restaurant/` module
2. Create `hotel/` module
3. Create `retail/` module
4. Create `salon/` module
5. Create `gym/` module

### Phase 3: Deprecate Old Services (3-6 months)
1. Move routes to new modules
2. Update consumers
3. Remove old services
4. Monitor for issues

---

## Benefits

| Before | After |
|--------|-------|
| 50+ services | ~10 core services |
| Duplicated auth | Single auth module |
| Scattered notifications | Unified notifications |
| Complex deployments | Single deployment |
| Slow service calls | Direct module calls |

---

## Implementation Checklist

- [ ] Create `common/` directory
- [ ] Move auth to `common/auth`
- [ ] Move notifications to `common/notifications`
- [ ] Create `restaurant/` module
- [ ] Create `hotel/` module
- [ ] Create `retail/` module
- [ ] Create `salon/` module
- [ ] Create `gym/` module
- [ ] Update routes
- [ ] Test all modules
- [ ] Deploy unified platform

---

**Document:** REZ_ARCHITECTURE_AUDIT.md
**Created:** May 8, 2026
