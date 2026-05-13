// Webhook unit test
const verifySignature = (payload, signature, secret) => {
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  return expected === signature;
};
test('webhook signature', () => {
  const payload = { event: 'payment.completed' };
  expect(verifySignature(payload, 'abc123', 'secret')).toBe(false);
});

const parseWebhook = (body) => {
  try { return JSON.parse(body); }
  catch { return null; }
};
test('webhook parsing', () => {
  expect(parseWebhook('{"test": true})).toEqual({ test: true });
  expect(parseWebhook('invalid')).toBe(null);
});
