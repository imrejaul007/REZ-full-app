/**
 * Order Test Fixtures
 *
 * Provides test data generators for orders:
 * - Orders with varying amounts
 * - Orders from different sources
 * - Orders in different states
 *
 * Usage:
 *   import { createTestOrder, createOrderWithItems } from './orderFixtures';
 */

import mongoose from 'mongoose';

// ============================================================================
// Types
// ============================================================================

export interface TestOrder {
  orderId: string;
  userId: string;
  merchantId: string;
  items: TestOrderItem[];
  totals: TestOrderTotals;
  status: 'pending' | 'payment_initiated' | 'payment_completed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'refunded';
  source: 'menu_qr' | 'room_service' | 'delivery' | 'walkin';
  createdAt: Date;
  paymentCompletedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface TestOrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: TestOrderModifier[];
}

export interface TestOrderModifier {
  name: string;
  price: number;
}

export interface TestOrderTotals {
  subtotal: number;
  tax: number;
  discount: number;
  deliveryFee: number;
  packagingFee: number;
  total: number;
}

export interface TestPayment {
  paymentId: string;
  orderId: string;
  amount: number;
  method: 'card' | 'upi' | 'wallet' | 'cash';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ============================================================================
// Menu Items
// ============================================================================

export const MENU_ITEMS = {
  // Indian Main Courses
  paneer_tikka: { id: 'paneer_tikka', name: 'Paneer Tikka', price: 250, category: 'main_course' },
  butter_chicken: { id: 'butter_chicken', name: 'Butter Chicken', price: 320, category: 'main_course' },
  dal_makhani: { id: 'dal_makhani', name: 'Dal Makhani', price: 220, category: 'main_course' },
  biryani_veg: { id: 'biryani_veg', name: 'Veg Biryani', price: 280, category: 'main_course' },
  biryani_nonveg: { id: 'biryani_nonveg', name: 'Chicken Biryani', price: 350, category: 'main_course' },

  // Bread
  butter_naan: { id: 'butter_naan', name: 'Butter Naan', price: 60, category: 'bread' },
  garlic_naan: { id: 'garlic_naan', name: 'Garlic Naan', price: 70, category: 'bread' },
  tandoori_roti: { id: 'tandoori_roti', name: 'Tandoori Roti', price: 40, category: 'bread' },
  laccha_paratha: { id: 'laccha_paratha', name: 'Laccha Paratha', price: 80, category: 'bread' },

  // Beverages
  lassi_mango: { id: 'lassi_mango', name: 'Mango Lassi', price: 120, category: 'beverage' },
  masala_chai: { id: 'masala_chai', name: 'Masala Chai', price: 50, category: 'beverage' },
  cold_coffee: { id: 'cold_coffee', name: 'Cold Coffee', price: 150, category: 'beverage' },
  fresh_juice: { id: 'fresh_juice', name: 'Fresh Juice', price: 100, category: 'beverage' },

  // Desserts
  gulab_jamun: { id: 'gulab_jamun', name: 'Gulab Jamun', price: 80, category: 'dessert' },
  ice_cream: { id: 'ice_cream', name: 'Ice Cream', price: 120, category: 'dessert' },
  rasmalai: { id: 'rasmalai', name: 'Rasmalai', price: 150, category: 'dessert' },
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${new mongoose.Types.ObjectId().toString().slice(0, 12)}`;
}

function generateOrderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function calculateTotals(items: TestOrderItem[], taxRate = 0.18): TestOrderTotals {
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const modifiersTotal = (item.modifiers || []).reduce((m, mod) => m + mod.price * item.quantity, 0);
    return sum + itemTotal + modifiersTotal;
  }, 0);

  const tax = Math.round(subtotal * taxRate);
  const discount = 0;
  const deliveryFee = 0;
  const packagingFee = Math.round(subtotal * 0.02); // 2% packaging

  return {
    subtotal,
    tax,
    discount,
    deliveryFee,
    packagingFee,
    total: subtotal + tax + discount + deliveryFee + packagingFee,
  };
}

// ============================================================================
// Order Fixtures
// ============================================================================

export function createTestOrder(overrides?: Partial<TestOrder>): TestOrder {
  const orderId = generateOrderId();

  return {
    orderId,
    userId: generateId('user'),
    merchantId: generateId('merchant'),
    items: [],
    totals: { subtotal: 0, tax: 0, discount: 0, deliveryFee: 0, packagingFee: 0, total: 0 },
    status: 'pending',
    source: 'menu_qr',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createOrderWithItems(
  itemIds: string[],
  quantities: number[],
  overrides?: Partial<TestOrder>
): TestOrder {
  const items: TestOrderItem[] = itemIds.map((id, index) => {
    const menuItem = MENU_ITEMS[id as keyof typeof MENU_ITEMS];
    if (!menuItem) {
      return {
        itemId: id,
        name: `Item ${id}`,
        price: 100,
        quantity: quantities[index] || 1,
      };
    }
    return {
      itemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: quantities[index] || 1,
    };
  });

  const totals = calculateTotals(items);

  return createTestOrder({
    items,
    totals,
    ...overrides,
  });
}

export function createSmallOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createOrderWithItems(['butter_naan', 'masala_chai'], [2, 1], {
    ...overrides,
  });
}

export function createMediumOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createOrderWithItems(
    ['paneer_tikka', 'butter_naan', 'garlic_naan', 'dal_makhani', 'lassi_mango'],
    [1, 2, 1, 1, 2],
    {
      ...overrides,
    }
  );
}

export function createLargeOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createOrderWithItems(
    [
      'biryani_nonveg',
      'butter_chicken',
      'paneer_tikka',
      'butter_naan',
      'garlic_naan',
      'laccha_paratha',
      'dal_makhani',
      'gulab_jamun',
      'lassi_mango',
      'cold_coffee',
    ],
    [2, 2, 2, 4, 2, 2, 1, 2, 2, 2],
    {
      ...overrides,
    }
  );
}

export function createCustomOrder(
  amount: number,
  overrides?: Partial<TestOrder>
): TestOrder {
  // Create an order with items that sum to approximately the target amount
  const items: TestOrderItem[] = [];
  let remaining = amount;

  const itemList = Object.values(MENU_ITEMS);

  while (remaining > 50) {
    const item = itemList[Math.floor(Math.random() * itemList.length)];
    const quantity = Math.min(Math.floor(remaining / item.price), 5);
    if (quantity >= 1) {
      items.push({
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
      });
      remaining -= item.price * quantity;
    }
  }

  // Add a cheap item if needed to reach target
  if (remaining > 0) {
    const cheapItem = itemList.find(i => i.price <= remaining);
    if (cheapItem) {
      items.push({
        itemId: cheapItem.id,
        name: cheapItem.name,
        price: cheapItem.price,
        quantity: 1,
      });
    }
  }

  const totals = calculateTotals(items);

  return createTestOrder({
    items,
    totals,
    ...overrides,
  });
}

// ============================================================================
// Order State Fixtures
// ============================================================================

export function createPendingOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createMediumOrder({
    status: 'pending',
    ...overrides,
  });
}

export function createPaymentInitiatedOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createMediumOrder({
    status: 'payment_initiated',
    ...overrides,
  });
}

export function createPaymentCompletedOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createMediumOrder({
    status: 'payment_completed',
    paymentCompletedAt: new Date(),
    ...overrides,
  });
}

export function createPreparingOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createMediumOrder({
    status: 'preparing',
    paymentCompletedAt: new Date(),
    ...overrides,
  });
}

export function createReadyOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createMediumOrder({
    status: 'ready',
    paymentCompletedAt: new Date(),
    ...overrides,
  });
}

export function createCompletedOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createMediumOrder({
    status: 'completed',
    paymentCompletedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    completedAt: new Date(),
    ...overrides,
  });
}

export function createCancelledOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createMediumOrder({
    status: 'cancelled',
    paymentCompletedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
    cancelledAt: new Date(),
    cancellationReason: 'Customer cancelled',
    ...overrides,
  });
}

// ============================================================================
// Source-Based Fixtures
// ============================================================================

export function createMenuQROrder(overrides?: Partial<TestOrder>): TestOrder {
  return createMediumOrder({
    source: 'menu_qr',
    ...overrides,
  });
}

export function createRoomServiceOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createLargeOrder({
    source: 'room_service',
    ...overrides,
  });
}

export function createDeliveryOrder(overrides?: Partial<TestOrder>): TestOrder {
  const order = createMediumOrder({
    source: 'delivery',
    ...overrides,
  });
  order.totals.deliveryFee = 50;
  order.totals.total = order.totals.subtotal + order.totals.tax + order.totals.deliveryFee;
  return order;
}

export function createWalkinOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createMediumOrder({
    source: 'walkin',
    ...overrides,
  });
}

// ============================================================================
// Payment Fixtures
// ============================================================================

export function createTestPayment(orderId: string, amount: number, overrides?: Partial<TestPayment>): TestPayment {
  return {
    paymentId: generateId('pay'),
    orderId,
    amount,
    method: 'card',
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createSuccessfulPayment(orderId: string, amount: number): TestPayment {
  return createTestPayment(orderId, amount, {
    status: 'completed',
    transactionId: `txn_${Date.now()}`,
    completedAt: new Date(),
  });
}

export function createFailedPayment(orderId: string, amount: number): TestPayment {
  return createTestPayment(orderId, amount, {
    status: 'failed',
  });
}

// ============================================================================
// Batch Generators
// ============================================================================

export function createOrders(count: number, status?: TestOrder['status']): TestOrder[] {
  const orders: TestOrder[] = [];

  for (let i = 0; i < count; i++) {
    const sizes = ['small', 'medium', 'large'];
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    let order: TestOrder;
    switch (size) {
      case 'small':
        order = createSmallOrder({ status });
        break;
      case 'large':
        order = createLargeOrder({ status });
        break;
      default:
        order = createMediumOrder({ status });
    }

    orders.push(order);
  }

  return orders;
}

export function createOrderHistory(userId: string, count: number): TestOrder[] {
  const orders: TestOrder[] = [];

  for (let i = 0; i < count; i++) {
    const order = createMediumOrder({
      userId,
      status: 'completed',
      completedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // 1 day apart
    });
    orders.push(order);
  }

  return orders;
}

export function createOrderJourney(orderId: string): TestOrder[] {
  const amount = 590; // Medium order total

  return [
    createTestOrder({
      orderId,
      status: 'pending',
      createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    }),
    createTestPayment(orderId, amount, { status: 'pending' }) as unknown as TestOrder,
    createTestPayment(orderId, amount, {
      status: 'completed',
      transactionId: `txn_${Date.now()}`,
      completedAt: new Date(Date.now() - 55 * 60 * 1000),
    }) as unknown as TestOrder,
    createMediumOrder({
      orderId,
      status: 'payment_completed',
      paymentCompletedAt: new Date(Date.now() - 55 * 60 * 1000),
    }),
    createMediumOrder({
      orderId,
      status: 'preparing',
      paymentCompletedAt: new Date(Date.now() - 50 * 60 * 1000),
    }),
    createMediumOrder({
      orderId,
      status: 'ready',
      paymentCompletedAt: new Date(Date.now() - 45 * 60 * 1000),
    }),
    createMediumOrder({
      orderId,
      status: 'completed',
      paymentCompletedAt: new Date(Date.now() - 40 * 60 * 1000),
      completedAt: new Date(),
    }),
  ];
}

// ============================================================================
// Edge Case Fixtures
// ============================================================================

export function createSingleItemOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createOrderWithItems(['butter_naan'], [1], overrides);
}

export function createHighValueOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createCustomOrder(10000, overrides);
}

export function createLowValueOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createOrderWithItems(['tandoori_roti'], [1], overrides);
}

export function createOrderWithDiscount(discountPercent: number, overrides?: Partial<TestOrder>): TestOrder {
  const order = createMediumOrder(overrides);
  order.totals.discount = Math.round(order.totals.subtotal * (discountPercent / 100));
  order.totals.total = order.totals.subtotal + order.totals.tax + order.totals.deliveryFee + order.totals.packagingFee - order.totals.discount;
  return order;
}
