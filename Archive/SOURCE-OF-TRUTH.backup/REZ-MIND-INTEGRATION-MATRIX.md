# REZ Mind - Integration Matrix

**Version:** 1.0.0
**Last Updated:** 2026-05-01
**Purpose:** Map every app/service to REZ Mind events

---

## Overview

```
Every app in the REZ ecosystem should send events to REZ Mind.

Events flow:
    ↓
App → Event Platform → Intelligence → Decisions → Recommendations
```

---

## Integration Matrix

### Consumer Apps → REZ Mind

| App | Events to Send | REZ Mind Impact |
|-----|----------------|-----------------|
| **rez-app-consumer** | orders, searches, views, bookings | Search, recommendations, personalization |
| **rez-now** | orders, scans, searches, views | Search, recommendations, push |
| **rez-web-menu** | searches, views, orders | Search, recommendations |
| **rendez** | bookings, matches, messages | Intent, personalization |
| **rez-karma-app** | redemptions, points, activities | User segments, engagement |

### Merchant Apps → REZ Mind

| App | Events to Send | REZ Mind Impact |
|-----|----------------|-----------------|
| **rez-app-merchant** | orders, inventory, payments, customers | Inventory suggestions, insights |
| **rez-restopapa** | orders, inventory, reviews | Demand patterns, recommendations |
| **rez-pms-app** | bookings, check-ins, services | Demand forecasting |

### Backend Services → REZ Mind

| Service | Events to Send | REZ Mind Impact |
|---------|----------------|-----------------|
| **rez-order-service** | order.placed, order.completed, order.cancelled | User behavior, merchant insights |
| **rez-payment-service** | payment.success, payment.failed | User behavior, merchant revenue |
| **rez-search-service** | search.query, search.result_clicked | Intent prediction, personalization |
| **rez-catalog-service** | item.viewed, item.added, item.removed | User preferences |
| **rez-gamification-service** | points.earned, badge.unlocked, mission.completed | User engagement, segments |
| **rez-marketing-service** | campaign.sent, campaign.clicked | Ad targeting, engagement |

---

## Event Catalog

### Consumer Events

| Event | Trigger | Data | Intelligence Derived |
|-------|---------|------|---------------------|
| `consumer.order` | Order placed | user_id, items, amount, merchant_id | Preferences, spend, frequency |
| `consumer.search` | User searches | user_id, query, results_count | Intent, preferences |
| `consumer.view` | Item viewed | user_id, item_id, duration | Preferences, interest |
| `consumer.booking` | Booking made | user_id, service_type, amount | Intent, categories |
| `consumer.review` | Review submitted | user_id, merchant_id, rating | Sentiment, preferences |
| `consumer.scan` | QR scanned | user_id, store_id, action | Location, behavior |
| `consumer.payment` | Payment made | user_id, amount, method | Spend patterns |

### Merchant Events

| Event | Trigger | Data | Intelligence Derived |
|-------|---------|------|---------------------|
| `merchant.order` | Order received | merchant_id, items, amount | Demand, popular items |
| `merchant.inventory_low` | Stock below threshold | merchant_id, item_id, stock | Reorder suggestions |
| `merchant.payment` | Payment received | merchant_id, amount, method | Revenue patterns |
| `merchant.review` | New review | merchant_id, rating, text | Quality score |
| `merchant.customer_new` | New customer | merchant_id, customer_id | Acquisition |

### System Events

| Event | Trigger | Data | Intelligence Derived |
|-------|---------|------|---------------------|
| `session.start` | User session | user_id, device, location | Engagement |
| `session.end` | Session end | user_id, duration | Engagement level |
| `notification.sent` | Push sent | user_id, type | Channel preferences |
| `notification.clicked` | Push clicked | user_id, campaign_id | Campaign effectiveness |

---

## Per-App Integration Details

### 1. rez-app-consumer

**Integration:** HIGH PRIORITY
**Reason:** Main consumer app, highest user activity

**Events to add:**
```typescript
// Order completed
rezMind.consumer.sendOrder({
  user_id,
  order_id,
  merchant_id,
  items,
  total_amount
})

// Search
rezMind.consumer.sendSearch({
  user_id,
  query,
  results_count,
  clicked_item
})

// Item view
rezMind.consumer.sendView({
  user_id,
  item_id,
  item_name,
  duration_seconds
})

// Booking
rezMind.consumer.sendBooking({
  user_id,
  booking_id,
  service_type,
  amount
})
```

**Where to add:**
- `app/services/order/` - On order success
- `app/screens/search/` - On search submit
- `app/screens/product/` - On product view
- `app/screens/booking/` - On booking confirm

---

### 2. rez-now

**Integration:** HIGH PRIORITY
**Reason:** QR orders, high engagement

**Events to add:**
```typescript
// QR Scan
fetch(`${EVENT_PLATFORM}/webhook/consumer/scan`, {
  method: 'POST',
  body: JSON.stringify({
    user_id,
    store_id,
    action: 'order' | 'view' | 'pay'
  })
})

// Order
rezMind.consumer.sendOrder({...})
```

**Where to add:**
- `/pages/scan.tsx` - On QR scan
- `/pages/cart/` - On order confirm

---

### 3. rez-web-menu

**Integration:** MEDIUM PRIORITY
**Reason:** Web orders, different flow

**Events to add:**
```typescript
// Search
rezMind.consumer.sendSearch({
  user_id,
  query,
  results_count
})

// View
rezMind.consumer.sendView({
  user_id,
  item_id
})
```

**Where to add:**
- `components/SearchBar.tsx`
- `pages/[storeSlug].tsx`

---

### 4. rendez

**Integration:** MEDIUM PRIORITY
**Reason:** Social, different user intent

