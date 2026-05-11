# DEPLOYMENT & GIT MIGRATION PLAN

## CURRENT STATE

### All services point to OLD repo: `REZ-intelligence-hub.git`
```
RTNM-Group → REZ-intelligence-hub.git (WRONG)
RABTUL-Technologies → REZ-intelligence-hub.git (WRONG)
REZ-Intelligence → REZ-intelligence-hub.git (WRONG)
REZ-Media → REZ-intelligence-hub.git (WRONG)
etc.
```

### RENDER SERVICES (50+ active)
| Service | Company | URL |
|---------|---------|-----|
| REZ-intelligence-hub | REZ-Intelligence | REZ-intelligence-hub.onrender.com |
| REZ-support-copilot | REZ-Intelligence | REZ-support-copilot.onrender.com |
| REZ-consumer-copilot | REZ-Intelligence | REZ-consumer-copilot.onrender.com |
| REZ-adbazaar | REZ-Media | REZ-adbazaar.onrender.com |
| REZ-ads-service | REZ-Media | REZ-ads-service.onrender.com |
| REZ-gamification | REZ-Media | REZ-gamification.onrender.com |
| REZ-abandonment-tracker | REZ-Media | REZ-abandonment-tracker.onrender.com |
| REZ-merchant-copilot | REZ-Merchant | REZ-merchant-copilot.onrender.com |
| rez-auth-service | RABTUL | rez-auth-service.onrender.com |
| rez-payment-service | RABTUL | rez-payment-service.onrender.com |
| rez-wallet-service | RABTUL | rez-wallet-service.onrender.com |
| rez-order-service | RABTUL | rez-order-service.onrender.com |
| rez-api-gateway | RABTUL | api.onrender.com |
| Hotel-OTA | StayOwn | hotel-ota.onrender.com |
| rez-stayown-service | StayOwn | rez-stayown-service.onrender.com |
| corpperks-api | CorpPerks | corpperks-api.onrender.com |

---

## PLAN

### STEP 1: Create NEW GitHub repos

```bash
gh repo create RTNM-Group --org imrejaul007 --public
gh repo create RABTUL-Technologies --org imrejaul007 --public
gh repo create REZ-Intelligence --org imrejaul007 --public
gh repo create REZ-Media --org imrejaul007 --public
gh repo create REZ-Merchant --org imrejaul007 --public
gh repo create REZ-Consumer --org imrejaul007 --public
gh repo create StayOwn-Hospitality --org imrejaul007 --public
gh repo create CorpPerks --org imrejaul007 --public
```

---

### STEP 2: Update Git remotes

```bash
# RTNM-Group
cd RTNM-Group
git remote set-url origin https://github.com/imrejaul007/RTNM-Group.git
git push -u origin main

# RABTUL-Technologies
cd RABTUL-Technologies
git remote set-url origin https://github.com/imrejaul007/RABTUL-Technologies.git
git push -u origin main

# REZ-Intelligence
cd REZ-Intelligence
git remote set-url origin https://github.com/imrejaul007/REZ-Intelligence.git
git push -u origin main

# REZ-Media
cd REZ-Media
git remote set-url origin https://github.com/imrejaul007/REZ-Media.git
git push -u origin main

# REZ-Merchant
cd REZ-Merchant
git remote set-url origin https://github.com/imrejaul007/REZ-Merchant.git
git push -u origin main

# REZ-Consumer
cd REZ-Consumer
git remote set-url origin https://github.com/imrejaul007/REZ-Consumer.git
git push -u origin main

# StayOwn-Hospitality
cd StayOwn-Hospitality
git remote set-url origin https://github.com/imrejaul007/StayOwn-Hospitality.git
git push -u origin main

# CorpPerks
cd CorpPerks
git remote set-url origin https://github.com/imrejaul007/CorpPerks.git
git push -u origin main
```

---

### STEP 3: Update Render deployments

For each service on Render:
1. Go to Render Dashboard
2. Find the service
3. Update Git repo to new company repo
4. Trigger redeploy

---

### STEP 4: Delete OLD repo on GitHub

After migration:
- Delete `REZ-intelligence-hub` repo
- Or archive it

---

## RENDER SERVICES BY COMPANY

### REZ-Intelligence
- REZ-intelligence-hub
- REZ-support-copilot
- REZ-consumer-copilot
- REZ-intent-graph
- REZ-ml-engine
- REZ-personalization-engine
- REZ-recommendation-engine
- REZ-attribution-system

### REZ-Media
- adbazaar
- adbazaar-api
- REZ-gamification
- REZ-ads-service
- REZ-abandonment-tracker

### REZ-Merchant
- REZ-merchant-copilot
- REZ-merchant-service

### RABTUL-Technologies
- rez-api-gateway
- rez-auth-service
- rez-payment-service
- rez-wallet-service
- rez-order-service
- rez-scheduler-service

### StayOwn-Hospitality
- hotel-ota
- rez-stayown-service
- rez-habixo-service

### CorpPerks
- corpperks-api
- corpperks-admin

---

## SUMMARY

| Task | Status |
|------|--------|
| Create 8 GitHub repos | PENDING |
| Update git remotes | PENDING |
| Push each company to new repo | PENDING |
| Update Render deployments | PENDING |
| Delete old REZ-intelligence-hub repo | PENDING |

---

## READY TO START?