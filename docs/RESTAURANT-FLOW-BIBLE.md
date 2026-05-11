# Restaurant Flow Bible
**Version:** 1.0  
**Date:** 2026-05-10  
**Ecosystem:** ReZ Restaurant Industry Platform

---

## Executive Summary

This document defines the complete operational flows for the ReZ Restaurant Ecosystem, covering all 10 core flows, state machines, event systems, and integration points.

### Architecture Layers

| Layer | Product | Status |
|-------|---------|--------|
| Customer Demand | ReZ App | ✅ Core |
| Restaurant Software | ReZ Merchant | ✅ Needs Work |
| Restaurant Interface | ReZ Web Menu | ✅ Needs Work |
| Restaurant Growth | RestoPapa | ✅ Needs Work |
| Restaurant Supply | NextaBizz | ✅ Needs Work |

---

## Part 1: State Machines

### 1.1 Order State Machine

```
                    ┌─────────────┐
                    │   PENDING   │
                    └──────┬──────┘
                           │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ ACCEPTED │ │ REJECTED │ │ CANCELLED │
        └────┬─────┘ └──────────┘ └──────────┘
             │
             ▼
        ┌──────────┐
        │PREPARING │
        └────┬─────┘
             │
       ┌─────┴─────┐
       │           │
       ▼           ▼
┌──────────┐ ┌──────────┐
│  READY   │ │ DELAYED  │
└────┬─────┘ └────┬─────┘
     │           │
     ▼           ▼
┌──────────┐ ┌──────────┐
│  SERVED  │ │PREPARING │
└────┬─────┘ └──────────┘
     │
     ▼
┌──────────┐     ┌──────────┐
│COMPLETED │     │ REFUNDED │
└──────────┘     └──────────┘
```

**States:**
| State | Description | Allowed Actions |
|-------|-------------|----------------|
| PENDING | Order created, awaiting acceptance | accept, reject, cancel |
| ACCEPTED | Kitchen confirmed order | prepare, cancel |
| REJECTED | Order rejected by restaurant | - |
| PREPARING | Kitchen actively cooking | ready, delay |
| DELAYED | Order delayed | resume, cancel |
| READY | Food ready for pickup/delivery | serve |
| SERVED | Food delivered to customer | complete |
| COMPLETED | Order fulfilled | - |
| CANCELLED | Order cancelled | - |
| REFUNDED | Payment refunded | - |

### 1.2 Table State Machine

```
┌─────────┐    open     ┌─────────┐
│  CLOSED │────────────▶│  OPEN   │
└─────────┘             └────┬────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
  ┌───────────┐       ┌───────────┐      ┌───────────┐
  │  OCCUPIED│       │  VACANT   │      │  RESERVED │
  └─────┬─────┘       └─────┬─────┘      └─────┬─────┘
        │                   │                  │
        │    close/split   │                  │
        │◀─────────────────┼─────────────────▶│
        │                  │                  │
        └──────────────────┴──────────────────┘
                              │
                         ┌────┴────┐
                         │ CLOSED  │
                         └─────────┘
```

### 1.3 Payment State Machine

```
┌────────────┐
│  PENDING   │
└─────┬──────┘
      │
      ▼
┌─────────────────────────────┐
│       PROCESSING            │
│  ┌─────────────────────┐   │
│  │ UPI │ CARD │ WALLET │   │
│  └─────────────────────┘   │
└─────┬───────────────────────┘
      │
┌─────┴─────┐
│           │
▼           ▼
┌────────┐ ┌────────┐
│ SUCCESS│ │ FAILED │
└────┬───┘ └────────┘
     │
     ▼
┌────────────────┐
│   COMPLETED    │
└────────────────┘
```

---

## Part 2: Core Flows

### FLOW 1: Customer Discovery Flow

**Trigger:** User opens ReZ app

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER DISCOVERY FLOW                        │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  User   │
    │ Opens   │
    │   App   │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│   ReZ Backend   │
│  ┌───────────┐  │
│  │ Discovery │  │
│  │   API    │  │
│  └─────┬─────┘  │
└─────────┼─────────┘
          │
          ▼
    ┌─────────────────┐
    │   AI Engine     │◀── User preferences
    │  (ReZ Mind)     │    Historical data
    └─────┬───────────┘    Location
          │
          ▼
    ┌─────────────────────────┐
    │   Recommendation       │
    │   Engine               │
    ├─────────────────────────┤
    │ • Search results       │
    │ • AI recommendations    │
    │ • Trending nearby      │
    │ • Sponsored listings    │
    │ • Creator picks        │
    │ • Cashback offers      │
    └───────────┬─────────────┘
                │
                ▼
        ┌───────────────┐
        │   Restaurant  │
        │    Card       │
        │  ┌─────────┐ │
        │  │ Menu    │ │
        │  │ Ratings │ │
        │  │ Cashback│ │
        │  │ Offers  │ │
        │  │ Crowd   │ │
        │  └─────────┘ │
        └───────────────┘
