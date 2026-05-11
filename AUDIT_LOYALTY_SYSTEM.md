# ReZ Loyalty System Audit Report

**Audit Date:** May 8, 2026
**Auditor:** Product Analyst
**Scope:** rez-merchant-service, rez-wallet-service, rez-app-consumer, rez-gamification-service, rez-karma-service

---

## Executive Summary

The ReZ Loyalty System has a **partially implemented** loyalty infrastructure spread across multiple services. The system includes points/coins, tier management, cashback, coupons, offers, and gamification features. However, several features are stub implementations or use mock data, indicating they are not yet production-ready.

---

## 1. Points System

| Feature | Status | Location |
|---------|--------|----------|
| Earn points on purchase | :warning: PARTIAL | `rez-merchant-service/src/routes/coins.ts` |
| Configurable earn rate | :warning: PARTIAL | `rez-merchant-service/src/models/MerchantLoyaltyConfig.ts` |
| Points expiry | :warning: PARTIAL | `rez-merchant-service/src/models/MerchantLoyaltyConfig.ts` (expiryDays field) |
| Points redemption | :warning: PARTIAL | `rez-merchant-service/src/routes/coins.ts` |
| Points history | :warning: PARTIAL | `rez-merchant-service/src/routes/coins.ts` (wallet-balance, history endpoints) |
| Tier-based points multiplier | :warning: PARTIAL | `rez-merchant-service/src/models/LoyaltyTier.ts` |

### Analysis:
- **MerchantLoyaltyConfig** has `pointsPerRupee` (default 0.1) and `expiryDays` (default 365) configuration
- **CoinTransaction** model tracks transactions with type, amount, coins, status, expiresAt
- **LoyaltyTier** has `multiplier` field for tier-based bonuses
- **Note:** Many endpoints return mock/placeholder data, actual points calculation may not be integrated with order processing

### File Locations:
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/routes/coins.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/models/MerchantLoyaltyConfig.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/models/CoinTransaction.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/routes/loyaltyConfig.ts`

---

## 2. Loyalty Tiers

| Feature | Status | Location |
|---------|--------|----------|
| Bronze tier | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (mock data) |
| Silver tier | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (mock data) |
| Gold tier | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (mock data) |
| Platinum tier | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (mock data) |
| Tier upgrade rules | :warning: PARTIAL | `rez-merchant-service/src/models/LoyaltyTier.ts` |
| Tier-specific benefits | :warning: PARTIAL | `rez-merchant-service/src/models/LoyaltyTier.ts` (discountPercent, benefits) |
| Tier downgrade rules | :x: MISSING | Not found in codebase |

### Analysis:
- **LoyaltyTier** model supports: name, description, minPoints, maxPoints, benefits, discountPercent, color, icon, multiplier, isActive
- Tier configuration stored in `loyaltytiers` collection (cross-service read proxy)
- **Note:** API endpoints return mock tier data; actual tier calculation logic not implemented

### File Locations:
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/models/LoyaltyTier.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/routes/loyaltyTiers.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/routes/loyalty.ts`

---

## 3. Rewards & Offers

| Feature | Status | Location |
|---------|--------|----------|
| Welcome offer | :warning: PARTIAL | `rez-merchant-service/src/routes/offers.ts` |
| Birthday offer | :x: MISSING | Not found in codebase |
| Festival offers | :warning: PARTIAL | `rez-merchant-service/src/routes/offers.ts` (generic offers) |
| Happy hour offers | :x: MISSING | Not found in codebase |
| Referral rewards | :warning: PARTIAL | `rez-wallet-service/src/models/ReferralConversion.ts` |
| Milestone rewards | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (milestones endpoint) |
| Point-based rewards | :warning: PARTIAL | `rez-merchant-service/src/routes/coins.ts` |

