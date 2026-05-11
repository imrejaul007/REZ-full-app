# REZ MIND - COMPLETE REFERENCE

**Last Updated:** May 6, 2026

---

# WHAT IS REZ MIND

REZ Mind is the **AI Brain** of the entire platform. It learns user behavior, predicts intent, triggers actions, and provides personalization.

---

# SERVICES INCLUDED

| Service | Port | What it does |
|---------|------|---------------|
| Event Platform | 4008 | Captures all user actions |
| Action Engine | 4009 | Executes automated tasks |
| Feedback Service | 4010 | Stores feedback/learns |
| Intent Graph | 3001 | AI/ML processing |
| User Intelligence | 3004 | User profiles |
| Merchant Intelligence | 4012 | Merchant insights |

---

# FEATURES

## 1. EVENT TRACKING

### Consumer Events
```typescript
// Search
sendSearch({
  user_id: string,
  query: string,
  results_count: number,
  clicked_item?: string
})

// View Item
sendView({
  user_id: string,
  item_id: string,
  merchant_id: string,
  category?: string,
  duration_seconds?: number
})

// Add to Cart
sendCart({
  user_id: string,
  items: Array<{item_id, quantity, price}>,
  total_amount: number
})

// Order Placed
sendOrder({
  user_id: string,
  order_id: string,
  items: Array<{item_id, quantity, price}>,
  total_amount: number,
  payment_method: string
})

// Booking
sendBooking({
  user_id: string,
  booking_id: string,
  service_type: string,
  amount: number,
  merchant_id: string
})
```

### Merchant Events
```typescript
// Order Completed
sendOrderCompleted({
  merchant_id: string,
  order_id: string,
  customer_id: string,
  items: Array<{item_id, quantity, price}>,
  total_amount: number,
  payment_method: string
})

// Inventory Low
sendInventoryLow({
  merchant_id: string,
  item_id: string,
  item_name: string,
  current_stock: number,
  threshold: number,
  avg_daily_sales?: number
})

// Payment Success
sendPaymentSuccess({
  merchant_id: string,
  transaction_id: string,
  amount: number,
  order_id: string
})
```

---

# AUTOMATIONS

## Abandoned Cart Recovery
```typescript
User adds items to cart
↓
30 minutes pass
↓
No checkout
↓
Trigger WhatsApp reminder
↓
User returns to complete purchase
```

## Stock Alerts
```typescript
Inventory < threshold
↓
Alert merchant
↓
Suggestion to reorder
↓
Auto-generate PO
```

## User Segmentation
```typescript
High value → VIP tier → Extra discounts
Low engagement → Re-engagement campaign
New user → Welcome sequence
Dormant → Win-back offer
```

## Smart Search
```typescript
Query: "biryani"
↓
REZ Mind learns: User wants Indian food
↓
Show: Biryani + Rice + Curry + Drinks
```

---

# CONNECTIONS

## Services REZ Mind Connects To

| Service | Connection Type |
|---------|-----------------|
| rez-auth-service | User IDs |
| rez-merchant-service | Merchant data |
| rez-payment-service | Transaction verification |
| rez-wallet-service | Points/wallet balance |
| rez-notification-service | Push/WhatsApp |
| rez-marketing-service | Campaigns |
| rez-gamification | Loyalty points |

## Data Flow
```
Apps → Event Platform → Action Engine → Notifications
     ↓
User Intelligence → Intent Graph → Recommendations
     ↓
Marketing → Personalized Offers
```

---

# MONITORING

## Health Check
```bash
GET https://rez-core-platform.onrender.com/health
```

## Metrics Tracked
- Events/minute
- Action success rate
- User engagement
- Search accuracy
- Conversion rate
- Cart abandonment rate
