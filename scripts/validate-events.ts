#!/usr/bin/env ts-node
/**
 * Event Schema Validation Script
 *
 * Validates all event schemas in the REZ Loyalty System:
 * - Order events
 * - Karma events
 * - Streak events
 * - Badge events
 * - Wallet events
 *
 * Usage: npx ts-node scripts/validate-events.ts
 */

import mongoose from 'mongoose';

// ============================================================================
// Event Type Definitions
// ============================================================================

interface EventValidationResult {
  eventName: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationReport {
  timestamp: Date;
  totalEvents: number;
  passed: number;
  failed: number;
  results: EventValidationResult[];
}

// ============================================================================
// Event Schemas
// ============================================================================

// Order Events
const ORDER_EVENTS = {
  order_created: {
    required: ['orderId', 'userId', 'merchantId', 'items', 'totals'],
    optional: ['source', 'couponCode', 'deliveryAddress'],
    payload: {
      orderId: 'string (unique)',
      userId: 'string (user reference)',
      merchantId: 'string (merchant reference)',
      items: 'Array<{itemId, name, quantity, price}>',
      totals: '{subtotal, tax, discount, total}',
      source: "'menu_qr' | 'room_service' | 'delivery'",
    },
  },

  order_payment_initiated: {
    required: ['orderId', 'paymentId', 'amount'],
    optional: ['paymentMethod', 'idempotencyKey'],
    payload: {
      orderId: 'string',
      paymentId: 'string',
      amount: 'number (in paisa)',
      paymentMethod: "'card' | 'upi' | 'wallet'",
    },
  },

  order_payment_completed: {
    required: ['orderId', 'paymentId', 'transactionId'],
    optional: ['gatewayResponse', 'cashbackAmount'],
    payload: {
      orderId: 'string',
      paymentId: 'string',
      transactionId: 'string (razorpay)',
      gatewayResponse: 'object',
      cashbackAmount: 'number',
    },
  },

  order_completed: {
    required: ['orderId', 'userId', 'total', 'pointsEarned'],
    optional: ['cashbackEarned', 'tier', 'multipliers'],
    payload: {
      orderId: 'string',
      userId: 'string',
      total: 'number',
      pointsEarned: 'number',
      cashbackEarned: 'number',
      tier: 'string',
      karmaMultiplier: 'number',
      loyaltyMultiplier: 'number',
    },
  },

  order_cancelled: {
    required: ['orderId', 'userId', 'reason'],
    optional: ['refundAmount', 'refundStatus'],
    payload: {
      orderId: 'string',
      userId: 'string',
      reason: 'string',
      refundAmount: 'number',
      refundStatus: "'pending' | 'completed' | 'failed'",
    },
  },
};

// Karma Events
const KARMA_EVENTS = {
  karma_event_joined: {
    required: ['eventId', 'userId', 'category', 'startTime'],
    optional: ['expectedDuration', 'karmaPoints'],
    payload: {
      eventId: 'string',
      userId: 'string',
      category: "'environment' | 'food' | 'health' | 'education' | 'community'",
      startTime: 'ISO date string',
      expectedDuration: 'number (hours)',
    },
  },

  karma_event_completed: {
    required: ['eventId', 'userId', 'actualDuration', 'karmaEarned'],
    optional: ['coinsEarned', 'badgeAwarded'],
    payload: {
      eventId: 'string',
      userId: 'string',
      actualDuration: 'number (hours)',
      karmaEarned: 'number',
      coinsEarned: 'number',
      badgeAwarded: '{id, name, rarity}',
    },
  },

  karma_level_up: {
    required: ['userId', 'oldLevel', 'newLevel', 'karmaScore'],
    optional: ['benefits', 'multiplier'],
    payload: {
      userId: 'string',
      oldLevel: 'string',
      newLevel: 'string',
      karmaScore: 'number',
      benefits: 'string[]',
      multiplier: 'number',
    },
  },
};

// Streak Events
const STREAK_EVENTS = {
  streak_checkin: {
    required: ['userId', 'streakType', 'currentStreak', 'coinsEarned'],
    optional: ['isMilestone', 'milestoneDay'],
    payload: {
      userId: 'string',
      streakType: "'login' | 'order' | 'review' | 'savings' | 'visit'",
      currentStreak: 'number',
      coinsEarned: 'number',
      isMilestone: 'boolean',
      milestoneDay: 'number (optional)',
    },
  },

  streak_milestone_reached: {
    required: ['userId', 'streakType', 'day', 'coinsRewarded', 'badgeRewarded'],
    optional: ['streakFrozen'],
    payload: {
      userId: 'string',
      streakType: 'string',
      day: 'number',
      coinsRewarded: 'number',
      badgeRewarded: '{id, name, rarity}',
      streakFrozen: 'boolean',
    },
  },

  streak_frozen: {
    required: ['userId', 'streakType', 'expiresAt'],
    optional: ['reason'],
    payload: {
      userId: 'string',
      streakType: 'string',
      expiresAt: 'ISO date string',
      reason: 'string',
    },
  },

  streak_broken: {
    required: ['userId', 'streakType', 'lastStreak', 'reason'],
    optional: [],
    payload: {
      userId: 'string',
      streakType: 'string',
      lastStreak: 'number',
      reason: "'missed_day' | 'frozen_expired'",
    },
  },
};

// Badge Events
const BADGE_EVENTS = {
  badge_earned: {
    required: ['userId', 'badgeId', 'badgeName', 'rarity'],
    optional: ['source', 'category', 'description'],
    payload: {
      userId: 'string',
      badgeId: 'string',
      badgeName: 'string',
      rarity: "'common' | 'rare' | 'epic' | 'legendary'",
      source: "'karma' | 'loyalty' | 'streak' | 'cross'",
      category: 'string (optional)',
      description: 'string',
    },
  },

  badge_claimed: {
    required: ['userId', 'badgeId', 'coinsClaimed'],
    optional: ['cashbackClaimed'],
    payload: {
      userId: 'string',
      badgeId: 'string',
      coinsClaimed: 'number',
      cashbackClaimed: 'number',
    },
  },
};

// Wallet Events
const WALLET_EVENTS = {
  coins_credited: {
    required: ['userId', 'amount', 'source', 'transactionId'],
    optional: ['description', 'expiresAt'],
    payload: {
      userId: 'string',
      amount: 'number',
      source: "'order' | 'karma' | 'streak' | 'milestone' | 'referral' | 'bonus'",
      transactionId: 'string',
      description: 'string',
      expiresAt: 'ISO date string (optional)',
    },
  },

  coins_debited: {
    required: ['userId', 'amount', 'source', 'transactionId'],
    optional: ['redemptionFor'],
    payload: {
      userId: 'string',
      amount: 'number',
      source: "'redemption' | 'expired' | 'refund'",
      transactionId: 'string',
      redemptionFor: 'string (optional)',
    },
  },

  cashback_earned: {
    required: ['userId', 'orderId', 'amount', 'tier'],
    optional: ['bonusPercent'],
    payload: {
      userId: 'string',
      orderId: 'string',
      amount: 'number',
      tier: 'string',
      bonusPercent: 'number',
    },
  },

  cashback_redeemed: {
    required: ['userId', 'amount', 'transactionId'],
    optional: ['orderId'],
    payload: {
      userId: 'string',
      amount: 'number',
      transactionId: 'string',
      orderId: 'string (optional)',
    },
  },
};

// ============================================================================
// Validation Functions
// ============================================================================

function validateEventSchema(
  eventName: string,
  eventData: any,
  schema: any
): EventValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of schema.required || []) {
    if (eventData[field] === undefined || eventData[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check for unknown fields
  const knownFields = [...(schema.required || []), ...(schema.optional || [])];
  for (const field of Object.keys(eventData)) {
    if (!knownFields.includes(field)) {
      warnings.push(`Unknown field: ${field}`);
    }
  }

  // Validate data types
  if (eventData.orderId && typeof eventData.orderId !== 'string') {
    errors.push('orderId must be a string');
  }

  if (eventData.userId && typeof eventData.userId !== 'string') {
    errors.push('userId must be a string');
  }

  if (eventData.amount !== undefined && typeof eventData.amount !== 'number') {
    errors.push('amount must be a number');
  }

  if (eventData.pointsEarned !== undefined && typeof eventData.pointsEarned !== 'number') {
    errors.push('pointsEarned must be a number');
  }

  if (eventData.karmaEarned !== undefined && typeof eventData.karmaEarned !== 'number') {
    errors.push('karmaEarned must be a number');
  }

  if (eventData.coinsEarned !== undefined && typeof eventData.coinsEarned !== 'number') {
    errors.push('coinsEarned must be a number');
  }

  if (eventData.cashbackEarned !== undefined && typeof eventData.cashbackEarned !== 'number') {
    errors.push('cashbackEarned must be a number');
  }

  if (eventData.transactionId && typeof eventData.transactionId !== 'string') {
    errors.push('transactionId must be a string');
  }

  if (eventData.createdAt && isNaN(Date.parse(eventData.createdAt))) {
    errors.push('createdAt must be a valid ISO date string');
  }

  return {
    eventName,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateEvent(eventName: string, sampleData: any): EventValidationResult {
  // Determine which schema to use
  const allEvents = {
    ...ORDER_EVENTS,
    ...KARMA_EVENTS,
    ...STREAK_EVENTS,
    ...BADGE_EVENTS,
    ...WALLET_EVENTS,
  };

  const schema = allEvents[eventName as keyof typeof allEvents];
  if (!schema) {
    return {
      eventName,
      valid: false,
      errors: [`Unknown event type: ${eventName}`],
      warnings: [],
    };
  }

  return validateEventSchema(eventName, sampleData, schema);
}

// ============================================================================
// Sample Event Data Generators
// ============================================================================

function generateSampleOrderEvents() {
  return {
    order_created: {
      orderId: 'ord_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      userId: 'user_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      merchantId: 'merchant_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      items: [
        { itemId: 'item_1', name: 'Paneer Tikka', quantity: 2, price: 250 },
        { itemId: 'item_2', name: 'Butter Naan', quantity: 4, price: 60 },
      ],
      totals: { subtotal: 740, tax: 133, discount: 0, total: 873 },
      source: 'menu_qr',
      createdAt: new Date().toISOString(),
    },

    order_completed: {
      orderId: 'ord_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      userId: 'user_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      total: 873,
      pointsEarned: 87,
      cashbackEarned: 43,
      tier: 'silver',
      karmaMultiplier: 1.1,
      loyaltyMultiplier: 1.1,
      createdAt: new Date().toISOString(),
    },
  };
}

function generateSampleKarmaEvents() {
  return {
    karma_event_completed: {
      eventId: 'event_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      userId: 'user_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      actualDuration: 4,
      karmaEarned: 90,
      coinsEarned: 50,
      badgeAwarded: null,
      createdAt: new Date().toISOString(),
    },

    karma_level_up: {
      userId: 'user_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      oldLevel: 'starter',
      newLevel: 'active',
      karmaScore: 150,
      benefits: ['Enhanced rewards', 'Priority support'],
      multiplier: 1.1,
      createdAt: new Date().toISOString(),
    },
  };
}

function generateSampleStreakEvents() {
  return {
    streak_checkin: {
      userId: 'user_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      streakType: 'login',
      currentStreak: 7,
      coinsEarned: 7,
      isMilestone: true,
      milestoneDay: 7,
      createdAt: new Date().toISOString(),
    },

    streak_milestone_reached: {
      userId: 'user_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      streakType: 'login',
      day: 7,
      coinsRewarded: 25,
      badgeRewarded: {
        id: 'streak_7',
        name: 'Week Warrior',
        rarity: 'common',
      },
      createdAt: new Date().toISOString(),
    },
  };
}

function generateSampleWalletEvents() {
  return {
    coins_credited: {
      userId: 'user_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      amount: 500,
      source: 'karma',
      transactionId: 'txn_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      description: 'Karma event completion reward',
      createdAt: new Date().toISOString(),
    },

    cashback_earned: {
      userId: 'user_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      orderId: 'ord_' + new mongoose.Types.ObjectId().toString().slice(0, 12),
      amount: 43,
      tier: 'silver',
      bonusPercent: 6,
      createdAt: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Main Validation
// ============================================================================

function validateAllEvents(): ValidationReport {
  const results: EventValidationResult[] = [];
  const allSampleEvents = {
    ...generateSampleOrderEvents(),
    ...generateSampleKarmaEvents(),
    ...generateSampleStreakEvents(),
    ...generateSampleWalletEvents(),
  };

  for (const [eventName, sampleData] of Object.entries(allSampleEvents)) {
    const result = validateEvent(eventName, sampleData);
    results.push(result);
  }

  const passed = results.filter(r => r.valid).length;
  const failed = results.filter(r => !r.valid).length;

  return {
    timestamp: new Date(),
    totalEvents: results.length,
    passed,
    failed,
    results,
  };
}

function printReport(report: ValidationReport): void {
  console.log('\n' + '='.repeat(80));
  console.log('EVENT SCHEMA VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log(`\nTimestamp: ${report.timestamp.toISOString()}`);
  console.log(`Total Events: ${report.totalEvents}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);

  console.log('\n' + '-'.repeat(80));
  console.log('DETAILED RESULTS');
  console.log('-'.repeat(80));

  for (const result of report.results) {
    const status = result.valid ? '✓ PASS' : '✗ FAIL';
    console.log(`\n${status}: ${result.eventName}`);

    if (result.errors.length > 0) {
      console.log('  Errors:');
      for (const error of result.errors) {
        console.log(`    - ${error}`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      for (const warning of result.warnings) {
        console.log(`    - ${warning}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(report.failed === 0 ? 'ALL EVENTS VALID' : `${report.failed} EVENTS HAVE ERRORS`);
  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// Schema Documentation
// ============================================================================

function printSchemaDocumentation(): void {
  console.log('\n' + '='.repeat(80));
  console.log('EVENT SCHEMA DOCUMENTATION');
  console.log('='.repeat(80));

  const allEvents = {
    'ORDER EVENTS': ORDER_EVENTS,
    'KARMA EVENTS': KARMA_EVENTS,
    'STREAK EVENTS': STREAK_EVENTS,
    'BADGE EVENTS': BADGE_EVENTS,
    'WALLET EVENTS': WALLET_EVENTS,
  };

  for (const [category, events] of Object.entries(allEvents)) {
    console.log(`\n${category}`);
    console.log('-'.repeat(40));

    for (const [eventName, schema] of Object.entries(events)) {
      console.log(`\n  ${eventName}`);
      console.log(`    Required: ${schema.required?.join(', ') || 'none'}`);
      console.log(`    Optional: ${schema.optional?.join(', ') || 'none'}`);
    }
  }

  console.log('\n');
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log('Starting Event Schema Validation...\n');

  // Run validation
  const report = validateAllEvents();
  printReport(report);

  // Print schema documentation if requested
  const args = process.argv.slice(2);
  if (args.includes('--docs')) {
    printSchemaDocumentation();
  }

  // Exit with error code if validation failed
  process.exit(report.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Validation error:', error);
  process.exit(1);
});
