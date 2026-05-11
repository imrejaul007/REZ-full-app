import request, { SuperTest, Test, Response } from 'supertest';
import { ServiceConfig, AuthCredentials } from './types';
import { createAuthHeaders, TEST_AUTH, HTTP_STATUS } from './utils';

// Request builder for fluent API
export class RequestBuilder {
  private agent: SuperTest<Test>;
  private path: string;
  private method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  private headers: Record<string, string> = { 'Content-Type': 'application/json' };
  private body?: Record<string, unknown>;
  private queryParams: Record<string, string> = {};

  constructor(baseUrl: string, path: string, method: 'get' | 'post' | 'put' | 'patch' | 'delete') {
    this.agent = request(baseUrl);
    this.path = path;
    this.method = method;
  }

  withAuth(credentials?: AuthCredentials): this {
    const auth = credentials || TEST_AUTH;
    Object.assign(this.headers, createAuthHeaders(auth));
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    Object.assign(this.headers, headers);
    return this;
  }

  withBody(body: Record<string, unknown>): this {
    this.body = body;
    return this;
  }

  withQuery(params: Record<string, string | number>): this {
    Object.assign(this.queryParams, params);
    return this;
  }

  withId(id: string): this {
    this.path = `${this.path}/${id}`;
    return this;
  }

  async execute(): Promise<Response> {
    let req = this.agent[this.method](this.path);

    // Apply headers
    Object.entries(this.headers).forEach(([key, value]) => {
      req = req.set(key, value);
    });

    // Apply query params
    if (Object.keys(this.queryParams).length > 0) {
      req = req.query(this.queryParams);
    }

    // Apply body for methods that support it
    if (this.body && ['post', 'put', 'patch'].includes(this.method)) {
      req = req.send(this.body);
    }

    return req;
  }

  async get(): Promise<Response> {
    return this.execute();
  }

  async post(): Promise<Response> {
    return this.execute();
  }

  async put(): Promise<Response> {
    return this.execute();
  }

  async patch(): Promise<Response> {
    return this.execute();
  }

  async delete(): Promise<Response> {
    return this.execute();
  }
}

// CRUD helpers
export class CrudOperations<T extends { id?: string }> {
  constructor(
    private agent: SuperTest<Test>,
    private baseUrl: string,
    private resourcePath: string,
    private auth?: AuthCredentials
  ) {}

  async create(data: Record<string, unknown>): Promise<Response> {
    return request(this.baseUrl)
      .post(this.resourcePath)
      .set('Content-Type', 'application/json')
      .set(createAuthHeaders(this.auth))
      .send(data);
  }

  async getById(id: string): Promise<Response> {
    return request(this.baseUrl)
      .get(`${this.resourcePath}/${id}`)
      .set(createAuthHeaders(this.auth));
  }

  async getAll(params?: Record<string, string | number>): Promise<Response> {
    return request(this.baseUrl)
      .get(this.resourcePath)
      .set(createAuthHeaders(this.auth))
      .query(params || {});
  }

  async update(id: string, data: Record<string, unknown>): Promise<Response> {
    return request(this.baseUrl)
      .put(`${this.resourcePath}/${id}`)
      .set('Content-Type', 'application/json')
      .set(createAuthHeaders(this.auth))
      .send(data);
  }

  async patch(id: string, data: Record<string, unknown>): Promise<Response> {
    return request(this.baseUrl)
      .patch(`${this.resourcePath}/${id}`)
      .set('Content-Type', 'application/json')
      .set(createAuthHeaders(this.auth))
      .send(data);
  }

  async delete(id: string): Promise<Response> {
    return request(this.baseUrl)
      .delete(`${this.resourcePath}/${id}`)
      .set(createAuthHeaders(this.auth));
  }

  async list(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    filters?: Record<string, string>;
  }): Promise<Response> {
    const query: Record<string, string> = {};
    if (params?.page) query.page = String(params.page);
    if (params?.limit) query.limit = String(params.limit);
    if (params?.sort) query.sort = params.sort;
    if (params?.order) query.order = params.order;
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        query[`filter_${key}`] = value;
      });
    }

    return request(this.baseUrl)
      .get(this.resourcePath)
      .set(createAuthHeaders(this.auth))
      .query(query);
  }
}

