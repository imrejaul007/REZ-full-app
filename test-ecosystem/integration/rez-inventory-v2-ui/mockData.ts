/**
 * Mock Data for Inventory v2 UI Service Integration Tests
 * Provides realistic test data for product management, stock control, and warehouse operations
 */

export const products = {
  electronics: {
    id: 'prod_001',
    sku: 'ELEC-LAPTOP-001',
    name: 'MacBook Pro 14"',
    description: 'Apple MacBook Pro with M3 chip, 14-inch Liquid Retina XDR display',
    category: {
      id: 'cat_electronics',
      name: 'Electronics',
      path: 'Electronics > Computers > Laptops',
    },
    brand: 'Apple',
    basePrice: 1999.00,
    salePrice: 1899.00,
    currency: 'USD',
    status: 'active',
    tags: ['laptop', 'apple', 'professional', 'new'],
    images: [
      { url: 'https://cdn.example.com/products/prod_001/main.jpg', alt: 'MacBook Pro front view' },
      { url: 'https://cdn.example.com/products/prod_001/side.jpg', alt: 'MacBook Pro side view' },
    ],
    attributes: {
      color: 'Space Gray',
      storage: '512GB',
      ram: '16GB',
      processor: 'M3 Pro',
    },
    dimensions: {
      weight: 1.55,
      weightUnit: 'kg',
      height: 1.55,
      width: 31.26,
      depth: 22.12,
      dimensionUnit: 'cm',
    },
    createdAt: '2023-11-15T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
  },
  accessories: {
    id: 'prod_002',
    sku: 'ACCS-HEADPHONES-001',
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium over-ear headphones with active noise cancellation',
    category: {
      id: 'cat_accessories',
      name: 'Accessories',
      path: 'Accessories > Audio > Headphones',
    },
    brand: 'Sony',
    basePrice: 349.99,
    salePrice: null,
    currency: 'USD',
    status: 'active',
    tags: ['headphones', 'wireless', 'noise-cancelling', 'sale'],
    images: [
      { url: 'https://cdn.example.com/products/prod_002/main.jpg', alt: 'Headphones front view' },
    ],
    attributes: {
      color: 'Black',
      connectivity: 'Bluetooth 5.0',
      batteryLife: '30 hours',
    },
    createdAt: '2023-09-01T08:00:00Z',
    updatedAt: '2024-01-10T11:00:00Z',
  },
  discontinued: {
    id: 'prod_003',
    sku: 'ELEC-TABLET-OLD',
    name: 'Legacy Tablet Pro',
    description: 'Older model tablet - discontinued',
    category: {
      id: 'cat_electronics',
      name: 'Electronics',
    },
    brand: 'Generic',
    basePrice: 599.99,
    salePrice: 399.99,
    currency: 'USD',
    status: 'discontinued',
    tags: [],
    images: [],
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2023-06-01T00:00:00Z',
  },
};

export const inventory = {
  warehouses: [
    {
      id: 'wh_001',
      name: 'East Coast Distribution Center',
      code: 'ECDC',
      address: {
        line1: '500 Warehouse Blvd',
        city: 'Newark',
        state: 'NJ',
        postalCode: '07101',
        country: 'US',
      },
      type: 'distribution',
      capacity: 50000,
      currentUtilization: 72,
      manager: 'John Smith',
      contact: '+1-555-0100',
    },
    {
      id: 'wh_002',
      name: 'West Coast Fulfillment Hub',
      code: 'WCFH',
      address: {
        line1: '1200 Pacific Way',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
      },
      type: 'fulfillment',
      capacity: 75000,
      currentUtilization: 85,
      manager: 'Sarah Johnson',
      contact: '+1-555-0200',
    },
  ],
  stockLevels: [
    {
      productId: 'prod_001',
      warehouseId: 'wh_001',
      quantity: 150,
      reservedQuantity: 25,
      availableQuantity: 125,
      reorderPoint: 50,
      reorderQuantity: 100,
      lastRestocked: '2024-01-15T08:00:00Z',
      expiryDate: null,
    },
    {
      productId: 'prod_002',
      warehouseId: 'wh_001',
      quantity: 500,
      reservedQuantity: 50,
      availableQuantity: 450,
      reorderPoint: 100,
      reorderQuantity: 200,
      lastRestocked: '2024-01-10T14:00:00Z',
      expiryDate: null,
    },
    {
      productId: 'prod_001',
      warehouseId: 'wh_002',
      quantity: 200,
      reservedQuantity: 30,
      availableQuantity: 170,
      reorderPoint: 50,
      reorderQuantity: 100,
      lastRestocked: '2024-01-12T10:00:00Z',
      expiryDate: null,
    },
  ],
  lowStockAlerts: [
    {
      productId: 'prod_003',
      warehouseId: 'wh_001',
      currentQuantity: 8,
      reorderPoint: 50,
      severity: 'critical',
      createdAt: '2024-01-20T09:00:00Z',
    },
  ],
};

