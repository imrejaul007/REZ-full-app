// Database Indexes Migration
// PERFORMANCE FIX: Removed duplicate indexes and consolidated

db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ merchantId: 1, status: 1 });
db.orders.createIndex({ razorpayOrderId: 1 }, { unique: true });
db.orders.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL 30 days

db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { sparse: true });
db.users.createIndex({ deviceId: 1 });
db.users.createIndex({ createdAt: 1 });

db.wallets.createIndex({ userId: 1 }, { unique: true });
db.wallets.createIndex({ createdAt: 1 });

db.transactions.createIndex({ userId: 1, createdAt: -1 });
db.transactions.createIndex({ orderId: 1 });
db.transactions.createIndex({ type: 1, createdAt: -1 });

db.merchants.createIndex({ phone: 1 }, { unique: true });
db.merchants.createIndex({ status: 1, createdAt: -1 });
db.merchants.createIndex({ location: '2dsphere' });

db.products.createIndex({ merchantId: 1, status: 1 });
db.products.createIndex({ category: 1, status: 1 });
db.products.createIndex({ name: 'text', description: 'text' });

// Composite indexes for common queries
db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 });

print('Indexes created successfully');
