# REAL-TIME TRIGGERS

**Purpose:** Instant reaction to user behavior
**Latency:** < 100ms

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER ACTION                                                     │
│                                                                       │
│   User searches / scans / enters location / adds to cart                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼ (< 100ms)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRIGGER ENGINE                                             │
│                                                                       │
│   1. Receive event                                                      │
│   2. Match rules                                                       │
│   3. Filter by cooldown                                                │
│   4. Execute actions                                                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPREME CONTROLLER                                        │
│                                                                       │
│   5. Get decision approval                                             │
│   6. Return action                                                     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ACTION EXECUTED                                          │
│                                                                       │
│   WhatsApp sent / Coins credited / Push notification                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## EVENTS

| Event | Called By | Triggered When |
|-------|----------|----------------|
| `search` | Search service | User searches |
| `scan` | adsqr | User scans QR |
| `location` | Location service | User enters zone |
| `cart` | Cart service | Cart abandoned |
| `purchase` | Order service | Order completed |
| `view` | Catalog service | Product viewed |

---

## DEFAULT RULES

### Search Triggers

| Rule | Action | Delay | Cooldown |
|------|--------|-------|----------|
| High intent search | WhatsApp | 0 | 2 hours |
| Generic search | Push | 5 min | 4 hours |

### QR Scan Triggers

| Rule | Action | Delay | Cooldown |
|------|--------|-------|----------|
| Scan | Credit coins | 0 | 0 |
| Scan | Follow-up WhatsApp | 5 min | 6 hours |

### Location Triggers

| Rule | Action | Radius | Cooldown |
|------|--------|-------|----------|
| Enter zone | Show nearby | 500m | 1 hour |

### Cart Triggers

| Rule | Action | Delay | Cooldown |
|------|--------|-------|----------|
| Abandon cart (>100) | Recovery message | 30 min | 24 hours |
| High value add | WhatsApp | 0 | 4 hours |

### Purchase Triggers

| Rule | Action | Delay | Cooldown |
|------|--------|-------|----------|
| Purchase | Credit coins | 0 | 0 |
| Purchase | Thank you WhatsApp | 0 | 0 |

---

## API ENDPOINTS

### POST /api/triggers/fire

Main webhook for any event.

```json
{
  "userId": "user_123",
  "event": "search",
  "data": {
    "query": "biryani",
    "location": { "lat": 12.97, "lng": 77.59 }
  }
}
```

### POST /api/triggers/search

Convenience endpoint for search.

```json
{
  "userId": "user_123",
  "query": "biryani",
  "location": { "lat": 12.97, "lng": 77.59 }
}
```

### POST /api/triggers/scan

Convenience endpoint for QR scan.

```json
{
  "userId": "user_123",
  "campaignId": "camp_456",
  "merchantId": "kfc_btm",
  "location": { "lat": 12.97, "lng": 77.59 }
}
```

### POST /api/triggers/location

Convenience endpoint for location.

```json
{
  "userId": "user_123",
  "type": "enter",
  "zoneId": "btm_zone_1",
  "location": { "lat": 12.97, "lng": 77.59 }
}
```

### POST /api/triggers/cart

Convenience endpoint for cart events.

```json
{
  "userId": "user_123",
  "action": "abandon",
  "cartId": "cart_789",
  "totalValue": 500
}
```

### POST /api/triggers/purchase

Convenience endpoint for purchase.

```json
{
  "userId": "user_123",
  "orderId": "order_999",
  "merchantId": "kfc_btm",
  "amount": 500
}
```

---

## INTEGRATION POINTS

### Search Service

```typescript
// When user searches
await fetch('https://rde.rezapp.com/api/triggers/search', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    query: searchQuery,
    location: user.location
  })
});
```

### adsqr

```typescript
// When user scans QR
await fetch('https://rde.rezapp.com/api/triggers/scan', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    campaignId: campaign.id,
    merchantId: merchant.id,
    location: qr.location
  })
});
```

### Location Service

```typescript
// When user enters zone
await fetch('https://rde.rezapp.com/api/triggers/location', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    type: 'enter',
    zoneId: zone.id,
    location: user.location
  })
});
```

### Cart Service

```typescript
// When user abandons cart
await fetch('https://rde.rezapp.com/api/triggers/cart', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    action: 'abandon',
    cartId: cart.id,
    totalValue: cart.total
  })
});
```

---

## RULE MANAGEMENT

### Get All Rules

```bash
GET /api/triggers/rules
```

### Create Rule

```bash
POST /api/triggers/rules
{
  "id": "custom_rule",
  "event": "search",
  "conditions": [
    { "field": "data.query", "operator": "contains", "value": ["pizza"] }
  ],
  "action": "send_whatsapp",
  "actionConfig": { "template": "pizza_offer" },
  "priority": 100,
  "cooldownMinutes": 120
}
```

### Toggle Rule

```bash
PATCH /api/triggers/rules/:id/toggle
{ "active": false }
```

---

## COOLDOWNS

| Event | Default Cooldown |
|-------|-----------------|
| search | 2 hours |
| scan | 0 (instant) |
| location | 1 hour |
| cart_abandon | 24 hours |
| purchase | 0 (instant) |
| view | 12 hours |

---

## FILES

| File | Purpose |
|------|---------|
| `engines/sampling/realtimeTriggers.ts` | Core logic |
| `routes/realtimeTriggers.ts` | API routes |
| `docs/REALTIME-TRIGGERS.md` | This documentation |

---

**STATUS: REAL-TIME TRIGGERS ACTIVE**
