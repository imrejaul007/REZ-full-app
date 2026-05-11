/**
 * Verification script: Check all category + serviceCapabilities data
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../config/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function verify() {
  const uri = process.env.MONGODB_URI || '';
  const dbName = process.env.DB_NAME || 'test';
  await mongoose.connect(uri, { dbName });
  logger.info('Connected to MongoDB\n');

  const Store = mongoose.connection.db!.collection('stores');
  const Category = mongoose.connection.db!.collection('categories');

  // 1. Store serviceCapabilities overview
  logger.info('=== STORE SERVICE CAPABILITIES ===');
  const totalStores = await Store.countDocuments({});
  const hasCapabilities = await Store.countDocuments({ serviceCapabilities: { $exists: true } });
  const homeDelivery = await Store.countDocuments({ 'serviceCapabilities.homeDelivery.enabled': true });
  const driveThru = await Store.countDocuments({ 'serviceCapabilities.driveThru.enabled': true });
  const tableBooking = await Store.countDocuments({ 'serviceCapabilities.tableBooking.enabled': true });
  const dineIn = await Store.countDocuments({ 'serviceCapabilities.dineIn.enabled': true });
  const storePickup = await Store.countDocuments({ 'serviceCapabilities.storePickup.enabled': true });
  logger.info(`Total stores: ${totalStores}`);
  logger.info(`With serviceCapabilities: ${hasCapabilities}`);
  logger.info(`homeDelivery: ${homeDelivery}`);
  logger.info(`tableBooking: ${tableBooking}`);
  logger.info(`dineIn: ${dineIn}`);
  logger.info(`storePickup: ${storePickup}`);
  logger.info(`driveThru: ${driveThru}`);

  // 2. Sample homeDelivery store
  logger.info('\n=== SAMPLE HOME DELIVERY STORE ===');
  const sampleHD = await Store.findOne(
    { 'serviceCapabilities.homeDelivery.enabled': true },
    {
      projection: {
        name: 1,
        serviceCapabilities: 1,
        'operationalInfo.deliveryFee': 1,
        'operationalInfo.deliveryTime': 1,
      },
    },
  );
  if (sampleHD) {
    logger.info('Name:', sampleHD.name);
    logger.info(
      'serviceCapabilities.homeDelivery:',
      JSON.stringify(sampleHD.serviceCapabilities?.homeDelivery, null, 2),
    );
    logger.info('Original deliveryFee:', sampleHD.operationalInfo?.deliveryFee);
    logger.info('Original deliveryTime:', sampleHD.operationalInfo?.deliveryTime);
  }

  // 3. Sample tableBooking store
  logger.info('\n=== SAMPLE TABLE BOOKING STORE ===');
  const sampleTB = await Store.findOne(
    { 'serviceCapabilities.tableBooking.enabled': true },
    { projection: { name: 1, serviceCapabilities: 1, bookingType: 1, 'bookingConfig.enabled': 1 } },
  );
  if (sampleTB) {
    logger.info('Name:', sampleTB.name);
    logger.info('bookingType:', sampleTB.bookingType);
    logger.info('bookingConfig.enabled:', sampleTB.bookingConfig?.enabled);
    logger.info('serviceCapabilities:', JSON.stringify(sampleTB.serviceCapabilities, null, 2));
  }

  // 4. Sample dineIn store
  logger.info('\n=== SAMPLE DINE-IN STORE ===');
  const sampleDI = await Store.findOne(
    { 'serviceCapabilities.dineIn.enabled': true },
    { projection: { name: 1, serviceCapabilities: 1, bookingType: 1 } },
  );
  if (sampleDI) {
    logger.info('Name:', sampleDI.name);
    logger.info('bookingType:', sampleDI.bookingType);
    logger.info('serviceCapabilities:', JSON.stringify(sampleDI.serviceCapabilities, null, 2));
  }

  // 5. Category pageConfigs overview
  logger.info('\n=== CATEGORY PAGE CONFIGS ===');
  const mainCategories = await Category.find(
    { parentCategory: null, isActive: true },
    { projection: { name: 1, slug: 1, pageConfig: 1, sortOrder: 1 } },
  )
    .sort({ sortOrder: 1 })
    .toArray();

  logger.info(`Main categories: ${mainCategories.length}\n`);
  for (const cat of mainCategories) {
    const pc = cat.pageConfig;
    const status = pc ? 'YES' : 'NO';
    const tabs = pc?.tabs?.length || 0;
    const qa = pc?.quickActions?.length || 0;
    const sec = pc?.sections?.length || 0;
    const st = pc?.serviceTypes?.length || 0;
    logger.info(
      `  [${cat.sortOrder}] ${(cat.slug as string).padEnd(22)} pageConfig:${status}  tabs:${tabs}  quickActions:${qa}  sections:${sec}  serviceTypes:${st}`,
    );
  }

  // 6. Deep check: Food & Dining
  logger.info('\n=== FOOD & DINING DEEP CHECK ===');
  const foodCat = await Category.findOne({ slug: 'food-dining', parentCategory: null });
  if (foodCat?.pageConfig) {
    const pc = foodCat.pageConfig;
    logger.info('Theme primaryColor:', pc.theme?.primaryColor);
    logger.info('Theme gradientColors:', JSON.stringify(pc.theme?.gradientColors));
    logger.info('Banner title:', pc.banner?.title);
    logger.info('Banner subtitle:', pc.banner?.subtitle);

    logger.info('\nTabs:');
    (pc.tabs || []).forEach((t: any) => {
      logger.info(`  - ${t.id} (label: ${t.label}, icon: ${t.icon}, serviceFilter: ${t.serviceFilter || 'none'})`);
    });

    logger.info('\nQuick Actions:');
    (pc.quickActions || []).forEach((q: any) => {
      logger.info(`  - ${q.id}: ${q.label} (${q.icon}) -> ${q.route}`);
    });

    logger.info('\nSections:');
    (pc.sections || []).forEach((s: any) => {
      logger.info(`  - [${s.sortOrder}] ${s.type} (${s.enabled ? 'ON' : 'OFF'})`);
    });

    logger.info('\nService Types:');
    (pc.serviceTypes || []).forEach((s: any) => {
      logger.info(`  - ${s.id}: ${s.label} (filterField: ${s.filterField})`);
    });
  } else {
    logger.info('ERROR: Food & Dining missing pageConfig!');
  }

  // 7. Food & Dining store filtering
  logger.info('\n=== FOOD & DINING STORE FILTERING ===');
  const foodSubcats = await Category.find({ parentCategory: foodCat?._id }).toArray();
  const foodSubcatIds = foodSubcats.map((c) => c._id);
  logger.info(`Subcategories: ${foodSubcats.length} (${foodSubcats.map((c) => c.slug).join(', ')})`);

  const totalFood = await Store.countDocuments({ category: { $in: foodSubcatIds }, isActive: true });
  const foodHD = await Store.countDocuments({
    category: { $in: foodSubcatIds },
    isActive: true,
    'serviceCapabilities.homeDelivery.enabled': true,
  });
  const foodDI = await Store.countDocuments({
    category: { $in: foodSubcatIds },
    isActive: true,
    'serviceCapabilities.dineIn.enabled': true,
  });
  const foodTB = await Store.countDocuments({
    category: { $in: foodSubcatIds },
    isActive: true,
    'serviceCapabilities.tableBooking.enabled': true,
  });
  const foodDT = await Store.countDocuments({
    category: { $in: foodSubcatIds },
    isActive: true,
    'serviceCapabilities.driveThru.enabled': true,
  });

  logger.info(`Total active food stores: ${totalFood}`);
  logger.info(`  -> homeDelivery: ${foodHD}`);
  logger.info(`  -> dineIn: ${foodDI}`);
  logger.info(`  -> tableBooking: ${foodTB}`);
  logger.info(`  -> driveThru: ${foodDT}`);

  // 8. Cross-check: stores with NO serviceCapabilities
  logger.info('\n=== STORES WITHOUT SERVICE CAPABILITIES ===');
  const noCapabilities = await Store.countDocuments({
    $or: [{ serviceCapabilities: { $exists: false } }, { serviceCapabilities: null }],
  });
  logger.info(`Stores without serviceCapabilities: ${noCapabilities} / ${totalStores}`);

  // 9. Sample a few food delivery stores to see names
  logger.info('\n=== TOP 5 FOOD HOME DELIVERY STORES ===');
  const topFoodHD = await Store.find(
    { category: { $in: foodSubcatIds }, 'serviceCapabilities.homeDelivery.enabled': true },
    {
      projection: {
        name: 1,
        'ratings.average': 1,
        'operationalInfo.deliveryTime': 1,
        'serviceCapabilities.homeDelivery': 1,
      },
    },
  )
    .sort({ 'ratings.average': -1 })
    .limit(5)
    .toArray();
  topFoodHD.forEach((s, i) => {
    logger.info(
      `  ${i + 1}. ${s.name} (rating: ${s.ratings?.average || 'N/A'}, delivery: ${s.operationalInfo?.deliveryTime || 'N/A'}, fee: ${s.serviceCapabilities?.homeDelivery?.deliveryFee ?? 'N/A'})`,
    );
  });

  // 10. Check other categories have pageConfig
  logger.info('\n=== SPOT CHECK: OTHER CATEGORIES ===');
  const groceryCat = await Category.findOne({ slug: 'grocery-essentials', parentCategory: null });
  const beautyCat = await Category.findOne({ slug: 'beauty-wellness', parentCategory: null });
  const electronicsCat = await Category.findOne({ slug: 'electronics', parentCategory: null });

  for (const cat of [groceryCat, beautyCat, electronicsCat]) {
    if (!cat) continue;
    const pc = cat.pageConfig;
    logger.info(`\n${cat.slug}:`);
    logger.info(`  Theme: ${pc?.theme?.primaryColor || 'MISSING'}`);
    logger.info(`  Tabs: ${(pc?.tabs || []).map((t: any) => t.label).join(', ') || 'NONE'}`);
    logger.info(`  ServiceTypes: ${(pc?.serviceTypes || []).map((s: any) => s.label).join(', ') || 'NONE'}`);
  }

  await mongoose.disconnect();
  logger.info('\n\nVerification complete.');
}

verify().catch((e) => {
  console.error(e);
  process.exit(1);
});
