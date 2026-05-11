# Claude Code Configuration - rez-streak-service

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## Project Overview

**Service Purpose:** User engagement streak tracking service for gamification
**Tech Stack:** Node.js, Express, MongoDB (Mongoose)
**Port:** 4003 (configurable via PORT env)
**Database:** MongoDB (collection: userstreaks)

## Key Models

- **UserStreak**: Tracks user daily visit streaks with milestones
  - Fields: userId, currentStreak, longestStreak, lastVisitDate, streakHistory
  - Unique index on userId

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/streak/:userId | Get streak data for user |
| POST | /api/v1/streak/:userId/visit | Record user visit |
| POST | /api/v1/streak/:userId/recover | Recover lost streak |
| GET | /api/v1/streak/:userId/milestones | Get milestone status |

## Common Patterns

### Record a Visit
```typescript
const result = await streakService.recordVisit(userId);
```

### Get Streak Data
```typescript
const streakData = await streakService.getStreakData(userId);
```

## Milestones

Supported milestones: 7, 14, 30, 60, 90, 180, 365 days

## Build & Test

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## Security Rules

- NEVER hardcode API keys, secrets, or credentials
- NEVER commit .env files
- Validate all user input at system boundaries
- Use `crypto.randomUUID()` for ID generation (not Math.random())

## Validation

- userId: Required, non-empty string
- All endpoints validate input before processing
