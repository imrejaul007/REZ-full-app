# REZ Platform - Source of Truth (SOT)

**Last Updated:** May 12, 2026  
**Version:** 1.0.0

---

## Repository Structure

| Repository | Purpose | Remote |
|------------|---------|--------|
| `REZ-Media` | Advertising, loyalty, marketing automation | `imrejaul007/REZ-Media` |
| `REZ-Intelligence` | AI/ML services, event bus, identity | `imrejaul007/REZ-Intelligence` |
| `RABTUL-Technologies` | Core platform services (auth, wallet, payment) | `imrejaul007/RABTUL-Technologies` |
| `REZ-Consumer` | Mobile apps (Hotel OTA, Rendez, Food Delivery) | `imrejaul007/REZ-Consumer` |
| `REZ-Merchant` | Merchant OS, admin dashboards, integrations | `imrejaul007/REZ-Merchant` |
| `rez-merchant-service` | Core merchant API service | `imrejaul007/rez-merchant-service` |

---

## Service URLs

### Production
```
AUTH_SERVICE=https://rez-auth-service.onrender.com
WALLET_SERVICE=https://rez-wallet-service.onrender.com
PAYMENT_SERVICE=https://rez-payment-service.onrender.com
ORDER_SERVICE=https://rez-order-service.onrender.com
MERCHANT_SERVICE=https://rez-merchant-service.onrender.com
INTENT_SERVICE=https://rez-intent-graph.onrender.com
EVENT_BUS=https://rez-event-bus.onrender.com
IDENTITY_BRIDGE=https://rez-identity-bridge.onrender.com

# REZ-Media
ADS_SERVICE=https://rez-ads-service.onrender.com
DECISION_SERVICE=https://rez-decision-service.onrender.com
GAMIFICATION_SERVICE=https://rez-gamification-service.onrender.com
AUTOMATION_SERVICE=https://rez-automation-service.onrender.com
MEDIA_EVENTS=https://rez-media-events.onrender.com

# REZ-Intelligence
EVENT_PLATFORM=https://rez-event-platform.onrender.com
INTELLIGENCE_HUB=https://rez-intelligence-hub.onrender.com
INSIGHTS_SERVICE=https://rez-insights-service.onrender.com
```

### Development (Local)
```
AUTH_SERVICE=http://localhost:4002
WALLET_SERVICE=http://localhost:4001
PAYMENT_SERVICE=http://localhost:4003
ORDER_SERVICE=http://localhost:4006
MERCHANT_SERVICE=http://localhost:4005
INTENT_SERVICE=http://localhost:4050
EVENT_BUS=http://localhost:4051
IDENTITY_BRIDGE=http://localhost:4092

# REZ-Media
ADS_SERVICE=http://localhost:4007
DECISION_SERVICE=http://localhost:4027
GAMIFICATION_SERVICE=http://localhost:3004
AUTOMATION_SERVICE=http://localhost:4020
MEDIA_EVENTS=http://localhost:3008
```

---

## Security Configuration

### Internal Service Tokens

All services use **scoped tokens** via `INTERNAL_SERVICE_TOKENS_JSON`:

```json
{
  "auth-service": "<hex-token>",
  "wallet-service": "<hex-token>",
  "payment-service": "<hex-token>",
  "order-service": "<hex-token>",
  "merchant-service": "<hex-token>",
  "intent-service": "<hex-token>",
  "event-bus": "<hex-token>",
  "identity-bridge": "<hex-token>",
  "api-gateway": "<hex-token>",
  "ads-service": "<hex-token>",
  "decision-service": "<hex-token>",
  "gamification-service": "<hex-token>",
  "automation-service": "<hex-token>",
  "media-events": "<hex-token>"
}
```

**Generate tokens:**
```bash
openssl rand -hex 32
```

### Request Headers

#### Internal Service Calls
```
X-Internal-Token: <service-token>
X-Internal-Service: <service-name>
Content-Type: application/json
X-Request-Id: <uuid>
```

#### User Context
```
X-User-Id: <user-id>
X-User-Role: <role>
Authorization: Bearer <jwt>
```

### Webhook Signatures
```
X-Signature: <hmac-sha256-hex>
```

---

## Security Standards

### Must Have (Production)

- [x] `JWT_SECRET` - 64+ characters
- [x] `ENCRYPTION_KEY` - 64 hex characters or 32 bytes
- [x] `INTERNAL_SERVICE_TOKENS_JSON` - Scoped per-service tokens
- [x] `OTP_PEPPER` - Server-side OTP security
- [x] `INTERNAL_WEBHOOK_SECRET` - HMAC signing
- [x] Weak secret detection at startup
- [x] HSTS headers in production
- [x] CORS restricted to known origins
- [x] Rate limiting enabled
- [x] Redis-backed distributed rate limits

### Implemented Fixes

