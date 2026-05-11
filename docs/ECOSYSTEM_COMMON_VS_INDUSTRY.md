# ReZ Ecosystem - Common vs Industry-Specific Analysis

**Date:** May 8, 2026
**Version:** 1.0

---

## 1. COMMON SERVICES (All Industries)

These services are used by ALL industries and should be centralized:

| Service | Features | Status |
|---------|----------|--------|
| **Auth Service** | Login, Register, OAuth, 2FA, JWT | ✅ Built |
| **Payment Service** | Payments, Refunds, Wallets | ✅ Built |
| **Wallet Service** | Balance, Transactions | ✅ Built |
| **Order Service** | Order CRUD, State Machine | ✅ Built |
| **Notification Service** | Push, SMS, Email, WhatsApp | ✅ Built |
| **Analytics Service** | Reports, Dashboards, Export | ✅ Built |
| **Search Service** | Full-text search | ✅ Built |
| **Catalog Service** | Products, Categories | ✅ Built |
| **User Service** | Profiles, Preferences | ✅ Built |
| **Merchant Service** | Business Management | ✅ Built |
| **Customer Service** | CRM, 360° View | ✅ Built |

### AI Services (Common)
| Service | Features | Status |
|---------|----------|--------|
| **Intent Graph** | Capture user intent | ✅ Built |
| **Intelligence Hub** | User/business insights | ✅ Built |
| **Copilot** | AI assistant | ✅ Built |
| **Personalization** | Recommendations | ✅ Built |

### Marketing (Common)
| Service | Features | Status |
|---------|----------|--------|
| **Campaigns** | Create, Send | ✅ Built |
| **Broadcasts** | Push notifications | ✅ Built |
| **Offers** | Discounts, Coupons | ✅ Built |
| **Loyalty** | Points, Tiers | ✅ Built |
| **Reviews** | Management | ✅ Built |

---

## 2. INDUSTRY-SPECIFIC FEATURES

### 2.1 RESTAURANT

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| **Kitchen AI** | KDS, Prep times | ✅ Built |
| **Smart Inventory** | Auto-reorder, Waste | ✅ Built |
| **Demand Forecast** | Hourly predictions | ✅ Built |
| **Dynamic Pricing** | Surge, Happy hour | ✅ Built |
| **Voice Ordering** | Natural language | ✅ Built |
| **Aggregator Hub** | Swiggy, Zomato, Magicpin | ✅ Built |
| **Recipe Costing** | Menu margins | ✅ Built |
| **Referral System** | Multi-level | ✅ Built |
| **LTV Calculator** | Customer value | ✅ Built |
| **Churn Detection** | At-risk customers | ✅ Built |
| **Offer Optimizer** | Auto-apply | ✅ Built |

#### Merchant App Screens (390 screens)
| Feature | Screens | Status |
|---------|---------|--------|
| **Dine-In** | 15+ | ✅ Built |
| **Kitchen Display** | 20+ | ✅ Built |
| **Orders** | 30+ | ✅ Built |
| **POS** | 25+ | ✅ Built |
| **Floor Plan** | 10+ | ✅ Built |
| **Analytics** | 40+ | ✅ Built |
| **Products** | 25+ | ✅ Built |
| **Customers** | 20+ | ✅ Built |
| **Loyalty** | 15+ | ✅ Built |
| **Marketing** | 20+ | ✅ Built |
| **Reports** | 30+ | ✅ Built |

#### Restaurant Features Built
- [x] Menu management
- [x] Order management (Dine-in, Takeaway, Delivery)
- [x] Table management
- [x] Kitchen display (KDS)
- [x] Voice ordering
- [x] Dynamic pricing
- [x] Smart inventory
- [x] Demand forecasting
- [x] Waste tracking
- [x] Recipe costing
- [x] Customer loyalty
- [x] Aggregator integration (Swiggy, Zomato, Magicpin)
- [x] QR ordering
- [x] Split bill (missing - gap)
- [x] Multi-location (partial - gap)

---

### 2.2 HOTEL

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| **Hotel Service** | Room management | ✅ Built |
| **Mind Hotel Service** | AI features | ✅ Built |
| **Channel Manager** | OTA integration | ⚠️ Partial |

#### Merchant App Screens
| Feature | Screens | Status |
|---------|---------|--------|
| **Hotel** | 10+ | ✅ Built |
| **Hotel OTA** | 15+ | ✅ Built |

