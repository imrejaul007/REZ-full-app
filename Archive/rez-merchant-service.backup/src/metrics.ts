/**
 * Custom Prometheus metrics for rez-merchant-service
 * Provides observability into HTTP requests, database operations, and merchant operations
 */

import client from 'prom-client';

// Create a custom registry to isolate this service's metrics
export const register = new client.Registry();

// Add default metrics (memory, CPU, event loop, etc.)
client.collectDefaultMetrics({ register });

// ── HTTP Request Metrics ────────────────────────────────────────────────────────

/**
 * Histogram of HTTP request durations in seconds
 * Buckets optimized for typical web request latency patterns
 */
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Counter for total HTTP requests
 */
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Gauge for concurrent HTTP requests
 */
export const httpRequestsInFlight = new client.Gauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  registers: [register],
});

// ── Database Connection Pool Metrics ──────────────────────────────────────────

/**
 * Gauge for MongoDB connection pool size
 */
export const dbConnectionPool = new client.Gauge({
  name: 'mongodb_connection_pool_size',
  help: 'Current MongoDB connection pool size',
  labelNames: ['state'],
  registers: [register],
});

/**
 * Histogram for database query duration
 */
export const dbQueryDuration = new client.Histogram({
  name: 'mongodb_query_duration_seconds',
  help: 'MongoDB query duration in seconds',
  labelNames: ['collection', 'operation'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register],
});

// ── Redis Metrics ─────────────────────────────────────────────────────────────

/**
 * Gauge for Redis connection status
 */
export const redisConnectionStatus = new client.Gauge({
  name: 'redis_connection_status',
  help: 'Redis connection status (1 = connected, 0 = disconnected)',
  registers: [register],
});

/**
 * Counter for Redis operations
 */
export const redisOperationsTotal = new client.Counter({
  name: 'redis_operations_total',
  help: 'Total Redis operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// ── Rate Limiter Metrics ───────────────────────────────────────────────────────

/**
 * Counter for rate limit exceeded events
 */
export const rateLimitExceededTotal = new client.Counter({
  name: 'rate_limit_exceeded_total',
  help: 'Total rate limit exceeded events',
  labelNames: ['limiter'],
  registers: [register],
});

// ── Business Operation Metrics ────────────────────────────────────────────────

/**
 * Counter for merchant operations
 */
export const merchantOperationsTotal = new client.Counter({
  name: 'merchant_operations_total',
  help: 'Total merchant operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

// ── Custom Business Metrics ─────────────────────────────────────────────────────

/**
 * Counter for orders created
 */
export const ordersCreatedTotal = new client.Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['status'],
  registers: [register],
});

/**
 * Counter for payments processed
 */
export const paymentsProcessedTotal = new client.Counter({
  name: 'payments_processed_total',
  help: 'Total payments processed',
  labelNames: ['status', 'gateway'],
  registers: [register],
});

/**
 * Gauge for active merchants
 */
export const activeMerchantsGauge = new client.Gauge({
  name: 'active_merchants',
  help: 'Number of active merchants',
  registers: [register],
});

/**
 * Counter for total revenue
 */
export const revenueTotal = new client.Counter({
  name: 'revenue_total',
  help: 'Total revenue processed',
  labelNames: ['currency'],
  registers: [register],
});

/**
 * Histogram for merchant operation durations
 */
export const merchantOperationDuration = new client.Histogram({
  name: 'merchant_operation_duration_seconds',
  help: 'Merchant operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/**
 * Counter for order operations
 */
export const orderOperationsTotal = new client.Counter({
  name: 'order_operations_total',
  help: 'Total order operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

/**
 * Counter for campaign operations
 */
export const campaignOperationsTotal = new client.Counter({
  name: 'campaign_operations_total',
  help: 'Total campaign operations',
  labelNames: ['operation', 'status'],
  registers: [register],
});

/**
 * Counter for engagement metrics
 */
export const engagementOperationsTotal = new client.Counter({
  name: 'engagement_operations_total',
  help: 'Total engagement operations',
  labelNames: ['type'],
  registers: [register],
});

// ── Generic Business Operation Metrics ────────────────────────────────────────

/**
 * Counter for generic business operations
 */
export const businessOperationTotal = new client.Counter({
  name: 'business_operation_total',
  help: 'Business operations count',
  labelNames: ['operation', 'status'],
  registers: [register],
});

/**
 * Histogram for business operation durations
 */
export const businessOperationDuration = new client.Histogram({
  name: 'business_operation_duration_seconds',
  help: 'Business operation duration in seconds',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// ── Circuit Breaker Metrics ────────────────────────────────────────────────────

/**
 * Gauge for circuit breaker state (0=closed, 1=half-open, 2=open)
 */
export const circuitBreakerState = new client.Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  labelNames: ['name'],
  registers: [register],
});

/**
 * Counter for circuit breaker failures
 */
export const circuitBreakerFailures = new client.Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total circuit breaker failures',
  labelNames: ['name'],
  registers: [register],
});

/**
 * Counter for circuit breaker successes
 */
export const circuitBreakerSuccesses = new client.Counter({
  name: 'circuit_breaker_successes_total',
  help: 'Total circuit breaker successes',
  labelNames: ['name'],
  registers: [register],
});

/**
 * Counter for circuit breaker rejections
 */
export const circuitBreakerRejections = new client.Counter({
  name: 'circuit_breaker_rejections_total',
  help: 'Total circuit breaker rejections',
  labelNames: ['name'],
  registers: [register],
});

// ── Metrics Middleware Helper ─────────────────────────────────────────────────

/**
 * Express middleware to track HTTP request metrics
 * Usage: app.use(metricsMiddleware)
 */
export function metricsMiddleware(
  req: { method: string; path: string; route?: { path: string } },
  res: { on: (event: string, cb: () => void) => void; statusCode: number },
  next: () => void,
): void {
  const start = Date.now();
  httpRequestsInFlight.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration,
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestsInFlight.dec();
  });

  next();
}

/**
 * Get metrics endpoint handler for Express
 * Usage: app.get('/metrics', getMetricsHandler)
 */
export async function getMetricsHandler(_req: unknown, res: { set: (header: string, value: string) => void; end: (data: string) => void }): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
}