// Response assertions
export class ResponseAssertions {
  static isSuccess(response: Response): void {
    const status = response.status;
    const isSuccess = status >= 200 && status < 300;
    if (!isSuccess) {
      throw new Error(
        `Expected success status (2xx), got ${status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  static isCreated(response: Response): void {
    if (response.status !== HTTP_STATUS.CREATED) {
      throw new Error(
        `Expected status 201, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  static isNoContent(response: Response): void {
    if (response.status !== HTTP_STATUS.NO_CONTENT) {
      throw new Error(
        `Expected status 204, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  static isBadRequest(response: Response): void {
    if (response.status !== HTTP_STATUS.BAD_REQUEST) {
      throw new Error(
        `Expected status 400, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  static isUnauthorized(response: Response): void {
    if (response.status !== HTTP_STATUS.UNAUTHORIZED) {
      throw new Error(
        `Expected status 401, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  static isForbidden(response: Response): void {
    if (response.status !== HTTP_STATUS.FORBIDDEN) {
      throw new Error(
        `Expected status 403, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  static isNotFound(response: Response): void {
    if (response.status !== HTTP_STATUS.NOT_FOUND) {
      throw new Error(
        `Expected status 404, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  static isConflict(response: Response): void {
    if (response.status !== HTTP_STATUS.CONFLICT) {
      throw new Error(
        `Expected status 409, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  static hasProperty(response: Response, property: string): void {
    if (!response.body || !(property in response.body)) {
      throw new Error(`Response body does not have property: ${property}`);
    }
  }

  static hasData(response: Response): void {
    if (!response.body || !('data' in response.body)) {
      throw new Error('Response body does not have data property');
    }
  }

  static hasError(response: Response): void {
    if (!response.body || !('error' in response.body)) {
      throw new Error('Response body does not have error property');
    }
  }

  static hasPagination(response: Response): void {
    if (!response.body || !('pagination' in response.body)) {
      throw new Error('Response body does not have pagination property');
    }
    const pagination = response.body.pagination;
    if (!('page' in pagination) || !('limit' in pagination) || !('total' in pagination)) {
      throw new Error('Pagination object is missing required properties');
    }
  }
}

// Create request builder
export function createRequest(
  baseUrl: string,
  path: string,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get'
): RequestBuilder {
  return new RequestBuilder(baseUrl, path, method);
}

// Create CRUD operations
export function createCrudOperations<T extends { id?: string }>(
  baseUrl: string,
  resourcePath: string,
  auth?: AuthCredentials
): CrudOperations<T> {
  return new CrudOperations<T>(request(baseUrl), baseUrl, resourcePath, auth);
}

// Create service test client
export function createServiceClient(config: ServiceConfig, auth?: AuthCredentials) {
  const agent = request(config.baseUrl);

  return {
    agent,
    config,
    auth: auth || TEST_AUTH,

    // Health check
    async health(): Promise<Response> {
      return agent.get('/health').set('Content-Type', 'application/json');
    },

    // CRUD operations
    create: (data: Record<string, unknown>) =>
      new CrudOperations(agent, config.baseUrl, '', auth).create(data),
    getById: (id: string) =>
      new CrudOperations(agent, config.baseUrl, '', auth).getById(id),
    getAll: (params?: Record<string, string | number>) =>
      new CrudOperations(agent, config.baseUrl, '', auth).getAll(params),
    update: (id: string, data: Record<string, unknown>) =>
      new CrudOperations(agent, config.baseUrl, '', auth).update(id, data),
    patch: (id: string, data: Record<string, unknown>) =>
      new CrudOperations(agent, config.baseUrl, '', auth).patch(id, data),
    delete: (id: string) =>
      new CrudOperations(agent, config.baseUrl, '', auth).delete(id),

    // Request builder
    request: (path: string, method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get') =>
      new RequestBuilder(config.baseUrl, path, method).withAuth(auth || TEST_AUTH),
  };
}

// Export default client factory
export default createServiceClient;