### Analysis:
- **Offer** model (read-only proxy to rez-backend) supports: title, description, type, cashbackPercentage, minOrderValue, maxDiscountAmount, couponCode, termsAndConditions, validity dates
- **ReferralConversion** model tracks referral signups
- **Milestones** config exists in `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/config/milestones.ts`
- **Note:** Offers writes are proxied to rez-backend via HTTP calls with 10s timeout

### File Locations:
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/routes/offers.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/models/Offer.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service/src/routes/referralRoutes.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-wallet-service/src/models/ReferralConversion.ts`

---

## 4. Coupon System

| Feature | Status | Location |
|---------|--------|----------|
| Create coupon | :warning: PARTIAL | `rez-merchant-service/src/routes/offers.ts` |
| Coupon codes | :warning: PARTIAL | `rez-merchant-service/src/models/Offer.ts` (couponCode field) |
| Discount types (% / flat) | :warning: PARTIAL | `rez-app-consumer/src/services/couponApi.ts` |
| Minimum order value | :warning: PARTIAL | `rez-merchant-service/src/routes/offers.ts` |
| Usage limits | :warning: PARTIAL | `rez-merchant-service/src/routes/offers.ts` |
| Valid dates | :warning: PARTIAL | `rez-merchant-service/src/routes/offers.ts` (validity object) |
| Auto-apply coupons | :warning: PARTIAL | `rez-app-consumer/src/services/couponApi.ts` (autoApply, autoApplyPriority) |

### Analysis:
- **Consumer App couponApi** has full coupon model with: couponCode, discountType (PERCENTAGE|FIXED), discountValue, minOrderValue, maxDiscountCap, usageLimit (total, perUser, usedCount), autoApply, autoApplyPriority
- **Coupon validation** endpoint: `/coupons/validate`
- **Best offer** calculation: `/coupons/best-offer`

### File Locations:
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/services/couponApi.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/hooks/useCardOfferAutoApply.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/routes/offers.ts`

---

## 5. Cashback

| Feature | Status | Location |
|---------|--------|----------|
| Cashback on purchase | :warning: PARTIAL | `rez-merchant-service/src/routes/cashback.ts` |
| Cashback wallet | :warning: PARTIAL | `rez-wallet-service/src/models/Wallet.ts` |
| Cashback expiry | :warning: PARTIAL | `rez-app-consumer/src/services/cashbackApi.ts` (expiryDate field) |
| Cashback withdrawal | :warning: PARTIAL | `rez-merchant-service/src/routes/cashback.ts` (mark-paid endpoint) |
| Cashback rules | :warning: PARTIAL | `rez-merchant-service/src/models/Cashback.ts` |

### Analysis:
- **Cashback model** supports: merchantId, customerId, orderId, amount, type, percentage, minOrderAmount, maxAmount, validFrom, validTo, status (pending/approved/rejected/paid)
- **Cashback API** (consumer): getCashbackSummary, getCashbackHistory, getPendingCashback, getExpiringSoon, redeemCashback, forecastCashback
- **Workflow:** pending -> approved -> paid (with approval workflow in merchant service)
- **Security:** Bulk actions rate-limited (20/minute), audit logging implemented

### File Locations:
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/routes/cashback.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/models/Cashback.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/services/cashbackApi.ts`

---

## 6. Customer Experience

| Feature | Status | Location |
|---------|--------|----------|
| Loyalty dashboard | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (stats, analytics endpoints) |
| Points balance display | :warning: PARTIAL | `rez-app-consumer/stores/gamificationStore.ts` |
| Tier progress bar | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (mock data) |
| Available rewards list | :warning: PARTIAL | `rez-app-consumer/services/achievementApi.ts` |
| Transaction history | :warning: PARTIAL | Multiple endpoints in coins, cashback routes |
| Push notifications for rewards | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (send-notification) |

### Analysis:
- **Gamification Store** tracks: achievements, coinBalance, challenges, dailyStreak, achievementQueue
- **Achievement system** with tiers (bronze/silver/gold/platinum/diamond), rewards (coins, cashback, badge, multiplier)
- **Achievement API** has progress tracking with ruleProgress array
- **Note:** Consumer UI needs verification for actual dashboard implementation

### File Locations:
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/stores/gamificationStore.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/services/achievementApi.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-app-consumer/services/coinSyncService.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/routes/loyalty.ts`

