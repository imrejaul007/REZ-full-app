# Google Play Console Submission Guide

## Prerequisites
- Google Play Developer Account ($25 one-time)
- Built Android app (AAB from EAS)
- Google Service Account for Play Console API

---

## Step 1: Create App in Play Console

1. Go to https://play.google.com/console
2. All Apps → Create App
3. Fill in:
   - App name
   - Default language
   - App or game: App
   - Free or Paid: Free

---

## Step 2: Complete Store Listing

### Product Details
- **Short description**: 80 characters max
- **Full description**: 4000 characters max
- **App category**: Shopping
- **Content rating**: Everyone

### Graphics Assets
- **App icon**: 512 x 512 px (PNG)
- **Feature graphic**: 1024 x 500 px (PNG)
- **Screenshots**: Minimum 2, up to 8 per type
  - Phone screenshots: 16:9 or 9:16
  - 7" tablet screenshots: Optional
  - 10" tablet screenshots: Optional

---

## Step 3: Content Rating

1. Go to Content Rating → Start questionnaire
2. App purpose: Shopping
3. Sign-in requirements: Phone verification
4. Categories: None
5. Submit

---

## Step 4: Pricing & Distribution

- **Free or Paid**: Free
- **Countries**: India (primary), Global (optional)
- **Age rating**: Everyone

---

## Step 5: App Signing

EAS handles app signing automatically. No action needed.

---

## Step 6: Upload AAB

1. Production → Create Release
2. Upload .aab file from EAS build
3. Add release notes
4. Save → Review Release → Start Rollout to Production

---

## Submission Checklist

- [ ] App information complete
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Screenshots (min 2)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Content rating completed
- [ ] Privacy policy URL
- [ ] AAB uploaded
- [ ] Release created
