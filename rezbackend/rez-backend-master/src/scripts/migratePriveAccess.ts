/**
 * Privé Access Migration Script
 *
 * 1. Whitelist target user (Mukul Raj) as permanent Privé member
 * 2. Seed WalletConfig with priveInviteConfig defaults
 * 3. Optionally grandfather existing eligible users
 *
 * Usage: npx ts-node src/scripts/migratePriveAccess.ts
 */

import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

const run = async () => {
  logger.info('Connecting to MongoDB...');
  await connectScriptDb();
  logger.info('Connected to MongoDB');

  // Import models after connection
  const { User } = await import('../models/User');
  const { default: PriveAccess } = await import('../models/PriveAccess');
  const { WalletConfig } = await import('../models/WalletConfig');
  const { UserReputation } = await import('../models/UserReputation');

  // ─── Step 1: Whitelist Mukul Raj ────────────────────────────────────────────

  logger.info('\n--- Step 1: Whitelist target user ---');

  const targetUser = await User.findOne({
    $or: [{ phoneNumber: '+917670041316' }, { email: 'work@rez.money' }],
  }).lean();

  if (targetUser) {
    logger.info(
      `Found user: ${(targetUser as any).profile?.firstName || 'Unknown'} ${(targetUser as any).profile?.lastName || ''} (${targetUser._id})`,
    );

    // Check if already has access
    const existing = await PriveAccess.findOne({ userId: targetUser._id });

    if (existing) {
      logger.info(
        `User already has PriveAccess record (status: ${existing.status}, whitelisted: ${existing.isWhitelisted})`,
      );
      if (!existing.isWhitelisted || existing.status !== 'active') {
        existing.status = 'active';
        existing.isWhitelisted = true;
        existing.whitelistedBy = targetUser._id as mongoose.Types.ObjectId;
        existing.whitelistReason = 'Development/testing whitelist - REZ Admin';
        existing.tierOverride = 'elite';
        existing.auditLog.push({
          action: 'whitelisted',
          by: targetUser._id as mongoose.Types.ObjectId,
          reason: 'Migration script whitelist',
          timestamp: new Date(),
        });
        await existing.save();
        logger.info('Updated to active + whitelisted + elite tier override');
      } else {
        logger.info('Already active and whitelisted, no changes needed');
      }
    } else {
      const access = new PriveAccess({
        userId: targetUser._id,
        status: 'active',
        grantMethod: 'admin_whitelist',
        isWhitelisted: true,
        whitelistedBy: targetUser._id,
        whitelistReason: 'Development/testing whitelist - REZ Admin',
        tierOverride: 'elite',
        activatedAt: new Date(),
        auditLog: [
          {
            action: 'whitelisted',
            by: targetUser._id as mongoose.Types.ObjectId,
            reason: 'Migration script - initial whitelist for development',
            timestamp: new Date(),
          },
        ],
      });
      await access.save();
      logger.info('Created PriveAccess record with whitelist + elite tier override');
    }
  } else {
    logger.info('WARNING: Target user not found (phone: +917670041316, email: work@rez.money)');
    logger.info('The user will be whitelisted automatically via the admin panel once they register.');
  }

  // ─── Step 2: Seed WalletConfig ──────────────────────────────────────────────

  logger.info('\n--- Step 2: Seed WalletConfig priveInviteConfig ---');

  const walletConfig = await WalletConfig.getOrCreate();

  if (!walletConfig.priveInviteConfig || !(walletConfig.priveInviteConfig as any).enabled === undefined) {
    walletConfig.priveInviteConfig = {
      enabled: true,
      inviterRewardCoins: 100,
      inviteeRewardCoins: 50,
      maxCodesPerUser: 5,
      codeExpiryDays: 30,
      maxUsesPerCode: 5,
      minTierToInvite: 'entry',
      cooldownHours: 24,
      fraudBlockThreshold: 80,
    };
    walletConfig.markModified('priveInviteConfig');
    await walletConfig.save();
    logger.info('Seeded priveInviteConfig with defaults');
  } else {
    logger.info('priveInviteConfig already exists, skipping');
  }

  // ─── Step 3: Grandfather existing eligible users (optional) ─────────────────

  logger.info('\n--- Step 3: Grandfather existing eligible users ---');

  const eligibleUsers = await UserReputation.find({
    isEligible: true,
    tier: { $in: ['entry', 'signature', 'elite'] },
  })
    .select('userId tier')
    .lean();

  logger.info(`Found ${eligibleUsers.length} eligible users`);

  let grandfathered = 0;
  for (const rep of eligibleUsers) {
    const existing = await PriveAccess.findOne({ userId: rep.userId });
    if (!existing) {
      await PriveAccess.create({
        userId: rep.userId,
        status: 'active',
        grantMethod: 'auto_qualify',
        activatedAt: new Date(),
        auditLog: [
          {
            action: 'granted',
            by: rep.userId,
            reason: `Auto-qualified from existing reputation (tier: ${rep.tier})`,
            timestamp: new Date(),
          },
        ],
      });
      grandfathered++;
    }
  }

  logger.info(`Grandfathered ${grandfathered} users (${eligibleUsers.length - grandfathered} already had access)`);

  // ─── Done ───────────────────────────────────────────────────────────────────

  logger.info('\n✅ Migration complete!');
  await disconnectDb();
  process.exit(0);
};

run().catch((err) => {
  logger.error('Migration failed:', err);
  process.exit(1);
});