export const suppliers = {
  primary: {
    id: 'sup_001',
    name: 'TechSupply Global',
    code: 'TSG',
    contact: {
      name: 'Michael Brown',
      email: 'orders@techsupply.com',
      phone: '+1-555-0300',
    },
    address: {
      line1: '1000 Supplier Ave',
      city: 'Shenzhen',
      country: 'CN',
    },
    paymentTerms: 'Net 30',
    rating: 4.5,
    leadTimeDays: 14,
    minimumOrderValue: 5000,
    active: true,
  },
  secondary: {
    id: 'sup_002',
    name: 'QuickParts Inc',
    code: 'QPI',
    contact: {
      name: 'Emily Davis',
      email: 'sales@quickparts.com',
      phone: '+1-555-0400',
    },
    address: {
      line1: '500 Quick Street',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
    },
    paymentTerms: 'Net 15',
    rating: 4.2,
    leadTimeDays: 7,
    minimumOrderValue: 500,
    active: true,
  },
};

export const purchaseOrders = {
  draft: {
    id: 'po_001',
    supplierId: 'sup_001',
    status: 'draft',
    items: [
      {
        productId: 'prod_001',
        sku: 'ELEC-LAPTOP-001',
        quantity: 100,
        unitCost: 1500.00,
        totalCost: 150000.00,
      },
    ],
    subtotal: 150000.00,
    shippingCost: 2500.00,
    tax: 12200.00,
    total: 164700.00,
    expectedDelivery: '2024-02-15',
    createdAt: '2024-01-20T10:00:00Z',
  },
  pending: {
    id: 'po_002',
    supplierId: 'sup_002',
    status: 'pending_approval',
    items: [
      {
        productId: 'prod_002',
        sku: 'ACCS-HEADPHONES-001',
        quantity: 500,
        unitCost: 180.00,
        totalCost: 90000.00,
      },
    ],
    subtotal: 90000.00,
    shippingCost: 500.00,
    tax: 7240.00,
    total: 97740.00,
    expectedDelivery: '2024-01-30',
    createdAt: '2024-01-18T14:00:00Z',
  },
  completed: {
    id: 'po_003',
    supplierId: 'sup_001',
    status: 'received',
    items: [
      {
        productId: 'prod_001',
        sku: 'ELEC-LAPTOP-001',
        quantity: 50,
        unitCost: 1450.00,
        totalCost: 72500.00,
      },
    ],
    subtotal: 72500.00,
    shippingCost: 1200.00,
    tax: 5896.00,
    total: 79596.00,
    expectedDelivery: '2024-01-10',
    receivedAt: '2024-01-12T09:00:00Z',
    createdAt: '2023-12-20T10:00:00Z',
  },
};

export const transfers = {
  inTransit: {
    id: 'tr_001',
    sourceWarehouseId: 'wh_001',
    destinationWarehouseId: 'wh_002',
    status: 'in_transit',
    items: [
      {
        productId: 'prod_001',
        quantity: 30,
      },
    ],
    totalItems: 30,
    shippedAt: '2024-01-19T08:00:00Z',
    estimatedArrival: '2024-01-22T08:00:00Z',
    carrier: 'FedEx',
    trackingNumber: 'FX123456789',
  },
  pending: {
    id: 'tr_002',
    sourceWarehouseId: 'wh_002',
    destinationWarehouseId: 'wh_001',
    status: 'pending',
    items: [
      {
        productId: 'prod_002',
        quantity: 100,
      },
    ],
    totalItems: 100,
    createdAt: '2024-01-20T10:00:00Z',
  },
};

