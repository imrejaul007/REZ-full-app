import { exec } from 'child_process';
import { logger } from '../config/logger';

async function seedAllModels() {
  try {
    logger.info('🚀 Starting comprehensive database seeding...');
    logger.info('=====================================\n');

    // Step 1: Seed basic models first (users, categories, stores, products)
    logger.info('📋 Step 1: Basic Models (Users, Categories, Stores, Products)');
    logger.info('──────────────────────────────────────────────────────────');
    await seedData();
    logger.info('✅ Basic models seeded successfully\n');

    // Wait a moment for the database to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Step 2: Seed dependent models
    logger.info('📋 Step 2: Dependent Models');
    logger.info('──────────────────────────────────────────────────────────');

    logger.info('🛒 Seeding Carts...');
    await seedCarts();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info('📦 Seeding Orders...');
    await seedOrders();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info('🎥 Seeding Videos...');
    await seedVideos();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info('⭐ Seeding Reviews...');
    await seedReviews();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info('💝 Seeding Wishlists...');
    await seedWishlists();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info('🔔 Seeding Notifications...');
    await seedNotifications();

    logger.info('\n=====================================');
    logger.info('🎉 ALL MODELS SEEDED SUCCESSFULLY!');
    logger.info('=====================================');
    logger.info('\n📊 Final Database Summary:');
    logger.info('👤 Users: 2+ with complete profiles');
    logger.info('📂 Categories: 3 (Electronics, Fashion, Food)');
    logger.info('🏪 Stores: 2 with full business details');
    logger.info('📦 Products: 2+ with rich data & relationships');
    logger.info('🛒 Carts: Multiple with user-product relationships');
    logger.info('📋 Orders: Multiple with complete order lifecycle');
    logger.info('🎥 Videos: 6 content videos with engagement data');
    logger.info('⭐ Reviews: Multiple product reviews with ratings');
    logger.info('💝 Wishlists: User wishlists with product preferences');
    logger.info('🔔 Notifications: User notifications across all types');
    logger.info('\n✅ Your backend is now fully populated with interconnected dummy data!');
    logger.info('🚀 Ready for comprehensive frontend testing!');
  } catch (error) {
    logger.error('❌ Error in comprehensive seeding:', error);
    process.exit(1);
  }
}

// Override the individual seeding functions to prevent duplicate database connections
async function seedData() {
  // This will be handled by the individual seeding scripts
  return new Promise<string>((resolve, reject) => {
    exec('npm run seed:simple', (error: any, stdout: any, _stderr: any) => {
      if (error) {
        logger.error('Error running basic seeding:', error);
        reject(error);
      } else {
        logger.info(stdout);
        resolve(stdout);
      }
    });
  });
}

async function seedCarts() {
  return new Promise<string>((resolve, reject) => {
    exec('npx ts-node src/scripts/seedCarts.ts', (error: any, stdout: any, _stderr: any) => {
      if (error) {
        logger.error('Error seeding carts:', error);
        reject(error);
      } else {
        logger.info(stdout);
        resolve(stdout);
      }
    });
  });
}

async function seedOrders() {
  return new Promise<string>((resolve, reject) => {
    exec('npx ts-node src/scripts/seedOrders.ts', (error: any, stdout: any, _stderr: any) => {
      if (error) {
        logger.error('Error seeding orders:', error);
        reject(error);
      } else {
        logger.info(stdout);
        resolve(stdout);
      }
    });
  });
}

async function seedVideos() {
  return new Promise<string>((resolve, reject) => {
    exec('npx ts-node src/scripts/seedVideos.ts', (error: any, stdout: any, _stderr: any) => {
      if (error) {
        logger.error('Error seeding videos:', error);
        reject(error);
      } else {
        logger.info(stdout);
        resolve(stdout);
      }
    });
  });
}

async function seedReviews() {
  return new Promise<string>((resolve, reject) => {
    exec('npx ts-node src/scripts/seedReviews.ts', (error: any, stdout: any, _stderr: any) => {
      if (error) {
        logger.error('Error seeding reviews:', error);
        reject(error);
      } else {
        logger.info(stdout);
        resolve(stdout);
      }
    });
  });
}

async function seedWishlists() {
  return new Promise<string>((resolve, reject) => {
    exec('npx ts-node src/scripts/seedWishlists.ts', (error: any, stdout: any, _stderr: any) => {
      if (error) {
        logger.error('Error seeding wishlists:', error);
        reject(error);
      } else {
        logger.info(stdout);
        resolve(stdout);
      }
    });
  });
}

async function seedNotifications() {
  return new Promise<string>((resolve, reject) => {
    exec('npx ts-node src/scripts/seedNotifications.ts', (error: any, stdout: any, _stderr: any) => {
      if (error) {
        logger.error('Error seeding notifications:', error);
        reject(error);
      } else {
        logger.info(stdout);
        resolve(stdout);
      }
    });
  });
}

if (require.main === module) {
  seedAllModels();
}

export { seedAllModels };
