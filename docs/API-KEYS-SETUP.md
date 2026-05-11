# API Keys & Domain Setup Guide
**Date:** May 4, 2026

---

# PART 1: API KEYS SETUP

## Required API Keys

### 1. Payment Gateway

| Service | Variable | Where to Get |
|---------|----------|--------------|
| **Razorpay** | `RAZORPAY_KEY_ID` | https://dashboard.razorpay.com/app/keys |
| **Razorpay** | `RAZORPAY_KEY_SECRET` | https://dashboard.razorpay.com/app/keys |
| **Razorpay Webhook** | `RAZORPAY_WEBHOOK_SECRET` | Dashboard → Webhooks |

### 2. SMS/OTP

| Service | Variable | Where to Get |
|---------|----------|--------------|
| **Twilio** | `TWILIO_ACCOUNT_SID` | https://console.twilio.com |
| **Twilio** | `TWILIO_AUTH_TOKEN` | https://console.twilio.com |
| **Twilio** | `TWILIO_PHONE_NUMBER` | https://console.twilio.com |
| **Msg91** | `MSG91_API_KEY` | https://msg91.com |
| **Fast2SMS** | `FAST2SMS_API_KEY` | https://www.fast2sms.com |

### 3. WhatsApp

| Service | Variable | Where to Get |
|---------|----------|--------------|
| **Meta WhatsApp** | `WHATSAPP_PHONE_NUMBER_ID` | https://business.facebook.com |
| **Meta WhatsApp** | `WHATSAPP_ACCESS_TOKEN` | https://business.facebook.com |
| **Gupshup** | `GUPSHUP_API_KEY` | https://www.gupshup.io |

### 4. AI/ML

| Service | Variable | Where to Get |
|---------|----------|--------------|
| **OpenAI** | `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| **Anthropic** | `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| **Google AI** | `GOOGLE_AI_API_KEY` | https://makersuite.google.com/app/apikey |

### 5. Maps/Location

| Service | Variable | Where to Get |
|---------|----------|--------------|
| **Google Maps** | `GOOGLE_MAPS_API_KEY` | https://console.cloud.google.com/apis |
| **Mapbox** | `MAPBOX_ACCESS_TOKEN` | https://account.mapbox.com |
| **LocationIQ** | `LOCATIONIQ_API_KEY` | https://my.locationiq.com |

### 6. Cloud Storage

| Service | Variable | Where to Get |
|---------|----------|--------------|
| **AWS S3** | `AWS_ACCESS_KEY_ID` | https://console.aws.amazon.com |
| **AWS S3** | `AWS_SECRET_ACCESS_KEY` | https://console.aws.amazon.com |
| **AWS S3** | `AWS_S3_BUCKET` | Create in S3 |
| **Cloudinary** | `CLOUDINARY_URL` | https://cloudinary.com/console |
| **Firebase** | `FIREBASE_CONFIG` | https://console.firebase.google.com |

### 7. Email

| Service | Variable | Where to Get |
|---------|----------|--------------|
| **SendGrid** | `SENDGRID_API_KEY` | https://app.sendgrid.com/settings/api_keys |
| **AWS SES** | `AWS_SES_ACCESS_KEY` | AWS Console |
| **Mailgun** | `MAILGUN_API_KEY` | https://app.mailgun.com |

---

## Generate Secure Secrets

```bash
# Generate JWT Secret (64 chars)
openssl rand -base64 64

# Generate Internal Service Token
openssl rand -hex 32

# Generate HMAC Secret
openssl rand -base64 32

# Generate Webhook Secret
openssl rand -hex 32
```

---

## .env Template

Create `services/.env.production`:

```bash
# ===========================================
# REZ ECOSYSTEM - PRODUCTION ENV
# ===========================================

# ---- SERVER ----
NODE_ENV=production
PORT=4000

# ---- MONGODB ----
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez
MONGODB_PASSWORD=your-mongodb-password

# ---- REDIS ----
REDIS_URL=redis://:your-redis-password@redis-host:6379
REDIS_PASSWORD=your-redis-password

# ---- AUTH ----
JWT_SECRET=your-64-char-jwt-secret
JWT_MERCHANT_SECRET=your-merchant-secret
JWT_ADMIN_SECRET=your-admin-secret
INTERNAL_SERVICE_TOKENS_JSON={"auth":"token","wallet":"token","order":"token","payment":"token","finance":"token","merchant":"token"}

# ---- RAZORPAY ----
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=rzp_live_xxxxx
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# ---- SMS (Twilio) ----
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+15551234567

# ---- WHATSAPP ----
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-fb-access-token

# ---- AI ----
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-xxxxx

# ---- S3 ----
AWS_ACCESS_KEY_ID=AKIAxxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=ap-south-1
AWS_S3_BUCKET=rez-media

# ---- SENTRY ----
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# ---- CORS ----
CORS_ORIGIN=https://rez.money,https://app.rez.money,https://admin.rez.money
```

---

# PART 2: DOMAIN SETUP

## Required Domains

### Production Domains

