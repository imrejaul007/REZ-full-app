# UNIFIED CHAT + SEARCH INTEGRATION

**Date:** 2026-05-02

---

## SEARCH SERVICE CONNECTIONS

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║         UNIFIED CHAT + SEARCH + MERCHANTS + CONSUMERS                     ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## HOW SEARCH WORKS WITH CHAT

### In Chat - Customer Says:

```
Customer: "Find me a good Italian restaurant nearby"
         ↓
REZ-support-copilot detects: ENQUIRY + SEARCH
         ↓
Searches rez-search-service
         ↓
Returns: "Here are Italian restaurants near you..."
         ↓
Customer can order/book directly in chat
```

---

## SEARCH SERVICE ENDPOINTS

```
ALREADY EXISTS IN rez-search-service:

├── /api/search?q=         → General search
├── /api/search/merchants  → Merchant search
├── /api/search/products    → Product/dish search
├── /api/search/menu        → Menu item search
├── /recommend/personalized → Personalized recommendations
├── /home/feed            → Home feed
├── /api/search/history    → Search history
└── /api/search/history/popular → Popular searches
```

---

## INTEGRATION FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED CHAT + SEARCH                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CUSTOMER IN CHAT:                                                        │
│   "Find me spicy food"                                                    │
│         │                                                                   │
│         ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 REZ-SUPPORT-COPILOT                                 │   │
│   │                                                                      │   │
│   │   Intent: ENQUIRY + SEARCH                                         │   │
│   │   Detects: "Find me" + "spicy food"                              │   │
│   │                                                                      │   │
│   └──────────────────────────┬──────────────────────────────────────────┘   │
│                              │                                                │
│                              ▼                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 REZ-SEARCH-SERVICE                                   │   │
│   │                                                                      │   │
│   │   /api/search?q=spicy food                                        │   │
│   │   + /api/search/menu?dietary=spicy                               │   │
│   │   + /recommend/personalized?preference=spicy                      │   │
│   │                                                                      │   │
│   └──────────────────────────┬──────────────────────────────────────────┘   │
│                              │                                                │
│                              ▼                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 REZ-SUPPORT-COPILOT                                 │   │
│   │                                                                      │   │
│   │   "Based on your preferences, I found 3 spicy restaurants:         │   │
│   │    1. Spice Garden - Indian - 4.5★ - 0.5km                        │   │
│   │    2. Thai Orchid - Thai - 4.3★ - 1.2km                          │   │
│   │    3. Jalapeño's - Mexican - 4.1★ - 2km                         │   │
│   │                                                                      │   │
│   │   Would you like to order from any of these?"                      │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CHAT + SEARCH USE CASES

### 1. Restaurant Search

```
Customer: "Show me pizza places open now"
         ↓
Search → rez-search-service (merchants open now)
         ↓
Chat → "Found 5 pizza places open now near you:
        1. Dominos Pizza - Open until 11pm - 4.2★
        2. Pizza Hut - Open until 10pm - 4.0★
        3. La Pino'z - Open until 10:30pm - 4.3★"
         ↓
Customer: "Book a table at La Pino'z for 2 at 8pm"
         ↓
Booking flow in chat
```

### 2. Menu Search

```
Customer: "What vegetarian options do you have?"
         ↓
Search → rez-search-service (menu items vegetarian)
         ↓
Chat → "Here are vegetarian options:
        Appetizers:
        • Paneer Tikka - ₹250
        • Veg Spring Roll - ₹150
        
        Main Course:
        • Paneer Butter Masala - ₹280
        • Malai Kofta - ₹260
        • Dal Makhani - ₹220
        
        Would you like to add any to your order?"
```

### 3. Personalized Recommendations

```
Customer: "What should I order tonight?"
         ↓
Search → /recommend/personalized (based on history)
         ↓
Chat → "Based on your preferences:
        • You love Italian - Try our new Truffle Pasta! - ₹320
        • You often order Paneer dishes - Paneer Lanthropicdar - ₹290
        • Popular this week - Butter Chicken - ₹350
        
        What would you like to order?"
```

