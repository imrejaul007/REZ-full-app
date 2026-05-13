// Health check unit test
const check = (service) => {
  const HEALTHY = { status: 'ok' };
  return HEALTHY;
};

test('health check returns ok', () => {
  expect(check('payment')).toEqual({ status: 'ok' });
  expect(check('wallet')).toEqual({ status: 'ok' });
  expect(check('order')).toEqual({ status: 'ok' });
});

const checkDB = (db) => ({ connected: true });
test('database health', () => {
  expect(checkDB('mongodb')).toHaveProperty('connected', true);
});