```

**TEST CHECKLIST:**
- [ ] Restaurant visible in search
- [ ] AI recommendations working
- [ ] Cashback visible
- [ ] Menu sync from rez-merchant
- [ ] Real-time crowd levels
- [ ] Sponsored placements correct

---

### FLOW 2: QR Order Flow (CRITICAL)

**Trigger:** Customer scans ReZ Web Menu QR

```
┌──────────────────────────────────────────────────────────────────────┐
│                        QR ORDER FLOW                                  │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │  Customer   │
    │ Scans QR    │
    └──────┬──────┘
           │
           ▼
┌─────────────────────────┐
│    ReZ Web Menu        │
│  ┌─────────────────┐   │
│  │ QR Resolver    │   │
│  │ Extracts:      │   │
│  │ • restaurantId  │   │
│  │ • tableId      │   │
│  │ • floor        │   │
│  │ • campaignSrc  │   │
│  └────────┬────────┘   │
└───────────┼────────────┘
            │
            ▼
    ┌─────────────────────────┐
    │   Identity Resolution  │◀── ReZ User? Guest?
    │  ┌─────────────────┐   │
    │  │ Auth Check      │   │
    │  │ • Login prompt  │   │
    │  │ • Session create │   │
    │  └────────┬────────┘   │
    └───────────┼─────────────┘
                │
                ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    MENU DISPLAY                         │
    │  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐  │
    │  │Categories│  │ Items   │  │ AI Recommendations  │  │
    │  │          │  │         │  │ "Most popular"      │  │
    │  │ • Starters│ │[Item]   │  │ "Pairs well with"   │  │
    │  │ • Mains  │  │₹150     │  │ "Chef's pick"       │  │
    │  │ • Desserts│  │[Add+]   │  │                     │  │
    │  └─────────┘  └─────────┘  └─────────────────────┘  │
    └─────────────────────┬───────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    ADD TO CART                           │
    │  ┌─────────────────────────────────────────────────┐ │
    │  │ Item: Butter Chicken                            │ │
    │  │ Customization:                                   │ │
    │  │   □ Extra spicy    □ No onion                   │ │
    │  │   □ Extra butter   □ Cheese burst               │ │
    │  │ Special Instructions: [________________]          │ │
    │  │ Quantity: [-] 1 [+]                          │ │
    │  │                                                  │ │
    │  │ ┌────────────────────────────────────────────┐  │ │
    │  │ │ Offers Applied: "20% Cashback" ✓           │  │ │
    │  │ │ Coins Redeemable: 50 ReZ Coins = ₹5       │  │ │
    │  │ └────────────────────────────────────────────┘  │ │
    │  │                                                  │ │
    │  │ [ ADD TO CART ]                                │ │
    │  └─────────────────────────────────────────────────┘ │
    └─────────────────────┬───────────────────────────────┘
                          │
                          ▼
                    ┌───────────┐
                    │   CART    │
                    │  ┌─────┐  │
                    │  │Subtot│₹650│
                    │  │Taxes│ ₹58│
                    │  │Total │₹708│
                    │  └─────┘  │
                    └─────┬─────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ SUBMIT ORDER   │
                  └───────┬───────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    CENTRAL ORDER ENGINE                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  ORDER PIPELINE                             │    │
│  │                                                             │    │
│  │  QR Menu ──▶ Order Engine ──▶ POS ──▶ KDS ──▶ Kitchen  │    │
│  │      │              │            │        │        │         │    │
│  │      │              │            │        │        ▼         │    │
│  │      │              │            │        │     ┌────────┐   │    │
│  │      │              │            │        │     │ Print │   │    │
│  │      │              │            │        │     └────────┘   │    │
│  │      │              │            │        │                  │    │
│  │      │              │            │        ▼                  │    │
│  │      │              │            │   Waiter Dashboard       │    │
│  │      │              │            │   • Table 5            │    │
│  │      │              │            │   • 3 items pending      │    │
│  │      │              │            │   • Prep time: 12min     │    │
│  └──────┼───────────────┼────────────┼─────────────────────────┘    │
│         │               │            │                             │
│         ▼               ▼            ▼                             │
│   ┌─────────┐   ┌───────────┐  ┌─────────┐                       │
│   │Inventory│   │  Analytics│  │  CRM    │                       │
│   │ Deduct  │   │  Pipeline │  │ Update  │                       │
│   └─────────┘   └───────────┘  └─────────┘                       │
│                                                                  │
│   ┌─────────┐   ┌───────────┐  ┌─────────┐                      │
│   │ Loyalty │   │Marketing  │  │ Finance │                       │
│   │ Engine  │   │ Trigger   │  │ Recon   │                       │
│   └─────────┘   └───────────┘  └─────────┘                       │
└──────────────────────────────────────────────────────────────────┘
```

**TEST CHECKLIST:**
- [ ] QR resolves to correct restaurant
- [ ] Table identified correctly
- [ ] Modifier/customization working
- [ ] Combo logic working
- [ ] Offer engine applied
- [ ] Coin redemption working
- [ ] Order reaches POS
- [ ] Order reaches KDS instantly
- [ ] Kitchen sound alert working
- [ ] Duplicate order prevention
- [ ] Offline recovery

---

### FLOW 3: Waiter Flow

**Trigger:** Waiter opens ReZ Merchant tablet

```
┌──────────────────────────────────────────────────────────────────────┐
│                        WAITER FLOW                                    │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │  Waiter     │
    │   Login     │
    └──────┬──────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│              WAITER DASHBOARD                    │
