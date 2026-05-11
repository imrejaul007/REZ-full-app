/**
 * Mock Data for Analytics v2 Service Integration Tests
 * Provides realistic test data for analytics, metrics, and reporting scenarios
 */

export const revenueData = {
  daily: [
    {
      date: '2024-01-15',
      revenue: 45230.50,
      orders: 234,
      averageOrderValue: 193.29,
      currency: 'USD',
    },
    {
      date: '2024-01-16',
      revenue: 52180.75,
      orders: 267,
      averageOrderValue: 195.43,
      currency: 'USD',
    },
    {
      date: '2024-01-17',
      revenue: 48750.25,
      orders: 251,
      averageOrderValue: 194.22,
      currency: 'USD',
    },
    {
      date: '2024-01-18',
      revenue: 61200.00,
      orders: 312,
      averageOrderValue: 196.15,
      currency: 'USD',
    },
    {
      date: '2024-01-19',
      revenue: 55340.50,
      orders: 289,
      averageOrderValue: 191.49,
      currency: 'USD',
    },
  ],
  weekly: [
    {
      weekStart: '2024-01-15',
      weekEnd: '2024-01-21',
      revenue: 262702.00,
      orders: 1353,
      averageOrderValue: 194.16,
      growthRate: 8.5,
      currency: 'USD',
    },
    {
      weekStart: '2024-01-08',
      weekEnd: '2024-01-14',
      revenue: 241890.00,
      orders: 1245,
      averageOrderValue: 194.29,
      growthRate: 5.2,
      currency: 'USD',
    },
  ],
  monthly: [
    {
      month: '2024-01',
      revenue: 952340.50,
      orders: 4892,
      averageOrderValue: 194.68,
      growthRate: 12.3,
      currency: 'USD',
    },
    {
      month: '2023-12',
      revenue: 891250.75,
      orders: 4587,
      averageOrderValue: 194.30,
      growthRate: 8.7,
      currency: 'USD',
    },
  ],
};

export const customerMetrics = {
  acquisition: {
    totalNewCustomers: 1250,
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    byChannel: {
      organic: 450,
      paid: 380,
      referral: 280,
      social: 140,
    },
    conversionRate: 4.2,
  },
  retention: {
    monthlyActiveUsers: 15420,
    returningCustomers: 8920,
    churnRate: 2.8,
    retentionRate: 97.2,
    npsScore: 72,
    customerLifetimeValue: 1850.50,
  },
  engagement: {
    averageSessionDuration: 420, // seconds
    pagesPerSession: 4.5,
    bounceRate: 32.5,
    cartAbandonmentRate: 45.2,
    checkoutCompletionRate: 68.5,
  },
};

export const realTimeEvents = {
  pageViews: [
    {
      eventId: 'evt_001',
      sessionId: 'sess_abc123',
      userId: 'usr_456',
      page: '/products/electronics/laptops',
      timestamp: '2024-01-20T10:30:00Z',
      duration: 45,
      referrer: '/products/electronics',
    },
    {
      eventId: 'evt_002',
      sessionId: 'sess_abc123',
      userId: 'usr_456',
      page: '/products/electronics/laptops/macbook-pro',
      timestamp: '2024-01-20T10:31:00Z',
      duration: 120,
      referrer: '/products/electronics/laptops',
    },
    {
      eventId: 'evt_003',
      sessionId: 'sess_def456',
      userId: null,
      page: '/',
      timestamp: '2024-01-20T10:32:00Z',
      duration: 15,
      referrer: 'https://google.com',
    },
  ],
  purchases: [
    {
      eventId: 'evt_pur_001',
      orderId: 'ord_789',
      userId: 'usr_456',
      products: [
        { productId: 'prod_001', name: 'MacBook Pro', quantity: 1, price: 2499.00 },
        { productId: 'prod_002', name: 'USB-C Hub', quantity: 2, price: 79.99 },
      ],
      total: 2658.98,
      currency: 'USD',
      timestamp: '2024-01-20T10:35:00Z',
    },
  ],
  cartEvents: [
    {
      eventId: 'evt_cart_001',
      sessionId: 'sess_abc123',
      userId: 'usr_456',
      action: 'add',
      productId: 'prod_001',
      quantity: 1,
      price: 2499.00,
      timestamp: '2024-01-20T10:33:00Z',
    },
    {
      eventId: 'evt_cart_002',
      sessionId: 'sess_abc123',
      userId: 'usr_456',
      action: 'add',
      productId: 'prod_002',
      quantity: 2,
      price: 79.99,
      timestamp: '2024-01-20T10:33:30Z',
    },
    {
      eventId: 'evt_cart_003',
      sessionId: 'sess_abc123',
      userId: 'usr_456',
      action: 'remove',
      productId: 'prod_002',
      quantity: 1,
      price: 79.99,
      timestamp: '2024-01-20T10:34:00Z',
    },
  ],
  searchEvents: [
    {
      eventId: 'evt_search_001',
      sessionId: 'sess_abc123',
      userId: 'usr_456',
      query: 'macbook pro 2024',
      resultsCount: 24,
      clickedResult: 'prod_001',
      timestamp: '2024-01-20T10:30:15Z',
    },
    {
      eventId: 'evt_search_002',
      sessionId: 'sess_xyz789',
      userId: null,
      query: 'wireless headphones',
      resultsCount: 156,
      clickedResult: null,
      timestamp: '2024-01-20T10:40:00Z',
    },
  ],
};

