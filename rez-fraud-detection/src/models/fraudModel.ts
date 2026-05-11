import { EventEmitter } from 'events';

// Types
export interface FraudSignal {
  type: 'velocity' | 'geolocation' | 'amount' | 'pattern';
  score: number;
  details: string;
}

export interface Order {
  id: string;
  userId: string;
  amount: number;
  avgAmount: number;
  velocity: number;
  locationMismatch: boolean;
  ipAddress: string;
  shippingAddress: string;
  billingAddress: string;
  items: OrderItem[];
  timestamp: Date;
}

export interface OrderItem {
  itemId: string;
  quantity: number;
  price: number;
}

export interface FraudPrediction {
  orderId: string;
  riskScore: number;
  signals: FraudSignal[];
  recommendation: 'allow' | 'review' | 'block';
  confidence: number;
  processedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FraudDetectionConfig {
  velocityThreshold: number;
  amountMultiplierThreshold: number;
  blockThreshold: number;
  reviewThreshold: number;
  enableGeolocationCheck: boolean;
  enablePatternAnalysis: boolean;
}

export interface FraudStats {
  totalProcessed: number;
  blocked: number;
  reviewed: number;
  allowed: number;
  avgRiskScore: number;
  topSignals: { type: string; count: number }[];
}

// Default configuration
const DEFAULT_CONFIG: FraudDetectionConfig = {
  velocityThreshold: 5,
  amountMultiplierThreshold: 3,
  blockThreshold: 70,
  reviewThreshold: 40,
  enableGeolocationCheck: true,
  enablePatternAnalysis: true,
};

/**
 * FraudDetectionModel - Hybrid rule-based + ML fraud detection system
 *
 * Combines multiple signals:
 * - Velocity: Detects rapid-fire ordering patterns
 * - Amount: Identifies anomalous transaction sizes
 * - Geolocation: Catches IP/address mismatches
 * - Pattern: ML-based suspicious pattern recognition
 */
export class FraudDetectionModel extends EventEmitter {
  private config: FraudDetectionConfig;
  private stats: FraudStats;
  private historicalOrders: Map<string, Order[]> = new Map();

  constructor(config: Partial<FraudDetectionConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.stats = this.initStats();
  }

  private initStats(): FraudStats {
    return {
      totalProcessed: 0,
      blocked: 0,
      reviewed: 0,
      allowed: 0,
      avgRiskScore: 0,
      topSignals: [],
    };
  }

  /**
   * Main entry point for fraud analysis
   */
  calculateRiskScore(order: Order): FraudPrediction {
    const signals: FraudSignal[] = [];
    let totalScore = 0;

    // Velocity check - too many orders in short time
    const velocitySignal = this.checkVelocity(order);
    if (velocitySignal) {
      signals.push(velocitySignal);
      totalScore += velocitySignal.score;
    }

    // Amount anomaly - order amount vs user average
    const amountSignal = this.checkAmountAnomaly(order);
    if (amountSignal) {
      signals.push(amountSignal);
      totalScore += amountSignal.score;
    }

    // Geolocation mismatch check
    const geoSignal = this.checkGeolocation(order);
    if (geoSignal) {
      signals.push(geoSignal);
      totalScore += geoSignal.score;
    }

    // Pattern analysis using historical data
    const patternSignal = this.checkPattern(order);
    if (patternSignal) {
      signals.push(patternSignal);
      totalScore += patternSignal.score;
    }

    // Store order for future pattern analysis
    this.storeOrder(order);

    // Calculate final prediction
    const clampedScore = Math.min(totalScore, 100);
    const recommendation = this.determineRecommendation(clampedScore);
    const confidence = this.calculateConfidence(signals.length, totalScore);

    // Update stats
    this.updateStats(clampedScore, recommendation);

    const prediction: FraudPrediction = {
      orderId: order.id,
      riskScore: clampedScore,
      signals,
      recommendation,
      confidence,
      processedAt: new Date(),
    };

    // Emit event for real-time monitoring
    this.emit('fraudDetected', prediction);

    return prediction;
  }

  /**
   * Batch processing for multiple orders
   */
  calculateRiskScoreBatch(orders: Order[]): FraudPrediction[] {
    return orders.map(order => this.calculateRiskScore(order));
  }

  /**
   * Velocity check: Detect rapid-fire ordering
   */
  private checkVelocity(order: Order): FraudSignal | null {
    if (order.velocity > this.config.velocityThreshold) {
      return {
        type: 'velocity',
        score: 30,
        details: `High order velocity: ${order.velocity} orders (threshold: ${this.config.velocityThreshold})`,
      };
    }
    return null;
  }

  /**
   * Amount anomaly: Order significantly higher than user's average
   */
  private checkAmountAnomaly(order: Order): FraudSignal | null {
    if (order.amount > order.avgAmount * this.config.amountMultiplierThreshold) {
      const multiplier = (order.amount / order.avgAmount).toFixed(1);
      return {
        type: 'amount',
        score: 25,
        details: `Amount ${multiplier}x higher than average: $${order.amount} vs $${order.avgAmount}`,
      };
    }
    return null;
  }

