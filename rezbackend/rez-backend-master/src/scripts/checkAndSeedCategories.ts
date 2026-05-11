import mongoose from 'mongoose';
import { Category } from '../models/Category';
import dotenv from 'dotenv';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config();

// Categories based on what's shown on the frontend home page
const categoriesToSeed = [
  // Going Out categories
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Fashion and clothing stores',
    icon: '👗',
    type: 'going_out' as const,
    metadata: {
      color: '#FF6B6B',
      featured: true,
      tags: ['fashion', 'clothing', 'apparel'],
    },
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Fleet Market',
    slug: 'fleet-market',
    description: 'Fleet and automotive market',
    icon: '🚗',
    type: 'going_out' as const,
    metadata: {
      color: '#4ECDC4',
      featured: true,
      tags: ['fleet', 'automotive', 'cars'],
    },
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'Gift',
    slug: 'gift',
    description: 'Gift shops and gift items',
    icon: '🎁',
    type: 'going_out' as const,
    metadata: {
      color: '#45B7D1',
      featured: true,
      tags: ['gift', 'presents', 'gifting'],
    },
    sortOrder: 3,
    isActive: true,
  },
  {
    name: 'Restaurant',
    slug: 'restaurant',
    description: 'Restaurants and dining',
    icon: '🍽️',
    type: 'going_out' as const,
    metadata: {
      color: '#FFA07A',
      featured: true,
      tags: ['restaurant', 'dining', 'food'],
    },
    sortOrder: 4,
    isActive: true,
  },
  // Home Delivery categories
  {
    name: 'Organic',
    slug: 'organic',
    description: 'Organic products and groceries',
    icon: '🌿',
    type: 'home_delivery' as const,
    metadata: {
      color: '#96CEB4',
      featured: true,
      tags: ['organic', 'natural', 'healthy'],
    },
    sortOrder: 5,
    isActive: true,
  },
  {
    name: 'Grocery',
    slug: 'grocery',
    description: 'Grocery and daily essentials',
    icon: '🛒',
    type: 'home_delivery' as const,
    metadata: {
      color: '#FFEAA7',
      featured: true,
      tags: ['grocery', 'essentials', 'daily'],
    },
    sortOrder: 6,
    isActive: true,
  },
  {
    name: 'Medicine',
    slug: 'medicine',
    description: 'Pharmacy and medicine',
    icon: '💊',
    type: 'home_delivery' as const,
    metadata: {
      color: '#DDA0DD',
      featured: true,
      tags: ['medicine', 'pharmacy', 'health'],
    },
    sortOrder: 7,
    isActive: true,
  },
  {
    name: 'Fruit',
    slug: 'fruit',
    description: 'Fresh fruits and produce',
    icon: '🍎',
    type: 'home_delivery' as const,
    metadata: {
      color: '#FF6B9D',
      featured: true,
      tags: ['fruit', 'fresh', 'produce'],
    },
    sortOrder: 8,
    isActive: true,
  },
  // Additional common categories for products
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronics and gadgets',
    icon: '📱',
    type: 'home_delivery' as const,
    metadata: {
      color: '#FFD93D',
      featured: false,
      tags: ['electronics', 'gadgets', 'tech'],
    },
    sortOrder: 9,
    isActive: true,
  },
  {
    name: 'Clothing',
    slug: 'clothing',
    description: 'Clothing and apparel',
    icon: '👕',
    type: 'home_delivery' as const,
    metadata: {
      color: '#6BCB77',
      featured: false,
      tags: ['clothing', 'apparel', 'fashion'],
    },
    sortOrder: 10,
    isActive: true,
  },
  {
    name: 'Food & Beverage',
    slug: 'food-beverage',
    description: 'Food and beverages',
    icon: '🍕',
    type: 'home_delivery' as const,
    metadata: {
      color: '#4ECDC4',
      featured: false,
      tags: ['food', 'beverage', 'drinks'],
    },
    sortOrder: 11,
    isActive: true,
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home and garden products',
    icon: '🏠',
    type: 'home_delivery' as const,
    metadata: {
      color: '#95E1D3',
      featured: false,
      tags: ['home', 'garden', 'furniture'],
    },
    sortOrder: 12,
    isActive: true,
  },
  {
    name: 'Beauty & Health',
    slug: 'beauty-health',
    description: 'Beauty and health products',
    icon: '💄',
    type: 'home_delivery' as const,
    metadata: {
      color: '#F38181',
      featured: false,
      tags: ['beauty', 'health', 'cosmetics'],
    },
    sortOrder: 13,
    isActive: true,
  },
  {
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Sports and outdoor equipment',
    icon: '⚽',
    type: 'home_delivery' as const,
    metadata: {
      color: '#AA96DA',
      featured: false,
      tags: ['sports', 'outdoors', 'fitness'],
    },
    sortOrder: 14,
    isActive: true,
  },
  {
    name: 'Books & Media',
    slug: 'books-media',
    description: 'Books and media products',
    icon: '📚',
    type: 'home_delivery' as const,
    metadata: {
      color: '#FCBAD3',
      featured: false,
      tags: ['books', 'media', 'entertainment'],
    },
    sortOrder: 15,
    isActive: true,
  },
  {
    name: 'Toys & Games',
    slug: 'toys-games',
    description: 'Toys and games',
    icon: '🎮',
    type: 'home_delivery' as const,
    metadata: {
      color: '#FFD93D',
      featured: false,
      tags: ['toys', 'games', 'entertainment'],
    },
    sortOrder: 16,
    isActive: true,
  },
  {
    name: 'Automotive',
    slug: 'automotive',
    description: 'Automotive products and accessories',
    icon: '🚙',
    type: 'home_delivery' as const,
    metadata: {
      color: '#95A5A6',
      featured: false,
      tags: ['automotive', 'cars', 'vehicles'],
    },
    sortOrder: 17,
    isActive: true,
  },
  {
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    description: 'Pet supplies and accessories',
    icon: '🐾',
    type: 'home_delivery' as const,
    metadata: {
      color: '#F39C12',
      featured: false,
      tags: ['pets', 'animals', 'supplies'],
    },
    sortOrder: 18,
    isActive: true,
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'Other products',
    icon: '📦',
    type: 'general' as const,
    metadata: {
      color: '#BDC3C7',
      featured: false,
      tags: ['other', 'misc'],
    },
    sortOrder: 99,
    isActive: true,
  },
  // New category for Books & Stationery
  {
    name: 'Books & Stationery',
    slug: 'books-stationery',
    description: 'Books, stationery and office supplies',
    icon: '📖',
    type: 'home_delivery' as const,
    metadata: {
      color: '#9B59B6',
      featured: false,
      tags: ['books', 'stationery', 'office'],
    },
    sortOrder: 20,
    isActive: true,
  },
  // Jewellery category
  {
    name: 'Jewellery',
    slug: 'jewellery',
    description: 'Jewellery and accessories',
    icon: '💍',
    type: 'going_out' as const,
    metadata: {
      color: '#F1C40F',
      featured: true,
      tags: ['jewellery', 'accessories', 'gold'],
    },
    sortOrder: 21,
    isActive: true,
  },
];

