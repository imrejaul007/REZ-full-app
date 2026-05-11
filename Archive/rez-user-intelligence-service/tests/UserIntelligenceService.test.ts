import {
  UserProfile,
  EventType,
  DeviceType,
  CuisineType,
  PaymentMethod,
  ValueSegment,
  ChurnRisk,
} from '../src/models/UserProfile';

describe('UserProfile Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid user profile', () => {
      const profile = new UserProfile({
        userId: 'test-user-123',
        profile: {
          email: 'test@example.com',
          phone: '+1234567890',
          displayName: 'Test User',
          accountCreatedAt: new Date(),
          accountVerified: true,
          accountStatus: 'active',
        },
      });

      expect(profile.userId).toBe('test-user-123');
      expect(profile.profile.email).toBe('test@example.com');
      expect(profile.profile.accountStatus).toBe('active');
    });

    it('should have default values for behavioral scores', () => {
      const profile = new UserProfile({
        userId: 'test-user-456',
      });

      expect(profile.behavioralScores.engagementScore).toBe(0);
      expect(profile.behavioralScores.valueSegment).toBe(ValueSegment.MEDIUM);
      expect(profile.behavioralScores.churnRisk).toBe(ChurnRisk.MEDIUM);
      expect(profile.behavioralScores.upsellOpportunity).toBe(false);
    });

    it('should have default preferences', () => {
      const profile = new UserProfile({
        userId: 'test-user-789',
      });

      expect(profile.preferences.cuisinePreferences).toEqual([]);
      expect(profile.preferences.priceRange.min).toBe(0);
      expect(profile.preferences.priceRange.max).toBe(100);
      expect(profile.preferences.deliveryPreferences.contactlessDelivery).toBe(true);
    });
  });

  describe('Transaction Management', () => {
    it('should add transactions to profile', () => {
      const profile = new UserProfile({
        userId: 'test-user-transactions',
        transactions: [
          {
            orderId: 'order-1',
            restaurantId: 'restaurant-1',
            restaurantName: 'Pizza Place',
            items: [
              { itemId: 'item-1', name: 'Pizza', quantity: 1, price: 15.99, category: 'italian' },
            ],
            totalAmount: 15.99,
            tip: 3.0,
            deliveryFee: 2.99,
            taxes: 1.5,
            discounts: 0,
            finalAmount: 23.48,
            currency: 'USD',
            status: 'delivered',
            paymentMethod: PaymentMethod.CARD,
            orderType: 'delivery',
            createdAt: new Date(),
            completedAt: new Date(),
          },
        ],
      });

      expect(profile.transactions).toHaveLength(1);
      expect(profile.transactions[0].orderId).toBe('order-1');
      expect(profile.transactions[0].finalAmount).toBe(23.48);
    });
  });

  describe('Search History', () => {
    it('should store search queries', () => {
      const profile = new UserProfile({
        userId: 'test-user-search',
        searchHistory: [
          {
            queryId: 'query-1',
            query: 'pizza near me',
            filters: { cuisine: ['italian'] },
            resultsCount: 25,
            resultsClicked: [
              { resultIndex: 0, itemId: 'item-1', itemName: 'Pizza', position: 1, timestamp: new Date() },
            ],
            timeOfDay: 'evening',
            dayOfWeek: 5,
            sessionId: 'session-1',
            deviceType: DeviceType.IOS,
            timestamp: new Date(),
          },
        ],
      });

      expect(profile.searchHistory).toHaveLength(1);
      expect(profile.searchHistory[0].query).toBe('pizza near me');
      expect(profile.searchHistory[0].resultsClicked).toHaveLength(1);
    });
  });

  describe('Intent Signals', () => {
    it('should store intent signals', () => {
      const profile = new UserProfile({
        userId: 'test-user-intents',
        intentSignals: [
          {
            signalId: 'signal-1',
            type: 'browsing',
            itemId: 'item-1',
            action: 'viewed',
            metadata: { price: 15.99 },
            dwellTime: 30,
            intentScore: 75,
            timestamp: new Date(),
          },
        ],
      });

      expect(profile.intentSignals).toHaveLength(1);
      expect(profile.intentSignals[0].type).toBe('browsing');
      expect(profile.intentSignals[0].intentScore).toBe(75);
    });
  });

  describe('Engagement Metrics', () => {
    it('should track engagement metrics', () => {
      const profile = new UserProfile({
        userId: 'test-user-engagement',
        engagementMetrics: {
          totalSessions: 50,
          totalActiveDays: 20,
          firstSessionAt: new Date('2024-01-01'),
          lastSessionAt: new Date(),
          avgSessionsPerWeek: 3.5,
          avgSessionsPerMonth: 15,
          avgSessionDuration: 300,
          totalPageViews: 250,
          avgPageViewsPerSession: 5,
          featureUsage: new Map([
            ['search', { count: 100, lastUsed: new Date() }],
            ['order', { count: 25, lastUsed: new Date() }],
          ]),
          pushNotificationStats: {
            sent: 100,
            opened: 75,
            clicked: 30,
            conversionRate: 0.3,
          },
          retentionMetrics: {
            d1: 80,
            d7: 60,
            d30: 40,
            d90: 25,
          },
          growthMetrics: {
            ordersTrend: 'increasing',
            engagementTrend: 'stable',
            valueTrend: 'increasing',
          },
        },
      });

      expect(profile.engagementMetrics.totalSessions).toBe(50);
      expect(profile.engagementMetrics.pushNotificationStats?.clicked).toBe(30);
      expect(profile.engagementMetrics.growthMetrics.ordersTrend).toBe('increasing');
    });
  });

  describe('Lifetime Value', () => {
    it('should calculate lifetime value correctly', () => {
      const profile = new UserProfile({
        userId: 'test-user-ltv',
        lifetimeValue: {
          totalRevenue: 500,
          totalOrders: 10,
          averageOrderValue: 50,
          firstOrderDate: new Date('2024-01-01'),
          lastOrderDate: new Date(),
          predictedLifetimeValue: 2000,
          lastCalculatedAt: new Date(),
        },
      });

      expect(profile.lifetimeValue.totalRevenue).toBe(500);
      expect(profile.lifetimeValue.averageOrderValue).toBe(50);
      expect(profile.lifetimeValue.totalOrders).toBe(10);
    });
  });

  describe('Preferences', () => {
    it('should store cuisine preferences with scores', () => {
      const profile = new UserProfile({
        userId: 'test-user-prefs',
        preferences: {
          cuisinePreferences: [
            { cuisine: CuisineType.ITALIAN, score: 90, orderCount: 25, lastOrdered: new Date() },
            { cuisine: CuisineType.JAPANESE, score: 75, orderCount: 15 },
            { cuisine: CuisineType.MEXICAN, score: 60, orderCount: 10 },
          ],
          priceRange: { min: 15, max: 50, preferred: 30 },
          dietaryRestrictions: ['vegetarian'],
          allergenAvoidances: ['peanuts', 'shellfish'],
          favoriteRestaurants: [
            { restaurantId: 'rest-1', visitCount: 10, avgOrderValue: 35, lastVisit: new Date() },
          ],
          preferredOrderTime: {
            dayOfWeek: [5, 6],
            timeRange: { start: '18:00', end: '21:00' },
            typicalTime: '19:00',
          },
          deliveryPreferences: {
            leaveAtDoor: true,
            contactlessDelivery: true,
            ringBell: false,
          },
          notificationPreferences: {
            orderUpdates: true,
            promotions: true,
            recommendations: true,
            newsletters: false,
            channels: ['push', 'email'],
          },
        },
      });

      expect(profile.preferences.cuisinePreferences).toHaveLength(3);
      expect(profile.preferences.cuisinePreferences[0].score).toBe(90);
      expect(profile.preferences.dietaryRestrictions).toContain('vegetarian');
      expect(profile.preferences.favoriteRestaurants[0].visitCount).toBe(10);
    });
  });

  describe('Behavioral Scores', () => {
    it('should track behavioral scores', () => {
      const profile = new UserProfile({
        userId: 'test-user-scores',
        behavioralScores: {
          engagementScore: 85,
          engagementBreakdown: {
            searchActivity: 80,
            transactionActivity: 90,
            feedbackActivity: 75,
            appEngagement: 95,
          },
          valueSegment: ValueSegment.HIGH,
          churnRisk: ChurnRisk.LOW,
          churnRiskFactors: [
            { factor: 'recent_activity', weight: 20, description: 'Active in last 7 days' },
          ],
          upsellOpportunity: true,
          upsellOpportunityReason: 'High-value customer with room for growth',
          preferredChannels: ['push', 'email'],
          channelPreferences: {
            push: { engagementRate: 0.4, lastUsed: new Date() },
            email: { engagementRate: 0.25 },
          },
          healthScore: 88,
          npsScore: 75,
          lastCalculatedAt: new Date(),
        },
      });

      expect(profile.behavioralScores.engagementScore).toBe(85);
      expect(profile.behavioralScores.valueSegment).toBe(ValueSegment.HIGH);
      expect(profile.behavioralScores.upsellOpportunity).toBe(true);
      expect(profile.behavioralScores.npsScore).toBe(75);
    });
  });

  describe('Life Events', () => {
    it('should track life events', () => {
      const profile = new UserProfile({
        userId: 'test-user-life-events',
        lifeEvents: [
          {
            eventId: 'event-1',
            type: 'birthday',
            eventDate: new Date('1990-06-15'),
            detectedFrom: 'explicit',
            confidence: 100,
            createdAt: new Date(),
          },
          {
            eventId: 'event-2',
            type: 'work_schedule_change',
            description: 'Switched to night shifts',
            detectedFrom: 'inferred',
            confidence: 75,
            createdAt: new Date(),
          },
        ],
      });

      expect(profile.lifeEvents).toHaveLength(2);
      expect(profile.lifeEvents[0].type).toBe('birthday');
      expect(profile.lifeEvents[1].confidence).toBe(75);
    });
  });

  describe('Push Tokens', () => {
    it('should manage push tokens', () => {
      const profile = new UserProfile({
        userId: 'test-user-tokens',
        pushTokens: [
          {
            tokenId: 'token-1',
            token: 'device-token-abc123',
            platform: 'ios',
            deviceId: 'device-id-123',
            deviceName: 'iPhone 15',
            isActive: true,
            lastUsedAt: new Date(),
            createdAt: new Date(),
          },
          {
            tokenId: 'token-2',
            token: 'device-token-xyz789',
            platform: 'android',
            isActive: true,
            lastUsedAt: new Date(),
            createdAt: new Date(),
          },
        ],
      });

      expect(profile.pushTokens).toHaveLength(2);
      expect(profile.pushTokens[0].platform).toBe('ios');
      expect(profile.pushTokens[0].isActive).toBe(true);
    });
  });
});

describe('EventType Enum', () => {
  it('should have all required event types', () => {
    expect(EventType.ORDER_PLACED).toBe('order_placed');
    expect(EventType.ORDER_COMPLETED).toBe('order_completed');
    expect(EventType.SEARCH_QUERY).toBe('search_query');
    expect(EventType.ITEM_VIEWED).toBe('item_viewed');
    expect(EventType.CART_ABANDONED).toBe('cart_abandoned');
    expect(EventType.APP_OPENED).toBe('app_opened');
    expect(EventType.RATING_GIVEN).toBe('rating_given');
  });
});

describe('DeviceType Enum', () => {
  it('should have all device types', () => {
    expect(DeviceType.IOS).toBe('ios');
    expect(DeviceType.ANDROID).toBe('android');
    expect(DeviceType.WEB).toBe('web');
    expect(DeviceType.TABLET).toBe('tablet');
  });
});

describe('PaymentMethod Enum', () => {
  it('should have all payment methods', () => {
    expect(PaymentMethod.CARD).toBe('card');
    expect(PaymentMethod.WALLET).toBe('wallet');
    expect(PaymentMethod.COD).toBe('cod');
    expect(PaymentMethod.UPI).toBe('upi');
  });
});
