/**
 * CORS Configuration for REZ Loyalty System
 *
 * Configures Cross-Origin Resource Sharing with appropriate security settings.
 */

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
  preflightContinue: boolean;
}

// Default allowed origins (should be configured via environment)
const DEFAULT_ORIGINS = [
  'https://rez-app.com',
  'https://admin.rez-app.com',
  'https://merchant.rez-app.com',
];

// Allowed HTTP methods
const ALLOWED_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
] as const;

// Allowed headers
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'X-Request-ID',
  'X-Correlation-ID',
  'X-API-Key',
  'X-Service-Token',
  'Accept',
  'Accept-Language',
  'Cache-Control',
] as const;

// Headers exposed to clients
const EXPOSED_HEADERS = [
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'X-Request-ID',
  'X-Correlation-ID',
  'Retry-After',
] as const;

/**
 * Parse allowed origins from environment
 */
function parseAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim());
  }
  return DEFAULT_ORIGINS;
}

/**
 * Get CORS configuration
 */
export function getCORSConfig(): CORSConfig {
  return {
    allowedOrigins: parseAllowedOrigins(),
    allowedMethods: [...ALLOWED_METHODS],
    allowedHeaders: [...ALLOWED_HEADERS],
    exposedHeaders: [...EXPOSED_HEADERS],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
  };
}

/**
 * Create CORS middleware options
 */
export function createCORSOptions() {
  const config = getCORSConfig();

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (config.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow all origins
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Block other origins
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    methods: config.allowedMethods,
    allowedHeaders: config.allowedHeaders,
    exposedHeaders: config.exposedHeaders,
    credentials: config.credentials,
    maxAge: config.maxAge,
    preflightContinue: config.preflightContinue,
  };
}

/**
 * Validate origin for WebSocket connections
 */
export function validateWebSocketOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow no origin (server-to-server)

  const config = getCORSConfig();

  // Allow if in allowed list
  if (config.allowedOrigins.includes(origin)) {
    return true;
  }

  // In development, allow all
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

/**
 * Get allowed origin for response header
 */
export function getAllowedOrigin(requestOrigin: string | undefined): string {
  const config = getCORSConfig();

  if (!requestOrigin) {
    return config.allowedOrigins[0] || '';
  }

  if (config.allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  if (process.env.NODE_ENV === 'development') {
    return requestOrigin;
  }

  return '';
}

/**
 * Production CORS configuration (stricter)
 */
export function getProductionCORSConfig(): CORSConfig {
  return {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || [],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400,
    preflightContinue: false,
  };
}

/**
 * Development CORS configuration (permissive)
 */
export function getDevelopmentCORSConfig(): CORSConfig {
  return {
    allowedOrigins: ['*'],
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['*'],
    exposedHeaders: ['*'],
    credentials: false,
    maxAge: 3600,
    preflightContinue: true,
  };
}

/**
 * Get environment-specific CORS config
 */
export function getEnvironmentCORSConfig(): CORSConfig {
  switch (process.env.NODE_ENV) {
    case 'production':
      return getProductionCORSConfig();
    case 'development':
    case 'test':
      return getDevelopmentCORSConfig();
    default:
      return getCORSConfig();
  }
}
