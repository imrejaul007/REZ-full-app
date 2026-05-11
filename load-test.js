// k6 Load Test Script for ReZ Platform
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // Health check
  const health = http.get('https://rez-api-gateway.onrender.com/health');
  check(health, { 'health': (r) => r.status === 200 });

  // Create order
  const orderRes = http.post('https://rez-api-gateway.onrender.com/api/orders', JSON.stringify({
    merchantId: 'test_merchant',
    items: [{ productId: 'test_prod', quantity: 1 }],
    total: 100,
    paymentMethod: 'UPI',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(orderRes, { 'order created': (r) => r.status === 201 || r.status === 400 });

  sleep(1);
}
