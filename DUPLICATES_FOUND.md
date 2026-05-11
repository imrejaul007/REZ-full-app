# ReZ Codebase - Duplicate Features Analysis

**Generated:** 2026-05-08
**Total Service Files:** 1,054 (excluding backups and node_modules)

---

## 1. LOYALTY IMPLEMENTATIONS (CRITICAL)

### Duplicate LoyaltyService Classes
| File | Location |
|------|----------|
| `loyaltyService.ts` | `rez-app-merchant/src/services/loyaltyService.ts` |
| `loyalty.ts` | `rez-app-merchant/services/loyalty.ts` |
| `loyaltyService.ts` | `Hotel OTA/hotel-pms/hotel-management-master/frontend/src/services/loyaltyService.ts` |
| `loyaltyService.ts` | `Hotel-OTA/hotel-pms/hotel-management-master/frontend/src/services/loyaltyService.ts` |
| `loyalty.ts` | `docs/archive/rez-admin-pair/rezadmin/services/api/loyalty.ts` |
| `loyalty.ts` | `docs/archive/rez-admin-pair/rezadmin/rez-admin-main/services/api/loyalty.ts` |
| `loyalty.ts` | `docs/archive/rez-admin-pair/rez-app-admin/services/api/loyalty.ts` |
| `loyalty.ts` | `rez-app-admin/services/api/loyalty.ts` |

### Duplicate Loyalty Client Libraries
| File | Purpose |
|------|---------|
| `rez-mind-loyalty.ts` | Mind loyalty client |
| `universal-loyalty.ts` | Universal loyalty client |
| `karma-loyalty.ts` | Karma loyalty client |

### Duplicate Loyalty API Routes
| File | Purpose |
|------|---------|
| `rez-now/app/api/loyalty/route.ts` | Main loyalty API |
| `rez-now/app/api/loyalty/[userId]/route.ts` | User-specific loyalty |
| `rez-now/app/api/loyalty/redeem/route.ts` | Loyalty redemption |

### Duplicate Backend Loyalty Routes
| File | Purpose |
|------|---------|
| `rez-backend-master/src/routes/loyaltyRoutes.ts` | Main loyalty routes |
| `rez-backend-master/src/routes/admin/loyalty.ts` | Admin loyalty routes |
| `rez-backend-master/src/routes/admin/loyaltyMilestones.ts` | Loyalty milestones |
| `rez-backend-master/src/controllers/loyaltyController.ts` | Loyalty controller |
| `rez-backend-master/src/controllers/loyaltyRedemptionController.ts` | Redemption controller |
| `rez-backend-master/src/merchantroutes/loyaltyRoutes.ts` | Merchant loyalty routes |
| `rez-merchant-service/src/routes/loyalty.ts` | Merchant service loyalty |
| `rez-merchant-service/src/routes/loyaltyConfig.ts` | Loyalty config |
| `rez-merchant-service/src/routes/loyaltyTiers.ts` | Loyalty tiers |

### Duplicate Frontend Loyalty Pages/Components
| Directory | Location |
|-----------|----------|
| `loyalty/` | `rez-now/components/loyalty/` |
| `loyalty/` | `rez-now/lib/loyalty/` |
| `loyalty/` | `rez-now/lib/api/loyalty/` |
| `loyalty/` | `rez-app-consumer/components/loyalty/` |
| `loyalty/` | `rez-app-consumer/app/MainCategory/[slug]/loyalty/` |
| `loyalty/` | `rez-app-merchant/app/loyalty/` |
| `loyalty/` | `rez-app-merchant/app/(dashboard)/loyalty/` |
| `loyalty/` | `rez-app-admin/app/(dashboard)/loyalty/` |
| `loyalty-program.tsx` | `rez-app-merchant/app/stores/[id]/loyalty-program.tsx` |

**CONFLICT:** Multiple loyalty tiers definitions with potential diamond problem (see `rez-scheduler-service/docs/Gaps/HIGH-011-loyalty-tier-typo-diamond.md`)

---

## 2. ORDER SERVICES (HIGH)

