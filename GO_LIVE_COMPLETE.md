# GO LIVE - COMPLETE CHECKLIST
**Date:** May 11, 2026

---

## 9 COMPANY REPOS - ALL READY

| # | Company | GitHub | Services |
|---|---------|--------|-----------|
| 1 | RTNM-Group | imrejaul007/RTNM-Group | 21 |
| 2 | RABTUL-Technologies | imrejaul007/RABTUL-Technologies | 22 |
| 3 | REZ-Intelligence | imrejaul007/REZ-Intelligence | 34 |
| 4 | REZ-Media | imrejaul007/REZ-Media | 23 |
| 5 | REZ-Merchant | imrejaul007/REZ-Merchant | 10 |
| 6 | REZ-Consumer | imrejaul007/REZ-Consumer | 10 |
| 7 | StayOwn-Hospitality | imrejaul007/StayOwn-Hospitality | 7 |
| 8 | CorpPerks | imrejaul007/CorpPerks | 14 |
| 9 | RTNM-Digital | imrejaul007/RTNM-Digital | 3 |

---

## AUTOMATION SCRIPTS CREATED

### Deployment Scripts
| Script | Purpose |
|--------|---------|
| deploy-all.sh | Deploy all services |
| render-all.sh | Deploy to Render |
| */deploy.sh | Per-company deploy |

### Management Scripts
| Script | Purpose |
|--------|---------|
| start-all.sh | Start all services |
| stop-all.sh | Stop all services |
| restart-all.sh | Restart all |
| status-all.sh | Check status |
| logs-all.sh | Get logs |

