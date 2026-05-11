# REZ Platform — Environment Variables

> **WARNING: Values are redacted. Never commit actual secrets. This file only shows var names.**

## Render Environment Groups

### Group: `rez-core` — Linked to ALL services

```
NODE_ENV=production
JWT_SECRET=<GET FROM RENDER>
INTERNAL_SERVICE_TOKEN=<GET FROM RENDER>
INTERNAL_SERVICE_KEY=<GET FROM RENDER>
MONGODB_URI=<GET FROM RENDER>
REDIS_URL=<GET FROM RENDER>
SENTRY_DSN=<GET FROM RENDER>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
LOG_LEVEL=info
```

### Group: `rez-service-urls` — Linked to services that call other services

```
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service-n3q2.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
ORDER_SERVICE_URL=https://rez-order-service-hz18.onrender.com
NOTIFICATION_SERVICE_URL=https://rez-notification-events-mwdz.onrender.com
GAMIFICATION_SERVICE_URL=https://rez-gamification-service-3b5d.onrender.com
MARKETING_SERVICE_URL=https://rez-marketing-service.onrender.com
ADS_SERVICE_URL=https://rez-ads-service.onrender.com
ANALYTICS_SERVICE_URL=https://analytics-events-37yy.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service-1.onrender.com
MEDIA_SERVICE_URL=https://rez-media-events-lfym.onrender.com
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
INTENT_GRAPH_URL=https://rez-intent-graph.onrender.com
MONOLITH_URL=https://rez-backend-8dfu.onrender.com
```

### Group: `rez-payments` — Linked to payment-service, backend, Hotel OTA

```
RAZORPAY_KEY_ID=<GET FROM RAZORPAY DASHBOARD>
RAZORPAY_KEY_SECRET=<GET FROM RAZORPAY DASHBOARD>
PAYMENT_GATEWAY=razorpay
ALLOW_TEST_RAZORPAY=true
```

### Group: `rez-storage` — Linked to media-events, catalog-service, backend

```
CLOUDINARY_API_KEY=<GET FROM CLOUDINARY>
CLOUDINARY_API_SECRET=<GET FROM CLOUDINARY>
CLOUDINARY_CLOUD_NAME=<GET FROM CLOUDINARY>
CLOUD_STORAGE_PROVIDER=cloudinary
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp
ALLOWED_VIDEO_TYPES=mp4,avi,mov,wmv,webm
UPLOAD_PATH=./uploads
```

### Group: `rez-comms` — Linked to notification, marketing, auth, backend

```
SENDGRID_API_KEY=<GET FROM SENDGRID>
SENDGRID_FROM_EMAIL=noreply@rez.money
SENDGRID_FROM_NAME=REZ App
TWILIO_ACCOUNT_SID=<GET FROM TWILIO>
TWILIO_AUTH_TOKEN=<GET FROM TWILIO>
TWILIO_SENDER_ID=REZAPP
SMS_TEST_MODE=true
```

### Group: `rez-firebase` — Linked to auth, notification, backend

```
FIREBASE_API_KEY=<GET FROM FIREBASE CONSOLE>
FIREBASE_APP_ID=<GET FROM FIREBASE CONSOLE>
FIREBASE_AUTH_DOMAIN=rez-app-e450d.firebaseapp.com
FIREBASE_CLIENT_EMAIL=<GET FROM FIREBASE CONSOLE>
FIREBASE_CLIENT_ID=<GET FROM FIREBASE CONSOLE>
FIREBASE_MESSAGING_SENDER_ID=<GET FROM FIREBASE CONSOLE>
FIREBASE_PRIVATE_KEY_ID=<GET FROM FIREBASE CONSOLE>
FIREBASE_PROJECT_ID=rez-app-e450d
FIREBASE_STORAGE_BUCKET=rez-app-e450d.firebasestorage.app
FIREBASE_PRIVATE_KEY=<GET FROM FIREBASE CONSOLE → Service Accounts>
```

### rez-now
```
REZ_API_BASE_URL=https://rez-api-gateway.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service-n3q2.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
CLOUDINARY_CLOUD_NAME=dgqqkrsha
CLOUDINARY_API_KEY=<GET FROM CLOUDINARY>
CLOUDINARY_API_SECRET=<GET FROM CLOUDINARY>
```

### rez-contracts
```
MONGODB_URI=<GET FROM RENDER>
JWT_SECRET=<GET FROM RENDER>
SERVICE_NAME=rez-contracts
PORT=3001
```

### rez-devops-config
```
GITHUB_TOKEN=<GET FROM GITHUB>
DEPLOY_WEBHOOK_SECRET=<GET FROM RENDER>
SLACK_WEBHOOK_URL=<GET FROM SLACK>
```