export const inventoryMetrics = {
  stockLevels: [
    { productId: 'prod_001', name: 'MacBook Pro', stock: 45, reorderPoint: 20 },
    { productId: 'prod_002', name: 'USB-C Hub', stock: 230, reorderPoint: 50 },
    { productId: 'prod_003', name: 'Wireless Mouse', stock: 12, reorderPoint: 30 },
    { productId: 'prod_004', name: '4K Monitor', stock: 8, reorderPoint: 10 },
  ],
  turnoverRate: 4.5,
  daysOfInventory: 81,
  deadStock: [
    { productId: 'prod_old', name: 'Legacy Adapter', stock: 500, lastSold: '2023-06-15' },
  ],
};

export const deliveryMetrics = {
  ordersByStatus: {
    pending: 124,
    processing: 89,
    shipped: 256,
    delivered: 1842,
    returned: 23,
  },
  averageDeliveryTime: 3.2, // days
  onTimeDeliveryRate: 94.5,
  deliveryCosts: {
    total: 45230.00,
    averagePerOrder: 8.50,
    byRegion: {
      north: 15200.00,
      south: 12800.00,
      east: 9800.00,
      west: 7430.00,
    },
  },
};

export const financialMetrics = {
  revenue: {
    gross: 125000.00,
    net: 98250.00,
    returns: 8750.00,
    discounts: 18000.00,
  },
  profitMargins: {
    gross: 35.2,
    net: 18.5,
    byCategory: {
      electronics: 22.5,
      accessories: 45.2,
      software: 72.8,
    },
  },
  cashFlow: {
    inflow: 125000.00,
    outflow: 82000.00,
    net: 43000.00,
    projected30Days: 185000.00,
  },
};

export const reportTemplates = {
  salesReport: {
    id: 'rpt_sales_001',
    name: 'Weekly Sales Report',
    type: 'sales',
    schedule: 'weekly',
    lastRun: '2024-01-21T00:00:00Z',
    recipients: ['manager@rez.com', 'analytics@rez.com'],
    metrics: ['revenue', 'orders', 'avgOrderValue', 'topProducts'],
  },
  customerReport: {
    id: 'rpt_customer_001',
    name: 'Monthly Customer Report',
    type: 'customer',
    schedule: 'monthly',
    lastRun: '2024-01-01T00:00:00Z',
    recipients: ['crm@rez.com'],
    metrics: ['newCustomers', 'retention', 'churn', 'nps'],
  },
};

export const dateRanges = {
  today: { start: '2024-01-20', end: '2024-01-20' },
  last7Days: { start: '2024-01-14', end: '2024-01-20' },
  last30Days: { start: '2023-12-22', end: '2024-01-20' },
  lastQuarter: { start: '2023-10-01', end: '2023-12-31' },
  lastYear: { start: '2023-01-01', end: '2023-12-31' },
  custom: { start: '2024-01-01', end: '2024-01-20' },
};

export const userSegments = {
  vipCustomers: {
    count: 1250,
    revenueShare: 45,
    avgOrderValue: 450.00,
    retentionRate: 98,
  },
  regularCustomers: {
    count: 8500,
    revenueShare: 40,
    avgOrderValue: 125.00,
    retentionRate: 85,
  },
  newCustomers: {
    count: 2800,
    revenueShare: 10,
    avgOrderValue: 75.00,
    retentionRate: 45,
  },
  churnedCustomers: {
    count: 420,
    revenueShare: 5,
    avgOrderValue: 95.00,
    retentionRate: 0,
  },
};

export const apiResponseFixtures = {
  successAggregation: {
    status: 200,
    data: {
      aggregated: true,
      period: dateRanges.last7Days,
      results: revenueData.daily,
      computed: {
        totalRevenue: 262702.00,
        totalOrders: 1353,
        avgOrderValue: 194.16,
      },
    },
  },
  errorAggregation: {
    status: 400,
    error: {
      code: 'INVALID_DATE_RANGE',
      message: 'End date must be after start date',
      details: {
        startDate: '2024-01-20',
        endDate: '2024-01-10',
      },
    },
  },
};

export const mockDatabaseQueries = {
  revenueByDate: `
    SELECT date, SUM(revenue) as total_revenue, COUNT(*) as order_count
    FROM orders
    WHERE date BETWEEN :startDate AND :endDate
    GROUP BY date
    ORDER BY date
  `,
  customerMetrics: `
    SELECT
      COUNT(DISTINCT user_id) as total_customers,
      COUNT(DISTINCT CASE WHEN created_at >= :periodStart THEN user_id END) as new_customers,
      SUM(CASE WHEN last_order_date >= :recencyDate THEN 1 ELSE 0 END) as active_customers
    FROM customers
  `,
  productPerformance: `
    SELECT
      p.product_id,
      p.name,
      SUM(oi.quantity) as units_sold,
      SUM(oi.quantity * oi.price) as revenue
    FROM products p
    JOIN order_items oi ON p.product_id = oi.product_id
    WHERE oi.created_at >= :startDate
    GROUP BY p.product_id, p.name
    ORDER BY revenue DESC
    LIMIT :limit
  `,
};
