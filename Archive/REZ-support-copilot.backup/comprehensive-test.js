/**
 * REZ Support Copilot - Comprehensive Pattern Testing
 * Tests all production patterns
 */

const patterns = require('./training-data/improved-patterns.json');
const productionPatterns = require('./training-data/production-patterns.json');

// Combined intent detector
function detectIntent(text) {
  const lower = text.toLowerCase();
  const scores = {};

  // Check improved patterns first (priority-based)
  Object.entries(patterns.improved_intents).forEach(([intent, config]) => {
    const intentPatterns = config.patterns || [];
    const weight = config.weight || 1;
    const priority = config.priority || 5;

    let score = 0;
    intentPatterns.forEach(pattern => {
      if (lower.includes(pattern.toLowerCase())) {
        score += weight;
      }
    });

    scores[intent] = {
      score,
      weightedScore: score * (11 - priority)
    };
  });

  // Check production patterns
  Object.entries(productionPatterns.production_patterns).forEach(([intent, config]) => {
    const highPriority = config.high_priority_patterns || [];
    const slang = productionPatterns.slang_and_informal[intent] || [];

    let score = 0;
    [...highPriority, ...slang].forEach(pattern => {
      if (lower.includes(pattern.toLowerCase())) {
        score += 2; // Higher weight for production patterns
      }
    });

    if (scores[intent]) {
      scores[intent].score += score;
      scores[intent].weightedScore += score * 2;
    }
  });

  // Sort by weighted score
  const sorted = Object.entries(scores)
    .filter(([_, data]) => data.score > 0)
    .sort((a, b) => b[1].weightedScore - a[1].weightedScore);

  if (sorted.length === 0) {
    return { intent: 'UNKNOWN', confidence: 0.3 };
  }

  const best = sorted[0];
  return {
    intent: best[0],
    confidence: Math.min(0.5 + best[1].score * 0.1, 0.98)
  };
}

