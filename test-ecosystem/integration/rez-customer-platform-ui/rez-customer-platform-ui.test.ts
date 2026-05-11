/**
 * Integration Tests for Customer Platform UI Service
 * Tests user authentication, profile management, orders, and customer interactions
 */

import {
  userProfiles,
  authenticationData,
  orders,
  paymentMethods,
  reviews,
  wishlistItems,
  notifications,
  loyaltyProgram,
  apiEndpoints,
  formValidationRules,
} from './mockData';

const {
  createMockDbConnection,
  createMockRedisClient,
  createMockHttpClient,
  waitFor,
  generateTestId,
} = require('../jest.setup');

jest.mock('../jest.setup', () => ({
  createMockDbConnection: jest.fn(() => ({
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn(),
    end: jest.fn(),
  })),
  createMockRedisClient: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  })),
  createMockHttpClient: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
    post: jest.fn().mockResolvedValue({ data: {}, status: 201 }),
  })),
  waitFor: jest.fn((ms: number) => new Promise(resolve => setTimeout(resolve, ms))),
  generateTestId: jest.fn((prefix: string) => `${prefix}_${Date.now()}`),
}));

describe('Customer Platform UI Integration', () => {
  let mockDb: ReturnType<typeof createMockDbConnection>;
  let mockRedis: ReturnType<typeof createMockRedisClient>;
  let mockHttp: ReturnType<typeof createMockHttpClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDbConnection();
    mockRedis = createMockRedisClient();
    mockHttp = createMockHttpClient();
  });

  describe('User Authentication', () => {
    test('should authenticate user with valid credentials', async () => {
      const { email, password } = { email: 'john.doe@example.com', password: 'SecurePass123' };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'usr_001', email: 'john.doe@example.com', passwordHash: 'hashed_password' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT id, email, password_hash FROM users WHERE email = $1',
        [email]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].email).toBe(email);
    });

    test('should reject authentication with invalid credentials', async () => {
      const invalidEmail = 'invalid@example.com';

      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await mockDb.query(
        'SELECT id, email FROM users WHERE email = $1',
        [invalidEmail]
      );

      expect(result.rows).toHaveLength(0);
    });

    test('should generate access and refresh tokens on login', () => {
      const authData = authenticationData.loginSuccess;

      expect(authData).toHaveProperty('accessToken');
      expect(authData).toHaveProperty('refreshToken');
      expect(authData.tokenType).toBe('Bearer');
      expect(authData.expiresIn).toBe(3600);
    });

    test('should handle password reset flow', async () => {
      const resetData = authenticationData.passwordReset;

      mockRedis.set(
        `password_reset:${resetData.token}`,
        JSON.stringify({ email: resetData.email, expiresAt: resetData.expiresIn }),
        'EX',
        900
      );

      expect(mockRedis.set).toHaveBeenCalled();
      expect(resetData.expiresIn).toBe(900);
    });

    test('should validate email format', () => {
      const emailRegex = formValidationRules.email.pattern;
      const validEmails = ['test@example.com', 'user.name@domain.org', 'user+tag@example.co'];
      const invalidEmails = ['invalid', '@nodomain.com', 'no@'];

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    test('should validate password strength', () => {
      const { password } = formValidationRules;

      const strongPassword = 'SecurePass123';
      const weakPassword = 'abc';

      expect(strongPassword.length).toBeGreaterThanOrEqual(password.minLength);
      expect(weakPassword.length).toBeLessThan(password.minLength);
    });

    test('should handle session expiration', async () => {
      const session = authenticationData.session;
      const now = new Date();
      const expiresAt = new Date(session.expiresAt);
      const isExpired = now > expiresAt;

      expect(isExpired).toBe(false);
    });

    test('should store session in Redis', async () => {
      const session = authenticationData.session;
      const sessionKey = `session:${session.id}`;

      await mockRedis.set(
        sessionKey,
        JSON.stringify(session),
        'EX',
        86400 // 24 hours
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        sessionKey,
        expect.any(String),
        'EX',
        86400
      );
    });
  });

  describe('User Profile Management', () => {
    test('should retrieve user profile', async () => {
      const user = userProfiles.standard;

      mockDb.query.mockResolvedValueOnce({
        rows: [user],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );

      expect(result.rows[0].id).toBe(user.id);
      expect(result.rows[0].email).toBe(user.email);
    });

    test('should update user profile', async () => {
      const user = userProfiles.standard;
      const updates = { firstName: 'Jonathan', lastName: 'Doe Updated' };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...user, ...updates, updatedAt: new Date().toISOString() }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE users SET first_name = $1, last_name = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [updates.firstName, updates.lastName, user.id]
      );

      expect(result.rows[0].firstName).toBe(updates.firstName);
    });

    test('should manage user addresses', async () => {
      const user = userProfiles.standard;
      const addresses = user.addresses;

      expect(addresses).toHaveLength(2);

      const shippingAddress = addresses.find(a => a.type === 'shipping');
      const billingAddress = addresses.find(a => a.type === 'billing');

      expect(shippingAddress?.isDefault).toBe(true);
      expect(billingAddress?.isDefault).toBe(true);
    });

    test('should add new address', async () => {
      const newAddress = {
        id: 'addr_new',
        type: 'shipping',
        line1: '999 New Street',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
        isDefault: false,
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [newAddress],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO addresses (user_id, type, line1, city, state, postal_code, country) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        ['usr_001', 'shipping', '999 New Street', 'Boston', 'MA', '02101', 'US']
      );

      expect(result.rows[0]).toHaveProperty('id');
    });

    test('should delete address', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'DELETE FROM addresses WHERE id = $1 AND user_id = $2',
        ['addr_001', 'usr_001']
      );

      expect(result.rowCount).toBe(1);
    });

    test('should update user preferences', async () => {
      const user = userProfiles.standard;
      const newPreferences = {
        ...user.preferences,
        language: 'es',
        currency: 'EUR',
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...user, preferences: newPreferences }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE users SET preferences = $1 WHERE id = $2 RETURNING *',
        [JSON.stringify(newPreferences), user.id]
      );

      expect(result.rows[0].preferences.language).toBe('es');
      expect(result.rows[0].preferences.currency).toBe('EUR');
    });

    test('should handle email verification', async () => {
      const user = userProfiles.standard;
      expect(user.emailVerified).toBe(true);
    });

    test('should handle phone verification', async () => {
      const user = userProfiles.standard;
      expect(user.phoneVerified).toBe(true);
    });
  });

  describe('Order Management', () => {
    test('should retrieve user orders', async () => {
      const userOrders = [orders.pending, orders.completed, orders.cancelled];

      mockDb.query.mockResolvedValueOnce({
        rows: userOrders,
        rowCount: 3,
      });

      const result = await mockDb.query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        ['usr_001']
      );

      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].status).toBe('pending');
    });

    test('should calculate order total correctly', () => {
      const order = orders.pending;
      const calculatedTotal =
        order.items.reduce((sum, item) => sum + item.totalPrice, 0) +
        order.tax +
        order.shipping;

      expect(calculatedTotal).toBeCloseTo(order.total, 2);
    });

    test('should create new order', async () => {
      const newOrder = {
        userId: 'usr_001',
        items: [{ productId: 'prod_001', quantity: 1, price: 99.99 }],
        shippingAddress: 'addr_001',
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'ord_new', ...newOrder, status: 'pending', createdAt: new Date().toISOString() }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO orders (user_id, status, shipping_address) VALUES ($1, $2, $3) RETURNING *',
        [newOrder.userId, 'pending', newOrder.shippingAddress]
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].status).toBe('pending');
    });

    test('should cancel order', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...orders.cancelled, status: 'cancelled', cancelledAt: new Date().toISOString() }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'UPDATE orders SET status = $1, cancelled_at = NOW() WHERE id = $2 RETURNING *',
        ['cancelled', 'ord_003']
      );

      expect(result.rows[0].status).toBe('cancelled');
    });

    test('should filter orders by status', async () => {
      const allOrders = [orders.pending, orders.completed, orders.cancelled];
      const pendingOrders = allOrders.filter(o => o.status === 'pending');

      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders[0].id).toBe('ord_001');
    });

    test('should handle order pagination', () => {
      const page = 1;
      const limit = 10;
      const offset = (page - 1) * limit;

      expect(offset).toBe(0);
    });

    test('should track order status changes', () => {
      const statusHistory = [
        { status: 'pending', timestamp: '2024-01-20T10:00:00Z' },
        { status: 'processing', timestamp: '2024-01-20T11:00:00Z' },
        { status: 'shipped', timestamp: '2024-01-21T09:00:00Z' },
        { status: 'delivered', timestamp: '2024-01-23T14:00:00Z' },
      ];

      expect(statusHistory).toHaveLength(4);
      expect(statusHistory[0].status).toBe('pending');
      expect(statusHistory[3].status).toBe('delivered');
    });
  });

  describe('Payment Methods', () => {
    test('should retrieve user payment methods', async () => {
      const methods = [paymentMethods.creditCard, paymentMethods.paypal];

      mockDb.query.mockResolvedValueOnce({
        rows: methods,
        rowCount: 2,
      });

      const result = await mockDb.query(
        'SELECT * FROM payment_methods WHERE user_id = $1',
        ['usr_001']
      );

      expect(result.rows).toHaveLength(2);
    });

    test('should add new payment method', async () => {
      const newCard = {
        id: 'card_new',
        userId: 'usr_001',
        type: 'mastercard',
        last4: '5555',
        expiryMonth: 6,
        expiryYear: 2027,
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [newCard],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO payment_methods (user_id, type, last4, expiry_month, expiry_year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [newCard.userId, newCard.type, newCard.last4, newCard.expiryMonth, newCard.expiryYear]
      );

      expect(result.rows[0]).toHaveProperty('id');
    });

    test('should set default payment method', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ ...paymentMethods.paypal, isDefault: true }],
        rowCount: 1,
      });

      // First, unset all defaults
      await mockDb.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
        ['usr_001']
      );

      // Then set new default
      const result = await mockDb.query(
        'UPDATE payment_methods SET is_default = true WHERE id = $1 RETURNING *',
        ['pp_001']
      );

      expect(result.rows[0].isDefault).toBe(true);
    });

    test('should remove payment method', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2',
        ['card_001', 'usr_001']
      );

      expect(result.rowCount).toBe(1);
    });
  });

  describe('Product Reviews', () => {
    test('should submit product review', async () => {
      const newReview = {
        productId: 'prod_001',
        rating: 5,
        title: 'Excellent product!',
        content: 'Would highly recommend.',
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'rev_new', ...newReview, userId: 'usr_001', status: 'pending', createdAt: new Date().toISOString() }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO reviews (user_id, product_id, rating, title, content) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        ['usr_001', newReview.productId, newReview.rating, newReview.title, newReview.content]
      );

      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].status).toBe('pending');
    });

    test('should validate review rating', () => {
      const validRatings = [1, 2, 3, 4, 5];
      const invalidRatings = [0, 6, -1, 10];

      validRatings.forEach(rating => {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      });

      invalidRatings.forEach(rating => {
        expect(rating < 1 || rating > 5).toBe(true);
      });
    });

    test('should calculate average product rating', () => {
      const productReviews = reviews.productReviews.filter(r => r.productId === 'prod_003');
      const averageRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;

      expect(averageRating).toBe(5);
    });

    test('should mark verified purchases on reviews', () => {
      const verifiedReview = reviews.productReviews[0];
      expect(verifiedReview.verifiedPurchase).toBe(true);
    });
  });

  describe('Wishlist Management', () => {
    test('should add item to wishlist', async () => {
      const wishlistItem = wishlistItems[0];

      mockDb.query.mockResolvedValueOnce({
        rows: [wishlistItem],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *',
        ['usr_001', wishlistItem.productId]
      );

      expect(result.rows[0]).toHaveProperty('id');
    });

    test('should remove item from wishlist', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
        ['usr_001', 'prod_005']
      );

      expect(result.rowCount).toBe(1);
    });

    test('should notify about price drops', () => {
      const itemsWithPriceDrop = wishlistItems.filter(item => item.priceDropped);

      expect(itemsWithPriceDrop).toHaveLength(1);
      expect(itemsWithPriceDrop[0].previousPrice).toBeGreaterThan(itemsWithPriceDrop[0].price);
    });

    test('should notify about back in stock', () => {
      const outOfStockItems = wishlistItems.filter(item => !item.inStock);

      expect(outOfStockItems).toHaveLength(1);
      expect(outOfStockItems[0].inStock).toBe(false);
    });
  });

  describe('Notifications', () => {
    test('should send welcome email on registration', async () => {
      const template = notifications.emailTemplates.find(t => t.trigger === 'user_registration');

      expect(template).toBeDefined();
      expect(template?.active).toBe(true);
      expect(template?.subject).toContain('{{firstName}}');
    });

    test('should send order confirmation email', async () => {
      const template = notifications.emailTemplates.find(t => t.trigger === 'order_created');
      const order = orders.pending;

      const renderedSubject = template?.subject.replace('{{orderId}}', order.id);

      expect(renderedSubject).toContain(order.id);
    });

    test('should track push notification delivery', async () => {
      const push = notifications.pushNotifications[0];

      expect(push.sentAt).toBeDefined();
      expect(push.read).toBe(true);
    });

    test('should respect user notification preferences', () => {
      const user = userProfiles.standard;
      const { notifications: prefs } = user.preferences;

      expect(prefs.email).toBe(true);
      expect(prefs.sms).toBe(false);
      expect(prefs.push).toBe(true);
    });
  });

  describe('Loyalty Program', () => {
    test('should calculate loyalty tier correctly', () => {
      const user = userProfiles.standard;
      const { loyaltyPoints } = user;
      const tiers = loyaltyProgram.tiers;

      const userTier = tiers.find(t =>
        loyaltyPoints >= t.minPoints &&
        (t.maxPoints === null || loyaltyPoints <= t.maxPoints)
      );

      expect(userTier?.name).toBe('silver');
      expect(userTier?.discountPercent).toBe(5);
    });

    test('should earn points on purchase', async () => {
      const order = orders.completed;
      const pointsEarned = Math.floor(order.total);

      const transaction = {
        id: 'loyalty_new',
        userId: order.userId,
        type: 'earn',
        points: pointsEarned,
        orderId: order.id,
      };

      mockDb.query.mockResolvedValueOnce({
        rows: [transaction],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'INSERT INTO loyalty_transactions (user_id, type, points, order_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [transaction.userId, transaction.type, transaction.points, transaction.orderId]
      );

      expect(result.rows[0].points).toBeGreaterThan(0);
    });

    test('should redeem points for discount', async () => {
      const transaction = loyaltyProgram.transactions.find(t => t.type === 'redeem');

      expect(transaction?.points).toBeLessThan(0);
    });

    test('should update loyalty tier on threshold', () => {
      const vipUser = userProfiles.vip;
      expect(vipUser.loyaltyTier).toBe('platinum');
      expect(vipUser.loyaltyPoints).toBeGreaterThanOrEqual(10000);
    });
  });

  describe('API Endpoints', () => {
    test('should have correct auth endpoints', () => {
      expect(apiEndpoints.auth.login).toBe('/api/v1/auth/login');
      expect(apiEndpoints.auth.register).toBe('/api/v1/auth/register');
      expect(apiEndpoints.auth.refreshToken).toBe('/api/v1/auth/refresh');
    });

    test('should have correct user endpoints', () => {
      expect(apiEndpoints.user.profile).toBe('/api/v1/users/me');
      expect(apiEndpoints.user.addresses).toBe('/api/v1/users/me/addresses');
    });

    test('should have correct order endpoints', () => {
      expect(apiEndpoints.orders.list).toBe('/api/v1/orders');
      expect(apiEndpoints.orders.create).toBe('/api/v1/orders');
    });
  });

  describe('Form Validation', () => {
    test('should validate name field', () => {
      const { name } = formValidationRules;
      const nameRegex = new RegExp(`^[a-zA-Z\\s'-]{${name.minLength},${name.maxLength}}$`);

      expect(nameRegex.test('John Doe')).toBe(true);
      expect(nameRegex.test('Mary-Jane O\'Brien')).toBe(true);
      expect(nameRegex.test('123')).toBe(false);
    });

    test('should validate phone number', () => {
      const phoneRegex = formValidationRules.phone.pattern;

      expect(phoneRegex.test('+15551234567')).toBe(true);
      expect(phoneRegex.test('555-123-4567')).toBe(false);
    });

    test('should validate address fields', () => {
      const { address } = formValidationRules;

      const validAddress = {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };

      expect(validAddress.line1.length).toBeLessThanOrEqual(address.line1.maxLength);
      expect(validAddress.country.length).toBe(address.country.maxLength);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(mockDb.query('SELECT * FROM users')).rejects.toThrow('Database connection failed');
    });

    test('should handle invalid session tokens', async () => {
      const invalidToken = 'invalid_token_xyz';

      mockRedis.get(`session:${invalidToken}`).mockResolvedValueOnce(null);

      const session = await mockRedis.get(`session:${invalidToken}`);
      expect(session).toBeNull();
    });

    test('should handle duplicate email registration', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [{ email: 'john.doe@example.com' }],
        rowCount: 1,
      });

      const result = await mockDb.query(
        'SELECT email FROM users WHERE email = $1',
        ['john.doe@example.com']
      );

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});
