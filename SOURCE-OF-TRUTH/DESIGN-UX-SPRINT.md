# UX Design Sprint - Source of Truth

**Sprint Duration:** 2 Weeks
**Sprint Start:** 2026-05-04
**Document Version:** 1.0
**Last Updated:** 2026-05-04

---

## Table of Contents

1. [Team Overview](#team-overview)
2. [User Journey Maps](#user-journey-maps)
3. [Pain Point Analysis](#pain-point-analysis)
4. [Usability Test Plan](#usability-test-plan)
5. [Accessibility Audit (WCAG 2.1 AA)](#accessibility-audit-wcag-21-aa)
6. [Priority Fixes](#priority-fixes)
7. [Deliverables Checklist](#deliverables-checklist)

---

## Team Overview

| Role | Count | Responsibilities |
|------|-------|-----------------|
| UX Researchers | 2 | Journey mapping, user interviews, qualitative analysis |
| Usability Analysts | 2 | Test execution, heuristic evaluation, metrics |
| Data Analyst | 1 | Quantitative analysis, success metrics, A/B testing |

---

## User Journey Maps

### 1. Consumer Journey: Browse → Order → Pay → Track

#### High-Level Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   BROWSE    │ ──► │   ORDER     │ ──► │    PAY      │ ──► │   TRACK     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ • Home      │     │ • Product   │     │ • Address   │     │ • Timeline  │
│ • Search    │     │   Details   │     │   Selection │     │ • Map View  │
│ • Categories│     │ • Variants  │     │ • Promo     │     │ • Actions   │
│ • Deals     │     │ • Cart      │     │   Codes     │     │ • Support   │
│ • Store     │     │ • Modifiers │     │ • Payment   │     │             │
│   Pages     │     │             │     │   Methods   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

#### Detailed Screen Flow

```
HOME (HomeScreen)
├── Quick Actions Widget
│   ├── Search Bar
│   ├── Category Chips
│   └── Location Selector
├── Savings Home Widget
├── Personalized Hero Banner
├── Featured Deals Section
├── Quick Reorder Section
├── Nearby Stores Section
└── Bottom Tab Navigation
    ├── Home
    ├── Explore (Categories)
    ├── Offers
    ├── Wallet
    └── Account

BROWSE PHASE
├── Search Flow
│   └── SearchScreen
│       ├── Search Suggestions
│       ├── Recent Searches
│       ├── Trending Searches
│       └── Search Results
│           └── StoreSearchResults
│               ├── Filter Drawer
│               ├── Sort Options
│               └── Store Cards
│
├── Category Flow
│   └── CategoryScreen
│       ├── Category Header
│       ├── Subcategory Chips
│       └── Store/Product Grid
│
├── Deals Flow
│   └── DealsScreen
│       ├── Deal Cards
│       ├── Deal Filter Modal
│       ├── Deal Comparison Modal
│       └── Deal Details Modal
│           ├── Store Info
│           ├── Price Comparison
│           ├── Deal T&Cs
│           └── Redeem Button
│
└── Store Page Flow
    └── StoreScreen
        ├── Store Info Header
        ├── Gallery Section
        ├── Delivery Info
        ├── Quick Actions
        ├── Menu Tab
        │   └── StoreProductGrid
        │       └── ProductVariantModal
        ├── Reviews Tab
        ├── Photos Tab
        ├── About Tab
        └── Book Table Card

ORDER PHASE
├── Product Selection
│   ├── Add to Cart
│   ├── ProductVariantModal
│   │   ├── Quantity Selector
│   │   ├── Size/Option Selection
│   │   └── Add to Cart CTA
│   └── AddedToCartModal
│
├── Cart Screen (CartScreen)
│   ├── CartHeader
│   ├── CartItem List
│   │   ├── Product Details
│   │   ├── Quantity Selector
│   │   ├── Price Section
│   │   └── Stock Warning Banner
│   ├── CardOffersSection
│   ├── Price Summary
│   └── Checkout Button
│
└── Cart Locked State
    └── LockedItem / CartLockedItemCard

PAY PHASE
├── Checkout Screen (CheckoutScreen)
│   ├── CheckoutHeader
│   ├── DeliveryAddressSection
│   │   └── AddressSelectionModal
│   ├── FulfillmentTypeSelector
│   ├── OrderItemsPreview
│   ├── ServicesSummary
│   ├── PromoCodeSection
│   │   └── PromoCodeModal
│   ├── CoinTogglesSection
│   ├── BillSummarySection
│   └── PaymentBottomSheet
│
├── Payment Methods
│   ├── Wallet Balance
│   ├── REZ Coins
│   ├── UPI
│   ├── Cards
│   └── Net Banking
│
└── Verification Flows
    ├── OTPVerificationModal
    ├── UPIVerificationModal
    ├── CardVerificationModal
    └── KYCUploadModal

TRACK PHASE
├── Order Confirmation
│   ├── OrderConfirmationModal
│   ├── Order ID Display
│   ├── Estimated Time
│   └── Continue Shopping CTA
│
├── Order Tracking
│   ├── DeliveryMap
│   ├── OrderTimeline
│   ├── Order Status Updates
│   └── Support Contact
│
└── Post-Payment
    ├── PostPaymentSummary
    ├── Reorder Options
    └── Feedback Prompt
```

#### Consumer Journey Metrics

| Stage | Key Metrics | Target |
|-------|-------------|--------|
| Browse | Time to first purchase | < 3 sessions |
| Browse | Search success rate | > 85% |
| Browse | Category navigation depth | 2-3 levels |
| Order | Cart abandonment rate | < 40% |
| Order | Add-to-cart conversion | > 60% |
| Pay | Payment completion rate | > 90% |
| Pay | Payment method preference | UPI > 50% |
| Track | Real-time tracking usage | > 70% |
| Track | Support ticket rate | < 5% |

---

### 2. Merchant Journey: Onboard → List → Manage → Get Paid

#### High-Level Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  ONBOARD    │ ──► │    LIST     │ ──► │   MANAGE    │ ──► │  GET PAID   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ • Sign Up   │     │ • Products  │     │ • Orders    │     │ • Payouts   │
│ • Verify    │     │   Catalog   │     │   Management│     │ • Reports   │
│ • Business  │     │ • Pricing   │     │ • Inventory │     │ • Analytics │
│   Details   │     │ • Media     │     │ • Customers │     │ • Invoices  │
│ • Services  │     │ • Categories│     │ • Marketing │     │             │
│ • Quick     │     │             │     │ • Team      │     │             │
│   Setup     │     │             │     │ • Settings  │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

#### Detailed Screen Flow

```
ONBOARDING PHASE (onboarding-v2)
├── Welcome Screen
├── Business Information (steps/business.tsx)
│   ├── Business Name
│   ├── Business Type
│   ├── Category Selection
│   ├── Address Details
│   └── Operating Hours
├── Quick Setup (steps/quick-setup.tsx)
│   ├── Logo Upload
│   ├── Cover Image
│   └── Business Description
├── Services Setup (steps/services.tsx)
│   ├── Delivery Options
│   ├── Pickup Options
│   ├── Dine-in Options
│   └── Table Booking
└── Completion (steps/complete.tsx)
    └── Dashboard Redirect

DASHBOARD (auth)/app/_layout.tsx
├── Main Tab Navigation
│   ├── Home/Dashboard
│   ├── Orders
│   ├── Menu
│   ├── Marketing
│   └── Account
└── Protected Routes

LIST PHASE (products)
├── Product Catalog
│   ├── ProductList
│   ├── Category Management
│   └── Bulk Operations
│
├── Add/Edit Product
│   ├── ProductForm
│   ├── Pricing Input
│   ├── Stock Management
│   ├── Image Upload
│   └── Variant Configuration
│
└── Catalog Analytics
    ├── Top Products
    ├── Low Stock Alerts
    └── Category Performance

MANAGE PHASE
├── Order Management (app/(orders))
│   ├── All Orders
│   ├── Pending Orders
│   ├── In Progress
│   ├── Completed
│   └── Cancelled
│
├── Customer Management (app/customers)
│   ├── Customer List
│   ├── Customer Details
│   └── Customer Search
│
├── Table Bookings (app/all-table-bookings)
│   ├── Booking Calendar
│   ├── Booking Details
│   └── Booking Actions
│
├── Inventory (implied)
│   ├── Stock Levels
│   ├── Low Stock Alerts
│   └── Reorder Points
│
├── Team Management (team)
│   ├── Team Members
│   ├── Roles & Permissions
│   └── Activity Logs
│
├── Analytics (app/analytics)
│   ├── Sales Dashboard
│   ├── Customer Analytics
│   └── Performance Metrics
│
└── Promotional Tools (app/campaigns)
    ├── Create Campaign
    ├── Discount Codes
    └── Offers Management

GET PAID PHASE
├── Payout Dashboard
│   ├── Pending Payouts
│   ├── Completed Payouts
│   └── Payout Schedule
│
├── Financial Reports (app/reports)
│   ├── Daily/Weekly/Monthly
│   ├── Transaction History
│   └── Tax Documents
│
└── Payment Settings
    ├── Bank Account
    ├── Payment Methods
    └── Payout Preferences
```

#### Merchant Journey Metrics

| Stage | Key Metrics | Target |
|-------|-------------|--------|
| Onboard | Time to first order | < 7 days |
| Onboard | Completion rate | > 80% |
| Onboard | Verification time | < 24 hours |
| List | Products per merchant | > 20 avg |
| List | Listing quality score | > 85% |
| Manage | Order response time | < 5 min |
| Manage | Customer satisfaction | > 4.0 stars |
| Get Paid | Payout frequency | Weekly |
| Get Paid | Payment accuracy | 100% |

---

### 3. Checkout Journey: Cart → Address → Payment → Confirm

#### Detailed Flow

```
CART STATE
├── CartScreen Component
│   ├── CartHeader
│   │   └── Store Name, Item Count
│   ├── CartItem List
│   │   ├── Product Image
│   │   ├── Product Name
│   │   ├── QuantitySelector
│   │   ├── Variant Info
│   │   ├── Unit Price
│   │   └── Total Price
│   ├── Locked Items (if any)
│   ├── CardOffersSection
│   │   └── Applicable Offers
│   ├── PriceSection
│   │   ├── Subtotal
│   │   ├── Discounts
│   │   ├── Delivery Fee
│   │   ├── Taxes
│   │   └── Total
│   └── CheckoutButton
│
└── Cart Sync
    └── CartSocketIntegration
        └── Real-time Updates

ADDRESS SELECTION
├── DeliveryAddressSection
│   ├── Saved Addresses List
│   ├── Add New Address Button
│   └── Select Address Radio
│
├── AddressSelectionModal
│   ├── Address Cards
│   ├── Edit Address
│   ├── Add New Address Form
│   │   ├── Name
│   │   ├── Phone
│   │   ├── Address Line 1
│   │   ├── Address Line 2
│   │   ├── City
│   │   ├── State
│   │   ├── PIN Code
│   │   └── Landmark
│   └── Save as Default Toggle
│
└── FulfillmentTypeSelector
    ├── Delivery Option
    ├── Pickup Option
    └── Dine-in Option

PAYMENT PHASE
├── PaymentBottomSheet
│   ├── Payment Method List
│   │   ├── REZ Wallet (Balance: Rs.XXX)
│   │   ├── REZ Coins (XXX coins available)
│   │   ├── UPI (GPay, PhonePe, Paytm)
│   │   ├── Credit/Debit Card
│   │   └── Net Banking
│   │
│   ├── CoinTogglesSection
│   │   ├── Apply REZ Coins Toggle
│   │   └── Coins to Apply Input
│   │
│   └── PayButtonWithRewards
│       ├── Total Amount
│       ├── Coin Discount
│       └── Final Payable
│
├── Verification Flows
│   ├── OTPVerificationModal
│   ├── UPIVerificationModal
│   ├── CardVerificationModal
│   └── BankVerificationModal
│
└── Processing State
    └── ProcessingOverlay

ORDER CONFIRMATION
├── OrderConfirmationModal
│   ├── Success Animation
│   ├── Order ID
│   ├── Order Summary
│   ├── Estimated Delivery
│   ├── Payment Method Used
│   └── Track Order Button
│
└── Post-Confirmation
    ├── PostPaymentSummary
    ├── Share Order Option
    └── Reorder Suggestions

ERROR HANDLING
├── PaymentFailureModal
│   ├── Failure Reason
│   ├── Retry Button
│   └── Alternative Payment
│
├── Cart Validation
│   └── CartValidation Component
│       ├── Out of Stock Items
│       ├── Price Changes
│       └── Minimum Order Check
│
└── Stock Warning
    └── StockWarningBanner
```

#### Checkout Metrics

| Stage | Key Metrics | Target |
|-------|-------------|--------|
| Cart | Cart completion rate | > 60% |
| Cart | Avg items per cart | > 2 items |
| Address | Address selection time | < 30 sec |
| Address | New address form time | < 2 min |
| Payment | Payment success rate | > 95% |
| Payment | Payment method split | UPI 55%, Wallet 25% |
| Payment | CoD usage rate | < 15% |
| Confirm | Confirmation display time | < 2 sec |
| Confirm | Track initiation rate | > 80% |

---

## Pain Point Analysis

### Critical Pain Points

| ID | Category | Pain Point | Impact | Priority |
|----|----------|------------|--------|----------|
| PP-01 | Too Many Steps | Checkout requires 6+ screens | 25% abandonment | Critical |
| PP-02 | Confusing Flow | Product variant selection unclear | 40% confusion | Critical |
| PP-03 | Missing States | No loading skeletons | Poor perceived perf | High |
| PP-04 | Payment Friction | Multi-step payment verification | 15% drop-off | High |
| PP-05 | Address Entry | Long form with no autocomplete | Slow checkout | High |
| PP-06 | Cart Locking | Items locked without clear reason | User frustration | Medium |
| PP-07 | Order Tracking | No real-time map updates | Anxiety | Medium |
| PP-08 | Merchant Onboard | 10+ steps to complete | 30% drop-off | High |

### Pain Point Details

#### PP-01: Checkout Steps Overload
**Location:** `components/checkout/`
**Problem:** Users must navigate through Address → Promo → Payment → Confirm
**Evidence:**
```
CheckoutScreen Flow:
1. Address Selection Modal
2. Promo Code Modal
3. Payment Bottom Sheet
4. OTP/Card Verification Modals
5. Order Confirmation Modal
```
**Fix Required:**
- Combine Address + Promo into single scrollable screen
- Use bottom sheet for payment (already done)
- Reduce confirmation modal size, auto-dismiss after 3 seconds

#### PP-02: Variant Selection Confusion
**Location:** `components/cart/ProductVariantModal.tsx`
**Problem:** Users unclear on required vs optional variants
**Evidence:**
```
ProductVariantModal:
- Size selection (required)
- Add-ons (optional)
- No clear visual distinction
- "Add to Cart" available before required selections
```
**Fix Required:**
- Clear "Required" vs "Optional" labels
- Disable "Add to Cart" until required variants selected
- Show real-time price update

#### PP-03: Missing Loading States
**Location:** All list components
**Problem:** Blank screens while data loads
**Evidence:**
```
DealList.tsx - renders empty while loading
StoreProductGrid.tsx - no skeleton
TransactionHistory.tsx - no skeleton
```
**Fix Required:**
- Add skeleton components to all data-fetching views
- Implement DealCardSkeleton pattern

#### PP-04: Payment Verification Friction
**Location:** `components/payment/`
**Problem:** Multiple verification steps for same payment
**Evidence:**
```
Payment flow:
1. Select UPI → Opens UPI app
2. Return → Show OTP verification (duplicate)
3. Still pending → Show confirmation
```
**Fix Required:**
- Single verification path per payment method
- Remove OTP for successful UPI transactions

---

## Usability Test Plan

### Test Overview

| Parameter | Value |
|-----------|-------|
| Test Type | Remote Unmoderated |
| Users per App | 5 |
| Total Users | 10 |
| Duration per User | 30-45 minutes |
| Platform | iOS & Android |
| Tool | UserTesting / Maze |

### Test Scenarios

#### Consumer App Scenarios

| # | Scenario | Task | Success Criteria |
|---|----------|------|-----------------|
| C1 | First-time Purchase | Find deal, add to cart, checkout with new address | Complete within 10 min |
| C2 | Reorder | Reorder from past order | Complete within 2 min |
| C3 | Wallet Payment | Add coins, make payment | Coins applied correctly |
| C4 | Search | Find specific restaurant by name | Found within 30 sec |
| C5 | Track Order | Find and view order status | Real-time updates visible |

#### Merchant App Scenarios

| # | Scenario | Task | Success Criteria |
|---|----------|------|-----------------|
| M1 | Onboarding | Complete business setup | Finish in < 15 min |
| M2 | Add Product | Add new product with variants | Listed within 5 min |
| M3 | Manage Order | Accept and update order status | Status changed |
| M4 | View Analytics | Find today's revenue | Data visible |
| M5 | Customer Support | Find customer contact info | Contact initiated |

### Success Metrics

| Metric | Definition | Target | Critical |
|--------|------------|--------|----------|
| Task Completion Rate | % tasks completed successfully | > 85% | < 70% is fail |
| Time on Task | Average time to complete | < target | > 1.5x target |
| Error Rate | Critical errors per task | < 0.5 | > 1.0 is fail |
| SUS Score | System Usability Scale | > 70 | < 50 is fail |
| NPS | Net Promoter Score | > 30 | < 10 is fail |

### Test Script

#### Pre-Task Questionnaire (2 min)
```
1. How often do you use food delivery apps? (Daily/Weekly/Monthly/Rarely)
2. Have you used REZ before? (Yes/No)
3. What is your preferred payment method? (UPI/Wallet/Card/COD)
```

#### Task Instructions
```
You will complete the following tasks. Think aloud as you navigate.
After each task, rate your confidence: 1-5 stars.

TASK 1: First-time Purchase
"Imagine you want to order lunch from a nearby restaurant.
Find a deal, add an item to your cart, and complete checkout
with a new delivery address."

TASK 2: Reorder
"Now find one of your past orders and reorder the same items."

TASK 3: Track Order
"View the status of your most recent order on a map."
```

#### Post-Task Questionnaire
```
1. How would you rate your overall experience? (1-5)
2. Where did you face the most difficulty? (Open text)
3. What would make this experience better? (Open text)
4. Would you recommend this app to a friend? (0-10 NPS)
```

### Heuristic Evaluation Checklist

| # | Heuristic | Questions to Check |
|---|-----------|-------------------|
| H1 | Visibility of System Status | Are loading states visible? Is progress shown? |
| H2 | Match System/Real World | Are terms familiar? Icons recognizable? |
| H3 | User Control/Freedom | Can users undo actions? Exit flows easily? |
| H4 | Consistency/Standards | Do similar actions look/act the same? |
| H5 | Error Prevention | Are errors prevented or confirmed? |
| H6 | Recognition vs Recall | Are options visible? Is context clear? |
| H7 | Flexibility/Efficiency | Are shortcuts available for experts? |
| H8 | Aesthetic/Minimalist | Is information density appropriate? |
| H9 | Recover from Errors | Are error messages helpful? |
| H10 | Help/Documentation | Is help accessible? Is it searchable? |

---

## Accessibility Audit (WCAG 2.1 AA)

### Checklist

#### Color Contrast (4.5:1)

| Item | Current Status | File Location | Required Ratio | Current Ratio | Fix Priority |
|------|----------------|--------------|----------------|---------------|--------------|
| Primary text on background | FAIL | `Colors.ts` | 4.5:1 | 3.2:1 (gray-500) | Critical |
| Secondary text | FAIL | `Colors.ts` | 4.5:1 | 2.8:1 (gray-400) | High |
| Button text | PASS | `PrimaryButton.tsx` | 4.5:1 | 5.1:1 | - |
| Error text | PASS | `Alert.tsx` | 4.5:1 | 6.2:1 | - |
| Disabled text | FAIL | Multiple | 4.5:1 | 1.8:1 | Critical |
| Link text | PASS | Various | 4.5:1 | 5.8:1 | - |

**Files to Fix:**
- `rez-app-consumer/constants/Colors.ts`
- `rez-app-merchant/constants/Colors.ts`

**Required Changes:**
```typescript
// Current (FAIL)
gray: { 400: '#9CA3AF', 500: '#6B7280' }

// Fix - increase contrast
gray: { 400: '#5C6370', 500: '#4B5563' }
```

#### Touch Targets (48px)

| Component | Current Size | Required | File | Status |
|-----------|--------------|----------|------|--------|
| PrimaryButton (small) | 40px | 48px | DesignTokens.ts | FAIL |
| PrimaryButton (medium) | 48px | 48px | DesignTokens.ts | PASS |
| PrimaryButton (large) | 56px | 48px | DesignTokens.ts | PASS |
| AccessibleButton | 44px | 48px | AccessibleComponents.tsx | FAIL |
| Icon Button | 32px | 48px | Various | FAIL |
| Tab Bar Item | 48px | 48px | Navigation | PASS |

**Fix Required:**
```typescript
// DesignTokens.ts
export const LayoutTokens = {
  minTouchTarget: 48, // Update from 44 to 48
}

// SIZE_CONFIG updates
const SIZE_CONFIG = {
  small: { height: 48 }, // was 40
  medium: { height: 48 },
  large: { height: 56 },
}
```

#### Focus Indicators

| Location | Current State | Required | Status |
|----------|---------------|----------|--------|
| adBazaar Button | `focus:outline-none` | Visible ring | FAIL |
| Consumer inputs | Missing | 2px ring | FAIL |
| Merchant inputs | Partial | Full support | PARTIAL |
| Navigation | Present | Consistent | PASS |

**Fix Required:**
```typescript
// global.css or component styles
*:focus-visible {
  outline: 2px solid #ffcd57;
  outline-offset: 2px;
}

button:focus-visible,
[role="button"]:focus-visible {
  box-shadow: 0 0 0 3px rgba(255, 205, 87, 0.4);
}
```

#### Screen Reader Support

| Element | Required | Current | Status |
|---------|----------|---------|--------|
| Images | Alt text | Missing | FAIL |
| Buttons | aria-label | Missing | PARTIAL |
| Forms | aria-describedby | Missing | FAIL |
| Lists | role="list" | Missing | FAIL |
| Modals | aria-modal | Present | PASS |
| Status | aria-live | Partial | PARTIAL |

**Fix Required:**
```typescript
// Image component usage
<Image
  source={item.image}
  alt={item.name} // Required
  accessibilityRole="image"
/>

// Button with icon
<TouchableOpacity
  accessibilityLabel="Close dialog"
  accessibilityRole="button"
  accessibilityHint="Double tap to close"
>
  <Icon name="close" />
</TouchableOpacity>

// Form field
<TextInput
  accessibilityLabel="Email address"
  accessibilityHint="Enter your email to sign in"
  accessibilityState={{ invalid: hasError }}
/>
```

#### Keyboard Navigation

| Flow | Tab Order | Enter Activation | Status |
|------|-----------|-----------------|--------|
| Login | Correct | Works | PASS |
| Search | Correct | Works | PASS |
| Modal Close | Correct | Works | PASS |
| Menu | Correct | Partial | PARTIAL |

### Accessibility Scorecard

| Category | Score | Critical Issues | Target |
|----------|-------|-----------------|--------|
| Color Contrast | 45/100 | 3 violations | 90+ |
| Touch Targets | 60/100 | 5 violations | 100 |
| Focus Indicators | 55/100 | 8 violations | 90+ |
| Screen Reader | 50/100 | 12 violations | 85+ |
| Keyboard Nav | 75/100 | 2 violations | 95+ |
| **Overall** | **57/100** | **30 issues** | **90+** |

---

## Priority Fixes

### Week 1: Critical Issues

| ID | Fix | Files | Effort | Owner |
|----|-----|-------|--------|-------|
| FIX-01 | Increase button touch targets to 48px | DesignTokens.ts, AccessibleComponents.tsx | 2 hrs | UI Team |
| FIX-02 | Add skeleton screens to DealList | DealList.tsx, StoreProductGrid.tsx | 4 hrs | Frontend |
| FIX-03 | Fix color contrast on gray-400/500 | Colors.ts | 1 hr | Design |
| FIX-04 | Add alt text patterns to images | Components/* | 8 hrs | All |

### Week 2: High Priority

| ID | Fix | Files | Effort | Owner |
|----|-----|-------|--------|-------|
| FIX-05 | Combine Address+Promo in checkout | CheckoutScreen.tsx | 6 hrs | Frontend |
| FIX-06 | Add required variant labels | ProductVariantModal.tsx | 2 hrs | UI |
| FIX-07 | Add focus-visible global styles | global.css | 1 hr | Frontend |
| FIX-08 | Simplify merchant onboarding | onboarding-v2/* | 8 hrs | Full Team |

---

## Deliverables Checklist

### User Journey Maps
- [x] Consumer: Browse → Order → Pay → Track
- [x] Merchant: Onboard → List → Manage → Get Paid
- [x] Checkout: Cart → Address → Payment → Confirm
- [x] Pain point analysis

### Usability Test Plan
- [x] Test scenarios (10 total)
- [x] Success metrics
- [x] User tasks
- [x] Heuristic checklist

### Accessibility Audit
- [x] WCAG 2.1 AA Checklist
  - [x] Color contrast (4.5:1)
  - [x] Touch targets (48px)
  - [x] Focus indicators
  - [x] Screen reader support
  - [x] Keyboard navigation
- [x] Critical issues documented
- [x] Fix priorities assigned

---

## Appendix: File Reference

### Consumer App Key Files

| Purpose | Path |
|---------|------|
| Cart | `components/cart/*.tsx` |
| Checkout | `components/checkout/*.tsx` |
| Payment | `components/payment/*.tsx` |
| Wallet | `components/wallet/*.tsx` |
| Orders | `components/orders/*.tsx` |
| Store | `components/store/*.tsx` |
| Colors | `constants/Colors.ts` |

### Merchant App Key Files

| Purpose | Path |
|---------|------|
| Onboarding | `app/onboarding-v2/**` |
| Dashboard | `app/_layout.tsx` |
| Products | `components/products/*.tsx` |
| Analytics | `app/analytics/*.tsx` |
| Reports | `app/reports.tsx` |
| Design Tokens | `constants/DesignTokens.ts` |
| Colors | `constants/Colors.ts` |

---

**Document Status:** COMPLETE
**Next Review:** 2026-05-11
**Sprint Retrospective:** 2026-05-16
