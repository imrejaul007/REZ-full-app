# Icons

This directory contains app icons for PWA installation.

## SVG Icons (Current)

- `icon-192.svg` - 192x192 app icon
- `icon-512.svg` - 512x512 app icon

## PNG Icons (Optional)

SVG icons work in all modern browsers. For older Safari/iOS support, generate PNG versions.

### Option 1: ImageMagick (Recommended)

```bash
# Install ImageMagick
brew install imagemagick  # macOS
apt install imagemagick    # Linux

# Convert SVGs to PNGs
convert public/icons/icon-192.svg -resize 192x192 public/icons/icon-192.png
convert public/icons/icon-512.svg -resize 512x512 public/icons/icon-512.png
convert public/icons/icon-192.svg -resize 180x180 public/icons/icon-180.png
```

### Option 2: Sharp (Node.js)

```bash
npm install sharp
npm run generate-icons
```

### Option 3: Online Converter

1. Open icon-512.svg in browser
2. Use CloudConvert, Squoosh, or similar
3. Save as `icon-192.png` and `icon-512.png`

## Icon Sizes

| Size    | Platform     | File            |
|---------|--------------|-----------------|
| 192x192 | Android/PWA | icon-192.png    |
| 512x512 | Android/PWA | icon-512.png    |
| 180x180 | iOS          | icon-180.png    |
| 167x167 | iPad Pro     | icon-167.png    |
| 152x152 | iPad         | icon-152.png    |
| 120x120 | iPhone       | icon-120.png    |

## Requirements

- iOS Safari requires 180x180 PNG icons
- Android/PWA accepts SVG or PNG
- favicon.svg works for desktop browsers
