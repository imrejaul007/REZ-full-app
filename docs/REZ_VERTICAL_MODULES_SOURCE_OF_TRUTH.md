# REZ VERTICAL MODULES - Source of Truth

**Version:** 1.0
**Date:** May 8, 2026
**Status:** Complete

---

## 1. COMMON SERVICES (All Industries)

These services are used by ALL industries.

### 1.1 Authentication

| Feature | Service | Status |
|---------|---------|--------|
| Email/Password | `rez-auth-service` | ✅ Built |
| Phone/OTP | `rez-auth-service` | ✅ Built |
| Google OAuth | `rez-auth-service` | ✅ Built |
| Apple OAuth | `rez-auth-service` | ⚠️ Partial |
| JWT | `rez-auth-service` | ✅ Built |
| 2FA | `rez-auth-service` | ✅ Built |

### 1.2 Payments & Wallet

| Feature | Service | Status |
|---------|---------|--------|
| Payment Processing | `rez-payment-service` | ✅ Built |
| Refunds | `rez-payment-service` | ✅ Built |
| Razorpay | `rez-payment-service` | ✅ Built |
| Stripe | `rez-payment-service` | ✅ Built |
| UPI | `rez-payment-service` | ✅ Built |
| Wallet | `rez-wallet-service` | ✅ Built |

### 1.3 Notifications

| Feature | Service | Status |
|---------|---------|--------|
| Push (FCM) | `rez-push-service` | ✅ Built |
| SMS | `rez-notifications-service` | ✅ Built |
| Email | `rez-notifications-service` | ✅ Built |
| WhatsApp | `rez-notifications-service` | ✅ Built |

### 1.4 Analytics

| Feature | Service | Status |
|---------|---------|--------|
| Real-time Dashboard | `rez-insights-service` | ✅ Built |
| Sales Analytics | `rez-merchant-service` | ✅ Built |
| Customer Analytics | `rez-merchant-service` | ✅ Built |
| Export | `rez-merchant-service` | ✅ Built |

### 1.5 CRM & Users

| Feature | Service | Status |
|---------|---------|--------|
| Customer Profiles | `rez-merchant-service` | ✅ Built |
| Customer 360 | `rez-customer-360` | ✅ Built |
| Segmentation | `rez-merchant-service` | ✅ Built |

### 1.6 Staff Management

| Feature | Service | Status |
|---------|---------|--------|
| Staff CRUD | `rez-merchant-service` | ✅ Built |
| Roles/Permissions | `rez-merchant-service` | ✅ Built |
| Attendance | `rez-merchant-service` | ✅ Built |
| Shifts | `rez-merchant-service` | ⚠️ Partial |

### 1.7 Inventory

| Feature | Service | Status |
|---------|---------|--------|
| Stock Tracking | `rez-merchant-service` | ✅ Built |
| Suppliers | `rez-merchant-service` | ✅ Built |
| Purchase Orders | `rez-merchant-service` | ✅ Built |

### 1.8 Finance

| Feature | Service | Status |
|---------|---------|--------|
| Invoicing | `rez-finance-service` | ✅ Built |
| Settlements | `rez-merchant-service` | ✅ Built |
| Payouts | `rez-merchant-service` | ✅ Built |
| GST | `rez-merchant-service` | ✅ Built |

---

## 2. VERTICAL MODULES

### 2.1 RESTAURANT - 85%

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| `rez-merchant-service` | Core restaurant | ✅ Built |
| `rez-kitchen-ai` | KDS, Voice | ✅ Built |
| `rez-aggregator-hub` | Swiggy, Zomato | ✅ Built |
| Smart Inventory | Auto-reorder | ✅ Built |
| Demand Forecast | Predictions | ✅ Built |
| Dynamic Pricing | Surge, Happy hour | ✅ Built |
| Voice Ordering | Natural language | ✅ Built |
| LTV Calculator | Customer value | ✅ Built |
| Churn Detection | At-risk | ✅ Built |
| Offer Optimizer | Auto-apply | ✅ Built |
| Recipe Costing | Margins | ✅ Built |

#### Features Built

| Feature | Status |
|---------|--------|
| Menu Management | ✅ |
| Order Management | ✅ |
| Dine-In | ✅ |
| Takeaway | ✅ |
| Delivery | ✅ |
| Table Management | ✅ |
| Reservations | ✅ |
| Kitchen Display (KDS) | ✅ |
| Voice Ordering | ✅ |
| Dynamic Pricing | ✅ |
| Smart Inventory | ✅ |
| Demand Forecast | ✅ |
| Waste Tracking | ✅ |
| Recipe Costing | ✅ |
| Aggregator Hub | ✅ |
| QR Ordering | ✅ |
| Customer Loyalty | ✅ |
| Gift Cards | ✅ |
| Punch Cards | ✅ |

#### Gaps - RESTAURANT

| Priority | Gap |
|----------|-----|
| HIGH | Split Bill |
| HIGH | Waitlist |
| MEDIUM | Multi-location Dashboard |
| MEDIUM | Delivery Tracking |

---

