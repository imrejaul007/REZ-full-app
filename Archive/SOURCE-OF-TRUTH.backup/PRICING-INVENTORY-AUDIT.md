# PRICING & INVENTORY ENGINE - COMPLETE AUDIT

**Date:** May 6, 2026
**Version:** 1.0

---

## YOUR VISION

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DYNAMIC PRICING ENGINE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DEMAND FACTORS                                                             │
│  ├── Time-based: Sunday = high = less discount                            │
│  │                Wednesday = low = more discount                         │
│  ├── Inventory-based: Overstock = more discount                           │
│  │                   Near expiry = more discount                         │
│  │                   Scarcity = less discount                            │
│  ├── Demand-based: High demand = less discount                          │
│  │                 Low demand = more discount                            │
│  └── Competition-based: Competitor pricing                               │
│                                                                              │
│  MERCHANT AI SUGGESTIONS                                                   │
│  ├── Inventory alerts (stock running low)                                 │
│  ├── Purchase suggestions (what to order)                                │
│  ├── Offer recommendations (based on inventory)                           │
│  └── Price recommendations (based on demand)                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## WHAT YOU HAVE

### EXISTING SERVICES

| Service | Has Pricing | Has Inventory | Has Demand | Status |
|---------|-------------|----------------|------------|--------|
| `rez-price-optimization-service` | ❌ MISSING | ❌ MISSING | ❌ MISSING | Empty |
| `rez-inventory-service` | ❌ MISSING | ❌ MISSING | ❌ MISSING | Missing |
| `rez-economic-engine` | ⚠️ Partial | ❌ No | ❌ No | Coins only |
| `rez-catalog-service` | ⚠️ Basic | ⚠️ Basic | ❌ No | Products |
| `rez-merchant-service` | ❌ No | ⚠️ Basic | ❌ No | Merchant info |
| `rez-order-service` | ⚠️ Basic | ⚠️ Basic | ❌ No | Orders |

---

## WHAT YOU NEED TO BUILD

### 1. DYNAMIC PRICING ENGINE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DYNAMIC PRICING ENGINE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT FACTORS                                                              │
│  │                                                                         │
│  ├── TIME FACTORS (30%)                                                    │
│  │   ├── Day of week → demand curve                                        │
│  │   ├── Time of day → peak/off-peak                                      │
│  │   ├── Season → seasonal pricing                                        │
│  │   └── Events → special occasions                                       │
│  │                                                                         │
│  ├── INVENTORY FACTORS (25%)                                              │
│  │   ├── Stock level → inverse relationship                               │
│  │   ├── Expiry date → urgency discount                                    │
│  │   ├── Category freshness → perishable pricing                           │
│  │   └── Overstock → bulk discount                                        │
│  │                                                                         │
│  ├── DEMAND FACTORS (25%)                                                 │
│  │   ├── Historical demand → pattern analysis                              │
│  │   ├── Real-time demand → current orders                                │
│  │   ├── Trend signals → ReZ Mind predictions                             │
│  │   └── Weather impact → external signals                                 │
│  │                                                                         │
│  └── COMPETITION FACTORS (20%)                                             │
│      ├── Competitor prices                                                │
│      ├── Market average                                                   │
│      └── Price positioning                                                │
│                                                                              │
│  OUTPUT                                                                    │
│  ├── Base price ± dynamic adjustment                                       │
│  ├── Optimal discount percentage                                           │
│  ├── Best time to offer                                                   │
│  └── Expected conversion lift                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. DEMAND FORECASTING

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEMAND FORECASTING                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT SIGNALS                                                             │
│  │                                                                         │
│  ├── Historical: 30/60/90 day patterns                                    │
│  ├── Real-time: Current orders, cart adds, views                          │
│  ├── External: Weather, events, holidays, trends                         │
│  └── ReZ Mind: Intent signals, search patterns                            │
│                                                                              │
│  OUTPUT                                                                    │
│  │                                                                         │
│  ├── Hourly demand forecast (next 24h)                                    │
│  ├── Daily demand forecast (next 7 days)                                   │
│  ├── Category demand predictions                                           │
│  └── Anomaly detection (sudden spikes/drops)                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. INVENTORY INTELLIGENCE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INVENTORY INTELLIGENCE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRACKING                                                                 │
│  ├── Real-time stock levels                                                │
│  ├── Expiry date monitoring                                               │
│  ├── Reorder point alerts                                                 │
│  └── Dead stock identification                                             │
│                                                                              │
│  INTELLIGENCE                                                              │
│  ├── ABC analysis (high/medium/low value items)                           │
│  ├── Turnover rate                                                        │
│  ├── Stockout predictions                                                  │
│  └── Expiry risk scoring                                                  │
│                                                                              │
│  MERCHANT ACTIONS                                                          │
│  ├── "Stock running low" alerts                                          │
│  ├── "Consider ordering" suggestions                                      │
│  ├── "Discount to clear" recommendations                                 │
│  └── "Bundle to move" ideas                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PRICING RULES

