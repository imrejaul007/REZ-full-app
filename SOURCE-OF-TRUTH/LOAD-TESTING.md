# ReZ Platform Load Testing Guide

This guide provides k6 load testing scripts for the ReZ platform's core financial services: Payment, Wallet, and Order services.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Test Scenarios](#test-scenarios)
- [Expected Throughput](#expected-throughput)
- [Alert Thresholds](#alert-thresholds)
- [How to Run Tests](#how-to-run-tests)
- [k6 Scripts](#k6-scripts)

---

## Prerequisites

### Install k6

```bash
# macOS
brew install k6

# Linux
sudo gpg --kring /usr/share/keyrings/k6-archive-keyring.gpg \
  --echo "Downloading k6..."
curl -fsSL https://dl.k6.io/key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows (with Chocolatey)
choco install k6
```

### Environment Variables

Create a `.env.load-test` file in your project root:

```bash
# Base URLs
PAYMENT_SERVICE_URL=https://api.rez.money
WALLET_SERVICE_URL=https://api.rez.money
ORDER_SERVICE_URL=https://api.rez.money

# Test Credentials (use dedicated load test accounts)
TEST_USER_ID=<your-test-user-id>
TEST_MERCHANT_ID=<your-test-merchant-id>
TEST_JWT_TOKEN=<your-test-jwt-token>
TEST_INTERNAL_TOKEN=<your-internal-service-token>

# Optional: InfluxDB for metrics export
K6_INFLUXDB_ORGANIZATION=<your-org>
K6_INFLUXDB_BUCKET=<your-bucket>
K6_INFLUXDB_TOKEN=<your-token>
K6_INFLUXDB_URL=https://localhost:8086
```

---

## Test Scenarios

### 1. Payment Service Tests

| Scenario | Description | VUs | Duration |
|----------|-------------|-----|----------|
| Smoke Test | Basic payment initiation | 5 | 30s |
| Load Test | Normal traffic simulation | 50 | 5m |
| Stress Test | Peak traffic simulation | 200 | 3m |
| Spike Test | Sudden traffic burst | 100 | 1m |
| Soak Test | Sustained load | 30 | 30m |

**Endpoints Tested:**
- `POST /pay/initiate` - Initiate payment
- `POST /pay/capture` - Capture payment
- `GET /pay/status/:paymentId` - Check payment status
- `POST /pay/refund` - Process refund

### 2. Wallet Service Tests

| Scenario | Description | VUs | Duration |
|----------|-------------|-----|----------|
| Smoke Test | Basic wallet operations | 10 | 30s |
| Load Test | Normal traffic simulation | 100 | 5m |
| Stress Test | High transaction volume | 300 | 3m |
| Concurrent Debits | Multiple simultaneous debits | 50 | 2m |

**Endpoints Tested:**
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/coin-debit` - Debit coins
- `POST /api/wallet/credit` - Credit coins (admin)
- `GET /api/wallet/transactions` - Transaction history

### 3. Order Service Tests

| Scenario | Description | VUs | Duration |
|----------|-------------|-----|----------|
| Smoke Test | Basic order creation | 5 | 30s |
| Load Test | Normal checkout flow | 75 | 5m |
| Stress Test | Peak checkout volume | 150 | 3m |
| Order Status | Frequent status checks | 50 | 5m |

**Endpoints Tested:**
- `POST /orders` - Create order
- `GET /orders` - List orders
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id/status` - Update status
- `POST /orders/:id/cancel` - Cancel order

---

## Expected Throughput

### Payment Service

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Requests/sec | 500 | 400 | 300 |
| p50 Latency | < 200ms | 300ms | 500ms |
| p95 Latency | < 500ms | 750ms | 1000ms |
| p99 Latency | < 1000ms | 1500ms | 2000ms |
| Error Rate | < 0.1% | 0.5% | 1% |
| Timeout Rate | < 0.01% | 0.1% | 0.5% |

### Wallet Service

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Requests/sec | 1000 | 800 | 600 |
| p50 Latency | < 100ms | 150ms | 200ms |
| p95 Latency | < 250ms | 400ms | 500ms |
| p99 Latency | < 500ms | 750ms | 1000ms |
| Error Rate | < 0.05% | 0.25% | 0.5% |
| Concurrent Debits | < 50/sec | 40/sec | 30/sec |

### Order Service

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Requests/sec | 300 | 240 | 180 |
| p50 Latency | < 300ms | 450ms | 600ms |
| p95 Latency | < 700ms | 1000ms | 1500ms |
| p99 Latency | < 1500ms | 2000ms | 3000ms |
| Error Rate | < 0.2% | 0.5% | 1% |
| Order Creation | < 500ms p95 | 750ms | 1000ms |

### Resource Targets

| Resource | Normal | Peak | Critical |
|----------|--------|------|----------|
| CPU Usage | < 60% | < 80% | > 90% |
| Memory Usage | < 70% | < 85% | > 95% |
| MongoDB Connections | < 80% | < 90% | > 95% |
| Redis Connections | < 70% | < 85% | > 95% |

---

## Alert Thresholds

### Prometheus Alert Rules

Create `alert-rules-load-test.yml`:

```yaml
groups:
  - name: load-test-alerts
    rules:
      # Payment Service Alerts
      - alert: PaymentHighErrorRate
        expr: |
          sum(rate(http_requests_total{service="rez-payment-service",status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total{service="rez-payment-service"}[5m])) > 0.01
        for: 2m
        labels:
          severity: critical
          service: payment
        annotations:
          summary: "Payment service error rate exceeds 1%"
          description: "Error rate is {{ $value | humanizePercentage }} over the last 5 minutes"

      - alert: PaymentHighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket{service="rez-payment-service"}[5m])) by (le)
          ) > 0.5
        for: 5m
        labels:
          severity: warning
          service: payment
        annotations:
          summary: "Payment service p95 latency exceeds 500ms"
          description: "p95 latency is {{ $value | humanizeDuration }}"

      # Wallet Service Alerts
      - alert: WalletConnectionPoolExhaustion
        expr: |
          redis_connected_clients / redis_max_clients > 0.9
        for: 1m
        labels:
          severity: critical
          service: wallet
        annotations:
          summary: "Redis connection pool near exhaustion"
          description: "{{ $value | humanizePercentage }} of connections in use"

      - alert: WalletHighLatency
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket{service="rez-wallet-service"}[5m])) by (le)
          ) > 1
        for: 5m
        labels:
          severity: warning
          service: wallet
        annotations:
          summary: "Wallet service p99 latency exceeds 1s"
          description: "p99 latency is {{ $value | humanizeDuration }}"

      # Order Service Alerts
      - alert: OrderServiceDown
        expr: |
          up{job="rez-order-service"} == 0
        for: 1m
        labels:
          severity: critical
          service: order
        annotations:
          summary: "Order service is down"
          description: "Order service has been unreachable for 1 minute"

      - alert: OrderHighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(http_request_duration_seconds_bucket{service="rez-order-service"}[5m])) by (le)
          ) > 1.5
        for: 5m
        labels:
          severity: warning
          service: order
        annotations:
          summary: "Order service p95 latency exceeds 1.5s"
          description: "p95 latency is {{ $value | humanizeDuration }}"

      # Infrastructure Alerts
      - alert: MongoDBHighConnectionUsage
        expr: |
          mongodb_connection_pool_size / mongodb_max_connections > 0.9
        for: 2m
        labels:
          severity: critical
          component: database
        annotations:
          summary: "MongoDB connection pool near capacity"
          description: "{{ $value | humanizePercentage }} of connections in use"

      - alert: HighMemoryUsage
        expr: |
          process_resident_memory_bytes / system_memory_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Service memory usage exceeds 90%"
          description: "{{ $value | humanizePercentage }} of system memory in use"

      - alert: HighCPUUsage
        expr: |
          rate(process_cpu_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Service CPU usage exceeds 80%"
          description: "CPU usage at {{ $value | humanizePercentage }}"
```

---

## How to Run Tests

### 1. Smoke Tests (Quick Validation)

```bash
# Run all smoke tests
k6 run smoke-tests.js

# Run specific smoke test
k6 run smoke-tests.js --env TEST_TYPE=payment
k6 run smoke-tests.js --env TEST_TYPE=wallet
k6 run smoke-tests.js --env TEST_TYPE=order
```

### 2. Load Tests (Production Simulation)

```bash
# Full load test suite with HTML report
k6 run load-tests.js \
  --out html=reports/load-test-$(date +%Y%m%d-%H%M%S).html

# Run with specific VU count
k6 run load-tests.js \
  --vus 100 \
  --duration 10m \
  --out influxdb=http://localhost:8086

# Distributed load test (multiple instances)
k6 run load-tests.js \
  --out influxdb=http://influxdb:8086 \
  -e K6_CLOUD_TOKEN=$K6_CLOUD_TOKEN
```

### 3. Stress Tests (Breaking Point Discovery)

```bash
# Gradual stress test
k6 run stress-tests.js \
  --stage 1m:10 \
  --stage 2m:25 \
  --stage 2m:50 \
  --stage 2m:100 \
  --stage 2m:200 \
  --stage 1m:0

# Spike test (sudden burst)
k6 run spike-tests.js \
  --stage 30s:10 \
  --stage 30s:200 \
  --stage 1m:200 \
  --stage 30s:10
```

### 4. Soak Tests (Long Duration)

```bash
# 30-minute soak test
k6 run soak-tests.js \
  --duration 30m \
  --out influxdb=http://localhost:8086

# Monitor during soak test
watch -n 5 'curl -s http://localhost:8086/query?db=k6&q=SELECT%20*%20FROM%20http_reqs%20WHERE%20time%20%3E%3D%20now()-1m'
```

### 5. Environment-Specific Tests

```bash
# Staging environment
export PAYMENT_SERVICE_URL=https://staging-api.rez.money
export WALLET_SERVICE_URL=https://staging-api.rez.money
export ORDER_SERVICE_URL=https://staging-api.rez.money
k6 run load-tests.js --env ENV=staging

# Production (use with extreme caution)
export PAYMENT_SERVICE_URL=https://api.rez.money
k6 run load-tests.js \
  --vus 20 \
  --duration 5m \
  --tag test_type=production_health_check
```

### 6. Continuous Load Testing (CI/CD)

```bash
# Run as part of deployment pipeline
./run-load-tests.sh --env production --threshold strict

# Check results
cat reports/latest/results.json | jq '.metrics'
```

---

## k6 Scripts

### Main Test Configuration (`k6-config.js`)

```javascript
// k6-config.js - Shared configuration for all tests
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Environment configuration
export const config = {
  paymentServiceUrl: __ENV.PAYMENT_SERVICE_URL || 'http://localhost:4001',
  walletServiceUrl: __ENV.WALLET_SERVICE_URL || 'http://localhost:4004',
  orderServiceUrl: __ENV.ORDER_SERVICE_URL || 'http://localhost:3006',
  testUserId: __ENV.TEST_USER_ID || 'test-user-123',
  testMerchantId: __ENV.TEST_MERCHANT_ID || 'test-merchant-456',
  jwtToken: __ENV.TEST_JWT_TOKEN || '',
  internalToken: __ENV.TEST_INTERNAL_TOKEN || '',
};

// Default headers
export const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${config.jwtToken}`,
  'X-Internal-Token': config.internalToken,
};

// Custom metrics
export const errorRate = new Rate('errors');
export const paymentLatency = new Trend('payment_latency');
export const walletLatency = new Trend('wallet_latency');
export const orderLatency = new Trend('order_latency');
export const paymentErrors = new Counter('payment_errors');
export const walletErrors = new Counter('wallet_errors');
export const orderErrors = new Counter('order_errors');

// Helper function for authenticated requests
export function authHeaders(extraHeaders = {}) {
  return {
    ...headers,
    ...extraHeaders,
    'Authorization': `Bearer ${config.jwtToken}`,
  };
}

// Helper function for internal service requests
export function internalHeaders(extraHeaders = {}) {
  return {
    'Content-Type': 'application/json',
    'X-Internal-Token': config.internalToken,
    ...extraHeaders,
  };
}

// Standard check helper
export function checkResponse(response, metricPrefix = '') {
  const isSuccess = check(response, {
    [`${metricPrefix} status is 200/201`]: (r) => r.status === 200 || r.status === 201,
    [`${metricPrefix} response has body`]: (r) => r.body && r.body.length > 0,
    [`${metricPrefix} no error in response`]: (r) => {
      try {
        const body = JSON.parse(r.body);
        return !body.error && !body.success === false;
      } catch (e) {
        return true;
      }
    },
  });

  if (!isSuccess) {
    errorRate.add(1);
  }

  return isSuccess;
}

// Random data generators for realistic load
export const testData = {
  orderId: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  paymentId: () => `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId: () => `user-${Math.floor(Math.random() * 100000)}`,
  amount: () => Math.floor(Math.random() * 5000) + 100, // 100-5100 INR
  idempotencyKey: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};

// Test store IDs (pre-create these in test environment)
export const testStores = [
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012',
  '507f1f77bcf86cd799439013',
];
```

### Smoke Tests (`smoke-tests.js`)

```javascript
// smoke-tests.js - Quick validation tests
import { check, sleep } from 'k6';
import { config, headers, authHeaders, internalHeaders, checkResponse, testData } from './k6-config.js';
import http from 'k6/http';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

export default function () {
  const testType = __ENV.TEST_TYPE || 'all';

  if (testType === 'all' || testType === 'payment') {
    testPaymentSmoke();
  }

  if (testType === 'all' || testType === 'wallet') {
    testWalletSmoke();
  }

  if (testType === 'all' || testType === 'order') {
    testOrderSmoke();
  }

  sleep(1);
}

function testPaymentSmoke() {
  console.log('Testing Payment Service...');

  // Test payment initiation
  const initiateRes = http.post(
    `${config.paymentServiceUrl}/pay/initiate`,
    JSON.stringify({
      orderId: testData.orderId(),
      amount: testData.amount(),
      paymentMethod: 'upi',
      purpose: 'order_payment',
      idempotencyKey: testData.idempotencyKey(),
    }),
    { headers: authHeaders() }
  );

  check(initiateRes, {
    'payment initiate: status is 200/201': (r) => r.status === 200 || r.status === 201,
    'payment initiate: has response body': (r) => r.body.length > 0,
  });

  if (initiateRes.status !== 200 && initiateRes.status !== 201) {
    console.error('Payment initiation failed:', initiateRes.body);
    return;
  }

  let paymentData;
  try {
    paymentData = JSON.parse(initiateRes.body);
  } catch (e) {
    console.error('Failed to parse payment response');
    return;
  }

  const paymentId = paymentData?.data?.paymentId;
  if (!paymentId) {
    console.log('Payment initiation returned no paymentId, skipping capture test');
    return;
  }

  // Test payment status check
  const statusRes = http.get(
    `${config.paymentServiceUrl}/pay/status/${paymentId}`,
    { headers: authHeaders() }
  );

  check(statusRes, {
    'payment status: status is 200': (r) => r.status === 200,
  });

  console.log('Payment Service smoke test complete');
}

function testWalletSmoke() {
  console.log('Testing Wallet Service...');

  // Test balance check
  const balanceRes = http.get(
    `${config.walletServiceUrl}/api/wallet/balance`,
    { headers: authHeaders() }
  );

  check(balanceRes, {
    'wallet balance: status is 200': (r) => r.status === 200,
    'wallet balance: has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true && body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  // Test transaction history
  const txRes = http.get(
    `${config.walletServiceUrl}/api/wallet/transactions?page=1&limit=10`,
    { headers: authHeaders() }
  );

  check(txRes, {
    'wallet transactions: status is 200': (r) => r.status === 200,
  });

  console.log('Wallet Service smoke test complete');
}

function testOrderSmoke() {
  console.log('Testing Order Service...');

  const storeId = __ENV.TEST_STORE_ID || '507f1f77bcf86cd799439011';

  // Test order creation
  const orderRes = http.post(
    `${config.orderServiceUrl}/orders`,
    JSON.stringify({
      storeId: storeId,
      items: [
        { product: '507f1f77bcf86cd799439021', quantity: 2, price: 150, name: 'Test Item' },
      ],
      totals: {
        subtotal: 300,
        tax: 27,
        discount: 0,
        deliveryFee: 50,
        total: 377,
      },
      paymentMethod: 'upi',
      delivery: {
        type: 'delivery',
        address: { street: '123 Test St', city: 'Test City', pincode: '123456' },
      },
      idempotencyKey: testData.idempotencyKey(),
    }),
    { headers: authHeaders() }
  );

  check(orderRes, {
    'order create: status is 200/201': (r) => r.status === 200 || r.status === 201,
  });

  if (orderRes.status !== 200 && orderRes.status !== 201) {
    console.error('Order creation failed:', orderRes.body);
    return;
  }

  let orderData;
  try {
    orderData = JSON.parse(orderRes.body);
  } catch (e) {
    console.error('Failed to parse order response');
    return;
  }

  const orderId = orderData?.data?._id;
  if (!orderId) {
    console.log('Order creation returned no order ID');
    return;
  }

  // Test order retrieval
  const getRes = http.get(
    `${config.orderServiceUrl}/orders/${orderId}`,
    { headers: authHeaders() }
  );

  check(getRes, {
    'order get: status is 200': (r) => r.status === 200,
  });

  console.log('Order Service smoke test complete');
}
```

### Load Tests (`load-tests.js`)

```javascript
// load-tests.js - Production load simulation
import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, authHeaders, internalHeaders, checkResponse, testData, testStores } from './k6-config.js';
import { errorRate, paymentLatency, walletLatency, orderLatency } from './k6-config.js';

export const options = {
  // Simulate 5 minutes of traffic
  vus: 50,
  duration: '5m',

  // Ramp up and down
  stages: [
    { duration: '30s', target: 10 },   // Warm up
    { duration: '1m', target: 50 },    // Ramp to 50 VUs
    { duration: '3m', target: 50 },   // Sustained load
    { duration: '30s', target: 0 },    // Ramp down
  ],

  thresholds: {
    // Payment thresholds
    'http_req_duration{payment:true}': ['p(95)<500', 'p(99)<1000'],
    'payment_errors': ['rate<0.01'],

    // Wallet thresholds
    'http_req_duration{wallet:true}': ['p(95)<250', 'p(99)<500'],
    'wallet_errors': ['rate<0.005'],

    // Order thresholds
    'http_req_duration{order:true}': ['p(95)<700', 'p(99)<1500'],
    'order_errors': ['rate<0.02'],

    // Global
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.01'],
  },
};

// Weighted scenario distribution
const scenarios = {
  payment: { weight: 30 },  // 30% of traffic
  wallet: { weight: 50 },   // 50% of traffic
  order: { weight: 20 },    // 20% of traffic
};

export default function () {
  // Route to different test scenarios based on weighted distribution
  const rand = Math.random() * 100;

  if (rand < 30) {
    testPaymentScenario();
  } else if (rand < 80) {
    testWalletScenario();
  } else {
    testOrderScenario();
  }

  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 second think time
}

function testPaymentScenario() {
  const start = Date.now();

  // Payment initiation
  const initiateRes = http.post(
    `${config.paymentServiceUrl}/pay/initiate`,
    JSON.stringify({
      orderId: testData.orderId(),
      amount: testData.amount(),
      paymentMethod: ['upi', 'card', 'wallet'][Math.floor(Math.random() * 3)],
      purpose: 'order_payment',
      idempotencyKey: testData.idempotencyKey(),
    }),
    {
      headers: authHeaders(),
      tags: { payment: true, name: 'payment_initiate' },
    }
  );

  const initiateDuration = Date.now() - start;
  paymentLatency.add(initiateDuration, { endpoint: 'initiate', status: initiateRes.status });

  if (!checkResponse(initiateRes, 'payment_initiate')) {
    console.error('Payment initiation failed:', initiateRes.body);
  }

  // Randomly test status check (20% of cases)
  if (Math.random() < 0.2 && initiateRes.status === 201) {
    const paymentData = JSON.parse(initiateRes.body);
    const paymentId = paymentData?.data?.paymentId;

    if (paymentId) {
      const statusRes = http.get(
        `${config.paymentServiceUrl}/pay/status/${paymentId}`,
        {
          headers: authHeaders(),
          tags: { payment: true, name: 'payment_status' },
        }
      );

      const statusDuration = Date.now() - start;
      paymentLatency.add(statusDuration, { endpoint: 'status', status: statusRes.status });
    }
  }
}

function testWalletScenario() {
  const start = Date.now();
  const operationType = Math.random();

  if (operationType < 0.4) {
    // 40% - Balance check (read-heavy)
    const balanceRes = http.get(
      `${config.walletServiceUrl}/api/wallet/balance`,
      {
        headers: authHeaders(),
        tags: { wallet: true, name: 'wallet_balance' },
      }
    );

    const duration = Date.now() - start;
    walletLatency.add(duration, { endpoint: 'balance', status: balanceRes.status });

    checkResponse(balanceRes, 'wallet_balance');

  } else if (operationType < 0.7) {
    // 30% - Transaction history
    const page = Math.floor(Math.random() * 10) + 1;
    const txRes = http.get(
      `${config.walletServiceUrl}/api/wallet/transactions?page=${page}&limit=20`,
      {
        headers: authHeaders(),
        tags: { wallet: true, name: 'wallet_transactions' },
      }
    );

    const duration = Date.now() - start;
    walletLatency.add(duration, { endpoint: 'transactions', status: txRes.status });

    checkResponse(txRes, 'wallet_transactions');

  } else if (operationType < 0.95) {
    // 25% - Coin debit (write)
    const debitRes = http.post(
      `${config.walletServiceUrl}/api/wallet/coin-debit`,
      JSON.stringify({
        amount: Math.floor(Math.random() * 100) + 10, // 10-110 coins
        coinType: 'rez',
        source: 'load_test',
        description: `Load test debit ${Date.now()}`,
        idempotencyKey: testData.idempotencyKey(),
      }),
      {
        headers: authHeaders(),
        tags: { wallet: true, name: 'wallet_debit' },
      }
    );

    const duration = Date.now() - start;
    walletLatency.add(duration, { endpoint: 'debit', status: debitRes.status });

    // 400 errors are expected for insufficient balance in load tests
    const isExpectedError = debitRes.status === 400;
    if (!checkResponse(debitRes, 'wallet_debit') && !isExpectedError) {
      console.log('Debit failed (may be expected):', debitRes.body);
    }

  } else {
    // 5% - Conversion rate check
    const rateRes = http.get(
      `${config.walletServiceUrl}/api/wallet/conversion-rate`,
      {
        headers: authHeaders(),
        tags: { wallet: true, name: 'wallet_conversion_rate' },
      }
    );

    const duration = Date.now() - start;
    walletLatency.add(duration, { endpoint: 'conversion_rate', status: rateRes.status });

    checkResponse(rateRes, 'wallet_conversion_rate');
  }
}

function testOrderScenario() {
  const start = Date.now();
  const operationType = Math.random();
  const storeId = testStores[Math.floor(Math.random() * testStores.length)];

  if (operationType < 0.5) {
    // 50% - Create order
    const orderRes = http.post(
      `${config.orderServiceUrl}/orders`,
      JSON.stringify({
        storeId: storeId,
        items: [
          {
            product: '507f1f77bcf86cd799439021',
            quantity: Math.floor(Math.random() * 3) + 1,
            price: Math.floor(Math.random() * 200) + 50,
            name: `Load Test Item ${Date.now()}`,
          },
        ],
        totals: {
          subtotal: Math.floor(Math.random() * 500) + 100,
          tax: 18,
          discount: 0,
          deliveryFee: 50,
          total: Math.floor(Math.random() * 600) + 150,
        },
        paymentMethod: 'upi',
        delivery: {
          type: 'delivery',
          address: {
            street: `${Math.floor(Math.random() * 999) + 1} Load Test St`,
            city: 'Test City',
            pincode: '560001',
          },
        },
        idempotencyKey: testData.idempotencyKey(),
      }),
      {
        headers: authHeaders(),
        tags: { order: true, name: 'order_create' },
      }
    );

    const duration = Date.now() - start;
    orderLatency.add(duration, { endpoint: 'create', status: orderRes.status });

    checkResponse(orderRes, 'order_create');

  } else if (operationType < 0.8) {
    // 30% - List orders
    const page = Math.floor(Math.random() * 5) + 1;
    const listRes = http.get(
      `${config.orderServiceUrl}/orders?page=${page}&limit=20`,
      {
        headers: authHeaders(),
        tags: { order: true, name: 'order_list' },
      }
    );

    const duration = Date.now() - start;
    orderLatency.add(duration, { endpoint: 'list', status: listRes.status });

    checkResponse(listRes, 'order_list');

  } else {
    // 20% - Get single order
    const orderRes = http.get(
      `${config.orderServiceUrl}/orders/${testData.orderId()}`,
      {
        headers: authHeaders(),
        tags: { order: true, name: 'order_get' },
      }
    );

    const duration = Date.now() - start;
    orderLatency.add(duration, { endpoint: 'get', status: orderRes.status });

    // 404 is expected for random order IDs
    const isExpectedError = orderRes.status === 404;
    if (!checkResponse(orderRes, 'order_get') && !isExpectedError) {
      console.log('Order get failed (may be expected):', orderRes.body);
    }
  }
}
```

### Stress Tests (`stress-tests.js`)

```javascript
// stress-tests.js - Stress testing to find breaking points
import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, authHeaders, testData, testStores } from './k6-config.js';
import { paymentLatency, walletLatency, orderLatency, errorRate } from './k6-config.js';

export const options = {
  // Gradual increase to find breaking point
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 25 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 0 },
  ],

  thresholds: {
    // Relaxed thresholds for stress testing
    'http_req_duration': ['p(99)<3000'],
    'http_req_failed': ['rate<0.05'],
    'errors': ['rate<0.05'],
  },
};

export default function () {
  // Run all three services in parallel
  const batchRequests = [];

  // Payment request
  batchRequests.push({
    method: 'POST',
    url: `${config.paymentServiceUrl}/pay/initiate`,
    body: JSON.stringify({
      orderId: testData.orderId(),
      amount: testData.amount(),
      paymentMethod: 'upi',
      purpose: 'order_payment',
      idempotencyKey: testData.idempotencyKey(),
    }),
    params: { headers: authHeaders(), tags: { name: 'stress_payment' } },
  });

  // Wallet request
  batchRequests.push({
    method: 'GET',
    url: `${config.walletServiceUrl}/api/wallet/balance`,
    params: { headers: authHeaders(), tags: { name: 'stress_wallet' } },
  });

  // Order request
  const storeId = testStores[Math.floor(Math.random() * testStores.length)];
  batchRequests.push({
    method: 'POST',
    url: `${config.orderServiceUrl}/orders`,
    body: JSON.stringify({
      storeId: storeId,
      items: [
        { product: '507f1f77bcf86cd799439021', quantity: 1, price: 100, name: 'Stress Test' },
      ],
      totals: { subtotal: 100, tax: 18, discount: 0, deliveryFee: 50, total: 168 },
      paymentMethod: 'upi',
      idempotencyKey: testData.idempotencyKey(),
    }),
    params: { headers: authHeaders(), tags: { name: 'stress_order' } },
  });

  // Execute batch requests
  const responses = http.batch(batchRequests);

  // Track individual responses
  responses.forEach((res, index) => {
    const tags = { status: res.status, name: batchRequests[index].params?.tags?.name || 'unknown' };

    if (batchRequests[index].params?.tags?.name === 'stress_payment') {
      paymentLatency.add(res.timings.duration, tags);
    } else if (batchRequests[index].params?.tags?.name === 'stress_wallet') {
      walletLatency.add(res.timings.duration, tags);
    } else if (batchRequests[index].params?.tags?.name === 'stress_order') {
      orderLatency.add(res.timings.duration, tags);
    }

    // Track errors
    if (res.status >= 400) {
      errorRate.add(1, tags);
      console.log(`Error in ${tags.name}: ${res.status} - ${res.body}`);
    }
  });

  sleep(0.5);
}
```

### Spike Tests (`spike-tests.js`)

```javascript
// spike-tests.js - Sudden traffic spike tests
import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, authHeaders, testData, testStores } from './k6-config.js';

export const options = {
  // Sudden spike pattern
  stages: [
    { duration: '30s', target: 10 },   // Baseline
    { duration: '30s', target: 200 },  // SPIKE UP
    { duration: '1m', target: 200 },    // Hold spike
    { duration: '30s', target: 10 },    // SPIKE DOWN
  ],

  thresholds: {
    // Allow higher errors during spike recovery
    'http_req_failed': ['rate<0.1'],
    'errors': ['rate<0.1'],
  },
};

export default function () {
  const service = Math.floor(Math.random() * 3);

  if (service === 0) {
    // Payment spike
    const res = http.post(
      `${config.paymentServiceUrl}/pay/initiate`,
      JSON.stringify({
        orderId: testData.orderId(),
        amount: testData.amount(),
        paymentMethod: 'upi',
        purpose: 'order_payment',
        idempotencyKey: testData.idempotencyKey(),
      }),
      { headers: authHeaders() }
    );

    check(res, {
      'payment spike: response received': () => res.status > 0,
    });

  } else if (service === 1) {
    // Wallet spike
    const res = http.get(
      `${config.walletServiceUrl}/api/wallet/balance`,
      { headers: authHeaders() }
    );

    check(res, {
      'wallet spike: response received': () => res.status > 0,
    });

  } else {
    // Order spike
    const storeId = testStores[Math.floor(Math.random() * testStores.length)];
    const res = http.post(
      `${config.orderServiceUrl}/orders`,
      JSON.stringify({
        storeId: storeId,
        items: [
          { product: '507f1f77bcf86cd799439021', quantity: 1, price: 100 },
        ],
        totals: { subtotal: 100, tax: 18, discount: 0, deliveryFee: 50, total: 168 },
        paymentMethod: 'upi',
        idempotencyKey: testData.idempotencyKey(),
      }),
      { headers: authHeaders() }
    );

    check(res, {
      'order spike: response received': () => res.status > 0,
    });
  }

  sleep(0.1); // Minimal think time during spike
}
```

### Soak Tests (`soak-tests.js`)

```javascript
// soak-tests.js - Long duration sustained load test
import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, authHeaders, testData, testStores } from './k6-config.js';
import { paymentLatency, walletLatency, orderLatency } from './k6-config.js';

export const options = {
  vus: 30,
  duration: '30m',

  // Thresholds tuned for soak testing
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1500'],
    'http_req_failed': ['rate<0.005'],
    // Memory leak detection
    'mem_heap_used{scenario:"soak"}': ['max<536870912'], // < 512MB
  },
};

export default function () {
  // Mix of operations
  const operation = Math.random();

  if (operation < 0.25) {
    // Payment
    const start = Date.now();
    const res = http.post(
      `${config.paymentServiceUrl}/pay/initiate`,
      JSON.stringify({
        orderId: testData.orderId(),
        amount: testData.amount(),
        paymentMethod: 'upi',
        purpose: 'order_payment',
        idempotencyKey: testData.idempotencyKey(),
      }),
      { headers: authHeaders(), tags: { name: 'soak_payment' } }
    );
    paymentLatency.add(Date.now() - start, { status: res.status });
    check(res, { 'payment: status ok': (r) => r.status < 500 });

  } else if (operation < 0.60) {
    // Wallet balance
    const start = Date.now();
    const res = http.get(
      `${config.walletServiceUrl}/api/wallet/balance`,
      { headers: authHeaders(), tags: { name: 'soak_wallet' } }
    );
    walletLatency.add(Date.now() - start, { status: res.status });
    check(res, { 'wallet: status ok': (r) => r.status < 500 });

  } else if (operation < 0.80) {
    // Order list
    const start = Date.now();
    const res = http.get(
      `${config.orderServiceUrl}/orders?page=1&limit=20`,
      { headers: authHeaders(), tags: { name: 'soak_order_list' } }
    );
    orderLatency.add(Date.now() - start, { status: res.status });
    check(res, { 'order list: status ok': (r) => r.status < 500 });

  } else {
    // Create order
    const start = Date.now();
    const storeId = testStores[Math.floor(Math.random() * testStores.length)];
    const res = http.post(
      `${config.orderServiceUrl}/orders`,
      JSON.stringify({
        storeId: storeId,
        items: [
          { product: '507f1f77bcf86cd799439021', quantity: 1, price: 100 },
        ],
        totals: { subtotal: 100, tax: 18, discount: 0, deliveryFee: 50, total: 168 },
        paymentMethod: 'upi',
        idempotencyKey: testData.idempotencyKey(),
      }),
      { headers: authHeaders(), tags: { name: 'soak_order_create' } }
    );
    orderLatency.add(Date.now() - start, { status: res.status });
    check(res, { 'order create: status ok': (r) => r.status < 500 });
  }

  // Random think time between 1-5 seconds
  sleep(Math.random() * 4 + 1);
}
```

### Run Script (`run-load-tests.sh`)

```bash
#!/bin/bash
# run-load-tests.sh - Orchestrate load test execution

set -e

ENV=${1:-staging}
THRESHOLD=${2:-normal}
REPORT_DIR="./reports/load-tests/$(date +%Y%m%d-%H%M%S)"

mkdir -p "$REPORT_DIR"

echo "=========================================="
echo "ReZ Platform Load Testing"
echo "=========================================="
echo "Environment: $ENV"
echo "Threshold Mode: $THRESHOLD"
echo "Report Directory: $REPORT_DIR"
echo "=========================================="

# Load environment-specific configuration
case $ENV in
  staging)
    export PAYMENT_SERVICE_URL="https://staging-api.rez.money"
    export WALLET_SERVICE_URL="https://staging-api.rez.money"
    export ORDER_SERVICE_URL="https://staging-api.rez.money"
    ;;
  production)
    export PAYMENT_SERVICE_URL="https://api.rez.money"
    export WALLET_SERVICE_URL="https://api.rez.money"
    export ORDER_SERVICE_URL="https://api.rez.money"
    echo "WARNING: Running load tests against PRODUCTION!"
    read -p "Press Enter to continue..."
    ;;
  local)
    export PAYMENT_SERVICE_URL="http://localhost:4001"
    export WALLET_SERVICE_URL="http://localhost:4004"
    export ORDER_SERVICE_URL="http://localhost:3006"
    ;;
esac

# Run smoke tests first
echo ""
echo ">>> Running Smoke Tests..."
k6 run smoke-tests.js \
  --env TEST_TYPE=all \
  --out json="$REPORT_DIR/smoke-results.json"

if [ $? -ne 0 ]; then
  echo "SMOKE TESTS FAILED"
  exit 1
fi

echo "Smoke tests passed"

# Run load tests
echo ""
echo ">>> Running Load Tests..."
k6 run load-tests.js \
  --out html="$REPORT_DIR/load-test.html" \
  --out json="$REPORT_DIR/load-test.json" \
  --out influxdb=http://localhost:8086

if [ $? -ne 0 ]; then
  echo "LOAD TESTS FAILED"
  exit 1
fi

# Run stress tests
echo ""
echo ">>> Running Stress Tests..."
k6 run stress-tests.js \
  --out html="$REPORT_DIR/stress-test.html" \
  --out json="$REPORT_DIR/stress-test.json"

echo ""
echo "=========================================="
echo "Load Testing Complete"
echo "=========================================="
echo "Reports saved to: $REPORT_DIR"
echo ""

# Generate summary
if command -v jq &> /dev/null; then
  echo "Quick Summary:"
  echo "-------------"
  cat "$REPORT_DIR/load-test.json" | jq -r '
    .metrics | to_entries[] |
    select(.key | contains("http_req")) |
    "\(.key): p95=\(.value.values["p(95)"])\tp99=\(.value.values["p(99)"])"
  '
fi

echo ""
echo "View detailed reports:"
echo "  cat $REPORT_DIR/load-test.json | jq ."
echo "  open $REPORT_DIR/load-test.html"
```

---

## Metrics Collection

### Grafana Dashboard Queries

**Payment Service Dashboard:**

```promql
# Request Rate
sum(rate(http_requests_total{service="rez-payment-service"}[5m]))

# Error Rate
sum(rate(http_requests_total{service="rez-payment-service",status=~"5.."}[5m]))
/
sum(rate(http_requests_total{service="rez-payment-service"}[5m]))

# Latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service="rez-payment-service"}[5m])) by (le))

# Payment Volume
sum(increase(payments_total[1h]))
```

**Wallet Service Dashboard:**

```promql
# Transaction Rate
sum(rate(wallet_transactions_total[5m]))

# Balance Operations
sum(rate(wallet_balance_operations_total[5m]))

# Concurrent Debits
sum(wallet_concurrent_debits)

# Memory Usage
process_resident_memory_bytes{service="rez-wallet-service"}
```

**Order Service Dashboard:**

```promql
# Order Creation Rate
sum(rate(orders_created_total[5m]))

# Order Value
sum(rate(orders_total_value[5m]))

# Status Distribution
sum by (status) (rate(orders_total[5m]))

# Queue Depth
order_queue_depth
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | Service not running | Start the service or check URL |
| `401 Unauthorized` | Invalid/expired token | Refresh test JWT token |
| `429 Rate Limited` | Too many requests | Reduce VU count or add delays |
| `503 Service Unavailable` | Backend issues | Check service health endpoints |
| Timeout errors | Slow response | Check database indices, connection pools |

### Debug Mode

```bash
# Verbose output
k6 run load-tests.js --log-output=stdout --verbose

# Single VU debug
k6 run smoke-tests.js --vus 1 --duration 10s --http-debug="full"

# Check configuration
k6 inspect load-tests.js
```

---

## CI/CD Integration

Add to your GitHub Actions workflow (`.github/workflows/load-test.yml`):

```yaml
name: Load Testing

on:
  schedule:
    # Run load tests daily at 2 AM
    - cron: '0 2 * * *'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'staging'

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update && sudo apt-get install k6

      - name: Run Load Tests
        env:
          PAYMENT_SERVICE_URL: ${{ secrets.TEST_PAYMENT_URL }}
          WALLET_SERVICE_URL: ${{ secrets.TEST_WALLET_URL }}
          ORDER_SERVICE_URL: ${{ secrets.TEST_ORDER_URL }}
          TEST_JWT_TOKEN: ${{ secrets.TEST_JWT_TOKEN }}
          TEST_INTERNAL_TOKEN: ${{ secrets.TEST_INTERNAL_TOKEN }}
        run: |
          ./run-load-tests.sh ${{ github.event.inputs.environment || 'staging' }}

      - name: Upload Reports
        uses: actions/upload-artifact@v4
        with:
          name: load-test-reports
          path: reports/**/*.html
          retention-days: 30
```

---

## Security Notes

1. **Never run load tests against production** without explicit approval
2. **Use dedicated test accounts** - never use real user data
3. **Set rate limits** - protect services during testing
4. **Monitor costs** - external services may charge per request
5. **Rotate tokens** - use short-lived test credentials

---

## Contact

For questions or issues with load testing:
- DevOps Team: devops@rez.money
- Platform Team: platform@rez.money
- Slack: #platform-performance
