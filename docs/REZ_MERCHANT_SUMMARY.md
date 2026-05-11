# ReZ Merchant - Quick Reference

**Date:** May 8, 2026

---

## What Exists

### By Numbers
| Category | Count |
|----------|-------|
| Route Files | 168 |
| Model Files | 83 |
| Service Files | 20 |
| Middleware | 17 |

### By Vertical
| Vertical | Coverage |
|----------|----------|
| Restaurant | 85% |
| Salon | 70% |
| Fitness | 60% |
| Events | 50% |
| Healthcare | 50% |
| Hotel | 40% |

---

## What's Built

### Core
- [x] Store management
- [x] Product/menu CRUD
- [x] Order management
- [x] Customer management
- [x] Analytics & reporting
- [x] Multi-store support

### Loyalty
- [x] Points system
- [x] Tier system (Bronze/Silver/Gold/Platinum)
- [x] Referral program
- [x] Milestones
- [x] Auto-apply offers
- [x] Gift cards
- [x] Punch cards

### AI Features
- [x] Demand forecasting
- [x] Dynamic pricing (surge/happy hour)
- [x] LTV prediction
- [x] Churn detection
- [x] Smart inventory
- [x] Voice ordering
- [x] Voice KDS
- [x] Offer optimization

### Integrations
- [x] Swiggy
- [x] Zomato
- [x] Magicpin
- [x] WhatsApp
- [x] Razorpay
- [x] Tally
- [x] Google OAuth
- [ ] Apple OAuth (partial)

---

## What's Missing

### High Priority
- [ ] Split bill
- [ ] Social login (Apple)
- [ ] Delivery tracking
- [ ] Driver app

### Medium Priority
- [ ] Waitlist management
- [ ] Multi-location dashboard

### New Verticals
- [ ] Education
- [ ] Auto
- [ ] Real Estate

---

## File Structure

```
rez-merchant-service/src/
├── routes/         # 168 route files
├── routers/        # 15 route aggregators
├── services/       # 20 business services
├── models/         # 83 database models
├── middleware/     # 17 middleware
├── config/         # Configuration
└── utils/          # Utilities
```

---

## API Endpoints (Main)

| Category | Count |
|----------|-------|
| Auth | 5+ |
| Stores | 5+ |
| Products | 10+ |
| Orders | 5+ |
| Customers | 5+ |
| Analytics | 10+ |
| Marketing | 20+ |
| Operations | 10+ |
| Staff | 10+ |
| Loyalty | 10+ |

---

## Issues

### Code Quality
- 15+ files with `@ts-nocheck`
- Some missing error handling
- Some mock data in production

### Duplicates
- demandForecast.ts + demandForecastAgent.ts
- dynamicPricing.ts + dynamicPricingAgent.ts

---

## Full Documentation

See: `/docs/REZ_MERCHANT_COMPLETE_DOCUMENTATION.md`
