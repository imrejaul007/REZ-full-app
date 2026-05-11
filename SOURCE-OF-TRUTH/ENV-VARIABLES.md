# REZ Platform - Environment Variables Reference

This document lists all environment variables needed across the REZ platform ecosystem.

---

## Consumer Apps (Expo/React Native)

### REZ Consumer App (`rez-app-consumer/`)

```bash
# ===================
# API Configuration
# ===================
EXPO_PUBLIC_API_BASE_URL=https://rez-api-gateway.onrender.com/api
EXPO_PUBLIC_GATEWAY_URL=https://rez-api-gateway.onrender.com
EXPO_PUBLIC_BACKEND_URL=https://rez-backend-8dfu.onrender.com
EXPO_PUBLIC_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com

# ===================
# Third-Party API Keys
# ===================
# Google Maps (required for store locator, directions)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy__________________

# OpenCage (required for geocoding)
EXPO_PUBLIC_OPENCAGE_API_KEY=__________________________

# Razorpay (required for payments)
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_live_________________
EXPO_PUBLIC_RAZORPAY_KEY_ID_LIVE=rzp_live_________________
EXPO_PUBLIC_ENABLE_RAZORPAY=true

# Firebase (required for push notifications)
EXPO_PUBLIC_FIREBASE_API_KEY=__________________________
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=rez-app-e450d.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=rez-app-e450d
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=rez-app-e450d.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=79574420495
EXPO_PUBLIC_FIREBASE_APP_ID=1:79574420495:android:49759a0a04443106c8277a

# Cloudinary (required for image/video uploads)
EXPO_PUBLIC_CLOUDINARY_API_KEY=________________________
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dgqqkrsha
EXPO_PUBLIC_CLOUDINARY_UGC_PRESET=ugc_videos
EXPO_PUBLIC_CLOUDINARY_PROFILE_PRESET=profile_images
EXPO_PUBLIC_CLOUDINARY_REVIEW_PRESET=review_media
EXPO_PUBLIC_CLOUDINARY_IMAGE_PRESET=general_images

# ===================
# App Store Submission (eas.json)
# ===================
# For iOS submission - add to eas.json submit.production.ios:
ASC_APP_ID_CONSUMER=________________  # From App Store Connect
APPLE_TEAM_ID_CONSUMER=________________  # From Apple Developer

# For Android - download google-service-account.json and place in:
# rez-app-consumer/google-service-account.json
```

### REZ Admin App (`rez-app-admin/`)

```bash
# ===================
# API Configuration
# ===================
EXPO_PUBLIC_API_BASE_URL=https://rez-api-gateway.onrender.com/api
EXPO_PUBLIC_GATEWAY_URL=https://rez-api-gateway.onrender.com
EXPO_PUBLIC_BACKEND_URL=https://rez-backend-8dfu.onrender.com
EXPO_PUBLIC_MERCHANT_SERVICE_URL=https://rez-merchant-service-n3q2.onrender.com

# ===================
# App Store Submission (eas.json)
# ===================
ASC_APP_ID_ADMIN=________________  # From App Store Connect
APPLE_TEAM_ID_ADMIN=________________  # From Apple Developer

# Place google-service-account.json in:
# rez-app-admin/google-service-account.json
```

---

## Backend Services

### REZ Auth Service (`rez-auth-service/`)

```bash
# ===================
# Required (FATAL - service won't start)
# ===================
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez_auth
REDIS_URL=redis://redis-host:6379
JWT_SECRET=__________________________  # 64+ char random string
JWT_REFRESH_SECRET=__________________________  # 64+ char random string
JWT_ADMIN_SECRET=__________________________
JWT_MERCHANT_SECRET=__________________________
OTP_HMAC_SECRET=__________________________
INTERNAL_SERVICE_TOKENS_JSON={"token-name":"token-value"}

# ===================
# Optional
# ===================
SENTRY_DSN=https://________________@sentry.io/________________
SENTRY_TRACES_SAMPLE_RATE=0.1
PORT=4002
HEALTH_PORT=4102
CORS_ORIGIN=https://rez.money,https://www.rez.money,https://admin.rez.money

# ===================
# OAuth Partner Configuration
# ===================
PARTNER_RENDEZ_CLIENT_ID=rendez-app
PARTNER_RENDEZ_CLIENT_SECRET=__________________________
PARTNER_RENDEZ_REDIRECT_URI=https://rendez-app.vercel.app/api/auth/callback

PARTNER_STAY_OWEN_CLIENT_ID=stay-owen
PARTNER_STAY_OWEN_CLIENT_SECRET=__________________________
PARTNER_STAY_OWEN_REDIRECT_URI=https://hotel-ota.vercel.app/api/auth/callback

PARTNER_ADBAZAAR_CLIENT_ID=adbazaar
PARTNER_ADBAZAAR_CLIENT_SECRET=__________________________
PARTNER_ADBAZAAR_REDIRECT_URI=https://adbazaar.vercel.app/api/auth/callback

OAUTH_AUTHORIZE_BASE_URL=https://rez-auth-service.onrender.com
```