### rez-error-intelligence
```
MONGODB_URI=<GET FROM RENDER>
REDIS_URL=<GET FROM RENDER>
SENTRY_DSN=<GET FROM SENTRY>
```

### rez-finance-service
```
MONGODB_URI=<GET FROM RENDER>
REDIS_URL=<GET FROM RENDER>
SERVICE_NAME=rez-finance-service
PORT=4005
```

### rez-karma-service (repo: imrejaul007/Karma) — ✅ LIVE
```
MONGODB_URI=mongodb+srv://work_db_user:...@karma.topsbq1.mongodb.net/?appName=karma
REDIS_URL=redis://red-d760rlshg0os73bd8mp0:6379
SERVICE_NAME=rez-karma-service
PORT=3009
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
MERCHANT_SERVICE_URL=https://rez-merchant-service-n3q2.onrender.com
JWT_SECRET=<GET FROM RENDER — same as rez-auth-service>
INTERNAL_SERVICE_TOKEN=<GET FROM RENDER — same as other services>
BATCH_CRON_SCHEDULE=59 23 * * 0
```

---

## Per-Service Unique Variables

### rez-api-gateway
```
PORT=5002
SERVICE_ROUTES_JSON=<GET FROM RENDER>
```

### rez-auth-service
```
PORT=5003
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<GET FROM RENDER>
JWT_REFRESH_EXPIRES_IN=7d
OTP_HMAC_SECRET=<GET FROM RENDER>
OTP_EXPIRY_MINUTES=3
OTP_MAX_ATTEMPTS=3
TOTP_ENCRYPTION_KEY=<GET FROM RENDER>
COOKIE_SECRET=<GET FROM RENDER>
REDIS_SESSION_SECRET=<GET FROM RENDER>
BCRYPT_ROUNDS=12
FRONTEND_URL=https://menu.rez.money
ADMIN_FRONTEND_URL=https://admin.rez.money
```

### rez-merchant-service
```
PORT=3004
REDIS_URL=<GET FROM RENDER>
JWT_MERCHANT_SECRET=<GET FROM RENDER>
JWT_MERCHANT_EXPIRES_IN=7d
ENCRYPTION_KEY=<GET FROM RENDER>
BCRYPT_ROUNDS=12
MERCHANT_FRONTEND_URL=https://merchant.rez.money
CORS_ORIGIN=<see LOCAL-PORTS.md>
```

### rez-wallet-service
```
PORT=5006
WALLET_BALANCE_ENCRYPTION_KEY=<GET FROM RENDER>
ENCRYPTION_KEY=<GET FROM RENDER>
REZ_COIN_TO_RUPEE_RATE=1
DAILY_QR_COIN_CAP=500
SELF_REPORTED_AMOUNT_CAP=1000
CASHBACK_INSTANT_CREDIT=true
INTERNAL_SERVICE_TOKENS_JSON=<GET FROM RENDER>
```

### rez-payment-service
```
PORT=5005
RAZORPAY_WEBHOOK_SECRET=<GET FROM RAZORPAY DASHBOARD → Webhooks>
RECEIPT_TOKEN_SECRET=<GET FROM RENDER>
PAYMENTS_ORCHESTRATOR_MODE=live
REFUNDS_ORCHESTRATOR_MODE=live
```

### rez-order-service
```
PORT=3006
ORDERS_CANCEL_ORCHESTRATOR_MODE=shadow
RECEIPT_TOKEN_SECRET=<GET FROM RENDER>
REZ_COIN_TO_RUPEE_RATE=1
```

### rez-catalog-service
```
PORT=5007
OPENCAGE_API_KEY=<GET FROM OPENCAGE>
AUTO_CREATE_INDEXES=true
```

### rez-gamification-service
```
PORT=4003
REZ_COIN_TO_RUPEE_RATE=1
DAILY_QR_COIN_CAP=500
ENCRYPTION_KEY=<GET FROM RENDER>
```

### analytics-events
```
PORT=5011
ANONYMIZATION_SALT=<GET FROM RENDER>
```

### rez-media-events
```
PORT=3008
MAX_FILE_SIZE=10485760
```

### rez-ads-service
```
PORT=4002
JWT_MERCHANT_SECRET=<GET FROM RENDER>
AD_SERVER_MODE=live
```

### rez-marketing-service
```
PORT=3007
MERCHANT_FRONTEND_URL=https://merchant.rez.money
# PUBLIC_URL is used in emailed links — must resolve publicly. Use the service's own Render URL.
PUBLIC_URL=https://rez-marketing-service.onrender.com
```

### rez-notification-events
```
PORT=3009
# PUBLIC_URL is used in push/webhook payloads — must resolve publicly.
PUBLIC_URL=https://rez-notification-events-mwdz.onrender.com
FRONTEND_URL=https://menu.rez.money
# ReZ Mind integration — subscribes to 'rez-mind' Redis channel
# for intent signals (dormant_user, purchase_intent, abandoned_cart)
```

