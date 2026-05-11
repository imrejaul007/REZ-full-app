// Test configuration for all REZ services

export const testConfig = {
  // Base URLs for all services
  services: {
    delivery: {
      name: 'rez-delivery-service',
      baseUrl: process.env.DELIVERY_SERVICE_URL || 'http://localhost:4010',
      port: 4010,
    },
    analytics: {
      name: 'rez-analytics-service',
      baseUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4016',
      port: 4016,
    },
    paymentLinks: {
      name: 'rez-payment-links-service',
      baseUrl: process.env.PAYMENT_LINKS_SERVICE_URL || 'http://localhost:4018',
      port: 4018,
    },
    journey: {
      name: 'rez-journey-service',
      baseUrl: process.env.JOURNEY_SERVICE_URL || 'http://localhost:4019',
      port: 4019,
    },
    automation: {
      name: 'rez-automation-service',
      baseUrl: process.env.AUTOMATION_SERVICE_URL || 'http://localhost:4020',
      port: 4020,
    },
    gdpr: {
      name: 'rez-gdpr-service',
      baseUrl: process.env.GDPR_SERVICE_URL || 'http://localhost:4021',
      port: 4021,
    },
    validation: {
      name: 'rez-validation-service',
      baseUrl: process.env.VALIDATION_SERVICE_URL || 'http://localhost:4022',
      port: 4022,
    },
    cohort: {
      name: 'rez-cohort-service',
      baseUrl: process.env.COHORT_SERVICE_URL || 'http://localhost:4027',
      port: 4027,
    },
    currency: {
      name: 'rez-currency-service',
      baseUrl: process.env.CURRENCY_SERVICE_URL || 'http://localhost:4026',
      port: 4026,
    },
    invoice: {
      name: 'rez-invoice-service',
      baseUrl: process.env.INVOICE_SERVICE_URL || 'http://localhost:4028',
      port: 4028,
    },
    menu: {
      name: 'rez-menu-service',
      baseUrl: process.env.MENU_SERVICE_URL || 'http://localhost:4030',
      port: 4030,
    },
    refund: {
      name: 'rez-refund-service',
      baseUrl: process.env.REFUND_SERVICE_URL || 'http://localhost:4031',
      port: 4031,
    },
    tracking: {
      name: 'rez-tracking-service',
      baseUrl: process.env.TRACKING_SERVICE_URL || 'http://localhost:4032',
      port: 4032,
    },
  },

  // Test authentication
  auth: {
    token: process.env.TEST_AUTH_TOKEN || 'test-integration-token',
    apiKey: process.env.TEST_API_KEY || 'test-integration-api-key',
    username: process.env.TEST_USERNAME || 'test-user',
    password: process.env.TEST_PASSWORD || 'test-password',
  },

  // Test data generation
  testData: {
    prefix: 'test_',
    timestamp: new Date().toISOString(),
    runId: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
  },

  // Timeouts (in milliseconds)
  timeouts: {
    default: 30000,
    healthCheck: 5000,
    longRunning: 60000,
    cleanup: 10000,
  },

  // Retry configuration
  retries: {
    enabled: process.env.CI === 'true',
    maxAttempts: 3,
    delay: 1000,
  },

  // Coverage options
  coverage: {
    enabled: process.env.COVERAGE === 'true',
    threshold: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Logging
  logging: {
    enabled: process.env.DEBUG === 'true',
    level: process.env.LOG_LEVEL || 'error',
  },

  // Service availability check
  healthCheck: {
    enabled: true,
    maxAttempts: 10,
    interval: 2000,
    failOnUnavailable: false,
  },
};

// Export individual service configs
export const deliveryConfig = testConfig.services.delivery;
export const analyticsConfig = testConfig.services.analytics;
export const paymentLinksConfig = testConfig.services.paymentLinks;
export const journeyConfig = testConfig.services.journey;
export const automationConfig = testConfig.services.automation;
export const gdprConfig = testConfig.services.gdpr;
export const validationConfig = testConfig.services.validation;
export const cohortConfig = testConfig.services.cohort;
export const currencyConfig = testConfig.services.currency;
export const invoiceConfig = testConfig.services.invoice;
export const menuConfig = testConfig.services.menu;
export const refundConfig = testConfig.services.refund;
export const trackingConfig = testConfig.services.tracking;

export default testConfig;
