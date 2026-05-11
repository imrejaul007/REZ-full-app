/**
 * Store-Merchant-Product Mapping Report
 * Queries the database and prints which merchant each store is connected to
 * and which products each store has.
 */
import { connectDatabase } from '../config/database';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { MProduct } from '../models/MerchantProduct';
import { Merchant } from '../models/Merchant';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

async function checkStoreMappings() {
  logger.info('🗺️  Store-Merchant-Product Mapping Report');
  logger.info('='.repeat(60));
  logger.info('');

  try {
    const stores = await Store.find().sort({ name: 1 }).lean();

    if (stores.length === 0) {
      logger.info('⚠️  No stores found in the database.');
      return;
    }

    let totalStores = stores.length;
    let linkedStores = 0;
    let unlinkedStores = 0;
    let totalProducts = 0;
    let totalMProducts = 0;

    for (const store of stores) {
      const storeId = store._id;

      logger.info('─'.repeat(60));
      logger.info(`🏪 ${store.name}`);
      logger.info(`   Slug: ${store.slug}`);
      logger.info(`   City: ${store.location?.city || 'N/A'}`);
      logger.info(`   Active: ${store.isActive ? '✅ Yes' : '❌ No'}`);

      // --- Merchant Info ---
      if (store.merchantId) {
        const merchant = await Merchant.findById(store.merchantId).lean();
        if (merchant) {
          linkedStores++;
          logger.info(`   🤝 Merchant: ${merchant.businessName} (${merchant.ownerName})`);
          logger.info(`      Email: ${merchant.email}`);
          logger.info(`      Phone: ${merchant.phone}`);
          logger.info(`      Verified: ${merchant.verificationStatus}`);
        } else {
          unlinkedStores++;
          logger.info(`   ⚠️  Merchant ID set (${store.merchantId}) but NOT FOUND in DB`);
        }
      } else {
        unlinkedStores++;
        logger.info('   🚫 Merchant: NOT LINKED');
      }

      // --- Customer-facing Products (Product collection) ---
      const products = await Product.find({ store: storeId })
        .select('name sku pricing.selling inventory.stock isActive')
        .sort({ name: 1 })
        .lean();

      if (products.length > 0) {
        logger.info(`\n   📦 Products (customer-facing): ${products.length}`);
        for (const p of products) {
          const price = (p as any).pricing?.selling ?? 'N/A';
          const stock = (p as any).inventory?.stock ?? 'N/A';
          const active = p.isActive ? '✅' : '❌';
          logger.info(`      ${active} ${p.name}  |  SKU: ${p.sku}  |  ₹${price}  |  Stock: ${stock}`);
        }
        totalProducts += products.length;
      } else {
        logger.info('\n   📦 Products (customer-facing): 0');
      }

      // --- Merchant-managed Products (MProduct collection) ---
      const mProducts = await MProduct.find({ storeId: storeId })
        .select('name sku price inventory.stock status')
        .sort({ name: 1 })
        .lean();

      if (mProducts.length > 0) {
        logger.info(`   📋 MerchantProducts: ${mProducts.length}`);
        for (const mp of mProducts) {
          const stock = (mp as any).inventory?.stock ?? 'N/A';
          const status = (mp as any).status ?? 'N/A';
          logger.info(
            `      [${status}] ${mp.name}  |  SKU: ${(mp as any).sku}  |  ₹${(mp as any).price}  |  Stock: ${stock}`,
          );
        }
        totalMProducts += mProducts.length;
      } else {
        logger.info('   📋 MerchantProducts: 0');
      }

      // Also check MProducts linked by merchantId (not storeId)
      if (store.merchantId) {
        const mProductsByMerchant = await MProduct.find({
          merchantId: store.merchantId,
          $or: [{ storeId: { $exists: false } }, { storeId: null }],
        })
          .select('name sku price inventory.stock status')
          .sort({ name: 1 })
          .lean();

        if (mProductsByMerchant.length > 0) {
          logger.info(`   📋 MerchantProducts (via merchant, no storeId): ${mProductsByMerchant.length}`);
          for (const mp of mProductsByMerchant) {
            const stock = (mp as any).inventory?.stock ?? 'N/A';
            const status = (mp as any).status ?? 'N/A';
            logger.info(
              `      [${status}] ${mp.name}  |  SKU: ${(mp as any).sku}  |  ₹${(mp as any).price}  |  Stock: ${stock}`,
            );
          }
          totalMProducts += mProductsByMerchant.length;
        }
      }

      logger.info('');
    }

    // --- Summary ---
    logger.info('='.repeat(60));
    logger.info('📊 SUMMARY');
    logger.info('='.repeat(60));
    logger.info(`   Total Stores:              ${totalStores}`);
    logger.info(`   Linked to Merchant:        ${linkedStores}`);
    logger.info(`   NOT linked to Merchant:    ${unlinkedStores}`);
    logger.info(`   Total Products:            ${totalProducts}`);
    logger.info(`   Total MerchantProducts:    ${totalMProducts}`);
    logger.info('='.repeat(60));
  } catch (error) {
    logger.error('❌ Error generating report:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  connectDatabase()
    .then(() => checkStoreMappings())
    .then(() => {
      logger.info('\n✅ Report complete.');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Connection failed:', error);
      process.exit(1);
    });
}
