# MERCHANT SALES STRATEGIES & POLICIES

**Date:** 2026-05-02
**Status:** ✅ FEATURE COMPLETE

---

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║              MERCHANT-SPECIFIC SALES STRATEGIES - COMPLETE                    ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## WHAT WAS ADDED

### Merchant Knowledge Base - Enhanced

```
✅ Merchant Types: restaurant, hotel, retail, spa, gym, salon, taxi, other
✅ Sales Strategies: complimentary offers, discounts, promotions
✅ Type-specific Policies: Every merchant type has unique policies
```

---

## MERCHANT TYPES & POLICIES

### Restaurant Policies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RESTAURANT POLICIES                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ORDERING:                                                              │
│  ├── Min order value                                                   │
│  ├── Delivery fee / Free delivery above                                  │
│  ├── Delivery areas                                                    │
│  └── Delivery time                                                     │
│                                                                             │
│  DINING:                                                               │
│  ├── Reservation required                                               │
│  ├── Advance booking hours                                              │
│  └── Party size limit                                                  │
│                                                                             │
│  COMPLIMENTARY:                                                        │
│  ├── Free drink (e.g., "after 7pm")                                  │
│  ├── Free appetizer (e.g., "for 4+ guests")                           │
│  ├── Free dessert (e.g., "birthday special")                         │
│  └── Birthday offer                                                     │
│                                                                             │
│  SERVICES:                                                              │
│  ├── Takeout available                                                  │
│  ├── Dine-in only                                                      │
│  ├── Catering available                                                 │
│  └── Private dining available                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Hotel Policies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HOTEL POLICIES                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CHECK-IN/OUT:                                                         │
│  ├── Check-in time (e.g., 2:00 PM)                                    │
│  ├── Check-out time (e.g., 11:00 AM)                                   │
│  ├── Late checkout available? (Free or Charged)                         │
│  ├── Late checkout fee (₹)                                             │
│  └── Early check-in available?                                          │
│                                                                             │
│  AMENITIES:                                                             │
│  ├── Complimentary breakfast                                            │
│  ├── Complimentary WiFi                                                │
│  ├── Complimentary parking                                             │
│  ├── Complimentary gym access                                          │
│  └── Complimentary pool access                                          │
│                                                                             │
│  SERVICES:                                                              │
│  ├── Room service                                                      │
│  ├── Laundry available                                                 │
│  ├── Airport transfer                                                  │
│  └── 24h concierge                                                     │
│                                                                             │
│  POLICIES:                                                              │
│  ├── Security deposit                                                   │
│  └── ID required                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Retail Policies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RETAIL POLICIES                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RETURNS:                                                               │
│  ├── Accepts returns? (Yes/No)                                          │
│  ├── Return window (days)                                               │
│  ├── Return conditions                                                  │
│  ├── Store credit only?                                                 │
│  └── Original packaging required?                                        │
│                                                                             │
│  LOYALTY:                                                               │
│  ├── Loyalty points enabled?                                            │
│  └── Points per rupee                                                   │
│                                                                             │
│  SERVICES:                                                              │
│  ├── Gift wrapping available?                                            │
│  ├── Gift wrapping fee                                                  │
│  └── Alteration service                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Other Merchant Types

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ OTHER MERCHANT TYPES                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SPA/SALON:                                                            │
│  ├── Advance booking required                                           │
│  ├── Cancellation window                                                │
│  ├── Packages available                                                 │
│  ├── Membership available                                                │
│  └── Health form required                                               │
│                                                                             │
│  GYM:                                                                  │
│  ├── Joining fee                                                        │
│  ├── Monthly/yearly fee                                                │
│  ├── 24h access                                                       │
│  ├── Guest passes included                                             │
│  └── Locker rental                                                     │
│                                                                             │
│  TAXI/RIDE:                                                            │
│  ├── Base fare                                                         │
│  ├── Per km rate                                                       │
│  ├── Minimum fare                                                     │
│  ├── Airport transfer                                                  │
│  └── Corporate accounts                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SALES STRATEGIES

### Complimentary Offers

```typescript
{
  item: "Free Cocktail",
  condition: "after 7pm",
  description: "One complimentary cocktail per guest",
  isActive: true
}
```

### Discounts

```typescript
{
  name: "Happy Hour",
  type: "percentage", // or "fixed", "bogo", "free_item"
  value: 20,
  minOrder: 500,
  applicableTo: ["drinks", "appetizers"],
  validDays: ["friday", "saturday"],
  validHours: { start: "17:00", end: "19:00" },
  code: "HAPPY20",
  description: "20% off drinks during happy hour",
  isActive: true
}
```

### Promotions

```typescript
{
  name: "Weekend Special",
  type: "seasonal",
  description: "Buy 1 Get 1 Free on main course",
  discount: { type: "bogo", value: 1 },
  startDate: "2026-05-01",
  endDate: "2026-05-31",
  isActive: true
}
```

---

## API ENDPOINTS

### Sales Strategies

```
GET  /api/merchants/:id/sales-strategies
POST /api/merchants/:id/sales-strategies/complimentary
POST /api/merchants/:id/sales-strategies/discounts
POST /api/merchants/:id/sales-strategies/promotions
```

### Policies

```
GET  /api/merchants/:id/policies
PUT  /api/merchants/:id/policies
PATCH /api/merchants/:id/policies/type
GET  /api/merchants/policies/by-type?type=restaurant
```

### AI Recommendations

```
GET  /api/merchants/:id/sales-recommendations
```

---

## ADMIN PANEL UI

```
SalesStrategies.tsx page includes:
├── Complimentary Offers Manager
├── Discounts Manager
├── Promotions Manager
├── Policy Editor (by merchant type)
└── AI Sales Recommendations Display
```

---

## HOW AI USES THIS

### Example: Customer Asks About Late Checkout

```
Customer: "Can I get late checkout?"
         ↓
REZ-support-copilot checks knowledge base
         ↓
Finds: policies.hotel.lateCheckoutAvailable = true
Finds: policies.hotel.lateCheckoutFee = 500
         ↓
Response: "Yes! Late checkout is available for ₹500. Would you like me to add that?"
```

### Example: Restaurant Upsell

```
Customer: "I'm ordering dinner for 4"
         ↓
REZ-support-copilot checks knowledge base
         ↓
Finds: policies.restaurant.complimentaryDrink
Finds: discounts.active (Happy Hour)
         ↓
Response: "Great choice! We have complimentary drinks for your table, and Happy Hour is active - 20% off drinks until 7pm!"
```

---

## COMMITS

```
rez-knowledge-base-service: 1113b38
- Added MerchantType enum
- Added type-specific policy schemas
- Added sales strategy interfaces
- Added API routes for sales strategies

rez-admin-training-panel: ff804bb
- Created SalesStrategies.tsx page
- Added policy editor UI
- Added AI recommendations display
```

---

**Last Updated:** 2026-05-02
**Status:** FEATURE COMPLETE
