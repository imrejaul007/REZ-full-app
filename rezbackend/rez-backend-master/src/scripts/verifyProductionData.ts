/**
 * Verify Production Data Script
 * Validates all data is correct and production-ready
 * Checks categories, stores, and products for proper relationships
 */

import mongoose from 'mongoose';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

const DB_NAME = process.env.DB_NAME || 'test';

// Expected main categories
const EXPECTED_MAIN_CATEGORIES = [
  'food-dining',
  'grocery-essentials',
  'beauty-wellness',
  'healthcare',
  'fashion',
  'fitness-sports',
  'education-learning',
  'home-services',
  'travel-experiences',
  'entertainment',
  'financial-lifestyle',
];

async function verifyProductionData() {
  try {
    logger.info('🚀 Starting Production Data Verification...');
    logger.info(`📡 Connecting to MongoDB...`);

    await connectScriptDb();
    if (DB_NAME !== 'test') await mongoose.connection.useDb(DB_NAME);

    const db = mongoose.connection.db!;
    const categoriesCollection = db.collection('categories');
    const storesCollection = db.collection('stores');
    const productsCollection = db.collection('products');

    let allPassed = true;
    const issues: string[] = [];

    // ========================================
    // CHECK 1: Main Categories
    // ========================================
    logger.info('========================================');
    logger.info('CHECK 1: Main Categories');
    logger.info('========================================\n');

    const mainCategories = await categoriesCollection.find({ parentCategory: null }).toArray();
    const mainCategorySlugs = mainCategories.map((c) => c.slug);

    logger.info(`   Expected: ${EXPECTED_MAIN_CATEGORIES.length} main categories`);
    logger.info(`   Found: ${mainCategories.length} main categories\n`);

    const missingMain = EXPECTED_MAIN_CATEGORIES.filter((slug) => !mainCategorySlugs.includes(slug));
    if (missingMain.length > 0) {
      logger.info(`   ❌ Missing main categories: ${missingMain.join(', ')}`);
      issues.push(`Missing main categories: ${missingMain.join(', ')}`);
      allPassed = false;
    } else {
      logger.info('   ✅ All 11 main categories exist');
    }

    // ========================================
    // CHECK 2: Subcategories
    // ========================================
    logger.info('\n========================================');
    logger.info('CHECK 2: Subcategories');
    logger.info('========================================\n');

    const subcategories = await categoriesCollection.find({ parentCategory: { $ne: null } }).toArray();
    logger.info(`   Found: ${subcategories.length} subcategories\n`);

    // Check each subcategory has valid parent
    let orphanedSubcategories = 0;
    for (const sub of subcategories) {
      const parent = await categoriesCollection.findOne({ _id: sub.parentCategory });
      if (!parent) {
        orphanedSubcategories++;
        issues.push(`Orphaned subcategory: ${sub.name} (${sub.slug})`);
      }
    }

    if (orphanedSubcategories > 0) {
      logger.info(`   ❌ Found ${orphanedSubcategories} orphaned subcategories`);
      allPassed = false;
    } else {
      logger.info('   ✅ All subcategories have valid parent references');
    }

    // Show subcategory distribution
    logger.info('\n   📊 Subcategories by Main Category:');
    for (const mainCat of mainCategories) {
      const subCount = await categoriesCollection.countDocuments({ parentCategory: mainCat._id });
      logger.info(`      ${mainCat.name}: ${subCount} subcategories`);
    }

    // ========================================
    // CHECK 3: Stores
    // ========================================
    logger.info('\n========================================');
    logger.info('CHECK 3: Stores');
    logger.info('========================================\n');

    const stores = await storesCollection.find({}).toArray();
    logger.info(`   Found: ${stores.length} stores\n`);

    let storesWithoutCategory = 0;
    let storesWithoutSubcategory = 0;
    let storesWithoutSubcategorySlug = 0;
    let storesWithInvalidCategory = 0;
    let storesWithInvalidSubcategory = 0;

    for (const store of stores) {
      if (!store.category) {
        storesWithoutCategory++;
        issues.push(`Store without category: ${store.name}`);
      } else {
        const cat = await categoriesCollection.findOne({ _id: store.category });
        if (!cat) {
          storesWithInvalidCategory++;
          issues.push(`Store with invalid category: ${store.name}`);
        }
      }

      if (!store.subcategory) {
        storesWithoutSubcategory++;
        issues.push(`Store without subcategory: ${store.name}`);
      } else {
        const subcat = await categoriesCollection.findOne({ _id: store.subcategory });
        if (!subcat) {
          storesWithInvalidSubcategory++;
          issues.push(`Store with invalid subcategory: ${store.name}`);
        }
      }

      if (!store.subcategorySlug) {
        storesWithoutSubcategorySlug++;
        issues.push(`Store without subcategorySlug: ${store.name}`);
      }
    }

    if (storesWithoutCategory > 0) {
      logger.info(`   ❌ ${storesWithoutCategory} stores without category`);
      allPassed = false;
    }
    if (storesWithoutSubcategory > 0) {
      logger.info(`   ❌ ${storesWithoutSubcategory} stores without subcategory`);
      allPassed = false;
    }
    if (storesWithoutSubcategorySlug > 0) {
      logger.info(`   ❌ ${storesWithoutSubcategorySlug} stores without subcategorySlug`);
      allPassed = false;
    }
    if (storesWithInvalidCategory > 0) {
      logger.info(`   ❌ ${storesWithInvalidCategory} stores with invalid category reference`);
      allPassed = false;
    }
    if (storesWithInvalidSubcategory > 0) {
      logger.info(`   ❌ ${storesWithInvalidSubcategory} stores with invalid subcategory reference`);
      allPassed = false;
    }

    if (
      storesWithoutCategory === 0 &&
      storesWithoutSubcategory === 0 &&
      storesWithoutSubcategorySlug === 0 &&
      storesWithInvalidCategory === 0 &&
      storesWithInvalidSubcategory === 0
    ) {
      logger.info('   ✅ All stores have valid category, subcategory, and subcategorySlug');
    }

    // Show store distribution
    logger.info('\n   📊 Stores by Main Category:');
    for (const mainCat of mainCategories) {
      const storeCount = await storesCollection.countDocuments({ category: mainCat._id });
      if (storeCount > 0) {
        logger.info(`      ${mainCat.name}: ${storeCount} stores`);
      }
    }

    // ========================================
    // CHECK 4: Products
    // ========================================
    logger.info('\n========================================');
    logger.info('CHECK 4: Products');
    logger.info('========================================\n');

    const products = await productsCollection.find({}).toArray();
    logger.info(`   Found: ${products.length} products\n`);

    let productsWithoutStore = 0;
    let productsWithoutCategory = 0;
    let productsWithoutSubCategory = 0;
    let productsWithoutSubSubCategory = 0;
    let productsWithInvalidStore = 0;
    let productsWithInvalidCategory = 0;
    let productsWithInvalidSubCategory = 0;

    for (const product of products) {
      if (!product.store) {
        productsWithoutStore++;
      } else {
        const store = await storesCollection.findOne({ _id: product.store });
        if (!store) {
          productsWithInvalidStore++;
        }
      }

      if (!product.category) {
        productsWithoutCategory++;
      } else {
        const cat = await categoriesCollection.findOne({ _id: product.category });
        if (!cat) {
          productsWithInvalidCategory++;
        }
      }

      if (!product.subCategory) {
        productsWithoutSubCategory++;
      } else {
        const subcat = await categoriesCollection.findOne({ _id: product.subCategory });
        if (!subcat) {
          productsWithInvalidSubCategory++;
        }
      }

      if (!product.subSubCategory) {
        productsWithoutSubSubCategory++;
      }
    }

    if (productsWithoutStore > 0) {
      logger.info(`   ❌ ${productsWithoutStore} products without store`);
      allPassed = false;
    }
    if (productsWithoutCategory > 0) {
      logger.info(`   ❌ ${productsWithoutCategory} products without category`);
      allPassed = false;
    }
    if (productsWithoutSubCategory > 0) {
      logger.info(`   ❌ ${productsWithoutSubCategory} products without subCategory`);
      allPassed = false;
    }
    if (productsWithoutSubSubCategory > 0) {
      logger.info(`   ⚠️ ${productsWithoutSubSubCategory} products without subSubCategory (warning)`);
    }
    if (productsWithInvalidStore > 0) {
      logger.info(`   ❌ ${productsWithInvalidStore} products with invalid store reference`);
      allPassed = false;
    }
    if (productsWithInvalidCategory > 0) {
      logger.info(`   ❌ ${productsWithInvalidCategory} products with invalid category reference`);
      allPassed = false;
    }
    if (productsWithInvalidSubCategory > 0) {
      logger.info(`   ❌ ${productsWithInvalidSubCategory} products with invalid subCategory reference`);
      allPassed = false;
    }

    if (
      productsWithoutStore === 0 &&
      productsWithoutCategory === 0 &&
      productsWithoutSubCategory === 0 &&
      productsWithInvalidStore === 0 &&
      productsWithInvalidCategory === 0 &&
      productsWithInvalidSubCategory === 0
    ) {
      logger.info('   ✅ All products have valid store, category, and subCategory references');
    }

    // Show product distribution
    logger.info('\n   📊 Products by Main Category:');
    for (const mainCat of mainCategories) {
      const productCount = await productsCollection.countDocuments({ category: mainCat._id });
      if (productCount > 0) {
        logger.info(`      ${mainCat.name}: ${productCount} products`);
      }
    }

    // ========================================
    // CHECK 5: Products per Store
    // ========================================
    logger.info('\n========================================');
    logger.info('CHECK 5: Products per Store');
    logger.info('========================================\n');

    let storesWithNoProducts = 0;
    let storesWithFewProducts = 0;
    const storesWithNoProductsList: string[] = [];

    for (const store of stores) {
      const productCount = await productsCollection.countDocuments({ store: store._id });
      if (productCount === 0) {
        storesWithNoProducts++;
        storesWithNoProductsList.push(store.name);
      } else if (productCount < 3) {
        storesWithFewProducts++;
      }
    }

    if (storesWithNoProducts > 0) {
      logger.info(`   ❌ ${storesWithNoProducts} stores with 0 products:`);
      storesWithNoProductsList.forEach((name) => console.log(`      - ${name}`));
      allPassed = false;
    } else {
      logger.info('   ✅ All stores have at least 1 product');
    }

    if (storesWithFewProducts > 0) {
      logger.info(`   ⚠️ ${storesWithFewProducts} stores with fewer than 3 products (warning)`);
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    logger.info('\n========================================');
    logger.info('📊 FINAL VERIFICATION SUMMARY');
    logger.info('========================================');
    logger.info(
      `Categories: ${mainCategories.length} main + ${subcategories.length} subcategories = ${mainCategories.length + subcategories.length} total`,
    );
    logger.info(`Stores: ${stores.length} total`);
    logger.info(`Products: ${products.length} total`);
    logger.info('========================================\n');

    if (allPassed) {
      logger.info('✅✅✅ ALL CHECKS PASSED! ✅✅✅');
      logger.info('🎉 Data is PRODUCTION READY! 🎉\n');
    } else {
      logger.info('❌❌❌ SOME CHECKS FAILED ❌❌❌');
      logger.info(`Found ${issues.length} issues:\n`);
      issues.slice(0, 20).forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
      if (issues.length > 20) {
        logger.info(`   ... and ${issues.length - 20} more issues`);
      }
      logger.info('\n');
    }
  } catch (error) {
    logger.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await disconnectDb();
  }
}

verifyProductionData()
  .then(() => {
    logger.info('✅ Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });
