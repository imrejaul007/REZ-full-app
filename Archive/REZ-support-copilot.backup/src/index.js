/**
 * REZ Support Copilot Service
 * AI-powered customer support with unified support capabilities
 *
 * Features:
 * - Intent detection (ORDER, BOOK, ENQUIRE, COMPLAINT, GREETING, SEARCH, USER_INFO)
 * - Extended intents (PAYMENT, DELIVERY, FEEDBACK, RESCHEDULE, CANCEL, DIETARY, OPENING_HOURS, LOCATION, CONTACT, LOYALTY, GIFT)
 * - Knowledge base integration
 * - User profile lookup
 * - Multi-merchant support
 * - Personalized response generation
 * - Conversation history storage
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const services = require('./services/serviceIntegrations');
const SearchIntentHandler = require('./intents/searchIntent');
const OrderIntentHandler = require('./intents/orderIntent');
const orderServiceIntegration = require('./services/orderServiceIntegration');

// AI Intent Classifier - Load trained model
const IntentClassifier = require('../training/train-model');
const trainingData = require('../training-data/intent-training.json');
let intentClassifier = null;

// Initialize the AI intent classifier
try {
  intentClassifier = new IntentClassifier(trainingData.training_data);
  console.log('[INFO] AI Intent Classifier loaded successfully');
} catch (err) {
  console.warn('[WARN] Failed to load AI Intent Classifier, using regex-based detection:', err.message);
}

// Initialize handlers
const searchHandler = new SearchIntentHandler(services);
const orderIntentHandler = new OrderIntentHandler();

// Webhook routes
const orderWebhooks = require('./webhooks/orderWebhooks');

const app = express();
const PORT = process.env.PORT || 4033;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-support';
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4008';
const REZ_EVENT_PLATFORM_URL = process.env.REZ_EVENT_PLATFORM_URL || 'http://localhost:4010';
const KNOWLEDGE_BASE_URL = process.env.KNOWLEDGE_BASE_URL || 'http://localhost:4011';
const REZ_ORDER_SERVICE_URL = process.env.REZ_ORDER_SERVICE_URL || 'http://localhost:4012';
const REZ_BOOKING_SERVICE_URL = process.env.REZ_BOOKING_SERVICE_URL || 'http://localhost:4013';
const REZ_MERCHANT_COPILOT_URL = process.env.REZ_MERCHANT_COPILOT_URL || 'http://localhost:4014';
const REZ_SEARCH_SERVICE_URL = process.env.REZ_SEARCH_SERVICE_URL || 'https://rez-search-service.onrender.com';

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

// Logger
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[ERROR] ${msg}`, data || ''),
};

// ============================================================
// INTENT TYPES
// ============================================================

const IntentTypes = {
  ORDER: 'ORDER',
  BOOK: 'BOOK',
  ENQUIRE: 'ENQUIRE',
  COMPLAINT: 'COMPLAINT',
  GREETING: 'GREETING',
  SEARCH: 'SEARCH',
  USER_INFO: 'USER_INFO',
  UNKNOWN: 'UNKNOWN',
  // New intents
  PAYMENT: 'PAYMENT',
  DELIVERY: 'DELIVERY',
  FEEDBACK: 'FEEDBACK',
  RESCHEDULE: 'RESCHEDULE',
  CANCEL: 'CANCEL',
  DIETARY: 'DIETARY',
  OPENING_HOURS: 'OPENING_HOURS',
  LOCATION: 'LOCATION',
  CONTACT: 'CONTACT',
  LOYALTY: 'LOYALTY',
  GIFT: 'GIFT',
};

// ============================================================
// INTENT DETECTION LOGIC
// ============================================================

const intentPatterns = {
  [IntentTypes.ORDER]: [
    /\border\b.*\b(meal|food|pizza|burger|sushi|chicken|rice|dish|item|course)\b/i,
    /\b(place|want|get|need|have|gotta|got)\b.*\border\b/i,
    /\bordering\b/i,
    /\bi\s+want\b.*\bto\s+order\b/i,
    /\blet's\s+order\b/i,
    /\bcan\s+i\s+order\b/i,
    /\bi'll\s+have\b/i,
    /\bget\s+me\b.*\bfood\b/i,
    /\bdelivery\b/i,
    /\btakeout\b/i,
    /\bpickup\b/i,
  ],
  [IntentTypes.BOOK]: [
    /\bbook\b.*\b(table|seat|reservation|spot|slot|appointment)\b/i,
    /\b(need|want|make|reserve)\b.*\b(reservation|booking|table)\b/i,
    /\bi'd\s+like\s+to\s+reserve\b/i,
    /\breserve\b.*\bfor\b/i,
    /\bcan\s+i\s+book\b/i,
    /\bschedule\b/i,
    /\bbook\s+now\b/i,
  ],
  [IntentTypes.ENQUIRE]: [
    /\b(what|when|where|how|does|do|is|are|can|could|would)\b.*\b(time|hour|open|close|close|available|price|cost|menu|option|special|location|address|phone|number|review)\b/i,
    /\bhow\s+much\b/i,
    /\bwhat\s+time\b/i,
    /\bdo\s+you\s+(have|serve|offer)\b/i,
    /\bdo\s+they\s+(have|serve)\b/i,
    /\bwhat's\s+(on\s+)?the\s+(menu|price)\b/i,
    /\bany\s+(vegan|vegetarian|gluten-free|options)\b/i,
    /\boperating\s+hours\b/i,
    /\bdo\s+you\s+deliver\b/i,
    /\bcredit\s+cards?\s+accepted\b/i,
    /\bparking\s+available\b/i,
  ],
  [IntentTypes.COMPLAINT]: [
    /\b(cold|late|wrong|missing|bad|tasteless|soggy|burnt|undercooked|overcooked)\b.*\b(food|order|meal|chicken|burger|pizza)\b/i,
    /\bmy\s+order\s+is\s+(wrong|late|cold)\b/i,
    /\bthis\s+(food|order|meal)\s+is\s+(bad|cold|terrible|awful)\b/i,
    /\bi\s+(didn'?t|wasn'?t)\s+get\b.*\b(extra|sauce|fork|napkin)\b/i,
    /\bwrong\s+(item|order|food)\b/i,
    /\bmissing\s+(item|food)\b/i,
    /\bpoor\s+(service|quality)\b/i,
    /\bdisappointed\b/i,
    /\bnot\s+(happy|satisfied)\b/i,
    /\brefund\b/i,
    /\bcomplaint\b/i,
    /\bworst\b.*\b(ever|experience)\b/i,
    /\bterrible\b/i,
    /\bhorrible\b/i,
    /\bangry\b/i,
    /\bfrustrated\b/i,
  ],
  [IntentTypes.GREETING]: [
    /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|howdy|yo|what'?s\s+up)\b/i,
    /\bhi\s+there\b/i,
    /\bgood\s+to\s+(see|hear)\s+you\b/i,
    /\bhow\s+(are\s+you|do\s+you\s+do)\b/i,
    /\bwhat\s+can\s+i\s+get\s+you\b/i,
    /\bwelcome\b/i,
    /\bhave\s+a\s+nice\s+day\b/i,
  ],
  [IntentTypes.SEARCH]: [
    /\b(search|find|look\s+for|looking\s+for)\b.*\b(restaurant|store|shop|place|cafe|diner)\b/i,
    /\bwhere\s+(can\s+i|to)\s+(find|get|buy)\b.*\b(food|meal|pizza|burger|sushi)\b/i,
    /\bnearby\b/i,
    /\bnear\s+me\b/i,
    /\bclosest\b.*\b(restaurant|cafe|shop)\b/i,
    /\bdelivery\b.*\bnear\b/i,
    /\brecommend\b.*\b(restaurant|place|food)\b/i,
    /\bbest\s+(restaurant|cafe|pizza|burger)\b/i,
  ],
  [IntentTypes.USER_INFO]: [
    /\bmy\s+(profile|account|orders?|history)\b/i,
    /\bi\s+want\s+to\s+(see|check)\s+(my|the)\s+(profile|orders?|account)\b/i,
    /\bshow\s+(me)?\s+my\s+(info|information)\b/i,
    /\bwhat\s+(is|are)\s+my\s+(orders?|preferences)\b/i,
    /\bhave\s+i\s+(ordered|been)\s+(before|from)\b/i,
  ],
  // New intent patterns
  [IntentTypes.PAYMENT]: [
    /\b(pay|payment|paytm|gpay|google pay|phonepe|cash|card|upi)\b/i,
    /\b(refund|money|cost|price|bill|invoice|receipt)\b/i,
    /\b(transaction|charged|deducted)\b/i,
    /\bhow\s+much\b.*\bcost\b/i,
    /\bpay\s+for\b/i,
    /\bpayment\s+failed\b/i,
    /\bnot\s+charged\b/i,
    /\bmoney\s+deducted\b/i,
    /\btransaction\s+failed\b/i,
  ],
  [IntentTypes.DELIVERY]: [
    /\b(deliver|delivery|shipping|dispatch)\b/i,
    /\b(track|eta|arrive)\b/i,
    /\bwhere\s+is\s+(my|the)\s+(order|food|delivery)\b/i,
    /\bhow\s+long\b.*\b(deliver|take)\b/i,
    /\bwhen\s+will\b.*\b(arrive|deliver|get)\b/i,
    /\b(delivery|shipping)\s+time\b/i,
    /\b(delivered|sent|dispatched)\b/i,
  ],
  [IntentTypes.FEEDBACK]: [
    /\b(review|rating|feedback|stars)\b/i,
    /\b(experience|suggest|improve)\b/i,
    /\brate\s+(the|my|our)\b/i,
    /\bgive\s+(stars|rating)\b/i,
    /\bhow\s+was\b.*\b(experience|food|service)\b/i,
    /\bwould\s+you\s+recommend\b/i,
    /\bopinion\s+on\b/i,
  ],
  [IntentTypes.RESCHEDULE]: [
    /\b(reschedule|postpone|delay)\b/i,
    /\bchange\s+(the\s+)?time\b/i,
    /\bdifferent\s+time\b/i,
    /\bmove\s+to\b.*\b(later|another)\b/i,
    /\b(appointment|booking)\s+later\b/i,
    /\bcan\s+i\s+(change|reschedule)\b/i,
  ],
  [IntentTypes.CANCEL]: [
    /\b(cancel|cancelled|abort)\b/i,
    /\bdon'?t\s+want\b/i,
    /\bstop\s+(order|booking)\b/i,
    /\bremove\b.*\b(order|booking)\b/i,
    /\bundo\b.*\b(order|booking)\b/i,
    /\bcancel\s+my\b/i,
    /\bi\s+want\s+to\s+cancel\b/i,
  ],
  [IntentTypes.DIETARY]: [
    /\b(vegetarian|vegan|gluten[- ]free)\b/i,
    /\b(allergy|allergic)\b/i,
    /\b(halal|kosher|jain)\b/i,
    /\b(nut\s+free|lactose|dairy\s+free)\b/i,
    /\b(food\s+preference|diet)\b/i,
    /\bare\s+there\s+any\s+(vegetarian|vegan)\b/i,
    /\bdo\s+you\s+have\b.*\boptions\b/i,
  ],
  [IntentTypes.OPENING_HOURS]: [
    /\b(open|closed|closing|opening)\b/i,
    /\b(timing|hours?|hour)\b/i,
    /\bwhen\s+(are\s+you|do\s+you|is\s+it)\b/i,
    /\buntil\s+what\s+time\b/i,
    /\bfrom\s+what\s+time\b/i,
    /\boperating\s+hours\b/i,
    /\bwhat\s+time\b.*\b(close|open)\b/i,
  ],
  [IntentTypes.LOCATION]: [
    /\b(address|where|located|location)\b/i,
    /\b(direction| directions|map| directions)\b/i,
    /\bhow\s+to\s+reach\b/i,
    /\b(parking|landmark)\b/i,
    /\bcan\s+i\s+find\b/i,
    /\baddress\s+of\b/i,
  ],
  [IntentTypes.CONTACT]: [
    /\b(call|phone|email|whatsapp)\b/i,
    /\b(contact|reach|talk\s+to)\b/i,
    /\bget\s+in\s+touch\b/i,
    /\bspeak\s+with\b/i,
    /\bneed\s+to\s+(contact|reach)\b/i,
    /\bhow\s+can\s+i\s+contact\b/i,
  ],
  [IntentTypes.LOYALTY]: [
    /\b(points|rewards|loyalty|cashback)\b/i,
    /\b(redeem|offers?|discount|coupon)\b/i,
    /\bloyalty\s+(program|points)\b/i,
    /\bhow\s+many\s+points\b/i,
    /\b(earn|use)\s+points\b/i,
    /\bmy\s+(points|rewards)\b/i,
  ],
  [IntentTypes.GIFT]: [
    /\b(gift|voucher|present)\b/i,
    /\b(birthday|anniversary|celebration)\b/i,
    /\bsurprise\s+(for|package)\b/i,
    /\bgift\s+(card|package|certificate)\b/i,
    /\bbuy\s+(gift|voucher)\b/i,
    /\bgive\s+(as\s+)?a\s+gift\b/i,
  ],
};

function detectIntent(message) {
  if (!message || typeof message !== 'string') {
    return { intent: IntentTypes.UNKNOWN, confidence: 0 };
  }

  const lowerMessage = message.toLowerCase().trim();

  // Try AI model first if available
  if (intentClassifier) {
    const aiResult = intentClassifier.predict(message);
    if (aiResult.confidence > 0.5) {
      return {
        intent: aiResult.intent,
        confidence: aiResult.confidence,
        scores: aiResult.allScores,
        message: lowerMessage,
        model: 'ai',
      };
    }
  }

  // Fallback to regex-based detection
  const scores = {};
  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    scores[intent] = 0;
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        scores[intent] += 1;
      }
    }
  }

  // Find the intent with the highest score
  let bestIntent = IntentTypes.UNKNOWN;
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent;
    }
  }

  // Calculate confidence based on score and message length
  const confidence = maxScore > 0 ? Math.min(0.95, 0.5 + (maxScore * 0.15)) : 0;

  return {
    intent: bestIntent,
    confidence,
    scores,
    message: lowerMessage,
    model: 'regex',
  };
}

// ============================================================
// SUPPORT TICKET SCHEMA
// ============================================================

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
  messages: [{
    senderId: String,
    senderType: { type: String, enum: ['user', 'agent', 'system'] },
    content: String,
    timestamp: { type: Date, default: Date.now },
  }],
  userHistory: {
    ticketsCreated: { type: Number, default: 0 },
    avgResolutionTime: { type: Number, default: 0 },
    satisfactionScore: { type: Number, default: 5 },
    commonIssues: [String],
  },
  aiSuggestions: [{
    type: { type: String },
    suggestion: String,
    confidence: Number,
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);

// ============================================================
// CONVERSATION HISTORY SCHEMA
// ============================================================

const conversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  merchantId: { type: String, index: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: String,
    intent: String,
    confidence: Number,
    timestamp: { type: Date, default: Date.now },
  }],
  context: {
    lastIntent: String,
    lastEntities: mongoose.Schema.Types.Mixed,
    preferences: mongoose.Schema.Types.Mixed,
  },
  metadata: {
    platform: { type: String, default: 'api' },
    userAgent: String,
    ipAddress: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

// ============================================================
// USER PROFILE SCHEMA
// ============================================================

const userProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  name: String,
  email: String,
  phone: String,
  preferences: {
    language: { type: String, default: 'en' },
    notificationEnabled: { type: Boolean, default: true },
    favoriteCuisines: [String],
    dietaryRestrictions: [String],
    paymentMethod: String,
  },
  orderHistory: [{
    orderId: String,
    merchantId: String,
    items: [String],
    total: Number,
    date: Date,
  }],
  interactionCount: { type: Number, default: 0 },
  lastInteraction: Date,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);

// ============================================================
// MERCHANT SCHEMA
// ============================================================

const merchantSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['restaurant', 'cafe', 'bakery', 'bar', 'food_truck', 'catering'], default: 'restaurant' },
  cuisine: [String],
  contact: {
    phone: String,
    email: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  hours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean },
  },
  settings: {
    deliveryAvailable: { type: Boolean, default: true },
    pickupAvailable: { type: Boolean, default: true },
    reservationEnabled: { type: Boolean, default: true },
    minOrderAmount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    avgDeliveryTime: { type: Number, default: 30 },
  },
  menu: [{
    category: String,
    items: [{
      name: String,
      description: String,
      price: Number,
      available: { type: Boolean, default: true },
    }],
  }],
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Merchant = mongoose.models.Merchant || mongoose.model('Merchant', merchantSchema);

// ============================================================
// ANALYTICS SCHEMA
// ============================================================

const supportAnalyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  totalTickets: { type: Number, default: 0 },
  openTickets: { type: Number, default: 0 },
  resolvedTickets: { type: Number, default: 0 },
  avgResolutionTime: { type: Number, default: 0 },
  sentimentBreakdown: {
    positive: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
  },
  categoryBreakdown: { type: Map, of: Number, default: {} },
  priorityBreakdown: {
    low: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    urgent: { type: Number, default: 0 },
  },
  intentBreakdown: {
    ORDER: { type: Number, default: 0 },
    BOOK: { type: Number, default: 0 },
    ENQUIRE: { type: Number, default: 0 },
    COMPLAINT: { type: Number, default: 0 },
    GREETING: { type: Number, default: 0 },
    UNKNOWN: { type: Number, default: 0 },
    PAYMENT: { type: Number, default: 0 },
    DELIVERY: { type: Number, default: 0 },
    FEEDBACK: { type: Number, default: 0 },
    RESCHEDULE: { type: Number, default: 0 },
    CANCEL: { type: Number, default: 0 },
    DIETARY: { type: Number, default: 0 },
    OPENING_HOURS: { type: Number, default: 0 },
    LOCATION: { type: Number, default: 0 },
    CONTACT: { type: Number, default: 0 },
    LOYALTY: { type: Number, default: 0 },
    GIFT: { type: Number, default: 0 },
  },
});

const SupportAnalytics = mongoose.models.SupportAnalytics || mongoose.model('SupportAnalytics', supportAnalyticsSchema);

// ============================================================
// SENTIMENT ANALYSIS
// ============================================================

function analyzeSentiment(text) {
  if (!text) return 'neutral';

  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect', 'thank', 'thanks', 'helpful', 'good', 'best', 'awesome', 'delicious', 'tasty', 'fresh', 'friendly', 'quick', 'fast'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'angry', 'frustrated', 'disappointed', 'poor', 'slow', 'broken', 'useless', 'problem', 'issue', 'error', 'fail', 'cold', 'late', 'wrong', 'missing'];

  const lowerText = text.toLowerCase();
  let score = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 1;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 1;
  });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// ============================================================
// ENTITY EXTRACTION
// ============================================================

function extractEntities(message, intent) {
  const entities = {
    food: [],
    time: null,
    quantity: null,
    specialRequests: [],
  };

  // Extract food items (common food keywords)
  const foodPatterns = [
    /pizza|burger|fries|chicken|rice|pasta|salad|soup|sandwich|steak|fish|sushi|tacos|burrito|noodles|soup|dessert|cake|ice\s*cream|coffee|tea|drink|beverage|appetizer|main\s*course|side\s*dish|breakfast|lunch|dinner/i,
  ];

  const foods = message.match(foodPatterns[0]);
  if (foods) {
    entities.food = foods.map(f => f.toLowerCase());
  }

  // Extract time expressions
  const timePatterns = [
    /(\d{1,2}):?(\d{2})?\s*(am|pm)?/i,
    /(asap|as\s*soon\s*as\s*possible|immediately|right\s*away|now)/i,
    /(today|tomorrow|tonight|this\s+evening|this\s+afternoon)/i,
  ];

  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      entities.time = match[0];
      break;
    }
  }

  // Extract quantities
  const qtyPatterns = [
    /(\d+)\s*(plate|plateful|orders?|portions?|pieces?|slices?|cups?|bowls?|cans?|bottles?|servings?)/gi,
    /(one|two|three|four|five|a|an|some|few)\s+(plate|plateful|orders?|portions?|pieces?|slices?|cups?|bowls?)/gi,
  ];

  for (const pattern of qtyPatterns) {
    const match = [...message.matchAll(pattern)];
    if (match.length > 0) {
      entities.quantity = match.map(m => m[0]);
      break;
    }
  }

  // Extract special requests
  const specialPatterns = [
    /(extra|no|without|add)\s+(cheese|sauce|onion|garlic|spicy|mayo|mustard|mayonnaise)/gi,
    /(allergic|allergy|vegetarian|vegan|gluten[- ]free|keto|halal|kosher|organic)/gi,
    /(peanut|dairy|nut|soy|egg|shellfish)\s*(allergy|free)?/gi,
  ];

  for (const pattern of specialPatterns) {
    const match = message.match(pattern);
    if (match) {
      entities.specialRequests = [...new Set([...entities.specialRequests, ...match.map(m => m.toLowerCase())])];
    }
  }

  return entities;
}

// ============================================================
// RESPONSE GENERATION
// ============================================================

function generateResponse(intent, entities, userProfile, merchantInfo) {
  const responses = {
    [IntentTypes.ORDER]: {
      greeting: "Great! I'd be happy to help you place an order",
      template: (entities) => {
        let response = "Let me help you with your order.";
        if (entities.food.length > 0) {
          response += ` I see you're interested in ${entities.food.join(', ')}.`;
        }
        if (entities.specialRequests.length > 0) {
          response += ` I'll note your special requests: ${entities.specialRequests.join(', ')}.`;
        }
        response += " What else would you like to add to your order?";
        return response;
      },
    },
    [IntentTypes.BOOK]: {
      greeting: "I'd be happy to help you make a reservation",
      template: (entities) => {
        let response = "Let me help you with your booking.";
        if (entities.time) {
          response += ` I see you're looking to book for ${entities.time}.`;
        }
        response += " Could you please provide the number of guests and your preferred date?";
        return response;
      },
    },
    [IntentTypes.ENQUIRE]: {
      greeting: "I'd be happy to help with your question",
      template: (entities) => {
        let response = "That's a great question!";
        if (merchantInfo) {
          response += ` For ${merchantInfo.name}, `;
          if (merchantInfo.hours) {
            response += `we're open today from ${merchantInfo.hours.monday?.open || '9:00 AM'} to ${merchantInfo.hours.monday?.close || '9:00 PM'}.`;
          }
        }
        response += " Is there anything specific you'd like to know more about?";
        return response;
      },
    },
    [IntentTypes.COMPLAINT]: {
      greeting: "I'm sorry to hear about your experience",
      template: (entities) => {
        let response = "I sincerely apologize for the inconvenience. Let me look into this right away.";
        if (entities.food.length > 0) {
          response += ` I understand your concern about the ${entities.food[0]}.`;
        }
        response += " To help resolve this quickly, could you please provide your order number?";
        return response;
      },
    },
    [IntentTypes.GREETING]: {
      greeting: "Hello! Welcome",
      template: (entities) => {
        const hour = new Date().getHours();
        let timeGreeting = "Hello";
        if (hour < 12) timeGreeting = "Good morning";
        else if (hour < 17) timeGreeting = "Good afternoon";
        else timeGreeting = "Good evening";

        let response = `${timeGreeting}! How can I assist you today?`;
        if (userProfile?.name) {
          response = `${timeGreeting}, ${userProfile.name}! How can I assist you today?`;
        }
        response += " I can help you with placing orders, making reservations, answering questions, or addressing any concerns.";
        return response;
      },
    },
    [IntentTypes.UNKNOWN]: {
      greeting: "I'm here to help",
      template: (entities) => {
        return "I'm not quite sure I understood that. I can help you with:\n- Placing orders\n- Making reservations\n- Answering questions about our menu or hours\n- Addressing any concerns or complaints\n\nWhat can I help you with today?";
      },
    },
    // New intent responses
    [IntentTypes.PAYMENT]: {
      greeting: "I can help with payment-related issues",
      template: (entities) => {
        let response = "I'm here to help with your payment query. ";
        if (merchantInfo?.settings?.paymentMethod) {
          response += `We accept ${merchantInfo.settings.paymentMethod}. `;
        }
        response += "Could you please provide more details about your payment concern? For payment issues, having your order ID would be helpful.";
        return response;
      },
    },
    [IntentTypes.DELIVERY]: {
      greeting: "Let me help with your delivery inquiry",
      template: (entities) => {
        let response = "I'd be happy to help track your delivery. ";
        if (merchantInfo?.settings?.avgDeliveryTime) {
          response += `Average delivery time is ${merchantInfo.settings.avgDeliveryTime} minutes. `;
        }
        response += "Could you please provide your order number or the order ID?";
        return response;
      },
    },
    [IntentTypes.FEEDBACK]: {
      greeting: "We appreciate your feedback",
      template: (entities) => {
        let response = "Thank you for sharing your feedback! ";
        response += "Your input helps us improve our service. Would you like to rate your recent experience or share specific suggestions?";
        return response;
      },
    },
    [IntentTypes.RESCHEDULE]: {
      greeting: "I can help you reschedule",
      template: (entities) => {
        let response = "I understand you'd like to change your booking time. ";
        response += "To help you reschedule, could you please provide your booking ID and the new preferred time?";
        return response;
      },
    },
    [IntentTypes.CANCEL]: {
      greeting: "I can help with cancellations",
      template: (entities) => {
        let response = "I'm sorry to hear you want to cancel. ";
        response += "To process your cancellation, could you please provide your order or booking ID? Please note that cancellation policies may vary.";
        return response;
      },
    },
    [IntentTypes.DIETARY]: {
      greeting: "I can help with dietary requirements",
      template: (entities) => {
        let response = "I'd be happy to help with your dietary preferences. ";
        if (merchantInfo?.menu) {
          response += "Let me check what options we have that match your requirements. ";
        }
        response += "Could you please specify your dietary needs (vegetarian, vegan, gluten-free, halal, allergy, etc.)?";
        return response;
      },
    },
    [IntentTypes.OPENING_HOURS]: {
      greeting: "Here are our operating hours",
      template: (entities) => {
        let response = "";
        if (merchantInfo?.hours) {
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const todayHours = merchantInfo.hours[today];
          if (todayHours) {
            if (todayHours.closed) {
              response = `We're closed today (${today}). `;
            } else {
              response = `Today (${today}), we're open from ${todayHours.open || '9:00 AM'} to ${todayHours.close || '9:00 PM'}. `;
            }
          }
        } else {
          response = "Our regular hours are typically 9:00 AM to 9:00 PM. ";
        }
        response += "Is there anything else you'd like to know about our timings?";
        return response;
      },
    },
    [IntentTypes.LOCATION]: {
      greeting: "Here's our location information",
      template: (entities) => {
        let response = "";
        if (merchantInfo?.contact?.address) {
          response = `Our address is: ${merchantInfo.contact.address}. `;
          if (merchantInfo.contact.city) {
            response += `${merchantInfo.contact.city}, `;
          }
          if (merchantInfo.contact.state) {
            response += `${merchantInfo.contact.state} `;
          }
          if (merchantInfo.contact.zipCode) {
            response += merchantInfo.contact.zipCode;
          }
          response += ". ";
        } else {
          response = "Our location details are available on our website. ";
        }
        if (merchantInfo?.settings?.parkingAvailable) {
          response += "Parking is available. ";
        }
        response += "Would you like directions or help finding us?";
        return response;
      },
    },
    [IntentTypes.CONTACT]: {
      greeting: "Here's how you can reach us",
      template: (entities) => {
        let response = "";
        if (merchantInfo?.contact) {
          if (merchantInfo.contact.phone) {
            response += `Phone: ${merchantInfo.contact.phone}. `;
          }
          if (merchantInfo.contact.email) {
            response += `Email: ${merchantInfo.contact.email}. `;
          }
          if (merchantInfo.contact.whatsapp) {
            response += `WhatsApp: ${merchantInfo.contact.whatsapp}. `;
          }
        } else {
          response = "You can reach our support team via phone, email, or WhatsApp. ";
        }
        response += "Is there a specific department you'd like to speak with?";
        return response;
      },
    },
    [IntentTypes.LOYALTY]: {
      greeting: "Welcome to our rewards program",
      template: (entities) => {
        let response = "I can help you with your loyalty points and rewards. ";
        if (userProfile?.preferences?.loyaltyPoints) {
          response += `You currently have ${userProfile.preferences.loyaltyPoints} points. `;
        }
        response += "Would you like to check your balance, redeem points, or learn about current offers?";
        return response;
      },
    },
    [IntentTypes.GIFT]: {
      greeting: "We have wonderful gift options",
      template: (entities) => {
        let response = "Great choice! We offer gift cards and packages for various occasions. ";
        response += "Would you like to know about our gift cards for birthdays, anniversaries, or special celebrations?";
        return response;
      },
    },
  };

  const responseConfig = responses[intent] || responses[IntentTypes.UNKNOWN];
  return responseConfig.template(entities);
}

// ============================================================
// EVENT LOGGING
// ============================================================

const EVENT_PLATFORM = process.env.REZ_EVENT_PLATFORM_URL || 'https://REZ-event-platform.onrender.com';

async function logEvent(type, data) {
  try {
    await axios.post(`${EVENT_PLATFORM}/api/events`, {
      type,
      data,
      timestamp: new Date().toISOString()
    }, { timeout: 3000 });
  } catch (e) {
    console.log('Event log failed:', e.message);
  }
}

// ============================================================
// KNOWLEDGE BASE SEARCH
// ============================================================

async function searchKnowledgeBase(query, filters = {}) {
  try {
    const response = await axios.post(`${KNOWLEDGE_BASE_URL}/api/search`, {
      query,
      filters,
      limit: 10,
    }, { timeout: 5000 });
    return response.data;
  } catch (error) {
    logger.warn('Knowledge base search failed', { error: error.message });
    return { results: [], error: 'Knowledge base unavailable' };
  }
}

// ============================================================
// AI PROCESSING (REZ Intelligence Hub)
// ============================================================

async function processWithAI(text, context = {}) {
  try {
    const response = await axios.post(`${REZ_MIND_URL}/api/ai/process`, {
      text,
      context,
      service: 'support-copilot',
    }, { timeout: 10000 });
    return response.data;
  } catch (error) {
    logger.warn('AI processing failed, using fallback', { error: error.message });
    return null;
  }
}

// ============================================================
// ROUTES
// ============================================================

// Add webhook routes
app.use('/webhooks', orderWebhooks);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-support-copilot',
    version: '1.3.0',
    features: [
      'intent-detection',
      'search-intent',
      'knowledge-base',
      'user-profiles',
      'multi-merchant',
      'conversation-history',
      'service-integrations',
      'order-webhooks',
    ],
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Health check for all backend services
app.get('/api/services/health', async (req, res) => {
  try {
    const results = await services.checkAllServices();
    res.json({
      success: true,
      services: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Services health check error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// NEW UNIFIED SUPPORT ENDPOINTS
// ============================================================

/**
 * POST /api/chat
 * Main chat endpoint with intent detection and personalized responses
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId, userId, merchantId, context = {} } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'message and sessionId are required',
      });
    }

    // Try search intent first - if found, return search results directly
    const searchResult = await searchHandler.handle(message, { merchantId, userId, location: context.location });

    if (searchResult && searchResult.found) {
      // Log search event
      await services.logEvent('search.performed', {
        userId,
        merchantId,
        intent: searchResult.intent,
        message,
        resultsCount: searchResult.data?.results?.length || 0
      });

      // After search performed
      await logEvent('search.performed', {
        userId,
        merchantId,
        query: message
      });

      // Save to conversation history
      await Conversation.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            messages: {
              $each: [
                { role: 'user', content: message, intent: searchResult.intent, confidence: 0.9, timestamp: new Date() },
                { role: 'assistant', content: searchResult.message, intent: searchResult.intent, confidence: 0.9, timestamp: new Date() },
              ],
              $slice: -100,
            },
          },
          $set: {
            userId: userId || undefined,
            merchantId: merchantId || undefined,
            'context.lastIntent': searchResult.intent,
            'metadata.platform': req.headers['user-agent'] || 'api',
            'metadata.ipAddress': req.ip,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, new: true }
      );

      return res.json({
        success: true,
        data: {
          response: searchResult.message,
          intent: {
            type: searchResult.intent,
            confidence: 0.9,
          },
          data: searchResult.data,
          actions: searchResult.actions || [],
          isSearchResult: true,
        },
      });
    }

    // Try order tracking intent - handle "track order", order status, etc.
    const orderIntentResult = await orderIntentHandler.handle(message, { userId, merchantId });

    if (orderIntentResult && orderIntentResult.intent) {
      // Log order tracking event
      await services.logEvent('order.tracking', {
        userId,
        merchantId,
        intent: orderIntentResult.intent,
        orderId: orderIntentResult.orderId,
        found: orderIntentResult.found,
      });

      // Save to conversation history
      await Conversation.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            messages: {
              $each: [
                { role: 'user', content: message, intent: orderIntentResult.intent, confidence: 0.9, timestamp: new Date() },
                { role: 'assistant', content: orderIntentResult.message, intent: orderIntentResult.intent, confidence: 0.9, timestamp: new Date() },
              ],
              $slice: -100,
            },
          },
          $set: {
            userId: userId || undefined,
            merchantId: merchantId || undefined,
            'context.lastIntent': orderIntentResult.intent,
            'metadata.platform': req.headers['user-agent'] || 'api',
            'metadata.ipAddress': req.ip,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true, new: true }
      );

      return res.json({
        success: true,
        data: {
          response: orderIntentResult.message,
          intent: {
            type: orderIntentResult.intent,
            confidence: 0.9,
          },
          orderDetails: orderIntentResult.details || undefined,
          actions: orderIntentResult.actions || [],
          isOrderTracking: true,
        },
      });
    }

    // Detect intent
    const intentResult = detectIntent(message);
    const { intent, confidence } = intentResult;

    // Log intent detected event
    await logEvent('intent.detected', {
      sessionId,
      userId,
      merchantId,
      intent,
      confidence,
      messageLength: message.length,
    });

    // After processing chat message
    await logEvent('chat.message', {
      userId,
      merchantId,
      intent: intent,
      message: message
    });

    // Extract entities
    const entities = extractEntities(message, intent);

    // Get user profile if userId provided
    let userProfile = null;
    if (userId) {
      userProfile = await UserProfile.findOne({ userId }).lean();
    }

    // Get merchant info if merchantId provided
    let merchantInfo = null;
    if (merchantId) {
      merchantInfo = await Merchant.findOne({ merchantId, active: true }).lean();
    }

    // Get conversation history
    let conversation = await Conversation.findOne({ sessionId }).lean();
    const previousMessages = conversation?.messages || [];

    // Generate response
    const responseText = generateResponse(intent, entities, userProfile, merchantInfo);

    // Attempt AI enhancement if available
    let aiEnhanced = null;
    if (REZ_MIND_URL) {
      aiEnhanced = await processWithAI(message, {
        intent,
        entities,
        userProfile,
        merchantInfo,
        conversationHistory: previousMessages.slice(-5),
      });
    }

    // Final response (use AI enhanced if available)
    const finalResponse = aiEnhanced?.response || responseText;

    // Save to conversation history
    await Conversation.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', content: message, intent, confidence, timestamp: new Date() },
              { role: 'assistant', content: finalResponse, intent, confidence, timestamp: new Date() },
            ],
            $slice: -100, // Keep last 100 messages
          },
        },
        $set: {
          userId: userId || conversation?.userId,
          merchantId: merchantId || conversation?.merchantId,
          'context.lastIntent': intent,
          'context.lastEntities': entities,
          'metadata.platform': req.headers['user-agent'] || 'api',
          'metadata.ipAddress': req.ip,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Update user interaction count
    if (userId) {
      await UserProfile.findOneAndUpdate(
        { userId },
        {
          $inc: { interactionCount: 1 },
          $set: { lastInteraction: new Date() },
        },
        { upsert: true }
      );
    }

    // Log event
    await logEvent('chat_interaction', {
      sessionId,
      userId,
      merchantId,
      intent,
      confidence,
      messageLength: message.length,
    });

    res.json({
      success: true,
      data: {
        response: finalResponse,
        intent: {
          type: intent,
          confidence,
          entities,
        },
        suggestions: getSuggestionsForIntent(intent),
        context: {
          userId,
          merchantId,
          conversationId: sessionId,
        },
        aiEnhanced: !!aiEnhanced,
      },
    });
  } catch (error) {
    logger.error('Chat error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get contextual suggestions based on intent
 */