// Subcategories - will be linked to parent categories after they exist
const subcategoriesToSeed = [
  // Fashion subcategories
  { name: "Men's Clothing", slug: 'mens-clothing', parentSlug: 'fashion', type: 'going_out' as const },
  { name: "Women's Clothing", slug: 'womens-clothing', parentSlug: 'fashion', type: 'going_out' as const },
  { name: 'Kids Clothing', slug: 'kids-clothing', parentSlug: 'fashion', type: 'going_out' as const },
  { name: 'Footwear', slug: 'footwear', parentSlug: 'fashion', type: 'going_out' as const },
  { name: 'Accessories', slug: 'fashion-accessories', parentSlug: 'fashion', type: 'going_out' as const },

  // Electronics subcategories
  { name: 'Mobile Phones', slug: 'mobile-phones', parentSlug: 'electronics', type: 'home_delivery' as const },
  { name: 'Laptops', slug: 'laptops', parentSlug: 'electronics', type: 'home_delivery' as const },
  { name: 'Tablets', slug: 'tablets', parentSlug: 'electronics', type: 'home_delivery' as const },
  { name: 'Audio & Headphones', slug: 'audio-headphones', parentSlug: 'electronics', type: 'home_delivery' as const },
  { name: 'Cameras', slug: 'cameras', parentSlug: 'electronics', type: 'home_delivery' as const },
  {
    name: 'TV & Home Entertainment',
    slug: 'tv-home-entertainment',
    parentSlug: 'electronics',
    type: 'home_delivery' as const,
  },
  {
    name: 'Computer Accessories',
    slug: 'computer-accessories',
    parentSlug: 'electronics',
    type: 'home_delivery' as const,
  },

  // Clothing subcategories
  { name: 'Shirts', slug: 'shirts', parentSlug: 'clothing', type: 'home_delivery' as const },
  { name: 'T-Shirts', slug: 't-shirts', parentSlug: 'clothing', type: 'home_delivery' as const },
  { name: 'Pants & Jeans', slug: 'pants-jeans', parentSlug: 'clothing', type: 'home_delivery' as const },
  { name: 'Dresses', slug: 'dresses', parentSlug: 'clothing', type: 'home_delivery' as const },
  { name: 'Ethnic Wear', slug: 'ethnic-wear', parentSlug: 'clothing', type: 'home_delivery' as const },
  { name: 'Winter Wear', slug: 'winter-wear', parentSlug: 'clothing', type: 'home_delivery' as const },

  // Food & Beverage subcategories
  { name: 'Snacks', slug: 'snacks', parentSlug: 'food-beverage', type: 'home_delivery' as const },
  { name: 'Beverages', slug: 'beverages', parentSlug: 'food-beverage', type: 'home_delivery' as const },
  { name: 'Dairy Products', slug: 'dairy-products', parentSlug: 'food-beverage', type: 'home_delivery' as const },
  { name: 'Bakery', slug: 'bakery', parentSlug: 'food-beverage', type: 'home_delivery' as const },
  { name: 'Frozen Foods', slug: 'frozen-foods', parentSlug: 'food-beverage', type: 'home_delivery' as const },

  // Home & Garden subcategories
  { name: 'Furniture', slug: 'furniture', parentSlug: 'home-garden', type: 'home_delivery' as const },
  { name: 'Kitchen & Dining', slug: 'kitchen-dining', parentSlug: 'home-garden', type: 'home_delivery' as const },
  { name: 'Bedding & Bath', slug: 'bedding-bath', parentSlug: 'home-garden', type: 'home_delivery' as const },
  { name: 'Home Decor', slug: 'home-decor', parentSlug: 'home-garden', type: 'home_delivery' as const },
  { name: 'Garden & Outdoor', slug: 'garden-outdoor', parentSlug: 'home-garden', type: 'home_delivery' as const },
  { name: 'Lighting', slug: 'lighting', parentSlug: 'home-garden', type: 'home_delivery' as const },

  // Beauty & Health subcategories
  { name: 'Skincare', slug: 'skincare', parentSlug: 'beauty-health', type: 'home_delivery' as const },
  { name: 'Haircare', slug: 'haircare', parentSlug: 'beauty-health', type: 'home_delivery' as const },
  { name: 'Makeup', slug: 'makeup', parentSlug: 'beauty-health', type: 'home_delivery' as const },
  { name: 'Fragrances', slug: 'fragrances', parentSlug: 'beauty-health', type: 'home_delivery' as const },
  { name: 'Personal Care', slug: 'personal-care', parentSlug: 'beauty-health', type: 'home_delivery' as const },
  {
    name: 'Health Supplements',
    slug: 'health-supplements',
    parentSlug: 'beauty-health',
    type: 'home_delivery' as const,
  },

  // Sports & Outdoors subcategories
  {
    name: 'Fitness Equipment',
    slug: 'fitness-equipment',
    parentSlug: 'sports-outdoors',
    type: 'home_delivery' as const,
  },
  { name: 'Sports Clothing', slug: 'sports-clothing', parentSlug: 'sports-outdoors', type: 'home_delivery' as const },
  { name: 'Cycling', slug: 'cycling', parentSlug: 'sports-outdoors', type: 'home_delivery' as const },
  { name: 'Camping & Hiking', slug: 'camping-hiking', parentSlug: 'sports-outdoors', type: 'home_delivery' as const },
  { name: 'Team Sports', slug: 'team-sports', parentSlug: 'sports-outdoors', type: 'home_delivery' as const },

  // Books & Media subcategories
  { name: 'Fiction', slug: 'fiction', parentSlug: 'books-media', type: 'home_delivery' as const },
  { name: 'Non-Fiction', slug: 'non-fiction', parentSlug: 'books-media', type: 'home_delivery' as const },
  { name: 'Educational', slug: 'educational', parentSlug: 'books-media', type: 'home_delivery' as const },
  { name: 'Comics & Manga', slug: 'comics-manga', parentSlug: 'books-media', type: 'home_delivery' as const },
  { name: 'Music & Movies', slug: 'music-movies', parentSlug: 'books-media', type: 'home_delivery' as const },

  // Books & Stationery subcategories
  {
    name: 'Notebooks & Diaries',
    slug: 'notebooks-diaries',
    parentSlug: 'books-stationery',
    type: 'home_delivery' as const,
  },
  { name: 'Pens & Pencils', slug: 'pens-pencils', parentSlug: 'books-stationery', type: 'home_delivery' as const },
  { name: 'Office Supplies', slug: 'office-supplies', parentSlug: 'books-stationery', type: 'home_delivery' as const },
  { name: 'Art Supplies', slug: 'art-supplies', parentSlug: 'books-stationery', type: 'home_delivery' as const },
  { name: 'School Supplies', slug: 'school-supplies', parentSlug: 'books-stationery', type: 'home_delivery' as const },

  // Toys & Games subcategories
  { name: 'Action Figures', slug: 'action-figures', parentSlug: 'toys-games', type: 'home_delivery' as const },
  { name: 'Board Games', slug: 'board-games', parentSlug: 'toys-games', type: 'home_delivery' as const },
  { name: 'Video Games', slug: 'video-games', parentSlug: 'toys-games', type: 'home_delivery' as const },
  { name: 'Educational Toys', slug: 'educational-toys', parentSlug: 'toys-games', type: 'home_delivery' as const },
  { name: 'Outdoor Toys', slug: 'outdoor-toys', parentSlug: 'toys-games', type: 'home_delivery' as const },

  // Grocery subcategories
  { name: 'Rice & Grains', slug: 'rice-grains', parentSlug: 'grocery', type: 'home_delivery' as const },
  { name: 'Pulses & Lentils', slug: 'pulses-lentils', parentSlug: 'grocery', type: 'home_delivery' as const },
  { name: 'Cooking Oil', slug: 'cooking-oil', parentSlug: 'grocery', type: 'home_delivery' as const },
  { name: 'Spices & Masala', slug: 'spices-masala', parentSlug: 'grocery', type: 'home_delivery' as const },
  { name: 'Flour & Atta', slug: 'flour-atta', parentSlug: 'grocery', type: 'home_delivery' as const },

  // Jewellery subcategories
  { name: 'Gold Jewellery', slug: 'gold-jewellery', parentSlug: 'jewellery', type: 'going_out' as const },
  { name: 'Silver Jewellery', slug: 'silver-jewellery', parentSlug: 'jewellery', type: 'going_out' as const },
  { name: 'Diamond Jewellery', slug: 'diamond-jewellery', parentSlug: 'jewellery', type: 'going_out' as const },
  { name: 'Artificial Jewellery', slug: 'artificial-jewellery', parentSlug: 'jewellery', type: 'going_out' as const },
  { name: 'Watches', slug: 'watches', parentSlug: 'jewellery', type: 'going_out' as const },

  // Restaurant subcategories
  { name: 'Fast Food', slug: 'fast-food', parentSlug: 'restaurant', type: 'going_out' as const },
  { name: 'Fine Dining', slug: 'fine-dining', parentSlug: 'restaurant', type: 'going_out' as const },
  { name: 'Cafe', slug: 'cafe', parentSlug: 'restaurant', type: 'going_out' as const },
  { name: 'Street Food', slug: 'street-food', parentSlug: 'restaurant', type: 'going_out' as const },
  { name: 'Bakery & Desserts', slug: 'bakery-desserts', parentSlug: 'restaurant', type: 'going_out' as const },

  // Gift subcategories
  { name: 'Birthday Gifts', slug: 'birthday-gifts', parentSlug: 'gift', type: 'going_out' as const },
  { name: 'Anniversary Gifts', slug: 'anniversary-gifts', parentSlug: 'gift', type: 'going_out' as const },
  { name: 'Wedding Gifts', slug: 'wedding-gifts', parentSlug: 'gift', type: 'going_out' as const },
  { name: 'Corporate Gifts', slug: 'corporate-gifts', parentSlug: 'gift', type: 'going_out' as const },
  { name: 'Personalized Gifts', slug: 'personalized-gifts', parentSlug: 'gift', type: 'going_out' as const },

  // Pet Supplies subcategories
  { name: 'Dog Supplies', slug: 'dog-supplies', parentSlug: 'pet-supplies', type: 'home_delivery' as const },
  { name: 'Cat Supplies', slug: 'cat-supplies', parentSlug: 'pet-supplies', type: 'home_delivery' as const },
  { name: 'Bird Supplies', slug: 'bird-supplies', parentSlug: 'pet-supplies', type: 'home_delivery' as const },
  { name: 'Fish & Aquarium', slug: 'fish-aquarium', parentSlug: 'pet-supplies', type: 'home_delivery' as const },
  { name: 'Pet Food', slug: 'pet-food', parentSlug: 'pet-supplies', type: 'home_delivery' as const },

  // Automotive subcategories
  { name: 'Car Accessories', slug: 'car-accessories', parentSlug: 'automotive', type: 'home_delivery' as const },
  { name: 'Bike Accessories', slug: 'bike-accessories', parentSlug: 'automotive', type: 'home_delivery' as const },
  { name: 'Car Care', slug: 'car-care', parentSlug: 'automotive', type: 'home_delivery' as const },
  { name: 'Tyres & Wheels', slug: 'tyres-wheels', parentSlug: 'automotive', type: 'home_delivery' as const },
  { name: 'Spare Parts', slug: 'spare-parts', parentSlug: 'automotive', type: 'home_delivery' as const },
];

