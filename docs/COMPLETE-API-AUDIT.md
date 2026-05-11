# REZ ECOSYSTEM - COMPLETE API AUDIT
**Version:** 2.0  
**Date:** May 4, 2026  
**Total APIs: 1000+**

---

## SUMMARY BY SERVICE

| Service | APIs | Port |
|---------|------|------|
| **Merchant Service** | 716 | 4005 |
| **Wallet Service** | 74 | 4004 |
| **Karma Service** | 71 | 3009 |
| **Finance Service** | 42 | 4006 |
| **Search Service** | 36 | 4003 |
| **Payment Service** | 27 | 4001 |
| **Auth Service** | 20+ | 4002 |
| **Intent Graph** | 50+ | 3007 |
| **Intelligence Hub** | 5+ | 4020 |
| **Ads Service** | 10+ | 4007 |
| **Gamification** | 30+ | 3001 |
| **Marketing** | 20+ | 4000 |
| **Analytics** | 15+ | 3006 |
| **Notifications** | 10+ | 3005 |

---

## 1. AUTH SERVICE (rez-auth-service)
**Port: 4002**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/phone/send-otp | No | Send OTP via SMS/WhatsApp |
| POST | /api/auth/phone/verify-otp | No | Verify OTP |
| POST | /api/auth/refresh-token | JWT | Refresh access token |
| POST | /api/auth/logout | JWT | Logout user |
| POST | /api/auth/pin | JWT | Set/verify PIN |
| GET | /api/profile | JWT | Get user profile |
| PUT | /api/profile | JWT | Update profile |

---

## 2. WALLET SERVICE (rez-wallet-service)
**Port: 4004**

### Consumer
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/wallet/balance | JWT | Get wallet balance |
| GET | /api/wallet/transactions | JWT | Get transaction history |
| POST | /api/wallet/credit | JWT | Credit coins |
| POST | /api/wallet/debit | JWT | Debit coins |
| GET | /api/wallet/summary | JWT | Get wallet summary |

### Merchant
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/merchant/wallet | JWT | Get merchant wallet |
| GET | /api/merchant/wallet/stats | JWT | Get wallet stats |
| POST | /api/merchant/wallet/withdraw | JWT | Withdraw funds |
| GET | /api/merchant/wallet/withdrawals | JWT | Get withdrawal history |

### Corp
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/corp/me | JWT | Get corp profile |
| GET | /api/corp/me/benefits | JWT | Get benefits |
| GET | /api/corp/employees | JWT | Get employees |

---

## 3. PAYMENT SERVICE (rez-payment-service)
**Port: 4001**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/payment/initiate | JWT | Initiate payment |
| POST | /api/payment/capture | JWT | Capture payment |
| POST | /api/payment/refund | JWT | Refund payment |
| GET | /api/payment/status/:paymentId | JWT | Get payment status |
| GET | /api/payment/merchant/settlements | JWT | Get settlements |
| POST | /api/payment/webhook/razorpay | No | Razorpay webhook |
| GET | /api/razorpay/config | No | Get Razorpay config |
| POST | /api/razorpay/create-order | JWT | Create order |
| POST | /api/razorpay/verify-payment | JWT | Verify payment |

---

## 4. ORDER SERVICE (rez-order-service)
**Port: 3006**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/orders | JWT | Create order |
| GET | /api/orders/:id | JWT | Get order |
| PUT | /api/orders/:id/status | JWT | Update status |
| GET | /api/orders/user/:userId | JWT | Get user orders |
| POST | /api/orders/:id/cancel | JWT | Cancel order |
| POST | /api/orders/:id/refund | JWT | Request refund |

---

## 5. MERCHANT SERVICE (rez-merchant-service)
**Port: 4005**
**Total: 716 APIs**

### Core (20+)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/merchants/:id | JWT | Get merchant |
| PUT | /api/merchants/:id | JWT | Update merchant |

### Stores (50+)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/stores | JWT | List stores |
| POST | /api/stores | JWT | Create store |
| GET | /api/stores/:id | JWT | Get store |
| PUT | /api/stores/:id | JWT | Update store |
| DELETE | /api/stores/:id | JWT | Delete store |

### Products (100+)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/products | JWT | List products |
| POST | /api/products | JWT | Create product |
| GET | /api/products/:id | JWT | Get product |
| PUT | /api/products/:id | JWT | Update product |
| DELETE | /api/products/:id | JWT | Delete product |
| POST | /api/products/bulk | JWT | Bulk upload |

### Orders (100+)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/orders | JWT | List orders |
| GET | /api/orders/:id | JWT | Get order |
| PUT | /api/orders/:id/status | JWT | Update status |
| GET | /api/orders/stats | JWT | Get order stats |

### KDS (50+)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/kds/orders | JWT | Get KDS orders |
| PUT | /api/kds/orders/:id | JWT | Update KDS order |

### Staff (100+)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/staff | JWT | List staff |
| POST | /api/staff | JWT | Add staff |
| PUT | /api/staff/:id | JWT | Update staff |
| DELETE | /api/staff/:id | JWT | Remove staff |

### Analytics (50+)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/analytics/overview | JWT | Get overview |
| GET | /api/analytics/sales | JWT | Get sales data |
| GET | /api/analytics/customers | JWT | Get customer data |
| GET | /api/analytics/products | JWT | Get product analytics |

---

## 6. SEARCH SERVICE (rez-search-service)
**Port: 4003**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/stores/search | No | Search stores |
| GET | /api/stores/nearby | No | Get nearby stores |
| GET | /api/stores/trending | No | Get trending stores |
| GET | /api/products/search | No | Search products |
| GET | /api/search/autocomplete | No | Autocomplete |
| GET | /api/search/history | JWT | Get search history |
| GET | /api/homepage | No | Get homepage |
| GET | /api/homepage/sections | No | Get sections |
| GET | /api/recommendations/trending | No | Get trending |
| GET | /api/recommendations/picked-for-you | JWT | Personalized picks |

