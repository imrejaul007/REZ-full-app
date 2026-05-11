/**
 * Mock Data for Customer Platform UI Service Integration Tests
 * Provides realistic test data for user management, authentication, and customer interactions
 */

export const userProfiles = {
  standard: {
    id: 'usr_001',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-0123',
    dateOfBirth: '1985-06-15',
    createdAt: '2023-03-20T10:30:00Z',
    updatedAt: '2024-01-15T14:22:00Z',
    status: 'active',
    emailVerified: true,
    phoneVerified: true,
    preferences: {
      language: 'en',
      currency: 'USD',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      marketingOptIn: true,
    },
    addresses: [
      {
        id: 'addr_001',
        type: 'shipping',
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: true,
      },
      {
        id: 'addr_002',
        type: 'billing',
        line1: '456 Oak Avenue',
        city: 'Brooklyn',
        state: 'NY',
        postalCode: '11201',
        country: 'US',
        isDefault: true,
      },
    ],
    loyaltyTier: 'silver',
    loyaltyPoints: 2500,
  },
  vip: {
    id: 'usr_002',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1-555-0456',
    dateOfBirth: '1980-02-28',
    createdAt: '2022-01-10T08:00:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
    status: 'active',
    emailVerified: true,
    phoneVerified: true,
    preferences: {
      language: 'en',
      currency: 'EUR',
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
      marketingOptIn: false,
    },
    addresses: [
      {
        id: 'addr_003',
        type: 'shipping',
        line1: '789 Park Boulevard',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
        isDefault: true,
      },
    ],
    loyaltyTier: 'platinum',
    loyaltyPoints: 45000,
  },
  guest: {
    id: 'guest_abc123',
    email: null,
    firstName: 'Guest',
    lastName: 'User',
    phone: null,
    createdAt: '2024-01-20T12:00:00Z',
    status: 'guest',
    emailVerified: false,
    phoneVerified: false,
    sessionId: 'sess_guest_xyz',
  },
};

export const authenticationData = {
  loginSuccess: {
    userId: 'usr_001',
    email: 'john.doe@example.com',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    refreshToken: 'rt_abc123def456',
    expiresIn: 3600,
    tokenType: 'Bearer',
    issuedAt: '2024-01-20T10:00:00Z',
  },
  loginFailure: {
    error: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
    statusCode: 401,
  },
  passwordReset: {
    token: 'pr_reset_token_xyz',
    expiresIn: 900, // 15 minutes
    email: 'john.doe@example.com',
    requestedAt: '2024-01-20T10:00:00Z',
  },
  twoFactor: {
    enabled: true,
    methods: ['authenticator', 'sms'],
    defaultMethod: 'authenticator',
    backupCodes: ['ABCD-1234', 'EFGH-5678', 'IJKL-9012'],
  },
  session: {
    id: 'sess_abc123',
    userId: 'usr_001',
    deviceId: 'dev_xyz789',
    deviceType: 'mobile',
    browser: 'Safari Mobile',
    os: 'iOS 17',
    ipAddress: '192.168.1.100',
    location: {
      country: 'US',
      city: 'New York',
      timezone: 'America/New_York',
    },
    createdAt: '2024-01-20T09:00:00Z',
    lastActivity: '2024-01-20T10:30:00Z',
    expiresAt: '2024-01-21T09:00:00Z',
  },
};

export const orders = {
  pending: {
    id: 'ord_001',
    userId: 'usr_001',
    status: 'pending',
    items: [
      {
        productId: 'prod_001',
        name: 'MacBook Pro 14"',
        quantity: 1,
        unitPrice: 1999.00,
        totalPrice: 1999.00,
      },
      {
        productId: 'prod_002',
        name: 'USB-C Cable',
        quantity: 2,
        unitPrice: 19.99,
        totalPrice: 39.98,
      },
    ],
    subtotal: 2038.98,
    tax: 163.12,
    shipping: 0,
    total: 2202.10,
    shippingAddress: 'addr_001',
    paymentMethod: 'card_ending_4242',
    createdAt: '2024-01-20T10:00:00Z',
  },
  completed: {
    id: 'ord_002',
    userId: 'usr_001',
    status: 'delivered',
    items: [
      {
        productId: 'prod_003',
        name: 'Wireless Headphones',
        quantity: 1,
        unitPrice: 299.99,
        totalPrice: 299.99,
      },
    ],
    subtotal: 299.99,
    tax: 24.00,
    shipping: 5.99,
    total: 329.98,
    shippingAddress: 'addr_001',
    paymentMethod: 'card_ending_4242',
    createdAt: '2024-01-15T14:30:00Z',
    shippedAt: '2024-01-16T09:00:00Z',
    deliveredAt: '2024-01-18T14:00:00Z',
  },
  cancelled: {
    id: 'ord_003',
    userId: 'usr_001',
    status: 'cancelled',
    items: [
      {
        productId: 'prod_004',
        name: 'External Monitor',
        quantity: 1,
        unitPrice: 449.99,
        totalPrice: 449.99,
      },
    ],
    subtotal: 449.99,
    tax: 36.00,
    shipping: 0,
    total: 485.99,
    cancelledAt: '2024-01-17T11:00:00Z',
    cancellationReason: 'Customer requested cancellation',
  },
};

export const paymentMethods = {
  creditCard: {
    id: 'card_001',
    userId: 'usr_001',
    type: 'visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2026,
    cardholderName: 'JOHN DOE',
    isDefault: true,
    billingAddress: 'addr_002',
    createdAt: '2023-06-15T10:00:00Z',
  },
  paypal: {
    id: 'pp_001',
    userId: 'usr_001',
    type: 'paypal',
    email: 'john.doe@paypal.com',
    isDefault: false,
    linkedAt: '2023-08-20T15:30:00Z',
  },
};

