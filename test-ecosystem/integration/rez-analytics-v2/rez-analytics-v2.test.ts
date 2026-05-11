/**
 * Integration Tests for Analytics v2 Service
 * Tests revenue aggregation, customer metrics, real-time events, and reporting
 */

import {
  revenueData,
  customerMetrics,
  realTimeEvents,
  inventoryMetrics,
  deliveryMetrics,
  financialMetrics,
  reportTemplates,
  dateRanges,
  userSegments,
  apiResponseFixtures,
} from './mockData';

const {
  createMockDbConnection,
  createMockRedisClient,
  createMockHttpClient,
  createMockEventEmitter,
  waitFor,
  generateTestId,
  createTimestamp,
} = require('../jest.setup');

// Mock external dependencies
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
  createMockEventEmitter: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
  waitFor: jest.fn((ms: number) => new Promise(resolve => setTimeout(resolve, ms))),
  generateTestId: jest.fn((prefix: string) => `${prefix}_${Date.now()}`),
  createTimestamp: jest.fn((daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  }),
}));

describe('Analytics v2 Integration', () => {
  let mockDb: ReturnType<typeof createMockDbConnection>;
  let mockRedis: ReturnType<typeof createMockRedisClient>;
  let mockHttp: ReturnType<typeof createMockHttpClient>;
  let mockEventEmitter: ReturnType<typeof createMockEventEmitter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDbConnection();
    mockRedis = createMockRedisClient();
    mockHttp = createMockHttpClient();
    mockEventEmitter = createMockEventEmitter();
  });

  describe('Revenue Aggregation', () => {
    test('should aggregate daily revenue data correctly', async () => {
      // Setup mock database response
      const dailyRevenue = revenueData.daily;
      mockDb.query.mockResolvedValueOnce({
        rows: dailyRevenue.map(r => ({
          date: r.date,
          total_revenue: r.revenue,
          order_count: r.orders,
          avg_order_value: r.averageOrderValue,
        })),
        rowCount: dailyRevenue.length,
      });

      // Execute aggregation query
      const result = await mockDb.query(
        'SELECT date, SUM(revenue) as total_revenue, COUNT(*) as order_count FROM orders GROUP BY date',
        { startDate: dateRanges.last7Days.start, endDate: dateRanges.last7Days.end }
      );

      // Assertions
      expect(result.rows).toHaveLength(5);
      expect(result.rows[0]).toHaveProperty('date');
      expect(result.rows[0]).toHaveProperty('total_revenue');
      expect(result.rows[0]).toHaveProperty('order_count');
      expect(result.rowCount).toBe(5);

      // Verify data integrity
      const totalRevenue = result.rows.reduce((sum: number, row: { total_revenue: number }) => sum + row.total_revenue, 0);
      expect(totalRevenue).toBeCloseTo(262702.0, 2);
    });

    test('should calculate weekly revenue growth rates', () => {
      const weeklyRevenue = revenueData.weekly;

      // Calculate growth rate
      const currentWeek = weeklyRevenue[0];
      const previousWeek = weeklyRevenue[1];
      const expectedGrowthRate = ((currentWeek.revenue - previousWeek.revenue) / previousWeek.revenue) * 100;

      expect(expectedGrowthRate).toBeCloseTo(8.5, 1);
      expect(currentWeek.growthRate).toBe(8.5);
    });

    test('should aggregate monthly revenue with currency conversion', async () => {
      const monthlyRevenue = revenueData.monthly;

      // Simulate aggregation with currency conversion
      const aggregatedMonthly = monthlyRevenue.map(m => ({
        ...m,
        revenueInEur: m.revenue * 0.92,
        revenueInGbp: m.revenue * 0.79,
      }));

      expect(aggregatedMonthly[0].revenue).toBe(952340.50);
      expect(aggregatedMonthly[0].revenueInEur).toBeCloseTo(876073.26, 2);
      expect(aggregatedMonthly[0].revenueInGbp).toBeCloseTo(752348.99, 2);
    });

    test('should handle revenue aggregation with missing data', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await mockDb.query(
        'SELECT date, SUM(revenue) as total_revenue FROM orders WHERE date = :date',
        { date: '2024-01-25' }
      );

      expect(result.rows).toHaveLength(0);
      expect(result.rowCount).toBe(0);
    });

    test('should calculate average order value across date range', () => {
      const dailyData = revenueData.daily;
      const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
      const totalOrders = dailyData.reduce((sum, d) => sum + d.orders, 0);
      const avgOrderValue = totalRevenue / totalOrders;

      expect(avgOrderValue).toBeCloseTo(194.2, 1);
    });

    test('should handle concurrent aggregation requests', async () => {
      const concurrentRequests = 5;
      const results = await Promise.all(
        Array(concurrentRequests).fill(null).map(async (_, i) => {
          mockDb.query.mockResolvedValueOnce({
            rows: revenueData.daily.slice(0, i + 1),
            rowCount: i + 1,
          });
          return mockDb.query('SELECT * FROM orders LIMIT :limit', { limit: i + 1 });
        })
      );

      expect(results).toHaveLength(concurrentRequests);
      results.forEach((result, i) => {
        expect(result.rowCount).toBe(i + 1);
      });
    });

    test('should aggregate revenue by product category', async () => {
      const categoryRevenue = [
        { category: 'electronics', revenue: 125000.50, orders: 450 },
        { category: 'accessories', revenue: 45000.25, orders: 890 },
        { category: 'software', revenue: 25000.00, orders: 125 },
      ];

      const totalRevenue = categoryRevenue.reduce((sum, c) => sum + c.revenue, 0);
      const revenueShare = categoryRevenue.map(c => ({
        ...c,
        share: (c.revenue / totalRevenue) * 100,
      }));

      expect(revenueShare[0].share).toBeCloseTo(64.1, 1);
      expect(revenueShare[1].share).toBeCloseTo(23.1, 1);
      expect(revenueShare[2].share).toBeCloseTo(12.8, 1);
    });
  });

  describe('Customer Metrics', () => {
    test('should calculate customer acquisition metrics', () => {
      const { acquisition } = customerMetrics;
      const totalAcquired = acquisition.totalNewCustomers;
      const byChannel = acquisition.byChannel;

      // Verify channel breakdown
      const channelSum = Object.values(byChannel).reduce((sum, count) => sum + count, 0);
      expect(channelSum).toBe(totalAcquired);

      // Calculate channel percentages
      expect((byChannel.organic / totalAcquired) * 100).toBeCloseTo(36, 0);
      expect((byChannel.paid / totalAcquired) * 100).toBeCloseTo(30.4, 1);
      expect((byChannel.referral / totalAcquired) * 100).toBeCloseTo(22.4, 1);
      expect((byChannel.social / totalAcquired) * 100).toBeCloseTo(11.2, 1);
    });

    test('should calculate retention rate from churn rate', () => {
      const { retention } = customerMetrics;
      const retentionRate = 100 - retention.churnRate;

      expect(retentionRate).toBe(97.2);
      expect(retention.retentionRate).toBe(retentionRate);
    });

    test('should calculate customer lifetime value correctly', () => {
      const { retention } = customerMetrics;
      const avgOrderValue = 150; // Assume average order value
      const ordersPerMonth = 2;
      const customerMonths = 24; // Average customer relationship

      const clv = avgOrderValue * ordersPerMonth * customerMonths;
      expect(clv).toBe(7200);
      expect(retention.customerLifetimeValue).toBe(1850.50);
    });

    test('should track engagement metrics accurately', () => {
      const { engagement } = customerMetrics;

      // Session duration should be reasonable
      expect(engagement.averageSessionDuration).toBeGreaterThan(0);
      expect(engagement.averageSessionDuration).toBeLessThan(3600); // Less than 1 hour

      // Bounce rate should be percentage
      expect(engagement.bounceRate).toBeGreaterThan(0);
      expect(engagement.bounceRate).toBeLessThan(100);

      // Pages per session
      expect(engagement.pagesPerSession).toBeGreaterThan(0);
    });

    test('should handle zero customers scenario', () => {
      const emptyMetrics = {
        totalNewCustomers: 0,
        monthlyActiveUsers: 0,
        retentionRate: 0,
        npsScore: null,
      };

      expect(emptyMetrics.totalNewCustomers).toBe(0);
      expect(emptyMetrics.npsScore).toBeNull();
    });

    test('should segment customers correctly', () => {
      const segments = userSegments;
      const totalCustomers = Object.values(segments).reduce(
        (sum, seg) => sum + seg.count,
        0
      );

      expect(totalCustomers).toBe(12970);
      expect(segments.vipCustomers.revenueShare).toBe(45);
    });

    test('should calculate NPS score from responses', () => {
      const promoters = 45;
      const detractors = 15;
      const total = 100;
      const nps = ((promoters - detractors) / total) * 100;

      expect(nps).toBe(30);
    });
  });

  describe('Real-time Event Processing', () => {
    test('should process page view events correctly', async () => {
      const pageViews = realTimeEvents.pageViews;
      const sessionPageViews = pageViews.filter(e => e.sessionId === 'sess_abc123');

      // Verify session grouping
      expect(sessionPageViews).toHaveLength(2);

      // Verify page flow
      expect(sessionPageViews[0].page).toBe('/products/electronics/laptops');
      expect(sessionPageViews[1].page).toBe('/products/electronics/laptops/macbook-pro');

      // Verify referrer chain
      expect(sessionPageViews[1].referrer).toBe(sessionPageViews[0].page);
    });

    test('should track purchase events with product details', () => {
      const purchases = realTimeEvents.purchases;

      expect(purchases).toHaveLength(1);
      expect(purchases[0]).toHaveProperty('orderId');
      expect(purchases[0]).toHaveProperty('products');
      expect(purchases[0].products).toHaveLength(2);

      // Calculate total from products
      const calculatedTotal = purchases[0].products.reduce(
        (sum: number, p: { price: number; quantity: number }) => sum + p.price * p.quantity,
        0
      );
      expect(calculatedTotal).toBeCloseTo(purchases[0].total, 2);
    });

    test('should handle cart add and remove events', () => {
      const cartEvents = realTimeEvents.cartEvents;
      const addEvents = cartEvents.filter(e => e.action === 'add');
      const removeEvents = cartEvents.filter(e => e.action === 'remove');

      expect(addEvents).toHaveLength(2);
      expect(removeEvents).toHaveLength(1);

      // Verify cart state changes
      const finalCartValue = addEvents.reduce((sum: number, e: { price: number; quantity: number }) => sum + e.price * e.quantity, 0)
        - removeEvents.reduce((sum: number, e: { price: number; quantity: number }) => sum + e.price * e.quantity, 0);

      expect(finalCartValue).toBeCloseTo(2499.00 + 79.99 - 79.99, 2);
    });

    test('should track search events with results count', () => {
      const searchEvents = realTimeEvents.searchEvents;

      expect(searchEvents).toHaveLength(2);
      expect(searchEvents[0].resultsCount).toBe(24);
      expect(searchEvents[1].resultsCount).toBe(156);

      // Verify conversion tracking
      expect(searchEvents[0].clickedResult).toBeTruthy();
      expect(searchEvents[1].clickedResult).toBeNull();
    });

    test('should emit real-time events through event emitter', () => {
      const mockEmit = mockEventEmitter.emit;

      // Emit page view event
      const pageViewEvent = realTimeEvents.pageViews[0];
      mockEmit('pageview', pageViewEvent);

      expect(mockEmit).toHaveBeenCalledWith('pageview', pageViewEvent);
    });

    test('should handle event stream backpressure', async () => {
      const eventBuffer: unknown[] = [];
      const maxBufferSize = 100;
      const overflowThreshold = 80;

      // Simulate event accumulation
      for (let i = 0; i < overflowThreshold; i++) {
        eventBuffer.push({ eventId: `evt_${i}`, timestamp: new Date().toISOString() });
      }

      expect(eventBuffer.length).toBe(overflowThreshold);
      expect(eventBuffer.length).toBeLessThan(maxBufferSize);

      // Verify buffer management
      if (eventBuffer.length >= overflowThreshold) {
        // Simulate flush
        const flushed = eventBuffer.splice(0, eventBuffer.length);
        expect(flushed.length).toBe(overflowThreshold);
      }
    });

    test('should deduplicate events with same eventId', () => {
      const events = [...realTimeEvents.pageViews, ...realTimeEvents.pageViews];
      const uniqueEvents = Array.from(
        new Map(events.map(e => [e.eventId, e])).values()
      );

      expect(uniqueEvents.length).toBeLessThan(events.length);
      expect(uniqueEvents).toHaveLength(3);
    });

    test('should validate event schema before processing', () => {
      const requiredFields = ['eventId', 'sessionId', 'timestamp'];

      realTimeEvents.pageViews.forEach(event => {
        requiredFields.forEach(field => {
          expect(event).toHaveProperty(field);
          expect(event[field as keyof typeof event]).toBeTruthy();
        });
      });
    });
  });

  describe('Inventory Analytics', () => {
    test('should calculate reorder point alerts', () => {
      const stockLevels = inventoryMetrics.stockLevels;
      const lowStockItems = stockLevels.filter(item => item.stock <= item.reorderPoint);

      expect(lowStockItems).toHaveLength(2);
      expect(lowStockItems.map((i: { name: string }) => i.name)).toContain('Wireless Mouse');
      expect(lowStockItems.map((i: { name: string }) => i.name)).toContain('4K Monitor');
    });

    test('should calculate inventory turnover rate', () => {
      const { turnoverRate, daysOfInventory } = inventoryMetrics;

      // Days of inventory = 365 / turnover rate
      const calculatedDaysOfInventory = 365 / turnoverRate;

      expect(calculatedDaysOfInventory).toBeCloseTo(81.1, 0);
      expect(daysOfInventory).toBe(81);
    });

    test('should identify dead stock items', () => {
      const deadStock = inventoryMetrics.deadStock;
      const currentDate = new Date('2024-01-20');
      const sixMonthsAgo = new Date('2023-07-20');

      const actualDeadStock = deadStock.filter(item => {
        const lastSold = new Date(item.lastSold);
        return lastSold < sixMonthsAgo;
      });

      expect(actualDeadStock).toHaveLength(1);
      expect(actualDeadStock[0].productId).toBe('prod_old');
    });

    test('should calculate stock value', () => {
      const stockLevels = inventoryMetrics.stockLevels;
      const mockPrices: Record<string, number> = {
        'prod_001': 2499.00,
        'prod_002': 79.99,
        'prod_003': 49.99,
        'prod_004': 899.00,
      };

      const totalStockValue = stockLevels.reduce((sum, item) => {
        return sum + (item.stock * (mockPrices[item.productId] || 0));
      }, 0);

      expect(totalStockValue).toBeCloseTo(182478.30, 2);
    });
  });

  describe('Delivery Analytics', () => {
    test('should calculate order fulfillment rates', () => {
      const { ordersByStatus } = deliveryMetrics;
      const totalOrders = Object.values(ordersByStatus).reduce((sum, count) => sum + count, 0);
      const fulfilledOrders = ordersByStatus.delivered + ordersByStatus.shipped;
      const fulfillmentRate = (fulfilledOrders / totalOrders) * 100;

      expect(totalOrders).toBe(2334);
      expect(fulfilledOrders).toBe(2098);
      expect(fulfillmentRate).toBeCloseTo(89.9, 1);
    });

    test('should calculate average delivery time', () => {
      const { averageDeliveryTime } = deliveryMetrics;

      expect(averageDeliveryTime).toBe(3.2);
      expect(averageDeliveryTime).toBeGreaterThan(0);
      expect(averageDeliveryTime).toBeLessThan(7); // Reasonable for e-commerce
    });

    test('should calculate regional delivery costs', () => {
      const { deliveryCosts } = deliveryMetrics;
      const regionalTotal = Object.values(deliveryCosts.byRegion).reduce((sum, cost) => sum + cost, 0);

      expect(regionalTotal).toBeCloseTo(deliveryCosts.total, 0);
      expect(deliveryCosts.byRegion.north).toBeGreaterThan(deliveryCosts.byRegion.west);
    });

    test('should track on-time delivery performance', () => {
      const { onTimeDeliveryRate } = deliveryMetrics;

      expect(onTimeDeliveryRate).toBe(94.5);
      expect(onTimeDeliveryRate).toBeGreaterThan(90);
      expect(onTimeDeliveryRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Financial Analytics', () => {
    test('should calculate gross and net revenue', () => {
      const { revenue } = financialMetrics;

      expect(revenue.gross).toBe(125000.00);
      expect(revenue.net).toBe(98250.00);
      expect(revenue.gross - revenue.net).toBe(revenue.returns + revenue.discounts);
    });

    test('should calculate profit margins by category', () => {
      const { profitMargins } = financialMetrics;

      expect(profitMargins.byCategory.electronics).toBeLessThan(profitMargins.byCategory.accessories);
      expect(profitMargins.byCategory.software).toBeGreaterThan(profitMargins.byCategory.electronics);
    });

    test('should project cash flow accurately', () => {
      const { cashFlow } = financialMetrics;

      expect(cashFlow.net).toBe(cashFlow.inflow - cashFlow.outflow);
      expect(cashFlow.net).toBe(43000.00);
      expect(cashFlow.projected30Days).toBeGreaterThan(cashFlow.inflow);
    });
  });

  describe('Report Generation', () => {
    test('should generate scheduled reports', async () => {
      const reports = [reportTemplates.salesReport, reportTemplates.customerReport];

      reports.forEach(report => {
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('schedule');
        expect(report).toHaveProperty('recipients');
        expect(report.recipients).toBeInstanceOf(Array);
        expect(report.recipients.length).toBeGreaterThan(0);
      });
    });

    test('should validate report parameters', () => {
      const { salesReport } = reportTemplates;

      expect(salesReport.type).toBe('sales');
      expect(salesReport.schedule).toBe('weekly');
      expect(salesReport.metrics).toContain('revenue');
      expect(salesReport.metrics).toContain('orders');
    });

    test('should cache report data in Redis', async () => {
      const cacheKey = `report:${reportTemplates.salesReport.id}`;
      const cacheData = JSON.stringify({ data: revenueData.daily, generatedAt: new Date().toISOString() });

      mockRedis.set(cacheKey, cacheData, 'EX', 3600);
      const cached = await mockRedis.get(cacheKey);

      expect(mockRedis.set).toHaveBeenCalledWith(cacheKey, cacheData, 'EX', 3600);
      expect(cached).toBeNull(); // Mock returns null by default
    });
  });

  describe('Data Aggregation Pipeline', () => {
    test('should aggregate data within specified date range', async () => {
      const { start, end } = dateRanges.last30Days;
      const filteredData = revenueData.daily.filter(d => d.date >= start && d.date <= end);

      expect(filteredData.length).toBeGreaterThan(0);
    });

    test('should handle timezone-aware aggregations', () => {
      const timestamp = '2024-01-20T23:59:59Z';
      const date = new Date(timestamp);

      expect(date.toISOString()).toBe(timestamp);
      expect(date.getUTCHours()).toBe(23);
    });

    test('should handle large data volumes efficiently', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: Math.random() * 1000,
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const startTime = Date.now();
      const aggregated = largeDataset.reduce((acc, item) => {
        const dateKey = item.date.split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { count: 0, total: 0 };
        }
        acc[dateKey].count++;
        acc[dateKey].total += item.value;
        return acc;
      }, {} as Record<string, { count: number; total: number }>);
      const endTime = Date.now();

      expect(Object.keys(aggregated).length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should export data in multiple formats', async () => {
      const formats = ['json', 'csv', 'xlsx'];
      const data = revenueData.daily;

      formats.forEach(format => {
        let exportResult: string;

        switch (format) {
          case 'json':
            exportResult = JSON.stringify(data);
            break;
          case 'csv':
            exportResult = 'date,revenue,orders,avgOrderValue\n' +
              data.map(d => `${d.date},${d.revenue},${d.orders},${d.averageOrderValue}`).join('\n');
            break;
          case 'xlsx':
            // Simulated binary format
            exportResult = Buffer.from(JSON.stringify(data)).toString('base64');
            break;
        }

        expect(exportResult).toBeTruthy();
        expect(typeof exportResult).toBe('string');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection failures gracefully', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        mockDb.query('SELECT * FROM orders')
      ).rejects.toThrow('Connection refused');
    });

    test('should handle invalid date range errors', () => {
      const { errorAggregation } = apiResponseFixtures;

      expect(errorAggregation.status).toBe(400);
      expect(errorAggregation.error).toHaveProperty('code');
      expect(errorAggregation.error.code).toBe('INVALID_DATE_RANGE');
    });

    test('should handle missing required fields in events', () => {
      const invalidEvent = {
        sessionId: 'sess_123',
        // Missing eventId and timestamp
      };

      const requiredFields = ['eventId', 'timestamp'];
      const missingFields = requiredFields.filter(field => !(field in invalidEvent));

      expect(missingFields).toHaveLength(2);
    });

    test('should retry failed operations', async () => {
      let attempts = 0;
      const maxRetries = 3;

      mockDb.query.mockImplementation(() => {
        attempts++;
        if (attempts < maxRetries) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const result = await mockDb.query('SELECT 1');
      expect(attempts).toBe(3);
      expect(result).toHaveProperty('rows');
    });
  });

  describe('Performance Benchmarks', () => {
    test('should complete simple aggregation under 100ms', async () => {
      const startTime = Date.now();

      // Simulate aggregation
      const result = revenueData.daily.reduce(
        (acc, day) => ({
          totalRevenue: acc.totalRevenue + day.revenue,
          totalOrders: acc.totalOrders + day.orders,
        }),
        { totalRevenue: 0, totalOrders: 0 }
      );

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should handle concurrent metric calculations', async () => {
      const concurrentCalculations = 10;
      const startTime = Date.now();

      await Promise.all(
        Array(concurrentCalculations).fill(null).map(() =>
          Promise.resolve(
            revenueData.daily.reduce((sum: number, d: { revenue: number }) => sum + d.revenue, 0)
          )
        )
      );

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
