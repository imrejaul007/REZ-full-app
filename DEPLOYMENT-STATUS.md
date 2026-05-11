# ReZ Ecosystem - Deployment Quick Reference

## ✅ Already Deployed (Vercel)

| System | URL | Command |
|--------|-----|---------|
| adBazaar | https://ad-bazaar.vercel.app | Auto-deployed |
| adsqr | https://adsqr.vercel.app | Auto-deployed |
| creators | https://creators.vercel.app | Auto-deployed |
| dooh-screen-app | (same as creators) | Auto-deployed |
| verify-service | (same as creators) | Auto-deployed |
| nextabizz | https://web-6n4fnj718-re-z.vercel.app | Auto-deployed |

---

## 🔧 Manual Deploy (Render)

### Hotel OTA
```bash
cd "Hotel OTA"
render deploy --service=hotel-ota-api --yes
```
**OR** Use Render Dashboard → Blueprint → Select `Hotel OTA/render.yaml`

### CorpPerks
```bash
cd CorpPerks
./deploy.sh
```
**OR** Use Render Dashboard → New Web Service

### Restaurant AI
```bash
cd rez-ai-restaurant
./deploy.sh
```
**OR** Use Render Dashboard → New Background Worker

---

## 📁 Scripts Created

| Script | Purpose |
|--------|---------|
| `./DEPLOY-ALL.sh` | Deploy all Vercel systems |
| `Hotel OTA/deploy.sh` | Deploy Hotel OTA to Render |
| `CorpPerks/deploy.sh` | Deploy CorpPerks to Render |
| `rez-ai-restaurant/deploy.sh` | Deploy Restaurant AI to Render |

---

## 📋 Render Setup Checklist

Before deploying to Render:

- [ ] Create Render account at render.com
- [ ] Connect GitHub repository
- [ ] Create PostgreSQL database
- [ ] Create Redis instance
- [ ] Generate secrets:
  ```bash
  openssl rand -base64 48
  ```
- [ ] Set environment variables (see RENDER_DEPLOY.md)

---

## 🔗 Required Environment Variables

### Hotel OTA
```
DATABASE_URL=postgresql://...
JWT_SECRET=<generated>
REDIS_URL=redis://...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
```

### CorpPerks
```
DATABASE_URL=postgresql://...
JWT_SECRET=<generated>
```

### Restaurant AI
```
MONGODB_URI=mongodb://...
```

---

## 🆘 Troubleshooting

### Build fails on Vercel
```bash
# Check package.json scripts
# Ensure all dependencies are listed
npm install --save-dev eslint
```

### Build fails on Render
```bash
# Clear Render cache
render deploy --no-cache
```

### Database connection fails
```bash
# Verify DATABASE_URL format
# Check SSL requirements for production
```

---

## 📊 Deployment Status

| System | Platform | Status |
|--------|----------|--------|
| adBazaar | Vercel | ✅ Deployed |
| adsqr | Vercel | ✅ Deployed |
| creators | Vercel | ✅ Deployed |
| dooh-screen-app | Vercel | ✅ Deployed |
| verify-service | Vercel | ✅ Deployed |
| nextabizz | Vercel | ✅ Deployed |
| Hotel OTA | Render | ⏳ Manual |
| CorpPerks | Render | ⏳ Manual |
| Restaurant AI | Render | ⏳ Manual |
| REZ Mind | N/A | 📦 Library |
