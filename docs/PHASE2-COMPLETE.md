# PHASE 2: DECISION ENGINE (RDE) - COMPLETE

**Date:** May 5, 2026
**Status:** ✅ COMPLETE

---

## What Was Built

### 1. Sampling Decision Engine

**File:** `rez-decision-service/src/engines/sampling/samplingDecision.ts`

**Components:**
- **Scoring Engine** - Calculates user score (0-100)
- **Coin Allocation Engine** - Determines coin amount
- **Timing Engine** - Decides when to send
- **Fatigue Engine** - Prevents spam

### 2. Sampling API Routes

**File:** `rez-decision-service/src/routes/sampling.ts`

**Endpoints:**
- `POST /api/sampling/decide` - Main decision
- `GET /api/sampling/fatigue/:userId` - Check fatigue
- `POST /api/sampling/record-scan` - Record scan
- `POST /api/sampling/record-redeem` - Record redemption
- `GET /api/sampling/leaderboard` - Top scanners

### 3. Updated Main Service

**File:** `rez-decision-service/src/index.ts`

Added sampling routes to the service.

---

## How It Works

### Decision Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ USER SCANS QR │
│ │
│ ▼ │
│ RDE DECISION │
│ │
│ 1. Check fatigue (max 3/day, 4hr gap) │
│ 2. Calculate score │
│ 3. Determine coin amount │
│ 4. Decide timing │
│ │
│ ▼ │
│ DECISION OUTPUT │
│ │
│ { │
│ eligible: true, │
│ coinAmount: 50, │
│ coinType: 'try', │
│ timing: { sendNow: true } │
│ } │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scoring Formula

```
Final Score = (
  User Affinity × 0.30 +
  User Stage × 0.20 +
  Time of Day × 0.15 +
  Inventory Level × 0.15 +
  Campaign Urgency × 0.10 +
  (100 - Fatigue) × 0.10
)
```

---

## Fatigue Rules

| Rule | Value | Description |
|------|-------|-------------|
| Max scans/day | 3 | Don't spam |
| Min gap | 4 hours | Between scans |
| Cooldown after redeem | 24 hours | After using coins |
| Max wallet | 500 coins | Don't credit if full |

---

## Coin Allocation

```
Coin Amount = minCoins + (maxCoins - minCoins) × (score / 100)

Example:
- minCoins: 10
- maxCoins: 100
- score: 75

- coinAmount = 10 + (100 - 10) × (75 / 100)
- coinAmount = 10 + 90 × 0.75
- coinAmount = 77.5 → 78 coins
```

---

## Time Scoring

| Time | Score | Reason |
|------|-------|--------|
| 12-2 PM | 0.9 | Lunch |
| 7-10 PM | 0.8 | Dinner |
| Weekend | 0.7 | More active |
| 6-9 PM | 0.6 | Evening |
| 10 AM-8 PM | 0.4 | Normal hours |
| Other | 0.2 | Low activity |

---

## API Endpoints

### POST /api/sampling/decide

```typescript
// Request
{
  userId: "user123",
  campaignId: "camp456",
  merchantId: "merch789",
  location: { lat: 12.97, lng: 77.59 }
}

// Response
{
  success: true,
  data: {
    eligible: true,
    reason: "Affinity OK | NEW user boost | Lunch time",
    coinAmount: 50,
    coinType: "try",
    timing: { sendNow: true },
    priority: 82
  }
}
```

### GET /api/sampling/fatigue/:userId

```typescript
// Response
{
  success: true,
  data: {
    userId: "user123",
    eligible: true,
    level: 33,
    reason: "Eligible",
    canScan: true,
    nextScanIn: "Now"
  }
}
```

### POST /api/sampling/record-scan

```typescript
// Request
{
  userId: "user123",
  campaignId: "camp456",
  merchantId: "merch789",
  coinsAwarded: 50
}

// Response
{
  success: true,
  data: {
    scansToday: 2,
    nextScanPossible: "4 hours"
  }
}
```

---

## Redis Keys

| Key Pattern | TTL | Description |
|------------|-----|-------------|
| `sampling:fatigue:{userId}:scans:{date}` | 24h | Scans today |
| `sampling:fatigue:{userId}:lastScan` | 24h | Last scan time |
| `sampling:fatigue:{userId}:lastRedeem` | 7d | Last redemption |
| `sampling:user:{userId}:preferences` | - | User prefs |
| `sampling:merchant:{id}:category` | - | Merchant category |
| `sampling:leaderboard:{date}` | 24h | Daily leaderboard |

---

## Integration

### With AdsQr

```
AdsQr scan → RDE.decide() → { eligible, coinAmount } → Credit coins
```

### With REZ TRY

```
REZ TRY redemption → RDE.recordRedeem() → Update fatigue
```

### With ReZ Mind

```
RDE shares scoring data → ReZ Mind improves recommendations
```

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `rez-decision-service/src/engines/sampling/samplingDecision.ts` | Created | Core decision logic |
| `rez-decision-service/src/routes/sampling.ts` | Created | API routes |
| `rez-decision-service/src/index.ts` | Modified | Added sampling routes |

---

## Next Steps

| Step | Task | Status |
|------|------|--------|
| 1 | Connect to AdsQr scan API | Pending |
| 2 | Connect to REZ TRY redemption | Pending |
| 3 | Add merchant inventory API | Pending |
| 4 | Add user preference learning | Pending |
| 5 | Phase 3: Smart coin allocation | Pending |

---

## Testing

### Test Decision

```bash
curl -X POST http://localhost:4027/api/sampling/decide \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "campaignId": "camp456",
    "merchantId": "merch789"
  }'
```

### Test Fatigue

```bash
curl http://localhost:4027/api/sampling/fatigue/test123
```

---

## Status: ✅ PHASE 2 COMPLETE

**Ready for:**
- Integration with Phase 1 (AdsQr + REZ TRY)
- Phase 3: Smart coin allocation
