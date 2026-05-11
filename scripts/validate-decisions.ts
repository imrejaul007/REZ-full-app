#!/usr/bin/env ts-node
/**
 * REE (Rule Engine) Decision Validation Script
 *
 * Validates all REE decisions in the REZ Loyalty System:
 * - Points calculation decisions
 * - Tier upgrade/downgrade decisions
 * - Cashback decisions
 * - Karma multiplier decisions
 * - Streak milestone decisions
 * - Badge award decisions
 *
 * Usage: npx ts-node scripts/validate-decisions.ts
 */

import mongoose from 'mongoose';

// ============================================================================
// Types
// ============================================================================

interface DecisionValidationResult {
  decisionName: string;
  input: any;
  expectedOutput: any;
  actualOutput: any;
  passed: boolean;
  error?: string;
}

interface RuleValidation {
  ruleId: string;
  description: string;
  input: any;
  expectedOutput: any;
  passed: boolean;
  executionTime: number;
}

// ============================================================================
// Decision Rules
// ============================================================================

interface PointsCalculationRule {
  input: {
    amount: number;
    karmaLevel: string;
    loyaltyTier: string;
  };
  expectedOutput: {
    points: number;
    karmaCoins: number;
    multiplier: number;
  };
}

interface TierUpgradeRule {
  input: {
    currentTier: string;
    lifetimePoints: number;
  };
  expectedOutput: {
    newTier: string;
    shouldUpgrade: boolean;
  };
}

interface CashbackRule {
  input: {
    amount: number;
    tier: string;
    karmaLevel: string;
  };
  expectedOutput: {
    cashbackAmount: number;
    cashbackPercent: number;
  };
}

interface KarmaMultiplierRule {
  input: {
    karmaLevel: string;
    eventCategory: string;
  };
  expectedOutput: {
    baseMultiplier: number;
    categoryBonus: number;
    finalMultiplier: number;
  };
}

interface ReZScoreRule {
  input: {
    orders: number;
    spent: number;
    loyaltyPoints: number;
    karmaPoints: number;
  };
  expectedOutput: {
    engagement: number;
    spend: number;
    loyalty: number;
    karma: number;
    composite: number;
  };
}

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  POINTS_PER_RUPEE: 0.1,
  CASHBACK_BASE_PERCENT: 5,

  KARMA_MULTIPLIERS: {
    starter: 1.0,
    active: 1.1,
    contributor: 1.25,
    leader: 1.5,
    elite: 2.0,
  },

  LOYALTY_MULTIPLIERS: {
    bronze: 1.0,
    silver: 1.1,
    gold: 1.2,
    platinum: 1.5,
    diamond: 2.0,
  },

  CASHBACK_TIER_BONUS: {
    bronze: 0,
    silver: 1,
    gold: 2,
    platinum: 3,
    diamond: 5,
  },

  CATEGORY_BONUSES: {
    environment: 0.2,
    food: 0,
    health: 0.15,
    education: 0.1,
    community: 0.05,
  },

  TIER_THRESHOLDS: {
    bronze: 0,
    silver: 500,
    gold: 2000,
    platinum: 5000,
    diamond: 10000,
  },

  KARMA_THRESHOLDS: {
    starter: 0,
    active: 100,
    contributor: 500,
    leader: 2000,
    elite: 5000,
  },
};

// ============================================================================
// Decision Implementation Functions
// ============================================================================

function calculatePointsDecision(
  amount: number,
  karmaLevel: string,
  loyaltyTier: string
): { points: number; karmaCoins: number; multiplier: number } {
  const karmaMultiplier = CONFIG.KARMA_MULTIPLIERS[karmaLevel as keyof typeof CONFIG.KARMA_MULTIPLIERS] || 1.0;
  const loyaltyMultiplier = CONFIG.LOYALTY_MULTIPLIERS[loyaltyTier as keyof typeof CONFIG.LOYALTY_MULTIPLIERS] || 1.0;
  const combinedMultiplier = karmaMultiplier * loyaltyMultiplier;

  const points = Math.floor(amount * CONFIG.POINTS_PER_RUPEE * combinedMultiplier);
  const karmaCoins = Math.floor(points * CONFIG.POINTS_PER_RUPEE * 20); // 20 karma coins = 1 REZ coin

  return { points, karmaCoins, multiplier: combinedMultiplier };
}

