# ReZ Consent Service

DPDP-compliant consent management and user rights service for ReZ platform.

## Features

- User consent tracking
- GDPR/DPDP compliance
- Data subject rights management
- Privacy policy management
- Consent audit trail

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 4008 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/rez_consent |
| ALLOWED_ORIGINS | CORS allowed origins | https://rez.money |

## API Endpoints

### Consent

- `POST /api/consent` - Record user consent
- `GET /api/consent/:userId` - Get user consent
- `GET /api/consent/summary/:userId` - Get consent summary

### User Rights

- `POST /api/user-rights/access` - Request data access
- `POST /api/user-rights/deletion` - Request data deletion
- `POST /api/user-rights/correction` - Request data correction
- `POST /api/user-rights/portability` - Request data portability

### Privacy

- `GET /api/privacy` - Get privacy policy info

### Health

- `GET /health` - Service health check

## Privacy Features

- Right to access personal data
- Right to correction
- Right to erasure (right to be forgotten)
- Right to withdraw consent
- Right to data portability

## Data Retention

| Data Type | Retention Period |
|-----------|------------------|
| Events | 90 days |
| Transactions | 7 years |
| Inactive Accounts | 24 months (anonymized) |

## Development

```bash
# Type check
npm run typecheck

# Run tests
npm test
```