// Comprehensive test cases
const testCases = [
  // === ORDER (70 tests) ===
  ...generateTests('ORDER', productionPatterns.production_patterns.ORDER.high_priority_patterns),
  ...generateTests('ORDER', [
    "I want pizza", "Order noodles", "Get biryani", "Need food", "Buy dinner",
    "Order for home", "Delivery order", "Pickup order", "Takeaway"
  ]),

  // === CANCEL (50 tests) ===
  ...generateTests('CANCEL', productionPatterns.production_patterns.CANCEL.high_priority_patterns),
  ...generateTests('CANCEL', [
    "Cancel it", "Don't want anymore", "Stop delivery", "Remove order", "Undo",
    "Abort", "Delete", "Never mind", "Changed my mind"
  ]),

  // === BOOK (50 tests) ===
  ...generateTests('BOOK', productionPatterns.production_patterns.BOOK.high_priority_patterns),
  ...generateTests('BOOK', [
    "Book table", "Reserve spot", "Make reservation", "Book appointment", "Schedule",
    "Reserve slot", "Book for tonight", "Reserve for 4", "Book online"
  ]),

  // === SEARCH (40 tests) ===
  ...generateTests('SEARCH', productionPatterns.production_patterns.SEARCH.high_priority_patterns),
  ...generateTests('SEARCH', [
    "Find restaurants", "Search for food", "Show options", "Look around", "Browse",
    "Find nearby", "Search nearby", "Display menu"
  ]),

  // === PAYMENT (40 tests) ===
  ...generateTests('PAYMENT', productionPatterns.production_patterns.PAYMENT.high_priority_patterns),
  ...generateTests('PAYMENT', [
    "Pay now", "Payment online", "Refund money", "Charged", "Transaction",
    "Pay via card", "Pay cash", "Online payment", "Pay bill"
  ]),

  // === DELIVERY (40 tests) ===
  ...generateTests('DELIVERY', productionPatterns.production_patterns.DELIVERY.high_priority_patterns),
  ...generateTests('DELIVERY', [
    "Track order", "Where's my food", "Delivery status", "When arriving", "ETA",
    "Driver location", "Order tracking", "Shipment status"
  ]),

  // === COMPLAINT (40 tests) ===
  ...generateTests('COMPLAINT', productionPatterns.production_patterns.COMPLAINT.high_priority_patterns),
  ...generateTests('COMPLAINT', [
    "Bad quality", "Wrong item", "Food issue", "Problem with order", "Not good",
    "Poor service", "Disappointed", "Waste of money"
  ]),

  // === FEEDBACK (30 tests) ===
  ...generateTests('FEEDBACK', productionPatterns.production_patterns.FEEDBACK.high_priority_patterns),
  ...generateTests('FEEDBACK', [
    "Give rating", "Write review", "Stars review", "Tell experience", "Rate us",
    "Share opinion", "Give feedback"
  ]),

  // === DIETARY (30 tests) ===
  ...generateTests('DIETARY', productionPatterns.production_patterns.DIETARY.high_priority_patterns),
  ...generateTests('DIETARY', [
    "Pure veg", "No meat", "Egg-free", "Diet food", "Healthy option",
    "Nut-free", "Dairy-free"
  ]),

  // === OPENING_HOURS (30 tests) ===
  ...generateTests('OPENING_HOURS', productionPatterns.production_patterns.OPENING_HOURS.high_priority_patterns),
  ...generateTests('OPENING_HOURS', [
    "Open at", "Close at", "What time", "When open", "Closing soon",
    "All day", "24 hours", "Day and night"
  ]),

  // === LOCATION (30 tests) ===
  ...generateTests('LOCATION', productionPatterns.production_patterns.LOCATION.high_priority_patterns),
  ...generateTests('LOCATION', [
    "Your address", "Where you", "Get location", "Find store", "Store address",
    "Branch location", "Show on map"
  ]),

  // === CONTACT (30 tests) ===
  ...generateTests('CONTACT', productionPatterns.production_patterns.CONTACT.high_priority_patterns),
  ...generateTests('CONTACT', [
    "Ring them", "Connect me", "Give number", "Send message", "Message them",
    "Email", "Telegram", "Social media"
  ]),

  // === LOYALTY (30 tests) ===
  ...generateTests('LOYALTY', productionPatterns.production_patterns.LOYALTY.high_priority_patterns),
  ...generateTests('LOYALTY', [
    "My rewards", "Point balance", "Use offer", "Get discount", "Apply coupon",
    "Loyalty benefits", "Member offer"
  ]),

  // === GIFT (30 tests) ===
  ...generateTests('GIFT', productionPatterns.production_patterns.GIFT.high_priority_patterns),
  ...generateTests('GIFT', [
    "Gift it", "Buy voucher", "Send gift", "Surprise gift", "Occasion special",
    "Celebration package", "Festival offer"
  ]),

  // === RESCHEDULE (30 tests) ===
  ...generateTests('RESCHEDULE', productionPatterns.production_patterns.RESCHEDULE.high_priority_patterns),
  ...generateTests('RESCHEDULE', [
    "Update time", "Change date", "New slot", "Different time", "Amend booking",
    "Modify reservation", "Shift time"
  ]),

  // === HINGLISH (100 tests) ===
  ...generateTests('ORDER', [
    "biryani order karo", "khaana lao", "lelo food", "milao", "milao kuch",
    "khana order karo", "order karo yaar", "lelo bhai", "de do food",
    "chaahiye khaana"
  ]),
  ...generateTests('CANCEL', [
    "cancel kar do", "nahi chahiye", "hatao", "band karo", "mat banao",
    "nahi lena", "hatao yaar", "cancel kardo"
  ]),
  ...generateTests('PAYMENT', [
    "paisa do", "payment karo", "paisa wapas", "refund chahiye",
    "rupees do", "payment ho gaya", "transfer karo"
  ]),
  ...generateTests('DELIVERY', [
    "kahan hai food", "kaha hai order", "kitna time lagega", "kab aayega",
    "driver kahan hai", "paisa kahan hai"
  ]),
  ...generateTests('CONTACT', [
    "manager bolo", "baat karvao", "call karo", "phone karo",
    "whatsapp karo", "message bhejo"
  ]),
  ...generateTests('FEEDBACK', [
    "rating do", "review likho", "feedback do", "stars dijiye",
    "batado kaisa tha"
  ])
];

// Helper to generate tests
function generateTests(intent, inputs) {
  return inputs.map(input => ({
    input,
    expected: intent
  }));
}

// Run tests
function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log(' REZ SUPPORT COPILOT - COMPREHENSIVE PATTERN TESTING');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  testCases.forEach(({ input, expected }) => {
    const result = detectIntent(input);
    const correct = result.intent === expected;

    if (correct) {
      passed++;
    } else {
      failed++;
      console.log(`❌ "${input}" → Expected: ${expected}, Got: ${result.intent}`);
    }

    results.push({ input, expected, detected: result.intent, correct });
  });

  // Summary
  console.log('\n' + '-'.repeat(60));
  console.log(`\n📊 FINAL RESULTS: ${passed}/${testCases.length} passed (${((passed/testCases.length)*100).toFixed(1)}%)\n`);

  // Intent breakdown
  const breakdown = {};
  results.forEach(r => {
    if (!breakdown[r.expected]) {
      breakdown[r.expected] = { total: 0, correct: 0 };
    }
    breakdown[r.expected].total++;
    if (r.correct) breakdown[r.expected].correct++;
  });

  console.log('📈 INTENT BREAKDOWN:\n');
  Object.entries(breakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([intent, stats]) => {
      const acc = ((stats.correct / stats.total) * 100).toFixed(0);
      const bar = '█'.repeat(Math.floor(acc / 10)) + '░'.repeat(10 - Math.floor(acc / 10));
      console.log(`   ${intent.padEnd(15)} [${bar}] ${acc}% (${stats.total})`);
    });

  console.log('\n' + '='.repeat(60) + '\n');

  return { passed, failed, total: testCases.length };
}

// Run
const results = runTests();
process.exit(results.failed > 0 ? 1 : 0);
