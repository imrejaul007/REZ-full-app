/**
 * User Intelligence Model - Derived Signals (Not Raw Data)
 * Follows: Intelligence ≠ Events
 */

import mongoose from 'mongoose';

const userIntelligenceSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true, index: true },

  // DERIVED PREFERENCES (not raw data)
  preferences: {
    food: [String],           // ['biryani', 'pizza']
    categories: [String],     // ['spa', 'fitness']
    price_range: String,      // 'budget' | 'medium' | 'premium'
    dietary: [String],        // ['veg', 'non-veg']
    time_pattern: String,     // 'evening' | 'afternoon' | 'morning'
  },

  // BEHAVIOR PATTERNS (derived, not raw logs)
  behavior: {
    avg_spend: Number,
    frequency: String,        // 'daily' | 'weekly' | 'monthly'
    time_pattern: String,     // 'evening' | 'afternoon'
    preferred_channel: String, // 'app' | 'web' | 'qr'
  },

  // CURRENT INTENT (real-time signal)
  intent: {
    current: String,          // 'looking_for_dinner'
    confidence: Number,       // 0-1
    last_updated: Date,
  },

  // SEGMENTS (categorical, not raw data)
  segments: [String],         // ['foodies', 'deal_seekers', 'vip']

  // SCORES (normalized 0-1 or specific ranges)
  scores: {
    ltv: Number,             // Lifetime value
    churn_risk: Number,      // 0-1, higher = more risk
    engagement: Number,       // 0-1
    purchase_probability: Number, // 0-1
  },

  // LOCATION CONTEXT
  location_context: {
    current_city: String,
    home_area: String,
    work_area: String,
  },

  // CONSENT (privacy)
  consent: {
    personalization: { type: Boolean, default: true },
    ads: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
  },

  last_updated: { type: Date, default: Date.now },
}, {
  collection: 'user_intelligence',
  timestamps: true
});

// Index for fast lookups
userIntelligenceSchema.index({ 'segments': 1 });
userIntelligenceSchema.index({ 'scores.churn_risk': -1 });
userIntelligenceSchema.index({ 'scores.ltv': -1 });

export const UserIntelligence = mongoose.models.UserIntelligence ||
  mongoose.model('UserIntelligence', userIntelligenceSchema);
