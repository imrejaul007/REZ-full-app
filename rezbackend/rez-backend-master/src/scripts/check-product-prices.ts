import mongoose from 'mongoose';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

async function checkProductPrices() {
  try {
    logger.info('🔌 Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('✅ Connected to MongoDB\n');

    // Import Product model
    const { Product } = await import('../models/Product');
    const { Store } = await import('../models/Store');

    // Get sample products
    const products = await Product.find({ isDeleted: false })
      .select('name pricing cashback store')
      .populate('store', 'name rewardRules')
      .limit(10)
      .lean();

    logger.info(`📦 Found ${products.length} products to check\n`);
    logger.info('='.repeat(80));

    products.forEach((product: any, index: number) => {
      logger.info(`\n${index + 1}. Product: ${product.name}`);
      logger.info(`   ID: ${product._id}`);

      // Check pricing
      const currentPrice = product.pricing?.selling || product.pricing?.original || product.pricing?.mrp || 0;
      const originalPrice = product.pricing?.original || product.pricing?.mrp || currentPrice;

      logger.info(`   Pricing:`);
      logger.info(`     - selling: ${product.pricing?.selling || 'NOT SET'}`);
      logger.info(`     - original: ${product.pricing?.original || 'NOT SET'}`);
      logger.info(`     - mrp: ${product.pricing?.mrp || 'NOT SET'}`);
      logger.info(`     - Calculated currentPrice: ${currentPrice}`);
      logger.info(`     - Calculated originalPrice: ${originalPrice}`);

      // Check cashback
      logger.info(`   Cashback:`);
      logger.info(`     - percentage: ${product.cashback?.percentage || 'NOT SET'}`);
      logger.info(`     - maxAmount: ${product.cashback?.maxAmount || 'NOT SET'}`);
      logger.info(`     - isActive: ${product.cashback?.isActive ?? 'NOT SET'}`);
      logger.info(`     - validUntil: ${product.cashback?.validUntil || 'NOT SET'}`);

      // Check store reward rules
      const store = product.store;
      logger.info(`   Store: ${store?.name || 'NOT FOUND'}`);
      logger.info(`     - baseCashbackPercent: ${store?.rewardRules?.baseCashbackPercent || 'NOT SET'}`);

      // Calculate what cashback would be
      let cashbackPercentage = 0;
      if (
        product.cashback?.percentage &&
        product.cashback.percentage > 0 &&
        product.cashback.isActive !== false &&
        (!product.cashback.validUntil || new Date(product.cashback.validUntil) > new Date())
      ) {
        cashbackPercentage = product.cashback.percentage;
      }
      if (cashbackPercentage === 0 && store?.rewardRules?.baseCashbackPercent) {
        cashbackPercentage = store.rewardRules.baseCashbackPercent;
      }
      if (cashbackPercentage === 0) {
        cashbackPercentage = 5; // Default
      }

      const cashbackAmount = currentPrice > 0 ? Math.round((currentPrice * cashbackPercentage) / 100) : 0;
      const coins = currentPrice > 0 ? Math.max(1, Math.round((currentPrice * 5) / 100)) : 0;

      logger.info(`   Calculated Values:`);
      logger.info(`     - cashbackPercentage: ${cashbackPercentage}%`);
      logger.info(`     - cashbackAmount: ₹${cashbackAmount}`);
      logger.info(`     - coins: ${coins} rezcoins`);
      logger.info(`     - Status: ${currentPrice > 0 ? '✅ VALID' : '❌ INVALID (price is 0)'}`);

      logger.info('-'.repeat(80));
    });

    // Statistics
    logger.info('\n📊 STATISTICS:');
    const allProducts = await Product.find({ isDeleted: false }).select('pricing cashback').lean();

    const productsWithPrice = allProducts.filter((p: any) => {
      const price = p.pricing?.selling || p.pricing?.original || p.pricing?.mrp || 0;
      return price > 0;
    });

    const productsWithCashback = allProducts.filter((p: any) => p.cashback?.percentage && p.cashback.percentage > 0);

    logger.info(`   Total products: ${allProducts.length}`);
    logger.info(
      `   Products with valid price: ${productsWithPrice.length} (${((productsWithPrice.length / allProducts.length) * 100).toFixed(1)}%)`,
    );
    logger.info(
      `   Products with cashback: ${productsWithCashback.length} (${((productsWithCashback.length / allProducts.length) * 100).toFixed(1)}%)`,
    );

    // Check stores with reward rules
    const stores = await Store.find().select('name rewardRules').lean();
    const storesWithRewardRules = stores.filter(
      (s: any) => s.rewardRules?.baseCashbackPercent && s.rewardRules.baseCashbackPercent > 0,
    );
    logger.info(`   Total stores: ${stores.length}`);
    logger.info(
      `   Stores with rewardRules: ${storesWithRewardRules.length} (${((storesWithRewardRules.length / stores.length) * 100).toFixed(1)}%)`,
    );

    await disconnectDb();
    logger.info('\n✅ Disconnected from MongoDB');
  } catch (error) {
    logger.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
checkProductPrices();
