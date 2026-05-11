const axios = require('axios');

const SEARCH_SERVICE = process.env.SEARCH_SERVICE_URL || 'https://rez-search-service.onrender.com';
const KNOWLEDGE_BASE = process.env.KNOWLEDGE_BASE_URL || 'https://rez-knowledge-base-service.onrender.com';
const SUPPORT_COPILOT_URL = process.env.SUPPORT_COPILOT_URL || 'http://localhost:4033';

class SearchIntentHandler {

  constructor(serviceIntegrations) {
    this.services = serviceIntegrations;
  }

  // Detect search intent from message
  detectSearchIntent(message) {
    const lowerMsg = message.toLowerCase();

    // Restaurant/cuisine search
    if (lowerMsg.match(/find|search|looking for|show me|get me|need/)) {
      if (lowerMsg.match(/restaurant|food|cuisine|eat|dinner|lunch|breakfast/)) {
        return 'RESTAURANT_SEARCH';
      }

      // Menu/item search
      if (lowerMsg.match(/dish|item|menu|order|get|want/)) {
        return 'MENU_SEARCH';
      }
    }

    // Location-based search
    if (lowerMsg.match(/near|nearby|around|close to|within/)) {
      return 'LOCATION_SEARCH';
    }

    // Dietary preferences
    if (lowerMsg.match(/vegetarian|vegan|gluten-free|halal|kosher/)) {
      return 'DIETARY_SEARCH';
    }

    // Price-based
    if (lowerMsg.match(/cheap|budget|affordable|expensive|under|over|less than|more than/)) {
      return 'PRICE_SEARCH';
    }

    return null;
  }

  // Handle search intent
  async handle(message, context = {}) {
    const searchType = this.detectSearchIntent(message);

    if (!searchType) return null;

    switch (searchType) {
      case 'RESTAURANT_SEARCH':
        return await this.searchRestaurants(message, context);

      case 'MENU_SEARCH':
        return await this.searchMenu(message, context);

      case 'LOCATION_SEARCH':
        return await this.searchNearby(message, context);

      case 'DIETARY_SEARCH':
        return await this.searchDietary(message, context);

      case 'PRICE_SEARCH':
        return await this.searchByPrice(message, context);

      default:
        return null;
    }
  }

  async searchRestaurants(message, context) {
    // Extract cuisine type
    const cuisines = ['italian', 'chinese', 'indian', 'mexican', 'japanese', 'thai', 'american', 'korean'];
    const foundCuisine = cuisines.find(c => message.toLowerCase().includes(c));

    // Build search params
    const params = {
      q: foundCuisine || message,
      limit: 5
    };

    if (context.location) {
      params.lat = context.location.lat;
      params.lng = context.location.lng;
      params.radius = 10; // km
    }

    try {
      const response = await axios.get(`${SEARCH_SERVICE}/search/stores`, { params, timeout: 5000 });
      const stores = response.data.stores || response.data.data || [];

      if (stores.length === 0) {
        // No results found - trigger support intent
        console.log(`[SEARCH] No restaurants found for query: ${params.q}`);

        // Log the no-results event
        try {
          const EVENT_PLATFORM = process.env.REZ_EVENT_PLATFORM_URL || 'https://REZ-event-platform.onrender.com';
          await axios.post(`${EVENT_PLATFORM}/api/events`, {
            source: 'rez-support-copilot',
            type: 'search.no_results',
            data: {
              query: params.q,
              searchType: 'RESTAURANT_SEARCH',
              location: context.location,
              merchantId: context.merchantId,
              timestamp: new Date().toISOString(),
            },
          }, { timeout: 3000 });
        } catch (e) {
          console.warn('Failed to log no-results event');
        }

        return {
          intent: 'RESTAURANT_SEARCH',
          found: false,
          needsSupport: true,
          message: "I couldn't find any restaurants matching your search. Would you like to try a different cuisine or location? You can also speak with our support team for personalized recommendations."
        };
      }

      // Format response
      let responseText = `Found ${stores.length} restaurant${stores.length > 1 ? 's' : ''}`;
      if (foundCuisine) {
        responseText += ` serving ${foundCuisine} food`;
      }
      responseText += ':\n\n';

      const formattedStores = stores.slice(0, 5).map((store, i) => {
        return `${i + 1}. ${store.name}
   📍 ${store.address || 'Location available'}
   ⭐ ${store.rating || '4.0'} stars
   🕐 ${store.isOpen ? 'Open now' : 'Closed'}
   ${store.deliveryTime ? `🚚 ${store.deliveryTime} min` : ''}
   ${store.minOrder ? `Min order: ₹${store.minOrder}` : ''}`;
      });

      return {
        intent: 'RESTAURANT_SEARCH',
        found: true,
        message: responseText + formattedStores.join('\n\n') + '\n\nWould you like to place an order from any of these?',
        data: stores.slice(0, 5),
        actions: ['order', 'book', 'more_info']
      };

    } catch (error) {
      console.error('Restaurant search error:', error);
      return {
        intent: 'RESTAURANT_SEARCH',
        found: false,
        message: "I'm having trouble searching restaurants right now. Please try again in a moment."
      };
    }
  }

