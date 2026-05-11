# ReZ Billing System

A comprehensive billing system with wallet management, invoice generation, fraud detection, and settlement services.

## Services

### Wallet Service
- Create and manage user wallets
- Credit/debit operations
- Fund transfers between wallets
- Transaction history
- Wallet freezing and closing

### Invoice Service
- Create and manage invoices
- Add/remove invoice items
- Track invoice status (draft, issued, paid, overdue, cancelled)
- Tax calculations
- Customer invoice history

### Fraud Service
- Real-time transaction fraud checking
- Velocity detection (transaction frequency)
- Pattern recognition (structuring detection)
- Risk scoring (0-1 scale)
- Batch fraud checking

### Settlement Service
- Create settlements for merchant transactions
- Batch processing
- Fee calculations (2.9% + $0.30)
- Settlement status tracking

## API Endpoints

### Wallets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/wallets | Create new wallet |
| GET | /api/wallets/:id | Get wallet by ID |
| GET | /api/wallets/user/:userId | Get wallet by user ID |
| GET | /api/wallets/:id/balance | Get wallet balance |
| POST | /api/wallets/:id/credit | Credit funds |
| POST | /api/wallets/:id/debit | Debit funds |
| POST | /api/wallets/:id/transfer | Transfer funds |
| GET | /api/wallets/:id/transactions | Get transaction history |
| POST | /api/wallets/:id/freeze | Freeze wallet |
| POST | /api/wallets/:id/unfreeze | Unfreeze wallet |
| POST | /api/wallets/:id/close | Close wallet |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/invoices | Create invoice |
| GET | /api/invoices/:id | Get invoice |
| GET | /api/invoices/number/:invoiceNumber | Get by invoice number |
| GET | /api/invoices/customer/:customerId | Get customer's invoices |
| PUT | /api/invoices/:id | Update invoice |
| POST | /api/invoices/:id/issue | Issue invoice |
| POST | /api/invoices/:id/pay | Mark as paid |
| POST | /api/invoices/:id/cancel | Cancel invoice |
| POST | /api/invoices/:id/items | Add item |
| DELETE | /api/invoices/:id/items/:itemId | Remove item |

### Fraud
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/fraud/check | Fraud check transaction |
| POST | /api/fraud/batch-check | Batch fraud check |
| GET | /api/fraud/result/:transactionId | Get check result |
| GET | /api/fraud/statistics | Fraud statistics |

### Settlements
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/settlements | Create settlement |
| GET | /api/settlements/:id | Get settlement |
| GET | /api/settlements/merchant/:merchantId | Get merchant settlements |
| POST | /api/settlements/:id/start | Start processing |
| POST | /api/settlements/:id/complete | Complete settlement |
| POST | /api/settlements/:id/fail | Fail settlement |
| POST | /api/settlements/:id/retry | Retry failed settlement |
| GET | /api/settlements/fee/breakdown | Fee breakdown |

## Setup

```bash
npm install
npm run build
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | production |
| FRAUD_THRESHOLD | Fraud detection threshold (0-1) | 0.85 |
| MAX_DAILY_TRANSACTIONS | Max transactions per day | 1000 |

## Deployment

Deploys automatically to Render via `render.yaml` blueprint.

```bash
# Manual deploy to Render
render deploy
```
