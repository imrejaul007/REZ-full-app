// Loyalty unit test
const calcPoints = (amount) => Math.floor(amount / 100) * 10;
test('points calculation', () => {
  expect(calcPoints(500)).toBe(50);
  expect(calcPoints(1000)).toBe(100);
});

const getTier = (points) => {
  if (points >= 1000) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
};
test('tier calculation', () => {
  expect(getTier(1200)).toBe('gold');
  expect(getTier(600)).toBe('silver');
  expect(getTier(100)).toBe('bronze');
});