function getSuggestionsForIntent(intent) {
  const suggestions = {
    [IntentTypes.ORDER]: [
      'Show me the menu',
      'I want to see popular items',
      'Any special offers today?',
    ],
    [IntentTypes.BOOK]: [
      'Show available times',
      'Book for 2 people',
      'Any tables for tonight?',
    ],
    [IntentTypes.ENQUIRE]: [
      'What are your hours?',
      'Do you deliver?',
      'Show me the menu',
    ],
    [IntentTypes.COMPLAINT]: [
      'I want a refund',
      'Talk to a manager',
      'When will this be fixed?',
    ],
    [IntentTypes.GREETING]: [
      'Place an order',
      'Make a reservation',
      'Tell me about your restaurant',
    ],
    [IntentTypes.SEARCH]: [
      'Find Italian restaurants',
      'Search for pizza near me',
      'Show me Chinese food',
    ],
    [IntentTypes.USER_INFO]: [
      'Show my profile',
      'View my orders',
      'Check my preferences',
    ],
    [IntentTypes.UNKNOWN]: [
      'I want to order',
      'Book a table',
      'What time do you close?',
    ],
    // New intent suggestions
    [IntentTypes.PAYMENT]: [
      'I want a refund',
      'Payment failed',
      'Check my bill',
      'How much is the total?',
    ],
    [IntentTypes.DELIVERY]: [
      'Track my order',
      'Where is my delivery?',
      'How long will it take?',
      'Update delivery address',
    ],
    [IntentTypes.FEEDBACK]: [
      'Rate my experience',
      'Write a review',
      'Give feedback',
      'Rate the food',
    ],
    [IntentTypes.RESCHEDULE]: [
      'Change booking time',
      'Move to later',
      'Reschedule appointment',
      'Different time please',
    ],
    [IntentTypes.CANCEL]: [
      'Cancel my order',
      'Stop the booking',
      'Don\'t want it anymore',
      'Cancel reservation',
    ],
    [IntentTypes.DIETARY]: [
      'I am vegetarian',
      'Any vegan options?',
      'Gluten-free menu',
      'Food allergies',
    ],
    [IntentTypes.OPENING_HOURS]: [
      'What are your hours?',
      'When do you close?',
      'Open now?',
      'Tomorrow\'s timings',
    ],
    [IntentTypes.LOCATION]: [
      'What\'s your address?',
      'How to get there?',
      'Is parking available?',
      'Near me',
    ],
    [IntentTypes.CONTACT]: [
      'Call the restaurant',
      'Email support',
      'WhatsApp number',
      'Talk to someone',
    ],
    [IntentTypes.LOYALTY]: [
      'Check my points',
      'Redeem rewards',
      'Current offers',
      'Loyalty program',
    ],
    [IntentTypes.GIFT]: [
      'Buy gift card',
      'Gift packages',
      'Birthday surprise',
      'Anniversary deal',
    ],
  };

  return suggestions[intent] || suggestions[IntentTypes.UNKNOWN];
}

