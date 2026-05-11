/**
 * Fix Product Pricing Structure
 * Migrates products from old 'price' structure to new 'pricing' structure
 * Old: price: { current, original, currency, discount }
 * New: pricing: { selling, original, currency, discount }
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

async function fixProductPricing() {
  try {
    logger.info('🚀 Starting Product Pricing Fix...');
    logger.info(`📡 Connecting to MongoDB...`);

    await connectScriptDb();
    logger.info('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db!;
    const productsCollection = db.collection('products');

    // Get all products
    const products = await productsCollection.find({}).toArray();
    logger.info(`📦 Found ${products.length} products to process\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Check if product has old 'price' structure
        const hasOldPrice =
          product.price && (product.price.current !== undefined || product.price.original !== undefined);
        const hasNewPricing =
          product.pricing && (product.pricing.selling !== undefined || product.pricing.original !== undefined);

        if (hasOldPrice && !hasNewPricing) {
          // Migrate from old to new structure
          const newPricing = {
            original: product.price.original || product.price.current || 0,
            selling: product.price.current || product.price.original || 0,
            discount: product.price.discount || 0,
            currency: product.price.currency || 'INR',
          };

          await productsCollection.updateOne(
            { _id: product._id },
            {
              $set: { pricing: newPricing },
              $unset: { price: '' }, // Remove old field
            },
          );

          logger.info(`   ✅ Fixed: ${product.name} - ₹${newPricing.selling} (was ₹${product.price.current || 0})`);
          fixedCount++;
        } else if (hasNewPricing) {
          // Already has new pricing structure
          skippedCount++;
        } else if (hasOldPrice && hasNewPricing) {
          // Has both - update pricing from price and remove old
          const newPricing = {
            original: product.price.original || product.pricing.original || 0,
            selling: product.price.current || product.pricing.selling || 0,
            discount: product.price.discount || product.pricing.discount || 0,
            currency: product.price.currency || product.pricing.currency || 'INR',
          };

          await productsCollection.updateOne(
            { _id: product._id },
            {
              $set: { pricing: newPricing },
              $unset: { price: '' },
            },
          );

          logger.info(`   ✅ Merged: ${product.name} - ₹${newPricing.selling}`);
          fixedCount++;
        } else {
          // No pricing at all - create default
          const defaultPrice = 100; // Default price
          const newPricing = {
            original: defaultPrice,
            selling: defaultPrice,
            discount: 0,
            currency: 'INR',
          };

          await productsCollection.updateOne({ _id: product._id }, { $set: { pricing: newPricing } });

          logger.info(`   ⚠️ Created default: ${product.name} - ₹${defaultPrice}`);
          fixedCount++;
        }
      } catch (err) {
        logger.info(`   ❌ Error: ${product.name} - ${err}`);
        errorCount++;
      }
    }

    logger.info('\n========================================');
    logger.info('📊 FIX SUMMARY');
    logger.info('========================================');
    logger.info(`Total Products: ${products.length}`);
    logger.info(`Fixed: ${fixedCount}`);
    logger.info(`Skipped (already correct): ${skippedCount}`);
    logger.info(`Errors: ${errorCount}`);
    logger.info('========================================\n');

    // Verify a sample product
    logger.info('📊 VERIFICATION (Sample Products):');
    const sampleProducts = await productsCollection.find({}).limit(5).toArray();
    for (const product of sampleProducts) {
      logger.info(`   ${product.name}:`);
      logger.info(`      pricing.selling: ${product.pricing?.selling || 'N/A'}`);
      logger.info(`      pricing.original: ${product.pricing?.original || 'N/A'}`);
      logger.info(`      price (old): ${product.price ? JSON.stringify(product.price) : 'removed'}`);
    }
  } catch (error) {
    logger.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await disconnectDb();
    logger.info('\n🔌 Disconnected from MongoDB');
  }
}

fixProductPricing()
  .then(() => {
    logger.info('✅ Product pricing fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });
