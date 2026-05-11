# REZ ECOSYSTEM - LAUNCH CHECKLIST
**Date:** May 4, 2026
**Status:** Ready for Launch

---

## PRE-LAUNCH CHECKLIST

### Environment Setup [ ]
- [ ] Configure all production API keys (see `.env.production.example` files)
- [ ] Set up MongoDB Atlas cluster with TLS
- [ ] Set up Redis Cloud with TLS
- [ ] Configure DNS for all rez.money subdomains
- [ ] Generate JWT secrets: `openssl rand -hex 64`
- [ ] Set up Sentry for error tracking

### Domain Configuration [ ]
- [ ] api.rez.money → API Gateway
- [ ] auth.rez.money → Auth Service
- [ ] wallet.rez.money → Wallet Service
- [ ] pay.rez.money → Payment Service
- [ ] merchant.rez.money → Merchant Service
- [ ] now.rez.money → ReZ Now
- [ ] menu.rez.money → Web Menu
- [ ] mind.rez.money → Intent Graph
- [ ] try.rez.money → ReZ Try
- [ ] stayown.rez.money → Hotel OTA
- [ ] ads.rez.money → AdBazaar
- [ ] verify.rez.money → Verify Service

### API Keys Required [ ]
| Service | Key | Where to Get |
|---------|-----|--------------|
| Razorpay | rzp_live_* | dashboard.razorpay.com |
| Google Maps | AIza... | console.cloud.google.com |
| Firebase | Various | console.firebase.google.com |
| Cloudinary | cloudinary://* | cloudinary.com/console |
| Twilio | SID + Token | console.twilio.com |
| WhatsApp | Business API | business.whatsapp.com |

### Core Services Deployment [ ]
```bash
# Deploy in order
docker-compose up -d rez-auth-service
docker-compose up -d rez-wallet-service
docker-compose up -d rez-payment-service
docker-compose up -d rez-merchant-service
docker-compose up -d rez-order-service
docker-compose up -d rez-api-gateway
```

### Mobile Apps Build [ ]
```bash
# Consumer App
cd rez-app-consumer
eas build --platform android --profile production
eas build --platform ios --profile production

# Merchant App
cd rez-app-merchant
eas build --platform android --profile production
eas build --platform ios --profile production

# Admin App
cd rez-app-admin
eas build --platform android --profile production
eas build --platform ios --profile production
```

### App Store Submissions [ ]
- [ ] Create Apple Developer account
- [ ] Create Google Play Developer account
- [ ] Prepare App Store screenshots (iPhone, iPad, Android)
- [ ] Write App Store descriptions
- [ ] Set up TestFlight beta testing
- [ ] Set up Internal testing (Google Play)

### Web Platforms Deploy [ ]
```bash
# ReZ Now
cd rez-now && vercel --prod

# Hotel OTA
cd "Hotel OTA/apps/ota-web" && vercel --prod

# AdBazaar
cd adBazaar && vercel --prod
```

### Security Checklist [ ]
- [ ] Enable SSL/TLS on all domains
- [ ] Configure CORS with production origins only
- [ ] Enable rate limiting on all services
- [ ] Set up IP whitelisting for admin endpoints
- [ ] Enable audit logging
- [ ] Configure backup schedules
- [ ] Test disaster recovery

### Monitoring Setup [ ]
- [ ] Configure Prometheus metrics
- [ ] Set up Grafana dashboards
- [ ] Configure alerts for:
  - [ ] Error rate > 1%
  - [ ] Response time > 500ms
  - [ ] Service downtime
  - [ ] Disk usage > 80%
  - [ ] Memory usage > 85%
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation (Loki/ELK)

### Testing [ ]
- [ ] Run E2E tests on staging
- [ ] Perform security penetration testing
- [ ] Load test with 1000 concurrent users
- [ ] Test payment flows end-to-end
- [ ] Test notification delivery
- [ ] Test AI/ReZ Mind pipeline

### Legal [ ]
- [ ] Publish Terms of Service
- [ ] Publish Privacy Policy
- [ ] Set up cookie consent banner
- [ ] Configure GDPR compliance (if EU users)
- [ ] Set up refund policy
- [ ] Create support email (support@rez.money)

### Support [ ]
- [ ] Set up support email
- [ ] Configure help desk system
- [ ] Create FAQ documentation
- [ ] Set up status page (status.rez.money)
- [ ] Configure customer support escalation matrix

---

## LAUNCH DAY CHECKLIST

### Hour 0 - Go Live
- [ ] Verify all services are healthy
- [ ] Check monitoring dashboards
- [ ] Enable production API keys
- [ ] Update DNS to production
- [ ] Announce on social media

### Hour 1-4
- [ ] Monitor error rates
- [ ] Watch customer support queue
- [ ] Check payment success rates
- [ ] Monitor AI/ReZ Mind performance

### Hour 4-24
- [ ] Review metrics vs targets
- [ ] Address any issues
- [ ] Celebrate! 🎉

---

## POST-LAUNCH (Week 1)

- [ ] Collect user feedback
- [ ] Monitor retention metrics
- [ ] Track key KPIs:
  - DAU/MAU
  - Transaction volume
  - Revenue
  - NPS score
- [ ] Plan Phase 2 features

---

## EMERGENCY CONTACTS

| Role | Contact |
|------|---------|
| CTO On-Call | [Your Email] |
| DevOps | [Your Email] |
| Security | [Your Email] |

---

## IMPORTANT URLs

| Service | URL |
|---------|-----|
| Status Page | status.rez.money |
| Support | support@rez.money |
| Docs | docs.rez.money |

---

*Checklist Version: 1.0*
*Last Updated: May 4, 2026*
