import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';
import request, { SuperTest, Test } from 'supertest';
import { ServiceConfig, AuthCredentials } from './shared/types';
import {
  SERVICES,
  TEST_AUTH,
  generateId,
  generateEmail,
  generateRandomString,
  createCleanup,
  HTTP_STATUS,
  waitForService,
} from './shared/utils';
import { ResponseAssertions, createRequest } from './shared/request-helpers';

// Base class for all service tests
export abstract class BaseServiceTest {
  protected agent: SuperTest<Test>;
  protected config: ServiceConfig;
  protected auth: AuthCredentials;
  protected cleanup = createCleanup();
  protected serviceAvailable = true;

  constructor(serviceKey: string, customConfig?: Partial<ServiceConfig>) {
    const serviceConfig = SERVICES[serviceKey];
    if (!serviceConfig) {
      throw new Error(`Service configuration not found for key: ${serviceKey}`);
    }
    this.config = { ...serviceConfig, ...customConfig };
    this.agent = request(this.config.baseUrl);
    this.auth = TEST_AUTH;
  }

  // Abstract methods to be implemented by subclasses
  abstract getResourcePath(): string;
  abstract getResourceName(): string;
  abstract generateValidEntity(): Record<string, unknown>;
  abstract updateValidEntity(existing: Record<string, unknown>): Record<string, unknown>;

  // Lifecycle methods
  async beforeAll(): Promise<void> {
    // Wait for service to be available
    this.serviceAvailable = await waitForService(this.config.baseUrl, 10, 2000);
    if (!this.serviceAvailable) {
      console.warn(`Service ${this.config.name} is not available at ${this.config.baseUrl}`);
    }
  }

  afterAll(): void {
    // Cleanup
  }

  beforeEach(): void {
    // Reset cleanup tracker
  }

  afterEach(): Promise<void> {
    return this.cleanup.cleanup(this.agent);
  }

