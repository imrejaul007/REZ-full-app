import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Partner from '../models/Partner';
import { User } from '../models/User';
import { connectDatabase } from '../config/database';
import { logger } from '../config/logger';

// Load environment variables
dotenv.config();

const seedPartners = async () => {
  try {
    logger.info('🌱 [PARTNER SEEDING] Starting partner seeding...');

    // Connect to database
    await connectDatabase();
    logger.info('✅ [PARTNER SEEDING] Connected to database');

    // Get all users
    const users = await User.find({ email: { $exists: true } }).limit(10);
    logger.info(`📊 [PARTNER SEEDING] Found ${users.length} users`);

    if (users.length === 0) {
      logger.info('⚠️ [PARTNER SEEDING] No users found. Please seed users first.');
      return;
    }

    // Clear existing partners (optional - comment out to keep existing data)
    await Partner.deleteMany({});
    logger.info('🗑️ [PARTNER SEEDING] Cleared existing partners');

    // Create partner profiles for each user
    const partnerPromises = users.map(async (user) => {
      try {
        // Check if partner already exists
        const existingPartner = await Partner.findOne({ userId: user._id });
        if (existingPartner) {
          logger.info(`⏭️ [PARTNER SEEDING] Partner already exists for user: ${user.email}`);
          return existingPartner;
        }

        const name = user.profile?.firstName
          ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
          : user.email?.split('@')[0] || 'Partner';

        const userId = user._id as any;
        const partner = await (Partner as any).createDefaultPartner(
          userId.toString(),
          name,
          user.email || '',
          user.profile?.avatar,
        );

        logger.info(`✅ [PARTNER SEEDING] Created partner for: ${name}`);
        return partner;
      } catch (error) {
        logger.error(`❌ [PARTNER SEEDING] Error creating partner for user ${user.email}:`, error);
        return null;
      }
    });

    const createdPartners = await Promise.all(partnerPromises);
    const successCount = createdPartners.filter((p: any) => p !== null).length;

    logger.info('\n🎉 [PARTNER SEEDING] Partner seeding completed!');
    logger.info(`✅ Created ${successCount} partner profiles`);
    logger.info('\n📊 Summary:');
    logger.info(`   Total Users: ${users.length}`);
    logger.info(`   Partners Created: ${successCount}`);
    logger.info(`   Failed: ${users.length - successCount}`);

    // Display sample partner data
    const samplePartner = await Partner.findOne().populate('userId', 'email');
    if (samplePartner) {
      logger.info('\n📝 Sample Partner Data:');
      logger.info(`   Name: ${samplePartner.name}`);
      logger.info(`   Email: ${samplePartner.email}`);
      logger.info(`   Level: ${samplePartner.currentLevel.name} (${samplePartner.currentLevel.level})`);
      logger.info(`   Total Orders: ${samplePartner.totalOrders}`);
      logger.info(`   Milestones: ${samplePartner.milestones.length}`);
      logger.info(`   Tasks: ${samplePartner.tasks.length}`);
      logger.info(`   Jackpot Milestones: ${samplePartner.jackpotProgress.length}`);
      logger.info(`   Offers: ${samplePartner.claimableOffers.length}`);
    }
  } catch (error) {
    logger.error('❌ [PARTNER SEEDING] Error:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('\n👋 [PARTNER SEEDING] Database connection closed');
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedPartners()
    .then(() => {
      logger.info('✅ [PARTNER SEEDING] Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ [PARTNER SEEDING] Seeding failed:', error);
      process.exit(1);
    });
}

export default seedPartners;
