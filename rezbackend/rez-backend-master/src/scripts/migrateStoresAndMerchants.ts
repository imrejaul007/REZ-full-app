/**
 * Migration Script: Link Stores to Merchants & Fill Demo Data
 * Run with: npx ts-node src/scripts/migrateStoresAndMerchants.ts
 *
 * What this does:
 * 1. Deletes junk/test merchants (keeps Demo Fashion Store)
 * 2. Creates proper merchants for each store category
 * 3. Assigns all orphan stores to the appropriate merchant
 * 4. Fills in phone numbers, addresses, verification status
 */

import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { connectScriptDb, disconnectDb } from './connectDb';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Merchant } from '../models/Merchant';
import { Store } from '../models/Store';
import { logger } from '../config/logger';

// Category-based merchants to create
const CATEGORY_MERCHANTS = [
  {
    businessName: 'QuickBite Foods Pvt Ltd',
    ownerName: 'Rahul Sharma',
    email: 'quickbite@rez.app',
    phone: '+919876501001',
    city: 'Mumbai',
    state: 'Maharashtra',
    storeKeywords: ['dominos', 'burger king', 'mcdonald', 'pizza hut', 'wendy', 'shake shack'],
    status: 'verified' as const,
  },
  {
    businessName: 'Gourmet Kitchen Group',
    ownerName: 'Priya Patel',
    email: 'gourmetkitchen@rez.app',
    phone: '+919876501002',
    city: 'Mumbai',
    state: 'Maharashtra',
    storeKeywords: [
      'oven story',
      'la pino',
      'mojo pizza',
      'behrouz',
      'paradise',
      'mainland china',
      'kitopi',
      'box8',
      'freshmenu',
    ],
    status: 'verified' as const,
  },
  {
    businessName: 'Cafe & Desserts Co',
    ownerName: 'Ananya Gupta',
    email: 'cafedeserts@rez.app',
    phone: '+919876501003',
    city: 'Bangalore',
    state: 'Karnataka',
    storeKeywords: ['starbucks', 'cafe coffee', 'baskin', 'theobroma', 'saravana', 'mtr'],
    status: 'verified' as const,
  },
  {
    businessName: 'TrendStyle Fashion House',
    ownerName: 'Vikram Singh',
    email: 'trendstyle@rez.app',
    phone: '+919876501004',
    city: 'Delhi',
    state: 'Delhi',
    storeKeywords: ['zara', 'h&m', 'myntra', 'centrepoint', 'max fashion'],
    status: 'verified' as const,
  },
  {
    businessName: 'TechMart Electronics',
    ownerName: 'Suresh Kumar',
    email: 'techmart@rez.app',
    phone: '+919876501005',
    city: 'Hyderabad',
    state: 'Telangana',
    storeKeywords: ['croma', 'reliance digital', 'vijay sales', 'sharaf', 'jumbo'],
    status: 'verified' as const,
  },
  {
    businessName: 'GlowUp Beauty Ventures',
    ownerName: 'Meera Reddy',
    email: 'glowup@rez.app',
    phone: '+919876501006',
    city: 'Chennai',
    state: 'Tamil Nadu',
    storeKeywords: ['nykaa', 'sephora', 'enrich', 'naturals', 'toni', 'looks salon', 'tips', 'n.bar', 'sisters'],
    status: 'verified' as const,
  },
  {
    businessName: 'FitLife Health & Wellness',
    ownerName: 'Arjun Mehta',
    email: 'fitlife@rez.app',
    phone: '+919876501007',
    city: 'Pune',
    state: 'Maharashtra',
    storeKeywords: ["gold's gym", 'decathlon', 'anytime fitness', 'fitness first', 'gymnation'],
    status: 'pending' as const,
  },
  {
    businessName: 'MedCare Pharmacy Chain',
    ownerName: 'Dr. Kavita Joshi',
    email: 'medcare@rez.app',
    phone: '+919876501008',
    city: 'Mumbai',
    state: 'Maharashtra',
    storeKeywords: ['apollo', 'medplus', 'netmeds', '1mg', 'life pharmacy', 'boots', 'aster'],
    status: 'verified' as const,
  },
  {
    businessName: 'HomeServ Solutions',
    ownerName: 'Amit Verma',
    email: 'homeserv@rez.app',
    phone: '+919876501009',
    city: 'Bangalore',
    state: 'Karnataka',
    storeKeywords: ['urban company', 'servicemarket', 'housejoy', 'justlife', 'helpling'],
    status: 'pending' as const,
  },
  {
    businessName: 'Serenity Spas & Wellness',
    ownerName: 'Neha Kapoor',
    email: 'serenityspas@rez.app',
    phone: '+919876501010',
    city: 'Goa',
    state: 'Goa',
    storeKeywords: ['tattva', 'sensasia', 'o2 spa', 'four fountains', 'talise'],
    status: 'verified' as const,
  },
  {
    businessName: 'PawPals Pet Services',
    ownerName: 'Rohan Desai',
    email: 'pawpals@rez.app',
    phone: '+919876501011',
    city: 'Mumbai',
    state: 'Maharashtra',
    storeKeywords: ['supertails', 'petsville', 'petkonnect', 'just dogs', 'dubai pet', 'heads up'],
    status: 'pending' as const,
  },
];

