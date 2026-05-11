// BNPL Interest Rate Configuration

export interface InterestConfig {
  // Interest rates by tenure (in days)
  rates: {
    [tenure: number]: number; // percentage per month
  };
  // Default rates
  defaultMonthlyRate: number; // e.g., 2.5 for 2.5%
  maxTenureDays: number;
  minAmount: number;
  maxAmount: number;
  // Late payment
  lateFeePercentage: number;
  gracePeriodDays: number;
}

export const DEFAULT_INTEREST_CONFIG: InterestConfig = {
  rates: {
    15: 0,      // 0% for 15 days (grace period)
    30: 2.5,    // 2.5% per month for 30 days
    60: 3.0,    // 3% per month for 60 days
    90: 3.5,    // 3.5% per month for 90 days
  },
  defaultMonthlyRate: 2.5,
  maxTenureDays: 90,
  minAmount: 100,
  maxAmount: 50000,
  lateFeePercentage: 2,
  gracePeriodDays: 15,
};

export class InterestCalculator {
  private config: InterestConfig;

  constructor(config: InterestConfig = DEFAULT_INTEREST_CONFIG) {
    this.config = config;
  }

  calculateInterest(principal: number, tenureDays: number): number {
    const monthlyRate = this.getMonthlyRate(tenureDays);
    const months = tenureDays / 30;
    return Math.round(principal * (monthlyRate / 100) * months * 100) / 100;
  }

  private getMonthlyRate(tenureDays: number): number {
    // Find closest tenure bracket
    const tenures = Object.keys(this.config.rates).map(Number).sort((a, b) => a - b);
    for (const tenure of tenures) {
      if (tenureDays <= tenure) {
        return this.config.rates[tenure];
      }
    }
    return this.config.defaultMonthlyRate;
  }

  calculateLateFee(outstanding: number, daysLate: number): number {
    if (daysLate <= this.config.gracePeriodDays) return 0;
    return Math.round(outstanding * (this.config.lateFeePercentage / 100) * 100) / 100;
  }

  getConfig(): InterestConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<InterestConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