export const reviews = {
  productReviews: [
    {
      id: 'rev_001',
      userId: 'usr_001',
      productId: 'prod_003',
      orderId: 'ord_002',
      rating: 5,
      title: 'Excellent sound quality!',
      content: 'These headphones are amazing. The noise cancellation is top-notch.',
      images: ['https://example.com/review1.jpg'],
      verifiedPurchase: true,
      helpfulCount: 24,
      createdAt: '2024-01-19T10:00:00Z',
      status: 'approved',
    },
    {
      id: 'rev_002',
      userId: 'usr_003',
      productId: 'prod_001',
      rating: 4,
      title: 'Great laptop, minor issues',
      content: 'Love the performance but the keyboard could be better.',
      images: [],
      verifiedPurchase: true,
      helpfulCount: 12,
      createdAt: '2024-01-18T15:30:00Z',
      status: 'approved',
    },
  ],
};

export const wishlistItems = [
  {
    id: 'wish_001',
    userId: 'usr_001',
    productId: 'prod_005',
    name: 'iPad Pro 12.9"',
    price: 1099.00,
    addedAt: '2024-01-10T09:00:00Z',
    inStock: true,
    priceDropped: false,
  },
  {
    id: 'wish_002',
    userId: 'usr_001',
    productId: 'prod_006',
    name: 'Apple Pencil',
    price: 129.00,
    addedAt: '2024-01-12T14:30:00Z',
    inStock: false,
    priceDropped: true,
    previousPrice: 149.00,
  },
];

export const notifications = {
  emailTemplates: [
    {
      id: 'tmpl_welcome',
      name: 'Welcome Email',
      subject: 'Welcome to ReZ, {{firstName}}!',
      trigger: 'user_registration',
      active: true,
    },
    {
      id: 'tmpl_order_confirm',
      name: 'Order Confirmation',
      subject: 'Your Order #{{orderId}} is Confirmed',
      trigger: 'order_created',
      active: true,
    },
    {
      id: 'tmpl_shipment',
      name: 'Shipment Notification',
      subject: 'Your Order #{{orderId}} Has Shipped',
      trigger: 'order_shipped',
      active: true,
    },
    {
      id: 'tmpl_password_reset',
      name: 'Password Reset',
      subject: 'Reset Your Password',
      trigger: 'password_reset_request',
      active: true,
    },
  ],
  pushNotifications: [
    {
      id: 'push_001',
      userId: 'usr_001',
      title: 'Order Delivered!',
      body: 'Your order #ord_002 has been delivered.',
      data: { orderId: 'ord_002' },
      sentAt: '2024-01-18T14:00:00Z',
      read: true,
    },
  ],
};

export const loyaltyProgram = {
  tiers: [
    { name: 'bronze', minPoints: 0, maxPoints: 999, discountPercent: 0 },
    { name: 'silver', minPoints: 1000, maxPoints: 4999, discountPercent: 5 },
    { name: 'gold', minPoints: 5000, maxPoints: 9999, discountPercent: 10 },
    { name: 'platinum', minPoints: 10000, maxPoints: null, discountPercent: 15 },
  ],
  transactions: [
    {
      id: 'loyalty_001',
      userId: 'usr_001',
      type: 'earn',
      points: 220,
      balance: 2500,
      description: 'Purchase reward - Order #ord_002',
      orderId: 'ord_002',
      createdAt: '2024-01-18T14:00:00Z',
    },
    {
      id: 'loyalty_002',
      userId: 'usr_001',
      type: 'redeem',
      points: -500,
      balance: 2000,
      description: 'Redeemed for $5 discount',
      orderId: 'ord_001',
      createdAt: '2024-01-20T10:00:00Z',
    },
  ],
};

export const apiEndpoints = {
  auth: {
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    register: '/api/v1/auth/register',
    refreshToken: '/api/v1/auth/refresh',
    forgotPassword: '/api/v1/auth/password/forgot',
    resetPassword: '/api/v1/auth/password/reset',
    verifyEmail: '/api/v1/auth/email/verify',
    verifyPhone: '/api/v1/auth/phone/verify',
    twoFactorSetup: '/api/v1/auth/2fa/setup',
    twoFactorVerify: '/api/v1/auth/2fa/verify',
  },
  user: {
    profile: '/api/v1/users/me',
    updateProfile: '/api/v1/users/me',
    addresses: '/api/v1/users/me/addresses',
    preferences: '/api/v1/users/me/preferences',
    deleteAccount: '/api/v1/users/me/delete',
  },
  orders: {
    list: '/api/v1/orders',
    get: '/api/v1/orders/:id',
    create: '/api/v1/orders',
    cancel: '/api/v1/orders/:id/cancel',
  },
  payments: {
    methods: '/api/v1/payment-methods',
    add: '/api/v1/payment-methods',
    remove: '/api/v1/payment-methods/:id',
    setDefault: '/api/v1/payment-methods/:id/default',
  },
  wishlist: {
    list: '/api/v1/wishlist',
    add: '/api/v1/wishlist',
    remove: '/api/v1/wishlist/:productId',
    moveToCart: '/api/v1/wishlist/:productId/cart',
  },
};

export const formValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: false,
  },
  phone: {
    required: false,
    pattern: /^\+?[1-9]\d{1,14}$/,
  },
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
  address: {
    line1: { required: true, maxLength: 200 },
    line2: { required: false, maxLength: 200 },
    city: { required: true, maxLength: 100 },
    state: { required: true, maxLength: 100 },
    postalCode: { required: true, maxLength: 20 },
    country: { required: true, minLength: 2, maxLength: 2 },
  },
};
