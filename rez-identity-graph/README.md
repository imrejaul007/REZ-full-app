# REZ Identity Graph Service

Unified Identity Graph System for the REZ Platform - Track users across App, WhatsApp, Web, and QR channels.

## Features

- **Multi-Channel Identity Tracking**: Track users across App, WhatsApp, Web, and QR channels
- **Identity Linking**: Link identities across channels (email, phone, device)
- **Unified Profile Resolution**: Resolve unified profiles from any identifier
- **Device Fingerprinting**: Track devices and assess risk scores
- **Privacy Controls**: User privacy settings and consent management
- **GDPR Compliance**: Full data erasure, export, and consent management

## Architecture

```
rez-identity-graph/
├── src/
│   ├── index.ts                 # Express server entry point
│   ├── identity.service.ts      # Identity CRUD operations
│   ├── device.service.ts        # Device tracking & fingerprinting
│   ├── link.service.ts          # Identity linking logic
│   ├── resolve.service.ts       # Unified profile resolution
│   ├── models/                  # Mongoose models
│   │   ├── identity.model.ts    # Identity schema
│   │   ├── cluster.model.ts     # Cluster schema
│   │   ├── device.model.ts      # Device schema
│   │   └── activity.model.ts    # Activity tracking
│   ├── routes/                  # Express routes
│   │   ├── identity.routes.ts
│   │   ├── device.routes.ts
│   │   ├── link.routes.ts
│   │   ├── resolve.routes.ts
│   │   └── gdpr.routes.ts
│   └── utils/
│       └── logger.ts            # Winston logger
├── package.json
├── tsconfig.json
├── render.yaml                  # Render deployment config
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/rez_identity_graph
LOG_LEVEL=info
IDENTITY_SALT=your-secure-random-salt
CORS_ORIGIN=*
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Identity Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/identities` | Create new identity |
| GET | `/api/identities/:id` | Get identity by ID |
| GET | `/api/identities/type/:type` | Get identities by type |
| GET | `/api/identities/cluster/:clusterId` | Get identities by cluster |
| PUT | `/api/identities/:id` | Update identity |
| DELETE | `/api/identities/:id` | Soft delete identity |
| POST | `/api/identities/search` | Search identities |

### Device Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/devices` | Create/update device |
| GET | `/api/devices/:id` | Get device by ID |
| POST | `/api/devices/fingerprint/lookup` | Lookup by fingerprint |
| POST | `/api/devices/:id/link` | Link identity to device |
| POST | `/api/devices/:id/unlink` | Unlink identity from device |
| GET | `/api/devices/:id/risk` | Get device risk assessment |
| POST | `/api/devices/:id/block` | Block device |

### Identity Linking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/links/identities` | Link two identities |
| POST | `/api/links/email` | Link by email |
| POST | `/api/links/phone` | Link by phone |
| POST | `/api/links/device` | Link by device |
| POST | `/api/links/unlink` | Unlink identity |

### Profile Resolution

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resolve/by-identity` | Resolve by type+identifier |
| POST | `/api/resolve/by-cluster` | Resolve by cluster ID |
| POST | `/api/resolve/by-device` | Resolve by device |
| POST | `/api/resolve/by-session` | Resolve by session ID |
| POST | `/api/resolve/anonymous` | Resolve anonymous profile |
| GET | `/api/resolve/cluster/:id/profile` | Get cluster profile |
| POST | `/api/resolve/predict/:clusterId` | Predict user attributes |

### GDPR Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gdpr/consent/:id` | Update consent |
| POST | `/api/gdpr/withdraw-consent/:id` | Withdraw consent |
| POST | `/api/gdpr/erasure/:id` | Request data erasure |
| POST | `/api/gdpr/erasure/cluster/:id` | Erase cluster data |
| GET | `/api/gdpr/export/:id` | Export user data |
| GET | `/api/gdpr/consent-status/:id` | Get consent status |
| GET | `/api/gdpr/pending-erasure` | List pending erasures |

## Usage Examples

### Create Identity

```bash
curl -X POST http://localhost:3001/api/identities \
  -H "Content-Type: application/json" \
  -d '{
    "type": "app_user",
    "identifier": "user@example.com",
    "metadata": {
      "source": "mobile_app",
      "platform": "ios",
      "appVersion": "1.0.0"
    }
  }'
```

### Link Identities

```bash
curl -X POST http://localhost:3001/api/links/email \
  -H "Content-Type: application/json" \
  -d '{
    "identityId": "identity-uuid",
    "value": "user@example.com",
    "type": "email",
    "confidence": "high"
  }'
```

### Resolve Unified Profile

```bash
curl -X POST http://localhost:3001/api/resolve/by-identity \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whatsapp_user",
    "identifier": "+1234567890",
    "options": {
      "includeActivity": true,
      "includeDevices": true,
      "privacyFilter": true
    }
  }'
```

### Update GDPR Consent

```bash
curl -X POST http://localhost:3001/api/gdpr/consent/identity-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "marketingConsent": true,
    "analyticsConsent": true,
    "thirdPartySharing": false
  }'
```

### Request Data Erasure

```bash
curl -X POST http://localhost:3001/api/gdpr/erasure/identity-uuid
```

## Identity Types

- `app_user` - Mobile app user
- `whatsapp_user` - WhatsApp user
- `web_user` - Web browser user
- `qr_user` - QR code scanner user
- `email` - Email-based identity
- `phone` - Phone-based identity
- `device` - Device-based identity
- `anonymous` - Unidentified/anonymous user

## Cluster Confidence Levels

- `high` - Verified link (e.g., same email)
- `medium` - Probable link (e.g., same device)
- `low` - Weak link (e.g., similar behavior)
- `inferred` - System-inferred link

## Privacy Settings

Each identity has configurable privacy settings:

- `trackingEnabled` - Enable/disable tracking
- `dataRetentionDays` - Data retention period (1-3650 days)
- `marketingConsent` - Marketing communications consent
- `analyticsConsent` - Analytics data collection consent
- `thirdPartySharing` - Third-party data sharing consent

## Health Checks

```bash
# Basic health check
curl http://localhost:3001/health

# Readiness check
curl http://localhost:3001/ready
```

## Deployment to Render

1. Push to GitHub repository `rez-identity-graph`
2. Connect to Render dashboard
3. Create new Web Service
4. Configure environment variables
5. Deploy

The `render.yaml` file automatically configures the service with MongoDB.

## License

MIT