async function migrate() {
  try {
    logger.info('Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('Connected.\n');

    // ============ 1. DELETE JUNK MERCHANTS ============
    logger.info('--- Step 1: Cleaning up junk merchants ---');
    const demoMerchant = await Merchant.findOne({
      $or: [{ email: 'merchant@rez.app' }, { email: 'merchant@test.com' }],
    });

    const junkResult = await Merchant.deleteMany({
      _id: { $ne: demoMerchant?._id },
      $or: [
        { businessName: /test/i },
        { businessName: /debug/i },
        { businessName: /failed/i },
        { businessName: /quick test/i },
        { businessName: /product test/i },
        { email: /test-merchant/i },
        { email: /example\.com/i },
        { businessName: 'NA' },
      ],
    });
    logger.info(`Deleted ${junkResult.deletedCount} junk merchants.\n`);

    // Also update Demo Fashion Store merchant to have phone number if missing
    if (demoMerchant && !demoMerchant.phone) {
      demoMerchant.phone = '+919123456789';
      await demoMerchant.save();
      logger.info('Updated Demo Fashion Store phone number.\n');
    }

    // ============ 2. CREATE CATEGORY MERCHANTS ============
    logger.info('--- Step 2: Creating category merchants ---');
    const seedPassword = process.env.SEED_DEMO_PASSWORD || crypto.randomBytes(12).toString('hex');
    logger.warn(`[SEED] Merchant account password for this run: ${seedPassword} — record this now.`);
    const hashedPassword = await bcrypt.hash(seedPassword, 12);

    const createdMerchants: Array<{ merchant: any; keywords: string[] }> = [];

    for (const cm of CATEGORY_MERCHANTS) {
      let existing = await Merchant.findOne({ email: cm.email });
      if (!existing) {
        existing = await Merchant.create({
          businessName: cm.businessName,
          ownerName: cm.ownerName,
          email: cm.email,
          password: hashedPassword,
          phone: cm.phone,
          verificationStatus: cm.status,
          isActive: true,
          emailVerified: true,
          businessAddress: {
            street: '100 Business Park',
            city: cm.city,
            state: cm.state,
            zipCode: '400001',
            country: 'India',
          },
          onboarding: {
            currentStep: 5,
            completedSteps: [1, 2, 3, 4, 5],
            isComplete: true,
            status: cm.status === 'verified' ? 'completed' : 'pending',
          },
        });
        logger.info(`  Created: ${cm.businessName} (${cm.email})`);
      } else {
        // Update existing with phone if missing
        if (!existing.phone) {
          existing.phone = cm.phone;
          await existing.save();
        }
        logger.info(`  Exists:  ${cm.businessName}`);
      }
      createdMerchants.push({ merchant: existing, keywords: cm.storeKeywords });
    }
    logger.info('');

    // ============ 3. DISTRIBUTE ORPHAN STORES ============
    logger.info('--- Step 3: Distributing orphan stores to merchants ---');
    const orphanStores = await Store.find({
      $or: [{ merchantId: null }, { merchantId: { $exists: false } }],
    });
    logger.info(`Found ${orphanStores.length} orphan stores.\n`);

    let assigned = 0;
    let unassigned = 0;
    const unassignedStores: string[] = [];

    for (const store of orphanStores) {
      const storeName = store.name.toLowerCase();
      let matched = false;

      for (const { merchant, keywords } of createdMerchants) {
        if (keywords.some((kw) => storeName.includes(kw.toLowerCase()))) {
          // Use updateOne to bypass schema validation on existing data
          await Store.updateOne({ _id: store._id }, { $set: { merchantId: merchant._id } });
          assigned++;
          matched = true;
          break;
        }
      }

      if (!matched) {
        unassignedStores.push(store.name);
        unassigned++;
      }
    }

    logger.info(`  Assigned: ${assigned} stores`);
    logger.info(`  Unmatched: ${unassigned} stores`);

    // Distribute remaining unassigned stores round-robin among merchants
    if (unassignedStores.length > 0) {
      logger.info('\n  Distributing remaining stores round-robin...');
      const remainingStores = await Store.find({
        name: { $in: unassignedStores },
        $or: [{ merchantId: null }, { merchantId: { $exists: false } }],
      });

      let idx = 0;
      for (const store of remainingStores) {
        const { merchant } = createdMerchants[idx % createdMerchants.length];
        await Store.updateOne({ _id: store._id }, { $set: { merchantId: merchant._id } });
        idx++;
      }
      logger.info(`  Distributed ${remainingStores.length} remaining stores.\n`);
    }

    // ============ 4. VERIFY COUNTS ============
    logger.info('--- Step 4: Final verification ---');
    const allMerchants = await Merchant.find({});

    for (const m of allMerchants) {
      const storeCount = await Store.countDocuments({ merchantId: m._id });
      logger.info(
        `  ${m.businessName.padEnd(30)} | ${m.email.padEnd(28)} | ${m.phone || 'NO PHONE'.padEnd(15)} | ${storeCount} stores | ${m.verificationStatus}`,
      );
    }

    const totalOrphans = await Store.countDocuments({
      $or: [{ merchantId: null }, { merchantId: { $exists: false } }],
    });
    logger.info(`\n  Remaining orphan stores: ${totalOrphans}`);

    // ============ SUMMARY ============
    logger.info('\n' + '='.repeat(60));
    logger.info('MIGRATION COMPLETE');
    logger.info('='.repeat(60));
    logger.info('\nAll merchants now have stores assigned.');
    logger.info('Admin portal will now show correct store counts.');
    logger.info('\nMerchant logins (all use password: Merchant@123):');
    logger.info('  merchant@test.com     - Demo Fashion Store (original)');
    for (const cm of CATEGORY_MERCHANTS) {
      logger.info(`  ${cm.email.padEnd(28)} - ${cm.businessName}`);
    }
    logger.info('');
  } catch (error) {
    logger.error('Migration error:', error);
    process.exit(1);
  } finally {
    await disconnectDb();
    logger.info('Disconnected from MongoDB.');
    process.exit(0);
  }
}

migrate();
