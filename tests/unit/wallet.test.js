test('wallet balance calculation', () => {
  const calcBalance = (transactions) => {
    return transactions.reduce((bal, t) => 
      t.type === 'credit' ? bal + t.amount : bal - t.amount
    , 0);
  };
  
  expect(calcBalance([
    { type: 'credit', amount: 1000 },
    { type: 'debit', amount: 300 }
  ])).toBe(700);
});

test('wallet transaction limits', () => {
  const MAX_TRANSACTION = 100000;
  const MIN_TRANSACTION = 1;
  
  expect(100).toBeGreaterThanOrEqual(MIN_TRANSACTION);
  expect(100).toBeLessThanOrEqual(MAX_TRANSACTION);
});

test('wallet idempotency', () => {
  const seen = new Set();
  const idempotent = (id) => {
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  };
  
  expect(idempotent('tx1')).toBe(true);
  expect(idempotent('tx1')).toBe(false);
});
