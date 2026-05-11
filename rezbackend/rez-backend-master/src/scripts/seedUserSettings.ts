/**
 * Seed User Settings
 * Creates default settings for all users
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { UserSettings } from '../models/UserSettings';
import { connectScriptDb } from './connectDb';
import { logger } from '../config/logger';

// Load environment variables
dotenv.config();

// Default settings template
const getDefaultSettings = (userId: mongoose.Types.ObjectId) => ({
  user: userId,
  general: {
    language: 'en',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h' as const,
    theme: 'auto' as const,
  },
  notifications: {
    push: {
      enabled: true,
      orderUpdates: true,
      promotions: true,
      recommendations: true,
      priceAlerts: true,
      deliveryUpdates: true,
      paymentUpdates: true,
      securityAlerts: true,
      chatMessages: true,
    },
    email: {
      enabled: true,
      newsletters: false,
      orderReceipts: true,
      weeklyDigest: true,
      promotions: false,
      securityAlerts: true,
      accountUpdates: true,
    },
    sms: {
      enabled: true,
      orderUpdates: true,
      deliveryAlerts: true,
      paymentConfirmations: true,
      securityAlerts: true,
      otpMessages: true,
    },
    inApp: {
      enabled: true,
      showBadges: true,
      soundEnabled: true,
      vibrationEnabled: true,
      bannerStyle: 'BANNER' as const,
    },
  },
  privacy: {
    profileVisibility: 'FRIENDS' as const,
    showActivity: true,
    showPurchaseHistory: false,
    allowMessaging: true,
    allowFriendRequests: true,
    dataSharing: {
      shareWithPartners: false,
      shareForMarketing: false,
      shareForRecommendations: true,
      shareForAnalytics: true,
      sharePurchaseData: false,
    },
    analytics: {
      allowUsageTracking: true,
      allowCrashReporting: true,
      allowPerformanceTracking: true,
      allowLocationTracking: false,
    },
  },
  security: {
    twoFactorAuth: {
      enabled: true,
      method: '2FA_SMS' as const,
      backupCodes: ['ABC123XYZ', 'DEF456UVW', 'GHI789RST'],
      lastUpdated: new Date(),
    },
    biometric: {
      fingerprintEnabled: true,
      faceIdEnabled: false,
      voiceEnabled: false,
      availableMethods: ['FINGERPRINT' as const],
    },
    sessionManagement: {
      autoLogoutTime: 30, // 30 minutes
      allowMultipleSessions: true,
      rememberMe: true,
    },
    loginAlerts: true,
  },
  delivery: {
    deliveryInstructions: 'Please ring the doorbell',
    deliveryTime: {
      preferred: 'ASAP' as const,
      workingDays: ['MON' as const, 'TUE' as const, 'WED' as const, 'THU' as const, 'FRI' as const],
    },
    contactlessDelivery: true,
    deliveryNotifications: true,
  },
  payment: {
    autoPayEnabled: false,
    paymentPinEnabled: true,
    biometricPaymentEnabled: true,
    transactionLimits: {
      dailyLimit: 10000,
      weeklyLimit: 50000,
      monthlyLimit: 200000,
      singleTransactionLimit: 25000,
    },
  },
  preferences: {
    startupScreen: 'HOME' as const,
    defaultView: 'CARD' as const,
    autoRefresh: true,
    offlineMode: false,
    dataSaver: false,
    highQualityImages: true,
    animations: true,
    sounds: true,
    hapticFeedback: true,
  },
  courier: {
    preferredCourier: 'any' as const,
    deliveryTimePreference: {
      weekdays: ['MON' as const, 'TUE' as const, 'WED' as const, 'THU' as const, 'FRI' as const],
      preferredTimeSlot: {
        start: '09:00',
        end: '18:00',
      },
      avoidWeekends: false,
    },
    deliveryInstructions: {
      contactlessDelivery: true,
      leaveAtDoor: false,
      signatureRequired: false,
      callBeforeDelivery: true,
      specificInstructions: 'Please call 5 minutes before delivery',
    },
    courierNotifications: {
      smsUpdates: true,
      emailUpdates: true,
      whatsappUpdates: false,
      callUpdates: false,
    },
  },
  lastUpdated: new Date(),
});

async function seedUserSettings() {
  try {
    logger.info('🌱 Starting User Settings Seed...\n');

    // Connect to MongoDB
    logger.info('📡 Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('✅ Connected to MongoDB\n');

    // Get all users
    logger.info('👥 Fetching users...');
    const users = await User.find({});
    logger.info(`✅ Found ${users.length} users\n`);

    if (users.length === 0) {
      logger.info('⚠️  No users found. Please seed users first.');
      process.exit(0);
    }

    // Clear existing settings
    logger.info('🗑️  Clearing existing user settings...');
    await UserSettings.deleteMany({});
    logger.info('✅ Cleared existing settings\n');

    // Create settings for each user
    logger.info('📝 Creating user settings...');
    const settingsToCreate = [];

    for (const user of users) {
      const settings = getDefaultSettings(user._id as mongoose.Types.ObjectId);
      settingsToCreate.push(settings);
    }

    await UserSettings.insertMany(settingsToCreate);
    logger.info(`✅ Created settings for ${settingsToCreate.length} users\n`);

    // Verify
    const count = await UserSettings.countDocuments();
    logger.info('📊 Verification:');
    logger.info(`   Total UserSettings: ${count}`);

    // Show sample
    const sample = await UserSettings.findOne().populate('user', 'email profile.firstName profile.lastName');
    if (sample) {
      logger.info('\n📋 Sample User Settings:');
      logger.info(`   User: ${(sample.user as any)?.email}`);
      logger.info(`   Language: ${sample.general.language}`);
      logger.info(`   Currency: ${sample.general.currency}`);
      logger.info(`   Theme: ${sample.general.theme}`);
      logger.info(`   Push Notifications: ${sample.notifications.push.enabled ? 'Enabled' : 'Disabled'}`);
      logger.info(`   2FA: ${sample.security.twoFactorAuth.enabled ? 'Enabled' : 'Disabled'}`);
      logger.info(`   Preferred Courier: ${sample.courier.preferredCourier}`);
    }

    logger.info('\n✅ User Settings Seed Complete!\n');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding user settings:', error);
    process.exit(1);
  }
}

// Run the seed function
if (require.main === module) {
  seedUserSettings();
}

export default seedUserSettings;
