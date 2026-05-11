# RENDEZ PRODUCTION SCHEMA

## What We Have (Complete)
- [x] User model (profile, karma, OTP auth)
- [x] Plan model (book/match-first, location, slots, status)
- [x] PlanParticipant model (apply/approve/reject)
- [x] Booking model (REZ integration)
- [x] Meetup model (QR validation)
- [x] CheckIn model (location verification)
- [x] KarmaLog model (audit trail)

## Schema Structure

```prisma
User (id, phone, name, bio, photos, gender, karmaScore, karmaTier, reliability, totalMeetups, noShows)
    ↓
Plan (title, category, dateTime, venue, totalSlots, filledSlots, isBooked, bookingId, status)
    ↓
PlanParticipant (status: APPLIED→APPROVED→CONFIRMED→COMPLETED)
    ↓
Meetup (qrCode, expiresAt, status)
    ↓
CheckIn (userId, lat, lng, checkedInAt)
    ↓
KarmaLog (userId, event, delta, reason, referenceId)
```

## Status Flows

```
Plan: OPEN → MATCHED → LOCKED → COMPLETED
              ↓
           CANCELLED

Participant: APPLIED → APPROVED → CONFIRMED → COMPLETED
                   ↓
              REJECTED / CANCELLED / NO_SHOW

Meetup: SCHEDULED → ACTIVE → VERIFIED
                   ↓
              CANCELLED

CheckIn: userId + lat + lng + checkedInAt (unique per meetup)
```

## What to Build Next

- [ ] User registration/login flow
- [ ] Plan CRUD API
- [ ] Participant management API
- [ ] Meetup creation on approval
- [ ] Check-in verification
- [ ] Karma recalculation triggers
- [ ] Push notifications
- [ ] Frontend screens