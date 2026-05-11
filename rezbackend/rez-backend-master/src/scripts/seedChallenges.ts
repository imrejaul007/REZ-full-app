import dotenv from 'dotenv';
import path from 'path';
import Challenge from '../models/Challenge';
import UserChallengeProgress from '../models/UserChallengeProgress';
import { CHALLENGE_TEMPLATES } from '../config/challengeTemplates';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface SeedOptions {
  clearExisting?: boolean;
  generateDaily?: boolean;
  generateWeekly?: boolean;
  generateMonthly?: boolean;
  generateSpecial?: boolean;
}

/**
 * Seed challenges database with realistic data
 * This creates challenges based on templates and makes them active
 */
async function seedChallenges(options: SeedOptions = {}) {
  const {
    clearExisting = false,
    generateDaily = true,
    generateWeekly = true,
    generateMonthly = true,
    generateSpecial = true,
  } = options;

  try {
    logger.info('🌱 Starting challenges seeding...');
    logger.info('📡 Connecting to MongoDB...');

    // Connect to MongoDB
    await connectScriptDb();
    logger.info('✅ Connected to MongoDB');

    // Clear existing data if requested
    if (clearExisting) {
      logger.info('🗑️  Clearing existing challenges...');
      await Challenge.deleteMany({});
      await UserChallengeProgress.deleteMany({});
      logger.info('✅ Existing data cleared');
    }

    // Generate challenges based on options
    const challengesToCreate: any[] = [];

    // Daily Challenges (rotate 3 random ones daily)
    if (generateDaily) {
      const dailyTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'daily');
      const selectedDaily = getRandomItems(dailyTemplates, 5); // 5 daily challenges

      selectedDaily.forEach((template, _index) => {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (template.durationDays || 1));

        challengesToCreate.push({
          type: template.type,
          title: template.title,
          description: template.description,
          icon: template.icon,
          requirements: template.requirements,
          rewards: template.rewards,
          difficulty: template.difficulty,
          startDate,
          endDate,
          active: true,
          maxParticipants: 10000,
        });
      });
      logger.info(`✨ Generated ${selectedDaily.length} daily challenges`);
    }

    // Weekly Challenges (2-3 active ones)
    if (generateWeekly) {
      const weeklyTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'weekly');
      const selectedWeekly = getRandomItems(weeklyTemplates, 3); // 3 weekly challenges

      selectedWeekly.forEach((template, _index) => {
        const startDate = getStartOfWeek(new Date());
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        challengesToCreate.push({
          type: template.type,
          title: template.title,
          description: template.description,
          icon: template.icon,
          requirements: template.requirements,
          rewards: template.rewards,
          difficulty: template.difficulty,
          startDate,
          endDate,
          active: true,
          maxParticipants: 10000,
        });
      });
      logger.info(`✨ Generated ${selectedWeekly.length} weekly challenges`);
    }

    // Monthly Challenges (2 active ones)
    if (generateMonthly) {
      const monthlyTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'monthly');
      const selectedMonthly = getRandomItems(monthlyTemplates, 2); // 2 monthly challenges

      selectedMonthly.forEach((template, _index) => {
        const startDate = getStartOfMonth(new Date());
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        challengesToCreate.push({
          type: template.type,
          title: template.title,
          description: template.description,
          icon: template.icon,
          requirements: template.requirements,
          rewards: template.rewards,
          difficulty: template.difficulty,
          startDate,
          endDate,
          active: true,
          maxParticipants: 10000,
        });
      });
      logger.info(`✨ Generated ${selectedMonthly.length} monthly challenges`);
    }

    // Special Challenges (1-2 special events)
    if (generateSpecial) {
      const specialTemplates = CHALLENGE_TEMPLATES.filter((t) => t.type === 'special');
      if (specialTemplates.length > 0) {
        const selectedSpecial = getRandomItems(specialTemplates, 2);

        selectedSpecial.forEach((template, _index) => {
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + (template.durationDays || 7));

          challengesToCreate.push({
            type: template.type,
            title: template.title,
            description: template.description,
            icon: template.icon,
            requirements: template.requirements,
            rewards: template.rewards,
            difficulty: template.difficulty,
            startDate,
            endDate,
            active: true,
            maxParticipants: 10000,
          });
        });
        logger.info(`✨ Generated ${selectedSpecial.length} special challenges`);
      }
    }

    // Insert all challenges
    if (challengesToCreate.length > 0) {
      logger.info(`💾 Inserting ${challengesToCreate.length} challenges...`);
      const createdChallenges = await Challenge.insertMany(challengesToCreate);
      logger.info(`✅ Successfully created ${createdChallenges.length} challenges`);

      // Display summary
      logger.info('\n📊 Challenges Summary:');
      logger.info(`   • Daily: ${createdChallenges.filter((c: any) => c.type === 'daily').length}`);
      logger.info(`   • Weekly: ${createdChallenges.filter((c: any) => c.type === 'weekly').length}`);
      logger.info(`   • Monthly: ${createdChallenges.filter((c: any) => c.type === 'monthly').length}`);
      logger.info(`   • Special: ${createdChallenges.filter((c: any) => c.type === 'special').length}`);
      logger.info(`   • Total: ${createdChallenges.length}`);

      // Display difficulty breakdown
      logger.info('\n🎯 Difficulty Breakdown:');
      logger.info(`   • Easy: ${createdChallenges.filter((c: any) => c.difficulty === 'easy').length}`);
      logger.info(`   • Medium: ${createdChallenges.filter((c: any) => c.difficulty === 'medium').length}`);
      logger.info(`   • Hard: ${createdChallenges.filter((c: any) => c.difficulty === 'hard').length}`);

      // Display total rewards available
      const totalCoins = createdChallenges.reduce((sum: number, c: any) => sum + c.rewards.coins, 0);
      logger.info('\n💰 Total Coins Available:', totalCoins);
    } else {
      logger.info('⚠️  No challenges to create');
    }

    logger.info('\n✅ Challenges seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Error seeding challenges:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await disconnectDb();
    logger.info('📡 Disconnected from MongoDB');
  }
}

