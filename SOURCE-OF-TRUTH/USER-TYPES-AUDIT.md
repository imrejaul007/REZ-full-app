# USER TYPES AUDIT - AUTH & PROFILE SERVICES
**Date:** May 10, 2026

---

## CURRENT STATE

### Auth Service (User Model)
```typescript
interface IUser {
  phoneNumber: string;
  email?: string;
  name?: string;
  role: string;  // MISSING userType
  isActive: boolean;
  isSuspended: boolean;
}
```

### Profile Service (UnifiedProfile Model)
```typescript
interface IUnifiedProfile {
  userId: string;
  loyalty: { tier: 'bronze'|'silver'|'gold'|'platinum'|'vip' };
  karma: { score: number; level: 'L1'|'L2'|'L3'|'L4' };
  reZScore: { tier: string };
}
```

---

## 12 USER TYPES TO ADD

| Type | Discount | Verification | Vertical |
|------|----------|--------------|----------|
| student | 10-20% | Student ID | Education |
| corporate | B2B pricing | Company email | CorpPerks |
| doctor | Medical rate | Medical license | Healthcare |
| army | 15-25% | ID proof | Defense |
| police | 15-25% | Badge | Government |
| teacher | Education rate | School ID | Education |
| nurse | Healthcare rate | Hospital ID | Healthcare |
| driver | Delivery rate | License | Logistics |
| merchant | POS access | Business license | Commerce |
| vendor | Wholesale rate | GST/VAT | B2B |
| host | Events/Stays | Address proof | Events |
| guest | Browse only | None | General |
| traveller | Travel rate | Email/Phone | Hotels |

---

## UPDATES NEEDED

### Auth Service
- [ ] Add userType field to User model
- [ ] Add verificationLevel field
- [ ] Add discountTier field
- [ ] Add vertical field
- [ ] Add verificationDocuments field
- [ ] Add verificationStatus field
- [ ] Update registration flow
- [ ] Add verification endpoints
- [ ] Add role-based access control

### Profile Service
- [ ] Add userType to profile
- [ ] Add vertical-specific fields
- [ ] Add verification badges
- [ ] Add discount tiers
- [ ] Add segment fields
- [ ] Update aggregation pipelines
- [ ] Add type-specific scoring
- [ ] Add segment dashboards

---

## IMPLEMENTATION

### User Types Enum
```typescript
enum UserType {
  STUDENT = 'student',
  CORPORATE = 'corporate',
  DOCTOR = 'doctor',
  ARMY = 'army',
  POLICE = 'police',
  TEACHER = 'teacher',
  NURSE = 'nurse',
  DRIVER = 'driver',
  MERCHANT = 'merchant',
  VENDOR = 'vendor',
  HOST = 'host',
  GUEST = 'guest',
  TRAVELLER = 'traveller',
  DEFAULT = 'user'
}

enum VerificationLevel {
  UNVERIFIED = 0,
  PHONE = 1,
  EMAIL = 2,
  IDENTITY = 3,
  CORPORATE = 4,
  PREMIUM = 5
}

enum DiscountTier {
  NONE = 0,
  BASIC = 10,    // 10%
  STANDARD = 15, // 15%
  PREMIUM = 20, // 20%
  ELITE = 25     // 25%
}
```

---

## PRICING BY USER TYPE

| User Type | Default Discount | Verification | Access |
|-----------|----------------|--------------|---------|
| guest | 0% | None | Browse only |
| user | 0% | Phone | Full access |
| student | 10-20% | Student ID | Student rates |
| corporate | B2B | Company email | Corp pricing |
| doctor | Medical | License | Medical rates |
| army/police | 15-25% | ID badge | Defense rates |
| teacher | 10-15% | School ID | Education rates |
| nurse | 10-15% | Hospital ID | Healthcare rates |
| driver | Delivery rate | License | Partner access |
| merchant | POS access | Business | Merchant features |
| vendor | Wholesale | GST/VAT | B2B pricing |
| host | Events access | Address | Event management |
| traveller | Travel rate | Email/Phone | Booking access |

---

## STATUS

| Service | Current | Updates Needed |
|---------|----------|----------------|
| Auth Service | Basic user model | Add 5+ fields |
| Profile Service | Unified profile | Add vertical fields |

---

## NEXT STEPS

1. Update User model in Auth Service
2. Update UnifiedProfile in Profile Service
3. Add verification endpoints
4. Add role-based access
5. Update registration flow
6. Test all user types

---

**Audit Complete**
