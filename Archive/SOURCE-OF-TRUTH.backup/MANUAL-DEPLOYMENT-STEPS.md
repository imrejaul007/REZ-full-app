# MANUAL DEPLOYMENT STEPS
**Status:** Automation Created - Manual Steps Documented Here
**Version:** 1.0
**Date:** May 6, 2026

---

## OVERVIEW

This document lists **ONLY** the steps that MUST be done manually. Everything else is automated.

### What is Automated ✅
- Docker deployment
- CI/CD pipelines
- Health checks
- Service startup scripts
- Database migrations

### What is Manual ⚠️
- Cloud account setup
- API keys configuration
- Domain configuration
- Third-party service credentials
- Payment gateway approval
- SSL certificates (for production)

---

## MANDATORY MANUAL STEPS

Complete these steps before running any automation.

---

## 1. CLOUD INFRASTRUCTURE SETUP

### 1.1 MongoDB Atlas Setup

**URL:** https://cloud.mongodb.com

**Steps:**
1. Create account at https://cloud.mongodb.com
2. Click "Build a Database"
3. Select **Free Tier (M0)**
4. Choose Region: **Mumbai (ap-south-1)** - closest to users
5. Click "Create Cluster"
6. Wait 5-10 minutes for provisioning
7. Click "Database Access" → "Add New Database User"
   ```
   Username: rez_app_user
   Password: [Generate secure password - SAVE THIS]
   Database Privileges: readWrite
   ```
8. Click "Network Access" → "Add IP Address"
   - For development: Add `0.0.0.0/0`
   - For production: Add your server IP only
9. Click "Clusters" → "Connect" → "Connect your application"
10. Copy connection string:
    ```
    mongodb+srv://rez_app_user:<PASSWORD>@cluster0.xxxxx.mongodb.net/rez_auth?retryWrites=true&w=majority
    ```
11. **SAVE THIS CONNECTION STRING** - You'll need it for `.env` files

**Databases to create (after cluster is ready):**
```
Click "Collections" → "Create Database"
- rez_auth
- rez_wallet
- rez_payment
- rez_order
- rez_merchant
- rez_intent
- rez_user_intelligence
- rez_merchant_intelligence
- rez_ml_feature_store
- rez_ml_training
- rez_data_quality
- rez_retraining
- rez_bbps
- rez_recharge
- rez_einvoice
```

---

### 1.2 Redis Cloud Setup

**URL:** https://redis.com/cloud

**Steps:**
1. Create account at https://redis.com
2. Click "New Database"
3. Select **Redis Cloud** (free tier available)
4. Choose Region: **Mumbai (ap-south-1)**
5. Database Name: `rez-platform`
6. Click "Create Database"
7. Wait for provisioning
8. Click on your database → "Configuration"
9. Copy **Connection String**:
    ```
    redis://default:<PASSWORD>@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345
    ```
10. **SAVE THIS** - You'll need it for `.env` files

---

### 1.3 Server Setup (If self-hosting)

**For VPS/Cloud Server:**

1. Create Ubuntu 22.04 server (recommended: AWS EC2, DigitalOcean, Linode)
2. SSH into server:
   ```bash
   ssh root@your-server-ip
   ```
3. Install Docker:
   ```bash
   apt update
   apt install -y docker.io docker-compose
   systemctl start docker
   systemctl enable docker
   ```
4. Install Docker Compose:
   ```bash
   curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```