│  ┌─────────────────────────────────────────┐   │
│  │           FLOOR MAP                      │   │
│  │                                         │   │
│  │   T1   T2   T3   T4   T5   T6         │   │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │   │
│  │  │ 3 │ │ 2 │ │ 4 │ │ ● │ │ 2 │ │ ○ │ │   │
│  │  │min│ │min│ │min│ │ORD│ │min│ │AVL│ │   │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │   │
│  │  Occupied  Ordered  Available           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────┐    │
│  │  ACTIVE ORDERS  │  │   QUICK ACTIONS │    │
│  │  ┌───────────┐  │  │  ┌───────────┐ │    │
│  │  │Table 3     │  │  │  │Open Table │ │    │
│  │  │2x Butter   │  │  │  │Transfer   │ │    │
│  │  │1x Naan     │  │  │  │Merge      │ │    │
│  │  │Status: 🟡  │  │  │  │Split Bill │ │    │
│  │  │[KOT #123]  │  │  │  │Call Kitchen│ │    │
│  │  └───────────┘  │  │  └───────────┘ │    │
│  │  ┌───────────┐  │  │                 │    │
│  │  │Table 5     │  │  │                 │    │
│  │  │1x Biryani  │  │  │                 │    │
│  │  │Status: 🟢 │  │  │                 │    │
│  │  │[READY]     │  │  │                 │    │
│  │  └───────────┘  │  │                 │    │
│  └─────────────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────┘
```

**Actions:**
| Action | Description | Flow |
|--------|-------------|------|
| Open Table | Assign table to customers | Table.occupied() |
| Transfer Table | Move customers to different table | Table.transfer() |
| Merge Tables | Combine two tables | Table.merge() |
| Split Bill | Divide bill between customers | Payment.split() |
| Add Item | Manual item addition | Order.addItem() |
| Apply Discount | Manager-approved discount | Order.applyDiscount() |
| Call Kitchen | Send alert to KDS | KDS.priorityAlert() |
| Mark Served | Confirm food delivered | Order.markServed() |

---

### FLOW 4: Kitchen Flow

**Trigger:** Order received in KDS

```
┌──────────────────────────────────────────────────────────────────────┐
│                        KITCHEN FLOW                                  │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   ORDER     │
    │   RECEIVED  │
    └──────┬──────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│              KITCHEN DISPLAY SYSTEM (KDS)       │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │            🔴 GRILL STATION              │ │
│  │  ┌─────────────────────────────────────┐│ │
│  │  │ KOT #124 │ Table 3 │ 🟡 8:42      ││ │
│  │  │ ─────────────────────────────────── ││ │
│  │  │ 2x Butter Chicken      [SPICY 🟢]   ││ │
│  │  │    └─ Extra butter                   ││ │
│  │  │ 1x Paneer Tikka                     ││ │
│  │  │ 1x Tandoori Roti                    ││ │
│  │  │ ─────────────────────────────────── ││ │
│  │  │ [START] [DONE] [DELAY]             ││ │
│  │  └─────────────────────────────────────┘│ │
│  │                                           │ │
│  │  ┌─────────────────────────────────────┐│ │
│  │  │ KOT #125 │ Table 7 │ 🟢 3:15      ││ │
│  │  │ ─────────────────────────────────── ││ │
│  │  │ 1x Chicken Biryani                  ││ │
│  │  │ 2x Raita                           ││ │
│  │  │ ─────────────────────────────────── ││ │
│  │  │ [START] [DONE] [DELAY]             ││ │
│  │  └─────────────────────────────────────┘│ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │           🍳 PREP STATION                 │ │
│  │  ...similar cards...                      │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Kitchen States:**
| State | Color | Meaning | Auto-Actions |
|-------|-------|---------|--------------|
| NEW | 🔴 Red | Just received | Sound alert |
| IN_PROGRESS | 🟡 Yellow | Being prepared | Start timer |
| READY | 🟢 Green | Ready to serve | Waiter notification |
| DELAYED | 🟠 Orange | Overdue | Escalation alert |

**Station Routing:**
| Dish Type | Station | Example |
|-----------|---------|---------|
| Grilled items | GRILL | Kebabs, Tikka |
| Curries | CURRY | Butter Chicken, Dal |
| Rice/Biryani | RICE | Biryani, Pulao |
| Breads | TANDOOR | Naan, Roti |
| Beverages | BAR | Coffee, Shakes |
| Desserts | DESSERT | Ice cream, Cake |

---

### FLOW 5: Billing Flow (CRITICAL)

**Trigger:** Customer requests bill

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BILLING FLOW                                  │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │  Generate  │
    │    Bill    │
    └──────┬──────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│                  BILL BREAKDOWN                 │
│  ┌─────────────────────────────────────────┐ │
│  │              RESTAURANT NAME              │ │
│  │           GST: 29AAAAA0000A1Z5         │ │
│  │                                         │ │
│  │  Table: 5    Date: 10-May-2026  8:45 PM│ │
│  │  ──────────────────────────────────────│ │
│  │                                         │ │
│  │  Item              Qty    Rate    Amt   │ │
│  │  ──────────────────────────────────────│ │
│  │  Butter Chicken      2    250.00  500.00│ │
│  │  Dal Makhani         1    180.00  180.00│ │
│  │  Garlic Naan         3     60.00  180.00│ │
│  │  Butter Chicken      1    250.00  250.00│ │
│  │  (Cancelled - 20%)                         │ │
│  │  ──────────────────────────────────────│ │
│  │  Subtotal:                        860.00│ │
│  │  ──────────────────────────────────────│ │
│  │  CGST @ 2.5%:                      21.50│ │
│  │  SGST @ 2.5%:                      21.50│ │
│  │  Service Charge @ 5%:              43.00│ │
│  │  ──────────────────────────────────────│ │
│  │  Gross Total:                      946.00│ │
│  │  ──────────────────────────────────────│ │
│  │  💰 Cashback Earned:                 94.60│ │
│  │  🪙 ReZ Coins Used:              -50.00│ │
│  │  🎫 Offer Applied (20% OFF):     -170.40│ │
│  │  ──────────────────────────────────────│ │
│  │  **NET PAYABLE:**                  ₹775.60│ │
│  │                                         │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────┐
    │  PAYMENT MODES  │
    │  ┌─────────────┐ │
    │  │    UPI      │ │  ← Most common
    │  │   ₹775.60   │ │
    │  └─────────────┘ │
    │  ┌─────────────┐ │
    │  │    CARD     │ │
    │  │   Split    │ │
    │  │ ₹400+₹375  │ │
    │  └─────────────┘ │
    │  ┌─────────────┐ │
    │  │  CASH       │ │
    │  │   + Coins   │ │
    │  │ ₹700+75     │ │
    │  └─────────────┘ │
    │  ┌─────────────┐ │
    │  │  MULTIPLE  │ │
    │  │ 2 UPI+Card │ │
    │  └─────────────┘ │
    └─────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│              POST-PAYMENT FLOW                    │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  ✅ Payment Success                      │   │
│  │                                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │   KOT   │  │  CRM    │  │ LOYALTY ││   │
│  │  │ Closed  │  │ Updated │  │ Updated ││   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘│   │
│  │       │            │            │       │   │
│  │       ▼            ▼            ▼       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │Inventory │  │Customer │  │ Cashback││   │
│  │  │ Final    │  │ Profile │  │Posted   ││   │
│  │  │ Deduct   │  │ Updated │  │ ✓ +94.60││   │
│  │  └─────────┘  └─────────┘  └─────────┘│   │
│  │                                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐│   │
│  │  │Analytics │  │Marketing│  │Receipt  ││   │
│  │  │ Recorded │  │ Trigger │  │Sent     ││   │
│  │  │ ✓        │  │ ✓       │  │✓ WhatsApp││   │
│  │  └─────────┘  └─────────┘  └─────────┘│   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

### FLOW 6: Loyalty & CRM Flow

**Trigger:** Payment completed

```
┌──────────────────────────────────────────────────────────────────────┐
│                    LOYALTY & CRM FLOW                               │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   Payment  │
    │  Complete   │
    └──────┬──────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│                  LOYALTY ENGINE                   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Customer: Rahul S. (ID: USR_12345)    │   │
│  │                                         │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │    🏆 TIER: Gold                │   │   │
│  │  │    Visits: 12 │ Spent: ₹8,450  │   │   │
│  │  │    ReZ Coins: 850              │   │   │
│  │  └─────────────────────────────────┘   │   │
│  │                                         │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │   🔥 STREAK: 5 Days           │   │   │
│  │  │   └─ 2 more visits = Free Dessert│  │   │
│  │  └─────────────────────────────────┘   │   │
│  │                                         │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │   THIS ORDER REWARDS:          │   │   │
│  │  │   ✅ ₹94.60 Cashback           │   │   │
│  │  │   ✅ 85 ReZ Coins earned        │   │   │
│  │  │   ✅ Visit #12/15 for Gold → Plat│   │
│  │  │   ✅ Streak: Day 5/7           │   │   │
│  │  │   ❌ Unlock: Free Dessert       │   │   │
│  │  └─────────────────────────────────┘   │   │
│  │                                         │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │   🎯 MILESTONES UNLOCKED:       │   │   │
│  │  │   🏅 First Order Bonus: ✓     │   │   │
│  │  │   🔥 5-Day Streak: ✓ (Day 5)  │   │   │
│  │  │   👑 10 Orders: ✓              │   │   │
│  │  │   🎁 Free Dessert: 🔒 (3 more) │   │   │
│  │  │   🚀 VIP Status: 🔒            │   │   │
│  │  └─────────────────────────────────┘   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────┐
    │              REFERRAL TRIGGER             │
    │                                          │
    │  "Rahul, share with friends!"           │
    │                                          │
    │  🔗 https://rez.money/r/rahul123        │
    │                                          │
    │  When friend signs up:                   │
    │  • Friend gets: ₹100 cashback           │
    │  • Rahul gets: ₹50 cashback            │
    └─────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────┐
    │              MARKETING AUTOMATIONS        │
    │                                          │
    │  Triggers based on order data:           │
    │                                          │
    │  ✅ Birthday in 3 days → Offer sent     │
    │  ✅ Win-back: No visit in 14 days       │
    │  ✅ Cross-sell: Coffee never ordered     │
    │  ✅ Re-engage: Low engagement           │
    │  ✅ Upsell: Premium items browsed        │
    └─────────────────────────────────────────┘
```

---

### FLOW 7: Inventory Flow

**Trigger:** Order item confirmed

```
┌──────────────────────────────────────────────────────────────────────┐
│                    INVENTORY FLOW                                    │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   Order    │
    │   Item     │
    │ Confirmed  │
    └──────┬──────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│              RECIPE MAPPING                      │
│                                                 │
│  Item: Butter Chicken                          │
│                                                 │
│  ┌─────────────────────────────────────────┐ │
│  │         BUTTER CHICKEN                    │ │
│  │  Recipe ID: REC_BUTTER_CHICKEN_001      │ │
│  │  ───────────────────────────────────────│ │
│  │  Ingredients:                            │ │
│  │  • Chicken Breast: 200g                  │ │
│  │  • Butter: 30g                           │ │
│  │  • Cream: 50ml                          │ │
│  │  • Tomato Puree: 100g                   │ │
│  │  • Spices: 15g                          │ │
│  │  • Oil: 20ml                            │ │
│  │  • Ginger-Garlic: 10g                   │ │
│  │  ───────────────────────────────────────│ │
│  │  Per Unit:                              │ │
│  │  Cost: ₹85.50  │  Price: ₹250  │  GM: 66%│ │
│  └─────────────────────────────────────────┘ │
│                                                 │
│  If Order = 2x Butter Chicken:                 │
│                                                 │
│  ┌─────────────────────────────────────────┐ │
│  │  INVENTORY DEDUCTION                     │ │
│  │  ┌────────────┬────────┬────────┐      │ │
│  │  │ Ingredient │ Unit   │ Deduct │      │ │
│  │  ├────────────┼────────┼────────┤      │ │
│  │  │ Chicken    │ 400g   │ -400g  │      │ │
│  │  │ Butter     │ 60g    │ -60g   │      │ │
│  │  │ Cream      │ 100ml  │ -100ml │      │ │
│  │  │ Tomato     │ 200g   │ -200g  │      │ │
│  │  │ Spices     │ 30g    │ -30g   │      │ │
│  │  │ Oil        │ 40ml   │ -40ml  │      │ │
│  │  │ G-Garlic   │ 20g    │ -20g   │      │ │
│  │  └────────────┴────────┴────────┘      │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│              ALERT SYSTEM                       │
│                                                 │
│  Stock Levels After Deduction:                 │
│                                                 │
│  ┌─────────────────────────────────────────┐ │
│  │  🔴 LOW STOCK ALERTS:                   │ │
│  │                                         │ │
│  │  ⚠️ Chicken Breast: 500g (Min: 2kg)   │ │
│  │     └─ Order from: Supplier A, B       │ │
│  │     └─ Auto-reorder trigger? [YES/NO]  │ │
│  │                                         │ │
│  │  ⚠️ Butter: 200g (Min: 1kg)           │ │
│  │     └─ Auto-reorder trigger? [YES/NO]  │ │
│  │                                         │ │
│  │  ✅ Cream: 5L (Healthy: >2L)         │ │
│  │  ✅ Spices: 2kg (Healthy: >500g)      │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

### FLOW 8: Delivery Flow

**Trigger:** Order for delivery received

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DELIVERY FLOW                                     │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────┐
    │         ORDER SOURCES                    │
    │  ┌───────┐ ┌───────┐ ┌───────┐        │
    │  │  ReZ  │ │Zomato │ │Swiggy │        │
    │  │  App  │ │       │ │       │        │
    │  └───────┘ └───────┘ └───────┘        │
    │  ┌───────┐ ┌───────┐ ┌───────┐        │
    │  │   QR  │ │  Call │ │ ONDC  │        │
    │  │  Menu │ │ Order │ │       │        │
    │  └───────┘ └───────┘ └───────┘        │
    └───────────────────┬─────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────────┐
    │         AGGREGATOR NORMALIZATION        │
    │                                          │
    │  All orders → Standard Order Format:      │
    │  ┌────────────────────────────────────┐ │
    │  │  orderId, items[], customer,       │ │
    │  │  deliveryAddress, source,          │ │
    │  │  aggregatorOrderId, status         │ │
    │  └────────────────────────────────────┘ │
    └───────────────────┬─────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────────┐
    │         DELIVERY ASSIGNMENT              │
    │                                          │
    │  ┌────────────────────────────────────┐ │
    │  │  Available Riders (3)              │ │
    │  │                                     │ │
    │  │  🚴 Rahul   │ 2.1km │ 4 orders  │ │
    │  │  🚴 Priya   │ 1.5km │ 2 orders  │ │
    │  │  🚴 Amit    │ 3.2km │ 3 orders  │ │
    │  │                                     │ │
    │  │  Best Match: Priya (closest)       │ │
    │  │                                     │ │
    │  │  ETA: 25-30 minutes               │ │
    │  └────────────────────────────────────┘ │
    └───────────────────┬─────────────────────┘
                        │
                        ▼
    ┌─────────────────────────────────────────┐
    │         REAL-TIME TRACKING              │
    │                                          │
    │  ┌────────────────────────────────────┐ │
    │  │           📍 RESTAURANT            │ │
    │  │              │                      │ │
    │  │              │ 1.2km               │ │
    │  │              ▼                      │ │
    │  │         📍 PICKED UP                │ │
    │  │         12:34 PM                   │ │
    │  │              │                      │ │
    │  │              │ 2.1km               │ │
    │  │              ▼                      │ │
    │  │           📍 DELIVERED              │ │
    │  │           12:52 PM                  │ │
    │  │                                     │ │
    │  │  Customer notified at each step     │ │
    │  └────────────────────────────────────┘ │
    └─────────────────────────────────────────┘
```

---

### FLOW 9: Procurement Flow (NextaBizz)

**Trigger:** Low stock alert

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PROCUREMENT FLOW                                  │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │ Low Stock  │
    │   Alert    │
    └──────┬──────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│              NEXTABIZZ MARKETPLACE               │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  SEARCH: Chicken Breast                 │   │
│  │  ─────────────────────────────────────│   │
│  │                                         │   │
│  │  RESULTS (4 suppliers):                 │   │
│  │                                         │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │ 🏪 Fresh Farms     │ ₹180/kg   │   │   │
│  │  │    Rating: 4.5    │ Min: 5kg   │   │   │
│  │  │    Delivery: Today  │ GST: 0%   │   │   │
│  │  │    [Order] [RFQ]               │   │   │
│  │  └─────────────────────────────────┘   │   │
│  │                                         │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │ 🏪 Metro Foods     │ ₹175/kg   │   │   │
│  │  │    Rating: 4.2    │ Min: 10kg │   │   │
│  │  │    Delivery: Tomorrow           │   │   │
│  │  └─────────────────────────────────┘   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
           │
           ▼
    ┌─────────────────────────────────────────┐
    │              PURCHASE ORDER              │
    │  ┌─────────────────────────────────┐   │
    │  │ PO #PO-2026-00456              │   │
    │  │ ─────────────────────────────────│   │
    │  │ Supplier: Fresh Farms           │   │
    │  │ Delivery: 11-May-2026 7:00 AM │   │
    │  │ ─────────────────────────────────│   │
    │  │ Item          Qty    Rate   Amt  │   │
    │  │ Chicken B.    10kg   180    1800│   │
    │  │ Butter         5kg    520    2600│   │
    │  │ Cream          5L     280    1400│   │
    │  │ ─────────────────────────────────│   │
    │  │ Subtotal:                   5800│   │
    │  │ GST @ 0%:                    0│   │
    │  │ ─────────────────────────────────│   │
    │  │ TOTAL:                     ₹5800│   │
    │  │ Credit Used:                ₹2000│   │
    │  │ Pay Now:                   ₹3800│   │
    │  └─────────────────────────────────┘   │
    └─────────────────────────────────────────┘
```

---

### FLOW 10: Analytics Flow

**Trigger:** Dashboard refresh / Scheduled report

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ANALYTICS FLOW                                    │
└──────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │ Dashboard  │
    │   Refresh  │
    └──────┬──────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│              RESTAURANT ANALYTICS                │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  📊 TODAY'S PERFORMANCE                 │   │
│  │                                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌───────┐ │   │
│  │  │ Revenue │  │ Orders  │  │Guests │ │   │
│  │  │ ₹45,230 │  │   68    │  │  52   │ │   │
│  │  │  ↑12%   │  │   ↑8%   │  │  ↑15% │ │   │
│  │  └─────────┘  └─────────┘  └───────┘ │   │
│  │                                         │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │       REVENUE TREND            │   │   │
│  │  │    ╭─╮                         │   │   │
│  │  │   ╭╯  ╰╮  ╭─                  │   │   │
│  │  │  ╭╯    ╰──╯   ─╮             │   │   │
│  │  │──╯              ╰──           │   │   │
│  │  │  M  T  W  T  F  S  S          │   │   │
│  │  └─────────────────────────────────┘   │   │
│  │                                         │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │    TOP PERFORMING DISHES        │   │   │
│  │  │  1. Butter Chicken     42 orders│   │   │
│  │  │  2. Dal Makhani       38 orders│   │   │
│  │  │  3. Biryani          35 orders│   │   │
│  │  └─────────────────────────────────┘   │   │
│  │                                         │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │    AI INSIGHTS (ReZ Mind)       │   │   │
│  │  │  💡 "Peak hours are 7-9 PM.    │   │   │
│  │  │     Consider running lunch       │   │   │
│  │  │     offers to balance traffic."   │   │   │
│  │  │                                   │   │   │
│  │  │  💡 "Chicken Tikka has 23%     │   │   │
│  │  │     abandonment in cart. Review   │   │   │
│  │  │     pricing or add photos."       │   │   │
│  │  └─────────────────────────────────┘   │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Part 3: Event System

### 3.1 Core Events

| Event | Trigger | Handlers |
|-------|--------|----------|
| `ORDER_CREATED` | New order placed | POS, KDS, Analytics, CRM |
| `ORDER_ACCEPTED` | Restaurant confirms | Customer, Kitchen |
| `ORDER_PREPARING` | Kitchen starts | Waiter, Customer |
| `ORDER_READY` | Food ready | Waiter, Delivery |
| `ORDER_SERVED` | Food delivered | Customer, CRM |
| `ORDER_COMPLETED` | Payment received | Loyalty, Analytics |
| `ORDER_CANCELLED` | Order cancelled | Refund, CRM, Inventory |
| `PAYMENT_SUCCESS` | Payment confirmed | Order, Loyalty, Analytics |
| `PAYMENT_FAILED` | Payment declined | Order, Customer |
| `TABLE_OPENED` | Table assigned | Waiter, Analytics |
| `TABLE_CLOSED` | Table cleared | Analytics, CRM |
| `ITEM_ADDED` | Item added to order | POS, Kitchen |
| `ITEM_VOIDED` | Item cancelled | POS, Kitchen, Inventory |
| `KITCHEN_DELAYED` | Prep over time | Waiter, Customer |
| `CASHBACK_EARNED` | Order completed | Loyalty, Customer |
| `STREAK_UPDATED` | Visit recorded | Loyalty, Customer |
| `INVENTORY_LOW` | Stock below threshold | Procurement, Manager |
| `INVENTORY_REORDERED` | PO created | Procurement |

### 3.2 Event Schema

```typescript
interface DomainEvent<T = any> {
  id: string;           // UUID
  type: string;         // Event type
  aggregateId: string; // Entity ID
  aggregateType: string; // Entity type
  timestamp: Date;
  version: number;      // Event version
  metadata: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    sessionId?: string;
    source?: string;
  };
  payload: T;
  signature?: string;   // Event integrity
}
```

---

## Part 4: Permission Matrix

### 4.1 Role-Based Permissions

| Action | Owner | Manager | Waiter | Kitchen | Cashier |
|--------|-------|---------|--------|---------|---------|
| View Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Order | ✅ | ✅ | ✅ | ❌ | ✅ |
| Void Item | ✅ | ✅ | ❌ | ❌ | ✅ |
| Cancel Order | ✅ | ✅ | ❌ | ❌ | ❌ |
| Apply Discount | ✅ | ✅ | ❌ | ❌ | ✅ (>5%) |
| Override Price | ✅ | ✅ | ❌ | ❌ | ❌ |
| Issue Refund | ✅ | ✅ | ❌ | ❌ | ✅ |
| Manage Menu | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Staff | ✅ | ❌ | ❌ | ❌ | ❌ |
| View P&L | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4.2 Financial Thresholds

| Action | Threshold | Approval |
|--------|-----------|----------|
| Refund < ₹500 | Auto | None |
| Refund ₹500-2000 | Manager | Required |
| Refund > ₹2000 | Owner | Required |
| Discount < 10% | Auto | None |
| Discount 10-25% | Manager | Required |
| Discount > 25% | Owner | Required |
| Write-off < ₹100 | Auto | None |
| Write-off ₹100-1000 | Manager | Required |
| Write-off > ₹1000 | Owner | Required |

---

## Part 5: Integration Points

### 5.1 External Integrations

| Integration | Protocol | Purpose | Status |
|------------|---------|---------|--------|
| Zomato | Webhook | Order ingestion | ⚠️ Needs webhook verification |
| Swiggy | Webhook | Order ingestion | ⚠️ Needs webhook verification |
| ONDC | API | Order protocol | 🔴 Not implemented |
| Uber Eats | API | Order ingestion | 🔴 Not implemented |
| Razorpay | API + Webhook | Payments | ✅ Implemented |
| Delivery APIs | API | Rider assignment | ⚠️ Partial |

### 5.2 Internal Service Dependencies

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SERVICE DEPENDENCY GRAPH                          │
└──────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────┐
                        │  Order Service  │
                        │  (Central Hub)   │
                        └────────┬────────┘
                                 │
        ┌───────────┬───────────┬─┴───────────┬───────────┐
        │           │           │             │           │
        ▼           ▼           ▼             ▼           ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │   POS    │ │   KDS   │ │   CRM    │ │ Inventory│ │  Finance │
  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
       │            │            │            │            │
       ▼            ▼            ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Menu Svc │ │ Kitchen  │ │ Loyalty  │ │ NextaBiz │ │ Payments │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## Part 6: Audit Findings Summary

### Critical Issues (Must Fix)

| Service | Issue | Impact |
|---------|-------|--------|
| rez-menu-service | No authentication | Anyone can modify menu |
| rez-kitchen-display | CORS: * (open) | Unauthorized access |
| rez-kitchen-display | In-memory only | Order data loss on restart |
| rez-merchant-service | No webhook verification | Fake aggregator orders |
| RestoPapa | .env committed | Production secrets exposed |
| NextaBizz | Credit limit bypass | Financial loss possible |

### High Priority Issues

| Service | Issue | Impact |
|---------|-------|--------|
| rez-app-merchant | Hardcoded storeId | Multi-store broken |
| rez-kitchen-ai | No HTTP server | Not deployable |
| All services | No query timeouts | Database hangs |
| Notifications | No GDPR endpoints | Compliance risk |

---

## Part 7: Test Scenarios

### 7.1 Happy Path Tests

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Customer scans QR, adds item, pays | Order reaches KDS, payment processed |
| 2 | Kitchen marks item ready | Waiter notified |
| 3 | Payment completes | Cashback posted, CRM updated |
| 4 | Customer returns next day | Streak incremented |
| 5 | Low stock triggered | Procurement suggestion shown |

### 7.2 Edge Case Tests

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Duplicate webhook | Idempotency prevents double-processing |
| 2 | KDS offline during order | Queue until reconnection |
| 3 | Payment fails mid-transaction | Order state rollback |
| 4 | Rapid item add/void | Optimistic locking prevents race |
| 5 | Network loss during order | Offline queue, sync on reconnect |

---

## Next Steps

1. **Fix Critical Security Issues** (Day 1)
2. **Implement Webhook Verification** (Day 2-3)
3. **Add Central Order Engine** (Week 1)
4. **Complete Inventory Integration** (Week 2)
5. **Implement All State Machines** (Week 3)
6. **Add Event System** (Week 4)
7. **Full Integration Testing** (Week 5)

---

*Document Version: 1.0*
*Last Updated: 2026-05-10*
*Next Review: 2026-05-17*