### REZ Merchant Service (`rez-merchant-service/`)

```bash
# ===================
# Required
# ===================
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez_merchant
REDIS_URL=redis://redis-host:6379
PORT=4001

# ===================
# Internal Services
# ===================
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
REZ_BACKEND_URL=https://rez-backend-8dfu.onrender.com

# ===================
# NextaBiZ Webhook Integration
# ===================
# Secret for verifying NextaBiZ webhook signatures
REZ_MERCHANT_WEBHOOK_SECRET=__________________________

# ===================
# Optional
# ===================
SENTRY_DSN=https://________________@sentry.io/________________
```

---

## Partner Apps

### Rendez (`Rendez/`)

```bash
# ===================
# Backend (.env.example in rendez-backend/)
# ===================
DATABASE_URL=postgresql://user:pass@host/rez_rendez
REDIS_URL=redis://redis-host:6379

# REZ Integration
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com

# OAuth (for REZ SSO)
OAUTH_CLIENT_ID=rendez-app
OAUTH_CLIENT_SECRET=__________________________
OAUTH_REDIRECT_URI=https://rendez-app.vercel.app/api/auth/callback

# ===================
# Frontend (.env in rendez-app/)
# ===================
NEXT_PUBLIC_API_URL=https://rendez-api.onrender.com
NEXT_PUBLIC_REZ_AUTH_URL=https://rez-auth-service.onrender.com
```

### AdBazaar (`adBazaar/`)

```bash
# ===================
# Backend
# ===================
DATABASE_URL=postgresql://user:pass@host/rez_adbazaar
REDIS_URL=redis://redis-host:6379

# REZ Integration
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
REZ_MERCHANT_SERVICE_URL=https://rez-merchant-service-n3q2.onrender.com

# ===================
# Frontend
# ===================
NEXT_PUBLIC_API_URL=https://adbazaar-api.onrender.com
```

### Hotel OTA (`Hotel OTA/apps/api/`)

```bash
# ===================
# API Service
# ===================
DATABASE_URL=postgresql://user:pass@host/rez_hotel_ota
REDIS_URL=redis://redis-host:6379

# REZ Integration
REZ_AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
REZ_WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
REZ_MERCHANT_SERVICE_URL=https://rez-merchant-service-n3q2.onrender.com

# OAuth (for REZ SSO)
PARTNER_STAY_OWEN_CLIENT_ID=stay-owen
PARTNER_STAY_OWEN_CLIENT_SECRET=__________________________

# ===================
# URLs for CORS
# ===================
FRONTEND_URL=https://hotel-ota.vercel.app
HOTEL_PANEL_URL=https://hotel-panel.vercel.app
ADMIN_PANEL_URL=https://admin.rez.money
```

---

## NextaBiZ (`nextabizz/`)

```bash
# ===================
# Reorder Engine Service
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=__________________________

# REZ Merchant Webhook
REZ_MERCHANT_WEBHOOK_URL=https://rez-merchant-service.onrender.com/internal/nextabizz/reorder-signal
REZ_MERCHANT_WEBHOOK_SECRET=__________________________
```

---

## Quick Setup Checklist

| Variable | Source | Status |
|----------|--------|--------|
| Google Maps API Key | [Google Cloud Console](https://console.cloud.google.com) | ☐ |
| OpenCage API Key | [OpenCage](https://opencagedata.com) | ☐ |
| Razorpay Live Keys | [Razorpay Dashboard](https://dashboard.razorpay.com) | ☐ |
| Firebase Web API Key | [Firebase Console](https://console.firebase.google.com) | ☐ |
| Cloudinary API Key | [Cloudinary Dashboard](https://cloudinary.com/console) | ☐ |
| Apple App Store Connect | [App Store Connect](https://appstoreconnect.apple.com) | ☐ |
| Google Service Account | [Play Console](https://play.google.com/console) | ☐ |
| OAuth Partner Secrets | Generated & stored securely | ☐ |
| NextaBiZ Webhook Secret | Generated & shared with NextaBiZ | ☐ |

---

## Secrets Generation

```bash
# Generate secure secrets
openssl rand -hex 32  # For JWT secrets
openssl rand -hex 16  # For HMAC secrets
uuidgen              # For API keys
```

---

## Security Notes

1. **Never commit .env files** - Only commit .env.example or .env.template
2. **Use different secrets** for each environment (dev/staging/prod)
3. **Rotate secrets** periodically and after any potential exposure
4. **Use secret managers** (AWS Secrets Manager, HashiCorp Vault) for production
5. **Webhook secrets** should be shared securely with partner services