### Testing Scripts
| Script | Purpose |
|--------|---------|
| TEST_MASTER.sh | Run all tests |
| tests/*.test.js | Unit tests |

### Monitoring Scripts
| Script | Purpose |
|--------|---------|
| monitoring/health-check.sh | Health checks |
| monitoring/alert.sh | Alerts |
| monitoring/check-all-services.sh | Check all |

### Backup Scripts
| Script | Purpose |
|--------|---------|
| backup/backup-all.sh | Backup everything |
| backup/backup-mongodb.sh | Backup MongoDB |
| backup/backup-redis.sh | Backup Redis |
| backup/restore-all.sh | Restore |

### Security Scripts
| Script | Purpose |
|--------|---------|
| security/rotate-secrets.sh | Rotate secrets |
| security/rotate-jwt.sh | Rotate JWT |
| security/rotate-api-keys.sh | Rotate API keys |

---

## ENVIRONMENT TEMPLATES CREATED

| Company | Template |
|---------|----------|
| RTNM-Group | .env.production |
| RABTUL-Technologies | .env.production |
| REZ-Intelligence | .env.production |
| REZ-Media | .env.production |
| REZ-Merchant | .env.production |
| REZ-Consumer | .env.production |
| StayOwn-Hospitality | .env.production |
| CorpPerks | .env.production |
| RTNM-Digital | .env.production |

---

## PRE-DEPLOYMENT CHECKLIST

### 1. Rotate All API Keys (CRITICAL)
- [ ] Razorpay API Keys
- [ ] Stripe API Keys
- [ ] OpenAI API Keys
- [ ] Anthropic API Keys
- [ ] Google AI API Keys
- [ ] JWT Secrets
- [ ] Database passwords

### 2. Configure Environment Variables
- [ ] MongoDB Atlas connection strings
- [ ] Redis Cloud connection strings
- [ ] Render environment variables
- [ ] Vercel environment variables
- [ ] API keys (production)
- [ ] Webhook secrets

### 3. Verify Services
- [ ] All services have render.yaml
- [ ] All services have package.json
- [ ] All services have README.md
- [ ] .gitignore is correct

### 4. Security
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Helmet.js enabled
- [ ] Admin lockout enabled
- [ ] Input validation checked

---

## DEPLOYMENT STEPS

### 1. Deploy Infrastructure (RABTUL-Technologies)
```bash
cd RABTUL-Technologies
./deploy.sh
```
Services: api-gateway, auth, payment, wallet, order, catalog, search, analytics, booking, delivery, notifications, scheduler, circuit-breaker, retry, dlq

### 2. Deploy AI (REZ-Intelligence)
```bash
cd REZ-Intelligence
./deploy.sh
```
Services: mind, intent-graph, ml-engine, feature-store, attribution, recommendation, targeting, personalization, support-copilot

### 3. Deploy Media (REZ-Media)
```bash
cd REZ-Media
./deploy.sh
```
Services: adBazaar, adsqr, gamification, marketing, automation

### 4. Deploy Merchant (REZ-Merchant)
```bash
cd REZ-Merchant
./deploy.sh
```
Services: merchant-app, dashboard, industry-os

### 5. Deploy Consumer (REZ-Consumer)
```bash
cd REZ-Consumer
./deploy.sh
```
Apps: consumer-app, do-app, rendez, driver-app, karma-app

### 6. Deploy Hotels (StayOwn-Hospitality)
```bash
cd StayOwn-Hospitality
./deploy.sh
```
Services: hotel-ota, habixo

### 7. Deploy Enterprise (CorpPerks)
```bash
cd CorpPerks
./deploy.sh
```
Services: corpperks, nextaBizz

### 8. Deploy Trust (RTNM-Digital)
```bash
cd RTNM-Digital
./deploy.sh
```
Services: trust-platform, ops-center, incident-management

### 9. Deploy Controls (RTNM-Group)
```bash
cd RTNM-Group
./deploy.sh
```
Services: admin-panels, access-control, financial-ledger, compliance

---

## POST-DEPLOYMENT CHECKLIST

### Testing
- [ ] Health checks pass
- [ ] Auth flow works
- [ ] Payment flow works
- [ ] Webhooks receive events
- [ ] AI services respond
- [ ] Search works
- [ ] Notifications send

### Monitoring
- [ ] Prometheus metrics flowing
- [ ] Grafana dashboards loading
- [ ] Alerts configured
- [ ] Logs streaming

### Security
- [ ] HTTPS enforced
- [ ] CORS correct
- [ ] Rate limits working
- [ ] Admin lockout tested

---

## SERVICES BY RENDER BLUEPRINT ID

### RABTUL-Technologies
| Service | Blueprint |
|---------|----------|
| api-gateway | rez-api-gateway |
| auth | rez-auth-service |
| payment | rez-payment-service |
| wallet | rez-wallet-service |
| order | rez-order-service |
| catalog | rez-catalog-service |
| search | rez-search-service |
| analytics | rez-analytics-service |

### REZ-Intelligence
| Service | Blueprint |
|---------|----------|
| mind | REZ-MIND |
| intent-graph | rez-intent-graph |
| ml-engine | rez-ml-engine |
| feature-store | REZ-feature-store |

---

## VERCEL APPS

| App | Company |
|-----|---------|
| consumer-app | REZ-Consumer |
| merchant-dashboard | REZ-Merchant |
| admin-panels | RTNM-Group |
| hotel-ota | StayOwn |

---

## DOCKER SERVICES (198)

All configured with:
- Dockerfile
- docker-compose.yml
- Health checks
- Logging
- Resource limits

---

## SUPPORT

### Documentation
- Architecture.md
- DEPLOYMENT_GUIDE.md
- ENVIRONMENT_SETUP.md
- MONITORING.md
- SECURITY_CHECKLIST.md

### Scripts
- All automation in /scripts/
- Backup in /backup/
- Monitoring in /monitoring/

---

## EMERGENCY CONTACTS

| Service | Contact |
|---------|---------|
| MongoDB Atlas | Support portal |
| Redis Cloud | Support portal |
| Render | Dashboard |
| Vercel | Dashboard |

---

## QUICK COMMANDS

```bash
# Health check all
./monitoring/check-all-services.sh

# Deploy all
./deploy-all.sh

# Backup all
./backup/backup-all.sh

# Rotate secrets
./security/rotate-secrets.sh

# Test all
./TEST_MASTER.sh
```

---

**Ready to Go Live!**