### Time-Based Pricing

| Day | Demand | Base Discount | Example |
|-----|--------|---------------|---------|
| Sunday | High | -5% to -10% | Less incentive needed |
| Monday | Medium | -10% to -15% | Mid-week boost |
| Tuesday | Medium | -10% to -15% | Mid-week boost |
| Wednesday | Low | -15% to -25% | Need to drive traffic |
| Thursday | Medium | -10% to -15% | Pre-weekend |
| Friday | High | -5% to -10% | High demand |
| Saturday | Very High | 0% to -5% | Peak day |

### Inventory-Based Pricing

| Condition | Discount | Priority |
|-----------|----------|----------|
| Near Expiry (< 3 days) | -40% to -60% | Critical |
| Near Expiry (< 7 days) | -20% to -40% | High |
| Overstock (> 30 days) | -15% to -30% | Medium |
| Slow Moving (> 14 days) | -10% to -20% | Low |
| Scarcity (stock < 10%) | 0% or +5% | N/A |
| Normal Stock | Base price | - |

### Demand-Based Pricing

| Demand Level | Signal | Discount |
|--------------|--------|----------|
| Very High | > 10 orders/hour | 0% or +5% |
| High | 5-10 orders/hour | -5% to -10% |
| Normal | 1-5 orders/hour | -10% to -15% |
| Low | < 1 order/hour | -15% to -25% |
| Very Low | No orders | -25% to -40% |

---

## MERCHANT AI SUGGESTIONS

### 1. Inventory Alerts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MERCHANT DASHBOARD ALERTS                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔴 URGENT                                                                 │
│  ├── "Biryani Masala: Stock at 5 units (Reorder: 20)"                    │
│  ├── "Paneer expires in 2 days - 15 units left"                           │
│  └── "Chicken Tikka: Sold out - 3 customers waiting"                      │
│                                                                              │
│  🟡 WARNING                                                                │
│  ├── "Butter Chicken: Stock at 40% - Consider reorder"                    │
│  └── "Dal Makhani: 12 days since last sale - Move or discount?"           │
│                                                                              │
│  🟢 SUGGESTIONS                                                            │
│  ├── "Weekend incoming - Increase stock by 30%"                           │
│  ├── "Similar to trending items - Add to menu?"                          │
│  └── "Rainy day forecast - Consider comfort food promotions"             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Pricing Recommendations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AI PRICE RECOMMENDATIONS                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TODAY'S INSIGHTS:                                                          │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Product: Chicken Biryani                                              │  │
│  │ Current: ₹180 │ AI Suggested: ₹165 │ Savings: 8% off                │  │
│  │ Reason: Wednesday low demand + 45 units overstock                   │  │
│  │ Expected: +23% orders, +12% revenue                                 │  │
│  │ [Accept] [Modify] [Dismiss]                                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Product: Paneer Butter Masala                                        │  │
│  │ Current: ₹220 │ AI Suggested: ₹235 │ Premium: +7%                  │  │
│  │ Reason: High demand + limited stock                                 │  │
│  │ Expected: Same orders, +7% revenue                                  │  │
│  │ [Accept] [Modify] [Dismiss]                                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Offer Recommendations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  AI OFFER RECOMMENDATIONS                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Based on your inventory and demand:                                        │
│                                                                              │
│  🏷️ CLEARANCE OFFERS                                                       │
│  ├── "Paneer expires Friday - 40% off today only"                         │
│  ├── "Slow-moving Dal - Buy 1 Get 1 Free"                                 │
│  └── "Overstock Rice - 20% off on 2kg+"                                  │
│                                                                              │
│  📈 DEMAND BOOST                                                           │
│  ├── "Wednesday special - 15% off all biryanis"                           │
│  ├── "Rainy day comfort - Free chai with meal"                            │
│  └── "Happy hours 2-5 PM - 20% off"                                      │
│                                                                              │
│  🎯 CONVERSION OPTIMIZATION                                                 │
│  ├── "Trending: Tandoori items - Add to combo"                           │
│  ├── "Customers also ordered: Raita with Biryani - Suggest"             │
│  └── "Bundle: Biryani + Drink + Dessert = 25% off"                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## WHAT TO BUILD

