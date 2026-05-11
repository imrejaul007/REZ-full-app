# SERVICE ASSIGNMENT AUDIT

## 1. RTNM-GROUP (Admin + Controls)
**ALREADY HAS:**
- REE-Admin, REE-Dashboard, REE-Monitoring
- REZ-admin-dashboard, rez-admin-service
- REZ-ops-dashboard, rez-admin-training-panel
- rez-loyalty-admin, SOT, shared-types

**TO ADD:**
```
REZ-identity-service → RTNM-Group (Identity/Admin)
```

---

## 2. RABTUL-TECHNOLOGIES (Shared Infra)
**ALREADY HAS:** api-gateway, auth, payment, wallet, etc.

**TO ADD:**
```
rez-notifications-hub → RABTUL-Technologies
rez-audit-service → RABTUL-Technologies
rez-identity-graph → RABTUL-Technologies
rez-contracts → RABTUL-Technologies
rez-data-pipeline → RABTUL-Technologies
```

---

## 3. REZ-INTELLIGENCE (AI)
**ALREADY HAS:** Mind, ML, Attribution

**TO ADD:**
```
REZ-support-copilot → REZ-Intelligence
rez-consumer-copilot → REZ-Intelligence
rez-intelligence-hub → REZ-Intelligence
rez-intent-graph → REZ-Intelligence
rez-intent-predictor → REZ-Intelligence
rez-intent-service → REZ-Intelligence
REZ-error-intelligence → REZ-Intelligence
REZ-ab-testing-service → REZ-Intelligence
REZ-experimentation-engine → REZ-Intelligence
rez-ai-platform → REZ-Intelligence
rez-ai-plugins → REZ-Intelligence
rez-ai-voice → REZ-Intelligence
rez-aggregator-hub → REZ-Intelligence
rez-customer-360 → REZ-Intelligence
rez-cohort-service → REZ-Intelligence
rez-data-pipeline → REZ-Intelligence
```

---

## 4. REZ-MEDIA (Ads + Loyalty)
**ALREADY HAS:** adBazaar, gamification, adsqr

**TO ADD:**
```
rez-ads → REZ-Media
rez-ad-campaigns → REZ-Media
rez-dooh-service → REZ-Media
REZ-media-events → REZ-Media
REZ-automation-service → REZ-Media (marketing automation)
REZ-marketing-service → REZ-Media
REZ-marketing-backend → REZ-Media
REZ-ad-ai → REZ-Media (ad optimization)
REZ-economic-engine → REZ-Media (economics)
```

---

## 5. REZ-MERCHANT (Merchant)
**ALREADY HAS:** merchant-service, dashboard, industry-os

**TO ADD:**
```
rez-merchant-app → REZ-Merchant
rez-cross-merchant-service → REZ-Merchant
```

---

## 6. REZ-CONSUMER (Consumer)
**ALREADY HAS:** rez-app-consumer, do-app, rendez-app

**TO ADD:**
```
Rendez → REZ-Consumer (social app)
```

---

## 7. CORPPERKS (Enterprise)
**ALREADY HAS:** CorpPerks, nextabizz

**TO ADD:**
```
rez-corporate-service → CorpPerks
rez-corpperks-service → CorpPerks
corpperks-landing → CorpPerks
```

---

## 8. RTMN-FINANCE (Finance)
**TO ADD:**
```
(Already organized)
```

---

## 9. UTILITY (Not company specific)
```
packages → shared-types (move to RTNM-Group)
rez-devops-config → Archive
E2E-TEST → Archive
integration-tests → Archive
audit → Archive
archives → Archive
dist → Archive
```

---

## 10. DUPLICATES (Delete)
```
nextabizz (duplicate - keep CorpPerks/nextabizz)
```

---

## SUMMARY TABLE

| Service | Assign To |
|---------|-----------|
| REZ-identity-service | RTNM-Group |
| rez-notifications-hub | RABTUL |
| rez-audit-service | RABTUL |
| REZ-support-copilot | REZ-Intelligence |
| rez-consumer-copilot | REZ-Intelligence |
| rez-intelligence-hub | REZ-Intelligence |
| rez-intent-graph | REZ-Intelligence |
| rez-intent-predictor | REZ-Intelligence |
| REZ-error-intelligence | REZ-Intelligence |
| REZ-ab-testing-service | REZ-Intelligence |
| rez-ai-platform | REZ-Intelligence |
| rez-ads | REZ-Media |
| REZ-marketing-service | REZ-Media |
| rez-merchant-app | REZ-Merchant |
| Rendez | REZ-Consumer |
| rez-corporate-service | CorpPerks |
| nextabizz | Delete (keep CorpPerks) |
