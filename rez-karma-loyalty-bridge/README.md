# REZ Karma-Loyalty Bridge Service

Converts Karma actions to Loyalty points for the REZ Ecosystem.

## Features

- Automatic karma-to-loyalty conversion
- Milestone bonus rewards
- Level-up bonuses
- Badge-earned rewards
- Conversion history tracking
- Integration with notification service

## Conversion Rates

| Karma Earned | Loyalty Points |
|--------------|---------------|
| 1 karma | 0.1 points |
| 10 karma | 1 point |
| 100 karma | 10 points |

## Milestone Bonuses

| Total Karma Converted | Bonus Points |
|----------------------|--------------|
| 500 karma | 50 points |
| 1,000 karma | 150 points |
| 2,500 karma | 500 points |
| 5,000 karma | 1,000 points |
| 10,000 karma | 2,500 points |

## Level-Up Bonuses

| Level Up | Bonus Points |
|----------|-------------|
| L1 → L2 | 50 points |
| L2 → L3 | 150 points |
| L3 → L4 | 500 points |

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | Yes |
| PORT | Service port (default: 4029) | No |
| LOYALTY_SERVICE_URL | Loyalty service URL | Yes |
| WALLET_SERVICE_URL | Wallet service URL | Yes |
| NOTIFICATION_SERVICE_URL | Notification service URL | Yes |

## API Endpoints

### GET /api/v1/bridge/stats/:userId
Get conversion statistics for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "totalKarmaConverted": 1500,
    "totalLoyaltyAwarded": 200,
    "conversionCount": 15,
    "milestones": ["500 karma", "1000 karma"],
    "lastConversionAt": "2026-05-08T00:00:00.000Z"
  }
}
```

### GET /api/v1/bridge/conversions/:userId
Get conversion history.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "user123",
      "karmaAmount": 100,
      "loyaltyPointsAwarded": 10,
      "source": "volunteer_hours",
      "milestone": null,
      "convertedAt": "2026-05-08T00:00:00.000Z"
    }
  ]
}
```

### POST /api/v1/bridge/convert
Manually trigger a karma-to-loyalty conversion.

**Request:**
```json
{
  "userId": "user123",
  "karmaAmount": 100,
  "source": "manual"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loyaltyPoints": 10,
    "bonusPoints": 0,
    "milestone": null
  }
}
```

### POST /api/v1/bridge/level-up
Handle karma level-up (internal endpoint).

**Request:**
```json
{
  "userId": "user123",
  "oldLevel": "L1",
  "newLevel": "L2"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bonusPoints": 50
  }
}
```

### POST /api/v1/bridge/badge-earned
Handle badge earned (internal endpoint).

**Request:**
```json
{
  "userId": "user123",
  "badgeId": "volunteer_10h"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "points": 100
  }
}
```

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
```

## Badge Rewards

| Badge ID | Points | Label |
|----------|--------|-------|
| volunteer_10h | 100 | 10 hours volunteer |
| volunteer_50h | 500 | 50 hours volunteer |
| volunteer_100h | 1000 | 100 hours volunteer |
| donor_blood | 200 | Blood donor |
| donor_platelets | 300 | Platelet donor |
| clean_up_champion | 150 | Cleanup champion |

## License

MIT
