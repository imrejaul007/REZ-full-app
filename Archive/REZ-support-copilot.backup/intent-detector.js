/**
 * Improved Intent Detection with Priority-based Matching
 */

const fs = require('fs');
const path = require('path');

// Load improved patterns
const patterns = require('./training-data/improved-patterns.json');

// Intent detection with priority
function detectIntent(text) {
  const lower = text.toLowerCase();
  const scores = {};

  // Calculate scores with priority weighting
  Object.entries(patterns.improved_intents).forEach(([intent, config]) => {
    let score = 0;
    const intentPatterns = config.patterns || [];
    const weight = config.weight || 1;
    const priority = config.priority || 5;

    intentPatterns.forEach(pattern => {
      if (lower.includes(pattern.toLowerCase())) {
        score += weight;
      }
    });

    scores[intent] = {
      score,
      priority,
      weightedScore: score * (11 - priority) // Higher priority = higher multiplier
    };
  });

  // Sort by weighted score
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1].weightedScore - a[1].weightedScore);

  const best = sorted[0];

  if (!best || best[1].score === 0) {
    return { intent: 'UNKNOWN', confidence: 0.3 };
  }

  return {
    intent: best[0],
    confidence: Math.min(0.5 + best[1].score * 0.1, 0.98),
    allScores: scores
  };
}

// Test with improved patterns
const tests = [
  // CANCEL - Priority 1
  { input: "cancel my order", expected: "CANCEL" },
  { input: "don't want anymore", expected: "CANCEL" },
  { input: "stop the delivery", expected: "CANCEL" },
  { input: "abort the booking", expected: "CANCEL" },
  { input: "remove this from order", expected: "CANCEL" },

  // COMPLAINT - Priority 1
  { input: "food was cold", expected: "COMPLAINT" },
  { input: "wrong item delivered", expected: "COMPLAINT" },
  { input: "bad experience", expected: "COMPLAINT" },
  { input: "missing items", expected: "COMPLAINT" },
  { input: "late by 2 hours", expected: "COMPLAINT" },

  // DELIVERY - Priority 1
  { input: "where is my order", expected: "DELIVERY" },
  { input: "track delivery", expected: "DELIVERY" },
  { input: "when will food arrive", expected: "DELIVERY" },
  { input: "delivery ETA", expected: "DELIVERY" },
  { input: "driver location", expected: "DELIVERY" },

  // FEEDBACK - Priority 1
  { input: "give 5 stars", expected: "FEEDBACK" },
  { input: "rate your service", expected: "FEEDBACK" },
  { input: "share feedback", expected: "FEEDBACK" },
  { input: "write a review", expected: "FEEDBACK" },
  { input: "how was experience", expected: "FEEDBACK" },

  // PAYMENT - Priority 1
  { input: "pay via UPI", expected: "PAYMENT" },
  { input: "refund my money", expected: "PAYMENT" },
  { input: "charged twice", expected: "PAYMENT" },
  { input: "payment failed", expected: "PAYMENT" },
  { input: "how much to pay", expected: "PAYMENT" },

  // DIETARY - Priority 1
  { input: "I am vegetarian", expected: "DIETARY" },
  { input: "vegan options please", expected: "DIETARY" },
  { input: "no onion garlic", expected: "DIETARY" },
  { input: "halal certified", expected: "DIETARY" },
  { input: "allergic to nuts", expected: "DIETARY" },

  // LOYALTY - Priority 1
  { input: "use my points", expected: "LOYALTY" },
  { input: "redeem rewards", expected: "LOYALTY" },
  { input: "how many points", expected: "LOYALTY" },
  { input: "cashback balance", expected: "LOYALTY" },
  { input: "loyalty tier benefits", expected: "LOYALTY" },

  // GIFT - Priority 1
  { input: "buy gift card", expected: "GIFT" },
  { input: "send surprise to friend", expected: "GIFT" },
  { input: "birthday present", expected: "GIFT" },
  { input: "voucher for anniversary", expected: "GIFT" },
  { input: "corporate gift options", expected: "GIFT" },

  // OPENING_HOURS - Priority 1
  { input: "what time do you open", expected: "OPENING_HOURS" },
  { input: "are you open now", expected: "OPENING_HOURS" },
  { input: "closing time", expected: "OPENING_HOURS" },
  { input: "late night open", expected: "OPENING_HOURS" },
  { input: "service hours", expected: "OPENING_HOURS" },

  // LOCATION - Priority 1
  { input: "your address", expected: "LOCATION" },
  { input: "where are you located", expected: "LOCATION" },
  { input: "google maps link", expected: "LOCATION" },
  { input: "parking available", expected: "LOCATION" },
  { input: "nearest landmark", expected: "LOCATION" },

  // CONTACT - Priority 1
  { input: "call the restaurant", expected: "CONTACT" },
  { input: "manager phone number", expected: "CONTACT" },
  { input: "email support", expected: "CONTACT" },
  { input: "whatsapp number", expected: "CONTACT" },
  { input: "talk to someone", expected: "CONTACT" },

  // SEARCH - Priority 2
  { input: "find restaurants", expected: "SEARCH" },
  { input: "show me biryani places", expected: "SEARCH" },
  { input: "look for pizza", expected: "SEARCH" },
  { input: "search nearby", expected: "SEARCH" },
  { input: "what options do you have", expected: "SEARCH" },

  // BOOK - Priority 3
  { input: "book a table for 4", expected: "BOOK" },
  { input: "reserve slot at 7pm", expected: "BOOK" },
  { input: "make a reservation", expected: "BOOK" },
  { input: "book appointment", expected: "BOOK" },
  { input: "schedule for tomorrow", expected: "BOOK" },

  // ORDER - Priority 4 (lowest priority)
  { input: "I want biryani", expected: "ORDER" },
  { input: "get me pizza", expected: "ORDER" },
  { input: "need food delivered", expected: "ORDER" },
  { input: "order for pickup", expected: "ORDER" },
  { input: "buy some food", expected: "ORDER" }
];

// Run tests
console.log('\n🧪 IMPROVED INTENT DETECTION TESTING\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;
const results = [];

tests.forEach(({ input, expected }) => {
  const result = detectIntent(input);
  const correct = result.intent === expected;

  if (correct) {
    passed++;
    console.log(`✅ "${input}" → ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`);
  } else {
    failed++;
    console.log(`❌ "${input}" → Expected: ${expected}, Got: ${result.intent}`);
  }

  results.push({ input, expected, detected: result.intent, correct });
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTS: ${passed}/${tests.length} passed (${((passed/tests.length)*100).toFixed(1)}%)\n`);

// Intent breakdown
const breakdown = {};
results.forEach(r => {
  breakdown[r.expected] = breakdown[r.expected] || { total: 0, correct: 0 };
  breakdown[r.expected].total++;
  if (r.correct) breakdown[r.expected].correct++;
});

console.log('📈 INTENT BREAKDOWN:\n');
Object.entries(breakdown)
  .sort((a, b) => b[1].total - a[1].total)
  .forEach(([intent, stats]) => {
    const acc = ((stats.correct / stats.total) * 100).toFixed(0);
    console.log(`   ${intent.padEnd(15)} ${acc.padStart(3)}% (${stats.total} tests)`);
  });

console.log('\n' + '='.repeat(60));

// Save improved patterns
console.log('\n💾 Saving improved patterns...');
fs.writeFileSync(
  './training-data/improved-patterns.json',
  JSON.stringify(patterns, null, 2)
);
console.log('✅ Done!\n');

process.exit(failed > 0 ? 1 : 0);
