# REZ ECOSYSTEM - DEPLOYMENT CHECKLIST
CEO: Mr. Rejaul Karim
Date: 2026-05-06
Status: READY FOR PRODUCTION

## PRE-DEPLOYMENT

### 1. Environment Variables (CRITICAL)

```bash
# Core Services
JWT_SECRET=$(openssl rand -hex 64)
JWT_REFRESH_SECRET=$(openssl rand -hex 64)
JWT_ADMIN_SECRET=$(openssl rand -hex 64)
JWT_MERCHANT_SECRET=$(openssl rand -hex 64)
OTP_HMAC_SECRET=$(openssl rand -hex 64)
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
INTERNAL_SERVICE_TOKEN=$(openssl rand -hex 64)

# Security
TABLE_TOKEN_SECRET=$(openssl rand -hex 32)
MAX_SOCKET_CONNECTIONS=5000

# Weather
WEATHER_API_KEY=your_openweathermap_key

# Retention
MONGODB_RETENTION_DAYS=90
```

### 2. Secrets Rotation (CRITICAL)

Rotate if any .env committed:
- [ ] MongoDB password
- [ ] All JWT secrets
- [ ] Redis password
- [ ] Razorpay keys
- [ ] Internal tokens

### 3. Branches to Merge

| Branch | Feature |
|--------|---------|
| fix/weather-signals | Weather signals |
| security/websocket-auth-fix | WebSocket security |
| feature/cashback-fraud-prevention | Fraud detection |
| feature/realtime-channel-security | Real-time auth |
| feature/abuse-prevention-system | Abuse prevention |

### 4. Health Checks

```bash
curl https://rez-auth-service.onrender.com/health
curl https://rez-payment-service.onrender.com/health
curl https://rez-wallet-service.onrender.com/health
```

## POST-DEPLOYMENT

### Smoke Tests
- [ ] User registration
- [ ] Payment flow
- [ ] Wallet credit
- [ ] Order creation
- [ ] WebSocket connection

### Fraud Prevention
- [ ] Duplicate detection
- [ ] Self-reward blocking
- [ ] Velocity limits

## SIGN-OFF

CEO: Mr. Rejaul Karim
Date: 2026-05-06

READY FOR PRODUCTION
