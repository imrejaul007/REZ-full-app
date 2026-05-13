// Analytics unit test
const calcRevenue = (orders) => 
  orders.filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);
test('revenue calculation', () => {
  const orders = [
    { status: 'completed', amount: 100 },
    { status: 'pending', amount: 200 },
    { status: 'completed', amount: 300 }
  ];
  expect(calcRevenue(orders)).toBe(400);
});

const calcConversion = (views, clicks) => clicks / views * 100;
test('conversion rate', () => {
  expect(calcConversion(100, 25)).toBe(25);
});

const segmentUsers = (users) => {
  return users.reduce((acc, u) => {
    acc[u.tier] = acc[u.tier] || [];
    acc[u.tier].push(u);
    return acc;
  }, {});
};
test('user segmentation', () => {
  const users = [
    { id: '1', tier: 'gold' },
    { id: '2', tier: 'silver' }
  ];
  const seg = segmentUsers(users);
  expect(seg.gold).toHaveLength(1);
  expect(seg.silver).toHaveLength(1);
});
