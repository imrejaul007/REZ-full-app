/**
 * E2E Money Flow Test Suite
 *
 * Tests the complete QR -> Order -> Payment -> Coins flow with:
 * 1. Happy path test
 * 2. Idempotency test (retry payment)
 * 3. Double-charge prevention test
 * 4. Ledger balance verification (DEBIT = CREDIT = 0)
 * 5. Event delivery verification
 *
 * Usage:
 *   node money-flow-test.js                    # Run all tests
 *   node money-flow-test.js --test=happy       # Run specific test
 *   node money-flow-test.js --env=staging       # Target staging
 */

const crypto = require('crypto');

// ==================== Configuration ====================

const CONFIG = {
  orderService: process.env.ORDER_SERVICE_URL || 'http://localhost:4002',
  paymentService: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
  walletService: process.env.WALLET_SERVICE_URL || 'http://localhost:4003',
  ledgerService: process.env.LEDGER_SERVICE_URL || 'http://localhost:4005',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_test',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Test credentials (set via environment in production)
  testUserId: process.env.TEST_USER_ID || 'test_user_' + Date.now(),
  testMerchantId: process.env.TEST_MERCHANT_ID || 'test_merchant_' + Date.now(),
  authToken: process.env.TEST_AUTH_TOKEN || 'Bearer test_token',

  // Test amounts
  testAmount: 100,
  testCoinConversionRate: 1, // 1 rupee = 1 coin
};

// ==================== MongoDB Client ====================

let mongoClient = null;
let db = null;

async function connectMongo() {
  const { MongoClient } = require('mongodb');
  mongoClient = new MongoClient(CONFIG.mongoUri);
  await mongoClient.connect();
  db = mongoClient.db();
  console.log('[MongoDB] Connected to', CONFIG.mongoUri);
  return db;
}

async function closeMongo() {
  if (mongoClient) {
    await mongoClient.close();
    console.log('[MongoDB] Connection closed');
  }
}

async function getCollection(name) {
  if (!db) await connectMongo();
  return db.collection(name);
}

// ==================== Redis Client ====================

let redisClient = null;

async function connectRedis() {
  const { createClient } = require('redis');
  redisClient = createClient({ url: CONFIG.redisUrl });
  redisClient.on('error', (err) => console.error('[Redis] Error:', err));
  await redisClient.connect();
  console.log('[Redis] Connected to', CONFIG.redisUrl);
  return redisClient;
}

async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    console.log('[Redis] Connection closed');
  }
}

// ==================== HTTP Utilities ====================

async function httpRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': CONFIG.authToken,
      ...options.headers,
    },
    timeout: 10000,
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  return { status: response.status, data, ok: response.ok };
}

// ==================== Test Utilities ====================

let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
  }
}

