/**
 * Fix Missing Challenge Rewards Script
 *
 * This script finds all challenges where rewards were claimed but coins were NOT added to wallet,
 * and retroactively credits those coins.
 *
 * Run with: npx ts-node src/scripts/fix-missing-challenge-rewards.ts
 */

import UserChallengeProgress from '../models/UserChallengeProgress';
import { Wallet } from '../models/Wallet';
import { Transaction } from '../models/Transaction';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

async function fixMissingRewards() {
  try {
    logger.info('🔧 [FIX] Connecting to database...');
    await connectScriptDb();
    logger.info('✅ [FIX] Connected to database');

    // Find all claimed challenges
    const claimedChallenges = await UserChallengeProgress.find({
      rewardsClaimed: true,
      completed: true,
    })
      .populate('challenge')
      .populate('user');

    logger.info(`📊 [FIX] Found ${claimedChallenges.length} claimed challenges`);

    let fixedCount = 0;
    let alreadyFixedCount = 0;

    for (const progress of claimedChallenges) {
      const challenge = progress.challenge as any;
      const userId = progress.user as any;

      if (!challenge || !userId) {
        logger.info(`⚠️ [FIX] Skipping - missing challenge or user data`);
        continue;
      }

      const coinsReward = challenge.rewards?.coins || 0;

      if (coinsReward <= 0) {
        logger.info(`⚠️ [FIX] Skipping ${challenge.title} - no coin reward`);
        continue;
      }

      // Check if we already created a transaction for this claim
      const existingTransaction = await Transaction.findOne({
        user: userId._id,
        'source.type': 'challenge_reward',
        'source.metadata.progressId': String(progress._id),
      });

      if (existingTransaction) {
        logger.info(`✅ [FIX] Already fixed: ${challenge.title} for user ${userId._id}`);
        alreadyFixedCount++;
        continue;
      }

      // This reward was claimed but coins were never added!
      logger.info(`🔧 [FIX] Fixing missing reward for: ${challenge.title}`);
      logger.info(`   User: ${userId._id}`);
      logger.info(`   Coins: ${coinsReward}`);

      // Get or create wallet
      let wallet = await Wallet.findOne({ user: userId._id });
      if (!wallet) {
        wallet = await (Wallet as any).createForUser(userId._id);
      }

      if (!wallet) {
        logger.error(`❌ [FIX] Could not create wallet for user ${userId._id}`);
        continue;
      }

      const balanceBefore = wallet.balance.available;

      // Atomic $inc — safe for re-runs; avoids read-modify-write race on balance/statistics
      await Wallet.findOneAndUpdate(
        { user: userId._id },
        {
          $inc: {
            'balance.available': coinsReward,
            'balance.total': coinsReward,
            'statistics.totalEarned': coinsReward,
          },
        },
      );

      logger.info(`   ✅ Balance updated: ${balanceBefore} → ${wallet.balance.available}`);

      // Create transaction record
      await Transaction.create({
        user: userId._id,
        type: 'credit',
        category: 'earning',
        amount: coinsReward,
        currency: 'RC',
        description: `[RETROACTIVE] Challenge reward: ${challenge.title}`,
        source: {
          type: 'challenge_reward',
          reference: String(challenge._id),
          description: `Retroactively credited ${coinsReward} coins from challenge: ${challenge.title}`,
          metadata: {
            challengeId: String(challenge._id),
            challengeTitle: challenge.title,
            progressId: String(progress._id),
            retroactive: true,
            fixDate: new Date().toISOString(),
          },
        },
        status: {
          current: 'completed',
          history: [
            {
              status: 'completed',
              timestamp: new Date(),
              reason: 'Retroactively credited missing challenge reward',
            },
          ],
        },
        balanceBefore,
        balanceAfter: wallet.balance.available,
        netAmount: coinsReward,
        isReversible: false,
      });

      logger.info(`   ✅ Transaction created`);
      fixedCount++;
    }

    logger.info('\n📊 [FIX] Summary:');
    logger.info(`   Total claimed challenges: ${claimedChallenges.length}`);
    logger.info(`   Fixed: ${fixedCount}`);
    logger.info(`   Already fixed: ${alreadyFixedCount}`);
    logger.info(`   Skipped: ${claimedChallenges.length - fixedCount - alreadyFixedCount}`);

    if (fixedCount > 0) {
      logger.info('\n✅ [FIX] Successfully fixed missing challenge rewards!');
    } else {
      logger.info('\n✅ [FIX] No missing rewards found - everything is already correct!');
    }
  } catch (error) {
    logger.error('❌ [FIX] Error fixing missing rewards:', error);
    throw error;
  } finally {
    await disconnectDb();
    logger.info('👋 [FIX] Disconnected from database');
  }
}

// Run the fix
fixMissingRewards()
  .then(() => {
    logger.info('✅ [FIX] Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ [FIX] Script failed:', error);
    process.exit(1);
  });
