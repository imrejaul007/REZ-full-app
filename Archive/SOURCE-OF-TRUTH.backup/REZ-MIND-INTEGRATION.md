# REZ Mind - App Integration Guide

Version: 1.0.0 | Updated: 2026-05-01

---

## Overview

Connect your apps to REZ Mind to enable:
- Real-time event tracking
- AI-powered decisions
- Personalized experiences
- Business intelligence

---

## Event Platform

**URL:** `http://localhost:4008` (local)  
**Production:** `https://rez-event-platform.onrender.com`

---

## MERCHANT APP INTEGRATION

### 1. Inventory Low Event

Trigger when stock falls below threshold.

```javascript
// POST /webhook/merchant/inventory
const response = await fetch('https://your-event-platform.com/webhook/merchant/inventory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchant_id: 'merchant_123',
    item_id: 'item_456',
    item_name: 'Chicken Biryani',
    current_stock: 3,
    threshold: 5,
    avg_daily_sales: 12,
    recent_orders: 35,
    source: 'merchant_app'
  })
});
```

### 2. Order Completed Event

Trigger when order is completed.

```javascript
// POST /webhook/merchant/order
await fetch('https://your-event-platform.com/webhook/merchant/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchant_id: 'merchant_123',
    order_id: 'order_789',
    customer_id: 'customer_101',
    items: [
      { item_id: 'biryani', quantity: 2, price: 250 },
      { item_id: 'cola', quantity: 2, price: 40 }
    ],
    total_amount: 580,
    payment_method: 'upi',
    source: 'merchant_app'
  })
});
```

### 3. Payment Success Event

Trigger when payment is confirmed.

```javascript
// POST /webhook/merchant/payment
await fetch('https://your-event-platform.com/webhook/merchant/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchant_id: 'merchant_123',
    transaction_id: 'txn_abc123',
    amount: 580,
    status: 'success',
    source: 'merchant_app'
  })
});
```

---

## CONSUMER APP INTEGRATION

### 1. Order Placed Event

Trigger when user places order.

```javascript
// POST /webhook/consumer/order
await fetch('https://your-event-platform.com/webhook/consumer/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user_12345',
    order_id: 'order_789',
    merchant_id: 'merchant_456',
    items: [
      { item_id: 'biryani', quantity: 1, price: 250 }
    ],
    total_amount: 250,
    source: 'consumer_app'
  })
});
```

### 2. Search Event

Trigger when user searches.

```javascript
// POST /webhook/consumer/search
await fetch('https://your-event-platform.com/webhook/consumer/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user_12345',
    query: 'biryani',
    results_count: 15,
    clicked_item: 'biryani_large',
    source: 'consumer_app'
  })
});
```

### 3. Item View Event

Trigger when user views an item.

```javascript
// POST /webhook/consumer/view
await fetch('https://your-event-platform.com/webhook/consumer/view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user_12345',
    item_id: 'biryani_large',
    item_name: 'Chicken Biryani Large',
    merchant_id: 'merchant_456',
    duration_seconds: 15,
    source: 'consumer_app'
  })
});
```

---

## MERCHANT COPILOT (Dashboard)

### API Endpoints

#### Get Merchant Profile
```bash
curl http://localhost:4022/merchant/profile_merchant_123
```

#### Get Merchant Insights
```bash
curl http://localhost:4022/merchant/merchant_123/insights
```

#### Get Recommendations
```bash
curl http://localhost:4022/merchant/merchant_123/recommendations
```

#### Get Health Score
```bash
curl http://localhost:4022/merchant/merchant_123/health-score
```

#### Submit Feedback
```bash
curl -X POST http://localhost:4022/merchant/merchant_123/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "decision_id": "decision_123",
    "outcome": "approved",
    "suggested_quantity": 10,
    "actual_quantity": 12
  }'
```

---

## USER INTELLIGENCE

### API Endpoints

#### Get User Profile
```bash
curl http://localhost:3004/user/user_12345/profile
```

#### Get User Preferences
```bash
curl http://localhost:3004/user/user_12345/preferences
```

#### Get Recommendations
```bash
curl http://localhost:3004/user/user_12345/recommendations
```

#### Capture User Event
```bash
curl -X POST http://localhost:3004/user/event \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_12345",
    "event_type": "purchase",
    "event_data": {
      "item_id": "biryani",
      "amount": 250
    }
  }'
```

---

## TARGETING ENGINE

### API Endpoints

#### Create Campaign
```bash
curl -X POST http://localhost:3003/api/v1/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekend Sale",
    "segments": ["foodies", "deal_seekers"],
    "content": {
      "headline": "20% off this weekend!",
      "body": "Use code WEEKEND20"
    }
  }'
```

#### Preview Audience
```bash
curl "http://localhost:3003/api/v1/campaigns/campaign_123/audience?segment=foodies"
```

---

## FEATURE FLAGS

### Check Flags
```bash
curl http://localhost:4030/flags
```

### Toggle Flag
```bash
# Disable learning
curl -X POST http://localhost:4030/flags/learning_enabled/disable

# Enable ads
curl -X POST http://localhost:4030/flags/ads_enabled/enable
```

---

## QUICK START

### 1. Add to Merchant App

```javascript
// In your merchant app, add this helper:
async function sendToRezMind(eventType, data) {
  const baseUrl = 'https://rez-event-platform.onrender.com';
  const endpoint = {
    'inventory_low': '/webhook/merchant/inventory',
    'order_completed': '/webhook/merchant/order',
    'payment_success': '/webhook/merchant/payment'
  }[eventType];

  await fetch(baseUrl + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, source: 'your_app_name' })
  });
}
```

### 2. Add to Consumer App

```javascript
// In your consumer app, add this helper:
async function trackUserEvent(eventType, data) {
  const baseUrl = 'https://rez-event-platform.onrender.com';
  const endpoint = {
    'order': '/webhook/consumer/order',
    'search': '/webhook/consumer/search',
    'view': '/webhook/consumer/view'
  }[eventType];

  await fetch(baseUrl + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, source: 'your_app_name' })
  });
}
```

### 3. Verify Events Flow

```bash
# Check event platform stats
curl http://localhost:4008/stats

# Check action engine decisions
curl http://localhost:4009/stats
```

---

## SERVICE URLs

| Service | Local | Production |
|---------|-------|------------|
| Event Platform | localhost:4008 | rez-event-platform.onrender.com |
| Action Engine | localhost:4009 | rez-action-engine.onrender.com |
| Feedback | localhost:4010 | rez-feedback-service.onrender.com |
| Merchant Copilot | localhost:4022 | rez-merchant-copilot.onrender.com |
| User Intelligence | localhost:3004 | rez-user-intelligence.onrender.com |
| Feature Flags | localhost:4030 | rez-feature-flags.onrender.com |

---

Last updated: 2026-05-01