---

## 7. FINANCE SERVICE (rez-finance-service)
**Port: 4006**

### Credit Score
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/finance/score | JWT | Get REZ score |
| POST | /api/finance/score/check | JWT | Check score |
| POST | /api/finance/score/refresh | JWT | Refresh score |

### Loans
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/finance/offers | JWT | Get loan offers |
| POST | /api/finance/apply | JWT | Apply for loan |
| GET | /api/finance/applications | JWT | Get applications |
| GET | /api/finance/applications/:id | JWT | Get application |
| POST | /api/finance/applications/:id/approve | JWT | Approve |
| POST | /api/finance/applications/:id/reject | JWT | Reject |

### BNPL
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/finance/bnpl/check | JWT | Check eligibility |
| POST | /api/finance/bnpl/create | JWT | Create BNPL |
| GET | /api/finance/bnpl/limit/:userId | JWT | Get limit |

### Risk Engine
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/finance/risk/fraud/:userId | JWT | Fraud detection |
| GET | /api/finance/risk/default/:userId | JWT | Default prediction |
| GET | /api/finance/marketplace/compare/:userId | JWT | Compare offers |

### GST
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/finance/gst/calculate | JWT | Calculate GST |
| GET | /api/finance/gst/invoices | JWT | Get invoices |

---

## 8. KARMA SERVICE (rez-karma-service)
**Port: 3009**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/karma/score/:userId | JWT | Get karma score |
| GET | /api/karma/leaderboard | JWT | Get leaderboard |
| GET | /api/karma/feed | JWT | Get karma feed |
| GET | /api/karma/history/:userId | JWT | Get history |
| POST | /api/karma/civic/join | JWT | Join civic corps |
| GET | /api/karma/civic/missions | No | List missions |
| POST | /api/karma/civic/missions/:id/enroll | JWT | Enroll |
| GET | /api/karma/batch | Admin | List batch jobs |

---

## 9. GAMIFICATION SERVICE (rez-gamification-service)
**Port: 3001**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/rewards/balance | JWT | Get coin balance |
| GET | /api/rewards/history | JWT | Get history |
| POST | /api/rewards/redeem | JWT | Redeem coins |
| GET | /api/missions/active | JWT | Get active missions |
| GET | /api/missions/:id | JWT | Get mission |
| POST | /api/missions/:id/complete | JWT | Complete mission |
| GET | /api/achievements | JWT | Get achievements |
| GET | /api/leaderboard/:type | No | Get leaderboard |

---

## 10. ADS SERVICE (rez-ads-service)
**Port: 4007**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/campaigns | JWT | List campaigns |
| POST | /api/campaigns | JWT | Create campaign |
| GET | /api/campaigns/:id | JWT | Get campaign |
| PUT | /api/campaigns/:id | JWT | Update campaign |
| POST | /api/campaigns/:id/start | JWT | Start campaign |
| POST | /api/campaigns/:id/pause | JWT | Pause campaign |
| POST | /api/events/attribution | No | Track attribution |
| POST | /api/events/conversion | No | Track conversion |

---

## 11. INTENT GRAPH (rez-intent-graph)
**Port: 3007**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/intent/capture | Internal | Capture intent |
| GET | /api/intent/user/:userId | JWT | Get user intents |
| GET | /api/intent/search | No | Search intents |
| GET | /api/intent/dormant | JWT | Get dormant users |
| GET | /api/memory/user/:userId | JWT | Get user memory |
| POST | /api/chat/message | JWT | Send message |

---

## 12. INTELLIGENCE HUB (rez-intelligence-hub)
**Port: 4020**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/finance/profile/:userId | JWT | Get finance profile |
| GET | /api/finance/ready-users | JWT | Get credit-ready users |
| GET | /api/finance/risk/:userId | JWT | Get risk prediction |
| GET | /api/intelligence/demand/:category | JWT | Get demand signal |

---

## 13. ANALYTICS (analytics-events)
**Port: 3006**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/events/track | No | Track event |
| POST | /api/events/batch | No | Batch track |
| GET | /api/analytics/user/:userId | JWT | User analytics |
| GET | /api/analytics/merchant/:id | JWT | Merchant analytics |

---

## 14. NOTIFICATIONS (rez-notification-events)
**Port: 3005**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/push/send | Internal | Send push |
| POST | /api/push/broadcast | Internal | Broadcast |
| POST | /api/whatsapp/send | Internal | Send WhatsApp |
| POST | /api/email/send | Internal | Send email |

---

## AUTHENTICATION TYPES

| Type | Header | Usage |
|------|--------|-------|
| User JWT | `Authorization: Bearer <token>` | User authentication |
| Internal Token | `x-internal-token: <token>` | Service-to-service |
| Admin | `Authorization: Bearer <admin-token>` | Admin operations |
| Optional | Either | Optional auth |
| None | None | Public endpoints |

---

## RESPONSE FORMAT

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

---

## STATUS CODES

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## DOCUMENTATION

| Document | Description |
|----------|-------------|
| `docs/COMPLETE-API-AUDIT.md` | This file |
| `docs/FINAL-AUDIT.md` | Ecosystem status |
| `docs/FINANCE-OS-POSITIONING.md` | Finance OS positioning |
| `docs/REZ-MIND-INTEGRATION.md` | ReZ Mind guide |
| `docs/MISSING-INTEGRATIONS.md` | Integration report |

---

*Complete API Audit - May 4, 2026*
