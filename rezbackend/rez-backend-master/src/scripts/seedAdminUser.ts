/**
 * Seed Admin User Script
 * Run with: npx ts-node src/scripts/seedAdminUser.ts
 *
 * Creates a super admin user for the rez-admin portal
 */

import dotenv from 'dotenv';
import path from 'path';
import { connectScriptDb, disconnectDb } from './connectDb';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import User model after dotenv config
import { User } from '../models/User';
import { logger } from '../config/logger';

// Admin user details - password MUST be set via env var in production
if (!process.env.DEFAULT_ADMIN_PASSWORD) {
  logger.error(
    '[FATAL] DEFAULT_ADMIN_PASSWORD environment variable is not set. Cannot seed admin user without a secure password.',
  );
  process.exit(1);
}
const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;

const ADMIN_USERS = [
  {
    phoneNumber: '+919999999901',
    email: 'admin@rez.money',
    password: defaultPassword,
    role: 'admin' as const,
    profile: { firstName: 'Admin', lastName: 'REZ' },
    auth: { isVerified: true, isOnboarded: true },
    isActive: true,
  },
  {
    phoneNumber: '+919999999900',
    email: 'superadmin@rez.money',
    password: defaultPassword,
    role: 'super_admin' as const,
    profile: { firstName: 'Super', lastName: 'Admin' },
    auth: { isVerified: true, isOnboarded: true },
    isActive: true,
  },
];

async function seedAdminUser() {
  try {
    logger.info('Connecting to MongoDB...');
    await connectScriptDb();
    logger.info('Connected to MongoDB');

    for (const adminData of ADMIN_USERS) {
      const existing = await User.findOne({ email: adminData.email });

      if (existing) {
        // Update role + password
        existing.role = adminData.role;
        existing.password = adminData.password;
        existing.auth.isVerified = true;
        existing.isActive = true;
        await existing.save();
        logger.info(`Updated: ${adminData.email} (${adminData.role})`);
      } else {
        const user = new User(adminData);
        await user.save();
        logger.info(`Created: ${adminData.email} (${adminData.role})`);
      }
    }

    logger.info('Done!');
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  } finally {
    await disconnectDb();
    process.exit(0);
  }
}

// Run the seed
seedAdminUser();
