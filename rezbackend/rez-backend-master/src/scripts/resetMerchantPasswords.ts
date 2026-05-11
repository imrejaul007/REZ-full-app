/**
 * Reset Merchant Passwords Script
 * Resets all merchant passwords to a known dev password and prints credentials.
 * FOR DEVELOPMENT USE ONLY.
 */
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database';
import { Merchant } from '../models/Merchant';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

const DEV_PASSWORD = 'Merchant@123';

async function resetMerchantPasswords() {
  logger.info('🔐 Merchant Password Reset & Credentials Report');
  logger.info('⚠️  FOR DEVELOPMENT USE ONLY\n');
  logger.info('='.repeat(60));

  try {
    const merchants = await Merchant.find().select('+password').sort({ businessName: 1 }).lean();

    if (merchants.length === 0) {
      logger.info('⚠️  No merchants found in the database.');
      return;
    }

    const hashedPassword = await bcrypt.hash(DEV_PASSWORD, 10);

    // Reset all merchant passwords
    await Merchant.updateMany({}, { $set: { password: hashedPassword } });

    logger.info(`✅ Reset ${merchants.length} merchant password(s) to the configured DEV_PASSWORD.\n`);
    logger.info('─'.repeat(60));
    logger.info('📋 MERCHANT LOGIN CREDENTIALS');
    logger.info('─'.repeat(60));

    for (const merchant of merchants) {
      logger.info(`\n🏪 ${merchant.businessName}`);
      logger.info(`   Owner:    ${merchant.ownerName}`);
      logger.info(`   Email:    ${merchant.email.replace(/(.{2}).+(@.+)/, '$1***$2')}`);
      logger.info(`   Phone:    ***${String(merchant.phone).slice(-4)}`);
      logger.info(`   Password: [REDACTED — see DEV_PASSWORD constant]`);
      logger.info(`   Active:   ${merchant.isActive ? '✅ Yes' : '❌ No'}`);
      logger.info(`   Verified: ${merchant.verificationStatus}`);
    }

    logger.info('\n' + '='.repeat(60));
    logger.info(`📊 Total merchants: ${merchants.length}`);
    logger.info(`🔑 All passwords updated (see DEV_PASSWORD constant for value).`);
    logger.info('='.repeat(60));
  } catch (error) {
    logger.error('❌ Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  connectDatabase()
    .then(() => resetMerchantPasswords())
    .then(() => {
      logger.info('\n✅ Done.');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Connection failed:', error);
      process.exit(1);
    });
}
