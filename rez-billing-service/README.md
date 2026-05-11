# REZ Billing Service

Ad Billing System for the REZ Platform - Handles CPC/CPA/CPM tracking, merchant wallets, auto top-up, invoice generation, fraud detection, and settlement processing.

## Features

- **CPC/CPA/CPM Tracking**: Support for all major advertising billing models
- **Merchant Wallet**: Balance management with pending and available balances
- **Auto Top-Up**: Configurable automatic wallet replenishment
- **Invoice Generation**: Automatic invoice creation with PDF export
- **Fraud Detection**: Real-time event validation and pattern analysis
- **Refund Handling**: Full refund support for billing events
- **Settlement Processing**: Bank transfers with fee calculation

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cache**: Redis (ioredis)
- **Queue**: Bull (Redis-based)
- **Language**: TypeScript

## Project Structure

```
rez-billing-service/
├── src/
│   ├── index.ts              # Application entry point
│   ├── billing.service.ts    # CPC/CPA/CPM tracking logic
│   ├── wallet.service.ts     # Merchant wallet operations
│   ├── invoice.service.ts    # Invoice generation and management
│   ├── fraud.service.ts      # Fraud detection and alerts
│   ├── settlement.service.ts # Settlement processing
│   ├── notification.service.ts
│   ├── models/
│   │   └── index.ts         # Mongoose schemas and types
│   ├── routes/
│   │   ├── wallet.routes.ts
│   │   ├── billing.routes.ts
│   │   ├── invoice.routes.ts
│   │   ├── fraud.routes.ts
│   │   └── settlement.routes.ts
│   ├── queues/
│   │   └── billing.queue.ts # Bull queue for batch processing
│   └── config/
│       ├── redis.ts
│       └── logger.ts
├── package.json
├── tsconfig.json
├── render.yaml
└── README.md
```

## API Endpoints

### Wallet
- `POST /api/wallets` - Create wallet
- `GET /api/wallets/:merchantId` - Get wallet balance
- `POST /api/wallets/topup` - Add funds
- `POST /api/wallets/deduct` - Deduct funds
- `POST /api/wallets/:merchantId/auto-topup` - Configure auto top-up
- `GET /api/wallets/:merchantId/transactions` - Transaction history

### Billing
- `POST /api/billing/events` - Process single event
- `POST /api/billing/events/batch` - Process batch events
- `GET /api/billing/campaigns/:campaignId/summary` - Campaign billing summary
- `GET /api/billing/merchants/:merchantId/records` - Billing records
- `POST /api/billing/events/:id/refund` - Refund event
- `GET /api/billing/merchants/:merchantId/analytics` - Billing analytics

### Invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice
- `GET /api/invoices/merchant/:merchantId` - List merchant invoices
- `POST /api/invoices/:id/pay` - Mark as paid
- `POST /api/invoices/:id/cancel` - Cancel invoice
- `GET /api/invoices/:id/pdf` - Download PDF

### Fraud
- `GET /api/fraud/alerts` - Critical alerts
- `GET /api/fraud/alerts/:id` - Get alert
- `GET /api/fraud/merchants/:merchantId/alerts` - Merchant alerts
- `PATCH /api/fraud/alerts/:id` - Update alert status
- `GET /api/fraud/merchants/:merchantId/stats` - Fraud statistics

### Settlements
- `POST /api/settlements` - Create settlement
- `GET /api/settlements/:id` - Get settlement
- `GET /api/settlements/merchants/:merchantId` - List settlements
- `POST /api/settlements/:id/process` - Process settlement
- `POST /api/settlements/:id/cancel` - Cancel settlement
- `POST /api/settlements/calculate` - Calculate fees

## Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (production/development) | development |
| `PORT` | Server port | 3001 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/rez-billing |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `LOG_LEVEL` | Logging level | info |
| `CORS_ORIGIN` | Allowed CORS origins | * |

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development
npm run dev

# Run in production
npm start
```

## Deployment to Render

1. Fork/clone this repository
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Add environment variables:
   - `MONGODB_URI`
   - `REDIS_URL`
   - `LOG_LEVEL`
5. Deploy

The `render.yaml` file handles most configuration automatically.

## Billing Models

### CPC (Cost Per Click)
- Charged for each ad click
- Typical use: Search ads, display ads

### CPA (Cost Per Action)
- Charged when user completes an action (signup, purchase)
- Typical use: Conversion-focused campaigns

### CPM (Cost Per Mille)
- Charged per 1000 impressions
- Typical use: Brand awareness campaigns

## Fraud Detection Rules

1. **Rate Limiting**: Detects burst traffic
2. **Unusual Amounts**: Flags amounts exceeding model limits
3. **Negative Amounts**: Critical alert for invalid amounts
4. **Pattern Analysis**: Identifies suspicious behavioral patterns

## Scheduled Jobs

- **Hourly**: Update overdue invoices
- **Daily (2 AM)**: Auto-settle eligible merchants
- **Every 6 hours**: Retry failed settlements

## License

Proprietary - REZ Platform
