# ReZ Merchant Service - Complete Documentation

**Version:** 1.0
**Date:** May 8, 2026
**Status:** Complete Audit

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Routes](#3-routes)
4. [Models](#4-models)
5. [Services](#5-services)
6. [Verticals](#6-verticals)
7. [API Endpoints](#7-api-endpoints)
8. [Integrations](#8-integrations)
9. [Features](#9-features)
10. [Gaps](#10-gaps)
11. [Issues](#11-issues)

---

## 1. Overview

ReZ Merchant Service is the core platform for managing businesses across multiple verticals (restaurants, salons, hotels, etc.).

### 1.1 Service Info

| Property | Value |
|----------|-------|
| Service Name | `rez-merchant-service` |
| Port | 4005 |
| API Prefix | `/api/v1/merchant` |
| Database | MongoDB |
| Cache | Redis |
| Auth | JWT + OTP |

### 1.2 Entry Point

```
src/index.ts
├── Mounts all routers
├── Initializes middleware
├── Connects to MongoDB
├── Connects to Redis
└── Starts Express server
```

### 1.3 Project Stats

| Metric | Count |
|--------|-------|
| Route Files | 168 |
| Model Files | 83 |
| Service Files | 20 |
| Middleware Files | 17 |
| Utils Files | 46 |
| Total Source Files | 340+ |

---

## 2. Architecture

### 2.1 Directory Structure

```
rez-merchant-service/
├── src/
│ ├── index.ts                 # Entry point
│ ├── metrics.ts               # Prometheus metrics
│ │
│ ├── routes/                 # 168 route files
│ │ ├── orders/               # Order management
│ │ ├── analytics/            # Analytics & reports
│ │ ├── auth/                # Authentication
│ │ ├── dashboard/           # Dashboard
│ │ ├── products/            # Products/menu
│ │ ├── customers.ts          # Customer management
│ │ ├── campaigns.ts          # Marketing
│ │ ├── loyalty.ts           # Loyalty
│ │ ├── appointments.ts      # Bookings
│ │ └── [150+ more]
│ │
│ ├── routers/               # 15 route aggregators
│ │ ├── core.ts             # Auth, stores, products
│ │ ├── orders.ts          # Orders
│ │ ├── engagement.ts       # Engagement
│ │ ├── campaigns.ts        # Campaigns
│ │ ├── analytics.ts       # Analytics
│ │ ├── finance.ts         # Finance
│ │ ├── staff.ts           # Staff
│ │ ├── operations.ts      # Operations
│ │ ├── support.ts         # Support
│ │ ├── qr.ts              # QR codes
│ │ ├── loyaltyConfig.ts   # Loyalty config
│ │ ├── trials.ts         # Trials
│ │ └── marketingTemplates.ts
│ │
│ ├── services/              # 20 business services
│ │ ├── aggregatorHub.ts   # Aggregator integration
│ │ ├── channelManager.ts  # Channel management
│ │ ├── demandForecast.ts  # Demand forecasting
│ │ ├── dynamicPricing.ts  # Dynamic pricing
│ │ ├── ltvCalculator.ts    # LTV calculation
│ │ ├── milestoneService.ts # Loyalty milestones
│ │ ├── offerOptimizer.ts   # Offer optimization
│ │ ├── referralService.ts  # Referrals
│ │ ├── smartInventory.ts   # Smart inventory
│ │ ├── voiceKDS.ts        # Kitchen display
│ │ └── voiceService.ts     # Voice ordering
│ │
│ ├── models/                # 83 database models
│ │ ├── Merchant.ts        # Business account
│ │ ├── Store.ts           # Store/outlet
│ │ ├── Order.ts           # Orders
│ │ ├── Product.ts         # Products/menu
│ │ ├── CustomerMeta.ts    # Customer data
│ │ └── [78 more]
│ │
│ ├── middleware/            # 17 middleware
│ │ ├── auth.ts            # Authentication
│ │ ├── csrf.ts           # CSRF protection
│ │ ├── metrics.ts        # Metrics
│ │ ├── tracing.ts        # Distributed tracing
│ │ └── [12 more]
│ │
│ ├── config/                # Configuration
│ │ ├── redis.ts          # Redis connection
│ │ ├── mongodb.ts        # MongoDB connection
│ │ ├── logger.ts         # Logger
│ │ ├── env.ts            # Environment
│ │ └── [10 more]
│ │
│ ├── utils/                 # Utilities
│ │ ├── response.ts       # Response helpers
│ │ ├── encryption.ts     # Encryption
│ │ ├── paginationValidator.ts
│ │ └── [43 more]
│ │
│ ├── lib/                  # Libraries
│ ├── jobs/                 # Background jobs
│ ├── events/               # Event handlers
│ ├── scripts/              # CLI scripts
│ ├── modules/              # Modular structure (NEW)
│ │ ├── common/           # Common across industries
│ │ └── restaurant/       # Restaurant-specific
│ └── __tests__/            # Tests
```

---

## 3. Routes

### 3.1 Route Aggregators (routers/)

| Router | Mounts | Purpose |
|--------|--------|---------|
| `core.ts` | `/api/v1/merchant` | Auth, stores, products, dashboard |
| `orders.ts` | `/api/v1/merchant` | Order management |
| `engagement.ts` | `/api/v1/merchant` | Customer engagement |
| `campaigns.ts` | `/api/v1/merchant` | Marketing campaigns |
| `analytics.ts` | `/api/v1/merchant` | Reports & analytics |
| `finance.ts` | `/api/v1/merchant` | Finance |
| `staff.ts` | `/api/v1/merchant` | Staff management |
| `operations.ts` | `/api/v1/merchant` | Operations |
| `support.ts` | `/api/v1/merchant` | Support |
| `qr.ts` | `/api/v1/merchant` | QR codes |
| `loyaltyConfig.ts` | `/api/v1/merchant` | Loyalty config |
| `trials.ts` | `/api/v1/merchant` | Trials |
| `marketingTemplates.ts` | `/api/v1/merchant` | Templates |

### 3.2 Core Routes (`routes/`)

#### Authentication (`routes/auth/`)
| Route | Method | Purpose |
|-------|--------|---------|
| `index.ts` | - | Auth router |
| `core.ts` | - | Core auth |
| `login.ts` | POST | Login |
| `public.ts` | - | Public routes |
| `shared.ts` | - | Shared auth |

#### Orders (`routes/orders/`)
| Route | Method | Purpose |
|-------|--------|---------|
| `index.ts` | - | Orders router |
| `list.ts` | GET | List orders |
| `bulk.ts` | POST | Bulk operations |
| `status.ts` | PUT | Update status |
| `refund.ts` | POST | Refund |
| `detail.ts` | GET | Order details |

#### Analytics (`routes/analytics/`)
| Route | Purpose |
|-------|---------|
| `index.ts` | Analytics router |
| `churnPrediction.ts` | Churn prediction |
| `customerSegments.ts` | Customer segments |
| `customers.ts` | Customer analytics |
| `demandForecast.ts` | Demand forecasting |
| `export.ts` | Data export |
| `forecast.ts` | Forecasting |
| `ltv.ts` | Lifetime value |
| `overview.ts` | Overview |
| `products.ts` | Product analytics |
| `realtime.ts` | Real-time |
| `reporting.ts` | Reports |
| `sales.ts` | Sales analytics |

#### Dashboard (`routes/dashboard/`)
| Route | Purpose |
|-------|---------|
| `index.ts` | Dashboard router |
| `campaigns.ts` | Campaign dashboard |
| `customers.ts` | Customer dashboard |
| `overview.ts` | Overview |
| `products.ts` | Product dashboard |

#### Deal Redemptions (`routes/dealRedemptions/`)
| Route | Method | Purpose |
|-------|--------|---------|
| `index.ts` | - | Router |
| `list.ts` | GET | List |
| `redeem.ts` | POST | Redeem |
| `stats.ts` | GET | Stats |
| `verify.ts` | POST | Verify |

#### Products (`routes/products/`)
| Route | Purpose |
|-------|---------|
| `index.ts` | Products router |
| `search.ts` | Search |
| `recommendations.ts` | Recommendations |
| `restore.ts` | Restore |

### 3.3 Complete Route List (168 files)

```
routes/
├── ads.ts
├── analytics/
│   ├── index.ts
│   ├── churnPrediction.ts
│   ├── customerSegments.ts
│   ├── customers.ts
│   ├── demandForecast.ts
│   ├── export.ts
│   ├── forecast.ts
│   ├── ltv.ts
│   ├── overview.ts
│   ├── products.ts
│   ├── realtime.ts
│   ├── reporting.ts
│   └── sales.ts
├── appointments.ts
├── attribution.ts
├── audit.ts
├── auth/
│   ├── index.ts
│   ├── core.ts
│   ├── login.ts
│   ├── public.ts
│   └── shared.ts
├── automationRules.ts
├── bizdocs.ts
├── bonusZoneCampaigns.ts
├── brands.ts
├── broadcasts.ts
├── bulk.ts
├── bulkImport.ts
├── bundles.ts
├── campaignROI.ts
├── campaignRecommendations.ts
├── campaignRules.ts
├── campaignSimulator.ts
├── campaigns.ts
├── cashback.ts
├── categories.ts
├── channelManager.ts
├── classSchedules.ts
├── coins.ts
├── consultationForms.ts
├── corporate.ts
├── creatorAnalytics.ts
├── customerInsights.ts
├── customers.ts
├── dashboard/
│   ├── index.ts
│   ├── campaigns.ts
│   ├── customers.ts
│   ├── overview.ts
│   └── products.ts
├── dealRedemptions/
│   ├── index.ts
│   ├── list.ts
│   ├── redeem.ts
│   ├── stats.ts
│   └── verify.ts
├── demandSignals.ts
├── demandSignalsMerchant.ts
├── discountRules.ts
├── discounts.ts
├── disputes.ts
├── dynamicPricing.ts
├── events.ts
├── expenses.ts
├── exports.ts
├── featureFlags.ts
├── floorPlan.ts
├── franchise.ts
├── gallery.ts
├── giftCards.ts
├── goals.ts
├── gst.ts
├── images.ts
├── index.ts
├── intents.ts
├── internalRoutes.ts
├── inventory.ts
├── invoice.ts
├── invoices.ts
├── karma.ts
├── karmaPerk.ts
├── karmaPerkRoutes.ts
├── karmaRoutes.ts
├── leads.ts
├── legalDocuments.ts
├── levelBenefits.ts
├── links.ts
├── locations.ts
├── loyalty.ts
├── loyaltyConfig.ts
├── marketingTemplates.ts
├── merchantAI.ts
├── merchantAISuggestions.ts
├── merchantProfile.ts
├── merchants.ts
├── migrations.ts
├── notifications.ts
├── offers.ts
├── onboarding.ts
├── onlineOrdering.ts
├── operations.ts
├── orders/
│   ├── index.ts
│   ├── list.ts
│   ├── bulk.ts
│   ├── status.ts
│   ├── refund.ts
│   └── detail.ts
├── outage.ts
├── outlets.ts
├── oauth.ts
├── payouts.ts
├── permissions.ts
├── pos.ts
├── pricing.ts
├── productGallery.ts
├── productRestore.ts
├── products/
│   ├── index.ts
│   ├── search.ts
│   ├── recommendations.ts
│   └── restore.ts
├── profile.ts
├── promotions.ts
├── public.ts
├── pushTokens.ts
├── qrCode.ts
├── qrIntegration.ts
├── quickActions.ts
├── razorpay.ts
├── referral.ts
├── reports.ts
├── reservations.ts
├── resourceLimits.ts
├── rezNowConfig.ts
├── rezNowServices.ts
├── rezNowSetup.ts
├── search.ts
├── seo.ts
├── servicePackages.ts
├── services.ts
├── settings.ts
├── settlements.ts
├── shared.ts
├── shifts.ts
├── social.ts
├── socialLinks.ts
├── socialSharing.ts
├── staff.ts
├── storeAnalytics.ts
├── storeGallery.ts
├── storeLinks.ts
├── storeVouchers.ts
├── stores.ts
├── stripeConnect.ts
├── subscriptions.ts
├── suppliers.ts
├── support.ts
├── sync.ts
├── tableManagement.ts
├── tags.ts
├── tallyExport.ts
├── taxSettings.ts
├── team.ts
├── teamPublic.ts
├── tiers.ts
├── trials.ts
├── upcomingBookings.ts
├── uploads.ts
├── upsellRules.ts
├── userSearch.ts
├── users.ts
├── variants.ts
├── verification.ts
├── videos.ts
├── voice.ts
├── voucherRedemptions.ts
├── vouchers.ts
├── waitlist.ts
├── wallet.ts
└── webhooks.ts
```

---

## 4. Models

### 4.1 Complete Model List (83 models)

```
models/
├── AdCampaign.ts          # Ad campaigns
├── AnomalyMonitor.ts      # Monitoring
├── Attendance.ts          # Staff attendance
├── AuditLog.ts            # Audit trail
├── AutomationRule.ts      # Automation rules
├── BizDoc.ts              # Business documents
├── BlockedSlot.ts         # Blocked time slots
├── Brand.ts              # Brands
├── Broadcast.ts           # Push broadcasts
├── CampaignRule.ts        # Campaign rules
├── Cashback.ts            # Cashback records
├── Category.ts            # Categories
├── ClassSchedule.ts       # Fitness classes
├── CoinTransaction.ts     # Coin transactions
├── ComboProduct.ts        # Combo meals
├── ConsultationForm.ts    # Healthcare forms
├── CorporateAccount.ts    # Corporate accounts
├── CustomerCredit.ts      # Customer credits
├── CustomerMeta.ts        # Customer data
├── DealRedemption.ts      # Offer redemptions
├── DeletionSchedule.ts    # Data retention
├── Discount.ts           # Discounts
├── DiscountRule.ts        # Discount rules
├── Dispute.ts            # Payment disputes
├── DynamicPricingRule.ts  # Pricing rules
├── Event.ts              # Events
├── EventBooking.ts       # Event bookings
├── Expense.ts            # Expenses
├── FeatureFlag.ts        # Feature flags
├── FloorPlan.ts          # Restaurant layout
├── Gallery.ts            # Gallery
├── GiftCard.ts          # Gift cards
├── index.ts             # Export all
├── Integration.ts       # Integrations
├── KarmaCampaign.ts     # Karma campaigns
├── KarmaEvent.ts        # Karma events
├── LoyaltyAccount.ts     # Loyalty account
├── LoyaltyTier.ts       # Tier levels
├── Merchant.ts          # Merchant account
├── MerchantConsent.ts   # Consent
├── MerchantFeatureFlag.ts # Feature flags
├── MerchantLiability.ts  # Liabilities
├── MerchantLoyaltyConfig.ts # Loyalty config
├── MerchantSubscription.ts # Subscriptions
├── MerchantTemplate.ts  # Templates
├── MerchantUser.ts      # Users
├── MerchantWallet.ts    # Wallet
├── Offer.ts            # Offers
├── Order.ts            # Orders
├── Payout.ts          # Payouts
├── PayrollRecord.ts    # Payroll
├── PosShift.ts        # POS shifts
├── PriveMembership.ts  # Memberships
├── Product.ts         # Products
├── PunchCard.ts       # Punch cards
├── PurchaseOrder.ts   # Purchase orders
├── Recipe.ts          # Recipes
├── Referral.ts        # Referrals
├── Reservation.ts     # Reservations
├── Service.ts        # Services (salon)
├── ServiceBooking.ts  # Service bookings
├── ServiceCategory.ts # Service categories
├── ServicePackage.ts  # Service packages
├── Settlement.ts     # Settlements
├── Shift.ts          # Shifts
├── SocialMediaPost.ts # Social posts
├── StaffShift.ts     # Staff shifts
├── StampCard.ts       # Stamp cards
├── Store.ts          # Store
├── StoreAnalytics.ts # Store analytics
├── StoreLink.ts      # Store links
├── StorePayment.ts   # Store payments
├── StoreVisit.ts     # Store visits
├── StoreVoucher.ts   # Store vouchers
├── Subscription.ts   # Subscriptions
├── Supplier.ts       # Suppliers
├── SupportTicket.ts  # Support tickets
├── TableSession.ts   # Table sessions
├── TreatmentRoom.ts  # Treatment rooms
├── TrialOffer.ts     # Trial offers
├── UpsellRule.ts    # Upsell rules
├── Verification.ts   # KYC verification
├── Video.ts         # Videos
├── VoucherRedemption.ts # Voucher use
├── WalletTransaction.ts # Wallet txns
├── WasteLog.ts      # Waste tracking
└── WebOrder.ts      # Web orders
```

### 4.2 Model Relationships

```
Merchant (1)
├── Store (many)
│   ├── Product (many)
│   │   ├── Category (many-to-many)
│   │   └── ComboProduct (many)
│   ├── Order (many)
│   │   ├── StorePayment (many)
│   │   └── DealRedemption (many)
│   ├── CustomerMeta (many)
│   │   └── StoreVisit (many)
│   ├── TableSession (many)
│   ├── Reservation (many)
│   ├── StaffShift (many)
│   └── Attendance (many)
├── Staff (many)
│   └── Shift (many)
├── Supplier (many)
│   └── PurchaseOrder (many)
├── Offer (many)
│   └── DealRedemption (many)
├── Campaign (many)
│   └── Broadcast (many)
├── LoyaltyAccount (many)
│   ├── LoyaltyTier (reference)
│   └── Referral (many)
├── GiftCard (many)
├── Invoice (many)
└── Settlement (many)
```

---

## 5. Services

### 5.1 Complete Service List (20 files)

```
services/
├── aggregatorHub.ts      # Swiggy/Zomato/Magicpin integration
├── cdnImageService.ts   # Image CDN optimization
├── channelManager.ts    # Multi-channel management
├── churnAgent.ts       # Customer churn detection
├── demandForecast.ts   # Demand forecasting
├── demandForecastAgent.ts # Demand forecasting agent
├── dynamicPricing.ts    # Dynamic pricing rules
├── dynamicPricingAgent.ts # Dynamic pricing agent
├── index.ts            # Service exports
├── ltvCalculator.ts   # Customer LTV calculation
├── menuCacheOptimizer.ts # Menu caching
├── milestoneService.ts # Loyalty milestones
├── offerOptimizer.ts   # Auto-apply offers
├── pointsTransfer.ts   # Points transfer
├── referralService.ts  # Referral system
├── settlementService.ts # Settlements
├── smartInventory.ts   # Smart inventory
├── tallyExport.ts      # Tally export
├── voiceKDS.ts        # Kitchen display system
└── voiceService.ts     # Voice ordering
```

### 5.2 Service Details

#### aggregatorHub.ts
```typescript
class AggregatorHub {
  // Fetch orders from aggregators
  async fetchOrders(storeId: string, aggregator: string): Promise<Order[]>

  // Push menu to aggregators
  async pushMenu(storeId: string, menu: MenuItem[]): Promise<void>

  // Update item availability
  async updateAvailability(storeId: string, items: ItemAvailability[]): Promise<void>

  // Get aggregator analytics
  async getAnalytics(storeId: string): Promise<AggregatorAnalytics>
}
```

#### channelManager.ts
```typescript
class ChannelManager {
  // Sync inventory across channels
  async syncInventory(storeId: string): Promise<void>

  // Aggregate orders from all channels
  async aggregateOrders(storeId: string): Promise<Order[]>

  // Manage channel-specific settings
  async updateChannelSettings(storeId: string, channel: string, settings: any): Promise<void>
}
```

#### demandForecast.ts
```typescript
class DemandForecast {
  // Predict demand for a day
  async predictDay(storeId: string, date: Date): Promise<DemandPrediction>

  // Get hourly predictions
  async getHourlyPredictions(storeId: string, date: Date): Promise<HourlyPrediction[]>

  // Get staff recommendations
  async getStaffRecommendations(storeId: string, predictedOrders: number): Promise<number>

  // Get inventory suggestions
  async getInventorySuggestions(storeId: string, predictedOrders: number): Promise<string[]>
}
```

#### dynamicPricing.ts
```typescript
class DynamicPricing {
  // Calculate price with dynamic rules
  async calculatePrice(itemId: string, context: PricingContext): Promise<PriceResult>

  // Apply happy hour
  async applyHappyHour(itemId: string): Promise<number>

  // Apply surge pricing
  async applySurge(itemId: string, demand: number): Promise<number>

  // Get active pricing rules
  async getActiveRules(storeId: string): Promise<PricingRule[]>
}
```

#### ltvCalculator.ts
```typescript
class LTVCalculator {
  // Calculate customer LTV
  async calculateLTV(customerId: string): Promise<LTVResult>

  // Predict customer value
  async predictValue(customerId: string, months: number): Promise<number>

  // Get customer segment
  async getSegment(customerId: string): Promise<CustomerSegment>

  // Get churn risk
  async getChurnRisk(customerId: string): Promise<ChurnRisk>
}
```

#### smartInventory.ts
```typescript
class SmartInventory {
  // Get auto-reorder suggestions
  async getReorderSuggestions(storeId: string): Promise<ReorderSuggestion[]>

  // Track waste
  async trackWaste(data: WasteRecord): Promise<void>

  // Get expiry alerts
  async getExpiryAlerts(storeId: string, days: number): Promise<InventoryItem[]>

  // Get waste analytics
  async getWasteAnalytics(storeId: string, dateRange: DateRange): Promise<WasteAnalytics>
}
```

#### voiceService.ts
```typescript
class VoiceService {
  // Parse voice command
  parseVoiceCommand(text: string): ParsedOrder

  // Match items to menu
  async matchToMenu(storeId: string, items: VoiceItem[]): Promise<MenuItem[]>

  // Create order from voice
  async createOrderFromVoice(storeId: string, voiceText: string): Promise<Order>

  // Get voice menu
  async getVoiceMenu(storeId: string): Promise<VoiceMenuItem[]>
}
```

---

## 6. Verticals

### 6.1 Supported Verticals

| Vertical | Coverage | Models | Routes |
|----------|----------|--------|--------|
| Restaurant | 85% | Product, Order, TableSession, Reservation | Orders, Products, KDS |
| Salon | 70% | Service, ServiceBooking, TreatmentRoom | Appointments, Services |
| Fitness | 60% | ClassSchedule, Subscription, TrialOffer | Classes, Memberships |
| Events | 50% | Event, EventBooking | Events, Bookings |
| Healthcare | 50% | ConsultationForm, ServiceBooking | Appointments, Forms |
| Hotel | 40% | Service, ChannelManager | Reservations |

### 6.2 Vertical Features

#### Restaurant
| Feature | Status | Model/Route |
|---------|--------|--------------|
| Menu/Products | ✅ | Product.ts, products/ |
| Orders | ✅ | Order.ts, orders/ |
| Table Management | ✅ | TableSession.ts |
| Reservations | ✅ | Reservation.ts |
| Kitchen Display | ✅ | voiceKDS.ts |
| Voice Ordering | ✅ | voiceService.ts |
| Dynamic Pricing | ✅ | dynamicPricing.ts |
| Smart Inventory | ✅ | smartInventory.ts |
| Aggregator Hub | ✅ | aggregatorHub.ts |
| Demand Forecast | ✅ | demandForecast.ts |

#### Salon
| Feature | Status | Model/Route |
|---------|--------|--------------|
| Services | ✅ | Service.ts |
| Appointments | ✅ | appointments.ts |
| Staff Scheduling | ⚠️ | Basic |
| Treatment Rooms | ✅ | TreatmentRoom.ts |
| Service Packages | ✅ | ServicePackage.ts |

#### Fitness
| Feature | Status | Model/Route |
|---------|--------|--------------|
| Class Schedules | ✅ | ClassSchedule.ts |
| Memberships | ⚠️ | Subscription.ts |
| Trials | ✅ | TrialOffer.ts |
| Booking | ✅ | appointments.ts |

---

## 7. API Endpoints

### 7.1 Authentication

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/auth/login` | POST | Login with email/password |
| `/api/v1/merchant/auth/register` | POST | Register |
| `/api/v1/merchant/auth/verify-otp` | POST | Verify OTP |
| `/api/v1/merchant/auth/forgot-password` | POST | Forgot password |
| `/api/v1/merchant/auth/refresh-token` | POST | Refresh token |

### 7.2 Stores

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/stores` | GET | List stores |
| `/api/v1/merchant/stores` | POST | Create store |
| `/api/v1/merchant/stores/:id` | GET | Get store |
| `/api/v1/merchant/stores/:id` | PUT | Update store |
| `/api/v1/merchant/stores/:id` | DELETE | Delete store |

### 7.3 Products

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/products` | GET | List products |
| `/api/v1/merchant/products` | POST | Create product |
| `/api/v1/merchant/products/:id` | GET | Get product |
| `/api/v1/merchant/products/:id` | PUT | Update product |
| `/api/v1/merchant/products/:id` | DELETE | Delete product |
| `/api/v1/merchant/products/search` | GET | Search products |
| `/api/v1/merchant/products/:id/recommendations` | GET | Get recommendations |

### 7.4 Orders

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/orders` | GET | List orders |
| `/api/v1/merchant/orders` | POST | Create order |
| `/api/v1/merchant/orders/:id` | GET | Get order |
| `/api/v1/merchant/orders/:id/status` | PUT | Update status |
| `/api/v1/merchant/orders/:id/refund` | POST | Refund |

### 7.5 Customers

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/customers/:userId` | GET | Get customer |
| `/api/v1/merchant/customers/:userId` | PUT | Update customer |
| `/api/v1/merchant/customers/:userId/visits` | GET | Get visits |
| `/api/v1/merchant/customers/:userId/spend` | GET | Get spend |

### 7.6 Analytics

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/analytics/overview` | GET | Overview |
| `/api/v1/merchant/analytics/sales` | GET | Sales |
| `/api/v1/merchant/analytics/products` | GET | Products |
| `/api/v1/merchant/analytics/customers` | GET | Customers |
| `/api/v1/merchant/analytics/realtime` | GET | Real-time |
| `/api/v1/merchant/analytics/forecast` | GET | Forecast |
| `/api/v1/merchant/analytics/ltv` | GET | LTV |
| `/api/v1/merchant/analytics/churn` | GET | Churn prediction |

### 7.7 Marketing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/campaigns` | GET | List campaigns |
| `/api/v1/merchant/campaigns` | POST | Create campaign |
| `/api/v1/merchant/offers` | GET | List offers |
| `/api/v1/merchant/offers` | POST | Create offer |
| `/api/v1/merchant/discounts` | GET | List discounts |
| `/api/v1/merchant/discounts` | POST | Create discount |

### 7.8 Operations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/inventory` | GET | Get inventory |
| `/api/v1/merchant/inventory/adjust` | POST | Adjust stock |
| `/api/v1/merchant/suppliers` | GET | List suppliers |
| `/api/v1/merchant/suppliers` | POST | Create supplier |
| `/api/v1/merchant/expenses` | GET | List expenses |
| `/api/v1/merchant/expenses` | POST | Create expense |

### 7.9 Staff

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/staff` | GET | List staff |
| `/api/v1/merchant/staff` | POST | Add staff |
| `/api/v1/merchant/staff/:id/shifts` | GET | Get shifts |
| `/api/v1/merchant/staff/:id/shifts` | POST | Create shift |
| `/api/v1/merchant/staff/:id/attendance` | POST | Record attendance |

### 7.10 Loyalty

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/loyalty/accounts` | GET | List accounts |
| `/api/v1/merchant/loyalty/accounts/:id` | GET | Get account |
| `/api/v1/merchant/loyalty/tiers` | GET | List tiers |
| `/api/v1/merchant/loyalty/earn` | POST | Earn points |
| `/api/v1/merchant/loyalty/redeem` | POST | Redeem points |

### 7.11 Appointments

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/merchant/appointments` | GET | List appointments |
| `/api/v1/merchant/appointments` | POST | Create appointment |
| `/api/v1/merchant/appointments/:id` | GET | Get appointment |
| `/api/v1/merchant/appointments/:id` | PUT | Update appointment |
| `/api/v1/merchant/appointments/:id/cancel` | POST | Cancel appointment |

---

## 8. Integrations

### 8.1 Aggregators

| Aggregator | Status | Features |
|------------|--------|----------|
| Swiggy | ✅ Built | Orders, Menu sync, Availability |
| Zomato | ✅ Built | Orders, Menu sync, Availability |
| Magicpin | ✅ Built | Orders, Menu sync, Availability |

### 8.2 Payment

| Provider | Status | Features |
|----------|--------|----------|
| Razorpay | ✅ Built | Payments, Refunds, Webhooks |
| Stripe | ✅ Built | Payments, Connect |
| UPI | ✅ Built | Direct UPI |

### 8.3 Auth

| Provider | Status | Features |
|----------|--------|----------|
| Email/Password | ✅ | Login, Register |
| Phone/OTP | ✅ | Login, 2FA |
| Google OAuth | ✅ | SSO |
| Apple OAuth | ⚠️ | Partial |

### 8.4 Notifications

| Channel | Status |
|----------|--------|
| Push (FCM) | ✅ Built |
| SMS | ✅ Built |
| Email | ✅ Built |
| WhatsApp | ✅ Built |

### 8.5 Other

| Service | Status |
|---------|--------|
| Tally | ✅ Built |
| Instagram | ✅ Built |
| Facebook | ✅ Built |

---

## 9. Features

### 9.1 Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| Store Management | ✅ | Multi-store support |
| Product Management | ✅ | Full CRUD with variants |
| Order Management | ✅ | Complete lifecycle |
| Customer Management | ✅ | 360° view |
| Analytics | ✅ | Real-time + historical |
| Reporting | ✅ | Exportable reports |

### 9.2 Loyalty & Rewards

| Feature | Status | Description |
|---------|--------|-------------|
| Points System | ✅ | Earn/redeem |
| Tier System | ✅ | Bronze/Silver/Gold/Platinum |
| Referral Program | ✅ | Multi-level |
| Milestones | ✅ | Auto rewards |
| Offers | ✅ | Auto-apply |
| Gift Cards | ✅ | Create/redeem |
| Punch Cards | ✅ | Loyalty cards |

### 9.3 AI Features

| Feature | Status | Description |
|---------|--------|-------------|
| Demand Forecasting | ✅ | Hourly predictions |
| Dynamic Pricing | ✅ | Surge/happy hour |
| LTV Prediction | ✅ | Customer value |
| Churn Detection | ✅ | At-risk customers |
| Smart Inventory | ✅ | Auto-reorder |
| Voice Ordering | ✅ | Natural language |
| Kitchen Display | ✅ | Voice announcements |
| Offer Optimization | ✅ | Best offer auto-apply |

### 9.4 Operations

| Feature | Status | Description |
|---------|--------|-------------|
| Inventory | ✅ | Stock tracking |
| Waste Tracking | ✅ | Cost analysis |
| Suppliers | ✅ | Vendor management |
| Expenses | ✅ | Expense tracking |
| Staff Scheduling | ⚠️ | Basic |
| Payroll | ⚠️ | Basic |
| Attendance | ✅ | Track time |

### 9.5 Marketing

| Feature | Status | Description |
|---------|--------|-------------|
| Campaigns | ✅ | Create/manage |
| Broadcasts | ✅ | Push notifications |
| Offers | ✅ | Discounts |
| Automation | ✅ | Rules engine |
| A/B Testing | ⚠️ | Partial |

---

## 10. Gaps

### 10.1 Critical Gaps

| Gap | Priority | Impact |
|-----|----------|--------|
| Split Bill | HIGH | Consumer can't split bills |
| Social Login (Apple) | HIGH | iOS users limited |
| Delivery Tracking | HIGH | No delivery visibility |
| Driver App | HIGH | No delivery ecosystem |
| Waitlist | MEDIUM | Restaurant experience |
| Multi-location Dashboard | MEDIUM | Enterprise feature |

### 10.2 Missing Verticals

| Vertical | Missing | Effort |
|----------|---------|--------|
| Education | Full module | 2 weeks |
| Auto | Full module | 2 weeks |
| Real Estate | Full module | 2 weeks |

---

## 11. Issues

### 11.1 Code Quality

| Issue | Count | Severity |
|-------|-------|----------|
| `@ts-nocheck` | 15+ | HIGH |
| Missing error handling | 10+ | MEDIUM |
| Mock data in production | 5+ | HIGH |

### 11.2 Duplicates

| Original | Duplicate | Action |
|----------|-----------|--------|
| `demandForecast.ts` | `demandForecastAgent.ts` | Consolidate |
| `dynamicPricing.ts` | `dynamicPricingAgent.ts` | Consolidate |

---

## 12. File Locations

### 12.1 Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Entry point |
| `src/routes/` | 168 route files |
| `src/routers/` | 15 route aggregators |
| `src/services/` | 20 business services |
| `src/models/` | 83 database models |
| `src/middleware/` | 17 middleware |
| `src/config/` | Configuration |
| `src/utils/` | Utilities |

---

**Document Version:** 1.0
**Last Updated:** May 8, 2026