5. Install Node.js (if using npm instead of Docker):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   ```

---

## 2. PAYMENT GATEWAY SETUP

### 2.1 Razorpay (India)

**URL:** https://dashboard.razorpay.com

**Steps:**
1. Create account at https://dashboard.razorpay.com
2. Complete KYC verification (required)
3. Go to "Settings" → "API Keys"
4. Click "Generate API Key"
5. Copy:
   - **Key ID:** `rzp_live_xxxxxxxxxxxx`
   - **Key Secret:** `xxxxxxxxxxxxxxxxxxxxxxxx`
6. **SAVE THESE** - You'll need them for `.env` files

**For Testing:**
- Use Test Mode keys from Dashboard
- Test UPI: `success@razorpay`
- Test Card: `4111 1111 1111 1111`, any future expiry, any CVV

---

### 2.2 Stripe (International)

**URL:** https://dashboard.stripe.com

**Steps:**
1. Create account
2. Go to "Developers" → "API keys"
3. Copy:
   - **Publishable Key:** `pk_test_xxxxxxxxxxxx`
   - **Secret Key:** `sk_test_xxxxxxxxxxxx`
4. **SAVE THESE**

---

## 3. SMS/OTP PROVIDER SETUP

### 3.1 Twilio

**URL:** https://www.twilio.com/console

**Steps:**
1. Create account
2. Get a phone number (from "Phone Numbers" → "Get a Trial Number")
3. Go to "Account" → "API Credentials"
4. Copy:
   - **Account SID:** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
5. **SAVE THESE**

**For India (DND Numbers):**
Consider using:
- MSG91
- Plivo
- Sinch

---

## 4. NOTIFICATION PROVIDERS

### 4.1 Push Notifications (FCM)

**URL:** https://console.firebase.google.com

**Steps:**
1. Create project at https://console.firebase.google.com
2. Click "Project Settings" (gear icon)
3. Click "Cloud Messaging"
4. Copy:
   - **Server Key:** (under "Cloud Messaging API (Legacy)")
5. **SAVE THIS**

### 4.2 WhatsApp Business

**URL:** https://business.whatsapp.com

**Steps:**
1. Apply for WhatsApp Business API (takes 2-4 weeks)
2. Set up a Business Manager account
3. Get API credentials from your BSP (Business Solution Provider)
4. **This is complex - consider using a provider like:**
   - Twilio WhatsApp
   - Gupshup
   - Meta Business Partner

---

## 5. EMAIL SETUP

### 5.1 SMTP Configuration

**Option A: Gmail (Development only)**
1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Generate App Password for "Mail"
4. Copy the 16-character password

**Option B: SendGrid (Production)**
1. Create account at https://sendgrid.com
2. Verify your sender email
3. Go to "Settings" → "API Keys"
4. Create API Key with "Full Access"
5. Copy the key

**Option C: AWS SES (Production)**
1. Create AWS account
2. Go to SES service
3. Verify domain or email
4. Request production access (takes 24-48 hours)
5. Get SMTP credentials

---

## 6. BBPS SETUP (Bill Payments)

### 6.1 Bharat BillPay API

**URL:** https://www.bharatbillpay.com

**Steps:**
1. Apply for BBPS membership
2. Complete compliance requirements
3. Get API credentials:
   - **Client ID:** (from BBPS portal)
   - **Client Secret:** (from BBPS portal)
   - **Merchant ID:** (from BBPS portal)
4. Set up webhook endpoints for transaction updates
5. **This requires business registration and compliance**

---

## 7. E-INVOICE SETUP (GST)

### 7.1 GST Portal Registration

**URL:** https://www.gst.gov.in

**Steps:**
1. Ensure you have valid GSTIN
2. Register for e-Invoice under "e-Invoice" tab
3. Get credentials from NIC/GST portal
4. For production, you'll need:
   - **Username:** (from GST portal)
   - **Password:** (from GST portal)
   - **GSTIN:** your 15-digit GST number
   - **Client ID/Secret:** (from ASP/ERP vendor)

---

## 8. DOMAIN & SSL SETUP

### 8.1 Domain Configuration

1. Purchase domain: `rez.money` (or your choice)
2. Go to your domain registrar:
   - GoDaddy
   - Namecheap
   - Cloudflare

3. Add DNS records:
   ```
   Type    Name    Value                   TTL
   A       @       YOUR_SERVER_IP          300
   A       api     YOUR_SERVER_IP           300
   A       app     YOUR_SERVER_IP           300
   CNAME   www     your-domain.vercel.app  300
   ```

### 8.2 SSL Certificate (Let's Encrypt - Free)

```bash
# On your server
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d rez.money -d api.rez.money -d app.rez.money

