// Seed script to create additional test users
// Run with: npx ts-node scripts/seedMoreUsers.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/models/User';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Helper to generate random phone number
const generatePhoneNumber = (index: number): string => {
  const baseNumber = 9000000000 + index * 1000 + Math.floor(Math.random() * 1000);
  return `+91${baseNumber}`;
};

// Helper to generate unique email
const generateEmail = (firstName: string, lastName: string, index: number): string => {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@test.com`;
};

// Helper to generate random location in Mumbai
const generateMumbaiLocation = () => {
  // Mumbai coordinates range
  const latBase = 19.076;
  const lngBase = 72.8777;
  const latOffset = (Math.random() - 0.5) * 0.1; // +/- 0.05 degrees
  const lngOffset = (Math.random() - 0.5) * 0.1;

  return {
    type: 'Point',
    coordinates: [lngBase + lngOffset, latBase + latOffset], // [lng, lat]
    address: `Area ${Math.floor(Math.random() * 50) + 1}, Mumbai`,
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: `400${String(Math.floor(Math.random() * 100)).padStart(3, '0')}`, // 6 digits: 400000-400099
    country: 'India',
  };
};

// Sample first names and last names for variety
const firstNames = [
  'Raj',
  'Priya',
  'Amit',
  'Sneha',
  'Vikram',
  'Anjali',
  'Rohit',
  'Pooja',
  'Arjun',
  'Kavya',
  'Karan',
  'Nisha',
  'Aditya',
  'Riya',
  'Sanjay',
];

const lastNames = [
  'Kumar',
  'Sharma',
  'Patel',
  'Singh',
  'Reddy',
  'Mehta',
  'Gupta',
  'Verma',
  'Agarwal',
  'Joshi',
  'Desai',
  'Iyer',
  'Nair',
  'Kulkarni',
  'Malhotra',
];

// User preferences templates
const preferencesTemplates = [
  {
    language: 'en',
    currency: 'INR',
    notifications: {
      email: true,
      push: true,
      sms: true,
      marketing: true,
    },
    privacy: {
      showProfile: true,
      showActivity: true,
      showPurchases: false,
    },
  },
  {
    language: 'hi',
    currency: 'INR',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
    },
    privacy: {
      showProfile: true,
      showActivity: false,
      showPurchases: false,
    },
  },
];

async function seedMoreUsers() {
  try {
    console.log('\n🚀 Starting User Seeding Process...\n');
    console.log('='.repeat(70));

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || 'test';

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { dbName });
    console.log('✅ Connected to MongoDB\n');

    // Check existing users
    const existingCount = await User.countDocuments();
    console.log(`📊 Current users in database: ${existingCount}`);

    const targetCount = 15; // Total users we want
    const usersToCreate = Math.max(0, targetCount - existingCount);

    if (usersToCreate === 0) {
      console.log(`✅ Already have ${existingCount} users. No need to create more.\n`);
      await mongoose.connection.close();
      return;
    }

    console.log(`🌱 Will create ${usersToCreate} new users (target: ${targetCount} total)\n`);

    // Generate unique referral code
    const generateReferralCode = (index: number): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = 'REF';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code + index;
    };

    // Create users
    const newUsers = [];
    const startIndex = existingCount;

    for (let i = 0; i < usersToCreate; i++) {
      const index = startIndex + i;
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[i % lastNames.length];
      const phoneNumber = generatePhoneNumber(index);
      const email = generateEmail(firstName, lastName, index);
      const referralCode = generateReferralCode(index);
      const preferences = preferencesTemplates[i % preferencesTemplates.length];

      const userData = {
        phoneNumber,
        email,
        profile: {
          firstName,
          lastName,
          gender: i % 2 === 0 ? 'male' : 'female',
          dateOfBirth: new Date(1990 + (i % 15), i % 12, (i % 28) + 1),
          profilePicture: `https://i.pravatar.cc/150?u=${email}`,
          bio: `${firstName} ${lastName} - Test User ${index + 1}`,
          location: generateMumbaiLocation(),
        },
        preferences,
        wallet: {
          balance: Math.floor(Math.random() * 5000), // Random balance 0-5000
          totalEarned: 0,
          totalSpent: 0,
          pendingAmount: 0,
          coins: [],
        },
        auth: {
          isVerified: true,
          isOnboarded: true,
          lastLogin: new Date(),
          loginAttempts: 0,
          accountStatus: 'active',
          twoFactorEnabled: false,
        },
        referral: {
          referralCode,
          referredBy: null,
          totalReferrals: 0,
          referralEarnings: 0,
          tier: 'starter',
          referredUsers: [],
        },
        gamification: {
          level: 1,
          xp: 0,
          coins: Math.floor(Math.random() * 1000), // Random coins 0-1000
          badges: [],
          achievements: [],
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date(),
        },
        role: 'user',
        isActive: true,
        metadata: {
          signupSource: i % 3 === 0 ? 'web' : 'mobile',
          deviceInfo: {
            platform: i % 2 === 0 ? 'android' : 'ios',
            version: '1.0.0',
          },
          lastActiveAt: new Date(),
        },
      };

      newUsers.push(userData);

      // Log progress
      if ((i + 1) % 5 === 0 || i === usersToCreate - 1) {
        console.log(`✅ Prepared ${i + 1}/${usersToCreate} users...`);
      }
    }

    // Insert users in batch
    console.log('\n💾 Inserting users into database...');
    const result = await User.insertMany(newUsers);
    console.log(`✅ Successfully created ${result.length} new users!\n`);

    // Display summary
    console.log('='.repeat(70));
    console.log('📋 USER SEEDING SUMMARY');
    console.log('='.repeat(70));

    const finalCount = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${finalCount}`);
    console.log(`✨ New users created: ${result.length}`);
    console.log(`📧 Email pattern: firstname.lastname[N]@test.com`);
    console.log(`📱 Phone pattern: +919XXXXXXXXX`);
    console.log(`💰 Wallet balances: Random (₹0-₹5000)`);
    console.log(`🎮 Coins: Random (0-1000)`);
    console.log(`📍 Location: Mumbai area (random coordinates)\n`);

    // Show sample users
    console.log('👥 Sample Created Users:\n');
    result.slice(0, 5).forEach((user: any, index: number) => {
      console.log(`${index + 1}. ${user.profile.firstName} ${user.profile.lastName}`);
      console.log(`   📧 ${user.email}`);
      console.log(`   📱 ${user.phoneNumber}`);
      console.log(`   🎫 Referral Code: ${user.referral.referralCode}`);
      console.log(`   💰 Wallet: ₹${user.wallet.balance}`);
      console.log(`   🎮 Coins: ${user.gamification.coins}`);
      console.log('');
    });

    console.log('='.repeat(70));
    console.log('\n✅ USER SEEDING COMPLETED SUCCESSFULLY!\n');

    console.log('💡 Next Steps:');
    console.log('   1. Run: npm run seed:critical');
    console.log('   2. Test subscription, referral, and gamification features');
    console.log('   3. Verify data with: npm run check:database\n');

    // Close connection
    await mongoose.connection.close();
    console.log('📤 Disconnected from MongoDB\n');
  } catch (error: any) {
    console.error('\n❌ ERROR DURING USER SEEDING:');
    console.error('='.repeat(70));
    console.error(error.message);
    console.error(error.stack);
    console.error('='.repeat(70));
    process.exit(1);
  }
}

// Run the seeding
seedMoreUsers();
