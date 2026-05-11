# App Store Asset Checklist

## Consumer App (rez-app-consumer)

### App Icons
| Asset | Status | Dimensions | Notes |
|-------|--------|------------|-------|
| App Store Icon | TODO | 1024x1024 | Primary listing icon |
| iPhone 180px | TODO | 180x180 | iPhone @3x |
| iPhone 120px | TODO | 120x120 | iPhone @2x |
| iPhone 87px | TODO | 87x87 | iPhone @2.9x (legacy) |
| iPad 152px | TODO | 152x152 | iPad @2x |
| iPad 167px | TODO | 167x167 | iPad Pro @2x |
| Android Play Store | TODO | 512x512 | Google Play |
| Android Adaptive | TODO | 192x192 | Android adaptive icon |
| Android Legacy | TODO | 48/72/96/144px | Legacy Android |

### iPhone 6.5" Screenshots (1284 x 2778 px)
| Screenshot | Status | Screen | Notes |
|------------|--------|--------|-------|
| S1 | TODO | Home | 5 categories + hero |
| S2 | TODO | Search | Product results |
| S3 | TODO | Product Detail | Image + CTA |
| S4 | TODO | Cart | 2-3 items |
| S5 | TODO | Checkout Success | Confirmation |

### iPhone 5.5" Screenshots (1242 x 2208 px)
| Screenshot | Status | Screen | Notes |
|------------|--------|--------|-------|
| S1 | TODO | Home | 4 categories + hero |
| S2 | TODO | Search | Product results |
| S3 | TODO | Product Detail | Image + CTA |
| S4 | TODO | Cart | 2 items |
| S5 | TODO | Checkout Success | Confirmation |

### iPad Pro 12.9" Screenshots (2048 x 2732 px)
| Screenshot | Status | Screen | Notes |
|------------|--------|--------|-------|
| S1 | TODO | Home | 6 categories + carousel |
| S2 | TODO | Search | Filter + grid |
| S3 | TODO | Product Detail | Split view |
| S4 | TODO | Cart | Full list + summary |
| S5 | TODO | Checkout Success | Large confirmation |

### Marketing Assets
| Asset | Status | Dimensions | Notes |
|-------|--------|------------|-------|
| Feature Graphic | TODO | 1748x620 | App Store search results |
| Promotional Graphic | TODO | 1199x400 | Optional banner |
| Subcategory Banner | TODO | 640x920 | Optional |

---

## Merchant App (rez-app-merchant)

### App Icons
| Asset | Status | Dimensions | Notes |
|-------|--------|------------|-------|
| App Store Icon | TODO | 1024x1024 | Primary listing icon |
| iPhone 180px | TODO | 180x180 | iPhone @3x |
| iPhone 120px | TODO | 120x120 | iPhone @2x |
| iPhone 87px | TODO | 87x87 | iPhone @2.9x (legacy) |
| iPad 152px | TODO | 152x152 | iPad @2x |
| iPad 167px | TODO | 167x167 | iPad Pro @2x |
| Android Play Store | TODO | 512x512 | Google Play |
| Android Adaptive | TODO | 192x192 | Android adaptive icon |
| Android Legacy | TODO | 48/72/96/144px | Legacy Android |

### iPhone 6.5" Screenshots (1284 x 2778 px)
| Screenshot | Status | Screen | Notes |
|------------|--------|--------|-------|
| S1 | TODO | Dashboard | Revenue + orders |
| S2 | TODO | Orders | List with status |
| S3 | TODO | Products | Grid catalog |
| S4 | TODO | Analytics | Charts |
| S5 | TODO | POS | Quick sale |

### iPad Pro 12.9" Screenshots (2048 x 2732 px)
| Screenshot | Status | Screen | Notes |
|------------|--------|--------|-------|
| S1 | TODO | Dashboard | 4-quadrant layout |
| S2 | TODO | Orders | Split view |
| S3 | TODO | Products | Grid + sidebar |
| S4 | TODO | Analytics | Full charts |
| S5 | TODO | POS | Split cart view |

### Marketing Assets
| Asset | Status | Dimensions | Notes |
|-------|--------|------------|-------|
| Feature Graphic | TODO | 1748x620 | App Store search results |
| Promotional Graphic | TODO | 1199x400 | Optional banner |

---

## Design Source Files

| File | Status | Format | Location |
|------|--------|--------|----------|
| Consumer Screenshot Templates | TODO | Figma/Sketch | /design/consumer-screens.fig |
| Merchant Screenshot Templates | TODO | Figma/Sketch | /design/merchant-screens.fig |
| App Icon - Consumer | TODO | Figma/Sketch | /design/consumer-icon.fig |
| App Icon - Merchant | TODO | Figma/Sketch | /design/merchant-icon.fig |
| Marketing Banners | TODO | Figma/Sketch | /design/marketing.fig |

---

## Submission Notes

### Required vs Optional
- **Required:** At least 1 screenshot per locale (5 recommended)
- **Optional:** Promotional graphics, subcategory banners

### Locale Coverage
| Locale | Priority | Notes |
|--------|----------|-------|
| English (US) | Required | Default |
| Hindi (IN) | Recommended | Primary market |
| Tamil (IN) | Optional | Regional |
| Telugu (IN) | Optional | Regional |

### File Size Limits
- Screenshots: Max 10MB each
- Icons: Max 10MB
- App bundle: 4GB max

---

## Export Settings

### Screenshots
- Format: PNG (lossless)
- Color: Display P3 (or sRGB for compatibility)
- Transparency: No (flat backgrounds)

### Icons
- Format: PNG (no alpha for Android)
- Color: sRGB
- Anti-aliasing: Enabled

### Naming
```
{app}-{locale}-{device}-{index}.{ext}

Examples:
consumer-en-US-iphone65-01.png
merchant-hi-IN-ipad-01.png
```