### Duplicate OrderService Classes
| File | Service |
|------|---------|
| `OrderService.ts` | `rez-core-platform/services/user-intelligence/src/services/integrations/OrderService.ts` |
| `orderService.ts` | `rez-app-merchant/src/services/orderService.ts` |
| `OrderService.ts` | `rez-user-intelligence-service/src/services/integrations/OrderService.ts` |
| `OrderService.ts` | `packages/intelligence-platform/services/REZ-user-intelligence-service/src/services/integrations/OrderService.ts` |
| `orderService.ts` | `rez-order-service/src/services/orderService.ts` |
| `WhatsAppOrderService.ts` | `rez-backend/src/services/whatsappOrderService.ts` |

### Duplicate Order Service Directories
| Directory |
|-----------|
| `rez-order-service/` (ACTIVE) |
| `rez-order-service.backup/` |
| `shared-types/rez-order-service/` |
| `rez-web-menu/rez-order-service/` |
| `Resturistan App/restauranthub/apps/order-service/` |

### Duplicate Order Frontend Directories
| Directory | Location |
|-----------|----------|
| `orders/` | `rez-app-consumer/app/orders/` |
| `order/` | `rez-app-consumer/app/order/` |
| `orders/` | `rez-app-consumer/components/orders/` |
| `order/` | `rez-app-consumer/components/order/` |
| `orders/` | `rez-now/app/orders/` |
| `order/` | `rez-now/components/order/` |
| `orders/` | `rez-app-merchant/app/orders/` |
| `orders/` | `rez-app-merchant/app/(orders)/` |
| `orders/` | `rez-app-merchant/app/(dashboard)/orders/` |
| `purchase-orders/` | `rez-app-merchant/app/purchase-orders/` |
| `web-order/` | `rez-app-merchant/app/orders/web-order/` |
| `group-orders/` | `rez-app-merchant/app/(dashboard)/group-orders/` |

---

## 3. PAYMENT SERVICES (HIGH)

### Duplicate PaymentService Classes
| File | Location |
|------|----------|
| `paymentService.ts` | `rez-payment-service/src/services/paymentService.ts` |
| `paymentService.ts` | `rez-payment-service.backup/src/services/paymentService.ts` |
| `paymentService.ts` | `adBazaar/src/lib/paymentService.ts` |
| `paymentService.ts` | `adBazaar.backup/src/lib/paymentService.ts` |
| `paymentService.ts` | `rez-app-consumer/services/paymentService.ts` |
| `paymentService.ts` | `Hotel OTA/hotel-pms/hotel-management-master/frontend/src/services/paymentService.ts` |
| `paymentService.ts` | `Hotel-OTA/hotel-pms/hotel-management-master/frontend/src/services/paymentService.ts` |

### Duplicate Payment Related Files
- `src/entities/payment.ts` and `src/entities/payment.d.ts`
- `src/schemas/payment.schema.ts` and `src/schemas/payment.schema.d.ts`
- `src/fsm/paymentFsm.ts` and `src/fsm/paymentFsm.d.ts`
- Multiple payment routes across services

---

## 4. NOTIFICATION SERVICES (CRITICAL)