# Auto-renew
certbot renew --dry-run
```

---

## 9. ENVIRONMENT FILES SETUP

After completing steps above, create `.env` files:

### 9.1 Copy Environment Template

```bash
cd "/Users/rejaulkarim/Documents/ReZ Full App"
cp .env.docker.example .env
```

### 9.2 Edit .env File

Open `.env` and fill in:

```bash
# ===================
# MONGODB (REQUIRED)
# ===================
# From step 1.1 - your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://rez_app_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net

# ===================
# REDIS (REQUIRED)
# ===================
# From step 1.2 - your Redis Cloud connection string
REDIS_URL=redis://default:YOUR_PASSWORD@redis-xxxxx.c999.us-east-1-0.ec2.cloud.redislabs.com:12345

# ===================
# SECURITY (REQUIRED)
# ===================
# Generate with: openssl rand -base64 32
JWT_SECRET=YOUR_32_CHARACTER_SECRET_KEY_HERE

# ===================
# CORS (REQUIRED)
# ===================
# Your frontend URLs
CORS_ORIGIN=http://localhost:3000,https://rez.money,https://app.rez.money

# ===================
# RAZORPAY (Optional - for payments)
# ===================
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# ===================
# TWILIO (Optional - for SMS)
# ===================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# ===================
# SENDGRID (Optional - for email)
# ===================
SENDGRID_API_KEY=REDACTED
```

---

## 10. VERIFICATION CHECKLIST

Complete these manual verifications:

### 10.1 Cloud Services

- [ ] MongoDB Atlas cluster created
- [ ] All 15 databases created
- [ ] Database user created with password
- [ ] Network access configured
- [ ] Redis Cloud database created
- [ ] Redis connection string saved

### 10.2 API Credentials

- [ ] Razorpay account created and verified
- [ ] API keys generated and saved
- [ ] Twilio account created (if using SMS)
- [ ] Auth token saved
- [ ] Firebase project created (if using push)

### 10.3 Domain & SSL

- [ ] Domain purchased
- [ ] DNS records configured
- [ ] SSL certificate installed
- [ ] HTTPS working

### 10.4 Environment Files

- [ ] `.env` file created
- [ ] MongoDB URI configured
- [ ] Redis URL configured
- [ ] JWT Secret configured
- [ ] Payment gateway keys configured (if using)

---

## 11. POST-MANUAL SETUP

After completing all manual steps above, run:

```bash
cd "/Users/rejaulkarim/Documents/ReZ Full App"

# Make scripts executable
chmod +x AUTO-DEPLOY.sh
chmod +x AUTO-HEALTH-CHECK.sh
chmod +x AUTO-TRAIN-ML.sh
chmod +x TEST-TRANSACTION-LOOP.sh

# Deploy everything
./AUTO-DEPLOY.sh

# Check health
./AUTO-HEALTH-CHECK.sh

# Run tests
./TEST-TRANSACTION-LOOP.sh
```

---

## 12. GETTING HELP

If you need help with any manual step:

### MongoDB Atlas
- Docs: https://docs.atlas.mongodb.com
- Support: https://mongodb.com/community

### Redis Cloud
- Docs: https://redis.io/docs
- Support: https://redis.com/docs

### Razorpay
- Docs: https://razorpay.com/docs
- Support: razorpay.com/support

### Twilio
- Docs: https://twilio.com/docs
- Support: https://support.twilio.com

---

## SUMMARY: MANUAL VS AUTOMATED

| Step | Manual | Automated |
|------|--------|-----------|
| MongoDB Setup | ✅ Yes | No |
| Redis Setup | ✅ Yes | No |
| Server Setup | ✅ Yes | No |
| API Keys | ✅ Yes | No |
| Domain/DNS | ✅ Yes | No |
| SSL Certificate | ✅ Yes | No |
| Service Deployment | No | ✅ Yes |
| Health Checks | No | ✅ Yes |
| CI/CD | No | ✅ Yes |
| Docker Compose | No | ✅ Yes |
| Database Migrations | No | ✅ Yes |

---

*Document Version: 1.0*
*Created: 2026-05-06*
