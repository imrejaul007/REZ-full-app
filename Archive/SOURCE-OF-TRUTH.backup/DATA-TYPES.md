# REZ Platform — Canonical Data Types

Types live in `@rez/shared-types`. Local stubs in each app under `types/`.

**Updated:** 2026-04-18 — Gen 22: CoinType canonical values updated (6 types: promo/branded/prive/cashback/referral/rez). Consumer app `storePayment.types.ts` now imports canonical CoinType. `wallet-credit` orphan queue worker added (Gen 22). Payment.paymentMethod reconciled (Gen 27).

## Payment Status & Methods (Canonical — rez-payment-service)

**Canonical source**: `rez-payment-service/src/models/Payment.ts`

### PaymentStatus (11 values)
```typescript
type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'    // Note: NOT 'paid'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'refund_initiated'
  | 'refund_processing'
  | 'refunded'
  | 'refund_failed'
  | 'partially_refunded';
```

### PaymentMethod
```typescript
type PaymentMethod = 'upi' | 'card' | 'wallet' | 'netbanking';
```

### PaymentGateway
```typescript
type PaymentGateway = 'razorpay' | 'stripe' | 'paypal';
```

### PaymentPurpose
```typescript
type PaymentPurpose = 'order_payment' | 'wallet_topup' | 'event_booking' | 'financial_service' | 'other';
```

### Payment State Transitions (FSM)
```typescript
// Canonical: rez-payment-service/src/models/Payment.ts
const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending:         ['processing', 'cancelled', 'expired'],
  processing:      ['completed', 'failed', 'cancelled'],
  completed:       ['refund_initiated'],
  failed:          [],
  cancelled:       [],
  expired:         [],
  refund_initiated:      ['refund_processing'],
  refund_processing:     ['refunded', 'refund_failed', 'partially_refunded'],
  refunded:              [],
  refund_failed:         [],
  partially_refunded:    ['refund_initiated'],
};
```

### IPayment
```typescript
interface IPayment {
  paymentId: string;
  orderId: string;
  user: mongoose.Types.ObjectId;
  amount: number;
  currency: string;       // default 'INR'
  paymentMethod: PaymentMethod;
  gateway?: PaymentGateway;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  userDetails: { name?: string; email?: string; phone?: string };
  metadata: Record<string, any>;
  gatewayResponse?: {
    gateway: string;
    transactionId?: string;
    paymentUrl?: string;
    qrCode?: string;
    upiId?: string;
    expiryTime?: Date;
    timestamp: Date;
  };
  failureReason?: string;
  walletCredited?: boolean;
  walletCreditedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  expiresAt?: Date;
  refundedAmount?: number;   // paise precision (Math.round(v * 100) / 100)
  paymentMeta?: {
    refundDispute?: {
      reportedAt: Date;
      expected: number;    // max refundable
      actual: number;      // actual refund amount
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Order Types (Canonical — rez-app-consumer)

**Canonical source**: `rez-app-consumer/types/order.ts`

### OrderStatus (14 values)
```typescript
type OrderStatus =
  | 'placed' | 'confirmed' | 'preparing' | 'ready' | 'dispatched'
  | 'out_for_delivery' | 'failed_delivery' | 'delivered'
  | 'cancelling' | 'cancelled'
  | 'return_requested' | 'return_rejected' | 'returned' | 'refunded';
```

### DeliveryStatus
```typescript
type DeliveryStatus =
  | 'pending' | 'confirmed' | 'preparing' | 'ready'
  | 'dispatched' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