| Fix | Status | Repository |
|-----|--------|------------|
| CORS localhost in production | ✅ | rez-merchant-service |
| Refresh token 30-day expiry | ✅ | rez-merchant-service |
| Distributed withdrawal lock | ✅ | rez-merchant-service |
| HMAC webhook signatures | ✅ | rez-merchant-service |
| OTP pepper hashing | ✅ | rez-merchant-service |
| Weak secret detection | ✅ | All services |
| Auth middleware | ✅ | REZ-Intelligence |
| Rate limiting | ✅ | REZ-Intelligence |
| HSTS headers | ✅ | RABTUL-Technologies |

---

## Database Schemas

### Merchant (MongoDB)
```typescript
interface Merchant {
  _id: ObjectId;
  businessName: string;
  email: string;
  phone: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  refreshTokenHash?: string;
  refreshTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### UnifiedIdentity (MongoDB)
```typescript
interface UnifiedIdentity {
  _id: ObjectId;
  unifiedId: string;
  primaryIdentifier: 'phone' | 'email';
  linkedAccounts: [{
    appId: string;
    userId: string;
    linkedAt: Date;
    confidence: number;
  }];
  profile: { phone?: string; email?: string; name?: string };
  status: 'active' | 'merged' | 'flagged';
}
```

---

## Environment Variables

### Required for All Services

| Variable | Description | Format |
|----------|-------------|--------|
| `NODE_ENV` | Environment | `development` \| `staging` \| `production` |
| `PORT` | Service port | number |
| `MONGODB_URI` | MongoDB connection | mongodb://... |
| `REDIS_URL` | Redis connection | redis://... |
| `JWT_SECRET` | JWT signing secret | 64+ chars |
| `ENCRYPTION_KEY` | Data encryption key | 64 hex or 32 bytes |
| `INTERNAL_SERVICE_TOKENS_JSON` | Service tokens | JSON object |

### Service-Specific

| Service | Additional Required |
|---------|-------------------|
| Merchant | `JWT_MERCHANT_SECRET`, `OTP_PEPPER`, `INTERNAL_WEBHOOK_SECRET` |
| Auth | `JWT_ADMIN_SECRET`, `JWT_REFRESH_SECRET`, `OTP_HMAC_SECRET` |
| Payment | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Ads Service | `ADS_JWT_SECRET`, `INTENT_CAPTURE_URL`, `EVENT_PLATFORM_URL`, `RAZORPAY_WEBHOOK_SECRET` |
| Decision Service | `INTENT_CAPTURE_URL`, `INTELLIGENCE_HUB_URL`, `INSIGHTS_SERVICE_URL` |
| Gamification | `WALLET_SERVICE_URL`, `INTENT_CAPTURE_URL` |
| Automation | `ALLOWED_TRACK_DOMAINS`, `SMTP_*` |
| Media Events | `CLOUDINARY_*`, `CDN_URL` |

---

## API Endpoints

### Auth Service
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | User login |
| POST | `/api/auth/refresh` | Public | Refresh token |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/health` | None | Health check |

### Merchant Service
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/merchant/auth/login` | Public | Merchant login |
| POST | `/api/v1/merchant/auth/verify-otp` | Public | Verify OTP |
| GET | `/api/v1/merchant/orders` | JWT | List orders |
| POST | `/api/v1/merchant/wallet/withdraw` | JWT | Withdrawal |
| GET | `/health` | None | Health check |

### Event Bus
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/events/publish` | Internal | Publish event |
| GET | `/api/events/history` | Internal | Event history |
| GET | `/api/health` | None | Health check |

---

## Monitoring & Health

### Health Endpoints
All services expose:
- `/health` - Basic liveness
- `/ready` - Readiness (checks dependencies)
- `/health/detailed` - Full status

### Prometheus Metrics
All services expose `/metrics` for Prometheus scraping.

---

## Deployment Checklist

### Pre-Deployment
- [ ] Generate production secrets (`openssl rand -hex 64`)
- [ ] Verify `.env.example` has placeholder values only
- [ ] Run `npm run typecheck` - no errors
- [ ] Run `npm test` - all pass
- [ ] Security scan: `npm run security-scan`

### Post-Deployment
- [ ] Verify health endpoint returns `200`
- [ ] Check logs for startup errors
- [ ] Test authentication flow
- [ ] Verify rate limiting works
- [ ] Monitor error rates

---

## Troubleshooting

### Authentication Failures
1. Check `JWT_SECRET` matches across services
2. Verify `INTERNAL_SERVICE_TOKENS_JSON` format is valid JSON
3. Check token expiry hasn't passed

### Database Connection Issues
1. Verify `MONGODB_URI` is correct
2. Check network connectivity to MongoDB
3. Verify credentials if auth enabled

### Rate Limiting
1. Redis must be reachable
2. Check `X-RateLimit-*` headers in response
3. Adjust limits in environment if needed

---

## Contact

For issues or questions, refer to:
- Security: `security@rez.money`
- Platform: `platform@rez.money`
- Documentation: See individual service README.md
