# Student Features Architecture

**Date:** 2026-05-02
**Status:** Integrated into rez-backend

---

## Architecture Decision

After analysis, we decided to **keep student features in rez-backend** instead of a separate service.

**Rationale:**
- Student verification already existed in rez-backend
- Student is a "persona", not a separate product
- Reduces service count
- Simpler deployment

---

## Where Student Features Live

```
┌─────────────────────────────────────────────────────────────┐
│ rez-backend │
├─────────────────────────────────────────────────────────────┤
│ │
│ VERIFICATION (EXISTING): │
│ ├── routes/zoneVerificationRoutes.ts │
│ │   └── POST /api/zones/student/verify │
│ │   └── GET /api/zones/institutions │
│ │   └── GET /api/zones/:slug/status │
│ │
│ NEW STUDENT FEATURES: │
│ ├── routes/studentRoutes.ts │
│ │   └── GET /api/student/profile │
│ │   └── GET /api/student/missions │
│ │   └── POST /api/student/missions/:id/claim │
│ │   └── GET /api/student/leaderboard/:institution │
│ │   └── GET /api/student/offers/:institution │
│ │   └── POST /api/student/redeem │
│ │   └── POST /api/student/price │
│ │
│ ├── models/StudentProfile.ts │
│ │   └── STUDENT_TIERS (Freshman → Scholar) │
│ │   └── STUDENT_MISSIONS │
│ │
│ LEADERBOARD (EXISTING): │
│ ├── routes/leaderboardRoutes.ts │
│ │   └── GET /api/leaderboard/campus │
│ │
└─────────────────────────────────────────────────────────────┘
```

---

## Student Features

### 1. Verification (Existing)
- Email domain auto-verify (iitd.ac.in)
- Document upload support
- Admin review queue
- Status tracking

### 2. Tier System (New)
| Tier | Min Coins | Multiplier | Badge |
|------|-----------|------------|-------|
| Freshman | 0 | 1.5x | FRESHMEN |
| Sophomore | 500 | 1.75x | SOPHOMORE |
| Junior | 1500 | 2.0x | JUNIOR |
| Senior | 3000 | 2.5x | SENIOR |
| Scholar | 5000 | 3.0x | SCHOLAR |

### 3. Missions (New)
| Mission | Coins | Target |
|---------|-------|--------|
| First Bite | 100 | 1 order |
| Study Group Builder | 500 | 5 referrals |
| Campus Explorer | 200 | 3 merchants |
| Early Bird | 50 | 10 early orders |

### 4. Pricing (New)
- Base 5% discount for all students
- Additional discount based on tier
- Calculated via `POST /api/student/price`

### 5. Leaderboard (Existing)
- Campus-specific rankings
- Weekly/monthly/all-time views
- Real-time updates

---

## API Endpoints

### Profile & Stats
```
GET /api/student/profile
Response: {
  isStudent: true,
  tier: { name: 'junior', badge: 'JUNIOR', multiplier: 2.0 },
  coins: { lifetime: 1500, current: 800 },
  nextTier: { tier: 'senior', coinsNeeded: 1500 }
}
```

### Missions
```
GET /api/student/missions
Response: {
  missions: [
    { id: 'first_student_order', title: 'First Bite', coins: 100, progress: 0 }
  ]
}
```

### Leaderboard
```
GET /api/student/leaderboard/IIT%20Delhi?period=weekly
Response: {
  leaderboard: [
    { rank: 1, name: 'Rahul S.', coins: 2500, tier: 'JUNIOR' }
  ],
  institutionName: 'IIT Delhi',
  userRank: 42
}
```

### Pricing
```
POST /api/student/price
Body: { productId: 'prod123', basePrice: 299 }
Response: {
  originalPrice: 299,
  studentPrice: 269,
  discount: 30,
  discountPercent: 10,
  tier: 'junior',
  multiplier: 2.0
}
```

---

## Integration Points

### Frontend (rez-app-consumer)
The consumer app already has the UI and calls these endpoints:

| Screen | Endpoint Called | Status |
|--------|---------------|--------|
| StudentVerify | `POST /zones/student/verify` | Works |
| StudentOffers | `GET /zones/institutions` | Works |
| Profile | `GET /student/profile` | Now works |
| Missions | `GET /student/missions` | Now works |
| Leaderboard | `GET /student/leaderboard/:institution` | Now works |
| Pricing | `POST /student/price` | Now works |

---

## What Was Changed

### Deleted
- `rez-student-service` (separate repo) - Merged into rez-backend

### Added to rez-backend
- `src/routes/studentRoutes.ts` - New student endpoints
- `src/models/StudentProfile.ts` - Tier and mission configs
- `src/config/routes.ts` - Route registration

---

## Deployment

No new services to deploy!

Just redeploy rez-backend to pick up the new endpoints:

```
1. git pull (or auto-deploy from main)
2. New endpoints available immediately
```

---

## Next Steps

1. **Redeploy rez-backend** to pick up new routes
2. **Test endpoints** with Postman/curl
3. **Verify consumer app** connects properly

### Test Commands
```bash
# Test student profile
curl http://localhost:5001/api/student/profile \
  -H "Authorization: Bearer <token>"

# Test student price
curl -X POST http://localhost:5001/api/student/price \
  -H "Authorization: Bearer <token>" \
  -d '{"productId":"123","basePrice":299}'
```

---

**Status:** ✅ Complete - Student features integrated into rez-backend