/**
 * POST /api/knowledge/search
 * Search knowledge base for relevant articles
 */
app.post('/api/knowledge/search', async (req, res) => {
  try {
    const { query, category, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required',
      });
    }

    // Try external knowledge base first
    const kbResults = await searchKnowledgeBase(query, { category });

    // If no results or KB unavailable, search local MongoDB
    let localResults = [];
    if (!kbResults.results || kbResults.results.length === 0) {
      // Search in merchant menus
      localResults = await Merchant.find({
        active: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { cuisine: { $regex: query, $options: 'i' } },
          { 'menu.items.name': { $regex: query, $options: 'i' } },
        ],
      })
        .select('merchantId name cuisine menu contact.address settings')
        .limit(limit)
        .lean();

      localResults = localResults.map(m => ({
        type: 'merchant',
        id: m.merchantId,
        title: m.name,
        excerpt: m.cuisine?.join(', ') || 'Restaurant',
        data: m,
      }));
    }

    const results = kbResults.results?.length > 0 ? kbResults.results : localResults;

    // Log search event
    await logEvent('knowledge_search', {
      query,
      category,
      resultsCount: results.length,
    });

    res.json({
      success: true,
      data: {
        results,
        query,
        total: results.length,
      },
    });
  } catch (error) {
    logger.error('Knowledge search error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/user/:userId
 * Get user profile and preferences
 */
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    let profile = await UserProfile.findOne({ userId }).lean();

    if (!profile) {
      // Create a new profile if doesn't exist
      profile = await UserProfile.create({
        userId,
        interactionCount: 0,
        preferences: {
          language: 'en',
          notificationEnabled: true,
        },
      });
    }

    // Get conversation count
    const conversationCount = await Conversation.countDocuments({ userId });

    // Get recent orders (from user profile)
    const recentOrders = profile.orderHistory?.slice(-5) || [];

    // Get support ticket count
    const ticketCount = await SupportTicket.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        userId: profile.userId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        preferences: profile.preferences,
        stats: {
          interactions: profile.interactionCount,
          conversations: conversationCount,
          orders: profile.orderHistory?.length || 0,
          tickets: ticketCount,
        },
        recentOrders,
        tags: profile.tags,
        lastInteraction: profile.lastInteraction,
        createdAt: profile.createdAt,
      },
    });
  } catch (error) {
    logger.error('User profile error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/user/:userId
 * Update user profile
 */
app.put('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const allowedUpdates = ['name', 'email', 'phone', 'preferences', 'tags'];
    const filteredUpdates = {};

    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    filteredUpdates.updatedAt = new Date();

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: filteredUpdates },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('User update error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/merchant/:merchantId
 * Get merchant information
 */
app.get('/api/merchant/:merchantId', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { includeMenu = 'true' } = req.query;

    let merchant = await Merchant.findOne({ merchantId }).lean();

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found',
      });
    }

    // Get rating/review summary if available
    const ticketCount = await SupportTicket.countDocuments({
      'metadata.merchantId': merchantId,
    });

    res.json({
      success: true,
      data: {
        merchantId: merchant.merchantId,
        name: merchant.name,
        type: merchant.type,
        cuisine: merchant.cuisine,
        contact: merchant.contact,
        hours: merchant.hours,
        settings: merchant.settings,
        menu: includeMenu === 'true' ? merchant.menu : undefined,
        active: merchant.active,
        supportTickets: ticketCount,
        createdAt: merchant.createdAt,
      },
    });
  } catch (error) {
    logger.error('Merchant lookup error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/merchants
 * List all merchants (with filters)
 */
app.get('/api/merchants', async (req, res) => {
  try {
    const {
      type,
      cuisine,
      delivery,
      active = 'true',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (cuisine) filter.cuisine = { $regex: cuisine, $options: 'i' };
    if (delivery === 'true') filter['settings.deliveryAvailable'] = true;
    filter.active = active === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [merchants, total] = await Promise.all([
      Merchant.find(filter)
        .select('merchantId name type cuisine contact.address settings')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Merchant.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        merchants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Merchant list error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/order
 * Create an order (calls REZ Order Service)
 */
app.post('/api/order', async (req, res) => {
  try {
    const {
      userId,
      merchantId,
      items,
      deliveryAddress,
      specialInstructions,
      paymentMethod = 'card',
    } = req.body;

    if (!userId || !merchantId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userId, merchantId, and items are required',
      });
    }

    // Verify merchant exists
    const merchant = await Merchant.findOne({ merchantId, active: true });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found or inactive',
      });
    }

    // Check minimum order
    const orderTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (orderTotal < (merchant.settings?.minOrderAmount || 0)) {
      return res.status(400).json({
        success: false,
        error: `Minimum order amount is ${merchant.settings.minOrderAmount}`,
      });
    }

    // Check inventory availability via order service integration
    const inventoryCheck = await orderServiceIntegration.checkInventory(
      items.map(item => ({ name: item.name, quantity: item.quantity })),
      merchantId
    );

    if (!inventoryCheck.available) {
      const unavailableItems = inventoryCheck.unavailableItems.map(i => i.name || i.itemName).join(', ');

      // Log inventory issue
      await logEvent('order.inventory_unavailable', {
        userId,
        merchantId,
        unavailableItems: inventoryCheck.unavailableItems,
      });

      // Get alternative suggestions
      const alternatives = await orderServiceIntegration.getAlternativeItems(
        inventoryCheck.unavailableItems,
        merchantId
      );

      return res.json({
        success: false,
        error: 'INVENTORY_UNAVAILABLE',
        message: `Some items are currently unavailable: ${unavailableItems}`,
        unavailableItems: inventoryCheck.unavailableItems,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
        suggestions: ['Try removing unavailable items', 'Search for alternatives', 'Check back later'],
      });
    }

    // Log low stock warnings if any
    const lowStockWarnings = [];
    for (const item of items) {
      const stockCheck = await orderServiceIntegration.checkItemStock(item.name, merchantId, item.quantity);
      if (stockCheck.lowStock) {
        lowStockWarnings.push({
          itemName: item.name,
          availableQuantity: stockCheck.quantity,
          requestedQuantity: item.quantity,
        });
      }
    }

    // Call REZ Order Service
    let orderResult;
    try {
      const response = await axios.post(`${REZ_ORDER_SERVICE_URL}/api/orders`, {
        userId,
        merchantId,
        items,
        deliveryAddress,
        specialInstructions,
        paymentMethod,
        source: 'support-copilot',
      }, { timeout: 10000 });
      orderResult = response.data;
    } catch (orderError) {
      // If order service is unavailable, create a pending order locally
      logger.warn('Order service unavailable, creating local order', {
        error: orderError.message,
      });
      orderResult = {
        success: true,
        data: {
          orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          userId,
          merchantId,
          items,
          total: orderTotal,
          deliveryAddress,
          createdAt: new Date().toISOString(),
        },
      };
    }

    // Update user order history
    await UserProfile.findOneAndUpdate(
      { userId },
      {
        $push: {
          orderHistory: {
            orderId: orderResult.data?.orderId,
            merchantId,
            items: items.map(i => i.name),
            total: orderTotal,
            date: new Date(),
          },
        },
      },
      { upsert: true }
    );

    // Log event
    await logEvent('order_created', {
      orderId: orderResult.data?.orderId,
      userId,
      merchantId,
      total: orderTotal,
      itemCount: items.length,
    });

    // After order created
    await logEvent('order.created', {
      orderId: orderResult.data?.orderId,
      userId,
      merchantId
    });

    // Notify order service of support interaction
    if (orderResult.data?.orderId) {
      await orderServiceIntegration.notifyOrderService(orderResult.data.orderId, 'order_created_from_support', {
        userId,
        merchantId,
        itemCount: items.length,
        total: orderTotal,
      });
    }

    res.json({
      success: true,
      data: orderResult.data,
      warnings: lowStockWarnings.length > 0 ? {
        lowStockItems: lowStockWarnings,
        message: 'Some items have limited stock available',
      } : undefined,
    });
  } catch (error) {
    logger.error('Order creation error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/booking
 * Create a booking/reservation
 */
app.post('/api/booking', async (req, res) => {
  try {
    const {
      userId,
      merchantId,
      date,
      time,
      guestCount,
      name,
      phone,
      email,
      specialRequests,
    } = req.body;

    if (!userId || !merchantId || !date || !time || !guestCount) {
      return res.status(400).json({
        success: false,
        error: 'userId, merchantId, date, time, and guestCount are required',
      });
    }

    // Verify merchant supports reservations
    const merchant = await Merchant.findOne({ merchantId, active: true });
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found or inactive',
      });
    }

    if (!merchant.settings?.reservationEnabled) {
      return res.status(400).json({
        success: false,
        error: 'This merchant does not accept reservations',
      });
    }

    // Call REZ Booking Service
    let bookingResult;
    try {
      const response = await axios.post(`${REZ_BOOKING_SERVICE_URL}/api/bookings`, {
        userId,
        merchantId,
        date,
        time,
        guestCount,
        name,
        phone,
        email,
        specialRequests,
        source: 'support-copilot',
      }, { timeout: 10000 });
      bookingResult = response.data;
    } catch (bookingError) {
      // If booking service is unavailable, create a pending booking locally
      logger.warn('Booking service unavailable, creating local booking', {
        error: bookingError.message,
      });
      bookingResult = {
        success: true,
        data: {
          bookingId: `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
          userId,
          merchantId,
          date,
          time,
          guestCount,
          createdAt: new Date().toISOString(),
        },
      };
    }

    // Log event
    await logEvent('booking_created', {
      bookingId: bookingResult.data?.bookingId,
      userId,
      merchantId,
      date,
      time,
      guestCount,
    });

    res.json({
      success: true,
      data: bookingResult.data,
    });
  } catch (error) {
    logger.error('Booking creation error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/merchant/:merchantId/feedback
 * Send feedback to merchant copilot when support ticket relates to merchant operations
 */
app.post('/api/merchant/:merchantId/feedback', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { ticketId, feedback, type } = req.body;

    if (!ticketId || !feedback || !type) {
      return res.status(400).json({
        success: false,
        error: 'ticketId, feedback, and type are required',
      });
    }

    const validTypes = ['complaint', 'suggestion', 'praise'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `type must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Send feedback to merchant copilot
    try {
      await axios.post(`${REZ_MERCHANT_COPILOT_URL}/api/merchant/${merchantId}/feedback`, {
        ticketId,
        feedback,
        type,
        source: 'support',
        timestamp: new Date().toISOString(),
      }, { timeout: 5000 });

      logger.info('Feedback sent to merchant copilot', { merchantId, ticketId, type });
    } catch (feedbackError) {
      // Log but don't fail - feedback is best-effort
      logger.warn('Feedback to merchant copilot failed', {
        error: feedbackError.message,
        merchantId,
        ticketId,
      });
    }

    // Log event
    await logEvent('merchant.feedback', {
      merchantId,
      ticketId,
      type,
      feedbackLength: feedback.length,
    });

    res.json({
      success: true,
      message: 'Feedback sent to merchant copilot',
    });
  } catch (error) {
    logger.error('Merchant feedback error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/conversation/:sessionId
 * Get conversation history
 */
app.get('/api/conversation/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    const conversation = await Conversation.findOne({ sessionId })
      .select('sessionId userId merchantId messages context metadata')
      .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    // Return only the last N messages
    const messages = conversation.messages.slice(-parseInt(limit));

    res.json({
      success: true,
      data: {
        sessionId: conversation.sessionId,
        userId: conversation.userId,
        merchantId: conversation.merchantId,
        messages,
        context: conversation.context,
        messageCount: conversation.messages.length,
      },
    });
  } catch (error) {
    logger.error('Conversation fetch error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/intent/detect
 * Detect intent from text (utility endpoint)
 */
app.post('/api/intent/detect', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required',
      });
    }

    const result = detectIntent(message);
    const entities = extractEntities(message, result.intent);

    res.json({
      success: true,
      data: {
        intent: result.intent,
        confidence: result.confidence,
        entities,
        scores: result.scores,
      },
    });
  } catch (error) {
    logger.error('Intent detection error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// EXISTING ROUTES (preserved)
// ============================================================

// Get agent dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalTickets, openTickets, resolvedToday, urgentTickets] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'resolved', updatedAt: { $gte: today } }),
      SupportTicket.countDocuments({ priority: 'urgent', status: { $ne: 'closed' } }),
    ]);

    // Get sentiment breakdown
    const sentimentStats = await SupportTicket.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]);

    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    sentimentStats.forEach(s => {
      if (s._id in sentimentBreakdown) sentimentBreakdown[s._id] = s.count;
    });

    // Get category breakdown
    const categoryStats = await SupportTicket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get intent breakdown from conversations
    const intentStats = await Conversation.aggregate([
      { $unwind: '$messages' },
      { $match: { 'messages.role': 'assistant' } },
      { $group: { _id: '$messages.intent', count: { $sum: 1 } } },
    ]);

    const intentBreakdown = {};
    intentStats.forEach(s => {
      if (s._id) intentBreakdown[s._id] = s.count;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalTickets,
          openTickets,
          resolvedToday,
          urgentTickets,
        },
        sentimentBreakdown,
        intentBreakdown,
        topCategories: categoryStats.map(c => ({ category: c._id, count: c.count })),
      }
    });
  } catch (error) {
    logger.error('Dashboard error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user support history
// PERFORMANCE FIX: Added pagination to user history endpoint
app.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    // PERFORMANCE FIX: Parse pagination params with bounds
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
    const offset = (page - 1) * limit;

    // PERFORMANCE FIX: Parallel query for tickets and stats
    const [tickets, totalCount, stats] = await Promise.all([
      SupportTicket.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .select('ticketId category priority status sentiment createdAt updatedAt'),
      SupportTicket.countDocuments({ userId }),
      SupportTicket.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            avgResolutionHours: { $avg: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 3600000] } },
          }
        }
      ])
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        tickets,
        stats: stats[0] || { totalTickets: 0, avgResolutionHours: 0 },
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error('User history error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get AI suggestions for a ticket
app.get('/ticket/:ticketId/suggestions', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const suggestions = [];

    // Based on user history
    if (ticket.userHistory.ticketsCreated > 3) {
      suggestions.push({
        type: 'escalate',
        suggestion: 'This user has created multiple tickets. Consider escalating for VIP handling.',
        confidence: 0.85,
      });
    }

    // Based on sentiment
    if (ticket.sentiment === 'negative') {
      suggestions.push({
        type: 'priority',
        suggestion: 'Negative sentiment detected. Prioritize this ticket for faster resolution.',
        confidence: 0.90,
      });
    }

    // Based on priority
    if (ticket.priority === 'urgent') {
      suggestions.push({
        type: 'urgent',
        suggestion: 'Urgent ticket. Assign to senior agent immediately.',
        confidence: 0.95,
      });
    }

    // Based on category
    const categoryResponses = {
      payment: 'Payment issues typically require 1-2 hours for resolution. Check payment gateway logs.',
      order: 'Order issues require verification with order service. Check order status first.',
      technical: 'Technical issues may require engineering support. Escalate if not resolved in 4 hours.',
      account: 'Account issues often relate to auth service. Check user status and permissions.',
    };

    if (categoryResponses[ticket.category]) {
      suggestions.push({
        type: 'category',
        suggestion: categoryResponses[ticket.category],
        confidence: 0.75,
      });
    }

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    logger.error('Suggestions error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create/update support ticket (webhook endpoint)
app.post('/webhook/ticket', async (req, res) => {
  try {
    const { ticket_id, user_id, category, priority, content } = req.body;

    if (!ticket_id || !user_id) {
      return res.status(400).json({ success: false, error: 'ticket_id and user_id required' });
    }

    // Search knowledge base before creating ticket - suggest resolutions from FAQ
    let kbSuggestions = [];
    let resolvedFromKB = false;
    if (content) {
      try {
        const kbResults = await searchKnowledgeBase(content, { category });
        // Filter for FAQ/resolution type articles with high confidence
        kbSuggestions = (kbResults.results || []).filter(r =>
          r.type === 'faq' || r.category === 'faq' || r.confidence > 0.7
        ).slice(0, 3);

        // If we found high-confidence KB matches, return suggestions instead of creating ticket
        if (kbSuggestions.length > 0 && kbResults.confidence > 0.8) {
          resolvedFromKB = true;
          await logEvent('ticket.auto_resolved', {
            ticket_id,
            user_id,
            kb_match: kbSuggestions[0].title,
            confidence: kbResults.confidence,
          });

          return res.json({
            success: true,
            auto_resolved: true,
            message: 'Your issue may be resolved by our FAQ',
            suggestions: kbSuggestions.map(s => ({
              title: s.title,
              excerpt: s.excerpt || s.content?.substring(0, 200),
              confidence: s.confidence,
            })),
            ticket_id,
          });
        }
      } catch (kbError) {
        logger.warn('Knowledge base search failed during ticket creation', { error: kbError.message });
      }
    }

    // Check if ticket exists
    let ticket = await SupportTicket.findOne({ ticketId: ticket_id });

    if (ticket) {
      // Update existing ticket
      if (content) {
        ticket.messages.push({
          senderId: user_id,
          senderType: 'user',
          content,
          timestamp: new Date(),
        });

        // Update sentiment based on latest message
        ticket.sentiment = analyzeSentiment(content);
      }
      ticket.updatedAt = new Date();
      await ticket.save();
    } else {
      // Create new ticket
      const sentiment = content ? analyzeSentiment(content) : 'neutral';

      ticket = new SupportTicket({
        ticketId: ticket_id,
        userId: user_id,
        category: category || 'general',
        priority: priority || 'medium',
        sentiment,
        messages: content ? [{
          senderId: user_id,
          senderType: 'user',
          content,
          timestamp: new Date(),
        }] : [],
      });
      await ticket.save();

      // Update user history
      await SupportTicket.updateOne(
        { userId: user_id },
        { $inc: { 'userHistory.ticketsCreated': 1 } }
      );
    }

    // Also send to Event Platform
    try {
      await axios.post(`${REZ_EVENT_PLATFORM_URL}/webhook/support/ticket`, {
        ticket_id,
        user_id,
        category,
        priority,
        source: 'support_copilot',
      }, { timeout: 3000 });
    } catch (e) {
      logger.warn('Failed to send to REZ Event Platform', { error: e.message });
    }

    res.json({
      success: true,
      ticket_id,
      sentiment: ticket.sentiment,
      kb_suggestions: kbSuggestions.length > 0 ? kbSuggestions.map(s => ({
        title: s.title,
        excerpt: s.excerpt || s.content?.substring(0, 200),
      })) : undefined,
    });
  } catch (error) {
    logger.error('Webhook error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update ticket status
app.patch('/ticket/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, priority, sentiment, resolution_note } = req.body;

    const update = { updatedAt: new Date() };
    if (status) update.status = status;
    if (priority) update.priority = priority;
    if (sentiment) update.sentiment = sentiment;

    const ticket = await SupportTicket.findOneAndUpdate(
      { ticketId },
      { $set: update },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    logger.error('Update ticket error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get analytics
app.get('/analytics', async (req, res) => {
  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [dailyStats, categoryStats, sentimentTrend] = await Promise.all([
      // Daily stats
      SupportTicket.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Category breakdown
      SupportTicket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),

      // Sentiment trend
      SupportTicket.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ]),
    ]);

    // Get intent breakdown
    const intentTrend = await Conversation.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { $unwind: '$messages' },
      { $match: { 'messages.role': 'assistant' } },
      { $group: { _id: '$messages.intent', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        dailyTrend: dailyStats.map(d => ({ date: d._id, total: d.total, resolved: d.resolved })),
        categories: categoryStats.map(c => ({ category: c._id, count: c.count })),
        sentimentTrend: sentimentTrend.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, { positive: 0, neutral: 0, negative: 0 }),
        intentTrend: intentTrend.reduce((acc, i) => {
          if (i._id) acc[i._id] = i.count;
          return acc;
        }, { ORDER: 0, BOOK: 0, ENQUIRE: 0, COMPLAINT: 0, GREETING: 0, UNKNOWN: 0, PAYMENT: 0, DELIVERY: 0, FEEDBACK: 0, RESCHEDULE: 0, CANCEL: 0, DIETARY: 0, OPENING_HOURS: 0, LOCATION: 0, CONTACT: 0, LOYALTY: 0, GIFT: 0 }),
      }
    });
  } catch (error) {
    logger.error('Analytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// STARTUP
// ============================================================

async function start() {
  try {
    logger.info('Starting REZ Support Copilot v1.1.0...');
    logger.info('Connecting to MongoDB...', { uri: MONGODB_URI });

    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');

    logger.info('External services configuration:', {
      REZ_MIND_URL,
      REZ_EVENT_PLATFORM_URL,
      KNOWLEDGE_BASE_URL,
      REZ_ORDER_SERVICE_URL,
      REZ_BOOKING_SERVICE_URL,
    });

    app.listen(PORT, () => {
      logger.info(`REZ Support Copilot running on port ${PORT}`);
      logger.info('Available endpoints:', {
        chat: `POST /api/chat`,
        knowledge: `POST /api/knowledge/search`,
        user: `GET /api/user/:userId`,
        merchant: `GET /api/merchant/:merchantId`,
        merchants: `GET /api/merchants`,
        order: `POST /api/order`,
        booking: `POST /api/booking`,
        conversation: `GET /api/conversation/:sessionId`,
        intent: `POST /api/intent/detect`,
        dashboard: `GET /dashboard`,
        analytics: `GET /analytics`,
        webhooks: {
          orderCreated: `POST /webhooks/order/created`,
          orderStatus: `POST /webhooks/order/status`,
          orderIssue: `POST /webhooks/order/issue`,
          orderRefund: `POST /webhooks/order/refund`,
        },
      });
    });
  } catch (error) {
    logger.error('Startup failed', { error: error.message });
    process.exit(1);
  }
}

start();