---

## 7. Merchant Features

| Feature | Status | Location |
|---------|--------|----------|
| Loyalty program setup | :warning: PARTIAL | `rez-merchant-service/src/routes/loyaltyConfig.ts` |
| Custom rewards | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (milestones) |
| Campaign manager | :warning: PARTIAL | `rez-merchant-service/src/models/KarmaCampaign.ts` |
| Analytics | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (analytics endpoint) |
| Customer segmentation | :warning: PARTIAL | `rez-merchant-service/src/routes/loyalty.ts` (tier filter) |

### Analysis:
- **LoyaltyConfig** allows merchants to set: pointsPerRupee, expiryDays, bonusCategories, isActive
- **KarmaCampaign** for CSR/volunteer campaigns with coinPool, budget, metrics
- **Analytics** endpoint returns: timeSeries, summary, cohortRetention
- **Note:** Many analytics endpoints return mock data

### File Locations:
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/routes/loyaltyConfig.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/models/MerchantLoyaltyConfig.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-merchant-service/src/models/KarmaCampaign.ts`

---

## 8. Additional Services Found

### rez-gamification-service
| Feature | Status | Location |
|---------|--------|----------|
| Challenge system | :warning: PARTIAL | `src/services/challengeService.ts` (stub implementation) |
| Leaderboard | :warning: PARTIAL | `src/services/leaderboardService.ts` |
| Marketing integration | :warning: PARTIAL | `src/services/marketingService.ts` |

### rez-karma-service
| Feature | Status | Location |
|---------|--------|----------|
| Karma profile | :warning: PARTIAL | `src/models/KarmaProfile.ts` |
| Karma events | :warning: PARTIAL | `src/models/KarmaEvent.ts` |
| Karma scoring | :warning: PARTIAL | `src/routes/karmaRoutes.ts` |
| Badge system | :warning: PARTIAL | `src/models/KarmaProfile.ts` (badges array) |
| Streak tracking | :warning: PARTIAL | `src/models/KarmaProfile.ts` (currentStreak, longestStreak) |

### File Locations:
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-gamification-service/src/services/challengeService.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-gamification-service/src/services/leaderboardService.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-karma-service/src/models/KarmaProfile.ts`
- `/Users/rejaulkarim/Documents/ReZ Full App/rez-karma-service/src/routes/karmaRoutes.ts`

---

## 9. Missing Features (Not Found)

The following features were NOT found in the codebase:

1. **Birthday offers** - No dedicated birthday campaign/trigger system
2. **Happy hour offers** - No time-based offer activation
3. **Tier downgrade rules** - No automatic tier degradation logic
4. **Referral rewards (full)** - Only ReferralConversion model exists, no reward calculation
5. **Points pooling/sharing** - No family/group points sharing
6. **Loyalty webhooks** - No event webhook system for external integrations
7. **A/B testing for loyalty** - No experiment framework for loyalty features
8. **Tier benefit auto-application** - No automatic discount application based on tier

---

## 10. Critical Issues

### 1. Mock Data in Production Routes
Many loyalty endpoints in `rez-merchant-service/src/routes/loyalty.ts` return hardcoded mock data:
```typescript
// Example from loyalty.ts
const mockCustomers = [
  { userId: 'user_1', name: 'Rahul Sharma', tier: 'platinum', ... },
  ...
];
```

### 2. Cross-Service Data Ownership
- `LoyaltyTier` is a read-only proxy to `loyaltytiers` collection (owned by rez-backend)
- Customer loyalty data (points, tiers) owned by rez-backend/User model
- Merchant service cannot write loyalty tier changes

### 3. Challenge Service Stubs
`rez-gamification-service/src/services/challengeService.ts` contains placeholder implementations:
```typescript
async listChallenges(...): Promise<{ challenges: Challenge[]; total: number }> {
  return { challenges: [], total: 0 }; // Stub
}
```