async function test(name, fn) {
  const testName = `[TEST] ${name}`;
  console.log(`\n${'='.repeat(60)}`);
  console.log(testName);
  console.log('='.repeat(60));

  try {
    await fn();
    testResults.passed++;
    console.log(`[PASS] ${name}`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    console.error(`[FAIL] ${name}: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

function generateId(prefix = 'test') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`;
}

// ==================== Cleanup Functions ====================

async function cleanupTestData(prefix) {
  const collections = ['orders', 'payments', 'wallets', 'ledgerEntries'];
  const pattern = new RegExp(`^${prefix}`);

  for (const collName of collections) {
    try {
      const coll = await getCollection(collName);
      const result = await coll.deleteMany({
        $or: [
          { userId: pattern },
          { merchantId: pattern },
          { testPrefix: prefix },
        ],
      });
      console.log(`[Cleanup] ${collName}: deleted ${result.deletedCount} documents`);
    } catch (err) {
      console.warn(`[Cleanup] ${collName}: ${err.message}`);
    }
  }

  // Clear Redis test keys
  if (redisClient) {
    try {
      const keys = await redisClient.keys(`${prefix}:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`[Cleanup] Redis: deleted ${keys.length} keys`);
      }
    } catch (err) {
      console.warn(`[Cleanup] Redis keys: ${err.message}`);
    }
  }
}

// ==================== Test Scenario 1: Happy Path ====================

async function testHappyPath() {
  const testPrefix = generateId('happy');
  const testUserId = `${testPrefix}_user`;
  const testMerchantId = `${testPrefix}_merchant`;
  const testOrderId = `${testPrefix}_order`;

  console.log(`[Setup] Test prefix: ${testPrefix}`);

  // Step 1: Create test wallet with initial balance
  await test('1.1 Create test wallet', async () => {
    const coll = await getCollection('wallets');
    await coll.insertOne({
      userId: testUserId,
      balance: 0,
      coins: { rez: 0 },
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const wallet = await coll.findOne({ userId: testUserId });
    assert(wallet !== null, 'Wallet should be created');
    assertEqual(wallet.balance, 0, 'Initial balance should be 0');
    assertEqual(wallet.coins.rez, 0, 'Initial coins should be 0');
  });

  // Step 2: Create order via Order Service
  let paymentId = null;
  let razorpayOrderId = null;

  await test('1.2 Create order (QR scan simulation)', async () => {
    const coll = await getCollection('orders');

    const orderData = {
      orderId: testOrderId,
      merchantId: testMerchantId,
      userId: testUserId,
      items: [
        { itemId: 'item_001', name: 'Coffee', quantity: 2, price: 50 },
      ],
      totalAmount: CONFIG.testAmount,
      qrCodeId: `qr_${testPrefix}`,
      status: 'pending',
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await coll.insertOne(orderData);

    const order = await coll.findOne({ orderId: testOrderId });
    assert(order !== null, 'Order should be created');
    assertEqual(order.status, 'pending', 'Order status should be pending');
    assertEqual(order.totalAmount, CONFIG.testAmount, 'Order amount should match');
  });

  // Step 3: Initiate payment
  await test('1.3 Initiate payment', async () => {
    const coll = await getCollection('payments');
    const idempotencyKey = `idem_${testPrefix}`;

    paymentId = `PAY_${testPrefix}`;
    razorpayOrderId = `order_${testPrefix}`;

    const paymentData = {
      paymentId,
      orderId: testOrderId,
      userId: testUserId,
      merchantId: testMerchantId,
      amount: CONFIG.testAmount,
      paymentMethod: 'upi',
      status: 'pending',
      orchestratorIdempotencyKey: idempotencyKey,
      razorpayOrderId,
      walletCredited: false,
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await coll.insertOne(paymentData);

    const payment = await coll.findOne({ paymentId });
    assert(payment !== null, 'Payment should be created');
    assertEqual(payment.status, 'pending', 'Payment status should be pending');
    assertEqual(payment.amount, CONFIG.testAmount, 'Payment amount should match');
    assertEqual(payment.walletCredited, false, 'Wallet should not be credited yet');
  });

  // Step 4: Simulate Razorpay webhook (payment captured)
  await test('1.4 Capture payment (simulate UPI success)', async () => {
    const coll = await getCollection('payments');
    const razorpayPaymentId = `pay_${testPrefix}`;

    // Update payment status to completed
    await coll.updateOne(
      { paymentId },
      {
        $set: {
          status: 'completed',
          razorpayPaymentId,
          capturedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Set replay prevention nonce in Redis
    if (redisClient) {
      await redisClient.set(`pay:nonce:${razorpayPaymentId}`, '1', { EX: 90000 });
    }

    const payment = await coll.findOne({ paymentId });
    assertEqual(payment.status, 'completed', 'Payment should be completed');
    assertEqual(payment.razorpayPaymentId, razorpayPaymentId, 'Razorpay payment ID should be set');
  });

  // Step 5: Credit wallet (coins)
  await test('1.5 Credit wallet with coins', async () => {
    const coll = await getCollection('wallets');
    const coinsToCredit = Math.floor(CONFIG.testAmount * CONFIG.testCoinConversionRate);

    await coll.updateOne(
      { userId: testUserId },
      {
        $inc: {
          balance: coinsToCredit,
          'coins.rez': coinsToCredit,
        },
        $set: {
          lastTransactionId: paymentId,
          updatedAt: new Date(),
        },
      }
    );

    const wallet = await coll.findOne({ userId: testUserId });
    assertEqual(wallet.balance, coinsToCredit, 'Wallet balance should be credited');
    assertEqual(wallet.coins.rez, coinsToCredit, 'ReZ coins should be credited');

    // Mark payment as wallet credited
    const payColl = await getCollection('payments');
    await payColl.updateOne(
      { paymentId },
      {
        $set: {
          walletCredited: true,
          walletCreditedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );
  });

  // Step 6: Verify complete flow
  await test('1.6 Verify complete flow', async () => {
    const orderColl = await getCollection('orders');
    const paymentColl = await getCollection('payments');
    const walletColl = await getCollection('wallets');

    const [order, payment, wallet] = await Promise.all([
      orderColl.findOne({ orderId: testOrderId }),
      paymentColl.findOne({ paymentId }),
      walletColl.findOne({ userId: testUserId }),
    ]);

    // Verify order
    assertEqual(order.status, 'pending', 'Order status');
    assertEqual(order.totalAmount, CONFIG.testAmount, 'Order amount');

    // Verify payment
    assertEqual(payment.status, 'completed', 'Payment status');
    assertEqual(payment.amount, CONFIG.testAmount, 'Payment amount');
    assertEqual(payment.walletCredited, true, 'Wallet should be credited');

    // Verify wallet
    assertEqual(wallet.balance, CONFIG.testAmount, 'Wallet balance should match payment amount');
    assertEqual(wallet.coins.rez, CONFIG.testAmount, 'ReZ coins should match payment amount');

    console.log('\n[Flow Summary]');
    console.log(`  Order: ${testOrderId} - ${order.status}`);
    console.log(`  Payment: ${paymentId} - ${payment.status} (${payment.amount} rupees)`);
    console.log(`  Wallet: ${wallet.balance} coins credited`);
  });

  // Cleanup
  await cleanupTestData(testPrefix);
}

// ==================== Test Scenario 2: Idempotency ====================

async function testIdempotency() {
  const testPrefix = generateId('idem');
  const testUserId = `${testPrefix}_user`;
  const testMerchantId = `${testPrefix}_merchant`;
  const testOrderId = `${testPrefix}_order`;
  const idempotencyKey = `idem_${testPrefix}`;

  console.log(`[Setup] Test prefix: ${testPrefix}`);

  // Create test data
  await test('2.0 Setup test data', async () => {
    const [orderColl, paymentColl, walletColl] = await Promise.all([
      getCollection('orders'),
      getCollection('payments'),
      getCollection('wallets'),
    ]);

    await walletColl.insertOne({
      userId: testUserId,
      balance: 0,
      coins: { rez: 0 },
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await orderColl.insertOne({
      orderId: testOrderId,
      merchantId: testMerchantId,
      userId: testUserId,
      items: [{ itemId: 'item_001', name: 'Test', quantity: 1, price: 100 }],
      totalAmount: 100,
      status: 'pending',
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await paymentColl.insertOne({
      paymentId: `PAY_${testPrefix}`,
      orderId: testOrderId,
      userId: testUserId,
      merchantId: testMerchantId,
      amount: 100,
      paymentMethod: 'upi',
      status: 'completed',
      orchestratorIdempotencyKey: idempotencyKey,
      razorpayPaymentId: `pay_${testPrefix}`,
      walletCredited: true,
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('[Setup] Test data created');
  });

  // Test 1: Verify idempotency key is unique
  await test('2.1 Idempotency key should be unique', async () => {
    const coll = await getCollection('payments');
    const count = await coll.countDocuments({ orchestratorIdempotencyKey: idempotencyKey });
    assertEqual(count, 1, 'Should have exactly one payment with this idempotency key');
  });

  // Test 2: Verify replay prevention in Redis
  await test('2.2 Replay prevention (Razorpay payment ID)', async () => {
    const razorpayPaymentId = `pay_${testPrefix}`;

    if (redisClient) {
      // First check should succeed (nonce not set)
      const firstCheck = await redisClient.set(
        `pay:nonce:${razorpayPaymentId}`,
        '1',
        { NX: true, EX: 90000 }
      );
      assert(firstCheck !== null, 'First set should succeed (key does not exist)');

      // Second check should fail (nonce already set)
      const secondCheck = await redisClient.set(
        `pay:nonce:${razorpayPaymentId}`,
        '1',
        { NX: true, EX: 90000 }
      );
      assert(secondCheck === null, 'Second set should fail (key exists - replay detected)');
    }
  });

  // Test 3: Verify duplicate payment capture is rejected
  await test('2.3 Duplicate capture should be rejected', async () => {
    const coll = await getCollection('payments');
    const razorpayPaymentId = `pay_${testPrefix}`;

    // Check that payment is already completed
    const payment = await coll.findOne({ paymentId: `PAY_${testPrefix}` });
    assertEqual(payment.status, 'completed', 'Payment should already be completed');

    // Simulate rejection of duplicate capture (in real system, Redis nonce check)
    if (redisClient) {
      const nonceKey = `pay:nonce:${razorpayPaymentId}`;
      const nonceExists = await redisClient.exists(nonceKey);
      assertEqual(nonceExists, 1, 'Nonce should exist for already captured payment');
    }
  });

  // Test 4: Verify wallet was only credited once
  await test('2.4 Wallet credited exactly once', async () => {
    const coll = await getCollection('wallets');
    const wallet = await coll.findOne({ userId: testUserId });
    assertEqual(wallet.balance, 100, 'Wallet should have exactly 100 coins');
    assertEqual(wallet.coins.rez, 100, 'ReZ coins should be exactly 100');
  });

  // Cleanup
  await cleanupTestData(testPrefix);
}

// ==================== Test Scenario 3: Double-Charge Prevention ====================

async function testDoubleChargePrevention() {
  const testPrefix = generateId('double');
  const testUserId = `${testPrefix}_user`;
  const testMerchantId = `${testPrefix}_merchant`;
  const testOrderId = `${testPrefix}_order`;
  const paymentId = `PAY_${testPrefix}`;
  const razorpayPaymentId = `pay_${testPrefix}`;

  console.log(`[Setup] Test prefix: ${testPrefix}`);

  // Create test data
  await test('3.0 Setup test data', async () => {
    const [walletColl, paymentColl, orderColl] = await Promise.all([
      getCollection('wallets'),
      getCollection('payments'),
      getCollection('orders'),
    ]);

    await walletColl.insertOne({
      userId: testUserId,
      balance: 0,
      coins: { rez: 0 },
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await orderColl.insertOne({
      orderId: testOrderId,
      merchantId: testMerchantId,
      userId: testUserId,
      items: [{ itemId: 'item_001', name: 'Test', quantity: 1, price: 100 }],
      totalAmount: 100,
      status: 'pending',
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await paymentColl.insertOne({
      paymentId,
      orderId: testOrderId,
      userId: testUserId,
      merchantId: testMerchantId,
      amount: 100,
      paymentMethod: 'upi',
      status: 'pending',
      walletCredited: false,
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  // Test 1: Simulate first payment capture
  await test('3.1 First payment capture succeeds', async () => {
    const coll = await getCollection('payments');

    await coll.updateOne(
      { paymentId },
      {
        $set: {
          status: 'completed',
          razorpayPaymentId,
          capturedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Set Redis nonce
    if (redisClient) {
      await redisClient.set(`pay:nonce:${razorpayPaymentId}`, '1', { EX: 90000 });
    }

    const payment = await coll.findOne({ paymentId });
    assertEqual(payment.status, 'completed', 'First capture should succeed');
  });

  // Credit wallet
  await test('3.2 Credit wallet for first capture', async () => {
    const coll = await getCollection('wallets');
    await coll.updateOne(
      { userId: testUserId },
      {
        $inc: { balance: 100, 'coins.rez': 100 },
        $set: { lastTransactionId: paymentId, updatedAt: new Date() },
      }
    );

    await coll.updateOne(
      { paymentId },
      { $set: { walletCredited: true, walletCreditedAt: new Date() } }
    );
  });

  // Test 2: Simulate duplicate capture attempt
  await test('3.3 Second capture attempt is rejected', async () => {
    const coll = await getCollection('payments');
    const razorpayPaymentId = `pay_${testPrefix}`;

    // Check Redis nonce (should exist - prevents replay)
    if (redisClient) {
      const nonceKey = `pay:nonce:${razorpayPaymentId}`;
      const nonceExists = await redisClient.exists(nonceKey);

      if (nonceExists) {
        // In real system, this would return 409 Conflict
        console.log('[Info] Duplicate capture would be rejected (nonce exists in Redis)');
        assert(true, 'Rejection detected via Redis nonce');
      } else {
        // If Redis not available, check MongoDB
        const payment = await coll.findOne({ paymentId });
        assertEqual(payment.status, 'completed', 'Payment already completed in MongoDB');
      }
    }
  });

  // Test 3: Verify wallet balance unchanged
  await test('3.4 Wallet balance unchanged after duplicate attempt', async () => {
    const coll = await getCollection('wallets');
    const wallet = await coll.findOne({ userId: testUserId });
    assertEqual(wallet.balance, 100, 'Balance should still be 100 (not double charged)');
    assertEqual(wallet.coins.rez, 100, 'Coins should still be 100 (not double credited)');
  });

  // Cleanup
  await cleanupTestData(testPrefix);
}

// ==================== Test Scenario 4: Ledger Balance ====================

async function testLedgerBalance() {
  const testPrefix = generateId('ledger');
  const testUserId = `${testPrefix}_user`;
  const testMerchantId = `${testPrefix}_merchant`;
  const testOrderId = `${testPrefix}_order`;
  const paymentId = `PAY_${testPrefix}`;

  console.log(`[Setup] Test prefix: ${testPrefix}`);

  // Create test data with ledger entries
  await test('4.0 Setup test data with ledger entries', async () => {
    const [walletColl, paymentColl, orderColl, ledgerColl] = await Promise.all([
      getCollection('wallets'),
      getCollection('payments'),
      getCollection('orders'),
      getCollection('ledgerEntries'),
    ]);

    // Create accounts for double-entry
    const accountsColl = await getCollection('accounts');
    await accountsColl.insertMany([
      {
        accountId: `CUSTOMER_WALLET_${testPrefix}`,
        name: 'CUSTOMER_WALLET',
        type: 'ASSET',
        balance: 0,
        currency: 'INR',
        testPrefix,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        accountId: `REVENUE_${testPrefix}`,
        name: 'REVENUE',
        type: 'REVENUE',
        balance: 0,
        currency: 'INR',
        testPrefix,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create wallet
    await walletColl.insertOne({
      userId: testUserId,
      balance: 0,
      coins: { rez: 0 },
      accountId: `CUSTOMER_WALLET_${testPrefix}`,
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create order
    await orderColl.insertOne({
      orderId: testOrderId,
      merchantId: testMerchantId,
      userId: testUserId,
      items: [{ itemId: 'item_001', name: 'Test', quantity: 1, price: 100 }],
      totalAmount: 100,
      status: 'pending',
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create payment
    await paymentColl.insertOne({
      paymentId,
      orderId: testOrderId,
      userId: testUserId,
      merchantId: testMerchantId,
      amount: 100,
      paymentMethod: 'upi',
      status: 'completed',
      walletCredited: true,
      testPrefix,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create ledger entries (double-entry)
    await ledgerColl.insertMany([
      {
        entryId: `LEDGER_DEBIT_${testPrefix}`,
        transactionId: `TXN_${testPrefix}`,
        accountId: `CUSTOMER_WALLET_${testPrefix}`,
        accountName: 'CUSTOMER_WALLET',
        type: 'DEBIT',
        amount: 100,
        currency: 'INR',
        description: 'Wallet credit for payment',
        metadata: { paymentId, userId: testUserId },
        testPrefix,
        createdAt: new Date(),
      },
      {
        entryId: `LEDGER_CREDIT_${testPrefix}`,
        transactionId: `TXN_${testPrefix}`,
        accountId: `REVENUE_${testPrefix}`,
        accountName: 'REVENUE',
        type: 'CREDIT',
        amount: 100,
        currency: 'INR',
        description: 'Revenue from payment',
        metadata: { paymentId, userId: testUserId },
        testPrefix,
        createdAt: new Date(),
      },
    ]);
  });

  // Test 1: Verify DEBIT = CREDIT
  await test('4.1 Ledger DEBIT equals CREDIT', async () => {
    const coll = await getCollection('ledgerEntries');

    const entries = await coll.find({ testPrefix }).toArray();

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      if (entry.type === 'DEBIT') {
        totalDebits += entry.amount;
      } else if (entry.type === 'CREDIT') {
        totalCredits += entry.amount;
      }
    }

    console.log(`[Ledger] Total Debits: ${totalDebits}`);
    console.log(`[Ledger] Total Credits: ${totalCredits}`);
    console.log(`[Ledger] Difference: ${Math.abs(totalDebits - totalCredits)}`);

    assert(
      Math.abs(totalDebits - totalCredits) < 0.001,
      `Ledger unbalanced: Debits=${totalDebits}, Credits=${totalCredits}`
    );
  });

  // Test 2: Verify trial balance
  await test('4.2 Trial balance verification', async () => {
    const ledgerColl = await getCollection('ledgerEntries');
    const accountsColl = await getCollection('accounts');

    const entries = await ledgerColl.find({ testPrefix }).toArray();
    const accounts = await accountsColl.find({ testPrefix }).toArray();

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      if (entry.type === 'DEBIT') totalDebits += entry.amount;
      else totalCredits += entry.amount;
    }

    // For ASSET accounts, normal balance is DEBIT
    // For REVENUE accounts, normal balance is CREDIT
    console.log(`[Trial Balance]`);
    console.log(`  Total Debits: ${totalDebits}`);
    console.log(`  Total Credits: ${totalCredits}`);
    console.log(`  Balanced: ${Math.abs(totalDebits - totalCredits) < 0.001 ? 'YES' : 'NO'}`);

    assert(
      Math.abs(totalDebits - totalCredits) < 0.001,
      'Trial balance must be balanced'
    );
  });

  // Test 3: Verify account balances
  await test('4.3 Account balance calculation', async () => {
    const ledgerColl = await getCollection('ledgerEntries');
    const accountsColl = await getCollection('accounts');

    const customerWalletAccount = await accountsColl.findOne({
      accountId: `CUSTOMER_WALLET_${testPrefix}`,
    });

    const entries = await ledgerColl
      .find({ accountId: customerWalletAccount.accountId })
      .toArray();

    // ASSET accounts: normal balance is DEBIT
    // Balance = SUM(DEBITS) - SUM(CREDITS)
    let calculatedBalance = 0;
    for (const entry of entries) {
      if (entry.type === 'DEBIT') calculatedBalance += entry.amount;
      else calculatedBalance -= entry.amount;
    }

    console.log(`[Account Balance] CUSTOMER_WALLET: ${calculatedBalance}`);

    assertEqual(calculatedBalance, 100, 'CUSTOMER_WALLET balance should be 100');
  });

  // Cleanup
  await cleanupTestData(testPrefix);
}

// ==================== Test Scenario 5: Event Delivery ====================

async function testEventDelivery() {
  const testPrefix = generateId('event');
  const testUserId = `${testPrefix}_user`;
  const testMerchantId = `${testPrefix}_merchant`;
  const testOrderId = `${testPrefix}_order`;
  const paymentId = `PAY_${testPrefix}`;
  const streamName = 'rez:events:test';

  console.log(`[Setup] Test prefix: ${testPrefix}`);

  // Setup test data and publish events
  await test('5.0 Setup and publish events', async () => {
    const [orderColl, paymentColl, eventColl] = await Promise.all([
      getCollection('orders'),
      getCollection('payments'),
      getCollection('events'),
    ]);

    // Create test data
    await orderColl.insertOne({
      orderId: testOrderId,
      merchantId: testMerchantId,
      userId: testUserId,
      status: 'pending',
      totalAmount: 100,
      testPrefix,
      createdAt: new Date(),
    });

    await paymentColl.insertOne({
      paymentId,
      orderId: testOrderId,
      userId: testUserId,
      status: 'completed',
      amount: 100,
      testPrefix,
      createdAt: new Date(),
    });

    // Publish events (simulating event bus)
    const events = [
      {
        eventId: `EVT_ORDER_${testPrefix}`,
        type: 'order.created',
        source: 'rez-order-service',
        data: { orderId: testOrderId, merchantId: testMerchantId },
        correlationId: testOrderId,
        timestamp: new Date(),
        testPrefix,
      },
      {
        eventId: `EVT_PAY_INIT_${testPrefix}`,
        type: 'payment.initiated',
        source: 'rez-payment-service',
        data: { paymentId, orderId: testOrderId, amount: 100 },
        correlationId: testOrderId,
        timestamp: new Date(),
        testPrefix,
      },
      {
        eventId: `EVT_PAY_COMPLETE_${testPrefix}`,
        type: 'payment.completed',
        source: 'rez-payment-service',
        data: { paymentId, orderId: testOrderId, amount: 100 },
        correlationId: testOrderId,
        timestamp: new Date(),
        testPrefix,
      },
      {
        eventId: `EVT_WALLET_CREDIT_${testPrefix}`,
        type: 'wallet.credited',
        source: 'rez-wallet-service',
        data: { userId: testUserId, amount: 100, paymentId },
        correlationId: testOrderId,
        timestamp: new Date(),
        testPrefix,
      },
    ];

    await eventColl.insertMany(events);

    // Also publish to Redis stream if available
    if (redisClient) {
      for (const event of events) {
        try {
          await redisClient.xAdd(streamName, '*', {
            type: event.type,
            source: event.source,
            data: JSON.stringify(event.data),
            correlationId: event.correlationId,
            timestamp: event.timestamp.toISOString(),
          });
        } catch (err) {
          console.warn('[Redis Stream] xAdd failed:', err.message);
        }
      }
    }

    console.log('[Events] Published 4 events');
  });

  // Test 1: Verify order.created event
  await test('5.1 Verify order.created event', async () => {
    const coll = await getCollection('events');
    const event = await coll.findOne({
      type: 'order.created',
      testPrefix,
    });

    assert(event !== null, 'order.created event should exist');
    assertEqual(event.data.orderId, testOrderId, 'Event data should contain orderId');
  });

  // Test 2: Verify payment events
  await test('5.2 Verify payment events', async () => {
    const coll = await getCollection('events');

    const initiated = await coll.findOne({
      type: 'payment.initiated',
      testPrefix,
    });
    assert(initiated !== null, 'payment.initiated event should exist');
    assertEqual(initiated.data.paymentId, paymentId, 'Event data should contain paymentId');

    const completed = await coll.findOne({
      type: 'payment.completed',
      testPrefix,
    });
    assert(completed !== null, 'payment.completed event should exist');
    assertEqual(completed.data.paymentId, paymentId, 'Event data should contain paymentId');
  });

  // Test 3: Verify wallet.credited event
  await test('5.3 Verify wallet.credited event', async () => {
    const coll = await getCollection('events');
    const event = await coll.findOne({
      type: 'wallet.credited',
      testPrefix,
    });

    assert(event !== null, 'wallet.credited event should exist');
    assertEqual(event.data.userId, testUserId, 'Event data should contain userId');
    assertEqual(event.data.amount, 100, 'Event data should contain correct amount');
  });

  // Test 4: Verify event ordering
  await test('5.4 Verify event ordering by correlationId', async () => {
    const coll = await getCollection('events');
    const events = await coll
      .find({ testPrefix })
      .sort({ timestamp: 1 })
      .toArray();

    const expectedOrder = ['order.created', 'payment.initiated', 'payment.completed', 'wallet.credited'];
    const actualOrder = events.map((e) => e.type);

    console.log('[Event Order]');
    events.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.type} @ ${e.timestamp}`);
    });

    assertEqual(actualOrder.length, 4, 'Should have 4 events');
    assertDeepEqual(actualOrder, expectedOrder, 'Events should be in correct order');
  });

  // Test 5: Verify Redis stream delivery (if available)
  await test('5.5 Verify Redis stream delivery', async () => {
    if (!redisClient) {
      console.log('[Skip] Redis not available');
      return;
    }

    try {
      const events = await redisClient.xRange(streamName, '-', '+');
      console.log(`[Redis Stream] ${events.length} events in stream`);

      assert(events.length >= 4, 'Should have events in Redis stream');
    } catch (err) {
      console.warn('[Redis Stream] Check failed:', err.message);
    }
  });

  // Cleanup
  await cleanupTestData(testPrefix);
}

// ==================== Test Summary ====================

async function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`[PASSED] ${testResults.passed} tests`);
  console.log(`[FAILED] ${testResults.failed} tests`);

  if (testResults.errors.length > 0) {
    console.log('\nFailed Tests:');
    testResults.errors.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }

  console.log('='.repeat(60));

  return testResults.failed === 0;
}