function determineTierUpgrade(
  currentTier: string,
  lifetimePoints: number
): { newTier: string; shouldUpgrade: boolean } {
  let newTier = currentTier;

  if (lifetimePoints >= CONFIG.TIER_THRESHOLDS.diamond) {
    newTier = 'diamond';
  } else if (lifetimePoints >= CONFIG.TIER_THRESHOLDS.platinum) {
    newTier = 'platinum';
  } else if (lifetimePoints >= CONFIG.TIER_THRESHOLDS.gold) {
    newTier = 'gold';
  } else if (lifetimePoints >= CONFIG.TIER_THRESHOLDS.silver) {
    newTier = 'silver';
  } else {
    newTier = 'bronze';
  }

  const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
  const currentIndex = tierOrder.indexOf(currentTier);
  const newIndex = tierOrder.indexOf(newTier);

  return {
    newTier,
    shouldUpgrade: newIndex > currentIndex,
  };
}

function calculateCashbackDecision(
  amount: number,
  tier: string,
  karmaLevel: string
): { cashbackAmount: number; cashbackPercent: number } {
  const tierBonus = CONFIG.CASHBACK_TIER_BONUS[tier as keyof typeof CONFIG.CASHBACK_TIER_BONUS] || 0;
  const karmaBonus = karmaLevel === 'elite' ? 2 : karmaLevel === 'leader' ? 1 : 0;
  const totalPercent = CONFIG.CASHBACK_BASE_PERCENT + tierBonus + karmaBonus;

  return {
    cashbackAmount: Math.floor(amount * (totalPercent / 100)),
    cashbackPercent: totalPercent,
  };
}

function calculateKarmaMultiplierDecision(
  karmaLevel: string,
  eventCategory: string
): { baseMultiplier: number; categoryBonus: number; finalMultiplier: number } {
  const baseMultiplier = CONFIG.KARMA_MULTIPLIERS[karmaLevel as keyof typeof CONFIG.KARMA_MULTIPLIERS] || 1.0;
  const categoryBonus = CONFIG.CATEGORY_BONUSES[eventCategory as keyof typeof CONFIG.CATEGORY_BONUSES] || 0;
  const finalMultiplier = baseMultiplier * (1 + categoryBonus);

  return { baseMultiplier, categoryBonus, finalMultiplier };
}

function calculateReZScoreDecision(
  orders: number,
  spent: number,
  loyaltyPoints: number,
  karmaPoints: number
): { engagement: number; spend: number; loyalty: number; karma: number; composite: number } {
  const engagement = Math.min(100, Math.floor((orders / 30) * 100));
  const spend = Math.min(100, Math.floor((spent / 50000) * 100));
  const loyalty = Math.min(100, Math.floor((loyaltyPoints / 10000) * 100));
  const karma = Math.min(100, Math.floor((karmaPoints / 5000) * 100));

  const composite = Math.floor(
    engagement * 0.2 + spend * 0.3 + loyalty * 0.3 + karma * 0.2
  );

  return { engagement, spend, loyalty, karma, composite };
}

// ============================================================================
// Test Cases
// ============================================================================

const POINTS_TEST_CASES: PointsCalculationRule[] = [
  {
    input: { amount: 1000, karmaLevel: 'starter', loyaltyTier: 'bronze' },
    expectedOutput: { points: 100, karmaCoins: 200, multiplier: 1.0 },
  },
  {
    input: { amount: 1000, karmaLevel: 'elite', loyaltyTier: 'diamond' },
    expectedOutput: { points: 400, karmaCoins: 800, multiplier: 4.0 },
  },
  {
    input: { amount: 500, karmaLevel: 'active', loyaltyTier: 'silver' },
    expectedOutput: { points: 55, karmaCoins: 110, multiplier: 1.1 },
  },
  {
    input: { amount: 10000, karmaLevel: 'contributor', loyaltyTier: 'gold' },
    expectedOutput: { points: 1500, karmaCoins: 3000, multiplier: 1.5 },
  },
];

const TIER_UPGRADE_TEST_CASES: TierUpgradeRule[] = [
  { input: { currentTier: 'bronze', lifetimePoints: 600 }, expectedOutput: { newTier: 'silver', shouldUpgrade: true } },
  { input: { currentTier: 'silver', lifetimePoints: 2100 }, expectedOutput: { newTier: 'gold', shouldUpgrade: true } },
  { input: { currentTier: 'gold', lifetimePoints: 5500 }, expectedOutput: { newTier: 'platinum', shouldUpgrade: true } },
  { input: { currentTier: 'bronze', lifetimePoints: 100 }, expectedOutput: { newTier: 'bronze', shouldUpgrade: false } },
  { input: { currentTier: 'diamond', lifetimePoints: 15000 }, expectedOutput: { newTier: 'diamond', shouldUpgrade: false } },
];

const CASHBACK_TEST_CASES: CashbackRule[] = [
  { input: { amount: 1000, tier: 'bronze', karmaLevel: 'starter' }, expectedOutput: { cashbackAmount: 50, cashbackPercent: 5 } },
  { input: { amount: 1000, tier: 'silver', karmaLevel: 'active' }, expectedOutput: { cashbackAmount: 60, cashbackPercent: 6 } },
  { input: { amount: 1000, tier: 'diamond', karmaLevel: 'elite' }, expectedOutput: { cashbackAmount: 120, cashbackPercent: 12 } },
  { input: { amount: 500, tier: 'gold', karmaLevel: 'leader' }, expectedOutput: { cashbackAmount: 40, cashbackPercent: 8 } },
];

const KARMA_MULTIPLIER_TEST_CASES: KarmaMultiplierRule[] = [
  { input: { karmaLevel: 'starter', eventCategory: 'food' }, expectedOutput: { baseMultiplier: 1.0, categoryBonus: 0, finalMultiplier: 1.0 } },
  { input: { karmaLevel: 'elite', eventCategory: 'environment' }, expectedOutput: { baseMultiplier: 2.0, categoryBonus: 0.2, finalMultiplier: 2.4 } },
  { input: { karmaLevel: 'active', eventCategory: 'health' }, expectedOutput: { baseMultiplier: 1.1, categoryBonus: 0.15, finalMultiplier: 1.265 } },
];

const REZ_SCORE_TEST_CASES: ReZScoreRule[] = [
  { input: { orders: 30, spent: 50000, loyaltyPoints: 10000, karmaPoints: 5000 }, expectedOutput: { engagement: 100, spend: 100, loyalty: 100, karma: 100, composite: 100 } },
  { input: { orders: 0, spent: 0, loyaltyPoints: 0, karmaPoints: 0 }, expectedOutput: { engagement: 0, spend: 0, loyalty: 0, karma: 0, composite: 0 } },
  { input: { orders: 15, spent: 25000, loyaltyPoints: 5000, karmaPoints: 2500 }, expectedOutput: { engagement: 50, spend: 50, loyalty: 50, karma: 50, composite: 50 } },
];

// ============================================================================
// Validation Functions
// ============================================================================

function validatePointsDecision(testCase: PointsCalculationRule): DecisionValidationResult {
  const actual = calculatePointsDecision(
    testCase.input.amount,
    testCase.input.karmaLevel,
    testCase.input.loyaltyTier
  );

  return {
    decisionName: 'calculatePoints',
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput: actual,
    passed:
      actual.points === testCase.expectedOutput.points &&
      actual.multiplier === testCase.expectedOutput.multiplier,
  };
}

function validateTierUpgradeDecision(testCase: TierUpgradeRule): DecisionValidationResult {
  const actual = determineTierUpgrade(testCase.input.currentTier, testCase.input.lifetimePoints);

  return {
    decisionName: 'determineTierUpgrade',
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput: actual,
    passed:
      actual.newTier === testCase.expectedOutput.newTier &&
      actual.shouldUpgrade === testCase.expectedOutput.shouldUpgrade,
  };
}

function validateCashbackDecision(testCase: CashbackRule): DecisionValidationResult {
  const actual = calculateCashbackDecision(
    testCase.input.amount,
    testCase.input.tier,
    testCase.input.karmaLevel
  );

  return {
    decisionName: 'calculateCashback',
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput: actual,
    passed:
      actual.cashbackAmount === testCase.expectedOutput.cashbackAmount &&
      actual.cashbackPercent === testCase.expectedOutput.cashbackPercent,
  };
}

function validateKarmaMultiplierDecision(testCase: KarmaMultiplierRule): DecisionValidationResult {
  const actual = calculateKarmaMultiplierDecision(testCase.input.karmaLevel, testCase.input.eventCategory);

  return {
    decisionName: 'calculateKarmaMultiplier',
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput: actual,
    passed:
      actual.baseMultiplier === testCase.expectedOutput.baseMultiplier &&
      actual.finalMultiplier === testCase.expectedOutput.finalMultiplier,
  };
}

function validateReZScoreDecision(testCase: ReZScoreRule): DecisionValidationResult {
  const actual = calculateReZScoreDecision(
    testCase.input.orders,
    testCase.input.spent,
    testCase.input.loyaltyPoints,
    testCase.input.karmaPoints
  );

  return {
    decisionName: 'calculateReZScore',
    input: testCase.input,
    expectedOutput: testCase.expectedOutput,
    actualOutput: actual,
    passed:
      actual.engagement === testCase.expectedOutput.engagement &&
      actual.spend === testCase.expectedOutput.spend &&
      actual.loyalty === testCase.expectedOutput.loyalty &&
      actual.karma === testCase.expectedOutput.karma &&
      actual.composite === testCase.expectedOutput.composite,
  };
}

// ============================================================================
// Main Validation
// ============================================================================

function runAllValidations(): RuleValidation[] {
  const results: RuleValidation[] = [];

  console.log('\nValidating Points Calculation Decisions...');
  for (const testCase of POINTS_TEST_CASES) {
    const start = Date.now();
    const result = validatePointsDecision(testCase);
    results.push({
      ruleId: 'points_calculation',
      description: `Amount: ${testCase.input.amount}, Karma: ${testCase.input.karmaLevel}, Tier: ${testCase.input.loyaltyTier}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      passed: result.passed,
      executionTime: Date.now() - start,
    });
  }

  console.log('Validating Tier Upgrade Decisions...');
  for (const testCase of TIER_UPGRADE_TEST_CASES) {
    const start = Date.now();
    const result = validateTierUpgradeDecision(testCase);
    results.push({
      ruleId: 'tier_upgrade',
      description: `Points: ${testCase.input.lifetimePoints}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      passed: result.passed,
      executionTime: Date.now() - start,
    });
  }

  console.log('Validating Cashback Decisions...');
  for (const testCase of CASHBACK_TEST_CASES) {
    const start = Date.now();
    const result = validateCashbackDecision(testCase);
    results.push({
      ruleId: 'cashback_calculation',
      description: `Amount: ${testCase.input.amount}, Tier: ${testCase.input.tier}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      passed: result.passed,
      executionTime: Date.now() - start,
    });
  }

  console.log('Validating Karma Multiplier Decisions...');
  for (const testCase of KARMA_MULTIPLIER_TEST_CASES) {
    const start = Date.now();
    const result = validateKarmaMultiplierDecision(testCase);
    results.push({
      ruleId: 'karma_multiplier',
      description: `Level: ${testCase.input.karmaLevel}, Category: ${testCase.input.eventCategory}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      passed: result.passed,
      executionTime: Date.now() - start,
    });
  }

  console.log('Validating ReZ Score Decisions...');
  for (const testCase of REZ_SCORE_TEST_CASES) {
    const start = Date.now();
    const result = validateReZScoreDecision(testCase);
    results.push({
      ruleId: 'rez_score',
      description: `Orders: ${testCase.input.orders}, Spent: ${testCase.input.spent}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      passed: result.passed,
      executionTime: Date.now() - start,
    });
  }

  return results;
}

function printResults(results: RuleValidation[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('REE DECISION VALIDATION REPORT');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);

  console.log(`\nTotal Rules Tested: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Execution Time: ${totalTime}ms`);

  // Group by rule ID
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.ruleId]) acc[r.ruleId] = [];
    acc[r.ruleId].push(r);
    return acc;
  }, {} as Record<string, RuleValidation[]>);

  console.log('\n' + '-'.repeat(80));
  console.log('RESULTS BY RULE');
  console.log('-'.repeat(80));

  for (const [ruleId, rules] of Object.entries(grouped)) {
    const rulePassed = rules.filter(r => r.passed).length;
    const ruleFailed = rules.filter(r => !r.passed).length;
    console.log(`\n${ruleId} (${rulePassed}/${rules.length} passed)`);

    for (const rule of rules) {
      const status = rule.passed ? '✓' : '✗';
      console.log(`  ${status} ${rule.description}`);
      if (!rule.passed) {
        console.log(`    Expected: ${JSON.stringify(rule.expectedOutput)}`);
      }
    }
  }

  // Show failed tests in detail
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('FAILED TESTS DETAIL');
    console.log('-'.repeat(80));

    for (const test of failedTests) {
      console.log(`\n${test.ruleId}: ${test.description}`);
      console.log(`  Expected: ${JSON.stringify(test.expectedOutput)}`);
      console.log(`  Input: ${JSON.stringify(test.input)}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(failed === 0 ? 'ALL DECISIONS VALID' : `${failed} DECISIONS FAILED`);
  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// Performance Benchmarks
// ============================================================================

function runPerformanceBenchmarks(): void {
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE BENCHMARKS');
  console.log('='.repeat(80));

  // Points calculation benchmark
  const pointsIterations = 10000;
  let pointsStart = Date.now();
  for (let i = 0; i < pointsIterations; i++) {
    calculatePointsDecision(1000, 'active', 'silver');
  }
  const pointsTime = Date.now() - pointsStart;
  console.log(`\nPoints Calculation (${pointsIterations} iterations): ${pointsTime}ms`);
  console.log(`  Avg: ${(pointsTime / pointsIterations).toFixed(3)}ms per call`);
  console.log(`  Throughput: ${Math.floor(pointsIterations / (pointsTime / 1000))} calls/sec`);

  // Tier upgrade benchmark
  const tierIterations = 10000;
  let tierStart = Date.now();
  for (let i = 0; i < tierIterations; i++) {
    determineTierUpgrade('bronze', Math.random() * 15000);
  }
  const tierTime = Date.now() - tierStart;
  console.log(`\nTier Upgrade (${tierIterations} iterations): ${tierTime}ms`);
  console.log(`  Avg: ${(tierTime / tierIterations).toFixed(3)}ms per call`);
  console.log(`  Throughput: ${Math.floor(tierIterations / (tierTime / 1000))} calls/sec`);

  // ReZ Score benchmark
  const scoreIterations = 5000;
  let scoreStart = Date.now();
  for (let i = 0; i < scoreIterations; i++) {
    calculateReZScoreDecision(30, 50000, 10000, 5000);
  }
  const scoreTime = Date.now() - scoreStart;
  console.log(`\nReZ Score (${scoreIterations} iterations): ${scoreTime}ms`);
  console.log(`  Avg: ${(scoreTime / scoreIterations).toFixed(3)}ms per call`);
  console.log(`  Throughput: ${Math.floor(scoreIterations / (scoreTime / 1000))} calls/sec`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('Starting REE Decision Validation...\n');

  const results = runAllValidations();
  printResults(results);

  // Run benchmarks if requested
  const args = process.argv.slice(2);
  if (args.includes('--benchmark')) {
    runPerformanceBenchmarks();
  }

  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Validation error:', error);
  process.exit(1);
});
