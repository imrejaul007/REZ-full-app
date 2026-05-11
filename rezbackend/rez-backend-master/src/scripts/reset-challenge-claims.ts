/**
 * Reset Challenge Claims Script
 *
 * This script resets completed challenges back to "unclaimed" state
 * so users can claim them again and test the reward system.
 *
 * Run with: npx ts-node src/scripts/reset-challenge-claims.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import UserChallengeProgress from '../models/UserChallengeProgress';
import { logger } from '../config/logger';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  logger.error('❌ [RESET] MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function resetChallengeClaims() {
  try {
    logger.info('🔧 [RESET] Connecting to database...');
    logger.info('🔧 [RESET] URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI!);
    logger.info('✅ [RESET] Connected to database');

    // Find all claimed challenges (don't populate to avoid schema issues)
    const claimedChallenges = await UserChallengeProgress.find({
      rewardsClaimed: true,
      completed: true,
    });

    logger.info(`📊 [RESET] Found ${claimedChallenges.length} claimed challenges`);

    if (claimedChallenges.length === 0) {
      logger.info('✅ [RESET] No claimed challenges found. Nothing to reset.');
      return;
    }

    let resetCount = 0;

    for (const progress of claimedChallenges) {
      logger.info(`🔄 [RESET] Resetting challenge`);
      logger.info(`   Progress ID: ${progress._id}`);
      logger.info(`   User: ${progress.user}`);
      logger.info(`   Challenge ID: ${progress.challenge}`);

      // Reset to unclaimed but keep completed status
      progress.rewardsClaimed = false;
      progress.claimedAt = undefined;

      await progress.save();

      logger.info(`   ✅ Reset to unclaimed`);
      resetCount++;
    }

    logger.info('\n📊 [RESET] Summary:');
    logger.info(`   Total claimed challenges: ${claimedChallenges.length}`);
    logger.info(`   Reset: ${resetCount}`);

    logger.info('\n✅ [RESET] Challenges reset successfully!');
    logger.info('💡 [RESET] You can now claim these rewards again to test the coin-adding functionality.');
  } catch (error) {
    logger.error('❌ [RESET] Error resetting challenges:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    logger.info('👋 [RESET] Disconnected from database');
  }
}

// Run the reset
resetChallengeClaims()
  .then(() => {
    logger.info('✅ [RESET] Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ [RESET] Script failed:', error);
    process.exit(1);
  });