### 4. Voice Search (Future)

```
Customer: 🎤 "Order my usual from Domino's"
         ↓
Speech-to-Text
         ↓
REZ-support-copilot understands "usual" = past order
         ↓
Search → Customer history + favorite items
         ↓
Chat → "Your usual from Domino's:
        • Margherita Pizza (Large) - ₹499
        • Garlic Bread - ₹149
        • Coca Cola - ₹60
        
        Total: ₹708
        Confirm order? (Yes/No)"
```

---

## MERCHANT SIDE - SEARCH INSIGHTS

```
MERCHANT ASKS: "What are customers searching for?"
         ↓
REZ-search-service analytics
         ↓
Chat → "Top searches this week:
        1. Biryani (324 searches)
        2. Pizza (289 searches)
        3. Pasta (198 searches)
        4. Burger (176 searches)
        5. Desserts (145 searches)
        
        Recommendation: Add more biryani varieties!"
```

---

## TECHNICAL INTEGRATION

### REZ-support-copilot should call:

```javascript
// Search for merchants
const merchants = await axios.get(`${SEARCH_SERVICE_URL}/api/search/merchants`, {
  params: {
    q: query,
    location: userLocation,
    openNow: true
  }
});

// Search menu items
const menuItems = await axios.get(`${SEARCH_SERVICE_URL}/api/search/menu`, {
  params: {
    q: query,
    merchantId: merchantId,
    dietary: userPreferences.dietary
  }
});

// Get personalized recommendations
const recommendations = await axios.get(`${SEARCH_SERVICE_URL}/recommend/personalized`, {
  params: {
    userId: userId,
    context: 'chat'
  }
});
```

---

## ENVIRONMENT VARIABLES NEEDED

```
REZ-SEARCH-SERVICE already deployed at:
https://rez-search-service.onrender.com

REZ-SUPPORT-COPILOT needs:
SEARCH_SERVICE_URL=https://rez-search-service.onrender.com
```

---

## APPS THAT USE SEARCH

```
EXISTING SEARCH USERS:
├── rez-app-consumer → Search restaurants, dishes
├── rez-app-merchant → Search analytics
├── rez-search-service → Core search engine
└── rez-catalog-service → Product catalog

CHAT INTEGRATION:
├── REZ-support-copilot → Search via chat
├── rez-unified-chat → Display search results
└── REZ-merchant-copilot → Merchant search insights
```

---

## SUMMARY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   UNIFIED CHAT + SEARCH + MERCHANTS + CONSUMERS                           │
│                                                                             │
│   CUSTOMER IN CHAT:                                                        │
│   "Find me Italian food"                                                  │
│         ↓                                                                  │
│   REZ-SEARCH-SERVICE ← Searches merchants, menu, recommendations          │
│         ↓                                                                  │
│   REZ-SUPPORT-COPILOT ← Returns natural language response                 │
│         ↓                                                                  │
│   "Found 5 Italian restaurants near you. Order from any?"                  │
│                                                                             │
│   MERCHANT IN CHAT:                                                        │
│   "What are customers searching for?"                                      │
│         ↓                                                                  │
│   REZ-SEARCH-SERVICE ← Returns analytics                                   │
│         ↓                                                                  │
│   REZ-MERCHANT-COPILOT ← Natural language response                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FILES INVOLVED

```
SERVICES:
├── rez-search-service      → Already deployed, needs search endpoints
├── rez-catalog-service     → Already deployed, product data
├── REZ-support-copilot    → Needs search integration
├── REZ-merchant-copilot   → Needs search insights
└── rez-unified-chat       → Needs search result display

REPOS TO UPDATE:
├── REZ-support-copilot     → Add search calls
└── REZ-merchant-copilot   → Add search insights
```

---

**Last Updated:** 2026-05-02
**Status:** Integration documented
