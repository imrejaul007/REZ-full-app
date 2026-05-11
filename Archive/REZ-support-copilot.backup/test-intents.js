#!/usr/bin/env node
/**
 * REZ Support Copilot - Intent Detection Tester
 * Tests all intents with real user inputs
 */

const fs = require('fs');
const path = require('path');

// Load training data
const trainingData = require('./training-data/intent-training-data.json');
const merchantTraining = require('./training-data/merchant-specific-training.json');

// Intent detection function
function detectIntent(text) {
  const lowerText = text.toLowerCase().trim();
  const scores = {};

  // Calculate scores for each intent
  Object.keys(trainingData.intents).forEach(intent => {
    const examples = trainingData.intents[intent].examples;
    let score = 0;

    examples.forEach(example => {
      const exampleLower = example.toLowerCase();

      // Word overlap scoring
      const textWords = lowerText.split(/\s+/);
      const exampleWords = exampleLower.split(/\s+/);

      let matchCount = 0;
      textWords.forEach(word => {
        if (exampleLower.includes(word) && word.length > 2) {
          matchCount++;
        }
      });

      // Phrase matching (higher weight)
      if (exampleLower.includes(lowerText) || lowerText.includes(exampleLower)) {
        matchCount += 5;
      }

      if (matchCount > score) {
        score = matchCount;
      }
    });

    scores[intent] = score;
  });

  // Find best intent
  let bestIntent = 'UNKNOWN';
  let bestScore = 0;

  Object.keys(scores).forEach(intent => {
    if (scores[intent] > bestScore) {
      bestScore = scores[intent];
      bestIntent = intent;
    }
  });

  const confidence = bestScore > 0 ? Math.min(0.5 + (bestScore * 0.1), 0.98) : 0.3;

  return {
    intent: bestIntent,
    confidence: confidence,
    allScores: scores
  };
}

// Test cases
const testCases = [
  // ORDER
  { input: "I want to order biryani", expected: "ORDER" },
  { input: "Get me some chinese food", expected: "ORDER" },
  { input: "Order pizza for delivery", expected: "ORDER" },
  { input: "I need dinner for family", expected: "ORDER" },

  // BOOK
  { input: "Book a table for 4 at 7pm", expected: "BOOK" },
  { input: "Reserve a table for tonight", expected: "BOOK" },
  { input: "Make a reservation for 2", expected: "BOOK" },

  // SEARCH
  { input: "Find italian restaurants near me", expected: "SEARCH" },
  { input: "Show me pizza places", expected: "SEARCH" },
  { input: "Look for vegan options", expected: "SEARCH" },

  // PAYMENT
  { input: "Pay via paytm", expected: "PAYMENT" },
  { input: "Payment failed", expected: "PAYMENT" },
  { input: "Refund my money", expected: "PAYMENT" },

  // DELIVERY
  { input: "Where is my order", expected: "DELIVERY" },
  { input: "Track my delivery", expected: "DELIVERY" },
  { input: "When will food arrive", expected: "DELIVERY" },

  // FEEDBACK
  { input: "Give 5 star review", expected: "FEEDBACK" },
  { input: "How was your experience", expected: "FEEDBACK" },
  { input: "Share feedback", expected: "FEEDBACK" },

  // CANCEL
  { input: "Cancel my order", expected: "CANCEL" },
  { input: "I changed my mind", expected: "CANCEL" },
  { input: "Don't deliver anymore", expected: "CANCEL" },

  // DIETARY
  { input: "I am vegetarian", expected: "DIETARY" },
  { input: "Any vegan options", expected: "DIETARY" },
  { input: "No onion garlic please", expected: "DIETARY" },

  // OPENING_HOURS
  { input: "What time do you open", expected: "OPENING_HOURS" },
  { input: "Are you open now", expected: "OPENING_HOURS" },
  { input: "When do you close", expected: "OPENING_HOURS" },

  // LOCATION
  { input: "Where are you located", expected: "LOCATION" },
  { input: "Your address please", expected: "LOCATION" },
  { input: "Google maps link", expected: "LOCATION" },

  // CONTACT
  { input: "Call the restaurant", expected: "CONTACT" },
  { input: "Manager phone number", expected: "CONTACT" },
  { input: "Email the support", expected: "CONTACT" },

  // LOYALTY
  { input: "Use my loyalty points", expected: "LOYALTY" },
  { input: "Redeem rewards", expected: "LOYALTY" },
  { input: "How many points do I have", expected: "LOYALTY" },

  // GIFT
  { input: "Buy gift card", expected: "GIFT" },
  { input: "Send surprise to friend", expected: "GIFT" },
  { input: "Birthday present delivery", expected: "GIFT" },

  // COMPLAINT
  { input: "Food was cold", expected: "COMPLAINT" },
  { input: "Order wrong item received", expected: "COMPLAINT" },
  { input: "Bad service experience", expected: "COMPLAINT" },

  // RESCHEDULE
  { input: "Change booking time", expected: "RESCHEDULE" },
  { input: "Move to tomorrow", expected: "RESCHEDULE" },
  { input: "Postpone reservation", expected: "RESCHEDULE" }
];

// Run tests
console.log('\n🧪 REZ SUPPORT COPILOT - INTENT DETECTION TESTING\n');
console.log('═'.repeat(60));

let passed = 0;
let failed = 0;
const results = [];

testCases.forEach((test, index) => {
  const result = detectIntent(test.input);
  const isCorrect = result.intent === test.expected;

  if (isCorrect) {
    passed++;
    console.log(`✅ PASS: "${test.input}" → ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`);
  } else {
    failed++;
    console.log(`❌ FAIL: "${test.input}" → Expected: ${test.expected}, Got: ${result.intent} (${(result.confidence * 100).toFixed(0)}%)`);
  }

  results.push({
    input: test.input,
    expected: test.expected,
    got: result.intent,
    confidence: result.confidence,
    passed: isCorrect
  });
});

// Summary
console.log('\n' + '═'.repeat(60));
console.log(`\n📊 RESULTS: ${passed}/${testCases.length} passed (${((passed/testCases.length)*100).toFixed(1)}% accuracy)`);

if (failed > 0) {
  console.log(`\n❌ FAILED TESTS:`);
  results.filter(r => !r.passed).forEach(r => {
    console.log(`   - "${r.input}" → Expected: ${r.expected}, Got: ${r.got}`);
  });
}

// Save results
const reportPath = path.join(__dirname, 'test-results.json');
fs.writeFileSync(reportPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  summary: { total: testCases.length, passed, failed, accuracy: (passed/testCases.length * 100).toFixed(1) },
  results
}, null, 2));

console.log(`\n📄 Results saved to test-results.json`);
console.log('═'.repeat(60));
console.log('\n✨ Test complete!\n');

process.exit(failed > 0 ? 1 : 0);
