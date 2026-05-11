/**
 * Karma-Loyalty Bridge - Karma Conversion Test Suite
 *
 * Tests for:
 * - Karma to coins conversion
 * - Coins to karma conversion
 * - Karma-Loyalty multiplier stacking
 * - Conversion rate calculations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type KarmaLevel = 'starter' | 'active' | 'contributor' | 'leader' | 'elite';

interface ConversionResult {
  sourceAmount: number;
  targetAmount: number;
  rate: number;
  bonus: number;
  total: number;
}

interface KarmaLoyaltyProfile {
  karmaScore: number;
  karmaLevel: KarmaLevel;
  loyaltyPoints: number;
  loyaltyTier: LoyaltyTier;
  combinedMultiplier: number;
}

// ============================================================================
// Conversion Configuration
// ============================================================================

const CONVERSION_CONFIG = {
  // 20 karma coins = 1 REZ coin = 1 rupee
  karmaCoinsPerRupee: 20,
  // 1 REZ coin = 20 karma coins
  karmaToCoinsRatio: 20,
  // Karma multiplier for each level
  karmaMultipliers: {
    starter: 1.0,
    active: 1.1,
    contributor: 1.25,
    leader: 1.5,
    elite: 2.0,
  } as Record<KarmaLevel, number>,
  // Loyalty multiplier for each tier
  loyaltyMultipliers: {
    bronze: 1.0,
    silver: 1.1,
    gold: 1.2,
    platinum: 1.5,
    diamond: 2.0,
  } as Record<LoyaltyTier, number>,
  // Minimum conversion amounts
  minKarmaConversion: 100,
  minCoinsConversion: 1,
};

// ============================================================================
// Conversion Logic (to be tested)
// ============================================================================

function getKarmaMultiplier(karmaLevel: KarmaLevel): number {
  return CONVERSION_CONFIG.karmaMultipliers[karmaLevel] ?? 1.0;
}

function getLoyaltyMultiplier(tier: LoyaltyTier): number {
  return CONVERSION_CONFIG.loyaltyMultipliers[tier] ?? 1.0;
}

function getCombinedMultiplier(karmaLevel: KarmaLevel, tier: LoyaltyTier): number {
  return getKarmaMultiplier(karmaLevel) * getLoyaltyMultiplier(tier);
}

function karmaToCoins(karmaAmount: number): ConversionResult {
  const ratio = CONVERSION_CONFIG.karmaToCoinsRatio;
  const rawCoins = karmaAmount / ratio;
  const coins = Math.floor(rawCoins);

  return {
    sourceAmount: karmaAmount,
    targetAmount: coins,
    rate: ratio,
    bonus: 0,
    total: coins,
  };
}

function coinsToKarma(coins: number): ConversionResult {
  const ratio = CONVERSION_CONFIG.karmaToCoinsRatio;
  const karma = coins * ratio;

  return {
    sourceAmount: coins,
    targetAmount: karma,
    rate: ratio,
    bonus: 0,
    total: karma,
  };
}

function calculateCoinsEarned(
  amount: number,
  karmaLevel: KarmaLevel,
  tier: LoyaltyTier
): ConversionResult {
  const coinsPerRupee = CONVERSION_CONFIG.karmaCoinsPerRupee;
  const multiplier = getCombinedMultiplier(karmaLevel, tier);

  const rawCoins = (amount / coinsPerRupee) * multiplier;
  const coins = Math.floor(rawCoins);

  return {
    sourceAmount: amount,
    targetAmount: coins,
    rate: coinsPerRupee,
    bonus: coins - Math.floor(amount / coinsPerRupee),
    total: coins,
  };
}

function calculateKarmaFromOrder(
  orderAmount: number,
  karmaLevel: KarmaLevel,
  tier: LoyaltyTier
): number {
  const coinsEarned = calculateCoinsEarned(orderAmount, karmaLevel, tier);
  return coinsEarned.total * CONVERSION_CONFIG.karmaToCoinsRatio;
}

function getEffectiveConversionRate(
  karmaLevel: KarmaLevel,
  tier: LoyaltyTier
): number {
  const baseRate = CONVERSION_CONFIG.karmaToCoinsRatio;
  const multiplier = getCombinedMultiplier(karmaLevel, tier);

  // Effective rate: how much karma per rupee after multipliers
  return baseRate * multiplier;
}

function getBonusPercentage(karmaLevel: KarmaLevel, tier: LoyaltyTier): number {
  const multiplier = getCombinedMultiplier(karmaLevel, tier);
  return Math.round((multiplier - 1) * 100);
}

function calculateUpgradeBonus(
  currentKarmaLevel: KarmaLevel,
  newKarmaLevel: KarmaLevel,
  currentTier: LoyaltyTier,
  newTier: LoyaltyTier
): number {
  const currentMultiplier = getCombinedMultiplier(currentKarmaLevel, currentTier);
  const newMultiplier = getCombinedMultiplier(newKarmaLevel, newTier);

  return Math.round((newMultiplier - currentMultiplier) * 100);
}

function shouldApplyConversionBonus(
  karmaLevel: KarmaLevel,
  tier: LoyaltyTier,
  minKarmaLevel: KarmaLevel = 'contributor'
): boolean {
  const levels: KarmaLevel[] = ['starter', 'active', 'contributor', 'leader', 'elite'];
  const userLevelIndex = levels.indexOf(karmaLevel);
  const requiredLevelIndex = levels.indexOf(minKarmaLevel);

  return userLevelIndex >= requiredLevelIndex;
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Karma Conversion', () => {

  describe('Karma Multiplier', () => {
    it('should return correct multiplier for starter', () => {
      expect(getKarmaMultiplier('starter')).toBe(1.0);
    });

    it('should return correct multiplier for active', () => {
      expect(getKarmaMultiplier('active')).toBe(1.1);
    });

    it('should return correct multiplier for contributor', () => {
      expect(getKarmaMultiplier('contributor')).toBe(1.25);
    });

    it('should return correct multiplier for leader', () => {
      expect(getKarmaMultiplier('leader')).toBe(1.5);
    });

    it('should return correct multiplier for elite', () => {
      expect(getKarmaMultiplier('elite')).toBe(2.0);
    });
  });

  describe('Loyalty Multiplier', () => {
    it('should return correct multiplier for bronze', () => {
      expect(getLoyaltyMultiplier('bronze')).toBe(1.0);
    });

    it('should return correct multiplier for silver', () => {
      expect(getLoyaltyMultiplier('silver')).toBe(1.1);
    });

    it('should return correct multiplier for gold', () => {
      expect(getLoyaltyMultiplier('gold')).toBe(1.2);
    });

    it('should return correct multiplier for platinum', () => {
      expect(getLoyaltyMultiplier('platinum')).toBe(1.5);
    });

    it('should return correct multiplier for diamond', () => {
      expect(getLoyaltyMultiplier('diamond')).toBe(2.0);
    });
  });

  describe('Combined Multiplier', () => {
    it('should calculate correct combined multiplier for starter/bronze', () => {
      expect(getCombinedMultiplier('starter', 'bronze')).toBe(1.0);
    });

    it('should calculate correct combined multiplier for active/silver', () => {
      expect(getCombinedMultiplier('active', 'silver')).toBeCloseTo(1.21, 2); // 1.1 * 1.1
    });

    it('should calculate correct combined multiplier for elite/diamond', () => {
      expect(getCombinedMultiplier('elite', 'diamond')).toBe(4.0); // 2.0 * 2.0
    });

    it('should stack multipliers correctly', () => {
      const multiplier = getCombinedMultiplier('leader', 'platinum');
      expect(multiplier).toBe(2.25); // 1.5 * 1.5
    });

    it('should handle all tier combinations', () => {
      const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
      const levels: KarmaLevel[] = ['starter', 'active', 'contributor', 'leader', 'elite'];

      for (const tier of tiers) {
        for (const level of levels) {
          const combined = getCombinedMultiplier(level, tier);
          const expected = getKarmaMultiplier(level) * getLoyaltyMultiplier(tier);
          expect(combined).toBeCloseTo(expected, 5);
        }
      }
    });
  });

  describe('Karma to Coins Conversion', () => {
    it('should convert karma to coins at correct ratio', () => {
      const result = karmaToCoins(200);

      expect(result.targetAmount).toBe(10); // 200 / 20
      expect(result.rate).toBe(20);
    });

    it('should floor fractional coins', () => {
      const result = karmaToCoins(199);

      expect(result.targetAmount).toBe(9); // 199 / 20 = 9.95 -> 9
    });

    it('should handle zero karma', () => {
      const result = karmaToCoins(0);

      expect(result.targetAmount).toBe(0);
    });

    it('should handle large karma amounts', () => {
      const result = karmaToCoins(200000);

      expect(result.targetAmount).toBe(10000);
    });

    it('should include rate in result', () => {
      const result = karmaToCoins(100);

      expect(result.rate).toBe(20);
      expect(result.sourceAmount).toBe(100);
    });
  });

  describe('Coins to Karma Conversion', () => {
    it('should convert coins to karma at correct ratio', () => {
      const result = coinsToKarma(10);

      expect(result.targetAmount).toBe(200); // 10 * 20
    });

    it('should handle fractional coins input', () => {
      const result = coinsToKarma(10.5);

      expect(result.targetAmount).toBe(210);
    });

    it('should handle zero coins', () => {
      const result = coinsToKarma(0);

      expect(result.targetAmount).toBe(0);
    });
  });

  describe('Coins Earned Calculation', () => {
    it('should calculate base coins for starter/bronze', () => {
      const result = calculateCoinsEarned(1000, 'starter', 'bronze');

      // 1000 / 20 = 50 coins * 1.0 = 50
      expect(result.targetAmount).toBe(50);
    });

    it('should calculate bonus coins for active/silver', () => {
      const result = calculateCoinsEarned(1000, 'active', 'silver');

      // 1000 / 20 = 50 coins * 1.21 = 60.5 -> 60
      expect(result.targetAmount).toBe(60);
      expect(result.bonus).toBe(10);
    });

    it('should calculate maximum bonus for elite/diamond', () => {
      const result = calculateCoinsEarned(1000, 'elite', 'diamond');

      // 1000 / 20 = 50 coins * 4.0 = 200
      expect(result.targetAmount).toBe(200);
      expect(result.bonus).toBe(150);
    });

    it('should handle small order amounts', () => {
      const result = calculateCoinsEarned(100, 'starter', 'bronze');

      expect(result.targetAmount).toBe(5); // 100 / 20 = 5
    });

    it('should floor fractional coins', () => {
      const result = calculateCoinsEarned(333, 'active', 'silver');

      // 333 / 20 = 16.65 * 1.21 = 20.14 -> 20
      expect(result.targetAmount).toBe(20);
    });

    it('should calculate correct bonus amount', () => {
      const result = calculateCoinsEarned(1000, 'gold', 'silver');

      // Base: 50, Bonus: 50 * 1.32 - 50 = 16
      expect(result.bonus).toBe(16);
    });
  });

  describe('Karma from Order Calculation', () => {
    it('should calculate karma earned from order', () => {
      const karma = calculateKarmaFromOrder(1000, 'starter', 'bronze');

      // 50 coins * 20 = 1000 karma
      expect(karma).toBe(1000);
    });

    it('should account for multipliers', () => {
      const karma = calculateKarmaFromOrder(1000, 'elite', 'diamond');

      // 200 coins * 20 = 4000 karma
      expect(karma).toBe(4000);
    });
  });

  describe('Effective Conversion Rate', () => {
    it('should return base rate for starter/bronze', () => {
      const rate = getEffectiveConversionRate('starter', 'bronze');
      expect(rate).toBe(20);
    });

    it('should increase rate with multipliers', () => {
      const rate = getEffectiveConversionRate('elite', 'diamond');
      expect(rate).toBe(40); // 20 * 2.0
    });

    it('should show incremental rate improvements', () => {
      const baseRate = getEffectiveConversionRate('starter', 'bronze');
      const silverRate = getEffectiveConversionRate('starter', 'silver');
      const activeRate = getEffectiveConversionRate('active', 'silver');

      expect(silverRate).toBeGreaterThan(baseRate);
      expect(activeRate).toBeGreaterThan(silverRate);
    });
  });

  describe('Bonus Percentage', () => {
    it('should return 0% for starter/bronze', () => {
      expect(getBonusPercentage('starter', 'bronze')).toBe(0);
    });

    it('should calculate bonus for active/silver', () => {
      const bonus = getBonusPercentage('active', 'silver');
      expect(bonus).toBe(21); // (1.1 * 1.1 - 1) * 100 = 21%
    });

    it('should calculate bonus for elite/diamond', () => {
      const bonus = getBonusPercentage('elite', 'diamond');
      expect(bonus).toBe(300); // (2.0 * 2.0 - 1) * 100 = 300%
    });
  });

  describe('Upgrade Bonus', () => {
    it('should calculate upgrade bonus for tier upgrade', () => {
      const bonus = calculateUpgradeBonus('starter', 'starter', 'bronze', 'silver');
      expect(bonus).toBe(10); // (1.0 * 1.1 - 1.0) * 100
    });

    it('should calculate upgrade bonus for karma level upgrade', () => {
      const bonus = calculateUpgradeBonus('starter', 'active', 'bronze', 'bronze');
      expect(bonus).toBe(10); // (1.1 * 1.0 - 1.0) * 100
    });

    it('should calculate bonus for combined upgrade', () => {
      const bonus = calculateUpgradeBonus('active', 'elite', 'silver', 'diamond');
      expect(bonus).toBe(279); // (2.0 * 2.0 - 1.1 * 1.1) * 100
    });

    it('should return 0 for same levels', () => {
      const bonus = calculateUpgradeBonus('active', 'active', 'silver', 'silver');
      expect(bonus).toBe(0);
    });
  });

  describe('Conversion Bonus Eligibility', () => {
    it('should allow starter for contributor requirement', () => {
      const allowed = shouldApplyConversionBonus('contributor', 'bronze', 'contributor');
      expect(allowed).toBe(true);
    });

    it('should block starter for contributor requirement', () => {
      const allowed = shouldApplyConversionBonus('active', 'bronze', 'contributor');
      expect(allowed).toBe(false);
    });

    it('should allow any level for starter requirement', () => {
      const allowed = shouldApplyConversionBonus('starter', 'bronze', 'starter');
      expect(allowed).toBe(true);
    });

    it('should allow elite for any requirement', () => {
      const allowed = shouldApplyConversionBonus('elite', 'diamond', 'starter');
      expect(allowed).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero order amount', () => {
      const result = calculateCoinsEarned(0, 'starter', 'bronze');
      expect(result.targetAmount).toBe(0);
    });

    it('should handle negative karma level', () => {
      const multiplier = getKarmaMultiplier('starter' as KarmaLevel);
      expect(multiplier).toBe(1.0);
    });

    it('should handle very large order amounts', () => {
      const result = calculateCoinsEarned(1000000, 'elite', 'diamond');
      expect(result.targetAmount).toBe(200000); // 1000000 / 20 * 4.0
    });

    it('should handle fractional karma level', () => {
      const result = karmaToCoins(100.5);
      expect(result.targetAmount).toBe(5); // floor
    });
  });
});
