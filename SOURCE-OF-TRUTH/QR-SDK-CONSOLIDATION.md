# QR SDK Consolidation Decision
**Date:** May 4, 2026
**Status:** RECOMMENDED

---

## Current State

There are two overlapping QR SDK packages:

### 1. @rez/merchant-sdk
**Location:** `packages/rez-merchant-sdk/`
**Purpose:** Merchant QR integration
**Modules:**
- MerchantSDK
- StoreClient
- MenuClient
- HotelClient
- CampaignClient
- AnalyticsClient

### 2. @rez/qr-sdk
**Location:** `packages/rez-qr-sdk/`
**Purpose:** Unified QR systems
**Modules:**
- QRSDK
- RoomModule
- MenuModule
- StoreModule
- CampaignModule
- AIModule
- AuthModule
- WalletModule

---

## Analysis

### Feature Comparison

| Feature | merchant-sdk | qr-sdk |
|---------|-------------|--------|
| Room QR | ✅ HotelClient | ✅ RoomModule |
| Menu QR | ✅ MenuClient | ✅ MenuModule |
| Store QR | ✅ StoreClient | ✅ StoreModule |
| Ads QR | ✅ CampaignClient | ✅ CampaignModule |
| Creator QR | ❌ Missing | ❌ Missing |
| AI Integration | ❌ Missing | ✅ AIModule |
| Auth Integration | ❌ Missing | ✅ AuthModule |
| Wallet Integration | ❌ Missing | ✅ WalletModule |
| Analytics | ✅ AnalyticsClient | ❌ Missing |

### Consumer App Usage

From `rez-app-consumer/src/services/`:

**Found usages of:**
- unifiedApi.ts
- rezMind.ts
- No direct import of merchant-sdk or qr-sdk found yet

---

## Recommendation

### Option A: Deprecate @rez/merchant-sdk (Recommended)

**Pros:**
- Single source of truth
- @rez/qr-sdk is more complete
- AI and Auth modules are valuable
- Easier to maintain

**Cons:**
- Breaking change for existing consumers
- Need to migrate existing code

### Option B: Merge Into @rez/qr-sdk

**Pros:**
- Preserve merchant-sdk API
- Add missing modules to qr-sdk

**Cons:**
- Still two packages
- Confusing for developers

### Option C: Keep Both

**Pros:**
- No breaking changes

**Cons:**
- Maintenance burden
- Confusion about which to use
- Feature divergence over time

---

## Recommended Action

**Phase 1:** Mark @rez/merchant-sdk as deprecated
```json
{
  "name": "@rez/merchant-sdk",
  "deprecated": "Use @rez/qr-sdk instead. Will be removed in v3.0.0",
  "version": "1.0.0"
}
```

**Phase 2:** Add missing features to @rez/qr-sdk
- Add AnalyticsClient to qr-sdk
- Document Creator QR integration

**Phase 3:** Migration guide for existing consumers

**Phase 4:** Remove @rez/merchant-sdk in v3.0.0

---

## Creator QR Integration

### New Feature: Creator QR System

**URL Pattern:** `creator.rez.money/{creatorId}`

**Features to implement:**
- Creator profile page
- Social links
- Creator picks (products/services)
- Follow/unfollow
- Attribution tracking

**Module to add to @rez/qr-sdk:**
```typescript
CreatorModule: {
  getProfile(creatorId: string): Promise<CreatorProfile>
  getPicks(creatorId: string): Promise<CreatorPick[]>
  follow(creatorId: string): Promise<void>
  unfollow(creatorId: string): Promise<void>
  trackScan(creatorId: string): Promise<void>
}
```

---

## Implementation Timeline

| Phase | Task | Priority |
|-------|------|----------|
| 1 | Deprecate merchant-sdk | HIGH |
| 2 | Add AnalyticsClient to qr-sdk | HIGH |
| 3 | Document Creator QR requirements | MEDIUM |
| 4 | Add CreatorModule to qr-sdk | MEDIUM |
| 5 | Create migration guide | MEDIUM |
| 6 | Remove merchant-sdk v3.0.0 | LOW |

---

*Generated: May 4, 2026*
