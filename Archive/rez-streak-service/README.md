# REZ Streak Service

Streak tracking service for the REZ Loyalty System.

## Features

- Track user visit streaks
- Milestone rewards system
- Streak recovery mechanism
- Daily automatic streak checks
- Redis caching for performance
- BullMQ workers for async processing

## Milestones

| Streak Days | Coins | Label |
|-------------|-------|-------|
| 3           | 10    | Getting Started |
| 7           | 50    | First Week |
| 14          | 100   | Two Weeks Strong |
| 30          | 250   | One Month Champion |
| 60          | 500   | Two Month Warrior |
| 90          | 1000  | Three Month Legend |

## API Endpoints

### GET /api/v1/streak/:userId
Get streak data for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "currentStreak": 7,
    "longestStreak": 14,
    "lastVisitDate": "2026-05-08T00:00:00.000Z",
    "totalVisits": 20,
    "milestones": [...],
    "streakHistory": [...]
  }
}
```

### POST /api/v1/streak/:userId/visit
Record a visit for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "streak": 8,
    "isNewDay": true,
    "milestone": {
      "streak": 7,
      "coins": 50,
      "label": "First Week"
    },
    "message": "Congratulations! You achieved the \"First Week\" milestone and earned 50 coins!"
  }
}
```

### POST /api/v1/streak/:userId/recover
Recover a lost streak (costs coins equal to streak days).

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "streak": 7,
    "coinsDeducted": 7,
    "message": "Streak recovered! You paid 7 coins to restore your 7-day streak."
  }
}
```

### GET /api/v1/streak/:userId/milestones
Get milestone status for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "milestones": [
      { "streak": 3, "coins": 10, "label": "Getting Started", "achieved": true, "achievedAt": "..." },
      { "streak": 7, "coins": 50, "label": "First Week", "achieved": false }
    ],
    "nextMilestone": { "streak": 7, "coins": 50, "label": "First Week", "achieved": false }
  }
}
```

### GET /api/v1/streak/milestones/config
Get milestone configuration (public endpoint).

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build TypeScript
npm run build

# Start server
npm start

# Start worker (separate terminal)
npm run worker
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3003 | Server port |
| MONGODB_URI | mongodb://localhost:27017/rez_streak | MongoDB connection string |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| NOTIFICATION_SERVICE_URL | http://localhost:3004 | Notification service URL |
| COIN_SERVICE_URL | http://localhost:3005 | Coin service URL |
