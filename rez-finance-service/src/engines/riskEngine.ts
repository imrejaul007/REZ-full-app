import { CreditProfile } from '../models/CreditProfile';

export interface FraudResult {
  isFraud: boolean;
  score: number; // 0-1
  reasons: string[];
}

export interface DefaultPrediction {
  probability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
}

export interface AnomalyReport {
  hasAnomaly: boolean;
  anomalies: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

export class RiskEngine {
  /**
   * Fraud detection based on behavior patterns
   */
  async detectFraud(userId: string): Promise<FraudResult> {
    const profile = await CreditProfile.findOne({ userId });
    if (!profile) {
      return { isFraud: false, score: 0, reasons: [] };
    }

    const reasons: string[] = [];
    let score = 0;

    // Check for suspicious patterns
    if (profile.factors.walletBalance > 100000 && profile.rezScore < 300) {
      score += 0.3;
      reasons.push('High wallet balance with low score');
    }

    if (profile.factors.orderCount30d > 500 && profile.factors.avgOrderValue < 50) {
      score += 0.2;
      reasons.push('Unusual order pattern');
    }

    return {
      isFraud: score > 0.5,
      score,
      reasons,
    };
  }

  /**
   * Predict default probability based on behavior
   */
  async predictDefault(userId: string): Promise<DefaultPrediction> {
    const profile = await CreditProfile.findOne({ userId });
    if (!profile) {
      return { probability: 0.5, riskLevel: 'medium', factors: [] };
    }

    const { factors, rezScore } = profile;
    let probability = 0.5;
    const riskFactors: string[] = [];

    // Payment history impact
    if (factors.paymentHistory < 0.8) {
      probability += 0.2;
      riskFactors.push('Low payment history');
    }

    // Score impact
    if (rezScore < 400) {
      probability += 0.15;
      riskFactors.push('Low REZ score');
    }

    // Wallet balance (low balance = risk)
    if (factors.walletBalance < 500) {
      probability += 0.1;
      riskFactors.push('Low wallet balance');
    }

    // Cap at 1
    probability = Math.min(probability, 1);

    return {
      probability,
      riskLevel: probability < 0.3 ? 'low' : probability < 0.6 ? 'medium' : 'high',
      factors: riskFactors,
    };
  }

  /**
   * Detect behavioral anomalies
   */
  async detectAnomalies(userId: string): Promise<AnomalyReport> {
    const anomalies: Array<{ type: string; severity: 'low' | 'medium' | 'high'; description: string }> = [];

    // Add anomaly detection logic
    // This would check for:
    // - Sudden spending sprees
    // - Unusual locations
    // - Multiple accounts
    // - Velocity patterns

    return {
      hasAnomaly: anomalies.length > 0,
      anomalies,
    };
  }
}

export const riskEngine = new RiskEngine();
