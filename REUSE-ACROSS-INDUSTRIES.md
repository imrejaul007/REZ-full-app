# Services That CAN Be Shared Across Industries

## Current Inventory (Found)

| Service | Used By | Can Be Used By |
|---------|--------|------------|
| `smartInventory.ts` | Retail | Hotel, Salon, Restaurant |
| `salonInventoryService.ts` | Salon | All |
| `customer360Service.ts` | All | All (shared) |
| `aiService.ts` | All | All (shared) |
| `exportService.ts` | All | All (shared) |
| `socialCommerceService.ts` | Retail | Hotel, Salon |

## Services NOT Shared (Need Integration)

### Hotel Inventory
Hotel-specific:
- Room inventory (rooms, housekeeping)
- F&B inventory (restaurant stock)
- Amenities inventory

### Salon Inventory
Salon-specific:
- Treatment rooms
- Staff schedules
- Appointment inventory

### Restaurant Inventory
Restaurant-specific:
- Menu items
- Table bookings
- Kitchen stations

---

## What CAN Be Shared

### 1. Inventory Engine (base)
```
Base inventory service with industry-specific extensions
├── rez-inventory-engine (common)
│   ├── addStock()
│   ├── deductStock()
│   ├── getStock()
│   └── alerts()
├── HotelInventory extends Inventory
│   ├── trackRoomAvailability()
│   └── trackAmenities()
├── SalonInventory extends Inventory
│   ├── trackTreatmentRooms()
│   └── trackProducts()
└── RestaurantInventory extends Inventory
    ├── trackMenuItems()
    └── trackIngredients()
```

### 2. Customer 360 (already common)
```
All industries can use:
├── profile
├── transactions
├── loyalty
├── engagement
└── risk
```

### 3. AI Service (already common)
```
Churn, LTV, fraud work across all industries
├── Churn prediction
├── LTV scoring
├── Fraud detection
└── Recommendations
```

### 4. GST/Accounting (already common)
```
Same for all industries
├── Tally export
├── GST filing
└── Invoicing
```

### 5. Social Commerce (already common)
```
WhatsApp/Instagram works for all
├── Product links
├── Catalog sharing
└── Referral tracking
```

---

## What CANNOT Be Shared (Industry-Specific)

| Industry | Specific Features |
|---------|-------------------|
| Hotel | Room types, check-in/out, housekeeping |
| Salon | Appointments, treatments, staff schedules |
| Restaurant | Tables, menu, KDS, prep stations |
| Retail | Barcode, expiry, shelf QR |

---

## Recommendations

### 1. Create Base Inventory Service
```
packages/rez-inventory-core/
├── BaseInventoryService
│   ├── addStock()
│   ├── deductStock()
│   ├── transfer()
│   └── alerts()
└── extensions/
    ├── HotelInventoryExtension
    ├── SalonInventoryExtension
    └── RestaurantInventoryExtension
```

### 2. Extend Customer 360
```
Already common - add industry-specific fields:
├── Hotel: room preferences, stay history
├── Salon: service history, stylist preference
└── Retail: purchase history, size preferences
```

### 3. Share AI Services
```
All industries use same ML models:
├── Demand forecasting (rooms/treatments/products)
├── Churn prediction
└── Recommendations
```

### 4. Share Payment/GST Logic
```
Same for all industries:
├── GST calculations
├── Invoice generation
├── Settlement splitting
└── Refund processing
```

---

## Integration Map

```
┌─────────────────────────────────────────────────────────┐
│              SHARED SERVICES                         │
├──────────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Customer │  │ AI/ML    │  │ Export/  │  │
│  │ 360     │  │ Services │  │ Accounting│  │
│  └──────────┘  └──────────┘  └──────────┘  │
│       │             │             │            │
│       └─────────────┴─────────────┘            │
│                     │                              │
│       ┌─────────────┴─────────────┐            │
│       │                               │            │
│       ▼                               ▼            │
│  ┌─────────────────┐     ┌─────────────────┐     │
│  │  Hotel Inventory │     │ Salon Inventory  │     │
│  │  (rooms, F&B)    │     │ (treatments, rooms│     │
│  └─────────────────┘     └─────────────────┘     │
│       │                               │            │
│       └───────────────┬───────────────┘            │
│                       ▼                              │
│              ┌─────────────────┐                  │
│              │ Restaurant/KDS   │                  │
│              │ (tables, menu)   │                  │
│              └─────────────────┘                  │
└──────────────────────────────────────────────────┘
```

---

## Action Items

| # | Service | From | To | Status |
|---|---------|------|----|--------|
| 1 | Inventory | Retail | Hotel, Salon | Integrate |
| 2 | Customer 360 | Merchant | Hotel, Salon | Extend |
| 3 | AI Services | Merchant | All | Already shared |
| 4 | Export/GST | Merchant | All | Already shared |
| 5 | Social Commerce | Retail | Hotel, Salon | Extend |
| 6 | Staff Management | All | All | Share |

---

*Document: What can be shared across industries*
