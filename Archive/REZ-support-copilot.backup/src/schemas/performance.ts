/**
 * PERFORMANCE OPTIMIZED SCHEMAS
 * - Added compound indexes for common query patterns
 * - Added TTL indexes for automatic data expiration
 * - Optimized field indexing for dashboard and analytics queries
 */

import mongoose from 'mongoose';

// ============================================================
// SUPPORT TICKET SCHEMA - PERFORMANCE OPTIMIZED
// ============================================================

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral', index: true },
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
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// PERFORMANCE FIX: Compound indexes for common query patterns
supportTicketSchema.index({ status: 1, priority: 1 }); // Dashboard queries
supportTicketSchema.index({ userId: 1, createdAt: -1 }); // User history queries
supportTicketSchema.index({ category: 1, status: 1 }); // Category filtering
supportTicketSchema.index({ sentiment: 1, createdAt: -1 }); // Sentiment analytics
supportTicketSchema.index({ 'messages.timestamp': -1 }); // Message timeline queries
// TTL index: auto-delete old resolved tickets after 90 days
supportTicketSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, partialFilterExpression: { status: 'resolved' } }
);

export const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);

// ============================================================
// CONVERSATION HISTORY SCHEMA - PERFORMANCE OPTIMIZED
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
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// PERFORMANCE FIX: Compound indexes for conversation queries
conversationSchema.index({ userId: 1, updatedAt: -1 }); // User conversation history
conversationSchema.index({ merchantId: 1, createdAt: -1 }); // Merchant conversations
conversationSchema.index({ 'context.lastIntent': 1 }); // Intent-based queries
conversationSchema.index({ 'messages.intent': 1, 'messages.timestamp': -1 }); // Intent analytics
// TTL index: auto-delete conversations after 30 days of inactivity
conversationSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 }
);

export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

// ============================================================
// USER PROFILE SCHEMA - PERFORMANCE OPTIMIZED
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
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
});

// PERFORMANCE FIX: Indexes for user profile queries
userProfileSchema.index({ lastInteraction: -1 }); // Find recently active users
userProfileSchema.index({ interactionCount: -1 }); // Top users by interactions
userProfileSchema.index({ 'preferences.language': 1 }); // Filter by language preference
userProfileSchema.index({ tags: 1 }); // Tag-based queries

export const UserProfile = mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);

// ============================================================
// MERCHANT SCHEMA - PERFORMANCE OPTIMIZED
// ============================================================

const merchantSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  type: { type: String, enum: ['restaurant', 'cafe', 'bakery', 'bar', 'food_truck', 'catering'], default: 'restaurant', index: true },
  cuisine: [{ type: String, index: true }],
  contact: {
    phone: String,
    email: String,
    address: String,
    city: { type: String, index: true },
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
  active: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
});

// PERFORMANCE FIX: Compound indexes for merchant queries
merchantSchema.index({ active: 1, type: 1 }); // Active merchants by type
merchantSchema.index({ active: 1, 'contact.city': 1 }); // Merchants by city
merchantSchema.index({ 'contact.coordinates': '2dsphere' }); // Geospatial queries
merchantSchema.index({ cuisine: 1, active: 1 }); // Cuisine filtering

export const Merchant = mongoose.models.Merchant || mongoose.model('Merchant', merchantSchema);

// ============================================================
// SUPPORT ANALYTICS SCHEMA - PERFORMANCE OPTIMIZED
// ============================================================

const supportAnalyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, index: true },
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

// PERFORMANCE FIX: Unique index on date for upsert operations
supportAnalyticsSchema.index({ date: 1 }, { unique: true });
// TTL index: auto-delete analytics older than 1 year
supportAnalyticsSchema.index(
  { date: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 }
);

export const SupportAnalytics = mongoose.models.SupportAnalytics || mongoose.model('SupportAnalytics', supportAnalyticsSchema);

// Export all schemas
export default {
  SupportTicket,
  Conversation,
  UserProfile,
  Merchant,
  SupportAnalytics,
};
