# App Store Screenshot Specifications

## Overview

This document defines screenshot requirements for both ReZ Consumer and Merchant apps for Apple App Store submission.

---

## Consumer App (rez-app-consumer)

### iPhone 6.5" Display (1284 x 2778 px)

| # | Screen | Content | Background | Text Overlay |
|---|--------|---------|------------|--------------|
| 1 | Home | 5 category tiles (Food, Travel, Shopping, Hotels, Pay) + Hero banner | Gradient: #6C5CE7 to #A29BFE | "Discover Everything" |
| 2 | Search | Search bar + 6 product result cards in 2-column grid | Light gray #F8F9FA | "Find Products" |
| 3 | Product Detail | Large product image (60% height) + title, price, CTA button | White | "Add to Cart" button |
| 4 | Cart | 3 item rows with images, quantity steppers, remove buttons | White | "Total: ₹XXX" |
| 5 | Checkout Success | Checkmark animation, order ID, "Order Confirmed" | Gradient: #00B894 to #55EFC4 | "Track Order" |

### iPhone 5.5" Display (1242 x 2208 px)

| # | Screen | Content | Background | Text Overlay |
|---|--------|---------|------------|--------------|
| 1 | Home | 4 category tiles + hero banner | Gradient: #6C5CE7 to #A29BFE | "Discover Everything" |
| 2 | Search | Search bar + 4 product result cards | Light gray #F8F9FA | "Find Products" |
| 3 | Product Detail | Product image (55% height) + details + CTA | White | "Add to Cart" |
| 4 | Cart | 2 item rows | White | "Total: ₹XXX" |
| 5 | Checkout Success | Checkmark + order confirmation | Gradient: #00B894 to #55EFC4 | "Track Order" |

### iPad Pro 12.9" (2048 x 2732 px)

| # | Screen | Content | Background | Text Overlay |
|---|--------|---------|------------|--------------|
| 1 | Home | 6 category tiles + hero carousel + featured products | Gradient: #6C5CE7 to #A29BFE | "Discover Everything" |
| 2 | Search | Sidebar filters + 8 product cards in 3-column grid | Light gray #F8F9FA | "Find Products" |
| 3 | Product Detail | Split view: image left (50%), details right | White | "Add to Cart" |
| 4 | Cart | Full item list with thumbnails + order summary sidebar | White | "Total: ₹XXX" |
| 5 | Checkout Success | Large checkmark + order details + next steps | Gradient: #00B894 to #55EFC4 | "Track Order" |

---

## Merchant App (rez-app-merchant)

### iPhone 6.5" Display (1284 x 2778 px)

| # | Screen | Content | Background | Text Overlay |
|---|--------|---------|------------|--------------|
| 1 | Dashboard | Revenue card + Today's orders + Quick actions | Gradient: #0984E3 to #74B9FF | "Dashboard" |
| 2 | Orders | List view with status badges (New/Preparing/Ready) | White | "Orders" |
| 3 | Products | 2-column grid of product images + prices | White | "Catalog" |
| 4 | Analytics | Line chart (7-day sales) + stat cards | Dark #2D3436 | "Analytics" |
| 5 | POS | Numeric keypad + product quick-add + total | Dark #1E272E | "Quick Sale" |

### iPad Pro 12.9" (2048 x 2732 px)

| # | Screen | Content | Background | Text Overlay |
|---|--------|---------|------------|--------------|
| 1 | Dashboard | 4-quadrant layout: Revenue, Orders, Products, Alerts | Gradient: #0984E3 to #74B9FF | "Dashboard" |
| 2 | Orders | Split view: order list left, order details right | White | "Orders" |
| 3 | Products | 4-column grid + category sidebar | White | "Catalog" |
| 4 | Analytics | Full-width charts with date range picker | Dark #2D3436 | "Analytics" |
| 5 | POS | Split: product grid left, cart right + payment options | Dark #1E272E | "Quick Sale" |

---

## Design Guidelines

### Typography
- **Headlines:** SF Pro Display Bold, 32-48pt
- **Body:** SF Pro Text Regular, 16-20pt
- **Buttons:** SF Pro Text Semibold, 18pt
- **Caption/Status:** SF Pro Text Regular, 12-14pt

### Color Palette
| Purpose | Hex | Usage |
|---------|-----|-------|
| Primary | #6C5CE7 | Consumer app accent |
| Primary Dark | #0984E3 | Merchant app accent |
| Success | #00B894 | Confirmation screens |
| Background Light | #F8F9FA | Card backgrounds |
| Background Dark | #2D3436 | Merchant dark mode |
| Text Primary | #2D3436 | Headlines |
| Text Secondary | #636E72 | Body text |

### Safe Zones
- Top: 120px (status bar + nav)
- Bottom: 100px (home indicator + tab bar)
- Side margins: 60px

### Device Frame
- Use iPhone 14 Pro Max frame for 6.5" screenshots
- Use iPhone 8 Plus frame for 5.5" screenshots
- Use iPad Pro 12.9" frame for tablet screenshots
- Frame color: #1C1C1E (Space Gray)

---

## Export Requirements

| Format | Resolution | Color Profile | File Type |
|--------|------------|---------------|-----------|
| Screenshots | Native (see above) | Display P3 | PNG |
| App Icon | 1024x1024 | sRGB | PNG |
| Feature Graphic | 1748x620 | sRGB | PNG |

---

## Naming Convention

```
{app}-{device}-{screen#}-{variant}.png

Examples:
- consumer-iphone65-01-home.png
- consumer-iphone55-03-product.png
- consumer-ipad-05-success.png
- merchant-iphone65-04-analytics.png
```
