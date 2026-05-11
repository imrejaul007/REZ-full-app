# CLAUDE.md

Karma-Loyalty Bridge Service - converts Karma actions to Loyalty points.

---

## Project Overview

**Version**: 1.0.0 | **Last Updated**: May 2026

### Purpose
Converts Karma points to Loyalty points for the ReZ Ecosystem with milestone bonuses and level-up rewards.

---

## Build & Test Commands

```bash
npm install        # Install dependencies
npm run dev       # Development server
npm run build     # Production build
npm start         # Start production server
```

---

## Conversion Rates

| Karma Earned | Loyalty Points |
|-------------|---------------|
| 1 karma | 0.1 points |
| 10 karma | 1 point |
| 100 karma | 10 points |

---

## Milestone Bonuses

| Total Karma Converted | Bonus Points |
|----------------------|--------------|
| 500 karma | 50 points |
| 1,000 karma | 150 points |
| 2,500 karma | 500 points |
| 5,000 karma | 1,000 points |
| 10,000 karma | 2,500 points |

---

## Level-Up Bonuses

| Level Up | Bonus Points |
|----------|-------------|
| L1 → L2 | 50 points |
| L2 → L3 | 150 points |
| L3 → L4 | 500 points |

---

## API Endpoints

### GET /api/v1/bridge/stats/:userId
Get conversion statistics for a user.

### GET /api/v1/bridge/conversions/:userId
Get conversion history.

**Query Parameters:**
- `limit` (optional): Number of records (default: 50)

### POST /api/v1/bridge/convert
Manually trigger karma-to-loyalty conversion.

**Request:**
```json
{
  "userId": "user123",
  "karmaAmount": 100,
  "source": "manual"
}
```

### POST /api/v1/bridge/level-up
Handle karma level-up (internal).

**Request:**
```json
{
  "userId": "user123",
  "oldLevel": "L1",
  "newLevel": "L2"
}
```

### POST /api/v1/bridge/badge-earned
Handle badge earned (internal).

**Request:**
```json
{
  "userId": "user123",
  "badgeId": "volunteer_10h"
}
```

---

## Badge Rewards

| Badge ID | Points | Label |
|----------|--------|-------|
| volunteer_10h | 100 | 10 hours volunteer |
| volunteer_50h | 500 | 50 hours volunteer |
| volunteer_100h | 1000 | 100 hours volunteer |
| donor_blood | 200 | Blood donor |
| donor_platelets | 300 | Platelet donor |
| clean_up_champion | 150 | Cleanup champion |

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| MONGODB_URI | MongoDB connection string | Yes |
| PORT | Service port (default: 4029) | No |
| LOYALTY_SERVICE_URL | Loyalty service URL | Yes |
| WALLET_SERVICE_URL | Wallet service URL | Yes |
| NOTIFICATION_SERVICE_URL | Notification service URL | Yes |

---

## Related Services

| Service | Purpose |
|---------|---------|
| rez-karma-service | Source of karma |
| rez-loyalty-service | Target loyalty points |
| rez-wallet-service | Wallet updates |
| rez-notification-service | Notifications |

---

## Security Rules

- NEVER commit `.env` files
- Validate user IDs from request
- Use idempotency keys to prevent double conversion
- Log all conversion events
- Verify source service via internal token