async function checkAndSeedCategories() {
  try {
    logger.info('🔌 Connecting to MongoDB...');

    // Connect to MongoDB
    await connectScriptDb();

    logger.info('✅ Connected to MongoDB');

    // Check existing categories
    const existingCategories = await Category.find({}).select('name slug').lean();
    logger.info(`\n📊 Found ${existingCategories.length} existing categories in database`);

    if (existingCategories.length > 0) {
      logger.info('\n📋 Existing categories:');
      existingCategories.forEach((cat: any) => {
        logger.info(`   - ${cat.name} (${cat.slug})`);
      });
    }

    // Check which categories need to be created
    const existingSlugs = new Set(existingCategories.map((cat: any) => cat.slug));
    const categoriesToCreate = categoriesToSeed.filter((cat) => !existingSlugs.has(cat.slug));

    logger.info(`\n🆕 Categories to create: ${categoriesToCreate.length}`);

    if (categoriesToCreate.length === 0) {
      logger.info('✅ All categories already exist in the database!');
      await mongoose.disconnect();
      return;
    }

    // Create missing categories
    logger.info('\n🌱 Creating categories...');
    let createdCount = 0;
    let errorCount = 0;

    for (const categoryData of categoriesToCreate) {
      try {
        const category = new Category(categoryData);
        await category.save();
        logger.info(`   ✅ Created: ${categoryData.name} (${categoryData.slug})`);
        createdCount++;
      } catch (error: any) {
        if (error.code === 11000) {
          logger.info(`   ⚠️  Skipped: ${categoryData.name} (${categoryData.slug}) - already exists`);
        } else {
          logger.error(`   ❌ Error creating ${categoryData.name}:`, error.message);
          errorCount++;
        }
      }
    }

    logger.info(`\n📈 Summary:`);
    logger.info(`   ✅ Created: ${createdCount}`);
    logger.info(`   ❌ Errors: ${errorCount}`);
    logger.info(`   📊 Total categories in DB: ${existingCategories.length + createdCount}`);

    // Verify final count
    const finalCount = await Category.countDocuments({ isActive: true, parentCategory: null });
    logger.info(`\n✅ Active parent categories in database: ${finalCount}`);

    // ==================== SEED SUBCATEGORIES ====================
    logger.info('\n\n📂 SEEDING SUBCATEGORIES...\n');

    // Get all parent categories with their slugs and IDs
    const allParentCategories = await Category.find({ parentCategory: null }).select('_id slug name').lean();
    const parentCategoryMap = new Map(allParentCategories.map((cat: any) => [cat.slug, cat._id]));

    logger.info(`📋 Found ${allParentCategories.length} parent categories to link subcategories`);

    // Check existing subcategories
    const existingSubcategories = await Category.find({ parentCategory: { $ne: null } })
      .select('slug')
      .lean();
    const existingSubcategorySlugs = new Set(existingSubcategories.map((cat: any) => cat.slug));

    logger.info(`📊 Found ${existingSubcategories.length} existing subcategories`);

    // Filter subcategories that need to be created
    const subcategoriesToCreate = subcategoriesToSeed.filter((sub) => !existingSubcategorySlugs.has(sub.slug));

    logger.info(`🆕 Subcategories to create: ${subcategoriesToCreate.length}`);

    if (subcategoriesToCreate.length === 0) {
      logger.info('✅ All subcategories already exist in the database!');
    } else {
      // Create missing subcategories
      logger.info('\n🌱 Creating subcategories...');
      let subcreatedCount = 0;
      let suberrorCount = 0;

      for (const subcategoryData of subcategoriesToCreate) {
        try {
          const parentId = parentCategoryMap.get(subcategoryData.parentSlug);

          if (!parentId) {
            logger.info(`   ⚠️  Skipped: ${subcategoryData.name} - parent "${subcategoryData.parentSlug}" not found`);
            continue;
          }

          const subcategory = new Category({
            name: subcategoryData.name,
            slug: subcategoryData.slug,
            description: `${subcategoryData.name} products`,
            type: subcategoryData.type,
            parentCategory: parentId,
            isActive: true,
            metadata: {
              featured: false,
              tags: [subcategoryData.slug.replace(/-/g, ' ')],
            },
          });

          await subcategory.save();
          logger.info(`   ✅ Created: ${subcategoryData.name} → ${subcategoryData.parentSlug}`);
          subcreatedCount++;
        } catch (error: any) {
          if (error.code === 11000) {
            logger.info(`   ⚠️  Skipped: ${subcategoryData.name} (${subcategoryData.slug}) - already exists`);
          } else {
            logger.error(`   ❌ Error creating ${subcategoryData.name}:`, error.message);
            suberrorCount++;
          }
        }
      }

      logger.info(`\n📈 Subcategories Summary:`);
      logger.info(`   ✅ Created: ${subcreatedCount}`);
      logger.info(`   ❌ Errors: ${suberrorCount}`);
    }

    // Final verification
    const finalSubcategoryCount = await Category.countDocuments({ isActive: true, parentCategory: { $ne: null } });
    const totalCategories = await Category.countDocuments({ isActive: true });
    logger.info(`\n📊 Final Category Count:`);
    logger.info(`   📁 Parent Categories: ${finalCount}`);
    logger.info(`   📂 Subcategories: ${finalSubcategoryCount}`);
    logger.info(`   📦 Total: ${totalCategories}`);

    await disconnectDb();
    logger.info('\n✅ Disconnected from MongoDB');
  } catch (error) {
    logger.error('❌ Error:', error);
    await disconnectDb();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  checkAndSeedCategories()
    .then(() => {
      logger.info('\n🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export default checkAndSeedCategories;
