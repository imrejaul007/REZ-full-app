# AUCTION ENGINE

**Purpose:** Handle competition between merchants for same user
**Type:** Second-price auction

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUCTION FLOW                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  5 MERCHANTS target same user                                              │
│                                                                              │
│  Merchant A ──▶ bid: 100 ──▶ quality: 90 ──▶ CTR: 8%                  │
│  Merchant B ──▶ bid: 80 ──▶ quality: 85 ──▶ CTR: 6%                   │
│  Merchant C ──▶ bid: 60 ──▶ quality: 70 ──▶ CTR: 5%                   │
│  Merchant D ──▶ bid: 50 ──▶ quality: 75 ──▶ CTR: 4%                   │
│  Merchant E ──▶ bid: 40 ──▶ quality: 60 ──▶ CTR: 3%                   │
│                                                                              │
│                              ▼                                                │
│                                                                              │
│                     SCORING                                                  │
│                                                                              │
│  Score = bid (25%) + quality (25%) + intent (20%) + CTR (15%) + conversion (15%)  │
│                                                                              │
│                              ▼                                                │
│                                                                              │
│                        WINNER                                                 │
│                                                                              │
│  Merchant A wins with score: 85                                              │
│  Only Merchant A reaches user                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SCORING ALGORITHM

```
Final Score =

  Base Bid Score × 0.25    ─── How much merchant willing to pay
+ Quality Score × 0.25     ─── Merchant reputation
+ Intent Match × 0.20     ─── Matches user intent
+ Historical CTR × 0.15    ─── Past performance
+ Conversion Rate × 0.15   ─── Past conversion
```

---

## BID TYPES

| Type | Description |
|------|-------------|
| **CPM** | Cost per 1000 impressions |
| **CPC** | Cost per click |
| **CPA** | Cost per acquisition |
| **Fixed** | Fixed bid amount |

---

## AUCTION TYPES

| Type | Winner Pays | Best For |
|------|-----------|----------|
| **Second-price** | 2nd place + 10% | Most common |
| **First-price** | Your bid | Maximizing revenue |
| **Vickrey** | 2nd place exactly | Fair bidding |

---

## API ENDPOINTS

### POST /api/auction/run

Run auction for a user.

```json
{
  "userId": "user_123",
  "intent": "biryani",
  "location": { "lat": 12.97, "lng": 77.59 }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "auctionId": "auction_123",
    "winner": {
      "merchantId": "kfc_btm",
      "finalScore": 85,
      "components": {
        "bidScore": 25,
        "qualityScore": 22,
        "intentMatch": 18,
        "historicalCTR": 12,
        "conversionRate": 8
      }
    },
    "runnersUp": [
      { "merchantId": "pizza_hut", "finalScore": 72 },
      { "merchantId": "dominos", "finalScore": 68 }
    ],
    "winningPrice": 79,
    "reasons": ["Higher bid amount", "Better quality score"]
  }
}
```

---

### POST /api/auction/bid

Submit a bid.

```json
{
  "merchantId": "kfc_btm",
  "campaignId": "camp_456",
  "userId": "user_123",
  "baseBid": 100,
  "qualityScore": 90,
  "cpm": 10,
  "cpc": 5,
  "discount": 20,
  "coinReward": 50
}
```

---

### POST /api/auction/simulate

Simulate auction without running.

```json
{
  "userId": "user_123",
  "merchants": [
    { "merchantId": "kfc_btm", "baseBid": 100, "qualityScore": 90 },
    { "merchantId": "pizza_hut", "baseBid": 80, "qualityScore": 85 },
    { "merchantId": "dominos", "baseBid": 60, "qualityScore": 70 }
  ]
}
```

---

### GET /api/auction/status/:userId

Get user's auction status.

```json
{
  "success": true,
  "data": {
    "activeBids": 5,
    "wonAuctions": 12,
    "avgWinningBid": 85,
    "lastAuction": "2026-05-05T12:00:00Z"
  }
}
```

---

## INTEGRATION

### With Supreme Controller

```typescript
// Supreme Controller calls auction when multiple merchants target user
const auction = await fetch('/api/auction/run', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    intent: userSearchQuery,
    location: user.location
  })
});

// If winner, proceed with action
if (auction.winner) {
  await sendToUser(auction.winner.merchantId, user.id);
}
```

### With Campaign Service

```typescript
// When merchant creates campaign targeting user segment
await fetch('/api/auction/bid', {
  method: 'POST',
  body: JSON.stringify({
    merchantId: merchant.id,
    campaignId: campaign.id,
    userId: targetUser.id,
    baseBid: 100,
    qualityScore: merchant.rating
  })
});
```

---

## EXAMPLE FLOW

```
SCENARIO: User searches "biryani"

1. Trigger fires → Supreme Controller receives
2. 5 restaurants targeting Bangalore users
3. Auction runs:
   ├── KFC: score 85 (wins)
   ├── Pizza Hut: score 72
   ├── Domino's: score 68
   ├── McDonald's: score 65
   └── Burger King: score 60
4. KFC wins auction
5. KFC's ad shown to user
6. KFC pays second-price (72 × 1.1 = 79)
```

---

## FILES

| File | Purpose |
|------|---------|
| `engines/sampling/auctionEngine.ts` | Core logic |
| `routes/auctionEngine.ts` | API routes |
| `docs/AUCTION-ENGINE.md` | This documentation |

---

**STATUS: AUCTION ENGINE ACTIVE**
