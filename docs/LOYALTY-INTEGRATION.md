# Loyalty Integration Guide

## Overview

This document describes how to integrate the REZ Loyalty system into consumer and merchant applications using the `@rez/loyalty-client` package.

## Installation

The `@rez/loyalty-client` package is installed as a local dependency pointing to the packages directory:

```json
// In rez-app-consumer/package.json and rez-app-merchant/package.json
{
  "dependencies": {
    "@rez/loyalty-client": "file:../packages/rez-loyalty-client"
  }
}
```

After updating package.json, run:

```bash
# In consumer app
cd rez-app-consumer && npm install

# In merchant app
cd rez-app-merchant && npm install
```

## Package Structure

The loyalty package exports:

- **Hooks**: `useUniversalLoyalty`, `useQRLoyalty`, `useLoyaltyBenefits`, `useOfferEligibility`
- **Types**: All TypeScript interfaces for profiles, offers, badges, streaks
- **Clients**: `ConsumerLoyaltyClient`, `MerchantLoyaltyClient`, `AdminLoyaltyClient`
- **Engine**: `KarmaLoyaltyEngine` for combined karma-loyalty calculations

## Usage

### Consumer App

**File**: `rez-app-consumer/lib/loyalty.ts`

```typescript
import { useUniversalLoyalty } from '@/lib/loyalty';
import type { EnrichedLoyaltyProfile } from '@/lib/loyalty';

// In component
const { profile, calculateCoins, loadProfile } = useUniversalLoyalty({
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  mindApiUrl: process.env.NEXT_PUBLIC_MIND_API_URL,
  mindApiKey: process.env.NEXT_PUBLIC_MIND_API_KEY,
});

// Load profile on mount
useEffect(() => {
  loadProfile(userId);
}, [userId]);

// Calculate coins for ₹1000 purchase
const coins = calculateCoins(1000);
// User gets: 50 coins (base) × karma × loyalty

// Show profile
{profile?.karmaLevel} - {profile?.loyaltyTier}
// elite - diamond

// Show multiplier
{profile?.coefficient}x coins
// 4x coins
```

### Merchant App

**File**: `rez-app-merchant/services/loyalty.ts`

```typescript
import { useQRLoyalty } from '@/services/loyalty';
import type { LoyaltyOffer } from '@/services/loyalty';

// In store dashboard
const { profile, qrOffers, loading } = useQRLoyalty('menu');

// Show user's karma-loyalty status
<UserBadge
  karma={profile?.karmaLevel}
  loyalty={profile?.loyaltyTier}
  multiplier={profile?.coefficient}
/>

// Enhanced offers
{qrOffers.map(offer => (
  <OfferCard
    key={offer.id}
    base={offer.baseCoins}
    enhanced={offer.enhancedCoins}
    title={offer.title}
  />
))}
```

## Karma-Loyalty Benefits

The combined multiplier is calculated from both karma level and loyalty tier:

| Karma     | Multiplier | × | Loyalty  | Multiplier | = | Total   |
|-----------|------------|---|----------|------------|---|---------|
| elite     | 2.0x       | × | diamond  | 2.0x       | = | 4.0x    |
| leader    | 1.5x       | × | platinum | 1.5x       | = | 2.25x   |
| contributor | 1.25x   | × | gold     | 1.2x       | = | 1.5x    |
| active    | 1.1x       | × | silver   | 1.1x       | = | 1.21x   |
| starter   | 1.0x       | × | bronze   | 1.0x       | = | 1.0x    |

### Karma Levels

- **starter**: Base level (1.0x)
- **active**: Active user (1.1x)
- **contributor**: Contributors (1.25x)
- **leader**: Community leaders (1.5x)
- **elite**: Top tier users (2.0x)

### Loyalty Tiers

- **bronze**: 0+ points (1.0x)
- **silver**: 500+ points (1.05x)
- **gold**: 2000+ points (1.2x)
- **platinum**: 5000+ points (1.5x)
- **diamond**: 10000+ points (2.0x)

## Environment Variables

### Consumer App

```env
NEXT_PUBLIC_API_URL=https://api.rez.money
NEXT_PUBLIC_MIND_API_URL=https://rez-mind.rez.money
NEXT_PUBLIC_MIND_API_KEY=xxx
```

### Merchant App

```env
NEXT_PUBLIC_MERCHANT_API_URL=https://merchant-api.rez.money
NEXT_PUBLIC_MIND_API_URL=https://rez-mind.rez.money
NEXT_PUBLIC_MIND_API_KEY=xxx
```

## API Endpoints

The loyalty hooks call these backend endpoints:

- `GET /karma/profile/:userId` - Get user's karma score and level
- `GET /loyalty/profile/:userId` - Get user's loyalty points and tier
- `GET /loyalty/offers` - Get available loyalty offers
- `POST /loyalty/transactions` - Record coin transactions

## Type Exports

### Consumer App (`lib/loyalty.ts`)

```typescript
export type {
  LoyaltyProfile,
  KarmaLoyaltyProfile,
  EnrichedLoyaltyProfile,
  LoyaltyOffer,
  KarmaEnhancedOffer,
  LoyaltyBadge,
  StreakData,
  CoinBalance,
  Badge,
  LoyaltyTier,
  KarmaLevel,
  Streak,
  StreakMilestone,
  AllStreaks,
  VisitStreak,
  CoinTransaction,
  BrandLoyalty,
  UserLoyalty,
  Mission,
  UniversalLoyaltyConfig,
  UseUniversalLoyaltyReturn,
  UseQRLoyaltyReturn,
  LoyaltyBenefits,
};
```

### Merchant App (`services/loyalty.ts`)

```typescript
export type {
  LoyaltyProfile,
  KarmaLoyaltyProfile,
  MerchantLoyaltyProfile,
  CustomerLoyalty,
  LoyaltyOffer,
  LoyaltyTier,
  KarmaLevel,
  Badge,
  Streak,
  CoinBalance,
  MerchantCustomer,
  UniversalLoyaltyConfig,
  UseUniversalLoyaltyReturn,
  UseQRLoyaltyReturn,
  LoyaltyBenefits,
};
```

## Coin Calculation

Base formula: `coins = floor(amount / 20)` (50 coins per 1000 rupees)

With karma-loyalty multiplier: `coins = floor(baseCoins * karmaMultiplier * loyaltyMultiplier)`

Example for ₹1000 purchase:

| User Profile | Base Coins | Karma × Loyalty | Total |
|-------------|------------|-----------------|-------|
| starter/bronze | 50 | 1.0 × 1.0 | 50 |
| active/silver | 50 | 1.1 × 1.05 | 58 |
| contributor/gold | 50 | 1.25 × 1.2 | 75 |
| leader/platinum | 50 | 1.5 × 1.5 | 113 |
| elite/diamond | 50 | 2.0 × 2.0 | 200 |

## QR Type Support

The `useQRLoyalty` hook filters offers by QR type:

- `menu` - Restaurant menu QR codes
- `room` - Hotel room service QR codes
- `store` - Retail store QR codes
- `campaign` - Marketing campaign QR codes

## Error Handling

The hooks return `loading` and `error` states:

```typescript
const { loading, error, profile } = useUniversalLoyalty(config);

if (loading) return <Spinner />;
if (error) return <Error message={error} />;
if (!profile) return <EmptyState />;
```

## Dependencies

The package requires:

- `axios` - For API calls
- `react` - For hooks
- Environment variables for API URLs