### rez-search-service
```
PORT=5008
OPENCAGE_API_KEY=<GET FROM OPENCAGE>
```

### rez-backend (additional unique vars)
```
PORT=5001
API_PREFIX=/api
API_VERSION=v1
ADBAZAAR_INTERNAL_KEY=<GET FROM RENDER>
ADBAZAAR_WEBHOOK_SECRET=<GET FROM RENDER>
DEBUG_MODE=false
DISABLE_CRON_IN_API=false
DISABLE_RATE_LIMIT=false
GIFT_CARD_ENCRYPTION_KEY=<GET FROM RENDER>
JWT_ADMIN_SECRET=<GET FROM RENDER>
LOG_OTP_FOR_TESTING=false
MONGO_MAX_POOL_SIZE=10
PAYMENT_SERVICE_INTERNAL_TOKEN=<GET FROM RENDER>
PROCESS_ROLE=api
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
RENDEZ_WEBHOOK_SECRET=<GET FROM RENDER>
REQUIRE_ADMIN_TOTP=true
REZ_OTA_WEBHOOK_SECRET=<GET FROM RENDER>
SEED_DATABASE=false
SLOW_QUERY_THRESHOLD_MS=200
FRONTEND_URL=https://menu.rez.money
ADMIN_FRONTEND_URL=https://admin.rez.money
MERCHANT_FRONTEND_URL=https://merchant.rez.money
GAMIFICATION_WORKER_EXTERNAL=true
NOTIFICATION_WORKER_EXTERNAL=true
PAYMENT_EVENTS_WORKER_EXTERNAL=true
WALLET_WORKER_EXTERNAL=true
CLOUD_STORAGE_PROVIDER=cloudinary
UPLOAD_PATH=./uploads
# CORS: list of frontend origins allowed to call the API.
CORS_ORIGIN=https://www.rez.money,https://rez.money,https://admin.rez.money,https://merchant.rez.money,https://menu.rez.money,https://rez-app-admin.vercel.app,https://rez-app-consumer.vercel.app,https://rez-app-marchant.vercel.app,https://rez-web-menu.vercel.app,https://ad-bazaar.vercel.app,https://rez-app-consumer-1.onrender.com
```

---

## App-Specific (Frontend)

### rez-app-consumer / rez-app-marchant / rez-app-admin
```
# All traffic routes through the gateway. See API-ENDPOINTS.md.
EXPO_PUBLIC_API_BASE_URL=https://rez-api-gateway.onrender.com/api
EXPO_PUBLIC_API_URL=https://rez-api-gateway.onrender.com/api
EXPO_PUBLIC_GATEWAY_URL=https://rez-api-gateway.onrender.com
# Socket.IO runs only on the monolith during migration — merchant/admin connect here for realtime.
EXPO_PUBLIC_SOCKET_URL=https://rez-backend-8dfu.onrender.com
EXPO_PUBLIC_BACKEND_URL=https://rez-backend-8dfu.onrender.com
EXPO_PUBLIC_SENTRY_DSN=<GET FROM SENTRY>
EXPO_PUBLIC_RAZORPAY_KEY_ID=<GET FROM RAZORPAY>
EXPO_PUBLIC_ENVIRONMENT=production
```

### Vercel
```
SENTRY_AUTH_TOKEN=<GET FROM SENTRY>
SENTRY_ORG=<GET FROM SENTRY>
SENTRY_PROJECT=<GET FROM SENTRY>
```

---

## How to Get Values

| Var | Where to Find |
|-----|--------------|
| JWT secrets | Generate with `openssl rand -hex 64` |
| MongoDB URI | MongoDB Atlas → Cluster → Connect → Drivers |
| Redis URL | Render → Redis instance → Environment |
| Sentry DSN | Sentry → Project → Settings → Client Keys |
| Razorpay keys | Razorpay Dashboard → Settings → API Keys |
| SendGrid | SendGrid Dashboard → API Keys |
| Twilio | Twilio Console → Account Info |
| Firebase | Firebase Console → Project Settings → Service Accounts |
| Cloudinary | Cloudinary Dashboard → Settings → API Keys |
| OpenCage | opencagedata.com → API Keys |

---

## Known Issues to Fix in Live Render Env

The live values currently set on Render have a few issues that should be corrected. These are **dashboard changes, not code changes** — update directly in each service's Environment tab.

