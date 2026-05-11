# RENDEZ - REMAINING TASKS
**Date:** May 7, 2026
**CEO:** Claude Code

---

## WHAT'S LEFT TO BUILD

### Backend APIs
| Task | Priority | Status |
|------|----------|--------|
| User Registration/Login API | P0 | ❌ Not done |
| Plan CRUD API | P0 | ❌ |
| Participant management | P0 | ❌ |
| Meetup & Check-in API | P0 | ❌ |
| Karma recalculation triggers | P0 | ❌ |
| Push notifications | P1 | ❌ |
| Search & filters | P1 | ❌ |
| Analytics endpoints | P2 | ❌ |

### Mobile App
| Task | Priority | Status |
|------|----------|--------|
| All screens (25+ screens) | P0 | ❌ |
| Navigation flow | P0 | ❌ |
| State management | P0 | ❌ |
| Push notifications | P1 | ❌ |
| Location services | P1 | ❌ |
| Camera/Gallery access | P1 | ❌ |
| Deep links | P2 | ❌ |
| Analytics | P2 | ❌ |

### Testing & DevOps
| Task | Priority | Status |
|------|----------|--------|
| Unit tests | P1 | ❌ |
| Integration tests | P1 | ❌ |
| E2E tests | P2 | ❌ |
| CI/CD pipeline | P0 | ❌ |
| Monitoring setup | P1 | ❌ |

### Business
| Task | Priority | Status |
|------|----------|--------|
| Launch checklist | P0 | ❌ |
| Content moderation | P1 | ❌ |
| Support system | P2 | ❌ |
| Analytics dashboard | P1 | ❌ |

---

## IMMEDIATE TASKS (This Week)

### 1. Backend APIs (3-5 days)

```bash
# Priority order:
1. User registration + OTP
2. Plan CRUD
3. Participant flow
4. Meetup creation
5. Check-in verification
6. Karma recalculation
```

### 2. Mobile Screens (5-7 days)

```bash
# Build in order:
1. Auth flow (login, verify, register)
2. Home + Browse plans
3. Create plan
4. Plan detail
5. Chat/messaging
6. Profile + karma display
7. Notifications
```

### 3. Infrastructure (1-2 days)

```bash
# Setup:
1. Database migrations
2. Redis setup
3. SMS provider (OTP)
4. Push notification service
5. CI/CD pipeline
```

---

## REMAINING SCREENS (Mobile App)

| Screen | Purpose | Priority |
|--------|---------|----------|
| Splash | App launch | P0 |
| Login | Phone + OTP | P0 |
| Verify OTP | OTP verification | P0 |
| Home Feed | Browse plans | P0 |
| Create Plan | New plan form | P0 |
| Plan Detail | View + apply | P0 |
| My Plans | User's plans | P1 |
| Chat | Messaging | P1 |
| Profile | User settings | P1 |
| Onboarding | First-time flow | P2 |
| Notifications | Activity feed | P2 |
| Search | Find plans | P2 |
| Settings | Preferences | P2 |
| Help/Support | FAQ | P3 |
| Leaderboard | Top karma users | P3 |

---

## API ENDPOINTS TO BUILD

### Auth
```bash
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/refresh-token
```

### Plans
```bash
GET /plans (browse)
POST /plans (create)
GET /plans/:id
PATCH /plans/:id (update)
DELETE /plans/:id (cancel)
POST /plans/:id/apply
GET /plans/:id/applicants
POST /plans/:id/applicants/:userId (approve/reject)
```

### Meetup
```bash
POST /meetups (create after approval)
POST /meetups/:id/checkin
GET /meetups/:id/participants
```

### Karma
```bash
GET /users/:id/karma
POST /users/:id/karma/recalculate
GET /users/leaderboard
```

---

## LAUNCH CHECKLIST

- [ ] Backend deployed to Render
- [ ] Database migrated
- [ ] Redis connected
- [ ] SMS provider (OTP) integrated
- [ ] Push notifications working
- [ ] All screens built
- [ ] App tested on iOS
- [ ] App tested on Android
- [ ] App Store submission ready
- [ ] Play Store submission ready
