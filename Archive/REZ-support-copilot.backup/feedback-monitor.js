/**
 * REZ Support Copilot - Feedback Monitor
 * Monitors conversation feedback and trains the AI
 *
 * Usage: node feedback-monitor.js
 */

const fs = require('fs');
const path = require('path');

// Feedback data store
const feedbackStore = {
  conversations: [],
  corrections: [],
  metrics: {
    totalInteractions: 0,
    successfulInteractions: 0,
    failedInteractions: 0,
    intentAccuracy: {}
  }
};

// Load existing feedback
const feedbackFile = path.join(__dirname, 'feedback-data.json');
if (fs.existsSync(feedbackFile)) {
  const data = JSON.parse(fs.readFileSync(feedbackFile));
  Object.assign(feedbackStore, data);
}

// Simulate feedback collection
function collectFeedback(conversationId, feedback) {
  const entry = {
    conversationId,
    feedback,
    timestamp: new Date().toISOString()
  };

  feedbackStore.conversations.push(entry);

  if (feedback.correct) {
    feedbackStore.metrics.successfulInteractions++;
    updateIntentAccuracy(feedback.intent, true);
  } else {
    feedbackStore.metrics.failedInteractions++;
    if (feedback.correctedIntent) {
      feedbackStore.corrections.push({
        originalIntent: feedback.intent,
        correctedIntent: feedback.correctedIntent,
        userMessage: feedback.message,
        timestamp: new Date().toISOString()
      });
    }
    updateIntentAccuracy(feedback.intent, false);
  }

  feedbackStore.metrics.totalInteractions++;
  saveFeedback();

  return {
    acknowledged: true,
    newAccuracy: calculateIntentAccuracy(feedback.intent)
  };
}

// Update accuracy for specific intent
function updateIntentAccuracy(intent, correct) {
  if (!feedbackStore.metrics.intentAccuracy[intent]) {
    feedbackStore.metrics.intentAccuracy[intent] = { correct: 0, total: 0 };
  }

  feedbackStore.metrics.intentAccuracy[intent].total++;
  if (correct) {
    feedbackStore.metrics.intentAccuracy[intent].correct++;
  }

  // Update training data with corrections
  if (!correct && feedbackStore.corrections.length > 0) {
    addToTraining(feedbackStore.corrections[feedbackStore.corrections.length - 1]);
  }
}

// Add correction to training data
function addToTraining(correction) {
  const trainingFile = path.join(__dirname, 'training-data', 'user-corrections.json');
  let corrections = [];

  if (fs.existsSync(trainingFile)) {
    corrections = JSON.parse(fs.readFileSync(trainingFile));
  }

  corrections.push(correction);
  fs.writeFileSync(trainingFile, JSON.stringify(corrections, null, 2));
}

// Calculate accuracy
function calculateAccuracy() {
  const { successfulInteractions, totalInteractions } = feedbackStore.metrics;
  return totalInteractions > 0
    ? (successfulInteractions / totalInteractions * 100).toFixed(2) + '%'
    : 'N/A';
}

// Calculate intent-specific accuracy
function calculateIntentAccuracy(intent) {
  const stats = feedbackStore.metrics.intentAccuracy[intent];
  if (!stats || stats.total === 0) return 'N/A';
  return (stats.correct / stats.total * 100).toFixed(0) + '%';
}

// Get dashboard data
function getDashboard() {
  return {
    overview: {
      totalInteractions: feedbackStore.metrics.totalInteractions,
      successful: feedbackStore.metrics.successfulInteractions,
      failed: feedbackStore.metrics.failedInteractions,
      accuracy: calculateAccuracy()
    },
    intentAccuracy: Object.entries(feedbackStore.metrics.intentAccuracy)
      .map(([intent, stats]) => ({
        intent,
        accuracy: ((stats.correct / stats.total) * 100).toFixed(0) + '%',
        total: stats.total
      }))
      .sort((a, b) => b.total - a.total),
    recentCorrections: feedbackStore.corrections.slice(-10).reverse(),
    recommendations: getRecommendations()
  };
}

// Get improvement recommendations
function getRecommendations() {
  const recs = [];

  // Low accuracy intents
  Object.entries(feedbackStore.metrics.intentAccuracy)
    .filter(([_, stats]) => stats.total > 5 && stats.correct / stats.total < 0.8)
    .forEach(([intent, stats]) => {
      recs.push({
        type: 'low_accuracy',
        intent,
        accuracy: (stats.correct / stats.total * 100).toFixed(0) + '%',
        suggestion: `Add more examples for ${intent.toLowerCase()} intent`
      });
    });

  // High volume failed intents
  feedbackStore.corrections
    .slice(-50)
    .reduce((acc, corr) => {
      const key = corr.correctedIntent;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
    .forEach((count, intent) => {
      if (count > 3) {
        recs.push({
          type: 'frequent_correction',
          intent,
          count,
          suggestion: `Consider adding more ${intent.toLowerCase()} patterns`
        });
      }
    });

  return recs.slice(0, 5);
}

// Save feedback
function saveFeedback() {
  fs.writeFileSync(feedbackFile, JSON.stringify(feedbackStore, null, 2));
}

// API endpoint simulation
function handleRequest(req, res) {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/feedback' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const feedback = JSON.parse(body);
      const result = collectFeedback(feedback.conversationId, feedback);
      res.end(JSON.stringify(result));
    });
  }

  if (url.pathname === '/api/dashboard' && req.method === 'GET') {
    res.end(JSON.stringify(getDashboard()));
  }
}

// CLI mode
if (require.main === module) {
  console.log('\n📊 REZ Support Copilot - Feedback Monitor\n');
  console.log('═'.repeat(50));

  const dashboard = getDashboard();

  console.log(`\n📈 OVERVIEW:`);
  console.log(`   Total Interactions: ${dashboard.overview.totalInteractions}`);
  console.log(`   Successful: ${dashboard.overview.successful}`);
  console.log(`   Failed: ${dashboard.overview.failed}`);
  console.log(`   Accuracy: ${dashboard.overview.accuracy}`);

  console.log(`\n🎯 INTENT ACCURACY:`);
  dashboard.intentAccuracy.forEach(intent => {
    console.log(`   ${intent.intent.padEnd(15)} ${intent.accuracy.padStart(5)} (${intent.total} tests)`);
  });

  console.log(`\n💡 RECOMMENDATIONS:`);
  dashboard.recommendations.forEach(rec => {
    console.log(`   [${rec.type}] ${rec.intent}: ${rec.suggestion}`);
  });

  console.log('\n' + '═'.repeat(50));
  console.log('\n📝 Usage: POST /api/feedback\n');
}

module.exports = { collectFeedback, getDashboard, handleRequest };
