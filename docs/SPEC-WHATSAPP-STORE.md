# REZ WhatsApp Store - Complete Specification

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** May 12, 2026

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [User Experience Flows](#2-user-experience-flows)
3. [Features & Capabilities](#3-features--capabilities)
4. [Component Specifications](#4-component-specifications)
5. [Message Templates](#5-message-templates)
6. [Payment Integration](#6-payment-integration)
7. [Order Management](#7-order-management)
8. [Analytics & Tracking](#8-analytics--tracking)
9. [Security & Compliance](#9-security--compliance)
10. [Performance Requirements](#10-performance-requirements)
11. [Error Handling](#11-error-handling)
12. [Multi-Tenant Architecture](#12-multi-tenant-architecture)

---

# 1. OVERVIEW

## 1.1 What is REZ WhatsApp Store?

REZ WhatsApp Store enables merchants to sell products and services directly through WhatsApp, with complete checkout flow - all without the customer leaving the chat.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WHATSAPP STORE - WHAT USER SEES │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Welcome to Spice Kitchen! 🍛 │
│  │
│  ┌─────────────────────────────────┐ │
│  │ 🖼️ Product Image │ │
│  │ Chicken Biryani │ │
│  │ ₹299 │ │
│  │ Rating: ⭐ 4.5 (230) │ │
│  │ │ │
│  │ [Add to Cart] [Customize] │ │
│  └─────────────────────────────────┘ │
│  │
│  Your Cart (2 items) │
│  │
│  1. Chicken Biryani × 1 = ₹299 │
│  2. Butter Naan × 2 = ₹80 │
│  │
│  Subtotal: ₹379 │
│  Delivery: ₹30 │
│  Total: ₹409 │
│  │
│  [🛒 View Cart] [💳 Checkout] │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Key Differentiators

| Feature | Competitors | REZ WhatsApp Store |
|---------|-------------|-------------------|
| Checkout | Redirect to website | **Complete in WhatsApp** |
| Cart | Single item | **Full cart management** |
| Payment | UPI link only | **REZ Wallet + UPI + Cards** |
| Customization | Static menu | **Real-time inventory** |
| Recommendations | None | **AI-powered suggestions** |
| Persistence | Session only | **Cross-session cart** |

## 1.3 Supported Commerce Types

| Type | Examples |
|------|----------|
| **Food Delivery** | Restaurants, cloud kitchens |
| **Retail** | Grocery, fashion, electronics |
| **Services** | Salon, spa, repairs |
| **Appointments** | Clinics, consultations |
| **Tickets** | Events, movies, travel |
| **Subscriptions** | Groceries, utilities |

---

# 2. USER EXPERIENCE FLOWS

## 2.1 Complete Purchase Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER FLOW: COMPLETE PURCHASE │
└─────────────────────────────────────────────────────────────────────────────┘

START: User sends "Hi" or clicks CTA
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: GREETING & PRODUCT DISCOVERY │
│ │
│ Bot: "Hey [Name]! 👋 │
│      Welcome to [Merchant Name]! │
│      │
│      How can I help you today?" │
│ │
│ [🛒 Shop Now] [📋 View Menu] [📍 Location] [❓ Help] │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: BROWSE / SEARCH │
│ │
│ User: "Show me pizzas" │
│ │
│ Bot: │
│ │
│  Category: Pizzas 🍕 │
│  │
│  ┌───────────────────────────────┐ │
│  │ 🖼️ │ Margherita │ ₹249 │
│  │     │ ⭐ 4.3 (89) │ │
│  │     │ [➕ Add] [👁 View] │ │
│  └───────────────────────────────┘ │
│  │
│  ┌───────────────────────────────┐ │
│  │ 🖼️ │ Pepperoni │ ₹299 │
│  │     │ ⭐ 4.7 (156) │ │
│  │     │ [➕ Add] [👁 View] │ │
│  └───────────────────────────────┘ │
│  │
│  [← Back] [🔍 Search] [🛒 Cart (0)] │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: PRODUCT DETAIL │
│ │
│ User: Clicks "View" on Pepperoni │
│ │
│ Bot: │
│ │
│ ┌─────────────────────────────────┐ │
│ │ 🖼️ PEPPERONI PIZZA │ │
│ │ │ │
│ │ ₹299 │ │
│ │ ⭐ 4.7 (156 reviews) │ │
│ │ │ │
│ │ Fresh mozzarella, pepperoni, │ │
│ │ tomato sauce, oregano │ │
│ │ │ │
│ │ Size: ○ Medium (10") │ │
│ │        ● Large (14") +₹100 │ │
│ │ │ │
│ │ Extras: │
│ │ [ ] Extra Cheese +₹50 │ │
│ │ [ ] Jalapeño +₹30 │ │
│ │ │ │
│ │ Quantity: [ - ] 1 [ + ] │ │
│ │ │ │
│ │ [ADD TO CART - ₹399] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: CART REVIEW │
│ │
│ User: Clicks "View Cart" │
│ │
│ Bot: │
│ │
│ 🛒 Your Cart │
│ ───────────────────────── │
│ │
│ 1. Pepperoni Pizza (Large) │
│    Extras: Extra Cheese │
│    ₹399 × 1 = ₹399 │
│    [Edit] [Remove] │
│ │
│ 2. Coke │
│    ₹50 × 2 = ₹100 │
│    [Edit] [Remove] │
│ │
│ ───────────────────────── │
│ Subtotal: ₹499 │
│ Delivery: ₹30 │
│ ───────────────────────── │
│ Total: ₹529 │
│ │
│ [🗑️ Clear Cart] │
│ [➕ Add More] │
│ [💳 Proceed to Checkout] │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 5: CHECKOUT - ADDRESS │
│ │
│ User: Clicks "Proceed to Checkout" │
│ │
│ Bot: │
│ │
│ 📍 Delivery Address │
│ ───────────────────────── │
│ │
│ We have your address on file: │
│ │
│ 👤 John Doe │
│ 📞 +91 98765 43210 │
│ 🏠 123 Main Street, │
│    Apartment 4B │
│    Andheri West, Mumbai 400053 │
│ │
│ [✓ Use This Address] │
│ [✏️ Edit Address] │
│ [➕ Add New Address] │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 6: CHECKOUT - DELIVERY TIME │
│ │
│ Bot: │
│ │
│ 🕐 Delivery Time │
│ ───────────────────────── │
│ │
│ ○ ASAP (35-45 mins) │
│ ○ Schedule for later: │
│   │
│   📅 Date: [Select Date] │
│   🕐 Time: [Select Time] │
│      │
│      Available slots: │
│      • 12:00 PM - 1:00 PM │
│      • 1:00 PM - 2:00 PM │
│      • 7:00 PM - 8:00 PM │
│      • 8:00 PM - 9:00 PM │
│ │
│ [← Back] [Continue →] │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 7: CHECKOUT - PAYMENT │
│ │
│ Bot: │
│ │
│ 💳 Payment Method │
│ ───────────────────────── │
│ │
│ Choose your payment method: │
│ │
│ ┌─────────────────────────────┐ │
│ │ ● REZ Wallet │ │
│ │   Balance: ₹1,250 │ │
│ │   [Use Wallet Balance] │ │
│ └─────────────────────────────┘ │
│ │
│ ┌─────────────────────────────┐ │
│ │ ○ UPI │ │
│ │   GPay, PhonePe, Paytm │ │
│ └─────────────────────────────┘ │
│ │
│ ┌─────────────────────────────┐ │
│ │ ○ Credit/Debit Card │ │
│ │   Visa, Mastercard, RuPay │ │
│ └─────────────────────────────┘ │
│ │
│ ┌─────────────────────────────┐ │
│ │ ○ Cash on Delivery │ │
│ └─────────────────────────────┘ │
│ │
│ ───────────────────────── │
│ Total to pay: ₹529 │
│ │
│ [← Back] [Place Order →] │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 8: ORDER CONFIRMATION │
│ │
│ Bot: │
│ │
│ ✅ Order Confirmed! │
│ ───────────────────────── │
│ │
│ Order #REZ123456 │
│ │
│ 📍 Delivering to: │
│    John Doe │
│    123 Main St, Mumbai │
│ │
│ 🕐 Expected delivery: │
│    35-45 mins │
│ │
│ 🛒 Order Summary: │
│    1× Pepperoni Pizza - ₹399 │
│    2× Coke - ₹100 │
│    Delivery - ₹30 │
│ ───────────────────────── │
│ Total Paid: ₹529 │
│ │
│ 💳 Payment: REZ Wallet │
│ │
│ [📍 Track Order] [📋 Order Details] │
│ [🏠 Back to Menu] │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 9: DELIVERY TRACKING │
│ │
│ User: Clicks "Track Order" │
│ │
│ Bot: │
│ │
│ 📍 Live Order Tracking │
│ ───────────────────────── │
│ │
│ Order #REZ123456 │
│ Status: 🔥 Preparing │
│ │
│ ┌─────────────────────────────────┐ │
│ │ ○───────●───────────○───────────○ │ │
│ │ Placed  Preparing  Out for   Delivered │ │
│ │                       Delivery │ │
│ │ 12:00 PM 12:20 PM   12:40 PM  12:55 PM │ │
│ └─────────────────────────────────┘ │
│ │
│ 📝 Latest Update: │
│ "Your order is being prepared with care! │
│  Estimated dispatch: 12:35 PM" │
│ │
│ 📞 Delivery Partner: │
│    Rahul - +91 98765 11111 │
│ │
│ [📍 Share Location] [📞 Call] │
│ [❌ Cancel Order] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2.2 Cart Persistence Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CROSS-SESSION CART PERSISTENCE │
└─────────────────────────────────────────────────────────────────────────────┘

SCENARIO: User browses today, returns tomorrow

Day 1 - 3:00 PM
 │
 ▼
User: "Show me biryani"
Bot: Shows biryani options
User: Adds Chicken Biryani to cart
Bot: "Added! Your cart has 1 item"
 │
 ▼
User leaves chat
 │
 ▼
CART STORED IN DATABASE:
{
  userId: "user_123",
  merchantId: "merchant_456",
  items: [
    {
      productId: "prod_biryani",
      name: "Chicken Biryani",
      quantity: 1,
      price: 299,
      customizations: ["Extra Spicy"]
    }
  ],
  createdAt: "2026-05-12T15:00:00Z",
  expiresAt: "2026-05-13T15:00:00Z"  // 24 hours
}

Day 2 - 10:00 AM
 │
 ▼
User sends "Hi" to same merchant
 │
 ▼
Bot: "Hey John! 👋
      Welcome back to Spice Kitchen!

      I see you left something in your cart yesterday...
      Your Chicken Biryani (₹299) is still there! 🛒

      [View Cart] [Continue Shopping] [🗑️ Clear]"
```

---

## 2.3 Abandoned Cart Recovery Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ABANDONED CART RECOVERY │
└─────────────────────────────────────────────────────────────────────────────┘

T=0: User adds item to cart, doesn't checkout
 │
 ▼
Bot: "Added to your cart! 🛒
      Your cart total: ₹529

      [View Cart] [Continue Shopping]"
 │
 ▼
T=0 to T=2hrs: No activity
 │
 ▼
T=2hrs:
 │
 ▼
REZ AGENT OS triggers:
- Churn Risk Agent: Checks user activity
- Urgency Trigger Agent: Creates urgency
 │
 ▼
WhatsApp sent:
 │
 ▼
"Hi John! 👋

Your cart is waiting for you at Spice Kitchen!

🛒 Your Cart:
• 1× Pepperoni Pizza - ₹399
• 2× Coke - ₹100

⏰ Hurry! Prices may change.
   Offer ends in 2 hours!

[Complete Your Order] [View Cart]"
 │
 ▼
T=4hrs: Still no checkout
 │
 ▼
Second message (with small incentive):
 │
 ▼
"John, we noticed you left your cart behind! 😢

Here's 10% OFF just for you:
Use code CART10 at checkout!

[Complete Order - ₹476] [View Cart]"
 │
 ▼
T=24hrs: Cart expires
 │
 ▼
Cart cleared, logged for analytics
```

---

# 3. FEATURES & CAPABILITIES

## 3.1 Core Features

### 3.1.1 Product Catalog

| Feature | Description |
|---------|-------------|
| **Categories** | Hierarchical categories with images |
| **Products** | Name, description, images, variants, add-ons |
| **Pricing** | Base price, variants, modifiers |
| **Inventory** | Real-time stock tracking |
| **Modifiers** | Size, color, extras, customizations |
| **Availability** | Time-based, day-based availability |
| **Recommendations** | AI-powered related products |

### 3.1.2 Cart Management

| Feature | Description |
|---------|-------------|
| **Add Items** | Single click add-to-cart |
| **Edit Items** | Change quantity, modifiers |
| **Remove Items** | Single click remove |
| **Clear Cart** | Remove all items |
| **Persistence** | Cross-session cart (24 hours) |
| **Merge Carts** | Merge when user logs in |
| **Min Order** | Enforce minimum order value |
| **Max Items** | Limit items per order |

### 3.1.3 Checkout Flow

| Feature | Description |
|---------|-------------|
| **Address Selection** | Saved addresses + add new |
| **Address Entry** | Location share or manual |
| **Time Slots** | ASAP or scheduled |
| **Payment Methods** | Wallet, UPI, Cards, COD |
| **Order Review** | Final review before confirmation |
| **Coupons** | Apply discount codes |
| **Notes** | Special instructions |

### 3.1.4 Payment Options

| Payment Method | Integration | Status |
|---------------|--------------|--------|
| **REZ Wallet** | Internal | Required |
| **UPI (GPay, PhonePe, Paytm)** | Razorpay | Required |
| **Credit Card** | Razorpay | Required |
| **Debit Card** | Razorpay | Required |
| **Net Banking** | Razorpay | Optional |
| **EMI** | Razorpay | Optional |
| **Cash on Delivery** | Internal | Optional |

### 3.1.5 Order Management

| Feature | Description |
|---------|-------------|
| **Order Creation** | Auto-create on payment |
| **Order Tracking** | Real-time status updates |
| **Order History** | Past orders list |
| **Order Details** | Full order information |
| **Cancel Order** | Cancellation with refund |
| **Modify Order** | Add/remove items (pre-prep) |
| **Reorder** | Quick reorder from history |

---

## 3.2 Advanced Features

### 3.2.1 AI-Powered Features

| Feature | Description |
|---------|-------------|
| **Smart Recommendations** | "You might also like" |
| **Personalized Greetings** | Name, order history |
| **Dynamic Pricing** | Time-based, demand-based |
| **Cross-sell Suggestions** | "Complete your meal" |
| **Upsell Suggestions** | "Upgrade to large" |
| **Churn Prediction** | Identify at-risk users |
| **LTV Scoring** | Predict customer value |

### 3.2.2 Engagement Features

| Feature | Description |
|---------|-------------|
| **Loyalty Points** | Earn on every order |
| **Referral Program** | Earn by referring |
| **First Order Discount** | New customer incentive |
| **Happy Hour** | Time-based deals |
| **Combo Meals** | Bundled offers |
| **Free Delivery** | Threshold-based |
| **Birthday Rewards** | Special offers |

### 3.2.3 Merchant Features

| Feature | Description |
|---------|-------------|
| **Catalog Management** | Add/edit products |
| **Inventory Control** | Stock levels |
| **Order Dashboard** | Real-time orders |
| **Analytics** | Sales reports |
| **Staff Management** | KDS, delivery |
| **AI Copilot** | Business insights |

---

# 4. COMPONENT SPECIFICATIONS

## 4.1 Message Components

### 4.1.1 Product Card (Interactive)

```typescript
interface ProductCardMessage {
  type: 'interactive';
  interactive: {
    type: 'product';
    header: {
      type: 'text';
      text: string; // Max 60 chars - Product Name
    };
    body: {
      text: string; // Max 500 chars - Description + Price
    };
    footer?: {
      text: string; // Max 60 chars - CTA text
    };
    action: {
      catalog_id: string; // Merchant's WhatsApp Catalog ID
      product_retailer_id: string; // Product ID
    };
  };
}

// Example
{
  "type": "interactive",
  "interactive": {
    "type": "product",
    "header": {
      "type": "text",
      "text": "Chicken Biryani 🌶️"
    },
    "body": {
      "text": "₹299\nFragrant basmati rice with tender chicken\n⭐ 4.5 (230 reviews)"
    },
    "footer": {
      "text": "Tap to buy"
    },
    "action": {
      "catalog_id": "CAT_MERCHANT_123",
      "product_retailer_id": "PROD_BIRYANI_001"
    }
  }
}
```

### 4.1.2 Product List (Section)

```typescript
interface ProductListMessage {
  type: 'interactive';
  interactive: {
    type: 'list';
    header: {
      type: 'text';
      text: string; // Category name
    };
    body: {
      text: string; // Description
    };
    footer?: {
      text: string; // Footer text
    };
    action: {
      button: string; // Button text (max 20 chars)
      sections: Array<{
        title: string; // Section header
        rows: Array<{
          id: string; // Product ID
          title: string; // Product name (max 24 chars)
          description: string; // Price/desc (max 72 chars)
        }>;
      }>;
    };
  };
}

// Example
{
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "🍕 Pizzas"
    },
    "body": {
      "text": "Choose your favorite"
    },
    "footer": {
      "text": "Powered by REZ"
    },
    "action": {
      "button": "View Pizzas",
      "sections": [
        {
          "title": "Popular",
          "rows": [
            {
              "id": "pizza_001",
              "title": "Margherita",
              "description": "₹249 | ⭐ 4.3"
            },
            {
              "id": "pizza_002",
              "title": "Pepperoni",
              "description": "₹299 | ⭐ 4.7"
            }
          ]
        }
      ]
    }
  }
}
```

### 4.1.3 Quick Reply Buttons

```typescript
interface QuickReplyMessage {
  type: 'interactive';
  interactive: {
    type: 'button';
    body: {
      text: string; // Message text (max 1024 chars)
    };
    action: {
      buttons: Array<{
        type: 'reply';
        reply: {
          id: string; // Unique ID
          title: string; // Button text (max 20 chars)
        };
      }>;
    };
  };
}

// Constraints
// - Max 3 buttons per message
// - Button title: max 20 chars
// - Body text: max 1024 chars

// Example - Cart View
{
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "🛒 Your Cart\n━━━━━━━━━━━━━━━━\n1× Chicken Biryani - ₹299\n2× Coke - ₹100\n━━━━━━━━━━━━━━━━\nTotal: ₹399"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": { "id": "view_cart", "title": "🛒 View Cart" }
        },
        {
          "type": "reply",
          "reply": { "id": "checkout", "title": "💳 Checkout" }
        },
        {
          "type": "reply",
          "reply": { "id": "continue", "title": "➕ Add More" }
        }
      ]
    }
  }
}
```

### 4.1.4 Cart Display

```typescript
interface CartDisplayMessage {
  type: 'text';
  text: string; // Formatted cart display
}

// Format Template
const cartTemplate = `
🛒 Your Cart
━━━━━━━━━━━━━━━━
{items}
━━━━━━━━━━━━━━━━
Subtotal: ₹{subtotal}
Delivery: ₹{delivery}
{taxLine}
━━━━━━━━━━━━━━━━
Total: ₹{total}
━━━━━━━━━━━━━━━━

{actionButtons}
`;

const itemTemplate = `
{itemIndex}. {name} {variant}
   {customizations}
   ₹{price} × {quantity} = ₹{lineTotal}
   [Edit] [Remove]
`;
```

### 4.1.5 Order Confirmation

```typescript
interface OrderConfirmationMessage {
  type: 'template';
  template: {
    name: 'order_confirmation';
    language: { code: 'en' };
    components: Array<{
      type: 'header' | 'body' | 'button';
      // Variable values
    }>;
  };
}
```

---

## 4.2 Cart Data Model

```typescript
interface Cart {
  cartId: string;
  userId: string;
  merchantId: string;
  channel: 'WHATSAPP' | 'VOICE' | 'COPILOT' | 'WEBSITE';

  items: CartItem[];

  // Pricing
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;

  // Delivery
  deliveryAddress?: Address;
  deliveryTime?: DeliveryTime;
  deliveryInstructions?: string;

  // Payment
  paymentMethod?: 'REZ_WALLET' | 'UPI' | 'CARD' | 'COD';
  couponCode?: string;

  // Status
  status: 'ACTIVE' | 'CONVERTED' | 'ABANDONED' | 'EXPIRED';
  expiresAt: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

interface CartItem {
  itemId: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  imageUrl?: string;

  // Customizations
  customizations: Array<{
    type: 'SIZE' | 'EXTRA' | 'REMOVE' | 'OPTION';
    name: string;
    price: number;
  }>;

  // Pricing
  unitPrice: number;
  quantity: number;
  lineTotal: number;

  // Notes
  specialInstructions?: string;
}

interface Address {
  addressId?: string;
  label?: string; // 'Home', 'Office', etc.
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

interface DeliveryTime {
  type: 'ASAP' | 'SCHEDULED';
  estimatedMinutes?: number; // For ASAP
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  timeSlotStart?: string;
  timeSlotEnd?: string;
}
```

---

## 4.3 Order Data Model

```typescript
interface Order {
  orderId: string;
  orderNumber: string; // Display number (e.g., REZ123456)

  // Parties
  userId: string;
  merchantId: string;
  cartId: string;

  // Channel
  channel: 'WHATSAPP' | 'VOICE' | 'COPILOT' | 'WEBSITE';
  sessionId: string;

  // Items
  items: OrderItem[];

  // Pricing
  itemTotal: number;
  discount: number;
  couponDiscount: number;
  deliveryFee: number;
  packagingFee: number;
  tax: number;
  total: number;
  amountPaid: number;

  // Payment
  paymentMethod: 'REZ_WALLET' | 'UPI' | 'CARD' | 'COD';
  paymentId?: string;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  walletPointsUsed?: number;
  walletCashUsed?: number;

  // Delivery
  deliveryAddress: Address;
  deliveryTime: DeliveryTime;
  deliveryPartner?: DeliveryPartner;
  deliveryInstructions?: string;

  // Status
  status: OrderStatus;
  statusHistory: OrderStatusChange[];

  // Merchant
  merchantName: string;
  merchantPhone: string;
  merchantAddress: string;

  // Timestamps
  placedAt: Date;
  confirmedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;

  // Feedback
  rating?: number;
  feedback?: string;
  feedbackGivenAt?: Date;

  // AI
  aiInsights?: {
    churnRisk?: number;
    ltv?: number;
    propensityScore?: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

interface OrderStatusChange {
  status: OrderStatus;
  changedAt: Date;
  changedBy: 'SYSTEM' | 'MERCHANT' | 'USER' | 'DELIVERY_PARTNER';
  note?: string;
}
```

---

# 5. MESSAGE TEMPLATES

## 5.1 Template List

| Template Name | Category | Trigger |
|---------------|----------|---------|
| order_placed | UTILITY | Order confirmed |
| order_confirmed | UTILITY | Merchant confirmed |
| order_preparing | UTILITY | Cooking started |
| order_ready | UTILITY | Ready for pickup/delivery |
| order_dispatched | UTILITY | Out for delivery |
| order_delivered | UTILITY | Successfully delivered |
| order_cancelled | UTILITY | Order cancelled |
| order_refunded | UTILITY | Refund processed |
| payment_received | UTILITY | Payment confirmed |
| payment_failed | UTILITY | Payment failed |
| cart_abandoned | MARKETING | Cart not converted |
| cart_recovery | MARKETING | Recovery attempt |
| reorder_reminder | MARKETING | Previous order reminder |
| review_request | MARKETING | Request review |
| welcome_offer | MARKETING | New customer welcome |
| birthday_special | MARKETING | Birthday offer |
| loyalty_tier | MARKETING | Tier upgrade notification |
| free_delivery | MARKETING | Free delivery threshold |
| flash_sale | MARKETING | Limited time offer |

## 5.2 Message Templates (WhatsApp Format)

### Order Confirmation Template

```
Hi {{1}}! 🎉

Your order #{{2}} is confirmed!

📍 Delivering to:
{{3}}

🕐 Expected delivery:
{{4}}

🛒 Order Summary:
{{5}}

💰 Total Paid: ₹{{6}}

Track your order in real-time!
```

### Cart Recovery Template

```
Hi {{1}}! 👋

Your cart is waiting for you at {{2}}!

🛒 Your Cart:
{{3}}

{{4}}

⚡ This offer expires in {{5}}!

[Complete Order] [View Cart]
```

### Delivery Update Template

```
📍 Order #{{1}} Update

Status: {{2}}

{{3}}

Need help? Reply to this message!
```

---

# 6. PAYMENT INTEGRATION

## 6.1 Payment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAYMENT FLOW │
└─────────────────────────────────────────────────────────────────────────────┘

User clicks "Place Order"
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: VALIDATE ORDER │
│ │
│ • Check items available │
│ • Check prices unchanged │
│ • Check delivery address │
│ • Check payment method │
│ • Calculate final total │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
✓ Valid
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: PAYMENT │
│ │
│ SWITCH (paymentMethod): │
│ │
│ CASE REZ_WALLET: │
│   • Check wallet balance │
│   • Reserve amount in wallet │
│   • Create payment record │
│   • Proceed to order │
│ │
│ CASE UPI: │
│   • Create Razorpay order │
│   • Generate UPI QR/payment link │
│   • Send to user │
│   • Wait for payment confirmation │
│   • On success: proceed │
│   • On timeout: cancel │
│ │
│ CASE CARD: │
│   • Create Razorpay order │
│   • Send payment link │
│   • User enters card details │
│   • On success: proceed │
│ │
│ CASE COD: │
│   • Create order │
│   • Mark payment pending │
│   • Merchant to collect │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: CONFIRM ORDER │
│ │
│ • Create order in database │
│ • Update inventory │
│ • Send confirmation message │
│ • Notify merchant │
│ • Start delivery tracking │
└─────────────────────────────────────────────────────────────────────────────┘
 │
 ▼
DONE
```

## 6.2 REZ Wallet Integration

```typescript
interface WalletPaymentRequest {
  userId: string;
  merchantId: string;
  orderId: string;
  amount: number; // In rupees
  cartId: string;
}

interface WalletPaymentResult {
  success: boolean;
  transactionId?: string;
  walletBalance?: number;
  error?: string;
}

// Payment Service Integration
class WhatsAppStorePaymentService {
  async processWalletPayment(request: WalletPaymentRequest): Promise<WalletPaymentResult> {
    // 1. Validate wallet balance
    const wallet = await this.walletService.getWallet(request.userId);
    if (wallet.availableBalance < request.amount) {
      return {
        success: false,
        error: 'Insufficient wallet balance'
      };
    }

    // 2. Reserve funds (prevent double-spend)
    const reservation = await this.walletService.reserveFunds(
      request.userId,
      request.amount,
      `ORDER_${request.orderId}`
    );

    if (!reservation.success) {
      return { success: false, error: reservation.error };
    }

    // 3. Create payment record
    const payment = await this.paymentService.createPayment({
      orderId: request.orderId,
      userId: request.userId,
      merchantId: request.merchantId,
      amount: request.amount,
      method: 'REZ_WALLET',
      status: 'SUCCESS',
      transactionId: reservation.transactionId
    });

    return {
      success: true,
      transactionId: payment.transactionId,
      walletBalance: wallet.availableBalance - request.amount
    };
  }
}
```

## 6.3 UPI Integration (Razorpay)

```typescript
interface UPIPaymentRequest {
  orderId: string;
  amount: number;
  userPhone: string;
  userEmail?: string;
}

interface UPIPaymentResult {
  success: boolean;
  paymentId?: string;
  upiLink?: string;
  qrCodeUrl?: string;
  expiresAt?: Date;
  error?: string;
}

// Create UPI payment
async createUPIPayment(request: UPIPaymentRequest): Promise<UPIPaymentResult> {
  const razorpayOrder = await razorpay.orders.create({
    amount: request.amount * 100, // Razorpay uses paise
    currency: 'INR',
    receipt: `order_${request.orderId}`,
    notes: {
      orderId: request.orderId,
      userPhone: request.userPhone
    }
  });

  // Generate UPI payment link
  const upiLink = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${MERCHANT_NAME}&am=${request.amount}&cu=INR&tn=REZ_Order_${request.orderId}`;

  return {
    success: true,
    paymentId: razorpayOrder.id,
    upiLink,
    qrCodeUrl: await generateQRCode(upiLink),
    expiresAt: addHours(new Date(), 2)
  };
}
```

---

# 7. ORDER MANAGEMENT

## 7.1 Order Status Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ORDER STATUS FLOW │
└─────────────────────────────────────────────────────────────────────────────┘

PLACED ──► CONFIRMED ──► PREPARING ──► READY ──► DISPATCHED ──► DELIVERED
  │            │                                                   │
  │            │                                                   │
  │            ▼                                                   ▼
  │         CANCELLED                                           RATING
  │            │                                                   │
  ▼            │                                                   │
CANCELLED ◄────┴─────────────────────────────────────────►  FEEDBACK
                │                                                   │
                ▼                                                   │
             REFUNDED ◄─────────────────────────────────────────────┘

```

## 7.2 Status Update Flow

```typescript
interface StatusUpdateRequest {
  orderId: string;
  newStatus: OrderStatus;
  changedBy: 'MERCHANT' | 'SYSTEM' | 'DELIVERY_PARTNER' | 'USER';
  note?: string;
  metadata?: Record<string, any>;
}

async updateOrderStatus(request: StatusUpdateRequest): Promise<Order> {
  // 1. Validate transition
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PLACED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['DISPATCHED', 'CANCELLED'],
    DISPATCHED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: ['REFUNDED'],
    REFUNDED: []
  };

  const order = await this.getOrder(request.orderId);
  if (!validTransitions[order.status].includes(request.newStatus)) {
    throw new Error(`Invalid status transition: ${order.status} -> ${request.newStatus}`);
  }

  // 2. Update order
  order.status = request.newStatus;
  order.statusHistory.push({
    status: request.newStatus,
    changedAt: new Date(),
    changedBy: request.changedBy,
    note: request.note
  });

  // 3. Update timestamps
  switch (request.newStatus) {
    case 'CONFIRMED': order.confirmedAt = new Date(); break;
    case 'PREPARING': order.preparingAt = new Date(); break;
    case 'READY': order.readyAt = new Date(); break;
    case 'DISPATCHED': order.dispatchedAt = new Date(); break;
    case 'DELIVERED': order.deliveredAt = new Date(); break;
    case 'CANCELLED': order.cancelledAt = new Date(); break;
  }

  await order.save();

  // 4. Send notification
  await this.sendStatusNotification(order, request.newStatus);

  // 5. Process side effects
  if (request.newStatus === 'DELIVERED') {
    await this.processDeliveryCompletion(order);
  } else if (request.newStatus === 'CANCELLED') {
    await this.processCancellation(order);
  }

  return order;
}
```

## 7.3 Cancellation Rules

```typescript
const cancellationRules = {
  // Can cancel if status is one of these
  allowedStatuses: ['PLACED', 'CONFIRMED'],

  // Refund timeline
  refundTimeline: {
    REZ_WALLET: 'INSTANT',
    UPI: '1-3 business days',
    CARD: '5-7 business days',
    COD: 'N/A'
  },

  // Cancellation reasons
  reasons: [
    'Changed my mind',
    'Ordered by mistake',
    'Found better price elsewhere',
    'Delivery taking too long',
    'Item not needed anymore',
    'Other'
  ],

  // Merchant can cancel with reasons
  merchantReasons: [
    'Item out of stock',
    'Restaurant closed',
    'Unable to deliver',
    'Suspicious order',
    'Customer unreachable',
    'Other'
  ],

  // Pre-preparation window (minutes)
  prePrepWindow: 5
};
```

---

# 8. ANALYTICS & TRACKING

## 8.1 Key Metrics

### Conversion Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Add-to-Cart Rate | Clicks / Impressions | 5-10% |
| Cart-to-Checkout Rate | Checkouts / Carts | 30-50% |
| Checkout-to-Payment Rate | Payments / Checkouts | 70-90% |
| Overall Conversion | Orders / Impressions | 1-5% |
| Abandonment Rate | Abandoned / Carts | 50-70% |

### Revenue Metrics

| Metric | Description |
|--------|-------------|
| GMV | Gross Merchandise Value |
| AOV | Average Order Value |
| Revenue per Session | GMV / Sessions |
| Customer LTV | Lifetime Value |
| Cart Value | Average Cart Size |

### Engagement Metrics

| Metric | Description |
|--------|-------------|
| Messages per Session | Average messages in conversation |
| Session Duration | Time spent shopping |
| Items per Cart | Average items per order |
| Repeat Purchase Rate | Customers who reorder |
| Review Rate | Orders that get reviewed |

## 8.2 Event Tracking

```typescript
interface AnalyticsEvent {
  eventId: string;
  eventType: string;
  timestamp: Date;

  // Context
  userId?: string;
  merchantId: string;
  sessionId: string;
  channel: 'WHATSAPP' | 'VOICE' | 'COPILOT' | 'WEBSITE';

  // Event data
  eventData: {
    // Product events
    productId?: string;
    productName?: string;
    categoryId?: string;

    // Cart events
    cartId?: string;
    cartValue?: number;
    itemCount?: number;

    // Order events
    orderId?: string;
    orderValue?: number;

    // Payment events
    paymentMethod?: string;
    paymentStatus?: string;

    // Behavior events
    messageSent?: boolean;
    buttonClicked?: string;
    searchQuery?: string;

    // AI events
    recommendationShown?: boolean;
    recommendationClicked?: boolean;
  };

  // Attribution
  source?: string;
  medium?: string;
  campaign?: string;
  utmParams?: Record<string, string>;
}

// Event types
const eventTypes = {
  // Product
  PRODUCT_VIEWED: 'product_viewed',
  PRODUCT_ADDED: 'product_added',
  PRODUCT_REMOVED: 'product_removed',
  PRODUCT_CUSTOMIZED: 'product_customized',

  // Cart
  CART_CREATED: 'cart_created',
  CART_UPDATED: 'cart_updated',
  CART_ABANDONED: 'cart_abandoned',
  CART_CONVERTED: 'cart_converted',

  // Checkout
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_ADDRESS: 'checkout_address',
  CHECKOUT_DELIVERY: 'checkout_delivery',
  CHECKOUT_PAYMENT: 'checkout_payment',
  CHECKOUT_COMPLETED: 'checkout_completed',

  // Payment
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_REFUNDED: 'payment_refunded',

  // Order
  ORDER_PLACED: 'order_placed',
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_RATED: 'order_rated',

  // AI
  RECOMMENDATION_SHOWN: 'recommendation_shown',
  RECOMMENDATION_CLICKED: 'recommendation_clicked',
  CHATBOT_QUERY: 'chatbot_query',
  CHATBOT_RESPONSE: 'chatbot_response'
};
```

---

## 8.3 Analytics Dashboard Data

```typescript
interface WhatsAppStoreAnalytics {
  // Overview
  overview: {
    totalOrders: number;
    totalGMV: number;
    totalCustomers: number;
    averageOrderValue: number;
    conversionRate: number;
  };

  // Time series
  timeSeries: Array<{
    date: string;
    orders: number;
    gmv: number;
    customers: number;
    aov: number;
  }>;

  // Funnel
  funnel: {
    sessions: number;
    productViews: number;
    addToCart: number;
    cartCreated: number;
    checkoutStarted: number;
    orderPlaced: number;
  };

  // Products
  topProducts: Array<{
    productId: string;
    productName: string;
    unitsSold: number;
    revenue: number;
    addToCartRate: number;
    conversionRate: number;
  }>;

  // Customers
  customerMetrics: {
    newCustomers: number;
    returningCustomers: number;
    repeatPurchaseRate: number;
    churnRate: number;
    ltv: number;
  };

  // Payment
  paymentBreakdown: {
    method: string;
    count: number;
    value: number;
    successRate: number;
  };

  // AI Performance
  aiMetrics: {
    recommendationsShown: number;
    recommendationsClicked: number;
    clickThroughRate: number;
    conversationStarted: number;
    ordersFromAI: number;
    aiContributionRate: number;
  };
}
```

---

# 9. SECURITY & COMPLIANCE

## 9.1 Data Security

| Aspect | Implementation |
|--------|----------------|
| **Encryption at Rest** | AES-256 for database, Redis |
| **Encryption in Transit** | TLS 1.3 |
| **Payment Data** | PCI-DSS compliant (via Razorpay) |
| **User Data** | Encrypted with user-specific keys |
| **API Authentication** | JWT with short expiry |
| **Webhook Verification** | HMAC signature validation |

## 9.2 WhatsApp Compliance

```typescript
const complianceRules = {
  // Message windows (24-hour policy)
  messageWindows: {
    userInitiated: '24 hours from last user message',
    postPurchase: '7 days after purchase',
    accountUpdate: '1 hour for OTP, 30 days for account changes'
  },

  // Template requirements
  templateRules: {
    // UTILITY templates
    utility: {
      requiresPurchase: false,
      requiresConsent: true,
      reviewRequired: true
    },
    // MARKETING templates
    marketing: {
      requiresPurchase: false,
      requiresConsent: true,
      reviewRequired: true,
      frequencyCap: 'No more than 1 per day per user'
    },
    // AUTHENTICATION templates
    authentication: {
      requiresPurchase: false,
      requiresConsent: false,
      reviewRequired: true
    }
  },

  // Prohibited content
  prohibited: [
    'Political content',
    'Religious content',
    'Adult content',
    'Illegal products',
    'Misleading claims',
    'Personal data in messages'
  ],

  // Data retention
  dataRetention: {
    conversations: '90 days',
    orders: '7 years',
    payments: '7 years',
    userData: 'Until account deletion + 30 days'
  }
};
```

## 9.3 User Privacy

```typescript
interface PrivacySettings {
  // What users can control
  userControls: {
    marketingMessages: boolean; // Opt in/out
    orderUpdates: boolean; // Can't opt out (operational)
    cartRecovery: boolean; // Can opt out
    personalizedRecommendations: boolean;
    dataSharing: 'FULL' | 'LIMITED' | 'NONE';
  };

  // Consent management
  consentTracking: {
    marketingConsent: {
      granted: boolean;
      grantedAt: Date;
      source: 'WHATSAPP' | 'APP' | 'WEB';
      withdrawnAt?: Date;
    };
    dataProcessingConsent: {
      granted: boolean;
      grantedAt: Date;
    };
  };
}
```

---

# 10. PERFORMANCE REQUIREMENTS

## 10.1 Response Time SLAs

| Operation | Target | Max |
|-----------|--------|-----|
| Message Send | 200ms | 500ms |
| Product Load | 300ms | 1s |
| Cart Update | 100ms | 300ms |
| Checkout Load | 500ms | 2s |
| Payment Processing | 2s | 5s |
| Order Confirmation | 500ms | 2s |

## 10.2 Availability SLAs

| Component | Target | Max |
|-----------|--------|-----|
| WhatsApp Store Service | 99.9% | 99.5% |
| Payment Service | 99.95% | 99.9% |
| Order Service | 99.9% | 99.5% |
| Message Delivery | 99.5% | 99% |

## 10.3 Scalability Targets

| Metric | Target |
|--------|--------|
| Messages per Second | 10,000 |
| Concurrent Sessions | 100,000 |
| Orders per Minute | 1,000 |
| Product Catalog Size | 100,000 SKUs |
| Carts per Merchant | 10,000 |

---

# 11. ERROR HANDLING

## 11.1 Error Types

```typescript
enum ErrorType {
  // User errors
  INVALID_PHONE = 'invalid_phone',
  ITEM_OUT_OF_STOCK = 'item_out_of_stock',
  MIN_ORDER_NOT_MET = 'min_order_not_met',
  INVALID_COUPON = 'invalid_coupon',
  ADDRESS_NOT_FOUND = 'address_not_found',

  // Payment errors
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_TIMEOUT = 'payment_timeout',
  INSUFFICIENT_WALLET = 'insufficient_wallet',
  PAYMENT_CANCELLED = 'payment_cancelled',

  // System errors
  SERVICE_UNAVAILABLE = 'service_unavailable',
  MAINTENANCE = 'maintenance',
  RATE_LIMITED = 'rate_limited',
  INTERNAL_ERROR = 'internal_error'
}

interface ErrorResponse {
  error: {
    type: ErrorType;
    message: string;
    userMessage: string; // Friendly message
    canRetry: boolean;
    action?: {
      type: 'RETRY' | 'SUPPORT' | 'REDIRECT';
      label: string;
      value: string;
    };
  };
}
```

## 11.2 Error Messages

| Error | User Message |
|-------|--------------|
| Item out of stock | "Sorry, [Product] is currently unavailable. Try another option?" |
| Min order not met | "Minimum order value is ₹[amount]. Add more to continue!" |
| Invalid coupon | "Hmm, this coupon code doesn't work. Check for typos or expiry!" |
| Payment failed | "Payment didn't go through. Try again or use a different method?" |
| Insufficient wallet | "Your wallet balance is ₹[balance]. You need ₹[required] more." |
| Rate limited | "You're too fast! 😄 Give me a moment to catch up." |

---

# 12. MULTI-TENANT ARCHITECTURE

## 12.1 Tenant Isolation

```typescript
// Each merchant is a tenant
interface MerchantTenant {
  merchantId: string;
  merchantName: string;
  merchantCategory: 'RESTAURANT' | 'RETAIL' | 'SERVICE' | 'APPOINTMENT';

  // WhatsApp Business
  whatsappNumber?: string;
  whatsappCatalogId?: string;
  whatsappNamespace?: string;

  // Settings
  settings: {
    currency: 'INR'; // Only INR for now
    language: 'en'; // Default language
    timezone: string;
    orderPrefix: string; // e.g., "SPICE"

    // Store settings
    minOrderValue: number;
    maxOrderValue: number;
    deliveryFeeType: 'FIXED' | 'DISTANCE' | 'FREE_ABOVE';
    deliveryFeeAmount?: number;
    freeDeliveryThreshold?: number;
    deliveryRadiusKm: number;

    // Business hours
    businessHours: {
      [day: string]: { open: string; close: string } | null;
    };

    // AI settings
    aiResponsesEnabled: boolean;
    aiPersonality: 'FRIENDLY' | 'PROFESSIONAL' | 'PLAYFUL';
    aiGreetingMessage?: string;
  };

  // Catalog
  catalog: {
    categories: Category[];
    products: Product[];
    modifiers: Modifier[];
  };

  // Integrations
  integrations: {
    razorpayKeyId?: string;
    deliveryPartners?: string[];
  };
}
```

## 12.2 Data Isolation

```typescript
// All queries include merchantId
class CartRepository {
  async findByUser(userId: string, merchantId: string): Promise<Cart | null> {
    return this.collection.findOne({
      userId,
      merchantId,
      status: 'ACTIVE'
    });
  }

  async create(cart: Cart): Promise<Cart> {
    // Ensure merchantId is always set
    if (!cart.merchantId) {
      throw new Error('merchantId is required');
    }
    return this.collection.insertOne(cart);
  }
}
```

---

# APPENDIX

## A. Message Rate Limits

| Plan | Messages/Day | Burst |
|------|-------------|-------|
| Starter | 1,000 | 50/min |
| Professional | 10,000 | 200/min |
| Enterprise | Unlimited | 500/min |

## B. Product Image Requirements

| Size | Dimensions | Format |
|------|------------|--------|
| Thumbnail | 200×200 | JPEG, PNG |
| Medium | 500×500 | JPEG, PNG |
| Large | 1000×1000 | JPEG, PNG |
| Hero | 1200×800 | JPEG, PNG |

## C. Supported Currencies

| Currency | Code | Status |
|----------|------|--------|
| Indian Rupee | INR | **Required** |
| US Dollar | USD | Planned |
| UAE Dirham | AED | Planned |

## D. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/whatsapp-store/cart` | GET | Get user cart |
| `/api/whatsapp-store/cart/items` | POST | Add item |
| `/api/whatsapp-store/cart/items/:id` | PUT | Update item |
| `/api/whatsapp-store/cart/items/:id` | DELETE | Remove item |
| `/api/whatsapp-store/cart` | DELETE | Clear cart |
| `/api/whatsapp-store/checkout` | POST | Start checkout |
| `/api/whatsapp-store/orders` | POST | Place order |
| `/api/whatsapp-store/orders/:id` | GET | Get order |
| `/api/whatsapp-store/orders/:id/status` | PUT | Update status |
| `/api/whatsapp-store/products` | GET | List products |
| `/api/whatsapp-store/products/:id` | GET | Get product |
| `/api/whatsapp-store/categories` | GET | List categories |