### 1. PRICING ENGINE SERVICE

| Component | File | Purpose |
|-----------|------|---------|
| `src/index.ts` | Main server | API endpoints |
| `src/services/pricingEngine.ts` | Core logic | Calculate prices |
| `src/services/demandForecaster.ts` | Demand AI | Predict demand |
| `src/services/inventoryAnalyzer.ts` | Inventory | Analyze stock |
| `src/services/merchantSuggestions.ts` | AI suggestions | Recommendations |

### 2. APIS NEEDED

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/price/calculate` | POST | Calculate dynamic price |
| `/api/price/recommend` | GET | Get price recommendations |
| `/api/demand/forecast` | GET | Get demand forecast |
| `/api/inventory/alerts` | GET | Get inventory alerts |
| `/api/offers/suggest` | GET | Get offer suggestions |
| `/api/merchant/suggestions` | GET | Get all AI suggestions |

### 3. REZ MIND INTEGRATION

```
Pricing Engine ←→ ReZ Mind

├── Intent signals → Demand prediction
├── Search patterns → Trending items
├── Order patterns → Demand forecasting
├── Weather → External factors
└── Events → Special pricing
```

---

## INTEGRATION WITH EXISTING

| Existing | Integration Point |
|----------|-------------------|
| `rez-catalog-service` | Product prices, stock levels |
| `rez-order-service` | Order history, demand signals |
| `rez-merchant-service` | Merchant preferences, notifications |
| `rez-marketing-service` | Offer creation |
| `rez-lead-intelligence` | Personalized pricing |
| `rez-decision-service` | RDE integration for sponsored |

---

## FILES TO CREATE

```
rez-price-optimization-service/
├── src/
│   ├── index.ts
│   ├── services/
│   │   ├── pricingEngine.ts
│   │   ├── demandForecaster.ts
│   │   ├── inventoryAnalyzer.ts
│   │   └── merchantSuggestions.ts
│   ├── routes/
│   │   ├── pricing.ts
│   │   ├── demand.ts
│   │   └── inventory.ts
│   └── types/
│       └── index.ts
├── package.json
└── README.md
```

---

## STATUS: WHAT TO BUILD

| Component | Status | Action |
|-----------|--------|--------|
| Pricing Engine | ❌ Missing | Build |
| Demand Forecasting | ❌ Missing | Build |
| Inventory Intelligence | ❌ Missing | Build |
| Merchant Suggestions | ❌ Missing | Build |
| ReZ Mind Integration | ⚠️ Partial | Complete |

---

## NEXT STEPS

1. Build Dynamic Pricing Engine
2. Build Demand Forecaster
3. Build Inventory Analyzer
4. Build Merchant Suggestions
5. Connect to ReZ Mind
6. Integrate with catalog/order services
