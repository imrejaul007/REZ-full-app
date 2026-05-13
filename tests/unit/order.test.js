test('order status machine', () => {
  const VALID_TRANSITIONS = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: []
  };
  
  const canTransition = (from, to) => 
    VALID_TRANSITIONS[from]?.includes(to) ?? false;
  
  expect(canTransition('pending', 'confirmed')).toBe(true);
  expect(canTransition('delivered', 'pending')).toBe(false);
  expect(canTransition('delivered', 'refunded')).toBe(true);
});

test('order total calculation', () => {
  const calcTotal = (items) => 
    items.reduce((sum, i) => sum + i.price * i.qty, 0);
  
  expect(calcTotal([
    { price: 100, qty: 2 },
    { price: 50, qty: 1 }
  ])).toBe(250);
});
