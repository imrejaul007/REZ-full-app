import { EventEmitter } from 'events';

// Types
export interface PriceOptimization {
  itemId: string;
  basePrice: number;
  optimizedPrice: number;
  factors: PriceFactors;
  expectedDemand: number;
  confidence: number;
  validUntil: Date;
}

export interface PriceFactors {
  demand: number; // 0-1, higher = more demand
  competition: number; // 0-1, higher = more competition
  timeOfDay: number; // -1 to 1, peak hours positive
  dayOfWeek: number; // -1 to 1, weekends positive
  weather?: number; // -1 to 1, bad weather positive for delivery
  seasonality?: number; // -1 to 1, seasonal demand factor
  inventory?: number; // 0-1, low inventory = higher price
}

export interface OptimizationConfig {
  maxPriceMultiplier: number;
  minPriceMultiplier: number;
  baseDemandElasticity: number;
  peakHours: number[];
  weekendBoost: number;
  confidenceThreshold: number;
}

export interface PriceHistory {
  itemId: string;
  date: Date;
  price: number;
  demand: number;
  conversionRate: number;
}

export interface OptimizationResult {
  success: boolean;
  optimization?: PriceOptimization;
  error?: string;
  warnings: string[];
}

// Default configuration
const DEFAULT_CONFIG: OptimizationConfig = {
  maxPriceMultiplier: 1.5,
  minPriceMultiplier: 0.7,
  baseDemandElasticity: -0.8, // Typical for food delivery
  peakHours: [11, 12, 13, 17, 18, 19, 20, 21],
  weekendBoost: 0.15,
  confidenceThreshold: 0.6,
};

/**
 * PriceOptimizationModel - Dynamic pricing optimization system
 *
 * Calculates optimal prices based on multiple factors:
 * - Demand: Higher demand = higher prices
 * - Competition: More competitors = lower prices
 * - Time: Peak hours command premium pricing
 * - Day of Week: Weekends have different dynamics
 * - Weather: Bad weather increases delivery demand
 * - Seasonality: Holiday/event pricing
 * - Inventory: Scarcity drives prices up
 */
export class PriceOptimizationModel extends EventEmitter {
  private config: OptimizationConfig;
  private priceHistory: Map<string, PriceHistory[]> = new Map();
  private basePrices: Map<string, number> = new Map();

