/**
 * REZ Support Copilot - Complete Testing & Monitoring System
 *
 * Features:
 * - Real-time intent testing
 * - Feedback collection
 * - Auto-training from corrections
 * - Accuracy dashboard
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIG
// ============================================
const CONFIG = {
  autoRetrain: true,
  retrainThreshold: 10, // Retrain after 10 corrections
  accuracyAlertThreshold: 70, // Alert if accuracy drops below 70%
  feedbackFile: 'feedback-data.json',
  correctionsFile: 'training-data/user-corrections.json',
  intentsFile: 'training-data/intent-training-data.json'
};

// ============================================
// DATA STORES
// ============================================

// Load or init feedback data
function loadFeedback() {
  const file = CONFIG.feedbackFile;
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file));
  }
  return {
    sessions: [],
    corrections: [],
    metrics: {
      total: 0,
      correct: 0,
      intents: {}
    }
  };
}

// Save feedback
function saveFeedback(data) {
  fs.writeFileSync(CONFIG.feedbackFile, JSON.stringify(data, null, 2));
}

// ============================================
// INTENT TESTING
// ============================================

const intents = {
  ORDER: ['order', 'want', 'need', 'get', 'buy', 'deliver'],
  BOOK: ['book', 'reserve', 'reservation', 'table', 'slot', 'appointment'],
  SEARCH: ['find', 'search', 'look', 'show', 'places', 'options'],
  CANCEL: ['cancel', 'stop', 'abort', "don't want", 'remove'],
  COMPLAINT: ['bad', 'wrong', 'issue', 'problem', 'cold', 'late'],
  PAYMENT: ['pay', 'refund', 'money', 'price', 'bill', 'charged'],
  DELIVERY: ['where', 'track', 'ETA', 'arrive', 'delivery'],
  FEEDBACK: ['rating', 'review', 'stars', 'experience', 'feedback'],
  DIETARY: ['vegetarian', 'vegan', 'halal', 'jain', 'allergy'],
  OPENING_HOURS: ['open', 'closed', 'timing', 'hours', 'when'],
  LOCATION: ['address', 'where', 'map', 'direction', 'parking'],
  CONTACT: ['call', 'phone', 'email', 'whatsapp', 'manager'],
  LOYALTY: ['points', 'rewards', 'redeem', 'cashback'],
  GIFT: ['gift', 'voucher', 'present', 'birthday', 'surprise'],
  RESCHEDULE: ['reschedule', 'change', 'postpone', 'move', 'different']
};

// Detect intent
function detectIntent(text) {
  const lower = text.toLowerCase();
  const scores = {};

  Object.entries(intents).forEach(([intent, keywords]) => {
    scores[intent] = 0;
    keywords.forEach(keyword => {
      if (lower.includes(keyword)) scores[intent]++;
    });
  });

  let bestIntent = 'UNKNOWN';
  let bestScore = 0;
  Object.entries(scores).forEach(([intent, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent;
    }
  });

  return {
    intent: bestScore > 0 ? bestIntent : 'UNKNOWN',
    confidence: bestScore > 0 ? Math.min(0.5 + bestScore * 0.15, 0.98) : 0.3,
    scores
  };
}

// ============================================
// REAL USER SIMULATION
// ============================================

const realUserInputs = [
  // ORDER
  { input: "biryani order karo", expected: "ORDER" },
  { input: "I want biryani for dinner", expected: "ORDER" },
  { input: "get me pizza", expected: "ORDER" },
  { input: "need food delivered", expected: "ORDER" },
  { input: "order noodles for pickup", expected: "ORDER" },

  // BOOK
  { input: "book a table for 4", expected: "BOOK" },
  { input: "reserve slot at 7pm", expected: "BOOK" },
  { input: "I want to book appointment", expected: "BOOK" },
  { input: "make a reservation for 2", expected: "BOOK" },
  { input: "book hair appointment tomorrow", expected: "BOOK" },

  // SEARCH
  { input: "find chinese restaurants", expected: "SEARCH" },
  { input: "show me biryani places", expected: "SEARCH" },
  { input: "look for pizza near me", expected: "SEARCH" },
  { input: "search for vegan options", expected: "SEARCH" },
  { input: "what restaurants deliver here", expected: "SEARCH" },

  // CANCEL
  { input: "cancel my order", expected: "CANCEL" },
  { input: "don't want anymore", expected: "CANCEL" },
  { input: "stop the delivery", expected: "CANCEL" },
  { input: "abort the booking", expected: "CANCEL" },
  { input: "remove this from order", expected: "CANCEL" },

  // COMPLAINT
  { input: "food was cold", expected: "COMPLAINT" },
  { input: "wrong item delivered", expected: "COMPLAINT" },
  { input: "very bad experience", expected: "COMPLAINT" },
  { input: "late by 2 hours", expected: "COMPLAINT" },
  { input: "missing items in order", expected: "COMPLAINT" },

  // PAYMENT
  { input: "pay via UPI", expected: "PAYMENT" },
  { input: "refund my money", expected: "PAYMENT" },
  { input: "how much to pay", expected: "PAYMENT" },
  { input: "charged twice", expected: "PAYMENT" },
  { input: "payment failed", expected: "PAYMENT" },

  // DELIVERY
  { input: "where is my order", expected: "DELIVERY" },
  { input: "track delivery", expected: "DELIVERY" },
  { input: "when will food arrive", expected: "DELIVERY" },
  { input: "delivery ETA", expected: "DELIVERY" },
  { input: "driver location", expected: "DELIVERY" },

  // FEEDBACK
  { input: "give 5 stars", expected: "FEEDBACK" },
  { input: "rate your service", expected: "FEEDBACK" },
  { input: "share feedback", expected: "FEEDBACK" },
  { input: "how was experience", expected: "FEEDBACK" },
  { input: "write review", expected: "FEEDBACK" },

  // DIETARY
  { input: "I am vegetarian", expected: "DIETARY" },
  { input: "vegan options please", expected: "DIETARY" },
  { input: "no onion garlic jain food", expected: "DIETARY" },
  { input: "halal certified only", expected: "DIETARY" },
  { input: "allergic to nuts", expected: "DIETARY" },

  // OPENING_HOURS
  { input: "what time do you open", expected: "OPENING_HOURS" },
  { input: "are you open now", expected: "OPENING_HOURS" },
  { input: "closing time", expected: "OPENING_HOURS" },
  { input: "late night open", expected: "OPENING_HOURS" },
  { input: "24 hours", expected: "OPENING_HOURS" },

  // LOCATION
  { input: "your address", expected: "LOCATION" },
  { input: "where are you located", expected: "LOCATION" },
  { input: "google maps link", expected: "LOCATION" },
  { input: "parking available", expected: "LOCATION" },
  { input: "landmark nearby", expected: "LOCATION" },

  // CONTACT
  { input: "call the restaurant", expected: "CONTACT" },
  { input: "manager phone number", expected: "CONTACT" },
  { input: "email support", expected: "CONTACT" },
  { input: "whatsapp number", expected: "CONTACT" },
  { input: "talk to someone", expected: "CONTACT" },

  // LOYALTY
  { input: "use my points", expected: "LOYALTY" },
  { input: "redeem rewards", expected: "LOYALTY" },
  { input: "how many points I have", expected: "LOYALTY" },
  { input: "cashback balance", expected: "LOYALTY" },
  { input: "loyalty points worth", expected: "LOYALTY" },

  // GIFT
  { input: "buy gift card", expected: "GIFT" },
  { input: "send surprise to friend", expected: "GIFT" },
  { input: "birthday present delivery", expected: "GIFT" },
  { input: "voucher for anniversary", expected: "GIFT" },
  { input: "corporate gift options", expected: "GIFT" },

  // RESCHEDULE
  { input: "change booking time", expected: "RESCHEDULE" },
  { input: "move to tomorrow", expected: "RESCHEDULE" },
  { input: "postpone appointment", expected: "RESCHEDULE" },
  { input: "different time slot", expected: "RESCHEDULE" },
  { input: "reschedule for weekend", expected: "RESCHEDULE" }
];

// ============================================
// RUN TESTS
// ============================================

function runTests() {
  console.log('\n' + '═'.repeat(60));
  console.log('  REZ SUPPORT COPILOT - REAL USER TESTING');
  console.log('═'.repeat(60) + '\n');

  const feedback = loadFeedback();
  let passed = 0;
  let failed = 0;
  const results = [];

  realUserInputs.forEach(({ input, expected }) => {
    const result = detectIntent(input);
    const correct = result.intent === expected;

    if (correct) {
      passed++;
      console.log(`✅ "${input}" → ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`);
    } else {
      failed++;
      console.log(`❌ "${input}" → Expected: ${expected}, Got: ${result.intent}`);

      // Auto-collect correction
      if (CONFIG.autoRetrain) {
        feedback.corrections.push({
          input,
          expected,
          detected: result.intent,
          timestamp: new Date().toISOString()
        });
      }
    }

    results.push({ input, expected, detected: result.intent, correct });

    // Update metrics
    feedback.metrics.total++;
    if (correct) {
      feedback.metrics.correct++;
      feedback.metrics.intents[result.intent] = (feedback.metrics.intents[result.intent] || 0) + 1;
    }
  });

  // Save feedback
  saveFeedback(feedback);

  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 RESULTS: ${passed}/${realUserInputs.length} passed (${((passed/realUserInputs.length)*100).toFixed(1)}% accuracy)\n`);

  if (failed > 0) {
    console.log('❌ FAILED:\n');
    results.filter(r => !r.correct).forEach(r => {
      console.log(`   "${r.input}" → Expected: ${r.expected}, Got: ${r.detected}`);
    });
  }

  // Intent breakdown
  console.log('\n📈 INTENT BREAKDOWN:\n');
  const intentCounts = {};
  results.forEach(r => {
    intentCounts[r.expected] = (intentCounts[r.expected] || 0) + 1;
  });
  Object.entries(intentCounts).forEach(([intent, count]) => {
    console.log(`   ${intent.padEnd(15)} ${count} tests`);
  });

  // Auto-training check
  if (CONFIG.autoRetrain && feedback.corrections.length >= CONFIG.retrainThreshold) {
    console.log('\n🔄 RETRAINING TRIGGERED\n');
    autoRetrain(feedback.corrections);
  }

  return { passed, failed, accuracy: (passed/realUserInputs.length)*100 };
}

// ============================================
// AUTO-TRAINING
// ============================================

function autoRetrain(corrections) {
  console.log('📝 Adding corrections to training data...\n');

  corrections.forEach(correction => {
    console.log(`   + "${correction.input}" → ${correction.expected}`);
    // In real system, this would update the training files
  });

  // Save corrections
  const correctionsFile = CONFIG.correctionsFile;
  let existingCorrections = [];
  if (fs.existsSync(correctionsFile)) {
    existingCorrections = JSON.parse(fs.readFileSync(correctionsFile));
  }

  existingCorrections.push(...corrections);
  fs.writeFileSync(correctionsFile, JSON.stringify(existingCorrections, null, 2));

  console.log(`\n✅ Added ${corrections.length} corrections to training data`);
}

// ============================================
// DASHBOARD
// ============================================

function showDashboard() {
  const feedback = loadFeedback();

  console.log('\n' + '═'.repeat(60));
  console.log('  FEEDBACK DASHBOARD');
  console.log('═'.repeat(60));

  const accuracy = feedback.metrics.total > 0
    ? (feedback.metrics.correct / feedback.metrics.total * 100).toFixed(1)
    : 'N/A';

  console.log(`
  📊 OVERVIEW
  ─────────────────────────────────────
  Total Tests:      ${feedback.metrics.total}
  Correct:         ${feedback.metrics.correct}
  Accuracy:        ${accuracy}%

  🎯 INTENT BREAKDOWN
  ─────────────────────────────────────`);

  Object.entries(feedback.metrics.intents)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([intent, count]) => {
      console.log(`  ${intent.padEnd(15)} ${count} interactions`);
    });

  console.log(`
  📝 RECENT CORRECTIONS
  ─────────────────────────────────────`);

  feedback.corrections
    .slice(-5)
    .reverse()
    .forEach(c => {
      console.log(`  "${c.input}" → ${c.expected}`);
    });

  console.log('\n' + '═'.repeat(60) + '\n');
}

// ============================================
// RUN
// ============================================

const args = process.argv[2];

if (args === '--dashboard') {
  showDashboard();
} else {
  runTests();
}

module.exports = { detectIntent, runTests, showDashboard };
