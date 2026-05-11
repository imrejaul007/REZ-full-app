# ReZ Ecosystem - Staging Deployment

## Quick Start

```bash
cd deploy/staging

# Deploy to staging
./deploy.sh

# Or use docker-compose directly
docker-compose up -d
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| merchant-service | 4005 | Loyalty & Referrals |
| order-service | 4006 | Order management |
| payment-service | 4001 | Payment processing |
| wallet-service | 4004 | Wallet & Points |
| karma-service | 4003 | Karma & Gamification |
| marketing-service | 4002 | Marketing automation |

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## Testing

```bash
# Run all tests
cd ../../
npm test

# Run specific tests
npm test -- loyalty
npm test -- karma
npm test -- marketing
```

## Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f merchant-service
```

## Stopping

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (full reset)
docker-compose down -v
```

## Features Deployed

### Loyalty System
- Points system
- Tier benefits (Bronze/Silver/Gold/Platinum)
- Referral system
- Milestone rewards
- Auto-apply offers
- Points transfer

### Karma System
- Karma dashboard
- Leaderboard
- Badges & achievements
- Streaks
- Challenges
- Social sharing

### Marketing Platform
- WhatsApp integration
- A/B testing
- Win-back flows
- Abandoned cart automation
- Birthday campaigns
- UTM attribution
- Marketing calendar
- Template library