**Events to add:**
```typescript
// Profile view
fetch(`${EVENT_PLATFORM}/webhook/consumer/view`, {
  body: JSON.stringify({
    user_id,
    item_id: profile_id,
    item_name: 'profile',
    category: 'social'
  })
})

// Booking (meetup)
rezMind.consumer.sendBooking({
  user_id,
  booking_id,
  service_type: 'meetup'
})
```

---

### 5. rez-karma-app

**Integration:** LOW PRIORITY
**Reason:** Rewards-focused, different data

**Events to add:**
```typescript
// Points earned
fetch(`${EVENT_PLATFORM}/webhook/karma/points`, {
  body: JSON.stringify({
    user_id,
    points,
    action: 'earned' | 'redeemed',
    source
  })
})
```

---

### 6. rez-app-merchant

**Integration:** HIGH PRIORITY
**Reason:** Core merchant data, inventory intelligence

**Events to add:**
```typescript
// Order received
rezMind.merchant.sendOrderCompleted({
  merchant_id,
  order_id,
  customer_id,
  items,
  total_amount,
  payment_method
})

// Inventory low
rezMind.merchant.sendInventoryLow({
  merchant_id,
  item_id,
  item_name,
  current_stock,
  threshold,
  avg_daily_sales
})

// Payment received
rezMind.merchant.sendPaymentSuccess({
  merchant_id,
  transaction_id,
  amount
})
```

**Where to add:**
- `app/screens/orders/` - On order received
- `app/screens/inventory/` - On stock update
- `app/screens/payments/` - On payment confirm

---

### 7. rez-order-service (Backend)

**Integration:** HIGH PRIORITY
**Reason:** Central order processing

**Events to add:**
```typescript
// On order created
await fetch(`${EVENT_PLATFORM}/webhook/merchant/order`, {
  body: JSON.stringify({
    merchant_id,
    order_id,
    customer_id,
    items,
    total_amount
  })
})

// On order completed
await fetch(`${EVENT_PLATFORM}/webhook/consumer/order`, {
  body: JSON.stringify({
    user_id,
    order_id,
    merchant_id,
    items,
    total_amount
  })
})
```

---

### 8. rez-payment-service (Backend)

**Integration:** MEDIUM PRIORITY
**Reason:** Payment data

**Events to add:**
```typescript
// On payment success
await fetch(`${EVENT_PLATFORM}/webhook/merchant/payment`, {
  body: JSON.stringify({
    merchant_id,
    transaction_id,
    amount,
    status: 'success'
  })
})
```

---

### 9. rez-search-service (Backend)

**Integration:** HIGH PRIORITY
**Reason:** Search intent data

**Events to add:**
```typescript
// On search
await fetch(`${EVENT_PLATFORM}/webhook/consumer/search`, {
  body: JSON.stringify({
    user_id,
    query,
    results_count,
    clicked_item
  })
})
```

---

## AdBazaar Integration

### Intent Flow
```
User searches "spa"
    ↓
Event Platform receives
    ↓
ReZ Mind extracts: intent = "looking_for_service"
    ↓
AdBazaar receives targeting request
    ↓
Shows spa/salon ads
```

### AdBazaar → REZ Mind

| AdBazaar Event | REZ Mind Impact |
|----------------|------------------|
| Ad shown | Update user engagement |
| Ad clicked | Increase intent confidence |
| Ad converted | Strong preference signal |
| Ad ignored | Decrease relevance |

---

## User Segments (Auto-Generated)

Based on events, ReZ Mind auto-generates segments:

| Segment | Trigger | Size |
|---------|---------|------|
| `foodies` | Multiple food orders, variety | 1.8K |
| `deal_seekers` | High discount usage | 950 |
| `vip` | LTV > 50,000 | 180 |
| `new_user` | < 7 days active | 1.2K |
| `at_risk` | 14+ days inactive | 340 |
| `wellness` | Spa/salon bookings | 620 |
| `travelers` | Hotel bookings | 150 |

---

## Privacy Compliance

All events must:

1. **Anonymize user_id** - Use hashed IDs
2. **No PII in events** - Don't send names, emails, phones
3. **Consent check** - Only track if user consented
4. **Minimal data** - Only necessary fields

```typescript
// Good
{ user_id: 'hash_abc123', item_id: 'biryani', amount: 250 }

// Bad
{ user_id: '+91-98765-43210', name: 'Rejaul', email: 'rejaul@email.com' }
```

---

## Implementation Checklist

### Phase 1: Core Apps
- [ ] rez-app-consumer - Add event calls
- [ ] rez-app-merchant - Add event calls
- [ ] rez-order-service - Add event calls
- [ ] rez-search-service - Add event calls

### Phase 2: Supporting Apps
- [ ] rez-now - Add event calls
- [ ] rez-web-menu - Add event calls
- [ ] rendez - Add event calls

### Phase 3: Services
- [ ] rez-payment-service - Add event calls
- [ ] rez-gamification-service - Add event calls
- [ ] rez-marketing-service - Add event calls

---

## Event Platform URLs

| Environment | URL |
|-------------|-----|
| Local | http://localhost:4008 |
| Production | https://rez-event-platform.onrender.com |

---

## Webhook Endpoints

| Event | Endpoint |
|-------|----------|
| Merchant order | POST /webhook/merchant/order |
| Merchant inventory | POST /webhook/merchant/inventory |
| Merchant payment | POST /webhook/merchant/payment |
| Consumer order | POST /webhook/consumer/order |
| Consumer search | POST /webhook/consumer/search |
| Consumer view | POST /webhook/consumer/view |
| Consumer booking | POST /webhook/consumer/booking |

---

Last updated: 2026-05-01
