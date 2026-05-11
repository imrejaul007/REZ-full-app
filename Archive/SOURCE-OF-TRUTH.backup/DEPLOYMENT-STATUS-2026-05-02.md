# Deployment Status - 2026-05-02

**Status:** All Services Ready for Deployment

---

## GitHub Repos Created/Pushed

| Service | GitHub | Status |
|---------|--------|--------|
| rez-student-service | https://github.com/imrejaul007/rez-student-service | ✅ Pushed |
| rez-corporate-service | https://github.com/imrejaul007/rez-corporate-service | ✅ Pushed |
| rez-merchant-integrations | https://github.com/imrejaul007/rez-merchant-integrations | ✅ Pushed |
| REZ-merchant-copilot | https://github.com/imrejaul007/REZ-merchant-copilot | ✅ Updated |

---

## Render Blueprints Ready

Each service has `render.yaml` for one-click deployment:

### rez-student-service
```bash
gh workflow create --repo imrejaul007/rez-student-service
# Upload render.yaml as blueprint
```

### rez-corporate-service
```bash
gh workflow create --repo imrejaul007/rez-corporate-service
# Upload render.yaml as blueprint
```

### rez-merchant-integrations
```bash
gh workflow create --repo imrejaul007/rez-merchant-integrations
# Upload render.yaml as blueprint
```

---

## Deployment Order

```
1. rez-student-service (4025)
   └── MongoDB: rez-student

2. rez-corporate-service (4030)
   └── MongoDB: rez-corporate

3. rez-merchant-integrations (4040)
   └── No MongoDB (stateless)

4. REZ-merchant-copilot (update)
   └── Redeploy with new env vars
```

---

## Environment Variables Required

### rez-student-service
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-student
PORT=4025
WALLET_SERVICE_URL=https://rez-wallet-service.onrender.com
GAMIFICATION_SERVICE_URL=https://rez-gamification-service.onrender.com
NOTIFICATION_SERVICE_URL=https://rez-push-service.onrender.com
```

### rez-corporate-service
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/rez-corporate
PORT=4030
TBO_API_KEY=<from TBO>
TBO_API_SECRET=<from TBO>
RAZORPAY_KEY_ID=<from Razorpay>
RAZORPAY_KEY_SECRET=<from Razorpay>
```

### rez-merchant-integrations
```
PORT=4040
MERCHANT_SERVICE_URL=https://rez-merchant-service.onrender.com
ORDER_SERVICE_URL=https://rez-order-service.onrender.com
SWIGGY_API_KEY=<from Swiggy>
ZOMATO_API_KEY=<from Zomato>
DUNZO_API_KEY=<from Dunzo>
SHADOWFAX_API_KEY=<from Shadowfax>
```

---

## App Updates

### rez-app-consumer
- Added `src/services/student/studentService.ts`
- Added `src/screens/student/StudentVerifyScreen.tsx`
- Added `src/screens/student/StudentProfileScreen.tsx`

### rez-app-merchant
- Added `src/services/merchantCopilotService.ts`

---

## API Endpoints Summary

### Student Service (4025)
```
POST /api/student/verify
GET  /api/student/verification-status
GET  /api/student/institutions
GET  /api/student/wallet
POST /api/student/wallet/request-funding
GET  /api/student/profile
GET  /api/student/missions
POST /api/student/missions/:id/claim
GET  /api/student/leaderboard/:institutionId
GET  /api/student/offers/:institutionId
POST /api/student/redeem
POST /api/student/price
GET  /api/student/affordable
POST /api/student/referral/apply
```

### Corporate Service (4030)
```
POST /api/corporate/hris/connections
POST /api/corporate/hris/connections/:id/connect
POST /api/corporate/hris/connections/:id/sync
GET  /api/corporate/employees/:companyId
POST /api/corporate/cards
POST /api/corporate/cards/:id/block
GET  /api/corporate/cards/transactions/:companyId
POST /api/corporate/gst/invoices
POST /api/corporate/gst/invoices/:id/irn
POST /api/corporate/travel/requests
POST /api/corporate/travel/bookings/hotel
GET  /api/corporate/travel/bookings/:employeeId
```

### Merchant Integrations (4040)
```
POST /api/ads/track/click
POST /api/ads/track/view
POST /api/ads/track/conversion
GET  /api/ads/campaign/:id/roi
GET  /api/ads/merchant/:id/performance
POST /api/aggregators/register
GET  /api/aggregators/orders
POST /api/aggregators/:id/status
POST /api/delivery/quotes
POST /api/delivery/book
GET  /api/delivery/:id/track
POST /api/delivery/:id/cancel
```

---

## Next Steps

1. **Deploy to Render**
   - Go to https://dashboard.render.com/blueprints
   - Connect each repo
   - Add environment variables

2. **Configure APIs**
   - Get Swiggy/Zomato API keys
   - Get Dunzo/Shadowfax credentials
   - Get TBO travel API access
   - Set up Razorpay corporate cards

3. **Update App Environment**
   ```env
   REZ_STUDENT_SERVICE_URL=https://rez-student-service.onrender.com
   REZ_CORPORATE_SERVICE_URL=https://rez-corporate-service.onrender.com
   REZ_MERCHANT_INTEGRATIONS_URL=https://rez-merchant-integrations.onrender.com
   ```

4. **Test Integrations**
   - Test student verification flow
   - Test HRIS connection
   - Test card issuing
   - Test aggregator sync

---

**Status:** ✅ All code pushed, blueprints ready
**Ready for:** Deployment
