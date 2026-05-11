# RENDEZ INTEGRATION - SERVICES
**Date:** May 7, 2026
**Service:** Rendez - Intent-based social matching
**Status:** Connected to ReZ Core Services

---

## INTEGRATION ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDEZ APP                         │
│                   (Node.js + Prisma + PostgreSQL)             │
└─────────────────────┬─────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              REZ CORE SERVICES                          │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌────────────────┐  │
│  │  Auth  │  │  Wallet  │  │ Notifications │  │
│  │  4002  │  │   4004   │  │     3005     │  │
│  └─────────┘  └─────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 1. REZ AUTH SERVICE (Port 4002)

### Base URL
```
Production: https://auth.rez.money
Local: http://localhost:4002
```

### Endpoints Used

| Endpoint | Method | Purpose | Status |
|----------|---------|---------|---------|
| `/auth/verify-jwt` | POST | Verify JWT | ✅ |
| `/auth/profile` | GET | Get user profile | ✅ |
| User profile sync | POST | Sync profile | ✅ |

### Integration Code
```typescript
// rendez-backend/src/middleware/auth.ts
import fetch from 'node-fetch';

const REZ_AUTH_URL = process.env.REZ_AUTH_URL || 'http://localhost:4002';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  const response = await fetch(`${REZ_AUTH_URL}/auth/verify-jwt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  if (!response.ok) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user = await response.json();
  req.user = user;
  next();
}
```

---

## 2. REZ WALLET SERVICE (Port 4004)

### Base URL
```
Production: https://wallet.rez.money
Local: http://localhost:4004
```

### Endpoints Used

| Endpoint | Method | Purpose | Status |
|----------|---------|---------|---------|
| `/wallet/balance/:userId` | GET | Get karma coins | ✅ |
| `/wallet/transactions` | GET | Transaction history | ✅ |
| `/wallet/deduct` | POST | Deduct coins (no-show penalty) | ✅ |
| `/wallet/add` | POST | Add coins (check-in reward) | ✅ |
| `/wallet/hold` | POST | Hold coins | Pending |
| `/wallet/release` | POST | Release held coins | Pending |

### Karma Coin Operations

```typescript
// Reward user for check-in
async function rewardCheckIn(userId: string, planId: string) {
  await fetch(`${WALLET_URL}/add`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      amount: 10, // 10 coins per check-in
      source: 'RENDEZ_MEETUP_CHECKIN',
      referenceId: planId
    })
  });
}

// Penalize no-show
async function penalizeNoShow(userId: string, planId: string) {
  await fetch(`${WALLET_URL}/deduct`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      amount: 15, // 15 coin penalty
      source: 'RENDEZ_NOSHOW_PENALTY',
      referenceId: planId
    })
  });
}
```

---

## 3. REZ NOTIFICATIONS SERVICE (Port 3005)

### Base URL
```
Production: https://notify.rez.money
Local: http://localhost:3005
```

### Notification Types

| Type | Template | Status |
|------|----------|--------|
| PLAN_APPROVED | Creator approved your application | ✅ |
| PLAN_REJECTED | Creator rejected your application | ✅ |
| NEW_APPLICATION | New user applied to your plan | ✅ |
| MEETUP_REMINDER | Meetup in 1 hour | ✅ |
| CHECKIN_SUCCESS | Check-in confirmed | ✅ |

### Integration Code
```typescript
interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data: { planId: string; type: string; }
}

async function sendNotification(userId: string, title: string, body: string, data: object) {
  await fetch(`${NOTIFY_URL}/send`, {
    method: 'POST',
    body: JSON.stringify({ userId, title, body, data })
  });
}
```

---

## 4. REZ USER SERVICE

### Profile Sync
```typescript
interface UserProfile {
  id: string;
  phone: string;
  name: string;
  avatar?: string;
  karmaScore: number;
  reliability: number;
  interests: string[];
}

// Sync profile on first login
async function syncUser(profile: UserProfile) {
  await prisma.user.upsert({
    where: { rezUserId: profile.id },
    create: { rezUserId: profile.id, phone: profile.phone, name: profile.name },
    update: { name: profile.name, avatar: profile.avatar }
  });
}
```

---

## 5. ENVIRONMENT VARIABLES

```env
# ReZ Service URLs
REZ_AUTH_URL=https://auth.rez.money
REZ_WALLET_URL=https://wallet.rez.money
REZ_NOTIFY_URL=https://notify.rez.money
REZ_API_KEY=your-api-key

# Service URLs (local development)
REZ_AUTH_URL=http://localhost:4002
REZ_WALLET_URL=http://localhost:4004
REZ_NOTIFY_URL=http://localhost:3005
```

---

## 6. ERROR HANDLING

```typescript
interface ServiceError {
  code: string;
  message: string;
  retryable: boolean;
}

// Retry logic for service calls
async function withRetry(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000 * Math.pow(2, i);
    }
  }
}
```

---

## 7. SERVICE HEALTH CHECKS

```bash
# Check all services
curl http://localhost:4002/health
curl http://localhost:4004/health
curl http://localhost:3005/health
```

| Service | Expected Response |
|---------|------------------|
| Auth | `{ "status": "ok" }` |
| Wallet | `{ "status": "ok" }` |
| Notifications | `{ "status": "ok" }` |

---

## 8. DEPLOYMENT STATUS

| Service | URL | Status |
|---------|-----|--------|
| Rendez Backend | localhost:3000 | Running |
| ReZ Auth | localhost:4002 | Connected |
| ReZ Wallet | localhost:4004 | Connected |
| ReZ Notifications | localhost:3005 | Connected |
| PostgreSQL | localhost:5432 | Connected |

---

## 9. MIGRATION NOTES

### Add ReZ User ID to Rendez User
```typescript
// In rendez-backend/prisma/schema.prisma
model User {
  id        String @id @default(uuid())
  rezUserId String @unique // ReZ user ID
  // ...existing fields
}
```

---

## 10. TESTING

```bash
# Test ReZ integration
curl -X POST http://localhost:4002/auth/verify-jwt \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token"}'
```

---

**Integration Complete ✅