export const stockAdjustments = [
  {
    id: 'adj_001',
    productId: 'prod_001',
    warehouseId: 'wh_001',
    type: 'cycle_count',
    quantityChange: -2,
    reason: 'Damaged items found during inventory count',
    performedBy: 'usr_inventory_01',
    createdAt: '2024-01-15T14:00:00Z',
  },
  {
    id: 'adj_002',
    productId: 'prod_002',
    warehouseId: 'wh_001',
    type: 'return',
    quantityChange: 10,
    reason: 'Customer returns processed',
    performedBy: 'usr_returns_01',
    orderId: 'ord_123',
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'adj_003',
    productId: 'prod_001',
    warehouseId: 'wh_001',
    type: 'received',
    quantityChange: 100,
    reason: 'Purchase order received',
    performedBy: 'usr_receiving_01',
    purchaseOrderId: 'po_003',
    createdAt: '2024-01-12T09:00:00Z',
  },
];

export const barcodes = [
  {
    productId: 'prod_001',
    barcode: '1234567890123',
    type: 'EAN-13',
    warehouseId: 'wh_001',
    isPrimary: true,
  },
  {
    productId: 'prod_001',
    barcode: '012345678901',
    type: 'UPC-A',
    warehouseId: 'wh_001',
    isPrimary: false,
  },
  {
    productId: 'prod_002',
    barcode: '2345678901234',
    type: 'EAN-13',
    warehouseId: 'wh_001',
    isPrimary: true,
  },
];

export const categories = [
  {
    id: 'cat_electronics',
    name: 'Electronics',
    parentId: null,
    path: 'Electronics',
    level: 1,
    productCount: 1250,
    children: [
      {
        id: 'cat_computers',
        name: 'Computers',
        parentId: 'cat_electronics',
        path: 'Electronics > Computers',
        level: 2,
        productCount: 450,
      },
      {
        id: 'cat_audio',
        name: 'Audio',
        parentId: 'cat_electronics',
        path: 'Electronics > Audio',
        level: 2,
        productCount: 280,
      },
    ],
  },
  {
    id: 'cat_accessories',
    name: 'Accessories',
    parentId: null,
    path: 'Accessories',
    level: 1,
    productCount: 3200,
  },
];

export const inventoryReports = {
  valuation: {
    reportId: 'rpt_inv_val_001',
    generatedAt: '2024-01-20T00:00:00Z',
    totalValue: 2450000.00,
    currency: 'USD',
    byWarehouse: {
      'wh_001': { value: 1500000.00, itemCount: 45000 },
      'wh_002': { value: 950000.00, itemCount: 38000 },
    },
    byCategory: {
      Electronics: { value: 1800000.00, itemCount: 25000 },
      Accessories: { value: 650000.00, itemCount: 58000 },
    },
  },
  movement: {
    reportId: 'rpt_inv_mov_001',
    generatedAt: '2024-01-20T00:00:00Z',
    period: { start: '2024-01-01', end: '2024-01-19' },
    totalReceived: 5000,
    totalSold: 3200,
    totalReturned: 150,
    totalAdjusted: -25,
    netChange: 1925,
  },
};

export const apiEndpoints = {
  products: {
    list: '/api/v1/products',
    get: '/api/v1/products/:id',
    create: '/api/v1/products',
    update: '/api/v1/products/:id',
    delete: '/api/v1/products/:id',
    search: '/api/v1/products/search',
    categories: '/api/v1/products/categories',
  },
  inventory: {
    levels: '/api/v1/inventory/levels',
    adjust: '/api/v1/inventory/adjust',
    transfers: '/api/v1/inventory/transfers',
    warehouses: '/api/v1/inventory/warehouses',
    suppliers: '/api/v1/inventory/suppliers',
    purchaseOrders: '/api/v1/inventory/purchase-orders',
  },
  reports: {
    valuation: '/api/v1/inventory/reports/valuation',
    movement: '/api/v1/inventory/reports/movement',
    lowStock: '/api/v1/inventory/reports/low-stock',
  },
};

export const validationRules = {
  product: {
    sku: { required: true, pattern: /^[A-Z]{4}-[A-Z]{4,10}-[0-9]{3}$/ },
    name: { required: true, minLength: 2, maxLength: 200 },
    price: { required: true, min: 0.01 },
    quantity: { required: true, min: 0 },
  },
  warehouse: {
    code: { required: true, pattern: /^[A-Z]{4}$/ },
    name: { required: true, minLength: 2, maxLength: 100 },
  },
  purchaseOrder: {
    items: { required: true, min: 1 },
    total: { min: 0 },
  },
};
