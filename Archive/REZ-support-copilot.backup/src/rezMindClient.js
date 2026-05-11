/**
 * ReZ Mind Client
 * Get all intelligence from ReZ Mind
 */

const axios = require('axios');

// ReZ Mind URL
const REZ_MIND_URL = process.env.REZ_MIND_URL || 'https://rez-intent-graph.onrender.com';

/**
 * Get all training data from ReZ Mind
 */
async function getTrainingData() {
  try {
    const response = await axios.get(`${REZ_MIND_URL}/api/training-data`);
    return response.data;
  } catch (error) {
    console.error('Failed to get training data:', error.message);
    return getDefaultTrainingData();
  }
}

/**
 * Detect intent using ReZ Mind
 */
async function detectIntent(text) {
  try {
    const response = await axios.post(`${REZ_MIND_URL}/api/intent/detect`, { text });
    return response.data;
  } catch (error) {
    console.error('Intent detection failed:', error.message);
    return detectIntentLocal(text);
  }
}

/**
 * Local fallback intent detection
 */
const INTENT_PATTERNS = {
  ORDER_FOOD: { patterns: ['order food', 'order biryani', 'pizza bhejo', 'kuch khana'], priority: 2 },
  BOOK_TABLE: { patterns: ['book table', 'reserve table', 'table for'], priority: 2 },
  CANCEL_ORDER: { patterns: ['cancel', 'band karo', 'nahi chahiye', 'stop'], priority: 1 },
  COMPLAINT: { patterns: ['bad', 'cold', 'wrong', 'issue', 'problem'], priority: 1 },
  REFUND: { patterns: ['refund', 'money back', 'refund chahiye'], priority: 1 },
  CHECK_STATUS: { patterns: ['where is', 'track', 'kahan hai', 'order status'], priority: 1 },
  GREETING: { patterns: ['hi', 'hello', 'hey', 'namaste'], priority: 5 },
};

function detectIntentLocal(text) {
  const lower = text.toLowerCase();
  let bestIntent = 'UNKNOWN';
  let bestScore = 0;

  Object.entries(INTENT_PATTERNS).forEach(([intent, config]) => {
    let score = 0;
    config.patterns.forEach(pattern => {
      if (lower.includes(pattern)) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  });

  return {
    intent: bestIntent,
    confidence: bestScore > 0 ? 0.7 : 0.3,
    source: 'local'
  };
}

/**
 * Capture intent to ReZ Mind
 */
async function captureIntent(data) {
  try {
    await axios.post(`${REZ_MIND_URL}/api/intent/capture`, {
      ...data,
      source: 'support_copilot',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to capture intent:', error.message);
  }
}

/**
 * Create complaint
 */
async function createComplaint(data) {
  try {
    const response = await axios.post(`${REZ_MIND_URL}/api/complaint`, {
      ...data,
      source: 'support_copilot'
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create complaint:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Request refund
 */
async function requestRefund(data) {
  try {
    const response = await axios.post(`${REZ_MIND_URL}/api/refund`, {
      ...data,
      source: 'support_copilot'
    });
    return response.data;
  } catch (error) {
    console.error('Failed to request refund:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get user profile
 */
async function getUserProfile(userId) {
  try {
    const response = await axios.get(`${REZ_MIND_URL}/api/user/${userId}/profile`);
    return response.data;
  } catch (error) {
    console.error('Failed to get profile:', error.message);
    return null;
  }
}

/**
 * Sync user profile
 */
async function syncUserProfile(userId, profile) {
  try {
    await axios.post(`${REZ_MIND_URL}/api/user/${userId}/profile`, {
      ...profile,
      source: 'support_copilot'
    });
    return true;
  } catch (error) {
    console.error('Failed to sync profile:', error.message);
    return false;
  }
}

/**
 * Default training data fallback
 */
function getDefaultTrainingData() {
  return {
    intents: Object.keys(INTENT_PATTERNS),
    patterns: INTENT_PATTERNS,
    version: '1.0.0',
    source: 'local_fallback'
  };
}

module.exports = {
  REZ_MIND_URL,
  getTrainingData,
  detectIntent,
  detectIntentLocal,
  captureIntent,
  createComplaint,
  requestRefund,
  getUserProfile,
  syncUserProfile,
  getDefaultTrainingData
};