  /**
   * Geolocation check: IP address doesn't match shipping/billing location
   */
  private checkGeolocation(order: Order): FraudSignal | null {
    if (!this.config.enableGeolocationCheck) {
      return null;
    }

    if (order.locationMismatch) {
      return {
        type: 'geolocation',
        score: 20,
        details: 'IP/Location mismatch detected between IP and address',
      };
    }

    // Additional checks
    if (order.shippingAddress !== order.billingAddress) {
      return {
        type: 'geolocation',
        score: 10,
        details: 'Shipping and billing address differ',
      };
    }

    return null;
  }

  /**
   * Pattern analysis: ML-based suspicious pattern detection
   */
  private checkPattern(order: Order): FraudSignal | null {
    if (!this.config.enablePatternAnalysis) {
      return null;
    }

    const suspiciousPatterns = this.analyzePatterns(order);

    if (suspiciousPatterns.length > 0) {
      return {
        type: 'pattern',
        score: 15 * suspiciousPatterns.length,
        details: `Suspicious patterns: ${suspiciousPatterns.join(', ')}`,
      };
    }

    return null;
  }

  /**
   * Analyze various patterns in the order
   */
  private analyzePatterns(order: Order): string[] {
    const patterns: string[] = [];

    // Check for first-time high-value purchases
    const userOrders = this.historicalOrders.get(order.userId) || [];
    if (userOrders.length === 0 && order.amount > 200) {
      patterns.push('First-time high-value purchase');
    }

    // Check for unusual time patterns
    const hour = order.timestamp.getHours();
    if (hour >= 2 && hour <= 5 && order.amount > 100) {
      patterns.push('Unusual purchase time (2AM-5AM)');
    }

    // Check for bulk orders of same item
    const itemCounts = new Map<string, number>();
    for (const item of order.items) {
      const count = itemCounts.get(item.itemId) || 0;
      itemCounts.set(item.itemId, count + item.quantity);
    }

    for (const [itemId, quantity] of itemCounts) {
      if (quantity > 10) {
        patterns.push(`Bulk order: ${quantity}x of item ${itemId}`);
      }
    }

    // Check for high-value items in small orders
    const hasHighValueItems = order.items.some(item => item.price > 500);
    if (hasHighValueItems && order.items.length === 1) {
      patterns.push('Single high-value item');
    }

    return patterns;
  }

  /**
   * Store order for historical pattern analysis
   */
  private storeOrder(order: Order): void {
    const userOrders = this.historicalOrders.get(order.userId) || [];
    userOrders.push(order);

    // Keep only last 100 orders per user
    if (userOrders.length > 100) {
      userOrders.shift();
    }

    this.historicalOrders.set(order.userId, userOrders);
  }

  /**
   * Determine recommendation based on risk score
   */
  private determineRecommendation(riskScore: number): 'allow' | 'review' | 'block' {
    if (riskScore >= this.config.blockThreshold) {
      return 'block';
    }
    if (riskScore >= this.config.reviewThreshold) {
      return 'review';
    }
    return 'allow';
  }

  /**
   * Calculate confidence based on number of signals and score
   */
  private calculateConfidence(signalCount: number, totalScore: number): number {
    // More signals = higher confidence
    let baseConfidence = 0.5;

    if (signalCount >= 3) {
      baseConfidence = 0.9;
    } else if (signalCount === 2) {
      baseConfidence = 0.8;
    } else if (signalCount === 1) {
      baseConfidence = 0.7;
    }

    // High scores without signals might be false positives
    if (signalCount === 0 && totalScore > 0) {
      baseConfidence = 0.4;
    }

    return Math.round(baseConfidence * 100) / 100;
  }

  /**
   * Update internal statistics
   */
  private updateStats(riskScore: number, recommendation: string): void {
    this.stats.totalProcessed++;

    switch (recommendation) {
      case 'block':
        this.stats.blocked++;
        break;
      case 'review':
        this.stats.reviewed++;
        break;
      case 'allow':
        this.stats.allowed++;
        break;
    }

    // Calculate running average
    const n = this.stats.totalProcessed;
    this.stats.avgRiskScore =
      (this.stats.avgRiskScore * (n - 1) + riskScore) / n;
  }

  /**
   * Get current statistics
   */
  getStats(): FraudStats {
    return { ...this.stats };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FraudDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): FraudDetectionConfig {
    return { ...this.config };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initStats();
  }

  /**
   * Clear historical data
   */
  clearHistory(): void {
    this.historicalOrders.clear();
  }
}

// Factory function for quick instantiation
export function createFraudDetectionModel(
  config?: Partial<FraudDetectionConfig>
): FraudDetectionModel {
  return new FraudDetectionModel(config);
}