### 4. Karma Service Coupling
- Karma profile uses User model reference but karma_profiles collection is separate
- Level system (L1-L4) is distinct from merchant loyalty tiers

---

## 11. Recommendations

### High Priority:
1. **Implement actual points calculation** in order processing pipeline
2. **Connect loyalty dashboard** to real data sources (rez-backend API)
3. **Implement tier downgrade logic** with configurable grace period
4. **Add birthday offer trigger** system using user profile dateOfBirth

### Medium Priority:
1. **Implement challenge service database** layer (currently stubs)
2. **Add happy hour offer** activation based on time rules
3. **Implement referral reward** calculation and attribution
4. **Add webhook system** for loyalty events

### Low Priority:
1. **Add tier benefit auto-application** at checkout
2. **Implement points pooling** for family/group accounts
3. **Add loyalty A/B testing** framework
4. **Create merchant loyalty analytics** dashboard with real data

---

## 12. File Index

### rez-merchant-service
| File | Purpose |
|------|---------|
| `/src/routes/loyalty.ts` | Customer loyalty management, stats, analytics |
| `/src/routes/loyaltyConfig.ts` | Store loyalty configuration (pointsPerRupee, expiry) |
| `/src/routes/loyaltyTiers.ts` | Tier CRUD operations |
| `/src/routes/cashback.ts` | Cashback management with approval workflow |
| `/src/routes/offers.ts` | Offer management (proxied to rez-backend) |
| `/src/routes/coins.ts` | Coin/points transactions |
| `/src/models/LoyaltyTier.ts` | Tier model |
| `/src/models/MerchantLoyaltyConfig.ts` | Loyalty configuration model |
| `/src/models/Cashback.ts` | Cashback transaction model |
| `/src/models/Offer.ts` | Offer read proxy |
| `/src/models/KarmaCampaign.ts` | CSR campaign model |
| `/src/models/PunchCard.ts` | Stamp/punch card model |

### rez-wallet-service
| File | Purpose |
|------|---------|
| `/src/routes/referralRoutes.ts` | Referral management |
| `/src/models/ReferralConversion.ts` | Referral tracking |

### rez-app-consumer
| File | Purpose |
|------|---------|
| `/services/couponApi.ts` | Coupon CRUD and validation |
| `/services/cashbackApi.ts` | Cashback summary, history, redemption |
| `/services/achievementApi.ts` | Achievement/badge system |
| `/services/coinSyncService.ts` | Coin balance synchronization |
| `/stores/gamificationStore.ts` | Gamification state management |
| `/hooks/useCardOfferAutoApply.ts` | Auto-apply coupon logic |

### rez-gamification-service
| File | Purpose |
|------|---------|
| `/src/services/challengeService.ts` | Challenge/competition system |
| `/src/services/leaderboardService.ts` | Leaderboard functionality |

### rez-karma-service
| File | Purpose |
|------|---------|
| `/src/models/KarmaProfile.ts` | User karma profile with badges, streaks |
| `/src/models/KarmaEvent.ts` | Karma event definition |
| `/src/routes/karmaRoutes.ts` | Karma API endpoints |

---

## Summary Score

| Category | Score | Notes |
|----------|-------|-------|
| Points System | 6/10 | Basic infrastructure exists, not fully integrated |
| Loyalty Tiers | 5/10 | Model exists, no downgrade rules |
| Rewards & Offers | 5/10 | Partial implementation, missing birthday/happy hour |
| Coupon System | 7/10 | Well-developed consumer API |
| Cashback | 7/10 | Complete workflow with approval process |
| Customer Experience | 5/10 | Dashboard endpoints exist, need real data |
| Merchant Features | 5/10 | Basic setup exists, analytics are mock |
| Additional Services | 4/10 | Karma/gamification have partial implementations |

**Overall: 5.5/10** - Partial implementation with significant gaps

---

*Report generated by Product Analyst*
