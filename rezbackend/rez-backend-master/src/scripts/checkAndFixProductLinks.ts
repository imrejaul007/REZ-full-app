/**
 * Check & Fix Product-Store-Merchant Links
 *
 * Inspects all products in the database and:
 * 1. Reports which products are linked to stores, and which stores are linked to merchants
 * 2. Shows products with missing/broken links
 * 3. Fixes products that are linked to a store but missing merchantId
 *
 * Run: npm run check:product-links
 */
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { Merchant } from '../models/Merchant';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

async function checkAndFixProductLinks() {
  logger.info('🔗 Product-Store-Merchant Link Check & Fix');
  logger.info('='.repeat(70));
  logger.info('');

  try {
    // --- 1. Build lookup maps ---
    const allStores = await Store.find().lean();
    const allMerchants = await Merchant.find().lean();
    const allProducts = await Product.find().lean();

    const storeMap = new Map<string, any>();
    allStores.forEach((s) => storeMap.set(s._id.toString(), s));

    const merchantMap = new Map<string, any>();
    allMerchants.forEach((m) => merchantMap.set(m._id.toString(), m));

    logger.info(
      `📊 Database totals: ${allProducts.length} products, ${allStores.length} stores, ${allMerchants.length} merchants\n`,
    );

    // --- 2. Analyze each product ---
    let linkedToStore = 0;
    let noStore = 0;
    let hasMerchantId = 0;
    let noMerchantId = 0;
    let brokenStoreRef = 0;
    let brokenMerchantRef = 0;
    let hasImages = 0;
    let noImages = 0;
    let fixableProducts: any[] = []; // Products where we can set merchantId from store

    for (const product of allProducts) {
      const storeId = product.store?.toString();
      const merchantId = product.merchantId?.toString();
      const store = storeId ? storeMap.get(storeId) : null;
      const merchant = merchantId ? merchantMap.get(merchantId) : null;

      // Check store link
      if (!storeId) {
        noStore++;
      } else if (!store) {
        brokenStoreRef++;
      } else {
        linkedToStore++;
      }

      // Check merchantId
      if (!merchantId) {
        noMerchantId++;
        // Can we fix it from the store?
        if (store && store.merchantId) {
          fixableProducts.push({
            productId: product._id,
            productName: product.name,
            storeId: storeId,
            storeName: store.name,
            merchantId: store.merchantId.toString(),
            merchantName: merchantMap.get(store.merchantId.toString())?.businessName || 'Unknown',
          });
        }
      } else if (!merchant) {
        brokenMerchantRef++;
      } else {
        hasMerchantId++;
      }

      // Check images
      if (product.images && product.images.length > 0 && product.images[0] !== '') {
        hasImages++;
      } else {
        noImages++;
      }
    }

    // --- 3. Report ---
    logger.info('─'.repeat(70));
    logger.info('📋 LINK STATUS REPORT');
    logger.info('─'.repeat(70));
    logger.info(`  Products linked to a valid store:    ${linkedToStore}`);
    logger.info(`  Products with NO store:              ${noStore}`);
    logger.info(`  Products with BROKEN store ref:      ${brokenStoreRef}`);
    logger.info('');
    logger.info(`  Products with valid merchantId:      ${hasMerchantId}`);
    logger.info(`  Products with NO merchantId:         ${noMerchantId}`);
    logger.info(`  Products with BROKEN merchantId ref: ${brokenMerchantRef}`);
    logger.info('');
    logger.info(`  Products with images:                ${hasImages}`);
    logger.info(`  Products with NO images:             ${noImages}`);
    logger.info('');
    logger.info(`  ✅ Fixable (can set merchantId from store): ${fixableProducts.length}`);
    logger.info('─'.repeat(70));

    // --- 4. Show a sample of fixable products ---
    if (fixableProducts.length > 0) {
      logger.info('\n📝 SAMPLE OF FIXABLE PRODUCTS (first 10):');
      fixableProducts.slice(0, 10).forEach((fp) => {
        logger.info(`  ${fp.productName}`);
        logger.info(`    Store: ${fp.storeName} → Merchant: ${fp.merchantName}`);
      });
    }

    // --- 5. Fix: Set merchantId on products from their store's merchant ---
    if (fixableProducts.length > 0) {
      logger.info(`\n🔧 FIXING: Setting merchantId on ${fixableProducts.length} products...`);

      let fixed = 0;
      for (const fp of fixableProducts) {
        await Product.updateOne(
          { _id: fp.productId },
          { $set: { merchantId: new mongoose.Types.ObjectId(fp.merchantId) } },
        );
        fixed++;
      }
      logger.info(`✅ Fixed ${fixed} products — merchantId now set from their store's merchant.`);
    } else {
      logger.info('\n✅ All products already have merchantId set. No fixes needed.');
    }

    // --- 6. Final verification ---
    const afterFix = await Product.countDocuments({ merchantId: { $exists: true, $ne: null } });
    logger.info(`\n📊 AFTER FIX: ${afterFix}/${allProducts.length} products have merchantId set.`);
  } catch (error) {
    logger.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  connectDatabase()
    .then(() => checkAndFixProductLinks())
    .then(() => {
      logger.info('\n✅ Done.');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Connection failed:', error);
      process.exit(1);
    });
}
