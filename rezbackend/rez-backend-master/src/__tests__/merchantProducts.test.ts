import request from 'supertest';

jest.mock('../services/redisService', () => {
  const cache: Record<string, any> = {};
  const mockClient = {
    get: async (k: string) => cache[k] ?? null,
    set: async (k: string, v: any) => {
      cache[k] = v;
      return 'OK';
    },
    del: async (k: string) => {
      delete cache[k];
      return 1;
    },
    sendCommand: async () => 1,
  };
  const svc = {
    isReady: () => true,
    getClient: () => mockClient,
    get: async (k: string) => cache[k] ?? null,
    set: async (k: string, v: any) => {
      cache[k] = v;
    },
    del: async (k: string) => {
      delete cache[k];
    },
    exists: async (k: string) => k in cache,
  };
  return { __esModule: true, default: svc };
});

jest.mock('../middleware/rateLimiter', () => {
  const passthrough = (_r: any, _s: any, next: any) => {
    if (typeof next === 'function') next();
  };
  const factory = () => passthrough;
  const factories = ['createRateLimiter', 'createProductLimiter', 'idempotencyMiddleware'];
  return new Proxy({}, { get: (_t: any, prop: string) => (factories.includes(prop) ? factory : passthrough) });
});

import { app } from '../server';
import { createTestMerchant, generateMerchantToken, createAuthHeaders } from './helpers/testUtils';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { Category } from '../models/Category';
import mongoose from 'mongoose';

// Helper to create a Product document directly in the DB with required fields
const makeProduct = (overrides: any) => ({
  slug: `test-slug-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  productType: 'product',
  pricing: { original: 100, selling: 100, currency: 'INR' },
  inventory: { stock: 10, isAvailable: true, unlimited: false },
  isActive: true,
  isFeatured: false,
  isDigital: false,
  ...overrides,
});

describe('Merchant Products', () => {
  let merchant: any;
  let token: string;
  let store: any;
  let category: any;

  beforeEach(async () => {
    merchant = await createTestMerchant();
    token = generateMerchantToken(merchant.id);

    // Create a category
    category = await Category.create({
      name: 'Test Category',
      slug: `test-category-${Date.now()}`,
      type: 'general',
      isActive: true,
    });

    // Create a store for the merchant
    store = await Store.create({
      name: 'Test Store',
      slug: `test-store-${Date.now()}`,
      merchantId: merchant._id,
      category: category._id,
      location: {
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
      },
      contact: {
        phone: '+1234567890',
        email: 'store@example.com',
      },
    });
  });

  describe('POST /api/merchant/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'This is a test product description that is long enough',
        price: 999,
        inventory: {
          stock: 50,
          lowStockThreshold: 5,
          trackInventory: true,
        },
        category: category._id.toString(),
        cashback: {
          percentage: 5,
          isActive: true,
        },
      };

      const response = await request(app)
        .post('/api/merchant/products')
        .set(createAuthHeaders(token))
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Test Product');
      expect(response.body.data.sku).toBeDefined();
      expect(response.body.data.pricing.selling).toBe(999);
    });

    it('should auto-generate SKU if not provided', async () => {
      const productData = {
        name: 'Auto SKU Product',
        description: 'Product without manual SKU that should auto-generate',
        price: 1999,
        inventory: {
          stock: 100,
        },
        category: category._id.toString(),
        cashback: {
          percentage: 10,
        },
      };

      const response = await request(app)
        .post('/api/merchant/products')
        .set(createAuthHeaders(token))
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body.data.sku).toBeDefined();
      expect(response.body.data.sku).toMatch(/^[A-Z]{3}\d+/);
    });

    it('should reject duplicate SKU', async () => {
      const sku = `TEST${Date.now()}`;

      // Create first product with SKU using Product model (route checks Product, not MProduct)
      await Product.create(
        makeProduct({
          name: 'First Product',
          description: 'First product with specific SKU',
          sku: sku,
          store: store._id,
          merchantId: merchant._id,
          category: category._id,
          pricing: { original: 100, selling: 100, currency: 'INR' },
          inventory: { stock: 10, isAvailable: true, unlimited: false },
        }),
      );

      // Try to create second product with same SKU via API
      const response = await request(app)
        .post('/api/merchant/products')
        .set(createAuthHeaders(token))
        .send({
          name: 'Second Product',
          description: 'Second product trying to use same SKU',
          sku: sku,
          price: 200,
          category: category._id.toString(),
          inventory: { stock: 20 },
          cashback: { percentage: 5 },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('SKU already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app).post('/api/merchant/products').set(createAuthHeaders(token)).send({
        name: 'Test',
        // Missing required fields
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app).post('/api/merchant/products').send({
        name: 'Test Product',
        description: 'This should fail without auth',
        price: 999,
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/merchant/products', () => {
    beforeEach(async () => {
      // Create test products using Product model (what the route actually queries)
      await Product.create([
        makeProduct({
          name: 'Product 1',
          slug: 'product-1-test001',
          description: 'First test product',
          sku: 'TEST001',
          store: store._id,
          merchantId: merchant._id,
          category: category._id,
          pricing: { original: 100, selling: 100, currency: 'INR' },
          inventory: { stock: 50, isAvailable: true, unlimited: false },
          isActive: true,
        }),
        makeProduct({
          name: 'Product 2',
          slug: 'product-2-test002',
          description: 'Second test product',
          sku: 'TEST002',
          store: store._id,
          merchantId: merchant._id,
          category: category._id,
          pricing: { original: 200, selling: 200, currency: 'INR' },
          inventory: { stock: 0, isAvailable: false, unlimited: false },
          isActive: true,
        }),
        makeProduct({
          name: 'Product 3',
          slug: 'product-3-test003',
          description: 'Third test product',
          sku: 'TEST003',
          store: store._id,
          merchantId: merchant._id,
          category: category._id,
          pricing: { original: 300, selling: 300, currency: 'INR' },
          inventory: { stock: 3, isAvailable: true, unlimited: false, lowStockThreshold: 5 },
          isActive: false,
        }),
      ]);
    });

    it('should get all merchant products', async () => {
      const response = await request(app).get('/api/merchant/products').set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(response.body.data.products.length).toBe(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      // status=active maps to isActive=true in the route
      const response = await request(app).get('/api/merchant/products?status=active').set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBe(2);
    });

    it('should filter by stock level', async () => {
      const response = await request(app)
        .get('/api/merchant/products?stockLevel=out_of_stock')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBe(1);
      expect(response.body.data.products[0].sku).toBe('TEST002');
    });

    it('should support pagination', async () => {
      const response = await request(app).get('/api/merchant/products?page=1&limit=2').set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.hasNext).toBe(true);
    });

    it('should sort products', async () => {
      const response = await request(app)
        .get('/api/merchant/products?sortBy=price&sortOrder=asc')
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body.data.products[0].pricing.selling).toBe(100);
      expect(response.body.data.products[2].pricing.selling).toBe(300);
    });
  });

  describe('GET /api/merchant/products/:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create(
        makeProduct({
          name: 'Single Product',
          slug: 'single-product-single001',
          description: 'Product for single retrieval',
          sku: 'SINGLE001',
          store: store._id,
          merchantId: merchant._id,
          category: category._id,
          pricing: { original: 500, selling: 500, currency: 'INR' },
          inventory: { stock: 25, isAvailable: true, unlimited: false },
        }),
      );
    });

    it('should get a single product by ID', async () => {
      const response = await request(app)
        .get(`/api/merchant/products/${testProduct._id}`)
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Single Product');
      expect(response.body.data.sku).toBe('SINGLE001');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/merchant/products/${fakeId}`).set(createAuthHeaders(token));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("should not allow access to another merchant's product", async () => {
      // Create another merchant and their store
      const otherMerchant = await createTestMerchant({ email: `other${Date.now()}@example.com` });
      const otherStore = await Store.create({
        name: 'Other Store',
        slug: `other-store-${Date.now()}`,
        merchantId: otherMerchant._id,
        category: category._id,
        location: {
          address: '456 Other St',
          city: 'Other City',
          state: 'Other State',
          pincode: '654321',
        },
        contact: {
          phone: '+9876543210',
          email: 'other@example.com',
        },
      });

      // Create product for other merchant (linked to their store, not ours)
      const otherProduct = await Product.create(
        makeProduct({
          name: 'Other Product',
          slug: `other-product-other001-${Date.now()}`,
          description: 'Product owned by another merchant',
          sku: `OTHER001-${Date.now()}`,
          store: otherStore._id,
          merchantId: otherMerchant._id,
          category: category._id,
          pricing: { original: 100, selling: 100, currency: 'INR' },
          inventory: { stock: 10, isAvailable: true, unlimited: false },
        }),
      );

      const response = await request(app)
        .get(`/api/merchant/products/${otherProduct._id}`)
        .set(createAuthHeaders(token));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/merchant/products/:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create(
        makeProduct({
          name: 'Update Test Product',
          slug: 'update-test-product-update001',
          description: 'Product to be updated',
          sku: 'UPDATE001',
          store: store._id,
          merchantId: merchant._id,
          category: category._id,
          pricing: { original: 300, selling: 300, currency: 'INR' },
          inventory: { stock: 15, isAvailable: true, unlimited: false },
        }),
      );
    });

    it('should update product fields', async () => {
      const updates = {
        name: 'Updated Product Name',
        price: 350,
        inventory: { stock: 20 },
      };

      const response = await request(app)
        .put(`/api/merchant/products/${testProduct._id}`)
        .set(createAuthHeaders(token))
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.product.name).toBe('Updated Product Name');
      expect(response.body.data.product.pricing.selling).toBe(350);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/merchant/products/${fakeId}`)
        .set(createAuthHeaders(token))
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/merchant/products/:id', () => {
    let testProduct: any;

    beforeEach(async () => {
      testProduct = await Product.create(
        makeProduct({
          name: 'Delete Test Product',
          slug: 'delete-test-product-delete001',
          description: 'Product to be deleted',
          sku: 'DELETE001',
          store: store._id,
          merchantId: merchant._id,
          category: category._id,
          pricing: { original: 150, selling: 150, currency: 'INR' },
          inventory: { stock: 5, isAvailable: true, unlimited: false },
        }),
      );
    });

    it('should delete a product', async () => {
      const response = await request(app)
        .delete(`/api/merchant/products/${testProduct._id}`)
        .set(createAuthHeaders(token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify product is deleted
      const deletedProduct = await Product.findById(testProduct._id);
      expect(deletedProduct).toBeNull();
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/api/merchant/products/${fakeId}`).set(createAuthHeaders(token));

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
