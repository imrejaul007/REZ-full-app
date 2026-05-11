# REZ Finance Service

Financial services microservice handling loans, credit scoring, BNPL, and partner integrations.

## Purpose

The Finance Service manages:
- Loan application processing
- Credit score integration (FinBox, Experian)
- BNPL limit calculations
- Financial analytics
- Coin rewards for financial activities
- Partner aggregator integration

## Environment Variables

```env
# Server
PORT=4005
NODE_ENV=development
SERVICE_NAME=rez-finance-service

# Database
MONGODB_URI=mongodb://localhost:27017/rez-finance

# Cache / Queue
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your_jwt_secret_here
INTERNAL_SERVICE_TOKEN=your_internal_token_here

# CORS
CORS_ORIGIN=https://rez.money,https://app.rez.money

# REZ Service URLs (for reward hooks and contextual triggers)
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
GAMIFICATION_SERVICE_URL=https://rez-gamification-service-3b5d.onrender.com
ORDER_SERVICE_URL=https://rez-order-service.onrender.com
INTENT_CAPTURE_URL=https://rez-intent-graph.onrender.com

# Partner Aggregator (Phase 1 — FinBox)
FINBOX_API_KEY=
FINBOX_API_SECRET=
FINBOX_BASE_URL=https://api.finbox.in

# Credit Bureau (Phase 2)
EXPERIAN_CLIENT_ID=
EXPERIAN_CLIENT_SECRET=
EXPERIAN_BASE_URL=

# Sentry
SENTRY_DSN=

# Coins reward rates
COINS_PER_LOAN_DISBURSAL_PERCENT=0.5
COINS_CREDIT_CARD_APPROVAL=500
COINS_CREDIT_SCORE_CHECK=10
COINS_FIRST_EMI_BONUS=200
```

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Production build
npm run build

# Start production server
npm start
```

## API Endpoints

### Loan Operations

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/loans/apply | Apply for loan |
| GET | /api/loans/:loanId | Get loan details |
| GET | /api/loans/user/:userId | Get user's loans |
| POST | /api/loans/:loanId/approve | Approve loan |
| POST | /api/loans/:loanId/reject | Reject loan |
| GET | /api/loans/:loanId/emi | Get EMI schedule |

### Credit Score

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/credit-score/check | Check credit score |
| GET | /api/credit-score/:userId | Get credit score history |
| POST | /api/credit-score/report | Get detailed report |

### BNPL Management

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/bnpl/:userId/limit | Get BNPL limit |
| POST | /api/bnpl/:userId/calculate | Calculate new limit |
| POST | /api/bnpl/:userId/update | Update BNPL limit |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/analytics/portfolio | Portfolio overview |
| GET | /api/analytics/defaults | Default rates |
| GET | /api/analytics/recovery | Recovery metrics |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |

## Coin Rewards

| Activity | Coins |
|-----------|-------|
| Loan disbursal | 0.5% of loan amount |
| Credit card approval | 500 |
| Credit score check | 10 |
| First EMI payment | 200 |

## Partner Integrations

### FinBox (Phase 1)
- Account aggregator
- Financial data sync
- Loan eligibility check

### Experian (Phase 2)
- Credit bureau integration
- Credit report fetch
- Risk scoring

## Data Models

### Loan
```typescript
{
  loanId: string;
  userId: string;
  amount: number;
  tenure: number;           // months
  interestRate: number;
  status: 'pending' | 'approved' | 'disbursed' | 'closed' | 'defaulted';
  emiAmount: number;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### CreditScore
```typescript
{
  userId: string;
  score: number;
  bureau: 'finbox' | 'experian' | 'internal';
  factors: string[];
  reportUrl?: string;
  checkedAt: Date;
}
```

## Deployment

### Render.com
1. Connect GitHub repository
2. Build command: `npm run build`
3. Start command: `npm start`
4. Configure partner credentials

### Docker
```bash
docker build -t rez-finance-service .
docker run -p 4005:4005 --env-file .env rez-finance-service
```

## Related Services

- **rez-wallet-service** - Loan disbursement
- **rez-gamification-service** - Coin rewards
- **rez-order-service** - EMI tracking

## License

MIT
