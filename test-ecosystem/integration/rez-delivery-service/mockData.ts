/**
 * Mock Data for Delivery Service Integration Tests
 * Provides realistic test data for order fulfillment, shipping, tracking, and logistics
 */

export const orders = {
  pending: {
    id: 'ord_001',
    customerId: 'cust_001',
    status: 'pending',
    items: [
      { productId: 'prod_001', name: 'Laptop', quantity: 1, price: 999.99 },
      { productId: 'prod_002', name: 'Mouse', quantity: 2, price: 29.99 },
    ],
    shippingAddress: {
      name: 'John Doe',
      line1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
    subtotal: 1059.97,
    shippingCost: 9.99,
    tax: 84.80,
    total: 1154.76,
    createdAt: '2024-01-20T10:00:00Z',
  },
  processing: {
    id: 'ord_002',
    customerId: 'cust_002',
    status: 'processing',
    items: [
      { productId: 'prod_003', name: 'Headphones', quantity: 1, price: 199.99 },
    ],
    shippingAddress: {
      name: 'Jane Smith',
      line1: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
    },
    subtotal: 199.99,
    shippingCost: 0,
    tax: 16.00,
    total: 215.99,
    createdAt: '2024-01-19T14:30:00Z',
    paymentConfirmedAt: '2024-01-19T14:35:00Z',
  },
  shipped: {
    id: 'ord_003',
    customerId: 'cust_003',
    status: 'shipped',
    items: [
      { productId: 'prod_004', name: 'Monitor', quantity: 1, price: 399.99 },
    ],
    shippingAddress: {
      name: 'Bob Wilson',
      line1: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
    },
    subtotal: 399.99,
    shippingCost: 14.99,
    tax: 33.20,
    total: 448.18,
    createdAt: '2024-01-18T09:00:00Z',
    shippedAt: '2024-01-19T16:00:00Z',
    trackingNumber: 'TRK1234567890',
    carrier: 'UPS',
    estimatedDelivery: '2024-01-22',
  },
  delivered: {
    id: 'ord_004',
    customerId: 'cust_001',
    status: 'delivered',
    items: [
      { productId: 'prod_005', name: 'Keyboard', quantity: 1, price: 79.99 },
    ],
    shippingAddress: {
      name: 'John Doe',
      line1: '123 Main St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
    subtotal: 79.99,
    shippingCost: 5.99,
    tax: 6.88,
    total: 92.86,
    createdAt: '2024-01-15T11:00:00Z',
    shippedAt: '2024-01-16T10:00:00Z',
    deliveredAt: '2024-01-18T14:30:00Z',
    trackingNumber: 'TRK0987654321',
    carrier: 'FedEx',
  },
  returned: {
    id: 'ord_005',
    customerId: 'cust_004',
    status: 'returned',
    items: [
      { productId: 'prod_006', name: 'Camera', quantity: 1, price: 599.99 },
    ],
    subtotal: 599.99,
    shippingCost: 0,
    tax: 48.00,
    total: 647.99,
    createdAt: '2024-01-10T08:00:00Z',
    shippedAt: '2024-01-11T09:00:00Z',
    deliveredAt: '2024-01-14T11:00:00Z',
    returnRequestedAt: '2024-01-16T10:00:00Z',
    returnReason: 'Item not as described',
  },
};

export const shipments = {
  active: {
    id: 'ship_001',
    orderId: 'ord_003',
    status: 'in_transit',
    carrier: 'UPS',
    service: 'Ground',
    trackingNumber: 'TRK1234567890',
    weight: 12.5,
    weightUnit: 'lbs',
    dimensions: {
      length: 24,
      width: 18,
      height: 12,
      unit: 'in',
    },
    origin: {
      warehouseId: 'wh_001',
      address: '500 Warehouse Blvd, Newark, NJ 07101',
    },
    destination: {
      address: '789 Pine St, Chicago, IL 60601',
      contact: 'Bob Wilson',
      phone: '+1-555-0303',
    },
    events: [
      {
        timestamp: '2024-01-19T16:00:00Z',
        status: 'picked_up',
        location: 'Newark, NJ',
        description: 'Package picked up by carrier',
      },
      {
        timestamp: '2024-01-19T20:00:00Z',
        status: 'in_transit',
        location: 'Newark, NJ',
        description: 'Package in transit to destination',
      },
      {
        timestamp: '2024-01-20T08:00:00Z',
        status: 'in_transit',
        location: 'Columbus, OH',
        description: 'Package arrived at sort facility',
      },
    ],
    estimatedDelivery: '2024-01-22T18:00:00Z',
  },
  international: {
    id: 'ship_002',
    orderId: 'ord_intl_001',
    status: 'in_transit',
    carrier: 'DHL',
    service: 'Express Worldwide',
    trackingNumber: 'DHL1234567890',
    customs: {
      declaredValue: 500.00,
      currency: 'USD',
      hsCode: '847130',
      description: 'Laptop Computer',
    },
    events: [
      {
        timestamp: '2024-01-19T12:00:00Z',
        status: 'exported',
        location: 'New York, US',
        description: 'Package exported',
      },
      {
        timestamp: '2024-01-20T06:00:00Z',
        status: 'customs_clearance',
        location: 'London, UK',
        description: 'Cleared customs',
      },
    ],
    estimatedDelivery: '2024-01-21T12:00:00Z',
  },
};

export const carriers = [
  {
    id: 'carrier_ups',
    name: 'UPS',
    code: 'UPS',
    services: [
      { id: 'ups_ground', name: 'UPS Ground', estimatedDays: '3-5', baseRate: 9.99 },
      { id: 'ups_2day', name: 'UPS 2nd Day Air', estimatedDays: '2', baseRate: 14.99 },
      { id: 'ups_overnight', name: 'UPS Overnight', estimatedDays: '1', baseRate: 24.99 },
    ],
    active: true,
  },
  {
    id: 'carrier_fedex',
    name: 'FedEx',
    code: 'FDX',
    services: [
      { id: 'fedex_ground', name: 'FedEx Ground', estimatedDays: '3-5', baseRate: 8.99 },
      { id: 'fedex_express', name: 'FedEx Express Saver', estimatedDays: '3', baseRate: 12.99 },
      { id: 'fedex_priority', name: 'FedEx Priority Overnight', estimatedDays: '1', baseRate: 29.99 },
    ],
    active: true,
  },
  {
    id: 'carrier_usps',
    name: 'USPS',
    code: 'USPS',
    services: [
      { id: 'usps_priority', name: 'Priority Mail', estimatedDays: '2-3', baseRate: 7.99 },
      { id: 'usps_express', name: 'Priority Mail Express', estimatedDays: '1-2', baseRate: 22.50 },
    ],
    active: true,
  },
];

export const shippingRates = {
  standard: {
    baseRate: 5.99,
    freeThreshold: 50.00,
    weightLimit: 5,
    estimatedDays: '5-7',
  },
  express: {
    baseRate: 12.99,
    weightLimit: 10,
    estimatedDays: '2-3',
  },
  overnight: {
    baseRate: 24.99,
    weightLimit: 5,
    estimatedDays: '1',
  },
};

export const returns = {
  pending: {
    id: 'ret_001',
    orderId: 'ord_005',
    status: 'pending',
    reason: 'Item not as described',
    items: [
      { productId: 'prod_006', name: 'Camera', quantity: 1, price: 599.99 },
    ],
    refundAmount: 647.99,
    requestedAt: '2024-01-16T10:00:00Z',
    customerNote: 'The camera does not match the photos on the website.',
  },
  approved: {
    id: 'ret_002',
    orderId: 'ord_006',
    status: 'approved',
    reason: 'Changed mind',
    items: [
      { productId: 'prod_007', name: 'Tablet', quantity: 1, price: 349.99 },
    ],
    refundAmount: 349.99,
    returnLabel: {
      trackingNumber: 'RET1234567890',
      carrier: 'UPS',
      expiresAt: '2024-01-30T23:59:59Z',
    },
    requestedAt: '2024-01-18T14:00:00Z',
    approvedAt: '2024-01-19T09:00:00Z',
  },
  received: {
    id: 'ret_003',
    orderId: 'ord_007',
    status: 'received',
    reason: 'Defective product',
    items: [
      { productId: 'prod_008', name: 'Speaker', quantity: 1, price: 149.99 },
    ],
    refundAmount: 149.99,
    requestedAt: '2024-01-15T11:00:00Z',
    receivedAt: '2024-01-19T15:00:00Z',
    refundProcessedAt: '2024-01-19T16:00:00Z',
  },
};

export const deliveryZones = [
  {
    id: 'zone_continental',
    name: 'Continental US',
    states: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'],
    baseRate: 5.99,
    estimatedDays: '5-7',
  },
  {
    id: 'zone_alaska',
    name: 'Alaska',
    states: ['AK'],
    baseRate: 19.99,
    estimatedDays: '7-10',
  },
  {
    id: 'zone_hawaii',
    name: 'Hawaii',
    states: ['HI'],
    baseRate: 24.99,
    estimatedDays: '7-14',
  },
  {
    id: 'zone_po_box',
    name: 'PO Boxes',
    states: [],
    baseRate: 7.99,
    estimatedDays: '7-10',
    restrictions: 'Cannot ship large/heavy items',
  },
];

export const trackingEvents = [
  {
    shipmentId: 'ship_001',
    timestamp: '2024-01-19T16:00:00Z',
    status: 'label_created',
    location: 'Newark, NJ',
    description: 'Shipping label created',
  },
  {
    shipmentId: 'ship_001',
    timestamp: '2024-01-19T16:00:00Z',
    status: 'picked_up',
    location: 'Newark, NJ',
    description: 'Package picked up',
  },
  {
    shipmentId: 'ship_001',
    timestamp: '2024-01-19T20:00:00Z',
    status: 'in_transit',
    location: 'Newark, NJ',
    description: 'Departed facility',
  },
  {
    shipmentId: 'ship_001',
    timestamp: '2024-01-20T08:00:00Z',
    status: 'in_transit',
    location: 'Columbus, OH',
    description: 'Arrived at sort facility',
  },
  {
    shipmentId: 'ship_001',
    timestamp: '2024-01-20T14:00:00Z',
    status: 'in_transit',
    location: 'Indianapolis, IN',
    description: 'Departed facility',
  },
];

export const deliveryMetrics = {
  summary: {
    totalShipments: 15234,
    onTimeRate: 94.5,
    averageDeliveryDays: 3.2,
    failedDeliveries: 234,
    returnedPackages: 456,
  },
  byCarrier: {
    UPS: { shipments: 6234, onTimeRate: 95.2 },
    FedEx: { shipments: 5890, onTimeRate: 94.8 },
    USPS: { shipments: 3110, onTimeRate: 93.1 },
  },
  byZone: {
    'Continental US': { shipments: 14200, avgDays: 3.0 },
    'Alaska': { shipments: 534, avgDays: 7.5 },
    'Hawaii': { shipments: 500, avgDays: 8.2 },
  },
};

export const apiEndpoints = {
  orders: {
    list: '/api/v1/delivery/orders',
    get: '/api/v1/delivery/orders/:id',
    create: '/api/v1/delivery/orders',
    cancel: '/api/v1/delivery/orders/:id/cancel',
  },
  shipments: {
    list: '/api/v1/delivery/shipments',
    get: '/api/v1/delivery/shipments/:id',
    track: '/api/v1/delivery/shipments/:id/track',
    create: '/api/v1/delivery/shipments',
  },
  returns: {
    request: '/api/v1/delivery/returns/request',
    list: '/api/v1/delivery/returns',
    approve: '/api/v1/delivery/returns/:id/approve',
    receive: '/api/v1/delivery/returns/:id/receive',
  },
  rates: {
    calculate: '/api/v1/delivery/rates/calculate',
    zones: '/api/v1/delivery/rates/zones',
  },
};
