# Profile System Audit

**Last Updated:** 2026-05-04
**Purpose:** Document all profile systems across ReZ ecosystem

---

## Current Profile Systems

### 1. rez-app-consumer (Main Consumer App)

**Tech Stack:** React Native + expo-router
**Repo:** `imrejaul007/rez-app-consumer`

#### Profile Structure

```typescript
interface UserProfile {
  id: string;
  _id?: string;
  phoneNumber: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    location?: {
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      coordinates?: [number, number];
    };
  };
  preferences?: {
    language?: string;
    currency?: string;
    theme?: 'light' | 'dark';
    notifications?: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
    };
  };
  statedIdentity?: string;
  featureLevel?: number;
  segment?: string;
  verificationSegment?: string;
  verifications?: Record<string, unknown>;
  activeZones?: string[];
  role: 'user' | 'admin' | 'merchant';
  isVerified: boolean;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Profile Screens
| Screen | File | Purpose |
|--------|------|---------|
| Main Profile | `app/profile/index.tsx` | Icon grid, menu, stats |
| Edit Profile | `app/profile/edit.tsx` | Photo upload, form |
| Account Settings | `app/account/profile.tsx` | Notifications, privacy |
| Profile Visibility | `app/account/profile-visibility.tsx` | Visibility settings |

#### API Endpoints
```
GET  /user/profile           - Get profile
PATCH /user/auth/profile     - Update profile
GET  /user/profile/completion - Completion status
POST /user/profile/picture   - Upload photo
DELETE /user/profile/picture - Delete photo
POST /user/profile/verify   - Verify with documents
GET  /api/profile/summary    - Profile with LTV
GET  /api/profile/tier       - Tier info
```

---

### 2. Do App (AI Commerce OS)

**Tech Stack:** React Native + expo-router + Zustand
**Repo:** `imrejaul007/do`

#### Profile Structure

```typescript
interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
}

interface KarmaState {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  pointsToNextTier: number;
  multiplier: number;
}

interface WalletState {
  coins: number;
  vouchers: number;
}
```

#### Profile Screens
| Screen | Status |
|--------|--------|
| Profile tab | Built |
| Edit preferences | Basic |
| Karma display | Built |
| Wallet display | Built |

#### API Endpoints
```
GET  /profile              - Get profile (from Auth)
GET  /karma               - Get karma status
GET  /wallet              - Get wallet
GET  /wallet/transactions  - Transaction history
```

---

### 3. Student Service

**Repo:** `rez-student-service`

#### Profile Structure

```typescript
interface StudentProfile {
  id: string;
  institution: {
    id: string;
    name: string;
    shortName: string;
  };
  tier: {
    name: string;
    badge: string;
    color: string;
    multiplier: number;
  };
  lifetimeCoins: number;
  currentCoins: number;
  totalOrders: number;
  totalSavings: number;
  referralCode: string;
  referralsCount: number;
  campusRank?: number;
  institutionRank?: number;
  nextTier?: {
    tier: string;
    coinsNeeded: number;
  };
}
```

---

## Profile Data Comparison

| Field | Consumer App | Do App | Student Service |
|-------|-------------|--------|-----------------|
| id | ✓ | ✓ | ✓ |
| phone | phoneNumber | phone | - |
| email | ✓ | ✓ | - |
| firstName/lastName | ✓ (nested) | name (flat) | - |
| avatar | ✓ | ✓ | - |
| bio | ✓ | - | - |
| dateOfBirth | ✓ | - | - |
| gender | ✓ | - | - |
| location | ✓ | - | - |
| preferences | ✓ | - | - |
| notifications | ✓ | - | - |
| language | ✓ | - | - |
| theme | ✓ | - | - |
| role | ✓ | - | - |
| isVerified | ✓ | - | - |
| isOnboarded | ✓ | - | - |
| createdAt | ✓ | - | - |
| karma/tier | - | ✓ | ✓ |
| coins | - | ✓ | ✓ |
| vouchers | - | ✓ | - |
| institution | - | - | ✓ |
| referralCode | - | - | ✓ |
| rank | - | - | ✓ |

---

## Issues Found

### 1. Inconsistent Data Structure
- Consumer app uses `phoneNumber`, Do uses `phone`
- Consumer app uses `firstName/lastName` (nested), Do uses `name` (flat)

### 2. Duplicate Fields
- karma/tier exists in both Do and Student Service
- coins exists in both Do and Student Service

### 3. No Unified Profile
- Each app has its own profile structure
- No single source of truth

---

## Recommendation

### Create Unified Profile Service

```typescript
interface UnifiedProfile {
  // Auth (required)
  id: string;
  phone: string;
  email?: string;

  // Profile (editable)
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
  };

  // Preferences (editable)
  preferences: {
    language: string;
    currency: string;
    theme: 'light' | 'dark';
    notifications: {
      push: boolean;
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
    };
  };

  // Address (editable)
  addresses: Address[];

  // Wallet (from Wallet Service)
  wallet: {
    coins: number;
    balance: number;
    karmaTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    karmaPoints: number;
    vouchers: number;
  };

  // Activity (auto-generated)
  activity: {
    totalSpent: number;
    totalBookings: number;
    lastActive: Date;
    favoriteCategories: string[];
  };

  // Metadata
  role: 'user' | 'admin' | 'merchant';
  isVerified: boolean;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Action Items

| Item | Priority | Status |
|------|----------|--------|
| Standardize field names | High | To Do |
| Create Unified Profile Service | High | To Do |
| Migrate Consumer App to unified | Medium | To Do |
| Migrate Do App to unified | Medium | To Do |
| Remove duplicate karma/coins | Medium | To Do |

---

## Related Docs

- [UNIFIED-PROFILE-SERVICE.md](SOURCE-OF-TRUTH/UNIFIED-PROFILE-SERVICE.md) - Unified service spec
- [DO-APP.md](SOURCE-OF-TRUTH/DO-APP.md) - Do app docs
