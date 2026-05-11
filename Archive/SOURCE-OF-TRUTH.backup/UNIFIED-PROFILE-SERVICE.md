# UNIFIED PROFILE SERVICE - Three Separate Services

**Last Updated:** 2026-05-04
**Status:** Built & Documented

---

## THREE SEPARATE SERVICES

All 3 services are **separate** and connect via **User ID**.

```
┌─────────────────────────────────────────────────────────────┐
│                          APP                                 │
│        (Makes parallel calls to all 3 services)           │
└───────────────┬─────────────────────┬───────────────────────┘
                │                     │
    ┌───────────┴───────┐ ┌─────────┴────────┐
    │                   │ │                  │
    ▼                   │ ▼                  │
┌──────────────┐        │ ┌──────────────┐  │
│    AUTH      │        │ │   WALLET     │  │
│   SERVICE   │        │ │   SERVICE    │  │
│              │        │ │              │  │
│ • userId    │        │ │ • coins     │  │
│ • phone     │        │ │ • balance   │  │
│ • email     │        │ │ • trans     │  │
│ • JWT       │        │ │              │  │
│              │        │ │ Real-time   │  │
│ URL:         │        │ │ source of   │  │
│ rez-auth-   │        │ │ truth      │  │
│ service      │        │ │              │  │
└──────────────┘        │ └──────────────┘  │
                        │                  │
                        │                  │
                        │                  │
                        │ ┌──────────────┐  │
                        │ │   PROFILE   │  │
                        │ │   SERVICE   │  │
                        │ │              │  │
                        │ │ • name      │  │
                        │ │ • avatar    │  │
                        │ │ • prefs     │  │
                        │ │ • addresses │  │
                        │ │ • tier      │  │
                        │ │   (cached)  │  │
                        │ │              │  │
                        │ │ Static data │  │
                        │ │ owner       │  │
                        │ │              │  │
                        │ │ URL:         │  │
                        │ │ rezprofile  │  │
                        │ │ .onrender   │  │
                        │ └──────────────┘  │
                        │                  │
                        └──────────────────┘
```

---

## Service URLs

| Service | URL | Repo | Owner |
|---------|-----|------|-------|
| **Auth** | `rez-auth-service.onrender.com` | REZ-auth-service | Core Team |
| **Profile** | `rezprofile.onrender.com` | rezprofile | Profile Team |
| **Wallet** | `rez-wallet-service-36vo.onrender.com` | REZ-wallet-service | Core Team |

---

## Data Ownership

### AUTH SERVICE - Identity
| Data | Description |
|------|-------------|
| userId | Unique identifier |
| phone | Phone number |
| email | Email address |
| password | Hashed password |
| JWT | Access token |
| refreshToken | Refresh token |

### PROFILE SERVICE - Static Data
| Data | Description |
|------|-------------|
| firstName | User name |
| lastName | Last name |
| avatar | Profile picture |
| bio | User bio |
| preferences | Language, theme, notifications |
| addresses | Saved addresses |
| paymentMethods | Cards, UPI |
| cachedTier | Subscription tier (short TTL) |
| hiddenKB | AI insights (not visible to user) |

### WALLET SERVICE - Real-time
| Data | Description |
|------|-------------|
| coins | Coin balance |
| balance | Cash balance |
| transactions | Transaction history |
| pendingRewards | Unclaimed rewards |

---

## How They Connect

### Via User ID
```
All 3 services share: userId
```

### Via Parallel Calls
```
App Login ───► Auth ────► Returns userId + JWT
              │
              └──► App makes 3 parallel calls:

              Call 1: GET /auth/me ────► userId, phone
              Call 2: GET /profile/userId ──► name, prefs
              Call 3: GET /wallet/userId ──► coins, balance
```

### Not Chained!
```
❌ WRONG: App → Auth → Profile → Wallet
✅ RIGHT: App → Auth (gets userId)
              │
              ├──► Profile (with userId)
              ├──► Wallet (with userId)
              └──► REE (with userId) - subscription tier
```

---

## API Endpoints

### Auth Service
```
POST /auth/otp/send     → Send OTP
POST /auth/otp/verify   → Verify OTP, get JWT
GET  /auth/me          → Get userId, phone
POST /auth/refresh      → Refresh token
```

### Profile Service
```
GET  /profile/:userId                → Get profile
PATCH /profile/:userId               → Update profile
GET  /profile/:userId/preferences     → Get preferences
PATCH /profile/:userId/preferences    → Update prefs
GET  /profile/:userId/addresses      → Get addresses
POST /profile/:userId/addresses       → Add address
GET  /profile/:userId/tier            → Get cached tier
```

### Wallet Service
```
GET /wallet/:userId            → Get balance, coins
GET /wallet/:userId/transactions → Get history
POST /wallet/:userId/redeem    → Redeem coins
```

---

## User Flow

```
1. User opens app
         │
         ▼
2. App sends phone to Auth Service
         │
         ▼
3. Auth Service sends OTP
         │
         ▼
4. User enters OTP
         │
         ▼
5. Auth verifies OTP ───► Returns JWT with userId
         │
         ▼
6. App now has userId + JWT
         │
         ▼
7. App makes parallel calls:
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
 Auth    Profile    Wallet      REE
 /me    /profile   /wallet   /user-state
    │         │          │          │
    └────┬────┴──────────┴──────────┘
         │
         ▼
8. App receives combined state:
{
  userId: "user_123",
  phone: "+919876543210",
  name: "John",
  prefs: { ... },
  coins: 2500,
  balance: 500,
  subscriptionTier: "gold"
}
```

---

## Apps Connect To All 3

| App | Auth | Profile | Wallet |
|-----|------|---------|--------|
| Do App | ✓ | ✓ | ✓ |
| Support Copilot | ✓ | ✓ | ✓ |
| Consumer App | ✓ | ✓ | ✓ |
| Merchant App | ✓ | ✓ | ✓ |

---

## Key Rules

1. **Separate repos** - Each service has its own repo
2. **Connect via userId** - All share same userId
3. **Parallel calls** - Apps call all 3 in parallel
4. **No chaining** - Profile does NOT call Wallet
5. **Cache tier in Profile** - Short TTL (5 min)
6. **Real-time in Wallet** - Always fresh

---

## Related Docs

- [DO-APP.md](SOURCE-OF-TRUTH/DO-APP.md)
- [REE-SERVICE.md](SOURCE-OF-TRUTH/REE-SERVICE.md)
- [PROFILE-SYSTEM-AUDIT.md](SOURCE-OF-TRUTH/PROFILE-SYSTEM-AUDIT.md)
