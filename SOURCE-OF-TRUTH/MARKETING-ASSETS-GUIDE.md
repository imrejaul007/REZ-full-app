# Marketing Assets Guide

**Version:** 1.0
**Last Updated:** 2026-05-04
**Purpose:** Guidelines for creating and maintaining marketing assets across the REZ ecosystem

---

## Overview

This guide establishes standards for marketing assets across all REZ products. Consistent, high-quality marketing materials are essential for brand recognition and user trust.

---

## 1. Brand Identity

### 1.1 Brand Name Usage

| Correct | Incorrect |
|---------|-----------|
| REZ | Rez, rez, R.E.Z. |
| rez-app-consumer | Rez Consumer App, Consumer App |
| do-app | Do App, DO App, do |

### 1.2 Logo Usage

**Primary Logo:**
- Location: `/archives/ReZlogo.png`
- Minimum size: 120x40 pixels
- Clear space: 1x logo height on all sides
- Backgrounds: Use on white, black, or brand purple only

**Dark Logo:**
- For light-colored backgrounds
- Full-color version for dark backgrounds

### 1.3 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Purple | `#6B46C1` | Primary buttons, headings |
| Secondary Purple | `#9F7AEA` | Accents, gradients |
| Dark | `#1A202C` | Text, headers |
| Gray | `#718096` | Secondary text |
| White | `#FFFFFF` | Backgrounds |
| Success Green | `#48BB78` | Success states |
| Error Red | `#F56565` | Error states |

### 1.4 Typography

| Element | Font | Weight | Size |
|---------|------|--------|------|
| H1 Headlines | Inter | Bold (700) | 32-48px |
| H2 Headlines | Inter | Semibold (600) | 24-32px |
| Body Text | Inter | Regular (400) | 16px |
| Captions | Inter | Regular (400) | 12-14px |
| Buttons | Inter | Semibold (600) | 16px |

**Font Source:** Google Fonts (Inter)

---

## 2. App Store Assets

### 2.1 iOS App Store

**App Icon:**
- Size: 1024x1024 pixels
- Format: PNG (no alpha)
- Style: Simple, recognizable at small sizes
- Must include app name or recognizable symbol

**Screenshots Required:**

| Device | Size | Quantity | Format |
|--------|------|----------|--------|
| iPhone 6.7" | 1290x2796 | 5-8 | PNG/JPG |
| iPhone 6.5" | 1242x2688 | 5-8 | PNG/JPG |
| iPhone 5.5" | 1242x2208 | 5-8 | PNG/JPG |
| iPad | 2048x2732 | 5-8 | PNG/JPG |

**Optional:**
- iPad Pro 12.9" screenshots
- iMessage app screenshots

### 2.2 Google Play Store

**App Icon:**
- Size: 512x512 pixels
- Format: PNG (32-bit with alpha)
- Style: Simple, recognizable

**Screenshots Required:**

| Device | Size | Quantity |
|--------|------|----------|
| Phone | 1080x1920 | 2-8 |
| Tablet 7" | 1200x1920 | 0-8 |
| Tablet 10" | 1600x2560 | 0-8 |

**Required Graphics:**
| Type | Size | Purpose |
|------|------|---------|
| Feature Graphic | 1024x500 | Store listing header |
| TV Banner | 1920x1080 | TV/play store header |

### 2.3 Screenshot Guidelines

**DOs:**
- Show actual app UI (not mockups)
- Use real content/data
- Highlight key features
- Add device frames
- Include captions/overlays

**DON'Ts:**
- Use generic stock images
- Show competitor apps
- Include outdated UI
- Misrepresent functionality
- Use copyrighted material

---

## 3. Product Photography

### 3.1 App UI Screenshots

**Standards:**
- Capture on actual devices
- Use latest iOS/Android versions
- Show real, representative data
- Minimum resolution: 1080p
- Consistent lighting across all shots

### 3.2 Lifestyle Images

**Usage:** Marketing materials, website, social media

**Standards:**
- Diverse representation (age, gender, ethnicity)
- Real-world settings
- Authentic scenarios
- High resolution (minimum 2400x1600)
- RAW + edited versions

### 3.3 Device Mockups

**Usage:** Website, presentations, social media

**Templates:** Available in `/marketing/mockups/`
- iPhone 15 Pro (all colors)
- iPhone 15 (all colors)
- Samsung Galaxy S24
- iPad Pro
- MacBook Pro

---

## 4. Video Assets

### 4.1 App Preview Videos

**iOS App Store:**
- Length: 15-30 seconds
- Resolution: 1080x1920 or 2160x3840
- Format: H.264, 15-30 fps
- No audio required but recommended
- Show key features in action

**Google Play Store:**
- Length: Up to 30 seconds
- Resolution: 1080x1920
- Format: MP4
- Include audio (optional)
- 10-15 seconds recommended for better engagement

### 4.2 Demo Videos

**Usage:** Website embeds, YouTube, presentations

**Standards:**
- Length: 60-90 seconds (short) or 2-3 minutes (full)
- Resolution: 1080p minimum
- Professional voiceover (or captions)
- Include product logo
- Call-to-action at end

### 4.3 Animated GIFs

**Usage:** Social media, presentations, README files

**Specifications:**
- Maximum file size: 5MB
- Resolution: 720p recommended
- Length: 3-5 seconds
- Loop: Infinite