### 2.2 HOTEL - 40%

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| `rez-hotel-service` | Room management | ✅ Built |
| `rez-mind-hotel-service` | AI features | ✅ Built |
| Channel Manager | OTA | ⚠️ Partial |
| `rez-stayown-service` | Hotel OTA | ✅ Built |

#### Features Built

| Feature | Status |
|---------|--------|
| Room Types | ✅ |
| Room Management | ✅ |
| Booking Management | ✅ |
| Channel Manager | ⚠️ |
| Guest Management | ✅ |
| Room Availability | ✅ |

#### Gaps - HOTEL

| Priority | Gap |
|----------|-----|
| HIGH | Housekeeping |
| HIGH | Channel Manager (complete) |
| MEDIUM | Check-in/Check-out |
| MEDIUM | Concierge |

---

### 2.3 SALON - 70%

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| `Service` model | Treatments | ✅ Built |
| Appointments | Booking | ✅ Built |
| `TreatmentRoom` | Room management | ✅ Built |
| `ServicePackage` | Bundles | ✅ Built |

#### Features Built

| Feature | Status |
|---------|--------|
| Services/Treatments | ✅ |
| Appointments | ✅ |
| Treatment Rooms | ✅ |
| Service Packages | ✅ |
| Staff Scheduling | ⚠️ |

#### Gaps - SALON

| Priority | Gap |
|----------|-----|
| HIGH | Cancellation Policy |
| HIGH | Commission Tracking |
| MEDIUM | Product Inventory |
| MEDIUM | Client History |

---

### 2.4 FITNESS - 60%

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| `ClassSchedule` | Timetable | ✅ Built |
| `Subscription` | Plans | ⚠️ Partial |
| `TrialOffer` | Free trials | ✅ Built |

#### Features Built

| Feature | Status |
|---------|--------|
| Class Schedules | ✅ |
| Trial Offers | ✅ |
| Membership Plans | ⚠️ |

#### Gaps - FITNESS

| Priority | Gap |
|----------|-----|
| HIGH | Attendance Tracking |
| HIGH | Class Capacity |
| MEDIUM | Trainer Management |
| MEDIUM | Progress Tracking |

---

### 2.5 EVENTS - 50%

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| `Event` model | Event management | ✅ Built |
| `EventBooking` | Bookings | ⚠️ Partial |
| `rez-event-platform` | Platform | ✅ Built |

#### Features Built

| Feature | Status |
|---------|--------|
| Event Creation | ✅ |
| Event Booking | ⚠️ |
| Media Integration | ✅ |

#### Gaps - EVENTS

| Priority | Gap |
|----------|-----|
| HIGH | Ticketing |
| HIGH | Seating Chart |
| HIGH | Attendee Management |
| MEDIUM | Event Check-in |

---

### 2.6 HEALTHCARE - 50%

#### Backend Services
| Service | Features | Status |
|---------|----------|--------|
| `ConsultationForm` | Patient forms | ✅ Built |
| Appointments | Booking | ✅ Built |

#### Features Built

| Feature | Status |
|---------|--------|
| Consultation Forms | ✅ |
| Patient Appointments | ✅ |

#### Gaps - HEALTHCARE

| Priority | Gap |
|----------|-----|
| HIGH | Patient Records |
| HIGH | Prescription Management |
| MEDIUM | Billing/Insurance |
| MEDIUM | Telemedicine |

---

## 3. COMPLETE FEATURE MATRIX

| Feature | Restaurant | Hotel | Salon | Fitness | Events | Healthcare |
|---------|-----------|-------|-------|---------|--------|------------|
| Auth | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payments | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| Wallet | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Search | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRM | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Orders | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| Loyalty | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ |
| Inventory | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| Staff | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ |
| Scheduling | ✅ | ⚠️ | ✅ | ⚠️ | ❌ | ✅ |
| AI Features | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |

---

## 4. COVERAGE SUMMARY

| Vertical | Coverage | Gaps Count |
|----------|----------|------------|
| Restaurant | 85% | 4 |
| Salon | 70% | 4 |
| Fitness | 60% | 4 |
| Events | 50% | 4 |
| Healthcare | 50% | 4 |
| Hotel | 40% | 4 |

---

## 5. PRIORITY ACTION PLAN

### Week 1-2: Restaurant
1. [ ] Split Bill
2. [ ] Waitlist

### Week 3-4: Hotel
1. [ ] Housekeeping
2. [ ] Channel Manager

### Week 5-6: Salon & Fitness
1. [ ] Commission Tracking (Salon)
2. [ ] Attendance Tracking (Fitness)

### Week 7-8: Events & Healthcare
1. [ ] Ticketing (Events)
2. [ ] Patient Records (Healthcare)

---

## 6. FILE LOCATIONS

### Backend
| Service | Location |
|---------|----------|
| Merchant | `rez-merchant-service/` |
| Hotel | `rez-hotel-service/` |
| Kitchen AI | `rez-kitchen-ai/` |

### Frontend
| App | Location |
|-----|----------|
| Merchant | `rez-app-merchant/` |
| Hotel Admin | `rez-hotel-admin-web/` |

---

## 7. NOT IN SCOPE

- Education module
- Auto module
- Real Estate module

---

**Document Version:** 1.0
**Last Updated:** May 8, 2026