  constructor(config: Partial<OptimizationConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main optimization function
   */
  optimize(itemId: string, date: Date = new Date()): OptimizationResult {
    const warnings: string[] = [];

    // Get base price
    const basePrice = this.getBasePrice(itemId);
    if (!basePrice) {
      return {
        success: false,
        error: `Base price not found for item: ${itemId}`,
        warnings,
      };
    }

    // Calculate all factors
    const factors = this.calculateFactors(itemId, date);

    // Calculate price multipliers
    const multipliers = this.calculateMultipliers(factors);

    // Validate multipliers are within bounds
    const validMultipliers = this.validateMultipliers(multipliers, warnings);

    // Calculate final price
    const optimizedPrice = basePrice * validMultipliers.total;

    // Estimate expected demand
    const expectedDemand = this.estimateDemand(basePrice, optimizedPrice, factors);

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(itemId);

    // Determine validity period (1 hour for prices)
    const validUntil = new Date(date.getTime() + 60 * 60 * 1000);

    const optimization: PriceOptimization = {
      itemId,
      basePrice,
      optimizedPrice: Math.round(optimizedPrice * 100) / 100,
      factors,
      expectedDemand: Math.round(expectedDemand * 100) / 100,
      confidence,
      validUntil,
    };

    this.emit('optimizationComplete', optimization);

    return {
      success: true,
      optimization,
      warnings,
    };
  }

  /**
   * Get base price for an item
   */
  private getBasePrice(itemId: string): number {
    // Check cached base price
    if (this.basePrices.has(itemId)) {
      return this.basePrices.get(itemId)!;
    }

    // Check historical data for first recorded price
    const history = this.priceHistory.get(itemId);
    if (history && history.length > 0) {
      return history[0].price;
    }

    // Default base price (would normally come from database)
    return 0;
  }

  /**
   * Set base price for an item
   */
  setBasePrice(itemId: string, price: number): void {
    this.basePrices.set(itemId, price);
  }

  /**
   * Calculate all price factors
   */
  private calculateFactors(itemId: string, date: Date): PriceFactors {
    return {
      demand: this.getDemandFactor(itemId, date),
      competition: this.getCompetitionFactor(itemId, date),
      timeOfDay: this.getTimeOfDayFactor(date),
      dayOfWeek: this.getDayOfWeekFactor(date),
      weather: this.getWeatherFactor(date),
      seasonality: this.getSeasonalityFactor(date),
      inventory: this.getInventoryFactor(itemId),
    };
  }

  /**
   * Get demand factor (0-1)
   */
  private getDemandFactor(itemId: string, date: Date): number {
    const history = this.priceHistory.get(itemId) || [];
    const recentHistory = history.filter(
      h => Date.now() - h.date.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (recentHistory.length === 0) {
      return 0.5; // Default moderate demand
    }

    // Calculate average demand over recent period
    const avgDemand =
      recentHistory.reduce((sum, h) => sum + h.demand, 0) / recentHistory.length;

    // Normalize to 0-1 range
    return Math.min(Math.max(avgDemand / 100, 0), 1);
  }

  /**
   * Get competition factor (0-1, higher = more competition)
   */
  private getCompetitionFactor(itemId: string, date: Date): number {
    // In production, this would query competitor prices
    // For now, return moderate competition
    return 0.5;
  }

  /**
   * Get time of day factor (-1 to 1)
   */
  private getTimeOfDayFactor(date: Date): number {
    const hour = date.getHours();

    if (this.config.peakHours.includes(hour)) {
      return 0.5; // Peak hours
    }

    if (hour >= 6 && hour <= 10) {
      return 0.2; // Morning
    }

    if (hour >= 14 && hour <= 16) {
      return -0.2; // Afternoon lull
    }

    if (hour >= 22 || hour <= 5) {
      return -0.5; // Late night
    }

    return 0; // Default
  }

  /**
   * Get day of week factor (-1 to 1)
   */
  private getDayOfWeekFactor(date: Date): number {
    const day = date.getDay();

    // Saturday (6) and Sunday (0) have different dynamics
    if (day === 0 || day === 6) {
      return this.config.weekendBoost;
    }

    // Friday evening has slight boost
    if (day === 5 && date.getHours() >= 17) {
      return 0.1;
    }

    // Monday typically slower
    if (day === 1) {
      return -0.1;
    }

    return 0;
  }

  /**
   * Get weather factor (-1 to 1)
   */
  private getWeatherFactor(date: Date): number {
    // In production, this would query weather API
    // For now, return neutral
    return 0;
  }

  /**
   * Get seasonality factor (-1 to 1)
   */
  private getSeasonalityFactor(date: Date): number {
    const month = date.getMonth();

    // Holiday seasons
    if (month === 11 || month === 0) {
      // December/January - holidays
      return 0.2;
    }

    // Summer (June-August)
    if (month >= 5 && month <= 7) {
      return 0.1;
    }

    // Post-holiday January
    if (month === 0) {
      return -0.1;
    }

    return 0;
  }

  /**
   * Get inventory factor (0-1, lower = scarcity)
   */
  private getInventoryFactor(itemId: string): number {
    // In production, this would query inventory system
    // For now, return full inventory
    return 1;
  }

  /**
   * Calculate all price multipliers
   */
  private calculateMultipliers(factors: PriceFactors): {
    demand: number;
    competition: number;
    time: number;
    total: number;
  } {
    // Demand factor: Higher demand = higher price (1 + demand * 0.3)
    const demandMultiplier = 1 + factors.demand * 0.3;

    // Competition factor: More competition = lower price (1 - competition * 0.15)
    const competitionMultiplier = 1 - factors.competition * 0.15;

    // Time factor: Peak hours get premium (1 + timeOfDay * 0.2)
    const timeMultiplier = 1 + factors.timeOfDay * 0.2;

    // Day of week factor
    const dayMultiplier = 1 + factors.dayOfWeek * 0.1;

    // Weather factor: Bad weather increases delivery prices
    const weatherMultiplier = factors.weather ? 1 + factors.weather * 0.1 : 1;

    // Seasonality factor
    const seasonalityMultiplier = factors.seasonality
      ? 1 + factors.seasonality * 0.15
      : 1;

    // Inventory factor: Low inventory = higher price
    const inventoryMultiplier = factors.inventory
      ? 1 + (1 - factors.inventory) * 0.2
      : 1;

    // Total multiplier
    const total =
      demandMultiplier *
      competitionMultiplier *
      timeMultiplier *
      dayMultiplier *
      weatherMultiplier *
      seasonalityMultiplier *
      inventoryMultiplier;

    return {
      demand: demandMultiplier,
      competition: competitionMultiplier,
      time: timeMultiplier * dayMultiplier,
      total,
    };
  }

  /**
   * Validate multipliers are within configured bounds
   */
  private validateMultipliers(
    multipliers: { total: number },
    warnings: string[]
  ): { total: number } {
    let validTotal = multipliers.total;

    if (validTotal > this.config.maxPriceMultiplier) {
      warnings.push(
        `Price exceeds max multiplier (${this.config.maxPriceMultiplier}), capping at maximum`
      );
      validTotal = this.config.maxPriceMultiplier;
    }

    if (validTotal < this.config.minPriceMultiplier) {
      warnings.push(
        `Price below min multiplier (${this.config.minPriceMultiplier}), raising to minimum`
      );
      validTotal = this.config.minPriceMultiplier;
    }

    return { total: validTotal };
  }

  /**
   * Estimate expected demand at optimized price
   */
  private estimateDemand(
    basePrice: number,
    optimizedPrice: number,
    factors: PriceFactors
  ): number {
    // Simple demand elasticity model
    const priceRatio = basePrice / optimizedPrice;
    const elasticity = this.config.baseDemandElasticity;

    // Base demand adjusted for price and other factors
    const baseDemand = 100; // Assumed base demand
    const priceEffect = Math.pow(priceRatio, elasticity);
    const demandFactor = 1 + factors.demand * 0.5;
    const timeFactor = 1 + factors.timeOfDay * 0.3;
    const dayFactor = 1 + factors.dayOfWeek * 0.2;

    return baseDemand * priceEffect * demandFactor * timeFactor * dayFactor;
  }

  /**
   * Calculate confidence based on data availability
   */
  private calculateConfidence(itemId: string): number {
    const history = this.priceHistory.get(itemId) || [];

    // More historical data = higher confidence
    if (history.length >= 30) {
      return 0.9;
    }
    if (history.length >= 14) {
      return 0.8;
    }
    if (history.length >= 7) {
      return 0.75;
    }
    if (history.length >= 3) {
      return 0.6;
    }

    return 0.5; // Low confidence for new items
  }

  /**
   * Add price history entry
   */
  addPriceHistory(entry: PriceHistory): void {
    const history = this.priceHistory.get(entry.itemId) || [];
    history.push(entry);

    // Keep only last 90 days
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const filtered = history.filter(h => h.date.getTime() > cutoff);

    this.priceHistory.set(entry.itemId, filtered);
  }

  /**
   * Get price history for an item
   */
  getPriceHistory(itemId: string): PriceHistory[] {
    return this.priceHistory.get(itemId) || [];
  }

  /**
   * Bulk optimize multiple items
   */
  optimizeBatch(itemIds: string[], date: Date = new Date()): OptimizationResult[] {
    return itemIds.map(id => this.optimize(id, date));
  }

  /**
   * Get current configuration
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Factory function
export function createPriceOptimizationModel(
  config?: Partial<OptimizationConfig>
): PriceOptimizationModel {
  return new PriceOptimizationModel(config);
}
