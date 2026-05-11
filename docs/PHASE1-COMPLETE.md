# PHASE 1: ADSQR ↔ REZ TRY INTEGRATION - COMPLETE

**Date:** May 5, 2026
**Status:** ✅ COMPLETE

---

## What Was Built

### 1. AdsQr Scan API Upgrade

**File:** `adsqr/src/app/api/scan/[slug]/route.ts`

**Changes:**
- Modified to redirect to REZ TRY after scan
- Credits `try` type coins (REZ TRY coins)
- Passes scan data via URL params

**New Flow:**
```
User scans QR
  ↓
AdsQr validates + credits coins (type: 'try')
  ↓
Redirects to: try.rez.money/scan-reward?coins=X&campaign_id=Y&...
```

### 2. REZ TRY Scan Reward Page

**File:** `rez-try/src/app/scan-reward/page.tsx`

**Features:**
- Success modal: Shows "You Won!" with coin amount
- Pending auth modal: Prompts login to claim coins
- Blocked modal: Shows scan recorded message
- Auto-dismiss after 10 seconds
- Shows campaign/offer info

### 3. REZ TRY Coins Wallet

**File:** `rez-try/src/app/coins/page.tsx`

**Features:**
- Total balance display
- 3 coin types: Try Coins, Brand Coins, REZ Coins
- Transaction history
- How to earn section
- Redeem button

### 4. Coin Balance API

**File:** `rez-try/src/app/api/coins/balance/route.ts`

**Returns:**
```json
{
  "balance": {
    "tryCoins": 250,
    "brandCoins": [
      { "name": "KFC", "symbol": "KFCCOIN", "balance": 100 }
    ],
    "rezCoins": 150
  },
  "transactions": [...]
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ ADSQR │
├─────────────────────────────────────────────────────────────────┤
│ │
│ Merchant creates campaign │
│ QR codes generated │
│ │
│ User scans QR │
│ │
│ Fraud check │
│ │
│ Coins credited (type: 'try') │
│ │
│ Redirect to: │
│ try.rez.money/scan-reward?coins=50&campaign_id=... │
│ │
└─────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────┐
│ REZ TRY │
├─────────────────────────────────────────────────────────────────┤
│ │
│ Show reward modal │
│ "🎉 You Won +50 coins!" │
│ │
│ User can: │
│ - Redeem Now │
│ - Browse More │
│ │
│ Coins added to wallet │
│ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Coin Types

| Type | Source | Label |
|------|--------|-------|
| **try** | AdsQr scans | "🎁 Try Coins" |
| **brand** | Brand campaigns | "🏪 Brand Coins" |
| **rez** | General | "⭐ REZ Coins" |

---

## URL Params (AdsQr → REZ TRY)

| Param | Description | Example |
|--------|-------------|---------|
| `source` | Origin | `adsqr` |
| `coins` | Coin amount | `50` |
| `credited` | Credited? | `true/false` |
| `campaign_id` | Campaign ID | `abc123` |
| `campaign_name` | Campaign name | `Biryani Promo` |
| `offer` | Offer text | `Free biryani sample` |
| `merchant_id` | Merchant ID | `xyz789` |
| `status` | Scan status | `success/blocked/no_auth` |
| `user_id` | User ID (if auth) | `user123` |

---

## Files Changed/Created

| File | Action | Purpose |
|------|--------|---------|
| `adsqr/src/app/api/scan/[slug]/route.ts` | Modified | Redirect to REZ TRY |
| `rez-try/src/app/scan-reward/page.tsx` | Created | Reward modal |
| `rez-try/src/app/coins/page.tsx` | Created | Coin wallet |
| `rez-try/src/app/api/coins/balance/route.ts` | Created | Balance API |
| `rez-try/src/lib/supabase.ts` | Created | Supabase client |

---

## Environment Variables

### AdsQr
```env
REZ_TRY_URL=https://try.rez.money
```

### REZ TRY
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Next Steps

| Step | Task | Status |
|------|------|--------|
| 1 | Integrate with real wallet service | Pending |
| 2 | Add coin type to campaigns | Pending |
| 3 | Brand coin support | Pending |
| 4 | Real-time coin updates | Pending |

---

## Testing

### Test Flow
1. Create campaign in AdsQr with `scan_reward: 50`
2. Generate QR codes
3. Scan QR code with authenticated user
4. Should redirect to REZ TRY with modal showing "+50 coins"

### Manual Test URL
```
try.rez.money/scan-reward?source=adsqr&coins=50&campaign_id=test123&campaign_name=Biryani+Promo&status=success&credited=true
```

---

## Status: ✅ PHASE 1 COMPLETE

**Ready for:**
- Integration testing
- Real wallet service connection
- Phase 2: Decision Engine
