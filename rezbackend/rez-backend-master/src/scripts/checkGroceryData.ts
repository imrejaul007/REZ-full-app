/**
 * Check Grocery Data Script
 * Audits MongoDB to see what grocery-related data exists
 *
 * Run with: npx ts-node src/scripts/checkGroceryData.ts
 */

import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';

dotenv.config();

// Import models
import { Category } from '../models/Category';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { logger } from '../config/logger';

interface GroceryAuditResult {
  mainCategory: any;
  subcategories: any[];
  stores: {
    total: number;
    samples: any[];
  };
  products: {
    total: number;
    bySubcategory: Record<string, number>;
    samples: any[];
  };
  issues: string[];
  recommendations: string[];
}

async function checkGroceryData(): Promise<GroceryAuditResult> {
  const result: GroceryAuditResult = {
    mainCategory: null,
    subcategories: [],
    stores: { total: 0, samples: [] },
    products: { total: 0, bySubcategory: {}, samples: [] },
    issues: [],
    recommendations: [],
  };

  logger.info('\n========================================');
  logger.info('GROCERY DATA AUDIT');
  logger.info('========================================\n');

  // 1. Check main Grocery category
  logger.info('1. Checking main Grocery category...');
  const groceryCategory = await Category.findOne({ slug: 'grocery' });

  if (groceryCategory) {
    result.mainCategory = {
      _id: groceryCategory._id,
      name: groceryCategory.name,
      slug: groceryCategory.slug,
      type: groceryCategory.type,
      productCount: groceryCategory.productCount,
      storeCount: groceryCategory.storeCount,
      maxCashback: groceryCategory.maxCashback,
      isActive: groceryCategory.isActive,
    };
    logger.info('   Found Grocery category:', result.mainCategory.name);
    logger.info('   - Type:', result.mainCategory.type);
    logger.info('   - Product Count (metadata):', result.mainCategory.productCount);
    logger.info('   - Store Count (metadata):', result.mainCategory.storeCount);
  } else {
    result.issues.push('Main Grocery category not found!');
    logger.info('   ERROR: Grocery category not found!');
    result.recommendations.push('Run masterSeeds.ts to create Grocery category');
  }

  // 2. Check subcategories
  logger.info('\n2. Checking Grocery subcategories...');
  if (groceryCategory) {
    const subcategories = await Category.find({
      parentCategory: groceryCategory._id,
    }).select('name slug productCount storeCount isActive');

    result.subcategories = subcategories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      productCount: cat.productCount,
      storeCount: cat.storeCount,
      isActive: cat.isActive,
    }));

    if (subcategories.length > 0) {
      logger.info(`   Found ${subcategories.length} subcategories:`);
      subcategories.forEach((cat) => {
        logger.info(`   - ${cat.name} (${cat.slug}): ${cat.productCount || 0} products`);
      });
    } else {
      result.issues.push('No grocery subcategories found!');
      logger.info('   WARNING: No subcategories found');
      result.recommendations.push('Create subcategories: Fruits, Vegetables, Dairy, Snacks, Beverages, etc.');
    }

    // Check for required subcategories
    const requiredSlugs = ['fruits', 'veggies', 'vegetables', 'dairy', 'snacks', 'beverages'];
    const existingSlugs = subcategories.map((c) => c.slug);
    const missingSlugs = requiredSlugs.filter((slug) => !existingSlugs.includes(slug));

    if (missingSlugs.length > 0) {
      result.issues.push(`Missing subcategories: ${missingSlugs.join(', ')}`);
      result.recommendations.push(`Create missing subcategories: ${missingSlugs.join(', ')}`);
    }
  }

  // 3. Check grocery stores
  logger.info('\n3. Checking Grocery stores...');

  // Try multiple ways to find grocery stores
  let groceryStores: any[] = [];

  // Method 1: By category ID
  if (groceryCategory) {
    groceryStores = await Store.find({
      category: groceryCategory._id,
      isActive: true,
    })
      .select('name slug rating maxCashback deliveryCategories')
      .limit(10);
  }

  // Method 2: By tags
  if (groceryStores.length === 0) {
    groceryStores = await Store.find({
      $or: [
        { tags: { $in: ['grocery', 'essentials', 'supermarket'] } },
        { 'deliveryCategories.fastDelivery': true },
        { name: { $regex: /grocery|mart|fresh|basket|blinkit|zepto/i } },
      ],
      isActive: true,
    })
      .select('name slug rating maxCashback deliveryCategories tags')
      .limit(10);
  }

  result.stores.total = groceryStores.length;
  result.stores.samples = groceryStores.map((store) => ({
    _id: store._id,
    name: store.name,
    slug: store.slug,
    rating: store.rating,
    maxCashback: store.maxCashback,
    tags: store.tags,
  }));

  if (groceryStores.length > 0) {
    logger.info(`   Found ${groceryStores.length} grocery stores:`);
    groceryStores.slice(0, 5).forEach((store) => {
      logger.info(`   - ${store.name} (Rating: ${store.rating || 'N/A'})`);
    });
  } else {
    result.issues.push('No grocery stores found!');
    logger.info('   WARNING: No grocery stores found');
    result.recommendations.push('Seed grocery stores: BigBasket, Blinkit, Zepto, DMart, More, Reliance Fresh');
  }

  // 4. Check grocery products
  logger.info('\n4. Checking Grocery products...');

  let groceryProducts: any[] = [];

  // Method 1: By category
  if (groceryCategory) {
    // Check products directly under grocery category
    const directProducts = await Product.countDocuments({
      category: groceryCategory._id,
      status: 'active',
    });

    // Check products under subcategories
    const subcategoryIds = result.subcategories.map((c) => c._id);
    const subcategoryProducts = await Product.countDocuments({
      category: { $in: subcategoryIds },
      status: 'active',
    });

    result.products.total = directProducts + subcategoryProducts;

    // Get samples
    groceryProducts = await Product.find({
      category: { $in: [groceryCategory._id, ...subcategoryIds] },
      status: 'active',
    })
      .select('name category pricing images rating tags')
      .limit(10);

    result.products.samples = groceryProducts.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.pricing?.basePrice || p.pricing?.salePrice,
      rating: p.rating?.average,
      hasImage: p.images && p.images.length > 0,
    }));

    // Count by subcategory
    for (const subcat of result.subcategories) {
      const count = await Product.countDocuments({
        category: subcat._id,
        status: 'active',
      });
      result.products.bySubcategory[subcat.slug] = count;
    }
  }

  // Method 2: By tags if no category-based products found
  if (result.products.total === 0) {
    const taggedProducts = await Product.find({
      tags: { $in: ['grocery', 'food', 'vegetables', 'fruits', 'dairy', 'snacks'] },
      status: 'active',
    })
      .select('name category pricing images rating tags')
      .limit(10);

    result.products.total = taggedProducts.length;
    result.products.samples = taggedProducts.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.pricing?.basePrice,
      rating: p.rating?.average,
      hasImage: p.images && p.images.length > 0,
    }));
  }

  if (result.products.total > 0) {
    logger.info(`   Found ${result.products.total} grocery products`);
    if (Object.keys(result.products.bySubcategory).length > 0) {
      logger.info('   Products by subcategory:');
      Object.entries(result.products.bySubcategory).forEach(([slug, count]) => {
        logger.info(`   - ${slug}: ${count} products`);
      });
    }
    logger.info('   Sample products:');
    result.products.samples.slice(0, 5).forEach((p) => {
      logger.info(`   - ${p.name} (${p.price ? '₹' + p.price : 'No price'})`);
    });
  } else {
    result.issues.push('No grocery products found!');
    logger.info('   WARNING: No grocery products found');
    result.recommendations.push('Seed grocery products for each subcategory (50+ per category)');
  }

  // 5. Summary and recommendations
  logger.info('\n========================================');
  logger.info('AUDIT SUMMARY');
  logger.info('========================================\n');

  logger.info('Status:');
  logger.info(`  Main Category: ${result.mainCategory ? 'EXISTS' : 'MISSING'}`);
  logger.info(`  Subcategories: ${result.subcategories.length} found`);
  logger.info(`  Stores: ${result.stores.total} found`);
  logger.info(`  Products: ${result.products.total} found`);

  if (result.issues.length > 0) {
    logger.info('\nISSUES FOUND:');
    result.issues.forEach((issue, i) => {
      logger.info(`  ${i + 1}. ${issue}`);
    });
  }

  if (result.recommendations.length > 0) {
    logger.info('\nRECOMMENDATIONS:');
    result.recommendations.forEach((rec, i) => {
      logger.info(`  ${i + 1}. ${rec}`);
    });
  }

  // Overall status
  const isReady =
    result.mainCategory && result.subcategories.length >= 4 && result.stores.total >= 5 && result.products.total >= 20;

  logger.info('\n========================================');
  logger.info(`GROCERY DATA STATUS: ${isReady ? 'READY FOR PRODUCTION' : 'NEEDS SEEDING'}`);
  logger.info('========================================\n');

  if (!isReady) {
    logger.info('Run: npx ts-node src/scripts/seedGroceryData.ts');
  }

  return result;
}

// Main execution
async function main() {
  try {
    logger.info('Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('Connected successfully.\n');

    const result = await checkGroceryData();

    // Save result to JSON file for reference
    const fs = await import('fs');
    fs.writeFileSync('./grocery-audit-result.json', JSON.stringify(result, null, 2));
    logger.info('Audit result saved to grocery-audit-result.json\n');
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await disconnectDb();
    logger.info('Disconnected from MongoDB.');
  }
}

main();