#### Hotel Features Built
- [x] Room management
- [x] Booking management
- [x] Channel manager (partial)
- [x] Guest management

#### Hotel Features Missing
- [ ] Housekeeping management
- [ ] Channel integrations (Booking.com, Expedia)
- [ ] Check-in/out automation
- [ ] Housekeeper app
- [ ] Concierge services

---

### 2.3 SALON & SPA

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| **Service Model** | Treatments | ✅ Built |
| **Appointment Service** | Booking | ✅ Built |
| **Treatment Room** | Room management | ✅ Built |
| **Service Package** | Bundles | ✅ Built |

#### Merchant App Screens
| Feature | Screens | Status |
|---------|---------|--------|
| **Services** | 15+ | ✅ Built |
| **Appointments** | 20+ | ✅ Built |
| **Treatment Rooms** | 10+ | ✅ Built |
| **Staff Scheduling** | 15+ | ⚠️ Partial |

#### Salon Features Built
- [x] Services/Treatments
- [x] Appointments
- [x] Treatment rooms
- [x] Service packages
- [x] Staff scheduling (partial)

#### Salon Features Missing
- [ ] Cancellation policy
- [ ] Staff commission tracking
- [ ] Inventory for products
- [ ] Client history
- [ ] Before/after photos

---

### 2.4 FITNESS & GYM

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| **Class Schedule** | Timetable | ✅ Built |
| **Memberships** | Plans | ⚠️ Partial |
| **Trial Offers** | Free trials | ✅ Built |

#### Merchant App Screens
| Feature | Screens | Status |
|---------|---------|--------|
| **Class Schedule** | 15+ | ✅ Built |
| **Subscriptions** | 10+ | ⚠️ Partial |

#### Fitness Features Built
- [x] Class schedules
- [x] Trial offers
- [x] Membership plans (partial)

#### Fitness Features Missing
- [ ] Trainer management
- [ ] Attendance tracking
- [ ] Nutrition plans
- [ ] Progress tracking
- [ ] Member check-in
- [ ] Class capacity

---

### 2.5 EVENTS

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| **Event Platform** | Event management | ✅ Built |
| **Event Booking** | Ticketing | ⚠️ Partial |
| **Media Events** | Media integration | ✅ Built |

#### Merchant App Screens
| Feature | Screens | Status |
|---------|---------|--------|
| **Events** | 15+ | ✅ Built |

#### Events Features Built
- [x] Event creation
- [x] Event booking (partial)
- [x] Media integration

#### Events Features Missing
- [ ] Ticketing
- [ ] Seating chart
- [ ] Attendee management
- [ ] Check-in
- [ ] Event analytics

---

### 2.6 HEALTHCARE

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| **Consultation Forms** | Patient forms | ✅ Built |
| **Service Booking** | Appointments | ✅ Built |

#### Merchant App Screens
| Feature | Screens | Status |
|---------|---------|--------|
| **Consultation Forms** | 10+ | ✅ Built |

#### Healthcare Features Built
- [x] Consultation forms
- [x] Patient appointments

#### Healthcare Features Missing
- [ ] Patient records
- [ ] Prescription management
- [ ] Billing/Insurance
- [ ] Telemedicine

---

### 2.7 EDUCATION (MISSING)

#### What's Needed
| Feature | Priority |
|---------|----------|
| Course management | HIGH |
| Enrollment | HIGH |
| Live classes | MEDIUM |
| Assessments | MEDIUM |
| Certificates | LOW |

---

### 2.8 AUTO (MISSING)

#### What's Needed
| Feature | Priority |
|---------|----------|
| Vehicle inventory | HIGH |
| Service history | HIGH |
| Appointments | HIGH |
| Estimates | MEDIUM |
| Invoicing | MEDIUM |

---

## 3. VERTICAL MATRIX

| Feature | Restaurant | Hotel | Salon | Fitness | Events | Healthcare | Education | Auto |
|---------|-----------|-------|-------|---------|---------|------------|-----------|------|
| **Auth** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Orders** | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ❌ | ❌ |
| **Payments** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ |
| **Notifications** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Analytics** | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ |
| **Loyalty** | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **CRM** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ |
| **Inventory** | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Staff** | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **Scheduling** | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **AI Features** | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Multi-location** | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:** ✅ Built | ⚠️ Partial | ❌ Missing

---

## 4. GAPS SUMMARY

### Critical Gaps (HIGH PRIORITY)

| Vertical | Gap | Impact |
|----------|-----|--------|
| **Restaurant** | Split Bill | Consumer feature |
| **Restaurant** | Multi-location Dashboard | Enterprise |
| **Restaurant** | Delivery Tracking | Ecosystem |
| **Hotel** | Housekeeping | Operations |
| **Hotel** | Channel Manager | Revenue |
| **Salon** | Staff Commission | Finance |
| **Fitness** | Attendance | Operations |
| **Education** | Full Module | New vertical |
| **Auto** | Full Module | New vertical |

### Missing Verticals

| Vertical | Effort | Revenue Potential |
|----------|--------|------------------|
| **Education** | 2-3 weeks | High |
| **Auto** | 2-3 weeks | Medium |
| **Real Estate** | 3 weeks | High |

---

## 5. COMMON MODULE STRUCTURE

### Proposed Architecture

```
rez-merchant-service/src/modules/
├── common/                    # ALL industries
│ ├── auth/                   # Authentication
│ ├── notifications/         # Push, SMS, Email, WhatsApp
│ ├── payments/              # Wallet, Billing
│ ├── analytics/              # Reports, Export
│ ├── users/                 # Profiles
│ ├── staff/                 # Scheduling, Payroll
│ ├── inventory/             # Stock, Suppliers
│ ├── compliance/            # GST, Audits
│ └── marketing/             # Campaigns, Offers
│
├── restaurant/              # RESTAURANT only
│ ├── orders/               # Dine-in, Delivery
│ ├── menu/                  # Items, Modifiers
│ ├── kitchen/              # KDS, Prep
│ ├── tables/               # Reservations, Waitlist
│ ├── customer/              # Loyalty, Reviews
│ └── ai/                    # Demand, Pricing
│
├── hotel/                   # HOTEL only
│ ├── rooms/                 # Room types
│ ├── bookings/              # Reservations
│ ├── housekeeping/          # Tasks
│ └── channels/             # OTA integration
│
├── salon/                   # SALON only
│ ├── appointments/          # Booking
│ ├── services/              # Treatments
│ ├── staff/                 # Schedules
│ └── customers/             # History
│
├── fitness/                 # FITNESS only
│ ├── memberships/           # Plans
│ ├── classes/              # Schedule
│ └── trainers/              # Profiles
│
├── events/                  # EVENTS only
│ ├── tickets/               # Ticketing
│ ├── venues/                # Locations
│ └── schedules/             # Timetable
│
├── education/               # EDUCATION (build)
│ ├── courses/
│ ├── enrollments/
│ └── schedules/
│
└── auto/                    # AUTO (build)
 ├── vehicles/
 ├── service/
 └── customers/
```

---

## 6. RECOMMENDED ACTIONS

### Phase 1: Complete Restaurant OS
1. [ ] Split Bill
2. [ ] Multi-location Dashboard
3. [ ] Delivery Tracking
4. [ ] Waitlist

### Phase 2: Complete Existing Verticals
1. [ ] Hotel: Housekeeping, Channels
2. [ ] Salon: Commission, Inventory
3. [ ] Fitness: Attendance, Capacity
4. [ ] Events: Ticketing, Seating

### Phase 3: Build New Verticals
1. [ ] Education Module
2. [ ] Auto Module

---

## 7. SERVICES BY CATEGORY

### Core Platform
```
rez-api-gateway/
rez-auth-service/
rez-payment-service/
rez-wallet-service/
rez-order-service/
rez-merchant-service/
rez-catalog-service/
rez-search-service/
```

### AI & Intelligence
```
rez-intent-graph/
rez-intelligence-hub/
rez-ml-engine/
rez-copilot/
rez-personalization-engine/
```

### Marketing & Engagement
```
rez-marketing-service/
rez-campaigns/
rez-offers/
rez-reviews/
rez-notifications-service/
```

### Vertical-Specific
```
Restaurant: rez-kitchen-ai/, rez-merchant-service/
Hotel: rez-hotel-service/
Events: rez-event-platform/
```

---

**Document Version:** 1.0
**Last Updated:** May 8, 2026