---

## 5. Social Media Assets

### 5.1 Image Sizes

| Platform | Post Size | Story Size | Ad Size |
|----------|-----------|------------|---------|
| Facebook | 1200x630 | 1080x1920 | Various |
| Instagram | 1080x1080 | 1080x1920 | 1080x1080 |
| Twitter/X | 1600x900 | 1080x1920 | Various |
| LinkedIn | 1200x627 | - | 1200x627 |
| YouTube | 1280x720 (thumb) | 90x90 (avatar) | - |

### 5.2 Template Specifications

**Social Media Templates:**
Location: `/marketing/social-templates/`

| Template | Format | Usage |
|----------|--------|-------|
| Feature announcement | 1080x1080 | New features |
| How-to | 1080x1350 | Tutorials |
| Quote card | 1080x1080 | Testimonials, stats |
| Story template | 1080x1920 | Instagram/TikTok stories |
| Cover photo | Platform-specific | Facebook/LinkedIn covers |

### 5.3 Hashtags

**Brand Hashtags:**
- Primary: #REZApp
- Campaign: #[campaign-name]

**Suggested:**
- #LocalCommerce
- #QRPayments
- #IndianStartup

---

## 6. Website Assets

### 6.1 Hero Images

- Resolution: 2400x1600 minimum
- Format: WebP (primary), JPG (fallback)
- File size: Under 500KB

### 6.2 App Store Badges

**Apple Badge:**
```html
<!-- Download on the App Store -->
<img src="/assets/badge-app-store.svg" alt="Download on the App Store">
```

**Google Play Badge:**
```html
<!-- Get it on Google Play -->
<img src="/assets/badge-google-play.svg" alt="Get it on Google Play">
```

### 6.3 Favicon & App Icons

| Size | Usage |
|------|-------|
| 16x16 | Browser tab |
| 32x32 | Browser bookmark |
| 180x180 | Apple touch icon |
| 192x192 | Android home screen |
| 512x512 | PWA icon |

---

## 7. Print Assets

### 7.1 Business Cards

- Size: 3.5" x 2" (standard)
- Bleed: 0.125" on all sides
- Format: CMYK, PDF/X-1a

### 7.2 Brochures

| Type | Size | Pages | Format |
|------|------|-------|--------|
| Tri-fold | 11" x 8.5" (folded) | 2 | PDF |
| Bi-fold | 11" x 17" (folded) | 2 | PDF |
| Full page | 8.5" x 11" | 1-2 | PDF |

### 7.3 Presentation Templates

- 16:9 aspect ratio
- PowerPoint (.pptx) + Google Slides
- Brand colors applied automatically

---

## 8. Asset Organization

### 8.1 Directory Structure

```
marketing/
├── brand-assets/
│   ├── logos/
│   ├── colors/
│   ├── fonts/
│   └── icons/
├── app-store/
│   ├── ios/
│   └── android/
├── social-media/
│   ├── facebook/
│   ├── instagram/
│   ├── twitter/
│   └── linkedin/
├── website/
│   ├── heroes/
│   ├── features/
│   └── testimonials/
├── videos/
│   ├── app-previews/
│   ├── demos/
│   └── gifs/
├── print/
│   ├── business-cards/
│   ├── brochures/
│   └── presentations/
└── mockups/
```

### 8.2 Naming Convention

```
{product}-{type}-{variant}-{version}.{ext}

Examples:
- rez-consumer-app-icon-1.0.png
- do-app-screenshot-home-1080p.png
- adbazaar-hero-dark-2x.jpg
```

---

## 9. Quality Checklist

### Pre-Production
- [ ] Brand guidelines reviewed
- [ ] Assets approved by CMO
- [ ] Legal review for claims
- [ ] Accessibility check (contrast, alt text)

### Post-Production
- [ ] All required sizes generated
- [ ] File sizes optimized
- [ ] Formats correct
- [ ] Quality reviewed
- [ ] Stored in asset library
- [ ] Documented in this guide

---

## 10. Asset Requests

### How to Request New Assets

1. Submit request via [project management tool]
2. Include:
   - Product name
   - Use case
   - Dimensions
   - Deadline
   - Reference examples (if applicable)

### Turnaround Time

| Type | Standard | Rush (+50%) |
|------|----------|-------------|
| Social graphic | 2 days | 1 day |
| Screenshot set | 3 days | 2 days |
| Video (60s) | 1 week | 3 days |
| Photo shoot | 2 weeks | 1 week |

---

## 11. Asset Libraries

### Current Asset Locations

| Asset Type | Location |
|------------|----------|
| Brand logos | `/archives/ReZlogo.png` |
| App icons | Individual app `/assets/` |
| Mockups | `/marketing/mockups/` |
| Templates | `/marketing/templates/` |

### Cloud Storage
- Primary: [Cloud link TBD]
- Backup: [Backup link TBD]

---

## 12. Legal Considerations

### Do:
- Only use owned/licensed assets
- Credit photographers/designers
- Follow platform guidelines
- Include required disclosures

### Don't:
- Use stock photos as fake testimonials
- Misrepresent app functionality
- Use competitor logos/branding
- Include misleading pricing
- Violate copyright

---

**Document Version:** 1.0
**Last Updated:** 2026-05-04
**Owner:** CMO
**Next Review:** 2026-06-04
