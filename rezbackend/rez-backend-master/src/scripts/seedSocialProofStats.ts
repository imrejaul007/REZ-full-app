/**
 * Seed Social Proof Stats
 * Creates initial social proof stats for each category
 */

import dotenv from 'dotenv';
import path from 'path';
import SocialProofStat from '../models/SocialProofStat';
import { Category } from '../models/Category';
import { connectScriptDb, disconnectDb } from './connectDb';
import { logger } from '../config/logger';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const CATEGORY_SLUGS = [
  'food-dining',
  'fashion',
  'beauty-wellness',
  'grocery-essentials',
  'healthcare',
  'fitness-sports',
  'education-learning',
  'home-services',
  'travel-experiences',
  'entertainment',
  'financial-lifestyle',
];

// Sample recent buyers data
const sampleBuyers = [
  { name: 'Priya S.', avatar: '👩', item: 'Blue Dress', timeAgo: '2 mins ago' },
  { name: 'Rahul M.', avatar: '👨', item: 'Running Shoes', timeAgo: '5 mins ago' },
  { name: 'Sneha K.', avatar: '👩‍🦱', item: 'Skincare Set', timeAgo: '8 mins ago' },
  { name: 'Amit P.', avatar: '🧔', item: 'Laptop Bag', timeAgo: '12 mins ago' },
  { name: 'Anjali R.', avatar: '👩', item: 'Coffee Maker', timeAgo: '15 mins ago' },
];

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedSocialProofStats(): Promise<number> {
  await connectScriptDb();

  logger.info('Seeding Social Proof Stats...');

  // Clear existing
  await SocialProofStat.deleteMany({});

  const categories = await Category.find({ slug: { $in: CATEGORY_SLUGS } });
  const statsToInsert = [];

  for (const category of categories) {
    // Get hashtags from category for topHashtags
    const topHashtags = (category.trendingHashtags || []).slice(0, 3).map((h: any) => h.tag);

    // If no hashtags, use defaults
    if (topHashtags.length === 0) {
      topHashtags.push('#Trending', '#BestDeals', '#Cashback');
    }

    statsToInsert.push({
      category: category._id,
      shoppedToday: getRandomInt(1000, 5000),
      totalEarned: getRandomInt(20000, 100000),
      topHashtags,
      recentBuyers: sampleBuyers.slice(0, 4),
    });
  }

  const result = await SocialProofStat.insertMany(statsToInsert);
  logger.info(`Seeded ${result.length} Social Proof Stats`);

  await disconnectDb();
  return result.length;
}

seedSocialProofStats().catch((err) => { console.error(err); process.exit(1); }); // D19: fail loud so CI catches broken seeds