  // Helper methods
  protected async createEntity(data?: Record<string, unknown>): Promise<{ id: string; body: unknown }> {
    const response = await this.agent
      .post(this.getResourcePath())
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.auth.token}`)
      .send(data || this.generateValidEntity());

    if (response.status === HTTP_STATUS.CREATED) {
      const id = this.extractId(response);
      if (id) {
        this.cleanup.add(this.config.name, id);
        return { id, body: response.body };
      }
    }

    return { id: '', body: response.body };
  }

  protected extractId(response: { body: { id?: string; _id?: string; data?: { id?: string } } }): string {
    return response.body?.id || response.body?._id || response.body?.data?.id || '';
  }

  protected async getEntity(id: string): Promise<request.Response> {
    return this.agent
      .get(`${this.getResourcePath()}/${id}`)
      .set('Authorization', `Bearer ${this.auth.token}`);
  }

  protected async updateEntity(id: string, data: Record<string, unknown>): Promise<request.Response> {
    return this.agent
      .put(`${this.getResourcePath()}/${id}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.auth.token}`)
      .send(data);
  }

  protected async patchEntity(id: string, data: Record<string, unknown>): Promise<request.Response> {
    return this.agent
      .patch(`${this.getResourcePath()}/${id}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.auth.token}`)
      .send(data);
  }

  protected async deleteEntity(id: string): Promise<request.Response> {
    return this.agent
      .delete(`${this.getResourcePath()}/${id}`)
      .set('Authorization', `Bearer ${this.auth.token}`);
  }

  protected async listEntities(params?: Record<string, string | number>): Promise<request.Response> {
    return this.agent
      .get(this.getResourcePath())
      .set('Authorization', `Bearer ${this.auth.token}`)
      .query(params || {});
  }

  // Authentication test methods
  async testUnauthorizedAccess(): Promise<void> {
    const response = await this.agent.get(this.getResourcePath());

    // Should either return 401 or require auth
    const isUnauthorized = response.status === HTTP_STATUS.UNAUTHORIZED;
    const requiresAuth = response.status === HTTP_STATUS.BAD_REQUEST &&
      JSON.stringify(response.body).toLowerCase().includes('auth');

    expect(isUnauthorized || requiresAuth).toBe(true);
  }

  async testInvalidToken(): Promise<void> {
    const response = await this.agent
      .get(this.getResourcePath())
      .set('Authorization', 'Bearer invalid-token');

    expect([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.FORBIDDEN]).toContain(response.status);
  }

  async testMissingApiKey(): Promise<void> {
    const response = await this.agent
      .get(this.getResourcePath())
      .set('X-API-Key', '');

    // Should require valid API key
    expect([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.FORBIDDEN]).toContain(response.status);
  }

  // CRUD test methods
  async testCreateValidEntity(): Promise<string> {
    const data = this.generateValidEntity();
    const response = await this.agent
      .post(this.getResourcePath())
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.auth.token}`)
      .send(data);

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(response.body).toBeDefined();
    expect(response.body.id || response.body._id).toBeDefined();

    const id = this.extractId(response);
    if (id) {
      this.cleanup.add(this.config.name, id);
    }
    return id;
  }

  async testCreateEntityWithMissingRequiredFields(): Promise<void> {
    const response = await this.agent
      .post(this.getResourcePath())
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.auth.token}`)
      .send({});

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
  }

  async testCreateEntityWithInvalidData(): Promise<void> {
    const response = await this.agent
      .post(this.getResourcePath())
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.auth.token}`)
      .send({ invalidField: 'invalidValue' });

    // Should either return 400 or 422
    expect([HTTP_STATUS.BAD_REQUEST, 422]).toContain(response.status);
  }

  async testGetExistingEntity(): Promise<string> {
    const id = await this.testCreateValidEntity();
    const response = await this.getEntity(id);

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(response.body).toBeDefined();
    return id;
  }

  async testGetNonExistentEntity(): Promise<void> {
    const fakeId = generateId('notfound');
    const response = await this.getEntity(fakeId);

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  }

  async testUpdateExistingEntity(): Promise<void> {
    const id = await this.testCreateValidEntity();
    const updateData = this.updateValidEntity({ id });

    const response = await this.updateEntity(id, updateData);
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(response.body).toBeDefined();
  }

  async testUpdateNonExistentEntity(): Promise<void> {
    const fakeId = generateId('notfound');
    const updateData = this.updateValidEntity({ id: fakeId });

    const response = await this.updateEntity(fakeId, updateData);
    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  }

  async testPartialUpdate(): Promise<void> {
    const { id } = await this.createEntity();
    const patchData = { name: `Updated ${generateRandomString()}` };

    const response = await this.patchEntity(id, patchData);
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(response.body.name).toBe(patchData.name);
  }

  async testDeleteExistingEntity(): Promise<void> {
    const { id } = await this.createEntity();

    const response = await this.deleteEntity(id);
    expect([HTTP_STATUS.OK, HTTP_STATUS.NO_CONTENT, HTTP_STATUS.ACCEPTED]).toContain(response.status);

    // Verify deletion
    const getResponse = await this.getEntity(id);
    expect(getResponse.status).toBe(HTTP_STATUS.NOT_FOUND);
  }

  async testDeleteNonExistentEntity(): Promise<void> {
    const fakeId = generateId('notfound');

    const response = await this.deleteEntity(fakeId);
    // Should return 404 or accept deletion gracefully
    expect([HTTP_STATUS.NOT_FOUND, HTTP_STATUS.NO_CONTENT]).toContain(response.status);
  }

  async testListEntities(): Promise<void> {
    // Create a few entities
    await this.testCreateValidEntity();
    await this.testCreateValidEntity();

    const response = await this.listEntities();
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(Array.isArray(response.body.data || response.body)).toBe(true);
  }

  async testListEntitiesWithPagination(): Promise<void> {
    // Create entities
    for (let i = 0; i < 5; i++) {
      await this.testCreateValidEntity();
    }

    const response = await this.listEntities({ page: 1, limit: 2 });
    expect(response.status).toBe(HTTP_STATUS.OK);

    if (response.body.pagination) {
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    }
  }

  async testListEntitiesWithFilters(): Promise<void> {
    const response = await this.listEntities({ sort: 'createdAt', order: 'desc' });
    expect(response.status).toBe(HTTP_STATUS.OK);
  }

  // Error handling tests
  async testInvalidJsonBody(): Promise<void> {
    const response = await this.agent
      .post(this.getResourcePath())
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${this.auth.token}`)
      .send('{"invalid json"}');

    expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.UNPROCESSABLE_ENTITY]).toContain(response.status);
  }

  async testMissingContentType(): Promise<void> {
    const data = this.generateValidEntity();
    const response = await this.agent
      .post(this.getResourcePath())
      .set('Authorization', `Bearer ${this.auth.token}`)
      .send(data);

    // May accept or reject based on service implementation
    expect([HTTP_STATUS.BAD_REQUEST, HTTP_STATUS.CREATED, HTTP_STATUS.OK]).toContain(response.status);
  }

  async testMethodNotAllowed(): Promise<void> {
    const response = await this.agent
      .options(this.getResourcePath())
      .set('Authorization', `Bearer ${this.auth.token}`);

    // Should return 405 or allow the request
    expect([HTTP_STATUS.METHOD_NOT_ALLOWED, HTTP_STATUS.OK, HTTP_STATUS.NO_CONTENT]).toContain(response.status);
  }

  async testRequestTimeout(): Promise<void> {
    // This test verifies timeout handling
    const response = await this.agent
      .get(`${this.getResourcePath()}?timeout_test=true`)
      .set('Authorization', `Bearer ${this.auth.token}`)
      .timeout({ deadline: 100 });

    // Should complete or timeout gracefully
    expect(response.status).toBeDefined();
  }

  // Health check test
  async testHealthCheck(): Promise<void> {
    const response = await this.agent.get('/health').set('Content-Type', 'application/json');

    if (this.serviceAvailable) {
      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(response.body.status).toBeDefined();
    } else {
      expect([HTTP_STATUS.SERVICE_UNAVAILABLE, HTTP_STATUS.NOT_FOUND]).toContain(response.status);
    }
  }
}

// Export helper to create service-specific test suites
export function createServiceTestSuite(
  serviceKey: string,
  resourcePath: string,
  resourceName: string,
  generator: () => Record<string, unknown>,
  updater: (existing: Record<string, unknown>) => Record<string, unknown>
) {
  return class extends BaseServiceTest {
    getResourcePath(): string {
      return resourcePath;
    }

    getResourceName(): string {
      return resourceName;
    }

    generateValidEntity(): Record<string, unknown> {
      return generator();
    }

    updateValidEntity(existing: Record<string, unknown>): Record<string, unknown> {
      return updater(existing);
    }
  };
}
