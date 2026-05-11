import { SuperTest, Test } from 'supertest';
import { ServiceConfig, AuthCredentials } from './types';

// Base URL for all services
export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost';

// Service configurations
export const SERVICES: Record<string, ServiceConfig> = {
  delivery: {
    name: 'rez-delivery-service',
    baseUrl: `${BASE_URL}:4010`,
    port: 4010,
  },
  analytics: {
    name: 'rez-analytics-service',
    baseUrl: `${BASE_URL}:4016`,
    port: 4016,
  },
  paymentLinks: {
    name: 'rez-payment-links-service',
    baseUrl: `${BASE_URL}:4018`,
    port: 4018,
  },
  journey: {
    name: 'rez-journey-service',
    baseUrl: `${BASE_URL}:4019`,
    port: 4019,
  },
  automation: {
    name: 'rez-automation-service',
    baseUrl: `${BASE_URL}:4020`,
    port: 4020,
  },
  gdpr: {
    name: 'rez-gdpr-service',
    baseUrl: `${BASE_URL}:4021`,
    port: 4021,
  },
  validation: {
    name: 'rez-validation-service',
    baseUrl: `${BASE_URL}:4022`,
    port: 4022,
  },
  cohort: {
    name: 'rez-cohort-service',
    baseUrl: `${BASE_URL}:4027`,
    port: 4027,
  },
  currency: {
    name: 'rez-currency-service',
    baseUrl: `${BASE_URL}:4026`,
    port: 4026,
  },
  invoice: {
    name: 'rez-invoice-service',
    baseUrl: `${BASE_URL}:4028`,
    port: 4028,
  },
  menu: {
    name: 'rez-menu-service',
    baseUrl: `${BASE_URL}:4030`,
    port: 4030,
  },
  refund: {
    name: 'rez-refund-service',
    baseUrl: `${BASE_URL}:4031`,
    port: 4031,
  },
  tracking: {
    name: 'rez-tracking-service',
    baseUrl: `${BASE_URL}:4032`,
    port: 4032,
  },
};

// Test timeout
export const TEST_TIMEOUT = 30000;

// Generate unique test data
export function generateId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export function generateEmail(): string {
  return `test_${generateId('email')}@example.com`;
}

export function generatePhone(): string {
  return `+1${Date.now().toString().substring(5)}`;
}

// Generate random test data
export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomNumber(min: number = 1, max: number = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomBoolean(): boolean {
  return Math.random() > 0.5;
}

// Generate future date
export function generateFutureDate(days: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Generate past date
export function generatePastDate(days: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

// Format date to ISO string
export function formatDate(date: Date): string {
  return date.toISOString();
}

// Generate UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Create auth headers
export function createAuthHeaders(credentials?: AuthCredentials): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (credentials?.token) {
    headers['Authorization'] = `Bearer ${credentials.token}`;
  } else if (credentials?.apiKey) {
    headers['X-API-Key'] = credentials.apiKey;
  }

  return headers;
}

// Default test credentials (can be overridden by env)
export const TEST_AUTH: AuthCredentials = {
  token: process.env.TEST_AUTH_TOKEN || 'test-token-' + generateId(),
  apiKey: process.env.TEST_API_KEY || 'test-api-key-' + generateId(),
};

// Wait for service to be ready
export async function waitForService(
  baseUrl: string,
  maxAttempts: number = 30,
  interval: number = 1000
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        return true;
      }
    } catch {
      // Service not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return false;
}

// Skip test if service is not available
export async function isServiceAvailable(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Test data cleanup helper
export class TestDataCleanup {
  private items: Array<{ service: string; id: string; type: string }> = [];

  add(service: string, id: string, type: string = 'entity'): void {
    this.items.push({ service, id, type });
  }

  async cleanup(request: SuperTest<Test>): Promise<void> {
    for (const item of this.items) {
      try {
        await request.delete(`/${item.service}/${item.id}`);
      } catch {
        // Ignore cleanup errors
      }
    }
    this.items = [];
  }
}

// Create a new cleanup instance
export function createCleanup(): TestDataCleanup {
  return new TestDataCleanup();
}

// Retry helper for flaky tests
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Assert helpers
export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || 'Expected value to be defined');
  }
}

export function assertString(value: unknown, message?: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(message || 'Expected value to be a string');
  }
}

export function assertNumber(value: unknown, message?: string): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error(message || 'Expected value to be a number');
  }
}

export function assertObject(value: unknown, message?: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new Error(message || 'Expected value to be an object');
  }
}

export function assertArray(value: unknown, message?: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(message || 'Expected value to be an array');
  }
}

// Deep equality check
export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;
  if (obj1 === null || obj2 === null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const keys1 = Object.keys(obj1 as object);
  const keys2 = Object.keys(obj2 as object);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

// Pick random items from array
export function pickRandom<T>(array: T[], count: number = 1): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Mock data generators
export const mockAddress = {
  street: `${generateRandomNumber(1, 999)} ${pickRandom(['Main', 'Oak', 'Elm', 'Pine', 'Cedar'])} St`,
  city: pickRandom(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'])[0],
  state: pickRandom(['NY', 'CA', 'IL', 'TX', 'AZ'])[0],
  zipCode: `${generateRandomNumber(10000, 99999)}`,
  country: 'USA',
  coordinates: {
    lat: generateRandomNumber(30, 45) + Math.random(),
    lng: -(generateRandomNumber(70, 120) + Math.random()),
  },
};

export const mockMetadata = {
  source: 'integration-test',
  timestamp: new Date().toISOString(),
  runId: generateId(),
};

// Create error patterns for testing
export const ERROR_PATTERNS = {
  NOT_FOUND: /not found|doesn't exist|404/i,
  UNAUTHORIZED: /unauthorized|not authenticated|401/i,
  FORBIDDEN: /forbidden|permission denied|403/i,
  VALIDATION: /validation|invalid|400/i,
  SERVER_ERROR: /internal error|server error|500/i,
  CONFLICT: /conflict|already exists|409/i,
};

// HTTP status code helpers
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};
