# SERVICE GROUPS - REORGANIZATION PLAN

**Date:** May 11, 2026

---

## PROPOSED GROUPS

### 1. REZ-Core-Platform
**Purpose:** Core backend services

```
rez-auth-service
rez-payment-service
rez-wallet-service
rez-order-service
rez-catalog-service
rez-profile-service
rez-notifications-service
rez-search-service
```

### 2. REZ-Merchant-Platform
**Purpose:** Merchant ecosystem

```
rez-merchant-service
rez-catalog-service (shared)
rez-inventory-service
rez-pos-service
rez-kitchen-ai
rez-menu-service
rez-recipe-costing
```

### 3. REZ-AI-Platform
**Purpose:** AI/ML services

```
rez-intent-graph
rez-intelligence-hub
rez-ml-engine
rez-ai-platform
rez-personalization-engine
rez-recommendation-engine
rez-consumer-copilot
rez-merchant-copilot
REZ-support-copilot
```

### 4. REZ-Hospitality-Platform
**Purpose:** Hotel & travel

```
Hotel-OTA
rez-hotel-service
rez-stayown-service
rez-habixo-service
rez-channel-manager-service
```

### 5. REZ-AdPlatform
**Purpose:** Advertising

```
adBazaar
adsqr
dooh
creators
rez-ads-service
rez-targeting-engine
rez-attribution-system
```

### 6. REZ-Growth-Platform
**Purpose:** Marketing & engagement

```
rez-marketing-service
rez-abandonment-tracker
rez-lead-intelligence
rez-decision-service
rez-feedback-service
```

### 7. REZ-Loyalty-Platform
**Purpose:** Rewards & retention

```
rez-gamification-service
rez-karma-service
rez-loyalty-service
rez-referral-service
rez-coupon-service
rez-offer-service
```

### 8. REZ-Analytics-Platform
**Purpose:** Analytics & insights

```
rez-analytics-service
rez-insights-service
rez-user-intelligence
rez-merchant-intelligence
rez-ab-testing-service
```

### 9. REZ-Infrastructure
**Purpose:** DevOps & resilience

```
REZ-circuit-breaker
REZ-retry-service
REZ-dlq-service
REZ-idempotency-service
REZ-policy-engine
```

### 10. SOURCE-OF-TRUTH
**Purpose:** Documentation

```
SOT/
docs/
```

---

## CURRENT STATE → DESIRED STATE

| Service | Current Repo | Group Into |
|--------|-------------|-----------|
| rez-auth-service | auth-service.git | REZ-Core-Platform |
| rez-payment-service | payment-service.git | REZ-Core-Platform |
| rez-merchant-service | merchant-service.git | REZ-Merchant-Platform |
| rez-intent-graph | intent-graph.git | REZ-AI-Platform |
| Hotel-OTA | hotel-ota.git | REZ-Hospitality-Platform |
| adBazaar | adBazaar.git | REZ-AdPlatform |

---

## IMPLEMENTATION STEPS

### Step 1: Create new group repos on GitHub
```bash
gh repo create REZ-Core-Platform --public
gh repo create REZ-Merchant-Platform --public
gh repo create REZ-AI-Platform --public
# etc.
```

### Step 2: Migrate services
```bash
# For each service:
cd rez-auth-service
git remote set-url origin https://github.com/imrejaul007/REZ-Core-Platform.git
git push origin main
```

### Step 3: Update local structure
```bash
# Organize folders:
mkdir -p REZ-Core-Platform
mv rez-auth-service rez-payment-service rez-wallet-service rez-order-service REZ-Core-Platform/
```

### Step 4: Cleanup
```bash
# Remove backup folders
rm -rf *.backup
```

---

## GITHUB REPOS TO CREATE

| Group | Repo | Services |
|-------|------|----------|
| 1 | REZ-core-platform | 8 services |
| 2 | REZ-merchant-platform | 7 services |
| 3 | REZ-ai-platform | 9 services |
| 4 | REZ-hospitality-platform | 4 services |
| 5 | REZ-ad-platform | 7 services |
| 6 | REZ-growth-platform | 5 services |
| 7 | REZ-loyalty-platform | 6 services |
| 8 | REZ-analytics-platform | 5 services |
| 9 | REZ-infrastructure | 5 services |
| 10 | SOURCE-OF-TRUTH | docs |

---

## STARTING WITH GROUP 1

Want me to:
1. Create `REZ-core-platform` repo
2. Migrate core services
3. Push to new repo
4. Repeat for next groups

**Shall I proceed with Group 1 (Core Platform)?**