# REZ Ecosystem Pre-Launch Checklist

**Date:** May 5, 2026
**Target Launch:** TBD

---

## API Keys Configuration

### Consumer App (rez-app-consumer)
- [ ] GOOGLE_MAPS_API_KEY - Google Cloud Console
- [ ] GOOGLE_PLACES_API_KEY - Google Cloud Console
- [ ] OPENCAGE_API_KEY - OpenCage API
- [ ] FIREBASE_API_KEY - Firebase Console
- [ ] RAZORPAY_KEY_ID - Razorpay Dashboard
- [ ] CLOUDINARY_API_KEY - Cloudinary Dashboard

### Merchant App (rez-app-merchant)
- [ ] Same API keys as Consumer App

### Backend Services
- [ ] MONGODB_URI - MongoDB Atlas
- [ ] REDIS_URL - Redis Cloud
- [ ] JWT_SECRET - Generate: `openssl rand -hex 64`
- [ ] RAZORPAY_KEY_SECRET - Razorpay Dashboard
- [ ] RAZORPAY_WEBHOOK_SECRET - Razorpay Dashboard
- [ ] SENDGRID_API_KEY - SendGrid

---

## EAS Builds

### Consumer App
- [ ] Android Build Complete: CHECK https://expo.dev/accounts/rezmoneys-organization/projects/rez/builds
- [ ] iOS Build Complete: CHECK https://expo.dev/accounts/rezmoneys-organization/projects/rez/builds
- [ ] AAB/APK Downloaded
- [ ] IPA Downloaded

### Merchant App
- [ ] Android Build Complete: CHECK https://expo.dev/accounts/rez.money/projects/rez-merchant-app/builds
- [ ] iOS Build Complete: CHECK https://expo.dev/accounts/rez.money/projects/rez-merchant-app/builds
- [ ] AAB/APK Downloaded
- [ ] IPA Downloaded

---

## App Store Connect

### Consumer App (REZ - Shop, Pay, Earn)
- [ ] App Created: money.rez.app
- [ ] Description Written
- [ ] Keywords Added
- [ ] Screenshots Uploaded (iPhone + iPad)
- [ ] App Icon Uploaded
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Build Selected
- [ ] Submitted for Review

### Merchant App (REZ Merchant)
- [ ] App Created: com.rez.merchant
- [ ] Description Written
- [ ] Keywords Added
- [ ] Screenshots Uploaded
- [ ] App Icon Uploaded
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Build Selected
- [ ] Submitted for Review

---

## Google Play Console

### Consumer App
- [ ] App Created
- [ ] Store Listing Complete
- [ ] Screenshots Uploaded
- [ ] Feature Graphic Uploaded
- [ ] App Icon Uploaded
- [ ] Content Rating Completed
- [ ] Privacy Policy URL
- [ ] AAB Uploaded
- [ ] Release Created

### Merchant App
- [ ] App Created
- [ ] Store Listing Complete
- [ ] Screenshots Uploaded
- [ ] Feature Graphic Uploaded
- [ ] App Icon Uploaded
- [ ] Content Rating Completed
- [ ] Privacy Policy URL
- [ ] AAB Uploaded
- [ ] Release Created

---

## Backend Services

- [ ] All 14 services deployed to production
- [ ] Health checks passing
- [ ] MongoDB backups configured
- [ ] Redis configured
- [ ] Domain DNS propagated

### Service URLs
| Service | Production URL |
|---------|---------------|
| API Gateway | https://api.rez.money |
| Auth | https://auth.rez.money |
| Wallet | https://wallet.rez.money |
| Payment | https://pay.rez.money |
| Merchant | https://merchant.rez.money |

---

## Monitoring

- [ ] Grafana Dashboard: https://grafana.rez.money
- [ ] Prometheus: https://prometheus.rez.money
- [ ] Alertmanager: https://alertmanager.rez.money
- [ ] Status Page: https://status.rez.money

---

## Legal & Compliance

- [ ] Privacy Policy Published
- [ ] Terms of Service Published
- [ ] Cookie Consent Banner
- [ ] GDPR Compliance (if EU users)

---

## Support Setup

- [ ] Support Email: support@rez.money
- [ ] Help Center: https://help.rez.money
- [ ] Status Page: https://status.rez.money
- [ ] Emergency Contacts Documented

---

## Marketing

- [ ] Landing Page: https://rez.money
- [ ] Social Media Accounts
- [ ] Press Kit
- [ ] Launch Announcement Prepared

---

## LAUNCH DAY

### T-24 Hours
- [ ] Final API key verification
- [ ] Backend services health check
- [ ] Store submission verification

### T-0 (Launch)
- [ ] Enable production mode
- [ ] Send launch announcement
- [ ] Monitor dashboards
- [ ] Watch error rates

### T+1 Hour
- [ ] Check error dashboards
- [ ] Monitor payment success rate
- [ ] Watch user signups

### T+24 Hours
- [ ] Post-launch metrics review
- [ ] Address issues
- [ ] Social media monitoring

---

## EMERGENCY CONTACTS

| Role | Name | Phone |
|------|------|-------|
| CTO On-Call | [YOUR NAME] | [YOUR PHONE] |
| DevOps | [YOUR NAME] | [YOUR PHONE] |
| Security | [YOUR NAME] | [YOUR PHONE] |

---

## ROLLBACK PLAN

If critical issues occur:

```bash
# Rollback all services
./scripts/rollback.sh --service=all --version=previous

# Rollback specific service
./scripts/rollback.sh --service=payment --version=previous

# Disable new signups
# (Add flag to disable user registration)
```
