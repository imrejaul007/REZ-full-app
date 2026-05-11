/**
 * REZ Payment Correctness Test Suite
 * Tests ledger, fraud shield, idempotency
 */

import { ledger, LedgerEntryType } from './ledger';
import { fraudShield } from './fraudShield';
import { idempotency } from './idempotency';

let tests = 0;
let passed = 0;

function test(name, fn) {
  tests++;
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ============================================================
// LEDGER TESTS
// ============================================================

test('Ledger: Double-entry transaction', () => {
  const userId = 'test_user_1';
  const merchantId = 'test_merchant_1';
  const idempotencyKey = `pay:${userId}:${merchantId}:${Date.now()}`;

  const tx = ledger.processPayment({
    idempotencyKey,
    userId,
    merchantId,
    amount: 1000,
    cashbackPercent: 10,
    coinPercent: 5,
  });

  assert(tx.id, 'Transaction ID should exist');
  assert(tx.status === 'SUCCESS', 'Transaction should succeed');
  assert(tx.cashbackAmount > 0, 'Cashback should be earned');
});

test('Ledger: Idempotency - duplicate blocked', () => {
  const userId = 'test_user_2';
  const merchantId = 'test_merchant_2';
  const idempotencyKey = `pay:${userId}:${merchantId}:duplicate_test`;
  const idempotencyKey2 = `pay:${userId}:${merchantId}:duplicate_test`;

  // First transaction should succeed
  const tx1 = ledger.processPayment({
    idempotencyKey,
    userId,
    merchantId,
    amount: 500,
  });

  // Second with SAME key should fail
  const tx2 = ledger.processPayment({
    idempotencyKey,
    userId,
    merchantId,
    amount: 500,
  });

  assert(tx2.error === 'DUPLICATE_TRANSACTION', 'Duplicate should be blocked');
});

test('Ledger: Balance verification', () => {
  const reconciliation = ledger.reconcile();
  assert(reconciliation.balanced, 'Ledger should be balanced');
  console.log(`   Debit: ₹${reconciliation.totalDebit}, Credit: ₹${reconciliation.totalCredit}`);
});

// ============================================================
// FRAUD SHIELD TESTS
// ============================================================

test('Fraud Shield: Phone required', () => {
  const result = fraudShield.check({
    userId: 'fraud_test_user',
    amount: 100,
    transactionType: 'payment',
    phone: undefined,
  });

  assert(!result.passed, 'Should block without phone');
  assert(result.reason === 'PHONE_NOT_VERIFIED', 'Should require phone');
});

test('Fraud Shield: Velocity per hour', () => {
  const userId = 'velocity_test_user';

  // Record 10 transactions
  for (let i = 0; i < 10; i++) {
    fraudShield.recordTransaction({
      userId,
      phone: '+919999999999',
    });
  }

  // 11th should fail
  const result = fraudShield.check({
    userId,
    amount: 100,
    phone: '+919999999999',
    transactionType: 'payment',
  });

  assert(!result.passed, 'Should block after 10 transactions');
  assert(result.reason === 'VELOCITY_HOUR_EXCEEDED', 'Should block velocity');
});

test('Fraud Shield: Device fingerprinting', () => {
  const deviceId = 'device_fraud_test';

  // First account with device
  const result1 = fraudShield.check({
    userId: 'device_user_1',
    amount: 100,
    phone: '+919999999991',
    deviceFingerprint: deviceId,
    transactionType: 'payment',
  });

  // Second account with SAME device should fail
  const result2 = fraudShield.check({
    userId: 'device_user_2',
    amount: 100,
    phone: '+919999992',
    deviceFingerprint: deviceId,
    transactionType: 'payment',
  });

  assert(result2.reason === 'MULTIPLE_ACCOUNTS_SAME_DEVICE', 'Should block same device');
});

// ============================================================
// IDEMPOTENCY TESTS
// ============================================================

test('Idempotency: Lock and complete', async () => {
  const key = `test_${Date.now()}`;

  // Lock
  const locked = idempotency.lock(key);
  assert(locked, 'Should lock successfully');

  // Second lock should fail
  const locked2 = idempotency.lock(key);
  assert(!locked2, 'Should not lock twice');

  // Complete
  idempotency.complete(key, { result: 'success' });

  // Check completed
  const record = idempotency.get(key);
  assert(record?.status === 'COMPLETED', 'Should be completed');
});

test('Idempotency: Execute with cache', async () => {
  let callCount = 0;
  const key = `exec_test_${Date.now()}`;

  // First call should execute operation
  const result1 = await idempotency.execute({
    operation: async () => {
      callCount++;
      return { data: 'test_result' };
    },
    key: `exec_test_${key}`,
  });

  // Second call should return cached result
  const result2 = await idempotency.execute({
    operation: async () => {
      callCount++;
      return { data: 'new_result' };
    },
    key: `exec_test_${key}`,
  });

  assert(callCount === 1, 'Operation should only execute once');
  assert(result1.cached === false, 'First should execute');
  assert(result2.cached === true, 'Second should cache hit');
});

// ============================================================
// SUMMARY
// ============================================================

console.log('\n' + '═'.repeat(50));
console.log(`Tests: ${passed}/${tests} passed`);
console.log('═'.repeat(50));

if (passed === tests) {
  console.log('\n🎉 ALL TESTS PASSED\n');
} else {
  console.log(`\n❌ ${tests - passed} tests failed\n`);
  process.exit(1);
}