### Duplicate NotificationService Classes (14+ implementations)
| File | Location |
|------|----------|
| `notificationService.ts` | `REZ-notifications-hub/src/app.ts` |
| `notificationService.ts` | `rez-push-service/src/notificationService.ts` |
| `notificationService.ts` | `rez-push-service/src/services/notificationService.js` |
| `notificationService.ts` | `rez-app-consumer/services/notificationService.ts` |
| `notificationService.ts` | `rez-app-merchant/services/notificationService.ts` |
| `notificationService.ts` | `rez-app-merchant/src/services/notificationService.ts` |
| `notificationService.ts` | `rez-ad-campaigns/src/services/notificationService.ts` |
| `notificationService.ts` | `rez-gamification-service/src/services/notificationService.ts` |
| `notificationService.ts` | `rez-gamification-service.backup/src/services/notificationService.ts` |
| `notificationService.ts` | `rez-karma-service/src/services/notificationService.ts` |
| `notificationService.ts` | `rez-marketing/src/services/notificationService.ts` |
| `notificationService.ts` | `rez-ads-service/src/services/notificationService.ts` |
| `notificationService.ts` | `rez-ai-platform/services/push-service/src/notificationService.ts` |
| `notificationService.ts` | `Hotel OTA/hotel-pms/hotel-management-master/backend/src/services/notificationService.js` |
| `notificationService.ts` | `Hotel OTA/hotel-pms/hotel-management-master/frontend/src/services/notificationService.ts` |
| `notificationService.ts` | `Hotel-OTA/hotel-pms/hotel-management-master/backend/src/services/notificationService.js` |
| `notificationService.ts` | `Hotel-OTA/hotel-pms/hotel-management-master/frontend/src/services/notificationService.ts` |
| `notificationService.ts` | `rezbackend/rez-backend-master/src/services/notificationService.ts` |
| `notificationService.ts` | `rez-marketing-backend/services/ads-service/src/services/notificationService.ts` |
| `notificationService.ts` | `rez-marketing-backend/services/marketing-service/src/services/notificationService.ts` |
| `notificationService.ts` | `packages/marketing-platform/services/rez-marketing-service/src/services/notificationService.ts` |

### Duplicate Notification Related Files
- `notificationCategory.ts` in `rez-shared/src/notificationCategory.ts`
- `notification.ts` in multiple locations: `src/entities/notification.ts`, `rez-app-consumer/stores/notificationStore.ts`
- Multiple notification schemas and types

---

## 5. BACKUP DIRECTORIES

The following services have duplicate `.backup` directories that may be orphaned:

| Active | Backup |
|--------|--------|
| `rez-payment-service/` | `rez-payment-service.backup/` |
| `rez-order-service/` | `rez-order-service.backup/` |
| `rez-insights-service/` | `rez-insights-service.backup/` |
| `rez-gamification-service/` | `rez-gamification-service.backup/` |
| `rez-search-service/` | `rez-search-service.backup/` |
| `rez-scheduler-service/` | `rez-scheduler-service.backup/` |
| `rez-automation-service/` | `rez-automation-service.backup/` |
| `adBazaar/` | `adBazaar.backup/` |

---

## 6. ARCHIVED DOCUMENTATION

Duplicate archived projects that may be obsolete:
- `docs/archive/rez-admin-pair/` - Multiple versions of admin panel
- `Hotel OTA/` and `Hotel-OTA/` - Duplicate hotel management systems

---

## RECOMMENDATIONS

### Priority 1: Consolidate Notification Services
1. Create unified `rez-notification-service` package
2. Deprecate 14+ notification service implementations
3. Migrate all consumers to use single package

### Priority 2: Consolidate Loyalty Implementation
1. Standardize on `packages/rez-loyalty-client` as single source
2. Merge duplicate `LoyaltyService` classes
3. Consolidate API routes in `rez-now/app/api/loyalty/`
4. Remove duplicate hotel loyalty implementations (Hotel OTA/)

### Priority 3: Consolidate Order Services
1. Identify canonical `OrderService` (likely `rez-order-service/`)
2. Merge intelligence platform order services with core
3. Consolidate frontend order directories
4. Remove backup directories

### Priority 4: Consolidate Payment Services
1. Standardize on `rez-payment-service/` as canonical
2. Remove payment service duplicates in Hotel OTA/
3. Clean up payment entity/schema duplications

### Priority 5: Archive Cleanup
1. Remove all `.backup` directories (or clearly document retention policy)
2. Archive `docs/archive/` duplicates
3. Document Hotel OTA/Hotel-OTA relationship

### Actions Required
- [ ] Create shared service packages for Notification, Loyalty, Order, Payment
- [ ] Update all consumers to import from shared packages
- [ ] Set up deprecation warnings for duplicate implementations
- [ ] Create migration guide for each service consolidation
- [ ] Remove backup directories after migration verification
- [ ] Add linting rules to prevent future duplication