/**
 * Seed user progress for testing
 * Creates random progress for users on various challenges
 */
async function seedUserProgress(userIds: string[], challengeIds: string[]) {
  try {
    logger.info('\n🌱 Seeding user progress...');

    const progressToCreate: any[] = [];

    // Create random progress for each user
    userIds.forEach((userId) => {
      // Each user gets 30-50% of challenges
      const numChallenges =
        Math.floor(Math.random() * challengeIds.length * 0.5) + Math.floor(challengeIds.length * 0.3);
      const selectedChallenges = getRandomItems(challengeIds, numChallenges);

      selectedChallenges.forEach((challengeId) => {
        const _challenge = challengeIds.indexOf(challengeId);
        const isCompleted = Math.random() > 0.6; // 40% completion rate
        const progressPercent = isCompleted ? 100 : Math.floor(Math.random() * 90) + 10;

        progressToCreate.push({
          user: new mongoose.Types.ObjectId(userId),
          challenge: new mongoose.Types.ObjectId(challengeId),
          progress: progressPercent,
          target: 100,
          completed: isCompleted,
          rewardsClaimed: isCompleted && Math.random() > 0.3, // 70% claim rate
          startDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
      });
    });

    if (progressToCreate.length > 0) {
      await UserChallengeProgress.insertMany(progressToCreate);
      logger.info(`✅ Created ${progressToCreate.length} user progress records`);
    }
  } catch (error) {
    logger.error('❌ Error seeding user progress:', error);
    throw error;
  }
}

// Helper functions
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Run the seeder if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const clearExisting = args.includes('--clear');
  const skipDaily = args.includes('--skip-daily');
  const skipWeekly = args.includes('--skip-weekly');
  const skipMonthly = args.includes('--skip-monthly');
  const skipSpecial = args.includes('--skip-special');

  const options: SeedOptions = {
    clearExisting,
    generateDaily: !skipDaily,
    generateWeekly: !skipWeekly,
    generateMonthly: !skipMonthly,
    generateSpecial: !skipSpecial,
  };

  seedChallenges(options)
    .then(() => {
      logger.info('\n🎉 Seeding process completed!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedChallenges, seedUserProgress };
