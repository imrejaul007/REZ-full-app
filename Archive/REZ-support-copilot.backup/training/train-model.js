/**
 * Simple intent classifier using keyword matching + confidence scoring
 * Can be extended with ML models later
 */

class IntentClassifier {
  constructor(trainingData) {
    this.data = trainingData;
    this.intentCounts = {};
    this.wordCounts = {};
    this.intentWords = {};
    this.train();
  }

  train() {
    // Count word frequencies per intent
    this.data.forEach(item => {
      const intent = item.intent;
      const words = item.text.toLowerCase().split(/\s+/);

      if (!this.intentCounts[intent]) {
        this.intentCounts[intent] = 0;
        this.intentWords[intent] = {};
      }
      this.intentCounts[intent]++;

      words.forEach(word => {
        if (!this.intentWords[intent][word]) {
          this.intentWords[intent][word] = 0;
        }
        this.intentWords[intent][word]++;
      });
    });
  }

  predict(text) {
    const words = text.toLowerCase().split(/\s+/);
    const scores = {};

    // Calculate score for each intent
    Object.keys(this.intentWords).forEach(intent => {
      let score = 0;
      words.forEach(word => {
        if (this.intentWords[intent][word]) {
          score += this.intentWords[intent][word];
        }
      });
      scores[intent] = score;
    });

    // Find best match
    let bestIntent = 'UNKNOWN';
    let bestScore = 0;

    Object.keys(scores).forEach(intent => {
      if (scores[intent] > bestScore) {
        bestScore = scores[intent];
        bestIntent = intent;
      }
    });

    // Calculate confidence
    const totalMentions = Object.values(this.intentCounts).reduce((a, b) => a + b, 0);
    const confidence = bestScore > 0 ? Math.min(bestScore / 3, 0.95) : 0.5;

    return {
      intent: bestIntent,
      confidence: confidence,
      allScores: scores
    };
  }
}

module.exports = IntentClassifier;