```

### OrderItem
```typescript
interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  subtotal: number;
  variant?: { size?: string; color?: string; material?: string };
}
```

### Order
```typescript
interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  // Canonical totals — prefer over flat deprecated fields
  totals?: {
    subtotal: number; tax: number; delivery: number;
    discount: number; lockFeeDiscount?: number; cashback: number;
    total: number; paidAmount: number; refundAmount?: number;
    platformFee: number; merchantPayout: number;
  };
  // Deprecated — use totals.*
  subtotal: number; tax: number; shipping: number;
  discount: number; total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  shippingAddress: ShippingAddress;
  paymentMethod: { type: 'card' | 'upi' | 'wallet' | 'cod'; lastFour?: string; brand?: string };
  trackingNumber?: string; estimatedDelivery?: string; actualDelivery?: string; notes?: string;
  createdAt: string; updatedAt: string;
  // Both 'user' and 'customer' are valid aliases for the user reference
  user?: { id?: string; name?: string; email?: string; phone?: string } | string;
  customer?: { id?: string; name?: string; email?: string; phone?: string } | string;
}
```

### ShippingAddress
```typescript
interface ShippingAddress {
  id: string; name: string; addressLine1: string; addressLine2?: string;
  city: string; state: string; postalCode: string; country: string; phone: string; isDefault: boolean;
}
```

---

## Merchant Types (Canonical — rez-merchant-service)

**Canonical source**: `rez-merchant-service/src/models/Merchant.ts`

### MerchantStatus
```typescript
type MerchantStatus = 'pending' | 'verified' | 'rejected';
type MerchantPlan = 'starter' | 'growth' | 'pro' | 'enterprise';
type OnboardingStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
type ComputedStatus = 'approved' | 'suspended' | 'rejected' | 'pending';
```

### IMerchant
```typescript
interface IMerchant {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;       // select: false
  phone: string;
  businessAddress: {
    street: string; city: string; state: string; zipCode: string; country: string;
    coordinates?: { latitude: number; longitude: number };
  };
  verificationStatus: MerchantStatus;
  isActive: boolean;
  businessLicense?: string; taxId?: string; website?: string; description?: string; logo?: string;
  emailVerified: boolean;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  lastLoginAt?: Date;
  onboarding: IOnboarding;
  currentPlan?: MerchantPlan;
  planExpiresAt?: Date;
  displayName?: string; tagline?: string; coverImage?: string; galleryImages?: string[];
  brandColors?: { primary?: string; secondary?: string; accent?: string };
  categories?: string[]; tags?: string[];
  isFeatured?: boolean; isPubliclyVisible?: boolean; searchable?: boolean;
  acceptingOrders?: boolean; showInDirectory?: boolean;
  readonly computedStatus?: ComputedStatus;  // virtual: approved/suspended/rejected/pending
  createdAt: Date; updatedAt: Date;
}
```

### IOnboarding
```typescript
interface IOnboarding {
  status: OnboardingStatus;
  currentStep: number;
  completedSteps: number[];
  stepData: {
    businessInfo?: IOnboardingBusinessInfo;
    storeDetails?: IOnboardingStoreDetails;
    bankDetails?: IOnboardingBankDetails;   // encrypted at rest
    verification?: IOnboardingVerification;
  };
  startedAt?: Date; completedAt?: Date; rejectionReason?: string;
}

interface IOnboardingBusinessInfo {
  companyName?: string; businessType?: string;
  registrationNumber?: string; gstNumber?: string; panNumber?: string;
}

interface IOnboardingStoreDetails {
  storeName?: string; description?: string; category?: string;
  logoUrl?: string; bannerUrl?: string;
  address?: { street?: string; city?: string; state?: string; zipCode?: string; country?: string; landmark?: string };
}

interface IOnboardingBankDetails {
  accountNumber?: string; ifscCode?: string;
  accountHolderName?: string; bankName?: string; branchName?: string;
}

interface IOnboardingDocument {
  type: string;  // 'business_license' | 'id_proof' | 'address_proof' | 'gst_certificate' | 'pan_card'
  url: string; status: 'pending' | 'verified' | 'rejected'; rejectionReason?: string; uploadedAt: Date;
}

