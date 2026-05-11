/**
 * Karma-Loyalty Bridge - Level Bonus Test Suite
 *
 * Tests for:
 * - Karma level bonus calculations
 * - Loyalty tier bonus calculations
 * - Combined level bonuses
 * - Bonus thresholds and caps
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type KarmaLevel = 'starter' | 'active' | 'contributor' | 'leader' | 'elite';

interface LevelBonusConfig {
  karmaBonus: Record<KarmaLevel, number>;
  tierBonus: Record<LoyaltyTier, number>;
  comboBonus: number;
  maxBonus: number;
}

interface BonusResult {
  baseBonus: number;
  karmaBonus: number;
  tierBonus: number;
  comboBonus: number;
  total: number;
}

interface LevelBenefit {
  level: KarmaLevel | LoyaltyTier;
  bonusPercent: number;
  cashbackPercent: number;
  priorityAccess: boolean;
}

// ============================================================================
// Bonus Configuration
// ============================================================================

const LEVEL_BONUS_CONFIG: LevelBonusConfig = {
  karmaBonus: {
    starter: 0,
    active: 5,
    contributor: 10,
    leader: 20,
    elite: 30,
  },
  tierBonus: {
    bronze: 0,
    silver: 2,
    gold: 5,
    platinum: 10,
    diamond: 15,
  },
  comboBonus: 5, // Extra bonus when both karma and tier are high
  maxBonus: 50, // Maximum bonus percentage
};

// ============================================================================
// Level Benefit Definitions
// ============================================================================

const KARMA_LEVEL_BENEFITS: Record<KarmaLevel, LevelBenefit> = {
  starter: { level: 'starter', bonusPercent: 0, cashbackPercent: 0, priorityAccess: false },
  active: { level: 'active', bonusPercent: 5, cashbackPercent: 1, priorityAccess: false },
  contributor: { level: 'contributor', bonusPercent: 10, cashbackPercent: 2, priorityAccess: true },
  leader: { level: 'leader', bonusPercent: 20, cashbackPercent: 3, priorityAccess: true },
  elite: { level: 'elite', bonusPercent: 30, cashbackPercent: 5, priorityAccess: true },
};

const TIER_BENEFITS: Record<LoyaltyTier, LevelBenefit> = {
  bronze: { level: 'bronze', bonusPercent: 0, cashbackPercent: 1, priorityAccess: false },
  silver: { level: 'silver', bonusPercent: 2, cashbackPercent: 2, priorityAccess: false },
  gold: { level: 'gold', bonusPercent: 5, cashbackPercent: 3, priorityAccess: true },
  platinum: { level: 'platinum', bonusPercent: 10, cashbackPercent: 5, priorityAccess: true },
  diamond: { level: 'diamond', bonusPercent: 15, cashbackPercent: 8, priorityAccess: true },
};

// ============================================================================
// Bonus Calculation Logic (to be tested)
// ============================================================================

function getKarmaBonus(karmaLevel: KarmaLevel): number {
  return LEVEL_BONUS_CONFIG.karmaBonus[karmaLevel] ?? 0;
}

function getTierBonus(tier: LoyaltyTier): number {
  return LEVEL_BONUS_CONFIG.tierBonus[tier] ?? 0;
}

function shouldGetComboBonus(karmaLevel: KarmaLevel, tier: LoyaltyTier): boolean {
  // Combo bonus when karma is contributor+ AND tier is gold+
  const highKarmaLevels: KarmaLevel[] = ['contributor', 'leader', 'elite'];
  const highTiers: LoyaltyTier[] = ['gold', 'platinum', 'diamond'];

  return highKarmaLevels.includes(karmaLevel) && highTiers.includes(tier);
}

function calculateLevelBonus(
  baseAmount: number,
  karmaLevel: KarmaLevel,
  tier: LoyaltyTier
): BonusResult {
  const karmaBonusPercent = getKarmaBonus(karmaLevel);
  const tierBonusPercent = getTierBonus(tier);
  const hasCombo = shouldGetComboBonus(karmaLevel, tier);
  const comboBonusPercent = hasCombo ? LEVEL_BONUS_CONFIG.comboBonus : 0;

  const karmaBonus = Math.floor(baseAmount * (karmaBonusPercent / 100));
  const tierBonus = Math.floor(baseAmount * (tierBonusPercent / 100));
  const comboBonus = Math.floor(baseAmount * (comboBonusPercent / 100));

  const total = karmaBonus + tierBonus + comboBonus;

  return {
    baseBonus: baseAmount,
    karmaBonus,
    tierBonus,
    comboBonus,
    total,
  };
}

function getKarmaLevelBenefit(karmaLevel: KarmaLevel): LevelBenefit {
  return KARMA_LEVEL_BENEFITS[karmaLevel] ?? KARMA_LEVEL_BENEFITS.starter;
}

function getTierBenefit(tier: LoyaltyTier): LevelBenefit {
  return TIER_BENEFITS[tier] ?? TIER_BENEFITS.bronze;
}

function getCombinedCashbackPercent(karmaLevel: KarmaLevel, tier: LoyaltyTier): number {
  const karmaBenefit = getKarmaLevelBenefit(karmaLevel);
  const tierBenefit = getTierBenefit(tier);

  return karmaBenefit.cashbackPercent + tierBenefit.cashbackPercent;
}

function getTotalBonusPercent(karmaLevel: KarmaLevel, tier: LoyaltyTier): number {
  const karmaBenefit = getKarmaLevelBenefit(karmaLevel);
  const tierBenefit = getTierBenefit(tier);
  const hasCombo = shouldGetComboBonus(karmaLevel, tier);
  const combo = hasCombo ? LEVEL_BONUS_CONFIG.comboBonus : 0;

  return karmaBenefit.bonusPercent + tierBenefit.bonusPercent + combo;
}

function hasPriorityAccess(karmaLevel: KarmaLevel, tier: LoyaltyTier): boolean {
  const karmaBenefit = getKarmaLevelBenefit(karmaLevel);
  const tierBenefit = getTierBenefit(tier);

  return karmaBenefit.priorityAccess || tierBenefit.priorityAccess;
}

function calculateCashback(amount: number, karmaLevel: KarmaLevel, tier: LoyaltyTier): number {
  const percent = getCombinedCashbackPercent(karmaLevel, tier);
  return Math.floor(amount * (percent / 100) * 100) / 100;
}

function getLevelProgressInfo(
  currentLevel: KarmaLevel | LoyaltyTier,
  currentPoints: number,
  isKarma: boolean
): { nextLevel: KarmaLevel | LoyaltyTier | null; pointsNeeded: number; progress: number } {
  if (isKarma) {
    return getKarmaProgress(currentLevel as KarmaLevel, currentPoints);
  }
  return getTierProgress(currentLevel as LoyaltyTier, currentPoints);
}

function getKarmaProgress(karmaLevel: KarmaLevel, currentPoints: number): {
  nextLevel: KarmaLevel | null;
  pointsNeeded: number;
  progress: number;
} {
  const thresholds: Record<KarmaLevel, number> = {
    starter: 0,
    active: 100,
    contributor: 500,
    leader: 2000,
    elite: 5000,
  };

  const levels: KarmaLevel[] = ['starter', 'active', 'contributor', 'leader', 'elite'];
  const currentIndex = levels.indexOf(karmaLevel);

  if (currentIndex === levels.length - 1) {
    return { nextLevel: null, pointsNeeded: 0, progress: 100 };
  }

  const nextLevel = levels[currentIndex + 1];
  const nextThreshold = thresholds[nextLevel];
  const currentThreshold = thresholds[karmaLevel];
  const range = nextThreshold - currentThreshold;
  const progress = Math.min(100, Math.round(((currentPoints - currentThreshold) / range) * 100));
  const pointsNeeded = Math.max(0, nextThreshold - currentPoints);

  return { nextLevel, pointsNeeded, progress };
}

function getTierProgress(tier: LoyaltyTier, currentPoints: number): {
  nextLevel: LoyaltyTier | null;
  pointsNeeded: number;
  progress: number;
} {
  const thresholds: Record<LoyaltyTier, number> = {
    bronze: 0,
    silver: 500,
    gold: 2000,
    platinum: 5000,
    diamond: 10000,
  };

  const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tiers.indexOf(tier);

  if (currentIndex === tiers.length - 1) {
    return { nextLevel: null, pointsNeeded: 0, progress: 100 };
  }

  const nextLevel = tiers[currentIndex + 1];
  const nextThreshold = thresholds[nextLevel];
  const currentThreshold = thresholds[tier];
  const range = nextThreshold - currentThreshold;
  const progress = Math.min(100, Math.round(((currentPoints - currentThreshold) / range) * 100));
  const pointsNeeded = Math.max(0, nextThreshold - currentPoints);

  return { nextLevel, pointsNeeded, progress };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Level Bonus', () => {

  describe('Karma Bonus', () => {
    it('should return 0% for starter', () => {
      expect(getKarmaBonus('starter')).toBe(0);
    });

    it('should return correct bonus for active', () => {
      expect(getKarmaBonus('active')).toBe(5);
    });

    it('should return correct bonus for contributor', () => {
      expect(getKarmaBonus('contributor')).toBe(10);
    });

    it('should return correct bonus for leader', () => {
      expect(getKarmaBonus('leader')).toBe(20);
    });

    it('should return correct bonus for elite', () => {
      expect(getKarmaBonus('elite')).toBe(30);
    });
  });

  describe('Tier Bonus', () => {
    it('should return 0% for bronze', () => {
      expect(getTierBonus('bronze')).toBe(0);
    });

    it('should return correct bonus for silver', () => {
      expect(getTierBonus('silver')).toBe(2);
    });

    it('should return correct bonus for gold', () => {
      expect(getTierBonus('gold')).toBe(5);
    });

    it('should return correct bonus for platinum', () => {
      expect(getTierBonus('platinum')).toBe(10);
    });

    it('should return correct bonus for diamond', () => {
      expect(getTierBonus('diamond')).toBe(15);
    });
  });

  describe('Combo Bonus Eligibility', () => {
    it('should give combo for contributor/gold', () => {
      expect(shouldGetComboBonus('contributor', 'gold')).toBe(true);
    });

    it('should give combo for leader/platinum', () => {
      expect(shouldGetComboBonus('leader', 'platinum')).toBe(true);
    });

    it('should give combo for elite/diamond', () => {
      expect(shouldGetComboBonus('elite', 'diamond')).toBe(true);
    });

    it('should not give combo for starter/bronze', () => {
      expect(shouldGetComboBonus('starter', 'bronze')).toBe(false);
    });

    it('should not give combo for active/gold', () => {
      expect(shouldGetComboBonus('active', 'gold')).toBe(false);
    });

    it('should not give combo for contributor/silver', () => {
      expect(shouldGetComboBonus('contributor', 'silver')).toBe(false);
    });
  });

  describe('Level Bonus Calculation', () => {
    it('should calculate correct bonus for starter/bronze', () => {
      const result = calculateLevelBonus(1000, 'starter', 'bronze');

      expect(result.karmaBonus).toBe(0);
      expect(result.tierBonus).toBe(0);
      expect(result.comboBonus).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should calculate correct bonus for active/silver', () => {
      const result = calculateLevelBonus(1000, 'active', 'silver');

      expect(result.karmaBonus).toBe(50); // 5%
      expect(result.tierBonus).toBe(20); // 2%
      expect(result.comboBonus).toBe(0);
      expect(result.total).toBe(70);
    });

    it('should include combo bonus when eligible', () => {
      const result = calculateLevelBonus(1000, 'contributor', 'gold');

      expect(result.karmaBonus).toBe(100); // 10%
      expect(result.tierBonus).toBe(50); // 5%
      expect(result.comboBonus).toBe(50); // 5%
      expect(result.total).toBe(200);
    });

    it('should calculate max bonus for elite/diamond', () => {
      const result = calculateLevelBonus(1000, 'elite', 'diamond');

      expect(result.karmaBonus).toBe(300); // 30%
      expect(result.tierBonus).toBe(150); // 15%
      expect(result.comboBonus).toBe(50); // 5%
      expect(result.total).toBe(500);
    });

    it('should floor fractional bonuses', () => {
      const result = calculateLevelBonus(333, 'active', 'silver');

      // 333 * 0.05 = 16.65 -> 16
      // 333 * 0.02 = 6.66 -> 6
      expect(result.karmaBonus).toBe(16);
      expect(result.tierBonus).toBe(6);
    });
  });

  describe('Karma Level Benefits', () => {
    it('should return correct benefits for starter', () => {
      const benefit = getKarmaLevelBenefit('starter');

      expect(benefit.bonusPercent).toBe(0);
      expect(benefit.cashbackPercent).toBe(0);
      expect(benefit.priorityAccess).toBe(false);
    });

    it('should return correct benefits for active', () => {
      const benefit = getKarmaLevelBenefit('active');

      expect(benefit.bonusPercent).toBe(5);
      expect(benefit.cashbackPercent).toBe(1);
      expect(benefit.priorityAccess).toBe(false);
    });

    it('should return correct benefits for contributor', () => {
      const benefit = getKarmaLevelBenefit('contributor');

      expect(benefit.bonusPercent).toBe(10);
      expect(benefit.cashbackPercent).toBe(2);
      expect(benefit.priorityAccess).toBe(true);
    });

    it('should return correct benefits for leader', () => {
      const benefit = getKarmaLevelBenefit('leader');

      expect(benefit.bonusPercent).toBe(20);
      expect(benefit.cashbackPercent).toBe(3);
    });

    it('should return correct benefits for elite', () => {
      const benefit = getKarmaLevelBenefit('elite');

      expect(benefit.bonusPercent).toBe(30);
      expect(benefit.cashbackPercent).toBe(5);
    });
  });

  describe('Tier Benefits', () => {
    it('should return correct benefits for bronze', () => {
      const benefit = getTierBenefit('bronze');

      expect(benefit.bonusPercent).toBe(0);
      expect(benefit.cashbackPercent).toBe(1);
      expect(benefit.priorityAccess).toBe(false);
    });

    it('should return correct benefits for gold', () => {
      const benefit = getTierBenefit('gold');

      expect(benefit.bonusPercent).toBe(5);
      expect(benefit.cashbackPercent).toBe(3);
      expect(benefit.priorityAccess).toBe(true);
    });

    it('should return correct benefits for diamond', () => {
      const benefit = getTierBenefit('diamond');

      expect(benefit.bonusPercent).toBe(15);
      expect(benefit.cashbackPercent).toBe(8);
    });
  });

  describe('Combined Cashback', () => {
    it('should combine cashback for starter/bronze', () => {
      const percent = getCombinedCashbackPercent('starter', 'bronze');
      expect(percent).toBe(1); // 0 + 1
    });

    it('should combine cashback for active/silver', () => {
      const percent = getCombinedCashbackPercent('active', 'silver');
      expect(percent).toBe(3); // 1 + 2
    });

    it('should combine cashback for elite/diamond', () => {
      const percent = getCombinedCashbackPercent('elite', 'diamond');
      expect(percent).toBe(13); // 5 + 8
    });

    it('should handle max combination', () => {
      const percent = getCombinedCashbackPercent('elite', 'diamond');
      expect(percent).toBeLessThanOrEqual(15);
    });
  });

  describe('Total Bonus Percent', () => {
    it('should calculate total for starter/bronze', () => {
      const total = getTotalBonusPercent('starter', 'bronze');
      expect(total).toBe(0);
    });

    it('should calculate total for active/silver', () => {
      const total = getTotalBonusPercent('active', 'silver');
      expect(total).toBe(7); // 5 + 2
    });

    it('should include combo in total when eligible', () => {
      const total = getTotalBonusPercent('contributor', 'gold');
      expect(total).toBe(20); // 10 + 5 + 5
    });

    it('should calculate max total', () => {
      const total = getTotalBonusPercent('elite', 'diamond');
      expect(total).toBe(50); // 30 + 15 + 5
    });
  });

  describe('Priority Access', () => {
    it('should deny priority for starter/bronze', () => {
      expect(hasPriorityAccess('starter', 'bronze')).toBe(false);
    });

    it('should deny priority for active/bronze', () => {
      expect(hasPriorityAccess('active', 'bronze')).toBe(false);
    });

    it('should grant priority for contributor/bronze', () => {
      expect(hasPriorityAccess('contributor', 'bronze')).toBe(true);
    });

    it('should grant priority for starter/gold', () => {
      expect(hasPriorityAccess('starter', 'gold')).toBe(true);
    });

    it('should grant priority for any level with platinum', () => {
      expect(hasPriorityAccess('starter', 'platinum')).toBe(true);
      expect(hasPriorityAccess('active', 'platinum')).toBe(true);
    });
  });

  describe('Cashback Calculation', () => {
    it('should calculate cashback correctly', () => {
      const cashback = calculateCashback(1000, 'starter', 'bronze');
      expect(cashback).toBe(10); // 1000 * 0.01
    });

    it('should combine cashback from both sources', () => {
      const cashback = calculateCashback(1000, 'active', 'silver');
      expect(cashback).toBe(30); // 1000 * 0.03
    });

    it('should handle max cashback', () => {
      const cashback = calculateCashback(1000, 'elite', 'diamond');
      expect(cashback).toBe(130); // 1000 * 0.13
    });

    it('should floor fractional cashback', () => {
      const cashback = calculateCashback(333, 'active', 'silver');
      expect(cashback).toBe(9); // 333 * 0.03 = 9.99 -> 9
    });
  });

  describe('Karma Progress', () => {
    it('should calculate progress for starter', () => {
      const progress = getKarmaProgress('starter', 50);

      expect(progress.nextLevel).toBe('active');
      expect(progress.pointsNeeded).toBe(50);
      expect(progress.progress).toBe(50);
    });

    it('should calculate progress for mid-level', () => {
      const progress = getKarmaProgress('active', 300);

      expect(progress.nextLevel).toBe('contributor');
      expect(progress.progress).toBeGreaterThan(0);
      expect(progress.progress).toBeLessThan(100);
    });

    it('should return null for max level', () => {
      const progress = getKarmaProgress('elite', 10000);

      expect(progress.nextLevel).toBeNull();
      expect(progress.progress).toBe(100);
    });

    it('should handle points at exact threshold', () => {
      const progress = getKarmaProgress('active', 100);

      expect(progress.progress).toBe(0);
      expect(progress.nextLevel).toBe('contributor');
    });
  });

  describe('Tier Progress', () => {
    it('should calculate progress for bronze', () => {
      const progress = getTierProgress('bronze', 250);

      expect(progress.nextLevel).toBe('silver');
      expect(progress.pointsNeeded).toBe(250);
      expect(progress.progress).toBe(50);
    });

    it('should calculate progress for gold', () => {
      const progress = getTierProgress('gold', 3000);

      expect(progress.nextLevel).toBe('platinum');
      expect(progress.pointsNeeded).toBe(2000);
    });

    it('should return null for diamond', () => {
      const progress = getTierProgress('diamond', 20000);

      expect(progress.nextLevel).toBeNull();
      expect(progress.progress).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero base amount', () => {
      const result = calculateLevelBonus(0, 'elite', 'diamond');
      expect(result.total).toBe(0);
    });

    it('should handle negative karma level', () => {
      const bonus = getKarmaBonus('starter' as KarmaLevel);
      expect(bonus).toBe(0);
    });

    it('should handle negative tier', () => {
      const bonus = getTierBonus('bronze' as LoyaltyTier);
      expect(bonus).toBe(0);
    });

    it('should cap progress at 100', () => {
      const progress = getKarmaProgress('active', 10000);
      expect(progress.progress).toBe(100);
    });
  });
});
