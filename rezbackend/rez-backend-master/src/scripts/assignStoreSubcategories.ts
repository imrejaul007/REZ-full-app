/**
 * Script to assign proper subcategories to stores
 * Maps stores to their appropriate subcategory based on store type
 */

import mongoose from 'mongoose';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

const DB_NAME = process.env.DB_NAME || 'test';

// Mapping of store names to their subcategory slug
const STORE_SUBCATEGORY_MAP: Record<string, string> = {
  // FOOD & DINING
  // Cafés
  Starbucks: 'cafes',
  'Dyu Art Cafe': 'cafes',

  // QSR / Fast Food
  KFC: 'qsr-fast-food',
  "McDonald's": 'qsr-fast-food',
  "Domino's Pizza": 'qsr-fast-food',

  // Family Restaurants
  'Barbeque Nation': 'family-restaurants',
  'Empire Restaurant': 'family-restaurants',

  // Fine Dining
  Chianti: 'fine-dining',

  // Ice Cream & Dessert
  'Corner House': 'ice-cream-dessert',
  'Baskin Robbins': 'ice-cream-dessert',

  // Bakery & Confectionery
  Theobroma: 'bakery-confectionery',
  "Glen's Bakehouse": 'bakery-confectionery',
  'Iyengar Bakery': 'bakery-confectionery',

  // Cloud Kitchens
  'Mojo Pizza': 'cloud-kitchens',
  'Behrouz Biryani': 'cloud-kitchens',
  Box8: 'cloud-kitchens',

  // GROCERY & ESSENTIALS
  // Supermarkets
  'D Mart': 'supermarkets',
  'Spar Hypermarket': 'supermarkets',
  'Reliance Smart': 'supermarkets',

  // Kirana Stores
  'Mahesh Provision Store': 'kirana-stores',
  'Om Super Market': 'kirana-stores',

  // Fresh Vegetables
  'Namdharis Fresh': 'fresh-vegetables',

  // Dairy
  'Nandini Milk Parlor': 'dairy',

  // Water Cans
  'Book My Can': 'water-cans',
  'Royal Water Supply': 'water-cans',

  // BEAUTY & WELLNESS
  // Salons
  'Naturals Salon': 'salons',
  'Green Trends Salon': 'salons',
  'Lakme Salon': 'salons',
  'YLG Salon': 'salons',

  // Spa & Massage
  'Vriddhi Wellness Spa': 'spa-massage',

  // Dermatology
  'Cutis Hospital': 'dermatology',

  // HEALTHCARE
  // Pharmacy
  'Apollo Pharmacy': 'pharmacy',
  'Wellness Forever': 'pharmacy',
  MedPlus: 'pharmacy',

  // Clinics
  'Apollo Clinic': 'clinics',

  // Diagnostics
  Thyrocare: 'diagnostics',

  // Home Nursing (mapped to pharmacy for now)
  'WeCare Home Nursing': 'home-nursing',

  // Physiotherapy
  'Relief Physiotherapy': 'physiotherapy',

  // FASHION (SHOPPING)
  // Fashion
  Lifestyle: 'fashion',
  Central: 'fashion',

  // Footwear
  Bata: 'footwear',
  'Metro Shoes': 'footwear',
  'Puma Store': 'footwear',

  // Jewelry
  Tanishq: 'jewelry',
  CaratLane: 'jewelry',

  // Electronics
  Croma: 'electronics',
  'Reliance Digital': 'electronics',
  Aptronix: 'electronics',
  'Sangeetha Mobiles': 'mobile-accessories',

  // FITNESS & SPORTS
  // Gyms
  'Cult.fit': 'gyms',
  "Gold's Gym": 'gyms',
  'F45 Training': 'crossfit',

  // EDUCATION & LEARNING
  // Coaching Centers
  'Career Launcher': 'coaching-centers',
  'TIME Institute': 'coaching-centers',

  // Skill Development
  'Aptech Computer Education': 'skill-development',
  'FITA Academy': 'skill-development',

  // HOME SERVICES
  // Multi-service providers (AC repair, plumbing, etc.)
  'Urban Company': 'ac-repair', // Default to AC repair

  // Pest Control
  HiCare: 'pest-control',

  // Laundry & Dry Cleaning
  'Dryclean Express': 'laundry-dry-cleaning',

  // TRAVEL & EXPERIENCES
  // Hotels
  'Grand Mercure': 'hotels',
  'OYO Rooms': 'hotels',

  // Taxis / Bike Rentals
  Rapido: 'bike-rentals',
  'Royal Brothers': 'bike-rentals',

  // ENTERTAINMENT
  // Amusement Parks
  'Fun World': 'amusement-parks',

  // Gaming Cafes
  Timezone: 'gaming-cafes',

  // VR/AR Experiences
  'Mystery Rooms': 'vr-ar-experiences',

  // FINANCIAL LIFESTYLE
  // Broadband
  'Excitel Broadband': 'broadband',
  'ACT Fibernet': 'broadband',

  // Gold Savings
  'Muthoot FinCorp': 'gold-savings',
};

async function assignSubcategories() {
  try {
    logger.info('🚀 Starting store subcategory assignment...');
    logger.info(`📡 Connecting to MongoDB...`);

    await connectScriptDb();
    if (DB_NAME !== 'test') await mongoose.connection.useDb(DB_NAME);

    const db = mongoose.connection.db!;

    // Get all stores
    const stores = await db.collection('stores').find({}).toArray();
    logger.info(`📦 Found ${stores.length} stores\n`);

    // Get all subcategories for lookup
    const subcategories = await db
      .collection('categories')
      .find({
        parentCategory: { $exists: true },
      })
      .toArray();

    // Create slug to _id map
    const subcategoryMap = new Map<string, any>();
    for (const sub of subcategories) {
      subcategoryMap.set(sub.slug, sub._id);
    }
    logger.info(`📂 Found ${subcategories.length} subcategories\n`);

    logger.info('========================================');
    logger.info('ASSIGNING SUBCATEGORIES');
    logger.info('========================================\n');

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const s of stores) {
      const store = s as any;
      const storeName = store.name;
      const subcategorySlug = STORE_SUBCATEGORY_MAP[storeName];

      if (subcategorySlug) {
        const subcategoryId = subcategoryMap.get(subcategorySlug);

        if (subcategoryId) {
          await db.collection('stores').updateOne(
            { _id: store._id },
            {
              $set: {
                subcategory: subcategoryId,
                subcategorySlug: subcategorySlug,
              },
            },
          );
          logger.info(`✅ ${storeName} → ${subcategorySlug}`);
          updatedCount++;
        } else {
          logger.info(`⚠️ ${storeName}: Subcategory '${subcategorySlug}' not found in DB`);
          notFoundCount++;
        }
      } else {
        logger.info(`⚠️ ${storeName}: No mapping defined`);
        notFoundCount++;
      }
    }

    logger.info('\n========================================');
    logger.info('📊 ASSIGNMENT SUMMARY');
    logger.info('========================================');
    logger.info(`Total stores: ${stores.length}`);
    logger.info(`Updated: ${updatedCount}`);
    logger.info(`Not found/mapped: ${notFoundCount}`);
  } catch (error) {
    logger.error('❌ Error:', error);
  } finally {
    await disconnectDb();
  }
}

assignSubcategories()
  .then(() => {
    logger.info('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });
