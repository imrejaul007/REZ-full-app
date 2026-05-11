import mongoose from 'mongoose';
import { User } from '../models/User';
import { connectDatabase } from '../config/database';
import dotenv from 'dotenv';
import { logger } from '../config/logger';

dotenv.config();

async function checkUserBalance() {
  try {
    await connectDatabase();
    const user = await User.findOne({ email: 'work@rez.money' });
    if (user) {
      logger.info('User found:', user.profile.firstName, user.profile.lastName);
      logger.info('Wallet:', JSON.stringify(user.wallet, null, 2));
    } else {
      logger.info('User work@rez.money not found');
    }
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserBalance();
