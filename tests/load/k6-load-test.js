// k6 load test script
// Run: k6 run tests/load/k6-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01']
  }
};

export default function() {
  const res = http.get('https://api.rez.money/health');
  check(res, {
    'status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
  
  // Payment endpoint
  const payment = http.post('https://api.rez.money/api/payments', 
    JSON.stringify({ amount: 100 }),
    { headers: { 'Content-Type': 'application/json' }
  );
  check(payment, { 'payment created': (r) => r.status === 201 });
}