| Service | Variable | Current (wrong) | Should Be | Why |
|---------|----------|-----------------|-----------|-----|
| rez-backend | `PUBLIC_URL` | `https://api.rezapp.com` | `https://rez-backend-8dfu.onrender.com` | `api.rezapp.com` is not a domain we own. Any link generated from this var (emails, push payloads, webhooks) resolves to nowhere. |
| rez-marketing-service | `PUBLIC_URL` | `https://api.rezapp.com` | `https://rez-marketing-service.onrender.com` | Same — emailed marketing links break. |
| rez-notification-events | `PUBLIC_URL` | `https://api.rezapp.com` | `https://rez-notification-events-mwdz.onrender.com` | Same — notification links break. |
| rez-backend | `NODE_AUTH_TOKEN` | `ghp_...` (GitHub PAT) | **DELETE — should not be in Render env** | GitHub PATs belong in GitHub Actions secrets, not service runtime env. Remove from Render and re-add only to GH Actions if a workflow needs it. |
| rez-backend | `REQUIRE_ADMIN_TOTP` | `false` | `true` (after admin TOTP rollout complete) | Currently disabled — re-enable before launch once admin users have TOTP set up. |
| rez-backend | `LOG_OTP_FOR_TESTING` | `true` | `false` | OTPs should not be logged in production. Flag left on from staging. |
| rez-backend | `SMS_TEST_MODE` | conflicting values seen (`true` AND `false`) | `false` for production | Two `SMS_TEST_MODE` entries in env — Render takes one, but ambiguous. Clean up to a single `false`. |

## Secret Rotation Checklist (before public launch)

All of these secrets need fresh values before `www.rez.money` goes live:

- [ ] MongoDB Atlas — Database Access → rotate `work_db_user` password, update `MONGODB_URI` everywhere
- [ ] Render — regenerate: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_MERCHANT_SECRET`, `JWT_ADMIN_SECRET`, `OTP_HMAC_SECRET`, `TOTP_ENCRYPTION_KEY`, `COOKIE_SECRET`, `REDIS_SESSION_SECRET`, `RECEIPT_TOKEN_SECRET`, `INTERNAL_SERVICE_KEY`, `INTERNAL_SERVICE_TOKEN`, `PAYMENT_SERVICE_INTERNAL_TOKEN`, `ADBAZAAR_INTERNAL_KEY`, `ADBAZAAR_WEBHOOK_SECRET`, `RENDEZ_WEBHOOK_SECRET`, `REZ_OTA_WEBHOOK_SECRET`
- [ ] Encryption keys that touch stored data — rotate carefully with re-encryption plan: `ENCRYPTION_KEY`, `WALLET_BALANCE_ENCRYPTION_KEY`, `GIFT_CARD_ENCRYPTION_KEY`
- [ ] SendGrid — regenerate API key, update `SENDGRID_API_KEY`
- [ ] Twilio — regenerate auth token, update `TWILIO_AUTH_TOKEN`
- [ ] Cloudinary — regenerate API secret, update `CLOUDINARY_API_SECRET`
- [ ] Firebase — regenerate service account private key, update `FIREBASE_PRIVATE_KEY`
- [ ] Razorpay — replace test keys with live keys (`rzp_test_*` → `rzp_live_*`) in `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- [ ] OpenCage — regenerate API key, update `OPENCAGE_API_KEY`
- [ ] Sentry — regenerate DSN (optional, lower risk)
- [ ] GitHub — revoke any leaked PAT, regenerate scoped tokens only in GH Actions secrets

After rotating JWT and session secrets, all existing user sessions will be invalidated — users will need to log in again. This is expected.

---

## CorpPerks Environment Variables

### rez-hotel-service (Makcorps)
```
PORT=4011
MAKCORPS_API_URL=https://api.makcorps.com
MAKCORPS_API_KEY=<GET FROM MAKCORPS>
MAKCORPS_CLIENT_ID=<GET FROM MAKCORPS>
MAKCORPS_CLIENT_SECRET=<GET FROM MAKCORPS>
```

### rez-procurement-service (NextaBizz)
```
PORT=4012
NEXTABIZZ_API_URL=https://api.nextabizz.com
NEXTABIZZ_API_KEY=<GET FROM NEXTABIZZ>
NEXTABIZZ_CLIENT_ID=<GET FROM NEXTABIZZ>
NEXTABIZZ_CLIENT_SECRET=<GET FROM NEXTABIZZ>
```

### CorpPerks Admin (Vercel)
```
EXPO_PUBLIC_CORP_SERVICE_URL=https://corp-api.rez.money
EXPO_PUBLIC_KARMA_SERVICE_URL=https://karma.rez.money
EXPO_PUBLIC_HOTEL_OTA_URL=https://api.hotel.rez.money
```

### RTMN Finance
```
RTMN_WALLET_URL=https://wallet.rtmn.money
RTMN_BNPL_URL=https://bnpl.rtmn.money
RTMN_API_KEY=<GET FROM RTMN>
```