interface IOnboardingVerification {
  documents: IOnboardingDocument[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date; verifiedBy?: string;
}
```

---

## Store Types (Canonical — rez-merchant-service)

**Canonical source**: `rez-merchant-service/src/models/Store.ts`

### IStore
```typescript
interface IStore {
  merchantId: Types.ObjectId;
  name: string;
  slug?: string;
  description?: string; logo?: string; banner?: string[];
  category: string; subcategories?: string[];
  location: {
    address: string; city: string; state?: string; pincode?: string;
    coordinates?: [number, number];  // [lng, lat] (GeoJSON)
    deliveryRadius?: number; landmark?: string;
  };
  contact?: { phone?: string; email?: string; website?: string; whatsapp?: string };
  operationalInfo?: {
    hours?: any; dineIn?: boolean; delivery?: boolean; takeaway?: boolean; orderingMode?: string[];
  };
  ratings?: {
    average: number; count: number;
    distribution?: { 5?: number; 4?: number; 3?: number; 2?: number; 1?: number };
  };
  offers?: { cashback?: number; minOrderAmount?: number; maxCashback?: number; isPartner?: boolean };
  isActive: boolean; isListed: boolean; isVerified: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  tags?: string[]; features?: string[];
  // REZ Now fields
  storeType?: 'restaurant' | 'cafe' | 'bakery' | 'salon' | 'spa' | 'retail' | 'other';
  fssaiNumber?: string; gstNumber?: string;
  googlePlaceId?: string; instagramHandle?: string; facebookUrl?: string; twitterHandle?: string; websiteUrl?: string;
  acceptsOnlineOrders?: boolean; acceptsScanPay?: boolean; showLoyaltyStamps?: boolean;
  deliveryEnabled?: boolean; deliveryRadiusKm?: number; deliveryFee?: number;
  storeLatitude?: number; storeLongitude?: number;
  createdAt: Date; updatedAt: Date;
}
```

---

## Product Types (Canonical — rez-merchant-service)

**Canonical source**: `rez-merchant-service/src/models/Product.ts`

### IProductImage
```typescript
interface IProductImage { url: string; alt?: string; isPrimary?: boolean; }
```

### IProduct
```typescript
interface IProduct {
  store: Types.ObjectId; merchant: Types.ObjectId;
  name: string; slug?: string; description?: string;
  category?: string; subcategory?: string;
  images: IProductImage[];    // stored as IProductImage[] (not flat string[])
  pricing: {
    original: number;  // was 'mrp' — canonical now is 'original'
    selling: number;
    discount?: number; currency: string; gst?: any;
  };
  inventory: {
    stock: number; isAvailable: boolean; lowStockThreshold?: number; variants?: any[]; unlimited: boolean;
  };
  ratings?: { average: number; count: number };
  sku?: string; barcode?: string; tags?: string[];
  isActive: boolean; isVeg?: boolean; isFeatured?: boolean; sortOrder?: number;
  preparationTime?: number; weight?: number; itemType?: string;
  createdAt: Date; updatedAt: Date;
}
```

---

## Wallet Types (rez-wallet-service)

### TransactionType
```typescript
type TransactionType =
  | 'qr_credit' | 'qr_debit' | 'coin_earned' | 'coin_spent'
  | 'cashback' | 'refund' | 'referral_bonus' | 'adjustment' | 'lock_fee';
```

### TransactionStatus
```typescript
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';
```

### CoinType
```typescript
// Canonical: packages/rez-shared/src/constants/coins.ts + types/enums/index.ts
// Priority order (for display/ranking): promo → branded → prive → cashback → referral → rez
type CoinType = 'promo' | 'branded' | 'prive' | 'cashback' | 'referral' | 'rez';
```

### WalletBalance
```typescript
interface WalletBalance {
  userId: string; coinBalance: number; cashbackBalance: number;
  totalEarned: number; totalSpent: number; lockedCoins: number; coinType: CoinType;
}
```

### QRCredit
```typescript
interface QRCredit {
  storeId: string; merchantId: string; amount: number;
  coinsEarned: number; dailyCapUsed: number; dailyCapRemaining: number;
}
```

---

## Unified App Types (rez-app-consumer/types/unified)

### Store
```typescript
interface Store {
  id?: string; name?: string;
  location?: {
    address?: string;
    coordinates?: { latitude?: number; longitude?: number };
    city?: string; state?: string; country?: string; postalCode?: string;
  };
  hours?: Record<string, unknown>;
  status?: { isOpen?: boolean; status?: string };
  verified?: boolean; storeType?: 'physical' | 'online' | 'hybrid';
  delivery?: { isAvailable?: boolean }; pickup?: { isAvailable?: boolean };
}
```

### Product
```typescript
interface Product {
  id?: string; name?: string; storeId?: string;
  price?: { current?: number; original?: number; currency?: string };
  images?: Array<{ id?: string; url?: string; alt?: string; isMain?: boolean }>;
  inventory?: { stock?: number; isAvailable?: boolean };
  productType?: 'product' | 'service' | 'event';
  availabilityStatus?: 'in_stock' | 'low_stock' | 'out_of_stock'; isOnSale?: boolean;
}
```

### CartItem
```typescript
interface CartItem {
  id: string; productId?: string; storeId?: string; name?: string;
  price?: number; quantity?: number;
  category?: 'products' | 'services' | 'events';
  availabilityStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  inventory?: { stock?: number; isAvailable?: boolean };
  isLocked?: boolean; lockExpiresAt?: string;
}
```

---

## Key Naming Rules

| Field | Canonical Name | Deprecated |
|-------|--------------|-----------|
| Product MRP | `pricing.original` | `pricing.mrp` |
| Delivery fee | `totals.delivery` | `shipping`, `shippingCost`, `deliveryFee` |
| Payment complete | `completed` | `paid` |
| Store owner ref | `merchantId` | `merchant` (legacy) |
| Product images | `IProductImage[]` (objects) | `string[]` (flat) |
| User ref in Order | `user` or `customer` | — |

## Type Import Rules

| Type | Canonical Source | Use |
|------|----------------|-----|
| `PaymentStatus`, `PaymentMethod`, `PaymentGateway`, `IPayment` | `rez-payment-service/src/models/Payment.ts` | Source of truth for payments |
| `OrderStatus`, `Order`, `OrderItem`, `PaymentStatus` | `rez-app-consumer/types/order.ts` | Source of truth for orders |
| `IMerchant`, `IOnboarding*` | `rez-merchant-service/src/models/Merchant.ts` | Source of truth for merchants |
| `IStore` | `rez-merchant-service/src/models/Store.ts` | Source of truth for stores |
| `IProduct`, `IProductImage` | `rez-merchant-service/src/models/Product.ts` | Source of truth for products |
| `WalletBalance`, `TransactionType` | `rez-wallet-service/models/` | Source of truth for wallet |
| `Store`, `Product`, `CartItem` | `rez-app-consumer/types/unified/` | App-level stubs |

**Rule**: Never duplicate these types. Import from canonical source.

---

## ReZ NoW — Web Ordering Order History (2026-04-18)

**Updated:** 2026-04-18 — `webOrderingRoutes.ts:1496` — GET `/api/web-ordering/orders/history` now returns full item data for reorder pre-fill.

```typescript
// NW-CRIT-009 FIX: items returned with menuItemId + price for reorder
interface OrderHistoryItem {
  orderNumber: string;
  items: OrderHistoryItemProduct[];
  // ... other fields
}

interface OrderHistoryItemProduct {
  menuItemId: string | null; // for cart deduplication
  name: string;
  quantity: number;
  price: number; // in paise — from original order
}
```
