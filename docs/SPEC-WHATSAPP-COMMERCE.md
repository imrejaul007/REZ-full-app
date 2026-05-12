# REZ WhatsApp Commerce - Complete Specification

**Version:** 1.0
**Status:** Ready for Implementation
**Last Updated:** May 12, 2026

---

# TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Native WhatsApp Catalog](#2-native-whatsapp-catalog)
3. [Product Discovery](#3-product-discovery)
4. [Search & Filters](#4-search--filters)
5. [Recommendations Engine](#5-recommendations-engine)
6. [Product Management](#6-product-management)
7. [Inventory Integration](#7-inventory-integration)
8. [Pricing Engine](#8-pricing-engine)
9. [Multi-Category Support](#9-multi-category-support)

---

# 1. OVERVIEW

## 1.1 What is REZ WhatsApp Commerce?

REZ WhatsApp Commerce provides the **native WhatsApp Catalog** integration - enabling merchants to showcase products within WhatsApp using WhatsApp's native Catalog API, combined with AI-powered discovery and recommendations.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WHATSAPP COMMERCE vs TRADITIONAL ECOMMERCE │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ TRADITIONAL: │
│ User searches on app → Scrolls products → Adds to cart → Checks out │
│ Time: 5-10 minutes │
│ │
│ WHATSAPP COMMERCE: │
│ User: "Show me pizzas" │
│ Bot: "Here are popular pizzas..." │
│ User: "That one" │
│ Bot: "Added! Checkout?" │
│ Time: 30 seconds │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1.2 Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Native Catalog** | WhatsApp Business Catalog integration |
| **Visual Discovery** | Images, carousels, product cards |
| **AI Search** | Natural language product search |
| **Smart Filters** | Category, price, rating, availability |
| **Recommendations** | AI-powered suggestions |
| **Real-time Inventory** | Live stock updates |
| **Dynamic Pricing** | Time-based, demand-based prices |
| **Personalization** | Based on user history |

---

# 2. NATIVE WHATSAPP CATALOG

## 2.1 WhatsApp Catalog Integration

```typescript
interface WhatsAppCatalogIntegration {
  // WhatsApp Business API Catalog
  catalogId: string;
  merchantFacebookBusinessId: string;

  // Product sync
  syncStatus: 'SYNCED' | 'PENDING' | 'FAILED';
  lastSyncedAt: Date;
  totalProducts: number;

  // Features
  features: {
    nativeCatalog: boolean;      // WhatsApp native catalog
    interactiveMessages: boolean; // Product cards
    quickReplies: boolean;       // Action buttons
    carousel: boolean;          // Multi-product display
  };
}
```

## 2.2 WhatsApp Catalog Sync

```typescript
// Sync products to WhatsApp Catalog
async function syncToWhatsAppCatalog(products: Product[]): Promise<SyncResult> {
  const results = await Promise.allSettled(
    products.map(async (product) => {
      const whatsappProduct = await twilio.createProduct({
        name: product.name,
        description: product.description,
        price: {
          amount: product.price.toString(),
          currency: 'INR'
        },
        images: product.images.map(img => ({
          url: img.url,
          // For WhatsApp, images must be publicly accessible HTTPS URLs
        })),
        url: `${STORE_URL}/product/${product.id}`,
        category: mapToWhatsAppCategory(product.category)
      });

      return {
        productId: product.id,
        whatsappProductId: whatsappProduct.id,
        status: 'SUCCESS'
      };
    })
  );

  return aggregateResults(results);
}

// WhatsApp category mapping
const categoryMapping: Record<string, string> = {
  'food': 'FOOD_AND_GROCERY',
  'beverages': 'FOOD_AND_GROCERY',
  'restaurants': 'FOOD_AND_GROCERY',
  'fashion': 'APPAREL_AND_ACCESSORIES',
  'electronics': 'ELECTRONICS',
  'beauty': 'HEALTH_AND_BEAUTY',
  'home': 'HOME_AND_LIVING',
  'services': 'SERVICES'
};
```

## 2.3 Catalog Display

```typescript
// WhatsApp Catalog Message (Interactive)
interface CatalogDisplayMessage {
  type: 'interactive';
  interactive: {
    type: 'product';
    header: { type: 'text'; text: string };
    body: { text: string };
    footer?: { text: string };
    action: {
      catalog_id: string;
      product_retailer_id: string;
    };
  };
}

// Example: Display single product from catalog
{
  "type": "interactive",
  "interactive": {
    "type": "product",
    "header": {
      "type": "text",
      "text": "Margherita Pizza 🍕"
    },
    "body": {
      "text": "₹249\nClassic tomato and mozzarella\n⭐ 4.3 (89 reviews)\n\nTapping the button will open the product page in your browser."
    },
    "footer": {
      "text": "Powered by REZ"
    },
    "action": {
      "catalog_id": "CAT_SPICE_KITCHEN",
      "product_retailer_id": "PROD_PIZZA_001"
    }
  }
}
```

---

# 3. PRODUCT DISCOVERY

## 3.1 Discovery Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PRODUCT DISCOVERY METHODS │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. CATEGORY BROWSE │
│    User: "Show me main courses" │
│    Bot: Shows category with products │
│ │
│ 2. QUICK REPLY MENU │
│    User: "Hi" │
│    Bot: [Starters] [Mains] [Drinks] [Desserts] │
│ │
│ 3. CAROUSEL DISPLAY │
│    User: "What's popular?" │
│    Bot: Shows horizontal scroll of products │
│ │
│ 4. VOICE SEARCH │
│    User: "I want something spicy" │
│    Bot: Shows spicy items │
│ │
│ 5. AI RECOMMENDATIONS │
│    Bot: "Based on your taste, we recommend..." │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3.2 Category Browse

```typescript
// Category Menu Message
interface CategoryMenuMessage {
  type: 'interactive';
  interactive: {
    type: 'list';
    header: {
      type: 'text';
      text: string; // "What would you like?"
    };
    body: {
      text: string; // "Browse our categories"
    };
    footer: {
      text: string; // "Powered by REZ"
    };
    action: {
      button: string; // "See Menu"
      sections: Array<{
        title: string; // Category name
        rows: Array<{
          id: string; // category_id
          title: string; // Subcategory or category
          description?: string; // Count or description
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
      "text": "Spice Kitchen Menu 🍛"
    },
    "body": {
      "text": "What would you like today?"
    },
    "footer": {
      "text": "Powered by REZ"
    },
    "action": {
      "button": "Browse Menu",
      "sections": [
        {
          "title": "Categories",
          "rows": [
            { "id": "cat_starters", "title": "🌶️ Starters", "description": "15 items" },
            { "id": "cat_mains", "title": "🍛 Main Course", "description": "25 items" },
            { "id": "cat_breads", "title": "🫓 Breads", "description": "8 items" },
            { "id": "cat_drinks", "title": "🥤 Beverages", "description": "12 items" },
            { "id": "cat_desserts", "title": "🍰 Desserts", "description": "6 items" }
          ]
        },
        {
          "title": "Popular",
          "rows": [
            { "id": "popular", "title": "⭐ Chef's Specials", "description": "5 items" },
            { "id": "deals", "title": "🔥 Today's Deals", "description": "3 offers" }
          ]
        }
      ]
    }
  }
}
```

## 3.3 Product Carousel

```typescript
// Carousel Display (Multiple Product Cards)
interface ProductCarouselMessage {
  type: 'text';
  text: string; // Text description with product list
}

// Note: WhatsApp doesn't have native carousel, so we simulate with multiple cards
// Each card is sent as a separate message

// Alternative: Single message with multiple products
{
  "type": "text",
  "text": "🌟 Popular Pizzas Near You 🍕

━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Margherita
   ₹249 | ⭐ 4.3 (89 reviews)
   [View] [Add to Cart]

2️⃣ Pepperoni Special
   ₹299 | ⭐ 4.7 (156 reviews)
   [View] [Add to Cart]

3️⃣ Farm House
   ₹349 | ⭐ 4.5 (98 reviews)
   [View] [Add to Cart]

━━━━━━━━━━━━━━━━━━━━━━━━━

[← Previous] [See More →] [🛒 View Cart]"
}
```

---

# 4. SEARCH & FILTERS

## 4.1 Natural Language Search

```typescript
interface SearchCapabilities {
  // Natural language queries
  naturalLanguage: [
    "Show me spicy food",
    "What vegetarian options do you have?",
    "Anything under 200 rupees?",
    "Best rated pizzas",
    "What's quick to make?",
    "I want something filling",
    "Show me combos",
    "What's good for dinner?"
  ];

  // Traditional search
  traditional: [
    "biryani",
    "pizza near me",
    "chinese under 300",
    "desserts mango"
  ];

  // Voice search
  voice: [
    "mujhe pizza chahiye",
    "koi vegetarian option hai",
    "200 ke andar kya hai"
  ];
}

// Search Intent Detection
interface SearchIntent {
  intent: 'PRODUCT_SEARCH' | 'CATEGORY_SEARCH' | 'FILTER_SEARCH';
  entities: {
    keywords?: string[];
    category?: string;
    cuisine?: string;
    dietary?: string[]; // ['vegetarian', 'vegan', 'gluten-free']
    priceRange?: { min: number; max: number };
    rating?: number;
    time?: 'breakfast' | 'lunch' | 'dinner' | 'late-night';
  };
  modifiers: {
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popular' | 'delivery_time';
    limit?: number;
  };
}

// Search Result Message
{
  "type": "text",
  "text": "🍕 Found 5 pizzas for \"spicy\" 🔥

━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Spicy Paneer Tikka
   ₹269 | ⭐ 4.4 | 🌶️🌶️🌶️ (Spicy)
   [View] [Add]

2️⃣ Chicken Rajasthani
   ₹299 | ⭐ 4.6 | 🌶️🌶️ (Medium Spicy)
   [View] [Add]

3️⃣ Volcano Pizza
   ₹349 | ⭐ 4.8 | 🌶️🌶️🌶️ (Very Spicy)
   [View] [Add]

━━━━━━━━━━━━━━━━━━━━━━━━━

Filters: [Price ▼] [Rating] [Diet] [Sort]

Showing: 1-3 of 5 | [See More →]"
}
```

## 4.2 Filter Quick Replies

```typescript
// Filter Options
interface FilterOptions {
  priceRanges: Array<{
    id: 'under_100' | '100_200' | '200_500' | '500_plus';
    label: 'Under ₹100' | '₹100-200' | '₹200-500' | '₹500+';
    range: { min: number; max: number };
  }>;

  dietary: Array<{
    id: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'jain';
    label: '🥬 Vegetarian' | '🍗 Non-Veg' | '🌱 Vegan' | '🙏 Jain';
  }>;

  sortBy: Array<{
    id: 'popular' | 'rating' | 'price_low' | 'price_high' | 'delivery_time';
    label: '⭐ Popular' | '⭐ Top Rated' | '💰 Price: Low to High' | '💰 Price: High to Low' | '⚡ Fastest';
  }>;
}

// Filter Selection Message
{
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "🔍 Filter Pizzas\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\nPrice Range: Any\nDiet: Any\nSort: Popular\n\nSelect a filter:"
    },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "filter_price", "title": "💰 Price" } },
        { "type": "reply", "reply": { "id": "filter_diet", "title": "🥗 Diet" } },
        { "type": "reply", "reply": { "id": "filter_sort", "title": "📊 Sort" } }
      ]
    }
  }
}
```

---

# 5. RECOMMENDATIONS ENGINE

## 5.1 Recommendation Types

```typescript
enum RecommendationType {
  // Personalized
  FOR_YOU = 'for_you',              // User-specific based on history
  RECENTLY_ORDERED = 'recently_ordered', // Ordered before
  OFTEN_ORDERED = 'often_ordered',   // Order frequently
  LEFT_IN_CART = 'left_in_cart',    // Was in cart

  // Contextual
  TRENDING = 'trending',           // Popular right now
  NEW_ITEMS = 'new_items',         // Recently added
  NEARBY = 'nearby',              // Location-based
  TIME_BASED = 'time_based',       // Breakfast, lunch, dinner

  // Commercial
  DEALS = 'deals',                 // Discounts, offers
  COMBOS = 'combos',               // Bundles
  CROSS_SELL = 'cross_sell',       // Frequently bought together
  UPSELL = 'upsell',               // Premium alternatives

  // AI-Powered
  AI_RECOMMEND = 'ai_recommend',   // ML-based
  SIMILAR_USERS = 'similar_users',  // Users like you liked
  CONTEXTUAL_ML = 'contextual_ml'   // Context + ML
}
```

## 5.2 Recommendation Display

```typescript
// AI-Powered Recommendation Message
{
  "type": "text",
  "text": `🤖 AI Recommendation for You

Based on your taste and preferences:

━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 Chicken Biryani - ₹299
   You ordered this 5 times!
   ⭐ 4.7 (342 reviews)
   "Perfect for your spice level" - Our AI

   [Add to Cart] [Why Me?]

━━━━━━━━━━━━━━━━━━━━━━━━━

💡 "People like you also ordered:"
1. Raita - ₹49
2. Mirchi Ka Salan - ₹89

[Add Both] [View Full Menu]`
}
```

## 5.3 Recommendation Reasons

```typescript
interface RecommendationReason {
  productId: string;
  reason: {
    type: 'ORDER_HISTORY' | 'SIMILAR_USERS' | 'TRENDING' | 'PROMOTION' | 'COMPLEMENTARY';
    label: string;
    details: string;
  };
  confidence: number; // 0-1
  actionText: string;
}

// Examples
const reasons: RecommendationReason[] = [
  {
    productId: 'biryani_001',
    reason: {
      type: 'ORDER_HISTORY',
      label: 'Your Favorite',
      details: 'You ordered this 5 times'
    },
    confidence: 0.95,
    actionText: '🔥 Your usual!'
  },
  {
    productId: 'pizza_001',
    reason: {
      type: 'SIMILAR_USERS',
      label: 'Trending',
      details: '245 people ordered this today'
    },
    confidence: 0.88,
    actionText: '⭐ Popular Today'
  },
  {
    productId: 'combo_001',
    reason: {
      type: 'COMPLEMENTARY',
      label: 'Complete Your Meal',
      details: 'Goes great with your biryani'
    },
    confidence: 0.92,
    actionText: '🍽️ Complete Your Meal'
  }
];
```

---

# 6. PRODUCT MANAGEMENT

## 6.1 Product Data Model

```typescript
interface Product {
  productId: string;
  merchantId: string;

  // Basic Info
  name: string;
  description: string;
  shortDescription?: string; // For quick displays

  // Categorization
  category: CategoryRef;
  subcategory?: CategoryRef;
  tags: string[];
  cuisine?: string[];
  dietary: DietaryTag[];

  // Media
  images: ProductImage[];
  videos?: ProductVideo[];
 360view?: string;

  // Pricing
  pricing: {
    basePrice: number;
    mrp?: number; // Maximum retail price
    costPrice?: number;
    currency: 'INR';
    taxRate: number;
    taxInclusive: boolean;
  };

  // Variants
  variants?: ProductVariant[];

  // Modifiers/Add-ons
  modifiers?: Modifier[];

  // Inventory
  inventory: {
    trackStock: boolean;
    quantity?: number;
    lowStockThreshold?: number;
    outOfStockBehavior: 'HIDE' | 'SHOW_DISABLED' | 'ALLOW_PREORDER';
    preorderAvailable?: boolean;
    preorderLeadTime?: string;
  };

  // Availability
  availability: {
    available: boolean;
    availableFrom?: string; // Time
    availableTo?: string;
    availableDays?: number[]; // 0-6 (Sun-Sat)
    seasonal?: {
      startDate: string;
      endDate: string;
    };
  };

  // Ordering
  ordering: {
    minQuantity: number;
    maxQuantity: number;
    allowCustomization: boolean;
    preparationTime?: number; // minutes
    portionSize?: string;
  };

  // WhatsApp-specific
  whatsapp: {
    catalogEnabled: boolean;
    catalogId?: string;
    quickReplyEnabled: boolean;
    showInMenu: boolean;
    sortOrder: number;
    emoji?: string;
  };

  // AI/ML
  ai: {
    autoRecommend: boolean;
    propensityScore?: number; // Likelihood to be ordered
    relatedProducts?: string[];
    searchKeywords?: string[];
    voiceAliases?: string[]; // Alternative names for voice search
  };

  // Ratings
  ratings: {
    average: number;
    count: number;
    distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface ProductVariant {
  variantId: string;
  name: string; // "Small", "Medium", "Large"
  sku: string;
  price: number;
  mrp?: number;
  inventory: number;
  images?: ProductImage[];
  isDefault: boolean;
  sortOrder: number;
}

interface Modifier {
  modifierId: string;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  required: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: ModifierOption[];
}

interface ModifierOption {
  optionId: string;
  name: string;
  price: number;
  isDefault: boolean;
  available: boolean;
}

interface ProductImage {
  imageId: string;
  url: string;
  thumbnailUrl?: string;
  whatsappUrl?: string; // Optimized for WhatsApp
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface DietaryTag {
  code: 'VEG' | 'VEGAN' | 'NON_VEG' | 'EGG' | 'JAIN' | 'GLUTEN_FREE' | 'HALAL' | 'KOSHER';
  label: string;
  icon?: string;
}
```

## 6.2 Category Data Model

```typescript
interface Category {
  categoryId: string;
  merchantId: string;

  name: string;
  description?: string;
  image?: string;
  icon?: string; // Emoji or icon

  // Hierarchy
  parentId?: string;
  level: number; // 0 = top level
  path: string[]; // e.g., ['mains', 'biryani']

  // Settings
  settings: {
    isActive: boolean;
    showInMenu: boolean;
    sortOrder: number;
    allowSearch: boolean;
  };

  // Display
  display: {
    headerColor?: string;
    headerImage?: string;
    description?: string;
  };

  // Counts
  productCount: number;
  activeProductCount: number;

  // Children
  children?: Category[];

  // WhatsApp
  whatsapp: {
    enabled: boolean;
    showProducts: boolean;
    productDisplayType: 'LIST' | 'CAROUSEL' | 'SECTION';
    productsPerMessage: number;
  };

  createdAt: Date;
  updatedAt: Date;
}
```

---

# 7. INVENTORY INTEGRATION

## 7.1 Real-time Stock Updates

```typescript
interface InventoryService {
  // Get real-time stock
  async getStock(productId: string, variantId?: string): Promise<StockInfo>;

  // Check availability
  async isAvailable(productId: string, quantity: number, variantId?: string): Promise<AvailabilityResult>;

  // Reserve stock (during checkout)
  async reserveStock(orderId: string, items: CartItem[]): Promise<ReservationResult>;

  // Release reservation (on checkout cancel/timeout)
  async releaseReservation(orderId: string): Promise<void>;

  // Deduct stock (on order completion)
  async deductStock(orderId: string, items: CartItem[]): Promise<void>;

  // Restore stock (on order cancellation)
  async restoreStock(orderId: string, items: CartItem[]): Promise<void>;

  // Bulk update
  async updateStock(productId: string, updates: StockUpdate[]): Promise<void>;

  // Low stock alerts
  async getLowStockProducts(merchantId: string): Promise<Product[]>;
}

interface StockInfo {
  productId: string;
  variantId?: string;
  quantity: number;
  available: boolean;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PREORDER';
  lowStockThreshold?: number;
  nextRestock?: Date;
}
```

## 7.2 Stock-based Message Display

```typescript
// Stock-aware product display
function formatProductMessage(product: Product, stock: StockInfo): string {
  let availabilityText = '';
  let addButtonText = '[Add to Cart]';

  switch (stock.status) {
    case 'IN_STOCK':
      availabilityText = '✅ Available';
      break;

    case 'LOW_STOCK':
      availabilityText = `⚠️ Only ${stock.quantity} left!`;
      addButtonText = '[Add to Cart]';
      break;

    case 'OUT_OF_STOCK':
      availabilityText = '❌ Out of Stock';
      addButtonText = '[Notify Me]';
      break;

    case 'PREORDER':
      availabilityText = `📦 Pre-order (${stock.nextRestock ? formatDate(stock.nextRestock) : 'Soon'})`;
      addButtonText = '[Pre-order]';
      break;
  }

  return `
${product.name} ${product.emoji || ''}
${formatPrice(product.pricing.basePrice)} | ⭐ ${product.ratings.average} (${product.ratings.count})
${availabilityText}
${product.shortDescription || product.description.substring(0, 100)}

${addButtonText} [View Details]
  `.trim();
}
```

---

# 8. PRICING ENGINE

## 8.1 Dynamic Pricing

```typescript
interface PricingEngine {
  // Calculate final price
  async calculatePrice(
    productId: string,
    quantity: number,
    modifiers: SelectedModifier[],
    context: PricingContext
  ): Promise<PricingResult>;
}

interface PricingContext {
  userId: string;
  merchantId: string;
  channel: 'WHATSAPP' | 'VOICE' | 'COPILOT' | 'WEBSITE';
  time: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  cart?: {
    items: CartItem[];
    subtotal: number;
  };
  userTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  isFirstOrder?: boolean;
}

interface PricingResult {
  basePrice: number;
  modifierPrice: number;
  discount: {
    type: 'COUPON' | 'PROMOTION' | 'LOYALTY' | 'VOLUME';
    code?: string;
    label: string;
    amount: number;
  };
  finalPrice: number;
  savings: number;
  loyaltyPoints?: number;
  message: string; // "You saved ₹50!"
}

// Price modifiers
const priceModifiers: PriceModifier[] = [
  // Time-based
  {
    type: 'TIME_BASED',
    condition: (ctx) => ctx.time.getHours() < 12,
    modifier: { type: 'DISCOUNT', percent: 10, label: 'Early Bird Discount' }
  },
  {
    type: 'TIME_BASED',
    condition: (ctx) => ctx.time.getHours() >= 22,
    modifier: { type: 'DISCOUNT', percent: 15, label: 'Late Night Special' }
  },

  // Volume-based
  {
    type: 'VOLUME',
    condition: (ctx) => ctx.cart && ctx.cart.subtotal > 500,
    modifier: { type: 'FREE_DELIVERY', label: 'Free Delivery' }
  },

  // User tier
  {
    type: 'LOYALTY',
    condition: (ctx) => ctx.userTier === 'GOLD',
    modifier: { type: 'DISCOUNT', percent: 5, label: 'Gold Member Discount' }
  },

  // First order
  {
    type: 'NEW_CUSTOMER',
    condition: (ctx) => ctx.isFirstOrder === true,
    modifier: { type: 'DISCOUNT', percent: 15, label: 'First Order Discount' }
  }
];
```

## 8.2 Dynamic Pricing Display

```typescript
// Price display with savings
{
  "type": "text",
  "text": `🍕 Pepperoni Pizza - Large

━━━━━━━━━━━━━━━━━━━━━━━━━

💰 ₹349
   (MRP ₹449 - You save ₹100!)

━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Deal Applied: Early Bird 10% OFF
   Original: ₹399 → Your Price: ₹349

🎁 Loyalty Points: +35 points

━━━━━━━━━━━━━━━━━━━━━━━━━

[Add to Cart - ₹349] [Customize]`
}
```

---

# 9. MULTI-CATEGORY SUPPORT

## 9.1 Supported Commerce Categories

```typescript
interface CommerceCategory {
  code: string;
  name: string;
  features: CategoryFeatures;
  productFields: string[];
  orderFlow: OrderFlow;
}

interface CategoryFeatures {
  variants: boolean;
  modifiers: boolean;
  addons: boolean;
  customization: boolean;
  scheduling: boolean;
  delivery: boolean;
  pickup: boolean;
  tableBooking: boolean;
  appointments: boolean;
  subscriptions: boolean;
  deposit: boolean;
  depositPercent?: number;
}

// Category configurations
const commerceCategories: CommerceCategory[] = [
  {
    code: 'RESTAURANT',
    name: 'Restaurant / Food Delivery',
    features: {
      variants: true,      // Size options
      modifiers: true,     // Add toppings
      addons: true,        // Extra items
      customization: true, // Special instructions
      scheduling: true,    // Scheduled delivery
      delivery: true,
      pickup: true,
      tableBooking: false,
      appointments: false,
      subscriptions: true,
      deposit: false
    },
    productFields: ['cuisine', 'spiceLevel', 'preparationTime', 'portionSize'],
    orderFlow: 'CART_BASED'
  },
  {
    code: 'RETAIL',
    name: 'Retail / E-commerce',
    features: {
      variants: true,      // Size, color
      modifiers: false,
      addons: true,
      customization: false,
      scheduling: false,
      delivery: true,
      pickup: true,
      tableBooking: false,
      appointments: false,
      subscriptions: true,
      deposit: false
    },
    productFields: ['brand', 'model', 'warranty', 'size', 'color'],
    orderFlow: 'CART_BASED'
  },
  {
    code: 'SALON',
    name: 'Salon / Beauty',
    features: {
      variants: false,
      modifiers: false,
      addons: true,        // Add-on services
      customization: false,
      scheduling: true,    // Appointment required
      delivery: false,
      pickup: false,
      tableBooking: false,
      appointments: true,  // Service booking
      subscriptions: true, // Memberships
      deposit: true,       // Booking deposit
      depositPercent: 20
    },
    productFields: ['duration', 'gender', 'category'],
    orderFlow: 'APPOINTMENT_BASED'
  },
  {
    code: 'HEALTHCARE',
    name: 'Healthcare / Clinic',
    features: {
      variants: false,
      modifiers: false,
      addons: false,
      customization: false,
      scheduling: true,
      delivery: true,       // Medicine delivery
      pickup: false,
      tableBooking: true,
      appointments: true,
      subscriptions: true,
      deposit: true,
      depositPercent: 50
    },
    productFields: ['specialty', 'doctor', 'duration'],
    orderFlow: 'APPOINTMENT_BASED'
  },
  {
    code: 'EVENTS',
    name: 'Events / Tickets',
    features: {
      variants: true,       // VIP, General
      modifiers: false,
      addons: false,
      customization: false,
      scheduling: true,
      delivery: true,       // E-ticket
      pickup: false,
      tableBooking: true,   // Seat selection
      appointments: false,
      subscriptions: false,
      deposit: true,
      depositPercent: 100   // Full payment for tickets
    },
    productFields: ['eventDate', 'venue', 'seatType', 'quantityLimit'],
    orderFlow: 'TICKET_BASED'
  }
];
```

## 9.2 Category-Specific UI

```typescript
// Restaurant Flow
const restaurantFlow = {
  discovery: ['Categories', 'Search', 'Recommendations', 'Deals'],
  productDisplay: 'Card with image, price, rating, quick-add',
  customization: 'Size → Extras → Special instructions',
  cartView: 'List with quantities, total, delivery option',
  checkout: 'Address → Time → Payment'
};

// Salon Flow
const salonFlow = {
  discovery: ['Services', 'Packages', 'Staff', 'Offers'],
  productDisplay: 'Service card with duration, price, description',
  customization: 'Staff preference → Date/Time',
  cartView: 'Service list with datetime, staff, total',
  checkout: 'Date/Time → Staff (optional) → Payment (with deposit)'
};

// Retail Flow
const retailFlow = {
  discovery: ['Categories', 'Search', 'Filters', 'Trending'],
  productDisplay: 'Image, price, variants (color/size), reviews',
  customization: 'Variant selection → Quantity',
  cartView: 'Grid view with quantities, subtotal',
  checkout: 'Address → Delivery slot → Payment'
};
```

---

# APPENDIX

## A. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/catalog/:merchantId/products` | GET | List products |
| `/api/catalog/:merchantId/products/:id` | GET | Get product |
| `/api/catalog/:merchantId/categories` | GET | List categories |
| `/api/catalog/:merchantId/categories/:id/products` | GET | Products by category |
| `/api/catalog/:merchantId/search` | GET | Search products |
| `/api/catalog/:merchantId/recommendations` | GET | Get recommendations |
| `/api/catalog/:merchantId/trending` | GET | Trending products |
| `/api/catalog/:merchantId/deals` | GET | Active deals |

## B. Caching Strategy

| Data | Cache Duration | Invalidation |
|------|---------------|--------------|
| Product Details | 5 minutes | On update |
| Category List | 1 hour | On update |
| Search Results | 1 minute | On update |
| Recommendations | 15 minutes | On interaction |
| Pricing | Real-time | On request |
| Stock | 30 seconds | Real-time via webhook |

## C. Performance Targets

| Metric | Target |
|--------|--------|
| Product Load | < 300ms |
| Search Response | < 500ms |
| Recommendation Generation | < 1s |
| Price Calculation | < 100ms |
| Stock Check | < 50ms |
