# REZ API Documentation

**Complete API reference for all REZ services.**

## SERVICES

### Payments
```bash
POST /api/payments/create
GET  /api/payments/:id
POST /api/payments/:id/refund
GET  /api/payments/webhook
```

### Wallet
```bash
GET  /api/wallet/balance
POST /api/wallet/pay
POST /api/wallet/add-money
GET  /api/wallet/transactions
```

### Orders
```bash
POST /api/orders
GET  /api/orders/:id
PUT  /api/orders/:id/status
GET  /api/orders/search
```

### Loyalty/Karma
```bash
GET  /api/karma/balance
POST /api/karma/earn
POST /api/karma/redeem
GET  /api/karma/tiers
GET  /api/karma/leaderboard
```

### Appointments
```bash
POST /api/appointments
GET  /api/appointments/:id
PUT  /api/appointments/:id/cancel
GET  /api/appointments/slots
```

### Notifications
```bash
POST /api/notifications/send
GET  /api/notifications/:userId
POST /api/notifications/schedule
```

### Analytics
```bash
GET  /api/analytics/revenue
GET  /api/analytics/users
GET  /api/analytics/conversions
```

## AUTHENTICATION

```bash
Header: Authorization: Bearer TOKEN
Header: X-API-Key: KEY
```

## RATE LIMITS

| Tier | Requests/min |
|------|-------------|
| Free | 100 |
| Pro | 1,000 |
| Enterprise | 10,000 |
