/**
 * Simple Circuit Breaker
 *
 * States: CLOSED (normal) → OPEN (failing, fast-fail) → HALF_OPEN (test one request)
 * No external dependency — lightweight implementation for wrapping external API calls.
 */

import { logger } from '../config/logger';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold?: number; // Failures before opening (default: 5)
  resetTimeoutMs?: number; // Time before trying again (default: 30s)
  name?: string; // Name for logging
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30000;
    this.name = options.name ?? 'unknown';
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      // Check if reset timeout has elapsed → transition to HALF_OPEN
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`[CircuitBreaker:${this.name}] Circuit is OPEN — service unavailable`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      logger.info(`[CircuitBreaker:${this.name}] Recovery confirmed — circuit CLOSED`);
    }
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error(`[CircuitBreaker:${this.name}] Threshold reached (${this.failureCount}) — circuit OPEN`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getName(): string {
    return this.name;
  }
}

// Pre-configured circuit breakers for external services
export const razorpayCircuit = new CircuitBreaker({ name: 'razorpay', failureThreshold: 3, resetTimeoutMs: 60000 });
export const twilioCircuit = new CircuitBreaker({ name: 'twilio', failureThreshold: 3, resetTimeoutMs: 30000 });
export const cloudinaryCircuit = new CircuitBreaker({ name: 'cloudinary', failureThreshold: 5, resetTimeoutMs: 30000 });
export const stripeCircuit = new CircuitBreaker({ name: 'stripe', failureThreshold: 3, resetTimeoutMs: 60000 });

// Internal microservice circuit breakers
export const gamificationCircuit = new CircuitBreaker({
  name: 'gamification-service',
  failureThreshold: 3,
  resetTimeoutMs: 30000,
});
export const walletCircuit = new CircuitBreaker({ name: 'wallet-service', failureThreshold: 3, resetTimeoutMs: 30000 });
export const paymentCircuit = new CircuitBreaker({
  name: 'payment-service',
  failureThreshold: 3,
  resetTimeoutMs: 30000,
});
export const notificationCircuit = new CircuitBreaker({
  name: 'notification-service',
  failureThreshold: 5,
  resetTimeoutMs: 60000,
});
export const merchantCircuit = new CircuitBreaker({
  name: 'merchant-service',
  failureThreshold: 3,
  resetTimeoutMs: 30000,
});
export const catalogCircuit = new CircuitBreaker({
  name: 'catalog-service',
  failureThreshold: 3,
  resetTimeoutMs: 30000,
});
export const analyticsCircuit = new CircuitBreaker({
  name: 'analytics-service',
  failureThreshold: 5,
  resetTimeoutMs: 60000,
});
export const authCircuit = new CircuitBreaker({ name: 'auth-service', failureThreshold: 3, resetTimeoutMs: 30000 });

// Circuit registry for health reporting
const circuitRegistry = new Map<string, CircuitBreaker>([
  ['razorpay', razorpayCircuit],
  ['twilio', twilioCircuit],
  ['cloudinary', cloudinaryCircuit],
  ['stripe', stripeCircuit],
  ['gamification-service', gamificationCircuit],
  ['wallet-service', walletCircuit],
  ['payment-service', paymentCircuit],
  ['notification-service', notificationCircuit],
  ['merchant-service', merchantCircuit],
  ['catalog-service', catalogCircuit],
  ['analytics-service', analyticsCircuit],
  ['auth-service', authCircuit],
]);

export function getCircuit(name: string): CircuitBreaker {
  if (!circuitRegistry.has(name)) {
    circuitRegistry.set(name, new CircuitBreaker({ name, failureThreshold: 5, resetTimeoutMs: 30000 }));
  }
  return circuitRegistry.get(name)!;
}

export function getAllCircuitStatus(): Array<{ name: string; state: string; failureCount: number }> {
  return Array.from(circuitRegistry.values()).map((c) => ({
    name: c.getName(),
    state: c.getState(),
    failureCount: c.getFailureCount(),
  }));
}
