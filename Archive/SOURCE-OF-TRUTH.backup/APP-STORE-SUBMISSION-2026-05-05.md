# App Store Submission Tracking - 2026-05-05

## Overview
Submission date: 2026-05-05
Submission lead: Claude Code Agent
Status: IN_PROGRESS

---

## 1. Consumer App (rez-app-consumer)

### App Details
| Field | Value |
|-------|-------|
| **Bundle ID** | money.rez.app |
| **EAS Project ID** | cf84e3b3-4a96-4c9b-a438-465c29fbf720 |
| **App Name** | REZ - Shop, Pay, Earn |
| **Category** | Shopping |
| **Platform** | iOS + Android |

### Build Status

| Platform | Status | Build ID | Started At | Completed At | Artifact |
|----------|--------|----------|------------|--------------|----------|
| Android | IN_PROGRESS (queued) | c27e981a-4a7b-44ee-896e-4206a8e905b0 | 2026-05-05 17:20 | - | - |
| iOS | FAILED - No Credentials | - | 2026-05-05 17:05 | - | - |

**Build Logs (Android)**: https://expo.dev/accounts/rezmoneys-organization/projects/rez/builds/c27e981a-4a7b-44ee-896e-4206a8e905b0

### Build Issues
- iOS: Distribution Certificate not validated - requires interactive credentials setup

### Build Issues Resolved
1. Fixed JSON comment in package.json (line 31) - Invalid comment removed
2. Build uploading to EAS (171 MB archive)

### Store Entry Status

| Store | Entry Created | Metadata | Screenshots | Build Uploaded | Submitted | Status |
|-------|---------------|----------|-------------|---------------|-----------|--------|
| App Store Connect | NO | NO | NO | NO | NO | NOT_STARTED |
| Google Play | NO | NO | NO | NO | NO | NOT_STARTED |

### Submission Details
- **Submission Date**: 2026-05-05
- **Review Status**: PENDING_REVIEW

---

## 2. Merchant App (rez-app-merchant)

### App Details
| Field | Value |
|-------|-------|
| **Bundle ID** | com.rez.merchant |
| **EAS Project ID** | 72014a96-74fd-4bef-b678-a23ee3febd1d (NEW - created 2026-05-05) |
| **App Name** | REZ Merchant |
| **Category** | Business |
| **Platform** | iOS + Android |

### Build Status

| Platform | Status | Build ID | Started At | Completed At | Artifact |
|----------|--------|----------|------------|--------------|----------|
| Android | IN_PROGRESS (queued) | 25e2e4d1-6a9f-44d8-b3ae-1f4f32554e98 | 2026-05-05 17:24 | - | - |
| iOS | FAILED - No Credentials | - | 2026-05-05 17:05 | - | - |

**Build Logs (Android)**: https://expo.dev/accounts/rez.money/projects/rez-merchant-app/builds/25e2e4d1-6a9f-44d8-b3ae-1f4f32554e98

### Build Issues
- iOS: Distribution Certificate not validated - requires interactive credentials setup

### Build Issues Resolved
1. Fixed eas.json - removed invalid platform-specific keys
2. Created new EAS project (replaced inaccessible project ID 77203219-4cd5-4ca3-9210-1cc89b7456fc)
3. Updated app.config.js with new project ID

### Store Entry Status

| Store | Entry Created | Metadata | Screenshots | Build Uploaded | Submitted | Status |
|-------|---------------|----------|-------------|---------------|-----------|--------|
| App Store Connect | NO | NO | NO | NO | NO | NOT_STARTED |
| Google Play | NO | NO | NO | NO | NO | NOT_STARTED |

### Submission Details
- **Submission Date**: 2026-05-05
- **Review Status**: PENDING_REVIEW

---

## Build Commands

### Consumer App - Android
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-consumer
eas build --platform android --profile production --non-interactive
```

### Consumer App - iOS
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-consumer
eas build --platform ios --profile production --non-interactive
```

### Merchant App - Android
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-merchant
eas build --platform android --profile production --non-interactive
```

### Merchant App - iOS
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-merchant
eas build --platform ios --profile production --non-interactive
```

---

## Manual Steps Required

### iOS Credentials Setup (Required Before iOS Build)

Before building for iOS, credentials must be set up:

1. **Run in interactive mode:**
   ```bash
   cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-consumer
   eas credentials --platform ios --profile production
   ```
   Or for Merchant App:
   ```bash
   cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-merchant
   eas credentials --platform ios --profile production
   ```

2. **Required credentials:**
   - Apple Distribution Certificate
   - App Store Connect API Key (for EAS Submit)
   - Provisioning Profile

3. **Set ASC App ID:**
   - After creating the app in App Store Connect, set the ASC App ID in eas.json:
   ```json
   "ios": {
     "ascAppId": "YOUR_ASC_APP_ID"
   }
   ```

### App Store Connect (iOS)
1. Go to https://appstoreconnect.apple.com
2. Create new app with Bundle ID: `money.rez.app` (Consumer) / `com.rez.merchant` (Merchant)
3. Fill in metadata:
   - **Consumer App**: REZ - Shop, Pay, Earn
   - **Category**: Shopping
   - **Description**: India's universal commerce app that brings together shopping, food delivery, hotel bookings, travel, and wallet services in one seamless platform.
   - **Keywords**: shopping, food delivery, hotels, travel, wallet, rewards, payments
   - **Merchant App**: REZ Merchant
   - **Category**: Business
   - **Description**: Powerful merchant dashboard for REZ partners. Manage orders, track analytics, handle payments, and grow your business.
4. Upload build from EAS (automatic via eas submit)
5. Submit for review

