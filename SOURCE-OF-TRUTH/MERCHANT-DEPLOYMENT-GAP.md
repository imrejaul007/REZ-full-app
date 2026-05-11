# MERCHANT APP - DEPLOYMENT CHECKLIST
**Date:** May 7, 2026

---

## ✅ ALREADY BUILT

### Frontend (rez-app-merchant)
- 374 screens
- 25 services (API clients)
- All connected to backend URLs

### Backend (rez-merchant-service)
- 13 routers implemented
- Core, Orders, Campaigns, Analytics, Finance, Staff, Operations, etc.

---

## ❌ WHAT NEEDS TO BE DONE

### 1. Add Missing Routes to Backend

Routes needed by frontend that may NOT be in backend:

| Route | Frontend Service | Backend Router |
|-------|----------------|---------------|
| `GET /appointments` | appointmentsService | ? |
| `POST /appointments` | appointmentsService | ? |
| `GET /tables` | dineInService | ? |
| `POST /tables` | dineInService | ? |
| `GET /subscriptions` | subscriptionService | ? |
| `POST /subscriptions` | subscriptionService | ? |
| `GET /notifications` | notificationService | ? |
| `POST /notifications` | notificationService | ? |

### 2. Test Each Service Connection

| Service | Test Needed |
|--------|------------|
| hotelService | Test room CRUD |
| dineInService | Test table CRUD |
| appointmentsService | Test booking flow |
| subscriptionService | Test membership |
| marketingService | Test offers |
| loyaltyService | Test points |
| notificationService | Test push |
| adService | Test campaigns |
| analyticsService | Test insights |
| automationService | Test workflows |
| inventoryService | Test stock |
| staffService | Test staff |
| qrCodeService | Test QR |

### 3. Environment Variables

Need in rez-merchant-service:
```bash
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=...
```

---

## 🚀 DEPLOY STEPS

### Step 1: Deploy Backend
```bash
cd rez-merchant-service
npm run build
npm start
```

### Step 2: Deploy Frontend
```bash
cd rez-app-merchant
eas build
```

### Step 3: Test Each Module
- Test orders flow
- Test products flow
- Test appointments flow
- Test payments flow
- Test loyalty flow

---

## CHECKLIST

```
PRE-DEPLOYMENT:
□ Add missing routes to backend
□ Test each API endpoint
□ Set environment variables
□ Configure CORS

DEPLOYMENT:
□ Deploy rez-merchant-service
□ Deploy rez-auth-service
□ Deploy rez-wallet-service
□ Deploy rez-payment-service
□ Deploy rez-order-service
□ Build rez-app-merchant

POST-DEPLOYMENT:
□ Test auth flow
□ Test order creation
□ Test payment
□ Test wallet
□ Test loyalty
□ Test notifications
```

---

## ESTIMATED TIME

| Task | Time |
|------|------|
| Add missing routes | 2-4 hours |
| Test connections | 4-8 hours |
| Deploy | 1-2 hours |
| **Total** | **1-2 days** |