  async searchMenu(message, context) {
    const { merchantId } = context;

    if (!merchantId) {
      return {
        intent: 'MENU_SEARCH',
        found: false,
        message: "I need to know which restaurant you're interested in to search the menu. Can you specify the restaurant name?"
      };
    }

    try {
      const response = await axios.get(`${SEARCH_SERVICE}/search/products`, {
        params: { q: message, merchantId, limit: 5 },
        timeout: 5000
      });

      const products = response.data.products || response.data.data || [];

      if (products.length === 0) {
        // No results found - log and trigger support
        console.log(`[SEARCH] No products found for query: ${message}`);

        try {
          const EVENT_PLATFORM = process.env.REZ_EVENT_PLATFORM_URL || 'https://REZ-event-platform.onrender.com';
          await axios.post(`${EVENT_PLATFORM}/api/events`, {
            source: 'rez-support-copilot',
            type: 'search.no_results',
            data: {
              query: message,
              searchType: 'MENU_SEARCH',
              merchantId: context.merchantId,
              timestamp: new Date().toISOString(),
            },
          }, { timeout: 3000 });
        } catch (e) {
          console.warn('Failed to log no-results event');
        }

        return {
          intent: 'MENU_SEARCH',
          found: false,
          needsSupport: true,
          message: "I couldn't find any menu items matching that. Would you like to see the full menu or get help from our support team?"
        };
      }

      const formattedItems = products.map((item, i) => {
        return `${i + 1}. ${item.name}
   💰 ₹${item.price}
   ${item.description || ''}
   ${item.veg ? '🥬 Vegetarian' : '🍗 Non-vegetarian'}`;
      });

      return {
        intent: 'MENU_SEARCH',
        found: true,
        message: `Here are some items that match "${message}":\n\n${formattedItems.join('\n\n')}\n\nWould you like to add any to your order?`,
        data: products,
        actions: ['add_to_cart', 'order']
      };

    } catch (error) {
      console.error('Menu search error:', error);
      return {
        intent: 'MENU_SEARCH',
        found: false,
        message: "I'm having trouble searching the menu right now."
      };
    }
  }

  async searchNearby(message, context) {
    const { location } = context;

    if (!location) {
      return {
        intent: 'LOCATION_SEARCH',
        found: false,
        message: "I'd love to find restaurants near you! Can you share your location or tell me your area?"
      };
    }

    try {
      const response = await axios.get(`${SEARCH_SERVICE}/search/stores`, {
        params: {
          lat: location.lat,
          lng: location.lng,
          radius: 5,
          limit: 5
        },
        timeout: 5000
      });

      const stores = response.data.stores || [];

      if (stores.length === 0) {
        return {
          intent: 'LOCATION_SEARCH',
          found: false,
          message: "I couldn't find any restaurants within 5km of your location. Would you like to expand the search radius?"
        };
      }

      return {
        intent: 'LOCATION_SEARCH',
        found: true,
        message: `Found ${stores.length} restaurants near you:\n\n${stores.map((s, i) =>
          `${i + 1}. ${s.name} (${(s.distance || 1).toFixed(1)}km away)`
        ).join('\n')}\n\nWhich one interests you?`,
        data: stores,
        actions: ['view_menu', 'order']
      };

    } catch (error) {
      console.error('Location search error:', error);
      return {
        intent: 'LOCATION_SEARCH',
        found: false,
        message: "I'm having trouble finding places near you right now."
      };
    }
  }