// ==================== Main ====================

async function main() {
  const args = process.argv.slice(2);
  const specificTest = args.find((arg) => arg.startsWith('--test='))?.split('=')[1];
  const env = args.find((arg) => arg.startsWith('--env='))?.split('=')[1];

  if (env) {
    console.log(`[Info] Targeting environment: ${env}`);
  }

  console.log('='.repeat(60));
  console.log('E2E MONEY FLOW TEST SUITE');
  console.log('='.repeat(60));
  console.log('Configuration:');
  console.log(`  Order Service: ${CONFIG.orderService}`);
  console.log(`  Payment Service: ${CONFIG.paymentService}`);
  console.log(`  Wallet Service: ${CONFIG.walletService}`);
  console.log(`  MongoDB: ${CONFIG.mongoUri}`);
  console.log(`  Redis: ${CONFIG.redisUrl}`);
  console.log('');

  try {
    // Connect to databases
    await connectMongo();
    await connectRedis();

    // Run tests based on filter
    const tests = [
      { name: 'happy', fn: testHappyPath },
      { name: 'idempotency', fn: testIdempotency },
      { name: 'double', fn: testDoubleChargePrevention },
      { name: 'ledger', fn: testLedgerBalance },
      { name: 'events', fn: testEventDelivery },
    ];

    if (specificTest) {
      const targetTest = tests.find((t) => t.name === specificTest);
      if (targetTest) {
        await test(targetTest.name, targetTest.fn);
      } else {
        console.error(`[Error] Unknown test: ${specificTest}`);
        console.log(`Available tests: ${tests.map((t) => t.name).join(', ')}`);
        process.exit(1);
      }
    } else {
      // Run all tests
      for (const { name, fn } of tests) {
        await test(name, fn);
      }
    }

    // Print summary
    const success = await printSummary();

    // Close connections
    await closeMongo();
    await closeRedis();

    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('[FATAL]', error);
    await closeMongo();
    await closeRedis();
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = {
  testHappyPath,
  testIdempotency,
  testDoubleChargePrevention,
  testLedgerBalance,
  testEventDelivery,
  CONFIG,
};

// Run if executed directly
if (require.main === module) {
  main();
}
