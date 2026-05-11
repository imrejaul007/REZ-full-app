/**
 * Database Inspector Script
 * Prints a summary of the current database state to the console.
 */
import { User } from '../models/User';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Category } from '../models/Category';
import { connectDatabase } from '../config/database';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

async function checkDatabase() {
  logger.info('🔍 Inspecting Database...\n');

  try {
    // 1. Counts
    const userCount = await User.countDocuments();
    const storeCount = await Store.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const categoryCount = await Category.countDocuments();

    logger.info('📊 Statistics:');
    logger.info(`   Users:      ${userCount}`);
    logger.info(`   Stores:     ${storeCount}`);
    logger.info(`   Products:   ${productCount}`);
    logger.info(`   Orders:     ${orderCount}`);
    logger.info(`   Categories: ${categoryCount}`);
    logger.info('-------------------------------------------');

    // 2. Sample Orders (to check relationships)
    logger.info('\n📝 Recent Orders (checking links):');
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('items.store', 'name slug');

    if (recentOrders.length === 0) {
      logger.info('   No orders found.');
    }

    recentOrders.forEach((order) => {
      const user = order.user as any;
      const store = order.items[0]?.store as any; // Assuming single item for simplicity

      logger.info(`   Order ID: ${order._id}`);
      logger.info(`     User:  ${user ? `${user.name} (${user.email})` : '❌ MISSING (orphaned)'}`);
      logger.info(`     Store: ${store ? `${store.name} (${store.slug})` : '❌ MISSING (orphaned)'}`);
      logger.info(`     Total: ₹${order.totals.total}`);
      logger.info(`     Date:  ${order.createdAt.toISOString()}`);
      logger.info('');
    });

    // 3. Sample Stores
    logger.info('🏪 Sample Stores:');
    const stores = await Store.find().limit(3).select('name slug category');
    stores.forEach((s) => {
      logger.info(`   - ${s.name} (Slug: ${s.slug}, CatID: ${s.category})`);
    });
  } catch (error) {
    logger.error('❌ Error inspecting DB:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  connectDatabase()
    .then(() => checkDatabase())
    .then(() => {
      logger.info('\n✅ Inspection complete.');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Connection failed:', error);
      process.exit(1);
    });
}