  async searchDietary(message, context) {
    const { location, merchantId } = context;

    const dietLabels = {
      'vegetarian': ['V', 'vegetarian', 'veg'],
      'vegan': ['VG', 'vegan'],
      'gluten-free': ['GF', 'gluten free'],
      'halal': ['H', 'halal'],
      'jain': ['J', 'jain']
    };

    let dietaryType = null;
    for (const [type, labels] of Object.entries(dietLabels)) {
      if (labels.some(l => message.toLowerCase().includes(l))) {
        dietaryType = type;
        break;
      }
    }

    try {
      const params = { dietary: dietaryType, limit: 5 };
      if (location) {
        params.lat = location.lat;
        params.lng = location.lng;
      }
      if (merchantId) {
        params.merchantId = merchantId;
      }

      const response = await axios.get(`${SEARCH_SERVICE}/search/products`, {
        params,
        timeout: 5000
      });

      const products = response.data.products || [];

      return {
        intent: 'DIETARY_SEARCH',
        found: products.length > 0,
        message: products.length > 0
          ? `Found ${products.length} ${dietaryType} options:\n\n${products.map((p, i) =>
            `${i + 1}. ${p.name} - ₹${p.price}`
          ).join('\n')}\n\nWould you like to order any?`
          : `I couldn't find any ${dietaryType} options. Would you like me to search for something else?`,
        data: products,
        dietaryType,
        actions: ['add_to_cart', 'order']
      };

    } catch (error) {
      console.error('Dietary search error:', error);
      return {
        intent: 'DIETARY_SEARCH',
        found: false,
        message: "I'm having trouble searching right now."
      };
    }
  }

  async searchByPrice(message, context) {
    // Extract price range from message
    const underMatch = message.match(/under|less than|below|max.*(\d+)/i);
    const overMatch = message.match(/over|more than|above|min.*(\d+)/i);
    const betweenMatch = message.match(/between (\d+) and (\d+)/i);

    let minPrice = 0;
    let maxPrice = Infinity;

    if (betweenMatch) {
      minPrice = parseInt(betweenMatch[1]);
      maxPrice = parseInt(betweenMatch[2]);
    } else if (underMatch) {
      maxPrice = parseInt(underMatch[1] || underMatch[0].match(/\d+/)?.[0]);
    } else if (overMatch) {
      minPrice = parseInt(overMatch[1] || overMatch[0].match(/\d+/)?.[0]);
    }

    try {
      const params = {
        minPrice,
        maxPrice: maxPrice === Infinity ? undefined : maxPrice,
        limit: 5
      };
      if (context.merchantId) params.merchantId = context.merchantId;

      const response = await axios.get(`${SEARCH_SERVICE}/search/products`, {
        params,
        timeout: 5000
      });

      const products = response.data.products || [];

      const priceRange = maxPrice === Infinity
        ? `above ₹${minPrice}`
        : minPrice === 0
          ? `under ₹${maxPrice}`
          : `₹${minPrice} - ₹${maxPrice}`;

      return {
        intent: 'PRICE_SEARCH',
        found: products.length > 0,
        message: products.length > 0
          ? `Found ${products.length} options ${priceRange}:\n\n${products.map((p, i) =>
            `${i + 1}. ${p.name} - ₹${p.price}`
          ).join('\n')}\n\nWould you like to order any?`
          : `I couldn't find items in that price range. Try a different budget?`,
        data: products,
        priceRange,
        actions: ['add_to_cart', 'order']
      };

    } catch (error) {
      console.error('Price search error:', error);
      return {
        intent: 'PRICE_SEARCH',
        found: false,
        message: "I'm having trouble searching right now."
      };
    }
  }
}

module.exports = SearchIntentHandler;