| Domain | Service | Purpose |
|--------|---------|---------|
| `api.rez.money` | API Gateway | All API requests |
| `auth.rez.money` | Auth Service | Authentication |
| `wallet.rez.money` | Wallet Service | Wallet operations |
| `pay.rez.money` | Payment Service | Payments |
| `mind.rez.money` | Intent Graph | AI brain |
| `now.rez.money` | ReZ Now | QR payments |
| `menu.rez.money` | Web Menu | Restaurant ordering |
| `verify.rez.money` | Verify | Product auth |
| `try.rez.money` | ReZ Try | Trial discovery |
| `ads.rez.money` | Ads | Advertising |
| `corp.rez.money` | CorpPerks | B2B features |

### Subdomains to Configure

```
api.rez.money          → Load Balancer / API Gateway
auth.rez.money         → Auth Service (4002)
wallet.rez.money       → Wallet Service (4004)
pay.rez.money          → Payment Service (4001)
mind.rez.money         → Intent Graph (3007)
now.rez.money          → ReZ Now (3000)
menu.rez.money        → Web Menu
verify.rez.money       → Verify Service (3001)
try.rez.money          → ReZ Try
```

---

## DNS Configuration

### Cloudflare / DNS Provider Setup

```bash
# A Records
api.rez.money          → 300.300.300.1 (Load Balancer IP)
auth.rez.money         → 300.300.300.2 (Auth Service)
wallet.rez.money       → 300.300.300.3 (Wallet Service)
pay.rez.money          → 300.300.300.4 (Payment Service)
mind.rez.money         → 300.300.300.5 (Intent Graph)

# CNAMEs
now.rez.money          → api.rez.money
menu.rez.money         → api.rez.money
verify.rez.money       → api.rez.money
try.rez.money          → api.rez.money
ads.rez.money          → api.rez.money
corp.rez.money        → api.rez.money

# Wildcard for mobile apps
*.rez.money            → api.rez.money
```

---

## SSL/HTTPS Setup

### Option 1: Cloudflare (Recommended)

```bash
# In Cloudflare dashboard:
# 1. Enable "Full" SSL mode
# 2. Enable "Always Use HTTPS"
# 3. Enable "HTTP Strict Transport Security"
```

### Option 2: Let's Encrypt (Self-hosted)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d api.rez.money -d auth.rez.money -d wallet.rez.money
```

### Option 3: AWS ACM (for AWS)

```bash
# Request certificate in ACM
aws acm request-certificate \
  --domain-name "rez.money" \
  --subject-alternative-names "*.rez.money"
```

---

## Nginx Configuration

Create `/etc/nginx/sites-available/rez`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

# API Gateway
server {
    listen 80;
    server_name api.rez.money;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.rez.money;

    ssl_certificate /etc/ssl/certs/rez.crt;
    ssl_certificate_key /etc/ssl/private/rez.key;

    # Rate limiting
    limit_req zone=api burst=200 nodelay;

    # Auth Service
    location /auth/ {
        proxy_pass http://localhost:4002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Wallet Service
    location /wallet/ {
        proxy_pass http://localhost:4004/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Payment Service
    location /payment/ {
        proxy_pass http://localhost:4001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Finance Service
    location /finance/ {
        proxy_pass http://localhost:4006/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Default - API Gateway
    location / {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## Service URLs for Production

```bash
# These should point to internal network or localhost in production

# Staging
AUTH_SERVICE_URL=http://auth.rez.money
WALLET_SERVICE_URL=http://wallet.rez.money
PAYMENT_SERVICE_URL=http://pay.rez.money
FINANCE_SERVICE_URL=http://finance.rez.money
INTENT_CAPTURE_URL=http://mind.rez.money

# Production (internal)
AUTH_SERVICE_URL=http://auth-service:4002
WALLET_SERVICE_URL=http://wallet-service:4004
PAYMENT_SERVICE_URL=http://payment-service:4001
FINANCE_SERVICE_URL=http://finance-service:4006
INTENT_CAPTURE_URL=http://intent-graph:3007
```

---

## Render.com Setup (Alternative to Docker)

If using Render:

```bash
# Create Blueprint
# render.yaml
services:
  - type: web
    name: auth-service
    env: node
    region: singapore
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
```

---

## Checklist

### API Keys
- [ ] Razorpay keys configured
- [ ] SMS API keys configured
- [ ] WhatsApp API configured
- [ ] AI API keys configured
- [ ] Cloud storage configured
- [ ] JWT secrets generated
- [ ] Internal tokens generated
- [ ] Webhook secrets configured

### Domains
- [ ] DNS A records created
- [ ] CNAMEs configured
- [ ] SSL certificates issued
- [ ] HTTPS enforced
- [ ] Nginx/reverse proxy configured
- [ ] Service URLs updated
- [ ] CORS origins configured

### Security
- [ ] .env files secured (not in git)
- [ ] Secrets rotated
- [ ] Rate limiting enabled
- [ ] Firewall configured
- [ ] Monitoring enabled

---

## Next Steps

1. **Get all API keys** from respective dashboards
2. **Update .env files** with real values
3. **Configure DNS** in your DNS provider
4. **Set up SSL** certificates
5. **Update service URLs** to production domains
6. **Deploy services**

---

*Setup Guide - May 4, 2026*
