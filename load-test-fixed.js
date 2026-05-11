// k6 Load Test - FIXED
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 100 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // Health check only (no auth required)
  const res = http.get('https://rez-api-gateway.onrender.com/health');
  check(res, { 'gateway': (r) => r.status === 200 });
  sleep(1);
}
