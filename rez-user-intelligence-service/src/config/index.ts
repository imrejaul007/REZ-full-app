import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Application
  app: {
    name: 'user-intelligence-service',
    version: process.env.npm_package_version || '1.0.0',
    port: parseInt(process.env.PORT || '3004', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://work_db_user:ZAFYAYH1zK0C74Ap@rez-intent-graph.a8ilqgi.mongodb.net/rez_user_intelligence',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: {
      profile: parseInt(process.env.CACHE_TTL_PROFILE || '300', 10),
      recommendations: parseInt(process.env.CACHE_TTL_RECOMMENDATIONS || '600', 10),
      preferences: parseInt(process.env.CACHE_TTL_PREFERENCES || '1800', 10),
    },
  },

  // RabbitMQ
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    reconnectAttempts: 5,
    reconnectInterval: 5000,
  },

  // External Services
  services: {
    intentGraph: {
      url: process.env.INTENT_GRAPH_SERVICE_URL || 'http://localhost:3001',
      timeout: 5000,
    },
    orderService: {
      url: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
      timeout: 5000,
    },
    feedbackService: {
      url: process.env.FEEDBACK_SERVICE_URL || 'http://localhost:3003',
      timeout: 5000,
    },
    notificationService: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
      timeout: 5000,
    },
  },

  // Behavioral Scoring
  scoring: {
    weights: {
      searchActivity: parseFloat(process.env.ENGAGEMENT_WEIGHT_SEARCH || '0.2'),
      transactionActivity: parseFloat(process.env.ENGAGEMENT_WEIGHT_TRANSACTION || '0.3'),
      feedbackActivity: parseFloat(process.env.ENGAGEMENT_WEIGHT_FEEDBACK || '0.2'),
      appEngagement: parseFloat(process.env.ENGAGEMENT_WEIGHT_ENGAGEMENT || '0.3'),
    },
    thresholds: {
      engagement: {
        low: 30,
        medium: 60,
        high: 85,
      },
      value: {
        low: 100,
        medium: 500,
        high: 1000,
      },
      churn: {
        low: 30,
        medium: 60,
        high: 80,
      },
    },
  },

  // Feature Flags
  features: {
    enableBehavioralScoring: process.env.ENABLE_BEHAVIORAL_SCORING === 'true',
    enablePredictiveAnalytics: process.env.ENABLE_PREDICTIVE_ANALYTICS === 'true',
    enableRealTimeScoring: process.env.ENABLE_REAL_TIME_SCORING === 'true',
  },

  // Security
  security: {
    corsOrigins: process.env.CORS_ORIGIN?.split(',') || ['*'],
    internalServiceIPs: process.env.INTERNAL_SERVICE_IPS?.split(',') || [],
    rateLimit: {
      windowMs: 60000,
      max: 100,
    },
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

export default config;
