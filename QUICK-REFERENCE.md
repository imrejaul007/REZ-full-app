# RABTUL QUICK REFERENCE
## Everything in One Place

**Date:** May 12, 2026

---

## 🏢 THE 8 COMPANIES

| # | Company | What They Do |
|---|---------|--------------|
| 1 | RTMN Digital | Holding company |
| 2 | REZ Commerce | Consumer apps (ReZ, DO, Rendez) |
| 3 | REZ Intelligence | AI/ML (REZ Mind, Copilots) |
| 4 | RABTUL Technologies | Infrastructure (shared services) |
| 5 | REZ Media | Advertising (AdBazaar, AdSQR) |
| 6 | StayOwn Hospitality | Hotels (Hotel OTA, Habixo) |
| 7 | CorpPerks | Enterprise SaaS |
| 8 | RTMN Finance | Payments (Wallet, BNPL) |

---

## 🔗 RABTUL SERVICES (The "Internal AWS + Stripe")

### Core Services

| Service | Use For | Example |
|---------|---------|---------|
| **Auth** | Login, JWT, OTP | `verifyToken(token)` |
| **Payment** | Payments, Razorpay | `createPayment(order)` |
| **Wallet** | Coins, Balance | `getBalance(userId)` |
| **Order** | Orders, State machine | `createOrder(data)` |
| **Catalog** | Products, Menu | `getProducts(filter)` |
| **Search** | Full-text search | `search(query)` |
| **Notifications** | Push, SMS, Email | `sendNotification(user, msg)` |
| **Booking** | Reservations | `createBooking(data)` |

### Infrastructure

| Service | Use For |
|---------|---------|
| API Gateway | Routing, Rate limiting |
| Circuit Breaker | Failover |
| Retry Service | Exponential backoff |
| DLQ Service | Failed jobs |
| Idempotency | Deduplication |
| Policy Engine | Access control |
| Secrets Manager | Encryption |

---

## 📡 HOW TO USE RABTUL

### 1. Authenticate a User

```typescript
const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
  method: 'POST',
  headers: { 'X-Internal-Token': INTERNAL_SERVICE_TOKEN },
  body: JSON.stringify({ token })
});
```

### 2. Create a Payment

```typescript
const res = await fetch(`${PAYMENT_SERVICE_URL}/api/payments/initiate`, {
  method: 'POST',
  headers: { 'X-Internal-Token': INTERNAL_SERVICE_TOKEN },
  body: JSON.stringify({ amount: 1000, currency: 'INR' })
});
```

### 3. Send Notification

```typescript
const res = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
  method: 'POST',
  headers: { 'X-Internal-Token': INTERNAL_SERVICE_TOKEN },
  body: JSON.stringify({ userId, channel: 'PUSH', template: 'order_confirmed' })
});
```

---

## 🔒 THE RULES

### Before Creating ANY Service

```
1. Check RAP.md → Is it already there?
2. If YES → Use RABTUL's service
3. If NO → Request RABTUL to create it
```

### Forbidden

| ❌ Don't Do This | ✅ Do This |
|-----------------|-----------|
| Create local auth | Use `rez-auth-service` |
| Create local payment | Use `rez-payment-service` |
| Create local wallet | Use `rez-wallet-service` |
| Create local order | Use `rez-order-service` |
| Create local search | Use `rez-search-service` |
| Create local notifications | Use `rez-notifications-service` |

---

## 🌐 SERVICE URLs

```bash
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
PAYMENT_SERVICE_URL=https://rez-payment-service.onrender.com
WALLET_SERVICE_URL=https://rez-wallet-service-36vo.onrender.com
ORDER_SERVICE_URL=https://rez-order-service-hz18.onrender.com
CATALOG_SERVICE_URL=https://rez-catalog-service-1.onrender.com
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
NOTIFICATION_SERVICE_URL=https://rez-notifications-service.onrender.com
BOOKING_SERVICE_URL=https://rez-booking-service.onrender.com
INTERNAL_SERVICE_TOKEN=<get-from-rabtul>
```

---

## 📁 WHERE TO FIND THINGS

| What | Where |
|------|-------|
| Main documentation | `SOURCE-OF-TRUTH.md` |
| Service registry | `RABTUL-Technologies/RAP.md` |
| Governance rules | `RABTUL-Technologies/SERVICE-GOVERNANCE.md` |
| Migration guide | `RABTUL-Technologies/MIGRATION-GUIDE.md` |
| Audit reports | `RABTUL-Technologies/COMPREHENSIVE-AUDIT.md` |
| This quick ref | `QUICK-REFERENCE.md` |

---

## ⚡ QUICK TROUBLESHOOTING

| Problem | Solution |
|---------|---------|
| "Service not found" | Check `RAP.md` - service might have different name |
| "401 Unauthorized" | Add `X-Internal-Token` header |
| "Connection refused" | Check service URL in environment |
| "Timeout" | Service might be down - check Render status |

---

## 📞 HELP

- **Slack:** `#rabtul-support`
- **Issues:** `RABTUL-Technologies/issues`
- **Docs:** See above file locations

---

**Last Updated:** May 12, 2026
