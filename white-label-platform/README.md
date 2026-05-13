# WHITE-LABEL PLATFORM

## RESELLER PROGRAM

### Pricing
| Plan | Price/mo | Features |
|------|---------|---------|
| Starter | ₹999 | 1 brand |
| Pro | ₹2999 | 5 brands |
| Enterprise | ₹9999 | Unlimited |
| Custom | Contact | API access |

### Features
- [x] Custom domain
- [x] Branded app
- [x] Custom colors
- [x] Logo/Branding
- [ ] API access
- [ ] White-label dashboard
- [ ] Reseller portal

### API Access (Enterprise)
```javascript
// Create brand
POST /api/brands
{
  "name": "MyBrand",
  "subdomain": "mybrand",
  "customDomain": "app.mybrand.com"
}
```

### Dashboard
```javascript
// Brand admin
GET /api/brands/:id/dashboard
```

### Webhooks
```javascript
// Event notifications
POST /api/webhooks/:brandId
{
  "events": ["order.created", "payment.completed"]
}
```
