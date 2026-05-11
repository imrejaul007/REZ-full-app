import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Store } from '../models/Store';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { logger } from '../config/logger';

async function clearAllData() {
  logger.info('🗑️  Clearing existing data...');

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Store.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
  ]);

  logger.info('✅ All existing data cleared');
}

async function seedData() {
  try {
    logger.info('🚀 Starting data seeding...');

    // Connect to database
    await connectDatabase();
    logger.info('✅ Connected to database');

    // Clear existing data
    await clearAllData();

    // 1. Create Users
    logger.info('🔄 Creating users...');
    const users = await User.insertMany([
      {
        phoneNumber: '+919876543210',
        email: 'john.doe@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=john',
        },
        preferences: {
          language: 'en',
          notifications: true,
        },
        wallet: {
          balance: 2500,
          totalEarned: 5000,
          totalSpent: 2500,
          pendingAmount: 0,
        },
        auth: {
          isVerified: true,
          isOnboarded: true,
          loginAttempts: 0,
        },
        referral: {
          referralCode: 'JOHN2024',
          referredUsers: [],
          totalReferrals: 0,
          referralEarnings: 0,
        },
        role: 'user',
        isActive: true,
      },
      {
        phoneNumber: '+919876543211',
        email: 'jane.smith@example.com',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=jane',
        },
        preferences: {
          language: 'en',
          notifications: true,
        },
        wallet: {
          balance: 1800,
          totalEarned: 3500,
          totalSpent: 1700,
          pendingAmount: 200,
        },
        auth: {
          isVerified: true,
          isOnboarded: true,
          loginAttempts: 0,
        },
        referral: {
          referralCode: 'JANE2024',
          referredUsers: [],
          totalReferrals: 0,
          referralEarnings: 0,
        },
        role: 'user',
        isActive: true,
      },
    ]);
    logger.info(`✅ Created ${users.length} users`);

    // 2. Create Categories
    logger.info('🔄 Creating categories...');
    const categories = await Category.insertMany([
      {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest electronic devices and gadgets',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500',
        isActive: true,
      },
      {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Trendy clothing and accessories',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500',
        isActive: true,
      },
      {
        name: 'Food & Beverages',
        slug: 'food-beverages',
        description: 'Fresh food and delicious beverages',
        image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500',
        isActive: true,
      },
    ]);
    logger.info(`✅ Created ${categories.length} categories`);

    // 3. Create Stores
    logger.info('🔄 Creating stores...');
    const stores = await Store.insertMany([
      {
        name: 'TechHub Electronics',
        slug: 'techhub-electronics',
        description: 'Your one-stop shop for all electronic needs',
        logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300',
        category: categories[0]._id,
        location: {
          address: '123 Tech Street',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          coordinates: [77.209, 28.6139],
        },
        contact: {
          phone: '+91-11-12345678',
          email: 'info@techhub.com',
        },
        ratings: {
          average: 4.5,
          count: 1250,
        },
        offers: {
          hasDelivery: true,
          hasPickup: true,
          freeDeliveryThreshold: 500,
        },
        operationalInfo: {
          businessHours: {
            monday: { open: '09:00', close: '21:00', isOpen: true },
            tuesday: { open: '09:00', close: '21:00', isOpen: true },
            wednesday: { open: '09:00', close: '21:00', isOpen: true },
            thursday: { open: '09:00', close: '21:00', isOpen: true },
            friday: { open: '09:00', close: '21:00', isOpen: true },
            saturday: { open: '10:00', close: '22:00', isOpen: true },
            sunday: { open: '11:00', close: '20:00', isOpen: true },
          },
          deliveryRadius: 25,
          avgDeliveryTime: 45,
        },
        analytics: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          conversionRate: 0,
        },
        tags: ['electronics', 'gadgets', 'mobile'],
        isActive: true,
        isFeatured: true,
        isVerified: true,
      },
      {
        name: 'Fashion Forward',
        slug: 'fashion-forward',
        description: 'Latest fashion trends and styles',
        logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300',
        category: categories[1]._id,
        location: {
          address: '456 Fashion Avenue',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          coordinates: [72.8777, 19.076],
        },
        contact: {
          phone: '+91-22-87654321',
          email: 'hello@fashionforward.com',
        },
        ratings: {
          average: 4.2,
          count: 890,
        },
        offers: {
          hasDelivery: true,
          hasPickup: false,
          freeDeliveryThreshold: 999,
        },
        operationalInfo: {
          businessHours: {
            monday: { open: '10:00', close: '22:00', isOpen: true },
            tuesday: { open: '10:00', close: '22:00', isOpen: true },
            wednesday: { open: '10:00', close: '22:00', isOpen: true },
            thursday: { open: '10:00', close: '22:00', isOpen: true },
            friday: { open: '10:00', close: '23:00', isOpen: true },
            saturday: { open: '10:00', close: '23:00', isOpen: true },
            sunday: { open: '11:00', close: '21:00', isOpen: true },
          },
          deliveryRadius: 20,
          avgDeliveryTime: 60,
        },
        analytics: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          conversionRate: 0,
        },
        tags: ['fashion', 'clothing', 'style'],
        isActive: true,
        isFeatured: true,
        isVerified: true,
      },
    ]);
    logger.info(`✅ Created ${stores.length} stores`);

    // 4. Create Products
    logger.info('🔄 Creating products...');
    const products = await Product.insertMany([
      {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'Latest iPhone with advanced features and excellent camera quality',
        shortDescription: 'Premium smartphone with Pro features',
        category: categories[0]._id,
        store: stores[0]._id,
        brand: 'Apple',
        sku: 'IPHONE15PRO001',
        images: [
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
        ],
        pricing: {
          original: 109999,
          selling: 99999,
          discount: 9.1,
          currency: 'INR',
        },
        inventory: {
          stock: 50,
          isAvailable: true,
          lowStockThreshold: 10,
          unlimited: false,
        },
        ratings: {
          average: 4.8,
          count: 245,
          distribution: {
            5: 180,
            4: 45,
            3: 15,
            2: 3,
            1: 2,
          },
        },
        specifications: [
          { key: 'Screen Size', value: '6.1 inches', group: 'Display' },
          { key: 'RAM', value: '8GB', group: 'Performance' },
          { key: 'Storage', value: '256GB', group: 'Storage' },
          { key: 'Battery', value: '3274mAh', group: 'Battery' },
        ],
        tags: ['smartphone', 'apple', 'premium', 'camera', 'ios'],
        seo: {
          title: 'iPhone 15 Pro - Buy Online',
          description: 'Get the latest iPhone 15 Pro with advanced features',
          keywords: ['iphone', 'apple', 'smartphone', 'premium'],
        },
        analytics: {
          views: 15420,
          purchases: 245,
          conversions: 1.6,
          wishlistAdds: 890,
          shareCount: 45,
          returnRate: 2.1,
          avgRating: 4.8,
        },
        isActive: true,
        isFeatured: true,
        isDigital: false,
        weight: 187,
      },
      {
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-t-shirt',
        description: 'Comfortable premium cotton t-shirt perfect for everyday wear',
        shortDescription: '100% premium cotton comfortable t-shirt',
        category: categories[1]._id,
        store: stores[1]._id,
        brand: 'FashionForward',
        sku: 'TSHIRT001',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
        pricing: {
          original: 2499,
          selling: 1999,
          discount: 20,
          currency: 'INR',
        },
        inventory: {
          stock: 200,
          isAvailable: true,
          lowStockThreshold: 20,
          unlimited: false,
        },
        ratings: {
          average: 4.4,
          count: 156,
          distribution: {
            5: 89,
            4: 45,
            3: 18,
            2: 3,
            1: 1,
          },
        },
        specifications: [
          { key: 'Material', value: '100% Cotton', group: 'Fabric' },
          { key: 'Fit', value: 'Regular', group: 'Fit' },
          { key: 'Care', value: 'Machine Wash', group: 'Care' },
        ],
        tags: ['t-shirt', 'cotton', 'casual', 'comfortable', 'everyday'],
        seo: {
          title: 'Premium Cotton T-Shirt - Comfortable Wear',
          description: 'Comfortable premium cotton t-shirt for daily wear',
          keywords: ['t-shirt', 'cotton', 'comfortable', 'casual'],
        },
        analytics: {
          views: 8750,
          purchases: 156,
          conversions: 1.8,
          wishlistAdds: 445,
          shareCount: 23,
          returnRate: 1.2,
          avgRating: 4.4,
        },
        isActive: true,
        isFeatured: false,
        isDigital: false,
        weight: 200,
      },
    ]);
    logger.info(`✅ Created ${products.length} products`);

    // 5. Orders - Skipping for now due to complex schema
    logger.info('⏩ Skipping orders (complex schema) - can be added later');

    logger.info('\n🎉 Data seeding completed successfully!');
    logger.info('=====================================');
    logger.info('📊 Summary:');
    logger.info(`👤 Users: ${users.length}`);
    logger.info(`📂 Categories: ${categories.length}`);
    logger.info(`🏪 Stores: ${stores.length}`);
    logger.info(`📦 Products: ${products.length}`);
    logger.info(`📋 Orders: 0 (skipped for now)`);
    logger.info('✅ Database populated with sample data!');
  } catch (error) {
    logger.error('❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('👋 Disconnected from database');
    process.exit(0);
  }
}

if (require.main === module) {
  seedData();
}

export { seedData };
