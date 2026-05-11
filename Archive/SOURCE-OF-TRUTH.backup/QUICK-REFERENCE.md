# REZ Mind - Quick Reference Card

**For Developers - Deploy in 30 minutes**

---

## STEP 1: Deploy Event Platform (5 mins)

```
1. Go to https://dashboard.render.com
2. New > Web Service
3. Connect: https://github.com/imrejaul007/REZ-event-platform
4. Settings:
   - Name: rez-event-platform
   - Region: Singapore
   - Build: npm install
   - Start: npx ts-node src/index-simple.ts
5. Env Vars:
   MONGODB_URI=mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez-events
```

---

## STEP 2: Deploy Other Services (15 mins)

Run these in parallel:

```
Service 1: REZ-action-engine
Repo: https://github.com/imrejaul007/REZ-action-engine
Start: npx ts-node src/index-adaptive.ts

Service 2: REZ-feedback-service
Repo: https://github.com/imrejaul007/REZ-feedback-service
Build: npm install && npm run build
Start: node dist/index-learning.js

Service 3: REZ-user-intelligence-service
Repo: https://github.com/imrejaul007/REZ-user-intelligence-service
Start: npm run dev

Service 4: REZ-merchant-intelligence-service
Repo: https://github.com/imrejaul007/REZ-merchant-intelligence-service
Start: npm run dev
```

---

## STEP 3: Update App Env Vars (2 mins)

```bash
# After Event Platform is live, add this to each app:

REZ_MIND_URL=https://rez-event-platform.onrender.com
# or
EXPO_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
# or
NEXT_PUBLIC_REZ_MIND_URL=https://rez-event-platform.onrender.com
```

---

## STEP 4: Verify (1 min)

```bash
# Test Event Platform
curl https://rez-event-platform.onrender.com/health

# Send test event
curl -X POST https://rez-event-platform.onrender.com/webhook/merchant/order \
  -H "Content-Type: application/json" \
  -d '{"merchant_id":"test","order_id":"123","total_amount":500}'
```

---

## Webhook Endpoints

```
POST /webhook/merchant/order      - Order received
POST /webhook/merchant/inventory  - Inventory low
POST /webhook/merchant/payment    - Payment received
POST /webhook/consumer/order      - Consumer order
POST /webhook/consumer/search      - Consumer search
POST /webhook/consumer/view        - Consumer view
POST /webhook/consumer/booking    - Consumer booking
POST /webhook/consumer/scan       - QR scan
```

---

## Already Integrated Apps (Code Ready)

| App | GitHub | Action |
|-----|--------|--------|
| rez-order-service | rez-order-service | Add REZ_MIND_URL env var |
| rez-search-service | rez-search-service | Add REZ_MIND_URL env var |
| rez-app-consumer | rez-app-consumer | Add EXPO_PUBLIC_REZ_MIND_URL |
| rez-app-merchant | rez-app-marchant | Add EXPO_PUBLIC_REZ_MIND_URL |
| rez-now | rez-now | Add NEXT_PUBLIC_REZ_MIND_URL |

---

## Dashboard URLs (After Deploy)

```
Merchant Copilot: https://rez-merchant-copilot.onrender.com/dashboard
Consumer Copilot: https://rez-consumer-copilot.onrender.com/dashboard
AdBazaar:         https://rez-adbazaar.onrender.com/dashboard
```

---

## Need Help?

Check these docs:
- `SOURCE-OF-TRUTH/DEPLOYMENT-README.md` - Full guide
- `SOURCE-OF-TRUTH/REPOS.md` - All repos
- `SOURCE-OF-TRUTH/REZ-MIND.md` - Architecture
