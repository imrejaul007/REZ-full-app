# RDE SUPREME CONTROLLER

**Purpose:** Central brain that controls EVERYTHING
**Rule:** NOTHING happens without RDE approval

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPREME CONTROLLER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ALL CHANNELS CALL THIS BEFORE ANY ACTION                                   │
│                                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │WhatsApp│  │  Push  │  │  Email  │  │   QR   │  │  DOOH  │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │
│       │             │             │             │             │            │
│       └─────────────┴──────┬──────┴─────────────┴─────────────┘            │
│                            │                                              │
│                            ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SUPREME CONTROLLER                             │   │
│  │                                                                    │   │
│  │   1. Check fatigue                                               │   │
│  │   2. Get user context                                            │   │
│  │   3. Rank competing merchants                                    │   │
│  │   4. Make decision (approve/reject)                             │   │
│  │   5. Return action                                              │   │
│  │                                                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                            │                                              │
│                            ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    EXECUTE ACTION                                  │   │
│  │                                                                    │   │
│  │   Send message → Record result → Learn                            │   │
│  │                                                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API ENDPOINTS

### POST /api/rde/decide

**Purpose:** Main decision endpoint - ALL channels MUST call this

**Request:**
```json
{
  "userId": "user_123",
  "action": "send_message",
  "channel": "whatsapp",
  "context": {
    "campaignId": "camp_456",
    "merchantId": "merch_789",
    "intent": "biryani"
  }
}
```

**Response (Approved):**
```json
{
  "approved": true,
  "decisionId": "d_123456789_abc",
  "reason": "approved",
  "approvedAction": {
    "channel": "whatsapp",
    "timing": "now",
    "coins": 50,
    "merchantId": "merch_789"
  }
}
```

**Response (Rejected):**
```json
{
  "approved": false,
  "decisionId": "d_123456789_abc",
  "reason": "fatigue",
  "rejectedReason": "Limit reached for this channel",
  "cooldownMinutes": 1440
}
```

---

### POST /api/rde/event

**Purpose:** Real-time event processing (< 100ms latency)

**Request:**
```json
{
  "userId": "user_123",
  "event": "search",
  "data": {
    "intent": "biryani",
    "location": { "lat": 12.97, "lng": 77.59 }
  },
  "timestamp": "2026-05-05T12:30:00Z"
}
```

**Supported Events:**
| Event | Action Triggered |
|-------|-----------------|
| `search` | Send WhatsApp |
| `scan` | Show QR reward |
| `location` | Show merchant |
| `cart_abandon` | Push notification |
| `browse` | Send message |
| `purchase` | Allocate coins |

---

### POST /api/rde/result

**Purpose:** Record execution result

**Request:**
```json
{
  "decisionId": "d_123456789_abc",
  "result": "converted"
}
```

**Result Values:** `sent`, `clicked`, `converted`, `failed`

---

### GET /api/rde/ranking/:userId

**Purpose:** Get ranked merchants for user

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "merchants": [
      { "merchantId": "kfc_btm", "score": 85 },
      { "merchantId": "pizza_hut", "score": 72 },
      { "merchantId": "dominos", "score": 68 }
    ],
    "count": 3
  }
}
```

---

### GET /api/rde/check/:userId/:channel

**Purpose:** Quick fatigue check

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "channel": "whatsapp",
    "allowed": true,
    "message": "Can send"
  }
}
```

---

## INTEGRATION POINTS

### For WhatsApp (rez-marketing)

```typescript
// BEFORE sending WhatsApp
const decision = await fetch('https://rde.rezapp.com/api/rde/decide', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    action: 'send_message',
    channel: 'whatsapp',
    context: { campaignId: campaign.id, merchantId: merchant.id }
  })
});

// If approved, send message
if (decision.approved) {
  await whatsappService.send(decision.approvedAction.content);
  // Record result
  await fetch('/api/rde/result', { ... });
}
```

---

### For QR Scanning (adsqr)

```typescript
// AFTER scanning QR
const decision = await fetch('https://rde.rezapp.com/api/rde/event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    event: 'scan',
    data: { campaignId, merchantId, location }
  })
});

// If approved, credit coins
if (decision.approved) {
  await creditCoins(user.id, decision.coins);
}
```

---

### For Search Events (search service)

```typescript
// ON user search
const decision = await fetch('https://rde.rezapp.com/api/rde/event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    event: 'search',
    data: { intent: searchQuery, location: userLocation }
  })
});
```

---

## FATIGUE LIMITS

| Channel | Max/Day | Min Gap |
|---------|---------|---------|
| WhatsApp | 5 | 60 min |
| Push | 10 | 30 min |
| Email | 3 | 2 hours |
| QR | 3 | 4 hours |
| DOOH | 10 | 30 min |
| SMS | 2 | 2 hours |

---

## SCORING ALGORITHM

```
Score = Intent Match (30%) + Budget (15%) + CTR (20%) + Offer (20%) + Affinity (10%) + Conversion (5%)
```

---

## COMPETITION LOGIC

When multiple merchants target same user:

```
Merchant A: score 85 → WINS (only one message sent)
Merchant B: score 72 → Queued
Merchant C: score 68 → Queued
```

---

## FILES

| File | Purpose |
|------|---------|
| `engines/sampling/supremeController.ts` | Core logic |
| `routes/supremeController.ts` | API routes |
| `SUPREME-CONTROLLER.md` | This documentation |

---

**STATUS: SUPREME CONTROLLER ACTIVE**