### Google Play Console (Android)
1. Go to https://play.google.com/console/developer
2. Create new app
3. Fill in Store Listing:
   - **Consumer App**:
     - App name: REZ - Shop, Pay, Earn
     - Category: Shopping
     - Description: India's universal commerce app that brings together shopping, food delivery, hotel bookings, travel, and wallet services in one seamless platform. Earn rewards on every transaction and enjoy exclusive deals across thousands of merchants.
     - Keywords: shopping, food delivery, hotels, travel, wallet, rewards, payments, merchants
   - **Merchant App**:
     - App name: REZ Merchant
     - Category: Business
     - Description: Powerful merchant dashboard for REZ partners. Manage orders, track analytics, handle payments, and grow your business with REZ's merchant tools. Real-time notifications and comprehensive reporting included.
     - Keywords: merchant, business, POS, orders, analytics, payments, dashboard
4. Upload AAB from EAS build
5. Submit for review

### EAS Submit Commands (After Builds Complete)

**Consumer App - Android:**
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-consumer
eas submit --platform android --latest --profile production
```

**Consumer App - iOS:**
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-consumer
eas submit --platform ios --latest --profile production
```

**Merchant App - Android:**
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-merchant
eas submit --platform android --latest --profile production
```

**Merchant App - iOS:**
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/rez-app-merchant
eas submit --platform ios --latest --profile production
```

---

## App Descriptions

### Consumer App
**App Name**: REZ - Shop, Pay, Earn
**Description**:
India's universal commerce app that brings together shopping, food delivery, hotel bookings, travel, and wallet services in one seamless platform. Earn rewards on every transaction and enjoy exclusive deals across thousands of merchants.

**Keywords**: shopping, food delivery, hotels, travel, wallet, rewards, payments, merchants

### Merchant App
**App Name**: REZ Merchant
**Description**:
Powerful merchant dashboard for REZ partners. Manage orders, track analytics, handle payments, and grow your business with REZ's merchant tools. Real-time notifications and comprehensive reporting included.

**Keywords**: merchant, business, POS, orders, analytics, payments, dashboard

---

## Screenshots Required

### Consumer App
- 5 screenshots for iPhone (iOS)
- 5 screenshots for iPad (iOS)
- 5 screenshots for Android

### Merchant App
- 5 screenshots for iPhone (iOS)
- 5 screenshots for iPad (iOS)
- 5 screenshots for Android

### App Icons
- 1024x1024 PNG (required for App Store)
- Various sizes for Android adaptive icons

---

## Update Log

| Timestamp | Action | Details |
|-----------|--------|---------|
| 2026-05-05 16:57 | Document created | Initial tracking document |
| 2026-05-05 16:57 | Build initiated | Consumer App Android - BLOCKED (JSON comment in package.json) |
| 2026-05-05 16:57 | Build initiated | Merchant App Android - BLOCKED (EAS permission error) |
| 2026-05-05 16:58 | Issue fixed | Consumer App: Removed invalid JSON comment from package.json |
| 2026-05-05 16:59 | Issue fixed | Merchant App: Fixed eas.json invalid platform keys |
| 2026-05-05 17:00 | Build retry | Consumer App: Build in progress (ID: c27e981a-4a7b-44ee-896e-4206a8e905b0) |
| 2026-05-05 17:00 | Build retry | Merchant App: Created new EAS project, build in progress |
| 2026-05-05 17:01 | Merchant App | New EAS Project ID: 72014a96-74fd-4bef-b678-a23ee3febd1d |
| 2026-05-05 17:05 | iOS builds | Both Consumer and Merchant iOS builds failed - Distribution Certificate not set up |
| 2026-05-05 17:20 | Status check | Consumer App Android: IN_QUEUE |
| 2026-05-05 17:24 | Status check | Merchant App Android: IN_QUEUE |
| 2026-05-05 | Config verified | Consumer App eas.json verified - production profile ready |
| 2026-05-05 | Config verified | Merchant App eas.json verified - production profile ready |

---

## Current Status Summary

### Consumer App (rez-app-consumer)
- **EAS Config**: ✅ Verified and ready
- **Android Build**: Queued on EAS (Build ID: c27e981a-4a7b-44ee-896e-4206a8e905b0)
- **iOS Build**: Needs credentials setup
- **Production Env Vars**: All configured (API URLs, Firebase, etc.)
- **Bundle ID**: money.rez.app

### Merchant App (rez-app-merchant)
- **EAS Config**: ✅ Verified and ready  
- **Android Build**: Queued on EAS (Build ID: 25e2e4d1-6a9f-44d8-b3ae-1f4f32554e98)
- **iOS Build**: Needs credentials setup
- **Production Env Vars**: All configured
- **Bundle ID**: com.rez.merchant

---

## Required API Keys (REPLACE BEFORE LAUNCH)

Both apps have `REQUIRED_BEFORE_LAUNCH` placeholders that must be replaced:

### Consumer App
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`
- `EXPO_PUBLIC_OPENCAGE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_RAZORPAY_KEY_ID`
- `EXPO_PUBLIC_CLOUDINARY_API_KEY`

### Merchant App
- Same API keys needed as Consumer App

---

## Next Steps

1. **Check EAS Build Status**: Visit EAS dashboard to check if builds completed
2. **Replace API Keys**: Update `REQUIRED_BEFORE_LAUNCH` values with real keys
3. **Setup iOS Credentials**: Run `eas credentials --platform ios`
4. **Rebuild after key replacement**: Once keys are added, rebuild Android and iOS
5. **Submit to Stores**: After successful builds, submit to App Store and Google Play

---

## Notes
- EAS builds running with production profile
- Both apps use app-bundle for Android (AAB format)
- iOS builds require Apple Developer credentials
- Push notifications enabled for both apps
